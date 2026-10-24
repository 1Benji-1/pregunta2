import { CATEGORIES } from '../types/category.types';
import { Difficulty } from '../types/question.types';
import { AvatarOption, Player, PlayerCategoryState } from '../types/player.types';
import { GameState } from '../types/game.types';

export class StateManager {
  public static createEmptyPlayer(name: string, avatar: AvatarOption): Player {
    const categoriesState = {} as Record<string, PlayerCategoryState>;
    CATEGORIES.forEach((cat) => {
      categoriesState[cat.key] = {
        points: 0,
        won: false,
        wonByCrown: false,
        correctCount: 0,
        attemptCount: 0
      };
    });

    return {
      name,
      avatar: avatar.emoji,
      color: avatar.bg,
      crowns: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      pressureCorrect: 0,
      bonusSaves: 0,
      comodines: {
        dobleOportunidad: 3,
        bomba: 3
      },
      categories: categoriesState as any
    };
  }

  public static createInitialState(
    p1: { name: string; avatar: AvatarOption },
    p2: { name: string; avatar: AvatarOption },
    difficulty: Difficulty,
    decks: Record<string, string[]>
  ): GameState {
    const state: GameState = {
      difficulty,
      currentPlayerIndex: 0,
      turnNumber: 1,
      startedAt: Date.now(),
      elapsedSecondsBeforeResume: 0,
      finished: false,
      winnerIndex: null,
      decks: decks as any,
      discardPile: [],
      players: [
        this.createEmptyPlayer(p1.name, p1.avatar),
        this.createEmptyPlayer(p2.name, p2.avatar)
      ]
    };

    return this.sanitize(state) as GameState;
  }

  /**
   * Asegura que discardPile, decks, categories y comodines siempre existan
   * (fundamental para evitar que Firebase RTDB elimine arrays vacíos)
   */
  public static sanitize(state: GameState | null): GameState | null {
    if (!state) return null;

    if (!state.discardPile || !Array.isArray(state.discardPile)) {
      state.discardPile = [];
    }

    if (!state.decks || typeof state.decks !== 'object') {
      state.decks = {} as any;
    }

    CATEGORIES.forEach((cat) => {
      if (!state.decks[cat.key] || !Array.isArray(state.decks[cat.key])) {
        state.decks[cat.key] = [];
      }
    });

    if (state.players && Array.isArray(state.players)) {
      state.players.forEach((p) => {
        if (!p.categories || typeof p.categories !== 'object') {
          p.categories = {} as any;
        }
        CATEGORIES.forEach((cat) => {
          if (!p.categories[cat.key]) {
            p.categories[cat.key] = {
              points: 0,
              won: false,
              wonByCrown: false,
              correctCount: 0,
              attemptCount: 0
            };
          }
        });
        if (!p.comodines) {
          p.comodines = { dobleOportunidad: 3, bomba: 3 };
        }
      });
    }

    return state;
  }
}
