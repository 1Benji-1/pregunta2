import './styles/main.css';
import { gameEngine } from './core/game-engine';
import { lobbyScreen } from './ui/screens/lobby-screen';
import { onlineScreen } from './ui/screens/online-screen';
import { soundEngine } from './services/audio.service';
import { CATEGORIES } from './types/category.types';

document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar componentes y pantallas
  lobbyScreen.init();
  onlineScreen.init();
  await gameEngine.init();

  // Configuración de pestañas Modo Local / Modo Online
  const tabLocal = document.getElementById('tabModeLocal');
  const tabOnline = document.getElementById('tabModeOnline');
  const viewLocal = document.getElementById('localSetupContainer');
  const viewOnline = document.getElementById('onlineSetupContainer');

  if (tabLocal && tabOnline && viewLocal && viewOnline) {
    tabLocal.addEventListener('click', () => {
      soundEngine.playClick();
      tabLocal.classList.add('active');
      tabOnline.classList.remove('active');
      viewLocal.style.display = 'block';
      viewOnline.style.display = 'none';
    });

    tabOnline.addEventListener('click', () => {
      soundEngine.playClick();
      tabOnline.classList.add('active');
      tabLocal.classList.remove('active');
      viewLocal.style.display = 'none';
      viewOnline.style.display = 'block';
    });
  }

  // Showcase de categorías en el lobby
  const catGrid = document.getElementById('lobbyCategoryShowcase');
  if (catGrid) {
    catGrid.innerHTML = CATEGORIES.map(
      (cat) => `
      <div class="cat-showcase-item" style="border-color: ${cat.color};">
        <img class="cat-showcase-art" src="${cat.art}" alt="${cat.name}">
        <div class="cat-showcase-name">${cat.name}</div>
        <div class="cat-showcase-char">Personaje: ${cat.character}</div>
      </div>
    `
    ).join('');
  }

  // Botón central GIRAR ruleta
  const btnSpin = document.getElementById('btnSpinWheel');
  if (btnSpin) {
    btnSpin.addEventListener('click', () => {
      gameEngine.spinWheel();
    });
  }

  // Botón de sonido
  const btnSound = document.getElementById('btnToggleSound');
  const updateSoundLabel = () => {
    if (btnSound) {
      btnSound.innerHTML = soundEngine.enabled ? '🔊 Sonido: ON' : '🔇 Sonido: OFF';
    }
  };
  updateSoundLabel();
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      soundEngine.toggle();
      updateSoundLabel();
    });
  }

  // Modal de Reglas
  const btnRules = document.getElementById('btnOpenRules');
  const rulesModal = document.getElementById('rulesModal') as HTMLDialogElement | null;
  const btnCloseRules = document.getElementById('btnCloseRules');

  if (btnRules && rulesModal) {
    btnRules.addEventListener('click', () => {
      soundEngine.playClick();
      rulesModal.showModal();
    });
  }

  if (btnCloseRules && rulesModal) {
    btnCloseRules.addEventListener('click', () => {
      soundEngine.playClick();
      rulesModal.close();
    });
  }

  // Prevenir que la tecla Escape cierre modales críticos en medio de una pregunta
  ['questionModal', 'crownModal', 'victoryModal'].forEach((modalId) => {
    const dlg = document.getElementById(modalId);
    if (dlg) {
      dlg.addEventListener('cancel', (ev) => ev.preventDefault());
    }
  });

  // Botón revelar tarjeta al lector (Modo Local)
  const btnReveal = document.getElementById('btnRevealCardToReader');
  if (btnReveal) {
    btnReveal.addEventListener('click', () => {
      soundEngine.playClick();
      const shield = document.getElementById('qPrivacyShield');
      const content = document.getElementById('qCardInteractiveContent');
      if (shield) shield.style.display = 'none';
      if (content) content.style.display = 'block';
      const qModal = document.getElementById('questionModal');
      if (qModal) qModal.scrollTop = 0;
    });
  }

  // Botones de Comodines
  const btnDoble = document.getElementById('btnComodinDoble');
  if (btnDoble) {
    btnDoble.addEventListener('click', () => {
      gameEngine.useComodinDoble();
    });
  }

  const btnBomba = document.getElementById('btnComodinBomba');
  if (btnBomba) {
    btnBomba.addEventListener('click', () => {
      gameEngine.useComodinBomba();
    });
  }
});
