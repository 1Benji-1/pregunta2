import { CategoryKey } from '../types/category.types';
import { GameState } from '../types/game.types';
import { Player } from '../types/player.types';

export class GameRules {
  /**
   * En Desafío de Corona, los puntos acumulados (0 a 2) dan N+1 intentos (hasta 3).
   * En categoría normal, siempre es 1 único intento.
   */
  public static calculateMaxAttempts(isCrownChallenge: boolean, currentPoints: number): number {
    if (!isCrownChallenge) return 1;
    return Math.min(3, Math.max(1, currentPoints + 1));
  }

  /**
   * Aplica un acierto a la categoría y determina si se conquista la corona
   */
  public static applyCorrectAnswer(
    player: Player,
    categoryKey: CategoryKey,
    isCrownChallenge: boolean,
    attemptIndex: number
  ): { wonCrown: boolean; pointsAdded: number; headline: string; detail: string } {
    const catState = player.categories[categoryKey];
    player.totalCorrect += 1;
    catState.correctCount += 1;

    if (attemptIndex > 0) {
      player.bonusSaves += 1;
    }

    if (isCrownChallenge) {
      catState.points = 3;
      catState.won = true;
      catState.wonByCrown = true;
      player.crowns += 1;

      return {
        wonCrown: true,
        pointsAdded: 3,
        headline:
          attemptIndex > 0
            ? `👑 ✨ ¡ACIERTO EN TU BONUS DE CORONA! ¡CONQUISTAS ${categoryKey}!`
            : `👑 ¡RESPUESTA CORRECTA! ¡CONQUISTAS ${categoryKey}!`,
        detail: `${player.name} gana directamente la corona de ${categoryKey}.`
      };
    } else {
      catState.points = Math.min(3, catState.points + 1);
      if (catState.points >= 3) {
        catState.won = true;
        player.crowns += 1;
        return {
          wonCrown: true,
          pointsAdded: 1,
          headline: `🎉 ¡LLEGASTE A 3/3 PUNTOS! ¡CORONA DE ${categoryKey} GANADA!`,
          detail: `${player.name} completa los 3 puntos y conquista la corona.`
        };
      } else {
        return {
          wonCrown: false,
          pointsAdded: 1,
          headline: `✅ ¡RESPUESTA CORRECTA! (+1 Punto en ${categoryKey})`,
          detail: `Ahora tienes ${catState.points}/3 puntos en ${categoryKey}. (¡Estos puntos te darán intentos extra de Bonus en la Corona 👑!)`
        };
      }
    }
  }

  /**
   * Verifica si algún jugador ha completado las 6 categorías
   */
  public static checkVictory(state: GameState): boolean {
    const activePlayer = state.players[state.currentPlayerIndex];
    if (activePlayer.crowns >= 6) {
      state.finished = true;
      state.winnerIndex = state.currentPlayerIndex;
      return true;
    }
    return false;
  }

  /**
   * Calcula el siguiente turno de forma idempotente
   */
  public static computeNextTurn(
    state: GameState,
    targetPlayerIndex?: number | null,
    targetTurnNumber?: number | null
  ): { nextPlayerIndex: number; nextTurnNumber: number } {
    const nextTurnNumber = typeof targetTurnNumber === 'number'
      ? targetTurnNumber
      : state.turnNumber + 1;

    const nextPlayerIndex = typeof targetPlayerIndex === 'number'
      ? targetPlayerIndex
      : (state.currentPlayerIndex + 1) % 2;

    return { nextPlayerIndex, nextTurnNumber };
  }
}
