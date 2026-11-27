/* =====================================================================
   11 · MAIN — boot, renderer, adaptive resolution, the frame loop
   ===================================================================== */
const Perf = { dpr: 1, max: 2, min: 0.75, acc: 0, n: 0, cool: 3, quality: 'auto' };
const DEBUG = { timeScale: 1 };

function makeEnvironment() {
  const es = new THREE.Scene();
  const g = new THREE.SphereGeometry(10, 32, 16);
  const cols = [], P = g.attributes.position, top = new THREE.Color('#fff0dc'), mid = new THREE.Color('#e7b0b8'), bot = new THREE.Color('#3e121f');
  for (let i = 0; i < P.count; i++) { const y = P.getY(i) / 10; const c = y > 0 ? mid.clone().lerp(top, y) : mid.clone().lerp(bot, -y); cols.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  for (const [x, y, z, w, h, c] of [[0, 6, -8, 6, 3, [6, 5.2, 4.2]], [-8, 3, 4, 3, 4, [3, 2.3, 1.6]], [8, 4, 3, 3, 3, [4, 3, 2]], [0, 8, 6, 5, 2, [2.5, 2.4, 2.6]]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...c), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m);
  }
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(es, 0.03).texture;
  pm.dispose();
  return env;
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  const dprCap = Perf.quality === 'low' ? 1 : Perf.quality === 'high' ? Math.min(DEVICE.dpr, 2) : Math.min(DEVICE.dpr, Perf.max);
  if (Perf.quality !== 'auto' || !Perf.dpr) Perf.dpr = dprCap;
  Perf.dpr = Math.min(Perf.dpr, dprCap);
  renderer.setPixelRatio(Perf.dpr);
  renderer.setSize(w, h, false);
  const aspect = w / h;
  camera.aspect = aspect;
  camera.fov = aspect >= 1 ? 42 : lerp(58, 44, clamp((aspect - 0.45) / 0.55, 0, 1));
  Cam.zoom = aspect >= 1.2 ? 1 : aspect >= 1 ? 1.05 : 1 + (1 - aspect) * 0.62;
  camera.updateProjectionMatrix();
  Snow.applyView(); Sweet.applyView();
  const v = new THREE.Vector2(); renderer.getDrawingBufferSize(v);
  FX.uniforms.uScale.value = v.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
}
function setQuality(q) {
  Perf.quality = q;
  Perf.dpr = q === 'low' ? 1 : Math.min(DEVICE.dpr, q === 'high' ? 2 : Perf.max);
  resize();
}
function perfTick(dt) {
  if (Perf.quality !== 'auto' || G.mode === 'loading') return;
  Perf.acc += dt; Perf.n++;
  Perf.cool -= dt;
  if (Perf.n >= 60) {
    const avg = Perf.acc / Perf.n; Perf.acc = 0; Perf.n = 0;
    if (Perf.cool > 0) return;
    const cap = Math.min(DEVICE.dpr, Perf.max);
    if (avg > 1 / 42 && Perf.dpr > Perf.min) { Perf.dpr = Math.max(Perf.min, Perf.dpr - 0.2); resize(); Perf.cool = 2; }
    else if (avg < 1 / 57 && Perf.dpr < cap) { Perf.dpr = Math.min(cap, Perf.dpr + 0.1); resize(); Perf.cool = 4; }
  }
}

/* render each character's head into a round storybook portrait */
function makePortraits() {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#f7dfe4');
  studio.environment = scene.environment;
  studio.add(new THREE.HemisphereLight('#fff4ea', '#c99aa6', 1.6));
  const d = new THREE.DirectionalLight('#fff1e0', 2.2); d.position.set(-2, 3, 4); studio.add(d);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
  const shots = [
    ['clara', clara.root, [0, 1.36, 0], 1.55],
    ['nut', nut.root, [0, 1.52, 0], 2.1],
    ['prince', prince.root, [0, 1.64, 0], 1.8],
    ['fairy', fairyBig.root, [0, 1.5, 0], 1.7],
    ['king', king.root, [0, 1.5, 0.15], 2.4],
  ];
  const S = 256, out = {};
  const cv = document.createElement('canvas'); cv.width = S; cv.height = S;
  const c2 = cv.getContext('2d');
  const size = new THREE.Vector2(); renderer.getDrawingBufferSize(size);
  const pr = renderer.getPixelRatio();
  for (const [key, obj, look, dist] of shots) {
    const parent = obj.parent, pos = obj.position.clone(), rot = obj.rotation.y, scl = obj.scale.clone(), vis = obj.visible;
    studio.add(obj); obj.position.set(0, 0, 0); obj.rotation.y = 0; obj.scale.setScalar(key === 'prince' ? 1.12 : 1); obj.visible = true;
    obj.updateMatrixWorld(true);
    cam.position.set(look[0] + 0.25, look[1] + 0.12, look[2] + dist); cam.lookAt(look[0], look[1] - 0.02, look[2]);
    renderer.setViewport(0, 0, S / pr, S / pr); renderer.setScissor(0, 0, S / pr, S / pr); renderer.setScissorTest(true);
    renderer.render(studio, cam);
    c2.clearRect(0, 0, S, S);
    c2.drawImage(renderer.domElement, 0, size.y - S, S, S, 0, 0, S, S);
    out[key] = cv.toDataURL('image/png');
    renderer.setScissorTest(false);
    parent.add(obj); obj.position.copy(pos); obj.rotation.y = rot; obj.scale.copy(scl); obj.visible = vis;
  }
  renderer.setViewport(0, 0, size.x / pr, size.y / pr);
  return out;
}
function snapshotRoom() {
  try {
    const cv = document.createElement('canvas'); cv.width = 640; cv.height = 400;
    const c2 = cv.getContext('2d');
    const prev = W.theatre.open; W.theatre.set(1);
    const cam = new THREE.PerspectiveCamera(38, 1.6, 0.1, 120);
    cam.position.set(0, 9.5, 21); cam.lookAt(0, 2.2, -2.5);
    const size = new THREE.Vector2(); renderer.getDrawingBufferSize(size);
    const pr = renderer.getPixelRatio(), w = Math.min(640, Math.floor(size.x)), h = Math.round(w * 400 / 640);   // render no wider than the canvas
    stageSnow.visible = false;
    renderer.setViewport(0, 0, w / pr, h / pr); renderer.setScissor(0, 0, w / pr, h / pr); renderer.setScissorTest(true);
    renderer.render(scene, cam);
    c2.drawImage(renderer.domElement, 0, size.y - h, w, h, 0, 0, 640, 400);
    renderer.setScissorTest(false); renderer.setViewport(0, 0, size.x / pr, size.y / pr);
    stageSnow.visible = true; W.theatre.set(prev);
    return cv.toDataURL('image/jpeg', 0.86);
  } catch (e) { return ''; }
}

/* ---------------- frame loop ---------------- */
let lastT = 0;
function frame(now) {
  const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016);
  lastT = now;
  FX.uniforms.uTime.value += dt;
  if (Input.consume('pause') && G.mode !== 'title' && G.mode !== 'clear' && G.mode !== 'loading') { if (G.mode === 'build') Build.exit(); else Story.togglePause(); }
  const steps = DEBUG.timeScale | 0 || 1;
  for (let i = 0; i < steps; i++) {
    if (G.mode !== 'paused') {
      Tasks.update(dt);
      gameUpdate(dt);
    }
    UI.updateDialog(dt);
    Cam.update(dt);
    FX.add.update(dt); FX.norm.update(dt);
  }
  renderer.render(scene, camera);
  perfTick(dt);
}

function gameUpdate(dt) {
  const jump = Input.consume('jump'), act = Input.consume('act');
  if (UI.dlg.open) { if (jump || act) UI.advance(); }
  else if (G.mode === 'play' && !G.locked) {
    if (jump) player.jumpBuf = 0.15;
    if (act) {
      if (Story.near) Story.interact(Story.near);
      else if (G.combat) throwSlipper();
      else pirouette();
    }
  }
  if (G.mode === 'play' || G.mode === 'cutscene') G.time += G.mode === 'play' ? dt : 0;
  if (G.chapter === 5) { Palace.update(dt); return; }
  if (G.chapter === 3) { Snow.update(dt); return; }
  if (G.chapter === 4) {
    updatePlayer(dt);
    updateCompanion(dt);
    Sweet.update(dt);
    Story.tick(dt);
    return;
  }
  if (G.chapter === 2) {
    Toy.prePhysics(dt);
    updatePlayer(dt);
    updateCompanion(dt);
    Toy.update(dt);
    Story.tick(dt);
    return;
  }
  updatePlayer(dt);
  updateCompanion(dt);
  updateProps(dt);
  updateMice(dt);
  updateSoldiers(dt);
  updateKing(dt);
  updateSlippers(dt);
  starSet.update(dt);
  Story.tick(dt);
  if (fairyBig.root.visible) fairyBig.update(dt, 0, false, 0);
  W.lights.spot.position.set(player.pos.x, 10, player.pos.z + 3.5);
  W.lights.spot.target.position.set(player.pos.x, player.pos.y, player.pos.z);
}

/* ---------------- boot ---------------- */
async function boot(hot) {
  UI.init();
  DanceUI.init();
  Input.init();
  Save.load(hot);
  UI.setLoading(0.05, '무대를 준비하고 있어요…');
  await nextFrame();
  renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true, powerPreference: 'high-performance', stencil: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  MAX_ANISO = renderer.capabilities.getMaxAnisotropy();
  Perf.max = DEVICE.mobile ? 1.6 : 2;
  Perf.quality = Save.data.quality || 'auto';
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 140);
  resize();
  UI.setLoading(0.15, '손으로 그린 벽지와 양탄자를 칠하는 중…');
  await nextFrame();
  buildTextures();
  buildMaterials();
  scene.background = TEX.bg;
  UI.setLoading(0.4, '크리스마스 저택을 세우는 중…');
  await nextFrame();
  scene.environment = makeEnvironment();
  for (const [m, k] of [[MAT.gold, 1.0], [MAT.gloss, 0.7], [MAT.porcelain, 0.55], [MAT.wood, 0.35], [MAT.satin, 0.45], [MAT.ornament, 1.0], [MAT.starGold, 0.9], [MAT.mirror, 1.0], [MAT.marble, 0.5], [MAT.floor, 0.3], [MAT.gifts, 0.3], [MAT.blocks, 0.4]]) m.envMapIntensity = k;
  FX.add = new Particles(DEVICE.mobile ? 420 : 640, true);
  FX.norm = new Particles(DEVICE.mobile ? 160 : 240, false);
  const root1 = new THREE.Group(); root1.name = 'mansion'; scene.add(root1);
  W = buildMansion(root1); W.root = root1; World.W1 = W;
  scene.add(FX.add.points, FX.norm.points);
  UI.setLoading(0.65, '클라라와 호두까기 인형을 깨우는 중…');
  await nextFrame();
  createActors();
  Story.setup();
  applyMood(0);
  UI.setLoading(0.82, '조명을 맞추는 중…');
  await nextFrame();
  renderer.shadowMap.needsUpdate = true;
  // compile every shader now (including hidden actors) so nothing stutters when they first appear
  const hiddenNow = [];
  scene.traverse((o) => { if (o.visible === false) { hiddenNow.push(o); o.visible = true; } });
  try { renderer.compile(scene, camera); } catch (e) { /* compile lazily */ }
  hiddenNow.forEach((o) => { o.visible = false; });
  UI.portraits = makePortraits();
  Story.roomShot = snapshotRoom();
  renderer.shadowMap.needsUpdate = true;
  UI.setLoading(1, '막이 오릅니다');
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  renderer.setAnimationLoop(frame);
  await new Promise((r) => setTimeout(r, 250));
  Story.toTitle(true);
  window.__nut = {
    G, player, Cam, Story, Input, UI, comp, K, Tasks, mice, soldiers, flags, Perf, DEBUG, applyMood, setQuality, spawnMouse, killMouse, hitKing, throwSlipper, Toy, Build, TG, World, Save, Sound, Snow, Rhythm, SNOW_CFG, Dance, DanceMusic, Corps, MediaStore, SNOW_DANCE, DANCE_PLAN, FORM,
    Sweet, Recital, SWEET_CFG, SWEET, REHEARSAL_GAMES, DANCE_ORDER, stageToWorld, MAT4,
    Palace, PALACE_CFG, NATION_STEP, MAT5, PalaceShow,
    get W() { return W; }, get clara() { return clara; }, get nut() { return nut; }, get king() { return king; }, get prince() { return prince; },
    get fairyBig() { return fairyBig; }, get portal() { return portal; }, get magicSnow() { return magicSnow; }, get starSet() { return starSet; }, get renderer() { return renderer; }, get camera() { return camera; }, get scene() { return scene; },
  };
}

function start(hot) {
  boot(hot || {}).catch((e) => showError(e));
}
function showError(e) {
  console.error(e);
  const el = $('error'); if (!el) return;
  $('errorText').textContent = '3D 무대를 여는 중 문제가 생겼어요. 브라우저가 WebGL을 지원하는지 확인한 뒤 다시 불러와 주세요. (' + (e && e.message ? e.message : e) + ')';
  el.hidden = false; $('screenLoading').hidden = true;
  $('btnReload').onclick = () => location.reload();
}
if (!window.THREE) showError(new Error('three.js를 불러오지 못했어요'));
else if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
else start((window.claude && window.claude.hot && window.claude.hot.data) || {});
