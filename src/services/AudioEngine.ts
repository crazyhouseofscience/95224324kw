/**
 * Procedural Web Audio API sound engine for Kelvin Water Dropper.
 * Synthesizes realistic organic water droplet impacts ("bloop"/"plop"), continuous stream trickling, and spark arcs.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastDripTimeA: number = 0;

  // Continuous water stream audio nodes
  private streamNoiseNode: AudioBufferSourceNode | null = null;
  private streamGainNode: GainNode | null = null;
  private streamFilterNode: BiquadFilterNode | null = null;

  constructor() {
    // AudioContext initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopWaterStreamSound();
    }
  }

  /**
   * Play realistic procedural water drop sound ("bloop" / "plop").
   * Real water droplet impacts feature:
   * 1. Minnaert bubble resonance: A clean sine wave that sweeps UPWARD in frequency (340 Hz -> 850 Hz) in ~25ms
   * 2. Soft initial splash transient click (filtered high frequency noise)
   */
  public playDroplet(volScale: number = 1.0, pitchOffset: number = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Throttle audio triggers to max ~28 per second to prevent buffer overload
    if (now - this.lastDripTimeA < 0.035) return;
    this.lastDripTimeA = now;

    try {
      // 1. Minnaert Bubble Resonance Sine Sweep (UPWARD sweep creating the authentic "bloop" / "plop")
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 340 + pitchOffset * 70 + (Math.random() - 0.5) * 60;
      const targetFreq = 880 + pitchOffset * 140 + (Math.random() - 0.5) * 90;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      // Exponential upward pitch sweep creates organic water plop sound
      osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.024);

      const masterVol = Math.min(0.09, 0.038 * Math.max(0.4, volScale));
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(masterVol, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.052);

      // 2. Soft transient splash noise click (initial water impact)
      const clickBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.007), this.ctx.sampleRate);
      const clickData = clickBuf.getChannelData(0);
      for (let i = 0; i < clickData.length; i++) {
        clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickData.length * 0.3));
      }
      const clickSource = this.ctx.createBufferSource();
      clickSource.buffer = clickBuf;

      const clickFilter = this.ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(1900, now);
      clickFilter.Q.setValueAtTime(1.8, now);

      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(masterVol * 0.35, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

      clickSource.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(this.ctx.destination);

      clickSource.start(now);
    } catch {
      // AudioContext policy fallback
    }
  }

  /**
   * Update continuous liquid water stream trickling audio ambient loop.
   * Scales frequency and volume dynamically with the droplet flow rate slider.
   */
  public updateWaterStreamSound(dropletRate: number, isPaused: boolean) {
    if (this.isMuted || isPaused || dropletRate < 8) {
      this.stopWaterStreamSound();
      return;
    }
    this.initContext();
    if (!this.ctx) return;

    if (!this.streamNoiseNode) {
      try {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        this.streamNoiseNode = this.ctx.createBufferSource();
        this.streamNoiseNode.buffer = buffer;
        this.streamNoiseNode.loop = true;

        this.streamFilterNode = this.ctx.createBiquadFilter();
        this.streamFilterNode.type = 'bandpass';
        this.streamFilterNode.frequency.value = 1100;
        this.streamFilterNode.Q.value = 2.2;

        this.streamGainNode = this.ctx.createGain();
        this.streamGainNode.gain.value = 0.0;

        this.streamNoiseNode.connect(this.streamFilterNode);
        this.streamFilterNode.connect(this.streamGainNode);
        this.streamGainNode.connect(this.ctx.destination);

        this.streamNoiseNode.start();
      } catch {
        // AudioContext policy fallback
      }
    }

    if (this.streamGainNode && this.streamFilterNode && this.ctx) {
      const now = this.ctx.currentTime;
      const targetVol = Math.min(0.035, ((dropletRate - 8) / 24) * 0.032);
      const targetFreq = 850 + (dropletRate / 32) * 650;
      this.streamGainNode.gain.setTargetAtTime(targetVol, now, 0.1);
      this.streamFilterNode.frequency.setTargetAtTime(targetFreq, now, 0.1);
    }
  }

  public stopWaterStreamSound() {
    if (this.streamGainNode && this.ctx) {
      this.streamGainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Play high-voltage spark arc discharge crackle and shockwave.
   */
  public playSpark(intensity: number = 1.0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    try {
      // 1. High frequency electrical arc noise burst
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.08); // 80ms
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(3200, now);
      bandpass.Q.setValueAtTime(2.5, now);

      const noiseGain = this.ctx.createGain();
      const vol = Math.min(0.35, 0.22 * intensity);
      noiseGain.gain.setValueAtTime(vol, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      noiseSource.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noiseSource.start(now);

      // 2. Low-frequency acoustic shockwave thump
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(110, now);
      subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.06);

      subGain.gain.setValueAtTime(vol * 0.7, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + 0.07);
    } catch {
      // Ignore audio policy errors
    }
  }
}

export const audioEngine = new AudioEngine();
