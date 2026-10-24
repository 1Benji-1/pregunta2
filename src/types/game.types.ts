import { Category, CategoryKey } from './category.types';
import { Card, Difficulty } from './question.types';
import { Player } from './player.types';

export interface GameState {
  difficulty: Difficulty;
  currentPlayerIndex: number; // 0 o 1
  turnNumber: number;
  startedAt: number;
  elapsedSecondsBeforeResume?: number;
  finished: boolean;
  winnerIndex: number | null;
  decks: Record<CategoryKey, string[]>;
  discardPile: string[];
  players: [Player, Player];
}

export interface ActiveTurnContext {
  category: Category;
  card: Card;
  isCrownChallenge: boolean;
  maxAttempts: number;
  currentAttemptIndex: number;
  answered: boolean;
  readerPlayer: Player;
  dobleOportunidadActiva?: boolean;
  dobleOportunidadUsada?: boolean;
  bombaUsada?: boolean;
  eliminatedOptions?: Set<number>;
  failedOptions?: Set<number> | null;
}
