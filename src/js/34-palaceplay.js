/* =====================================================================
   34 · CHAPTER V — the Sugar Plum Palace: the dream gala
   Act I, the Kingdom of Sweets, for now: the stage, the three troupes with their leaders, the baton, and the camera.
   The game itself is in 35; this file builds what is on stage and puts it where the game says. Not on the chapter map yet.
   ===================================================================== */
const LEAD_ACT = { choco: ['castanet', 'stomp', 'spin'], coffee: ['veil', 'pose', 'spin'], tea: ['pose', 'curtsy', 'spin'] };
const PALACE_WHERE = ['왼쪽', '오른쪽', '앞쪽'];   // where each nation's pad is, seen from the audience

const Palace = {
  W: null, fog: null, bg: null, loading: null, crowds: {}, leaders: {}, blobs: {}, count: {}, beacons: null, beaconPos: null, batonG: null, batonRing: null, batonStar: null,
  t: 0, view: null, saved: null, showing: false, vt: 0, lastResult: null, leadBar: [-1, -1, -1], ringLead: false,
  _P: null, _obj: '',

  /* camera framings (position, target) */
  VIEWS: {
    show: [[0, 15.5, 21.5], [0, 0.7, -1.6]],          // the game, landscape
    showPhone: [[0, 22.5, 31], [0, 0.5, -2.6]],      // the game, portrait
    wide: [[0, 12.5, 33], [0, 3.4, -9]],
    crane: [[0, 23, 17], [0, 0, 0.5]],
    low: [[7.6, 2.1, 12.6], [0, 2.7, -1]],
    top: [[0, 36, 3.5], [0, 0, 0]],
  },

  /* ---------- build the stage once, the first time the chapter opens ---------- */
  ensure() {
    if (this.W) return Promise.resolve();
    if (!this.loading) this.loading = this.buildAll();
    return this.loading;
  },
  async buildAll() {
    const L = $('screenLoading');
    L.style.transition = 'none'; L.style.opacity = '1'; L.hidden = false;
    UI.setLoading(0.1, '설탕 궁전 앞에 하늘 무대를 띄우는 중…');
    await nextFrame(); await nextFrame();
    buildPalaceTextures(); buildPalaceMaterials();
    UI.setLoading(0.4, '수정 기둥과 오로라를 세우는 중…');
    await nextFrame();
    const root = new THREE.Group(); root.name = 'palaceshow'; root.visible = false; scene.add(root);
    const W5 = buildPalaceStage(root);
    UI.setLoading(0.7, '세 나라 무용수들이 무대에 오르는 중…');
    await nextFrame();
    const T = PALACE_CFG.troupes, lite = Perf.quality === 'low' || DEVICE.lowMem, beacon = [];
    for (const id of T.order) {
      const U = T[id], n = lite ? U.lowN : U.n;
      this.count[id] = n;
      this.crowds[id] = makeCrowd(root, () => buildDoll(id, { lod: 1 }), U.n); this.crowds[id].setCount(n);
      const d = buildSweetDancer(id); d.root.position.set(U.pad[0], 0, U.pad[1]); d.root.rotation.y = Math.atan2(-U.pad[0], -U.pad[1]); d.root.visible = false; root.add(d.root);
      const b = makeBlob(0.4); b.position.set(U.pad[0], 0.03, U.pad[1]); b.visible = false; root.add(b);
      this.leaders[id] = d; this.blobs[id] = b;
      for (let i = 0; i < U.n; i++) beacon.push({ p: [0, -60, 0], c: U.glow, s: 1.15, tw: 0.5 });
    }
    this.beacons = makeGlowPoints(beacon, { cell: CELL.sparkle, boost: 1 }); this.beacons.visible = false; this.beaconPos = this.beacons.geometry.attributes.position; root.add(this.beacons);
    /* the baton: a gold star floating over a ring on the floor that shows how far its light wakes. On the pale glass a light
       ring vanishes, so the ring is solid gold on a dark plum halo, and the star has a dark rim and always faces the camera */
    const K = PALACE_CFG.steer;
    const flat = (geo, color, op, blend, y) => { const m = new THREE.Mesh(geo.rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, blending: blend, depthWrite: false, toneMapped: false })); m.position.y = y; return m; };
    const starMesh = (r, color, z, ro) => {
      const sh = new THREE.Shape();
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, rr = i % 2 ? r * 0.4 : r, x = Math.sin(a) * rr, y = Math.cos(a) * rr; if (i) sh.lineTo(x, y); else sh.moveTo(x, y); }
      sh.closePath();
      const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, depthWrite: false, toneMapped: false }));
      m.position.z = z; m.renderOrder = ro; return m;   // after the glow points (18), so the star is not washed out
    };
    const bg = new THREE.Group(); bg.visible = false;
    this.batonRing = flat(new THREE.RingGeometry(K.wakeR - 0.1, K.wakeR, 80), '#ffd35e', 0.92, THREE.NormalBlending, 0.07);
    this.batonStar = new THREE.Group(); this.batonStar.add(starMesh(0.72, '#5a2370', -0.01, 22), starMesh(0.56, '#ffe38a', 0.01, 23), starMesh(0.2, '#ffffff', 0.02, 24));
    bg.add(this.batonRing, flat(new THREE.RingGeometry(K.wakeR - 0.2, K.wakeR + 0.16, 80), '#3b1252', 0.26, THREE.NormalBlending, 0.064), flat(new THREE.CircleGeometry(K.wakeR, 56), '#fff3c4', 0.1, THREE.AdditiveBlending, 0.066),
      makeGlowPoints([{ p: [0, 1.05, 0], c: '#fff3c4', s: 2.4, tw: 0.15 }], { cell: CELL.star, boost: 0.8 }), this.batonStar);
    root.add(bg); this.batonG = bg;
    this.fog = new THREE.Fog('#481a36', 70, 175);
    this.bg = new THREE.Color('#0c0515');
    this.W = W5;
    root.updateMatrixWorld(true);
  },

  /* ---------- preview: the stage with the troupes asleep and nothing to play yet ---------- */
  async preview(act = 0, view = 'show') {
    RUN_ID++; Tasks.clear(); UI.closeDialog();
    ['screenTitle', 'screenMap', 'screenClear', 'screenPause', 'screenRehearse', 'build', 'rhythm', 'recital'].forEach((id) => UI.hide(id));
    UI.hide('hud'); UI.hide('controls'); UI.prompt(null);
    Sound.stopMusic(0.6);
    Toy.leave(); Snow.leave(); Sweet.leave();
    G.mode = 'loading'; G.locked = true;
    await this.ensure();
    World.use(5);
    this.hideCast(true);
    G.mode = 'cutscene'; G.phase = 'preview';
    this.t = 0; this.W.setPalette(act, act, 0);
    PalaceShow.reset();
    this.leadBar = [-1, -1, -1]; this.ringLead = false;
    this.setVisible(true);
    this.setView(view);
    const L = $('screenLoading');
    if (!L.hidden) { L.style.transition = 'opacity .8s ease'; L.style.opacity = '0'; setTimeout(() => { L.hidden = true; }, 820); }
    UI.fade(0, 0.8);
  },
  setVisible(on) {
    for (const id of PALACE_CFG.troupes.order) { this.crowds[id].group.visible = on; this.leaders[id].root.visible = on; this.blobs[id].visible = on; const U = PALACE_CFG.troupes[id]; this.leaders[id].root.position.set(U.pad[0], 0, U.pad[1]); this.leaders[id].root.rotation.y = Math.atan2(-U.pad[0], -U.pad[1]); }
    this.beacons.visible = on; this.batonG.visible = on;
  },
  setView(name) { if (this.VIEWS[name]) this.view = name; },

  /* the characters that live on the scene itself (not in a chapter world) are put away while the gala is on stage */
  hideCast(hide) {
    const list = [clara.root, blobs.clara, nut.root, blobs.nut, prince.root, fairyBig.root, marker];
    if (hide) { if (!this.saved) this.saved = list.map((o) => !!(o && o.visible)); list.forEach((o) => { if (o) o.visible = false; }); }
    else if (this.saved) { list.forEach((o, i) => { if (o) o.visible = this.saved[i]; }); this.saved = null; }
  },
  leave() {
    if (!this.W) return;
    if (this.showing) { Recital.stop(); UI.hide('recital'); this.showing = false; }
    this.setVisible(false);
    this.hideCast(false);
    this.view = null;
  },

  /* ---------- the game (act I) ---------- */
  async startShow() {
    await this.preview(0, innerWidth < innerHeight ? 'showPhone' : 'show');
    G.phase = 'show'; G.mode = 'play'; G.locked = true;
    $('hud').classList.remove('cine'); UI.show('hud'); UI.hide('controls'); UI.prompt(null);
    this.lastResult = null; this.showing = true;
    UI.setChapterHud('제5장', '설탕 요정의 궁전', 'i-crown', 0); UI.setStars(0);
    this._obj = ''; this.refreshObjective(0);
    UI.show('recital');
    const ok = await Recital.start(PalaceShow, { onEnd: (res) => Story.run(() => this.endShow(res)), cue: (kind, data) => this.cue(kind, data) });
    if (ok) UI.setChapterHud('제5장', '설탕 요정의 궁전', 'i-crown', PalaceShow.total);
  },
  /* what the objective box says follows what is on the stage: who is in the line and where to take them, what is left to wake */
  objective(sec) {
    const S = PalaceShow, T = PALACE_CFG.troupes, ord = T.order, name = (ni) => T[ord[ni]].name;
    if (sec >= 4) return '대원무 — 지휘봉으로 무용수들을 쓸어 종소리를 울려요!';
    const dance = sec >= 1 ? `${name(sec - 1)} 춤 공연 중 — ` : '';
    const inLine = ord.map((_, ni) => S.line.filter((q) => q.n === ni).length), lead = inLine.indexOf(Math.max(...inLine));
    if (inLine[lead] > 0) return `${dance}${name(lead)} 무용수들을 ${PALACE_WHERE[lead]} 무대로 데려가요!`;
    const todo = ord.findIndex((_, ni) => S.delivered[ni] < S.count[ni]);
    if (todo < 0) return `${dance}모두 제자리에 섰어요!`;
    return S.woken === 0 ? '화면을 문질러 지휘봉으로 무용수들을 깨워요 — 같은 나라 무대로 데려가요' : `${dance}${name(todo)} 무용수들을 지휘봉으로 깨워요`;
  },
  refreshObjective(sec = PalaceShow.sec) { const s = this.objective(sec); if (s !== this._obj) { this._obj = s; UI.setObjective(s); } },
  /* the stage answers the game */
  cue(kind, d) {
    const T = PALACE_CFG.troupes, S = PalaceShow;
    if (kind === 'wake') { const U = T[T.order[d.d.n]]; burst(d.d.x, 1.1, d.d.z, { n: 14, speed: 2.6, colors: [U.glow, '#ffffff', '#fff3c4'] }); this.refreshObjective(); }
    else if (kind === 'deliver') {
      const U = T[T.order[d.n]]; burst(d.d.x, 1.0, d.d.z, { n: 18, speed: 3.2, colors: [U.glow, '#ffffff', U.color] });
      UI.setStars(S.delivered[0] + S.delivered[1] + S.delivered[2]);
      if (d.count === S.count[d.n]) { const l = this.leaders[T.order[d.n]]; l.play('curtsy', 1.1); this.W.ripple.t = 0; }
      this.refreshObjective();
    } else if (kind === 'ring') {
      const U = T[T.order[d.d.n]]; burst(d.d.x, 1.3, d.d.z, { n: 10, speed: 2.8, up: 1.5, colors: [U.glow, '#ffffff', '#fff3c4'] });
    } else if (kind === 'section') {
      this.refreshObjective(d.sec);
      if (d.sec >= 1 && d.sec <= 3) { const U = T[T.order[d.sec - 1]]; this.W.ripple.t = 0; burst(U.pad[0], 1.4, U.pad[1], { n: 64, speed: 6, up: 2, colors: [U.glow, U.color, '#ffffff'] }); }
      else if (d.sec === 4) { this.W.ripple.t = 0; burst(0, 2.2, 0, { n: 90, speed: 7, up: 3, colors: ['#fff3c4', '#ffa0ac', '#86f0e4', '#ffe8ae', '#ffffff'] }); Sound.sfxChime(); }
    }
  },
  endShow(res) {
    this.lastResult = res;
    this.t = Recital.lastRel;   // the stage keeps dancing from where the music stopped
    G.phase = 'showEnd'; G.mode = 'cutscene';
  },
  onPause(on) { if (!this.showing || !Recital.running) return; if (on) Recital.pause(); else Recital.resume(); },
  helpText() { return '화면을 문질러(또는 마우스·방향키로) 별빛 지휘봉을 움직여요. 지휘봉이 닿는 무용수가 깨어나 줄을 서고, 자기 나라 무대 가까이 가면 줄에서 나와 자리를 잡아요. 마지막 대원무에서는 지휘봉으로 무용수들을 쓸어 종소리를 울려요.'; },

  /* ---------- per frame ---------- */
  update(dt) {
    if (!this.W) return;
    this.t += dt;
    if (this.showing) Recital.update(dt);
    const S = PalaceShow, live = this.showing && Recital.game === S && (Recital.running || Recital.paused), spb = 60 / PALACE_CFG.bpm;
    const rel = live ? Recital.lastRel : this.t; this.vt = rel;
    this.W.update(dt, this.t, rel / spb, live ? S.meterAt(rel) : 4);
    this.frame(dt, rel, live);
    this.camera(rel, live, dt);
  },
  camera(rel, live, dt = 0.016) {
    const v = this.VIEWS[this.view]; if (!v) return;
    const S = PalaceShow, T = PALACE_CFG.troupes, spb = 60 / PALACE_CFG.bpm, pos = v[0].slice(), tgt = v[1].slice();
    pos[0] += Math.sin(this.t * 0.3) * 0.3;
    /* while a nation dances the camera leans a little towards its pad (not enough to lose the rest of the stage), then eases back */
    const F = this._focus || (this._focus = { x: 0, z: 0, k: 0 }), sec = live && rel >= 0 ? S.secAt(rel) : 0, on = sec >= 1 && sec <= 3;
    if (on) { const U = T[T.order[sec - 1]]; F.x = U.pad[0]; F.z = U.pad[1]; }
    F.k += ((on ? 1 : 0) - F.k) * (1 - Math.exp(-1.6 * dt));
    const lean = this.view === 'showPhone' ? 0 : 1;   // a portrait screen has no room at the sides to lean
    tgt[0] += F.x * 0.2 * F.k * lean; tgt[2] += F.z * 0.2 * F.k * lean; pos[0] += F.x * 0.1 * F.k * lean;
    if (live && S.sec === 4) {   // the last section: the camera circles the ring and rises
      const k = smoothstep(0, 1, clamp((rel - S.ringT0) / (8 * spb), 0, 1)), a = 0.55 * k, c = Math.cos(a), s = Math.sin(a);
      const x = pos[0], z = pos[2]; pos[0] = x * c + z * s; pos[2] = -x * s + z * c; pos[1] += 3.5 * k;
    }
    Cam.set(pos, tgt);
  },
  /* the poses, the instanced dancers, the leaders, the pads, the baton */
  frame(dt, rel, live) {
    const S = PalaceShow, T = PALACE_CFG.troupes, spb = 60 / PALACE_CFG.bpm, t = this.t, sec = live ? (rel < 0 ? 0 : S.secAt(rel)) : -1;
    const P = this._P || (this._P = newPose({}));
    T.order.forEach((id, ni) => {   // pads: the nation whose dance is on glows most
      const k = !live ? 0.8 : sec === 0 ? 0.8 : sec === 4 ? 1.3 : sec === ni + 1 ? 1.6 : 0.5;
      this.W.setPadGlow(id, k);
    });
    for (const d of S.D) {
      const id = T.order[d.n], C = this.crowds[id];
      newPose(P);
      if (d.st === 0) sleepPose(P, t, d.i);
      else if (d.st === 1 || d.st === 2) { if (d.sp > 0.8) walkPose(P, t, d.i); else waitPose(P, t, d.i); }
      else if (d.st === 3) { if (live && sec > d.n && sec < 4) NATION_STEP[id](P, (rel - S.starts[d.n + 1]) / spb, t, d.i); else waitPose(P, t, d.i); }
      else NATION_STEP.ring(P, (rel - S.ringT0) / spb, t, d.rs);
      let lift = 0;
      if (d.st === 4) { const hk = (rel - d.hop) / 0.5; if (hk >= 0 && hk < 1) { const s = Math.sin(hk * Math.PI); lift = s * 0.5; setArms(P, 'fifth', s); P.by += 0.1 * s; } }   // the baton has rung her: a leap with her arms up
      C.pose(P, t); C.write(d.i, d.x, lift, d.z, d.yaw + P.spin, 1);
      const bi = d.n * 10 + d.i;
      this.beaconPos.array[bi * 3] = d.x; this.beaconPos.array[bi * 3 + 1] = d.st === 0 ? 2.0 + 0.12 * Math.sin(t * 2.4 + d.g) : -60; this.beaconPos.array[bi * 3 + 2] = d.z;
    }
    this.beaconPos.needsUpdate = true;
    for (const id of T.order) this.crowds[id].flush();
    /* the leaders: they dance their nation's dance in its section, and in the last one gather on the dais */
    T.order.forEach((id, ni) => {
      const l = this.leaders[id], U = T[id], meter = PALACE_CFG.act1.sections[ni + 1].meter;
      l.update(dt, 0, true, 0); if (l.updateVeil) l.updateVeil(t);
      if (live && sec === ni + 1) { const bar = Math.floor((rel - S.starts[ni + 1]) / (meter * spb)); if (bar !== this.leadBar[ni]) { this.leadBar[ni] = bar; l.play(LEAD_ACT[id][bar % 3], meter * spb * 0.9); } }
      if (live && sec === 4) {
        if (!this.ringLead) { l.play('spin', 2.2); }
        const a = (ni / 3) * TAU + (rel - S.ringT0) * 0.25, f = 1 - Math.exp(-2.2 * dt);
        l.root.position.x += (Math.cos(a) * 1.15 - l.root.position.x) * f; l.root.position.z += (Math.sin(a) * 1.15 - l.root.position.z) * f; l.root.position.y += (this.W.daisTop - l.root.position.y) * f;
        l.root.rotation.y = lerpAng(l.root.rotation.y, Math.atan2(Math.cos(a), Math.sin(a)), f);
      }
      this.blobs[id].position.set(l.root.position.x, 0.03 + l.root.position.y, l.root.position.z);
    });
    if (live && sec === 4) this.ringLead = true;
    /* the baton: where it is, a pulse, and a trail of sparks while it moves */
    const B = S.baton, show = this.showing && !S.done;
    this.batonG.visible = show;
    if (show) {
      this.batonG.position.set(B.x, 0, B.z);
      this.batonRing.material.opacity = 0.8 + 0.12 * Math.sin(t * 5); this.batonRing.scale.setScalar(1 + 0.04 * Math.sin(t * 7));
      this.batonStar.position.y = 1.05 + 0.09 * Math.sin(t * 4); this.batonStar.quaternion.copy(camera.quaternion); this.batonStar.rotateZ(Math.sin(t * 1.6) * 0.35);
      if (B.v > 1 && Math.random() < dt * 45) FX.add.spawn({ x: B.x + rnd(-0.3, 0.3), y: 0.5, z: B.z + rnd(-0.3, 0.3), vx: rnd(-0.5, 0.5), vy: rnd(0.4, 1.1), vz: rnd(-0.5, 0.5), g: 0, drag: 1.4, life: rnd(0.5, 0.9), size: rnd(0.16, 0.3), size1: 0.02, color: pick(['#fff3c4', '#ffd98a', '#ffffff']), cell: CELL.sparkle, rot: rnd(0, TAU), vr: rnd(-4, 4), flicker: 0.6 });
    }
  },
};
