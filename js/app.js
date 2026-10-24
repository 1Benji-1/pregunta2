/**
 * Motor Principal de Juego: pregunta2
 * Implementación fiel a plan_juego_pregunta2.md y simulacion_flujo_pregunta2.md
 * con estética e iconos inspirados en Preguntados (Trivia Crack).
 */

const CATEGORIES = [
  {
    key: 'ARTE Y LITERATURA',
    name: 'Arte y Literatura',
    shortName: 'ARTE',
    character: 'Tina',
    color: '#e53935',
    darkColor: '#ab1f1c',
    lightColor: '#ffebee',
    art: 'assets/images/arte.png',
    icon: 'assets/images/arte.svg'
  },
  {
    key: 'GEOGRAFIA',
    name: 'Geografía',
    shortName: 'GEOGRAFÍA',
    character: 'Tito',
    color: '#1e88e5',
    darkColor: '#0d5ca6',
    lightColor: '#e3f2fd',
    art: 'assets/images/geografia.png',
    icon: 'assets/images/geografia.svg'
  },
  {
    key: 'CIENCIAS Y TECNOLOGIA',
    name: 'Ciencias y Tecnología',
    shortName: 'CIENCIA',
    character: 'Albert',
    color: '#2ecc71',
    darkColor: '#1b9a52',
    lightColor: '#e8f8f0',
    art: 'assets/images/ciencia.png',
    icon: 'assets/images/ciencia.svg'
  },
  {
    key: 'DEPORTES',
    name: 'Deportes',
    shortName: 'DEPORTES',
    character: 'Bonzo',
    color: '#ff8f00',
    darkColor: '#c66900',
    lightColor: '#fff3e0',
    art: 'assets/images/deportes.png',
    icon: 'assets/images/deportes.svg'
  },
  {
    key: 'ENTRETENIMIENTO',
    name: 'Entretenimiento',
    shortName: 'ENTRETEN.',
    character: 'Pop',
    color: '#ec407a',
    darkColor: '#b41e53',
    lightColor: '#fce4ec',
    art: 'assets/images/entretenimiento.png',
    icon: 'assets/images/entretenimiento.svg'
  },
  {
    key: 'HISTORIA',
    name: 'Historia',
    shortName: 'HISTORIA',
    character: 'Héctor',
    color: '#fbc02d',
    darkColor: '#c49000',
    lightColor: '#fffde7',
    art: 'assets/images/historia.png',
    icon: 'assets/images/historia.svg'
  }
];

// Las 7 secciones radiales de la ruleta (6 categorías + 1 Corona especial)
const WHEEL_SLICES = [
  CATEGORIES[0], // Arte
  CATEGORIES[1], // Geografía
  CATEGORIES[2], // Ciencia
  {
    key: 'CORONA',
    name: 'Corona Especial',
    shortName: 'CORONA',
    character: 'Willy',
    color: '#9b51e0',
    darkColor: '#6a1b9a',
    lightColor: '#f3e5f5',
    art: 'assets/images/cup.png',
    isCrown: true
  },
  CATEGORIES[3], // Deportes
  CATEGORIES[4], // Entretenimiento
  CATEGORIES[5]  // Historia
];

const AVATARS = [
  { emoji: '🦊', label: 'Zorro Azul', bg: '#1e88e5' },
  { emoji: '🦉', label: 'Búho Violeta', bg: '#8e24aa' },
  { emoji: '🦁', label: 'León Dorado', bg: '#f57c00' },
  { emoji: '🐼', label: 'Panda Esmeralda', bg: '#2ecc71' },
  { emoji: '🐯', label: 'Tigre Carmesí', bg: '#e53935' },
  { emoji: '🐸', label: 'Rana Turquesa', bg: '#00acc1' }
];

const STORAGE_MATCH_KEY = 'pregunta2_active_match_v1';
const STORAGE_USED_CARDS_KEY = 'pregunta2_used_cards_v1';

class Pregunta2Game {
  constructor() {
    this.allCards = [];
    this.loadedImages = {};
    this.selectedAvatars = [0, 1]; // Carlos (🦊) y Lucía (🦉) por defecto
    this.selectedDifficulty = 'media';

    // Estado de la partida activa
    this.state = null;

    // Estado de la ruleta en Canvas
    this.wheelAngle = 0;
    this.isSpinning = false;

    // Estado del turno de pregunta actual
    this.activeTurnContext = null;

    // Estado Multijugador Online (Firebase Realtime)
    this.isOnline = false;
    this.myPlayerIndex = 0; // 0 = Anfitrión / J1, 1 = Invitado / J2
    this.selectedAvatarOnline = 0;

    this.init();
  }

  async init() {
    await this.loadQuestionBank();
    await this.preloadWheelImages();
    this.setupLobbyUI();
    this.setupOnlineLobbyUI();
    this.setupBoardUI();
    this.drawWheel();
    this.checkSavedMatch();
    this.checkUrlRoomCode();
  }

  async loadQuestionBank() {
    try {
      const resp = await fetch('preguntas.json');
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json) && json.length > 0) {
          this.allCards = json;
          return;
        }
      }
    } catch (_) {
      // Si se abre mediante file:// usamos window.PREGUNTAS_DATA
    }
    if (Array.isArray(window.PREGUNTAS_DATA)) {
      this.allCards = window.PREGUNTAS_DATA;
    }
  }

  preloadWheelImages() {
    if (typeof Image === 'undefined') return Promise.resolve();
    const urls = new Set();
    WHEEL_SLICES.forEach((s) => urls.add(s.art));
    const promises = Array.from(urls).map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            this.loadedImages[src] = img;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = src;
        })
    );
    return Promise.all(promises);
  }

  /* ========================================================================
     ALGORITMO FISHER-YATES Y CONTROL ANTI-REPETICIÓN (Sección 4.1)
     ======================================================================== */
  shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  getSessionUsedCards() {
    try {
      const raw = localStorage.getItem(STORAGE_USED_CARDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  markCardAsUsed(cartaId) {
    try {
      const used = new Set(this.getSessionUsedCards());
      used.add(cartaId);
      localStorage.setItem(STORAGE_USED_CARDS_KEY, JSON.stringify(Array.from(used)));
    } catch (_) {}
  }

  buildDecksForMatch(difficulty) {
    const sessionUsed = new Set(this.getSessionUsedCards());
    const decks = {};

    CATEGORIES.forEach((cat) => {
      let pool = this.allCards.filter((c) => c.categoria === cat.key);
      if (difficulty !== 'mixta') {
        pool = pool.filter((c) => c.dificultad === difficulty);
      }

      // Priorizar cartas no jugadas recientemente en la sesión
      const freshCards = this.shuffleArray(pool.filter((c) => !sessionUsed.has(c.carta_id)));
      const previouslyPlayedCards = this.shuffleArray(pool.filter((c) => sessionUsed.has(c.carta_id)));

      decks[cat.key] = [...freshCards, ...previouslyPlayedCards].map((c) => c.carta_id);
    });

    return decks;
  }

  drawCardForCategory(categoryKey) {
    if (!this.state.decks[categoryKey] || this.state.decks[categoryKey].length === 0) {
      // Ciclo de rebarajado seguro (Sección 4.1.4)
      let pool = this.allCards.filter((c) => c.categoria === categoryKey);
      if (this.state.difficulty !== 'mixta') {
        pool = pool.filter((c) => c.dificultad === this.state.difficulty);
      }
      this.state.decks[categoryKey] = this.shuffleArray(pool.map((c) => c.carta_id));
    }

    const cartaId = this.state.decks[categoryKey].shift();
    this.state.discardPile.push(cartaId);
    this.markCardAsUsed(cartaId);

    const cardObj = this.allCards.find((c) => c.carta_id === cartaId);
    return cardObj;
  }

  /* ========================================================================
     CONFIGURACIÓN DEL LOBBY (Sección 2)
     ======================================================================== */
  setupLobbyUI() {
    // Renderizar selectores de avatar para Jugador 1 y Jugador 2
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
          window.soundEngine.playClick();
          this.selectedAvatars[pIdx] = avIdx;
          this.updateAvatarPreviews();
        });
        container.appendChild(btn);
      });
    });
    this.updateAvatarPreviews();

    // Selector de dificultad
    const diffCards = document.querySelectorAll('.diff-card');
    diffCards.forEach((card) => {
      card.addEventListener('click', () => {
        window.soundEngine.playClick();
        diffCards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedDifficulty = card.dataset.diff;
      });
    });

    // Galería de las 6 categorías con sus artes en el Lobby
    const showcase = document.getElementById('lobbyCategoriesShowcase');
    if (showcase) {
      showcase.innerHTML = CATEGORIES.map(
        (cat) => `
        <div class="cat-showcase-item" style="background: linear-gradient(145deg, ${cat.color}, ${cat.darkColor});">
          <img src="${cat.art}" alt="${cat.name}" loading="lazy">
          <div class="cat-showcase-name">${cat.name}</div>
          <div class="cat-showcase-char">Personaje: ${cat.character}</div>
        </div>
      `
      ).join('');
    }

    // Botón Iniciar Partida
    document.getElementById('btnStartMatch').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.startNewMatch();
    });

    // Botón Reanudar Partida Guardada
    document.getElementById('btnResumeMatch').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.resumeSavedMatch();
    });

    // Botón Descartar Partida Guardada
    document.getElementById('btnDiscardSaved').addEventListener('click', () => {
      window.soundEngine.playClick();
      localStorage.removeItem(STORAGE_MATCH_KEY);
      document.getElementById('resumeBanner').style.display = 'none';
    });
  }

  /* ========================================================================
     CONFIGURACIÓN MULTIJUGADOR ONLINE (2 DISPOSITIVOS)
     ======================================================================== */
  setupOnlineLobbyUI() {
    const tabLocal = document.getElementById('tabModeLocal');
    const tabOnline = document.getElementById('tabModeOnline');
    const localContainer = document.getElementById('localSetupContainer');
    const onlineContainer = document.getElementById('onlineSetupContainer');

    if (!tabLocal || !tabOnline) return;

    tabLocal.addEventListener('click', () => {
      window.soundEngine.playClick();
      tabLocal.classList.add('active');
      tabOnline.classList.remove('active');
      localContainer.style.display = 'block';
      onlineContainer.style.display = 'none';
      this.isOnline = false;
    });

    tabOnline.addEventListener('click', () => {
      window.soundEngine.playClick();
      tabOnline.classList.add('active');
      tabLocal.classList.remove('active');
      localContainer.style.display = 'none';
      onlineContainer.style.display = 'block';
      this.isOnline = true;
    });

    // Selector de Avatar Online
    const avatarContainer = document.getElementById('avatarPickerOnline');
    if (avatarContainer) {
      avatarContainer.innerHTML = '';
      AVATARS.forEach((av, avIdx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `avatar-option ${this.selectedAvatarOnline === avIdx ? 'selected' : ''}`;
        btn.title = av.label;
        btn.textContent = av.emoji;
        btn.addEventListener('click', () => {
          window.soundEngine.playClick();
          this.selectedAvatarOnline = avIdx;
          this.updateOnlineAvatarPreview();
        });
        avatarContainer.appendChild(btn);
      });
      this.updateOnlineAvatarPreview();
    }

    // Botón Crear Sala Online (Anfitrión)
    const btnCreate = document.getElementById('btnCreateOnlineRoom');
    if (btnCreate) {
      btnCreate.addEventListener('click', async () => {
        window.soundEngine.playClick();
        await this.handleCreateOnlineRoom();
      });
    }

    // Botón Unirse a Sala Online (Invitado)
    const btnJoin = document.getElementById('btnJoinOnlineRoom');
    if (btnJoin) {
      btnJoin.addEventListener('click', async () => {
        window.soundEngine.playClick();
        await this.handleJoinOnlineRoom();
      });
    }

    // Botón Copiar Código
    const btnCopyCode = document.getElementById('btnCopyRoomCode');
    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', () => {
        const code = document.getElementById('displayRoomCode').textContent.trim();
        navigator.clipboard.writeText(code).then(() => {
          btnCopyCode.textContent = '✅ ¡Copiado!';
          setTimeout(() => (btnCopyCode.textContent = '📋 Copiar Código'), 2000);
        });
      });
    }

    // Botón Copiar Enlace Directo
    const btnCopyLink = document.getElementById('btnCopyRoomLink');
    if (btnCopyLink) {
      btnCopyLink.addEventListener('click', () => {
        const code = document.getElementById('displayRoomCode').textContent.trim();
        const link = `${window.location.origin}${window.location.pathname}?sala=${code}`;
        navigator.clipboard.writeText(link).then(() => {
          btnCopyLink.textContent = '✅ ¡Enlace Copiado!';
          setTimeout(() => (btnCopyLink.textContent = '🔗 Copiar Enlace Directo'), 2000);
        });
      });
    }

    // Botón Cancelar Sala de Espera
    const btnCancel = document.getElementById('btnCancelWaitingRoom');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        window.soundEngine.playClick();
        window.multiplayerManager.leaveRoom();
        document.getElementById('onlineWaitingCard').style.display = 'none';
        document.getElementById('onlineActionsGrid').style.display = 'grid';
      });
    }
  }

  updateOnlineAvatarPreview() {
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

  checkUrlRoomCode() {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('sala') || params.get('room');
    if (roomCode) {
      const tabOnline = document.getElementById('tabModeOnline');
      if (tabOnline) tabOnline.click();
      const inputJoin = document.getElementById('inputJoinRoomCode');
      if (inputJoin) {
        inputJoin.value = roomCode.trim().toUpperCase();
        inputJoin.focus();
      }
    }
  }

  async handleCreateOnlineRoom() {
    const nameInput = document.getElementById('inputNameOnline');
    const name = nameInput ? nameInput.value.trim() || 'Jugador 1' : 'Jugador 1';
    const av = AVATARS[this.selectedAvatarOnline];
    const diffSelect = document.getElementById('selectOnlineDifficulty');
    const difficulty = diffSelect ? diffSelect.value : 'media';

    const btnCreate = document.getElementById('btnCreateOnlineRoom');
    if (btnCreate) btnCreate.disabled = true;

    try {
      const hostProfile = { name, avatar: av.emoji, color: av.bg };
      const roomCode = await window.multiplayerManager.createRoom(hostProfile, difficulty);

      this.isOnline = true;
      this.myPlayerIndex = 0;

      // Mostrar tarjeta de sala de espera
      document.getElementById('displayRoomCode').textContent = roomCode;
      document.getElementById('onlineWaitingCard').style.display = 'block';
      document.getElementById('onlineActionsGrid').style.display = 'none';

      // Escuchar eventos en la sala
      window.multiplayerManager.listenToRoom({
        onGuestJoined: (guestProfile, roomData) => {
          window.soundEngine.playClick();
          this.startOnlineMatchAsHost(hostProfile, guestProfile, difficulty);
        },
        onAction: (action) => this.handleRemoteAction(action)
      });
    } catch (err) {
      alert(`Error al crear la sala: ${err.message}`);
    } finally {
      if (btnCreate) btnCreate.disabled = false;
    }
  }

  async handleJoinOnlineRoom() {
    const inputJoin = document.getElementById('inputJoinRoomCode');
    const code = inputJoin ? inputJoin.value.trim().toUpperCase() : '';
    if (!code) {
      alert('Por favor introduce el código de 5 letras de la sala.');
      if (inputJoin) inputJoin.focus();
      return;
    }

    const nameInput = document.getElementById('inputNameOnline');
    const name = nameInput ? nameInput.value.trim() || 'Jugador 2' : 'Jugador 2';
    const av = AVATARS[this.selectedAvatarOnline];

    const btnJoin = document.getElementById('btnJoinOnlineRoom');
    if (btnJoin) btnJoin.disabled = true;

    try {
      const guestProfile = { name, avatar: av.emoji, color: av.bg };
      const roomData = await window.multiplayerManager.joinRoom(code, guestProfile);

      this.isOnline = true;
      this.myPlayerIndex = 1;

      // Escuchar eventos y comenzar
      window.multiplayerManager.listenToRoom({
        onStateUpdate: (savedState) => {
          if (!this.state && savedState) {
            this.state = savedState;
            this.showScreen('boardScreen');
            this.renderBoard();
          }
        },
        onAction: (action) => this.handleRemoteAction(action)
      });

      if (roomData.gameState) {
        this.state = roomData.gameState;
        this.showScreen('boardScreen');
        this.renderBoard();
      } else {
        this.showScreen('boardScreen');
        this.setWheelStatus(`Conectado a la sala ${code}. Esperando que el anfitrión inicie...`);
      }
    } catch (err) {
      alert(`Error al unirse a la sala: ${err.message}`);
    } finally {
      if (btnJoin) btnJoin.disabled = false;
    }
  }

  startOnlineMatchAsHost(hostProfile, guestProfile, difficulty) {
    this.state = {
      difficulty: difficulty,
      currentPlayerIndex: 0,
      turnNumber: 1,
      startedAt: Date.now(),
      elapsedSecondsBeforeResume: 0,
      finished: false,
      winnerIndex: null,
      decks: this.buildDecksForMatch(difficulty),
      discardPile: [],
      players: [
        this.createEmptyPlayer(hostProfile.name, { emoji: hostProfile.avatar, bg: hostProfile.color }),
        this.createEmptyPlayer(guestProfile.name, { emoji: guestProfile.avatar, bg: guestProfile.color })
      ]
    };

    window.multiplayerManager.syncGameState(this.state);
    this.showScreen('boardScreen');
    this.renderBoard();
    this.setWheelStatus('🎯 ¡Comienza la partida online! Pulsa [GIRAR] en la ruleta.');
  }

  handleRemoteAction(action) {
    if (action.fromIndex === this.myPlayerIndex) return;

    switch (action.type) {
      case 'SPIN':
        this.spinWheel(action.payload.targetSliceIdx, action.payload.isAutoRespin, true);
        break;

      case 'CROWN_CHOSEN':
        const catObj = CATEGORIES.find((c) => c.key === action.payload.categoryKey);
        if (catObj) {
          const cModal = document.getElementById('crownModal');
          if (cModal && cModal.open) cModal.close();
          this.startCategoryTurn(catObj, true, action.payload.card);
        }
        break;

      case 'START_QUESTION':
        const questionCat = CATEGORIES.find((c) => c.key === action.payload.categoryKey);
        if (questionCat) {
          this.startCategoryTurn(questionCat, action.payload.isCrownChallenge, action.payload.card);
        }
        break;

      case 'USE_COMODIN':
        this.handleRemoteComodin(action.payload);
        break;

      case 'SUBMIT_ANSWER':
        this.submitAnswer(action.payload.selectedIndex, true);
        break;

      case 'NEXT_TURN':
        this.advanceToNextTurn(true);
        break;

      case 'NEXT_BONUS':
        this.advanceToNextBonusAttempt(true);
        break;
    }
  }

  handleRemoteComodin(payload) {
    const ctx = this.activeTurnContext;
    if (!ctx) return;
    const activePlayer = this.getActivePlayer();

    if (payload.type === 'doble') {
      if (activePlayer.comodines) activePlayer.comodines.dobleOportunidad -= 1;
      ctx.dobleOportunidadActiva = true;
      ctx.dobleOportunidadUsada = true;
      window.soundEngine.playPowerUp();
      this.updateComodinesUI();
      const statusMsg = document.getElementById('qComodinStatusMsg');
      if (statusMsg) {
        statusMsg.className = 'comodin-status-msg';
        statusMsg.textContent = `✨ ¡Comodín Doble Oportunidad activado por ${activePlayer.name}!`;
        statusMsg.style.display = 'block';
      }
    } else if (payload.type === 'bomba') {
      if (activePlayer.comodines) activePlayer.comodines.bomba -= 1;
      ctx.bombaUsada = true;
      ctx.eliminatedOptions = new Set(payload.eliminatedIndices);
      window.soundEngine.playBomb();
      const optionButtons = document.querySelectorAll('#qOptionsList .option-btn');
      payload.eliminatedIndices.forEach((idx) => {
        const btn = optionButtons[idx];
        if (btn) {
          btn.disabled = true;
          btn.classList.add('bomb-eliminated');
          const badge = document.createElement('span');
          badge.className = 'bomb-discard-badge';
          badge.textContent = '💣 DESCARTADA';
          btn.appendChild(badge);
        }
      });
      this.updateComodinesUI();
    }
    this.renderBoard();
  }

  advanceToNextBonusAttempt(fromRemote = false) {
    const ctx = this.activeTurnContext;
    if (!ctx) return;
    ctx.currentAttemptIndex += 1;
    ctx.answered = false;
    ctx.failedOptions = null;
    ctx.dobleOportunidadActiva = false;
    this.renderQuestionAttempt();
  }

  isMyTurn() {
    if (!this.isOnline) return true;
    return this.myPlayerIndex === (this.state ? this.state.currentPlayerIndex : 0);
  }

  isReader() {
    if (!this.isOnline) return false;
    return this.myPlayerIndex !== (this.state ? this.state.currentPlayerIndex : 0);
  }

  updateAvatarPreviews() {
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

  checkSavedMatch() {
    try {
      const raw = localStorage.getItem(STORAGE_MATCH_KEY);
      const banner = document.getElementById('resumeBanner');
      if (!raw || !banner) return;
      const saved = JSON.parse(raw);
      if (saved && !saved.finished && saved.players && saved.players.length === 2) {
        const p1 = saved.players[0];
        const p2 = saved.players[1];
        document.getElementById('resumeSummaryText').textContent =
          `Partida en curso: ${p1.name} (${p1.crowns}/6 👑) vs ${p2.name} (${p2.crowns}/6 👑) — Turno #${saved.turnNumber}`;
        banner.style.display = 'flex';
      }
    } catch (_) {}
  }

  createEmptyPlayer(name, avatarObj) {
    const categoriesState = {};
    CATEGORIES.forEach((cat) => {
      categoriesState[cat.key] = {
        points: 0,
        won: false,
        wonByCrown: false,
        correctCount: 0,
        attemptCount: 0
      };
    });

    return {
      name,
      avatar: avatarObj.emoji,
      color: avatarObj.bg,
      crowns: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      pressureCorrect: 0, // Respondidas con <= 10s restantes
      bonusSaves: 0,      // Puntos salvados gracias al 2º o 3er intento de Bonus
      comodines: {
        dobleOportunidad: 3,
        bomba: 3
      },
      categories: categoriesState
    };
  }

  startNewMatch() {
    const p1Name = document.getElementById('inputNameP1').value.trim() || 'Carlos';
    const p2Name = document.getElementById('inputNameP2').value.trim() || 'Lucía';

    this.state = {
      difficulty: this.selectedDifficulty,
      currentPlayerIndex: 0,
      turnNumber: 1,
      startedAt: Date.now(),
      elapsedSecondsBeforeResume: 0,
      finished: false,
      winnerIndex: null,
      decks: this.buildDecksForMatch(this.selectedDifficulty),
      discardPile: [],
      players: [
        this.createEmptyPlayer(p1Name, AVATARS[this.selectedAvatars[0]]),
        this.createEmptyPlayer(p2Name, AVATARS[this.selectedAvatars[1]])
      ]
    };

    this.saveMatchState();
    this.showScreen('boardScreen');
    this.renderBoard();
    this.setWheelStatus('🎯 Pulsa el botón central [GIRAR] de Willy para comenzar tu turno.');
  }

  resumeSavedMatch() {
    try {
      const raw = localStorage.getItem(STORAGE_MATCH_KEY);
      if (!raw) return;
      this.state = JSON.parse(raw);
      this.state.startedAt = Date.now();

      // Compatibilidad hacia atrás para comodines
      if (Array.isArray(this.state.players)) {
        this.state.players.forEach((p) => {
          if (!p.comodines) {
            p.comodines = { dobleOportunidad: 3, bomba: 3 };
          } else {
            if (typeof p.comodines.dobleOportunidad !== 'number') p.comodines.dobleOportunidad = 3;
            if (typeof p.comodines.bomba !== 'number') p.comodines.bomba = 3;
          }
        });
      }

      this.showScreen('boardScreen');
      this.renderBoard();
      const activePlayer = this.getActivePlayer();
      this.setWheelStatus(`🔄 Partida reanudada. Es el turno de ${activePlayer.name} ${activePlayer.avatar}. ¡Gira la ruleta!`);
    } catch (_) {
      this.startNewMatch();
    }
  }

  saveMatchState() {
    if (!this.state) return;
    try {
      const now = Date.now();
      const sessionSec = Math.floor((now - this.state.startedAt) / 1000);
      const snapshot = {
        ...this.state,
        elapsedSecondsBeforeResume: (this.state.elapsedSecondsBeforeResume || 0) + sessionSec,
        startedAt: now
      };
      this.state.elapsedSecondsBeforeResume = snapshot.elapsedSecondsBeforeResume;
      this.state.startedAt = now;
      localStorage.setItem(STORAGE_MATCH_KEY, JSON.stringify(snapshot));
    } catch (_) {}
  }

  getActivePlayer() {
    return this.state.players[this.state.currentPlayerIndex];
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen-view').forEach((el) => {
      el.classList.toggle('active', el.id === screenId);
    });
    const inBoard = screenId === 'boardScreen';
    document.getElementById('btnBackLobby').style.display = inBoard ? 'inline-flex' : 'none';
    document.getElementById('navMatchInfo').style.display = inBoard ? 'flex' : 'none';
  }

  /* ========================================================================
     RENDERIZADO DEL TABLERO Y SCOREBOARDS (Sección 6)
     ======================================================================== */
  setupBoardUI() {
    // Botón central GIRAR de la ruleta
    document.getElementById('btnSpinWheel').addEventListener('click', () => {
      this.spinWheel();
    });

    // Botones de la barra de navegación superior
    const btnSound = document.getElementById('btnToggleSound');
    this.updateSoundButtonLabel(btnSound);
    btnSound.addEventListener('click', () => {
      window.soundEngine.toggle();
      this.updateSoundButtonLabel(btnSound);
    });

    document.getElementById('btnOpenRules').addEventListener('click', () => {
      window.soundEngine.playClick();
      const rModal = document.getElementById('rulesModal');
      if (rModal) {
        rModal.scrollTop = 0;
        rModal.showModal();
      }
    });

    document.getElementById('btnCloseRules').addEventListener('click', () => {
      window.soundEngine.playClick();
      document.getElementById('rulesModal').close();
    });

    // Evitar que la tecla Escape cierre accidentalmente una pregunta activa o selección de corona
    ['questionModal', 'crownModal', 'victoryModal'].forEach((modalId) => {
      const dlg = document.getElementById(modalId);
      if (dlg) {
        dlg.addEventListener('cancel', (ev) => ev.preventDefault());
      }
    });

    // Botón para revelar la tarjeta al lector (cubierta de privacidad)
    document.getElementById('btnRevealCardToReader').addEventListener('click', () => {
      window.soundEngine.playClick();
      document.getElementById('qPrivacyShield').style.display = 'none';
      document.getElementById('qCardInteractiveContent').style.display = 'block';
      const qModal = document.getElementById('questionModal');
      if (qModal) qModal.scrollTop = 0;
    });

    // Botones de Comodines en la tarjeta de pregunta
    const btnDoble = document.getElementById('btnComodinDoble');
    if (btnDoble) {
      btnDoble.addEventListener('click', () => {
        this.useComodinDoble();
      });
    }

    const btnBomba = document.getElementById('btnComodinBomba');
    if (btnBomba) {
      btnBomba.addEventListener('click', () => {
        this.useComodinBomba();
      });
    }

    document.getElementById('btnBackLobby').addEventListener('click', () => {
      if (this.isSpinning) return;
      window.soundEngine.playClick();
      if (this.isOnline) {
        if (!confirm('¿Deseas salir de la sala online? Se desconectará la partida.')) return;
        window.multiplayerManager.leaveRoom();
        this.isOnline = false;
        const navOnline = document.getElementById('navOnlineBadge');
        if (navOnline) navOnline.style.display = 'none';
      }
      this.saveMatchState();
      this.checkSavedMatch();
      this.showScreen('lobbyScreen');
    });

    // Botones de prueba rápida / simulador (para probar cualquier categoría o Corona)
    const quickContainer = document.getElementById('quickTestButtons');
    if (quickContainer) {
      quickContainer.innerHTML = WHEEL_SLICES.map(
        (slice, idx) => `
        <button type="button" class="quick-chip-btn" data-slice="${idx}">
          ${slice.isCrown ? '👑 Corona' : slice.shortName}
        </button>
      `
      ).join('');

      quickContainer.querySelectorAll('.quick-chip-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.slice);
          this.spinWheel(idx);
        });
      });
    }

    // Botones del modal de Victoria
    document.getElementById('btnRematch').addEventListener('click', () => {
      window.soundEngine.playClick();
      document.getElementById('victoryModal').close();
      this.startNewMatch();
    });

    document.getElementById('btnVictoryLobby').addEventListener('click', () => {
      window.soundEngine.playClick();
      document.getElementById('victoryModal').close();
      localStorage.removeItem(STORAGE_MATCH_KEY);
      document.getElementById('resumeBanner').style.display = 'none';
      this.showScreen('lobbyScreen');
    });
  }

  updateSoundButtonLabel(btn) {
    if (!btn) return;
    btn.innerHTML = window.soundEngine.enabled ? '🔊 Sonido: ON' : '🔇 Sonido: OFF';
  }

  renderBoard() {
    if (!this.state) return;

    const diffLabels = {
      facil: '🟢 Fácil',
      media: '🟡 Media',
      dificil: '🔴 Difícil',
      mixta: '🎲 Mixta'
    };
    document.getElementById('navDifficultyBadge').textContent =
      `Dificultad: ${diffLabels[this.state.difficulty] || 'Media'}`;
    document.getElementById('navTurnBadge').textContent = `Ronda / Turno #${this.state.turnNumber}`;

    const activeIdx = this.state.currentPlayerIndex;
    const activePlayer = this.state.players[activeIdx];

    // Barra de estado de sala Online en el navbar superior
    const navOnline = document.getElementById('navOnlineBadge');
    if (navOnline) {
      if (this.isOnline && window.multiplayerManager && window.multiplayerManager.roomCode) {
        navOnline.style.display = 'inline-flex';
        document.getElementById('navOnlineRoomCode').textContent = window.multiplayerManager.roomCode;
        const myPlayer = this.state.players[this.myPlayerIndex];
        const roleText = this.myPlayerIndex === 0 ? 'J1 (Anfitrión)' : 'J2 (Invitado)';
        document.getElementById('navOnlineRole').textContent = `Tú: ${myPlayer ? myPlayer.name : ''} · ${roleText}`;
      } else {
        navOnline.style.display = 'none';
      }
    }

    // Actualizar banner central de turno y control de giro
    const turnAvatar = document.getElementById('turnBannerAvatar');
    const spinBtn = document.getElementById('btnSpinWheel');

    turnAvatar.textContent = activePlayer.avatar;
    turnAvatar.style.background = activePlayer.color;

    if (this.isOnline) {
      if (this.isMyTurn()) {
        document.getElementById('turnBannerName').textContent = `¡ES TU TURNO, ${activePlayer.name.toUpperCase()}!`;
        if (spinBtn) spinBtn.disabled = this.isSpinning;
      } else {
        document.getElementById('turnBannerName').textContent = `TURNO DE: ${activePlayer.name.toUpperCase()} (Esperando su tirada...)`;
        if (spinBtn) spinBtn.disabled = true;
      }
    } else {
      document.getElementById('turnBannerName').textContent = `TURNO DE: ${activePlayer.name.toUpperCase()}`;
    }

    // Renderizar ambos Scoreboards laterales
    this.state.players.forEach((player, pIdx) => {
      const card = document.getElementById(`scoreboardP${pIdx + 1}`);
      const isTurn = pIdx === activeIdx;
      card.classList.toggle('active-turn', isTurn);

      const avatarEl = document.getElementById(`sbAvatarP${pIdx + 1}`);
      avatarEl.textContent = player.avatar;
      avatarEl.style.background = player.color;

      document.getElementById(`sbNameP${pIdx + 1}`).textContent = player.name;
      document.getElementById(`sbTurnPillP${pIdx + 1}`).textContent = isTurn
        ? '⚡ JUGANDO AHORA'
        : 'EN ESPERA';
      document.getElementById(`sbCrownsP${pIdx + 1}`).textContent = `${player.crowns} / 6`;

      // Medallero de 6 personajes/categorías
      const medalsRack = document.getElementById(`sbMedalsP${pIdx + 1}`);
      medalsRack.innerHTML = CATEGORIES.map((cat) => {
        const catState = player.categories[cat.key];
        return `
          <div class="medal-slot ${catState.won ? 'won' : ''}"
               style="${catState.won ? `background: ${cat.lightColor}; border-color: ${cat.color};` : ''}"
               title="${cat.name} (${cat.character}): ${catState.won ? '¡Conquistada!' : `${catState.points}/3 puntos`}">
            <img src="${cat.art}" alt="${cat.name}">
          </div>
        `;
      }).join('');

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
      listEl.innerHTML = CATEGORIES.map((cat) => {
        const catState = player.categories[cat.key];
        const pts = catState.points;
        const won = catState.won;

        let statusTagHtml = `<span class="cat-status-tag">${pts}/3</span>`;
        let subText = '0/3 pts · 1 intento en Corona';

        if (won) {
          statusTagHtml = `<span class="cat-status-tag won-tag">👑 GANADA</span>`;
          subText = catState.wonByCrown ? 'Conquistada por Corona' : 'Conquistada (3/3 pts)';
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
    });
  }

  setWheelStatus(htmlText, isAlert = false) {
    const box = document.getElementById('wheelStatusBox');
    if (!box) return;
    box.innerHTML = htmlText;
    box.classList.toggle('respin-alert', isAlert);
  }

  /* ========================================================================
     LA RULETA INTERACTIVA EN CANVAS Y FÍSICA DE GIRO (Sección 5)
     ======================================================================== */
  drawWheel() {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const outerRadius = w / 2 - 8;
    const rimRadius = outerRadius - 14;
    const numSlices = WHEEL_SLICES.length;
    const arc = (Math.PI * 2) / numSlices;

    ctx.clearRect(0, 0, w, h);

    // Aro exterior estilo Preguntados
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#dce4f0';
    ctx.stroke();
    ctx.restore();

    // Dibujar las 7 secciones radiales
    for (let i = 0; i < numSlices; i++) {
      const slice = WHEEL_SLICES[i];
      const startAngle = this.wheelAngle + i * arc;
      const endAngle = startAngle + arc;
      const midAngle = startAngle + arc / 2;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, rimRadius, startAngle, endAngle);
      ctx.closePath();

      // Gradiente radial vibrante por casilla
      const grad = ctx.createRadialGradient(cx, cy, 40, cx, cy, rimRadius);
      grad.addColorStop(0, slice.color);
      grad.addColorStop(1, slice.darkColor);
      ctx.fillStyle = grad;
      ctx.fill();

      // Líneas divisorias blancas gruesas estilo Preguntados
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();

      // Dibujar arte/icono y etiqueta en cada sección radial
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);

      // Medallón blanco circular para el arte de la categoría
      const iconDist = rimRadius * 0.64;
      ctx.beginPath();
      ctx.arc(iconDist, 0, 31, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.stroke();

      const img = this.loadedImages[slice.art];
      if (img) {
        ctx.save();
        ctx.translate(iconDist, 0);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, -22, -22, 44, 44);
        ctx.restore();
      }

      // Texto de la sección
      ctx.save();
      ctx.translate(rimRadius * 0.87, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px Fredoka, Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 4;
      ctx.fillText(slice.shortName, 0, 0);
      ctx.restore();

      ctx.restore();
    }

    // Pernos dorados en el borde de la ruleta
    const totalPegs = numSlices * 2;
    for (let p = 0; p < totalPegs; p++) {
      const pegAngle = this.wheelAngle + (p * Math.PI * 2) / totalPegs;
      const px = cx + Math.cos(pegAngle) * (outerRadius - 6);
      const py = cy + Math.sin(pegAngle) * (outerRadius - 6);
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = p % 2 === 0 ? '#ffd54f' : '#cbd5e1';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#475569';
      ctx.stroke();
      ctx.restore();
    }
  }

  // Calcula qué índice de WHEEL_SLICES está bajo la aguja superior (-PI/2)
  getSliceIndexAtPointer(angle) {
    const numSlices = WHEEL_SLICES.length;
    const arc = (Math.PI * 2) / numSlices;
    const pointerAngle = -Math.PI / 2;
    let relativeAngle = (pointerAngle - angle) % (Math.PI * 2);
    if (relativeAngle < 0) relativeAngle += Math.PI * 2;
    return Math.floor(relativeAngle / arc) % numSlices;
  }

  spinWheel(forcedSliceIndex = null, isAutoRespin = false, fromRemote = false) {
    if (this.isSpinning || !this.state || this.state.finished) return;
    if (this.isOnline && !fromRemote && !this.isMyTurn()) return;

    this.isSpinning = true;
    const spinBtn = document.getElementById('btnSpinWheel');
    if (spinBtn) spinBtn.disabled = true;

    const numSlices = WHEEL_SLICES.length;
    const arc = (Math.PI * 2) / numSlices;
    const activePlayer = this.getActivePlayer();

    // Elegir casilla destino
    let targetSliceIdx;
    if (typeof forcedSliceIndex === 'number') {
      targetSliceIdx = forcedSliceIndex;
    } else if (isAutoRespin) {
      // En un regiro automático (Opción A), garantizamos caer en una categoría pendiente o en Corona
      const validIndices = WHEEL_SLICES.map((s, idx) => ({ s, idx })).filter(
        (item) => item.s.isCrown || !activePlayer.categories[item.s.key].won
      );
      const chosen = validIndices[Math.floor(Math.random() * validIndices.length)];
      targetSliceIdx = chosen.idx;
    } else {
      targetSliceIdx = Math.floor(Math.random() * numSlices);
    }

    // Sincronizar giro en partida online
    if (this.isOnline && !fromRemote) {
      window.multiplayerManager.sendAction('SPIN', {
        targetSliceIdx,
        isAutoRespin
      });
    }

    // Calcular ángulo exacto para que el centro de targetSliceIdx quede bajo -PI/2
    const pointerAngle = -Math.PI / 2;
    const randomOffsetInsideSlice = (Math.random() * 0.56 + 0.22) * arc;
    const desiredFinalAngleMod =
      (pointerAngle - (targetSliceIdx * arc + randomOffsetInsideSlice) + Math.PI * 4) % (Math.PI * 2);

    const currentMod = ((this.wheelAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let deltaAngle = desiredFinalAngleMod - currentMod;
    if (deltaAngle <= 0) deltaAngle += Math.PI * 2;

    const fullRotations = (isAutoRespin ? 4 : 5 + Math.floor(Math.random() * 2)) * (Math.PI * 2);
    const startAngle = this.wheelAngle;
    const totalRotation = fullRotations + deltaAngle;
    const duration = isAutoRespin ? 2400 : 3200;
    const startTime = performance.now();

    let lastSliceUnderPointer = this.getSliceIndexAtPointer(startAngle);
    const pointerEl = document.getElementById('wheelPointer');

    if (!isAutoRespin) {
      this.setWheelStatus(`🎡 Girando la ruleta para <strong>${activePlayer.name}</strong>...`);
    }

    const animateSpin = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Física de frenado suave (easeOutQuart)
      const eased = 1 - Math.pow(1 - progress, 4);

      this.wheelAngle = startAngle + totalRotation * eased;
      this.drawWheel();

      const currentSlice = this.getSliceIndexAtPointer(this.wheelAngle);
      if (currentSlice !== lastSliceUnderPointer) {
        lastSliceUnderPointer = currentSlice;
        window.soundEngine.playWheelTick(1 - progress);
        if (pointerEl) {
          pointerEl.classList.add('tick-bounce');
          setTimeout(() => pointerEl.classList.remove('tick-bounce'), 55);
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        this.isSpinning = false;
        if (spinBtn) spinBtn.disabled = this.isOnline && !this.isMyTurn();
        const landedSlice = WHEEL_SLICES[targetSliceIdx];
        this.onWheelStopped(landedSlice);
      }
    };

    requestAnimationFrame(animateSpin);
  }

  onWheelStopped(landedSlice) {
    const activePlayer = this.getActivePlayer();

    // Caso 1: Cayó en CORONA 👑
    if (landedSlice.isCrown) {
      window.soundEngine.playCrownLand();
      if (this.isOnline && !this.isMyTurn()) {
        this.setWheelStatus(
          `👑 ¡CASILLA DE CORONA! <strong>${activePlayer.name}</strong> está eligiendo en su dispositivo qué categoría disputar...`
        );
        return;
      }
      this.setWheelStatus(
        `👑 ¡CASILLA DE CORONA! <strong>${activePlayer.name}</strong> elige qué categoría disputar. ¡Tus puntos acumulados activan el BONUS de intentos!`
      );
      setTimeout(() => this.openCrownModal(), 550);
      return;
    }

    // Caso 2: Regla Oficial Opción A - Categoría ya ganada -> Regiro Automático
    const playerCatState = activePlayer.categories[landedSlice.key];
    if (playerCatState && playerCatState.won) {
      window.soundEngine.playReSpinAlert();
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

    // Caso 3: Categoría pendiente ordinaria (sin bonus: 1 intento para sumar +1 punto)
    window.soundEngine.playCategoryLand();
    const prevPoints = playerCatState.points;

    this.setWheelStatus(
      `🎯 Cayó en <strong>${landedSlice.name}</strong> (${landedSlice.character}). ` +
        `Tienes ${prevPoints}/3 puntos. ¡Responde la pregunta para sumar +1 punto!`
    );

    setTimeout(() => {
      if (!this.isOnline || this.isMyTurn()) {
        this.startCategoryTurn(landedSlice, false);
      }
    }, 650);
  }

  /* ========================================================================
     MODO CORONA 👑 (Sección 7.B)
     ======================================================================== */
  openCrownModal() {
    const activePlayer = this.getActivePlayer();
    const modal = document.getElementById('crownModal');
    document.getElementById('crownModalPlayerName').textContent =
      `${activePlayer.name} ${activePlayer.avatar}, elige una categoría pendiente para disputar su corona. ¡Tus puntos acumulados activan el BONUS de intentos!`;

    const grid = document.getElementById('crownCategoryGrid');
    grid.innerHTML = CATEGORIES.map((cat) => {
      const won = activePlayer.categories[cat.key].won;
      const pts = activePlayer.categories[cat.key].points;
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

    grid.querySelectorAll('.crown-choice-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const catKey = btn.dataset.cat;
        const catObj = CATEGORIES.find((c) => c.key === catKey);
        if (!catObj) return;
        window.soundEngine.playClick();
        modal.close();

        const card = this.drawCardForCategory(catObj.key);
        if (this.isOnline) {
          window.multiplayerManager.sendAction('CROWN_CHOSEN', {
            categoryKey: catObj.key,
            card
          });
        }
        this.startCategoryTurn(catObj, true, card);
      });
    });

    modal.scrollTop = 0;
    modal.showModal();
  }

  /* ========================================================================
     TURNOS DE PREGUNTA Y REGLA DE BONUS (MODALIDAD JUEGO DE MESA)
     ======================================================================== */
  startCategoryTurn(categoryObj, isCrownChallenge = false, providedCard = null) {
    const activePlayer = this.getActivePlayer();
    const readerPlayer = this.state.players[(this.state.currentPlayerIndex + 1) % 2];
    const catState = activePlayer.categories[categoryObj.key];
    const card = providedCard || this.drawCardForCategory(categoryObj.key);

    if (this.isOnline && this.isMyTurn() && !providedCard) {
      window.multiplayerManager.sendAction('START_QUESTION', {
        categoryKey: categoryObj.key,
        card,
        isCrownChallenge
      });
    }

    // El Bonus por puntos acumulados solo funciona en el Desafío de Corona. En categoría normal es siempre 1 intento.
    const maxAttempts = isCrownChallenge ? Math.min(3, catState.points + 1) : 1;

    this.activeTurnContext = {
      category: categoryObj,
      card,
      isCrownChallenge,
      maxAttempts,
      currentAttemptIndex: 0, // 0 -> Pregunta 1, 1 -> Pregunta 2, 2 -> Pregunta 3
      answered: false,
      readerPlayer
    };

    this.renderQuestionAttempt();
    const qModal = document.getElementById('questionModal');
    if (!qModal.open) {
      qModal.scrollTop = 0;
      qModal.showModal();
    }
  }

  /* ========================================================================
     GESTIÓN DE COMODINES POR PARTIDA (3 usos por comodín por jugador)
     ======================================================================== */
  updateComodinesUI() {
    const ctx = this.activeTurnContext;
    if (!ctx) return;
    const activePlayer = this.getActivePlayer();
    const c = activePlayer.comodines || { dobleOportunidad: 3, bomba: 3 };

    const btnDoble = document.getElementById('btnComodinDoble');
    const badgeDoble = document.getElementById('qCountDoble');
    const btnBomba = document.getElementById('btnComodinBomba');
    const badgeBomba = document.getElementById('qCountBomba');

    if (badgeDoble) badgeDoble.textContent = `${c.dobleOportunidad} / 3`;
    if (badgeBomba) badgeBomba.textContent = `${c.bomba} / 3`;

    if (btnDoble) {
      if (ctx.dobleOportunidadActiva) {
        btnDoble.className = 'btn-comodin active';
        btnDoble.disabled = true;
      } else if (ctx.dobleOportunidadUsada) {
        btnDoble.className = 'btn-comodin used';
        btnDoble.disabled = true;
      } else if (c.dobleOportunidad <= 0 || ctx.answered) {
        btnDoble.className = 'btn-comodin';
        btnDoble.disabled = true;
      } else {
        btnDoble.className = 'btn-comodin';
        btnDoble.disabled = false;
      }
    }

    if (btnBomba) {
      if (ctx.bombaUsada) {
        btnBomba.className = 'btn-comodin used';
        btnBomba.disabled = true;
      } else if (c.bomba <= 0 || ctx.answered) {
        btnBomba.className = 'btn-comodin';
        btnBomba.disabled = true;
      } else {
        btnBomba.className = 'btn-comodin';
        btnBomba.disabled = false;
      }
    }
  }

  useComodinDoble() {
    const ctx = this.activeTurnContext;
    if (!ctx || ctx.answered || ctx.dobleOportunidadUsada) return;
    const activePlayer = this.getActivePlayer();
    if (!activePlayer.comodines || activePlayer.comodines.dobleOportunidad <= 0) return;

    activePlayer.comodines.dobleOportunidad -= 1;
    ctx.dobleOportunidadActiva = true;
    ctx.dobleOportunidadUsada = true;

    window.soundEngine.playPowerUp();
    this.updateComodinesUI();

    if (this.isOnline) {
      window.multiplayerManager.sendAction('USE_COMODIN', { type: 'doble' });
    }

    const statusMsg = document.getElementById('qComodinStatusMsg');
    if (statusMsg) {
      statusMsg.className = 'comodin-status-msg';
      statusMsg.textContent = `✨ ¡Comodín Doble Oportunidad activado para ${activePlayer.name}! Si fallas en tu primera opción, tendrás una 2ª oportunidad.`;
      statusMsg.style.display = 'block';
    }

    this.saveMatchState();
    this.renderBoard();
  }

  useComodinBomba() {
    const ctx = this.activeTurnContext;
    if (!ctx || ctx.answered || ctx.bombaUsada) return;
    const activePlayer = this.getActivePlayer();
    if (!activePlayer.comodines || activePlayer.comodines.bomba <= 0) return;

    const questionObj = ctx.card.preguntas[ctx.currentAttemptIndex] || ctx.card.preguntas[0];
    const correctIdx = questionObj.respuesta_correcta;

    // Obtener índices incorrectos que no hayan sido ya fallados en un primer intento
    const availableIncorrect = [0, 1, 2, 3].filter(
      (idx) => idx !== correctIdx && (!ctx.failedOptions || !ctx.failedOptions.has(idx))
    );

    if (availableIncorrect.length < 2) return;

    activePlayer.comodines.bomba -= 1;
    ctx.bombaUsada = true;

    // Seleccionar 2 opciones incorrectas al azar para eliminar
    const shuffled = [...availableIncorrect].sort(() => Math.random() - 0.5);
    const toEliminate = shuffled.slice(0, 2);

    ctx.eliminatedOptions = ctx.eliminatedOptions || new Set();
    toEliminate.forEach((idx) => ctx.eliminatedOptions.add(idx));

    window.soundEngine.playBomb();

    if (this.isOnline) {
      window.multiplayerManager.sendAction('USE_COMODIN', {
        type: 'bomba',
        eliminatedIndices: toEliminate
      });
    }

    // Actualizar visualmente las opciones eliminadas
    const optionButtons = document.querySelectorAll('#qOptionsList .option-btn');
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

    this.updateComodinesUI();

    const statusMsg = document.getElementById('qComodinStatusMsg');
    if (statusMsg) {
      statusMsg.className = 'comodin-status-msg';
      statusMsg.textContent = `💣 ¡Bomba 50:50 detonada! Se descartaron 2 opciones falsas. Quedan 2 opciones disponibles.`;
      statusMsg.style.display = 'block';
    }

    this.saveMatchState();
    this.renderBoard();
  }

  renderQuestionAttempt() {
    const ctx = this.activeTurnContext;
    if (!ctx) return;

    ctx.answered = false;
    ctx.dobleOportunidadActiva = false;
    ctx.dobleOportunidadUsada = false;
    ctx.bombaUsada = false;
    ctx.eliminatedOptions = new Set();
    ctx.failedOptions = new Set();

    const qModal = document.getElementById('questionModal');
    if (qModal) qModal.scrollTop = 0;
    const activePlayer = this.getActivePlayer();
    const readerPlayer = ctx.readerPlayer;
    const cat = ctx.category;
    const questionObj = ctx.card.preguntas[ctx.currentAttemptIndex] || ctx.card.preguntas[0];
    const attemptNumber = ctx.currentAttemptIndex + 1;

    // Actualizar nombre e interfaz de comodines
    const comodinesPlayerName = document.getElementById('qComodinesPlayerName');
    if (comodinesPlayerName) comodinesPlayerName.textContent = activePlayer.name;

    const comodinStatusMsg = document.getElementById('qComodinStatusMsg');
    if (comodinStatusMsg) {
      comodinStatusMsg.style.display = 'none';
      comodinStatusMsg.className = 'comodin-status-msg';
      comodinStatusMsg.textContent = '';
    }

    this.updateComodinesUI();

    // Cabecera temática con el color y arte de la categoría
    const header = document.getElementById('qModalHeader');
    header.style.background = `linear-gradient(135deg, ${cat.color}, ${cat.darkColor})`;

    document.getElementById('qModalArt').src = cat.art;
    document.getElementById('qModalArt').alt = cat.name;
    document.getElementById('qModalCatTitle').textContent = `${cat.name} · ${cat.character}`;
    document.getElementById('qModalCardId').textContent = `Carta: ${ctx.card.carta_id}`;

    // Insignia del Lector y Barra de Instrucción
    document.getElementById('qReaderPlayerBadge').textContent = `${readerPlayer.name} ${readerPlayer.avatar}`;
    document.getElementById('qReaderNameSpan').textContent = readerPlayer.name;
    document.getElementById('qResponderNameSpan').textContent = activePlayer.name;

    // Configurar pantalla de privacidad y modo lector según si es Online o Local
    if (this.isOnline) {
      if (this.isMyTurn()) {
        // TÚ ERES EL QUE RESPONDE: ves la pantalla de espera
        document.getElementById('qPrivacyShield').style.display = 'flex';
        document.getElementById('qCardInteractiveContent').style.display = 'none';

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
        // TÚ ERES EL LECTOR: ves la pregunta y respuestas para leérselas a tu rival
        document.getElementById('qPrivacyShield').style.display = 'none';
        document.getElementById('qCardInteractiveContent').style.display = 'block';

        const instructEl = document.getElementById('qReaderInstructionBar');
        if (instructEl) {
          instructEl.innerHTML = `
            📢 <strong>${readerPlayer.name}</strong>, lee en voz alta para <strong>${activePlayer.name}</strong>.<br>
            La respuesta correcta está marcada en verde para ti. Cuando tu rival te diga su respuesta, haz clic en la opción elegida.
          `;
        }
      }
    } else {
      // Modo Local (Hotseat en una sola computadora)
      document.getElementById('qPrivacyShield').style.display = 'flex';
      document.getElementById('qCardInteractiveContent').style.display = 'none';
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

    document.getElementById('privacyResponderName').textContent = `${activePlayer.name} ${activePlayer.avatar}`;
    document.getElementById('privacyReaderName').textContent = `${readerPlayer.name} ${readerPlayer.avatar}`;
    document.getElementById('privacyWarnResponder').textContent = activePlayer.name;
    document.getElementById('privacyWarnReader').textContent = readerPlayer.name;
    document.getElementById('btnRevealCardToReader').innerHTML =
      `👁️ SOY ${readerPlayer.name.toUpperCase()} ${readerPlayer.avatar}: MOSTRAR PREGUNTA`;

    const attemptBadge = document.getElementById('qModalAttemptBadge');
    if (ctx.isCrownChallenge) {
      if (ctx.maxAttempts > 1) {
        attemptBadge.textContent = `👑 BONUS CORONA: Intento ${attemptNumber} de ${ctx.maxAttempts}`;
        attemptBadge.className = 'q-meta-pill bonus-pill';
      } else {
        attemptBadge.textContent = '👑 DESAFÍO DE CORONA (1 Intento)';
        attemptBadge.className = 'q-meta-pill bonus-pill';
      }
    } else {
      attemptBadge.textContent = `Pregunta Normal · Intento 1 de 1`;
      attemptBadge.className = 'q-meta-pill';
    }

    // Banner explicativo de Bonus (solo activo en el Desafío de Corona)
    const bonusBanner = document.getElementById('qBonusExplainer');
    if (ctx.isCrownChallenge) {
      bonusBanner.style.display = 'flex';
      const prevPts = activePlayer.categories[cat.key].points;
      if (ctx.maxAttempts > 1) {
        bonusBanner.innerHTML = `👑 🎁 <span><strong>¡Desafío de Corona con Bonus!</strong> Gracias a tus <strong>${prevPts}/3 puntos</strong> en ${cat.name}, dispones de <strong>hasta ${ctx.maxAttempts} preguntas</strong> para ganar la Corona.</span>`;
      } else {
        bonusBanner.innerHTML = `👑 <span><strong>¡Desafío de Corona!</strong> Tienes 0 puntos previos (1 intento). Si ${activePlayer.name} responde bien, conquista <strong>${cat.name}</strong> directamente.</span>`;
      }
    } else {
      bonusBanner.style.display = 'none';
    }

    // Enunciado de la pregunta y etiqueta del que responde
    document.getElementById('qTurnPlayerTag').innerHTML =
      ctx.isCrownChallenge && ctx.maxAttempts > 1
        ? `👑 Responde: <strong>${activePlayer.name} ${activePlayer.avatar}</strong> — Desafío de Corona (Pregunta #${attemptNumber} de ${ctx.maxAttempts})`
        : ctx.isCrownChallenge
        ? `👑 Responde: <strong>${activePlayer.name} ${activePlayer.avatar}</strong> — Desafío de Corona (1 Intento)`
        : `🎯 Responde: <strong>${activePlayer.name} ${activePlayer.avatar}</strong> — Pregunta Normal (+1 punto)`;
    document.getElementById('qStatementText').textContent = questionObj.enunciado;

    // Renderizar las 4 opciones estilo Juego de Mesa:
    // Con la respuesta correcta identificada para el lector
    const letters = ['A', 'B', 'C', 'D'];
    const optionsContainer = document.getElementById('qOptionsList');
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
      btn.title = isCorrectAnswer ? 'Respuesta correcta visible para el lector' : '';
      btn.addEventListener('click', () => {
        if (this.isOnline) {
          if (this.isMyTurn()) {
            // El jugador en turno no selecciona la respuesta en pantalla; se la dice en voz alta a su rival
            return;
          }
          // El lector registra la opción seleccionada por su rival
          window.multiplayerManager.sendAction('SUBMIT_ANSWER', { selectedIndex: idx });
        }
        this.submitAnswer(idx);
      });
      optionsContainer.appendChild(btn);
    });

    // Ocultar panel de feedback hasta que el lector registre la respuesta
    const fb = document.getElementById('qFeedbackPanel');
    fb.className = 'feedback-panel';
    fb.innerHTML = '';
  }

  submitAnswer(selectedIndex, fromRemote = false) {
    const ctx = this.activeTurnContext;
    if (!ctx || ctx.answered) return;

    // Destapar y mostrar la tarjeta completa con la pregunta y respuestas en ambas pantallas
    document.getElementById('qPrivacyShield').style.display = 'none';
    document.getElementById('qCardInteractiveContent').style.display = 'block';

    // Si la opción fue descartada por Bomba o ya falló en el primer intento, ignorar clic
    if (ctx.eliminatedOptions && ctx.eliminatedOptions.has(selectedIndex)) return;
    if (ctx.failedOptions && ctx.failedOptions.has(selectedIndex)) return;

    const activePlayer = this.getActivePlayer();
    const cat = ctx.category;
    const catState = activePlayer.categories[cat.key];
    const questionObj = ctx.card.preguntas[ctx.currentAttemptIndex] || ctx.card.preguntas[0];
    const correctIndex = questionObj.respuesta_correcta;
    const isCorrect = selectedIndex === correctIndex;

    // CASO ESPECIAL: Comodín Doble Oportunidad activo y el jugador falló su 1ª elección
    if (!isCorrect && ctx.dobleOportunidadActiva) {
      ctx.dobleOportunidadActiva = false; // Se consume el beneficio
      ctx.failedOptions = ctx.failedOptions || new Set();
      ctx.failedOptions.add(selectedIndex);

      window.soundEngine.playSecondChance();

      const optionButtons = document.querySelectorAll('#qOptionsList .option-btn');
      const failedBtn = optionButtons[selectedIndex];
      if (failedBtn) {
        failedBtn.disabled = true;
        failedBtn.classList.add('first-attempt-failed');
        const badge = document.createElement('span');
        badge.className = 'first-fail-tag';
        badge.textContent = '❌ 1º INTENTO FALLIDO';
        failedBtn.appendChild(badge);
      }

      this.updateComodinesUI();

      const statusMsg = document.getElementById('qComodinStatusMsg');
      if (statusMsg) {
        statusMsg.className = 'comodin-status-msg warning';
        statusMsg.textContent = `⚠️ ¡Opción incorrecta! Tu comodín te otorga tu 2ª y última oportunidad: ${activePlayer.name}, ¡elige otra respuesta!`;
        statusMsg.style.display = 'block';
      }

      return; // El turno continúa en la misma pregunta sin cerrar
    }

    ctx.answered = true;
    this.updateComodinesUI();

    // Estadísticas del jugador
    activePlayer.totalQuestions += 1;
    catState.attemptCount += 1;

    // Marcar visualmente los botones de opción tras responder
    const optionButtons = document.querySelectorAll('#qOptionsList .option-btn');
    optionButtons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === correctIndex) {
        btn.classList.add('correct');
      } else if (idx === selectedIndex && !isCorrect) {
        btn.classList.add('wrong');
      }
    });

    const fb = document.getElementById('qFeedbackPanel');

    if (isCorrect) {
      activePlayer.totalCorrect += 1;
      catState.correctCount += 1;
      if (ctx.currentAttemptIndex > 0) {
        activePlayer.bonusSaves += 1;
      }

      let feedbackHeadline = '';
      let feedbackDetail = '';

      if (ctx.isCrownChallenge) {
        // Ganó la categoría directamente por Corona
        catState.points = 3;
        catState.won = true;
        catState.wonByCrown = true;
        activePlayer.crowns += 1;
        window.soundEngine.playCategoryWin();
        feedbackHeadline =
          ctx.currentAttemptIndex > 0
            ? `👑 ✨ ¡ACIERTO EN TU BONUS DE CORONA! ¡CONQUISTAS ${cat.name.toUpperCase()}!`
            : `👑 ¡RESPUESTA CORRECTA! ¡CONQUISTAS ${cat.name.toUpperCase()}!`;
        feedbackDetail = `${activePlayer.name} gana directamente la corona de ${cat.name} (${cat.character}).`;
      } else {
        // Suma +1 punto en la categoría
        catState.points = Math.min(3, catState.points + 1);
        if (catState.points >= 3) {
          catState.won = true;
          activePlayer.crowns += 1;
          window.soundEngine.playCategoryWin();
          feedbackHeadline = `🎉 ¡LLEGASTE A 3/3 PUNTOS! ¡CORONA DE ${cat.name.toUpperCase()} GANADA!`;
          feedbackDetail = `${activePlayer.name} completa los 3 puntos y conquista a ${cat.character}.`;
        } else {
          window.soundEngine.playCorrect();
          feedbackHeadline = `✅ ¡RESPUESTA CORRECTA! (+1 Punto en ${cat.name})`;
          feedbackDetail = `Ahora tienes ${catState.points}/3 puntos en ${cat.name}. (¡Estos puntos te darán intentos extra de Bonus cuando caiga la Corona 👑!)`;
        }
      }

      this.saveMatchState();
      this.renderBoard();

      // Verificar condición de victoria (6 coronas)
      if (activePlayer.crowns >= 6) {
        this.state.finished = true;
        this.state.winnerIndex = this.state.currentPlayerIndex;
        this.saveMatchState();

        fb.className = 'feedback-panel visible success';
        fb.innerHTML = `
          <div class="feedback-title">🏆 ${feedbackHeadline}</div>
          <p>${activePlayer.name} ha completado las 6 categorías de <strong>pregunta2</strong>.</p>
          <button type="button" class="btn-3d btn-3d-orange" id="btnShowVictoryScreen">
            🏆 VER CORONACIÓN Y ESTADÍSTICAS
          </button>
        `;
        document.getElementById('btnShowVictoryScreen').addEventListener('click', () => {
          document.getElementById('questionModal').close();
          this.openVictoryModal();
        });
        this.focusAndScrollFeedback();
        return;
      }

      const nextPlayer = this.state.players[(this.state.currentPlayerIndex + 1) % 2];
      fb.className = 'feedback-panel visible success';
      fb.innerHTML = `
        <div class="feedback-title">${feedbackHeadline}</div>
        <p>${feedbackDetail}</p>
        <button type="button" class="btn-3d btn-3d-blue" id="btnFinishTurnSuccess">
          ➡️ PASAR TURNO A ${nextPlayer.name.toUpperCase()} ${nextPlayer.avatar}
        </button>
      `;
      document.getElementById('btnFinishTurnSuccess').addEventListener('click', () => {
        window.soundEngine.playClick();
        if (this.isOnline) {
          window.multiplayerManager.sendAction('NEXT_TURN');
        }
        this.advanceToNextTurn();
      });
      this.focusAndScrollFeedback();
    } else {
      // Falló la pregunta
      window.soundEngine.playWrong();
      const correctText = questionObj.opciones[correctIndex];

      // ¿Tiene más intentos por Regla de Bonus? (Solo aplica en Desafío de Corona)
      if (ctx.isCrownChallenge && ctx.currentAttemptIndex + 1 < ctx.maxAttempts) {
        const nextAttemptNum = ctx.currentAttemptIndex + 2;
        fb.className = 'feedback-panel visible error';
        fb.innerHTML = `
          <div class="feedback-title">
            ❌ ¡Fallaste este intento de Corona!
          </div>
          <p>La respuesta correcta era: <strong>${correctText}</strong>.<br>
             ¡Pero tus <strong>${catState.points}/3 PUNTOS PREVIOS</strong> activan tu <strong>BONUS DE CORONA</strong>! Dispones de una <strong>OPORTUNIDAD #${nextAttemptNum}</strong> con la siguiente pregunta de la carta.</p>
          <button type="button" class="btn-3d btn-3d-orange" id="btnNextBonusAttempt">
            🎁 LEER SIGUIENTE PREGUNTA DE BONUS (${nextAttemptNum} de ${ctx.maxAttempts})
          </button>
        `;
        document.getElementById('btnNextBonusAttempt').addEventListener('click', () => {
          window.soundEngine.playClick();
          if (this.isOnline) {
            window.multiplayerManager.sendAction('NEXT_BONUS');
          }
          ctx.currentAttemptIndex += 1;
          this.renderQuestionAttempt();
        });
        this.focusAndScrollFeedback();
      } else {
        // Sin más intentos (o categoría normal): termina el turno con 0 puntos sumados
        this.saveMatchState();
        const nextPlayer = this.state.players[(this.state.currentPlayerIndex + 1) % 2];
        fb.className = 'feedback-panel visible error';
        fb.innerHTML = `
          <div class="feedback-title">
            ❌ Respuesta incorrecta
          </div>
          <p>La respuesta correcta era: <strong>${correctText}</strong>.<br>
             ${
               ctx.isCrownChallenge
                 ? `No ganas la corona en este turno, pero conservas tus ${catState.points}/3 puntos en ${cat.name}.`
                 : `No sumas puntos en este turno (mantienes ${catState.points}/3 en ${cat.name}).`
             }</p>
          <button type="button" class="btn-3d btn-3d-blue" id="btnFinishTurnFail">
            ➡️ PASAR TURNO A ${nextPlayer.name.toUpperCase()} ${nextPlayer.avatar}
          </button>
        `;
        document.getElementById('btnFinishTurnFail').addEventListener('click', () => {
          window.soundEngine.playClick();
          if (this.isOnline) {
            window.multiplayerManager.sendAction('NEXT_TURN');
          }
          this.advanceToNextTurn();
        });
        this.focusAndScrollFeedback();
      }
    }
  }

  /* Asegura visibilidad inmediata del botón de acción y foco accesible */
  focusAndScrollFeedback() {
    if (typeof requestAnimationFrame !== 'function') return;
    requestAnimationFrame(() => {
      const fb = document.getElementById('qFeedbackPanel');
      const actionBtn =
        document.getElementById('btnFinishTurnSuccess') ||
        document.getElementById('btnFinishTurnFail') ||
        document.getElementById('btnNextBonusAttempt') ||
        document.getElementById('btnShowVictoryScreen');

      if (actionBtn) {
        actionBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        try {
          actionBtn.focus({ preventScroll: true });
        } catch (_) {
          actionBtn.focus();
        }
      } else if (fb) {
        fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  advanceToNextTurn(fromRemote = false) {
    const qModal = document.getElementById('questionModal');
    if (qModal.open) qModal.close();

    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % 2;
    this.state.turnNumber += 1;
    this.saveMatchState();
    if (this.isOnline && this.myPlayerIndex === 0) {
      window.multiplayerManager.syncGameState(this.state);
    }
    this.renderBoard();

    const activePlayer = this.getActivePlayer();
    if (this.isOnline) {
      if (this.isMyTurn()) {
        this.setWheelStatus(
          `🎯 ¡Es tu turno, <strong>${activePlayer.name} ${activePlayer.avatar}</strong>! Pulsa [GIRAR] en la ruleta.`
        );
      } else {
        this.setWheelStatus(
          `⏳ Es el turno de <strong>${activePlayer.name} ${activePlayer.avatar}</strong>. Esperando su tirada...`
        );
      }
    } else {
      this.setWheelStatus(
        `🎲 Turno de <strong>${activePlayer.name} ${activePlayer.avatar}</strong>. ¡Pulsa [GIRAR] en la ruleta!`
      );
    }

    // Foco automático en el botón de girar ruleta para agilizar el siguiente turno
    const spinBtn = document.getElementById('btnSpinWheel');
    if (spinBtn && !spinBtn.disabled) {
      setTimeout(() => {
        try {
          spinBtn.focus();
        } catch (_) {}
      }, 80);
    }
  }

  /* ========================================================================
     CONDICIÓN DE VICTORIA Y PANTALLA ESTADÍSTICA FINAL (Sección 9)
     ======================================================================== */
  openVictoryModal() {
    window.soundEngine.playVictory();
    localStorage.removeItem(STORAGE_MATCH_KEY);

    const winner = this.state.players[this.state.winnerIndex ?? 0];
    const totalSec = this.state.elapsedSecondsBeforeResume || 1;
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;

    document.getElementById('victoryTitle').textContent =
      `🎉 ¡${winner.name.toUpperCase()} ${winner.avatar} ES EL CAMPEÓN DE PREGUNTA2! 🎉`;
    document.getElementById('victorySubtitle').textContent =
      `¡Ha conquistado las 6 categorías de conocimiento en ${mins}m ${secs}s!`;

    const findBestCategory = (player) => {
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
    grid.innerHTML = this.state.players
      .map((p) => {
        const acc = p.totalQuestions > 0 ? Math.round((p.totalCorrect / p.totalQuestions) * 100) : 0;
        const c = p.comodines || { dobleOportunidad: 3, bomba: 3 };
        const dobleUsed = 3 - c.dobleOportunidad;
        const bombaUsed = 3 - c.bomba;
        return `
        <div class="stat-box">
          <h4>${p.avatar} ${p.name} (${p.crowns}/6 Coronas 👑)</h4>
          <ul class="stat-list">
            <li>• Aciertos totales: <strong>${p.totalCorrect} / ${p.totalQuestions} (${acc}%)</strong></li>
            <li>• Categoría más dominada: <strong>${findBestCategory(p)}</strong></li>
            <li>• Reintentos de Bonus aprovechados: <strong>${p.bonusSaves}</strong></li>
            <li>• Comodines usados: <strong>${dobleUsed}/3 Doble · ${bombaUsed}/3 Bomba</strong></li>
          </ul>
        </div>
      `;
      })
      .join('');

    document.getElementById('victoryTotalTime').textContent =
      `⏱️ Tiempo total de la partida: ${mins} minuto(s) y ${secs} segundo(s) · Turnos jugados: ${this.state.turnNumber}`;

    const vModal = document.getElementById('victoryModal');
    if (vModal) {
      vModal.scrollTop = 0;
      vModal.showModal();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.pregunta2App = new Pregunta2Game();
});
