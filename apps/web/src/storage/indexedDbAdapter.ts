import {
  STORAGE_SCHEMA_VERSION,
  type BaselineRecord,
  type EyesUpExport,
  type KeyStatRecord,
  type LineResultRecord,
  type MilestoneRecord,
  type OwnTextRecord,
  type PairStatRecord,
  type ProfileRecord,
  type SessionRecord,
  type StorageAdapter,
} from './types.js';

const DB_NAME = 'eyesup';
const DB_VERSION = 1;

const STORES = [
  'profile',
  'baseline',
  'key_stat',
  'pair_stat',
  'session',
  'line_result',
  'milestone',
  'own_text',
  'meta',
] as const;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          if (name === 'key_stat') {
            db.createObjectStore(name, { keyPath: ['layoutId', 'code'] });
          } else if (name === 'pair_stat') {
            db.createObjectStore(name, { keyPath: ['layoutId', 'pair'] });
          } else if (name === 'line_result') {
            const store = db.createObjectStore(name, {
              keyPath: 'id',
              autoIncrement: true,
            });
            store.createIndex('by_session', 'sessionId', { unique: false });
          } else if (name === 'session' || name === 'own_text') {
            db.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
          } else if (name === 'milestone') {
            db.createObjectStore(name, { keyPath: 'id' });
          } else {
            db.createObjectStore(name, { keyPath: 'id' });
          }
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
  });
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('idb request failed'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('idb tx failed'));
    tx.onabort = () => reject(tx.error ?? new Error('idb tx aborted'));
  });
}

export function createIndexedDbAdapter(): StorageAdapter {
  let dbPromise: Promise<IDBDatabase> | undefined;
  const db = () => {
    dbPromise ??= openDb();
    return dbPromise;
  };

  return {
    async getProfile() {
      const database = await db();
      return reqToPromise(
        database.transaction('profile').objectStore('profile').get(1),
      ) as Promise<ProfileRecord | null>;
    },

    async putProfile(profile) {
      const database = await db();
      const tx = database.transaction('profile', 'readwrite');
      tx.objectStore('profile').put({
        ...profile,
        schemaVersion: STORAGE_SCHEMA_VERSION,
        id: 1,
      });
      await txDone(tx);
    },

    async getBaseline() {
      const database = await db();
      return reqToPromise(
        database.transaction('baseline').objectStore('baseline').get(1),
      ) as Promise<BaselineRecord | null>;
    },

    async putBaseline(baseline) {
      const database = await db();
      const tx = database.transaction('baseline', 'readwrite');
      tx.objectStore('baseline').put({
        ...baseline,
        schemaVersion: STORAGE_SCHEMA_VERSION,
        id: 1,
      });
      await txDone(tx);
    },

    async getKeyStats(layoutId) {
      const database = await db();
      const all = (await reqToPromise(
        database.transaction('key_stat').objectStore('key_stat').getAll(),
      )) as KeyStatRecord[];
      return all.filter((k) => k.layoutId === layoutId);
    },

    async putKeyStat(stat) {
      const database = await db();
      const tx = database.transaction('key_stat', 'readwrite');
      tx.objectStore('key_stat').put({
        ...stat,
        schemaVersion: STORAGE_SCHEMA_VERSION,
      });
      await txDone(tx);
    },

    async getPairStats(layoutId) {
      const database = await db();
      const all = (await reqToPromise(
        database.transaction('pair_stat').objectStore('pair_stat').getAll(),
      )) as PairStatRecord[];
      return all.filter((p) => p.layoutId === layoutId);
    },

    async putPairStat(stat) {
      const database = await db();
      const tx = database.transaction('pair_stat', 'readwrite');
      tx.objectStore('pair_stat').put({
        ...stat,
        schemaVersion: STORAGE_SCHEMA_VERSION,
      });
      await txDone(tx);
    },

    async createSession(session) {
      const database = await db();
      const tx = database.transaction('session', 'readwrite');
      const store = tx.objectStore('session');
      const id = (await reqToPromise(
        store.add({
          ...session,
          schemaVersion: STORAGE_SCHEMA_VERSION,
        }),
      )) as number;
      await txDone(tx);
      return { ...session, schemaVersion: STORAGE_SCHEMA_VERSION, id };
    },

    async updateSession(session) {
      const database = await db();
      const tx = database.transaction('session', 'readwrite');
      tx.objectStore('session').put({
        ...session,
        schemaVersion: STORAGE_SCHEMA_VERSION,
      });
      await txDone(tx);
    },

    async saveLineResult(result) {
      const database = await db();
      const tx = database.transaction('line_result', 'readwrite');
      const id = (await reqToPromise(
        tx.objectStore('line_result').add({
          ...result,
          schemaVersion: STORAGE_SCHEMA_VERSION,
        }),
      )) as number;
      await txDone(tx);
      return { ...result, schemaVersion: STORAGE_SCHEMA_VERSION, id };
    },

    async listSessions() {
      const database = await db();
      return reqToPromise(
        database.transaction('session').objectStore('session').getAll(),
      ) as Promise<SessionRecord[]>;
    },

    async listLineResults(sessionId) {
      const database = await db();
      const all = (await reqToPromise(
        database.transaction('line_result').objectStore('line_result').getAll(),
      )) as LineResultRecord[];
      return all.filter((r) => r.sessionId === sessionId);
    },

    async putMilestone(m) {
      const database = await db();
      const tx = database.transaction('milestone', 'readwrite');
      tx.objectStore('milestone').put({
        ...m,
        schemaVersion: STORAGE_SCHEMA_VERSION,
      });
      await txDone(tx);
    },

    async listMilestones() {
      const database = await db();
      return reqToPromise(
        database.transaction('milestone').objectStore('milestone').getAll(),
      ) as Promise<MilestoneRecord[]>;
    },

    async exportJson() {
      const database = await db();
      const read = <T>(store: string) =>
        reqToPromise(
          database.transaction(store).objectStore(store).getAll(),
        ) as Promise<T[]>;
      const profiles = await read<ProfileRecord>('profile');
      const baselines = await read<BaselineRecord>('baseline');
      return {
        schemaVersion: STORAGE_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        profile: profiles[0] ?? null,
        baseline: baselines[0] ?? null,
        keyStats: await read<KeyStatRecord>('key_stat'),
        pairStats: await read<PairStatRecord>('pair_stat'),
        sessions: await read<SessionRecord>('session'),
        lineResults: await read<LineResultRecord>('line_result'),
        milestones: await read<MilestoneRecord>('milestone'),
        ownTexts: await read<OwnTextRecord>('own_text'),
      };
    },

    async importJson(data) {
      await this.deleteEverything();
      if (data.profile) await this.putProfile(data.profile);
      if (data.baseline) await this.putBaseline(data.baseline);
      for (const k of data.keyStats) await this.putKeyStat(k);
      for (const p of data.pairStats) await this.putPairStat(p);
      for (const s of data.sessions) {
        const database = await db();
        const tx = database.transaction('session', 'readwrite');
        tx.objectStore('session').put(s);
        await txDone(tx);
      }
      for (const l of data.lineResults) {
        const database = await db();
        const tx = database.transaction('line_result', 'readwrite');
        tx.objectStore('line_result').put(l);
        await txDone(tx);
      }
      for (const m of data.milestones) await this.putMilestone(m);
    },

    async deleteEverything() {
      const database = await db();
      const tx = database.transaction([...STORES], 'readwrite');
      for (const name of STORES) {
        tx.objectStore(name).clear();
      }
      await txDone(tx);
    },
  };
}
