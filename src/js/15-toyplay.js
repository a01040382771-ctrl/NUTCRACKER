/* =====================================================================
   15 · CHAPTER II — find the palace pieces, work the toys, sneak past mice
   ===================================================================== */
const CAM2 = { fx: 1, kx: 1, clamp: 1e9, look: 1.1, up: 6.3, back: 10.2, ahead: 1.8 };
const TG = { tier: 1, found: {}, placed: {}, caught: 0, gift: false, crane: 0, winds: 0, boxOpen: false, buildTut: true, lastProgress: 0, gateMark: -1, gateMarkT: 0, seen: {} };
const ZONE_NAMES = ['', '광장', '기차 마을', '회전목마 광장', '오르골 정원'];
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1); return w + (c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? a : b); };
const TIER_DONE = [
  '',
  '딸깍, 딸깍! 기단과 계단, 정문이 제자리를 찾자 광장에 맑은 종소리가 울려 퍼졌어요.',
  '양쪽 날개와 기둥 회랑이 맞춰지자, 왕궁이 제법 왕궁다운 모습을 갖추었어요.',
  '두 탑과 아치 발코니가 올라서자, 탑 꼭대기의 깃발이 신나게 펄럭였어요.',
];
const GATE_LINES = [
  '',
  '서쪽 기차 마을로 가는 문이 열렸어요! 날개 두 개와 기둥 회랑이 그곳 어딘가에 있대요.',
  '이번엔 동쪽 회전목마 광장이에요. 생쥐 보초들이 진지를 지키고 있으니 등불에 들키지 않게 조심해요!',
  '남쪽 오르골 정원이 열렸어요. 거대한 오르골의 태엽을 감으면 무슨 일이 일어날지 몰라요.',
];
const GUARD_LINES = [
  '충성! 왕궁 조각을 찾으면 이 설계도 받침대로 가져오십시오. 조각은 설계도에 그려진 자리와 방향에 꼭 맞춰야 합니다!',
  '기차 마을의 크레인은 레버 하나로 움직입니다. 그리고 꼬마 기차는 역에서 잠깐씩 쉬어 갑니다!',
  '생쥐 보초의 등불은 앞쪽만 비춥니다. 보초가 등을 돌렸을 때 살금살금 지나가십시오!',
  '오르골의 태엽은 세 번은 감아야 뚜껑이 열린다고 들었습니다!',
  '왕궁이 다시 빛나다니… 정말 감격스럽습니다, 클라라 아가씨!',
];
const POLKA_MEL =
  'G5:0.5 B5:0.5 D6:0.5 B5:0.5 | C6:0.5 A5:0.5 F#5:1 | G5:0.5 B5:0.5 D6:0.5 G6:0.5 | F#6:1 D6:1 |' +
  'E6:0.5 C6:0.5 A5:0.5 C6:0.5 | D6:0.5 B5:0.5 G5:1 | A5:0.5 F#5:0.5 D5:0.5 F#5:0.5 | G5:1 r:1 |' +
  'E6:0.5 D6:0.5 C6:0.5 B5:0.5 | A5:0.5 B5:0.5 C6:1 | D6:0.5 C6:0.5 B5:0.5 A5:0.5 | G5:0.5 A5:0.5 B5:1 |' +
  'C6:0.5 E6:0.5 D6:0.5 B5:0.5 | A5:0.5 C6:0.5 B5:0.5 G5:0.5 | F#5:0.5 A5:0.5 D6:0.5 C6:0.5 | B5:1 G5:1';
const POLKA_CHORDS = ['G', 'D7', 'G', 'D', 'C', 'G', 'D7', 'G', 'C', 'Am', 'D', 'G', 'C', 'Am', 'D7', 'G'];
const WIND_PHRASES = ['G5:0.5 B5:0.5 D6:1', 'A5:0.5 C6:0.5 E6:1', 'B5:0.5 D6:0.5 G6:1.5'];

/* toy-kingdom sounds and a little polka, added to the shared orchestra */
Object.assign(Sound, {
  buildToyTracks() {
    if (this.tracks.toys) return;
    const mel = parseSeq(POLKA_MEL), ev = [];
    mel.ev.forEach((e) => ev.push({ beat: e.beat, kind: 'bell', f: e.freqs[0], dur: Math.min(0.6, e.dur), vol: 0.16 }));
    POLKA_CHORDS.forEach((ch, bar) => {
      const [b, up] = CHORD[ch]; const b0 = bar * 2;
      ev.push({ beat: b0, kind: 'pluck', f: noteFreq(b), dur: 0.35, vol: 0.27 });
      ev.push({ beat: b0 + 1, kind: 'pluck', f: noteFreq(b) * 1.5, dur: 0.3, vol: 0.2 });
      for (const off of [0.5, 1.5]) up.split('+').forEach((n) => ev.push({ beat: b0 + off, kind: 'pluck', f: noteFreq(n), dur: 0.22, vol: 0.075 }));
      ev.push({ beat: b0 + 0.5, kind: 'tick', vol: 0.045 }); ev.push({ beat: b0 + 1.5, kind: 'tick', vol: 0.045 });
    });
    this.tracks.toys = { bpm: 126, len: mel.len, ev: ev.sort((a, b) => a.beat - b.beat) };
  },
  sfxSnap() { if (!this.ctx) return; const t = this.now; this.noiseHit(t, 0.05, 0.16, 'bandpass', 2600, 4); this.tone(t, 320, 120, 0.12, 0.16, 'triangle'); ['E6', 'B6'].forEach((n, i) => this.bell(t + 0.06 + i * 0.07, noteFreq(n), 1.1, 0.09, this.sfx, 1.3)); },
  sfxBonk() { if (!this.ctx) return; const t = this.now; this.tone(t, 240, 95, 0.22, 0.16, 'triangle'); this.noiseHit(t, 0.1, 0.06, 'lowpass', 700, 0.7); },
  sfxRotate() { if (!this.ctx) return; const t = this.now; for (const d of [0, 0.06]) this.noiseHit(t + d, 0.03, 0.07, 'highpass', 4600, 1.2); this.bell(t + 0.08, noteFreq('A6'), 0.4, 0.03); },
  sfxGate() { if (!this.ctx) return; const t = this.now; this.tone(t, 150, 110, 0.9, 0.05, 'sawtooth'); this.noiseHit(t, 0.9, 0.05, 'bandpass', 600, 2, this.sfx, 300); ['C5', 'G5', 'C6', 'E6'].forEach((n, i) => this.bell(t + 0.5 + i * 0.1, noteFreq(n), 1.8, 0.08, this.sfx, 1.2)); },
  sfxPiano(note) { if (!this.ctx) return; const t = this.now, f = noteFreq(note); this.bell(t, f, 1.5, 0.15, this.sfx, 0.55); this.pluck(t, f, 0.6, 0.08); this.pluck(t, f * 2, 0.3, 0.03); },
  sfxPop() { if (!this.ctx) return; const t = this.now; this.tone(t, 380, 900, 0.09, 0.1, 'sine'); this.noiseHit(t, 0.06, 0.05, 'highpass', 3000, 0.8); },
  sfxFirework() { if (!this.ctx) return; const t = this.now; this.noiseHit(t, 0.5, 0.12, 'lowpass', 900, 0.6, this.sfx, 120); for (let i = 0; i < 7; i++) this.noiseHit(t + 0.25 + Math.random() * 0.5, 0.03, 0.04, 'highpass', 5000, 1); },
});

const Toy = {
  W: null, fog: null, bg: null, shot: '', thumbs: {}, pieces: {}, followers: [], interacts: [], sentries: [], loading: null, portal: null, catching: false, halo: null, palaceGlow: null,

  /* ---------- build the stage once, the first time the chapter opens ---------- */
  ensure() {
    if (this.W) return Promise.resolve();
    if (!this.loading) this.loading = this.buildAll();
    return this.loading;
  },
  async buildAll() {
    const L = $('screenLoading');
    L.style.transition = 'none'; L.style.opacity = '1'; L.hidden = false;
    UI.setLoading(0.08, '장난감 왕국의 무대를 꾸미는 중…');
    await nextFrame(); await nextFrame();
    await buildToyTextures();
    buildToyMaterials();
    Sound.buildToyTracks();
    UI.setLoading(0.35, '기차 마을과 회전목마를 세우는 중…');
    await nextFrame();
    const root = new THREE.Group(); root.name = 'toyland'; root.visible = false; scene.add(root);
    const W2 = buildToyland(root);
    UI.setLoading(0.6, '왕궁 조각 열두 개를 빚는 중…');
    await nextFrame();
    for (const def of PIECES) {
      const pc = buildPiece(def);
      pc.holder = new THREE.Group(); root.add(pc.holder);
      pc.holder.add(pc.group); pc.group.position.copy(pc.center).multiplyScalar(-1);
      pc.mini = Math.min(0.62, 1.5 / pc.maxDim); pc.fol = Math.min(0.42, 0.62 / pc.maxDim);
      pc.half = (pc.size.y * pc.mini) / 2; pc.ph = rnd(0, TAU); pc.fpos = V3(); pc.spot = V3(); pc.rot = 0;
      pc.ghost.position.set(...def.pivot); W2.palaceRoot.add(pc.ghost);
      this.pieces[def.id] = pc;
    }
    this.halo = makeGlowPoints(PIECES.map(() => ({ p: [0, -50, 0], c: '#ffe3a8', s: 2.4, tw: 0.3 })), { boost: 0.8 });
    root.add(this.halo);
    const pg = [];
    for (let i = 0; i < 46; i++) { const a = (i / 46) * TAU; pg.push({ p: [TOY.palace.x + Math.cos(a) * 5.45, 0.92, TOY.palace.z + Math.sin(a) * 5.45], c: i % 2 ? '#ffd68a' : '#ffc0d6', s: 0.8, tw: 0.6 }); }
    for (const [x, y, z] of [[-3.6, 7.5, 2.35], [3.6, 7.5, 2.35], [0, 9.6, -0.9], [0, 6.0, 3.0]]) pg.push({ p: [TOY.palace.x + x, TOY.palace.y + y, TOY.palace.z + z], c: '#fff1cf', s: 3.4, tw: 0.2 });
    this.palaceGlow = makeGlowPoints(pg, { boost: 0 }); root.add(this.palaceGlow);
    this.W = W2;
    this.makeSentries();
    this.portal = makePortal(); root.add(this.portal);
    this.fog = new THREE.Fog('#e3c9dc', 48, 128);
    this.bg = new THREE.Color('#c3aed0');
    this.setupInteracts();
    W2.piano.keys.forEach((k) => { k.col.onLand = () => { Sound.sfxPiano(k.note); this.noteFx(k); }; });
    W2.drum.col.onBounce = () => { W2.drum.wob = 1; Sound.sfxBoing(); burst(W2.drum.pos.x, 0.9, W2.drum.pos.z, { n: 14, speed: 2.4, colors: ['#ffffff', '#ffd6e0', '#fff1c4'] }); clara.play('spin', 0.7); };
    UI.setLoading(0.82, '태엽을 감고 조명을 맞추는 중…');
    await nextFrame();
    // compile every toy-land shader now so nothing hitches the first time it appears
    const r1 = World.W1.root.visible; World.W1.root.visible = false; root.visible = true;
    const hidden = []; root.traverse((o) => { if (o.visible === false) { hidden.push(o); o.visible = true; } });
    const fog0 = scene.fog; scene.fog = this.fog;
    try { renderer.compile(scene, camera); } catch (e) { /* compile lazily */ }
    hidden.forEach((o) => { o.visible = false; });
    this.thumbs = renderPieceThumbs(Object.values(this.pieces));
    scene.fog = fog0; root.visible = false; World.W1.root.visible = r1;
    renderer.shadowMap.needsUpdate = true;
    UI.setLoading(1, '막이 오릅니다');
  },
  makeSentries() {
    const coneGeo = new THREE.CircleGeometry(4.2, 24, -Math.PI / 2 - 0.56, 1.12); coneGeo.rotateX(-Math.PI / 2);
    for (const def of this.W.sentries) {
      const m = buildMouse(); m.root.scale.setScalar(1.45); this.W.root.add(m.root);
      m.root.traverse((o) => { if (o.isMesh) o.castShadow = false; });
      const lb = new Batch(MAT.gold), lg = new Batch(MAT.glow);
      lb.add(GEO.cyl(8), '#d9ad5a', TRS(0, 0.08, 0, 0, 0, 0, 0.06, 0.02, 0.06)); lb.add(GEO.cyl(8), '#d9ad5a', TRS(0, -0.08, 0, 0, 0, 0, 0.06, 0.02, 0.06));
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; lb.add(GEO.cyl(4), '#d9ad5a', TRS(Math.sin(a) * 0.05, 0, Math.cos(a) * 0.05, 0, 0, 0, 0.008, 0.16, 0.008)); }
      lb.add(GEO.torus(0.04, 0.008, 4, 10), '#d9ad5a', TRS(0, 0.12, 0));
      lg.add(GEO.sph(10, 8), '#ffd56e', TRS(0, 0, 0, 0, 0, 0, 0.045, 0.06, 0.045));
      const lantern = new THREE.Group(); lantern.add(lb.build({ cast: false }), lg.build({ cast: false })); lantern.position.set(0.19, 0.28, 0.2); m.body.add(lantern);
      const blob = makeBlob(0.42); this.W.root.add(blob);
      const cone = new THREE.Mesh(coneGeo, MAT2.cone); cone.renderOrder = 3; this.W.root.add(cone);
      const mk = new Batch(MAT.glow); mk.add(GEO.capsule(0.07, 0.3, 4, 8), '#ff5a4a', TRS(0, 0.3, 0)); mk.add(GEO.sph(10, 8), '#ff5a4a', TRS(0, 0, 0, 0, 0, 0, 0.08));
      const mark = mk.build({ cast: false }); mark.visible = false; this.W.root.add(mark);
      this.sentries.push({ def, m, blob, cone, mark, pos: def.path[0].clone(), yaw: 0, target: 1, state: 'walk', t: 0, baseYaw: 0, sp: 0 });
    }
  },
  setupInteracts() {
    const W2 = this.W, G1 = W2.props.gift.pos, LV = W2.crane.lever, KA = W2.musicBox.keyAt;
    this.interacts = [
      { id: 'lectern', x: 0, z: 2.75, r: 1.6, p: [0, 1.95, 1.6], label: '왕궁 조립하기', short: '조립하기', icon: 'build', when: () => G.phase === 'explore', act: () => Build.enter() },
      { id: 'guard', x: -2.25, z: 2.85, r: 0.95, p: [-2.25, 1.85, 1.9], label: '장난감 병정에게 말 걸기', short: '말 걸기', icon: 'eye', when: () => G.phase === 'explore', act: () => this.guardTalk() },
      { id: 'gift', x: G1.x + 0.3, z: G1.z + 1.2, r: 1.9, p: [G1.x, 2.2, G1.z], label: '선물 상자 열기', short: '열기', icon: 'gift', when: () => G.phase === 'explore' && !TG.gift, act: () => this.openGift() },
      { id: 'lever', x: LV.x, z: LV.z + 0.6, r: 1.5, p: [LV.x, 1.75, LV.z], label: '크레인 레버 당기기', short: '당기기', icon: 'lever', when: () => G.phase === 'explore' && TG.crane === 0 && TG.tier >= 2, act: () => this.pullLever() },
      { id: 'key', x: KA.x, z: KA.z, r: 1.45, p: [KA.x - 0.9, 1.95, KA.z], label: '오르골 태엽 감기', short: '태엽 감기', icon: 'music', when: () => G.phase === 'explore' && !TG.boxOpen && TG.tier >= 4, act: () => this.windKey() },
    ];
  },

  /* ---------- chapter flow ---------- */
  async start() {
    RUN_ID++; Tasks.clear(); UI.closeDialog();
    ['screenTitle', 'screenMap', 'screenClear', 'screenPause', 'build'].forEach((id) => UI.hide(id));
    G.mode = 'loading'; G.locked = true;
    UI.hide('hud'); UI.hide('controls'); UI.prompt(null);
    Sound.stopMusic(0.6);
    const fresh = !this.W;
    if (fresh) await this.ensure(); else await UI.fade(1, 0.4);
    RUN_ID++;
    World.use(2);
    this.reset();
    G.mode = 'cutscene';
    const L = $('screenLoading');
    if (!L.hidden) { L.style.transition = 'opacity .8s ease'; L.style.opacity = '0'; setTimeout(() => { L.hidden = true; }, 820); }
    UI.fade(0, 1.0);
    Story.run(() => this.intro());
  },
  leave() {
    if (!this.W) return;
    Build.close();
    UI.hide('build');
    this.portal.visible = false;
    fairyBig.root.visible = false;
    player.float = false;
    clara.root.visible = true; blobs.clara.visible = true;
    marker.scale.setScalar(1); marker.visible = false;
    this.catching = false;
  },
  reset() {
    const W2 = this.W;
    Object.assign(TG, { tier: 1, found: {}, placed: {}, caught: 0, gift: false, crane: 0, winds: 0, boxOpen: false, buildTut: TG.buildTut, lastProgress: 0, gateMark: -1, gateMarkT: 0, seen: {} });
    Object.assign(G, { phase: 'none', stars: 0, time: 0, throws: 0, combat: false, markerAt: null });
    Object.assign(player, { yaw: Math.PI, vy: 0, grounded: true, groundCol: null, stun: 0, invuln: 0, knockT: 0, coyote: 0, jumpBuf: 0, throwCd: 0, speed: 0, float: false });
    player.pos.copy(TOY.start); player.vel.set(0, 0, 0);
    clara.a.action = null; clara.setExpr('smile'); clara.root.visible = true; blobs.clara.visible = true;
    comp.mode = 'prince'; comp.hold = false; comp.target = null; comp.pos.set(1.1, 0, TOY.start.z + 0.9); comp.y = 0; comp.yaw = Math.PI;
    nut.root.visible = false; prince.root.visible = true; prince.root.scale.setScalar(1.12); blobs.nut.visible = true;
    fairyBig.root.visible = false;
    UI.setChapterHud('제2장', '장난감 왕국', 'i-block'); UI.setStars(0);
    this.followers.length = 0;
    for (const id in this.pieces) {
      const pc = this.pieces[id];
      pc.holder.add(pc.group); pc.group.position.copy(pc.center).multiplyScalar(-1); pc.group.rotation.set(0, 0, 0); pc.group.scale.setScalar(1);
      pc.group.traverse((o) => { if (o.isMesh) o.castShadow = false; });
      pc.holder.visible = true; pc.holder.rotation.set(0, rnd(0, TAU), 0); pc.holder.scale.setScalar(pc.mini);
      pc.state = 'world'; pc.ride = null; pc.t = 0; pc.rot = 0;
      if (W2.spots[id]) pc.spot.copy(this.centerOn(pc, W2.spots[id]));
      pc.ghost.visible = true;
    }
    const P = this.pieces, T = W2.train, C = W2.carousel, M = W2.musicBox;
    P.base.state = 'hidden'; P.dome.state = 'hidden'; P.star.state = 'hidden';
    P.colon.ride = (o) => { const car = T.cars[1]; return o.set(car.g.position.x, 0.64 + P.colon.half + 0.16, car.g.position.z); };
    P.towerL.ride = (o) => { const a = C.a + Math.PI / NHOFF, r = 1.8; return o.set(C.center.x + Math.sin(a) * r, 0.43 + P.towerL.half + 0.16, C.center.z + Math.cos(a) * r); };
    P.wingR.ride = (o) => { W2.crane.hook.getWorldPosition(o); o.y -= 0.32 + P.wingR.half; return o; };
    P.star.ride = (o) => o.set(M.pos.x, M.stage.position.y + 2.52, M.pos.z);
    this.updateGhosts();
    // toys back to their first positions
    W2.gates.forEach((g) => g.set(0));
    T.th = 0.4; T.v = 0; T.halt = 0; T.stopCd = 0; T.place(true);
    C.a = 0;
    const Cr = W2.crane; Cr.jib.rotation.y = 0; Cr.len = 1.3; Cr.stick.rotation.z = 0;
    M.lid.rotation.x = 0; M.stage.position.y = 0.05; M.stage.rotation.y = 0; M.a = 0; M.open = 0; M.col.top = 2.02; M.ballerina.root.visible = false;
    M.stageCol.on = false; M.balCol.on = false; M.stageCol.top = 1.4; M.key.rotation.x = 0;
    const gp = W2.props.gift; gp.lid.position.set(0, 1.3, 0); gp.lid.rotation.set(0, 0, 0);
    W2.drum.wob = 0;
    W2.guards.forEach((g) => { g.pos.copy(g.home); g.yaw = 0; g.col.x = g.pos.x; g.col.z = g.pos.z; });
    this.resetSentries();
    MAT2.window.emissiveIntensity = 0; this.palaceGlow.material.uniforms.uBoost.value = 0;
    this.portal.visible = false; this.portal.scale.setScalar(1); this.portal.position.set(0, 0, 4.6);
    this.catching = false;
    Cam.shake = 0; UI.prompt(null);
    renderer.shadowMap.needsUpdate = true;
    FX.add.clear(); FX.norm.clear();
  },
  resetSentries() {
    for (const s of this.sentries) { s.pos.copy(s.def.path[0]); s.target = 1; s.state = 'walk'; s.t = 0; s.mark.visible = false; const d = s.def.path[1].clone().sub(s.def.path[0]); s.yaw = Math.atan2(d.x, d.z); }
  },
  centerOn(pc, surface) { return V3(surface.x, surface.y + pc.half + 0.2, surface.z); },
  async intro() {
    Sound.playMusic('toys');
    Cam.set([0, 17, 30], [0, 3, -5]);
    tween(4.2, (k) => { Cam.pos.set(lerp(0, 0, k), lerp(17, 9.6, k), lerp(30, 17.5, k)); Cam.target.set(0, lerp(3, 3.4, k), -5.5); }, Ease.inOut);
    UI.chapterCard('Chapter II', '장난감 왕국');
    await guard(wait(3.4));
    await guard(UI.say('narrator', '별의 문을 지나자, 클라라와 왕자는 커다래진 트리 아래의 장난감 왕국에 도착했어요.'));
    await guard(UI.say('narrator', '그런데 광장 한가운데 있어야 할 왕궁은 보이지 않고, 빛나는 설계도만 덩그러니 떠 있었지요.'));
    await guard(Cam.to([2.8, 2.8, TOY.start.z + 4.2], [0.4, 1.25, TOY.start.z - 0.2], 1.6));
    prince.play('bow', 1.3);
    await guard(UI.say('prince', '생쥐 왕이 도망치면서 왕궁을 조각조각 흩뜨려 놓았군요. 조각은 모두 열두 개예요.'));
    clara.setExpr('determined', 3);
    await guard(UI.say('clara', '설계도대로 다시 맞추면 되겠다! 장난감 조립이라면 자신 있어.'));
    await guard(UI.say('prince', '먼저 이 광장에서 기단과 계단, 정문을 찾아봐요. 모은 조각은 설계도 받침대에서 맞출 수 있어요.'));
    this.beginExplore();
    UI.hint(DEVICE.touch ? '반짝이는 조각에 다가가면 저절로 주워요 · 금빛 버튼으로 살펴보기' : '반짝이는 조각에 다가가면 저절로 주워요 · 이동 WASD, 점프 Space, 살펴보기 E', 6500);
  },
  beginExplore() {
    G.phase = 'explore'; TG.lastProgress = G.time;
    Story.beginPlay();
    this.objective();
  },
  tierIds(t = TG.tier) { return PIECES.filter((p) => p.tier === t).map((p) => p.id); },
  objective() {
    const t = TG.tier; if (t > 4) return;
    const ids = this.tierIds(t), found = ids.filter((id) => TG.found[id]).length, placed = ids.filter((id) => TG.placed[id]).length;
    if (found < ids.length) UI.setObjective(`${ZONE_NAMES[t]}에서 왕궁 조각 찾기 ${found} / ${ids.length}`);
    else UI.setObjective(`설계도 받침대에서 ${TIER_NAMES[t]} 조립하기 ${placed} / ${ids.length}`);
  },
  updateGhosts(hintId) {
    for (const id in this.pieces) {
      const pc = this.pieces[id], u = pc.ghost.material.uniforms, d = pc.def;
      if (TG.placed[id]) { pc.ghost.visible = false; continue; }
      pc.ghost.visible = true;
      if (d.tier === TG.tier) {
        const ready = (d.req || []).every((r) => TG.placed[r]);
        u.uColor.value.set(hintId === id ? '#ffd76a' : ready ? '#7cc8ff' : '#aab6d6');
        u.uAlpha.value = hintId === id ? 1.4 : ready ? 1.05 : 0.55; u.uPulse.value = ready ? 1 : 0;
      } else { u.uColor.value.set('#b9caf6'); u.uAlpha.value = 0.55; u.uPulse.value = 0; }
    }
  },

  /* ---------- pieces ---------- */
  popPiece(id, from, surface) {
    const pc = this.pieces[id];
    pc.state = 'pop'; pc.t = 0; pc.from = from.clone(); pc.ride = null;
    pc.spot.copy(this.centerOn(pc, surface)); pc.holder.visible = true;
    Sound.sfxPop();
  },
  collect(pc) {
    pc.state = 'collect'; pc.t = 0; pc.from = pc.holder.position.clone(); pc.s0 = pc.holder.scale.x;
    TG.found[pc.def.id] = true; TG.lastProgress = G.time;
    const n = Object.keys(TG.found).length;
    burst(pc.from.x, pc.from.y, pc.from.z, { n: 30, speed: 3.4 });
    Sound.sfxStar(n);
    UI.setStars(n);
    clara.setExpr('happy', 1.2); if (player.grounded && !clara.a.action) clara.play('cheer', 0.8);
    UI.toast(`왕궁 조각을 찾았어요 · ${pc.def.name}`, 2200);
    this.objective();
    const ids = this.tierIds();
    if (ids.every((id) => TG.found[id])) setTimeout(() => { if (G.chapter === 2 && G.phase === 'explore') UI.toast('조각을 모두 모았어요! 설계도 받침대로 가요', 3000); }, 1400);
  },
  updatePieces(dt, t) {
    const posAttr = this.halo.geometry.attributes.position;
    let fi = 0;
    PIECES.forEach((def, i) => {
      const pc = this.pieces[def.id], h = pc.holder;
      let haloOn = false;
      switch (pc.state) {
        case 'hidden': h.visible = false; break;
        case 'world': {
          h.visible = true;
          const c = pc.ride ? pc.ride(_v1) : pc.spot;
          h.position.set(c.x, c.y + Math.sin(t * 2.1 + pc.ph) * 0.12, c.z);
          h.rotation.y += dt * 0.8; h.scale.setScalar(pc.mini);
          haloOn = true;
          if (Math.random() < dt * 3.5) { const a = rnd(0, TAU); FX.add.spawn({ x: h.position.x + Math.cos(a) * 0.6, y: h.position.y + rnd(-0.4, 0.5), z: h.position.z + Math.sin(a) * 0.6, vy: 0.4, life: 1.0, size: rnd(0.16, 0.3), size1: 0, color: pick(GOLDS), cell: CELL.sparkle, rot: rnd(0, 3) }); }
          break;
        }
        case 'pop': {
          h.visible = true; pc.t += dt;
          const k = Math.min(1, pc.t / 0.95);
          h.position.lerpVectors(pc.from, pc.spot, Ease.out(k)); h.position.y += Math.sin(k * Math.PI) * 1.6;
          h.scale.setScalar(pc.mini * Ease.outBack(Math.min(1, pc.t / 0.5)));
          h.rotation.y += dt * 6;
          if (Math.random() < 0.6) FX.add.spawn({ x: h.position.x, y: h.position.y, z: h.position.z, life: 0.6, size: 0.26, size1: 0, color: pick(GOLDS), cell: CELL.sparkle, vy: 0.3 });
          if (k >= 1) pc.state = 'world';
          break;
        }
        case 'collect': {
          pc.t += dt;
          const k = Math.min(1, pc.t / 0.5), to = _v2.set(player.pos.x, player.pos.y + 1.4, player.pos.z);
          h.position.lerpVectors(pc.from, to, Ease.inOut(k)); h.position.y += Math.sin(k * Math.PI) * 0.8;
          h.scale.setScalar(lerp(pc.s0, pc.fol, k)); h.rotation.y += dt * 9;
          if (k >= 1) { pc.state = 'follow'; pc.fpos.copy(h.position); this.followers.push(def.id); }
          break;
        }
        case 'follow': {
          h.visible = true;
          const idx = this.followers.indexOf(def.id);
          let tx, ty, tz;
          if (idx <= 0) { tx = player.pos.x - Math.sin(player.yaw) * 0.38; ty = player.pos.y + 2.15; tz = player.pos.z - Math.cos(player.yaw) * 0.38; }
          else {
            const prev = this.pieces[this.followers[idx - 1]].fpos, dx = pc.fpos.x - prev.x, dz = pc.fpos.z - prev.z, d = Math.hypot(dx, dz) || 1;
            tx = prev.x + (dx / d) * 0.6; tz = prev.z + (dz / d) * 0.6; ty = prev.y + 0.04;
          }
          const k = idx <= 0 ? 7 : 9;
          pc.fpos.x = damp(pc.fpos.x, tx, k, dt); pc.fpos.y = damp(pc.fpos.y, ty, k, dt); pc.fpos.z = damp(pc.fpos.z, tz, k, dt);
          h.position.set(pc.fpos.x, pc.fpos.y + Math.sin(t * 3 + idx) * 0.07, pc.fpos.z);
          h.rotation.y += dt * 1.4; h.scale.setScalar(pc.fol);
          if (Math.random() < dt * 4) FX.add.spawn({ x: h.position.x + rnd(-0.15, 0.15), y: h.position.y - 0.1, z: h.position.z + rnd(-0.15, 0.15), vy: -0.2, life: 0.6, size: 0.14, size1: 0, color: pick(GOLDS), cell: CELL.sparkle, rot: rnd(0, 3) });
          fi++;
          break;
        }
        case 'tray': h.visible = false; break;
        case 'placed': h.visible = false; break;
        default: break;
      }
      if (haloOn) posAttr.setXYZ(i, h.position.x, h.position.y, h.position.z); else posAttr.setXYZ(i, 0, -50, 0);
    });
    posAttr.needsUpdate = true;
  },

  /* ---------- toys that move (before Clara moves, so she can ride them) ---------- */
  prePhysics(dt) {
    const W2 = this.W, T = W2.train, C = W2.carousel, M = W2.musicBox;
    // train: a stop at the station each lap, and it waits for anyone on the rails
    T.stopCd = Math.max(0, T.stopCd - dt);
    if (T.halt > 0) T.halt -= dt;
    const loco = T.cars[0], ahead = T.P(loco.th + 2.1 / T.dl(loco.th));
    const near = (p) => p.y < 1.0 && Math.hypot(p.x - ahead.x, p.z - ahead.z) < 1.35;
    const blocked = near(player.pos) || (comp.mode === 'prince' && Math.hypot(comp.pos.x - ahead.x, comp.pos.z - ahead.z) < 1.2);
    T.v = damp(T.v, T.halt > 0 || blocked ? 0 : TOY.train.speed, blocked ? 6 : 2.2, dt);
    const prev = ((T.cars[1].th % TAU) + TAU) % TAU;
    T.th += (T.v * dt) / T.dl(T.th);
    T.place();
    const now = ((T.cars[1].th % TAU) + TAU) % TAU;
    if (prev > 5.5 && now < 0.8 && T.stopCd <= 0) { T.halt = 4.2; T.stopCd = 9; Sound.sfxWhistle(); }
    T.whistleCd = Math.max(0, (T.whistleCd || 0) - dt);
    if (blocked && T.whistleCd <= 0 && G.mode === 'play') { T.whistleCd = 4; Sound.sfxWhistle(); }
    // carousel
    const da = C.w * dt; C.a += da; C.group.rotation.y = C.a;
    const pm = C.platCol.mv; pm.ox = pm.nx = C.center.x; pm.oz = pm.nz = C.center.z; pm.dyaw = da;
    // music-box stage
    const sm = M.stageCol.mv; sm.ox = sm.nx = M.pos.x; sm.oz = sm.nz = M.pos.z;
    if (M.open > 0) { const db = 0.62 * dt; M.a += db; M.stage.rotation.y = M.a; sm.dyaw = db; } else sm.dyaw = 0;
    // piano keys sink under Clara's feet
    for (const k of W2.piano.keys) { k.press = damp(k.press, player.groundCol === k.col ? 1 : 0, 14, dt); k.col.top = k.top - 0.12 * k.press; }
  },

  /* ---------- per-frame chapter logic ---------- */
  update(dt) {
    const t = FX.uniforms.uTime.value, W2 = this.W;
    if (G.mode === 'build') { G.time += dt; Build.update(dt); }
    this.updatePieces(dt, t);
    this.updateSentries(dt);
    // train smoke
    const T = W2.train;
    T.steam = (T.steam || 0) + dt * (0.5 + T.v);
    if (T.steam > 0.3) { T.steam = 0; const lp = T.cars[0].g.localToWorld(_v1.set(0, 2.3, 0.95)); FX.norm.spawn({ x: lp.x, y: lp.y, z: lp.z, vx: rnd(-0.15, 0.15), vy: 1.0, vz: rnd(-0.15, 0.15), drag: 0.8, life: 1.6, size: 0.4, size1: 1.2, color: '#f6f2f6', alpha: 0.6, cell: CELL.smoke, rot: rnd(0, 6), vr: 0.5 }); }
    // carousel horses bob up and down their poles
    const C = W2.carousel, dm = C.dummy;
    for (let i = 0; i < C.NH; i++) {
      const a0 = (i / C.NH) * TAU, y = 1.42 + Math.sin(t * 1.7 + i * 1.05) * 0.34;
      dm.position.set(Math.sin(a0) * C.HR, y, Math.cos(a0) * C.HR); dm.rotation.set(0, a0 + Math.PI / 2, Math.sin(t * 1.7 + i * 1.05 + 1.2) * 0.12); dm.scale.setScalar(1.25); dm.updateMatrix();
      C.horses.setMatrixAt(i, dm.matrix);
      const wa = a0 + C.a; C.hcols[i].x = C.center.x + Math.sin(wa) * C.HR; C.hcols[i].z = C.center.z + Math.cos(wa) * C.HR;
    }
    C.horses.instanceMatrix.needsUpdate = true;
    // crane hook and cable
    const Cr = W2.crane, len = Cr.len || 1.3;
    Cr.hook.position.set(4.6, 0.95 - len, 0); Cr.cable.position.set(4.6, 0.95 - len / 2, 0); Cr.cable.scale.set(0.025, len, 0.025);
    // drum skin
    const D = W2.drum; D.wob = Math.max(0, D.wob - dt * 1.6);
    D.skin.position.y = 0.7 - Math.sin(t * 30) * 0.05 * D.wob; D.skin.scale.setScalar(0.78 * (1 + Math.sin(t * 30) * 0.04 * D.wob));
    // piano keys
    const pk = W2.piano;
    pk.keys.forEach((k, i) => { const top = k.col.top; pk.dummy.position.set(k.x, top / 2, k.z); pk.dummy.scale.set(1, top, 1); pk.dummy.updateMatrix(); pk.mesh.setMatrixAt(i, pk.dummy.matrix); });
    pk.mesh.instanceMatrix.needsUpdate = true;
    // fountain top, floating notes, the music-box ballerina
    W2.props.fountain.top.rotation.y = t * 3; W2.props.fountain.top.position.y = 2.2 + Math.sin(t * 2) * 0.05;
    W2.notes.position.y = Math.sin(t * 1.3) * 0.25; W2.notes.rotation.y = Math.sin(t * 0.4) * 0.05;
    if (Math.random() < dt * 5) { const F = W2.props.fountain.pos; FX.add.spawn({ x: F.x + rnd(-0.5, 0.5), y: 1.9, z: F.z + rnd(-0.5, 0.5), vx: rnd(-0.6, 0.6), vy: rnd(0.8, 1.6), vz: rnd(-0.6, 0.6), g: -4, life: 0.9, size: rnd(0.1, 0.18), size1: 0.04, color: '#d9ecff', cell: CELL.glow, alpha: 0.8 }); }
    const M = W2.musicBox;
    M.ballerina.update(dt, 0, true, 0);
    if (M.open > 0 && Math.random() < dt * 6) FX.add.spawn({ x: M.pos.x + rnd(-1.2, 1.2), y: M.stage.position.y + rnd(0.4, 2.4), z: M.pos.z + rnd(-1.2, 1.2), vy: 0.5, life: 1.2, size: 0.26, size1: 0, color: pick(['#ffd6e0', '#fff1c4', '#cfe3ff']), cell: CELL.star, rot: rnd(0, 3) });
    // guards
    W2.guards.forEach((g) => { g.s.root.position.set(g.pos.x, 0, g.pos.z); g.s.root.rotation.y = g.yaw; g.s.update(dt, g.walk || 0); g.blob.position.set(g.pos.x, 0.016, g.pos.z); });
    // the prince keeps up (a sparkle hop if he falls far behind)
    if (comp.mode === 'prince' && G.mode === 'play' && !G.locked && !comp.hold) {
      const d = Math.hypot(comp.pos.x - player.pos.x, comp.pos.z - player.pos.z);
      if (d > 8.5 || (player.grounded && player.pos.y > 1.5 && d > 4.5 && !this.hopT)) {
        puff(comp.pos.x, 0.6, comp.pos.z, { n: 8, size: 0.7, colors: ['#fff1c4', '#ffffff'] });
        const bx = player.pos.x - Math.sin(player.yaw) * 1.4, bz = player.pos.z - Math.cos(player.yaw) * 1.4;
        const np = V3(bx, 0, bz); resolve(np, 0.3, 0, 1.5); comp.pos.copy(np);
        burst(np.x, 1, np.z, { n: 12, speed: 2 }); this.hopT = 3;
      }
    }
    this.hopT = Math.max(0, (this.hopT || 0) - dt);
    // finale glow, portal, marker
    if (this.palaceGlow.material.uniforms.uBoost.value > 0 && Math.random() < dt * 8) { const P = TOY.palace; FX.add.spawn({ x: P.x + rnd(-4.5, 4.5), y: P.y + rnd(1, 9), z: P.z + rnd(-3, 4), vy: 0.5, life: 1.4, size: 0.3, size1: 0, color: pick(GOLDS), cell: CELL.star, rot: rnd(0, 3) }); }
    if (this.portal.visible) {
      const u = this.portal.userData, pp = this.portal.position;
      u.ring.rotation.z = t * 0.4; u.ring2.rotation.z = -t * 0.7; u.column.material.opacity = 0.65 + Math.sin(t * 2.5) * 0.15;
      if (Math.random() < dt * 22) { const a = rnd(0, TAU), r = rnd(0, 1.2); FX.add.spawn({ x: pp.x + Math.cos(a) * r, y: 0.1, z: pp.z + Math.sin(a) * r, vy: rnd(1.2, 2.6), life: rnd(1.4, 2.4), size: rnd(0.15, 0.35), size1: 0, color: pick(['#ffe3a8', '#ffc0d6', '#ffffff', '#cfe3ff']), cell: i2(CELL.star, CELL.sparkle), rot: rnd(0, 3) }); }
    }
    if (fairyBig.root.visible) { fairyBig.update(dt, 0, false, 0); fairyBig.root.position.y = 1.2 + Math.sin(t * 1.6) * 0.12; }
    this.updateMarker(dt, t);
  },
  updateMarker(dt, t) {
    let mk = null;
    if (G.phase === 'explore') {
      if (TG.gateMarkT > 0) {
        TG.gateMarkT -= dt;
        const g = this.W.gates[TG.gateMark];
        if (g) { mk = _v3.set(g.pos.x, 4.2, g.pos.z); if (Math.hypot(player.pos.x - g.pos.x, player.pos.z - g.pos.z) < 2.2) TG.gateMarkT = 0; }
      } else {
        const ids = this.tierIds();
        if (ids.every((id) => TG.found[id]) && ids.some((id) => !TG.placed[id])) mk = _v3.set(0, 2.7, 1.6);
      }
    } else if (G.phase === 'portal2') mk = _v3.set(this.portal.position.x, 2.8, this.portal.position.z);
    if (mk && G.mode === 'play') {
      marker.visible = true; marker.position.set(mk.x, mk.y + Math.sin(t * 3) * 0.12, mk.z); marker.rotation.y = t * 1.5; marker.scale.setScalar(1.6);
    } else marker.visible = false;
  },
  noteFx(k) {
    for (let i = 0; i < 6; i++) FX.add.spawn({ x: k.x + rnd(-0.8, 0.8), y: k.top + 0.2, z: k.z + rnd(-0.3, 0.3), vy: rnd(0.8, 1.6), life: 1, size: 0.26, size1: 0, color: pick(['#ffd6e0', '#cfe3ff', '#fff1c4']), cell: CELL.star, rot: rnd(0, 3) });
  },

  /* ---------- mouse sentries ---------- */
  updateSentries(dt) {
    const active = G.phase === 'explore' && G.mode === 'play' && !G.locked && TG.tier >= 3 && !this.catching;
    for (const s of this.sentries) {
      let sp = 0;
      if (s.state === 'walk') {
        const tgt = s.def.path[s.target], dx = tgt.x - s.pos.x, dz = tgt.z - s.pos.z, d = Math.hypot(dx, dz);
        if (d < 0.06) { s.state = 'wait'; s.t = s.def.wait; s.baseYaw = s.yaw; }
        else { sp = s.def.speed; const st = Math.min(d, sp * dt); s.pos.x += (dx / d) * st; s.pos.z += (dz / d) * st; s.yaw = dampAngle(s.yaw, Math.atan2(dx, dz), 8, dt); }
      } else if (s.state === 'wait') {
        s.t -= dt;
        const k = 1 - s.t / s.def.wait;
        s.yaw = s.baseYaw + Math.sin(k * TAU) * 0.7;
        if (s.t <= 0) { s.target = 1 - s.target; s.state = 'walk'; }
      } else if (s.state === 'alert') {
        s.yaw = dampAngle(s.yaw, Math.atan2(player.pos.x - s.pos.x, player.pos.z - s.pos.z), 10, dt);
      }
      if (active && s.state !== 'alert' && player.pos.y < 1.0) {
        const dx = player.pos.x - s.pos.x, dz = player.pos.z - s.pos.z, d = Math.hypot(dx, dz);
        if (d < 0.95 || (d < 4.15 && Math.abs(angleDiff(s.yaw, Math.atan2(dx, dz))) < 0.56)) this.spotted(s);
      }
      s.sp = damp(s.sp, sp, 8, dt);
      s.m.root.position.set(s.pos.x, 0, s.pos.z); s.m.root.rotation.y = s.yaw; s.m.update(dt, s.sp / 1.5);
      s.cone.position.set(s.pos.x, 0.05, s.pos.z); s.cone.rotation.y = s.yaw;
      s.cone.material = s.state === 'alert' ? MAT2.coneAlert : MAT2.cone;
      s.blob.position.set(s.pos.x, 0.016, s.pos.z);
      if (s.mark.visible) { s.mark.position.set(s.pos.x, 1.55 + Math.abs(Math.sin(FX.uniforms.uTime.value * 8)) * 0.12, s.pos.z); s.mark.quaternion.copy(camera.quaternion); }
    }
    MAT2.cone.opacity = 0.42 + Math.sin(FX.uniforms.uTime.value * 3) * 0.08;
  },
  spotted(s) {
    if (this.catching) return;
    this.catching = true; s.state = 'alert';
    Story.run(() => this.caughtSeq(s));
  },
  async caughtSeq(s) {
    TG.caught++;
    await Story.cut(async () => {
      s.mark.visible = true;
      Sound.sfxWhistle(); Sound.sfxSqueak(1.25);
      player.yaw = Math.atan2(s.pos.x - player.pos.x, s.pos.z - player.pos.z);
      clara.play('surprise', 0.9); clara.setExpr('surprised', 2);
      UI.toast(pick(['생쥐 보초: "찍찍! 거기 누구냐!"', '생쥐 보초: "침입자다! 진지 밖으로 나가!"', '생쥐 보초: "등불에 딱 걸렸지, 찍!"']), 2300);
      await guard(wait(1.1));
      await guard(UI.fade(1, 0.4, true));
      this.resetSentries();
      player.pos.copy(this.W.campEntry); player.vel.set(0, 0, 0); player.vy = 0; player.yaw = Math.PI; player.groundCol = null;
      comp.pos.set(player.pos.x + 1.0, 0, player.pos.z + 0.8); comp.y = 0;
      Cam.mode = 'follow'; Cam.update(10);
      await guard(UI.fade(0, 0.5, true));
    });
    this.catching = false;
    UI.hint('등불 빛이 닿지 않게! 보초가 등을 돌렸을 때 진지 가장자리로 살금살금 지나가요', 5200);
  },

  /* ---------- interactions ---------- */
  async guardTalk() {
    const g = this.W.guards[0]; g.s.a.poke = 0.5;
    player.yaw = Math.atan2(g.pos.x - player.pos.x, g.pos.z - player.pos.z);
    await Story.cut(async () => { await guard(UI.say('soldier', GUARD_LINES[Math.min(TG.tier, 5) - 1])); });
    G.phase = 'explore';
  },
  async openGift() {
    TG.gift = true;
    const g = this.W.props.gift;
    clara.play('interact', 0.7); player.yaw = Math.atan2(g.pos.x - player.pos.x, g.pos.z - player.pos.z);
    Sound.sfxOpen(); confetti(g.pos.x, 1.7, g.pos.z, 50); burst(g.pos.x, 1.6, g.pos.z, { n: 30, speed: 3.5 });
    tween(1.1, (k) => { g.lid.position.set(0.9 * k, 1.3 + Math.sin(k * Math.PI) * 1.2 - k * 1.08, 0.5 * k); g.lid.rotation.set(0.2 * k, 1.1 * k, -1.75 * k); }, Ease.out);
    await guard(wait(0.35));
    this.popPiece('base', V3(g.pos.x, 1.6, g.pos.z), this.W.spots.base);
    UI.toast('선물 상자 안에서 기단 조각이 튀어나왔어요!', 2400);
  },
  async pullLever() {
    TG.crane = 1;
    const Cr = this.W.crane;
    clara.play('interact', 0.7); Sound.sfxCrank();
    tween(0.45, (k) => { Cr.stick.rotation.z = -k * 0.9; });
    await Story.cut(async () => {
      await guard(Cam.to([Cr.base.x + 7.5, 6.6, Cr.base.z + 9.5], [Cr.base.x + 1.6, 2.3, Cr.base.z + 1.6], 1.1));
      Sound.sfxRumble(1.6);
      await guard(tween(2.2, (k) => { Cr.jib.rotation.y = -k * Math.PI / 2; }, Ease.inOut));
      await guard(tween(1.5, (k) => { Cr.len = lerp(1.3, 3.75, k); }, Ease.inOut));
      const from = this.pieces.wingR.holder.position.clone();
      this.popPiece('wingR', from, this.W.spots.wingR);
      puff(from.x, from.y, from.z, { n: 8, size: 0.7 });
      await guard(wait(1.0));
      tween(1.2, (k) => { Cr.len = lerp(3.75, 1.3, k); });
      await guard(UI.say('prince', '좋아요! 크레인이 오른쪽 날개를 내려 주었어요. 얼른 주워요!'));
    });
    G.phase = 'explore';
  },
  async windKey() {
    const M = this.W.musicBox;
    TG.winds++;
    clara.play('interact', 0.6); Sound.sfxCrank();
    player.yaw = Math.atan2(M.key.position.x - player.pos.x, M.key.position.z - player.pos.z);
    const k0 = M.key.rotation.x;
    tween(0.6, (k) => { M.key.rotation.x = k0 + k * TAU / 3; }, Ease.out);
    setTimeout(() => Sound.playSeq(WIND_PHRASES[Math.min(2, TG.winds - 1)], 120, 0.13, 1.3), 250);
    burst(M.key.position.x + 0.7, M.key.position.y, M.key.position.z, { n: 12, speed: 2 });
    if (TG.winds < 3) { UI.toast(TG.winds === 1 ? '끼릭… 오르골 안에서 작은 소리가 나요' : '끼릭끼릭… 한 번만 더 감아 볼까요?', 2200); return; }
    TG.boxOpen = true;
    await guard(wait(0.8));
    await Story.cut(async () => {
      Sound.duck(0.25, 7);
      await guard(Cam.to([5.4, 6.0, M.pos.z + 8.6], [0, 2.1, M.pos.z], 1.2));
      Sound.sfxOpen();
      await guard(tween(1.6, (k) => { M.lid.rotation.x = -k * 1.92; }, Ease.inOut));
      M.col.top = 1.8; M.ballerina.root.visible = true;
      await guard(tween(1.6, (k) => { M.stage.position.y = lerp(0.05, 1.9, Ease.out(k)); M.stageCol.top = M.stage.position.y + 0.2; }, Ease.linear));
      M.stageCol.on = true; M.balCol.on = true;
      M.open = 1; M.ballerina.play('spin', 2.2);
      setTimeout(() => Sound.playSeq(MUSICBOX_MEL, 112, 0.12, 1.3), 200);
      this.popPiece('dome', V3(M.pos.x, 2.6, M.pos.z), this.W.spots.dome);
      const st = this.pieces.star; st.state = 'world'; st.holder.visible = true;
      const sp = st.ride(_v1); burst(sp.x, sp.y, sp.z, { n: 30, speed: 3 });
      await guard(wait(1.6));
      await guard(UI.say('prince', '양파 돔이 튀어나왔어요! 그리고 저기 봐요, 발레리나의 손끝에서 꼭대기 별이 빛나요.'));
      await guard(UI.say('clara', '돌아가는 무대에 올라가서 폴짝 뛰면 닿을 것 같아!'));
    });
    G.phase = 'explore';
  },

  /* ---------- tier complete → open the next gate ---------- */
  async openGate(i) {
    const g = this.W.gates[i];
    Sound.sfxGate();
    confetti(g.bow.position.x, 2.2, g.bow.position.z, 60); burst(g.bow.position.x, 1.6, g.bow.position.z, { n: 30, speed: 4 });
    await guard(tween(1.7, (k) => g.set(k), Ease.inOut));
    renderer.shadowMap.needsUpdate = true;
  },
  async tierComplete(t) {
    await Story.cut(async () => {
      G.phase = 'celebrate';
      const P = TOY.palace;
      Sound.sfxFanfare();
      this.W.guards.forEach((g) => { g.s.a.poke = 0.6; });
      for (let i = 0; i < 3; i++) setTimeout(() => confetti(P.x + rnd(-3, 3), 2 + t * 1.6, P.z + 2.5, 40), i * 350);
      await guard(Cam.to([7.8, 3.4 + t * 1.5, 11.6], [0, 1.2 + t * 1.35, -5.5], 1.4));
      clara.play('cheer', 1); clara.setExpr('happy', 3);
      await guard(UI.say('narrator', TIER_DONE[t]));
      const gt = this.W.gates[t - 1], gp = gt.pos;
      const camPos = gt.axis === 'x' ? [gp.x - gt.out * 6.8, 4.4, gp.z + 7.8] : [gp.x + 5.8, 4.6, gp.z - 7.6];
      await guard(Cam.to(camPos, [gp.x, 1.8, gp.z], 1.5));
      await this.openGate(t - 1);
      await guard(wait(0.3));
      await guard(UI.say('prince', GATE_LINES[t]));
    });
    TG.tier = t + 1; TG.gateMark = t - 1; TG.gateMarkT = 14; TG.lastProgress = G.time;
    G.phase = 'explore';
    this.updateGhosts(); this.objective();
    Sound.playMusic('toys');
  },
  async finale() {
    await Story.cut(async () => {
      G.phase = 'finale';
      Sound.stopMusic(1.0);
      const P = TOY.palace;
      await guard(Cam.to([9.5, 6.4, 13.5], [0, 4.2, -5.5], 1.6));
      Sound.sfxTransform();
      await guard(tween(2.0, (k) => { MAT2.window.emissiveIntensity = k * 1.5; this.palaceGlow.material.uniforms.uBoost.value = k * 1.3; }, Ease.inOut));
      for (let i = 0; i < 7; i++) {
        setTimeout(() => {
          if (G.chapter !== 2) return;
          const x = P.x + rnd(-9, 9), y = rnd(12, 17), z = P.z + rnd(-6, 2);
          burst(x, y, z, { n: 46, speed: 6, g: -1.2, size: 1.6, life: 1.6, colors: pick([GOLDS, ['#ffc0d6', '#ffffff', '#f3c3cc'], ['#cfe3ff', '#ffffff', '#ffe9a8']]) });
          Sound.sfxFirework();
        }, 400 + i * 520);
      }
      await guard(UI.say('narrator', '마지막으로 꼭대기 별이 제자리를 찾자, 장난감 왕궁의 창문마다 따스한 불빛이 켜졌어요.'));
      // the two guards march up to the stairs and present arms
      const g0 = this.W.guards.map((g) => g.pos.clone());
      await guard(tween(2.0, (k) => { this.W.guards.forEach((g, i) => { g.pos.lerpVectors(g0[i], V3((i ? 1 : -1) * 2.2, 0, 0.7), k); g.yaw = 0; g.walk = 1; }); }, Ease.linear));
      this.W.guards.forEach((g) => { g.walk = 0; g.s.a.poke = 0.8; g.col.x = g.pos.x; g.col.z = g.pos.z; });
      await guard(UI.say('narrator', '태엽 병정들이 나팔을 불고, 하늘에는 반짝이는 불꽃이 피어났지요.'));
      await guard(Cam.to([player.pos.x + 2.4, 2.8, player.pos.z + 4.4], [player.pos.x + 0.4, 1.3, player.pos.z], 1.2));
      prince.play('bow', 1.2);
      await guard(UI.say('prince', '해냈어요, 클라라! 이제 장난감 왕국 사람들도 다시 왕궁으로 돌아올 수 있어요.'));
      clara.play('curtsy', 1.5); clara.setExpr('happy', 3);
      await guard(UI.say('clara', '조각이 하나도 빠짐없이 딱 맞았어! 설계도보다 더 예쁜 것 같아.'));
      await guard(Cam.to([0, 3.6, 11.4], [0, 2.0, 3.6], 1.4));
      this.portal.visible = true; this.portal.position.set(0, 0, 4.6); Sound.sfxPortal();
      await guard(tween(1.2, (k) => this.portal.scale.setScalar(Math.max(0.01, Ease.outBack(k))), Ease.linear));
      fairyBig.root.visible = true; fairyBig.root.position.set(0, 1.2, 3.4); fairyBig.root.rotation.y = 0;
      await guard(tween(1.0, (k) => fairyBig.root.scale.setScalar(Math.max(0.01, k)), Ease.out));
      fairyBig.play('pose', 2.2);
      await guard(UI.say('fairy', '정말 훌륭하구나, 클라라. 이 별빛을 따라가면 눈송이의 숲에 닿을 거란다. 별의 문을 열어 줄게.'));
      Sound.playMusic('waltz');
    });
    G.phase = 'portal2'; this.portalT = G.time;
    UI.setObjective('왕궁 앞에 열린 별의 문으로 들어가세요');
  },
  async enterPortal() {
    await Story.cut(async () => {
      G.markerAt = null; G.phase = 'leaving';
      const p0 = player.pos.clone(), dest = this.portal.position.clone();
      player.yaw = Math.atan2(dest.x - p0.x, dest.z - p0.z);
      await guard(Cam.to([0, 3.6, dest.z + 7.2], [0, 1.8, dest.z], 1.0));
      await guard(tween(0.9, (k) => { player.pos.lerpVectors(p0, dest, k); player.speed = 3; }, Ease.inOut));
      player.speed = 0; clara.play('spin', 1.2); Sound.sfxPortal();
      player.float = true;
      await guard(during(1.6, (dt) => { player.pos.y += dt * 1.6; for (let i = 0; i < 3; i++) FX.add.spawn({ x: player.pos.x + rnd(-0.5, 0.5), y: player.pos.y + rnd(0, 1.4), z: player.pos.z + rnd(-0.5, 0.5), vy: 1, life: 0.9, size: 0.3, size1: 0, color: pick(GOLDS), cell: CELL.star, rot: rnd(0, 3) }); }));
      await guard(UI.fade(1, 1.0));
      Sound.sfxFanfare();
      UI.hide('hud'); UI.hide('controls');
      player.float = false; clara.root.visible = false; prince.root.visible = false; blobs.nut.visible = false; blobs.clara.visible = false; fairyBig.root.visible = false;
      Cam.set([11, 7.2, 15.5], [0, 4.2, -5.5]);
      this.shot = this.snapshot();
      await guard(UI.fade(0, 1.0));
    }, false);
    this.clear();
  },
  clear() {
    G.mode = 'clear'; G.locked = true;
    UI.hide('hud'); UI.hide('controls');
    const prev = Save.data.done.toys;
    Save.data.done.toys = { pieces: Object.keys(TG.placed).length, time: G.time, caught: TG.caught, best: prev ? Math.min(prev.best || prev.time, G.time) : G.time };
    Save.data.unlocked = Math.max(Save.data.unlocked, 3);
    Save.write();
    UI.clearCard({
      kicker: '제2장 · 이야기 끝', title: '장난감 왕국', icon: 'i-castle',
      stats: [['맞춘 조각', `${Object.keys(TG.placed).length} / 12`], ['걸린 시간', fmtTime(G.time)], ['들킨 횟수', String(TG.caught)]],
      unlock: '<b>제3장 · 눈송이의 숲</b>이 열렸어요!<br><span>다음 무대는 지금 정성껏 꾸미고 있어요.</span>', next: false,
    });
    UI.show('screenClear');
  },
  snapshot() {
    try {
      const cv = makeCanvas(640, 400), c2 = cv.getContext('2d');
      const cam = new THREE.PerspectiveCamera(38, 1.6, 0.1, 220);
      cam.position.set(10.5, 8.6, 16.5); cam.lookAt(0, 3.6, -4.8);
      const size = new THREE.Vector2(); renderer.getDrawingBufferSize(size);
      const pr = renderer.getPixelRatio(), w = 640, h = 400;
      renderer.setViewport(0, 0, w / pr, h / pr); renderer.setScissor(0, 0, w / pr, h / pr); renderer.setScissorTest(true);
      renderer.render(scene, cam);
      c2.drawImage(renderer.domElement, 0, size.y - h, w, h, 0, 0, w, h);
      renderer.setScissorTest(false); renderer.setViewport(0, 0, size.x / pr, size.y / pr);
      return cv.toDataURL('image/jpeg', 0.86);
    } catch (e) { return ''; }
  },

  /* ---------- per-frame story logic: prompts, pickups, hints ---------- */
  tick(dt) {
    Story.near = null;
    if (G.mode === 'play' && !G.locked && player.grounded) {
      let bd = 1e9;
      for (const it of this.interacts) {
        if (!it.when()) continue;
        const d = Math.hypot(player.pos.x - it.x, player.pos.z - it.z);
        if (d < it.r && d < bd && player.pos.y < 1.2) { bd = d; Story.near = it; }
      }
    }
    if (Story.near) { const s = toScreen(_v3.set(...Story.near.p)); UI.prompt(Story.near.label, s.x, s.y - 12); UI.setAction(Story.near.icon, Story.near.short); }
    else { UI.prompt(null); UI.setAction('spin', '피루엣'); }
    if (G.mode !== 'play') return;
    // pick up pieces by touching them
    const cx = player.pos.x, cy = player.pos.y + 0.8, cz = player.pos.z;
    for (const def of PIECES) {
      const pc = this.pieces[def.id];
      if (pc.state !== 'world' || G.locked) continue;
      const p = pc.holder.position, dx = p.x - cx, dy = p.y - cy, dz = p.z - cz;
      if (dx * dx + dz * dz + dy * dy * 0.5 < 1.1) this.collect(pc);
    }
    // first steps into each zone
    const zoneOf = (p) => (p.x < -11.4 ? 2 : p.x > 11.4 ? 3 : p.z > 11.4 ? 4 : 1);
    const z = zoneOf(player.pos);
    if (z > 1 && !TG.seen[z]) { TG.seen[z] = true; UI.toast(`${ZONE_NAMES[z]}에 왔어요 · 반짝이는 조각을 찾아봐요`, 2800); }
    if (G.phase === 'portal2' && G.time - (this.portalT || 0) > 2 && Math.hypot(player.pos.x - this.portal.position.x, player.pos.z - this.portal.position.z) < 0.9) { G.phase = 'leaving'; Story.run(() => this.enterPortal()); }
    if (G.phase === 'explore' && G.time - TG.lastProgress > 40) {
      TG.lastProgress = G.time;
      const next = PIECES.find((p) => p.tier === TG.tier && !TG.found[p.id]);
      if (next) UI.hint(next.hint, 6500);
      else if (this.tierIds().some((id) => !TG.placed[id])) UI.hint('모은 조각을 설계도 받침대로 가져가 조립해요', 6000);
    }
    if (!Input.anyMove && G.time > 6 && !this.moveHinted) { this.moveHinted = true; UI.hint(DEVICE.touch ? '화면 왼쪽 아래를 손가락으로 끌어 클라라를 움직여요' : 'WASD 또는 방향키로 클라라를 움직여요', 6000); }
  },
};
const NHOFF = 6;
