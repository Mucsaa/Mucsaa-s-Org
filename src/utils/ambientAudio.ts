/**
 * Web Audio API procedural Ambient Soundscape Engine for Polaris Focus Mode
 * 100% offline, zero-latency, zero-CORS, infinite seamless looping & volume control.
 */

export type AmbientSoundType =
  | 'none'
  | 'whitenoise'
  | 'waves'
  | 'nature'
  | 'birds'
  | 'rain'
  | 'cafe'
  | 'fire'
  | 'forest';

export interface AmbientSoundOption {
  id: AmbientSoundType;
  label: string;
  icon: string;
  description: string;
}

export const AMBIENT_SOUND_OPTIONS: AmbientSoundOption[] = [
  { id: 'none', label: 'Silêncio', icon: '🔇', description: 'Sem som de fundo' },
  { id: 'whitenoise', label: 'Ruído Branco', icon: '🌫️', description: 'Foco contínuo e suave' },
  { id: 'waves', label: 'Ondas Relax', icon: '🌊', description: 'Fluxo rítmico do oceano' },
  { id: 'nature', label: 'Natureza', icon: '🌿', description: 'Vento suave, folhas e riacho' },
  { id: 'birds', label: 'Passarinhos', icon: '🐦', description: 'Canto calmo de pássaros' },
  { id: 'rain', label: 'Chuva', icon: '🌧️', description: 'Gotas relaxantes na janela' },
  { id: 'fire', label: 'Fogueira', icon: '🔥', description: 'Estalos quentes de lareira' },
  { id: 'forest', label: 'Floresta', icon: '🌲', description: 'Brisa e bosque verde' },
  { id: 'cafe', label: 'Café', icon: '☕', description: 'Murmúrio acolhedor de bistrô' },
];

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private currentType: AmbientSoundType = 'none';
  private isPlaying: boolean = false;
  private volume: number = 0.75; // 0.0 to 1.0 (75% default for clear audibility)

  // Active procedural nodes and timers
  private activeNodes: Array<AudioNode> = [];
  private activeTimers: Array<number> = [];

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private ensureMasterGain(ctx: AudioContext): GainNode {
    if (!this.compressor) {
      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, ctx.currentTime);
      this.compressor.knee.setValueAtTime(25, ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, ctx.currentTime);
      this.compressor.connect(ctx.destination);
    }

    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);
      this.masterGain.connect(this.compressor);
    }
    return this.masterGain;
  }

  public setVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.volume = clamped;
    if (this.ctx && this.masterGain) {
      try {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
      } catch {
        this.masterGain.gain.value = clamped;
      }
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying && this.currentType !== 'none';
  }

  /**
   * Start or switch to an ambient soundscape
   */
  public play(type: AmbientSoundType, volume?: number): void {
    if (volume !== undefined) {
      this.setVolume(volume);
    }

    if (type === 'none') {
      this.stop();
      return;
    }

    this.stopNodesOnly();
    this.currentType = type;
    this.isPlaying = true;

    const ctx = this.getContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const master = this.ensureMasterGain(ctx);
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(this.volume, ctx.currentTime);
    } catch {}

    try {
      switch (type) {
        case 'whitenoise':
          this.buildWhiteNoise(ctx, master);
          break;
        case 'waves':
          this.buildOceanWaves(ctx, master);
          break;
        case 'nature':
          this.buildNature(ctx, master);
          break;
        case 'birds':
          this.buildBirds(ctx, master);
          break;
        case 'rain':
          this.buildRain(ctx, master);
          break;
        case 'fire':
          this.buildCampfire(ctx, master);
          break;
        case 'forest':
          this.buildForest(ctx, master);
          break;
        case 'cafe':
          this.buildCafe(ctx, master);
          break;
        default:
          break;
      }
    } catch (err) {
      console.warn('Ambient synthesis initialization error:', err);
    }
  }

  public pause(): void {
    this.isPlaying = false;
    this.stopNodesOnly();
  }

  public resume(): void {
    if (this.currentType !== 'none' && !this.isPlaying) {
      this.play(this.currentType);
    }
  }

  public stop(): void {
    this.isPlaying = false;
    this.currentType = 'none';
    this.stopNodesOnly();
  }

  private stopNodesOnly(): void {
    this.activeTimers.forEach((timer) => window.clearInterval(timer));
    this.activeTimers = [];

    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore disconnection issues on unmounted nodes
      }
    });
    this.activeNodes = [];
  }

  /* -------------------------------------------------------------
   * PROCEDURAL SOUND GENERATORS (Web Audio DSP Algorithms)
   * ------------------------------------------------------------- */

  /**
   * 🌫️ RUÍDO BRANCO (Filtered Pink & White Noise)
   */
  private buildWhiteNoise(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2 + white * 0.25) * 0.22;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1400, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.70, ctx.currentTime);

    source.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(destination);

    source.start();
    this.activeNodes.push(source, lowpass, gain);
  }

  /**
   * 🌊 ONDAS DO MAR (Rhythmic Ocean Waves with LFO Modulated Swell)
   */
  private buildOceanWaves(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.025 * white) / 1.025;
      lastOut = data[i];
      data[i] *= 2.2;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    // LFO for wave swell (simulates 8-10 second tide wave cycle)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8.3s cycle

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(360, ctx.currentTime); // mod filter 90Hz - 810Hz
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const ampGain = ctx.createGain();
    ampGain.gain.setValueAtTime(0.75, ctx.currentTime);

    const ampLfoGain = ctx.createGain();
    ampLfoGain.gain.setValueAtTime(0.40, ctx.currentTime);
    lfo.connect(ampLfoGain);
    ampLfoGain.connect(ampGain.gain);

    source.connect(filter);
    filter.connect(ampGain);
    ampGain.connect(destination);

    source.start();
    lfo.start();

    this.activeNodes.push(source, filter, lfo, lfoGain, ampGain, ampLfoGain);
  }

  /**
   * 🌧️ CHUVA (Continuous Gentle Rain Patter)
   */
  private buildRain(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = white * 0.3;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Highpass to remove low roar, Bandpass to simulate roof/window patter
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1400, ctx.currentTime);
    bandpass.Q.setValueAtTime(0.8, ctx.currentTime);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(3600, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.70, ctx.currentTime);

    source.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(destination);

    source.start();
    this.activeNodes.push(source, bandpass, lowpass, gain);

    // Random soft droplet bursts
    const dropletTimer = window.setInterval(() => {
      if (!this.isPlaying || ctx.state === 'suspended') return;
      try {
        const dropOsc = ctx.createOscillator();
        const dropGain = ctx.createGain();
        const dropFreq = 2200 + Math.random() * 1800;

        dropOsc.type = 'sine';
        dropOsc.frequency.setValueAtTime(dropFreq, ctx.currentTime);
        dropOsc.frequency.exponentialRampToValueAtTime(dropFreq * 0.5, ctx.currentTime + 0.04);

        dropGain.gain.setValueAtTime(0.045 * (Math.random() * 0.8 + 0.2), ctx.currentTime);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

        dropOsc.connect(dropGain);
        dropGain.connect(destination);

        dropOsc.start();
        dropOsc.stop(ctx.currentTime + 0.045);
      } catch {}
    }, 120);

    this.activeTimers.push(dropletTimer);
  }

  /**
   * 🔥 FOGUEIRA (Campfire Crackle & Warm Ember Rumblings)
   */
  private buildCampfire(ctx: AudioContext, destination: GainNode): void {
    // Low rumble bed
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastVal = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastVal + 0.04 * white) / 1.04;
      lastVal = data[i];
      data[i] *= 0.65;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(320, ctx.currentTime);

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.60, ctx.currentTime);

    source.connect(lowpass);
    lowpass.connect(rumbleGain);
    rumbleGain.connect(destination);

    source.start();
    this.activeNodes.push(source, lowpass, rumbleGain);

    // Realistic procedural wood crackles / ember pops
    const crackleTimer = window.setInterval(() => {
      if (!this.isPlaying || ctx.state === 'suspended') return;
      if (Math.random() > 0.45) {
        try {
          const crackleBuffer = ctx.createBuffer(1, 1024, ctx.sampleRate);
          const cData = crackleBuffer.getChannelData(0);
          for (let i = 0; i < 1024; i++) {
            cData[i] = (Math.random() * 2 - 1) * Math.exp(-i / 160);
          }

          const cSource = ctx.createBufferSource();
          cSource.buffer = crackleBuffer;

          const bFilter = ctx.createBiquadFilter();
          bFilter.type = 'bandpass';
          bFilter.frequency.setValueAtTime(1200 + Math.random() * 2400, ctx.currentTime);
          bFilter.Q.setValueAtTime(2.5, ctx.currentTime);

          const cGain = ctx.createGain();
          cGain.gain.setValueAtTime(0.20 + Math.random() * 0.15, ctx.currentTime);

          cSource.connect(bFilter);
          bFilter.connect(cGain);
          cGain.connect(destination);

          cSource.start();
          cSource.stop(ctx.currentTime + 0.08);
        } catch {}
      }
    }, 90);

    this.activeTimers.push(crackleTimer);
  }

  /**
   * 🌲 FLORESTA (Forest Wind Breeze & Subtle Nature Chirps)
   */
  private buildForest(ctx: AudioContext, destination: GainNode): void {
    // Gentle Wind Breeze
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.015 * white) / 1.015;
      lastOut = data[i];
      data[i] *= 0.8;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(500, ctx.currentTime);
    windFilter.Q.setValueAtTime(0.6, ctx.currentTime);

    const windLfo = ctx.createOscillator();
    windLfo.type = 'sine';
    windLfo.frequency.setValueAtTime(0.08, ctx.currentTime);

    const windLfoGain = ctx.createGain();
    windLfoGain.gain.setValueAtTime(220, ctx.currentTime);
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.60, ctx.currentTime);

    source.connect(windFilter);
    windFilter.connect(gain);
    gain.connect(destination);

    source.start();
    windLfo.start();
    this.activeNodes.push(source, windFilter, windLfo, windLfoGain, gain);

    // Periodic gentle harmonic bird chirp
    const birdTimer = window.setInterval(() => {
      if (!this.isPlaying || ctx.state === 'suspended') return;
      if (Math.random() > 0.6) {
        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const bGain = ctx.createGain();

          osc.type = 'sine';
          const base = 2600 + Math.random() * 600;
          osc.frequency.setValueAtTime(base, now);
          osc.frequency.linearRampToValueAtTime(base + 400, now + 0.06);
          osc.frequency.linearRampToValueAtTime(base - 100, now + 0.12);

          bGain.gain.setValueAtTime(0, now);
          bGain.gain.linearRampToValueAtTime(0.18, now + 0.02);
          bGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

          osc.connect(bGain);
          bGain.connect(destination);

          osc.start(now);
          osc.stop(now + 0.15);
        } catch {}
      }
    }, 2400);

    this.activeTimers.push(birdTimer);
  }

  /**
   * 🌿 NATUREZA (Gentle Wind Breeze, Leaf Rustle & Soft Forest Stream)
   */
  private buildNature(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink/Brown noise integration for natural soft organic air
      data[i] = (lastOut + 0.018 * white) / 1.018;
      lastOut = data[i];
      data[i] *= 0.9;
    }

    // --- 1. Gentle Wind & Foliage Breeze ---
    const windSource = ctx.createBufferSource();
    windSource.buffer = buffer;
    windSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(550, ctx.currentTime);
    windFilter.Q.setValueAtTime(0.5, ctx.currentTime);

    // Wind LFO for natural swaying gusts
    const windLfo = ctx.createOscillator();
    windLfo.type = 'sine';
    windLfo.frequency.setValueAtTime(0.06, ctx.currentTime);

    const windLfoGain = ctx.createGain();
    windLfoGain.gain.setValueAtTime(220, ctx.currentTime);
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.60, ctx.currentTime);

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(destination);

    windSource.start();
    windLfo.start();
    this.activeNodes.push(windSource, windFilter, windLfo, windLfoGain, windGain);

    // --- 2. Gentle Flowing Stream / Running Brook ---
    const streamSource = ctx.createBufferSource();
    streamSource.buffer = buffer;
    streamSource.loop = true;

    const streamFilter1 = ctx.createBiquadFilter();
    streamFilter1.type = 'bandpass';
    streamFilter1.frequency.setValueAtTime(1150, ctx.currentTime);
    streamFilter1.Q.setValueAtTime(1.8, ctx.currentTime);

    const streamFilter2 = ctx.createBiquadFilter();
    streamFilter2.type = 'peaking';
    streamFilter2.frequency.setValueAtTime(2200, ctx.currentTime);
    streamFilter2.gain.setValueAtTime(6, ctx.currentTime);
    streamFilter2.Q.setValueAtTime(2.2, ctx.currentTime);

    // Stream ripple modulation LFO
    const streamLfo = ctx.createOscillator();
    streamLfo.type = 'sine';
    streamLfo.frequency.setValueAtTime(0.4, ctx.currentTime);

    const streamLfoGain = ctx.createGain();
    streamLfoGain.gain.setValueAtTime(280, ctx.currentTime);
    streamLfo.connect(streamLfoGain);
    streamLfoGain.connect(streamFilter1.frequency);

    const streamGain = ctx.createGain();
    streamGain.gain.setValueAtTime(0.65, ctx.currentTime);

    streamSource.connect(streamFilter1);
    streamFilter1.connect(streamFilter2);
    streamFilter2.connect(streamGain);
    streamGain.connect(destination);

    streamSource.start();
    streamLfo.start();
    this.activeNodes.push(streamSource, streamFilter1, streamFilter2, streamLfo, streamLfoGain, streamGain);

    // --- 3. Micro stream bubbles / subtle droplet trickles ---
    const dropletTimer = window.setInterval(() => {
      if (!this.isPlaying || ctx.state === 'suspended') return;
      if (Math.random() > 0.4) {
        try {
          const now = ctx.currentTime;
          const dropOsc = ctx.createOscillator();
          const dropGain = ctx.createGain();
          const dropFreq = 1200 + Math.random() * 1200;

          dropOsc.type = 'sine';
          dropOsc.frequency.setValueAtTime(dropFreq, now);
          dropOsc.frequency.exponentialRampToValueAtTime(dropFreq * 0.7, now + 0.035);

          dropGain.gain.setValueAtTime(0.045 * (Math.random() * 0.7 + 0.3), now);
          dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

          dropOsc.connect(dropGain);
          dropGain.connect(destination);

          dropOsc.start(now);
          dropOsc.stop(now + 0.045);
        } catch {}
      }
    }, 200);

    this.activeTimers.push(dropletTimer);
  }

  /**
   * 🐦 PASSARINHOS (Relaxing Birdsong, Gentle Avian Chirps & Calm Nature Bed)
   */
  private buildBirds(ctx: AudioContext, destination: GainNode): void {
    // --- 1. Soft Forest Canopy Ambience Bed (Gentle Background) ---
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.012 * white) / 1.012;
      lastOut = data[i];
      data[i] *= 0.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const bgFilter = ctx.createBiquadFilter();
    bgFilter.type = 'bandpass';
    bgFilter.frequency.setValueAtTime(650, ctx.currentTime);
    bgFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    const bgGain = ctx.createGain();
    bgGain.gain.setValueAtTime(0.35, ctx.currentTime);

    source.connect(bgFilter);
    bgFilter.connect(bgGain);
    bgGain.connect(destination);

    source.start();
    this.activeNodes.push(source, bgFilter, bgGain);

    // --- 2. Avian Phrase Synthesizer (Realistic Procedural Bird Songs) ---
    const playBirdMotif = () => {
      if (!this.isPlaying || ctx.state === 'suspended') return;
      try {
        const motifType = Math.floor(Math.random() * 4);
        const now = ctx.currentTime;

        if (motifType === 0) {
          // Double chirp ("Twit-twit")
          const base1 = 2800 + Math.random() * 500;
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(base1, now);
          osc1.frequency.linearRampToValueAtTime(base1 + 550, now + 0.04);
          osc1.frequency.linearRampToValueAtTime(base1 + 300, now + 0.07);
          gain1.gain.setValueAtTime(0, now);
          gain1.gain.linearRampToValueAtTime(0.25, now + 0.015);
          gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
          osc1.connect(gain1);
          gain1.connect(destination);
          osc1.start(now);
          osc1.stop(now + 0.09);

          const delay = 0.11;
          const base2 = base1 + 250;
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(base2, now + delay);
          osc2.frequency.linearRampToValueAtTime(base2 + 650, now + delay + 0.045);
          osc2.frequency.linearRampToValueAtTime(base2 + 100, now + delay + 0.09);
          gain2.gain.setValueAtTime(0, now + delay);
          gain2.gain.linearRampToValueAtTime(0.28, now + delay + 0.015);
          gain2.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.1);
          osc2.connect(gain2);
          gain2.connect(destination);
          osc2.start(now + delay);
          osc2.stop(now + delay + 0.11);
        } else if (motifType === 1) {
          // Sweet trill / warble
          const base = 3200 + Math.random() * 600;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';

          // Frequency modulation for trill
          const trillLfo = ctx.createOscillator();
          trillLfo.type = 'sine';
          trillLfo.frequency.setValueAtTime(20, now); // 20Hz vibrato speed
          const trillLfoGain = ctx.createGain();
          trillLfoGain.gain.setValueAtTime(140, now);
          trillLfo.connect(trillLfoGain);
          trillLfoGain.connect(osc.frequency);

          osc.frequency.setValueAtTime(base, now);
          osc.frequency.linearRampToValueAtTime(base + 300, now + 0.06);
          osc.frequency.linearRampToValueAtTime(base - 200, now + 0.18);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.22, now + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

          osc.connect(gain);
          gain.connect(destination);

          osc.start(now);
          trillLfo.start(now);
          osc.stop(now + 0.21);
          trillLfo.stop(now + 0.21);
        } else if (motifType === 2) {
          // Melodic Triplet (3 cascading harmonic chirps)
          const freqs = [2600 + Math.random() * 300, 3100 + Math.random() * 300, 3700 + Math.random() * 400];
          freqs.forEach((freq, idx) => {
            const stepTime = now + idx * 0.07;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, stepTime);
            osc.frequency.linearRampToValueAtTime(freq + 280, stepTime + 0.035);
            gain.gain.setValueAtTime(0, stepTime);
            gain.gain.linearRampToValueAtTime(0.22, stepTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, stepTime + 0.06);
            osc.connect(gain);
            gain.connect(destination);
            osc.start(stepTime);
            osc.stop(stepTime + 0.07);
          });
        } else {
          // Soft Contact Call / Flute-like gentle whistle
          const base = 2500 + Math.random() * 500;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(base, now);
          osc.frequency.exponentialRampToValueAtTime(base + 700, now + 0.08);
          osc.frequency.exponentialRampToValueAtTime(base + 350, now + 0.16);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.26, now + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

          osc.connect(gain);
          gain.connect(destination);
          osc.start(now);
          osc.stop(now + 0.19);
        }
      } catch {}
    };

    // Trigger initial chirp immediately upon selection
    setTimeout(playBirdMotif, 120);

    // Periodic natural intervals (every 1.5s to 2.5s)
    const birdTimer = window.setInterval(() => {
      playBirdMotif();
    }, 1600);

    this.activeTimers.push(birdTimer);
  }

  /**
   * ☕ CAFÉ (Warm Ambience & Low Bistro Murmur)
   */
  private buildCafe(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastVal = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastVal + 0.03 * white) / 1.03;
      lastVal = data[i];
      data[i] *= 0.6;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(450, ctx.currentTime);
    filter1.Q.setValueAtTime(1.2, ctx.currentTime);

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(900, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.65, ctx.currentTime);

    source.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gain);
    gain.connect(destination);

    source.start();
    this.activeNodes.push(source, filter1, filter2, gain);
  }
}

export const ambientAudioEngine = new AmbientAudioEngine();
