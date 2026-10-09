// Audio synthesis utility using Web Audio API and SpeechSynthesis API for browser testing

class AudioSynth {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playPreset(preset: string) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      switch (preset) {
        case "airhorn":
          this.playAirhorn(ctx);
          break;
        case "violin":
          this.playSadViolin(ctx);
          break;
        case "tada":
          this.playTada(ctx);
          break;
        case "badumtss":
          this.playBaDumTss(ctx);
          break;
        case "bruh":
          this.playBruh(ctx);
          break;
        case "quack":
          this.playQuack(ctx);
          break;
        case "alarm":
          this.playAlarm(ctx);
          break;
        case "levelup":
          this.playLevelUp(ctx);
          break;
        case "victory":
          this.playVictory(ctx);
          break;
        case "applause":
          this.playApplause(ctx);
          break;
        default:
          this.playBeep(ctx, 440, 0.2);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  private playTone(ctx: AudioContext, freq: number, type: OscillatorType, duration: number, delay = 0, gainLevel = 0.15) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

    gain.gain.setValueAtTime(gainLevel, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  private playBeep(ctx: AudioContext, freq: number, duration: number) {
    this.playTone(ctx, freq, "sine", duration, 0, 0.15);
  }

  private playAirhorn(ctx: AudioContext) {
    // Airhorn characteristic chord: multiple dissonant blares
    const freqs = [466.16, 523.25, 587.33, 698.46];
    freqs.forEach((f) => {
      this.playTone(ctx, f, "sawtooth", 0.4, 0, 0.08);
      this.playTone(ctx, f * 0.98, "sawtooth", 0.4, 0.1, 0.08);
      this.playTone(ctx, f, "sawtooth", 0.6, 0.35, 0.1);
    });
  }

  private playSadViolin(ctx: AudioContext) {
    // Slow descending minor notes
    const notes = [392.0, 369.99, 329.63, 293.66];
    notes.forEach((freq, idx) => {
      this.playTone(ctx, freq, "triangle", 0.8, idx * 0.5, 0.12);
    });
  }

  private playTada(ctx: AudioContext) {
    // Triumphant fanfare: G4 -> C5 -> E5 -> G5
    const notes = [392, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      this.playTone(ctx, freq, "sine", idx === 3 ? 0.8 : 0.25, idx * 0.15, 0.14);
    });
  }

  private playBaDumTss(ctx: AudioContext) {
    // Kick -> Snare -> Cymbal
    this.playTone(ctx, 110, "triangle", 0.15, 0, 0.2);
    this.playTone(ctx, 130, "triangle", 0.2, 0.2, 0.2);
    this.playTone(ctx, 800, "sawtooth", 0.4, 0.4, 0.12);
  }

  private playBruh(ctx: AudioContext) {
    // Low pitched resonance slide
    this.playTone(ctx, 180, "sawtooth", 0.4, 0, 0.15);
    this.playTone(ctx, 140, "sawtooth", 0.5, 0.1, 0.18);
  }

  private playQuack(ctx: AudioContext) {
    this.playTone(ctx, 600, "square", 0.18, 0, 0.1);
    this.playTone(ctx, 500, "square", 0.25, 0.15, 0.12);
  }

  private playAlarm(ctx: AudioContext) {
    for (let i = 0; i < 3; i++) {
      this.playTone(ctx, 880, "sine", 0.2, i * 0.35, 0.15);
      this.playTone(ctx, 659, "sine", 0.2, i * 0.35 + 0.15, 0.15);
    }
  }

  private playLevelUp(ctx: AudioContext) {
    const scale = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    scale.forEach((freq, idx) => {
      this.playTone(ctx, freq, "triangle", 0.2, idx * 0.08, 0.12);
    });
  }

  private playVictory(ctx: AudioContext) {
    const chords = [523.25, 659.25, 783.99, 1046.5];
    chords.forEach((freq) => {
      this.playTone(ctx, freq, "sine", 1.2, 0, 0.1);
    });
    chords.forEach((freq) => {
      this.playTone(ctx, freq * 1.25, "sine", 1.5, 0.5, 0.12);
    });
  }

  private playApplause(ctx: AudioContext) {
    for (let i = 0; i < 15; i++) {
      const delay = Math.random() * 0.8;
      const freq = 200 + Math.random() * 800;
      this.playTone(ctx, freq, "sine", 0.08, delay, 0.05);
    }
  }

  speakTTS(text: string, voiceName?: string, rate = 1.0, pitch = 1.0) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0 && voiceName) {
        const found = voices.find((v) => v.name.toLowerCase().includes(voiceName.toLowerCase()) || v.lang.includes(voiceName));
        if (found) utterance.voice = found;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis fallback
    }
  }
}

export const audioSynth = new AudioSynth();
