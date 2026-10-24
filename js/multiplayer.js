/**
 * Módulo Multijugador Online en Tiempo Real para pregunta2
 * Utiliza Firebase Realtime Database para sincronizar partidas entre 2 dispositivos.
 */

(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyABJhvwXwn2bzk8ejZOxtzBqrkcW8dTfTA",
    authDomain: "preguta2.firebaseapp.com",
    databaseURL: "https://preguta2-default-rtdb.firebaseio.com",
    projectId: "preguta2",
    storageBucket: "preguta2.firebasestorage.app",
    messagingSenderId: "163244491417",
    appId: "1:163244491417:web:5c3a1ded2eadea69932e08",
    measurementId: "G-TJ43EEJVQE"
  };

  class MultiplayerManager {
    constructor() {
      this.db = null;
      this.initialized = false;
      this.roomCode = null;
      this.myPlayerIndex = null; // 0 = Anfitrión (J1), 1 = Invitado (J2)
      this.myProfile = null;     // { name, avatar, color }
      this.roomRef = null;
      this.actionRef = null;
      this.roomData = null;
      this.isOnline = false;
      this.lastProcessedActionId = null;
      this.guestJoinedHandled = false;

      this.initFirebase();
    }

    initFirebase() {
      try {
        if (typeof firebase !== 'undefined') {
          if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
          }
          this.db = firebase.database();
          this.initialized = true;
          console.log('✅ Firebase Realtime Database inicializado correctamente.');
        } else {
          console.warn('⚠️ SDK de Firebase no encontrado.');
        }
      } catch (err) {
        console.error('❌ Error al inicializar Firebase:', err);
      }
    }

    // Genera un código de sala de 5 caracteres alfanuméricos fáciles de leer
    generateRoomCode() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    /**
     * Crear una nueva sala como Anfitrión (Jugador 1)
     */
    async createRoom(hostProfile, difficulty = 'media') {
      if (!this.initialized) throw new Error('Firebase no está disponible.');

      const roomCode = this.generateRoomCode();
      this.roomCode = roomCode;
      this.myPlayerIndex = 0;
      this.myProfile = hostProfile;
      this.isOnline = true;
      this.lastProcessedActionId = null;
      this.guestJoinedHandled = false;

      const roomRef = this.db.ref(`rooms/${roomCode}`);
      this.roomRef = roomRef;

      const initialRoomData = {
        code: roomCode,
        status: 'waiting', // 'waiting' -> 'playing' -> 'finished'
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        difficulty: difficulty,
        host: {
          name: hostProfile.name,
          avatar: hostProfile.avatar,
          color: hostProfile.color
        },
        guest: null,
        gameState: null,
        action: null
      };

      await roomRef.set(initialRoomData);

      // Guardar en sessionStorage para reconexión rápida si recarga la página
      sessionStorage.setItem('pregunta2_room_code', roomCode);
      sessionStorage.setItem('pregunta2_my_index', '0');

      return roomCode;
    }

    /**
     * Unirse a una sala existente como Invitado (Jugador 2)
     */
    async joinRoom(roomCode, guestProfile) {
      if (!this.initialized) throw new Error('Firebase no está disponible.');

      const cleanCode = roomCode.trim().toUpperCase();
      const roomRef = this.db.ref(`rooms/${cleanCode}`);
      const snapshot = await roomRef.once('value');

      if (!snapshot.exists()) {
        throw new Error(`La sala "${cleanCode}" no existe. Verifica el código.`);
      }

      const data = snapshot.val();
      if (data.status === 'playing' && data.guest && data.guest.name !== guestProfile.name) {
        throw new Error(`La sala "${cleanCode}" ya está llena con 2 jugadores.`);
      }

      this.roomCode = cleanCode;
      this.myPlayerIndex = 1;
      this.myProfile = guestProfile;
      this.isOnline = true;
      this.roomRef = roomRef;
      this.lastProcessedActionId = null;

      // Actualizar la sala con el Jugador 2 y cambiar estado a 'playing'
      await roomRef.update({
        guest: {
          name: guestProfile.name,
          avatar: guestProfile.avatar,
          color: guestProfile.color
        },
        status: 'playing'
      });

      sessionStorage.setItem('pregunta2_room_code', cleanCode);
      sessionStorage.setItem('pregunta2_my_index', '1');

      return data;
    }

    /**
     * Escucha cambios en tiempo real en la sala
     */
    listenToRoom(callbacks = {}) {
      if (!this.roomRef) return;

      this.roomRef.on('value', (snapshot) => {
        const val = snapshot.val();
        if (!val) return;
        this.roomData = val;

        // Callback cuando el Jugador 2 se une a la sala del anfitrión (SÓLO UNA VEZ)
        if (
          callbacks.onGuestJoined &&
          this.myPlayerIndex === 0 &&
          val.status === 'playing' &&
          val.guest &&
          !this.guestJoinedHandled
        ) {
          this.guestJoinedHandled = true;
          callbacks.onGuestJoined(val.guest, val);
        }

        // Callback cuando cambia el estado general de la partida (solo para Invitado)
        if (callbacks.onStateUpdate && this.myPlayerIndex === 1 && val.gameState) {
          callbacks.onStateUpdate(val.gameState);
        }

        // Callback para acciones sincronizadas (ruleta, respuestas, comodines)
        if (
          callbacks.onAction &&
          val.action &&
          val.action.id &&
          val.action.id !== this.lastProcessedActionId
        ) {
          this.lastProcessedActionId = val.action.id;
          if (val.action.fromIndex !== this.myPlayerIndex) {
            callbacks.onAction(val.action);
          }
        }
      });
    }

    /**
     * Envía una acción de juego para que el otro dispositivo la replique al instante
     */
    async sendAction(type, payload = {}) {
      if (!this.roomRef || !this.isOnline) return;

      const actionId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      this.lastProcessedActionId = actionId;

      const actionObj = {
        id: actionId,
        type: type, // 'SPIN', 'CROWN_CHOSEN', 'START_QUESTION', 'USE_COMODIN', 'ANSWER', 'NEXT_TURN', 'NEXT_BONUS'
        payload: payload,
        fromIndex: this.myPlayerIndex,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      };

      try {
        await this.roomRef.child('action').set(actionObj);
      } catch (err) {
        console.error('Error enviando acción:', err);
      }
    }

    /**
     * Guarda el snapshot completo del estado del juego en la sala
     */
    async syncGameState(stateObj) {
      if (!this.roomRef || !this.isOnline) return;
      try {
        // Clonar y limpiar estado para evitar referencias circulares
        const cleanState = JSON.parse(JSON.stringify(stateObj));
        await this.roomRef.child('gameState').set(cleanState);
      } catch (err) {
        console.error('Error sincronizando estado:', err);
      }
    }

    /**
     * Abandona la sala actual y limpia listeners
     */
    leaveRoom() {
      if (this.roomRef) {
        this.roomRef.off();
        this.roomRef = null;
      }
      this.roomCode = null;
      this.myPlayerIndex = null;
      this.isOnline = false;
      this.roomData = null;
      this.lastProcessedActionId = null;
      this.guestJoinedHandled = false;
      sessionStorage.removeItem('pregunta2_room_code');
      sessionStorage.removeItem('pregunta2_my_index');
    }

    isMyTurn(currentPlayerIndex) {
      if (!this.isOnline) return true;
      return this.myPlayerIndex === currentPlayerIndex;
    }

    isReader(currentPlayerIndex) {
      if (!this.isOnline) return false;
      return this.myPlayerIndex !== currentPlayerIndex;
    }
  }

  window.multiplayerManager = new MultiplayerManager();
})();
