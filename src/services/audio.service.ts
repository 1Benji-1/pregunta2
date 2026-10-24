/**
 * Motor de Audio Sintetizado estilo Preguntados (Web Audio API)
 * Funciona 100% offline y sin dependencias externas.
 */
export class AudioService {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    const saved = localStorage.getItem('pregunta2_sound');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
  }

  public init(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('pregunta2_sound', String(this.enabled));
    if (this.enabled) {
      this.playClick();
    }
    return this.enabled;
  }

  public playTone(
    freq: number,
    type: OscillatorType = 'sine',
    duration: number = 0.12,
    delay: number = 0,
    vol: number = 0.18
  ): void {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const startTime = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (_) {
      // Ignorar bloqueo de autoplay del navegador
    }
  }

  public playClick(): void {
    this.playTone(520, 'triangle', 0.06, 0, 0.15);
    this.playTone(680, 'sine', 0.05, 0.02, 0.12);
  }

  public playWheelTick(speedFactor: number = 1): void {
    if (!this.enabled) return;
    const freq = 340 + Math.min(280, speedFactor * 180);
    this.playTone(freq, 'triangle', 0.035, 0, 0.14);
  }

  public playCategoryLand(): void {
    this.playTone(523.25, 'triangle', 0.12, 0, 0.2);     // C5
    this.playTone(659.25, 'triangle', 0.12, 0.09, 0.2);  // E5
    this.playTone(783.99, 'triangle', 0.22, 0.18, 0.22); // G5
  }

  public playCrownLand(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      this.playTone(n, 'triangle', 0.18, i * 0.09, 0.24);
      this.playTone(n * 1.5, 'sine', 0.15, i * 0.09, 0.1);
    });
  }

  public playReSpinAlert(): void {
    this.playTone(440, 'sine', 0.12, 0, 0.16);
    this.playTone(554.37, 'sine', 0.12, 0.1, 0.16);
    this.playTone(659.25, 'sine', 0.18, 0.2, 0.18);
  }

  public playCorrect(): void {
    this.playTone(523.25, 'triangle', 0.12, 0, 0.22);     // C5
    this.playTone(659.25, 'triangle', 0.12, 0.08, 0.22);  // E5
    this.playTone(783.99, 'triangle', 0.14, 0.16, 0.22);  // G5
    this.playTone(1046.5, 'triangle', 0.32, 0.24, 0.25);  // C6
  }

  public playWrong(): void {
    this.playTone(311.13, 'sawtooth', 0.18, 0, 0.18);     // D#4
    this.playTone(277.18, 'sawtooth', 0.22, 0.14, 0.18);  // C#4
    this.playTone(233.08, 'sawtooth', 0.35, 0.28, 0.2);   // A#3
  }

  public playCategoryWin(): void {
    const melody = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 659.25, d: 0.12, t: 0.1 },
      { f: 783.99, d: 0.12, t: 0.2 },
      { f: 1046.5, d: 0.22, t: 0.3 },
      { f: 783.99, d: 0.12, t: 0.48 },
      { f: 1046.5, d: 0.45, t: 0.58 }
    ];
    melody.forEach((n) => this.playTone(n.f, 'triangle', n.d, n.t, 0.24));
  }

  public playVictory(): void {
    const melody = [
      { f: 523.25, d: 0.14, t: 0 },
      { f: 659.25, d: 0.14, t: 0.12 },
      { f: 783.99, d: 0.14, t: 0.24 },
      { f: 1046.5, d: 0.25, t: 0.36 },
      { f: 880.0, d: 0.14, t: 0.58 },
      { f: 1046.5, d: 0.18, t: 0.72 },
      { f: 1174.66, d: 0.18, t: 0.88 },
      { f: 1318.51, d: 0.55, t: 1.05 }
    ];
    melody.forEach((n) => this.playTone(n.f, 'triangle', n.d, n.t, 0.26));
  }

  public playBomb(): void {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(170, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.35);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
      this.playTone(95, 'square', 0.22, 0.05, 0.16);
    } catch (_) {}
  }

  public playPowerUp(): void {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((n, i) => {
      this.playTone(n, 'triangle', 0.12, i * 0.06, 0.2);
    });
  }

  public playSecondChance(): void {
    this.playTone(493.88, 'sine', 0.12, 0, 0.18);   // B4
    this.playTone(587.33, 'sine', 0.18, 0.1, 0.2);  // D5
  }
}

export const soundEngine = new AudioService();
