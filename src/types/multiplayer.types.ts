import { Card } from './question.types';
import { GameState } from './game.types';

export interface UserProfile {
  name: string;
  avatar: string;
  color: string;
}

export type MultiplayerAction =
  | {
      id?: string;
      type: 'SPIN';
      payload: { targetSliceIdx: number; isAutoRespin: boolean };
      fromIndex?: number;
    }
  | {
      id?: string;
      type: 'CROWN_CHOSEN';
      payload: { categoryKey: string; card: Card };
      fromIndex?: number;
    }
  | {
      id?: string;
      type: 'START_QUESTION';
      payload: { categoryKey: string; card: Card; isCrownChallenge: boolean };
      fromIndex?: number;
    }
  | {
      id?: string;
      type: 'USE_COMODIN';
      payload: { type: 'doble' } | { type: 'bomba'; eliminatedIndices: number[] };
      fromIndex?: number;
    }
  | {
      id?: string;
      type: 'SUBMIT_ANSWER';
      payload: { selectedIndex: number };
      fromIndex?: number;
    }
  | {
      id?: string;
      type: 'NEXT_TURN';
      payload: { nextPlayerIndex: number; nextTurnNumber: number };
      fromIndex?: number;
    }
  | {
      id?: string;
      type: 'NEXT_BONUS';
      payload: { nextAttemptIndex: number };
      fromIndex?: number;
    };

export interface RoomData {
  code: string;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
  difficulty: string;
  host: UserProfile;
  guest: UserProfile | null;
  gameState: GameState | null;
  action: MultiplayerAction | null;
}
