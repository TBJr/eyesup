import type { RawKeyEvent } from '../types.js';

/** Outcome of adapting one raw key event for scoring / UI. */
export type AdaptedKeyAction =
  | { readonly type: 'ignore'; readonly reason: IgnoreReason }
  | { readonly type: 'notice'; readonly notice: 'ime' | 'caps_lock' }
  | {
      readonly type: 'keydown';
      readonly code: string;
      readonly key: string;
      readonly timeStamp: number;
      readonly peeking: boolean;
      readonly composed: boolean;
    }
  | {
      readonly type: 'keyup';
      readonly code: string;
      readonly key: string;
      readonly timeStamp: number;
    }
  | {
      readonly type: 'shortcut';
      readonly code: string;
      readonly key: string;
      readonly timeStamp: number;
    };

export type IgnoreReason =
  | 'repeat'
  | 'composing'
  | 'dead_pending'
  | 'non_typing';

export interface InputAdapterState {
  /** Physical code held as a dead key waiting for composition. */
  readonly pendingDeadCode: string | undefined;
  readonly peeking: boolean;
  /** Codes currently down (for hands-ready F+J). */
  readonly keysDown: ReadonlySet<string>;
}

export interface InputAdapterResult {
  readonly state: InputAdapterState;
  readonly actions: readonly AdaptedKeyAction[];
}

export type { RawKeyEvent };
