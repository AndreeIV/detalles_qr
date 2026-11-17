"use client";

type AmbientListener = (state: {
  isMuted: boolean;
  isExternalPlaying: boolean;
  isStarted: boolean;
}) => void;

class AmbientAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private stepIndex = 0;

  private isMuted = false;
  private isExternalPlaying = false;
  private isStarted = false;
  private listeners = new Set<AmbientListener>();

  // Dreamy romantic lo-fi / music-box arpeggio progression (Fmaj7 -> Em7 -> Am7 -> Cmaj7)
  private readonly chords: number[][] = [
    [349.23, 440.0, 523.25, 659.25], // F4, A4, C5, E5
    [329.63, 392.0, 493.88, 587.33], // E4, G4, B4, D5
    [220.0, 329.63, 392.0, 523.25], // A3, E4, G4, C5
    [261.63, 329.63, 392.0, 493.88], // C4, E4, G4, B4
  ];

  public subscribe(listener: AmbientListener): () => void {
    this.listeners.add(listener);
    listener({
      isMuted: this.isMuted,
      isExternalPlaying: this.isExternalPlaying,
      isStarted: this.isStarted,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({
        isMuted: this.isMuted,
        isExternalPlaying: this.isExternalPlaying,
        isStarted: this.isStarted,
      });
    }
  }

  public startOnUserGesture() {
    if (typeof window === "undefined") return;
    if (this.isStarted) {
      if (this.ctx?.state === "suspended" && !this.shouldPause()) {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      // Low, relaxing background volume
      this.masterGain.gain.setValueAtTime(
        this.shouldPause() ? 0.0001 : 0.038,
        this.ctx.currentTime,
      );
      this.masterGain.connect(this.ctx.destination);

      this.isStarted = true;
      this.playNextNote();
      setInterval(() => {
        this.playNextNote();
      }, 950);

      this.notify();
    } catch {
      // Ignore audio initialization restrictions
    }
  }

  private shouldPause(): boolean {
    return this.isMuted || this.isExternalPlaying;
  }

  private updateGainSmoothly() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const target = this.shouldPause() ? 0.0001 : 0.038;

    try {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(
        Math.max(0.0001, this.masterGain.gain.value),
        now,
      );
      this.masterGain.gain.exponentialRampToValueAtTime(target, now + 0.35);
    } catch {
      // Ignore scheduling errors
    }
  }

  private playNextNote() {
    if (!this.ctx || !this.masterGain || this.shouldPause()) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    try {
      const now = this.ctx.currentTime;
      const chordIdx = Math.floor(this.stepIndex / 4) % this.chords.length;
      const noteIdx = this.stepIndex % 4;
      const freq = this.chords[chordIdx][noteIdx];
      this.stepIndex = (this.stepIndex + 1) % (this.chords.length * 4);

      // Soft Rhodes / Music-Box tone using sine + triangle through lowpass
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.65, now + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 2.1);

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 2.15);
    } catch {
      // Ignore note playback errors
    }
  }

  /**
   * Plays a crisp, tactile UI click sound on cursor click / tap.
   */
  public playClickSound() {
    if (this.isMuted) return;
    if (!this.isStarted) {
      this.startOnUserGesture();
    }
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.032);

      clickGain.gain.setValueAtTime(0.055, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(clickGain);
      clickGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.038);
    } catch {
      // Ignore click sound errors
    }
  }

  /**
   * Plays an airy "whoosh / dash" sound effect when transitioning between wizard steps or views.
   */
  public playWhooshSound() {
    if (this.isMuted) return;
    if (!this.isStarted) {
      this.startOnUserGesture();
    }
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    try {
      const now = this.ctx.currentTime;
      const duration = 0.24;
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = Math.floor(sampleRate * duration);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      // Bandpass filter sweeping frequency for realistic air / dash swoosh
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.setValueAtTime(2.2, now);
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(
        1950,
        now + duration * 0.45,
      );
      filter.frequency.exponentialRampToValueAtTime(380, now + duration);

      const whooshGain = this.ctx.createGain();
      whooshGain.gain.setValueAtTime(0.001, now);
      whooshGain.gain.exponentialRampToValueAtTime(0.11, now + duration * 0.35);
      whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      whiteNoise.connect(filter);
      filter.connect(whooshGain);
      whooshGain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + duration + 0.01);
    } catch {
      // Ignore whoosh sound errors
    }
  }

  public setExternalAudioActive(active: boolean) {
    if (this.isExternalPlaying === active) return;
    this.isExternalPlaying = active;
    this.updateGainSmoothly();
    this.notify();
  }

  public toggleMute() {
    if (!this.isStarted) {
      this.isMuted = false;
      this.startOnUserGesture();
      return;
    }
    this.isMuted = !this.isMuted;
    this.updateGainSmoothly();
    this.notify();
  }
}

export const ambientAudio = new AmbientAudioManager();
