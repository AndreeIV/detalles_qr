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

  // Warm Lo-Fi Chillhop / Bossa chord progression (Fmaj7 -> Em7 -> Dm7 -> Cmaj7)
  private readonly progression = [
    {
      bass: 87.31, // F2
      chord: [174.61, 220.0, 261.63, 329.63], // F3, A3, C4, E4
      melody: [523.25, 440.0, 392.0, 349.23], // C5, A4, G4, F4
    },
    {
      bass: 82.41, // E2
      chord: [164.81, 196.0, 246.94, 293.66], // E3, G3, B3, D4
      melody: [493.88, 392.0, 329.63, 392.0], // B4, G4, E4, G4
    },
    {
      bass: 73.42, // D2
      chord: [146.83, 174.61, 220.0, 261.63], // D3, F3, A3, C4
      melody: [440.0, 349.23, 329.63, 293.66], // A4, F4, E4, D4
    },
    {
      bass: 65.41, // C2
      chord: [130.81, 164.81, 196.0, 246.94], // C3, E3, G3, B3
      melody: [392.0, 329.63, 293.66, 329.63], // G4, E4, D4, E4
    },
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
      }, 280);

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
      const barStep = this.stepIndex % 16; // 16 eighth-note steps per bar
      const chordIdx =
        Math.floor(this.stepIndex / 16) % this.progression.length;
      const bar = this.progression[chordIdx];
      this.stepIndex = (this.stepIndex + 1) % (this.progression.length * 16);

      // 1. Soft Lo-Fi Muffled Sub-Kick on steps 0, 6, 8 (relaxed bossa/chillhop groove)
      if (barStep === 0 || barStep === 6 || barStep === 8) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = "sine";
        kickOsc.frequency.setValueAtTime(92, now);
        kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.14);

        const kickLevel = barStep === 0 ? 0.55 : 0.38;
        kickGain.gain.setValueAtTime(0.001, now);
        kickGain.gain.linearRampToValueAtTime(kickLevel, now + 0.012);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        kickOsc.connect(kickGain);
        kickGain.connect(this.masterGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.19);
      }

      // 2. Soft Brushed Shaker / Hi-Hat on off-beats (steps 2, 4, 10, 12, 14)
      if (
        barStep === 2 ||
        barStep === 4 ||
        barStep === 10 ||
        barStep === 12 ||
        barStep === 14
      ) {
        const dur = 0.045;
        const sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, Math.floor(sr * dur), sr);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;

        const hatFilter = this.ctx.createBiquadFilter();
        hatFilter.type = "bandpass";
        hatFilter.frequency.setValueAtTime(4200, now);
        hatFilter.Q.setValueAtTime(1.8, now);

        const hatGain = this.ctx.createGain();
        const hatAmp = barStep === 4 || barStep === 12 ? 0.14 : 0.07;
        hatGain.gain.setValueAtTime(hatAmp, now);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + dur + 0.005);
      }

      // 3. Warm Sub-Bass & Velvety Low-Passed Rhodes Chords on steps 0, 3, 6, 10
      if (barStep === 0 || barStep === 3 || barStep === 6 || barStep === 10) {
        const chordFilter = this.ctx.createBiquadFilter();
        chordFilter.type = "lowpass";
        chordFilter.frequency.setValueAtTime(620, now);
        chordFilter.connect(this.masterGain);

        const dur = barStep === 0 || barStep === 6 ? 1.1 : 0.65;
        const freqs = barStep === 0 ? [bar.bass, ...bar.chord] : bar.chord;

        for (const freq of freqs) {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = freq < 110 ? "sine" : "triangle";
          osc.frequency.setValueAtTime(freq, now);

          const peak = freq < 110 ? 0.34 : 0.14;
          g.gain.setValueAtTime(0.001, now);
          g.gain.linearRampToValueAtTime(peak, now + 0.04);
          g.gain.exponentialRampToValueAtTime(0.001, now + dur);

          osc.connect(g);
          g.connect(chordFilter);
          osc.start(now);
          osc.stop(now + dur + 0.02);
        }
      }

      // 4. Gentle Bell / Rhodes Melody on steps 2, 7, 11, 14
      const melodyStepMap: Record<number, number> = {
        2: 0,
        7: 1,
        11: 2,
        14: 3,
      };
      if (melodyStepMap[barStep] !== undefined) {
        const melFreq = bar.melody[melodyStepMap[barStep]];
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();

        melOsc.type = "sine";
        melOsc.frequency.setValueAtTime(melFreq, now);

        melGain.gain.setValueAtTime(0.001, now);
        melGain.gain.linearRampToValueAtTime(0.22, now + 0.03);
        melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        melOsc.connect(melGain);
        melGain.connect(this.masterGain);
        melOsc.start(now);
        melOsc.stop(now + 0.9);
      }
    } catch {
      // Ignore note playback errors
    }
  }

  /**
   * Plays a deeper, soft low-pitched tactile UI click ("thock") on cursor click / tap.
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
      const filter = this.ctx.createBiquadFilter();
      const clickGain = this.ctx.createGain();

      // Lower-pitched, warm soft tap (320 Hz -> 110 Hz)
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.042);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(460, now);

      clickGain.gain.setValueAtTime(0.048, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(filter);
      filter.connect(clickGain);
      clickGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.048);
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
