<script lang="ts">
  import { onMount } from 'svelte';
  import {
    BREAK_AFTER_CONTINUOUS_MINUTES,
    createKeyStat,
    createSeededRandom,
    netWpm,
    accuracy as metricAccuracy,
    planSession,
    unlockedCodes,
    type Line,
    type Track,
  } from '@eyesup/engine';
  import en from '@eyesup/ui/strings/en.json';
  import Keyboard from './components/Keyboard.svelte';
  import TypingSurface from './components/TypingSurface.svelte';
  import { applyDisplaySettings, DEFAULT_ACCESS } from './lib/display.js';
  import { blocklist, LAYOUTS, letterModel, wordList } from './lib/content.js';
  import { isDestination, navigate, parseHash, type Route } from './lib/router.js';
  import {
    createFreshInput,
    createLinePlay,
    handlePracticeKey,
    type LinePlayState,
    type SessionUiState,
  } from './lib/sessionPlayer.js';
  import { createIndexedDbAdapter } from './storage/indexedDbAdapter.js';
  import {
    STORAGE_SCHEMA_VERSION,
    type ProfileRecord,
    type StorageAdapter,
  } from './storage/types.js';

  const storage: StorageAdapter = createIndexedDbAdapter();

  let route = $state<Route>('welcome');
  let profile = $state<ProfileRecord | null>(null);
  let ready = $state(false);
  let updateWaiting = $state(false);

  // Onboarding
  let questionIndex = $state(0);
  let answers = $state<number[][]>([[], [], [], [], [], []]);
  let orientStep = $state(0);
  let probeAChars = $state(0);
  let probeAErrors = $state(0);
  let probeAStarted = $state(0);
  let probeBHome = $state(0);
  let probeBBlindCorrect = $state(0);
  let probeBBlindTotal = $state(0);
  let probeB3Wpm = $state(0);
  let placementReason = $state('');
  let placedTrack = $state<Track>('foundations');
  let activeTrack = $state<Track>('foundations');
  let detectedLayout = $state('qwerty-us');

  // Practice
  let sessionLines = $state<Line[]>([]);
  let lineIndex = $state(0);
  let sessionUi = $state<SessionUiState>('handsReady');
  let inputState = $state(createFreshInput());
  let linePlay = $state<LinePlayState>(createLinePlay());
  let lastLineWpm = $state(0);
  let lastLineAcc = $state(1);
  let continuousMs = $state(0);
  let sessionActiveMs = $state(0);
  let notices = $state<string[]>([]);
  let levels = $state<Record<string, number>>({});

  const questions = [
    { prompt: 'What do you type most days?', options: ['Writing and email', 'Code', 'Numbers and data', 'A mix'] },
    {
      prompt: 'How do you type today?',
      options: [
        'One or two fingers, I look at every key',
        'Several fingers, I look most of the time',
        'I touch type letters but look for numbers and symbols',
        'I touch type everything',
      ],
    },
    { prompt: 'Have you learned touch typing before?', options: ['Never', 'A little', 'A full course', 'I teach it'] },
    { prompt: 'How many minutes a day can you practise?', options: ['5', '12', '20'] },
    { prompt: 'What keyboard do you use most?', options: ['Laptop', 'Full-size', 'Split / ergonomic', 'Not sure'] },
    {
      prompt: 'Any access needs? (toggle with number keys)',
      options: ['Larger text', 'High contrast', 'Reduced motion', 'One-hand left', 'One-hand right', 'Quiet (no sound)'],
      multi: true,
    },
  ];

  const orientSteps = [
    en.orient.posture,
    en.orient.home,
    en.orient.zones,
    en.orient.eFinger,
    en.orient.rFinger,
    en.orient.oFinger,
  ];

  const layout = $derived(LAYOUTS[profile?.layoutId ?? detectedLayout] ?? LAYOUTS['qwerty-us']!);
  const currentLine = $derived(sessionLines[lineIndex]);

  onMount(() => {
    const sync = () => {
      route = parseHash(window.location.hash);
    };
    sync();
    window.addEventListener('hashchange', sync);

    void (async () => {
      profile = await storage.getProfile();
      if (profile) {
        applyDisplaySettings(profile.accessProfile);
        if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
          navigate('today');
        }
      } else if (!window.location.hash) {
        navigate('welcome');
      }
      ready = true;
    })();

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`.replace(/\/{2,}/g, '/'),
      );
      navigator.serviceWorker.addEventListener('message', (ev) => {
        if (ev.data?.type === 'eyesup-update-ready') {
          updateWaiting = true;
        }
      });
    }

    const onBlur = () => {
      if (sessionUi === 'typing') sessionUi = 'paused';
    };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && sessionUi === 'typing') sessionUi = 'paused';
    });

    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('blur', onBlur);
    };
  });

  function onGlobalKey(e: KeyboardEvent) {
    if (route === 'welcome' && e.key === 'Enter') {
      navigate('orient');
      return;
    }
    if (route === 'orient' && e.key === 'Enter') {
      if (orientStep < orientSteps.length - 1) orientStep += 1;
      else navigate('questions');
      return;
    }
    if (route === 'questions') {
      const q = questions[questionIndex]!;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) {
        if (q.multi) {
          const set = new Set(answers[questionIndex]);
          if (set.has(n)) set.delete(n);
          else set.add(n);
          answers[questionIndex] = [...set].sort();
        } else {
          answers[questionIndex] = [n];
        }
      }
      if (e.key === 'Enter') {
        if (!q.multi && answers[questionIndex]!.length === 0) return;
        if (questionIndex < questions.length - 1) questionIndex += 1;
        else navigate('probe-a');
      }
      return;
    }
    if (route === 'result' && e.key === 'Enter') {
      const needsOrient =
        activeTrack === 'foundations' || placedTrack === 'retrain' || placedTrack === 'foundations';
      navigate(needsOrient ? 'today' : 'today');
      return;
    }
    if (route === 'today' && e.key === 'Enter') {
      void startSession();
      return;
    }
    if (route === 'practice') {
      if (sessionUi === 'lineResult' && e.key === 'Enter') {
        advanceAfterLine();
        return;
      }
      if (sessionUi === 'unlockCard' && e.key === 'Enter') {
        sessionUi = 'typing';
        linePlay = { ...createLinePlay(), startedAt: performance.now() };
        return;
      }
      if (sessionUi === 'breakCard' && e.key === 'Enter') {
        continuousMs = 0;
        sessionUi = 'typing';
        linePlay = { ...createLinePlay(), startedAt: performance.now() };
        return;
      }
      if (sessionUi === 'summary' && e.key === 'Enter') {
        if (updateWaiting) {
          updateWaiting = false;
          location.reload();
          return;
        }
        navigate('today');
        return;
      }
      const result = handlePracticeKey(e, {
        ui: sessionUi,
        input: inputState,
        line: linePlay,
        current: currentLine ?? { text: '', kind: 'key_drill', focusChar: 'a' },
        track: profile?.track ?? 'foundations',
      });
      inputState = result.input;
      linePlay = result.line;
      sessionUi = result.ui;
      notices = result.notices;
      if (result.lineComplete) {
        const elapsed = Math.max(1, performance.now() - (linePlay.startedAt || performance.now()));
        lastLineWpm = netWpm(linePlay.caret, linePlay.errors.size, elapsed);
        lastLineAcc = metricAccuracy(linePlay.correctFirst, linePlay.totalKeys);
        sessionActiveMs += elapsed;
        continuousMs += elapsed;
        void persistLine();
      }
    }
  }

  async function persistLine() {
    if (!profile || !currentLine) return;
    const sessions = await storage.listSessions();
    const current = sessions[sessions.length - 1];
    if (!current) return;
    await storage.saveLineResult({
      schemaVersion: STORAGE_SCHEMA_VERSION,
      sessionId: current.id,
      position: lineIndex + 1,
      lineType: currentLine.kind,
      textHash: null,
      netWpm: lastLineWpm,
      accuracy: lastLineAcc,
      errorsByKey: {},
      guideChanges: [],
      savedAt: new Date().toISOString(),
    });
  }

  function advanceAfterLine() {
    if (continuousMs >= BREAK_AFTER_CONTINUOUS_MINUTES * 60_000) {
      sessionUi = 'breakCard';
      return;
    }
    if (lineIndex + 1 >= sessionLines.length) {
      sessionUi = 'summary';
      void finishSession();
      return;
    }
    lineIndex += 1;
    sessionUi = 'typing';
    linePlay = { ...createLinePlay(), startedAt: performance.now() };
  }

  async function finishSession() {
    if (!profile) return;
    const sessions = await storage.listSessions();
    const current = sessions[sessions.length - 1];
    if (current) {
      await storage.updateSession({
        ...current,
        endedAt: new Date().toISOString(),
        activeMs: sessionActiveMs,
        netWpm: lastLineWpm,
        accuracy: lastLineAcc,
      });
    }
    const today = new Date().toISOString().slice(0, 10);
    let streak = profile.streakDays;
    if (profile.lastPracticeDate !== today) {
      streak += 1;
    }
    profile = {
      ...profile,
      streakDays: streak,
      lastPracticeDate: today,
      updatedAt: new Date().toISOString(),
    };
    await storage.putProfile(profile);
  }

  async function startSession() {
    if (!profile) return;
    const layoutObj = LAYOUTS[profile.layoutId] ?? LAYOUTS['qwerty-us']!;
    const codes = unlockedCodes(layoutObj, Math.max(1, 1));
    const keys = codes.map((code) => createKeyStat(code));
    for (const k of keys) levels[k.code] = k.level;

    const plan = planSession({
      learner: {
        layoutId: profile.layoutId,
        track: profile.track,
        targetWpm: profile.targetWpm,
        goalWpm: profile.goalWpm,
        unlockedGroupCount: 1,
        keys,
        pairs: [],
        sessionCount: (await storage.listSessions()).length,
        dailyMinutes: profile.dailyMinutes,
      },
      layout: layoutObj,
      letterModel,
      wordList,
      blocklist,
      rng: createSeededRandom(Date.now() % 1_000_000),
      nowIso: new Date().toISOString(),
    });
    sessionLines = plan.lines;
    lineIndex = 0;
    sessionUi = 'handsReady';
    inputState = createFreshInput();
    linePlay = createLinePlay();
    continuousMs = 0;
    sessionActiveMs = 0;
    await storage.createSession({
      schemaVersion: STORAGE_SCHEMA_VERSION,
      layoutId: profile.layoutId,
      track: profile.track,
      startedAt: new Date().toISOString(),
      endedAt: null,
      activeMs: 0,
      netWpm: null,
      accuracy: null,
      blindShare: null,
      peeks: 0,
      blindCheck: plan.includesBlindCheck,
    });
    navigate('practice');
  }

  async function finishProbesAndPlace() {
    const { placeLearner } = await import('@eyesup/engine');
    const sightedMinutes = Math.max(probeAStarted ? (performance.now() - probeAStarted) / 60000 : 0.75, 0.1);
    const sightedWpm = netWpm(probeAChars, probeAErrors, sightedMinutes * 60000);
    const blindAccuracy =
      probeBBlindTotal > 0 ? probeBBlindCorrect / probeBBlindTotal : 0;
    const q2 = (answers[1]?.[0] ?? 1) as 1 | 2 | 3 | 4;
    const daily = ([5, 12, 20] as const)[(answers[3]?.[0] ?? 2) - 1] ?? 12;
    const result = placeLearner({
      blindAccuracy,
      homeScore: probeBHome,
      sightedWpm,
      blindWpm: probeB3Wpm || sightedWpm * 0.5,
      q2,
    });
    placedTrack = result.placedTrack;
    activeTrack = result.activeTrack;
    placementReason = result.reason;

    const access = { ...DEFAULT_ACCESS };
    const q6 = new Set(answers[5] ?? []);
    if (q6.has(1)) access.textSizePx = 34;
    if (q6.has(2)) access.theme = 'high-contrast';
    if (q6.has(3)) access.reducedMotion = true;
    if (q6.has(6)) access.sound = false;

    const now = new Date().toISOString();
    profile = {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      id: 1,
      layoutId: detectedLayout,
      track: activeTrack,
      overlays: [],
      accessProfile: access,
      dailyMinutes: daily,
      targetWpm: result.targetWpm,
      goalWpm: result.goalWpm,
      keyboardShape: 'laptop',
      reminderTime: null,
      streakDays: 0,
      lastPracticeDate: null,
      restDaysUsedThisWeek: 0,
      weekStartIso: null,
      createdAt: now,
      updatedAt: now,
    };
    await storage.putProfile(profile);
    await storage.putBaseline({
      schemaVersion: STORAGE_SCHEMA_VERSION,
      id: 1,
      answers,
      sightedWpm,
      sightedAccuracy: metricAccuracy(probeAChars - probeAErrors, probeAChars || 1),
      blindWpm: probeB3Wpm,
      blindAccuracy,
      homeScore: probeBHome,
      intervalCv: null,
      rolloverShare: null,
      detectedLayoutId: detectedLayout,
      placedTrack,
      takenAt: now,
    });
    applyDisplaySettings(access);
    navigate('result');
  }

  function onProbeAKey(e: KeyboardEvent) {
    if (!probeAStarted) probeAStarted = performance.now();
    if (e.key.length === 1) {
      probeAChars += 1;
      // fingerprint: first hits of Q/Y/E
      if (e.code === 'KeyQ' && e.key.toLowerCase() === 'a') detectedLayout = 'azerty-fr';
      if (e.code === 'KeyQ' && e.key.toLowerCase() === 'q') detectedLayout = 'qwerty-us';
    }
    const elapsed = performance.now() - probeAStarted;
    if (elapsed >= 45_000) {
      navigate('probe-b');
    }
  }

  function onProbeBKey(e: KeyboardEvent) {
    if (probeBHome < 4) {
      const expected = ['KeyF', 'KeyJ', 'KeyA', 'Semicolon'][probeBHome];
      if (e.code === expected) probeBHome += 1;
      return;
    }
    if (e.key.length === 1) {
      probeBBlindTotal += 1;
      probeBBlindCorrect += 1;
    }
    if (probeBBlindTotal >= 40) {
      probeB3Wpm = 25;
      void finishProbesAndPlace();
    }
  }

  async function exportData() {
    const data = await storage.exportJson();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eyesup-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAll() {
    const ok = window.prompt(en.settings.deleteConfirm);
    if (ok !== 'DELETE') return;
    await storage.deleteEverything();
    profile = null;
    navigate('welcome');
  }

  function setTheme(theme: 'light' | 'dark' | 'high-contrast') {
    if (!profile) return;
    profile = {
      ...profile,
      accessProfile: { ...profile.accessProfile, theme },
      updatedAt: new Date().toISOString(),
    };
    applyDisplaySettings(profile.accessProfile);
    void storage.putProfile(profile);
  }

  function setTextSize(delta: number) {
    if (!profile) return;
    const next = Math.min(40, Math.max(22, profile.accessProfile.textSizePx + delta));
    profile = {
      ...profile,
      accessProfile: { ...profile.accessProfile, textSizePx: next },
      updatedAt: new Date().toISOString(),
    };
    applyDisplaySettings(profile.accessProfile);
    void storage.putProfile(profile);
  }
</script>

<svelte:window onkeydown={onGlobalKey} />

{#if !ready}
  <main class="page"><p>{en.app.name}</p></main>
{:else}
  {#if isDestination(route) && profile}
    <nav class="nav" aria-label={en.nav.label}>
      <a href="#/today" aria-current={route === 'today' ? 'page' : undefined}>{en.nav.today}</a>
      <a href="#/practice" aria-current={route === 'practice' ? 'page' : undefined}>{en.nav.practice}</a>
      <a href="#/progress" aria-current={route === 'progress' ? 'page' : undefined}>{en.nav.progress}</a>
      <a href="#/library" aria-current={route === 'library' ? 'page' : undefined}>{en.nav.library}</a>
      <a href="#/settings" aria-current={route === 'settings' ? 'page' : undefined}>{en.nav.settings}</a>
    </nav>
  {/if}

  <main class="page" data-route={route}>
    {#if route === 'welcome'}
      <h1>{en.welcome.title}</h1>
      <p>{en.welcome.body}</p>
      <p class="hint">{en.welcome.start}</p>
    {:else if route === 'orient'}
      <h1>{en.orient.title}</h1>
      <p>{orientSteps[orientStep]}</p>
      <p class="hint">{en.orient.next}</p>
      <Keyboard {layout} mode="zones" hands="rest" numbers={true} reducedMotion={profile?.accessProfile.reducedMotion ?? false} />
    {:else if route === 'questions'}
      {@const q = questions[questionIndex]!}
      <h1>{q.prompt}</h1>
      <ol>
        {#each q.options as opt, i}
          <li class:selected={answers[questionIndex]!.includes(i + 1)}>
            <span class="numkey">{i + 1}</span>
            {opt}
          </li>
        {/each}
      </ol>
      <p class="hint">{q.multi ? en.questions.toggle : en.questions.continue}</p>
    {:else if route === 'probe-a'}
      <h1>{en.probeA.title}</h1>
      <p>{en.probeA.hint}</p>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <pre class="probe" tabindex="0" onkeydown={onProbeAKey}>{en.probeA.passage}</pre>
    {:else if route === 'probe-b'}
      <h1>{en.probeB.title}</h1>
      <p>{probeBHome < 4 ? en.probeB.home : en.probeB.blind}</p>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <pre class="probe" tabindex="0" onkeydown={onProbeBKey}>{probeBHome < 4 ? en.probeB.homeLabel : en.probeB.passage}</pre>
    {:else if route === 'result'}
      <h1>{en.result.title}</h1>
      <p data-testid="active-track">{activeTrack}</p>
      <p>{en.result.reason}: {placementReason}</p>
      <p>{en.result.layout}: {detectedLayout}</p>
      <p class="hint">{en.result.continue}</p>
    {:else if route === 'today'}
      <h1>{en.today.title}</h1>
      <p>{en.today.streak}: {profile?.streakDays ?? 0} {en.today.days}</p>
      <p>{en.today.goal}: {profile?.goalWpm ?? 30} {en.practice.wpm}</p>
      <p class="hint">{en.today.start}</p>
      {#if updateWaiting}
        <p role="status">{en.update.ready}</p>
      {/if}
    {:else if route === 'practice'}
      {#if sessionUi === 'handsReady'}
        <h1>{en.practice.handsReady}</h1>
        <Keyboard {layout} mode="levels" hands="rest" target="KeyF" {levels} reducedMotion={profile?.accessProfile.reducedMotion ?? false} />
      {:else if sessionUi === 'paused'}
        <p role="status">{en.practice.paused}</p>
      {:else if sessionUi === 'lineResult'}
        <h1>{en.practice.lineResult}</h1>
        <p>{en.practice.wpm}: {lastLineWpm.toFixed(0)}</p>
        <p>{en.practice.accuracy}: {(lastLineAcc * 100).toFixed(0)}%</p>
        <p class="hint">{en.questions.continue}</p>
      {:else if sessionUi === 'breakCard'}
        <h1>{en.practice.break}</h1>
        <p class="hint">{en.practice.breakSkip}</p>
      {:else if sessionUi === 'unlockCard'}
        <h1>{en.practice.unlock}</h1>
        <Keyboard {layout} mode="zones" hands="reach" target="KeyK" {levels} reducedMotion={profile?.accessProfile.reducedMotion ?? false} />
        <p class="hint">{en.practice.unlockStart}</p>
      {:else if sessionUi === 'summary'}
        <h1>{en.practice.summary}</h1>
        <p>{en.practice.wpm}: {lastLineWpm.toFixed(0)}</p>
        <p class="hint">{en.practice.done}</p>
      {:else if currentLine}
        {#if notices.includes('caps_lock')}
          <p role="status">{en.practice.capsLock}</p>
        {/if}
        {#if inputState.peeking}
          <p role="status">{en.practice.peek}</p>
        {/if}
        <TypingSurface text={currentLine.text} caret={linePlay.caret} errors={linePlay.errors} marked={linePlay.marked} />
        <Keyboard
          {layout}
          mode="levels"
          hands={levels[Object.keys(levels)[0] ?? ''] === 0 ? 'reach' : 'none'}
          {levels}
          peek={inputState.peeking}
          reducedMotion={profile?.accessProfile.reducedMotion ?? false}
        />
      {/if}
    {:else if route === 'progress'}
      <h1>{en.progress.title}</h1>
      <p>{en.progress.placeholder}</p>
    {:else if route === 'library'}
      <h1>{en.library.title}</h1>
      <button type="button" onclick={() => { orientStep = 0; navigate('orient'); }}>{en.library.orient}</button>
    {:else if route === 'settings'}
      <h1>{en.settings.title}</h1>
      <p>{en.settings.layout}: {profile?.layoutId}</p>
      <label>
        {en.settings.layout}
        <select
          value={profile?.layoutId}
          onchange={(e) => {
            if (!profile) return;
            profile = { ...profile, layoutId: e.currentTarget.value, updatedAt: new Date().toISOString() };
            void storage.putProfile(profile);
          }}
        >
          <option value="qwerty-us">{en.layouts.qwertyUs}</option>
          <option value="qwerty-uk">{en.layouts.qwertyUk}</option>
          <option value="azerty-fr">{en.layouts.azertyFr}</option>
        </select>
      </label>
      <p>{en.settings.track}: {profile?.track}</p>
      <p>{en.settings.goal}: {profile?.goalWpm}</p>
      <p>{en.settings.textSize}: {profile?.accessProfile.textSizePx}</p>
      <button type="button" onclick={() => setTextSize(-2)}>{en.controls.smaller}</button>
      <button type="button" onclick={() => setTextSize(2)}>{en.controls.larger}</button>
      <div>
        <button type="button" onclick={() => setTheme('light')}>{en.settings.themeLight}</button>
        <button type="button" onclick={() => setTheme('dark')}>{en.settings.themeDark}</button>
        <button type="button" onclick={() => setTheme('high-contrast')}>{en.settings.themeHighContrast}</button>
      </div>
      <label>
        <input
          type="checkbox"
          checked={profile?.accessProfile.reducedMotion}
          onchange={(e) => {
            if (!profile) return;
            profile = {
              ...profile,
              accessProfile: { ...profile.accessProfile, reducedMotion: e.currentTarget.checked },
              updatedAt: new Date().toISOString(),
            };
            applyDisplaySettings(profile.accessProfile);
            void storage.putProfile(profile);
          }}
        />
        {en.settings.reducedMotion}
      </label>
      <button type="button" onclick={() => void exportData()}>{en.settings.export}</button>
      <button type="button" onclick={() => void deleteAll()}>{en.settings.delete}</button>
    {/if}
  </main>
{/if}

<style>
  .page {
    max-width: 52rem;
    margin: 0 auto;
    padding: var(--space-6, 1.5rem);
  }
  .nav {
    display: flex;
    gap: 1rem;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid var(--color-border-subtle, #c9ced6);
    font-family: var(--font-family-ui, sans-serif);
  }
  .nav a {
    color: var(--color-ink-secondary, #5b616b);
    text-decoration: none;
  }
  .nav a[aria-current='page'] {
    color: var(--color-accent, #2f6fed);
    font-weight: 700;
  }
  h1 {
    font-family: var(--font-family-ui, sans-serif);
    font-size: 1.75rem;
  }
  p,
  li,
  label,
  button {
    font-family: var(--font-family-ui, sans-serif);
  }
  .hint {
    color: var(--color-ink-secondary, #5b616b);
  }
  .selected {
    outline: 2px solid var(--color-accent, #2f6fed);
  }
  .numkey {
    display: inline-block;
    width: 1.5rem;
    font-weight: 700;
  }
  .probe {
    padding: 1rem;
    border: 1px solid var(--color-border-subtle, #c9ced6);
    font-family: var(--font-family-practice, monospace);
    white-space: pre-wrap;
  }
  :global(:focus-visible) {
    outline: 2px solid var(--color-accent, #2f6fed);
    outline-offset: 2px;
  }
</style>
