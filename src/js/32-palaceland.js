/* =====================================================================
   32 · CHAPTER V WORLD — a glass stage floating in the night sky before the Sugar Plum Palace
   ===================================================================== */
const _p5c = new THREE.Color(), _p5c2 = new THREE.Color(), _p5v = new THREE.Vector3(), _p5m = new THREE.Matrix4(), _p5q = new THREE.Quaternion(), _p5s = new THREE.Vector3();
const _p5up = new THREE.Vector3(0, 1, 0), _p5down = new THREE.Vector3(0, -1, 0);

function buildPalaceStage(root) {
  const S = PALACE_CFG.stage, R = S.radius;
  const W = { root, colliders: [], dyn: [], anim: [], beams: [], props: {}, lastBar: -1 };

  /* ---------------- sky: a gradient dome and the stars travel with the camera (the far plane is 140) ---------------- */
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uLow: { value: new THREE.Color() }, uGlowA: { value: new THREE.Color() }, uGlowB: { value: new THREE.Color() } },
    vertexShader: PSKY_VERT, fragmentShader: PSKY_FRAG, side: THREE.BackSide, depthWrite: false,
  });
  const skyRig = new THREE.Group(); root.add(skyRig);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(112, 48, 24), skyMat); sky.renderOrder = -10; sky.frustumCulled = false; skyRig.add(sky);
  const stars = [];
  for (let i = 0; i < (DEVICE.mobile ? 340 : 560); i++) {
    const a = rnd(0, TAU), y = Math.pow(rnd(0.03, 1), 0.65), r = Math.sqrt(1 - y * y);
    stars.push({ p: [Math.cos(a) * r * 100, y * 100, Math.sin(a) * r * 100], c: pick(['#ffffff', '#fff1d6', '#d8e6ff', '#ffd9ef']), s: rnd(0.28, 0.95), tw: rnd(0.3, 0.95) });
  }
  const starPts = makeGlowPoints(stars, { boost: 1 }); starPts.renderOrder = -9; skyRig.add(starPts);
  W.sky = { rig: skyRig, mat: skyMat };

  /* ---------------- aurora ribbons far behind the palace ---------------- */
  W.ribbons = [];
  for (let i = 0; i < 5; i++) {
    const geo = new THREE.PlaneGeometry(118, 10 + i * 1.6, 80, 1);
    const mat = new THREE.MeshBasicMaterial({ map: TEX.p5ribbon, color: '#ffffff', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false });
    const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = -6;
    m.position.set(rnd(-10, 10), 19 + i * 5.4, -84 + i * 5); m.rotation.set(-0.42 + i * 0.05, rnd(-0.12, 0.12), rnd(-0.16, 0.16));
    root.add(m);
    W.ribbons.push({ m, base: geo.attributes.position.array.slice(), ph: rnd(0, TAU), speed: rnd(0.22, 0.42), amp: rnd(2.6, 4.6) });
  }

  /* ---------------- the stage: a glass disc with a pointed sugar-crystal keel below it ---------------- */
  const stage = new THREE.Group(); root.add(stage); W.stage = stage;
  const top = new THREE.Mesh(new THREE.CircleGeometry(R, 160).rotateX(-Math.PI / 2), MAT5.floor); top.receiveShadow = true; stage.add(top);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.95, 0.9, 160, 1, true), MAT5.side); band.position.y = -0.45; stage.add(band);
  const keel = new THREE.Mesh(new THREE.ConeGeometry(R * 0.95, 9, 120, 1, true), MAT5.under); keel.rotation.x = Math.PI; keel.position.y = -0.9 - 4.5; stage.add(keel);
  for (const [r, y, t] of [[R + 0.05, 0.02, 0.15], [R * 0.95, -0.9, 0.1]]) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 10, 200), MAT5.gold); m.rotation.x = Math.PI / 2; m.position.y = y; stage.add(m); }
  {   // crystal drops hanging from the rim of the keel
    const nd = 84, drops = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.3, 0), MAT5.crystal, nd);
    for (let i = 0; i < nd; i++) {
      const a = (i / nd) * TAU, len = [2.8, 1.5, 2.1, 1.1][i % 4];
      _p5m.compose(_p5v.set(Math.cos(a) * R * 0.93, -1.05 - len * 0.32, Math.sin(a) * R * 0.93), _p5q.identity(), _p5s.set(0.5, len, 0.5)); drops.setMatrixAt(i, _p5m);
    }
    stage.add(drops);
  }

  /* light rings on the floor, and the ripple that runs out from the dais on every downbeat */
  const glowMat = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  W.rings = S.rings.map((r, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 6, 220), glowMat('#ffffff', 0.8)); m.rotation.x = Math.PI / 2; m.position.y = 0.04 + i * 0.002; stage.add(m); return m; });
  const rip = new THREE.Mesh(new THREE.RingGeometry(0.982, 1.0, 180).rotateX(-Math.PI / 2), glowMat('#ffffff', 0)); rip.position.y = 0.05; stage.add(rip);
  W.ripple = { m: rip, t: 9 };

  /* the dais in the middle */
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(S.dais, S.dais + 0.25, 0.34, 120), [MAT5.side, MAT5.dais, MAT5.side]); dais.position.y = 0.17; stage.add(dais);
  { const m = new THREE.Mesh(new THREE.TorusGeometry(S.dais + 0.02, 0.08, 8, 140), MAT5.gold); m.rotation.x = Math.PI / 2; m.position.y = 0.34; stage.add(m); }
  W.daisTop = 0.34;

  /* footlights round the rim */
  const foot = [];
  for (let i = 0; i < 64; i++) { const a = (i / 64) * TAU; foot.push({ p: [Math.cos(a) * (R - 0.35), 0.16, Math.sin(a) * (R - 0.35)], c: i % 2 ? '#fff2d8' : '#ffd8ee', s: 0.55, tw: 0.35 }); }
  W.footGlow = makeGlowPoints(foot, { boost: 0.9 }); stage.add(W.footGlow);

  /* ---------------- twelve sugar-crystal pillars floating round the stage ---------------- */
  const pGeo = new THREE.LatheGeometry([new THREE.Vector2(0.0, 0), new THREE.Vector2(0.64, 0.4), new THREE.Vector2(0.76, 1.3), new THREE.Vector2(0.7, 7.6), new THREE.Vector2(0.0, 10.4)], 6);
  const np = S.pillars, pillars = new THREE.InstancedMesh(pGeo, MAT5.crystal, np), cores = new THREE.InstancedMesh(pGeo, MAT5.core, np), tips = [], isle = new Batch(MAT5.palace);
  for (let i = 0; i < np; i++) {
    const a = (i / np) * TAU + TAU / (np * 2), tall = i % 2 ? 1.0 : 1.42, x = Math.cos(a) * S.pillarRing, z = Math.sin(a) * S.pillarRing, y = -3.4 + (i % 3) * 0.5;
    _p5q.setFromAxisAngle(_p5up, rnd(0, TAU));
    _p5m.compose(_p5v.set(x, y, z), _p5q, _p5s.set(tall * 0.95, tall, tall * 0.95)); pillars.setMatrixAt(i, _p5m);
    _p5m.compose(_p5v.set(x, y + 0.3, z), _p5q, _p5s.set(tall * 0.4, tall * 0.95, tall * 0.4)); cores.setMatrixAt(i, _p5m);
    pillars.setColorAt(i, _p5c.set('#ffffff'));
    tips.push({ p: [x, y + 10.4 * tall, z], c: '#ffffff', s: 4.5, tw: 0.4 });
    isle.add(GEO.sph(18, 10), i % 2 ? '#fbe8f3' : '#ece4fb', TRS(x, y - 0.2, z, 0, 0, 0, 2.3, 0.75, 2.3));
    isle.add(GEO.cone(14), '#cdb8e8', TRS(x, y - 1.6, z, Math.PI, 0, 0, 1.9, 2.6, 1.9));
  }
  cores.renderOrder = 3; pillars.renderOrder = 4;
  root.add(cores, pillars, isle.build({ cast: false }));
  W.pillars = pillars; W.cores = cores;
  W.tipGlow = makeGlowPoints(tips, { boost: 0.85 }); root.add(W.tipGlow);
  /* each pillar has a lit level (1 = as usual, 0 = dark, above 1 = blazing); act II lights them one by one */
  W.pillarBase = Array.from({ length: np }, () => new THREE.Color()); W.pillarK = new Float32Array(np).fill(1); W.pillarsDirty = false;
  W.applyPillars = () => {
    const tc = W.tipGlow.geometry.attributes.aColor;
    for (let i = 0; i < np; i++) {
      const k = W.pillarK[i];
      _p5c.copy(W.pillarBase[i]).multiplyScalar(0.4 + 0.6 * Math.min(1, k) + 0.35 * Math.max(0, k - 1)); pillars.setColorAt(i, _p5c);
      _p5c.copy(W.pillarBase[i]).lerp(_p5c2.set('#ffffff'), 0.45).multiplyScalar(0.08 + 0.92 * Math.min(1, k) + 0.6 * Math.max(0, k - 1)); tc.setXYZ(i, _p5c.r, _p5c.g, _p5c.b);
    }
    pillars.instanceColor.needsUpdate = true; tc.needsUpdate = true;
  };
  W.setPillar = (i, k) => { W.pillarK[i] = k; W.pillarsDirty = true; };
  W.setAllPillars = (k) => { W.pillarK.fill(k); W.pillarsDirty = true; };

  /* ---------------- the Sugar Plum Palace on a bank of cloud behind the stage ---------------- */
  {
    const PZ = -50, y0 = -4, b = new Batch(MAT5.palace), g = new Batch(MAT5.glass), win = [];
    for (let i = 0; i < 11; i++) b.add(GEO.sph(18, 12), i % 2 ? '#fbe6f2' : '#eee0fb', TRS(-27 + i * 5.4, y0 - 4 + rnd(-1, 1), PZ + rnd(-3, 5), 0, 0, 0, rnd(6.5, 9.5), rnd(2.6, 3.8), rnd(5, 7.5)));
    b.add(roundBox(28, 8, 9, 0.6, 2), '#f4cfe2', TRS(0, y0 + 4, PZ));
    b.add(GEO.box(), '#e6c477', TRS(0, y0 + 8.15, PZ, 0, 0, 0, 28.4, 0.36, 9.4));
    for (let i = 0; i < 12; i++) b.add(GEO.cyl(14), '#fff6fa', TRS(-12.65 + i * 2.3, y0 + 3.7, PZ + 4.65, 0, 0, 0, 0.42, 7.4, 0.42));
    const spire = (x, z, r, h, dome) => {
      b.add(GEO.cyl(22), '#f7dbea', TRS(x, y0 + 8 + h / 2, z, 0, 0, 0, r, h, r));
      b.add(GEO.torus(r * 1.03, 0.13, 6, 30), '#e6c477', TRS(x, y0 + 8 + h, z, Math.PI / 2, 0, 0));
      g.add(lathe([[r * 1.12, 0], [r * 1.4, r * 0.7], [r * 0.96, r * 1.6], [r * 0.32, r * 2.45], [0, r * 3.1]], 26, 14), dome, TRS(x, y0 + 8 + h, z));
      b.add(GEO.cone(10), '#f0cf7c', TRS(x, y0 + 8 + h + r * 3.1 + 0.9, z, 0, 0, 0, 0.17, 1.9, 0.17));
      for (let k = 0; k < 3; k++) win.push({ p: [x, y0 + 8 + h * (0.28 + k * 0.22), z + r * 1.01], c: '#ffd9a0', s: 1.1, tw: 0.25 });
    };
    spire(0, PZ, 3.1, 15, '#ffb3d8');
    for (const sx of [-1, 1]) { spire(sx * 8.8, PZ + 0.6, 1.95, 9.5, '#c2d8ff'); spire(sx * 15.2, PZ + 1.5, 1.35, 5.8, '#ffe0aa'); }
    for (let i = 0; i < 13; i++) win.push({ p: [-12 + i * 2, y0 + 4.6, PZ + 4.75], c: '#ffd6a0', s: 1.0, tw: 0.3 });
    root.add(b.build({ cast: false }), g.build({ cast: false }));
    W.palaceGlow = makeGlowPoints(win, { boost: 0.5 }); root.add(W.palaceGlow);
  }

  /* ---------------- far islands: frosted pines and lollipops on floating sugar rocks ---------------- */
  {
    const isl = new Batch(MAT.gloss);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + 0.25, r = rnd(34, 46), x = Math.cos(a) * r, z = Math.sin(a) * r * 0.85 - 4, y = rnd(-9, 4);
      if (z < -34 && Math.abs(x) < 24) continue;   // keep the palace clear
      isl.add(GEO.sph(16, 10), '#f6ecf8', TRS(x, y, z, 0, 0, 0, rnd(2.4, 3.6), 0.9, rnd(2.2, 3.2)));
      isl.add(GEO.cone(12), '#bfaedc', TRS(x, y - 1.7, z, Math.PI, 0, 0, rnd(2.0, 2.8), 3.4, rnd(2.0, 2.6)));
      if (i % 2) for (let k = 0; k < 3; k++) isl.add(GEO.cone(10), '#e2f3ee', TRS(x + rnd(-1.3, 1.3), y + 1.5, z + rnd(-1, 1), 0, 0, 0, 0.62, 2.6, 0.62));
      else { isl.add(GEO.cyl(8), '#fff6fb', TRS(x, y + 1.6, z, 0, 0, 0, 0.09, 2.6, 0.09)); isl.add(GEO.sph(14, 10), pick(['#ff9cc8', '#9cd8ff', '#ffd27a']), TRS(x, y + 3.1, z, Math.PI / 2, 0, 0, 0.95, 0.95, 0.32)); }
    }
    root.add(isl.build({ cast: false }));
  }

  /* ---------------- six beams of light sweeping the stage from high above ---------------- */
  W.beamList = [];
  const btex = beamTex();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.3, src = new THREE.Vector3(Math.cos(a) * 10, 27, Math.sin(a) * 10 - 2);
    const geo = new THREE.CylinderGeometry(0.2, i === 0 ? 1.7 : 2.9, 1, 28, 1, true); geo.translate(0, -0.5, 0);   // apex at the top, length 1 along -y
    const mat = new THREE.MeshBasicMaterial({ map: btex, color: '#ffffff', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const m = new THREE.Mesh(geo, mat); m.position.copy(src); m.renderOrder = 8; m.frustumCulled = false; root.add(m);
    W.beamList.push({ m, src, ph: rnd(0, TAU) });
  }

  /* ---------------- a halo of glinting snow spiralling round the stage ---------------- */
  {
    const halo = [];
    for (let i = 0; i < 180; i++) { const u = i / 180, a = u * TAU * 5, r = R + 1.2 + Math.sin(u * TAU * 3) * 0.8; halo.push({ p: [Math.cos(a) * r, 0.4 + u * 9.5, Math.sin(a) * r], c: pick(['#ffffff', '#d8ecff', '#e9dcff']), s: rnd(0.35, 0.75), tw: 0.8 }); }
    W.halo = new THREE.Group(); W.halo.add(makeGlowPoints(halo, { boost: 1 })); root.add(W.halo);
  }

  /* ---------------- snow, and the lights ---------------- */
  W.snow = makeSnow(DEVICE.mobile ? 260 : 460, [-36, -6, -32], [36, 26, 34], { size: 1.1, speed: 0.55, opacity: 0.9 }); root.add(W.snow);
  const L = {};
  L.hemi = new THREE.HemisphereLight('#d9dcff', '#4c3270', 0.9);
  L.key = new THREE.DirectionalLight('#fff3f8', 1.45); L.key.position.set(-14, 28, 24); L.key.target.position.set(0, 0, 0);
  L.rim = new THREE.DirectionalLight('#b9c7ff', 0.9); L.rim.position.set(16, 14, -28);
  L.warm = new THREE.PointLight('#ff9fd6', 14, 36, 1.3); L.warm.position.set(-8, 7, 6);
  L.cool = new THREE.PointLight('#9fc8ff', 14, 36, 1.3); L.cool.position.set(8, 7, 6);
  root.add(L.hemi, L.key, L.key.target, L.rim, L.warm, L.cool);
  W.lights = L;

  /* ---------------- act colours: blend act a into act b by k ---------------- */
  W.setPalette = (a, b, k) => {
    const A = PALACE_CFG.acts[a], B = PALACE_CFG.acts[b];
    const mix = (out, x, y) => out.set(x).lerp(_p5c2.set(y), k);
    const U = skyMat.uniforms;
    mix(U.uTop.value, A.sky[0], B.sky[0]); mix(U.uMid.value, A.sky[1], B.sky[1]); mix(U.uLow.value, A.sky[2], B.sky[2]);
    mix(U.uGlowA.value, A.glow[0], B.glow[0]); mix(U.uGlowB.value, A.glow[1], B.glow[1]);
    W.ribbons.forEach((r, i) => mix(r.m.material.color, A.aurora[i % 3], B.aurora[i % 3]));
    W.rings.forEach((m) => mix(m.material.color, A.ring, B.ring)); mix(W.ripple.m.material.color, A.ring, B.ring);
    W.beamList.forEach((bm) => mix(bm.m.material.color, A.beam, B.beam));
    for (let i = 0; i < np; i++) mix(W.pillarBase[i], A.pillar[i % 3], B.pillar[i % 3]);
    W.applyPillars();
    mix(MAT5.crystal.emissive, A.pillar[1], B.pillar[1]); mix(MAT5.core.color, A.ring, B.ring);
  };

  /* ---------------- every frame: the sky follows the camera, ribbons wave, rings breathe with the beat ---------------- */
  W.update = (dt, t, beat, perBar) => {
    skyRig.position.copy(camera.position);
    for (const r of W.ribbons) {
      const P = r.m.geometry.attributes.position, B0 = r.base;
      for (let j = 0; j < P.count; j++) { const x = B0[j * 3]; P.setY(j, B0[j * 3 + 1] + Math.sin(x * 0.055 + t * r.speed + r.ph) * r.amp); P.setZ(j, Math.cos(x * 0.04 + t * r.speed * 0.7 + r.ph) * 5); }
      P.needsUpdate = true;
    }
    const f = beat - Math.floor(beat), pulse = Math.exp(-f * 4);
    W.rings.forEach((m, i) => { const ph = (((beat - i * 0.18) % 1) + 1) % 1; m.material.opacity = 0.32 + 0.6 * Math.exp(-ph * 3.2); });
    const bar = Math.floor(beat / perBar);
    if (bar !== W.lastBar) { W.lastBar = bar; W.ripple.t = 0; }
    W.ripple.t += dt;
    const rk = W.ripple.t / 1.7;
    if (rk < 1) { W.ripple.m.scale.setScalar(lerp(S.dais + 0.3, R - 0.25, Ease.out(rk))); W.ripple.m.material.opacity = 0.95 * (1 - rk); } else W.ripple.m.material.opacity = 0;
    MAT5.crystal.emissiveIntensity = 0.28 + 0.4 * pulse; MAT5.core.opacity = 0.45 + 0.4 * pulse;
    W.tipGlow.material.uniforms.uBoost.value = 0.6 + 0.6 * pulse;
    W.beamList.forEach((bm, i) => {
      const a = t * 0.21 + bm.ph, r = i === 0 ? 0 : 4 + 4.2 * Math.sin(t * 0.16 + bm.ph);
      _p5v.set(Math.cos(a) * r, i === 0 ? W.daisTop : 0, Math.sin(a) * r).sub(bm.src);
      const len = _p5v.length(); _p5v.divideScalar(len);
      bm.m.quaternion.setFromUnitVectors(_p5down, _p5v); bm.m.scale.set(1, len, 1);
      bm.m.material.opacity = i === 0 ? 0.05 + 0.03 * pulse : 0.03 + 0.03 * pulse;
    });
    W.halo.rotation.y = t * 0.12;
    if (W.pillarsDirty) { W.applyPillars(); W.pillarsDirty = false; }
    if (W.starGroup.visible) {   // act III: the dots of the star, dim until the line has passed, then gold; the tips' columns
      const dots = W.starDots;
      for (let i = 0; i < W.star.n; i++) { const k = W.starLevel[i]; _p5c.set('#8a6ab0').lerp(_p5c2.set('#ffe38a'), Math.min(1, k)).multiplyScalar(1 + 0.3 * k * Math.sin(t * 5 + i * 0.6)); dots.setColorAt(i, _p5c); }
      dots.instanceColor.needsUpdate = true;
      W.starCols.forEach((c, k) => { c.material.opacity = 0.26 * W.starTips[k] * (0.75 + 0.25 * Math.sin(t * 3 + k)); });
    }
    if (W.spotGroup.visible) for (const sp of W.spots) {   // act II: the spots on the glass, awake, charging, lit
      const pl = 0.8 + 0.2 * Math.sin(t * 4 + sp.ph);
      sp.ring.material.opacity = 0.16 + 0.6 * sp.aw * pl + 0.24 * sp.lit; sp.dark.material.opacity = 0.04 + 0.2 * sp.aw;
      sp.fill.scale.setScalar(0.04 + 0.96 * Math.max(sp.ch, sp.lit)); sp.fill.material.opacity = 0.12 + 0.36 * sp.ch + 0.3 * sp.lit * pl;
      sp.col.material.opacity = 0.22 * sp.lit * (0.7 + 0.3 * pl);
      sp.star.material.uniforms.uBoost.value = 0.2 + 0.4 * sp.aw + 0.6 * sp.lit + 0.5 * sp.ch;
    }
    for (const id in W.pads) {
      const P = W.pads[id], pl = 0.78 + 0.22 * Math.sin(t * 3.2 + P.ph), k = P.glow * pl;
      P.disc.material.opacity = Math.min(0.62, 0.3 * k); P.rim.material.opacity = Math.min(1, 0.6 + 0.3 * k); P.ring.material.opacity = Math.min(1, 0.5 * k);
      P.col.material.opacity = 0.2 * k; P.star.material.uniforms.uBoost.value = 0.45 + 0.7 * k;
    }
    L.warm.position.set(Math.cos(t * 0.3) * 9, 7, Math.sin(t * 0.3) * 9);
    L.cool.position.set(Math.cos(t * 0.3 + Math.PI) * 9, 7, Math.sin(t * 0.3 + Math.PI) * 9);
  };

  /* ---------------- the three nations' pads: a glowing disc, the ring their dancers stand on, a column of light and a star ---------------- */
  {
    const Tp = PALACE_CFG.troupes, bt = beamTex(); W.pads = {};
    const add = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    Tp.order.forEach((id, k) => {
      const U = Tp[id], g = new THREE.Group(); g.position.set(U.pad[0], 0.035, U.pad[1]); stage.add(g);
      const solid = (op) => new THREE.MeshBasicMaterial({ color: U.color, transparent: true, opacity: op, depthWrite: false, toneMapped: false });
      const disc = new THREE.Mesh(new THREE.CircleGeometry(Tp.padR, 72).rotateX(-Math.PI / 2), solid(0.34));
      const rim = new THREE.Mesh(new THREE.TorusGeometry(Tp.padR, 0.1, 6, 110), solid(0.95)); rim.rotation.x = Math.PI / 2;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(Tp.ringR, 0.04, 6, 90), add(U.glow, 0.55)); ring.rotation.x = Math.PI / 2;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 13, 24, 1, true).translate(0, 6.5, 0), new THREE.MeshBasicMaterial({ map: bt, color: U.color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      const star = makeGlowPoints([{ p: [0, 3.5, 0], c: U.glow, s: 4.2, tw: 0.3, ph: k * 0.33 }], { cell: CELL.star, boost: 1 });
      g.add(disc, rim, ring, col, star);
      W.pads[id] = { g, disc, rim, ring, col, star, glow: 0.6, ph: k * 2.1 };
    });
    W.setPadGlow = (id, k) => { W.pads[id].glow = k; };
  }

  /* ---------------- act II: twelve spots on the glass, one under each pillar, that wake, charge and light ---------------- */
  {
    const A2 = PALACE_CFG.act2.spots, bt2 = beamTex(); W.spots = []; W.spotGroup = new THREE.Group(); W.spotGroup.visible = false; stage.add(W.spotGroup);
    const add = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const solid = (color, op) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, toneMapped: false });
    for (let i = 0; i < A2.n; i++) {
      const a = (i / A2.n) * TAU + TAU / (A2.n * 2), x = Math.cos(a) * A2.ring, z = Math.sin(a) * A2.ring;
      const col = new THREE.Color().setHSL((0.9 + i * 0.075) % 1, 0.85, 0.64);   // pink, violet, blue, teal, green, gold, rose: round the ring
      const g = new THREE.Group(); g.position.set(x, 0.04, z);
      const dark = new THREE.Mesh(new THREE.CircleGeometry(A2.r, 48).rotateX(-Math.PI / 2), solid('#3b1252', 0.2));   // a plum plate: light shapes vanish on the pale glass
      const ring = new THREE.Mesh(new THREE.TorusGeometry(A2.r, 0.09, 6, 80), solid(col, 0.9)); ring.rotation.x = Math.PI / 2;
      const fill = new THREE.Mesh(new THREE.CircleGeometry(A2.r * 0.96, 48).rotateX(-Math.PI / 2), solid(col, 0.3)); fill.position.y = 0.012; fill.scale.setScalar(0.05);   // a solid tint: an additive fill turns the pale glass white
      const colm = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 14, 24, 1, true).translate(0, 7, 0), new THREE.MeshBasicMaterial({ map: bt2, color: col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      const star = makeGlowPoints([{ p: [0, 1.4, 0], c: col, s: 3.2, tw: 0.3, ph: i * 0.41 }], { cell: CELL.star, boost: 0.3 });
      g.add(dark, ring, fill, colm, star); W.spotGroup.add(g);
      W.spots.push({ g, dark, ring, fill, col: colm, star, x, z, color: col, aw: 0, ch: 0, lit: 0, ph: i * 0.9 });
    }
  }

  /* ---------------- act III: a big star on the glass, drawn in dots, with a column of light at each tip ---------------- */
  {
    const St = palaceStarGeom(), bt3 = beamTex();
    W.starGroup = new THREE.Group(); W.starGroup.visible = false; stage.add(W.starGroup);
    W.star = St; W.starLevel = new Float32Array(St.n); W.starTips = new Float32Array(5);
    const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(0.19, 14).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false }), St.n);
    const pt = [0, 0];
    for (let i = 0; i < St.n; i++) { St.at((i * St.per) / St.n, pt); _p5m.compose(_p5v.set(pt[0], 0.055, pt[1]), _p5q.identity(), _p5s.set(1, 1, 1)); dots.setMatrixAt(i, _p5m); dots.setColorAt(i, _p5c.set('#8a6ab0')); }
    dots.frustumCulled = false; dots.renderOrder = 3; W.starGroup.add(dots); W.starDots = dots;
    W.starCols = [];
    for (let k = 0; k < 5; k++) {
      const [x, z] = St.verts[k * 2], col = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 16, 24, 1, true).translate(0, 8, 0), new THREE.MeshBasicMaterial({ map: bt3, color: '#ffe08a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      col.position.set(x, 0.04, z); W.starGroup.add(col); W.starCols.push(col);
    }
  }

  W.setPalette(0, 0, 0);
  return W;
}
