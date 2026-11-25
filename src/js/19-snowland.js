/* =====================================================================
   19 · THE SNOWFLAKE FOREST — a lantern path that opens one tile at a time
   Tile i of the path belongs to snowflake i of the chart. Everything is built from code.
   ===================================================================== */
const SNOW_TILE = { len: 1.15, wid: 2.5, lead: 8, y: 0.045 };

function buildSnowland(root, N) {
  reseed(3131);
  const TL = SNOW_TILE.len, lead = SNOW_TILE.lead;
  const W3 = { root, N, lead, TL };
  const _m0 = new THREE.Matrix4().makeScale(0, 0, 0), _col = new THREE.Color();

  /* ---------------- the path: a gentle S through the forest ---------------- */
  const pts = [[0, 0, 8], [3, 0, -6], [5, 0, -20], [1, 0, -34], [-4, 0, -48], [-3, 0, -62], [0, 0, -76], [2, 0, -92]].map((p) => V3(...p));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  const LEN = curve.getLength();
  const P = (s, out) => curve.getPointAt(clamp(s / LEN, 0, 1), out || V3());
  const T = (s, out) => curve.getTangentAt(clamp(s / LEN, 0, 1), out || V3());
  const sTile = (i) => lead + (i + 0.5) * TL;
  Object.assign(W3, { P, T, LEN, sTile, gateS: lead + N * TL + 2.8 });
  const side = (s, sd, off) => { const p = P(s), t = T(s); return V3(p.x - t.z * sd * off, 0, p.z + t.x * sd * off); };

  /* ---------------- snowy ground, flattened around the path ---------------- */
  const samples = []; for (let i = 0; i <= 260; i++) samples.push(P((i / 260) * LEN));
  const dPath = (x, z) => { let d = 1e9; for (const p of samples) { const dx = p.x - x, dz = p.z - z, q = dx * dx + dz * dz; if (q < d) d = q; } return Math.sqrt(d); };
  const dune = (x, z) => Math.sin(x * 0.09 + 1.3) * Math.cos(z * 0.07 + 0.4) * 0.9 + Math.sin(x * 0.21 + z * 0.15) * 0.35 + Math.sin(z * 0.045 + 2.2) * 0.7;
  const hgt = (x, z) => dune(x, z) * smoothstep(3.6, 11, dPath(x, z));
  W3.hgt = hgt;
  const gw = 170, gl = 290, gg = new THREE.PlaneGeometry(gw, gl, 68, 116);
  gg.rotateX(-Math.PI / 2); gg.translate(0, 0, -75);
  const gp = gg.attributes.position, gu = gg.attributes.uv, gc = new Float32Array(gp.count * 3), lite = new THREE.Color('#f1f6ff'), deep = new THREE.Color('#bccbec');
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = gp.getZ(i), h = hgt(x, z);
    gp.setY(i, h); gu.setXY(i, (gu.getX(i) * gw) / 9, (gu.getY(i) * gl) / 9);
    _col.copy(lite).lerp(deep, clamp(0.38 - h * 0.28 + Math.sin(x * 0.5 + z * 0.37) * 0.06, 0, 1));
    gc[i * 3] = _col.r; gc[i * 3 + 1] = _col.g; gc[i * 3 + 2] = _col.b;
  }
  gg.setAttribute('color', new THREE.BufferAttribute(gc, 3)); gg.computeVertexNormals();
  root.add(new THREE.Mesh(gg, MAT.cloth));

  /* ---------------- path tiles: dim snow-glass when closed, a glowing ice tile when opened ---------------- */
  const tileGeo = roundBox(1, 0.1, 1, 0.035, 1);
  const tiles = new THREE.InstancedMesh(tileGeo, MAT3.tile, N), rims = new THREE.InstancedMesh(tileGeo, MAT3.rim, N);
  for (const m of [tiles, rims]) { m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.renderOrder = 1; }
  const tile = [];
  for (let i = 0; i < N; i++) { const p = P(sTile(i)), t = T(sTile(i)); tile.push({ x: p.x, z: p.z, yaw: Math.atan2(t.x, t.z), open: 0 }); }
  W3.tile = tile;
  const cLo = new THREE.Color('#9db7e3'), cHi = new THREE.Color('#f6fcff'), rLo = new THREE.Color('#5f86c8'), rHi = new THREE.Color('#bfe2ff');
  W3.setTile = (i, open) => {
    const t = tile[i]; t.open = open;
    const on = open > 0.001, sc = on ? 0.6 + 0.4 * open : 0, sy = on ? 0.5 + 0.5 * open : 0;
    tiles.setMatrixAt(i, TRS(t.x, SNOW_TILE.y, t.z, 0, t.yaw, 0, SNOW_TILE.wid * sc, sy, SNOW_TILE.len * 0.96 * sc));
    rims.setMatrixAt(i, TRS(t.x, SNOW_TILE.y - 0.012, t.z, 0, t.yaw, 0, (SNOW_TILE.wid + 0.2) * sc, sy, (SNOW_TILE.len + 0.1) * sc));
    tiles.setColorAt(i, _col.copy(cLo).lerp(cHi, open)); rims.setColorAt(i, _col.copy(rLo).lerp(rHi, open));
    tiles.instanceMatrix.needsUpdate = rims.instanceMatrix.needsUpdate = true;
    tiles.instanceColor.needsUpdate = rims.instanceColor.needsUpdate = true;
  };
  root.add(rims, tiles);

  /* ---------------- footprints: two small prints per perfectly opened tile ---------------- */
  const fp = new Batch(MAT.glow);
  fp.add(GEO.circle(14), '#ffffff', TRS(0, 0, -0.04, -Math.PI / 2, 0, 0, 0.062, 0.105, 1));
  for (const [x, z, r] of [[-0.04, 0.115, 0.026], [-0.013, 0.14, 0.022], [0.016, 0.14, 0.022], [0.042, 0.115, 0.024]]) fp.add(GEO.circle(8), '#ffffff', TRS(x, 0, z, -Math.PI / 2, 0, 0, r, r, 1));
  const prints = new THREE.InstancedMesh(fp.build().geometry, MAT3.print, N * 2);
  prints.frustumCulled = false; prints.renderOrder = 3; prints.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  W3.setPrints = (i, on) => {
    const t = tile[i], sn = Math.sin(t.yaw), cs = Math.cos(t.yaw);
    for (let s = 0; s < 2; s++) {
      const lx = s ? 0.3 : -0.3, lz = s ? 0.22 : -0.22;
      prints.setMatrixAt(i * 2 + s, on ? TRS(t.x + lx * cs + lz * sn, SNOW_TILE.y + 0.07, t.z - lx * sn + lz * cs, 0, t.yaw, 0, 1.25, 1, 1.25) : _m0);
    }
    prints.instanceMatrix.needsUpdate = true;
  };
  root.add(prints);

  /* ---------------- lanterns: dark until the tile beside them opens ---------------- */
  const lampB = new Batch(MAT.gold), glassB = new Batch(MAT.glow), lampGlow = [];
  W3.lampTile = [];
  for (let i = 3, sd = 1; i < N; i += 4, sd = -sd) {
    const q = side(sTile(i), sd, 2.2), y0 = hgt(q.x, q.z);
    lampB.add(GEO.cyl(8), '#cdd8ec', TRS(q.x, y0 + 1.1, q.z, 0, 0, 0, 0.045, 2.2, 0.045));
    lampB.add(lathe([[0.2, 0], [0.2, 0.06], [0.09, 0.14], [0.06, 0.24]], 10, 0), '#cdd8ec', TRS(q.x, y0, q.z));
    glassB.add(roundBox(0.3, 0.42, 0.3, 0.05, 1), '#d5e4fa', TRS(q.x, y0 + 2.35, q.z));
    lampB.add(GEO.cone(4), '#cdd8ec', TRS(q.x, y0 + 2.7, q.z, 0, Math.PI / 4, 0, 0.26, 0.24, 0.26));
    lampB.add(GEO.sph(8, 6), '#e8f0ff', TRS(q.x, y0 + 2.86, q.z, 0, 0, 0, 0.05));
    lampGlow.push({ p: [q.x, y0 + 2.35, q.z], c: '#ffe3ac', s: 0.001, tw: 0.2 });
    W3.lampTile.push(i);
  }
  W3.lamps = makeGlowPoints(lampGlow, { boost: 1 });
  W3.setLamp = (j, on) => { const a = W3.lamps.geometry.attributes.aInfo; a.array[j * 3] = on ? 1.9 : 0; a.needsUpdate = true; };
  root.add(lampB.build({ cast: false }), glassB.build({ cast: false }), W3.lamps);

  /* ---------------- snow-laden pines, built in chunks along the path so the camera can cull them ---------------- */
  const chunks = new Map();
  const pine = (x, z, h) => {
    const key = Math.floor(-z / 16); let b = chunks.get(key); if (!b) { b = new Batch(MAT.cloth); chunks.set(key, b); }
    const y0 = hgt(x, z), k = h / 5, green = pick(['#2b5a4b', '#2f6552', '#27544a', '#34705a']);
    b.add(GEO.cyl(7), '#6b4a3a', TRS(x, y0 + 0.5 * k, z, 0, 0, 0, 0.16 * k, 1.0 * k, 0.16 * k));
    for (let t = 0; t < 4; t++) {
      const R = (1.55 - t * 0.34) * k, ph = (1.45 - t * 0.06) * k, yb = y0 + (0.85 + t * 0.92) * k, f = 0.58, ry = rnd(0, 3);
      b.add(GEO.cone(9), green, TRS(x, yb + ph / 2, z, 0, ry, 0, R, ph, R));
      b.add(GEO.cone(9), '#f4f8ff', TRS(x, yb + ph * (1 - f) + (ph * f) / 2, z, 0, ry, 0, R * f * 1.07, ph * f, R * f * 1.07));
    }
  };
  const nTrees = DEVICE.mobile ? 150 : 230;
  for (let i = 0; i < nTrees; i++) {
    const s = rnd(-6, LEN - 4), sd = rnd(0, 1) < 0.5 ? -1 : 1, off = 4.6 + Math.pow(rnd(0, 1), 1.6) * 30;
    const q = side(clamp(s, 0, LEN), sd, off); q.x += rnd(-1.2, 1.2); q.z += rnd(-1.2, 1.2);
    if (dPath(q.x, q.z) < 4.2) continue;
    pine(q.x, q.z, rnd(3.2, 7.8) * (off > 18 ? 1.25 : 1));
  }
  for (let i = 0; i < 70; i++) { const sd = i % 2 ? 1 : -1, x = sd * rnd(36, 70), z = rnd(-160, 20); pine(x, z, rnd(7, 11)); }
  for (const b of chunks.values()) { const m = b.build({ cast: false, receive: false }); m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); }

  /* ---------------- ice crystals beside the path ---------------- */
  const iceB = new Batch(MAT3.ice), crystal = lathe([[0, 0], [0.42, 0.06], [0.5, 0.9], [0.18, 1.5], [0, 1.9]], 6, 0);
  for (let s = 6; s < LEN - 8; s += rnd(5, 8)) {
    const q = side(s, rnd(0, 1) < 0.5 ? -1 : 1, rnd(3.6, 6.5)), y0 = hgt(q.x, q.z);
    for (let k = 0, n = 3 + rndi(0, 2); k < n; k++) { const a = rnd(0, TAU), d = rnd(0, 0.9), sc = rnd(0.5, 1.5); iceB.add(crystal, '#ffffff', TRS(q.x + Math.cos(a) * d, y0, q.z + Math.sin(a) * d, rnd(-0.25, 0.25), rnd(0, TAU), rnd(-0.25, 0.25), sc * 0.6, sc * 1.2, sc * 0.6)); }
  }
  root.add(iceB.build({ cast: false }));

  /* ---------------- the gate to the Sweets Kingdom ---------------- */
  const gp0 = P(W3.gateS), gt = T(W3.gateS), gate = new THREE.Group();
  gate.position.set(gp0.x, hgt(gp0.x, gp0.z), gp0.z); gate.rotation.y = Math.atan2(gt.x, gt.z); root.add(gate);
  const gb = new Batch(MAT.gloss), gold = new Batch(MAT.gold), gi = new Batch(MAT3.ice);
  const stripe = (x, y, z) => (Math.floor((y + 0.5) * 8 + (Math.atan2(x, z) / TAU) * 3 + 100) % 2 ? '#f4a9c0' : '#ffffff');
  for (const sx of [-1, 1]) {
    gb.add(GEO.cyl(16), stripe, TRS(sx * 2.45, 2.1, 0, 0, 0, 0, 0.26, 4.2, 0.26));
    gold.add(GEO.sph(12, 8), '#e8c97a', TRS(sx * 2.45, 4.3, 0, 0, 0, 0, 0.34));
    gold.add(GEO.cyl(12), '#e8c97a', TRS(sx * 2.45, 0.08, 0, 0, 0, 0, 0.4, 0.16, 0.4));
    gi.add(crystal, '#ffffff', TRS(sx * 2.9, 0, -0.2, 0, 0, sx * 0.18, 0.7, 1.4, 0.7));
  }
  gb.add(GEO.torus(2.45, 0.2, 8, 28, Math.PI), stripe, TRS(0, 4.2, 0));
  gold.add(starGeo(0.5, 0.22, 0.14, 0.06), '#ffe8a0', TRS(0, 6.95, 0));
  gi.add(crystal, '#ffffff', TRS(0, 6.5, 0, 0, 0, 0, 0.5, 0.45, 0.5));
  gate.add(gb.build({ cast: false }), gold.build({ cast: false }), gi.build({ cast: false }));
  const doors = [];
  for (const sx of [-1, 1]) {
    const hinge = new THREE.Group(); hinge.position.set(sx * 2.3, 0, 0.05); gate.add(hinge);
    const pb = new Batch(MAT3.frost), pg = new Batch(MAT.gold);
    pb.add(roundBox(2.25, 4.1, 0.14, 0.04, 1), '#ffffff', TRS(-sx * 1.13, 2.05, 0));
    pg.add(GEO.torus(0.5, 0.035, 6, 28), '#e8c97a', TRS(-sx * 1.13, 2.2, 0.09));
    for (let k = 0; k < 6; k++) pg.add(GEO.box(), '#e8c97a', TRS(-sx * 1.13 + Math.cos((k * Math.PI) / 3) * 0.25, 2.2 + Math.sin((k * Math.PI) / 3) * 0.25, 0.09, 0, 0, (k * Math.PI) / 3, 0.5, 0.03, 0.03));
    pg.add(GEO.sph(8, 6), '#e8c97a', TRS(-sx * 0.35, 2.0, 0.1, 0, 0, 0, 0.07));
    hinge.add(pb.build({ cast: false }), pg.build({ cast: false })); doors.push(hinge);
  }
  const glowMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 5.8), MAT3.door); glowMesh.position.set(0, 2.9, 0.5); glowMesh.renderOrder = 4; gate.add(glowMesh);
  W3.gate = {
    group: gate, open: 0,
    set(k) { this.open = k; doors[0].rotation.y = -k * 1.55; doors[1].rotation.y = k * 1.55; MAT3.door.opacity = k * 0.95; candy.visible = k > 0.02; },
  };

  /* candy canes and lollipops beyond the gate, only revealed when the doors swing open */
  const candy = new THREE.Group(); root.add(candy);
  const cb = new Batch(MAT.glow);
  const cane = (x, z, h, yaw) => {
    const hook = []; for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; hook.push([Math.cos(a) * -0.45 + 0.45, h + Math.sin(a) * 0.45, 0]); }
    const pts2 = [[0, 0, 0], [0, h * 0.5, 0], [0, h, 0]].concat(hook.slice(1)).map((p) => V3(p[0], p[1], p[2]));
    cb.add(tubeGeo(pts2, 0.16, 28, 8), (px, py, pz) => (Math.floor((py * 3 + px * 3 + pz * 3 + 100) * 1.6) % 2 ? '#ff9db9' : '#ffffff'), TRS(x, 0, z, 0, yaw, 0));
  };
  const lolly = (x, z, h, r, c1, c2) => {
    cb.add(GEO.cyl(6), '#fff4e4', TRS(x, h / 2, z, 0, 0, 0, 0.06, h, 0.06));
    cb.add(GEO.sph(18, 12), (px, py, pz) => (Math.floor((Math.atan2(px, py) / TAU) * 6 + Math.hypot(px, py) * 3 + 100) % 2 ? c1 : c2), TRS(x, h + r * 0.8, z, 0, 0, 0, r, r, r * 0.25));
  };
  for (let i = 0; i < 9; i++) {
    const q = side(Math.min(W3.gateS + 6 + i * 3.4, LEN), i % 2 ? 1 : -1, rnd(3.6, 8));
    if (i % 3 === 0) lolly(q.x, q.z, rnd(2.4, 3.6), rnd(0.8, 1.2), '#ffb3c9', '#fff4f8');
    else if (i % 3 === 1) cane(q.x, q.z, rnd(3, 4.6), rnd(0, TAU));
    else { cb.add(GEO.hemi(16, 8), pick(['#ffd6e6', '#d6ffe9', '#fff0c2']), TRS(q.x, 0, q.z, 0, 0, 0, 1.2, 1.5, 1.2)); }
  }
  candy.add(cb.build({ cast: false }), makeGlowPoints(Array.from({ length: 14 }, (_, i) => { const q = side(Math.min(W3.gateS + 5 + i * 2.4, LEN), i % 2 ? 1 : -1, rnd(1, 7)); return { p: [q.x, rnd(0.5, 4), q.z], c: pick(['#ffd6e6', '#fff1c8', '#d9f6ff']), s: rnd(0.8, 1.6), tw: 0.6 }; }), { boost: 1 }));
  candy.visible = false;

  /* ---------------- sky, falling snow, drifting sparkles ---------------- */
  W3.sky = new THREE.Group(); root.add(W3.sky);
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(120, 120, 150, 40, 1, true), MAT3.sky); dome.position.y = 73; dome.renderOrder = -2; W3.sky.add(dome);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(120, 32), new THREE.MeshBasicMaterial({ color: '#101a4a', fog: false, toneMapped: false })); cap.rotation.x = Math.PI / 2; cap.position.y = 148; W3.sky.add(cap);
  W3.snowField = new THREE.Group(); root.add(W3.snowField);
  W3.snowField.add(makeSnow(DEVICE.mobile ? 280 : 460, [-26, 0, -26], [26, 16, 26], { size: 1.15, speed: 0.55, opacity: 0.95 }));
  const spark = []; for (let i = 0; i < 70; i++) { const q = side(rnd(0, LEN - 6), rnd(0, 1) < 0.5 ? -1 : 1, rnd(2.5, 16)); spark.push({ p: [q.x, rnd(0.4, 5), q.z], c: pick(['#dff0ff', '#ffffff', '#cfe4ff']), s: rnd(0.5, 1.1), tw: 0.8 }); }
  root.add(makeGlowPoints(spark, { boost: 0.9 }));

  /* ---------------- lights ---------------- */
  const L = {};
  L.hemi = new THREE.HemisphereLight('#dfe8ff', '#7d8cc4', 1.25);
  L.key = new THREE.DirectionalLight('#e8efff', 1.5); L.key.position.set(-14, 26, 10); L.key.target.position.set(0, 0, -20);
  L.rim = new THREE.DirectionalLight('#ffd6e8', 0.55); L.rim.position.set(12, 14, -30);
  root.add(L.hemi, L.key, L.key.target, L.rim);
  W3.lights = L;

  W3.resetPath = () => {
    for (let i = 0; i < N; i++) { W3.setTile(i, 0); W3.setPrints(i, false); }
    for (let j = 0; j < W3.lampTile.length; j++) W3.setLamp(j, false);
    W3.gate.set(0);
  };
  W3.resetPath();
  return W3;
}

function buildSnowFairy() {
  const f = buildDoll('snowfairy');
  f.root.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  f.root.add(makeGlowPoints([{ p: [0, 1.15, 0], c: '#dff0ff', s: 2.4, tw: 0.2 }], { boost: 0.7 }));
  return f;
}
