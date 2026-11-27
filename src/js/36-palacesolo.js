/* =====================================================================
   36 · CHAPTER V GAME — act II, the Sugar Plum Fairy's solo
   All thirty dancers circle the baton like a swarm of stars. Twelve spots on the glass, one under each crystal pillar, wake one by
   one with the music. The swarm held still over a woken spot charges it; a charged spot lights its pillar, rings its note and brings
   another layer into the music, and the Sugar Plum Fairy on the dais dances what the music has become.
   It runs on the shared recital stage (27) and moves the baton the same way as act I (35).
   ===================================================================== */
const P5_SOLO = {
  prog: ['D', 'Bm', 'G', 'A'],                                                                   // D major: I vi IV V, one chord a bar
  low: { D: ['D2', 'A2'], Bm: ['B1', 'F#2'], G: ['G2', 'D3'], A: ['A2', 'E3'] },                // plucked bass: root and fifth
  pad: { D: ['D3', 'A3', 'F#4'], Bm: ['B2', 'F#3', 'D4'], G: ['G2', 'D3', 'B3'], A: ['A2', 'E3', 'C#4'] },
  up: { D: ['D5', 'F#5', 'A5', 'D6'], Bm: ['B4', 'D5', 'F#5', 'B5'], G: ['B4', 'D5', 'G5', 'B5'], A: ['A4', 'C#5', 'E5', 'A5'] },   // celesta arpeggios, flute
  mid: { D: ['A3', 'D4', 'F#4'], Bm: ['F#3', 'B3', 'D4'], G: ['D4', 'G4', 'B4'], A: ['E4', 'A4', 'C#5'] },                         // plucked strings
  tune: ['F#6:0.5 A6:0.5 D7:1 A6:0.5 F#6:0.5 D6:1', 'D6:0.5 F#6:0.5 B6:1 F#6:0.5 D6:0.5 B5:1', 'B5:0.5 D6:0.5 G6:1 D6:0.5 B5:0.5 G5:1', 'E6:0.5 A6:0.5 C#7:1 A6:0.5 E6:0.5 C#6:1'],
};

const PalaceSolo = {
  id: 'palace', bpm: PALACE_CFG.bpm, countIn: PALACE_CFG.act1.countIn, ahead: 0.6,   // the music is handed to the audio clock 0.6 s ahead, so a layer can come in soon after a spot is lit
  spots: [], lit: 0, charging: -1, chargeK: 0, layerFrom: {}, layersOn: 0, rings: [], sw: [], vk: 0, bar: 2.4, finT: 0, endRel: 0, simRel: -9, lastRel: null,
  done: false, res: null, R: null, banner: { text: '', at: -9 }, castAt: -9, castSpot: -1, fy: 0, objT: -9, finale: false,
  get keys() { return PalaceShow.keys; }, set keys(v) { PalaceShow.keys = v; },
  meterAt() { return 4; },

  prepare(R) {
    const A = PALACE_CFG.act2, S = PalaceShow, spb = R.spb;
    this.R = R; this.bar = 4 * spb;
    this.finT = (A.bars.intro + A.bars.main) * this.bar; this.endRel = (A.bars.intro + A.bars.main + A.bars.finale) * this.bar + 1.2;
    this.spots = Array.from({ length: A.spots.n }, (_, i) => {
      const a = (i / A.spots.n) * TAU + TAU / (A.spots.n * 2);
      return { i, x: Math.cos(a) * A.spots.ring, z: Math.sin(a) * A.spots.ring, awake: false, awokeAt: -9, ch: 0, lit: false, litAt: -9 };
    });
    this.lit = 0; this.charging = -1; this.chargeK = 0; this.layerFrom = {}; this.layersOn = 0; this.vk = 0; this.finale = false; this.castAt = -9; this.castSpot = -1; this.fy = 0; this.objT = -9;
    this.done = false; this.res = null; this.simRel = -9; this.lastRel = null;
    this.banner = { text: `2막 · ${PALACE_CFG.acts[1].title}`, at: -this.countIn * spb };
    /* the baton starts in front of the dais; the dancers stay where act I left them and run in to join the swarm as the music begins */
    S.baton = { x: 0, z: 4.6, tx: 0, tz: 4.6, v: 0 }; S.keys = {};
    const nR = A.swarm.rings.length; this.rings = A.swarm.rings.map(() => []);
    for (const d of S.D) { d.ring = d.rs % nR; this.rings[d.ring].push(d); d.st = 5; d.sx = d.x; d.sz = d.z; d.jk = 0; }
    this.rings.forEach((list) => list.sort((a, b) => a.rs - b.rs).forEach((d, j) => { d.a0 = (j / list.length) * TAU + d.ring * 0.6; d.j = j; }));
    this.sw = A.swarm.rings.map(() => ({ x: S.baton.x, z: S.baton.z, a: 0 }));
  },

  /* ---------- the music: a base that is always there, four layers that come in as the spots are lit, a finale with everything ---------- */
  score(R) {
    const A = PALACE_CFG.act2, spb = R.spb, bar = 4 * spb, P = P5_SOLO, ev = R.countInEvents(this.countIn), nB = A.bars.intro + A.bars.main + A.bars.finale, fin = (A.bars.intro + A.bars.main) * bar;
    for (let b = 0; b < nB; b++) {
      const t = b * bar, ch = P.prog[b % 4];
      /* the base: a soft pad, a plucked bass and a whisper of tambourine */
      ev.push({ t, kind: 'pad', fs: P.pad[ch].map(noteFreq), dur: bar * 1.02, vol: 0.03 });
      ev.push({ t, kind: 'pluck', f: noteFreq(P.low[ch][0]), dur: bar * 0.4, vol: 0.17 }, { t: t + 2 * spb, kind: 'pluck', f: noteFreq(P.low[ch][1]), dur: spb * 1.4, vol: 0.1 });
      ev.push({ t: t + spb, kind: 'tambo', vol: 0.028 }, { t: t + 3 * spb, kind: 'tambo', vol: 0.028 });
      /* layer 1: a celesta arpeggio in eighth notes */
      for (let k = 0; k < 8; k++) ev.push({ t: t + (k * spb) / 2, kind: 'bell', f: noteFreq(P.up[ch][[0, 1, 2, 3, 2, 1, 2, 3][k]]), dur: 0.55, vol: 0.04, bright: 1.2, layer: 1 });
      /* layer 2: plucked strings on the off-beats and a brighter tambourine */
      for (let k = 0; k < 4; k++) ev.push({ t: t + (k + 0.5) * spb, kind: 'pluck', f: noteFreq(P.mid[ch][k % 3]), dur: spb * 0.4, vol: 0.075, layer: 2 });
      ev.push({ t: t + spb, kind: 'tambo', vol: 0.05, layer: 2 }, { t: t + 3 * spb, kind: 'tambo', vol: 0.05, layer: 2 });
      /* layer 3: a flute line, and a sparkle at the start of every other bar */
      ev.push({ t, kind: 'flute', f: noteFreq(P.up[ch][2]), dur: spb * 1.9, vol: 0.05, layer: 3 }, { t: t + 2 * spb, kind: 'flute', f: noteFreq(P.up[ch][1]), dur: spb * 1.9, vol: 0.05, layer: 3 });
      if (b % 2 === 0) ev.push({ t, kind: 'sparkle', layer: 3 });
      /* layer 4 (all twelve): the tune on the celesta over a soft drum */
      ev.push(...R.melody(P.tune[b % 4], t, 'bell', 0.085, { bright: 1.3, legato: 0.95 }).map((e) => Object.assign(e, { layer: 4 })));
      ev.push({ t, kind: 'dum', vol: 0.11, layer: 4 }, { t: t + 2 * spb, kind: 'dum', vol: 0.09, layer: 4 });
    }
    ev.push(...R.melody(P.tune[0], bar, 'bell', 0.06, { bright: 1.2, legato: 0.95 }));   // a hint of the tune in the second bar, before anything is lit
    /* the last bar: an upward run on the bells and the final chord */
    const tE = (nB - 1) * bar;
    ['D5', 'F#5', 'A5', 'D6', 'F#6', 'A6', 'D7'].forEach((nn, k) => ev.push({ t: tE + spb * 2 + k * 0.08, kind: 'bell', f: noteFreq(nn), dur: 2.4, vol: 0.09, bright: 1.4 }));
    ev.push({ t: tE + spb * 2, kind: 'sparkle' }, { t: tE + spb * 2.4, kind: 'sparkle' }, { t: tE + spb * 2, kind: 'dum', vol: 0.16 });
    void fin;
    return ev;
  },
  /* the layers wait for the spots: a layer's notes play only from the bar line after the spot that brought it was lit */
  mute(e) {
    if (!e.layer || e.t >= this.finT - 1e-6) return false;
    const f = this.layerFrom[e.layer];
    return !(f !== undefined && e.t >= f - 1e-6);
  },
  note(i, vol = 0.1, dur = 1.5) {
    const R = this.R, ctx = Sound.ctx; if (!ctx || !R || !R.bus || !R.running) return;
    Sound.bell(ctx.currentTime, noteFreq(PALACE_CFG.act2.notes[i]), dur, vol, R.bus, 1.5);
  },

  /* ---------- one step of the game: the baton, the swarm, the spots ---------- */
  sim(dt, rel = this.simRel) {
    const A = PALACE_CFG.act2, S = PalaceShow, B = S.baton, Cc = A.charge, K = A.swarm, R = this.R, bar = this.bar;
    this.simRel = rel;
    S.moveBaton(dt);

    /* the spots wake with the music, one a bar */
    for (const sp of this.spots) {
      if (sp.awake || rel < (A.spots.first + sp.i * A.spots.every) * bar) continue;
      sp.awake = true; sp.awokeAt = rel; this.note(sp.i, 0.03, 1.0); if (R) R.emit('awake', { sp });
    }
    /* charging: the baton over a woken spot charges it, but only while the swarm is nearly still */
    let near = null, nd = A.spots.r;
    for (const sp of this.spots) { if (!sp.awake || sp.lit) continue; const d = Math.hypot(sp.x - B.x, sp.z - B.z); if (d < nd) { nd = d; near = sp; } }
    let top = 0;
    for (const sp of this.spots) {
      if (!sp.awake || sp.lit) continue;
      if (sp === near) { sp.ch = Math.min(1, sp.ch + (dt * (B.v < Cc.still ? 1 : Cc.movingK)) / Cc.time); top = Math.max(top, sp.ch); }
      else sp.ch = Math.max(0, sp.ch - dt * Cc.decay);
      if (sp.ch >= 1) this.light(sp, rel);
    }
    this.charging = near ? near.i : -1;
    this.chargeK += (top - this.chargeK) * (1 - Math.exp(-6 * dt));

    /* the swarm: three rings that turn against each other round the baton, each lagging a little more behind it, so it streams like a comet when the baton runs and gathers when it is still */
    this.vk += (clamp(B.v / PALACE_CFG.steer.speed, 0, 1) - this.vk) * (1 - Math.exp(-5 * dt));
    K.rings.forEach((rg, r) => {
      const c = this.sw[r], f = 1 - Math.exp(-rg.lag * dt);
      c.x += (B.x - c.x) * f; c.z += (B.z - c.z) * f; c.a += rg.w * (1 + 0.6 * this.vk + 0.8 * this.chargeK) * dt;
    });
    for (const d of S.D) {
      const rg = K.rings[d.ring], c = this.sw[d.ring];
      const rad = rg.r * (1 + K.stretch * this.vk) * (1 - 0.16 * this.chargeK) * (1 + 0.05 * Math.sin(d.j * 1.7 + c.a * 2));
      const ang = d.a0 + c.a, tx = c.x + Math.cos(ang) * rad, tz = c.z + Math.sin(ang) * rad;
      d.jk = clamp((rel - 0.2 - d.rs * 0.06) / K.join, 0, 1);   // they run in from the grand ring, one after another
      const e = d.jk * d.jk * (3 - 2 * d.jk), nx = d.jk < 1 ? lerp(d.sx, tx, e) : tx, nz = d.jk < 1 ? lerp(d.sz, tz, e) : tz, mx = nx - d.x, mz = nz - d.z;
      d.sp = dt > 0 ? Math.hypot(mx, mz) / dt : 0;
      if (d.sp > 0.6) d.yaw = lerpAng(d.yaw, Math.atan2(mx, mz), 1 - Math.exp(-12 * dt));
      d.x = nx; d.z = nz;
    }
  },
  light(sp, rel) {
    const A = PALACE_CFG.act2, R = this.R;
    sp.lit = true; sp.litAt = rel; sp.ch = 1; this.lit++; this.castAt = rel; this.castSpot = sp.i;
    this.note(sp.i, 0.11, 1.8);
    A.layers.forEach((need, l) => {
      if (this.lit >= need && this.layerFrom[l + 1] === undefined) { this.layerFrom[l + 1] = Math.ceil((rel + this.ahead + 0.05) / this.bar) * this.bar; this.layersOn = l + 1; if (R) R.emit('layer', { layer: l + 1 }); }
    });
    if (R) R.emit('lit', { sp, k: this.lit });
  },

  update(R, rel, dt) {
    const step = this.lastRel === null || rel < this.lastRel ? dt : clamp(rel - this.lastRel, 0, 1);
    this.lastRel = rel;
    for (let left = step; left > 1e-6; left -= 0.05) this.sim(Math.min(left, 0.05), rel);
    if (!this.finale && rel >= this.finT) { this.finale = true; R.emit('finale', {}); }
    if (!this.done && rel >= this.endRel) { this.done = true; this.res = this.result(); R.finish(this.res); }
  },
  result() {
    const st = PALACE_CFG.act2.stars, total = this.spots.length, acc = this.lit / total;
    return { lit: this.lit, total, acc: Math.round(acc * 100), stars: acc >= st[1] ? 3 : acc >= st[0] ? 2 : 1, layers: this.layersOn, swarm: PalaceShow.total };
  },
  clearStats(res) { return [['설탕 요정의 솔로', '★'.repeat(res.stars) + '☆'.repeat(3 - res.stars)], ['밝힌 수정 기둥', `${res.lit} / ${res.total}`], ['모인 별무리', `${res.swarm}명`]]; },

  /* ---------- input: the baton is the same as in act I ---------- */
  pointer(R, type, x, y) { PalaceShow.pointer(R, type, x, y); },
  key(R, code, rel, down) { return PalaceShow.key(R, code, rel, down); },
  /* test autoplay: the nearest woken spot, and stay on it until it is lit */
  auto(R, rel, A) {
    if (rel < (A.idle || 0)) return;
    const S = PalaceShow, B = S.baton; let best = null, bd = 1e9;
    if (A.only !== undefined && this.lit >= A.only) { S.setTarget(0, 4.6); return; }   // (a test that wants only some of the spots lit)
    for (const sp of this.spots) if (sp.awake && !sp.lit) { const d = Math.hypot(sp.x - B.x, sp.z - B.z); if (d < bd) { bd = d; best = sp; } }
    if (best) S.setTarget(best.x, best.z); else S.setTarget(0, 4.6);
  },

  /* ---------- what it looks like on the palace stage (the controller, 34, hands us the stage every frame) ---------- */
  enter(P) {
    const W = P.W, T = PALACE_CFG.troupes;
    for (const id of T.order) { P.leaders[id].root.visible = false; P.blobs[id].visible = false; W.pads[id].g.visible = false; }
    P.beacons.visible = false;
    W.spotGroup.visible = true; for (const sp of W.spots) { sp.aw = 0; sp.ch = 0; sp.lit = 0; }
    W.setAllPillars(0.12);
    P.fairy.root.visible = true; P.fairyBlob.visible = true; P.fairy.root.position.set(0, W.daisTop, 0); P.fairyBlob.position.set(0, W.daisTop + 0.03, 0); P.fairy.root.rotation.y = 0;
  },
  /* her solo: it grows with the music (more steps the more spots are lit), and every spot that lights makes her cast a spark towards it */
  solo(P, b, t, lit, cast) {
    const bar = Math.floor(b / 4), f = b / 4 - bar, beat = Math.floor(b), fb = b - beat, ph = ((bar % 4) + 4) % 4;
    if (b < 0) Step.float(P, t, 0.9);
    else if (lit < 3) { if (ph === 3 && f > 0.5) Step.pirouette(P, (f - 0.5) * 2, 'first'); else if (ph % 2) Step.float(P, t, 0.9); else Step.balance(P, fb, beat, 1); }
    else if (lit < 8) { if (ph === 1 && f > 0.5) Step.arabesque(P, Math.sin((f - 0.5) * 2 * Math.PI)); else if (ph === 3 && f > 0.5) Step.pirouette(P, (f - 0.5) * 2, 'fifth'); else Step.balance(P, fb, beat, 1); }
    else if (ph === 0 && f > 0.5) Step.jete(P, (f - 0.5) * 2);
    else if (ph === 1) Step.pirouette(P, f, 'fifth');
    else if (ph === 2 && f > 0.5) Step.arabesque(P, Math.sin((f - 0.5) * 2 * Math.PI));
    else if (ph === 3) Step.pirouette(P, clamp(f * 1.6, 0, 1), 'fifth');
    else Step.balance(P, fb, beat, 1);
    if (cast > 0) { setArms(P, 'upR', cast); P.by += 0.05 * cast; P.twist += 0.3 * cast; }
  },
  stage(P, dt, rel, live) {
    const S = PalaceShow, A = PALACE_CFG.act2, T = PALACE_CFG.troupes, spb = 60 / PALACE_CFG.bpm, t = P.t, W = P.W, PP = P._P || (P._P = newPose({}));
    /* the swarm */
    for (const d of S.D) {
      newPose(PP);
      if (d.sp > 0.8) { walkPose(PP, t, d.i + d.n * 3); PP.roll += 0.1 * (d.ring % 2 ? -1 : 1); } else waitPose(PP, t, d.i);
      const C = P.crowds[T.order[d.n]]; C.pose(PP, t); C.write(d.i, d.x, 0, d.z, d.yaw + PP.spin, 1);
    }
    for (const id of T.order) P.crowds[id].flush();
    /* the Sugar Plum Fairy, turning towards the spot she last cast a spark at, otherwise towards the audience */
    const F = P.fairy, cast = live && rel >= this.castAt ? clamp(1 - (rel - this.castAt) / 0.9, 0, 1) : 0, sp = this.castSpot >= 0 ? this.spots[this.castSpot] : null;
    newPose(PP); this.solo(PP, live ? rel / spb : t / spb, t, this.lit, cast); applyPose(F, PP, t);
    const want = sp && cast > 0 ? Math.atan2(sp.x, sp.z) : 0;
    this.fy = lerpAng(this.fy, want, 1 - Math.exp(-5 * dt)); F.root.rotation.y = this.fy + PP.spin;
    /* the spots and the pillars */
    this.spots.forEach((s, i) => {
      const w = W.spots[i];
      w.aw += ((s.awake ? 1 : 0) - w.aw) * (1 - Math.exp(-8 * dt)); w.ch = s.ch; w.lit += ((s.lit ? 1 : 0) - w.lit) * (1 - Math.exp(-5 * dt));
      W.setPillar(i, s.lit ? Math.max(1, 1 + 0.55 * Math.exp(-(rel - s.litAt) * 1.6)) + (this.finale ? 0.35 : 0) : s.awake ? 0.22 + 0.2 * s.ch : 0.12);
    });
    /* sparks rise from the spot that is charging */
    if (this.charging >= 0 && Math.random() < dt * 40 * (0.3 + this.chargeK)) {
      const c = this.spots[this.charging], col = '#' + W.spots[c.i].color.getHexString();
      FX.add.spawn({ x: c.x + rnd(-1.6, 1.6), y: 0.2, z: c.z + rnd(-1.6, 1.6), vx: 0, vy: rnd(1.4, 3.2), vz: 0, g: 0, drag: 0.8, life: rnd(0.7, 1.2), size: rnd(0.16, 0.3), size1: 0.02, color: col, cell: CELL.sparkle, rot: rnd(0, TAU), vr: rnd(-4, 4), flicker: 0.6 });
    }
    P.drawBaton(dt, t, P.showing && !this.done, A.spots.r);
    if (live && t - this.objT > 0.2) { this.objT = t; P.refreshObjective(); }
  },
  cam(P, rel, live) {
    const v = P.VIEWS[P.view]; if (!v) return;
    const spb = 60 / PALACE_CFG.bpm, pos = v[0].slice(), tgt = v[1].slice(), t = P.t;
    const k = smoothstep(0, 1, clamp((rel - this.finT) / (3 * 4 * spb), 0, 1));   // the finale: the camera circles the stage and rises (and stays there while the card shows)
    pos[0] += Math.sin(t * 0.3) * 0.3;
    const a = 0.1 * Math.sin(t * 0.17) + 0.6 * k, c = Math.cos(a), s = Math.sin(a), x = pos[0], z = pos[2];
    pos[0] = x * c + z * s; pos[2] = -x * s + z * c; pos[1] += 4 * k;
    Cam.set(pos, tgt);
  },
  cue(kind, d, P) {
    const W = P.W;
    if (kind === 'awake') { const col = '#' + W.spots[d.sp.i].color.getHexString(); burst(d.sp.x, 0.8, d.sp.z, { n: 12, speed: 2.2, up: 1.5, colors: ['#ffffff', col] }); }
    else if (kind === 'lit') {
      const col = '#' + W.spots[d.sp.i].color.getHexString();
      burst(d.sp.x, 1.0, d.sp.z, { n: 44, speed: 5, up: 3, colors: [col, '#ffffff', '#fff3c4'] });
      W.ripple.t = 0; UI.setStars(this.lit); P.refreshObjective();
    } else if (kind === 'layer') { Sound.sfxChime(); W.ripple.t = 0; }
    else if (kind === 'finale') { burst(0, 2.4, 0, { n: 100, speed: 7.5, up: 3.5, colors: ['#ffd1ee', '#d9c2ff', '#fff3c4', '#ffffff'] }); Sound.sfxChime(); P.refreshObjective(); }
  },
  objective() {
    const n = this.spots.length;
    if (this.simRel >= this.finT) return this.lit >= n ? '설탕 요정의 솔로 완성! 별무리가 하늘을 수놓아요' : '솔로의 피날레 — 마지막 별빛까지 모아 보세요!';
    if (!this.spots.some((s) => s.awake)) return '별무리가 지휘봉 둘레로 모여들어요';
    if (this.charging >= 0) return `별빛이 모이는 중… 가만히 멈춰 있어요 (${this.lit}/${n})`;
    if (this.spots.some((s) => s.awake && !s.lit)) return `깨어난 별빛 자리에 별무리를 멈춰 세워요 (${this.lit}/${n})`;
    return `다음 별빛이 깨어나길 기다려요 (${this.lit}/${n})`;
  },
  helpText() { return '별무리는 지휘봉을 따라 돌아요. 깨어난 별빛 자리 위에 지휘봉을 가만히 멈추면 별빛이 모여 수정 기둥이 밝아져요. 많이 밝힐수록 음악이 풍성해지고 설탕 요정의 춤도 화려해져요.'; },

  /* ---------- drawing on the full-screen canvas ---------- */
  draw(R, g) {
    const rel = R.lastRel, W = R.W, H = R.H, n = this.spots.length;
    const b = this.banner, k = rel - b.at, bs = Math.max(20, Math.min(W, H) * 0.058), hs = Math.max(15, Math.min(W, H) * 0.034);
    if (k >= 0 && k < 3.2) R.text(g, b.text, W / 2, H * 0.2, bs, '#fff6e6', { alpha: clamp(Math.min(k / 0.3, (3.2 - k) / 0.8), 0, 1) });
    else if (rel < 0) R.text(g, b.text, W / 2, H * 0.2, bs, '#fff6e6', { alpha: 1 });
    if (rel > -0.5 && this.lit === 0 && rel < 16) {
      const msg = PalaceShow.keyboard ? '깨어난 별빛 자리 위에서 방향키를 놓고 가만히 멈춰요' : DEVICE.touch ? '깨어난 별빛 자리 위에 손가락을 멈추고 기다려요' : '깨어난 별빛 자리 위에 마우스를 멈추고 기다려요';
      R.text(g, msg, W / 2, H * 0.78, hs, '#ffffff', { alpha: clamp(Math.min((rel - 4.4) / 0.8, (16 - rel) / 3), 0, 1) });
    }
    /* a row of twelve gems at the bottom: dark, woken, lit */
    const gap = Math.min(W / (n + 2), 34), x0 = W / 2 - (gap * (n - 1)) / 2, y = H * 0.925, rad = gap * 0.3;
    this.spots.forEach((s, i) => {
      const col = '#' + Palace.W.spots[i].color.getHexString(), x = x0 + i * gap, pl = 0.75 + 0.25 * Math.sin(rel * 6 + i);
      g.save();
      g.beginPath(); g.arc(x, y, rad + 2.5, 0, TAU); g.fillStyle = 'rgba(16,10,40,0.6)'; g.fill();
      g.beginPath(); g.arc(x, y, rad, 0, TAU);
      if (s.lit) { g.fillStyle = col; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#fff6e6'; g.stroke(); }
      else if (s.awake) { g.globalAlpha = pl; g.lineWidth = 2; g.strokeStyle = col; g.stroke(); if (s.ch > 0) { g.beginPath(); g.arc(x, y, rad * s.ch, 0, TAU); g.fillStyle = col; g.fill(); } }
      else { g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,0.28)'; g.stroke(); }
      g.restore();
    });
    if (this.done && this.res) this.card(R, g, this.res);
  },
  card(R, g, res) {
    const W = R.W, H = R.H, cw = Math.min(380, W * 0.88), ch = 226, x0 = (W - cw) / 2, y0 = H * 0.26;
    g.save(); g.fillStyle = 'rgba(14,8,34,0.82)'; rr(g, x0, y0, cw, ch, 16); g.fill();
    g.strokeStyle = 'rgba(241,217,152,0.8)'; g.lineWidth = 1.5; rr(g, x0 + 4, y0 + 4, cw - 8, ch - 8, 13); g.stroke(); g.restore();
    R.text(g, `2막 끝 · ${PALACE_CFG.acts[1].title}`, W / 2, y0 + 34, 22, '#fff6e6');
    R.text(g, '★'.repeat(res.stars) + '☆'.repeat(3 - res.stars), W / 2, y0 + 76, 34, '#ffd77a');
    R.text(g, `밝힌 수정 기둥 ${res.lit} / ${res.total}`, W / 2, y0 + 128, 18, '#ffd1ee', { weight: 700, lw: 3 });
    R.text(g, `쌓인 음악 ${res.layers}겹 · 별무리 ${res.swarm}명`, W / 2, y0 + 168, 16, '#f3eaff', { weight: 700 });
  },
};
