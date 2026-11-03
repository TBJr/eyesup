<script lang="ts">
  import { onMount } from 'svelte';
  import {
    BREAK_AFTER_CONTINUOUS_MINUTES,
    canStartCommitWeek,
    commitWeekComplete,
    createSeededRandom,
    generateLine,
    keyConfidence,
    netWpm,
    accuracy as metricAccuracy,
    planSession,
    unlockedTypingChars,
    type GuideLevel,
    type Line,
    type Track,
  } from '@eyesup/engine';
  import en from '@eyesup/ui/strings/en.json';
  import fr from '@eyesup/ui/strings/fr.json';
  import Keyboard from './components/Keyboard.svelte';
  import TypingSurface from './components/TypingSurface.svelte';
  import { applyDisplaySettings, DEFAULT_ACCESS } from './lib/display.js';
  import { getContentPackForLayout, LAYOUTS } from './lib/content.js';
  import {
    buildSessionKeysAndPairs,
    bumpKeyStatAfterLine,
    unlockedGroupCountForTrack,
  } from './lib/learnerFromStorage.js';
  import {
    TRACK_OPTIONS,
    crossoverFromBaseline,
    fillTemplate,
    goalWpmOptions,
    recentSessions,
    splitOwnTextToLines,
  } from './lib/progress.js';
  import {
    isDestination,
    isTouchFirstDevice,
    navigate,
    parseHash,
    type Route,
  } from './lib/router.js';
  import {
    createFreshInput,
    createLinePlay,
    handlePracticeKey,
    type LinePlayState,
    type SessionUiState,
  } from './lib/sessionPlayer.js';
  import { ensureMilestone, MILESTONE } from './lib/milestones.js';
  import {
    applyDesktopUpdate,
    startDesktopUpdateWatcher,
  } from './lib/desktopUpdate.js';
  import { createStorageAdapter } from './storage/createStorageAdapter.js';
  import { detectIsTauri, invokeCmd } from './storage/tauriBridge.js';
  import {
    STORAGE_SCHEMA_VERSION,
    type BaselineRecord,
    type EyesUpExport,
    type KeyStatRecord,
    type MilestoneRecord,
    type OwnTextRecord,
    type ProfileRecord,
    type SessionRecord,
    type StorageAdapter,
  } from './storage/types.js';

  const storage: StorageAdapter = createStorageAdapter();
  const isDesktop = detectIsTauri();
  const GOAL_OPTIONS = goalWpmOptions(15, 80);

  let route = $state<Route>('welcome');
  let profile = $state<ProfileRecord | null>(null);
  let baseline = $state<BaselineRecord | null>(null);
  let ready = $state(false);
  let updateWaiting = $state(false);
  /** Where the pending update came from — SW reload vs desktop apply_update. */
  let updateSource = $state<'sw' | 'desktop' | null>(null);
  let desktopFullscreen = $state(false);
  let desktopImportError = $state('');
  let desktopImportBusy = $state(false);
  let deviceBanner = $state(false);

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
  let timedTestMode = $state(false);
  let timedTestEndsAt = $state(0);
  let sessionKeyRecords = $state<KeyStatRecord[]>([]);

  // Progress / library / today
  let progressKeys = $state<KeyStatRecord[]>([]);
  let progressSessions = $state<SessionRecord[]>([]);
  let progressMilestones = $state<MilestoneRecord[]>([]);
  let ownTexts = $state<OwnTextRecord[]>([]);
  let ownTitle = $state('');
  let ownBody = $state('');
  let crossover = $state<ReturnType<typeof crossoverFromBaseline>>(null);
  let commitEligible = $state(false);

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

  const layout = $derived(LAYOUTS[profile?.layoutId ?? detectedLayout] ?? LAYOUTS['qwerty-us']!);
  const t = $derived(layout.language === 'fr' ? fr : en);
  const orientSteps = $derived([
    t.orient.posture,
    t.orient.home,
    t.orient.zones,
    t.orient.eFinger,
    t.orient.rFinger,
    t.orient.oFinger,
  ]);
  const currentLine = $derived(sessionLines[lineIndex]);
  const historySessions = $derived([...recentSessions(progressSessions, 10)].reverse());

  $effect(() => {
    if (!ready || !profile) return;
    if (route === 'progress' || route === 'today') {
      void loadProgressData();
    }
    if (route === 'library') {
      void loadOwnTexts();
    }
    if (route === 'settings') {
      void (async () => {
        baseline = await storage.getBaseline();
      })();
    }
  });

  onMount(() => {
    const sync = () => {
      route = parseHash(window.location.hash);
    };
    sync();
    window.addEventListener('hashchange', sync);

    void (async () => {
      profile = await storage.getProfile();
      baseline = await storage.getBaseline();
      if (isTouchFirstDevice()) {
        deviceBanner = true;
        if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
          navigate('device');
          ready = true;
          return;
        }
      }
      if (profile) {
        applyDisplaySettings(profile.accessProfile);
        if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
          navigate('today');
        }
      } else if (isDesktop) {
        navigate('desktop-import');
      } else if (!window.location.hash) {
        navigate('welcome');
      }
      ready = true;
    })();

    if ('serviceWorker' in navigator && !isDesktop) {
      void navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`.replace(/\/{2,}/g, '/'),
      );
      navigator.serviceWorker.addEventListener('message', (ev) => {
        if (ev.data?.type === 'eyesup-update-ready') {
          updateWaiting = true;
          updateSource = 'sw';
        }
      });
    }

    const stopDesktopUpdate = startDesktopUpdateWatcher(() => {
      updateWaiting = true;
      updateSource = 'desktop';
    });

    const onBlur = () => {
      if (sessionUi === 'typing') sessionUi = 'paused';
    };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && sessionUi === 'typing') sessionUi = 'paused';
    });

    return () => {
      stopDesktopUpdate();
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('blur', onBlur);
    };
  });

  /** True while a practice session is mid-flow (never apply updates here). */
  function inPracticeSession(): boolean {
    return (
      route === 'practice' &&
      sessionUi !== 'summary' &&
      sessionUi !== 'handsReady'
    );
  }

  async function installWaitingUpdate() {
    if (updateSource === 'desktop') {
      try {
        await applyDesktopUpdate();
      } catch {
        // Stub returns until signing secrets exist; clear the banner.
        updateWaiting = false;
        updateSource = null;
      }
      return;
    }
    updateWaiting = false;
    updateSource = null;
    location.reload();
  }

  function dismissWaitingUpdate() {
    updateWaiting = false;
    updateSource = null;
  }

  async function skipDesktopImport() {
    desktopImportError = '';
    navigate('welcome');
  }

  async function onDesktopImportFile(ev: Event) {
    const input = ev.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    desktopImportBusy = true;
    desktopImportError = '';
    try {
      const text = await file.text();
      const data = JSON.parse(text) as EyesUpExport;
      if (!data || typeof data !== 'object' || data.schemaVersion == null) {
        throw new Error('invalid');
      }
      await storage.importJson(data);
      profile = await storage.getProfile();
      baseline = await storage.getBaseline();
      if (profile) applyDisplaySettings(profile.accessProfile);
      navigate(profile ? 'today' : 'welcome');
    } catch {
      desktopImportError = t.desktop.importError;
    } finally {
      desktopImportBusy = false;
    }
  }

  async function toggleDesktopFullscreen() {
    if (!isDesktop) return;
    const next = !desktopFullscreen;
    try {
      await invokeCmd('set_fullscreen', { fullscreen: next });
      desktopFullscreen = next;
    } catch {
      // Native command unavailable outside a built shell.
    }
  }

  async function loadProgressData() {
    if (!profile) return;
    const [keys, sessions, milestones, base] = await Promise.all([
      storage.getKeyStats(profile.layoutId),
      storage.listSessions(),
      storage.listMilestones(),
      storage.getBaseline(),
    ]);
    progressKeys = keys;
    progressSessions = sessions;
    progressMilestones = milestones;
    baseline = base;
    crossover = crossoverFromBaseline(base, sessions);

    const layoutObj = LAYOUTS[profile.layoutId] ?? LAYOUTS['qwerty-us']!;
    const unlocked = unlockedGroupCountForTrack(layoutObj, keys, profile.track);
    const allLetters = unlocked >= layoutObj.learnOrder.length;
    const blindWpms = sessions
      .filter((s) => s.blindCheck && s.netWpm != null)
      .map((s) => s.netWpm!);
    const latestBlind = blindWpms.length > 0 ? blindWpms[blindWpms.length - 1]! : 0;
    commitEligible = canStartCommitWeek({
      allLettersUnlocked: allLetters,
      blindWpm: latestBlind,
    });
  }

  async function loadOwnTexts() {
    ownTexts = await storage.listOwnTexts();
  }

  function onGlobalKey(e: KeyboardEvent) {
    if (route === 'device') return;
    if (route === 'desktop-import' && e.key === 'Enter') {
      void skipDesktopImport();
      return;
    }
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
    if (route === 'result') {
      const n = Number(e.key);
      if (n >= 1 && n <= TRACK_OPTIONS.length) {
        activeTrack = TRACK_OPTIONS[n - 1]!;
        if (profile) {
          profile = { ...profile, track: activeTrack, updatedAt: new Date().toISOString() };
          void storage.putProfile(profile);
        }
        return;
      }
      if (e.key === 'Enter') {
        void continueFromResult();
      }
      return;
    }
    if (route === 'today' && e.key === 'Enter') {
      if (updateWaiting && !inPracticeSession()) {
        void installWaitingUpdate();
        return;
      }
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
        maybeArmTimedTest();
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
          void installWaitingUpdate();
          return;
        }
        timedTestMode = false;
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

      if (result.ui === 'typing' && timedTestMode && timedTestEndsAt === 0) {
        maybeArmTimedTest();
      }
      if (
        timedTestMode &&
        timedTestEndsAt > 0 &&
        sessionUi === 'typing' &&
        performance.now() >= timedTestEndsAt
      ) {
        endTimedTestEarly();
        return;
      }

      if (result.lineComplete) {
        const elapsed = Math.max(1, performance.now() - (linePlay.startedAt || performance.now()));
        lastLineWpm = netWpm(linePlay.caret, linePlay.errors.size, elapsed);
        lastLineAcc = metricAccuracy(linePlay.correctFirst, linePlay.totalKeys);
        sessionActiveMs += elapsed;
        continuousMs += elapsed;
        void persistLine();
        void bumpKeysForCurrentLine();
      }
    }
  }

  function maybeArmTimedTest() {
    if (timedTestMode && timedTestEndsAt === 0) {
      timedTestEndsAt = performance.now() + 60_000;
    }
  }

  function endTimedTestEarly() {
    const elapsed = Math.max(1, performance.now() - (linePlay.startedAt || performance.now()));
    lastLineWpm = netWpm(linePlay.caret, linePlay.errors.size, elapsed);
    lastLineAcc = metricAccuracy(linePlay.correctFirst, Math.max(1, linePlay.totalKeys));
    sessionActiveMs += elapsed;
    sessionUi = 'summary';
    void finishSession();
  }

  async function continueFromResult() {
    if (profile) {
      profile = {
        ...profile,
        track: activeTrack,
        placedTrack,
        updatedAt: new Date().toISOString(),
      };
      await storage.putProfile(profile);
    }
    navigate('today');
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
    if (currentLine.kind === 'blind_check') {
      await ensureMilestone(storage, MILESTONE.firstBlindLine, { sessionId: current.id });
      if (lastLineWpm >= 30) {
        await ensureMilestone(storage, MILESTONE.first30WpmBlind, {
          sessionId: current.id,
          netWpm: Math.round(lastLineWpm),
        });
      }
    }
  }

  async function bumpKeysForCurrentLine() {
    if (!profile || !currentLine) return;
    const layoutObj = LAYOUTS[profile.layoutId] ?? LAYOUTS['qwerty-us']!;
    const nowIso = new Date().toISOString();
    const counts = new Map<string, number>();
    for (const ch of currentLine.text) {
      if (ch === ' ') continue;
      const lower = ch.toLowerCase();
      const code =
        layoutObj.keys.find(
          (k) => k.base?.toLowerCase() === lower || k.shift?.toLowerCase() === lower,
        )?.code;
      if (!code) continue;
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    const byCode = new Map(sessionKeyRecords.map((k) => [k.code, k]));
    for (const [code, n] of counts) {
      const next = bumpKeyStatAfterLine(byCode.get(code), profile.layoutId, code, nowIso, n);
      byCode.set(code, next);
      await storage.putKeyStat(next);
    }
    sessionKeyRecords = [...byCode.values()];
  }

  function advanceAfterLine() {
    if (continuousMs >= BREAK_AFTER_CONTINUOUS_MINUTES * 60_000) {
      sessionUi = 'breakCard';
      return;
    }
    if (timedTestMode || lineIndex + 1 >= sessionLines.length) {
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
    // Persist key levels / presses snapshot after summary
    for (const rec of sessionKeyRecords) {
      const level = levels[rec.code];
      if (level != null && level !== rec.guideLevel) {
        await storage.putKeyStat({ ...rec, guideLevel: level as GuideLevel });
      } else {
        await storage.putKeyStat(rec);
      }
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

    const layoutObj = LAYOUTS[profile.layoutId] ?? LAYOUTS['qwerty-us']!;
    const keyRecords = await storage.getKeyStats(profile.layoutId);
    const letterCodes = layoutObj.keys
      .filter((k) => k.base && /^[a-z]$/i.test(k.base) && k.learn !== false)
      .map((k) => k.code);
    if (
      letterCodes.length > 0 &&
      letterCodes.every((code) => keyRecords.some((k) => k.code === code && k.unlockedAt))
    ) {
      await ensureMilestone(storage, MILESTONE.allLettersUnlocked, {
        layoutId: profile.layoutId,
      });
    }

    const base = await storage.getBaseline();
    const allSessions = await storage.listSessions();
    const cx = crossoverFromBaseline(base, allSessions);
    if (cx?.crossed) {
      await ensureMilestone(storage, MILESTONE.crossoverReached, {
        gap: Math.round(cx.gap * 10) / 10,
      });
    }
  }

  async function startSession() {
    if (!profile) return;
    timedTestMode = false;
    timedTestEndsAt = 0;
    const layoutObj = LAYOUTS[profile.layoutId] ?? LAYOUTS['qwerty-us']!;
    const keyRecords = await storage.getKeyStats(profile.layoutId);
    const pairRecords = await storage.getPairStats(profile.layoutId);
    sessionKeyRecords = keyRecords;

    const unlocked = unlockedGroupCountForTrack(layoutObj, keyRecords, profile.track);
    const { keys, pairs, levels: nextLevels } = buildSessionKeysAndPairs(
      layoutObj,
      keyRecords,
      pairRecords,
      unlocked,
    );
    levels = nextLevels;

    const pack = getContentPackForLayout(profile.layoutId);
    const plan = planSession({
      learner: {
        layoutId: profile.layoutId,
        track: profile.track,
        targetWpm: profile.targetWpm,
        goalWpm: profile.goalWpm,
        unlockedGroupCount: unlocked,
        keys,
        pairs,
        sessionCount: (await storage.listSessions()).length,
        dailyMinutes: profile.dailyMinutes,
      },
      layout: layoutObj,
      letterModel: pack.letterModel,
      wordList: pack.wordList,
      blocklist: pack.blocklist,
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

  async function startOwnTextPractice(text: OwnTextRecord) {
    if (!profile) return;
    const lines = splitOwnTextToLines(text.body);
    if (lines.length === 0) return;
    timedTestMode = false;
    timedTestEndsAt = 0;
    sessionLines = lines;
    lineIndex = 0;
    sessionUi = 'handsReady';
    inputState = createFreshInput();
    linePlay = createLinePlay();
    continuousMs = 0;
    sessionActiveMs = 0;
    sessionKeyRecords = await storage.getKeyStats(profile.layoutId);
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
      blindCheck: false,
    });
    await storage.putOwnText({ ...text, practised: text.practised + 1 });
    navigate('practice');
  }

  async function startTimedTest() {
    if (!profile) return;
    const layoutObj = LAYOUTS[profile.layoutId] ?? LAYOUTS['qwerty-us']!;
    const keyRecords = await storage.getKeyStats(profile.layoutId);
    const unlocked = Math.max(
      4,
      unlockedGroupCountForTrack(layoutObj, keyRecords, profile.track),
    );
    const pack = getContentPackForLayout(profile.layoutId);
    const chars = unlockedTypingChars(layoutObj, unlocked);
    const focus = chars[0] ?? 'a';
    const line = generateLine({
      layout: layoutObj,
      unlockedGroupCount: unlocked,
      track: profile.track,
      letterModel: pack.letterModel,
      wordList: pack.wordList,
      blocklist: pack.blocklist,
      rng: createSeededRandom(Date.now() % 1_000_000),
      focusChar: focus,
      kind: 'timed_test',
    });
    timedTestMode = true;
    timedTestEndsAt = 0;
    sessionLines = [{ ...line, kind: 'timed_test' }];
    lineIndex = 0;
    sessionUi = 'handsReady';
    inputState = createFreshInput();
    linePlay = createLinePlay();
    continuousMs = 0;
    sessionActiveMs = 0;
    sessionKeyRecords = keyRecords;
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
      blindCheck: false,
    });
    navigate('practice');
  }

  async function saveOwnText() {
    const title = ownTitle.trim();
    const body = ownBody.trim();
    if (!body) return;
    await storage.putOwnText({
      schemaVersion: STORAGE_SCHEMA_VERSION,
      title: title || 'Untitled',
      body,
      kind: 'prose',
      practised: 0,
      bestWpm: null,
      createdAt: new Date().toISOString(),
    });
    ownTitle = '';
    ownBody = '';
    await loadOwnTexts();
  }

  async function deleteOwnText(id: number) {
    await storage.deleteOwnText(id);
    await loadOwnTexts();
  }

  async function startCommitWeek() {
    if (!profile) return;
    profile = {
      ...profile,
      commitWeekStartedAt: new Date().toISOString(),
      commitWeekCheckIns: 0,
      updatedAt: new Date().toISOString(),
    };
    await storage.putProfile(profile);
  }

  async function checkInCommitWeek() {
    if (!profile) return;
    const next = (profile.commitWeekCheckIns ?? 0) + 1;
    profile = {
      ...profile,
      commitWeekCheckIns: next,
      updatedAt: new Date().toISOString(),
    };
    await storage.putProfile(profile);
  }

  async function switchToPlacedTrack() {
    if (!profile || !baseline) return;
    profile = {
      ...profile,
      track: baseline.placedTrack,
      updatedAt: new Date().toISOString(),
    };
    await storage.putProfile(profile);
  }

  async function setTrack(track: Track) {
    if (!profile) return;
    profile = { ...profile, track, updatedAt: new Date().toISOString() };
    await storage.putProfile(profile);
  }

  async function setGoalWpm(goalWpm: number) {
    if (!profile) return;
    const clamped = Math.min(80, Math.max(15, goalWpm));
    profile = {
      ...profile,
      goalWpm: clamped,
      targetWpm: Math.min(profile.targetWpm, clamped),
      updatedAt: new Date().toISOString(),
    };
    await storage.putProfile(profile);
  }

  async function setSound(sound: boolean) {
    if (!profile) return;
    profile = {
      ...profile,
      accessProfile: { ...profile.accessProfile, sound },
      updatedAt: new Date().toISOString(),
    };
    applyDisplaySettings(profile.accessProfile);
    await storage.putProfile(profile);
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
      placedTrack,
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
      eyesUpPoints: 0,
      commitWeekStartedAt: null,
      commitWeekCheckIns: 0,
      createdAt: now,
      updatedAt: now,
    };
    await storage.putProfile(profile);
    const base: BaselineRecord = {
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
    };
    await storage.putBaseline(base);
    baseline = base;
    applyDisplaySettings(access);
    navigate('result');
  }

  function onProbeAKey(e: KeyboardEvent) {
    if (!probeAStarted) probeAStarted = performance.now();
    if (e.key.length === 1) {
      probeAChars += 1;
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
    const ok = window.prompt(t.settings.deleteConfirm);
    if (ok !== 'DELETE') return;
    await storage.deleteEverything();
    profile = null;
    baseline = null;
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

  function confidenceForKey(rec: KeyStatRecord): number {
    if (!profile) return rec.confidence;
    return keyConfidence(
      {
        code: rec.code,
        accuracy: rec.accuracy,
        timeToTypeMs: rec.timeToTypeMs ?? 400,
        recentIntervalsMs: rec.recentIntervalsMs,
        recentFirstAttempts: rec.recentFirstAttempts,
        sessionsWithKey: rec.sessionsWithKey,
        presses: rec.presses,
        level: rec.guideLevel,
        lastPractisedIso: rec.lastPractised ?? undefined,
        stableSessions: rec.stableSessions,
      },
      profile.targetWpm,
    );
  }

  function copyAppLink() {
    void navigator.clipboard?.writeText(window.location.href.replace(/#.*$/, ''));
  }
</script>

<svelte:window onkeydown={onGlobalKey} />

{#if !ready}
  <main class="page"><p>{t.app.name}</p></main>
{:else}
  {#if isDestination(route) && profile}
    <nav class="nav" aria-label={t.nav.label}>
      <a href="#/today" aria-current={route === 'today' ? 'page' : undefined}>{t.nav.today}</a>
      <a href="#/practice" aria-current={route === 'practice' ? 'page' : undefined}>{t.nav.practice}</a>
      <a href="#/progress" aria-current={route === 'progress' ? 'page' : undefined}>{t.nav.progress}</a>
      <a href="#/library" aria-current={route === 'library' ? 'page' : undefined}>{t.nav.library}</a>
      <a href="#/settings" aria-current={route === 'settings' ? 'page' : undefined}>{t.nav.settings}</a>
    </nav>
  {/if}

  {#if deviceBanner && route !== 'device'}
    <aside class="device-banner" role="status">
      <p>{t.device.body}</p>
      <a href="#/device">{t.device.title}</a>
    </aside>
  {/if}

  <main class="page" data-route={route}>
    {#if route === 'device'}
      <h1>{t.device.title}</h1>
      <p>{t.device.body}</p>
      <button type="button" onclick={copyAppLink}>{t.device.copy}</button>
    {:else if route === 'desktop-import'}
      <h1>{t.desktop.importTitle}</h1>
      <p>{t.desktop.importBody}</p>
      <label class="file-pick">
        {t.desktop.importChoose}
        <input
          type="file"
          accept="application/json,.json"
          disabled={desktopImportBusy}
          onchange={(e) => void onDesktopImportFile(e)}
        />
      </label>
      <button type="button" disabled={desktopImportBusy} onclick={() => void skipDesktopImport()}>
        {t.desktop.importSkip}
      </button>
      {#if desktopImportError}
        <p role="alert">{desktopImportError}</p>
      {/if}
      <p class="hint">{t.questions.continue}</p>
    {:else if route === 'welcome'}
      <h1>{t.welcome.title}</h1>
      <p>{t.welcome.body}</p>
      <p class="hint">{t.welcome.start}</p>
    {:else if route === 'orient'}
      <h1>{t.orient.title}</h1>
      <p>{orientSteps[orientStep]}</p>
      <p class="hint">{t.orient.next}</p>
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
      <p class="hint">{q.multi ? t.questions.toggle : t.questions.continue}</p>
    {:else if route === 'probe-a'}
      <h1>{t.probeA.title}</h1>
      <p>{t.probeA.hint}</p>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <pre class="probe" tabindex="0" onkeydown={onProbeAKey}>{t.probeA.passage}</pre>
    {:else if route === 'probe-b'}
      <h1>{t.probeB.title}</h1>
      <p>{probeBHome < 4 ? t.probeB.home : t.probeB.blind}</p>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <pre class="probe" tabindex="0" onkeydown={onProbeBKey}>{probeBHome < 4 ? t.probeB.homeLabel : t.probeB.passage}</pre>
    {:else if route === 'result'}
      <h1>{t.result.title}</h1>
      <p>{t.result.reason}: {placementReason}</p>
      <p>{t.result.layout}: {detectedLayout}</p>
      <p data-testid="placed-track">placed: {placedTrack}</p>
      <p data-testid="active-track">active: {activeTrack}</p>
      <label>
        {t.result.override}
        <select
          value={activeTrack}
          onchange={(e) => {
            activeTrack = e.currentTarget.value as Track;
            if (profile) {
              profile = { ...profile, track: activeTrack, updatedAt: new Date().toISOString() };
              void storage.putProfile(profile);
            }
          }}
        >
          {#each TRACK_OPTIONS as tr, i}
            <option value={tr}>{i + 1}. {tr}</option>
          {/each}
        </select>
      </label>
      <p class="hint">{t.result.continue}</p>
    {:else if route === 'today'}
      <h1>{t.today.title}</h1>
      <p>{t.today.streak}: {profile?.streakDays ?? 0} {t.today.days}</p>
      <p>{t.today.goal}: {profile?.goalWpm ?? 30} {t.practice.wpm}</p>
      {#if profile?.track === 'retrain'}
        <p role="note">{t.today.dipExplainer}</p>
      {/if}
      {#if crossover && baseline}
        <section aria-labelledby="today-crossover">
          <h2 id="today-crossover">{t.today.crossover}</h2>
          {#if crossover.crossed}
            <p>{t.today.crossoverReached}</p>
          {:else}
            <p>{t.today.crossover}: {crossover.gap.toFixed(1)} {t.practice.wpm}</p>
            {#if crossover.projectedSessionsFromNow != null}
              <p>{fillTemplate(t.today.crossoverProjected, crossover.projectedSessionsFromNow)}</p>
            {/if}
          {/if}
        </section>
      {/if}
      {#if profile}
        {@const started = profile.commitWeekStartedAt}
        {@const checkIns = profile.commitWeekCheckIns ?? 0}
        {@const done = commitWeekComplete(checkIns)}
        {#if started && !done}
          <section aria-labelledby="commit-week">
            <h2 id="commit-week">{t.today.commitWeek}</h2>
            <p>{fillTemplate(t.today.commitWeekProgress, checkIns)}</p>
            <button type="button" onclick={() => void checkInCommitWeek()}>{t.today.commitWeekCheckIn}</button>
          </section>
        {:else if commitEligible && !started}
          <section aria-labelledby="commit-week">
            <h2 id="commit-week">{t.today.commitWeek}</h2>
            <p>{t.today.commitWeekOffer}</p>
            <button type="button" onclick={() => void startCommitWeek()}>{t.today.commitWeekStart}</button>
          </section>
        {/if}
      {/if}
      <p class="hint">{t.today.start}</p>
      {#if updateWaiting}
        <aside class="update-banner" role="status">
          <p>{t.update.ready}</p>
          <button type="button" onclick={() => void installWaitingUpdate()}>{t.update.install}</button>
          <button type="button" onclick={dismissWaitingUpdate}>{t.update.later}</button>
        </aside>
      {/if}
    {:else if route === 'practice'}
      {#if isDesktop}
        <p>
          <button type="button" onclick={() => void toggleDesktopFullscreen()}>
            {desktopFullscreen ? t.desktop.exitFullscreen : t.desktop.fullscreen}
          </button>
        </p>
      {/if}
      {#if sessionUi === 'handsReady'}
        <h1>{t.practice.handsReady}</h1>
        <Keyboard {layout} mode="levels" hands="rest" target="KeyF" {levels} reducedMotion={profile?.accessProfile.reducedMotion ?? false} />
      {:else if sessionUi === 'paused'}
        <p role="status">{t.practice.paused}</p>
      {:else if sessionUi === 'lineResult'}
        <h1>{t.practice.lineResult}</h1>
        <p>{t.practice.wpm}: {lastLineWpm.toFixed(0)}</p>
        <p>{t.practice.accuracy}: {(lastLineAcc * 100).toFixed(0)}%</p>
        <p class="hint">{t.questions.continue}</p>
      {:else if sessionUi === 'breakCard'}
        <h1>{t.practice.break}</h1>
        <p class="hint">{t.practice.breakSkip}</p>
      {:else if sessionUi === 'unlockCard'}
        <h1>{t.practice.unlock}</h1>
        <Keyboard {layout} mode="zones" hands="reach" target="KeyK" {levels} reducedMotion={profile?.accessProfile.reducedMotion ?? false} />
        <p class="hint">{t.practice.unlockStart}</p>
      {:else if sessionUi === 'summary'}
        <h1>{t.practice.summary}</h1>
        <p>{t.practice.wpm}: {lastLineWpm.toFixed(0)}</p>
        <p class="hint">{t.practice.done}</p>
        {#if updateWaiting}
          <aside class="update-banner" role="status">
            <p>{t.update.ready}</p>
            <button type="button" onclick={() => void installWaitingUpdate()}>{t.update.install}</button>
            <button type="button" onclick={dismissWaitingUpdate}>{t.update.later}</button>
          </aside>
        {/if}
      {:else if currentLine}
        {#if notices.includes('caps_lock')}
          <p role="status">{t.practice.capsLock}</p>
        {/if}
        {#if inputState.peeking}
          <p role="status">{t.practice.peek}</p>
        {/if}
        <!-- No live WPM while typing (required for foundations/retrain; line result still shows WPM). -->
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
      <h1>{t.progress.title}</h1>
      <p>{t.progress.eyesUpPoints}: {profile?.eyesUpPoints ?? 0}</p>
      <section aria-labelledby="heatmap-heading">
        <h2 id="heatmap-heading">{t.progress.heatmap}</h2>
        <p class="hint">{t.progress.heatmapHint}</p>
        <ul class="heatmap" role="list">
          {#each progressKeys as rec}
            {@const conf = confidenceForKey(rec)}
            <li
              class="heat-cell"
              style={`--conf: ${conf}; background-color: color-mix(in srgb, var(--color-accent, #2f6fed) ${Math.round(conf * 100)}%, transparent); opacity: ${0.35 + conf * 0.65}`}
              title={`${rec.code}: ${Math.round(conf * 100)}%`}
            >
              <span class="heat-code">{rec.code.replace(/^Key/, '')}</span>
              <span class="heat-pct">{Math.round(conf * 100)}%</span>
            </li>
          {:else}
            <li class="hint">{t.progress.noSessions}</li>
          {/each}
        </ul>
      </section>
      <section aria-labelledby="history-heading">
        <h2 id="history-heading">{t.progress.history}</h2>
        {#if historySessions.length === 0}
          <p>{t.progress.noSessions}</p>
        {:else}
          <ol class="history">
            {#each historySessions as s}
              <li>
                {(s.netWpm ?? 0).toFixed(0)} {t.practice.wpm}
                · {((s.accuracy ?? 0) * 100).toFixed(0)}%
              </li>
            {/each}
          </ol>
        {/if}
      </section>
      <section aria-labelledby="milestones-heading">
        <h2 id="milestones-heading">{t.progress.milestones}</h2>
        {#if progressMilestones.length === 0}
          <p>{t.progress.noMilestones}</p>
        {:else}
          <ul>
            {#each progressMilestones as m}
              <li>{m.id} — {m.reachedAt.slice(0, 10)}</li>
            {/each}
          </ul>
        {/if}
      </section>
      {#if crossover && baseline}
        <section aria-labelledby="progress-crossover">
          <h2 id="progress-crossover">{t.progress.crossover}</h2>
          {#if crossover.crossed}
            <p>{t.today.crossoverReached}</p>
          {:else}
            <p>{t.today.crossover}: {crossover.gap.toFixed(1)}</p>
            {#if crossover.projectedSessionsFromNow != null}
              <p>{fillTemplate(t.today.crossoverProjected, crossover.projectedSessionsFromNow)}</p>
            {/if}
          {/if}
        </section>
      {/if}
    {:else if route === 'library'}
      <h1>{t.library.title}</h1>
      <button type="button" onclick={() => { orientStep = 0; navigate('orient'); }}>{t.library.orient}</button>
      <button type="button" onclick={() => void startTimedTest()}>{t.library.timedTestStart}</button>
      <section aria-labelledby="own-text-heading">
        <h2 id="own-text-heading">{t.library.ownText}</h2>
        <label>
          {t.library.ownTextTitle}
          <input type="text" bind:value={ownTitle} />
        </label>
        <label>
          {t.library.ownTextBody}
          <textarea rows="5" bind:value={ownBody}></textarea>
        </label>
        <button type="button" onclick={() => void saveOwnText()}>{t.library.ownTextSave}</button>
        {#if ownTexts.length === 0}
          <p>{t.library.ownTextEmpty}</p>
        {:else}
          <ul class="own-list">
            {#each ownTexts as text}
              <li>
                <strong>{text.title}</strong>
                <button type="button" onclick={() => void startOwnTextPractice(text)}>{t.library.ownTextPractise}</button>
                <button type="button" onclick={() => void deleteOwnText(text.id)}>{t.library.ownTextDelete}</button>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {:else if route === 'settings'}
      <h1>{t.settings.title}</h1>
      <label>
        {t.settings.layout}
        <select
          value={profile?.layoutId}
          onchange={(e) => {
            if (!profile) return;
            profile = { ...profile, layoutId: e.currentTarget.value, updatedAt: new Date().toISOString() };
            void storage.putProfile(profile);
          }}
        >
          <option value="qwerty-us">{t.layouts.qwertyUs}</option>
          <option value="qwerty-uk">{t.layouts.qwertyUk}</option>
          <option value="azerty-fr">{t.layouts.azertyFr}</option>
        </select>
      </label>
      <label>
        {t.settings.track}
        <select
          value={profile?.track}
          onchange={(e) => void setTrack(e.currentTarget.value as Track)}
        >
          {#each TRACK_OPTIONS as tr}
            <option value={tr}>{tr}</option>
          {/each}
        </select>
      </label>
      <p class="hint">{t.settings.trackKeepProgress}</p>
      {#if baseline && profile && baseline.placedTrack !== profile.track}
        <button type="button" onclick={() => void switchToPlacedTrack()}>{t.settings.switchPlaced}</button>
      {/if}
      <label>
        {t.settings.goal}
        <select
          value={profile?.goalWpm}
          onchange={(e) => void setGoalWpm(Number(e.currentTarget.value))}
        >
          {#each GOAL_OPTIONS as w}
            <option value={w}>{w}</option>
          {/each}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={profile?.accessProfile.sound}
          onchange={(e) => void setSound(e.currentTarget.checked)}
        />
        {t.settings.sound}
      </label>
      <p>{t.settings.textSize}: {profile?.accessProfile.textSizePx}</p>
      <button type="button" onclick={() => setTextSize(-2)}>{t.controls.smaller}</button>
      <button type="button" onclick={() => setTextSize(2)}>{t.controls.larger}</button>
      <div>
        <button type="button" onclick={() => setTheme('light')}>{t.settings.themeLight}</button>
        <button type="button" onclick={() => setTheme('dark')}>{t.settings.themeDark}</button>
        <button type="button" onclick={() => setTheme('high-contrast')}>{t.settings.themeHighContrast}</button>
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
        {t.settings.reducedMotion}
      </label>
      <label>
        {t.settings.fingerMap}
        <select
          value={profile?.accessProfile.fingerMap ?? 'default'}
          onchange={(e) => {
            const current = profile;
            if (!current) return;
            const { fingerMap: _omit, ...restAccess } = current.accessProfile;
            const value = e.currentTarget.value;
            const accessProfile =
              value === 'default' ? restAccess : { ...restAccess, fingerMap: value };
            const next = {
              ...current,
              accessProfile,
              updatedAt: new Date().toISOString(),
            };
            profile = next;
            applyDisplaySettings(next.accessProfile);
            void storage.putProfile(next);
          }}
        >
          <option value="default">{t.settings.fingerMapDefault}</option>
          <option value="one-hand-left">{t.settings.fingerMapOneHandLeft}</option>
          <option value="one-hand-right">{t.settings.fingerMapOneHandRight}</option>
          <option value="reduced">{t.settings.fingerMapReduced}</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={profile?.accessProfile.font === 'dyslexia'}
          onchange={(e) => {
            const current = profile;
            if (!current) return;
            const { font: _omit, ...restAccess } = current.accessProfile;
            const accessProfile = e.currentTarget.checked
              ? { ...restAccess, font: 'dyslexia' }
              : restAccess;
            const next = {
              ...current,
              accessProfile,
              updatedAt: new Date().toISOString(),
            };
            profile = next;
            applyDisplaySettings(next.accessProfile);
            void storage.putProfile(next);
          }}
        />
        {t.settings.dyslexiaFont}
      </label>
      <button type="button" onclick={() => void exportData()}>{t.settings.export}</button>
      <button type="button" onclick={() => void deleteAll()}>{t.settings.delete}</button>
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
  h1, h2 {
    font-family: var(--font-family-ui, sans-serif);
  }
  h1 {
    font-size: 1.75rem;
  }
  h2 {
    font-size: 1.15rem;
    margin-top: 1.5rem;
  }
  p,
  li,
  label,
  button,
  input,
  textarea,
  select {
    font-family: var(--font-family-ui, sans-serif);
  }
  label {
    display: block;
    margin: 0.75rem 0;
  }
  input[type='text'],
  textarea,
  select {
    display: block;
    width: 100%;
    max-width: 28rem;
    margin-top: 0.25rem;
  }
  .hint {
    color: var(--color-ink-secondary, #5b616b);
  }
  .file-pick {
    display: block;
    margin: 1rem 0;
  }
  .file-pick input {
    margin-top: 0.5rem;
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
  .heatmap {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(3.5rem, 1fr));
    gap: 0.35rem;
    list-style: none;
    padding: 0;
  }
  .heat-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.35rem;
    border: 1px solid var(--color-border-subtle, #c9ced6);
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }
  .heat-pct {
    font-variant-numeric: tabular-nums;
  }
  .history {
    padding-left: 1.25rem;
  }
  .own-list {
    list-style: none;
    padding: 0;
  }
  .own-list li {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    margin: 0.5rem 0;
  }
  .device-banner {
    padding: 0.75rem 1.5rem;
    background: var(--color-surface-raised, #efece4);
    border-bottom: 1px solid var(--color-border-subtle, #c9ced6);
    font-family: var(--font-family-ui, sans-serif);
  }
  :global(:focus-visible) {
    outline: 2px solid var(--color-accent, #2f6fed);
    outline-offset: 2px;
  }
</style>
