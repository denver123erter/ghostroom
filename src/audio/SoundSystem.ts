/**
 * Horror Sound System
 * Features Web Audio API procedural synthesizer for complete offline horror audio
 * (ambient drone, wind howl, floor creaks, footsteps, heartbeat, electrical buzz,
 * whispers, door creaks, jump scare stingers) with graceful fallback for external audio files.
 */

export class SoundSystem {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private isMuted = false;
  private masterGain: GainNode | null = null;

  // Sound nodes
  private ambientGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private heartbeatInterval: number | null = null;
  private lastFootstepTime = 0;
  private audioBuffers: Map<string, AudioBuffer> = new Map();

  constructor() {
    // Lazy initialization on first user interaction
  }

  public init(): boolean {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return true;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        console.warn('Web Audio API is not supported in this browser.');
        return false;
      }

      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.isInitialized = true;

      // Start continuous ambient sounds
      this.startAmbientDrone();
      this.startWindAmbience();

      return true;
    } catch (e) {
      console.warn('Could not initialize AudioContext:', e);
      return false;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Continuous deep, ominous subterranean drone
   */
  private startAmbientDrone() {
    if (!this.ctx || !this.masterGain) return;

    try {
      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      droneGain.connect(this.masterGain);
      this.ambientGain = droneGain;

      // Sub oscillator (dark rumble ~48Hz)
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(46, this.ctx.currentTime);

      // Low pass filter to keep it deep and menacing
      const filter1 = this.ctx.createBiquadFilter();
      filter1.type = 'lowpass';
      filter1.frequency.setValueAtTime(110, this.ctx.currentTime);
      filter1.Q.setValueAtTime(3.5, this.ctx.currentTime);

      // LFO for slow eerie breathing/throbbing
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(25, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter1.frequency);
      lfo.start();

      osc1.connect(filter1);
      filter1.connect(droneGain);
      osc1.start();

      // Second harmonic osc (eerie minor second ~58Hz)
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(58.27, this.ctx.currentTime);
      const filter2 = this.ctx.createBiquadFilter();
      filter2.type = 'lowpass';
      filter2.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc2.connect(filter2);
      filter2.connect(droneGain);
      osc2.start();
    } catch (e) {
      console.warn('Ambient drone generation failed:', e);
    }
  }

  /**
   * Continuous procedural howling wind outside window
   */
  private startWindAmbience() {
    if (!this.ctx || !this.masterGain) return;

    try {
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(280, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(4.0, this.ctx.currentTime);

      // Modulate wind pitch and swell
      const windLfo = this.ctx.createOscillator();
      windLfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);
      const windLfoGain = this.ctx.createGain();
      windLfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
      windLfo.connect(windLfoGain);
      windLfoGain.connect(bandpass.frequency);
      windLfo.start();

      const windGain = this.ctx.createGain();
      windGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.windGain = windGain;

      whiteNoise.connect(bandpass);
      bandpass.connect(windGain);
      windGain.connect(this.masterGain);
      whiteNoise.start();
    } catch (e) {
      console.warn('Wind ambience generation failed:', e);
    }
  }

  /**
   * Footstep sound (dusty wood floor thud)
   */
  public playFootstep(intensity = 1.0) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = performance.now();
    if (now - this.lastFootstepTime < 280) return; // Prevent spam
    this.lastFootstepTime = now;

    try {
      const t = this.ctx.currentTime;
      const stepGain = this.ctx.createGain();
      stepGain.gain.setValueAtTime(0.15 * intensity, t);
      stepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      stepGain.connect(this.masterGain);

      // Low wood impact
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      const pitch = 65 + (Math.random() * 20 - 10);
      osc.frequency.setValueAtTime(pitch, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

      // Filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, t);

      osc.connect(filter);
      filter.connect(stepGain);
      osc.start(t);
      osc.stop(t + 0.18);

      // Occasional tiny floor creak on step
      if (Math.random() < 0.25) {
        this.playCreak(0.2);
      }
    } catch (e) {
      // Audio error ignored
    }
  }

  /**
   * Wooden house creak sound
   */
  public playCreak(volume = 0.5) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const creakGain = this.ctx.createGain();
      const dur = 0.4 + Math.random() * 0.4;
      creakGain.gain.setValueAtTime(0.12 * volume, t);
      creakGain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      creakGain.connect(this.masterGain);

      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      const baseFreq = 160 + Math.random() * 80;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.linearRampToValueAtTime(baseFreq * (0.8 + Math.random() * 0.4), t + dur);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 1.5, t);
      filter.Q.setValueAtTime(8.0, t);

      osc.connect(filter);
      filter.connect(creakGain);
      osc.start(t);
      osc.stop(t + dur);
    } catch (e) {
      // Audio error ignored
    }
  }

  /**
   * Heartbeat thumps for high-tension moments
   */
  public setHeartbeatActive(active: boolean) {
    if (active && !this.heartbeatInterval) {
      this.playHeartbeatDouble();
      this.heartbeatInterval = window.setInterval(() => {
        this.playHeartbeatDouble();
      }, 1100);
    } else if (!active && this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private playHeartbeatDouble() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const playThump = (timeOffset: number, volume: number) => {
        if (!this.ctx || !this.masterGain) return;
        const t = this.ctx.currentTime + timeOffset;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        gain.connect(this.masterGain);

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(62, t);
        osc.frequency.exponentialRampToValueAtTime(32, t + 0.12);

        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.15);
      };

      playThump(0, 1.0);
      playThump(0.24, 0.7);
    } catch (e) {
      // Audio error ignored
    }
  }

  /**
   * Light bulb flicker electrical spark / buzzing sound
   */
  public playLightFlickerSound() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const sparkGain = this.ctx.createGain();
      sparkGain.gain.setValueAtTime(0.18, t);
      sparkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      sparkGain.connect(this.masterGain);

      // Buzz 60Hz hum + sharp harmonics
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.linearRampToValueAtTime(80, t + 0.3);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(300, t);

      osc.connect(filter);
      filter.connect(sparkGain);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {
      // Audio error ignored
    }
  }

  /**
   * Door opening / closing creak
   */
  public playDoorCreak(open: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const dur = 0.8;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      gain.connect(this.masterGain);

      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      if (open) {
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(260, t + dur);
      } else {
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + dur);
      }

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, t);
      filter.Q.setValueAtTime(10, t);

      osc.connect(filter);
      filter.connect(gain);
      osc.start(t);
      osc.stop(t + dur);
    } catch (e) {
      // Audio error ignored
    }
  }

  /**
   * Drawer slide sound
   */
  public playDrawerSlide() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const dur = 0.45;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      gain.connect(this.masterGain);

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.linearRampToValueAtTime(130, t + dur);

      osc.connect(gain);
      osc.start(t);
      osc.stop(t + dur);
    } catch (e) {
      // Audio error ignored
    }
  }

  /**
   * Switch click sound
   */
  public playSwitchClick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      gain.connect(this.masterGain);

      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

      osc.connect(gain);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {
      // Audio error ignored
    }
  }

  /**
   * Paper note rustle
   */
  public playPaperRustle() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      gain.connect(this.masterGain);

      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.Q.setValueAtTime(6.0, t);

      osc.connect(filter);
      filter.connect(gain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {
      // Audio error ignored
    }
  }

  /**
   * Flashlight click
   */
  public playFlashlightClick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      gain.connect(this.masterGain);

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.03);

      osc.connect(gain);
      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {
      // Audio error ignored
    }
  }

  /**
   * Spectral whisper / breathing hiss for ghost events
   */
  public playGhostWhisper() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const dur = 2.2;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      gain.connect(this.masterGain);

      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      // Vocal formant filter (eerie female whisper 'ah' -> 'ooh')
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(700, t);
      filter.frequency.linearRampToValueAtTime(420, t + dur);
      filter.Q.setValueAtTime(9.0, t);

      whiteNoise.connect(filter);
      filter.connect(gain);
      whiteNoise.start(t);
      whiteNoise.stop(t + dur);
    } catch (e) {
      // Audio error ignored
    }
  }

  /**
   * Dissonant jump scare stinger chord (when Smiling Woman appears)
   */
  public playJumpScareStinger() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const dur = 1.8;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      gain.connect(this.masterGain);

      // Dissonant frequencies: Eb, E, Bb, B (tritone clash)
      const freqs = [155.56, 164.81, 233.08, 246.94, 466.16];

      freqs.forEach(freq => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq + (Math.random() * 4 - 2), t);
        osc.frequency.linearRampToValueAtTime(freq * 0.95, t + dur);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(250, t + dur);

        osc.connect(filter);
        filter.connect(gain);
        osc.start(t);
        osc.stop(t + dur);
      });
    } catch (e) {
      // Audio error ignored
    }
  }

  /**
   * Support for external audio files (e.g. assets/audio/creak.mp3)
   * if user provides them later
   */
  public async loadSoundFile(name: string, url: string): Promise<boolean> {
    if (!this.ctx) return false;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(name, audioBuffer);
      console.log(`Loaded external sound: ${name}`);
      return true;
    } catch (err) {
      console.warn(`Could not load sound file at ${url}. Using procedural synthesis fallback.`, err);
      return false;
    }
  }

  public playSound(soundName: string) {
    if (this.audioBuffers.has(soundName) && this.ctx && this.masterGain && !this.isMuted) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.audioBuffers.get(soundName)!;
      source.connect(this.masterGain);
      source.start();
    } else {
      // Route to procedural synthesis based on name
      switch (soundName) {
        case 'footstep': this.playFootstep(); break;
        case 'creak': this.playCreak(); break;
        case 'flicker': this.playLightFlickerSound(); break;
        case 'door': this.playDoorCreak(true); break;
        case 'drawer': this.playDrawerSlide(); break;
        case 'whisper': this.playGhostWhisper(); break;
        case 'stinger': this.playJumpScareStinger(); break;
        case 'switch': this.playSwitchClick(); break;
        case 'paper': this.playPaperRustle(); break;
        case 'flashlight': this.playFlashlightClick(); break;
        default: break;
      }
    }
  }
}

export const soundSystem = new SoundSystem();
