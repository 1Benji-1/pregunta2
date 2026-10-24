import { CATEGORIES, Category, CategoryKey, WHEEL_SLICES, WheelSlice } from '../types/category.types';
import { Difficulty } from '../types/question.types';
import { AVATARS } from '../types/player.types';
import { ActiveTurnContext, GameState } from '../types/game.types';
import { MultiplayerAction } from '../types/multiplayer.types';
import { StateManager } from './state';
import { deckManager } from './deck-manager';
import { GameRules } from './rules';
import { WheelPhysics } from '../wheel/wheel-physics';
import { wheelRenderer } from '../wheel/wheel-canvas';
import { soundEngine } from '../services/audio.service';
import { multiplayerService } from '../services/multiplayer.service';
import { StorageService } from '../services/storage.service';
import { ScoreboardComponent } from '../ui/components/scoreboard';
import { ScreenManager } from '../ui/screens/screen-manager';
import { QuestionModal } from '../ui/modals/question-modal';
import { CrownModal } from '../ui/modals/crown-modal';
import { VictoryModal } from '../ui/modals/victory-modal';
import { countdownTimer } from '../ui/components/countdown-timer';

export class GameEngine {
  public state: GameState | null = null;
  public wheelAngle: number = 0;
  public isSpinning: boolean = false;
  public hasSpunThisTurn: boolean = false;
  public activeTurnContext: ActiveTurnContext | null = null;

  public isOnline: boolean = false;
  public myPlayerIndex: number = 0;

  constructor() {}

  public async init(): Promise<void> {
    await deckManager.loadCards();
    await wheelRenderer.preloadImages();
    this.drawWheel();
    this.checkSavedMatch();
  }

  public getActivePlayer() {
    if (!this.state) throw new Error('No hay partida activa');
    return this.state.players[this.state.currentPlayerIndex];
  }

  public isMyTurn(): boolean {
    if (!this.isOnline) return true;
    return this.myPlayerIndex === (this.state ? this.state.currentPlayerIndex : 0);
  }

  public isReader(): boolean {
    if (!this.isOnline) return false;
    return this.myPlayerIndex !== (this.state ? this.state.currentPlayerIndex : 0);
  }

  public drawWheel(): void {
    const canvas = document.getElementById('wheelCanvas') as HTMLCanvasElement | null;
    wheelRenderer.draw(canvas, this.wheelAngle);
  }

  public startMatch(
    p1: { name: string; avatarIdx: number },
    p2: { name: string; avatarIdx: number },
    difficulty: Difficulty
  ): void {
    this.hasSpunThisTurn = false;
    this.isOnline = false;
    this.myPlayerIndex = 0;
    countdownTimer.stop();

    const decks = deckManager.buildDecks(difficulty);
    this.state = StateManager.createInitialState(
      { name: p1.name, avatar: AVATARS[p1.avatarIdx] },
      { name: p2.name, avatar: AVATARS[p2.avatarIdx] },
      difficulty,
      decks
    );

    StorageService.saveMatch(this.state);
    ScreenManager.showScreen('boardScreen');
    this.renderBoard();
    this.drawWheel();
    const activePlayer = this.getActivePlayer();
    this.setWheelStatus(`🎯 ¡Partida iniciada! Es el turno de ${activePlayer.name} ${activePlayer.avatar}. ¡Pulsa [GIRAR] en la ruleta!`);
  }

  public resumeMatch(savedState: GameState): void {
    this.hasSpunThisTurn = false;
    this.isOnline = false;
    this.state = StateManager.sanitize(savedState);
    if (!this.state) return;

    ScreenManager.showScreen('boardScreen');
    this.renderBoard();
    this.drawWheel();
    const activePlayer = this.getActivePlayer();
    this.setWheelStatus(`🔄 Partida reanudada. Es el turno de ${activePlayer.name} ${activePlayer.avatar}. ¡Gira la ruleta!`);
  }

  public checkSavedMatch(): void {
    const saved = StorageService.loadMatch();
    const banner = document.getElementById('resumeBanner');
    if (saved && banner) {
      const p1 = saved.players[0];
      const p2 = saved.players[1];
      const textEl = document.getElementById('resumeSummaryText');
      if (textEl) {
        textEl.textContent = `Partida en curso: ${p1.name} (${p1.crowns}/6 👑) vs ${p2.name} (${p2.crowns}/6 👑) — Turno #${saved.turnNumber}`;
      }
      banner.style.display = 'flex';
    }
  }

  public setWheelStatus(htmlMessage: string, isAlert: boolean = false): void {
    const el = document.getElementById('wheelStatusBox');
    if (!el) return;
    el.innerHTML = htmlMessage;
    el.classList.toggle('respin-alert', isAlert);
  }

  public renderBoard(): void {
    if (!this.state) return;

    const diffLabels: Record<string, string> = {
      facil: '🟢 Fácil',
      media: '🟡 Media',
      dificil: '🔴 Difícil',
      mixta: '🎲 Mixta'
    };
    const navDiff = document.getElementById('navDifficultyBadge');
    if (navDiff) navDiff.textContent = `Dificultad: ${diffLabels[this.state.difficulty] || 'Media'}`;

    const navTurn = document.getElementById('navTurnBadge');
    if (navTurn) navTurn.textContent = `Ronda / Turno #${this.state.turnNumber}`;

    const activeIdx = this.state.currentPlayerIndex;
    const activePlayer = this.state.players[activeIdx];

    // Navbar online status
    const navOnline = document.getElementById('navOnlineBadge');
    if (navOnline) {
      if (this.isOnline && multiplayerService.roomCode) {
        navOnline.style.display = 'inline-flex';
        const codeEl = document.getElementById('navOnlineRoomCode');
        if (codeEl) codeEl.textContent = multiplayerService.roomCode;
        const myPlayer = this.state.players[this.myPlayerIndex];
        const roleText = this.myPlayerIndex === 0 ? 'J1 (Anfitrión)' : 'J2 (Invitado)';
        const roleEl = document.getElementById('navOnlineRole');
        if (roleEl) roleEl.textContent = `Tú: ${myPlayer ? myPlayer.name : ''} · ${roleText}`;
      } else {
        navOnline.style.display = 'none';
      }
    }

    const turnAvatar = document.getElementById('turnBannerAvatar');
    if (turnAvatar) {
      turnAvatar.textContent = activePlayer.avatar;
      turnAvatar.style.background = activePlayer.color;
    }

    const spinBtn = document.getElementById('btnSpinWheel') as HTMLButtonElement | null;
    const shouldDisableSpin = this.isSpinning || this.hasSpunThisTurn || !!this.activeTurnContext;

    const bannerName = document.getElementById('turnBannerName');
    if (this.isOnline) {
      if (this.isMyTurn()) {
        if (bannerName) bannerName.textContent = `¡ES TU TURNO, ${activePlayer.name.toUpperCase()}!`;
        if (spinBtn) spinBtn.disabled = shouldDisableSpin;
      } else {
        if (bannerName) bannerName.textContent = `TURNO DE: ${activePlayer.name.toUpperCase()} (Esperando su tirada...)`;
        if (spinBtn) spinBtn.disabled = true;
      }
    } else {
      if (bannerName) bannerName.textContent = `TURNO DE: ${activePlayer.name.toUpperCase()}`;
      if (spinBtn) spinBtn.disabled = shouldDisableSpin;
    }

    ScoreboardComponent.render(this.state.players, activeIdx);
  }

  public spinWheel(forcedSliceIndex: number | null = null, isAutoRespin: boolean = false, fromRemote: boolean = false): void {
    if (this.isSpinning || !this.state || this.state.finished) return;
    if (this.hasSpunThisTurn && !isAutoRespin) return;
    if (this.activeTurnContext) return;
    if (this.isOnline && !fromRemote && !this.isMyTurn()) return;

    if (!isAutoRespin) {
      this.hasSpunThisTurn = true;
    }
    this.isSpinning = true;
    const spinBtn = document.getElementById('btnSpinWheel') as HTMLButtonElement | null;
    if (spinBtn) spinBtn.disabled = true;

    const numSlices = WHEEL_SLICES.length;
    const activePlayer = this.getActivePlayer();

    let targetSliceIdx: number;
    if (typeof forcedSliceIndex === 'number') {
      targetSliceIdx = forcedSliceIndex;
    } else if (isAutoRespin) {
      const validIndices = WHEEL_SLICES.map((s, idx) => ({ s, idx })).filter(
        (item) => item.s.isCrown || !activePlayer.categories[item.s.key].won
      );
      const chosen = validIndices[Math.floor(Math.random() * validIndices.length)];
      targetSliceIdx = chosen.idx;
    } else {
      targetSliceIdx = Math.floor(Math.random() * numSlices);
    }

    if (this.isOnline && !fromRemote) {
      multiplayerService.sendAction('SPIN', {
        targetSliceIdx,
        isAutoRespin
      });
    }

    const { totalRotation, duration } = WheelPhysics.calculateSpinDelta(this.wheelAngle, targetSliceIdx, isAutoRespin);
    const startAngle = this.wheelAngle;
    const startTime = performance.now();
    let lastSliceUnderPointer = WheelPhysics.getSliceIndexAtPointer(startAngle);
    const pointerEl = document.getElementById('wheelPointer');

    if (!isAutoRespin) {
      this.setWheelStatus(`🎡 Girando la ruleta para <strong>${activePlayer.name}</strong>...`);
    }

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = WheelPhysics.easeOutQuart(progress);

      this.wheelAngle = startAngle + totalRotation * eased;
      this.drawWheel();

      const currentSlice = WheelPhysics.getSliceIndexAtPointer(this.wheelAngle);
      if (currentSlice !== lastSliceUnderPointer) {
        lastSliceUnderPointer = currentSlice;
        soundEngine.playWheelTick(1 - progress);
        if (pointerEl) {
          pointerEl.classList.add('tick-bounce');
          setTimeout(() => pointerEl.classList.remove('tick-bounce'), 55);
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        if (spinBtn) spinBtn.disabled = true; // Permanece bloqueado durante la pregunta
        const landedSlice = WHEEL_SLICES[targetSliceIdx];
        this.onWheelStopped(landedSlice);
      }
    };

    requestAnimationFrame(animate);
  }

  public onWheelStopped(landedSlice: WheelSlice): void {
    const activePlayer = this.getActivePlayer();

    if (landedSlice.isCrown) {
      soundEngine.playCrownLand();
      if (this.isOnline && !this.isMyTurn()) {
        this.setWheelStatus(
          `👑 ¡CASILLA DE CORONA! <strong>${activePlayer.name}</strong> está eligiendo qué categoría disputar...`
        );
        return;
      }
      this.setWheelStatus(
        `👑 ¡CASILLA DE CORONA! <strong>${activePlayer.name}</strong> elige qué categoría disputar. ¡Tus puntos acumulados activan el BONUS!`
      );
      setTimeout(() => {
        CrownModal.open(activePlayer, (selectedCat) => {
          if (!this.state) return;
          const card = deckManager.drawCard(this.state, selectedCat.key);
          if (!card) return;
          if (this.isOnline) {
            multiplayerService.sendAction('CROWN_CHOSEN', {
              categoryKey: selectedCat.key,
              card
            });
          }
          this.startCategoryTurn(selectedCat, true, card);
        });
      }, 550);
      return;
    }

    const playerCatState = activePlayer.categories[landedSlice.key];
    if (playerCatState && playerCatState.won) {
      soundEngine.playReSpinAlert();
      this.setWheelStatus(
        `ℹ️ ¡Ya tienes la corona de <strong>${landedSlice.name}</strong>! La ruleta vuelve a girar automáticamente...`,
        true
      );
      setTimeout(() => {
        if (!this.isOnline || this.isMyTurn()) {
          this.spinWheel(null, true);
        }
      }, 1500);
      return;
    }

    soundEngine.playCategoryLand();
    const prevPoints = playerCatState ? playerCatState.points : 0;
    this.setWheelStatus(
      `🎯 Cayó en <strong>${landedSlice.name}</strong> (${landedSlice.character}). ` +
        `Tienes ${prevPoints}/3 puntos. ¡Responde la pregunta para sumar +1 punto!`
    );

    setTimeout(() => {
      if (!this.isOnline || this.isMyTurn()) {
        const catObj = CATEGORIES.find((c) => c.key === landedSlice.key);
        if (catObj) {
          this.startCategoryTurn(catObj, false);
        }
      }
    }, 650);
  }

  public startCategoryTurn(categoryObj: Category, isCrownChallenge: boolean = false, providedCard: any = null): void {
    if (!this.state) return;
    StateManager.sanitize(this.state);

    const activePlayer = this.getActivePlayer();
    const readerPlayer = this.state.players[(this.state.currentPlayerIndex + 1) % 2];
    const catState = activePlayer.categories[categoryObj.key];
    const card = providedCard || deckManager.drawCard(this.state, categoryObj.key);
    if (!card) return;

    if (this.isOnline && this.isMyTurn() && !providedCard) {
      multiplayerService.sendAction('START_QUESTION', {
        categoryKey: categoryObj.key,
        card,
        isCrownChallenge
      });
    }

    const maxAttempts = GameRules.calculateMaxAttempts(isCrownChallenge, catState ? catState.points : 0);

    this.activeTurnContext = {
      category: categoryObj,
      card,
      isCrownChallenge,
      maxAttempts,
      currentAttemptIndex: 0,
      answered: false,
      readerPlayer
    };

    QuestionModal.renderAttempt(
      this.activeTurnContext,
      activePlayer,
      readerPlayer,
      this.isOnline,
      this.isMyTurn(),
      this.getQuestionModalCallbacks()
    );

    QuestionModal.open();
  }

  private getQuestionModalCallbacks() {
    return {
      onOptionSelected: (idx: number) => {
        if (this.isOnline) {
          if (this.isMyTurn()) return;
          multiplayerService.sendAction('SUBMIT_ANSWER', { selectedIndex: idx });
        }
        this.submitAnswer(idx);
      },
      onUseComodinDoble: () => this.useComodinDoble(),
      onUseComodinBomba: () => this.useComodinBomba(),
      onAdvanceTurn: () => this.advanceToNextTurn(),
      onAdvanceBonus: () => this.advanceToNextBonusAttempt(),
      onShowVictory: () => {
        QuestionModal.close();
        if (this.state) {
          VictoryModal.open(
            this.state,
            () => this.rematch(),
            () => {
              StorageService.clearMatch();
              ScreenManager.showScreen('lobbyScreen');
            }
          );
        }
      }
    };
  }

  public submitAnswer(selectedIndex: number, _fromRemote: boolean = false): void {
    const ctx = this.activeTurnContext;
    if (!ctx || ctx.answered || !this.state) return;

    const activePlayer = this.getActivePlayer();
    const cat = ctx.category;
    const questionObj = ctx.card.preguntas[ctx.currentAttemptIndex] || ctx.card.preguntas[0];
    const correctIndex = questionObj.respuesta_correcta;
    const isCorrect = selectedIndex === correctIndex;

    // Comodín Doble Oportunidad activo en primer fallo
    if (!isCorrect && ctx.dobleOportunidadActiva) {
      ctx.dobleOportunidadActiva = false;
      ctx.failedOptions = ctx.failedOptions || new Set();
      ctx.failedOptions.add(selectedIndex);
      soundEngine.playSecondChance();

      const optionButtons = document.querySelectorAll<HTMLButtonElement>('#qOptionsList .option-btn');
      const failedBtn = optionButtons[selectedIndex];
      if (failedBtn) {
        failedBtn.disabled = true;
        failedBtn.classList.add('first-attempt-failed');
        const badge = document.createElement('span');
        badge.className = 'first-fail-tag';
        badge.textContent = '❌ 1º INTENTO FALLIDO';
        failedBtn.appendChild(badge);
      }

      QuestionModal.updateComodinesUI(ctx, activePlayer);
      const statusMsg = document.getElementById('qComodinStatusMsg');
      if (statusMsg) {
        statusMsg.className = 'comodin-status-msg warning';
        statusMsg.textContent = `⚠️ ¡Opción incorrecta! Tu comodín te otorga tu 2ª y última oportunidad: ${activePlayer.name}, ¡elige otra respuesta!`;
        statusMsg.style.display = 'block';
      }
      return;
    }

    ctx.answered = true;
    QuestionModal.updateComodinesUI(ctx, activePlayer);
    activePlayer.totalQuestions += 1;
    activePlayer.categories[cat.key].attemptCount += 1;

    let headline = '';
    let detail = '';

    if (isCorrect) {
      const res = GameRules.applyCorrectAnswer(activePlayer, cat.key, ctx.isCrownChallenge, ctx.currentAttemptIndex);
      headline = res.headline;
      detail = res.detail;
      if (res.wonCrown) {
        soundEngine.playCategoryWin();
      } else {
        soundEngine.playCorrect();
      }
    } else {
      soundEngine.playWrong();
      detail = ctx.isCrownChallenge
        ? `No ganas la corona en este turno, pero conservas tus puntos en ${cat.name}.`
        : `No sumas puntos en este turno.`;
    }

    StorageService.saveMatch(this.state);
    this.renderBoard();

    const isVictory = isCorrect && GameRules.checkVictory(this.state);
    if (isVictory) {
      StorageService.saveMatch(this.state);
    }

    const hasBonusRemaining = !isCorrect && ctx.isCrownChallenge && ctx.currentAttemptIndex + 1 < ctx.maxAttempts;

    QuestionModal.showResolution(
      ctx,
      selectedIndex,
      isCorrect,
      headline,
      detail,
      this.isOnline,
      this.isMyTurn(),
      isVictory,
      hasBonusRemaining,
      ctx.currentAttemptIndex + 2,
      this.getQuestionModalCallbacks()
    );
  }

  public advanceToNextTurn(targetPlayerIndex: number | null = null, targetTurnNumber: number | null = null, fromRemote: boolean = false): void {
    countdownTimer.stop();
    QuestionModal.close();
    if (!this.state) return;

    const { nextPlayerIndex, nextTurnNumber } = GameRules.computeNextTurn(this.state, targetPlayerIndex, targetTurnNumber);

    if (fromRemote && this.state.turnNumber >= nextTurnNumber && this.state.currentPlayerIndex === nextPlayerIndex) {
      return;
    }

    this.state.turnNumber = nextTurnNumber;
    this.state.currentPlayerIndex = nextPlayerIndex;
    this.hasSpunThisTurn = false;
    this.activeTurnContext = null;

    StorageService.saveMatch(this.state);

    if (this.isOnline) {
      if (!fromRemote) {
        multiplayerService.sendAction('NEXT_TURN', {
          nextPlayerIndex: this.state.currentPlayerIndex,
          nextTurnNumber: this.state.turnNumber
        });
      }
      if (this.myPlayerIndex === 0) {
        multiplayerService.syncGameState(this.state);
      }
    }

    this.renderBoard();
    const activePlayer = this.getActivePlayer();

    if (this.isOnline) {
      if (this.isMyTurn()) {
        this.setWheelStatus(`🎯 ¡Es tu turno, <strong>${activePlayer.name} ${activePlayer.avatar}</strong>! Pulsa [GIRAR] en la ruleta.`);
      } else {
        this.setWheelStatus(`⏳ Es el turno de <strong>${activePlayer.name} ${activePlayer.avatar}</strong>. Esperando su tirada...`);
      }
    } else {
      this.setWheelStatus(`🎲 Turno de <strong>${activePlayer.name} ${activePlayer.avatar}</strong>. ¡Pulsa [GIRAR] en la ruleta!`);
    }

    const spinBtn = document.getElementById('btnSpinWheel') as HTMLButtonElement | null;
    if (spinBtn) {
      spinBtn.disabled = this.isOnline && !this.isMyTurn();
    }
  }

  public advanceToNextBonusAttempt(fromRemote: boolean = false): void {
    countdownTimer.stop();
    const ctx = this.activeTurnContext;
    if (!ctx || !this.state) return;

    if (this.isOnline && !fromRemote) {
      multiplayerService.sendAction('NEXT_BONUS', {
        nextAttemptIndex: ctx.currentAttemptIndex + 1
      });
    }

    ctx.currentAttemptIndex += 1;
    ctx.answered = false;
    ctx.failedOptions = null;
    ctx.dobleOportunidadActiva = false;

    const activePlayer = this.getActivePlayer();
    QuestionModal.renderAttempt(
      ctx,
      activePlayer,
      ctx.readerPlayer,
      this.isOnline,
      this.isMyTurn(),
      this.getQuestionModalCallbacks()
    );
  }

  public useComodinDoble(): void {
    const ctx = this.activeTurnContext;
    if (!ctx || ctx.answered || ctx.dobleOportunidadUsada || !this.state) return;
    const activePlayer = this.getActivePlayer();
    if (!activePlayer.comodines || activePlayer.comodines.dobleOportunidad <= 0) return;

    activePlayer.comodines.dobleOportunidad -= 1;
    ctx.dobleOportunidadActiva = true;
    ctx.dobleOportunidadUsada = true;

    soundEngine.playPowerUp();
    QuestionModal.updateComodinesUI(ctx, activePlayer);

    if (this.isOnline) {
      multiplayerService.sendAction('USE_COMODIN', { type: 'doble' });
    }

    const statusMsg = document.getElementById('qComodinStatusMsg');
    if (statusMsg) {
      statusMsg.className = 'comodin-status-msg';
      statusMsg.textContent = `✨ ¡Comodín Doble Oportunidad activado para ${activePlayer.name}! Si fallas en tu primera opción, tendrás una 2ª oportunidad.`;
      statusMsg.style.display = 'block';
    }

    StorageService.saveMatch(this.state);
    this.renderBoard();
  }

  public useComodinBomba(): void {
    const ctx = this.activeTurnContext;
    if (!ctx || ctx.answered || ctx.bombaUsada || !this.state) return;
    const activePlayer = this.getActivePlayer();
    if (!activePlayer.comodines || activePlayer.comodines.bomba <= 0) return;

    const questionObj = ctx.card.preguntas[ctx.currentAttemptIndex] || ctx.card.preguntas[0];
    const correctIdx = questionObj.respuesta_correcta;

    const availableIncorrect = [0, 1, 2, 3].filter(
      (idx) => idx !== correctIdx && (!ctx.failedOptions || !ctx.failedOptions.has(idx))
    );

    if (availableIncorrect.length < 2) return;

    activePlayer.comodines.bomba -= 1;
    ctx.bombaUsada = true;

    const shuffled = [...availableIncorrect].sort(() => Math.random() - 0.5);
    const toEliminate = shuffled.slice(0, 2);

    ctx.eliminatedOptions = ctx.eliminatedOptions || new Set();
    toEliminate.forEach((idx) => ctx.eliminatedOptions!.add(idx));

    soundEngine.playBomb();

    if (this.isOnline) {
      multiplayerService.sendAction('USE_COMODIN', {
        type: 'bomba',
        eliminatedIndices: toEliminate
      });
    }

    const optionButtons = document.querySelectorAll<HTMLButtonElement>('#qOptionsList .option-btn');
    toEliminate.forEach((idx) => {
      const btn = optionButtons[idx];
      if (btn) {
        btn.disabled = true;
        btn.classList.add('bomb-eliminated');
        const badge = document.createElement('span');
        badge.className = 'bomb-tag';
        badge.textContent = '💥 DESCARTADA';
        btn.appendChild(badge);
      }
    });

    QuestionModal.updateComodinesUI(ctx, activePlayer);

    const statusMsg = document.getElementById('qComodinStatusMsg');
    if (statusMsg) {
      statusMsg.className = 'comodin-status-msg';
      statusMsg.textContent = `💣 ¡Bomba 50:50 detonada! Se descartaron 2 opciones falsas.`;
      statusMsg.style.display = 'block';
    }

    StorageService.saveMatch(this.state);
    this.renderBoard();
  }

  public handleRemoteAction(action: MultiplayerAction): void {
    if (action.fromIndex === this.myPlayerIndex) return;

    switch (action.type) {
      case 'SPIN':
        this.hasSpunThisTurn = true;
        this.spinWheel(action.payload.targetSliceIdx, action.payload.isAutoRespin, true);
        break;

      case 'CROWN_CHOSEN': {
        const catObj = CATEGORIES.find((c) => c.key === action.payload.categoryKey);
        if (catObj) {
          CrownModal.close();
          this.startCategoryTurn(catObj, true, action.payload.card);
        }
        break;
      }

      case 'START_QUESTION': {
        const questionCat = CATEGORIES.find((c) => c.key === action.payload.categoryKey);
        if (questionCat) {
          this.startCategoryTurn(questionCat, action.payload.isCrownChallenge, action.payload.card);
        }
        break;
      }

      case 'USE_COMODIN': {
        const ctx = this.activeTurnContext;
        if (!ctx || !this.state) return;
        const activePlayer = this.getActivePlayer();

        if (action.payload.type === 'doble') {
          if (activePlayer.comodines) activePlayer.comodines.dobleOportunidad -= 1;
          ctx.dobleOportunidadActiva = true;
          ctx.dobleOportunidadUsada = true;
          soundEngine.playPowerUp();
          QuestionModal.updateComodinesUI(ctx, activePlayer);
        } else if (action.payload.type === 'bomba') {
          if (activePlayer.comodines) activePlayer.comodines.bomba -= 1;
          ctx.bombaUsada = true;
          ctx.eliminatedOptions = new Set(action.payload.eliminatedIndices);
          soundEngine.playBomb();
          const optionButtons = document.querySelectorAll<HTMLButtonElement>('#qOptionsList .option-btn');
          action.payload.eliminatedIndices.forEach((idx) => {
            const btn = optionButtons[idx];
            if (btn) {
              btn.disabled = true;
              btn.classList.add('bomb-eliminated');
            }
          });
          QuestionModal.updateComodinesUI(ctx, activePlayer);
        }
        this.renderBoard();
        break;
      }

      case 'SUBMIT_ANSWER':
        this.submitAnswer(action.payload.selectedIndex, true);
        break;

      case 'NEXT_TURN':
        this.advanceToNextTurn(action.payload.nextPlayerIndex, action.payload.nextTurnNumber, true);
        break;

      case 'NEXT_BONUS':
        this.advanceToNextBonusAttempt(true);
        break;
    }
  }

  public rematch(): void {
    if (!this.state) return;
    const p1 = this.state.players[0];
    const p2 = this.state.players[1];
    const p1AvIdx = Math.max(0, AVATARS.findIndex((a) => a.emoji === p1.avatar));
    const p2AvIdx = Math.max(0, AVATARS.findIndex((a) => a.emoji === p2.avatar));
    this.startMatch({ name: p1.name, avatarIdx: p1AvIdx }, { name: p2.name, avatarIdx: p2AvIdx }, this.state.difficulty);
  }
}

export const gameEngine = new GameEngine();
