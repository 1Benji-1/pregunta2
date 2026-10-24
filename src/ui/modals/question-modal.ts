import { ActiveTurnContext } from '../../types/game.types';
import { Player } from '../../types/player.types';
import { countdownTimer } from '../components/countdown-timer';
import { soundEngine } from '../../services/audio.service';
import { multiplayerService } from '../../services/multiplayer.service';

export interface QuestionModalCallbacks {
  onOptionSelected: (index: number) => void;
  onUseComodinDoble: () => void;
  onUseComodinBomba: () => void;
  onAdvanceTurn: () => void;
  onAdvanceBonus: () => void;
  onShowVictory: () => void;
}

export class QuestionModal {
  public static open(): void {
    const modal = document.getElementById('questionModal') as HTMLDialogElement | null;
    if (modal && !modal.open) {
      modal.scrollTop = 0;
      modal.showModal();
    }
  }

  public static close(): void {
    countdownTimer.stop();
    const modal = document.getElementById('questionModal') as HTMLDialogElement | null;
    if (modal && modal.open) {
      modal.close();
    }
  }

  public static renderAttempt(
    ctx: ActiveTurnContext,
    activePlayer: Player,
    readerPlayer: Player,
    isOnline: boolean,
    isMyTurn: boolean,
    callbacks: QuestionModalCallbacks
  ): void {
    countdownTimer.stop();
    const qModal = document.getElementById('questionModal') as HTMLDialogElement | null;
    if (qModal) qModal.scrollTop = 0;

    const cat = ctx.category;
    const questionObj = ctx.card.preguntas[ctx.currentAttemptIndex] || ctx.card.preguntas[0];
    const attemptNumber = ctx.currentAttemptIndex + 1;

    // Header temático
    const header = document.getElementById('qModalHeader');
    if (header) {
      header.style.background = `linear-gradient(135deg, ${cat.color}, ${cat.darkColor})`;
    }

    const artEl = document.getElementById('qModalArt') as HTMLImageElement | null;
    if (artEl) {
      artEl.src = cat.art;
      artEl.alt = cat.name;
    }

    const catTitle = document.getElementById('qModalCatTitle');
    if (catTitle) catTitle.textContent = `${cat.name} · ${cat.character}`;

    const cardId = document.getElementById('qModalCardId');
    if (cardId) cardId.textContent = `Carta: ${ctx.card.carta_id}`;

    // Lector y roles
    const readerBadge = document.getElementById('qReaderPlayerBadge');
    if (readerBadge) readerBadge.textContent = `${readerPlayer.name} ${readerPlayer.avatar}`;

    const readerSpan = document.getElementById('qReaderNameSpan');
    if (readerSpan) readerSpan.textContent = readerPlayer.name;

    const responderSpan = document.getElementById('qResponderNameSpan');
    if (responderSpan) responderSpan.textContent = activePlayer.name;

    const comodinesPlayerName = document.getElementById('qComodinesPlayerName');
    if (comodinesPlayerName) comodinesPlayerName.textContent = activePlayer.name;

    const comodinStatusMsg = document.getElementById('qComodinStatusMsg');
    if (comodinStatusMsg) {
      comodinStatusMsg.style.display = 'none';
      comodinStatusMsg.className = 'comodin-status-msg';
      comodinStatusMsg.textContent = '';
    }

    this.updateComodinesUI(ctx, activePlayer);

    // Pantalla de privacidad según Online o Local
    const shieldEl = document.getElementById('qPrivacyShield');
    const contentEl = document.getElementById('qCardInteractiveContent');

    if (isOnline) {
      if (isMyTurn) {
        // El jugador que responde ve pantalla de espera
        if (shieldEl) shieldEl.style.display = 'flex';
        if (contentEl) contentEl.style.display = 'none';

        const titleEl = document.querySelector('.privacy-shield-title');
        if (titleEl) titleEl.textContent = '🎧 ¡Tu rival tiene tu carta!';

        const warnEl = document.querySelector('.privacy-shield-warning');
        if (warnEl) {
          warnEl.innerHTML = `
            📖 <strong>${readerPlayer.name} ${readerPlayer.avatar}</strong> tiene la pregunta en su pantalla.<br>
            Escucha atentamente su voz cuando te lea la pregunta y las 4 opciones.<br>
            Dile en voz alta cuál eliges (A, B, C o D) y él la marcará en su dispositivo.<br>
            <span style="display: block; margin-top: 10px; font-weight: 800; color: #ffd54f;">
              ✨ ¡La tarjeta se destapará en tu pantalla en cuanto registre tu respuesta!
            </span>
          `;
        }

        const revealBtn = document.getElementById('btnRevealCardToReader');
        if (revealBtn) revealBtn.style.display = 'none';
      } else {
        // El lector ve la pregunta para leérsela a su rival
        if (shieldEl) shieldEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';

        const instructEl = document.getElementById('qReaderInstructionBar');
        if (instructEl) {
          instructEl.style.background = '#1e293b';
          instructEl.innerHTML = `
            📢 <strong>${readerPlayer.name}</strong>, lee en voz alta para <strong>${activePlayer.name}</strong>.<br>
            La respuesta correcta está marcada en verde para ti. Cuando tu rival te diga su respuesta, haz clic en la opción elegida.
          `;
        }
      }
    } else {
      // Hotseat local
      if (shieldEl) shieldEl.style.display = 'flex';
      if (contentEl) contentEl.style.display = 'none';

      const revealBtn = document.getElementById('btnRevealCardToReader');
      if (revealBtn) revealBtn.style.display = 'inline-block';

      const titleEl = document.querySelector('.privacy-shield-title');
      if (titleEl) titleEl.textContent = '¡Pase de pantalla al lector!';

      const warnEl = document.querySelector('.privacy-shield-warning');
      if (warnEl) {
        warnEl.innerHTML = `
          ⚠️ <strong>${activePlayer.name}</strong> no debe mirar la pantalla para no ver la respuesta.<br>
          Entrega la pantalla a <strong>${readerPlayer.name}</strong> para leer la tarjeta.
        `;
      }
    }

    const privacyResp = document.getElementById('privacyResponderName');
    if (privacyResp) privacyResp.textContent = `${activePlayer.name} ${activePlayer.avatar}`;

    const privacyRead = document.getElementById('privacyReaderName');
    if (privacyRead) privacyRead.textContent = `${readerPlayer.name} ${readerPlayer.avatar}`;

    const revealBtn = document.getElementById('btnRevealCardToReader');
    if (revealBtn) {
      revealBtn.innerHTML = `👁️ SOY ${readerPlayer.name.toUpperCase()} ${readerPlayer.avatar}: MOSTRAR PREGUNTA`;
    }

    // Badge de Intento
    const attemptBadge = document.getElementById('qModalAttemptBadge');
    if (attemptBadge) {
      if (ctx.isCrownChallenge) {
        attemptBadge.textContent = ctx.maxAttempts > 1
          ? `👑 BONUS CORONA: Intento ${attemptNumber} de ${ctx.maxAttempts}`
          : '👑 DESAFÍO DE CORONA (1 Intento)';
        attemptBadge.className = 'q-meta-pill bonus-pill';
      } else {
        attemptBadge.textContent = 'Pregunta Normal · Intento 1 de 1';
        attemptBadge.className = 'q-meta-pill';
      }
    }

    // Banner explicativo de bonus
    const bonusBanner = document.getElementById('qBonusExplainer');
    if (bonusBanner) {
      if (ctx.isCrownChallenge) {
        bonusBanner.style.display = 'flex';
        const prevPts = activePlayer.categories[cat.key].points;
        bonusBanner.innerHTML = ctx.maxAttempts > 1
          ? `👑 🎁 <span><strong>¡Desafío de Corona con Bonus!</strong> Gracias a tus <strong>${prevPts}/3 puntos</strong> en ${cat.name}, dispones de <strong>hasta ${ctx.maxAttempts} preguntas</strong> para ganar la Corona.</span>`
          : `👑 <span><strong>¡Desafío de Corona!</strong> Tienes 0 puntos previos (1 intento). Si ${activePlayer.name} responde bien, conquista <strong>${cat.name}</strong> directamente.</span>`;
      } else {
        bonusBanner.style.display = 'none';
      }
    }

    // Enunciado
    const turnTag = document.getElementById('qTurnPlayerTag');
    if (turnTag) {
      turnTag.innerHTML = ctx.isCrownChallenge && ctx.maxAttempts > 1
        ? `👑 Responde: <strong>${activePlayer.name} ${activePlayer.avatar}</strong> — Desafío de Corona (Pregunta #${attemptNumber} de ${ctx.maxAttempts})`
        : ctx.isCrownChallenge
        ? `👑 Responde: <strong>${activePlayer.name} ${activePlayer.avatar}</strong> — Desafío de Corona (1 Intento)`
        : `🎯 Responde: <strong>${activePlayer.name} ${activePlayer.avatar}</strong> — Pregunta Normal (+1 punto)`;
    }

    const statementEl = document.getElementById('qStatementText');
    if (statementEl) statementEl.textContent = questionObj.enunciado;

    // Opciones
    const letters = ['A', 'B', 'C', 'D'];
    const optionsContainer = document.getElementById('qOptionsList');
    if (optionsContainer) {
      optionsContainer.innerHTML = '';
      questionObj.opciones.forEach((optText, idx) => {
        const isCorrectAnswer = idx === questionObj.respuesta_correcta;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `option-btn ${isCorrectAnswer ? 'has-correct-indicator' : ''}`;
        btn.innerHTML = `
          <span class="option-letter">${letters[idx]}</span>
          <span>${optText}</span>
          ${isCorrectAnswer ? '<span class="reader-correct-indicator">✓ CORRECTA</span>' : ''}
        `;
        btn.addEventListener('click', () => {
          if (isOnline && isMyTurn) return; // Solo el lector puede registrar en pantalla en partida online
          callbacks.onOptionSelected(idx);
        });
        optionsContainer.appendChild(btn);
      });
    }

    // Limpiar panel de feedback
    const fb = document.getElementById('qFeedbackPanel');
    if (fb) {
      fb.className = 'feedback-panel';
      fb.innerHTML = '';
    }
  }

  public static showResolution(
    ctx: ActiveTurnContext,
    selectedIndex: number,
    isCorrect: boolean,
    headline: string,
    detail: string,
    isOnline: boolean,
    isMyTurn: boolean,
    isVictory: boolean,
    hasBonusRemaining: boolean,
    nextAttemptNum: number,
    callbacks: QuestionModalCallbacks
  ): void {
    const shieldEl = document.getElementById('qPrivacyShield');
    const contentEl = document.getElementById('qCardInteractiveContent');
    if (shieldEl) shieldEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    const qModal = document.getElementById('questionModal') as HTMLDialogElement | null;
    if (qModal) qModal.scrollTop = 0;

    const activePlayer = ctx.readerPlayer ? (isMyTurn ? ctx.readerPlayer : null) : null;
    const questionObj = ctx.card.preguntas[ctx.currentAttemptIndex] || ctx.card.preguntas[0];
    const correctIndex = questionObj.respuesta_correcta;
    const letters = ['A', 'B', 'C', 'D'];

    // Ocultar barra superior de instrucción en la pantalla de resolución
    const instructEl = document.getElementById('qReaderInstructionBar');
    if (instructEl) {
      instructEl.style.display = 'none';
      instructEl.innerHTML = '';
    }

    // Marcar visualmente botones de opciones
    const optionButtons = document.querySelectorAll<HTMLButtonElement>('#qOptionsList .option-btn');
    optionButtons.forEach((btn, idx) => {
      btn.disabled = true;
      btn.classList.remove('has-correct-indicator');
      btn.querySelectorAll('.reader-correct-indicator, .answer-selected-badge, .answer-correct-badge').forEach((b) => b.remove());

      if (idx === selectedIndex) {
        if (isCorrect) {
          btn.classList.add('correct');
          const badge = document.createElement('span');
          badge.className = 'answer-selected-badge correct-badge';
          badge.textContent = '✓ CORRECTA';
          btn.appendChild(badge);
        } else {
          btn.classList.add('wrong');
          const badge = document.createElement('span');
          badge.className = 'answer-selected-badge wrong-badge';
          badge.textContent = '✗ MARCADA';
          btn.appendChild(badge);
        }
      } else if (idx === correctIndex && !isCorrect) {
        btn.classList.add('correct');
        const badge = document.createElement('span');
        badge.className = 'answer-correct-badge';
        badge.textContent = '✓ CORRECTA';
        btn.appendChild(badge);
      }
    });

    const fb = document.getElementById('qFeedbackPanel');
    if (!fb) return;

    if (isVictory) {
      countdownTimer.stop();
      fb.className = 'feedback-panel visible success';
      fb.innerHTML = `
        <div class="feedback-title">🏆 ${headline}</div>
        <p>${detail}</p>
        <button type="button" class="btn-3d btn-3d-orange" id="btnShowVictoryScreen">
          🏆 VER CORONACIÓN Y ESTADÍSTICAS
        </button>
      `;
      const btnWin = document.getElementById('btnShowVictoryScreen');
      if (btnWin) {
        btnWin.onclick = () => {
          this.close();
          callbacks.onShowVictory();
        };
      }
      return;
    }

    if (isCorrect) {
      fb.className = 'feedback-panel visible success';
      fb.innerHTML = `
        <div class="feedback-title">${headline}</div>
        <p>${detail}</p>
        <button type="button" class="btn-3d btn-3d-blue" id="btnFinishTurnSuccess">
          ➡️ CONTINUAR AHORA (5s)
        </button>
      `;
      const btnNext = document.getElementById('btnFinishTurnSuccess');
      if (btnNext) {
        btnNext.onclick = () => {
          soundEngine.playClick();
          countdownTimer.stop(fb);
          callbacks.onAdvanceTurn();
        };
      }
      countdownTimer.start(fb, 5, undefined, () => callbacks.onAdvanceTurn());
    } else {
      if (hasBonusRemaining) {
        fb.className = 'feedback-panel visible error';
        fb.innerHTML = `
          <div class="feedback-title">❌ ¡Fallaste este intento de Corona!</div>
          <p>La respuesta correcta era: <strong>${questionObj.opciones[correctIndex]}</strong>.<br>
             ¡Pero tus puntos previos activan tu <strong>BONUS DE CORONA</strong>! Tienes una <strong>OPORTUNIDAD #${nextAttemptNum}</strong>.</p>
          <button type="button" class="btn-3d btn-3d-orange" id="btnNextBonusAttempt">
            🎁 CONTINUAR AL BONUS #${nextAttemptNum} (5s)
          </button>
        `;
        const btnBonus = document.getElementById('btnNextBonusAttempt');
        if (btnBonus) {
          btnBonus.onclick = () => {
            soundEngine.playClick();
            countdownTimer.stop(fb);
            callbacks.onAdvanceBonus();
          };
        }
        countdownTimer.start(fb, 5, undefined, () => callbacks.onAdvanceBonus());
      } else {
        fb.className = 'feedback-panel visible error';
        fb.innerHTML = `
          <div class="feedback-title">❌ Respuesta incorrecta</div>
          <p>La respuesta correcta era: <strong>${questionObj.opciones[correctIndex]}</strong>.<br>${detail}</p>
          <button type="button" class="btn-3d btn-3d-blue" id="btnFinishTurnFail">
            ➡️ CONTINUAR AHORA (5s)
          </button>
        `;
        const btnFail = document.getElementById('btnFinishTurnFail');
        if (btnFail) {
          btnFail.onclick = () => {
            soundEngine.playClick();
            countdownTimer.stop(fb);
            callbacks.onAdvanceTurn();
          };
        }
        countdownTimer.start(fb, 5, undefined, () => callbacks.onAdvanceTurn());
      }
    }
  }

  public static updateComodinesUI(ctx: ActiveTurnContext, activePlayer: Player): void {
    const c = activePlayer.comodines || { dobleOportunidad: 3, bomba: 3 };
    const btnDoble = document.getElementById('btnComodinDoble') as HTMLButtonElement | null;
    const badgeDoble = document.getElementById('qCountDoble');
    const btnBomba = document.getElementById('btnComodinBomba') as HTMLButtonElement | null;
    const badgeBomba = document.getElementById('qCountBomba');

    if (badgeDoble) badgeDoble.textContent = `${c.dobleOportunidad} / 3`;
    if (badgeBomba) badgeBomba.textContent = `${c.bomba} / 3`;

    if (btnDoble) {
      if (ctx.dobleOportunidadActiva) {
        btnDoble.className = 'btn-comodin active';
        btnDoble.disabled = true;
      } else if (ctx.dobleOportunidadUsada || c.dobleOportunidad <= 0 || ctx.answered) {
        btnDoble.className = 'btn-comodin used';
        btnDoble.disabled = true;
      } else {
        btnDoble.className = 'btn-comodin';
        btnDoble.disabled = false;
      }
    }

    if (btnBomba) {
      if (ctx.bombaUsada || c.bomba <= 0 || ctx.answered) {
        btnBomba.className = 'btn-comodin used';
        btnBomba.disabled = true;
      } else {
        btnBomba.className = 'btn-comodin';
        btnBomba.disabled = false;
      }
    }
  }
}
