import { CATEGORIES, Category } from '../../types/category.types';
import { Player } from '../../types/player.types';
import { soundEngine } from '../../services/audio.service';

export class CrownModal {
  public static open(activePlayer: Player, onSelect: (category: Category) => void): void {
    const modal = document.getElementById('crownModal') as HTMLDialogElement | null;
    if (!modal) return;

    const descEl = document.getElementById('crownModalPlayerName');
    if (descEl) {
      descEl.textContent = `${activePlayer.name} ${activePlayer.avatar}, elige una categoría pendiente para disputar su corona. ¡Tus puntos acumulados activan el BONUS de intentos!`;
    }

    const grid = document.getElementById('crownCategoryGrid');
    if (grid) {
      grid.innerHTML = CATEGORIES.map((cat) => {
        const catState = activePlayer.categories[cat.key];
        const won = catState ? catState.won : false;
        const pts = catState ? catState.points : 0;
        const attempts = pts + 1;
        const bonusLabel = pts > 0 ? `🎁 Bonus: hasta ${attempts} intentos` : '1 intento';

        return `
          <button type="button"
                  class="crown-choice-btn"
                  data-cat="${cat.key}"
                  ${won ? 'disabled' : ''}
                  style="background: linear-gradient(145deg, ${cat.color}, ${cat.darkColor});">
            <img src="${cat.art}" alt="${cat.name}">
            <span>${cat.name}</span>
            <small style="opacity:0.95; font-size:0.78rem;">
              ${won ? '👑 Ya conquistada' : `${pts}/3 pts (${bonusLabel})`}
            </small>
          </button>
        `;
      }).join('');

      grid.querySelectorAll<HTMLButtonElement>('.crown-choice-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const catKey = btn.dataset.cat;
          const catObj = CATEGORIES.find((c) => c.key === catKey);
          if (!catObj) return;
          soundEngine.playClick();
          modal.close();
          onSelect(catObj);
        });
      });
    }

    modal.scrollTop = 0;
    modal.showModal();
  }

  public static close(): void {
    const modal = document.getElementById('crownModal') as HTMLDialogElement | null;
    if (modal && modal.open) {
      modal.close();
    }
  }
}
