import { invokeCmd } from './tauriBridge.js';
import type {
  BaselineRecord,
  EyesUpExport,
  KeyStatRecord,
  LineResultRecord,
  MilestoneRecord,
  OwnTextRecord,
  PairStatRecord,
  ProfileRecord,
  SessionRecord,
  StorageAdapter,
} from './types.js';

/**
 * StorageAdapter backed by the desktop SQLite commands (EU-042).
 * Command names are snake_case; Tauri maps camelCase JS arg keys to Rust params.
 */
export function createTauriSqliteAdapter(): StorageAdapter {
  return {
    getProfile: () => invokeCmd<ProfileRecord | null>('get_profile'),

    putProfile: (profile) => invokeCmd<void>('put_profile', { profile }),

    getBaseline: () => invokeCmd<BaselineRecord | null>('get_baseline'),

    putBaseline: (baseline) => invokeCmd<void>('put_baseline', { baseline }),

    getKeyStats: (layoutId) =>
      invokeCmd<KeyStatRecord[]>('get_key_stats', { layoutId }),

    putKeyStat: (stat) => invokeCmd<void>('put_key_stat', { stat }),

    getPairStats: (layoutId) =>
      invokeCmd<PairStatRecord[]>('get_pair_stats', { layoutId }),

    putPairStat: (stat) => invokeCmd<void>('put_pair_stat', { stat }),

    createSession: (session) =>
      invokeCmd<SessionRecord>('create_session', { session }),

    updateSession: (session) => invokeCmd<void>('update_session', { session }),

    saveLineResult: (result) =>
      invokeCmd<LineResultRecord>('save_line_result', { result }),

    listSessions: () => invokeCmd<SessionRecord[]>('list_sessions'),

    listLineResults: (sessionId) =>
      invokeCmd<LineResultRecord[]>('list_line_results', { sessionId }),

    putMilestone: (m) => invokeCmd<void>('put_milestone', { m }),

    listMilestones: () => invokeCmd<MilestoneRecord[]>('list_milestones'),

    listOwnTexts: () => invokeCmd<OwnTextRecord[]>('list_own_texts'),

    putOwnText: (text) => invokeCmd<OwnTextRecord>('put_own_text', { text }),

    deleteOwnText: (id) => invokeCmd<void>('delete_own_text', { id }),

    exportJson: () => invokeCmd<EyesUpExport>('export_json'),

    importJson: (data) => invokeCmd<void>('import_json', { payload: data }),

    deleteEverything: () => invokeCmd<void>('delete_everything'),
  };
}
