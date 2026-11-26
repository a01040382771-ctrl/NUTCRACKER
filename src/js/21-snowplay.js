/* =====================================================================
   21 · CHAPTER III — the Snowflake Forest: a fairy, a waltz, a path that opens
   ===================================================================== */
const _sa = V3(), _sb = V3(), _sc = V3(), _sd = V3();

/* one portrait for a character that is built after boot (see makePortraits in the main file) */
function portraitOf(obj, look, dist) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#e4eefb');
  studio.environment = scene.environment;
  studio.add(new THREE.HemisphereLight('#fff4ea', '#a9b8d8', 1.6));
  const d = new THREE.DirectionalLight('#fff1e0', 2.2); d.position.set(-2, 3, 4); studio.add(d);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
  const S = 256, cv = makeCanvas(S, S), c2 = cv.getContext('2d');
  const size = new THREE.Vector2(); renderer.getDrawingBufferSize(size);
  const pr = renderer.getPixelRatio();
  const parent = obj.parent, pos = obj.position.clone(), rot = obj.rotation.y, scl = obj.scale.clone(), vis = obj.visible;
  studio.add(obj); obj.position.set(0, 0, 0); obj.rotation.y = 0; obj.scale.setScalar(1); obj.visible = true; obj.updateMatrixWorld(true);
  cam.position.set(look[0] + 0.25, look[1] + 0.12, look[2] + dist); cam.lookAt(look[0], look[1] - 0.02, look[2]);
  renderer.setViewport(0, 0, S / pr, S / pr); renderer.setScissor(0, 0, S / pr, S / pr); renderer.setScissorTest(true);
  renderer.render(studio, cam);
  c2.drawImage(renderer.domElement, 0, size.y - S, S, S, 0, 0, S, S);
  renderer.setScissorTest(false);
  if (parent) parent.add(obj);
  obj.position.copy(pos); obj.rotation.y = rot; obj.scale.copy(scl); obj.visible = vis;
  renderer.setViewport(0, 0, size.x / pr, size.y / pr);
  return cv.toDataURL('image/png');
}

const Snow = {
  W: null, fog: null, bg: null, shot: '', loading: null, fairy: null, blob: null, N: 0,
  fs: 0, goalS: 0, sp: 0, goal: [], cur: [], lampOn: [], opened: 0, perfectRun: 0, followCam: false, viewK: 0, pct: 0, final: null, hits: 0,

  /* ---------- build the stage once, the first time the chapter opens ---------- */
  ensure() {
    if (this.W) return Promise.resolve();
    if (!this.loading) this.loading = this.buildAll();
    return this.loading;
  },
  async buildAll() {
    const L = $('screenLoading');
    L.style.transition = 'none'; L.style.opacity = '1'; L.hidden = false;
    UI.setLoading(0.1, '눈송이의 숲을 꾸미는 중…');
    await nextFrame(); await nextFrame();
    buildSnowTextures(); buildSnowMaterials();
    this.N = Rhythm.chart().notes.length;
    UI.setLoading(0.35, '눈 덮인 소나무를 심는 중…');
    await nextFrame();
    const root = new THREE.Group(); root.name = 'snowland'; root.visible = false; scene.add(root);
    this.W = buildSnowland(root, this.N);
    this.fairy = buildSnowFairy(); this.fairy.root.visible = false; root.add(this.fairy.root);
    this.blob = makeBlob(0.42); this.blob.visible = false; root.add(this.blob);
    UI.setLoading(0.6, '눈송이 무용수들이 준비하는 중…');
    await nextFrame();
    Dance.build(this.W);
    this.fog = new THREE.Fog('#c9d4f1', 26, 96);
    this.bg = new THREE.Color('#101a4a');
    UI.setLoading(0.8, '눈꽃 요정을 깨우는 중…');
    await nextFrame();
    // compile every shader now so nothing hitches when the forest first appears
    const roots = [World.W1.root, Toy.W && Toy.W.root, root].filter(Boolean), was = roots.map((r) => r.visible);
    roots.forEach((r) => { r.visible = r === root; });
    const hidden = []; root.traverse((o) => { if (o.visible === false && o !== root) { hidden.push(o); o.visible = true; } });
    const fog0 = scene.fog; scene.fog = this.fog;
    try { renderer.compile(scene, camera); } catch (e) { /* compile lazily */ }
    hidden.forEach((o) => { o.visible = false; });
    scene.fog = fog0; roots.forEach((r, i) => { r.visible = was[i]; });
    try { UI.portraits.snowfairy = portraitOf(this.fairy.root, [0, 1.5, 0], 1.7); } catch (e) { /* the narrator star is used instead */ }
    UI.setLoading(1, '막이 오릅니다');
  },

  /* ---------- chapter flow ---------- */
  async start() {
    RUN_ID++; Tasks.clear(); UI.closeDialog();
    ['screenTitle', 'screenMap', 'screenClear', 'screenPause', 'build', 'rhythm'].forEach((id) => UI.hide(id));
    G.mode = 'loading'; G.locked = true;
    UI.hide('hud'); UI.hide('controls'); UI.prompt(null);
    Sound.stopMusic(0.6);
    Toy.leave(); Sweet.leave();
    const fresh = !this.W;
    if (fresh) await this.ensure(); else await UI.fade(1, 0.4);
    RUN_ID++;
    World.use(3);
    this.reset();
    G.mode = 'cutscene';
    const L = $('screenLoading');
    if (!L.hidden) { L.style.transition = 'opacity .8s ease'; L.style.opacity = '0'; setTimeout(() => { L.hidden = true; }, 820); }
    UI.fade(0, 1.0);
    Story.run(() => this.intro());
  },
  leave() {
    if (!this.W) return;
    Rhythm.stop();
    Dance.stop();
    UI.hide('rhythm');
    this.viewK = 0; camera.clearViewOffset();
    this.fairy.root.visible = false; this.blob.visible = false; this.followCam = false;
    clara.root.visible = true; blobs.clara.visible = true;
    UI.setChapterHud('제1장', '크리스마스 저택', 'i-star'); // the hidden HUD goes back to its first-chapter look
    Input.clear();
  },
  reset() {
    const W3 = this.W, N = this.N;
    Object.assign(G, { phase: 'none', stars: 0, time: 0, throws: 0, combat: false, markerAt: null });
    Rhythm.stop();
    Dance.reset();
    this.goal = new Array(N).fill(0); this.cur = new Array(N).fill(0); this.lampOn = new Array(W3.lampTile.length).fill(false);
    this.opened = 0; this.perfectRun = 0; this.final = null; this.pct = 0; this.sp = 0; this.shown = 0; this.holdActors = false; this.hits = 0;
    W3.resetPath();
    this.fs = this.goalS = W3.lead + 0.3;
    this.followCam = false; this.setView(0);
    comp.mode = 'off'; comp.hold = false; nut.root.visible = false;
    clara.a.action = null; clara.setExpr('smile'); clara.root.visible = true; blobs.clara.visible = true;
    prince.root.visible = true; prince.root.scale.setScalar(1.12); blobs.nut.visible = true; blobs.nut.scale.setScalar(0.85);
    fairyBig.root.visible = false;
    this.fairy.root.visible = false; this.blob.visible = false; this.fairy.root.scale.setScalar(1);
    UI.setChapterHud('제3장', '눈송이의 숲', 'i-snow', N); UI.setStars(0);
    $('hud').classList.remove('cine'); UI.prompt(null);
    this.placeActors(0.016);
    this.camGoal(_sc, _sd); Cam.set([_sc.x, _sc.y, _sc.z], [_sd.x, _sd.y, _sd.z]);
    FX.add.clear(); FX.norm.clear();
  },
  keyHint(arrows) {
    const ARROW = { ArrowLeft: '←', ArrowDown: '↓', ArrowUp: '↑', ArrowRight: '→' };
    const k = (SNOW_CFG.keys[SNOW_CFG.lanes] || []).map((c) => (arrows ? ARROW[c[1]] : (c[0] || '').replace('Key', ''))).filter(Boolean);
    return k.join(' · ');
  },
  /* controls line for the pause menu (the walking controls of the other chapters do not apply here) */
  helpText() {
    if (DEVICE.touch) return '눈송이가 빛나는 원에 닿을 때 그 줄을 톡 눌러요 · 박자에 맞을수록 숲길이 환하게 열려요';
    const ar = this.keyHint(true);
    return `눈송이가 원에 닿을 때 줄 키 ${this.keyHint()}${ar ? ` (또는 ${ar})` : ''} · 화면 터치도 돼요 · 일시정지 Esc`;
  },
  async intro() {
    const W3 = this.W, f = this.fairy;
    Sound.playMusic('title');
    const p0 = W3.P(W3.lead), t0 = W3.T(W3.lead), tl = Math.hypot(t0.x, t0.z) || 1, ux = t0.x / tl, uz = t0.z / tl;
    /* opening shot: high behind the two of them, looking up the lamp-lined path; centred so it frames them on a tall phone screen as well as a wide one */
    Cam.set([p0.x - ux * 14, 10, p0.z - uz * 14], [p0.x + ux * 3, 1, p0.z + uz * 3]);
    UI.chapterCard('Chapter III', '눈송이의 숲', true);
    this.camGoal(_sc, _sd);
    const from = Cam.pos.clone(), fromT = Cam.target.clone(), toP = _sc.clone(), toT = _sd.clone();
    tween(4.4, (k) => { Cam.pos.lerpVectors(from, toP, k); Cam.target.lerpVectors(fromT, toT, k); }, Ease.inOut);
    await guard(wait(3.4));
    await guard(UI.say('narrator', '별의 문을 지나자 은빛 눈이 소복소복 쌓인 숲이 나타났어요. 숲길은 눈 속에 폭 파묻혀 보이지 않았지요.'));
    this.placeActors(0.016);
    f.root.visible = true; this.blob.visible = true; f.root.scale.setScalar(0.01);
    Sound.sfxTransform();
    const fp = W3.P(this.fs);
    burst(fp.x, 1.2, fp.z, { n: 34, speed: 3.2, g: -0.4, cell: CELL.snow, colors: ['#ffffff', '#cfe8ff', '#e8f2ff'], size: 1.3 });
    await guard(tween(1.1, (k) => f.root.scale.setScalar(Math.max(0.01, Ease.outBack(k))), Ease.linear));
    f.play('curtsy', 1.4);
    await guard(UI.say('snowfairy', '어서 와요, 클라라! 저는 눈꽃 요정이에요. 이 숲의 길을 지키고 있답니다.'));
    await guard(UI.say('snowfairy', '눈송이 왈츠가 시작되면 길이 열리는데, 오늘은 눈이 너무 많이 내려서 길이 모두 묻혀 버렸어요. 길을 열어 주시겠어요?'));
    clara.setExpr('happy', 2);
    await guard(UI.say('clara', '물론이지! 그런데 어떻게 하면 돼?'));
    await guard(UI.say('snowfairy', DEVICE.touch ? '눈송이가 내려와서 빛나는 원에 닿을 때, 그 줄을 톡! 눌러 주세요. 박자에 맞을수록 길이 환하게 열려요.' : `눈송이가 내려와서 빛나는 원에 닿을 때, 그 줄의 키(${this.keyHint()})를 눌러 주세요. 화면을 눌러도 돼요. 박자에 맞을수록 길이 환하게 열려요.`));
    await guard(UI.say('prince', '틀려도 걱정 말아요. 왈츠는 끝까지 이어지니까요.'));
    await this.beginRhythm();
  },
  async beginRhythm() {
    Sound.stopMusic(0.8);
    G.mode = 'play'; G.locked = true; G.phase = 'rhythm';
    $('hud').classList.remove('cine'); UI.show('hud'); UI.hide('controls');
    UI.show('rhythm');
    this.followCam = true; Cam.mode = 'free';
    tween(0.7, (k) => this.setView(k), Ease.inOut);
    UI.setObjective(this.objectiveText(0));
    const goal = `눈송이 ${SNOW_CFG.gateNeed}개를 모으면 문이 열려요`;
    UI.hint(DEVICE.touch ? `눈송이가 빛나는 원에 닿을 때 그 줄을 눌러요 · ${goal}` : `눈송이가 빛나는 원에 닿을 때 ${this.keyHint()} 키 (또는 화면 터치) · ${goal}`, 5200);
    await Rhythm.start({ onJudge: (n, r) => this.onJudge(n, r), onEnd: () => Story.run(() => this.finale()) });
  },

  /* ---------- the path opens as the waltz is played ---------- */
  setOpen(i, v) {
    this.goal[i] = v;
    let sum = 0; for (let k = 0; k < this.goal.length; k++) sum += this.goal[k];
    this.opened = sum;
  },
  tilePos(i, out) { const t = this.W.tile[i]; return out.set(t.x, 0, t.z); },
  onJudge(n, rating) {
    const i = n.i, p = this.tilePos(i, _sa);
    if (rating !== 'miss') this.hits++;
    if (rating === 'perfect') {
      this.setOpen(i, 1); this.perfectRun++;
      this.W.setPrints(i, true);
      burst(p.x, 0.5, p.z, { n: 7, speed: 2.6, g: -0.6, cell: CELL.snow, colors: ['#ffffff', '#d9ecff'], size: 1.1 });
      burst(p.x, 0.6, p.z, { n: 12, speed: 2.4, colors: ['#ffffff', '#cfe8ff', '#fff1c8'] });
      if (this.perfectRun % 6 === 0 && !this.fairy.a.action) this.fairy.play('spin', 0.9);
    } else if (rating === 'good') {
      this.setOpen(i, 0.5); this.perfectRun = 0;
      burst(p.x, 0.4, p.z, { n: 6, speed: 1.8, colors: ['#cfe8ff', '#ffffff'] });
    } else {
      this.perfectRun = 0;
      puff(p.x, 0.3, p.z, { n: 4, size: 0.5, colors: ['#e8f0ff', '#ffffff'] });
    }
    this.goalS = this.W.sTile(i);
    const shown = this.caught();
    UI.setObjective(this.objectiveText(shown), false);
    if (shown !== this.shown) { this.shown = shown; UI.setStars(shown); }
  },

  /* ---------- per frame ---------- */
  update(dt) {
    const W3 = this.W; if (!W3) return;
    const t = FX.uniforms.uTime.value;
    Rhythm.update(dt);
    if (Dance.active) Dance.update(dt);    // the snowflakes' waltz places and poses everyone itself
    else if (!this.holdActors) {
      // the fairy glides towards the tile of the last snowflake; Clara and the prince follow her
      const d = this.goalS - this.fs, step = Math.sign(d) * Math.min(Math.abs(d), (3.6 + Math.abs(d) * 2) * dt);
      this.fs += step;
      this.sp = damp(this.sp, Math.min(1, Math.abs(step) / Math.max(dt, 1e-4) / 3.2), 8, dt);
      this.placeActors(dt);
    }
    // tiles ease towards their target, lanterns light beside opened tiles
    for (let i = 0; i < this.N; i++) {
      const g = this.goal[i], c = this.cur[i];
      if (Math.abs(g - c) > 0.002) { const n = Math.abs(g - c) < 0.01 ? g : c + (g - c) * Math.min(1, dt * 9); this.cur[i] = n; W3.setTile(i, n); }
    }
    for (let j = 0; j < W3.lampTile.length; j++) { const on = this.goal[W3.lampTile[j]] >= 0.5; if (on !== this.lampOn[j]) { this.lampOn[j] = on; W3.setLamp(j, on); } }
    // sky and snow travel with the camera
    W3.sky.position.set(camera.position.x, 0, camera.position.z);
    W3.snowField.position.set(camera.position.x, 0, camera.position.z);
    if (W3.gate.open > 0.02 && Math.random() < dt * 14) { const g = W3.gate.group; _sb.set((Math.random() - 0.5) * 3.6, 0.3 + Math.random() * 3.6, 0.6); g.localToWorld(_sb); FX.add.spawn({ x: _sb.x, y: _sb.y, z: _sb.z, vy: 0.5, life: 1.2, size: 0.28, size1: 0, color: pick(['#ffd6e6', '#fff1c8', '#ffffff']), cell: CELL.sparkle, rot: rnd(0, 3) }); }
    if (!Dance.active) this.fairy.root.position.y = 0.3 + Math.sin(t * 1.6) * 0.05;
    if (this.followCam) this.updateCamera(dt);
  },
  placeActors(dt) {
    const W3 = this.W, fs = this.fs;
    const pf = W3.P(fs, _sa), tf = W3.T(fs, _sb), yaw = Math.atan2(tf.x, tf.z), f = this.fairy;
    f.root.position.x = pf.x; f.root.position.z = pf.z; f.root.rotation.y = yaw;
    f.update(dt, this.sp, true, 0);
    this.blob.position.set(pf.x, 0.02, pf.z);
    for (const [doll, off, lat, blob] of [[clara, 3.0, -0.55, blobs.clara], [prince, 4.5, 0.6, blobs.nut]]) {
      const p = W3.P(Math.max(0, fs - off), _sa), t = W3.T(Math.max(0, fs - off), _sb);
      const x = p.x - t.z * lat, z = p.z + t.x * lat;
      doll.root.position.set(x, 0, z); doll.root.rotation.y = Math.atan2(t.x, t.z);
      doll.update(dt, this.sp, true, 0);
      blob.position.set(x, 0.02, z);
    }
  },
  camGoal(pos, look) {
    const W3 = this.W, a = W3.P(Math.max(0, this.fs - 9.4), _sa), b = W3.P(this.fs + 2.2, _sb);
    pos.set(a.x, 4.5, a.z); look.set(b.x, 1.25, b.z);
  },
  updateCamera(dt) {
    this.camGoal(_sc, _sd);
    Cam.pos.x = damp(Cam.pos.x, _sc.x, 3.4, dt); Cam.pos.y = damp(Cam.pos.y, _sc.y, 3.4, dt); Cam.pos.z = damp(Cam.pos.z, _sc.z, 3.4, dt);
    Cam.target.x = damp(Cam.target.x, _sd.x, 4.2, dt); Cam.target.y = damp(Cam.target.y, _sd.y, 4.2, dt); Cam.target.z = damp(Cam.target.z, _sd.z, 4.2, dt);
  },
  /* the 3D view is shifted so the forest stays visible above the lanes (portrait) or beside them (landscape) */
  setView(k) {
    this.viewK = k;
    const w = window.innerWidth, h = window.innerHeight;
    if (k <= 0.001) { camera.clearViewOffset(); return; }
    if (h > w * 1.1) camera.setViewOffset(w, h, 0, Math.round(h * 0.17 * k), w, h);
    else if (w >= 760) camera.setViewOffset(w, h, Math.round(w * 0.1 * k), 0, w, h);
    else camera.clearViewOffset();
  },
  applyView() { if (G.chapter === 3) this.setView(this.viewK); },
  onPause(on) { if (Dance.onPause(on)) return; if (!Rhythm.running) return; if (on) Rhythm.pause(); else Rhythm.resume(); },
  toWorld(lx, ly, lz, out) {
    const g = this.W.gate.group, c = Math.cos(g.rotation.y), s = Math.sin(g.rotation.y);
    return out.set(g.position.x + lx * c + lz * s, g.position.y + ly, g.position.z - lx * s + lz * c);
  },

  /* ---------- after the waltz: first the snowflakes' corps de ballet, then the finale (the fairy spins, the whole path lights up, the gate opens) ---------- */
  async finale() {
    const W3 = this.W, N = this.N, f = this.fairy;
    G.phase = 'finale'; G.mode = 'cutscene'; G.locked = true;
    this.followCam = false;
    UI.hide('rhythm'); $('hud').classList.add('cine'); UI.prompt(null);
    this.pct = Math.round((this.opened / N) * 100);
    const st = Rhythm.stats; this.final = { perfect: st.perfect, good: st.good, miss: st.miss };
    if (!this.passes()) return this.shortOfGate();   // not enough snowflakes: the gate stays shut
    tween(0.8, (k) => this.setView(1 - k), Ease.inOut);
    // 1. as the waltz fades, the snow fairy invites everyone to the clearing before the gate
    DanceMusic.preload();   // a recording kept on this device starts decoding now, while she speaks
    const fp0 = W3.P(this.fs, _sa).clone(), c0 = W3.P(Math.max(0, this.fs - 7.5), _sb).clone();
    await guard(Cam.to([c0.x, 3.6, c0.z], [fp0.x, 1.5, fp0.z], 1.1));
    f.play('curtsy', 1.4);
    await guard(UI.say('snowfairy', '들어 보세요, 클라라. 왈츠 소리에 숲의 눈송이들이 모두 깨어났어요!'));
    await guard(UI.say('snowfairy', '길을 열어 준 답례로 눈송이들의 왈츠를 보여 드릴게요. 문 앞 빈터로 가요!'));
    // 2. the snowflakes' waltz: a corps de ballet in the clearing (before the finale)
    G.phase = 'dance';
    await guard(Dance.perform());
    G.phase = 'finale';
    // 3. the finale: everyone strolls back onto the path while the camera finds the fairy; she spins and the whole path lights up
    this.fs = this.goalS = W3.gateS - SNOW_DANCE.stage.back - 1.2;
    const dolls = [clara, prince, f], from = dolls.map((d) => d.root.position.clone()), fromYaw = dolls.map((d) => d.root.rotation.y);
    this.holdActors = true; this.sp = 0.5;
    tween(1.4, (k) => {
      this.placeActors(0.016);
      dolls.forEach((d, i) => { d.root.position.lerpVectors(from[i], d.root.position, k); d.root.rotation.y = fromYaw[i] + angleDiff(fromYaw[i], d.root.rotation.y) * k; });
      blobs.clara.position.set(clara.root.position.x, 0.02, clara.root.position.z); blobs.nut.position.set(prince.root.position.x, 0.02, prince.root.position.z); this.blob.position.set(f.root.position.x, 0.02, f.root.position.z);
    }, Ease.inOut).then(() => { this.holdActors = false; this.sp = 0; });
    const fp = W3.P(this.fs, _sa).clone();
    const camTo = W3.P(Math.max(0, this.fs - 16), _sb).clone();
    await guard(Cam.to([camTo.x, 8.5, camTo.z], [fp.x, 1.6, fp.z], 1.4));
    f.play('spin', 2.4); Sound.sfxTransform();
    let sweep = 0;
    await guard(tween(2.2, (k) => {
      if (Math.random() < 0.9) { const a = k * 18 + Math.random() * 6, r = 0.5 + Math.random() * 1.1; FX.add.spawn({ x: fp.x + Math.cos(a) * r, y: 0.5 + k * 2.2 + Math.random() * 0.6, z: fp.z + Math.sin(a) * r, vy: 0.6, life: 1.1, size: 0.34, size1: 0, color: pick(['#ffffff', '#cfe8ff', '#fff1c8']), cell: CELL.snow, rot: rnd(0, 3), vr: rnd(5, 9) }); }
      const upto = Math.floor(k * N);
      while (sweep <= upto && sweep < N) { if (this.goal[sweep] < 1) this.setOpen(sweep, 1); sweep++; }
    }, Ease.linear));
    await guard(UI.say('narrator', '눈송이들이 다시 눈발이 되어 흩날리자, 숲길 끝까지 환한 등불이 줄지어 켜졌어요.'));
    const gc = this.toWorld(-5.5, 3.0, -11, _sb).clone(), gl = this.toWorld(0, 2.6, 0, _sc).clone();
    await guard(Cam.to([gc.x, gc.y, gc.z], [gl.x, gl.y, gl.z], 1.5));
    Sound.sfxGate();
    await guard(tween(2.0, (k) => W3.gate.set(k), Ease.inOut));
    clara.setExpr('surprised', 2);
    await guard(UI.say('snowfairy', '고마워요, 클라라! 이제 숲 끝까지 길이 환하게 열렸어요.'));
    await guard(UI.say('snowfairy', '저 문 너머에서 달콤한 향기가 나지요? 사탕과 초콜릿이 반겨 주는 과자의 왕국으로 가는 길이에요.'));
    await guard(UI.say('prince', '함께 가요, 클라라. 이야기는 아직 끝나지 않았어요.'));
    this.followCam = true; this.goalS = W3.gateS + 4;
    Sound.playMusic('waltz');
    await guard(wait(3.4));
    await guard(UI.fade(1, 1.0));
    Sound.sfxFanfare();
    UI.hide('hud');
    clara.root.visible = false; prince.root.visible = false; f.root.visible = false; blobs.clara.visible = false; blobs.nut.visible = false; this.blob.visible = false;
    this.followCam = false;
    const gp = this.toWorld(-14, 9.5, -22, _sb).clone(), gt = this.toWorld(0, 2.2, 6, _sc).clone();
    Cam.set([gp.x, gp.y, gp.z], [gt.x, gt.y, gt.z]);
    this.shot = this.snapshot();
    await guard(UI.fade(0, 1.0));
    this.clear();
  },
  /* ---------- the gate: enough snowflakes caught (a perfect and a good one each count one) ---------- */
  caught() { return this.hits; },
  passes() { return this.caught() >= SNOW_CFG.gateNeed; },
  objectiveText(shown) {
    const need = SNOW_CFG.gateNeed;
    return shown >= need ? `문이 열릴 만큼 모았어요 · ${shown}개` : `숲길을 열고 있어요 · ${shown} / ${need}개면 문이 열려요`;
  },
  /* not enough: the fairy says so, the gate stays shut, and the result card offers another try */
  async shortOfGate() {
    const need = SNOW_CFG.gateNeed, caught = this.caught(), N = this.N, st = this.final;
    tween(0.8, (k) => this.setView(1 - k), Ease.inOut);
    const gc = this.toWorld(-5.5, 3.0, -11, _sb).clone(), gl = this.toWorld(0, 2.6, 0, _sc).clone();
    await guard(Cam.to([gc.x, gc.y, gc.z], [gl.x, gl.y, gl.z], 1.4));
    await guard(UI.say('snowfairy', `아, 눈송이가 ${caught}개뿐이네요. 문을 열려면 ${need}개를 모아야 해요.`));
    await guard(UI.say('snowfairy', '괜찮아요. 눈은 다시 내려와요. 한 번 더 해 볼까요?'));
    G.mode = 'clear'; G.locked = true;
    UI.hide('hud'); UI.hide('rhythm');
    this.retryCard = true;
    UI.clearCard({
      kicker: '제3장 · 다시 시도', title: '눈송이의 숲', icon: 'i-snow',
      stats: [['모은 눈송이', `${caught} / ${need}`], ['정확한 눈송이', `${st.perfect} / ${N}`], ['좋음 · 놓침', `${st.good} · ${st.miss}`]],
      unlock: `<b>문을 열려면 눈송이 ${need}개</b>가 필요해요.<br><span>${Math.max(1, need - caught)}개만 더 모으면 돼요.</span>`, next: true, nextLabel: '다시 시도',
    });
    UI.show('screenClear');
  },
  /* the same song again, from the start: the path is snowed in again and the counter is back to zero */
  retry() {
    if (!this.W) return;
    this.retryCard = false;
    RUN_ID++; Tasks.clear(); UI.closeDialog();
    ['screenClear', 'screenPause', 'screenMap', 'screenTitle'].forEach((id) => UI.hide(id));
    this.reset();
    this.fairy.root.visible = true; this.blob.visible = true;
    G.mode = 'cutscene'; G.locked = true;
    UI.fade(0, 0.6);
    Story.run(async () => {
      await guard(UI.say('snowfairy', '좋아요, 눈은 다시 내려와요. 이번에는 박자에 맞춰 눈송이를 모아 주세요!'));
      await this.beginRhythm();
    });
  },
  clear() {
    const N = this.N, fin = this.final || { perfect: 0, good: 0, miss: 0 };
    G.mode = 'clear'; G.locked = true;
    UI.hide('hud'); UI.hide('rhythm');
    const prev = Save.data.done.snow;
    Save.data.done.snow = { perfect: fin.perfect, good: fin.good, miss: fin.miss, total: N, opened: this.pct, best: Math.max(prev ? prev.best || 0 : 0, fin.perfect) };
    Save.data.unlocked = Math.max(Save.data.unlocked, 4);
    Save.write();
    this.retryCard = false;
    UI.clearCard({
      kicker: '제3장 · 이야기 끝', title: '눈송이의 숲', icon: 'i-snow',
      stats: [['열린 숲길', `${this.pct}%`], ['정확한 눈송이', `${fin.perfect} / ${N}`], ['좋음 · 놓침', `${fin.good} · ${fin.miss}`]],
      unlock: '<b>제4장 · 과자의 왕국</b>이 열렸어요!<br><span>세 나라의 춤 리허설을 도와 사탕 다리를 놓아 주세요.</span>', next: true, nextLabel: '제4장으로 떠나기',
    });
    UI.show('screenClear');
  },
  snapshot() {
    try {
      const cv = makeCanvas(640, 400), c2 = cv.getContext('2d');
      const cam = new THREE.PerspectiveCamera(40, 1.6, 0.1, 220), gp = this.toWorld(-12, 8.5, -20, _sa), gt = this.toWorld(0, 2.4, 4, _sb);
      cam.position.copy(gp); cam.lookAt(gt);
      const size = new THREE.Vector2(); renderer.getDrawingBufferSize(size);
      const pr = renderer.getPixelRatio(), w = 640, h = 400;
      camera.clearViewOffset();
      renderer.setViewport(0, 0, w / pr, h / pr); renderer.setScissor(0, 0, w / pr, h / pr); renderer.setScissorTest(true);
      renderer.render(scene, cam);
      c2.drawImage(renderer.domElement, 0, size.y - h, w, h, 0, 0, w, h);
      renderer.setScissorTest(false); renderer.setViewport(0, 0, size.x / pr, size.y / pr);
      return cv.toDataURL('image/jpeg', 0.86);
    } catch (e) { return ''; }
  },
};

/* leaving the page mid-song pauses the game, so the audio clock and the notes stop together */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden || G.chapter !== 3) return;
  if ((Rhythm.running && G.mode === 'play') || (Dance.running && G.mode === 'cutscene')) Story.pause();
});
