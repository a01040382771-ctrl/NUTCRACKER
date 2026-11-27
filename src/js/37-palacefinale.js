/* =====================================================================
   37 · CHAPTER V GAME — act III, the grand finale
   The whole company follows the baton in one long line: the Sugar Plum Fairy and the three leaders first, then the thirty dancers, the
   nations taking turns. A big star lies on the glass in dots; leading the line along its outline lights the dots, and the more of the
   star is drawn the more of the music comes in. When the star is drawn the company takes its places on it, and the star turns slowly
   round the dais while Clara and the Prince dance their pas de deux under fireworks.
   It runs on the shared recital stage (27) and moves the baton and the line the way act I does (35).
   ===================================================================== */
const P5_FIN = {
  prog: ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'G'],                                                // G major: the progression of the grand ring in act I
  low: { G: ['G2', 'D3'], D: ['D2', 'A2'], Em: ['E2', 'B2'], C: ['C3', 'G3'] },
  pad: { G: ['G3', 'B3', 'D4'], D: ['D3', 'F#3', 'A3'], Em: ['E3', 'G3', 'B3'], C: ['C3', 'E3', 'G3'] },
  up: { G: ['G4', 'B4', 'D5', 'G5'], D: ['F#4', 'A4', 'D5', 'F#5'], Em: ['E4', 'G4', 'B4', 'E5'], C: ['E4', 'G4', 'C5', 'E5'] },
  mid: { G: ['D4', 'G4', 'B4'], D: ['A3', 'D4', 'F#4'], Em: ['B3', 'E4', 'G4'], C: ['G3', 'C4', 'E4'] },
  tune: ['D6:1 B5:0.5 G5:0.5 B5:1 D6:1', 'A5:1 F#5:0.5 D5:0.5 F#5:1 A5:1', 'G5:1 B5:1 E6:2', 'E6:1 D6:0.5 C6:0.5 G5:2', 'D6:1 B5:0.5 G5:0.5 B5:1 D6:1', 'A5:1 D6:1 F#6:2', 'E6:1 G6:1 C7:2', 'B6:1 G6:1 D6:2'],
  fw: [[-9, 7, -9], [8, 8.5, -11], [0, 9, -13], [-12, 6, -4], [11, 6.5, -6], [-5, 8, -12], [5, 7, -8], [-8, 8, -7]],   // where the fireworks burst: in the part of the sky the finale camera sees
  fwCol: [['#ff9ad0', '#ffffff', '#ffd1ee'], ['#ffe08a', '#fff3c4', '#ffffff'], ['#9ad8ff', '#ffffff', '#d4f0ff'], ['#c9a0ff', '#ffd1ee', '#ffffff']],
};
const _pfT = [0, 0];

const PalaceFinale = {
  id: 'palace', bpm: PALACE_CFG.bpm, countIn: PALACE_CFG.act1.countIn, ahead: 0.6,
  geom: null, samples: [], armed: false, start: { x: 0, z: 0 }, covered: 0, cov: 0, covFinal: 0, drawn: false, drawnAt: -9, formed: false, formT: -9, layerFrom: {}, layersOn: 0, lead: [], order: [], fresh: [], tipK: [0, 0, 0, 0, 0],
  bar: 2.4, finT: Infinity, endRel: Infinity, formAt: 0, sched: false, simRel: -9, lastRel: null, done: false, res: null, R: null, banner: { text: '', at: -9 }, fwBeat: -1, objT: -9, finale: false, wp: 0, finaleSeen: false,
  get keys() { return PalaceShow.keys; }, set keys(v) { PalaceShow.keys = v; },
  meterAt() { return 4; },

  /* the star and its dots to be drawn (the stage may ask for them before the music has begun) */
  initStar() {
    const G0 = this.geom = palaceStarGeom();
    this.samples = Array.from({ length: G0.n }, (_, i) => { const p = G0.at((i * G0.per) / G0.n); return { x: p[0], z: p[1], cov: false, at: -9 }; });
  },
  prepare(R) {
    const A = PALACE_CFG.act3, S = PalaceShow, T = PALACE_CFG.troupes, spb = R.spb, b3 = A.bars;
    this.R = R; this.bar = 4 * spb;
    /* the finale begins when the star is drawn (at a bar line, in time for its music to be handed over), or when the time for drawing is up; until then it has no time */
    this.formAt = (b3.intro + b3.draw) * this.bar; this.finT = Infinity; this.endRel = Infinity; this.sched = false;
    this.initStar();
    this.armed = false; this.covered = 0; this.cov = 0; this.covFinal = 0; this.drawn = false; this.drawnAt = -9; this.formed = false; this.formT = -9; this.layerFrom = {}; this.layersOn = 0; this.fresh = [];
    this.done = false; this.res = null; this.simRel = -9; this.lastRel = null; this.fwBeat = -1; this.objT = -9; this.tipK = [0, 0, 0, 0, 0]; this.finale = false; this.wp = 0; this.finaleSeen = false;
    this.banner = { text: `3막 · ${PALACE_CFG.acts[2].title}`, at: -this.countIn * spb };
    /* the baton stays where act II left it; played alone it starts in front of the dais */
    if (!Palace.chain) S.baton = { x: 0, z: 3.2, tx: 0, tz: 3.2, v: 0 };
    else { S.baton.tx = S.baton.x; S.baton.tz = S.baton.z; S.baton.v = 0; }
    S.keys = {}; S.trail = [{ x: S.baton.x, z: S.baton.z, s: 0 }]; this.start = { x: S.baton.x, z: S.baton.z };   // (dots light only once the baton has left where it began: it begins close to a corner of the star)
    /* the company: the Sugar Plum Fairy and the three leaders, then the dancers with the nations taking turns */
    this.lead = [['fairy', 0, 0], ...T.order.map((id) => [id, T[id].pad[0], T[id].pad[1]])].map(([id, x, z]) => ({ id, x, z, yaw: 0, sp: 0, st: 6, free: false, slot: 0 }));
    for (const d of S.D) { d.st = 6; d.free = false; d.sp = 0; }
    this.order = [...this.lead, ...S.D.slice().sort((a, b) => a.rs - b.rs)];
  },

  /* ---------- the music: a base that is always there, four layers that come in as the star is drawn, a finale with everything ---------- */
  score(R) {
    const A = PALACE_CFG.act3, spb = R.spb, bar = 4 * spb, P = P5_FIN, ev = R.countInEvents(this.countIn), b3 = A.bars, nB = b3.intro + b3.draw + b3.finale, fin = (b3.intro + b3.draw) * bar;
    for (let b = 0; b < nB; b++) {
      const t = b * bar, ch = P.prog[b % 8];
      ev.push({ t, kind: 'pad', fs: P.pad[ch].map(noteFreq), dur: bar * 1.02, vol: 0.034 });
      ev.push({ t, kind: 'pluck', f: noteFreq(P.low[ch][0]), dur: bar * 0.4, vol: 0.18 }, { t: t + 2 * spb, kind: 'pluck', f: noteFreq(P.low[ch][1]), dur: spb * 1.4, vol: 0.11 });
      ev.push({ t: t + spb, kind: 'tambo', vol: 0.03 }, { t: t + 3 * spb, kind: 'tambo', vol: 0.03 });
      /* layer 1: plucked strings on the off-beats and a brighter tambourine */
      for (let k = 0; k < 4; k++) ev.push({ t: t + (k + 0.5) * spb, kind: 'pluck', f: noteFreq(P.mid[ch][k % 3]), dur: spb * 0.4, vol: 0.075, layer: 1 });
      ev.push({ t: t + spb, kind: 'tambo', vol: 0.05, layer: 1 }, { t: t + 3 * spb, kind: 'tambo', vol: 0.05, layer: 1 });
      /* layer 2: a celesta arpeggio in eighth notes */
      for (let k = 0; k < 8; k++) ev.push({ t: t + (k * spb) / 2, kind: 'bell', f: noteFreq(P.up[ch][[0, 1, 2, 3, 2, 1, 2, 3][k]]), dur: 0.55, vol: 0.04, bright: 1.2, layer: 2 });
      /* layer 3: a flute line and a sparkle at the start of every other bar */
      ev.push({ t, kind: 'flute', f: noteFreq(P.up[ch][2]), dur: spb * 1.9, vol: 0.05, layer: 3 }, { t: t + 2 * spb, kind: 'flute', f: noteFreq(P.up[ch][1]), dur: spb * 1.9, vol: 0.05, layer: 3 });
      if (b % 2 === 0) ev.push({ t, kind: 'sparkle', layer: 3 });
      /* layer 4 (the whole star): the tune on the bells over a drum, castanets and zills */
      ev.push(...R.melody(P.tune[b % 8], t, 'bell', 0.09, { bright: 1.3, legato: 0.95 }).map((e) => Object.assign(e, { layer: 4 })));
      ev.push({ t, kind: 'dum', vol: 0.13, layer: 4 }, { t: t + 2 * spb, kind: 'dum', vol: 0.1, layer: 4 }, { t: t + spb, kind: 'castanet', vol: 0.08, layer: 4 }, { t: t + 3 * spb, kind: 'castanet', vol: 0.08, layer: 4 }, { t, kind: 'zill', vol: 0.045, layer: 4 });
    }
    return ev;
  },
  /* the music of the finale, added when it is scheduled: a fanfare when the company takes its places, a flute over the pas de deux, a sparkle for every firework, the last run of bells */
  finaleEvents(R, t0) {
    const spb = R.spb, bar = 4 * spb, ev = [];
    ['G4', 'B4', 'D5', 'G5', 'B5', 'D6', 'G6'].forEach((nn, k) => ev.push({ t: t0 + k * 0.06, kind: 'bell', f: noteFreq(nn), dur: 2.2, vol: 0.09, bright: 1.3 }));
    ev.push({ t: t0, kind: 'dum', vol: 0.22 }, { t: t0, kind: 'stomp', vol: 0.26 }, { t: t0, kind: 'zill', vol: 0.08 }, { t: t0, kind: 'sparkle' });
    ev.push(...R.melody('B5:2 D6:1 G6:1 | F#6:2 D6:2 | E6:2 G6:1 B6:1 | D7:4', t0 + 8 * spb, 'flute', 0.06, { legato: 0.92 }));
    for (let k = 6; k < 22; k++) { ev.push({ t: t0 + k * spb, kind: 'sparkle' }); if (k % 2 === 0) ev.push({ t: t0 + (k + 0.5) * spb, kind: 'bell', f: noteFreq(['G6', 'B6', 'D7', 'E7'][(k / 2) % 4]), dur: 1.4, vol: 0.05, bright: 1.4 }); }
    const tE = t0 + PALACE_CFG.act3.bars.finale * bar - 2 * spb;
    ['G4', 'D5', 'G5', 'B5', 'D6', 'G6', 'B6', 'D7'].forEach((nn, k) => ev.push({ t: tE + k * 0.07, kind: 'bell', f: noteFreq(nn), dur: 2.8, vol: 0.1, bright: 1.4 }));
    ev.push({ t: tE, kind: 'dum', vol: 0.22 }, { t: tE, kind: 'zill', vol: 0.09 }, { t: tE, kind: 'sparkle' }, { t: tE + 0.3, kind: 'sparkle' }, { t: tE + 0.6, kind: 'sparkle' });
    return ev;
  },
  mute(e) {
    if (!e.layer || e.t >= this.finT - 1e-6) return false;
    const f = this.layerFrom[e.layer];
    return !(f !== undefined && e.t >= f - 1e-6);
  },

  /* ---------- one step of the game: the baton and the line, the dots of the star, then the company on the star ---------- */
  sim(dt, rel = this.simRel) {
    const A = PALACE_CFG.act3, S = PalaceShow, B = S.baton, R = this.R, bar = this.bar, G0 = this.geom;
    this.simRel = rel;
    S.moveBaton(dt);
    if (!this.formed) {
      S.lineStep(dt, this.order, S.trailStep(this.order.length));
      /* the baton lights the dots of the star it passes, once it has left the place where it began */
      if (!this.armed && Math.hypot(B.x - this.start.x, B.z - this.start.z) > 3) this.armed = true;
      for (let i = 0; this.armed && i < this.samples.length; i++) {
        const sm = this.samples[i]; if (sm.cov || Math.hypot(sm.x - B.x, sm.z - B.z) >= A.star.tol) continue;
        sm.cov = true; sm.at = rel; this.covered++; this.fresh.push(i);
      }
      this.cov = this.covered / this.samples.length;
      A.layers.forEach((need, l) => {
        if (this.cov >= need && this.layerFrom[l + 1] === undefined) { this.layerFrom[l + 1] = Math.ceil((rel + this.ahead + 0.05) / bar) * bar; this.layersOn = l + 1; if (R) R.emit('layer', { layer: l + 1 }); }
      });
      if (!this.drawn && this.cov >= A.done) {
        this.drawn = true; this.drawnAt = rel; if (R) R.emit('drawn', {});
        this.formAt = Math.min(this.formAt, Math.ceil((rel + 0.3 + this.ahead + 0.25) / bar) * bar);   // the finale starts at the next bar line there is time for
      }
      /* the finale: its music is added a little before it begins; the company takes its places on the star as it does */
      if (!this.sched && rel >= this.formAt - this.ahead - 0.4) {
        this.sched = true; this.finT = this.formAt; this.endRel = this.formAt + A.bars.finale * bar + 1.2;
        if (R) R.addEvents(this.finaleEvents(R, this.formAt));
      }
      if (this.sched && rel >= this.formAt) this.form(rel);
    } else {
      const phi = A.form.spin * (rel - this.formT), c = Math.cos(phi), s = Math.sin(phi);
      for (const e of this.order) {
        G0.at(e.slot, _pfT); const tx = _pfT[0] * c + _pfT[1] * s, tz = -_pfT[0] * s + _pfT[1] * c;
        if (e.st === 7) {
          const dx = tx - e.x, dz = tz - e.z, dist = Math.hypot(dx, dz), v = A.form.speed * (1 + 0.15 * Math.min(1, dist / 6));
          if (dist < 0.14) { e.st = 8; e.sp = 0; } else { const st = Math.min(dist, v * dt); e.x += (dx / dist) * st; e.z += (dz / dist) * st; e.sp = v; e.yaw = lerpAng(e.yaw, Math.atan2(dx, dz), 1 - Math.exp(-12 * dt)); }
        } else { e.x = tx; e.z = tz; e.sp = 0; e.yaw = lerpAng(e.yaw, Math.atan2(-e.x, -e.z), 1 - Math.exp(-5 * dt)); }
      }
    }
  },
  form(rel) {
    const G0 = this.geom, S = PalaceShow;
    this.formed = true; this.formT = rel; this.covFinal = this.cov;
    this.order.forEach((e, k) => {   // the Sugar Plum Fairy and the three leaders at four of the star's five tips, the dancers evenly round the outline between them
      e.st = 7; e.free = false;
      e.slot = k < 4 ? (k * G0.per) / 5 : ((k - 4 + 0.5) * G0.per) / S.total;
    });
    if (this.R) this.R.emit('form', {});
  },
  update(R, rel, dt) {
    const step = this.lastRel === null || rel < this.lastRel ? dt : clamp(rel - this.lastRel, 0, 1);
    this.lastRel = rel;
    for (let left = step; left > 1e-6; left -= 0.05) this.sim(Math.min(left, 0.05), rel);
    if (!this.finale && rel >= this.finT) { this.finale = true; R.emit('finale', {}); }
    if (!this.done && rel >= this.endRel) { this.done = true; this.res = this.result(); R.finish(this.res); }
  },
  result() {
    const st = PALACE_CFG.act3.stars, c = this.formed ? this.covFinal : this.cov;
    return { cov: Math.round(c * 100), stars: c >= st[1] ? 3 : c >= st[0] ? 2 : 1, layers: this.layersOn, drawn: this.drawn, company: this.order.length };
  },
  clearStats(res) { return [['대피날레', '★'.repeat(res.stars) + '☆'.repeat(3 - res.stars)], ['그린 별', `${res.cov}%`], ['함께한 무용수', `${res.company}명`]]; },

  /* ---------- input: the baton is the same as in act I ---------- */
  pointer(R, type, x, y) { PalaceShow.pointer(R, type, x, y); },
  key(R, code, rel, down) { return PalaceShow.key(R, code, rel, down); },
  /* test autoplay: to the first tip, then round the star corner by corner; A.cover stops when that share is drawn */
  auto(R, rel, A) {
    if (rel < (A.idle || 0) || this.formed) return;
    const S = PalaceShow, B = S.baton, V = this.geom.verts;
    if (A.cover !== undefined && this.cov >= A.cover) { S.setTarget(B.x, B.z); return; }
    const T0 = V[this.wp % 10];
    if (Math.hypot(T0[0] - B.x, T0[1] - B.z) < 0.5 && this.wp < 10) this.wp++;
    const T1 = V[this.wp % 10]; S.setTarget(T1[0], T1[1]);
  },

  /* ---------- what it looks like on the palace stage ---------- */
  enter(P) {
    const W = P.W, T = PALACE_CFG.troupes;
    this.initStar(); this.covered = 0; this.cov = 0; this.formed = false; this.fresh = []; this.finT = Infinity; this.lead = []; this.order = [];
    for (const id of T.order) { P.leaders[id].root.visible = true; P.blobs[id].visible = true; W.pads[id].g.visible = false; }
    P.beacons.visible = false; W.spotGroup.visible = false; W.starGroup.visible = true; W.starLevel.fill(0); W.starTips.fill(0); W.starGroup.rotation.y = 0;
    W.setAllPillars(0.5);
    P.fairy.root.visible = true; P.fairyBlob.visible = true;
  },
  /* the star's dots: lit where the baton has been, all of them once the company takes its places */
  stage(P, dt, rel, live) {
    if (!this.geom) this.initStar();
    const S = PalaceShow, A = PALACE_CFG.act3, T = PALACE_CFG.troupes, spb = 60 / PALACE_CFG.bpm, t = P.t, W = P.W, PP = P._P || (P._P = newPose({}));
    const bb = live ? rel / spb : t / spb, bp = isFinite(this.finT) ? (rel - this.finT) / spb : -99;   // bp: beats since the finale began
    /* the dancers: in the line, walking to the star, or standing on it */
    for (const d of S.D) {
      newPose(PP);
      if (d.st === 8) { const n = Math.floor(bb), f = bb - n; Step.balance(PP, f, n + d.rs, 1); }
      else if (d.sp > 0.8) walkPose(PP, t, d.i + d.n * 3); else waitPose(PP, t, d.i);
      const C = P.crowds[T.order[d.n]]; C.pose(PP, t); C.write(d.i, d.x, 0, d.z, d.yaw + PP.spin, 1);
    }
    for (const id of T.order) P.crowds[id].flush();
    /* the Sugar Plum Fairy and the three leaders */
    this.lead.forEach((e, k) => {
      const doll = k === 0 ? P.fairy : P.leaders[e.id], blob = k === 0 ? P.fairyBlob : P.blobs[e.id];
      newPose(PP);
      if (e.st === 8) { if (k === 0) PalaceSolo.solo(PP, Math.max(0, bp), t, 12, 0); else NATION_STEP[e.id](PP, Math.max(0, bp), t, k); }
      else if (e.sp > 0.8) walkPose(PP, t, k); else waitPose(PP, t, k);
      applyPose(doll, PP, t); if (doll.updateVeil) doll.updateVeil(t);
      doll.root.position.set(e.x, 0, e.z); doll.root.rotation.y = e.yaw + PP.spin; blob.position.set(e.x, 0.03, e.z);
    });
    this.pas(P, bp, t, PP);   // (after the act the clock goes on: they finish their bow and stay)

    /* the star: dots lit where the baton has been (with a spark as each one lights), the tips' columns, the turning */
    const lv = W.starLevel, n = this.samples.length;
    for (let i = 0; i < n; i++) {
      const sm = this.samples[i];
      let k = sm.cov ? Math.min(1, 0.35 + (rel - sm.at) / 0.4) : 0;
      if (this.formed) k = Math.max(k, clamp((rel - this.formT - i * 0.012) / 0.5, 0, 1));
      lv[i] = k;
    }
    for (let q = 0; q < 12 && this.fresh.length; q++) {
      const sm = this.samples[this.fresh.pop()];
      FX.add.spawn({ x: sm.x + rnd(-0.2, 0.2), y: 0.3, z: sm.z + rnd(-0.2, 0.2), vx: rnd(-0.4, 0.4), vy: rnd(0.8, 1.8), vz: rnd(-0.4, 0.4), g: 0, drag: 1.2, life: rnd(0.5, 0.9), size: rnd(0.14, 0.26), size1: 0.02, color: pick(['#fff3c4', '#ffd98a', '#ffffff']), cell: CELL.sparkle, rot: rnd(0, TAU), vr: rnd(-4, 4), flicker: 0.6 });
    }
    this.fresh.length = 0;
    const G0 = this.geom;
    for (let k = 0; k < 5; k++) {
      const c = Math.round((G0.cum[k * 2] / G0.per) * n) % n, near = [c - 1, c, c + 1].some((i) => this.samples[(i + n) % n].cov);
      this.tipK[k] += ((this.formed || near ? 1 : 0.12 * (k === 0 && this.cov < 0.02 ? 1 : 0)) - this.tipK[k]) * (1 - Math.exp(-4 * dt)); W.starTips[k] = this.tipK[k];
    }
    W.starGroup.rotation.y = this.formed ? A.form.spin * (rel - this.formT) : 0;
    W.setAllPillars(this.finale ? 1.5 : 0.45 + 0.55 * this.cov);
    /* fireworks over the pas de deux, one a beat */
    if (live && bp >= 6 && bp < 22) {
      const beat = Math.floor(bp);
      if (beat !== this.fwBeat) { this.fwBeat = beat; const q = P5_FIN.fw[beat % P5_FIN.fw.length]; burst(q[0], q[1], q[2], { n: 70, speed: 6.5, up: 0.5, g: -1.6, life: 1.6, size: 1.5, colors: P5_FIN.fwCol[beat % 4] }); }
    }
    P.drawBaton(dt, t, P.showing && !this.done && !this.formed, 1.0);
    if (live && t - this.objT > 0.2) { this.objT = t; P.refreshObjective(); UI.setStars(Math.round((this.formed ? this.covFinal : this.cov) * 100)); }
  },
  /* the pas de deux: Clara and the Prince appear on the dais in the second bar of the finale, approach, turn together, she is lifted and turns, and they bow */
  pas(P, bp, t, PP) {
    const W = P.W, show = bp >= 3, k = clamp((bp - 3) / 1.5, 0, 1), sc = Ease.outBack(k);
    clara.root.visible = show; prince.root.visible = show; P.pdBlobs.forEach((b) => { b.visible = show; });
    if (!show) return;
    const n = Math.floor(bp), f = bp - n, front = smoothstep(19.5, 20.7, bp);
    /* the pair stands across the camera's view, so that neither hides the other */
    const az = Math.atan2(camera.position.x, camera.position.z);
    let r = lerp(1.9, 0.62, smoothstep(4, 8, bp)), ang = -az + (bp < 8 ? 0 : (bp - 8) * 0.8);
    let cx = Math.cos(ang + Math.PI) * r, cz = Math.sin(ang + Math.PI) * r, px = Math.cos(ang) * r, pz = Math.sin(ang) * r;
    cx = lerp(cx, -0.55, front); cz = lerp(cz, 0, front); px = lerp(px, 0.55, front); pz = lerp(pz, 0, front);
    const lift = bp >= 16 && bp < 20 ? 0.95 * Math.sin(clamp((bp - 16) / 4, 0, 1) * Math.PI) : 0, turn = clamp((bp - 16) / 4, 0, 1);
    for (const who of [0, 1]) {   // 0 Clara, 1 the Prince
      const doll = who ? prince : clara, x = who ? px : cx, z = who ? pz : cz, y = W.daisTop + (who ? 0 : lift);
      newPose(PP);
      if (bp < 8) Step.balance(PP, f, n, who ? -1 : 1);
      else if (bp < 16) { Step.bourree(PP, t + who * 0.4, 'first'); PP.lean += 0.04; }
      else if (bp < 20) { if (who === 0) Step.pirouette(PP, turn, 'fifth'); else { setArms(PP, 'fifth', 0.9); PP.by += 0.02; } }
      else { Step.reverence(PP, Math.sin(clamp((bp - 21) / 2.5, 0, 1) * Math.PI) * 0.9); setArms(PP, 'second', 0.5); }
      applyPose(doll, PP, t);
      const toward = Math.atan2((who ? cx : px) - x, (who ? cz : pz) - z), yaw = lerpAng(toward, 0, front);
      doll.root.position.set(x, y, z); doll.root.rotation.y = yaw + PP.spin; doll.root.scale.setScalar((who ? 1.8 : 1.7) * sc);
      P.pdBlobs[who].position.set(x, W.daisTop + 0.03, z); P.pdBlobs[who].scale.setScalar(0.9 * sc);
    }
  },
  cam(P, rel) {
    const phone = P.view === 'showPhone', v = P.VIEWS[P.view], fv = P.VIEWS[phone ? 'finPhone' : 'fin'], bar = this.bar, t = P.t;
    const fin = isFinite(this.finT) ? this.finT : 1e9, k1 = smoothstep(0, 1, clamp((rel - fin) / (2 * bar), 0, 1)), kEnd = smoothstep(0, 1, clamp((rel - (fin + 5 * bar)) / bar, 0, 1));
    const pos = [lerp(v[0][0], fv[0][0], k1), lerp(v[0][1], fv[0][1], k1), lerp(v[0][2], fv[0][2], k1)], tgt = [lerp(v[1][0], fv[1][0], k1), lerp(v[1][1], fv[1][1], k1), lerp(v[1][2], fv[1][2], k1)];
    pos[0] += Math.sin(t * 0.3) * 0.3;
    const a = k1 * 0.3 * Math.sin((rel - fin) * 0.2) + 0.5 * kEnd, c = Math.cos(a), s = Math.sin(a), x = pos[0], z = pos[2];
    pos[0] = x * c + z * s; pos[2] = -x * s + z * c; pos[1] += 6 * kEnd; pos[2] += 6 * kEnd;
    Cam.set(pos, tgt);
  },
  cue(kind, d, P) {
    const W = P.W;
    if (kind === 'layer') { Sound.sfxChime(); W.ripple.t = 0; }
    else if (kind === 'drawn') { W.ripple.t = 0; burst(0, 2.2, 0, { n: 90, speed: 7, up: 3, colors: ['#fff3c4', '#ffe08a', '#ffffff', '#ffd1ee'] }); Sound.sfxChime(); P.refreshObjective(); }
    else if (kind === 'form') { W.ripple.t = 0; P.refreshObjective(); }
    else if (kind === 'finale') { W.ripple.t = 0; burst(0, 2.6, 0, { n: 120, speed: 8, up: 3.5, colors: ['#ffd1ee', '#d9c2ff', '#fff3c4', '#ffffff', '#9ad8ff'] }); Sound.sfxChime(); P.refreshObjective(); }
  },
  objective() {
    if (this.formed) return this.simRel >= this.finT ? '모두 별 위에 섰어요! 클라라와 왕자의 춤을 즐겨요' : '별이 완성됐어요! 모두 제자리로 가요';
    if (this.cov < 0.02) return '별의 맨 위 꼭짓점으로 달려가요 — 모두가 줄지어 따라와요';   // (the baton may start from any corner; the top one is the suggested start)
    return `큰 별 모양을 따라 지휘봉을 움직여요 (${Math.round(this.cov * 100)}%)`;
  },
  helpText() { return '별의 맨 위 꼭짓점에서 시작해 점선을 따라 지휘봉을 움직이면 모두가 줄지어 따라오며 별이 그려져요. 많이 그릴수록 음악이 풍성해지고, 별이 완성되면 모두 별 위에 서서 클라라와 왕자의 춤을 맞이해요.'; },

  /* ---------- drawing on the full-screen canvas ---------- */
  draw(R, g) {
    const rel = R.lastRel, W = R.W, H = R.H;
    const b = this.banner, k = rel - b.at, bs = Math.max(20, Math.min(W, H) * 0.058), hs = Math.max(15, Math.min(W, H) * 0.034);
    if (k >= 0 && k < 3.2) R.text(g, b.text, W / 2, H * 0.2, bs, '#fff6e6', { alpha: clamp(Math.min(k / 0.3, (3.2 - k) / 0.8), 0, 1) });
    else if (rel < 0) R.text(g, b.text, W / 2, H * 0.2, bs, '#fff6e6', { alpha: 1 });
    if (rel > -0.5 && this.cov < 0.02 && rel < 16) {
      const msg = PalaceShow.keyboard ? '방향키로 별의 맨 위 꼭짓점까지 간 뒤, 점선을 따라 한 바퀴 돌아요' : '별의 맨 위 꼭짓점에서 시작해 점선을 따라 한 바퀴 그려요';
      R.text(g, msg, W / 2, H * 0.8, hs, '#ffffff', { alpha: clamp(Math.min((rel - 3) / 0.8, (16 - rel) / 3), 0, 1) });
    }
    /* how much of the star is drawn */
    const bw = Math.min(W * 0.6, 360), bx = (W - bw) / 2, by = H * 0.935, c = this.formed ? this.covFinal : this.cov;
    g.save(); g.fillStyle = 'rgba(16,10,40,0.6)'; rr(g, bx - 4, by - 8, bw + 8, 16, 8); g.fill();
    g.fillStyle = '#ffd98a'; rr(g, bx, by - 5, Math.max(10, bw * c), 10, 5); g.fill();
    for (const q of PALACE_CFG.act3.layers) { g.fillStyle = c >= q ? '#fff6e6' : 'rgba(255,255,255,0.45)'; g.beginPath(); g.arc(bx + bw * q, by, 3.2, 0, TAU); g.fill(); }
    g.restore();
    if (this.done && this.res) this.card(R, g, this.res);
  },
  card(R, g, res) {
    const W = R.W, H = R.H, cw = Math.min(380, W * 0.88), ch = 226, x0 = (W - cw) / 2, y0 = H * 0.26;
    g.save(); g.fillStyle = 'rgba(14,8,34,0.82)'; rr(g, x0, y0, cw, ch, 16); g.fill();
    g.strokeStyle = 'rgba(241,217,152,0.8)'; g.lineWidth = 1.5; rr(g, x0 + 4, y0 + 4, cw - 8, ch - 8, 13); g.stroke(); g.restore();
    R.text(g, `3막 끝 · ${PALACE_CFG.acts[2].title}`, W / 2, y0 + 34, 22, '#fff6e6');
    R.text(g, '★'.repeat(res.stars) + '☆'.repeat(3 - res.stars), W / 2, y0 + 76, 34, '#ffd77a');
    R.text(g, `그린 별 ${res.cov}%`, W / 2, y0 + 128, 18, '#ffe9a8', { weight: 700, lw: 3 });
    R.text(g, `쌓인 음악 ${res.layers}겹 · 함께한 무용수 ${res.company}명`, W / 2, y0 + 168, 16, '#f3eaff', { weight: 700 });
  },
};
