/* =====================================================================
   20 · RHYTHM ENGINE — audio-clock timing, chart, judging, lanes on a canvas
   Note positions and judgements come from the AudioContext clock, never from frame time.
   ===================================================================== */

/* a short waltz in D major written for this game: an original tune in waltz style, not a transcription of any score */
const SNOW_TRACK = {
  melody:
    'D6:3 | A5:1 F#5:1 A5:1 | B5:3 | G5:1 B5:1 D6:1 | ' +
    'C#6:1 B5:1 A5:1 | B5:1 A5:1 F#5:1 | G5:1 A5:1 B5:1 | A5:3 | ' +
    'D6:1 C#6:0.5 B5:0.5 A5:1 | B5:1 A5:0.5 G5:0.5 F#5:1 | G5:1 B5:0.5 D6:0.5 E6:1 | C#6:3 | ' +
    'D6:1 F#6:1 D6:1 | E6:1 C#6:1 A5:1 | B5:0.5 C#6:0.5 D6:1 E6:1 | F#6:2 E6:1 | ' +
    'D6:1 B5:1 G5:1 | A5:1 F#5:1 D5:1 | E5:1 F#5:1 A5:1 | D6:3',
  chords: ['D', 'D', 'Bm', 'G', 'A7', 'D', 'G', 'A7', 'D', 'Bm', 'G', 'A7', 'D', 'A', 'G', 'A7', 'D', 'D', 'A7', 'D'],
};
const SNOW_CHORD = { D: ['D3', 'F#4+A4'], Bm: ['B2', 'D4+F#4'], G: ['G2', 'B3+D4'], A7: ['A2', 'C#4+G4'], A: ['A2', 'C#4+E4'] };

/* while the game is paused the audio clock must stay frozen, even if a key press asks the context to resume */
(() => { const resume = Sound.resume; Sound.resume = function () { if (!this.hold) resume.call(this); }; })();

const Rhythm = {
  running: false, paused: false, clock: 'audio', lanes: 3, spb: 0.4167, token: 0, auto: null,
  notes: [], stats: { perfect: 0, good: 0, miss: 0 }, t0: 0, endRel: 0, lastRel: -9, perfShift: 0, perfPausedAt: 0,
  events: [], evIdx: 0, bus: null, src: null, buf: null, bufUrl: '', bufTask: null, pumpTimer: 0,
  pressed: [], fx: [], label: null, onJudge: null, onEnd: null,
  cv: null, g: null, W: 1, H: 1, dpr: 1, sprites: null,

  /* ---------- chart: the pitch range of the melody is cut into one band per lane ---------- */
  chart() {
    const cfg = SNOW_CFG, spb = 60 / cfg.audio.bpm, L = cfg.lanes;
    const raw = parseSeq(SNOW_TRACK.melody).ev.map((e) => ({ beat: e.beat, f: e.freqs[0], s: 12 * Math.log2(e.freqs[0] / 440) }));
    const sorted = raw.map((n) => n.s).sort((a, b) => a - b);
    const cuts = []; for (let k = 1; k < L; k++) cuts.push(sorted[Math.floor((sorted.length * k) / L)]);
    const notes = []; let last = -1e9;
    for (const n of raw) {
      const rel = n.beat * spb;
      if (rel - last < cfg.minGapSec - 1e-6) continue;
      last = rel;
      notes.push({ i: notes.length, beat: n.beat, rel, lane: cuts.reduce((a, c) => a + (n.s >= c ? 1 : 0), 0), f: n.f, last: false, state: 'wait', err: 0 });
    }
    if (notes.length) notes[notes.length - 1].last = true;
    return { notes, spb, lanes: L, lengthSec: notes.length ? notes[notes.length - 1].rel + cfg.tailSec : 0 };
  },
  prepare() {
    const c = this.chart();
    this.notes = c.notes; this.spb = c.spb; this.lanes = c.lanes;
    this.stats = { perfect: 0, good: 0, miss: 0 };
    this.pressed = new Array(this.lanes).fill(-99);
    this.fx = []; this.label = null; this.lastRel = -9;
    const last = this.notes.length ? this.notes[this.notes.length - 1].rel : 0;
    this.endRel = last + SNOW_CFG.tailSec;
    if (this.buf) this.endRel = Math.max(this.endRel, this.buf.duration - SNOW_CFG.audio.firstBeatSec);
    return c;
  },

  /* ---------- the optional real recording ---------- */
  preload() {
    const url = SNOW_CFG.audio.url;
    if (!url || !Sound.ctx) return Promise.resolve(null);
    if (this.bufUrl === url && this.bufTask) return this.bufTask;
    this.bufUrl = url;
    this.bufTask = fetch(url).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then((ab) => new Promise((ok, no) => Sound.ctx.decodeAudioData(ab, ok, no)))
      .then((b) => { this.buf = b; return b; })
      .catch((e) => { console.warn('rhythm audio:', e && e.message ? e.message : e); this.buf = null; return null; });
    return this.bufTask;
  },

  /* ---------- clock ---------- */
  clockNow() { return this.clock === 'audio' ? Sound.ctx.currentTime : performance.now() / 1000 - this.perfShift; },
  latency() {
    const k = SNOW_CFG.clock; let L = k.inputOffsetSec || 0;
    if (this.clock === 'audio' && k.useOutputLatency) { const o = Sound.ctx.outputLatency; if (o > 0 && o < 0.5) L += o; }
    return L;
  },
  audible() { return this.clockNow() - this.latency(); },
  rel() { return this.audible() - this.t0; },

  /* ---------- run control ---------- */
  async start(cb = {}) {
    const my = ++this.token;
    this.stop(true);
    this.onJudge = cb.onJudge || null; this.onEnd = cb.onEnd || null;
    Sound.init();
    const ctx = Sound.ctx;
    if (!SNOW_CFG.audio.url) this.buf = null; else await this.preload();
    if (my !== this.token) return false;
    if (ctx && ctx.state !== 'running') { try { await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 600))]); } catch (e) { /* stays suspended */ } }
    if (my !== this.token) return false;
    this.clock = ctx && ctx.state === 'running' ? 'audio' : 'perf';
    this.perfShift = 0;
    this.prepare();
    this.mount();
    const spb = this.spb;
    this.t0 = this.clockNow() + 0.35 + SNOW_CFG.countInBeats * spb;
    this.events = this.buildEvents(spb); this.evIdx = 0;
    if (this.clock === 'audio') {
      this.bus = ctx.createGain(); this.bus.gain.value = SNOW_CFG.audio.volume; this.bus.connect(Sound.musicBus);
      if (this.buf) {
        const src = ctx.createBufferSource(); src.buffer = this.buf; src.connect(this.bus);
        const at = this.t0 - SNOW_CFG.audio.firstBeatSec, now = ctx.currentTime;
        if (at >= now) src.start(at); else src.start(now, now - at);
        this.src = src;
      }
    }
    this.running = true; this.paused = false;
    this.pump();
    clearInterval(this.pumpTimer); this.pumpTimer = setInterval(() => this.pump(), 40);
    return true;
  },
  stop(keepToken) {
    if (!keepToken) this.token++;
    clearInterval(this.pumpTimer); this.pumpTimer = 0;
    this.running = false; this.paused = false; this.onJudge = null; this.onEnd = null;
    if (Sound.hold) { Sound.hold = false; if (this.clock === 'audio' && Sound.ctx) Sound.ctx.resume().catch(() => {}); }
    const bus = this.bus, src = this.src; this.bus = null; this.src = null;
    if (bus && Sound.ctx) {
      const t = Sound.ctx.currentTime;
      try { bus.gain.cancelScheduledValues(t); bus.gain.setTargetAtTime(0, t, 0.05); } catch (e) { /* ignore */ }
      setTimeout(() => { try { if (src) src.stop(); bus.disconnect(); } catch (e) { /* already gone */ } }, 400);
    }
    this.events = []; this.evIdx = 0;
  },
  finish() {
    if (!this.running) return;
    this.running = false; clearInterval(this.pumpTimer); this.pumpTimer = 0;
    const cb = this.onEnd, bus = this.bus, src = this.src, ctx = Sound.ctx;
    this.bus = null; this.src = null;
    if (bus && ctx) { bus.gain.setTargetAtTime(0, ctx.currentTime + 1.6, 0.4); setTimeout(() => { try { if (src) src.stop(); bus.disconnect(); } catch (e) { /* already gone */ } }, 3400); }
    if (cb) cb(this.stats);
  },
  pause() {
    if (!this.running || this.paused) return;
    this.paused = true; Sound.hold = true;
    if (this.clock === 'audio') Sound.ctx.suspend().catch(() => {}); else this.perfPausedAt = performance.now() / 1000;
  },
  resume() {
    if (!this.paused) return;
    Sound.hold = false;
    if (this.clock === 'audio') Sound.ctx.resume().catch(() => {}); else this.perfShift += performance.now() / 1000 - this.perfPausedAt;
    this.paused = false;
  },

  /* ---------- the built-in temporary track, scheduled a little ahead of the clock ---------- */
  buildEvents(spb) {
    const ev = [], ci = SNOW_CFG.countInBeats;
    for (let i = 0; i < ci; i++) ev.push({ t: -(ci - i) * spb, kind: 'tick', accent: i === 0 });
    if (this.buf) return ev;
    for (const e of parseSeq(SNOW_TRACK.melody).ev) ev.push({ t: e.beat * spb, kind: 'bell', f: e.freqs[0], dur: Math.max(0.7, Math.min(1.6, e.dur * spb * 2.2)), vol: 0.17 });
    SNOW_TRACK.chords.forEach((ch, bar) => {
      const [bass, up] = SNOW_CHORD[ch], b0 = bar * 3 * spb;
      ev.push({ t: b0, kind: 'pluck', f: noteFreq(bass), dur: Math.max(0.35, spb * 1.4), vol: 0.27 });
      for (const k of [1, 2]) up.split('+').forEach((n) => ev.push({ t: b0 + k * spb, kind: 'bellLow', f: noteFreq(n), vol: 0.055 }));
      ev.push({ t: b0 + 2.5 * spb, kind: 'sparkle' });
    });
    const lastBar = (SNOW_TRACK.chords.length - 1) * 3 * spb;
    ['D4', 'A4', 'F#5'].forEach((n) => ev.push({ t: lastBar + 0.02, kind: 'bell', f: noteFreq(n), dur: 2.4, vol: 0.1 }));
    return ev.sort((a, b) => a.t - b.t);
  },
  pump() {
    if (!this.running || this.paused || this.clock !== 'audio' || !this.bus) return;
    const c = Sound.ctx, ahead = c.currentTime + 0.6;
    while (this.evIdx < this.events.length) {
      const e = this.events[this.evIdx], at = this.t0 + e.t;
      if (at > ahead) break;
      this.evIdx++;
      if (at >= c.currentTime - 0.05) this.play(e, at);
    }
  },
  play(e, at) {
    const bus = this.bus; if (!bus) return;
    switch (e.kind) {
      case 'bell': Sound.bell(at, e.f, e.dur, e.vol, bus); break;
      case 'bellLow': Sound.bell(at, e.f, 0.8, e.vol, bus, 0.4); break;
      case 'pluck': Sound.pluck(at, e.f, e.dur, e.vol, bus); break;
      case 'sparkle': Sound.noiseHit(at, 0.04, 0.035, 'highpass', 6500, 0.8, bus); break;
      case 'tick': Sound.noiseHit(at, 0.05, 0.09, 'highpass', e.accent ? 3000 : 5000, 1, bus); Sound.bell(at, noteFreq(e.accent ? 'A6' : 'D6'), 0.35, 0.05, bus); break;
    }
  },

  /* ---------- judging ---------- */
  tapLane(lane, clockTime) {
    if (!this.running || this.paused) return null;
    const t = (clockTime === undefined ? this.clockNow() : clockTime) - this.latency();
    return this.tapRel(lane, t - this.t0);
  },
  /* rel = seconds from the first beat, in audible time; the note nearest to it within the good window is taken */
  tapRel(lane, rel) {
    const w = SNOW_CFG.windows;
    this.pressed[lane] = rel;
    let best = null, bd = 1e9;
    for (const n of this.notes) {
      if (n.state !== 'wait' || n.lane !== lane) continue;
      const d = n.rel - rel;
      if (d > w.good) break;
      const ad = Math.abs(d);
      if (ad <= w.good && ad < bd) { best = n; bd = ad; }
    }
    if (!best) { this.fx.push({ kind: 'tap', lane, born: rel }); return { lane, rating: 'none' }; }
    best.err = rel - best.rel;
    const rating = bd <= w.perfect ? 'perfect' : 'good';
    this.judge(best, rating, rel);
    return { lane, rating, note: best };
  },
  judge(n, rating, rel) {
    n.state = rating; this.stats[rating]++;
    this.fx.push({ kind: rating, lane: n.lane, born: rel, last: n.last });
    this.label = { text: rating === 'perfect' ? '정확!' : rating === 'good' ? '좋음' : '놓침', rating, lane: n.lane, born: rel };
    this.hitSfx(n, rating);
    if (this.onJudge) this.onJudge(n, rating);
  },
  sweep(rel) {
    const good = SNOW_CFG.windows.good;
    for (const n of this.notes) {
      if (n.state !== 'wait') continue;
      if (rel > n.rel + good) this.judge(n, 'miss', rel);
      else if (n.rel > rel + 1) break;
    }
  },
  hitSfx(n, rating) {
    if (!Sound.ctx) return;
    const t = Sound.now;
    if (rating === 'perfect') { Sound.bell(t, n.f * 2, 0.9, 0.075, Sound.sfx, 1.3); Sound.noiseHit(t, 0.12, 0.03, 'highpass', 7000, 0.6); }
    else if (rating === 'good') Sound.bell(t, n.f, 0.6, 0.045, Sound.sfx, 0.8);
    else Sound.tone(t, 210, 130, 0.14, 0.05, 'triangle');
  },

  /* test hook: plays the chart by itself with a fixed mix of judgements, through the same tapRel() as real input */
  autoKind(n, a) { const r = ((n.i * 19) % 100) / 100; return r < a.perfect ? 'perfect' : r < a.perfect + a.good ? 'good' : 'miss'; },
  runAuto() {
    if (!this.running || this.paused) return;
    const a = this.auto, rel = this.rel(), sgn = (n) => (n.i % 2 ? 1 : -1);
    for (const n of this.notes) {
      if (n.state !== 'wait') continue;
      if (n.rel > rel + 0.2) break;
      const kind = this.autoKind(n, a);
      if (kind === 'miss') continue;
      const off = kind === 'perfect' ? sgn(n) * 0.025 : sgn(n) * 0.1;
      if (rel >= n.rel + off) this.tapRel(n.lane, n.rel + off);
    }
  },

  /* ---------- per frame ---------- */
  update() {
    if (this.auto) this.runAuto();
    if (this.running && !this.paused) {
      const rel = this.rel(); this.lastRel = rel;
      this.sweep(rel);
      if (rel >= this.endRel) this.finish();
    }
    this.draw();
  },

  /* ---------- input ---------- */
  eventAgo(e) {
    const ts = e && e.timeStamp > 0 && e.timeStamp < 1e11 ? e.timeStamp : performance.now();
    return clamp((performance.now() - ts) / 1000, 0, 0.25);
  },
  onPointer(e) {
    if (!this.running) return;
    e.preventDefault();
    const r = this.cv.getBoundingClientRect(), k = this.geom();
    const lane = clamp(Math.floor((e.clientX - r.left - k.pad) / k.laneW), 0, k.L - 1);
    this.tapLane(lane, this.clockNow() - this.eventAgo(e));
  },
  onKey(e) {
    if (!this.running || e.repeat || this.paused) return;
    const lane = (SNOW_CFG.keys[this.lanes] || []).findIndex((codes) => codes.includes(e.code));
    if (lane < 0) return;
    e.preventDefault();
    this.tapLane(lane, this.clockNow() - this.eventAgo(e));
  },
  keyLabel(l) { const c = (SNOW_CFG.keys[this.lanes] || [])[l]; return c && c[0] ? c[0].replace('Key', '') : ''; },

  /* ---------- drawing ---------- */
  mount() {
    if (!this.cv) {
      this.cv = $('rhCv'); this.g = this.cv.getContext('2d');
      this.cv.addEventListener('pointerdown', (e) => this.onPointer(e));
      window.addEventListener('keydown', (e) => this.onKey(e));
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
    }
    if (!this.sprites) this.sprites = { flake: this.makeFlake('#ffffff', '170,215,255'), gold: this.makeFlake('#fff2c4', '255,214,120'), dim: this.makeFlake('#b9c4d8', '150,160,190') };
    this.resize();
  },
  makeFlake(col, glow) {
    const S = 128, cv = makeCanvas(S, S), g = cv.getContext('2d');
    g.translate(S / 2, S / 2);
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, S / 2); rg.addColorStop(0, `rgba(${glow},0.5)`); rg.addColorStop(1, `rgba(${glow},0)`);
    g.fillStyle = rg; g.fillRect(-S / 2, -S / 2, S, S);
    g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = S * 0.05;
    for (let k = 0; k < 6; k++) {
      g.save(); g.rotate((k * Math.PI) / 3);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -S * 0.36); g.stroke();
      for (const d of [0.14, 0.25]) { g.beginPath(); g.moveTo(-S * 0.08, -S * (d + 0.08)); g.lineTo(0, -S * d); g.lineTo(S * 0.08, -S * (d + 0.08)); g.stroke(); }
      g.restore();
    }
    g.fillStyle = col; g.beginPath(); g.arc(0, 0, S * 0.055, 0, TAU); g.fill();
    return cv;
  },
  resize() {
    if (!this.cv) return;
    const r = this.cv.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = Math.max(1, r.width); this.H = Math.max(1, r.height);
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    this.g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  },
  geom() {
    const W = this.W, H = this.H, L = this.lanes, pad = Math.min(10, W * 0.025), laneW = (W - pad * 2) / L, hitY = H * 0.8, topY = -laneW * 0.45;
    return { W, H, L, pad, laneW, hitY, topY, span: hitY - topY, size: Math.min(laneW * 0.72, 92) };
  },
  draw() {
    const g = this.g; if (!g || this.W < 4 || !this.sprites) return;
    const k = this.geom(), rel = this.lastRel, spb = this.spb, fall = SNOW_CFG.fallSec, sp = this.sprites;
    g.clearRect(0, 0, k.W, k.H);
    const bg = g.createLinearGradient(0, 0, 0, k.H);
    bg.addColorStop(0, 'rgba(14,26,70,0)'); bg.addColorStop(0.35, 'rgba(14,26,70,0.34)'); bg.addColorStop(1, 'rgba(10,18,52,0.66)');
    g.fillStyle = bg; g.fillRect(0, 0, k.W, k.H);
    g.lineWidth = 1; g.strokeStyle = 'rgba(225,240,255,0.28)';
    for (let l = 0; l < k.L; l++) {
      const x = k.pad + l * k.laneW, age = rel - this.pressed[l], glow = age >= 0 && age < 0.22 ? 0.3 * (1 - age / 0.22) : 0;
      const lg = g.createLinearGradient(0, 0, 0, k.H);
      lg.addColorStop(0, 'rgba(190,225,255,0)'); lg.addColorStop(1, `rgba(190,225,255,${0.12 + glow})`);
      g.fillStyle = lg; g.fillRect(x + 2, 0, k.laneW - 4, k.H);
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, k.H); g.stroke();
    }
    g.beginPath(); g.moveTo(k.pad + k.L * k.laneW, 0); g.lineTo(k.pad + k.L * k.laneW, k.H); g.stroke();
    // hit circles pulse on the beat
    const beat = ((rel / spb) % 1 + 1) % 1, pulse = this.running ? Math.pow(1 - beat, 3) : 0;
    for (let l = 0; l < k.L; l++) {
      const cx = k.pad + (l + 0.5) * k.laneW, r = k.size * 0.5 * (1 + 0.07 * pulse);
      g.lineWidth = 3; g.strokeStyle = 'rgba(235,247,255,0.92)'; g.beginPath(); g.arc(cx, k.hitY, r, 0, TAU); g.stroke();
      g.lineWidth = 1.5; g.strokeStyle = 'rgba(160,205,255,0.7)'; g.beginPath(); g.arc(cx, k.hitY, r * 0.72, 0, TAU); g.stroke();
      if (!DEVICE.touch) { g.fillStyle = 'rgba(235,247,255,0.85)'; g.font = `700 ${Math.round(k.size * 0.28)}px Cinzel, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(this.keyLabel(l), cx, k.hitY + r + k.size * 0.32); }
    }
    // falling snowflakes
    for (const n of this.notes) {
      if (n.state === 'perfect' || n.state === 'good') continue;
      const y = k.hitY - ((n.rel - rel) / fall) * k.span;
      if (y < -k.size || y > k.H + k.size) continue;
      const cx = k.pad + (n.lane + 0.5) * k.laneW, s = k.size * (n.last ? 1.18 : 1);
      let a = clamp((y + k.size * 0.3) / (k.size * 0.9), 0, 1), spr = n.last ? sp.gold : sp.flake;
      if (n.state === 'miss') { spr = sp.dim; a *= Math.max(0, 0.6 - ((y - k.hitY) / (k.H - k.hitY + 1)) * 0.6); }
      g.save(); g.globalAlpha = a; g.translate(cx, y); g.rotate(rel * 0.9 + n.i); g.drawImage(spr, -s / 2, -s / 2, s, s); g.restore();
    }
    // a hit snowflake spins away in a ring of sparkles
    this.fx = this.fx.filter((f) => rel - f.born < 0.6);
    for (const f of this.fx) {
      const age = rel - f.born, cx = k.pad + (f.lane + 0.5) * k.laneW;
      if (age < 0) continue;
      if (f.kind === 'tap') {
        const u = clamp(age / 0.3, 0, 1);
        g.globalAlpha = 0.5 * (1 - u); g.strokeStyle = '#d9ecff'; g.lineWidth = 2; g.beginPath(); g.arc(cx, k.hitY, k.size * (0.5 + u * 0.3), 0, TAU); g.stroke(); g.globalAlpha = 1;
        continue;
      }
      const big = f.kind === 'perfect', u = clamp(age / 0.5, 0, 1), su = clamp(age / 0.38, 0, 1);
      g.save(); g.translate(cx, k.hitY);
      g.globalAlpha = 1 - u; g.strokeStyle = big ? (f.last ? '#ffe7a0' : '#ffffff') : '#bfe0ff'; g.lineWidth = big ? 4 : 2.5;
      g.beginPath(); g.arc(0, 0, k.size * (0.5 + u * (big ? 0.85 : 0.5)), 0, TAU); g.stroke();
      if (big) {
        g.fillStyle = f.last ? '#ffe7a0' : '#ffffff';
        for (let j = 0; j < 6; j++) { const a = (j * Math.PI) / 3 + su, d = k.size * (0.55 + u * 0.9); g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, 3 * (1 - u) + 0.5, 0, TAU); g.fill(); }
      }
      g.globalAlpha = 1 - su; g.rotate(su * (big ? 9 : 3));
      const s = k.size * (1 - su * 0.55) * (big ? 1.1 : 0.9);
      g.drawImage(f.last ? sp.gold : sp.flake, -s / 2, -s / 2, s, s);
      g.restore();
    }
    const lb = this.label;
    if (lb && rel - lb.born >= 0 && rel - lb.born < 0.7) {
      const age = rel - lb.born, pop = 1 + 0.25 * Math.max(0, 1 - age / 0.12);
      g.save(); g.globalAlpha = 1 - clamp((age - 0.4) / 0.3, 0, 1); g.translate(k.pad + (lb.lane + 0.5) * k.laneW, k.hitY - k.size * 0.95 - age * 26); g.scale(pop, pop);
      g.font = `800 ${Math.round(k.size * 0.34)}px "Nanum Myeongjo", "Gowun Batang", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 5; g.lineJoin = 'round'; g.strokeStyle = 'rgba(16,30,72,0.85)'; g.fillStyle = lb.rating === 'perfect' ? '#ffe9a8' : lb.rating === 'good' ? '#cfe8ff' : '#f2b8c6';
      g.strokeText(lb.text, 0, 0); g.fillText(lb.text, 0, 0); g.restore();
    }
    if (this.running && rel < 0) {
      const x = -rel / spb, n = Math.ceil(x - 1e-6), p = n - x;
      if (n >= 1 && n <= SNOW_CFG.countInBeats) {
        g.save(); g.translate(k.W / 2, k.H * 0.4); const sc = 1 + 0.35 * Math.pow(1 - p, 2); g.scale(sc, sc); g.globalAlpha = 0.95 * (1 - p * 0.6);
        g.font = `800 ${Math.round(k.size * 1.15)}px Cinzel, "Nanum Myeongjo", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 7; g.lineJoin = 'round'; g.strokeStyle = 'rgba(16,30,72,0.8)'; g.fillStyle = '#ffffff';
        g.strokeText(String(n), 0, 0); g.fillText(String(n), 0, 0); g.restore();
      }
    }
  },
};
