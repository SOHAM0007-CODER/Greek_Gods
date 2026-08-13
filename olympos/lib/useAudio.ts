'use client';

import { useEffect } from 'react';
import { PANTHEON } from './pantheon';

const NOISE_BP: Record<string, number> = { wind: 760, glass: 2600, string: 1150, ocean: 420, ember: 190 };
const NOISE_GN: Record<string, number> = { wind: 0.10, glass: 0.045, string: 0.035, ocean: 0.15, ember: 0.11 };

function damp(cur: number, tgt: number, l: number, dt: number) {
  return cur + (tgt - cur) * (1 - Math.exp(-l * dt));
}

class AudioEngineClass {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  analyser: AnalyserNode | null = null;
  bins: Uint8Array | null = null;
  noiseBuf: AudioBuffer | null = null;
  drone: any = null;
  ambience: boolean = true;
  ready: boolean = false;
  level: number = 0;
  speechPulse: number = 0;
  speaking: boolean = false;
  onSpeechEnd: (() => void) | null = null;
  chantNodes: any[] | null = null;

  init() {
    if (this.ready) return;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.75;
    this.bins = new Uint8Array(this.analyser.frequencyBinCount);
    this.master.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    const len = this.ctx.sampleRate * 2.2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = this.noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.03 * w) / 1.03;
      ch[i] = last * 3.2;
    }
    this.ready = true;
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  makeDrone(god: typeof PANTHEON[0]) {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(this.master!);
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 850;
    filt.Q.value = 1.1;
    filt.connect(out);
    const nodes: any[] = [];
    god.chord.forEach((f, i) => {
      ([[f, 'triangle', 0.16], [f * 1.006, 'sine', 0.09], [f * 0.5, 'sine', 0.07]] as const).forEach(cfg => {
        const o = ctx.createOscillator();
        o.type = cfg[1] as OscillatorType;
        o.frequency.value = cfg[0];
        const g = ctx.createGain();
        g.gain.value = cfg[2] / (i + 1.3);
        o.connect(g);
        g.connect(filt);
        o.start(t);
        nodes.push(o);
      });
    });
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf!;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = god.drone === 'ocean' ? 'lowpass' : 'bandpass';
    bp.frequency.value = NOISE_BP[god.drone] || 800;
    bp.Q.value = 0.9;
    const ng = ctx.createGain();
    ng.gain.value = NOISE_GN[god.drone] || 0.06;
    src.connect(bp);
    bp.connect(ng);
    ng.connect(out);
    src.start(t);
    nodes.push(src);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05 + Math.random() * 0.06;
    const lg = ctx.createGain();
    lg.gain.value = 320;
    lfo.connect(lg);
    lg.connect(filt.frequency);
    lfo.start(t);
    nodes.push(lfo);

    const amp = ctx.createOscillator();
    amp.frequency.value = 0.09;
    const ag = ctx.createGain();
    ag.gain.value = 0.35;
    amp.connect(ag);
    ag.connect(out.gain);
    amp.start(t);
    nodes.push(amp);

    return { out, nodes, filt };
  }

  setGod(god: typeof PANTHEON[0], fade?: number) {
    if (!this.ready || !this.ctx) return;
    const t = this.ctx.currentTime;
    const f = fade === undefined ? 1.6 : fade;
    const old = this.drone;
    if (old) {
      old.out.gain.cancelScheduledValues(t);
      old.out.gain.setValueAtTime(old.out.gain.value, t);
      old.out.gain.linearRampToValueAtTime(0, t + f);
      setTimeout(() => {
        try {
          old.nodes.forEach((n: any) => n.stop());
          old.out.disconnect();
        } catch (e) { }
      }, (f + 0.3) * 1000);
    }
    const d = this.makeDrone(god);
    d.out.gain.setValueAtTime(0, t);
    d.out.gain.linearRampToValueAtTime(0.62, t + f);
    this.drone = d;
  }

  setAmbience(on: boolean, instant?: boolean) {
    this.ambience = on;
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(on ? 0.9 : 0.0, t + (instant ? 0.05 : 1.1));
  }

  duck(on: boolean) {
    if (!this.drone || !this.ctx) return;
    const t = this.ctx.currentTime;
    const g = this.drone.out.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(on ? 0.26 : 0.62, t + 0.8);
  }

  speak(text: string, god: typeof PANTHEON[0], onend: () => void) {
    this.resume();
    this.duck(true);
    this.onSpeechEnd = onend;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.getVoices) {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const voices = synth.getVoices() || [];
      const pick = voices.find(v => /en-GB/i.test(v.lang) && /male|daniel|george|arthur/i.test(v.name))
        || voices.find(v => /en-GB/i.test(v.lang))
        || voices.find(v => /^en/i.test(v.lang));
      if (pick) u.voice = pick;
      u.rate = 0.84;
      u.pitch = 0.85;
      u.volume = 1;
      u.onboundary = () => { this.speechPulse = 1; };
      u.onend = () => { this.endSpeech(); };
      u.onerror = () => { this.endSpeech(); };
      this.speaking = true;
      synth.speak(u);
      return true;
    }
    this.chant(god);
    return true;
  }

  chant(god: typeof PANTHEON[0]) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(this.master);
    const notes = god.chord.concat(god.chord.map(f => f * 1.5)).sort(() => Math.random() - 0.5);
    const nodes: any[] = [];
    for (let i = 0; i < 10; i++) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = notes[i % notes.length] * 2;
      const ng = ctx.createGain();
      ng.gain.value = 0;
      const t = t0 + i * 1.1;
      ng.gain.setValueAtTime(0, t);
      ng.gain.linearRampToValueAtTime(0.16, t + 0.35);
      ng.gain.linearRampToValueAtTime(0, t + 1.15);
      o.connect(ng);
      ng.connect(g);
      o.start(t);
      o.stop(t + 1.3);
      nodes.push(o);
    }
    g.gain.setValueAtTime(1, t0);
    this.speaking = true;
    this.chantNodes = nodes;
    setTimeout(() => this.endSpeech(), 11500);
  }

  stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    if (this.chantNodes) {
      this.chantNodes.forEach(n => { try { n.stop(); } catch (e) { } });
      this.chantNodes = null;
    }
    this.endSpeech();
  }

  endSpeech() {
    if (!this.speaking) return;
    this.speaking = false;
    this.duck(false);
    if (this.onSpeechEnd) {
      const f = this.onSpeechEnd;
      this.onSpeechEnd = null;
      f();
    }
  }

  update(dt: number) {
    let raw = 0;
    if (this.analyser && this.bins) {
      this.analyser.getByteFrequencyData(this.bins);
      let sum = 0;
      const n = Math.min(64, this.bins.length);
      for (let i = 2; i < n; i++) sum += this.bins[i];
      raw = (sum / (n - 2)) / 255;
    }
    this.speechPulse = damp(this.speechPulse, 0, 5.5, dt);
    const floor = this.speaking ? 0.30 : 0.0;
    const target = Math.max(0, Math.min(1, raw * 1.9 + this.speechPulse * 0.75 + floor));
    this.level = damp(this.level, target, this.speaking ? 14 : 6, dt);
    return this.level;
  }
}

export const AudioEngine = new AudioEngineClass();

export function useAudio() {
  return {
    speak: (text: string, god: typeof PANTHEON[0], onend: () => void) => AudioEngine.speak(text, god, onend),
    stop: () => AudioEngine.stopSpeech(),
    setGod: (god: typeof PANTHEON[0], fade?: number) => AudioEngine.setGod(god, fade),
    resume: () => AudioEngine.resume(),
    setAmbience: (on: boolean, instant?: boolean) => AudioEngine.setAmbience(on, instant)
  };
}
