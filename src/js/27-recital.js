/* =====================================================================
   27 · RECITAL — the shared stage for the chapter IV rehearsals
   One overlay canvas, one music clock on the AudioContext (frozen while paused), input with timestamps.
   A game supplies its score, its rules, its drawing and its autoplay (for the tests); this file runs them.
   ===================================================================== */

/* extra voices for the dances, on top of Sound's bell / pluck / noise / tone and DanceMusic's pad */
const Voice = {
  castanet(t, vol = 0.16, bus) {
    const d = bus || Sound.sfx;
    for (const [dt, f] of [[0, 2900], [0.016, 3400]]) { Sound.noiseHit(t + dt, 0.035, vol, 'bandpass', f, 5, d); Sound.tone(t + dt, 1900, 1500, 0.03, vol * 0.45, 'triangle', d); }
  },
  stomp(t, vol = 0.22, bus) {
    const d = bus || Sound.sfx;
    Sound.tone(t, 150, 46, 0.18, vol, 'sine', d); Sound.noiseHit(t, 0.09, vol * 0.5, 'lowpass', 520, 0.8, d); Sound.noiseHit(t, 0.04, vol * 0.35, 'bandpass', 1300, 1.2, d);
  },
  /* a nylon-string guitar note: a bright saw through a closing low-pass */
  guit(t, f, dur, vol, bus) {
    const c = Sound.ctx; if (!c || !f) return;
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.4; lp.frequency.setValueAtTime(Math.min(7000, f * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.max(120, f * 1.3), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(lp); lp.connect(g); g.connect(bus || Sound.sfx); o.start(t); o.stop(t + dur + 0.05);
  },
  strum(t, notes, vol, bus, spread = 0.014, dur = 0.7) { notes.forEach((n, i) => this.guit(t + i * spread, noteFreq(n), dur, vol * (1 - i * 0.06), bus)); },
  dum(t, vol = 0.2, bus) { const d = bus || Sound.sfx; Sound.tone(t, 110, 62, 0.32, vol, 'sine', d); Sound.noiseHit(t, 0.05, vol * 0.25, 'lowpass', 700, 0.8, d); },
  tek(t, vol = 0.1, bus) { Sound.noiseHit(t, 0.05, vol, 'bandpass', 2600, 2.2, bus || Sound.sfx); Sound.tone(t, 820, 640, 0.04, vol * 0.4, 'triangle', bus || Sound.sfx); },
  tambo(t, vol = 0.06, bus) { const d = bus || Sound.sfx; Sound.noiseHit(t, 0.16, vol, 'highpass', 6800, 0.7, d); for (let i = 0; i < 3; i++) Sound.noiseHit(t + 0.012 * i, 0.05, vol * 0.6, 'bandpass', 8000 + i * 900, 6, d); },
  zill(t, vol = 0.05, bus) { Sound.bell(t, 2350, 1.3, vol, bus || Sound.sfx, 1.6); Sound.bell(t, 3140, 0.9, vol * 0.6, bus || Sound.sfx, 1.6); },
  wood(t, vol = 0.08, bus, hi = false) { Sound.tone(t, hi ? 1250 : 940, hi ? 1150 : 860, 0.07, vol, 'sine', bus || Sound.sfx); Sound.noiseHit(t, 0.02, vol * 0.5, 'bandpass', hi ? 2400 : 1800, 3, bus || Sound.sfx); },
  /* a double-reed voice for the coffee dance: a saw through a nasal band-pass, with a slow vibrato */
  reed(t, f, dur, vol, bus) {
    const c = Sound.ctx; if (!c || !f) return;
    const a = Math.min(0.12, dur * 0.25), rel = 0.25, g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setValueAtTime(vol, t + Math.max(a, dur - 0.06)); g.gain.linearRampToValueAtTime(0.0001, t + dur + rel);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(3200, f * 2.2); bp.Q.value = 1.6;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3600;
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 5.4; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.008, t + Math.min(0.4, dur)); vib.connect(vg); vg.connect(o.frequency);
    o.connect(bp); bp.connect(lp); lp.connect(g); g.connect(bus || Sound.sfx);
    o.start(t); vib.start(t); o.stop(t + dur + rel + 0.05); vib.stop(t + dur + rel + 0.05);
  },
  /* a bamboo-flute voice for the tea dance: sine and a breath of noise, a little chiff at the start */
  flute(t, f, dur, vol, bus) {
    const c = Sound.ctx; if (!c || !f) return;
    const g = c.createGain(), rel = 0.12;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol * 0.85, t + Math.max(0.04, dur - 0.05)); g.gain.linearRampToValueAtTime(0.0001, t + dur + rel);
    g.connect(bus || Sound.sfx);
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(g);
    const o2 = c.createOscillator(), g2 = c.createGain(); o2.type = 'triangle'; o2.frequency.value = f * 2; g2.gain.value = 0.12; o2.connect(g2); g2.connect(g);
    const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 5; vg.gain.value = f * 0.004; vib.connect(vg); vg.connect(o.frequency);
    o.start(t); o2.start(t); vib.start(t); o.stop(t + dur + rel + 0.05); o2.stop(t + dur + rel + 0.05); vib.stop(t + dur + rel + 0.05);
    Sound.noiseHit(t, 0.05, vol * 0.25, 'bandpass', Math.min(9000, f * 3), 2, bus || Sound.sfx);
  },
};

const Recital = {
  game: null, running: false, paused: false, clock: 'audio', token: 0, auto: null, cue: null, onEnd: null,
  t0: 0, spb: 0.5, perfShift: 0, perfPausedAt: 0, lastRel: -9,
  bus: null, events: [], evIdx: 0, loop: null, pumpTimer: 0,
  cv: null, g: null, W: 1, H: 1, dpr: 1,
  ptr: { id: null, type: '', down: false, inside: false, x: 0, y: 0, t: -9 },

  /* ---------- clock (seconds from the first beat, in what the player hears) ---------- */
  clockNow() { return this.clock === 'audio' ? Sound.ctx.currentTime : performance.now() / 1000 - this.perfShift; },
  latency() {
    const k = SWEET_CFG.clock; let L = k.inputOffsetSec || 0;
    if (this.clock === 'audio' && k.useOutputLatency) { const o = Sound.ctx.outputLatency; if (o > 0 && o < 0.5) L += o; }
    return L;
  },
  rel() { return this.clockNow() - this.latency() - this.t0; },
  beat(rel = this.lastRel) { return rel / this.spb; },
  eventRel(e) {
    const ts = e && e.timeStamp > 0 && e.timeStamp < 1e11 ? e.timeStamp : performance.now();
    return this.rel() - clamp((performance.now() - ts) / 1000, 0, 0.25);
  },

  /* ---------- run control ---------- */
  async start(game, cb = {}) {
    const my = ++this.token;
    this.stop(true);
    this.game = null;   // nothing is drawn or updated until the game below is prepared
    Sound.init();
    const ctx = Sound.ctx;
    if (ctx && ctx.state !== 'running') { try { await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 600))]); } catch (e) { /* stays suspended */ } }
    if (my !== this.token) return false;
    this.onEnd = cb.onEnd || null; this.cue = cb.cue || null;
    this.clock = ctx && ctx.state === 'running' ? 'audio' : 'perf';
    this.perfShift = 0;
    this.spb = 60 / game.bpm;
    this.mount();
    $('recital').className = game.id;
    this.resize();
    game.prepare(this);
    this.game = game;
    this.t0 = this.clockNow() + 0.4 + (game.countIn || 0) * this.spb;
    this.lastRel = this.rel();
    this.events = game.score(this).sort((a, b) => a.t - b.t); this.evIdx = 0;
    this.loop = game.loop ? game.loop(this) : null;
    if (this.loop) { this.loop.n = 0; this.loop.idx = 0; this.loop.stopAt = Infinity; }
    if (this.clock === 'audio') { this.bus = ctx.createGain(); this.bus.gain.value = 0.9; this.bus.connect(Sound.musicBus); }
    this.running = true; this.paused = false; this.ended = false;
    this.pump();
    clearInterval(this.pumpTimer); this.pumpTimer = setInterval(() => this.pump(), 40);
    if (G.mode === 'paused') this.pause();   // the game was paused while the audio woke up: start paused too
    return true;
  },
  /* the game has finished: the music rings out, then the chapter takes over */
  finish(result, ring = 1.6) {
    if (!this.running) return;
    this.running = false; this.ended = true;
    clearInterval(this.pumpTimer); this.pumpTimer = 0;
    const bus = this.bus, ctx = Sound.ctx; this.bus = null;
    if (bus && ctx) { bus.gain.setTargetAtTime(0, ctx.currentTime + ring, 0.35); setTimeout(() => { try { bus.disconnect(); } catch (e) { /* gone */ } }, (ring + 2) * 1000); }
    const cb = this.onEnd; this.onEnd = null;
    if (cb) cb(result);
  },
  stop(keepToken) {
    if (!keepToken) this.token++;
    clearInterval(this.pumpTimer); this.pumpTimer = 0;
    this.running = false; this.paused = false; this.onEnd = null; this.cue = null;
    if (Sound.hold) { Sound.hold = false; if (this.clock === 'audio' && Sound.ctx) Sound.ctx.resume().catch(() => {}); }
    const bus = this.bus; this.bus = null;
    if (bus && Sound.ctx) {
      const t = Sound.ctx.currentTime;
      try { bus.gain.cancelScheduledValues(t); bus.gain.setTargetAtTime(0, t, 0.05); } catch (e) { /* ignore */ }
      setTimeout(() => { try { bus.disconnect(); } catch (e) { /* gone */ } }, 400);
    }
    this.events = []; this.evIdx = 0; this.loop = null;
    this.ptr.down = false; this.ptr.id = null;
  },
  pause() {
    if (!this.running || this.paused) return;
    this.paused = true; Sound.hold = true;
    if (this.game && this.game.keys) this.game.keys = {};   // keys let go during the pause are not left "held"
    if (this.clock === 'audio') Sound.ctx.suspend().catch(() => {}); else this.perfPausedAt = performance.now() / 1000;
  },
  resume() {
    if (!this.paused) return;
    Sound.hold = false;
    if (this.clock === 'audio') Sound.ctx.resume().catch(() => {}); else this.perfShift += performance.now() / 1000 - this.perfPausedAt;
    this.paused = false;
  },

  /* ---------- music: the score, plus a repeating part for open-ended games (handed over 1.2 s ahead) ---------- */
  pump() {
    if (!this.running || this.paused || this.clock !== 'audio' || !this.bus) return;
    const c = Sound.ctx, ahead = c.currentTime + 1.2;
    while (this.evIdx < this.events.length) {
      const e = this.events[this.evIdx], at = this.t0 + e.t;
      if (at > ahead) break;
      this.evIdx++;
      if (at >= c.currentTime - 0.05) this.play(e, at);
    }
    const L = this.loop;
    if (L) {
      for (let guard = 0; guard < 400; guard++) {
        const e = L.ev[L.idx], rel = L.start + L.n * L.len + e.t;
        if (rel >= L.stopAt || this.t0 + rel > ahead) break;
        if (this.t0 + rel >= c.currentTime - 0.05) this.play(e, this.t0 + rel);
        L.last = rel;
        L.idx++; if (L.idx >= L.ev.length) { L.idx = 0; L.n++; }
      }
    }
  },
  /* stop the repeating part at the first bar line after `fromRel` (and after every note already handed to the audio clock),
     play an ending there, and return the rel time of that bar line */
  endLoop(fromRel, bar, outro) {
    const L = this.loop;
    const barRel = Math.ceil((Math.max(fromRel, L && L.last !== undefined ? L.last + 0.01 : -Infinity)) / bar - 1e-6) * bar;
    if (!L) return barRel;
    L.stopAt = barRel;
    if (outro) outro.forEach((e) => { e.t += barRel; this.events.push(e); });
    this.events.sort((a, b) => a.t - b.t); this.evIdx = 0;
    while (this.evIdx < this.events.length && this.t0 + this.events[this.evIdx].t < (Sound.ctx ? Sound.ctx.currentTime : 0) + 1.2 && this.events[this.evIdx].t < barRel) this.evIdx++;
    this.pump();
    return barRel;
  },
  play(e, at) {
    const bus = this.bus; if (!bus) return;
    switch (e.kind) {
      case 'bell': Sound.bell(at, e.f, e.dur || 1, e.vol, bus, e.bright || 1); break;
      case 'bellLow': Sound.bell(at, e.f, 0.8, e.vol, bus, 0.4); break;
      case 'pluck': Sound.pluck(at, e.f, e.dur, e.vol, bus); break;
      case 'guit': Voice.guit(at, e.f, e.dur, e.vol, bus); break;
      case 'strum': Voice.strum(at, e.notes, e.vol, bus, e.spread, e.dur); break;
      case 'castanet': Voice.castanet(at, e.vol, bus); break;
      case 'stomp': Voice.stomp(at, e.vol, bus); break;
      case 'dum': Voice.dum(at, e.vol, bus); break;
      case 'tek': Voice.tek(at, e.vol, bus); break;
      case 'tambo': Voice.tambo(at, e.vol, bus); break;
      case 'zill': Voice.zill(at, e.vol, bus); break;
      case 'wood': Voice.wood(at, e.vol, bus, e.hi); break;
      case 'reed': Voice.reed(at, e.f, e.dur, e.vol, bus); break;
      case 'flute': Voice.flute(at, e.f, e.dur, e.vol, bus); break;
      case 'pad': e.fs.forEach((f) => DanceMusic.pad(at, f, e.dur, e.vol, bus)); break;
      case 'tick': Sound.noiseHit(at, 0.05, 0.08, 'highpass', e.accent ? 3000 : 5000, 1, bus); Sound.bell(at, noteFreq(e.accent ? 'A6' : 'D6'), 0.35, 0.05, bus); break;
      case 'sparkle': Sound.noiseHit(at, 0.05, 0.03, 'highpass', 7000, 0.8, bus); Sound.bell(at, noteFreq('B6'), 0.6, 0.025, bus, 1.6); break;
    }
  },
  /* the count-in ticks before the first beat (shared by every game) */
  countInEvents(n) { const ev = []; for (let i = 0; i < n; i++) ev.push({ t: -(n - i) * this.spb, kind: 'tick', accent: i === 0 }); return ev; },
  /* melody string ("D5:1 E5:0.5 | …", beats) → events on a voice from a start time */
  melody(str, t0, kind, vol, o = {}) {
    const spb = this.spb, out = [];
    for (const e of parseSeq(str).ev) out.push({ t: t0 + e.beat * spb, kind, f: e.freqs[0], dur: Math.max(0.12, e.dur * spb * (o.legato || 0.92)), vol, bright: o.bright });
    return out;
  },

  /* ---------- per frame ---------- */
  update(dt) {
    const G0 = this.game; if (!G0) return;
    if (this.running && !this.paused) {
      const rel = this.rel(); this.lastRel = rel;
      if (this.auto && G0.auto) G0.auto(this, rel, this.auto);
      G0.update(this, rel, dt);
    }
    this.draw();
  },
  emit(kind, data) { if (this.cue) this.cue(kind, data); },

  /* ---------- input ---------- */
  mount() {
    if (this.cv) return;
    this.cv = $('rcCv'); this.g = this.cv.getContext('2d');
    const pos = (e) => { const r = this.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const on = (type, e) => {
      if (!this.running || this.paused || !this.game) return;
      const p = pos(e), P = this.ptr;
      if (type === 'down') { e.preventDefault(); try { this.cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } P.id = e.pointerId; P.down = true; P.type = e.pointerType; Sound.init(); }
      if (type === 'up' && P.id === e.pointerId) { P.down = false; P.id = null; }
      P.inside = type !== 'leave'; P.x = p.x; P.y = p.y; P.t = this.lastRel; P.type = e.pointerType || P.type;
      if (this.game.pointer) this.game.pointer(this, type, p.x, p.y, this.eventRel(e), e);
    };
    this.cv.addEventListener('pointerdown', (e) => on('down', e));
    this.cv.addEventListener('pointermove', (e) => on('move', e));
    this.cv.addEventListener('pointerup', (e) => on('up', e));
    this.cv.addEventListener('pointercancel', (e) => on('up', e));
    this.cv.addEventListener('pointerleave', (e) => on('leave', e));
    const key = (e, down) => {
      if (!this.running || this.paused || !this.game || !this.game.key) return;
      if (down && e.repeat) return;
      if (this.game.key(this, e.code, this.eventRel(e), down)) e.preventDefault();
    };
    window.addEventListener('keydown', (e) => key(e, true));
    window.addEventListener('keyup', (e) => key(e, false));
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
  },
  resize() {
    if (!this.cv) return;
    const r = this.cv.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = Math.max(1, r.width); this.H = Math.max(1, r.height);
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    this.g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.game && this.game.resize) this.game.resize(this);
  },

  /* ---------- drawing helpers shared by the games ---------- */
  draw() {
    const g = this.g, G0 = this.game; if (!g || !G0 || this.W < 4) return;
    g.clearRect(0, 0, this.W, this.H);
    G0.draw(this, g);
    if ((this.running || this.paused) && this.lastRel < 0) this.drawCount(g);
  },
  drawCount(g) {
    const x = -this.lastRel / this.spb, n = Math.ceil(x - 1e-6), p = n - x;
    if (n < 1 || n > (this.game.countIn || 0)) return;
    g.save(); g.translate(this.W / 2, this.H * 0.42); const sc = 1 + 0.35 * Math.pow(1 - p, 2); g.scale(sc, sc); g.globalAlpha = 0.95 * (1 - p * 0.6);
    const s = Math.min(this.W, this.H) * 0.2;
    g.font = `800 ${Math.round(s)}px Cinzel, "Nanum Myeongjo", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 7; g.lineJoin = 'round'; g.strokeStyle = 'rgba(40,10,24,0.85)'; g.fillStyle = '#fff6e6';
    g.strokeText(String(n), 0, 0); g.fillText(String(n), 0, 0); g.restore();
  },
  /* the rounded panel every game sits in (two colours top → bottom, a thin gold frame) */
  panel(g, top, bottom) {
    const W = this.W, H = this.H, r = Math.min(18, W * 0.04);
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, top); bg.addColorStop(1, bottom);
    g.fillStyle = bg; rr(g, 1, 1, W - 2, H - 2, r); g.fill();
    g.strokeStyle = 'rgba(241,217,152,0.75)'; g.lineWidth = 1.5; rr(g, 4.5, 4.5, W - 9, H - 9, r - 3); g.stroke();
  },
  text(g, s, x, y, size, col, o = {}) {
    g.save(); g.font = `${o.weight || 800} ${Math.round(size)}px ${o.font || '"Nanum Myeongjo", "Gowun Batang", serif'}`;
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
    if (o.alpha !== undefined) g.globalAlpha = o.alpha;
    if (o.stroke !== false) { g.lineWidth = o.lw || Math.max(3, size * 0.16); g.lineJoin = 'round'; g.strokeStyle = o.stroke || 'rgba(40,10,24,0.8)'; g.strokeText(s, x, y); }
    g.fillStyle = col; g.fillText(s, x, y); g.restore();
  },
  /* round progress dots: done (gold), failed (dim rose), current (ring) */
  dots(g, x, y, n, states, cur, r = 6) {
    const gap = r * 3.2, x0 = x - ((n - 1) * gap) / 2;
    for (let i = 0; i < n; i++) {
      const cx = x0 + i * gap, s = states[i];
      g.beginPath(); g.arc(cx, y, r, 0, TAU);
      if (s === 'ok') { g.fillStyle = '#f6d27a'; g.fill(); }
      else if (s === 'no') { g.fillStyle = 'rgba(214,120,140,0.75)'; g.fill(); }
      else { g.fillStyle = 'rgba(255,240,220,0.18)'; g.fill(); }
      g.lineWidth = i === cur ? 2.4 : 1.2; g.strokeStyle = i === cur ? '#fff3c9' : 'rgba(241,217,152,0.7)'; g.stroke();
    }
  },
};

/* leaving the page mid-rehearsal pauses the game, so the audio clock and the dance stop together */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden || G.chapter !== 4) return;
  if (Recital.running && G.mode === 'play') Story.pause();
});
