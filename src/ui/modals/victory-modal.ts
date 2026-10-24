import { CATEGORIES } from '../../types/category.types';
import { GameState } from '../../types/game.types';
import { soundEngine } from '../../services/audio.service';
import { StorageService } from '../../services/storage.service';

export class VictoryModal {
  public static open(
    state: GameState,
    onRematch: () => void,
    onBackLobby: () => void
  ): void {
    soundEngine.playVictory();
    StorageService.clearMatch();

    const modal = document.getElementById('victoryModal') as HTMLDialogElement | null;
    if (!modal) return;

    const winner = state.players[state.winnerIndex ?? 0];
    const totalSec = state.elapsedSecondsBeforeResume || 1;
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;

    const titleEl = document.getElementById('victoryTitle');
    if (titleEl) {
      titleEl.textContent = `🎉 ¡${winner.name.toUpperCase()} ${winner.avatar} ES EL CAMPEÓN DE PREGUNTA2! 🎉`;
    }

    const subEl = document.getElementById('victorySubtitle');
    if (subEl) {
      subEl.textContent = `¡Ha conquistado las 6 categorías de conocimiento en ${mins}m ${secs}s!`;
    }

    const findBestCategory = (player: typeof winner) => {
      let bestName = 'Ninguna';
      let bestScore = -1;
      CATEGORIES.forEach((cat) => {
        const st = player.categories[cat.key];
        const ratio = st.attemptCount > 0 ? st.correctCount / st.attemptCount : 0;
        const weight = (st.won ? 2 : 0) + ratio;
        if (weight > bestScore && (st.attemptCount > 0 || st.won)) {
          bestScore = weight;
          bestName = `${cat.name} (${st.wonByCrown ? 'Corona directa' : `${Math.round(ratio * 100)}% acierto`})`;
        }
      });
      return bestName;
    };

    const grid = document.getElementById('victoryStatsGrid');
    if (grid) {
      grid.innerHTML = state.players
        .map((p) => {
          const acc = p.totalQuestions > 0 ? Math.round((p.totalCorrect / p.totalQuestions) * 100) : 0;
          const c = p.comodines || { dobleOportunidad: 3, bomba: 3 };
          const dobleUsed = 3 - c.dobleOportunidad;
          const bombaUsed = 3 - c.bomba;
          return `
          <div class="stat-box">
            <div class="stat-box-header">
              <span class="stat-player-avatar" style="background:${p.color};">${p.avatar}</span>
              <div>
                <h4 style="margin:0; font-family:'Fredoka',sans-serif; font-size:1.15rem;">${p.name}</h4>
                <small style="color:#64748b; font-weight:700;">${p.crowns} de 6 Coronas</small>
              </div>
            </div>
            <div class="stat-data-list">
              <div class="stat-row">
                <span>Efectividad Global:</span>
                <strong>${acc}% (${p.totalCorrect}/${p.totalQuestions})</strong>
              </div>
              <div class="stat-row">
                <span>Comodines Usados:</span>
                <strong>✌️ ${dobleUsed}/3 | 💣 ${bombaUsed}/3</strong>
              </div>
              <div class="stat-row">
                <span>Aciertos en Bonus de Corona:</span>
                <strong>${p.bonusSaves}</strong>
              </div>
              <div class="stat-row">
                <span>Categoría más destacada:</span>
                <strong style="color:var(--primary-blue); font-size:0.86rem;">${findBestCategory(p)}</strong>
              </div>
            </div>
          </div>
        `;
        })
        .join('');
    }

    const btnRematch = document.getElementById('btnRematch');
    if (btnRematch) {
      btnRematch.onclick = () => {
        soundEngine.playClick();
        modal.close();
        onRematch();
      };
    }

    const btnLobby = document.getElementById('btnVictoryLobby');
    if (btnLobby) {
      btnLobby.onclick = () => {
        soundEngine.playClick();
        modal.close();
        onBackLobby();
      };
    }

    modal.scrollTop = 0;
    modal.showModal();
  }

  public static close(): void {
    const modal = document.getElementById('victoryModal') as HTMLDialogElement | null;
    if (modal && modal.open) {
      modal.close();
    }
  }
}
