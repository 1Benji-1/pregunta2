import { GameState } from '../types/game.types';
import { MultiplayerAction, RoomData, UserProfile } from '../types/multiplayer.types';

declare const firebase: any;

const firebaseConfig = {
  apiKey: 'AIzaSyABJhvwXwn2bzk8ejZOxtzBqrkcW8dTfTA',
  authDomain: 'preguta2.firebaseapp.com',
  databaseURL: 'https://preguta2-default-rtdb.firebaseio.com',
  projectId: 'preguta2',
  storageBucket: 'preguta2.firebasestorage.app',
  messagingSenderId: '163244491417',
  appId: '1:163244491417:web:5c3a1ded2eadea69932e08',
  measurementId: 'G-TJ43EEJVQE'
};

export interface MultiplayerCallbacks {
  onGuestJoined?: (guestProfile: UserProfile, roomData: RoomData) => void;
  onStateUpdate?: (savedState: GameState) => void;
  onAction?: (action: MultiplayerAction) => void;
}

export class MultiplayerService {
  private db: any = null;
  public initialized: boolean = false;
  public roomCode: string | null = null;
  public myPlayerIndex: number = 0; // 0 = Anfitrión (J1), 1 = Invitado (J2)
  public myProfile: UserProfile | null = null;
  public roomRef: any = null;
  public roomData: RoomData | null = null;
  public isOnline: boolean = false;
  public lastProcessedActionId: string | null = null;
  private guestJoinedHandled: boolean = false;

  constructor() {
    this.initFirebase();
  }

  public initFirebase(): void {
    try {
      if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        this.db = firebase.database();
        this.initialized = true;
      }
    } catch (err) {
      console.error('❌ Error al inicializar Firebase:', err);
    }
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public async createRoom(hostProfile: UserProfile, difficulty: string = 'media'): Promise<string> {
    if (!this.initialized) this.initFirebase();
    if (!this.initialized || !this.db) throw new Error('Firebase no está disponible.');

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
      status: 'waiting',
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
    sessionStorage.setItem('pregunta2_room_code', roomCode);
    sessionStorage.setItem('pregunta2_my_index', '0');

    return roomCode;
  }

  public async joinRoom(roomCode: string, guestProfile: UserProfile): Promise<RoomData> {
    if (!this.initialized) this.initFirebase();
    if (!this.initialized || !this.db) throw new Error('Firebase no está disponible.');

    const cleanCode = roomCode.trim().toUpperCase();
    const roomRef = this.db.ref(`rooms/${cleanCode}`);
    const snapshot = await roomRef.once('value');

    if (!snapshot.exists()) {
      throw new Error(`La sala "${cleanCode}" no existe. Verifica el código.`);
    }

    const data: RoomData = snapshot.val();
    if (data.status === 'playing' && data.guest && data.guest.name !== guestProfile.name) {
      throw new Error(`La sala "${cleanCode}" ya está llena con 2 jugadores.`);
    }

    this.roomCode = cleanCode;
    this.myPlayerIndex = 1;
    this.myProfile = guestProfile;
    this.isOnline = true;
    this.roomRef = roomRef;
    this.lastProcessedActionId = null;

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

  public listenToRoom(callbacks: MultiplayerCallbacks = {}): void {
    if (!this.roomRef) return;

    this.roomRef.on('value', (snapshot: any) => {
      const val = snapshot.val();
      if (!val) return;
      this.roomData = val;

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

      if (callbacks.onStateUpdate && this.myPlayerIndex === 1 && val.gameState) {
        callbacks.onStateUpdate(val.gameState);
      }

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

  public async sendAction(type: MultiplayerAction['type'], payload: any = {}): Promise<void> {
    if (!this.roomRef || !this.isOnline) return;

    const actionId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.lastProcessedActionId = actionId;

    const actionObj = {
      id: actionId,
      type: type,
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

  public async syncGameState(stateObj: GameState): Promise<void> {
    if (!this.roomRef || !this.isOnline) return;
    try {
      const cleanState = JSON.parse(JSON.stringify(stateObj));
      await this.roomRef.child('gameState').set(cleanState);
    } catch (err) {
      console.error('Error sincronizando estado:', err);
    }
  }

  public leaveRoom(): void {
    if (this.roomRef) {
      this.roomRef.off();
      this.roomRef = null;
    }
    this.roomCode = null;
    this.myPlayerIndex = 0;
    this.isOnline = false;
    this.roomData = null;
    this.lastProcessedActionId = null;
    this.guestJoinedHandled = false;
    sessionStorage.removeItem('pregunta2_room_code');
    sessionStorage.removeItem('pregunta2_my_index');
  }

  public isMyTurn(currentPlayerIndex: number): boolean {
    if (!this.isOnline) return true;
    return this.myPlayerIndex === currentPlayerIndex;
  }

  public isReader(currentPlayerIndex: number): boolean {
    if (!this.isOnline) return false;
    return this.myPlayerIndex !== currentPlayerIndex;
  }
}

export const multiplayerService = new MultiplayerService();
