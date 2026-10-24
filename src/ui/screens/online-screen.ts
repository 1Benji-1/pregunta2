import { AVATARS } from '../../types/player.types';
import { Difficulty } from '../../types/question.types';
import { soundEngine } from '../../services/audio.service';
import { multiplayerService } from '../../services/multiplayer.service';
import { gameEngine } from '../../core/game-engine';
import { StateManager } from '../../core/state';
import { deckManager } from '../../core/deck-manager';
import { ScreenManager } from './screen-manager';

export class OnlineScreen {
  private selectedAvatarOnline: number = 0;

  public init(): void {
    this.setupAvatarPicker();
    this.setupActionButtons();
    this.checkUrlRoomCode();
  }

  private setupAvatarPicker(): void {
    const avatarContainer = document.getElementById('avatarPickerOnline');
    if (!avatarContainer) return;
    avatarContainer.innerHTML = '';

    AVATARS.forEach((av, avIdx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `avatar-option ${this.selectedAvatarOnline === avIdx ? 'selected' : ''}`;
      btn.title = av.label;
      btn.textContent = av.emoji;
      btn.addEventListener('click', () => {
        soundEngine.playClick();
        this.selectedAvatarOnline = avIdx;
        this.updateAvatarPreview();
      });
      avatarContainer.appendChild(btn);
    });
    this.updateAvatarPreview();
  }

  private updateAvatarPreview(): void {
    const av = AVATARS[this.selectedAvatarOnline];
    const preview = document.getElementById('previewAvatarOnline');
    if (preview) {
      preview.textContent = av.emoji;
      preview.style.background = av.bg;
    }
    const container = document.getElementById('avatarPickerOnline');
    if (container) {
      Array.from(container.children).forEach((btn, idx) => {
        btn.classList.toggle('selected', idx === this.selectedAvatarOnline);
      });
    }
  }

  private setupActionButtons(): void {
    // Crear sala
    const btnCreate = document.getElementById('btnCreateOnlineRoom') as HTMLButtonElement | null;
    if (btnCreate) {
      btnCreate.addEventListener('click', async () => {
        soundEngine.playClick();
        await this.handleCreateRoom();
      });
    }

    // Unirse a sala
    const btnJoin = document.getElementById('btnJoinOnlineRoom') as HTMLButtonElement | null;
    if (btnJoin) {
      btnJoin.addEventListener('click', async () => {
        soundEngine.playClick();
        await this.handleJoinRoom();
      });
    }

    // Copiar código
    const btnCopyCode = document.getElementById('btnCopyRoomCode');
    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', () => {
        const codeEl = document.getElementById('displayRoomCode');
        const code = codeEl ? codeEl.textContent?.trim() || '' : '';
        navigator.clipboard.writeText(code).then(() => {
          btnCopyCode.textContent = '✅ ¡Copiado!';
          setTimeout(() => (btnCopyCode.textContent = '📋 Copiar Código'), 2000);
        });
      });
    }

    // Copiar enlace directo
    const btnCopyLink = document.getElementById('btnCopyRoomLink');
    if (btnCopyLink) {
      btnCopyLink.addEventListener('click', () => {
        const codeEl = document.getElementById('displayRoomCode');
        const code = codeEl ? codeEl.textContent?.trim() || '' : '';
        const url = `${window.location.origin}${window.location.pathname}?sala=${code}`;
        navigator.clipboard.writeText(url).then(() => {
          btnCopyLink.textContent = '✅ ¡Enlace Copiado!';
          setTimeout(() => (btnCopyLink.textContent = '🔗 Copiar Enlace Directo'), 2000);
        });
      });
    }

    // Cancelar sala de espera
    const btnCancel = document.getElementById('btnCancelWaitingRoom');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        soundEngine.playClick();
        multiplayerService.leaveRoom();
        const waitCard = document.getElementById('onlineWaitingCard');
        if (waitCard) waitCard.style.display = 'none';
        const actionsGrid = document.getElementById('onlineActionsGrid');
        if (actionsGrid) actionsGrid.style.display = 'grid';
      });
    }
  }

  private async handleCreateRoom(): Promise<void> {
    const nameInput = document.getElementById('inputNameOnline') as HTMLInputElement | null;
    const name = nameInput ? nameInput.value.trim() || 'Jugador 1' : 'Jugador 1';
    const av = AVATARS[this.selectedAvatarOnline];
    const diffSelect = document.getElementById('selectOnlineDifficulty') as HTMLSelectElement | null;
    const difficulty = (diffSelect ? diffSelect.value : 'media') as Difficulty;

    const btnCreate = document.getElementById('btnCreateOnlineRoom') as HTMLButtonElement | null;
    if (btnCreate) btnCreate.disabled = true;

    try {
      const hostProfile = { name, avatar: av.emoji, color: av.bg };
      const roomCode = await multiplayerService.createRoom(hostProfile, difficulty);

      gameEngine.isOnline = true;
      gameEngine.myPlayerIndex = 0;

      const codeEl = document.getElementById('displayRoomCode');
      if (codeEl) codeEl.textContent = roomCode;

      const waitCard = document.getElementById('onlineWaitingCard');
      if (waitCard) waitCard.style.display = 'block';

      const actionsGrid = document.getElementById('onlineActionsGrid');
      if (actionsGrid) actionsGrid.style.display = 'none';

      multiplayerService.listenToRoom({
        onGuestJoined: (guestProfile) => {
          soundEngine.playClick();
          this.startOnlineMatchAsHost(hostProfile, guestProfile, difficulty);
        },
        onAction: (action) => gameEngine.handleRemoteAction(action)
      });
    } catch (err: any) {
      alert(`Error al crear la sala: ${err.message}`);
    } finally {
      if (btnCreate) btnCreate.disabled = false;
    }
  }

  private async handleJoinRoom(): Promise<void> {
    const inputJoin = document.getElementById('inputJoinRoomCode') as HTMLInputElement | null;
    const code = inputJoin ? inputJoin.value.trim().toUpperCase() : '';
    if (!code) {
      alert('Por favor introduce el código de 5 letras de la sala.');
      if (inputJoin) inputJoin.focus();
      return;
    }

    const nameInput = document.getElementById('inputNameOnline') as HTMLInputElement | null;
    const name = nameInput ? nameInput.value.trim() || 'Jugador 2' : 'Jugador 2';
    const av = AVATARS[this.selectedAvatarOnline];

    const btnJoin = document.getElementById('btnJoinOnlineRoom') as HTMLButtonElement | null;
    if (btnJoin) btnJoin.disabled = true;

    try {
      const guestProfile = { name, avatar: av.emoji, color: av.bg };
      const roomData = await multiplayerService.joinRoom(code, guestProfile);

      gameEngine.isOnline = true;
      gameEngine.myPlayerIndex = 1;

      multiplayerService.listenToRoom({
        onStateUpdate: (savedState) => {
          if (!savedState) return;
          const wasNull = !gameEngine.state;
          gameEngine.state = StateManager.sanitize(savedState);
          if (wasNull) {
            ScreenManager.showScreen('boardScreen');
          }
          if (!gameEngine.activeTurnContext) {
            gameEngine.renderBoard();
          }
        },
        onAction: (action) => gameEngine.handleRemoteAction(action)
      });

      if (roomData.gameState) {
        gameEngine.state = StateManager.sanitize(roomData.gameState);
        ScreenManager.showScreen('boardScreen');
        gameEngine.renderBoard();
      } else {
        ScreenManager.showScreen('boardScreen');
        gameEngine.setWheelStatus(`Conectado a la sala ${code}. Esperando que el anfitrión inicie...`);
      }
    } catch (err: any) {
      alert(`Error al unirse a la sala: ${err.message}`);
    } finally {
      if (btnJoin) btnJoin.disabled = false;
    }
  }

  private startOnlineMatchAsHost(hostProfile: any, guestProfile: any, difficulty: Difficulty): void {
    const waitCard = document.getElementById('onlineWaitingCard');
    if (waitCard) waitCard.style.display = 'none';

    gameEngine.hasSpunThisTurn = false;
    gameEngine.isOnline = true;
    gameEngine.myPlayerIndex = 0;

    const decks = deckManager.buildDecks(difficulty);
    gameEngine.state = StateManager.createInitialState(
      { name: hostProfile.name, avatar: { emoji: hostProfile.avatar, label: hostProfile.name, bg: hostProfile.color } },
      { name: guestProfile.name, avatar: { emoji: guestProfile.avatar, label: guestProfile.name, bg: guestProfile.color } },
      difficulty,
      decks
    );

    ScreenManager.showScreen('boardScreen');
    gameEngine.renderBoard();
    gameEngine.setWheelStatus('🎯 ¡Comienza la partida online! Pulsa [GIRAR] en la ruleta.');

    multiplayerService.syncGameState(gameEngine.state);
  }

  private checkUrlRoomCode(): void {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('sala') || params.get('room');
    if (roomCode) {
      const tabOnline = document.getElementById('tabModeOnline');
      if (tabOnline) tabOnline.click();
      const inputJoin = document.getElementById('inputJoinRoomCode') as HTMLInputElement | null;
      if (inputJoin) {
        inputJoin.value = roomCode.trim().toUpperCase();
        inputJoin.focus();
      }
    }
  }
}

export const onlineScreen = new OnlineScreen();
