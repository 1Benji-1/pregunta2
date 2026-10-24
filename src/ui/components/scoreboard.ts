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

      // Medallero de 6 personajes/categorías
      const medalsRack = document.getElementById(`sbMedalsP${pIdx + 1}`);
      if (medalsRack) {
        medalsRack.innerHTML = CATEGORIES.map((cat) => {
          const catState = player.categories[cat.key];
          const won = catState ? catState.won : false;
          const pts = catState ? catState.points : 0;
          return `
            <div class="medal-slot ${won ? 'won' : ''}"
                 style="${won ? `background: ${cat.lightColor}; border-color: ${cat.color};` : ''}"
                 title="${cat.name} (${cat.character}): ${won ? '¡Conquistada!' : `${pts}/3 puntos`}">
              <img src="${cat.art}" alt="${cat.name}">
            </div>
          `;
        }).join('');
      }

      // Barra de Comodines en el Scoreboard
      const comodinesEl = document.getElementById(`sbComodinesP${pIdx + 1}`);
      if (comodinesEl) {
        const c = player.comodines || { dobleOportunidad: 3, bomba: 3 };
        comodinesEl.innerHTML = `
          <div class="sb-comodin-item ${c.dobleOportunidad > 0 ? '' : 'exhausted'}"
               title="Doble Oportunidad: Permite un segundo intento si fallas la 1ª respuesta (${c.dobleOportunidad}/3 restantes en la partida)">
            <span class="sb-comodin-icon">✌️</span>
            <span class="sb-comodin-label">Doble Oportunidad</span>
            <span class="sb-comodin-badge">${c.dobleOportunidad}/3</span>
          </div>
          <div class="sb-comodin-item ${c.bomba > 0 ? '' : 'exhausted'}"
               title="Bomba 50:50: Descarta 2 opciones incorrectas (${c.bomba}/3 restantes en la partida)">
            <span class="sb-comodin-icon">💣</span>
            <span class="sb-comodin-label">Bomba 50:50</span>
            <span class="sb-comodin-badge">${c.bomba}/3</span>
          </div>
        `;
      }

      // Barra de puntos por categoría (0 a 3 + indicador de Bonus)
      const listEl = document.getElementById(`sbCatListP${pIdx + 1}`);
      if (listEl) {
        listEl.innerHTML = CATEGORIES.map((cat) => {
          const catState = player.categories[cat.key];
          const pts = catState ? catState.points : 0;
          const won = catState ? catState.won : false;

          let statusTagHtml = `<span class="cat-status-tag">${pts}/3</span>`;
          let subText = '0/3 pts · 1 intento en Corona';

          if (won) {
            statusTagHtml = `<span class="cat-status-tag won-tag">👑 GANADA</span>`;
            subText = catState && catState.wonByCrown ? 'Conquistada por Corona' : 'Conquistada (3/3 pts)';
          } else if (pts === 1) {
            statusTagHtml = `<span class="cat-status-tag bonus-tag">1/3 · Corona x2</span>`;
            subText = '🎁 Bonus Corona: hasta 2 intentos';
          } else if (pts === 2) {
            statusTagHtml = `<span class="cat-status-tag bonus-tag">2/3 · Corona x3</span>`;
            subText = '🎁 Bonus Corona: hasta 3 intentos';
          }

          const dotsHtml = [1, 2, 3]
            .map(
              (n) =>
                `<span class="point-dot ${pts >= n || won ? 'filled' : ''}" style="${
                  pts >= n || won ? `background: ${cat.color};` : ''
                }">★</span>`
            )
            .join('');

          return `
            <div class="cat-progress-row ${won ? 'won-row' : ''}" style="border-left-color: ${cat.color};">
              <div class="cat-row-left">
                <img class="cat-row-icon" src="${cat.art}" alt="${cat.name}">
                <div>
                  <div class="cat-row-title">${cat.name}</div>
                  <span class="cat-row-Sub">${subText}</span>
                </div>
              </div>
              <div class="cat-row-right">
                <div class="point-dots">${dotsHtml}</div>
                ${statusTagHtml}
              </div>
            </div>
          `;
        }).join('');
      }
    });
  }
}
