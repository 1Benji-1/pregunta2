import { AVATARS } from '../../types/player.types';
import { Difficulty } from '../../types/question.types';
import { WHEEL_SLICES } from '../../types/category.types';
import { soundEngine } from '../../services/audio.service';
import { StorageService } from '../../services/storage.service';
import { gameEngine } from '../../core/game-engine';
import { ScreenManager } from './screen-manager';

export class LobbyScreen {
  private selectedAvatars: [number, number] = [0, 1];
  private selectedDifficulty: Difficulty = 'media';

  public init(): void {
    this.setupAvatarPickers();
    this.setupDifficultyButtons();
    this.setupActionButtons();
    this.setupSimulatorButtons();
  }

  private setupAvatarPickers(): void {
    [0, 1].forEach((pIdx) => {
      const container = document.getElementById(`avatarPickerP${pIdx + 1}`);
      if (!container) return;
      container.innerHTML = '';

      AVATARS.forEach((av, avIdx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `avatar-option ${this.selectedAvatars[pIdx] === avIdx ? 'selected' : ''}`;
        btn.title = av.label;
        btn.textContent = av.emoji;
        btn.addEventListener('click', () => {
          soundEngine.playClick();
          this.selectedAvatars[pIdx] = avIdx;
          this.updateAvatarPreviews();
        });
        container.appendChild(btn);
      });
    });
    this.updateAvatarPreviews();
  }

  private updateAvatarPreviews(): void {
    [0, 1].forEach((pIdx) => {
      const av = AVATARS[this.selectedAvatars[pIdx]];
      const preview = document.getElementById(`previewAvatarP${pIdx + 1}`);
      if (preview) {
        preview.textContent = av.emoji;
        preview.style.background = av.bg;
      }
      const container = document.getElementById(`avatarPickerP${pIdx + 1}`);
      if (container) {
        Array.from(container.children).forEach((btn, idx) => {
          btn.classList.toggle('selected', idx === this.selectedAvatars[pIdx]);
        });
      }
    });
  }

  private setupDifficultyButtons(): void {
    const diffButtons = document.querySelectorAll<HTMLButtonElement>('.diff-choice-btn');
    diffButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        soundEngine.playClick();
        diffButtons.forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedDifficulty = (btn.dataset.diff as Difficulty) || 'media';
      });
    });
  }

  private setupActionButtons(): void {
    // Iniciar partida local
    const btnStart = document.getElementById('btnStartMatch');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        soundEngine.playClick();
        const p1Input = document.getElementById('inputNameP1') as HTMLInputElement | null;
        const p2Input = document.getElementById('inputNameP2') as HTMLInputElement | null;
        const p1Name = p1Input ? p1Input.value.trim() || 'Carlos' : 'Carlos';
        const p2Name = p2Input ? p2Input.value.trim() || 'Lucía' : 'Lucía';

        gameEngine.startMatch(
          { name: p1Name, avatarIdx: this.selectedAvatars[0] },
          { name: p2Name, avatarIdx: this.selectedAvatars[1] },
          this.selectedDifficulty
        );
      });
    }

    // Reanudar partida guardada
    const btnResume = document.getElementById('btnResumeMatch');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        soundEngine.playClick();
        const saved = StorageService.loadMatch();
        if (saved) {
          gameEngine.resumeMatch(saved);
        }
      });
    }

    // Descartar partida guardada
    const btnDiscard = document.getElementById('btnDiscardSaved');
    if (btnDiscard) {
      btnDiscard.addEventListener('click', () => {
        soundEngine.playClick();
        StorageService.clearMatch();
        const banner = document.getElementById('resumeBanner');
        if (banner) banner.style.display = 'none';
      });
    }

    // Botón volver al Lobby desde el tablero
    const btnBack = document.getElementById('btnBackLobby');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        if (gameEngine.isSpinning) return;
        soundEngine.playClick();
        if (gameEngine.isOnline) {
          if (!confirm('¿Deseas salir de la sala online? Se desconectará la partida.')) return;
          // multiplayer leave
        }
        ScreenManager.showScreen('lobbyScreen');
      });
    }
  }

  private setupSimulatorButtons(): void {
    const quickContainer = document.getElementById('quickTestButtons');
    if (quickContainer) {
      quickContainer.innerHTML = WHEEL_SLICES.map(
        (slice, idx) => `
        <button type="button" class="quick-chip-btn" data-slice="${idx}">
          ${slice.isCrown ? '👑 Corona' : slice.shortName}
        </button>
      `
      ).join('');

      quickContainer.querySelectorAll<HTMLButtonElement>('.quick-chip-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.slice);
          gameEngine.spinWheel(idx);
        });
      });
    }
  }
}

export const lobbyScreen = new LobbyScreen();
