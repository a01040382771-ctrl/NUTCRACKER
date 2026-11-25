/* =====================================================================
   07 · AUDIO — a tiny music-box orchestra synthesised with WebAudio
   (original waltz & march written for this game; no samples)
   ===================================================================== */
const NOTE_IDX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function noteFreq(n) {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(n);
  if (!m) return 0;
  const midi = 12 * (parseInt(m[2], 10) + 1) + NOTE_IDX[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}
/* "G5:2 B5:1 | C4+E4:1 r:1" → [{beat, freqs, dur}] */
function parseSeq(str, startBeat = 0) {
  const out = []; let beat = startBeat;
  for (const tok of str.split(/\s+/)) {
    if (!tok || tok === '|') continue;
    const [n, d] = tok.split(':'); const dur = parseFloat(d || '1');
    if (n !== 'r') out.push({ beat, freqs: n.split('+').map(noteFreq), dur });
    beat += dur;
  }
  return { ev: out, len: beat - startBeat };
}

const WALTZ_MEL =
  'G5:2 B5:1 | D6:2 B5:1 | C6:1.5 B5:0.5 A5:1 | F#5:2 A5:1 | C6:2 A5:1 | F#5:1 E5:1 F#5:1 | G5:1 B5:1 D6:1 | G5:3 |' +
  'E5:1 G5:1 B5:1 | E6:2 D6:1 | C6:1 B5:1 A5:1 | B5:2 D#5:1 | E5:1 G5:1 B5:1 | E6:1.5 D6:0.5 C6:1 | A5:1 C6:1 F#5:1 | G5:3';
const WALTZ_CHORDS = ['G', 'G', 'Am', 'D7', 'D7', 'D7', 'G', 'G', 'Em', 'Em', 'Am', 'B7', 'Em', 'C', 'D7', 'G'];
const CHORD = {
  G: ['G2', 'B3+D4'], Am: ['A2', 'C4+E4'], D7: ['D3', 'F#3+C4'], Em: ['E2', 'G3+B3'], B7: ['B2', 'D#4+A3'], C: ['C3', 'E3+G3'], D: ['D3', 'F#3+A3'],
};
const MARCH_MEL =
  'E5:0.5 E5:0.5 G5:0.5 B5:0.5 | E6:1 B5:0.5 G5:0.5 | A5:0.5 C6:0.5 A5:0.5 E5:0.5 | D#5:1 F#5:0.5 B5:0.5 |' +
  'E5:0.5 G5:0.5 B5:0.5 E6:0.5 | E6:0.5 D6:0.5 C6:0.5 G5:0.5 | F#5:0.5 A5:0.5 D#5:0.5 F#5:0.5 | E5:1 r:1 |' +
  'B5:0.25 A#5:0.25 B5:0.5 G5:0.5 D5:0.5 | A5:0.25 G#5:0.25 A5:0.5 F#5:0.5 D5:0.5 | G5:0.5 E5:0.5 C5:0.5 E5:0.5 | F#5:0.5 D#5:0.5 B4:1 |' +
  'E5:0.5 B4:0.5 E5:0.5 G5:0.5 | A5:0.5 E5:0.5 A5:0.5 C6:0.5 | B5:0.5 A5:0.5 F#5:0.5 D#5:0.5 | E5:1 E4:1';
const MARCH_CHORDS = ['Em', 'Em', 'Am', 'B7', 'Em', 'C', 'B7', 'Em', 'G', 'D', 'C', 'B7', 'Em', 'Am', 'B7', 'Em'];
const MUSICBOX_MEL =
  'E6:0.5 C6:0.5 G5:0.5 C6:0.5 E6:0.5 G6:1.5 | F6:0.5 D6:0.5 B5:0.5 D6:0.5 F6:0.5 A6:1.5 |' +
  'G6:0.5 E6:0.5 C6:0.5 E6:0.5 G6:0.5 C7:1.5 | B6:0.5 G6:0.5 D6:0.5 F6:0.5 E6:0.5 C6:2';

const Sound = {
  ctx: null, muted: false, music: null, timer: null, pendingTrack: null,
  init() {
    if (this.ctx) { this.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { this.ctx = null; return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.85;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    this.master.connect(comp); comp.connect(c.destination);
    // little hall: two filtered feedback delays
    this.verb = c.createGain(); this.verb.gain.value = 0.32;
    const mk = (time, fbv) => { const d = c.createDelay(1); d.delayTime.value = time; const fb = c.createGain(); fb.gain.value = fbv; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; this.verb.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(this.master); };
    mk(0.137, 0.42); mk(0.211, 0.36);
    this.musicBus = c.createGain(); this.musicBus.gain.value = 0.5; this.musicBus.connect(this.master); this.musicBus.connect(this.verb);
    this.sfx = c.createGain(); this.sfx.gain.value = 0.8; this.sfx.connect(this.master);
    const sfxVerb = c.createGain(); sfxVerb.gain.value = 0.35; this.sfx.connect(sfxVerb); sfxVerb.connect(this.verb);
    const len = c.sampleRate;
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.resume();
    if (this.pendingTrack) { const t = this.pendingTrack; this.pendingTrack = null; this.playMusic(t); }
  },
  resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); },
  setMuted(m) {
    this.muted = m;
    if (this.ctx) { const g = this.master.gain; g.cancelScheduledValues(this.ctx.currentTime); g.setTargetAtTime(m ? 0 : 0.85, this.ctx.currentTime, 0.05); }
  },
  get now() { return this.ctx ? this.ctx.currentTime : 0; },
  /* ---------- instruments ---------- */
  bell(t, f, dur = 1.4, vol = 0.2, dest, bright = 1) {
    const c = this.ctx; if (!c || !f) return;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
    g.connect(dest || this.sfx);
    for (const [m, a] of [[1, 1], [2, 0.3 * bright], [3.0, 0.1 * bright], [4.16, 0.07 * bright]]) {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * m;
      const pg = c.createGain(); pg.gain.setValueAtTime(a, t);
      if (m > 1) pg.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(dur, 0.25 + dur * 0.5 / m));
      o.connect(pg); pg.connect(g); o.start(t); o.stop(t + dur + 0.05);
    }
  },
  pluck(t, f, dur = 0.4, vol = 0.22, dest) {
    const c = this.ctx; if (!c || !f) return;
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(8000, f * 6), t); lp.frequency.exponentialRampToValueAtTime(Math.max(60, f * 1.2), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(lp); lp.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + 0.05);
  },
  noiseHit(t, dur, vol, type = 'bandpass', freq = 1200, q = 1, dest, sweepTo) {
    const c = this.ctx; if (!c) return;
    const s = c.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = 1;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfx); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },
  tone(t, f0, f1, dur, vol, type = 'sine', dest) {
    const c = this.ctx; if (!c) return;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + 0.05);
  },
  /* ---------- music ---------- */
  tracks: {},
  buildTracks() {
    const waltz = (bpm, soft) => {
      const mel = parseSeq(WALTZ_MEL), ev = [];
      mel.ev.forEach((e) => ev.push({ beat: e.beat, kind: 'bell', f: e.freqs[0], dur: e.dur, vol: soft ? 0.16 : 0.2 }));
      WALTZ_CHORDS.forEach((ch, bar) => {
        const [b, up] = CHORD[ch]; const b0 = bar * 3;
        ev.push({ beat: b0, kind: 'pluck', f: noteFreq(b), dur: 1, vol: 0.26 });
        for (const k of [1, 2]) up.split('+').forEach((n) => ev.push({ beat: b0 + k, kind: 'bellLow', f: noteFreq(n), dur: 0.7, vol: soft ? 0.05 : 0.065 }));
        if (!soft && bar % 2 === 1) ev.push({ beat: b0 + 2.5, kind: 'bell', f: noteFreq(up.split('+')[1]) * 2, dur: 0.4, vol: 0.05 });
      });
      return { bpm, len: mel.len, ev: ev.sort((a, b) => a.beat - b.beat) };
    };
    const march = (bpm) => {
      const mel = parseSeq(MARCH_MEL), ev = [];
      mel.ev.forEach((e) => ev.push({ beat: e.beat, kind: 'bell', f: e.freqs[0], dur: Math.min(0.5, e.dur), vol: 0.17 }));
      MARCH_CHORDS.forEach((ch, bar) => {
        const [b, up] = CHORD[ch]; const b0 = bar * 2;
        ev.push({ beat: b0, kind: 'pluck', f: noteFreq(b), dur: 0.4, vol: 0.28 });
        ev.push({ beat: b0 + 1, kind: 'pluck', f: noteFreq(b) * 1.5, dur: 0.35, vol: 0.2 });
        up.split('+').forEach((n) => ev.push({ beat: b0 + 0.5, kind: 'pluck', f: noteFreq(n), dur: 0.25, vol: 0.07 }));
        up.split('+').forEach((n) => ev.push({ beat: b0 + 1.5, kind: 'pluck', f: noteFreq(n), dur: 0.25, vol: 0.07 }));
        ev.push({ beat: b0 + 1, kind: 'snare', vol: 0.08 });
        ev.push({ beat: b0 + 1.75, kind: 'tick', vol: 0.05 });
      });
      return { bpm, len: mel.len, ev: ev.sort((a, b) => a.beat - b.beat) };
    };
    this.tracks.waltz = waltz(96, false);
    this.tracks.title = waltz(80, true);
    this.tracks.march = march(118);
    this.tracks.boss = march(136);
  },
  playMusic(name) {
    if (!this.ctx) { this.pendingTrack = name; return; }
    if (!this.tracks.waltz) this.buildTracks();
    if (this.music && this.music.name === name) return;
    this.stopMusic(0.6);
    if (!name) return;
    const tr = this.tracks[name]; if (!tr) return;
    const bus = this.ctx.createGain(); bus.gain.value = 0; bus.connect(this.musicBus);
    bus.gain.setTargetAtTime(1, this.ctx.currentTime, 0.3);
    this.music = { name, tr, bus, start: this.ctx.currentTime + 0.12, idx: 0, loop: 0 };
    if (!this.timer) this.timer = setInterval(() => this.tick(), 40);
    this.tick();
  },
  stopMusic(fade = 0.5) {
    if (!this.music || !this.ctx) { this.music = null; return; }
    const b = this.music.bus; b.gain.cancelScheduledValues(this.ctx.currentTime); b.gain.setTargetAtTime(0, this.ctx.currentTime, fade / 3);
    setTimeout(() => { try { b.disconnect(); } catch (e) { /* ignore */ } }, (fade + 0.5) * 1000);
    this.music = null;
  },
  duck(amount, dur) {
    if (!this.ctx) return;
    const g = this.musicBus.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t); g.setTargetAtTime(0.5 * amount, t, 0.15); g.setTargetAtTime(0.5, t + dur, 0.5);
  },
  tick() {
    const m = this.music; if (!m || !this.ctx) return;
    const spb = 60 / m.tr.bpm, ahead = this.ctx.currentTime + 0.3;
    for (let guard = 0; guard < 64; guard++) {
      const e = m.tr.ev[m.idx];
      const t = m.start + (m.loop * m.tr.len + e.beat) * spb;
      if (t > ahead) break;
      if (t > this.ctx.currentTime - 0.05) this.playEvent(e, t, spb, m.bus);
      m.idx++;
      if (m.idx >= m.tr.ev.length) { m.idx = 0; m.loop++; }
    }
  },
  playEvent(e, t, spb, bus) {
    switch (e.kind) {
      case 'bell': this.bell(t, e.f, Math.max(0.6, e.dur * spb * 2.2), e.vol, bus); break;
      case 'bellLow': this.bell(t, e.f, 0.8, e.vol, bus, 0.4); break;
      case 'pluck': this.pluck(t, e.f, Math.max(0.25, e.dur * spb), e.vol, bus); break;
      case 'snare': this.noiseHit(t, 0.12, e.vol, 'highpass', 1800, 0.7, bus); break;
      case 'tick': this.noiseHit(t, 0.04, e.vol, 'highpass', 6000, 0.7, bus); break;
    }
  },
  playSeq(str, bpm, vol = 0.18, bright = 1.2) {
    if (!this.ctx) return 0;
    const s = parseSeq(str), spb = 60 / bpm, t0 = this.ctx.currentTime + 0.05;
    s.ev.forEach((e, i) => { const slow = 1 + Math.max(0, i - s.ev.length + 6) * 0.08; e.freqs.forEach((f) => this.bell(t0 + e.beat * spb * slow, f * (1 + (Math.random() - 0.5) * 0.004), 1.6, vol, this.sfx, bright)); });
    return s.len * spb;
  },
  /* ---------- sound effects ---------- */
  sfxStar(n = 0) {
    if (!this.ctx) return; const t = this.now + 0.01, base = [0, 4, 7, 12, 16];
    const root = noteFreq('E6') * Math.pow(2, (n % 4) * 2 / 12);
    base.forEach((s, i) => this.bell(t + i * 0.055, root * Math.pow(2, s / 12), 1.1, 0.12, this.sfx, 1.4));
    this.noiseHit(t, 0.5, 0.04, 'highpass', 7000, 0.5);
  },
  sfxJump() { if (!this.ctx) return; const t = this.now; this.noiseHit(t, 0.3, 0.09, 'bandpass', 500, 1.5, this.sfx, 2600); this.bell(t + 0.03, noteFreq('B6'), 0.5, 0.05); },
  sfxLand() { if (!this.ctx) return; this.tone(this.now, 140, 55, 0.14, 0.18); this.noiseHit(this.now, 0.08, 0.04, 'lowpass', 600, 0.7); },
  sfxStep() { if (!this.ctx) return; this.noiseHit(this.now, 0.035, 0.025, 'highpass', 3200, 0.8); },
  sfxUI() { if (!this.ctx) return; const t = this.now; this.bell(t, noteFreq('A5'), 0.6, 0.08); this.bell(t + 0.06, noteFreq('E6'), 0.6, 0.06); },
  sfxChime() { if (!this.ctx) return; const t = this.now; ['C6', 'E6', 'G6'].forEach((n, i) => this.bell(t + i * 0.09, noteFreq(n), 1.2, 0.07)); },
  sfxOpen() { if (!this.ctx) return; const t = this.now; ['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7', 'E7'].forEach((n, i) => this.bell(t + i * 0.05, noteFreq(n), 1.6, 0.09, this.sfx, 1.3)); this.noiseHit(t, 1.2, 0.05, 'highpass', 6000, 0.5); },
  sfxBong() {
    if (!this.ctx) return; const c = this.ctx, t = this.now, f = 98;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.32, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + 3.6); g.connect(this.sfx);
    for (const [m, a] of [[0.5, 0.5], [1, 1], [1.19, 0.45], [1.5, 0.3], [2, 0.5], [2.67, 0.2], [3.01, 0.15], [4.1, 0.08]]) {
      const o = c.createOscillator(); o.frequency.value = f * m * (1 + (Math.random() - 0.5) * 0.002); const pg = c.createGain(); pg.gain.setValueAtTime(a, t); pg.gain.exponentialRampToValueAtTime(0.0001, t + 3.6 / Math.sqrt(m));
      o.connect(pg); pg.connect(g); o.start(t); o.stop(t + 3.7);
    }
  },
  sfxSqueak(p = 1) { if (!this.ctx) return; const t = this.now; this.tone(t, 1700 * p, 2500 * p, 0.08, 0.05, 'triangle'); this.tone(t + 0.1, 2000 * p, 2900 * p, 0.07, 0.04, 'triangle'); },
  sfxLaugh() { if (!this.ctx) return; const t = this.now; for (let i = 0; i < 6; i++) { this.tone(t + i * 0.13, 1100 - i * 60, 1500 - i * 80, 0.1, 0.06, 'square'); } },
  sfxThrow() { if (!this.ctx) return; this.noiseHit(this.now, 0.22, 0.08, 'bandpass', 900, 2, this.sfx, 3200); },
  sfxHit() { if (!this.ctx) return; const t = this.now; this.tone(t, 700, 160, 0.16, 0.16); this.noiseHit(t, 0.12, 0.08, 'bandpass', 1500, 1); this.bell(t + 0.05, noteFreq('G6'), 0.7, 0.06); },
  sfxPoof() { if (!this.ctx) return; this.noiseHit(this.now, 0.45, 0.1, 'lowpass', 1500, 0.5, this.sfx, 200); },
  sfxHurt() { if (!this.ctx) return; const t = this.now; this.tone(t, 520, 300, 0.18, 0.1, 'triangle'); this.noiseHit(t, 0.1, 0.05, 'lowpass', 900, 0.6); },
  sfxWhistle() { if (!this.ctx) return; const t = this.now; for (const d of [0, 0.42]) { this.tone(t + d, noteFreq('A5'), noteFreq('A5') * 0.98, 0.32, 0.05, 'sine'); this.tone(t + d, noteFreq('C#6'), noteFreq('C#6') * 0.98, 0.32, 0.04, 'sine'); this.noiseHit(t + d, 0.3, 0.03, 'bandpass', 2400, 3); } },
  sfxBoing() { if (!this.ctx) return; const c = this.ctx, t = this.now; const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(620, t + 0.12); const l = c.createOscillator(); l.frequency.value = 18; const lg = c.createGain(); lg.gain.value = 60; l.connect(lg); lg.connect(o.frequency); const g = c.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.6); o.connect(g); g.connect(this.sfx); o.start(t); l.start(t); o.stop(t + 0.65); l.stop(t + 0.65); },
  sfxCrank() { if (!this.ctx) return; const t = this.now; for (let i = 0; i < 7; i++) this.noiseHit(t + i * 0.07, 0.03, 0.06, 'highpass', 4000, 1.5); },
  sfxTransform() { if (!this.ctx) return; const t = this.now; for (let i = 0; i < 14; i++) this.bell(t + i * 0.06, noteFreq('C5') * Math.pow(2, (i * 2.5) / 12), 2.2, 0.07, this.sfx, 1.4); this.noiseHit(t, 2, 0.05, 'highpass', 5000, 0.4); },
  sfxPortal() { if (!this.ctx) return; const t = this.now; ['G5', 'D6', 'G6', 'B6', 'D7'].forEach((n, i) => this.bell(t + i * 0.12, noteFreq(n), 2.4, 0.07, this.sfx, 1.2)); },
  sfxFanfare() { if (!this.ctx) return; const t = this.now; const seq = [['G4', 0], ['B4', 0.12], ['D5', 0.24], ['G5', 0.36], ['B5', 0.6], ['D6', 0.84]]; seq.forEach(([n, d]) => { this.bell(t + d, noteFreq(n), 2.0, 0.12, this.sfx, 1.2); this.pluck(t + d, noteFreq(n) / 2, 0.5, 0.12); }); ['G4', 'B4', 'D5', 'G5'].forEach((n) => this.bell(t + 1.1, noteFreq(n), 3, 0.08, this.sfx, 0.8)); },
  sfxRumble(dur = 2) { if (!this.ctx) return; this.noiseHit(this.now, dur, 0.12, 'lowpass', 160, 0.8); this.tone(this.now, 55, 40, dur, 0.12); },
};
