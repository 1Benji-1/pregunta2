import { GameState } from '../types/game.types';

const STORAGE_MATCH_KEY = 'pregunta2_active_match_v1';
const STORAGE_USED_CARDS_KEY = 'pregunta2_used_cards_v1';

export class StorageService {
  public static saveMatch(state: GameState): void {
    if (!state || state.finished) return;
    try {
      const snapshot = {
        ...state,
        savedAt: Date.now()
      };
      localStorage.setItem(STORAGE_MATCH_KEY, JSON.stringify(snapshot));
    } catch (_) {}
  }

  public static loadMatch(): GameState | null {
    try {
      const raw = localStorage.getItem(STORAGE_MATCH_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && !parsed.finished && parsed.players && parsed.players.length === 2) {
        return parsed as GameState;
      }
    } catch (_) {}
    return null;
  }

  public static clearMatch(): void {
    localStorage.removeItem(STORAGE_MATCH_KEY);
  }

  public static getSessionUsedCards(): string[] {
    try {
      const raw = sessionStorage.getItem(STORAGE_USED_CARDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  public static markCardAsUsed(cartaId: string): void {
    try {
      const used = new Set(this.getSessionUsedCards());
      used.add(cartaId);
      sessionStorage.setItem(STORAGE_USED_CARDS_KEY, JSON.stringify(Array.from(used)));
    } catch (_) {}
  }
}
