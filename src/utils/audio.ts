/**
 * Procedural Web Audio Sound Engine
 * Zero external audio files, zero 404 dependencies.
 * Synthesizes ambient detective drone, clue discovery chimes, camera glides, and UI ticks.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientOscs: OscillatorNode[] = [];
  private isAmbientPlaying: boolean = false;
  private isAmbientDesired: boolean = false;
  private readonly AMBIENT_TARGET_GAIN: number = 0.05;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        // 绑定全局一次性手势，确保在用户首次触摸或按键时无缝唤醒 AudioContext
        const autoUnlock = () => {
          if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch((err) => {
              console.warn('[SoundEngine] 自动解锁 AudioContext 失败:', err);
            });
          }
          window.removeEventListener('click', autoUnlock);
          window.removeEventListener('keydown', autoUnlock);
          window.removeEventListener('touchstart', autoUnlock);
        };
        window.addEventListener('click', autoUnlock, { passive: true });
        window.addEventListener('keydown', autoUnlock, { passive: true });
        window.addEventListener('touchstart', autoUnlock, { passive: true });
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.initContext();
    this.isMuted = !this.isMuted;

    if (this.isAmbientDesired) {
      if (this.isMuted) {
        // 静音时平滑淡出并彻底停止振荡器，避免静音状态下空转消耗计算资源
        this.stopAmbient(0.3);
        this.isAmbientDesired = true;
      } else {
        // 取消静音时重新唤起环境氛围音并淡入
        this.startAmbientMystery();
      }
    }

    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public playClueFound() {
    this.initContext();
    if (this.isMuted || !this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // 降 E 小调和弦四音 (Eb5, Gb5, Bb5, Db6)
      const freqs = [622.25, 739.99, 932.33, 1108.73];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0, t + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, t + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 1.3);
      });
    } catch (err) {
      console.warn('[SoundEngine] 播放线索提示音失败:', err);
    }
  }

  public playCameraGlide() {
    this.initContext();
    if (this.isMuted || !this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(280, t + 0.35);

      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.45);
    } catch (err) {
      console.warn('[SoundEngine] 播放镜头运镜音失败:', err);
    }
  }

  public playHeartbeatTick() {
    this.initContext();
    if (this.isMuted || !this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(70, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch (err) {
      console.warn('[SoundEngine] 播放心跳警报音失败:', err);
    }
  }

  public playUVScannerBeep() {
    this.initContext();
    if (this.isMuted || !this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.linearRampToValueAtTime(2200, t + 0.2);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    } catch (err) {
      console.warn('[SoundEngine] 播放紫外线扫描音失败:', err);
    }
  }

  /**
   * 纸张翻动/摩擦拟真声学合成 (Procedural Paper Rustle)
   * 基于粉红白噪声带通滤波与自然摩擦衰减，取代单调的三角波
   */
  public playPaperRustle() {
    this.initContext();
    if (this.isMuted || !this.ctx) return;

    try {
      const sampleRate = this.ctx.sampleRate;
      const duration = 0.16; // 160ms 摩擦起伏
      const bufferSize = Math.floor(sampleRate * duration);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const channelData = noiseBuffer.getChannelData(0);

      // 生成带纸张纤维粗糙质感的滤波随机噪声
      let lastValue = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastValue = (lastValue + 0.03 * white) / 1.03;
        channelData[i] = (lastValue * 3.5 + white * 0.15) * (1 - i / bufferSize);
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      // 带通滤波器：聚焦纸张摩擦的关键中高频 (800Hz - 2200Hz)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(1700, this.ctx.currentTime + 0.06);
      filter.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + duration);
      filter.Q.setValueAtTime(1.4, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.07, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseSource.start(t);
      noiseSource.stop(t + duration);
    } catch (err) {
      console.warn('[SoundEngine] 播放纸张翻动音失败:', err);
    }
  }

  public playClueInspectTone() {
    this.initContext();
    if (this.isMuted || !this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.linearRampToValueAtTime(1046.5, t + 0.08);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch (err) {
      console.warn('[SoundEngine] 播放检视对焦音失败:', err);
    }
  }

  public async startAmbientMystery(): Promise<void> {
    this.isAmbientDesired = true;
    if (this.isAmbientPlaying || this.isMuted || typeof window === 'undefined') return;

    this.initContext();
    if (!this.ctx) return;

    // 检查是否受浏览器自动播放策略限制
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('[SoundEngine] 等待用户手势激活 AudioContext:', err);
      }
    }

    // 若依然未进入 running 状态，等待首个交互触发，绝不提前锁定 isAmbientPlaying
    if (this.ctx.state !== 'running') {
      const unlockAndStart = async () => {
        window.removeEventListener('click', unlockAndStart);
        window.removeEventListener('keydown', unlockAndStart);
        window.removeEventListener('touchstart', unlockAndStart);
        if (this.ctx && this.ctx.state === 'suspended') {
          await this.ctx.resume().catch(() => {});
        }
        if (this.isAmbientDesired && !this.isAmbientPlaying) {
          this.startAmbientMystery();
        }
      };
      window.addEventListener('click', unlockAndStart, { once: true, passive: true });
      window.addEventListener('keydown', unlockAndStart, { once: true, passive: true });
      window.addEventListener('touchstart', unlockAndStart, { once: true, passive: true });
      return;
    }

    try {
      const t = this.ctx.currentTime;
      this.ambientGain = this.ctx.createGain();

      // 平滑淡入 (0.6s)，彻底杜绝咔哒爆音
      this.ambientGain.gain.setValueAtTime(0, t);
      this.ambientGain.gain.linearRampToValueAtTime(this.AMBIENT_TARGET_GAIN, t + 0.6);
      this.ambientGain.connect(this.ctx.destination);

      // 低频悬疑氛围正弦波群 (A1: 55Hz, A2: 110Hz, E3: 164.81Hz)
      const freqs = [55, 110, 164.81];
      this.ambientOscs = freqs.map((f, i) => {
        const osc = this.ctx!.createOscillator();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f + (i === 1 ? 0.3 : 0), this.ctx!.currentTime);
        osc.connect(this.ambientGain!);
        osc.start();
        return osc;
      });

      this.isAmbientPlaying = true;
    } catch (err) {
      console.error('[SoundEngine] 启动环境氛围音失败:', err);
      this.stopAmbient(0.01);
    }
  }

  public stopAmbient(fadeDuration: number = 0.5): void {
    this.isAmbientDesired = false;
    if (!this.isAmbientPlaying || !this.ctx) return;

    const t = this.ctx.currentTime;
    const oscsToStop = [...this.ambientOscs];
    const gainToClean = this.ambientGain;

    this.ambientOscs = [];
    this.ambientGain = null;
    this.isAmbientPlaying = false;

    // 平滑淡出断开，杜绝硬切爆音
    if (gainToClean) {
      try {
        gainToClean.gain.setValueAtTime(gainToClean.gain.value, t);
        gainToClean.gain.linearRampToValueAtTime(0.0001, t + fadeDuration);
      } catch (err) {
        console.warn('[SoundEngine] 环境音淡出异常:', err);
      }
    }

    setTimeout(() => {
      oscsToStop.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      try {
        gainToClean?.disconnect();
      } catch {}
    }, fadeDuration * 1000);
  }
}

export const sound = new SoundEngine();
