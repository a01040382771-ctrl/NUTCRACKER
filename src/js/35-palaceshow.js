/* =====================================================================
   35 · CHAPTER V GAME — act I, the Kingdom of Sweets: lead three troupes with the baton
   You move a glowing baton over the glass stage. The sleeping dancers it passes wake and follow it in a line; when the
   baton comes to a nation's pad, that nation's dancers leave the line and take their places, and when the music reaches
   their dance they dance it. Runs on the shared recital stage (27): its audio clock, pause, count-in, pointer and keys.
   ===================================================================== */
const _psV = new THREE.Vector3(), _psD = new THREE.Vector3();
const lerpAng = (a, b, k) => a + angleDiff(a, b) * k;
const P5_START = { x: 0, z: 3.0 };   // where the baton starts: just in front of the dais

/* ---------------- act I music: five sections, each in its own nation's voice ---------------- */
const P5_CH = {
  Am: ANDALUZ.Am, G: ANDALUZ.G, F: ANDALUZ.F, E: ANDALUZ.E,
  D: ['D2', 'A2', 'D3', 'F#3', 'A3'], Em: ['E2', 'B2', 'E3', 'G3', 'B3'], C: ['C3', 'G3', 'C4', 'E4', 'G4'],
};
const P5_INTRO = { ch: ['Am', 'Am', 'G', 'G', 'Am', 'Am', 'F', 'E'], mel: 'A5:1 C6:1 E6:2 | D6:1 C6:1 A5:2 | G5:1 B5:1 D6:2 | E6:2 A5:2 | C6:1 E6:1 A6:2 | G6:1 E6:1 C6:2 | D6:1 E6:1 F6:1 D6:1 | E6:4' };
const P5_SPAN = { ch: ['Am', 'Am', 'G', 'G', 'F', 'F', 'E', 'E', 'Am', 'E', 'Am'], mel: 'E5:1 A5:1 C6:1 | B5:2 A5:1 | G5:1 B5:1 D6:1 | C6:1.5 B5:0.5 G5:1 | A5:1 C6:1 F6:1 | E6:2 C6:1 | B5:1 G#5:1 E5:1 | G#5:1 B5:1 E6:1 | C6:1 B5:0.5 A5:0.5 E5:1 | D6:1 B5:1 G#5:1 | A5:3' };
const P5_ARAB = { mel: 'D5:1 Eb5:0.5 F#5:0.5 G5:2 | A5:1 G5:0.5 F#5:0.5 Eb5:2 | D5:1 Eb5:0.5 F#5:0.5 G5:1 A5:1 | Bb5:2 A5:1 G5:1 | A5:1 Bb5:0.5 A5:0.5 G5:1 F#5:1 | G5:1 A5:0.5 G5:0.5 F#5:1 Eb5:1 | D6:1 C6:0.5 Bb5:0.5 A5:2 | D5:4' };
const P5_CHIN = { mel: 'D6:0.5 E6:0.5 G6:0.5 E6:0.5 | D6:0.5 B5:0.5 A5:1 | G5:0.5 A5:0.5 B5:0.5 D6:0.5 | E6:1 D6:1 | ' +
  'E6:0.5 G6:0.5 A6:0.5 G6:0.5 | E6:0.5 D6:0.5 B5:1 | A5:0.5 B5:0.5 D6:0.5 E6:0.5 | G6:2 | ' +
  'A6:1 G6:0.5 E6:0.5 | D6:0.5 E6:0.5 G6:1 | A6:0.5 G6:0.5 E6:0.5 D6:0.5 | B5:1 A5:1 | ' +
  'D6:0.5 E6:0.5 G6:0.5 E6:0.5 | D6:0.5 B5:0.5 A5:1 | G5:1 B5:1 | G5:2' };
const P5_RING = { ch: ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'G'], mel: 'B5:1 D6:1 G6:2 | A5:1 F#5:1 D6:2 | G5:1 B5:1 E6:2 | E6:1 G6:1 C7:2 | B5:1 D6:1 G6:2 | F#6:1 A6:1 D7:2 | E6:1 D6:1 C6:1 B5:1 | G5:4' };
const P5_WAKE = ['A5', 'C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'E7'];   // each dancer woken rings the next note of an A minor pentatonic
const P5_RING_NOTES = ['G5', 'A5', 'B5', 'D6', 'E6', 'G6', 'A6', 'B6'];   // in the grand ring the baton plays a G major pentatonic, one note for each dancer it passes

const PalaceShow = {
  id: 'palace', bpm: PALACE_CFG.bpm, countIn: PALACE_CFG.act1.countIn,
  D: [], count: [0, 0, 0], gidx: [0, 0, 0], total: 0, line: [], trail: [], baton: { x: 0, z: 3, tx: 0, tz: 3, v: 0 }, keys: {}, keyboard: false,
  delivered: [0, 0, 0], padCount: [0, 0, 0], pres: [0, 0, 0], sec: 0, starts: [], endRel: 0, ringT0: 0, simRel: -9,
  done: false, res: null, R: null, banner: { text: '', at: -9 }, woken: 0, firstWake: -1, rung: 0,

  /* ---------- the stage, laid out the same way every time: each nation's dancers asleep round their own home ---------- */
  layout() {
    const T = PALACE_CFG.troupes, rnd = mulberry32(T.seed), D = [];
    this.count = T.order.map((id) => Palace.count[id] || T[id].n);
    this.gidx = this.count.map((_, k) => this.count.slice(0, k).reduce((a, b) => a + b, 0));
    this.total = this.count.reduce((a, b) => a + b, 0);
    T.order.forEach((id, ni) => {
      const U = T[id], pts = [];
      for (let tries = 0; pts.length < this.count[ni] && tries < 6000; tries++) {
        const a = rnd() * TAU, r = Math.sqrt(rnd()) * T.homeR, x = U.home[0] + Math.cos(a) * r, z = U.home[1] + Math.sin(a) * r;
        if (pts.some((p) => Math.hypot(p[0] - x, p[1] - z) < T.spacing)) continue;
        if (Math.hypot(x, z) < PALACE_CFG.stage.dais + 1 || T.order.some((o) => Math.hypot(x - T[o].pad[0], z - T[o].pad[1]) < T.padR + 0.3)) continue;
        pts.push([x, z]);
      }
      pts.forEach((p, i) => D.push({ n: ni, i, g: this.gidx[ni] + i, rs: 0, x: p[0], z: p[1], yaw: rnd() * TAU, st: 0, sp: 0, tx: 0, tz: 0, slot: -1, woke: -9, hop: -9 }));
    });
    this.D = D; this.count = T.order.map((_, ni) => D.filter((d) => d.n === ni).length);
    this.total = D.length;
    /* the grand ring takes them in turns, one of each nation, so the neighbours on it are always from different nations */
    let k = 0; for (let i = 0; i < Math.max(...this.count); i++) for (let ni = 0; ni < T.order.length; ni++) { const d = D.find((q) => q.n === ni && q.i === i); if (d) d.rs = k++; }
  },
  /* everything back to the start: dancers asleep, the baton in front of the dais, nothing delivered */
  reset() {
    this.layout();
    this.line = []; this.baton = { x: P5_START.x, z: P5_START.z, tx: P5_START.x, tz: P5_START.z, v: 0 }; this.trail = [{ x: P5_START.x, z: P5_START.z, s: 0 }];
    this.delivered = [0, 0, 0]; this.padCount = [0, 0, 0]; this.pres = [0, 0, 0]; this.sec = 0; this.woken = 0; this.firstWake = -1; this.rung = 0;
    this.done = false; this.res = null; this.keys = {}; this.banner = { text: '', at: -9 }; this.simRel = -9; this.lastRel = null;
  },
  prepare(R) {
    const A = PALACE_CFG.act1, spb = R.spb;
    this.R = R; this.reset();
    this.starts = []; let b = 0;
    A.sections.forEach((s) => { this.starts.push(b * spb); b += s.beats; });
    this.endRel = b * spb + 1.4; this.ringT0 = this.starts[4];
    this.banner = { text: `1막 · ${PALACE_CFG.acts[0].title}`, at: -this.countIn * spb };
  },
  secAt(rel) { let k = 0; for (let j = 0; j < this.starts.length; j++) if (rel >= this.starts[j]) k = j; return k; },
  meterAt(rel) { return PALACE_CFG.act1.sections[this.secAt(rel)].meter; },

  /* ---------- the music ---------- */
  score(R) {
    const spb = R.spb, S = PALACE_CFG.act1.sections, st = this.starts.length ? this.starts : S.reduce((a, s, k) => { a.push((k ? a[k - 1] + S[k - 1].beats * spb : 0)); return a; }, []);
    const ev = R.countInEvents(this.countIn), notesOf = (ch) => P5_CH[ch];
    const strum = (t, ch, vol, slice = 0, dur = 0.9) => ev.push({ t, kind: 'strum', notes: notesOf(ch).slice(slice), vol, spread: 0.014, dur });
    const bass = (t, ch, dur, vol = 0.2) => ev.push({ t, kind: 'pluck', f: noteFreq(notesOf(ch)[0]), dur, vol });
    const padOf = (t, ch, dur, vol = 0.03) => ev.push({ t, kind: 'pad', fs: notesOf(ch).slice(1, 4).map(noteFreq), dur, vol });

    /* I · the intro: bells over a slow pad, an A minor waltz-less pulse */
    { const t0 = st[0], bar = 4 * spb;
      P5_INTRO.ch.forEach((ch, b) => { const t = t0 + b * bar; padOf(t, ch, bar * 1.02); bass(t, ch, bar * 0.8, 0.16); ev.push({ t: t + spb, kind: 'tambo', vol: 0.045 }, { t: t + 3 * spb, kind: 'tambo', vol: 0.045 }); });
      ev.push(...R.melody(P5_INTRO.mel, t0, 'bell', 0.1, { bright: 1.2, legato: 0.95 }));
      ev.push({ t: t0 + 7 * bar, kind: 'sparkle' }); }
    /* II · the Spanish dance, 3/4: guitar and castanets, the stamp on every downbeat */
    { const t0 = st[1], bar = 3 * spb;
      P5_SPAN.ch.forEach((ch, b) => {
        const t = t0 + b * bar;
        strum(t, ch, 0.115); strum(t + spb, ch, 0.068, 2, 0.45); strum(t + 2 * spb, ch, 0.068, 2, 0.45); bass(t, ch, bar * 0.9);
        ev.push({ t, kind: 'stomp', vol: 0.2 }, { t: t + spb, kind: 'castanet', vol: 0.15 }, { t: t + 2 * spb, kind: 'castanet', vol: 0.15 }, { t: t + 2.5 * spb, kind: 'castanet', vol: 0.09 });
      });
      ev.push(...R.melody(P5_SPAN.mel, t0, 'guit', 0.09, { legato: 1.3 })); }
    /* III · the Arabian dance, 4/4: a drone, the doumbek and a reed */
    { const t0 = st[2], bar = 4 * spb;
      for (let b = 0; b < 8; b++) {
        const t = t0 + b * bar;
        ev.push({ t, kind: 'pad', fs: [noteFreq('D3'), noteFreq('A3')], dur: bar * 1.02, vol: 0.026 }, { t, kind: 'zill', vol: 0.05 }, { t, kind: 'pluck', f: noteFreq('D2'), dur: bar * 0.8, vol: 0.14 });
        ev.push({ t, kind: 'dum', vol: 0.2 }, { t: t + spb, kind: 'tek', vol: 0.09 }, { t: t + 1.5 * spb, kind: 'tek', vol: 0.06 }, { t: t + 2 * spb, kind: 'dum', vol: 0.16 }, { t: t + 3 * spb, kind: 'tek', vol: 0.1 }, { t: t + 3.5 * spb, kind: 'tek', vol: 0.06 });
      }
      ev.push(...R.melody(P5_ARAB.mel, t0, 'reed', 0.07, { legato: 0.98 })); }
    /* IV · the Chinese dance, 2/4: a flute over plucked fifths and wood blocks */
    { const t0 = st[3], bar = 2 * spb;
      for (let b = 0; b < 16; b++) {
        const t = t0 + b * bar, [x, y] = TEA_BASS[b % TEA_BASS.length];
        ev.push({ t, kind: 'pluck', f: noteFreq(x), dur: spb * 0.7, vol: 0.2 }, { t: t + spb, kind: 'pluck', f: noteFreq(y), dur: spb * 0.6, vol: 0.15 });
        ev.push({ t: t + spb * 0.5, kind: 'wood', vol: 0.05, hi: true }, { t: t + spb * 1.5, kind: 'wood', vol: 0.05, hi: true });
        if (b % 4 === 0) ev.push({ t, kind: 'bell', f: noteFreq('G6'), dur: 1.1, vol: 0.035 });
      }
      ev.push(...R.melody(P5_CHIN.mel, t0, 'flute', 0.075, { legato: 0.82 })); }
    /* V · the grand ring: everyone at once in G, bells on top */
    { const t0 = st[4], bar = 4 * spb;
      P5_RING.ch.forEach((ch, b) => {
        const t = t0 + b * bar;
        padOf(t, ch, bar * 1.02, 0.034); bass(t, ch, bar * 0.9, 0.22);
        strum(t, ch, 0.1); strum(t + 2 * spb, ch, 0.07, 2, 0.45);
        ev.push({ t, kind: 'dum', vol: 0.16 }, { t: t + 2 * spb, kind: 'dum', vol: 0.13 }, { t: t + spb, kind: 'castanet', vol: 0.11 }, { t: t + 3 * spb, kind: 'castanet', vol: 0.11 });
        ev.push({ t: t + 0.5 * spb, kind: 'wood', vol: 0.04, hi: true }, { t: t + 2.5 * spb, kind: 'wood', vol: 0.04, hi: true }, { t: t + spb, kind: 'tek', vol: 0.07 }, { t: t + 3 * spb, kind: 'tek', vol: 0.07 });
        if (b % 2 === 0) ev.push({ t, kind: 'zill', vol: 0.05 });
      });
      ev.push(...R.melody(P5_RING.mel, t0, 'bell', 0.1, { bright: 1.25, legato: 0.95 }));
      ev.push(...R.melody('G5:1 B5:1 D6:1 G6:1 | B5:1 D6:1 G6:1 B6:1', t0 + 6 * bar, 'flute', 0.05, { legato: 0.9 }));   // the flute rises with the last bars
      const tE = t0 + 8 * bar;
      ['G4', 'B4', 'D5', 'G5', 'B5', 'D6', 'G6'].forEach((nn, k) => ev.push({ t: tE + k * 0.07, kind: 'bell', f: noteFreq(nn), dur: 2.6, vol: 0.08, bright: 1.3 }));
      strum(tE, 'G', 0.14, 0, 1.6); for (let i = 0; i < 9; i++) ev.push({ t: tE + i * 0.06, kind: 'castanet', vol: 0.1 + i * 0.01 });
      ev.push({ t: tE, kind: 'stomp', vol: 0.3 }, { t: tE, kind: 'zill', vol: 0.07 }, { t: tE, kind: 'sparkle' }); }
    return ev;
  },

  /* ---------- the baton and the dancers: one step of the game ---------- */
  setTarget(x, z) {
    const R0 = PALACE_CFG.stage.radius - 1.4, r = Math.hypot(x, z), k = r > R0 ? R0 / r : 1;
    this.baton.tx = x * k; this.baton.tz = z * k;
  },
  /* the point of the glass floor under a pixel of the screen */
  floorAt(R, sx, sy, out) {
    _psV.set((sx / R.W) * 2 - 1, -(sy / R.H) * 2 + 1, 0.5).unproject(camera);
    _psD.copy(_psV).sub(camera.position).normalize();
    if (Math.abs(_psD.y) < 1e-4) return false;
    const t = (0.04 - camera.position.y) / _psD.y; if (t <= 0) return false;
    out.x = camera.position.x + _psD.x * t; out.z = camera.position.z + _psD.z * t; return true;
  },
  /* the baton: straight to the finger, but no faster than its top speed; the arrow keys move it by hand (every act uses this) */
  moveBaton(dt) {
    const K = PALACE_CFG.steer, B = this.baton, KS = this.keys, px = B.x, pz = B.z;
    const kx = (KS.right ? 1 : 0) - (KS.left ? 1 : 0), kz = (KS.down ? 1 : 0) - (KS.up ? 1 : 0);
    if (kx || kz) { const l = Math.hypot(kx, kz); this.setTarget(B.x + (kx / l) * K.keySpeed * dt, B.z + (kz / l) * K.keySpeed * dt); B.x = B.tx; B.z = B.tz; }
    else { const dx = B.tx - B.x, dz = B.tz - B.z, d = Math.hypot(dx, dz); if (d > 1e-4) { const s = Math.min(d, K.speed * dt); B.x += (dx / d) * s; B.z += (dz / d) * s; } }
    B.v = dt > 0 ? Math.hypot(B.x - px, B.z - pz) / dt : 0;
  },
  /* the trail the line follows: a point every 0.2 units; returns how far along it the baton has come. n followers decide how much of it is kept. */
  trailStep(n) {
    const K = PALACE_CFG.steer, B = this.baton, last = this.trail[this.trail.length - 1], dd = Math.hypot(B.x - last.x, B.z - last.z);
    if (dd >= 0.2) this.trail.push({ x: B.x, z: B.z, s: last.s + dd });
    const tail = this.trail[this.trail.length - 1], sHead = tail.s + Math.hypot(B.x - tail.x, B.z - tail.z);
    const keep = (n + 4) * K.gap + 2;
    while (this.trail.length > 2 && sHead - this.trail[1].s > keep) this.trail.shift();
    return sHead;
  },
  /* the line: each follower keeps her place a set distance back along the trail (a follower marked `free` is left alone: she is walking in by herself).
     No one moves faster than 16 units a second, so a dancer who is far from her place runs to it instead of jumping. */
  lineStep(dt, line, sHead) {
    if (!line.length) return;
    const K = PALACE_CFG.steer, B = this.baton, pts = this.trail, Ls = pts.length - 1, head = { x: B.x, z: B.z, s: sHead }, f = 1 - Math.exp(-K.follow * dt), cap = 16 * dt;
    let j = Ls;
    for (let k = 0; k < line.length; k++) {
      const s = sHead - (k + 1) * K.gap;
      while (j > 0 && pts[j].s > s) j--;
      const d = line[k]; if (d.free) continue;
      const a = pts[j], b = j < Ls ? pts[j + 1] : head, den = b.s - a.s, u = den > 1e-6 ? clamp((s - a.s) / den, 0, 1) : 0;
      let mx = (a.x + (b.x - a.x) * u - d.x) * f, mz = (a.z + (b.z - a.z) * u - d.z) * f; const m = Math.hypot(mx, mz);
      if (m > cap) { mx *= cap / m; mz *= cap / m; }
      d.sp = dt > 0 ? Math.hypot(mx, mz) / dt : 0;
      if (d.sp > 0.6) d.yaw = lerpAng(d.yaw, Math.atan2(mx, mz), 1 - Math.exp(-12 * dt));
      d.x += mx; d.z += mz;
    }
  },
  /* everybody on the grand ring, as at the end of act I (for the acts that follow it, and for tests that start in the middle) */
  toRing() {
    const K = PALACE_CFG.steer;
    for (const d of this.D) { const a = (d.rs / this.total) * TAU; d.st = 4; d.x = Math.cos(a) * K.ringR2; d.z = Math.sin(a) * K.ringR2; d.yaw = Math.atan2(-d.x, -d.z); d.sp = 0; d.hop = -9; }
    this.line = [];
  },
  chime(k, vol = 0.06) {
    const R = this.R, ctx = Sound.ctx; if (!ctx || !R || !R.bus || !R.running) return;
    Sound.bell(ctx.currentTime, noteFreq(P5_WAKE[k % P5_WAKE.length]), 0.9, vol, R.bus, 1.8);
  },
  ringNote(k, vol = 0.07) {
    const R = this.R, ctx = Sound.ctx; if (!ctx || !R || !R.bus || !R.running) return;
    Sound.bell(ctx.currentTime, noteFreq(P5_RING_NOTES[k % P5_RING_NOTES.length]), 1.1, vol, R.bus, 1.6);
  },
  sim(dt, rel = this.simRel) {
    const K = PALACE_CFG.steer, T = PALACE_CFG.troupes, B = this.baton, D = this.D, R = this.R, KS = this.keys, spb = 60 / PALACE_CFG.bpm;
    this.simRel = rel;
    const sec = rel < 0 ? 0 : this.secAt(rel);

    this.moveBaton(dt);

    const sHead = this.trailStep(this.line.length);

    /* the grand ring: everyone, wherever they are, runs to a place on it */
    if (sec === 4 && this.sec !== 4) { for (const d of D) { if (d.st === 2) { this.delivered[d.n]++; } d.st = 4; } this.line = []; }

    /* wake: the sleeping dancers the baton passes */
    if (sec < 4) for (const d of D) {
      if (d.st !== 0 || Math.hypot(d.x - B.x, d.z - B.z) >= K.wakeR) continue;
      d.st = 1; d.woke = rel; this.line.push(d); this.woken++; if (this.firstWake < 0) this.firstWake = rel;
      this.chime(this.line.length - 1); if (R) R.emit('wake', { d, k: this.line.length });
    }

    /* the grand ring is an instrument: the baton passing a dancer sets her leaping and rings her note */
    if (sec === 4) for (const d of D) {
      if (d.st !== 4 || rel - d.hop < K.playGap || Math.hypot(d.x - B.x, d.z - B.z) >= K.playR) continue;
      d.hop = rel; this.rung++; this.ringNote(d.rs); if (R) R.emit('ring', { d, k: this.rung });
    }

    this.lineStep(dt, this.line, sHead);

    /* the pads: the baton close to a pad sends that nation's dancers in from the line, one place each round the pad */
    if (sec < 4) T.order.forEach((id, ni) => {
      const U = T[id];
      if (Math.hypot(B.x - U.pad[0], B.z - U.pad[1]) >= K.padLead || !this.line.some((d) => d.n === ni)) return;
      const rest = [];
      for (const d of this.line) {
        if (d.n !== ni) { rest.push(d); continue; }
        const slot = this.padCount[ni]++, ang = Math.PI / 2 + slot * (TAU / this.count[ni]);
        d.st = 2; d.slot = slot; d.tx = U.pad[0] + Math.cos(ang) * T.ringR; d.tz = U.pad[1] + Math.sin(ang) * T.ringR;
      }
      this.line = rest;
    });

    /* arriving dancers walk to their places; the others on the ring or the pad keep still */
    for (const d of D) {
      if (d.st === 2) {
        const dx = d.tx - d.x, dz = d.tz - d.z, dist = Math.hypot(dx, dz);
        if (dist < 0.1) {
          d.x = d.tx; d.z = d.tz; d.st = 3; d.sp = 0; const U = T[T.order[d.n]]; d.yaw = Math.atan2(U.pad[0] - d.x, U.pad[1] - d.z);
          this.delivered[d.n]++; if (R) R.emit('deliver', { d, n: d.n, count: this.delivered[d.n] });
        } else { const s = Math.min(dist, K.arrive * dt); d.x += (dx / dist) * s; d.z += (dz / dist) * s; d.sp = K.arrive; d.yaw = lerpAng(d.yaw, Math.atan2(dx, dz), 1 - Math.exp(-12 * dt)); }
      } else if (d.st === 4) {
        const turns = K.ringSpin * ((rel - this.ringT0) / (4 * spb)), ang = (d.rs / this.total) * TAU + turns * TAU, tx = Math.cos(ang) * K.ringR2, tz = Math.sin(ang) * K.ringR2;
        const f = 1 - Math.exp(-2.2 * dt), mx = (tx - d.x) * f, mz = (tz - d.z) * f;
        d.sp = dt > 0 ? Math.hypot(mx, mz) / dt : 0; d.x += mx; d.z += mz;
        d.yaw = d.sp > 1.5 ? lerpAng(d.yaw, Math.atan2(mx, mz), 1 - Math.exp(-10 * dt)) : lerpAng(d.yaw, Math.atan2(-d.x, -d.z), 1 - Math.exp(-6 * dt));
      }
    }
    this.sec = sec;
  },

  /* ---------- per frame, on the recital's clock ---------- */
  update(R, rel, dt) {
    const sec = rel < 0 ? 0 : this.secAt(rel), A = PALACE_CFG.act1, T = PALACE_CFG.troupes;
    if (sec !== this.sec && rel >= 0) {
      if (sec >= 1 && sec <= 3) {   // a dance begins: remember how many of its dancers were on their pad by then
        const n = sec - 1; this.pres[n] = this.delivered[n] / this.count[n];
        this.banner = { text: `${T[T.order[n]].name} 춤 · ${T[T.order[n]].who} 무용수들`, at: rel };
      } else if (sec === 4) this.banner = { text: '대원무 · 모두 함께!', at: rel };
      R.emit('section', { sec });
    }
    /* the game runs on the music's clock, in steps of at most 0.05 s, so a slow frame never lets the baton skip over a sleeper */
    const step = this.lastRel === null || rel < this.lastRel ? dt : clamp(rel - this.lastRel, 0, 1);
    this.lastRel = rel;
    for (let left = step; left > 1e-6; left -= 0.05) this.sim(Math.min(left, 0.05), rel);
    if (!this.done && rel >= this.endRel) { this.done = true; this.res = this.result(); R.finish(this.res); }
  },
  result() {
    const st = PALACE_CFG.act1.stars, mean = (this.pres[0] + this.pres[1] + this.pres[2]) / 3, byEnd = (this.delivered[0] + this.delivered[1] + this.delivered[2]) / Math.max(1, this.total);
    const acc = 0.65 * mean + 0.35 * byEnd;
    return { delivered: this.delivered.slice(), count: this.count.slice(), total: this.total, pres: this.pres.map((v) => Math.round(v * 100)), acc: Math.round(acc * 100), stars: acc >= st[1] ? 3 : acc >= st[0] ? 2 : 1, woken: this.woken, rung: this.rung };
  },

  clearStats(res) { return [['세 나라 축제', '★'.repeat(res.stars) + '☆'.repeat(3 - res.stars)], ['깨운 무용수', `${res.woken}명`], ['제때 모인 정도', `${res.acc}%`]]; },

  /* ---------- input ---------- */
  pointer(R, type, x, y) {
    if (type !== 'down' && type !== 'move') return;
    this.keyboard = false;
    const p = { x: 0, z: 0 }; if (this.floorAt(R, x, y, p)) this.setTarget(p.x, p.z);
  },
  key(R, code, rel, down) {
    const KY = PALACE_CFG.act1.keys; let hit = false;
    for (const dir in KY) if (KY[dir].includes(code)) { this.keys[dir] = down; hit = true; }
    if (hit && down) this.keyboard = true;
    return hit;
  },
  /* test autoplay: serve the nations in order, nearest sleeper first, then to the pad; A.idle waits, A.skip leaves nations alone */
  auto(R, rel, A) {
    if (rel < (A.idle || 0)) return;
    const T = PALACE_CFG.troupes, B = this.baton;
    if (this.secAt(rel) === 4) { const a = (rel - this.ringT0) * 1.1; this.setTarget(Math.cos(a) * PALACE_CFG.steer.ringR2, Math.sin(a) * PALACE_CFG.steer.ringR2); return; }   // the grand ring: sweep round it
    for (let ni = 0; ni < 3; ni++) {
      if (A.skip && A.skip.includes(ni)) continue;
      let best = null, bd = 1e9;
      for (const d of this.D) if (d.n === ni && d.st === 0) { const dd = Math.hypot(d.x - B.x, d.z - B.z); if (dd < bd) { bd = dd; best = d; } }
      if (best) { this.setTarget(best.x, best.z); return; }
      if (this.line.some((d) => d.n === ni)) { const U = T[T.order[ni]]; this.setTarget(U.pad[0], U.pad[1]); return; }
    }
    this.setTarget(P5_START.x, P5_START.z);
  },

  /* ---------- drawing on the full-screen canvas over the stage ---------- */
  screenOf(R, x, y, z, out) { _psV.set(x, y, z).project(camera); out.x = (_psV.x * 0.5 + 0.5) * R.W; out.y = (-_psV.y * 0.5 + 0.5) * R.H; out.ok = _psV.z < 1; return out; },
  draw(R, g) {
    const rel = R.lastRel, T = PALACE_CFG.troupes, W = R.W, H = R.H, u = Math.max(14, Math.min(W, H) * 0.034), p = { x: 0, y: 0, ok: true };
    const sec = rel < 0 ? 0 : this.secAt(rel);
    /* a label above every pad: the nation, and how many of its dancers have taken their places; they fade as the grand ring begins */
    const fade = this.done ? 0 : sec === 4 ? clamp(1 - (rel - this.ringT0) / 1.2, 0, 1) : 1;
    if (fade > 0.01) T.order.forEach((id, ni) => {
      const U = T[id]; this.screenOf(R, U.pad[0], 4.5, U.pad[1], p); if (!p.ok) return;
      p.x = clamp(p.x, u * 3.1 + 4, W - u * 3.1 - 4);   // a label never runs off the side of a narrow screen
      const got = this.delivered[ni], all = this.count[ni], on = sec === ni + 1;
      g.save(); g.globalAlpha = 0.95 * fade;
      g.fillStyle = 'rgba(16,10,40,0.62)'; rr(g, p.x - u * 3.1, p.y - u * 1.35, u * 6.2, u * 2.7, u * 0.8); g.fill();
      g.lineWidth = on ? 3 : 1.6; g.strokeStyle = U.color; rr(g, p.x - u * 3.1, p.y - u * 1.35, u * 6.2, u * 2.7, u * 0.8); g.stroke();
      g.restore();
      R.text(g, U.name, p.x, p.y - u * 0.4, u * 0.95, '#fff6e6', { lw: 3, alpha: fade });
      R.text(g, on ? '공연 중!' : `${got} / ${all}`, p.x, p.y + u * 0.68, u * 0.85, on ? '#ffe9a8' : got === all ? '#c8ffe4' : U.glow, { weight: 700, lw: 3, alpha: fade });
    });
    /* the banner of the moment, and the first hint */
    const b = this.banner, k = rel - b.at;
    if (k >= 0 && k < 3.2) R.text(g, b.text, W / 2, H * 0.2, Math.max(20, Math.min(W, H) * 0.058), '#fff6e6', { alpha: clamp(Math.min(k / 0.3, (3.2 - k) / 0.8), 0, 1) });
    else if (rel < 0) R.text(g, b.text, W / 2, H * 0.2, Math.max(20, Math.min(W, H) * 0.058), '#fff6e6', { alpha: 1 });
    if (sec === 4 && this.rung === 0 && rel - this.ringT0 > 1.5 && rel - this.ringT0 < 12) {
      R.text(g, this.keyboard ? '방향키로 원 둘레를 돌아 보세요 — 종소리가 울려요' : '지휘봉으로 원 둘레를 쓸어 보세요 — 종소리가 울려요', W / 2, H * 0.84, Math.max(15, Math.min(W, H) * 0.034), '#ffffff', { alpha: clamp(Math.min((rel - this.ringT0 - 1.5) / 0.8, (12 - (rel - this.ringT0)) / 2), 0, 1) });
    }
    if (rel > -0.5 && this.woken === 0 && rel < 14) {
      const msg = this.keyboard ? '방향키 · WASD로 별빛 지휘봉을 움직여요' : DEVICE.touch ? '화면을 문질러 별빛 지휘봉을 움직여요' : '마우스를 움직여 별빛 지휘봉을 따라가요 (방향키도 돼요)';
      R.text(g, msg, W / 2, H * 0.84, Math.max(15, Math.min(W, H) * 0.034), '#ffffff', { alpha: clamp((14 - rel) / 3, 0, 1) });
    }
    if (this.done && this.res) this.card(R, g, this.res);
  },
  card(R, g, res) {
    const W = R.W, H = R.H, cw = Math.min(380, W * 0.88), ch = 226, x0 = (W - cw) / 2, y0 = H * 0.26, T = PALACE_CFG.troupes;
    g.save(); g.fillStyle = 'rgba(14,8,34,0.82)'; rr(g, x0, y0, cw, ch, 16); g.fill();
    g.strokeStyle = 'rgba(241,217,152,0.8)'; g.lineWidth = 1.5; rr(g, x0 + 4, y0 + 4, cw - 8, ch - 8, 13); g.stroke(); g.restore();
    R.text(g, `1막 끝 · ${PALACE_CFG.acts[0].title}`, W / 2, y0 + 34, 22, '#fff6e6');
    R.text(g, '★'.repeat(res.stars) + '☆'.repeat(3 - res.stars), W / 2, y0 + 76, 34, '#ffd77a');
    T.order.forEach((id, ni) => R.text(g, `${T[id].name} ${res.delivered[ni]} / ${res.count[ni]}`, x0 + cw * (0.18 + 0.32 * ni), y0 + 122, 15, T[id].glow, { weight: 700, lw: 3 }));
    R.text(g, `제때 모인 정도 ${res.acc}%`, W / 2, y0 + 160, 17, '#f3eaff', { weight: 700 });
    R.text(g, `깨운 무용수 ${res.woken}명`, W / 2, y0 + 192, 16, '#d6f0ff', { weight: 700 });
  },
};
