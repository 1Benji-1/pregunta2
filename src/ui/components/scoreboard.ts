import { CATEGORIES } from '../../types/category.types';
import { Player } from '../../types/player.types';

export class ScoreboardComponent {
  public static render(players: [Player, Player], activeIndex: number): void {
    players.forEach((player, pIdx) => {
      const card = document.getElementById(`scoreboardP${pIdx + 1}`);
      const isTurn = pIdx === activeIndex;
      if (card) {
        card.classList.toggle('active-turn', isTurn);
      }

      const avatarEl = document.getElementById(`sbAvatarP${pIdx + 1}`);
      if (avatarEl) {
        avatarEl.textContent = player.avatar;
        avatarEl.style.background = player.color;
      }

      const nameEl = document.getElementById(`sbNameP${pIdx + 1}`);
      if (nameEl) nameEl.textContent = player.name;

      const turnPill = document.getElementById(`sbTurnPillP${pIdx + 1}`);
      if (turnPill) {
        turnPill.textContent = isTurn ? '⚡ JUGANDO AHORA' : 'EN ESPERA';
      }

      const crownsEl = document.getElementById(`sbCrownsP${pIdx + 1}`);
      if (crownsEl) {
        crownsEl.textContent = `${player.crowns} / 6`;
      }

      // Medallero de 6 coronas
      const medalsRack = document.getElementById(`sbMedalsP${pIdx + 1}`);
      if (medalsRack) {
        medalsRack.innerHTML = CATEGORIES.map((cat) => {
          const catState = player.categories[cat.key];
          return `
            <div class="medal-slot ${catState && catState.won ? 'won' : ''}"
                 title="${cat.name}: ${catState && catState.won ? '👑 Corona Conquistada' : 'Pendiente'}"
                 style="--cat-color: ${cat.color};">
              <img src="${cat.art}" alt="${cat.name}">
              ${catState && catState.won ? '<span class="medal-crown-badge">👑</span>' : ''}
            </div>
          `;
        }).join('');
      }

      // Barras de progreso de puntos (0 a 3)
      const barsContainer = document.getElementById(`sbBarsP${pIdx + 1}`);
      if (barsContainer) {
        barsContainer.innerHTML = CATEGORIES.map((cat) => {
          const catState = player.categories[cat.key];
          const pts = catState ? catState.points : 0;
          const isWon = catState ? catState.won : false;
          return `
            <div class="cat-progress-row ${isWon ? 'category-sealed' : ''}">
              <div class="cat-label">
                <span class="cat-dot" style="background: ${cat.color};"></span>
                <span class="cat-name">${cat.name}</span>
              </div>
              <div class="cat-pts-group">
                <span class="pts-pill ${pts >= 1 ? 'filled' : ''}">★</span>
                <span class="pts-pill ${pts >= 2 ? 'filled' : ''}">★</span>
                <span class="pts-pill ${pts >= 3 ? 'filled' : ''}">★</span>
                <span class="pts-count">${isWon ? '👑' : `${pts}/3`}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    });
  }
}
