import { CATEGORIES, CategoryKey } from '../types/category.types';
import { Card, Difficulty } from '../types/question.types';
import { GameState } from '../types/game.types';
import { StorageService } from '../services/storage.service';
import { StateManager } from './state';

export class DeckManager {
  private allCards: Card[] = [];

  constructor() {}

  public async loadCards(): Promise<Card[]> {
    try {
      const resp = await fetch('preguntas.json');
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json) && json.length > 0) {
          this.allCards = json;
          return this.allCards;
        }
      }
    } catch (_) {}

    // Fallback si estuviera en window.PREGUNTAS_DATA
    const fallback = (window as any).PREGUNTAS_DATA;
    if (Array.isArray(fallback)) {
      this.allCards = fallback;
    }
    return this.allCards;
  }

  public getCards(): Card[] {
    return this.allCards;
  }

  public shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  public buildDecks(difficulty: Difficulty): Record<CategoryKey, string[]> {
    const sessionUsed = new Set(StorageService.getSessionUsedCards());
    const decks = {} as Record<CategoryKey, string[]>;

    CATEGORIES.forEach((cat) => {
      let pool = this.allCards.filter((c) => c.categoria === cat.key);
      if (difficulty !== 'mixta') {
        pool = pool.filter((c) => c.dificultad === difficulty);
      }

      const freshCards = this.shuffle(pool.filter((c) => !sessionUsed.has(c.carta_id)));
      const previouslyPlayed = this.shuffle(pool.filter((c) => sessionUsed.has(c.carta_id)));

      decks[cat.key] = [...freshCards, ...previouslyPlayed].map((c) => c.carta_id);
    });

    return decks;
  }

  public drawCard(state: GameState, categoryKey: CategoryKey): Card | null {
    StateManager.sanitize(state);

    if (!Array.isArray(state.decks[categoryKey]) || state.decks[categoryKey].length === 0) {
      let pool = this.allCards.filter((c) => c.categoria === categoryKey);
      if (state.difficulty !== 'mixta') {
        pool = pool.filter((c) => c.dificultad === state.difficulty);
      }
      state.decks[categoryKey] = this.shuffle(pool.map((c) => c.carta_id));
    }

    const cartaId = state.decks[categoryKey].shift();
    if (cartaId) {
      state.discardPile.push(cartaId);
      StorageService.markCardAsUsed(cartaId);
    }

    const found = this.allCards.find((c) => c.carta_id === cartaId);
    return found || this.allCards.find((c) => c.categoria === categoryKey) || this.allCards[0] || null;
  }
}

export const deckManager = new DeckManager();
