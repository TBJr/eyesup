import type { GuideLevel, Track } from '@eyesup/engine';

export const STORAGE_SCHEMA_VERSION = 1;

export interface AccessProfile {
  textSizePx: number;
  theme: 'light' | 'dark' | 'high-contrast';
  reducedMotion: boolean;
  sound: boolean;
  fingerMap?: string;
  font?: string;
}

export interface ProfileRecord {
  schemaVersion: number;
  id: 1;
  layoutId: string;
  /** Active track (C7). */
  track: Track;
  overlays: string[];
  accessProfile: AccessProfile;
  dailyMinutes: 5 | 12 | 20;
  targetWpm: number;
  goalWpm: number;
  keyboardShape: 'laptop' | 'full' | 'split';
  reminderTime: string | null;
  streakDays: number;
  lastPracticeDate: string | null;
  restDaysUsedThisWeek: number;
  weekStartIso: string | null;
  /** Optional placement override / last placed track (EU-039 prep). */
  placedTrack?: Track;
  commitWeekStartedAt?: string | null;
  commitWeekCheckIns?: number;
  eyesUpPoints?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BaselineRecord {
  schemaVersion: number;
  id: 1;
  answers: unknown;
  sightedWpm: number;
  sightedAccuracy: number;
  blindWpm: number;
  blindAccuracy: number;
  homeScore: number;
  intervalCv: number | null;
  rolloverShare: number | null;
  detectedLayoutId: string;
  placedTrack: Track;
  takenAt: string;
}

export interface KeyStatRecord {
  schemaVersion: number;
  layoutId: string;
  code: string;
  unlockedAt: string | null;
  guideLevel: GuideLevel;
  accuracy: number;
  timeToTypeMs: number | null;
  confidence: number;
  presses: number;
  stableSessions: number;
  sessionsWithKey: number;
  recentIntervalsMs: number[];
  recentFirstAttempts: number[];
  lastPractised: string | null;
}

export interface PairStatRecord {
  schemaVersion: number;
  layoutId: string;
  pair: string;
  timeMs: number | null;
  accuracy: number;
  count: number;
}

export interface SessionRecord {
  schemaVersion: number;
  id: number;
  layoutId: string;
  track: Track;
  startedAt: string;
  endedAt: string | null;
  activeMs: number;
  netWpm: number | null;
  accuracy: number | null;
  blindShare: number | null;
  peeks: number;
  blindCheck: boolean;
}

export interface LineResultRecord {
  schemaVersion: number;
  id: number;
  sessionId: number;
  position: number;
  lineType: string;
  textHash: string | null;
  netWpm: number;
  accuracy: number;
  errorsByKey: Record<string, number>;
  guideChanges: Array<{ code: string; from: number; to: number }>;
  savedAt: string;
}

export interface MilestoneRecord {
  schemaVersion: number;
  id: string;
  reachedAt: string;
  detail: unknown;
}

export interface OwnTextRecord {
  schemaVersion: number;
  id: number;
  title: string;
  body: string;
  kind: 'prose' | 'code';
  practised: number;
  bestWpm: number | null;
  createdAt: string;
}

export interface EyesUpExport {
  schemaVersion: number;
  exportedAt: string;
  profile: ProfileRecord | null;
  baseline: BaselineRecord | null;
  keyStats: KeyStatRecord[];
  pairStats: PairStatRecord[];
  sessions: SessionRecord[];
  lineResults: LineResultRecord[];
  milestones: MilestoneRecord[];
  ownTexts: OwnTextRecord[];
}

export interface StorageAdapter {
  getProfile(): Promise<ProfileRecord | null>;
  putProfile(profile: ProfileRecord): Promise<void>;
  getBaseline(): Promise<BaselineRecord | null>;
  putBaseline(baseline: BaselineRecord): Promise<void>;
  getKeyStats(layoutId: string): Promise<KeyStatRecord[]>;
  putKeyStat(stat: KeyStatRecord): Promise<void>;
  getPairStats(layoutId: string): Promise<PairStatRecord[]>;
  putPairStat(stat: PairStatRecord): Promise<void>;
  createSession(session: Omit<SessionRecord, 'id'>): Promise<SessionRecord>;
  updateSession(session: SessionRecord): Promise<void>;
  /** Save after every completed line — never mid-line (NFR-11). */
  saveLineResult(result: Omit<LineResultRecord, 'id'>): Promise<LineResultRecord>;
  listSessions(): Promise<SessionRecord[]>;
  listLineResults(sessionId: number): Promise<LineResultRecord[]>;
  putMilestone(m: MilestoneRecord): Promise<void>;
  listMilestones(): Promise<MilestoneRecord[]>;
  listOwnTexts(): Promise<OwnTextRecord[]>;
  /** Create or update; omit `id` to auto-assign. */
  putOwnText(text: Omit<OwnTextRecord, 'id'> & { id?: number }): Promise<OwnTextRecord>;
  deleteOwnText(id: number): Promise<void>;
  exportJson(): Promise<EyesUpExport>;
  importJson(data: EyesUpExport): Promise<void>;
  deleteEverything(): Promise<void>;
}
