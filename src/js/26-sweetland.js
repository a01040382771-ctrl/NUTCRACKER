/* =====================================================================
   26 · THE KINGDOM OF SWEETS — a festival avenue beside a chocolate river
   Avenue x∈[-6,6] z∈[-13,15] · stages: chocolate (west, z 7) · coffee (east, z 0) · tea (west, z −7)
   River z∈[−19.8,−13.8] with the candy bridge at x 0 · the Sugar Plum Palace far beyond (z −54)
   ===================================================================== */
const SWEET = {
  start: V3(0, 0, 12.2), arch: V3(0, 0, 14.9), fountain: V3(0, 0, 0.6),
  river: { z0: -19.8, z1: -13.8 }, palace: V3(0, 0, -56),
  stages: [
    { id: 'choco', x: -8.9, z: 7.0, yaw: Math.PI / 2, cell: 0 },
    { id: 'coffee', x: 8.9, z: 0.0, yaw: -Math.PI / 2, cell: 1 },
    { id: 'tea', x: -8.9, z: -7.0, yaw: Math.PI / 2, cell: 2 },
  ],
  posts: [10.6, 3.6, -3.6, -10.6],   // z of the lamp posts on both edges of the avenue (and of the lantern strings between them)
  postX: 6.55,
};
/* a point in a stage's own frame (x across, z towards the audience) → world */
function stageToWorld(st, lx, ly, lz, out = V3()) {
  const c = Math.cos(st.yaw), s = Math.sin(st.yaw);
  return out.set(st.x + lx * c + lz * s, ly, st.z - lx * s + lz * c);
}

function buildSweetland(root) {
  reseed(5150);
  const W = { root, colliders: [], dyn: [], deco: {} };
  const B = {
    gloss: new Batch(MAT.gloss), gold: new Batch(MAT.gold), glow: new Batch(MAT.glow), satin: new Batch(MAT.satin), porcelain: new Batch(MAT.porcelain),
    cloth: new Batch(MAT.cloth), wood: new Batch(MAT.wood), icing: new Batch(MAT4.icing), banner: new Batch(MAT4.banner), crystal: new Batch(MAT4.crystal),
  };
  const ALL = Object.values(B);
  const glows = [];
  const boxC = (x0, x1, z0, z1, top, walk = false) => { const c = { t: 'b', x0, x1, z0, z1, top, bottom: 0, walk, on: true }; W.colliders.push(c); return c; };
  const circC = (x, z, r, top, walk = false) => { const c = { t: 'c', x, z, r, top, bottom: 0, walk, on: true }; W.colliders.push(c); return c; };
  /* an axis-aligned collider around a box given in a stage's frame */
  const stageBox = (st, lx0, lx1, lz0, lz1, top, walk) => {
    const a = stageToWorld(st, lx0, 0, lz0), b = stageToWorld(st, lx1, 0, lz1);
    return boxC(Math.min(a.x, b.x), Math.max(a.x, b.x), Math.min(a.z, b.z), Math.max(a.z, b.z), top, walk);
  };
  const stripes = (a, b, n = 8, k = 6) => (x, y, z) => (Math.floor((y + 0.5) * k + (Math.atan2(x, z) / TAU) * n + 100) % 2 ? a : b);
  const plane = (mat, w, d, x, y, z, uw, ud) => {
    const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
    const U = g.attributes.uv; for (let i = 0; i < U.count; i++) U.setXY(i, U.getX(i) * uw, U.getY(i) * ud);
    const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.receiveShadow = true; root.add(m); return m;
  };

  /* ---------------- ground: frosting on both banks, wafer tiles on the avenue ---------------- */
  const groundGeo = (x0, x1, z0, z1, nx, nz) => {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
    const P = g.attributes.position, U = g.attributes.uv, col = new Float32Array(P.count * 3), a = new THREE.Color('#fff7f3'), b = new THREE.Color('#f6dce6'), c = new THREE.Color();
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), z = P.getZ(i), far = smoothstep(14, 26, Math.abs(x)) + smoothstep(16, 30, z) + (z < -19 ? smoothstep(-22, -40, z) : 0);
      P.setY(i, far * (Math.sin(x * 0.21 + z * 0.13) * 0.8 + Math.sin(x * 0.07 - z * 0.09) * 1.2 + 1.2));
      U.setXY(i, x / 4.5, z / 4.5);
      c.copy(a).lerp(b, clamp(0.35 + Math.sin(x * 0.4 + z * 0.3) * 0.2 + far * 0.1, 0, 1)); col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, MAT4.icing); m.receiveShadow = true; root.add(m);
  };
  groundGeo(-70, 70, SWEET.river.z1 + 0.2, 60, 56, 30);
  groundGeo(-80, 80, -110, SWEET.river.z0 - 0.2, 40, 30);
  plane(MAT4.wafer, 12, 28.6, 0, 0.012, 0.9, 3, 7.15);
  // piped icing along both edges of the avenue
  const dots = new THREE.InstancedMesh(GEO.sph(10, 6), new THREE.MeshStandardMaterial({ color: '#fffaf4', roughness: 0.35 }), 2 * 58), dm = new THREE.Object3D();
  let di = 0;
  for (const sx of [-1, 1]) for (let i = 0; i < 58; i++) { dm.position.set(sx * 6.05, 0.02, -13.3 + i * 0.5); dm.scale.set(0.16, 0.1, 0.16); dm.updateMatrix(); dots.setMatrixAt(di++, dm.matrix); }
  dots.receiveShadow = true; root.add(dots);

  /* ---------------- the chocolate river and its biscuit banks ---------------- */
  const R0 = SWEET.river.z0, R1 = SWEET.river.z1;
  W.river = plane(MAT4.choc, 160, R1 - R0 + 0.6, 0, -0.22, (R0 + R1) / 2, 32, 1.2);
  for (const [z, side] of [[R1 + 0.15, 1], [R0 - 0.15, -1]]) {
    B.wood.add(GEO.box(), '#c98b4f', TRS(0, -0.06, z, 0, 0, 0, 160, 0.3, 0.5));
    for (let i = 0; i < 90; i++) B.wood.add(GEO.sph(6, 4), pick(['#b97a42', '#d69b5c', '#a5683a']), TRS(rnd(-70, 70), 0.06, z + side * rnd(-0.2, 0.25), rnd(0, 3), rnd(0, 3), 0, rnd(0.08, 0.2), rnd(0.05, 0.1), rnd(0.08, 0.2)));
  }
  boxC(-80, -1.45, R0 - 4, R1 + 0.55, 3); boxC(1.45, 80, R0 - 4, R1 + 0.55, 3);
  W.riverMid = boxC(-1.45, 1.45, R0 - 4, R1 + 0.55, 3);   // where the bridge will stand: closed until it is built

  /* ---------------- reusable sweets ---------------- */
  const caneStripe = (a, b) => (x, y, z) => (Math.floor((y * 3 + Math.atan2(x, z) / TAU + 100) * 2) % 2 ? a : b);
  const candyCane = (x, z, h, yaw = 0, col = '#e23a52', r = 0.13) => {
    const hook = []; for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; hook.push(V3(0.42 - Math.cos(a) * 0.42, h + Math.sin(a) * 0.42, 0)); }
    const pts = [V3(0, 0, 0), V3(0, h * 0.5, 0), V3(0, h, 0)].concat(hook.slice(1));
    B.gloss.add(tubeGeo(pts, r, 40, 10), (px, py) => (Math.floor((py * 2.4 + px * 2.4 + 100) * 1.7) % 2 ? col : '#fff8f4'), TRS(x, 0, z, 0, yaw, 0));
  };
  const lolly = (x, z, h, r, c1, c2, flat = true) => {
    B.porcelain.add(GEO.cyl(8), '#fff6ea', TRS(x, h / 2, z, 0, 0, 0, 0.07, h, 0.07));
    if (flat) B.gloss.add(GEO.sph(24, 14), (px, py, pz) => { const a = Math.atan2(py, px), d = Math.hypot(px, py); return Math.floor(a / TAU * 8 + d * 4 + 100) % 2 ? c1 : c2; }, TRS(x, h + r * 0.85, z, 0, rnd(0, TAU), 0, r, r, r * 0.28));
    else B.gloss.add(GEO.sph(18, 12), (px, py, pz) => (Math.floor((Math.atan2(px, pz) / TAU) * 10 + py * 3 + 100) % 2 ? c1 : c2), TRS(x, h + r * 0.9, z, 0, 0, 0, r));
  };
  const gumdrop = (x, z, s, col) => {
    B.gloss.add(lathe([[0, 1], [0.35, 0.95], [0.62, 0.72], [0.8, 0.35], [0.85, 0]], 18, 0), col, TRS(x, 0, z, 0, 0, 0, s));
    for (let i = 0; i < 10; i++) { const a = rnd(0, TAU), yy = rnd(0.2, 0.85), rr2 = 0.85 * (1 - yy * 0.6); B.porcelain.add(GEO.sph(5, 4), '#ffffff', TRS(x + Math.cos(a) * rr2 * s, yy * s, z + Math.sin(a) * rr2 * s, 0, 0, 0, 0.035 * s)); }
  };
  const flossTree = (x, z, h, col) => {
    B.porcelain.add(GEO.cyl(6), '#f6ead8', TRS(x, h * 0.3, z, 0, 0, 0, 0.06, h * 0.6, 0.06));
    for (let i = 0; i < 9; i++) { const a = rnd(0, TAU), yy = h * rnd(0.55, 1.0), d = rnd(0, 0.45) * (1.1 - (yy / h)); B.cloth.add(GEO.sph(10, 8), col, TRS(x + Math.cos(a) * d, yy, z + Math.sin(a) * d, 0, 0, 0, rnd(0.32, 0.55) * h / 3)); }
  };
  const cupcake = (x, z, s, cup, top) => {
    B.gloss.add(lathe([[0.42, 0], [0.55, 0.5], [0.6, 0.52]], 16, 0), stripes(cup, '#fff4ea', 12, 0), TRS(x, 0, z, 0, 0, 0, s));
    B.porcelain.add(lathe([[0.62, 0], [0.6, 0.2], [0.45, 0.42], [0.25, 0.6], [0.06, 0.8], [0, 0.82]], 18, 0), top, TRS(x, 0.5 * s, z, 0, 0, 0, s));
    B.gloss.add(GEO.sph(10, 8), '#d72a43', TRS(x, 0.5 * s + 0.86 * s, z, 0, 0, 0, 0.11 * s));
  };
  const lampPost = (x, z, yawHook) => {
    const h = 3.7;
    B.gold.add(lathe([[0.3, 0], [0.3, 0.08], [0.18, 0.16], [0.12, 0.34]], 14, 0), '#e2b85e', TRS(x, 0, z));
    B.gloss.add(GEO.cyl(12), caneStripe('#e23a52', '#fff8f4'), TRS(x, h / 2, z, 0, 0, 0, 0.09, h, 0.09));
    const hook = []; for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; hook.push(V3(-0.36 + Math.cos(a) * 0.36, h + Math.sin(a) * 0.36, 0)); }
    B.gloss.add(tubeGeo(hook, 0.09, 20, 8), (px, py) => (Math.floor((py * 3 + px * 3 + 100) * 1.6) % 2 ? '#e23a52' : '#fff8f4'), TRS(x, 0, z, 0, yawHook, 0));
    const lx = x + Math.cos(yawHook) * -0.72, lz = z - Math.sin(yawHook) * -0.72;
    B.gold.add(GEO.cyl(8), '#e2b85e', TRS(lx, h - 0.06, lz, 0, 0, 0, 0.13, 0.08, 0.13));
    B.glow.add(GEO.sph(10, 8), '#fff0c8', TRS(lx, h - 0.3, lz, 0, 0, 0, 0.15, 0.2, 0.15));
    B.gold.add(GEO.cone(8), '#e2b85e', TRS(lx, h - 0.52, lz, Math.PI, 0, 0, 0.12, 0.1, 0.12));
    glows.push({ p: [lx, h - 0.3, lz], c: '#ffe3b0', s: 1.9, tw: 0.12 });
    circC(x, z, 0.24, h + 1);
  };
  const house = (x, z, w, d, h, yaw, wall, roof) => {
    const M = TRS(x, 0, z, 0, yaw, 0);
    ALL.forEach((b) => b.push(M));
    B.wood.add(roundBox(w, h, d, 0.12, 2), wall, TRS(0, h / 2, 0));
    const rf = new THREE.Shape(); rf.moveTo(-w / 2 - 0.35, 0); rf.lineTo(w / 2 + 0.35, 0); rf.lineTo(0, h * 0.62); rf.closePath();
    const rg = new THREE.ExtrudeGeometry(rf, { depth: d + 0.4, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 }); rg.translate(0, 0, -(d + 0.4) / 2);
    B.porcelain.add(rg, roof, TRS(0, h, 0));
    for (let i = 0; i < 11; i++) { const t = i / 10; B.porcelain.add(GEO.sph(8, 6), '#ffffff', TRS(lerp(-w / 2 - 0.3, w / 2 + 0.3, t), h + 0.02, d / 2 + 0.24, 0, 0, 0, 0.12, 0.16, 0.1)); }
    for (const s of [-1, 1]) B.porcelain.add(tubeGeo([[s * (w / 2 + 0.3), h, d / 2 + 0.24], [0, h + h * 0.62, d / 2 + 0.24]], 0.07, 10, 6), '#ffffff');
    B.gloss.add(roundBox(0.8, 1.3, 0.1, 0.08, 2), '#7a3c22', TRS(0, 0.65, d / 2 + 0.04));
    B.porcelain.add(GEO.torus(0.42, 0.05, 6, 20, Math.PI), '#ffffff', TRS(0, 1.3, d / 2 + 0.1));
    for (const s of [-1, 1]) {
      B.glow.add(roundBox(0.6, 0.6, 0.05, 0.08, 1), '#ffe2a6', TRS(s * w * 0.28, h * 0.62, d / 2 + 0.03));
      B.porcelain.add(GEO.box(), '#ffffff', TRS(s * w * 0.28, h * 0.62, d / 2 + 0.07, 0, 0, 0, 0.66, 0.06, 0.04));
      B.porcelain.add(GEO.box(), '#ffffff', TRS(s * w * 0.28, h * 0.62, d / 2 + 0.07, 0, 0, 0, 0.06, 0.66, 0.04));
    }
    for (let i = 0; i < 5; i++) B.gloss.add(GEO.sph(10, 8), pick(['#ff6b8a', '#7fd0ff', '#ffe066', '#9be3a8']), TRS(rnd(-w / 2, w / 2), h + rnd(0.2, h * 0.45), d / 2 + rnd(0.1, 0.3), 0, 0, 0, 0.14));
    ALL.forEach((b) => b.pop());
  };

  /* ---------------- the entrance: the twin of the snow forest's gate, doors open (its own group: hidden while the camera is right behind it) ---------------- */
  {
    const A = SWEET.arch, stripe = stripes('#f4a9c0', '#ffffff', 3, 8), ag = new THREE.Group(); root.add(ag);
    const ab = new Batch(MAT.gloss), ao = new Batch(MAT.gold), ap = new Batch(MAT.porcelain);
    for (const sx of [-1, 1]) {
      ab.add(GEO.cyl(16), stripe, TRS(A.x + sx * 2.45, 2.1, A.z, 0, 0, 0, 0.26, 4.2, 0.26));
      ao.add(GEO.sph(12, 8), '#e8c97a', TRS(A.x + sx * 2.45, 4.3, A.z, 0, 0, 0, 0.34));
      ao.add(GEO.cyl(12), '#e8c97a', TRS(A.x + sx * 2.45, 0.08, A.z, 0, 0, 0, 0.4, 0.16, 0.4));
      circC(A.x + sx * 2.45, A.z, 0.4, 5);
      // the frosted doors, swung open towards the snow forest behind
      ap.add(roundBox(2.2, 4.0, 0.12, 0.04, 1), '#eef6ff', TRS(A.x + sx * 2.35, 2.0, A.z + 1.05, 0, sx * 1.45, 0));
    }
    ab.add(GEO.torus(2.45, 0.2, 8, 28, Math.PI), stripe, TRS(A.x, 4.2, A.z));
    ao.add(starGeo(0.5, 0.22, 0.14, 0.06), '#ffe8a0', TRS(A.x, 6.95, A.z));
    ag.add(ab.build({ cast: false }), ao.build({ cast: false }), ap.build({ cast: false }));
    // the light of the snow forest, seen only from the avenue side
    W.archGlow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 5.6), new THREE.MeshBasicMaterial({ color: '#dfeaff', transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    W.archGlow.position.set(A.x, 2.8, A.z + 0.05); W.archGlow.rotation.y = Math.PI; W.archGlow.renderOrder = 4; ag.add(W.archGlow);
    W.arch = ag;
    boxC(-12.6, 12.6, A.z + 0.2, A.z + 3, 6);
  }

  /* ---------------- the chocolate fountain in the middle of the avenue ---------------- */
  {
    const F = SWEET.fountain;
    B.wood.add(lathe([[1.78, 0.32], [1.86, 0.62], [2.02, 0.68], [2.14, 0.52], [2.1, 0.14], [1.98, 0.0]], 48, 0), (x, y) => (y > 0.6 ? '#fff6ee' : '#c98b4f'), TRS(F.x, 0, F.z));
    for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU; B.porcelain.add(GEO.sph(8, 6), '#ffffff', TRS(F.x + Math.cos(a) * 2.13, 0.5, F.z + Math.sin(a) * 2.13, 0, 0, 0, 0.12, 0.17, 0.12)); }
    B.wood.add(GEO.circle(40), '#a86a3c', TRS(F.x, 0.31, F.z, -Math.PI / 2, 0, 0, 1.8, 1.8, 1));
    B.gloss.add(GEO.cyl(16), caneStripe('#e23a52', '#fff8f4'), TRS(F.x, 1.7, F.z, 0, 0, 0, 0.15, 2.8, 0.15));
    const bowl = lathe([[0.18, 0], [0.7, 0.08], [1.0, 0.22], [1.06, 0.32], [0.98, 0.34], [0.66, 0.18], [0.18, 0.12]], 40, 0);
    W.tiers = [[1.0, 1.0], [1.72, 0.68], [2.34, 0.42]];
    for (const [y, s] of W.tiers) {
      B.gold.add(bowl, '#e8c97a', TRS(F.x, y, F.z, 0, 0, 0, s, 1, s));
      for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; B.porcelain.add(GEO.sph(6, 4), '#ffffff', TRS(F.x + Math.cos(a) * 1.04 * s, y + 0.31, F.z + Math.sin(a) * 1.04 * s, 0, 0, 0, 0.06 + s * 0.03)); }
    }
    B.gloss.add(GEO.sph(16, 12), '#d42c46', TRS(F.x, 2.98, F.z, 0, 0, 0, 0.2));
    B.wood.add(tubeGeo([[F.x, 3.12, F.z], [F.x + 0.06, 3.3, F.z], [F.x + 0.16, 3.38, F.z]], 0.02, 8, 4), '#4f7a3a');
    circC(F.x, F.z, 2.18, 0.7);
    // chocolate in the basin and the bowls, and the curtains that pour from bowl to bowl (shown when the dance of chocolate is done)
    const fg = new THREE.Group(); fg.position.copy(F); root.add(fg); fg.visible = false;
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.84, 40), MAT4.choc); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.33; fg.add(pool);
    const flows = [];
    const pour = (yTop, rTop, yBot, rBot) => {
      const h = yTop - yBot, g = new THREE.CylinderGeometry(rTop, rBot, h, 40, 1, true); g.translate(0, -h / 2, 0);
      const U = g.attributes.uv; for (let i = 0; i < U.count; i++) U.setXY(i, U.getX(i) * 6, U.getY(i) * 1.2);
      const m = new THREE.Mesh(g, MAT4.flow); m.position.y = yTop; fg.add(m); flows.push(m);
    };
    for (let k = 0; k < W.tiers.length; k++) {
      const [y, s] = W.tiers[k];
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.97 * s, 32), MAT4.choc); disc.rotation.x = -Math.PI / 2; disc.position.y = y + 0.3; fg.add(disc);
      pour(y + 0.33, 1.05 * s, k === 0 ? 0.5 : W.tiers[k - 1][0] + 0.3, 1.1 * s);
    }
    W.fountain = {
      on: 0, group: fg, pool, flows,
      set(k) { this.on = k; fg.visible = k > 0.001; pool.position.y = lerp(0.31, 0.52, k); flows.forEach((m) => { m.scale.y = Math.max(0.001, k); }); },
    };
  }

  /* ---------------- lamp posts, lantern strings and pennants along the avenue ---------------- */
  const PX = SWEET.postX;
  for (const z of SWEET.posts) { lampPost(-PX, z, Math.PI); lampPost(PX, z, 0); }
  // strings across the avenue: dark star lanterns that light up when the coffee dance is done
  const starB = new Batch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.6, emissive: '#ffcf7a', emissiveIntensity: 0 }));
  const starGlow = [];
  const starLantern = (x, y, z) => {
    starB.add(GEO.cyl(6), '#c9a24d', TRS(x, y + 0.32, z, 0, 0, 0, 0.012, 0.22, 0.012));
    starB.add(GEO.sph(10, 8), '#2f8790', TRS(x, y, z, 0, 0, 0, 0.17, 0.21, 0.17));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; starB.add(GEO.cone(5), '#e9c46e', TRS(x + Math.cos(a) * 0.2, y, z + Math.sin(a) * 0.2, 0, -a, -Math.PI / 2, 0.06, 0.16, 0.06)); }
    starB.add(GEO.cone(6), '#e9c46e', TRS(x, y + 0.26, z, 0, 0, 0, 0.09, 0.14, 0.09)); starB.add(GEO.cone(6), '#e9c46e', TRS(x, y - 0.27, z, Math.PI, 0, 0, 0.08, 0.16, 0.08));
    starGlow.push({ p: [x, y, z], c: pick(['#ffd98a', '#9ff0e6', '#ffe3b0']), s: 1.5, tw: 0.35 });
  };
  for (const z of SWEET.posts) {
    const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(V3(lerp(-PX + 0.72, PX - 0.72, t), 3.36 - Math.sin(t * Math.PI) * 0.55, z)); }
    B.gold.add(tubeGeo(pts, 0.014, 32, 4), '#e2b85e');
    for (let k = 1; k <= 5; k++) { const t = k / 6, p = pts[Math.round(t * 16)]; starLantern(p.x, p.y - 0.42, z); }
  }
  W.starLanterns = starB.build({ cast: false }); root.add(W.starLanterns);
  W.starGlow = makeGlowPoints(starGlow, { boost: 0 }); root.add(W.starGlow);
  // round paper lanterns along both edges: dark until the tea dance is done
  const lanB = new Batch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0, emissive: '#ff6a3c', emissiveIntensity: 0 }));
  const lanGlow = [];
  const paperLantern = (x, y, z, s = 1) => {
    lanB.add(GEO.sph(14, 10), (px, py, pz) => (Math.floor((Math.atan2(px, pz) / TAU) * 12 + 100) % 2 ? '#d8303f' : '#c42536'), TRS(x, y, z, 0, 0, 0, 0.27 * s, 0.22 * s, 0.27 * s));
    lanB.add(GEO.cyl(10), '#e0b25c', TRS(x, y + 0.22 * s, z, 0, 0, 0, 0.13 * s, 0.05 * s, 0.13 * s)); lanB.add(GEO.cyl(10), '#e0b25c', TRS(x, y - 0.22 * s, z, 0, 0, 0, 0.13 * s, 0.05 * s, 0.13 * s));
    lanB.add(GEO.cyl(4), '#e0b25c', TRS(x, y - 0.36 * s, z, 0, 0, 0, 0.012, 0.18 * s, 0.012));
    lanGlow.push({ p: [x, y, z], c: '#ffb36b', s: 1.9 * s, tw: 0.25 });
  };
  for (const sx of [-1, 1]) {
    for (const z of SWEET.posts) paperLantern(sx * (PX - 0.72), 2.85, z, 1.1);
    for (let k = 0; k < SWEET.posts.length - 1; k++) {
      const z0 = SWEET.posts[k], z1 = SWEET.posts[k + 1], pts = [];
      // no string in front of a stage: it would hang across the view of the dancers
      if (SWEET.stages.some((st) => Math.sign(st.x) === sx && st.z < z0 && st.z > z1)) continue;
      for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(V3(sx * (PX + 0.02), 3.3 - Math.sin(t * Math.PI) * 0.6, lerp(z0, z1, t))); }
      B.gold.add(tubeGeo(pts, 0.012, 24, 4), '#e2b85e');
      for (let j = 1; j <= 3; j++) { const p = pts[j * 3]; paperLantern(p.x, p.y - 0.36, p.z, 0.85); }
    }
  }
  W.paperLanterns = lanB.build({ cast: false }); root.add(W.paperLanterns);
  W.lanternGlow = makeGlowPoints(lanGlow, { boost: 0 }); root.add(W.lanternGlow);
  // pennants (red and gold) that unfurl on every lamp post when the chocolate dance is done
  {
    const fl = new THREE.Shape(); fl.moveTo(0, 0); fl.lineTo(0.62, 0); fl.lineTo(0.62, -0.95); fl.lineTo(0.31, -0.72); fl.lineTo(0, -0.95); fl.closePath();
    const fb = new Batch(MAT.satin);
    fb.add(new THREE.ShapeGeometry(fl), (x, y) => (y > -0.22 ? '#e2b85e' : Math.floor((x + 1) * 6) % 2 ? '#c9283f' : '#a81e33'));
    const flagMat = MAT.satin.clone(); flagMat.side = THREE.DoubleSide;
    const flags = new THREE.InstancedMesh(fb.build().geometry, flagMat, SWEET.posts.length * 2);
    flags.castShadow = false; flags.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(flags);
    const spots = [];
    // each pennant hangs from a short gold bar on the outer side of its post, facing down the avenue
    for (const sx of [-1, 1]) for (const z of SWEET.posts) spots.push({ x: sx * (PX + 0.36), z: z + 0.02, y: 3.05 });
    for (const s of spots) B.gold.add(GEO.cyl(6), '#e2b85e', TRS(s.x, s.y + 0.03, s.z, 0, 0, Math.PI / 2, 0.02, 0.7, 0.02));
    W.flags = {
      k: 0, mesh: flags, spots,
      set(k, t = 0) {
        this.k = k;
        spots.forEach((s, i) => {
          const u = clamp(k * 1.6 - i * 0.07, 0, 1), sway = Math.sin(t * 2.2 + i) * 0.08 * u;
          flags.setMatrixAt(i, TRS(s.x - 0.31, s.y, s.z, 0, sway, 0, 1, Math.max(0.001, Ease.outBack(u)), 1));
        });
        flags.instanceMatrix.needsUpdate = true; flags.visible = k > 0.001;
      },
    };
  }

  /* ---------------- the three dance stages ---------------- */
  const THEME = {
    choco: { top: '#e6c19c', side: '#5a2a1c', trim: '#e2b85e', drape: '#9a2236', column: caneStripe('#9a2236', '#f6dd96') },
    coffee: { top: '#d6c3e6', side: '#3e2054', trim: '#e9c46e', drape: '#2f8790', column: caneStripe('#e9c46e', '#3e2054') },
    tea: { top: '#e3d6b6', side: '#2f7d68', trim: '#e0b25c', drape: '#c42536', column: caneStripe('#c42536', '#c42536') },
  };
  W.stages = {};
  for (const st of SWEET.stages) {
    const T = THEME[st.id], M = TRS(st.x, 0, st.z, 0, st.yaw, 0);
    ALL.forEach((b) => b.push(M));
    // platform: a round cake with frosting scallops and a gold edge
    B.satin.add(lathe([[0, 0.5], [2.58, 0.5], [2.74, 0.44], [2.76, 0.08], [2.64, 0]], 48, 0), (x, y, z) => (y > 0.47 ? (Math.floor(Math.hypot(x, z) * 2.2) % 2 ? T.top : new THREE.Color(T.top).offsetHSL(0, 0, -0.04).getStyle()) : T.side));
    B.gold.add(GEO.torus(2.7, 0.04, 6, 64), T.trim, TRS(0, 0.47, 0, Math.PI / 2, 0, 0));
    for (let i = 0; i < 30; i++) { const a = (i / 30) * TAU; B.porcelain.add(GEO.sph(8, 6), '#fffaf4', TRS(Math.cos(a) * 2.77, 0.36, Math.sin(a) * 2.77, 0, 0, 0, 0.13, 0.16, 0.1)); }
    B.wood.add(GEO.box(), T.side, TRS(0, 0.1, 3.18, 0, 0, 0, 1.9, 0.2, 0.44)); B.wood.add(GEO.box(), T.side, TRS(0, 0.19, 2.82, 0, 0, 0, 1.9, 0.38, 0.4));
    B.gold.add(GEO.box(), T.trim, TRS(0, 0.205, 3.4, 0, 0, 0, 1.9, 0.02, 0.02)); B.gold.add(GEO.box(), T.trim, TRS(0, 0.385, 3.02, 0, 0, 0, 1.9, 0.02, 0.02));
    // backdrop frame and painted banner
    for (const sx of [-1, 1]) {
      B.gloss.add(GEO.cyl(14), T.column, TRS(sx * 1.55, 0.5 + 1.85, -2.15, 0, 0, 0, 0.13, 3.7, 0.13));
      B.gold.add(GEO.sph(10, 8), T.trim, TRS(sx * 1.55, 4.28, -2.15, 0, 0, 0, 0.17));
      B.satin.add(drapeGeo(1.05, 3.55, 3, 0.07, { tie: 0.62, tieSide: sx, segX: 18, segY: 12 }), T.drape, TRS(sx * 1.85, 4.15, -1.95, 0, sx * -0.25, 0));
    }
    B.gold.add(GEO.box(), T.trim, TRS(0, 4.12, -2.15, 0, 0, 0, 3.3, 0.16, 0.2));
    const bg = new THREE.PlaneGeometry(2.86, 3.5), cell = st.cell;
    B.banner.add(bg, '#ffffff', TRS(0, 0.5 + 1.82, -2.2), [(cell + 0.006) / 3, 0.006, (cell + 0.994) / 3, 0.994]);
    B.wood.add(GEO.box(), '#4a2a1c', TRS(0, 2.32, -2.3, 0, 0, 0, 3.0, 3.6, 0.08));
    // crowns of the three stages
    if (st.id === 'choco') {
      const fan = new THREE.CircleGeometry(1.7, 24, 0, Math.PI);
      B.satin.add(fan, (x, y) => { const a = Math.atan2(y, x); return Math.hypot(x, y) > 1.55 ? '#e2b85e' : Math.floor(a / Math.PI * 12) % 2 ? '#9a2236' : '#2a1216'; }, TRS(0, 4.2, -2.2));
      B.satin.add(fan, '#5a1a24', TRS(0, 4.2, -2.24, 0, Math.PI, 0));
      for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI; B.gold.add(GEO.sph(6, 4), '#f6dd96', TRS(Math.cos(a) * 1.7, 4.2 + Math.sin(a) * 1.7, -2.18, 0, 0, 0, 0.06)); }
      for (const sx of [-1, 1]) {
        B.wood.add(lathe([[0.2, 0], [0.26, 0.3], [0.2, 0.42], [0.24, 0.46]], 14, 0), '#c8693e', TRS(sx * 2.0, 0.5, -1.2));
        for (let i = 0; i < 7; i++) { const a = rnd(0, TAU), d = rnd(0, 0.16); B.gloss.add(GEO.sph(10, 8), i % 3 ? '#d8344c' : '#f05a70', TRS(sx * 2.0 + Math.cos(a) * d, 1.02 + rnd(0, 0.24), -1.2 + Math.sin(a) * d, 0, 0, 0, 0.1)); }
        B.cloth.add(GEO.sph(10, 8), '#3f7a46', TRS(sx * 2.0, 0.98, -1.2, 0, 0, 0, 0.24, 0.14, 0.24));
      }
    } else if (st.id === 'coffee') {
      B.gold.add(GEO.cyl(18), T.trim, TRS(0, 4.32, -2.15, 0, 0, 0, 0.55, 0.22, 0.55));
      B.gloss.add(lathe([[0.62, 0], [0.74, 0.3], [0.62, 0.7], [0.3, 1.0], [0.08, 1.24], [0.0, 1.3]], 24, 18), stripes('#2f8790', '#e9c46e', 12, 0), TRS(0, 4.42, -2.15));
      B.gold.add(GEO.cone(8), '#f2d48a', TRS(0, 5.9, -2.15, 0, 0, 0, 0.05, 0.4, 0.05));
      for (const sx of [-1, 1]) {
        B.gloss.add(lathe([[0.2, 0], [0.24, 0.12], [0.16, 0.3], [0.06, 0.42], [0, 0.45]], 14, 10), stripes('#2f8790', '#e9c46e', 8, 0), TRS(sx * 1.55, 4.4, -2.15));
        // a brass coffee pot on a little table
        B.wood.add(GEO.cyl(12), '#5a2a1c', TRS(sx * 2.0, 0.78, -1.15, 0, 0, 0, 0.32, 0.05, 0.32)); B.wood.add(GEO.cyl(8), '#5a2a1c', TRS(sx * 2.0, 0.64, -1.15, 0, 0, 0, 0.05, 0.28, 0.05));
        B.gold.add(lathe([[0, 0], [0.16, 0.02], [0.2, 0.14], [0.12, 0.3], [0.08, 0.42], [0.12, 0.48], [0.05, 0.56], [0, 0.6]], 16, 12), '#e2b85e', TRS(sx * 2.0, 0.81, -1.15));
        B.gold.add(tubeGeo([[0.12, 0.12, 0], [0.24, 0.3, 0], [0.32, 0.5, 0], [0.36, 0.52, 0]], 0.022, 12, 6), '#e2b85e', TRS(sx * 2.0, 0.81, -1.15, 0, sx > 0 ? Math.PI : 0, 0));
      }
    } else {
      // a pagoda roof over the backdrop, with upturned corners
      const roof = (y, w, d, h) => {
        B.gloss.add(GEO.cone(4), (x, yy) => (yy > -0.1 ? '#c42536' : '#2f7d68'), TRS(0, y + h / 2, -2.15, 0, Math.PI / 4, 0, w * 0.72, h, d * 0.72));
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.gold.add(GEO.cone(6), '#e0b25c', TRS(sx * w / 2, y + 0.12, -2.15 + sz * d / 2, sz * 0.5, 0, -sx * 0.9, 0.06, 0.32, 0.06));
        B.gold.add(GEO.box(), '#e0b25c', TRS(0, y + 0.02, -2.15, 0, 0, 0, w * 0.98, 0.08, d * 0.98));
      };
      roof(4.22, 3.9, 1.3, 0.62); roof(4.95, 2.6, 0.9, 0.55);
      B.gold.add(GEO.sph(10, 8), '#e0b25c', TRS(0, 5.6, -2.15, 0, 0, 0, 0.12));
      // a teapot on a low table and a blossom tree in a pot
      B.wood.add(GEO.cyl(12), '#5a2a1c', TRS(2.0, 0.7, -1.15, 0, 0, 0, 0.4, 0.05, 0.4)); B.wood.add(GEO.box(), '#5a2a1c', TRS(2.0, 0.6, -1.15, 0, 0, 0, 0.5, 0.2, 0.06));
      B.porcelain.add(GEO.sph(14, 10), '#f6f1e6', TRS(2.0, 0.88, -1.15, 0, 0, 0, 0.17, 0.14, 0.17));
      B.porcelain.add(tubeGeo([[0.14, 0.04, 0], [0.24, 0.1, 0], [0.3, 0.18, 0]], 0.025, 8, 6), '#f6f1e6', TRS(2.0, 0.84, -1.15));
      B.porcelain.add(GEO.torus(0.08, 0.018, 6, 12), '#f6f1e6', TRS(1.84, 0.9, -1.15, 0, 0, Math.PI / 2));
      B.gold.add(GEO.sph(8, 6), '#e0b25c', TRS(2.0, 1.03, -1.15, 0, 0, 0, 0.035));
      B.wood.add(lathe([[0.22, 0], [0.26, 0.28], [0.3, 0.3]], 14, 0), '#2f7d68', TRS(-2.0, 0.5, -1.2));
      B.wood.add(tubeGeo([[-2.0, 0.78, -1.2], [-2.08, 1.2, -1.2], [-1.92, 1.55, -1.16], [-2.05, 1.85, -1.2]], 0.04, 12, 5), '#5a3a2a');
      for (let i = 0; i < 16; i++) B.cloth.add(GEO.sph(8, 6), i % 3 ? '#ffc2d4' : '#ff9cb8', TRS(-2.0 + rnd(-0.4, 0.4), rnd(1.25, 2.05), -1.2 + rnd(-0.3, 0.3), 0, 0, 0, rnd(0.1, 0.17)));
    }
    // footlights along the front edge
    for (let i = 0; i < 9; i++) { const a = lerp(-0.85, 0.85, i / 8), p = stageToWorld(st, Math.sin(a) * 2.52, 0.6, Math.cos(a) * 2.52); glows.push({ p: [p.x, p.y, p.z], c: '#ffe0a0', s: 0.6, tw: 0.2 }); B.gold.add(GEO.sph(6, 4), '#ffe8b0', TRS(Math.sin(a) * 2.52, 0.54, Math.cos(a) * 2.52, 0, 0, 0, 0.05)); }
    ALL.forEach((b) => b.pop());
    // colliders: the round stage (walkable), its steps and the backdrop
    circC(st.x, st.z, 2.76, 0.5, true);
    stageBox(st, -0.95, 0.95, 2.98, 3.4, 0.2, true); stageBox(st, -0.95, 0.95, 2.62, 3.02, 0.38, true);
    stageBox(st, -1.75, 1.75, -2.45, -1.95, 6);
    W.stages[st.id] = { def: st, dancerAt: stageToWorld(st, 0, 0.5, -0.35), front: stageToWorld(st, 0, 0, 4.3) };
  }

  /* ---------------- the teacup pagoda that appears on the tea stage ---------------- */
  {
    const st = SWEET.stages[2], tb = new Batch(MAT.porcelain), p = stageToWorld(st, 1.55, 0.5, 1.3);
    for (let i = 0; i < 8; i++) {
      const y = i * 0.23;
      tb.add(GEO.cyl(18), '#f6f1e6', TRS(0, y + 0.02, 0, 0, 0, 0, 0.22, 0.03, 0.22));
      tb.add(lathe([[0.07, 0], [0.13, 0.05], [0.16, 0.16], [0.165, 0.19]], 16, 0), (x, yy) => (yy > 0.12 ? '#d13a4c' : yy > 0.06 ? '#3a957a' : '#f6f1e6'), TRS(0, y + 0.035, 0));
    }
    tb.add(GEO.sph(10, 8), '#e0b25c', TRS(0, 8 * 0.23 + 0.05, 0, 0, 0, 0, 0.06));
    W.pagoda = tb.build({ cast: false }); W.pagoda.position.copy(p); W.pagoda.visible = false; root.add(W.pagoda);
    circC(p.x, p.z, 0.3, 2.2);
  }

  /* ---------------- stalls of the candy makers ---------------- */
  W.stalls = [];
  for (const [x, z, awn, kind] of [[9.6, 8.6, '#f4a9c0', 'cake'], [9.6, -8.6, '#9fe0cf', 'candy']]) {
    const M = TRS(x, 0, z, 0, -Math.PI / 2, 0);
    ALL.forEach((b) => b.push(M));
    B.wood.add(roundBox(3.2, 1.0, 1.1, 0.06, 2), '#e9c79a', TRS(0, 0.5, 0));
    B.porcelain.add(GEO.box(), '#ffffff', TRS(0, 1.02, 0, 0, 0, 0, 3.3, 0.06, 1.2));
    for (const sx of [-1, 1]) B.gloss.add(GEO.cyl(10), caneStripe('#e23a52', '#fff8f4'), TRS(sx * 1.5, 1.6, -0.45, 0, 0, 0, 0.07, 3.2, 0.07));
    const aw = new THREE.CylinderGeometry(0.75, 0.75, 3.4, 20, 1, true, 0, Math.PI); aw.rotateZ(Math.PI / 2);
    B.satin.add(aw, (px, py, pz) => (Math.floor((px + 2) * 3) % 2 ? awn : '#ffffff'), TRS(0, 3.05, -0.1, 0, 0, 0, 1, 1, 1));
    for (let i = 0; i < 9; i++) B.satin.add(GEO.sph(8, 6), i % 2 ? awn : '#ffffff', TRS(-1.6 + i * 0.4, 2.35, 0.62, 0, 0, 0, 0.17, 0.12, 0.08));
    if (kind === 'cake') {
      for (const [y, r, c] of [[1.05, 0.62, '#fff1f4'], [1.45, 0.46, '#f8c8d6'], [1.8, 0.3, '#fff1f4']]) {
        B.porcelain.add(GEO.cyl(24), c, TRS(0.2, y + 0.19, 0, 0, 0, 0, r, 0.38, r));
        for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; B.porcelain.add(GEO.sph(6, 4), '#ffffff', TRS(0.2 + Math.cos(a) * r, y + 0.38, Math.sin(a) * r, 0, 0, 0, 0.05)); }
      }
      for (let i = 0; i < 5; i++) B.gloss.add(GEO.sph(8, 6), '#d42c46', TRS(0.2 + Math.cos(i * 1.25) * 0.18, 2.22, Math.sin(i * 1.25) * 0.18, 0, 0, 0, 0.06));
      cupcake(-1.0, 0.1, 0.32, '#f4a9c0', '#fff1f4'); cupcake(1.25, 0.15, 0.28, '#9fe0cf', '#ffe3ec');
    } else {
      for (let i = 0; i < 5; i++) {
        const xx = -1.2 + i * 0.6, c = ['#ff8fb1', '#8fd3ff', '#ffe27a', '#a8e6b8', '#c9a6ff'][i];
        B.crystal.add(GEO.cyl(14), '#ffffff', TRS(xx, 1.33, 0, 0, 0, 0, 0.2, 0.55, 0.2));
        for (let k = 0; k < 6; k++) B.gloss.add(GEO.sph(6, 4), c, TRS(xx + rnd(-0.1, 0.1), 1.12 + k * 0.07, rnd(-0.1, 0.1), 0, 0, 0, 0.07));
        B.gold.add(GEO.cyl(12), '#e2b85e', TRS(xx, 1.63, 0, 0, 0, 0, 0.21, 0.05, 0.21));
      }
    }
    ALL.forEach((b) => b.pop());
    boxC(x - 0.7, x + 0.7, z - 1.75, z + 1.75, 3);
    W.stalls.push({ x, z, kind });
  }

  /* ---------------- houses, trees and sweets around the avenue ---------------- */
  house(-16.5, 12.5, 4.2, 3.4, 3.4, Math.PI / 2, '#b8743f', '#ffd1dc');
  house(-17.0, 0.0, 4.6, 3.6, 3.8, Math.PI / 2, '#a8683a', '#c9f0e4');
  house(-16.0, -11.5, 3.8, 3.2, 3.2, Math.PI / 2, '#c07f48', '#fff0b8');
  house(16.8, 4.2, 4.2, 3.4, 3.6, -Math.PI / 2, '#b8743f', '#e3d4ff');
  house(16.4, -5.2, 3.8, 3.2, 3.2, -Math.PI / 2, '#a8683a', '#ffd1dc');
  house(16.0, 14.0, 4.0, 3.2, 3.4, -Math.PI / 2, '#c07f48', '#c9f0e4');
  for (const [x, z] of [[-11.4, 12.6], [11.6, 12.6], [-11.8, -0.2], [12.2, 3.8], [12.2, -4.2], [-11.6, -12.0], [11.4, -12.2]]) lolly(x, z, rnd(2.2, 3.0), rnd(0.7, 0.95), pick(['#ff7aa2', '#7fc8ff', '#ffb347', '#9be3a8']), '#fff8f4');
  for (const [x, z] of [[-13.6, 9.4], [-13.4, 3.6], [-13.8, -3.6], [-13.4, -9.6], [13.8, 11.0], [13.6, -1.0], [13.4, -11.4], [13.8, 7.6]]) flossTree(x, z, rnd(2.8, 3.8), pick(['#ffc6dd', '#cfe3ff', '#e6d1ff']));
  for (const [x, z, s] of [[-7.2, 13.4, 0.55], [7.0, 13.2, 0.6], [-12.2, 6.2, 0.7], [-12.4, -2.4, 0.55], [12.4, 9.8, 0.6], [12.6, -10.0, 0.7], [-7.0, -12.7, 0.5], [7.2, -12.6, 0.55]]) gumdrop(x, z, s, pick(['#ff6b8a', '#7fd0ff', '#ffe066', '#9be3a8', '#c39bff']));
  for (const [x, z, h, yaw] of [[-12.2, 11.0, 2.4, 0.3], [12.0, 12.0, 2.6, 2.6], [-12.4, -5.0, 2.2, 1.2], [12.4, -6.6, 2.5, -2.0]]) candyCane(x, z, h, yaw);
  for (const [x, z, s] of [[-10.8, 13.8, 0.45], [10.6, 13.9, 0.5], [-4.8, 13.6, 0.35], [4.6, 13.7, 0.38]]) cupcake(x, z, s, pick(['#f4a9c0', '#9fe0cf', '#ffe066']), pick(['#fff1f4', '#ffe3ec', '#f2ecff']));
  W.colliders.push(...[[-11.4, 12.6], [11.6, 12.6], [-11.8, -0.2], [12.2, 3.8], [12.2, -4.2], [-11.6, -12.0], [11.4, -12.2]].map(([x, z]) => ({ t: 'c', x, z, r: 0.25, top: 4, bottom: 0, walk: false, on: true })));
  for (const [x, z, s] of [[-7.2, 13.4, 0.55], [7.0, 13.2, 0.6], [-12.2, 6.2, 0.7], [-12.4, -2.4, 0.55], [12.4, 9.8, 0.6], [12.6, -10.0, 0.7], [-7.0, -12.7, 0.5], [7.2, -12.6, 0.55]]) circC(x, z, 0.8 * s, s);
  for (const [x, z] of [[-10.8, 13.8], [10.6, 13.9], [-4.8, 13.6], [4.6, 13.7]]) circC(x, z, 0.3, 1);
  // across the river: candy hills, lollipops and floss trees
  for (let i = 0; i < 18; i++) { const x = rnd(-60, 60), z = rnd(-62, -24); B.icing.add(GEO.hemi(18, 8), pick(['#fff2f6', '#ffe0ec', '#f3e6ff']), TRS(x, -0.3, z, 0, 0, 0, rnd(4, 9), rnd(1.6, 3.6), rnd(4, 8))); }
  for (let i = 0; i < 26; i++) { const x = rnd(-46, 46), z = rnd(-44, -22); if (Math.abs(x) < 9 && z < -30) continue; if (i % 2) lolly(x, z, rnd(2.6, 4.4), rnd(0.8, 1.3), pick(['#ff7aa2', '#7fc8ff', '#ffb347', '#9be3a8']), '#fff8f4', i % 4 === 1); else flossTree(x, z, rnd(3.2, 5.0), pick(['#ffc6dd', '#cfe3ff', '#e6d1ff'])); }
  for (let i = 0; i < 10; i++) { const sx = i % 2 ? 1 : -1; candyCane(sx * rnd(20, 40), rnd(-10, 22), rnd(3, 5), rnd(0, TAU), pick(['#e23a52', '#3aa07a']), 0.18); }

  /* ---------------- the candy bridge (raised from the chocolate in the finale) ---------------- */
  {
    const NB = 14, z0 = R1 + 0.5, z1 = R0 - 0.5, deck = (t) => 0.16 + Math.sin(t * Math.PI) * 0.7;
    for (const sx of [-1, 1]) for (const [z, h] of [[z0 + 0.25, 1.6], [z1 - 0.25, 1.6]]) {
      B.gloss.add(GEO.cyl(14), caneStripe('#e23a52', '#fff8f4'), TRS(sx * 1.62, h / 2, z, 0, 0, 0, 0.17, h, 0.17));
      B.gold.add(GEO.sph(12, 8), '#e8c97a', TRS(sx * 1.62, h + 0.12, z, 0, 0, 0, 0.24));
      glows.push({ p: [sx * 1.62, h + 0.5, z], c: '#ffe3b0', s: 1.4, tw: 0.2 });
    }
    const plankGeo = roundBox(2.9, 0.14, (z0 - z1) / NB * 0.94, 0.04, 1);
    const planks = new THREE.InstancedMesh(plankGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 }), NB);
    planks.instanceMatrix.setUsage(THREE.DynamicDrawUsage); planks.castShadow = false; planks.receiveShadow = true;
    const pc = new THREE.Color();
    for (let i = 0; i < NB; i++) planks.setColorAt(i, pc.set(i % 2 ? '#f4b4c6' : '#f8e6c8'));
    root.add(planks);
    const railB = new Batch(MAT.gloss);
    for (const sx of [-1, 1]) {
      const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(V3(sx * 1.42, deck(t) + 0.85, lerp(z0, z1, t))); }
      railB.add(tubeGeo(pts, 0.07, 48, 8), (px, py, pz) => (Math.floor((pz * 2.2 + 100) * 1.5) % 2 ? '#e23a52' : '#fff8f4'));
      for (let i = 1; i < 10; i++) { const t = i / 10; railB.add(GEO.cyl(8), '#fff8f4', TRS(sx * 1.42, deck(t) + 0.42, lerp(z0, z1, t), 0, 0, 0, 0.045, 0.85, 0.045)); }
    }
    const rails = railB.build({ cast: false }); root.add(rails);
    // the finished bridge can be walked on: one walkable box per plank, and the river in between opens
    const deckCols = [];
    for (let i = 0; i < NB; i++) { const za = lerp(z0, z1, i / NB), zb = lerp(z0, z1, (i + 1) / NB); deckCols.push({ t: 'b', x0: -1.35, x1: 1.35, z0: Math.min(za, zb), z1: Math.max(za, zb), top: deck((i + 0.5) / NB) + 0.07, bottom: -1, walk: true, on: false }); }
    W.colliders.push(...deckCols);
    W.bridge = {
      k: 0, planks, rails, NB, z0, z1, deck,
      set(k) {
        this.k = k;
        const built = k >= 0.999;
        deckCols.forEach((c) => { c.on = built; }); W.riverMid.on = !built;
        if (W.bounds) W.bounds.z0 = built ? R0 - 2 : R1 + 0.6;
        for (let i = 0; i < NB; i++) {
          const t = (i + 0.5) / NB, u = clamp(k * 1.5 - (i / NB) * 0.9, 0, 1), y = lerp(-1.4, deck(t), Ease.outBack(u)), z = lerp(z0, z1, t);
          const tilt = Math.atan2(deck(t + 0.02) - deck(t - 0.02), -(z1 - z0) * 0.04);
          planks.setMatrixAt(i, u <= 0 ? TRS(0, -5, z, 0, 0, 0, 0.001) : TRS(0, y, z, tilt, 0, 0, 1, 1, 1));
        }
        planks.instanceMatrix.needsUpdate = true;
        const r = clamp((k - 0.62) / 0.38, 0, 1); rails.visible = r > 0.001; rails.scale.set(1, Math.max(0.001, Ease.outBack(r)), 1);
      },
    };
  }

  /* ---------------- the Sugar Plum Palace on its hill, far beyond the river ---------------- */
  {
    const P = SWEET.palace, pb = new Batch(MAT4.palace), cb = new Batch(MAT4.crystal), win = [];
    pb.add(GEO.hemi(32, 12), '#fff0f6', TRS(P.x, -1, P.z, 0, 0, 0, 22, 6.5, 14));
    const y0 = 5.2;
    pb.add(roundBox(14, 4.2, 6, 0.4, 2), '#fde4ee', TRS(P.x, y0 + 2.1, P.z));
    pb.add(GEO.box(), '#e8c97a', TRS(P.x, y0 + 4.25, P.z, 0, 0, 0, 14.3, 0.25, 6.3));
    const spire = (x, z, r, h, top) => {
      pb.add(GEO.cyl(18), '#fff4f8', TRS(x, y0 + h / 2, z, 0, 0, 0, r, h, r));
      pb.add(GEO.torus(r * 1.02, 0.08, 6, 24), '#e8c97a', TRS(x, y0 + h, z, Math.PI / 2, 0, 0));
      cb.add(lathe([[r * 1.1, 0], [r * 1.3, r * 0.6], [r * 0.9, r * 1.5], [r * 0.3, r * 2.3], [0, r * 2.9]], 20, 14), top, TRS(x, y0 + h, z));
      pb.add(GEO.cone(8), '#e8c97a', TRS(x, y0 + h + r * 2.9 + 0.5, z, 0, 0, 0, 0.12, 1.0, 0.12));
      for (let k = 0; k < 3; k++) win.push({ p: [x, y0 + h * (0.35 + k * 0.2), z + r * 0.98], c: '#ffe7b8', s: 2.2, tw: 0.2 });
    };
    spire(P.x, P.z, 1.6, 9.5, '#ffc2dc');
    for (const sx of [-1, 1]) { spire(P.x + sx * 5.2, P.z + 0.5, 1.05, 6.2, '#cfe6ff'); spire(P.x + sx * 8.2, P.z + 1.2, 0.8, 4.2, '#ffe9b8'); }
    for (let i = 0; i < 9; i++) win.push({ p: [P.x - 5.6 + i * 1.4, y0 + 2.2, P.z + 3.05], c: '#ffe7b8', s: 1.8, tw: 0.25 });
    W.palace = { glow: makeGlowPoints(win, { boost: 0.35 }) };
    root.add(pb.build({ cast: false, receive: false }), cb.build({ cast: false, receive: false }), W.palace.glow);
    W.palace.set = (k) => { MAT4.palace.emissiveIntensity = k * 0.35; MAT4.crystal.emissiveIntensity = 0.18 + k * 0.5; W.palace.glow.material.uniforms.uBoost.value = 0.35 + k * 1.2; };
  }

  /* ---------------- sky, clouds, floating sugar sparkles ---------------- */
  W.sky = new THREE.Group(); root.add(W.sky);
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(118, 118, 150, 40, 1, true), MAT4.sky); dome.position.y = 70; dome.renderOrder = -2; W.sky.add(dome);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(118, 32), new THREE.MeshBasicMaterial({ color: '#2c1f5e', fog: false, toneMapped: false })); cap.rotation.x = Math.PI / 2; cap.position.y = 144; W.sky.add(cap);
  // marshmallow clouds high around the kingdom (kept off the line of sight to the palace)
  const cl = new Batch(new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false }));
  for (let i = 0; i < 9; i++) {
    let a = (i / 9) * TAU + rnd(-0.2, 0.2); if (Math.abs(angleDiff(a, -Math.PI / 2)) < 0.45) a += 0.9;
    const r = rnd(46, 72), cx = Math.cos(a) * r, cz = Math.sin(a) * r - 6, cy = rnd(24, 34);
    for (let k = 0; k < 6; k++) cl.add(GEO.sph(12, 8), pick(['#fff8fb', '#ffe6f1', '#f3eaff']), TRS(cx + (k - 2.5) * rnd(1.6, 2.4), cy + rnd(-0.6, 0.8), cz + rnd(-1, 1), 0, 0, 0, rnd(1.8, 3.2), rnd(1.2, 2.0), rnd(1.6, 2.6)));
  }
  W.clouds = cl.build({ cast: false, receive: false }); root.add(W.clouds);
  const spark = []; for (let i = 0; i < 80; i++) spark.push({ p: [rnd(-20, 20), rnd(1, 9), rnd(-14, 16)], c: pick(['#fff1f8', '#ffe3a8', '#d9f6ff', '#ffd1e6']), s: rnd(0.5, 1.0), tw: 0.85 });
  root.add(makeGlowPoints(spark, { boost: 0.8 }));

  /* ---------------- finalize static batches ---------------- */
  for (const k in B) {
    if (B[k].empty) continue;
    const m = B[k].build({ cast: k !== 'glow' && k !== 'banner', receive: true, name: k });
    m.matrixAutoUpdate = false; m.updateMatrix();
    root.add(m);
  }
  W.glows = makeGlowPoints(glows); root.add(W.glows);

  /* ---------------- lights ---------------- */
  const L = {};
  L.hemi = new THREE.HemisphereLight('#fff0f6', '#c493b0', 1.2);
  L.key = new THREE.DirectionalLight('#fff1e2', 2.1);
  L.key.position.set(-16, 30, 24); L.key.target.position.set(0, 0, 0);
  L.key.castShadow = true;
  const sm = DEVICE.mobile ? 1024 : 2048;
  L.key.shadow.mapSize.set(sm, sm);
  Object.assign(L.key.shadow.camera, { left: -27, right: 27, top: 26, bottom: -26, near: 4, far: 96 });
  L.key.shadow.bias = -0.0008; L.key.shadow.normalBias = 0.05; L.key.shadow.radius = 2.5;
  L.rim = new THREE.DirectionalLight('#d9c8ff', 0.6); L.rim.position.set(14, 18, -30);
  root.add(L.hemi, L.key, L.key.target, L.rim);
  W.lights = L;
  W.bounds = { x0: -12.6, x1: 12.6, z0: SWEET.river.z1 + 0.6, z1: SWEET.arch.z - 0.4 };

  W.setDeco = (id, k) => {
    W.deco[id] = k;
    if (id === 'choco') { W.fountain.set(k); W.flags.set(k); }
    else if (id === 'coffee') { W.starLanterns.material.emissiveIntensity = k * 0.85; W.starGlow.material.uniforms.uBoost.value = k * 1.25; }
    else if (id === 'tea') { W.paperLanterns.material.emissiveIntensity = k * 0.75; W.lanternGlow.material.uniforms.uBoost.value = k * 1.2; W.pagoda.visible = k > 0.001; W.pagoda.scale.setScalar(Math.max(0.001, Ease.outBack(clamp(k, 0, 1)))); }
  };
  W.reset = () => { ['choco', 'coffee', 'tea'].forEach((id) => W.setDeco(id, 0)); W.bridge.set(0); W.palace.set(0); };
  W.reset();
  return W;
}

/* a dancer of the Kingdom of Sweets; the coffee dancer gets a silk veil held between her hands */
function buildSweetDancer(kind) {
  const d = buildDoll(kind);
  d.root.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  if (kind === 'coffee') {
    const N = 22, g = new THREE.PlaneGeometry(1, 1, N, 1);
    const veil = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#8fe0d8', emissive: '#2f8790', emissiveIntensity: 0.25, roughness: 0.45, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false }));
    veil.frustumCulled = false; veil.renderOrder = 2; d.root.add(veil);
    const a = V3(), b = V3(), P = g.attributes.position;
    d.updateVeil = (t) => {
      d.armL.hand.getWorldPosition(a); d.armR.hand.getWorldPosition(b); d.root.worldToLocal(a); d.root.worldToLocal(b);
      for (let i = 0; i <= N; i++) {
        const u = i / N, sag = Math.sin(u * Math.PI), x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u) - sag * 0.34, z = lerp(a.z, b.z, u) - sag * 0.18;
        const w = Math.sin(t * 2.4 + u * 7) * 0.05 * sag;
        P.setXYZ(i, x, y + w, z);                                          // top edge
        P.setXYZ(i + N + 1, x, y - 0.26 - sag * 0.08 + w, z - 0.08 - sag * 0.06 + Math.sin(t * 2 + u * 5) * 0.05);   // bottom edge
      }
      P.needsUpdate = true; g.computeVertexNormals();
    };
  }
  return d;
}

/* a gingerbread candy maker in a chef's hat (one mesh; it bobs while it works) */
function buildGingerbread(hat = true, apron = '#f8c8d6') {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const pts = [];
  const arc = (cx, cy, r, a0, a1, n = 8) => { for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); } };
  arc(0, 0.92, 0.2, -1.05, Math.PI + 1.05, 16);
  pts.push(new THREE.Vector2(-0.12, 0.74)); arc(-0.42, 0.56, 0.075, Math.PI / 2, Math.PI * 1.5, 6); pts.push(new THREE.Vector2(-0.17, 0.5));
  pts.push(new THREE.Vector2(-0.19, 0.3)); arc(-0.19, 0.07, 0.08, Math.PI, Math.PI * 2, 6); pts.push(new THREE.Vector2(-0.05, 0.27));
  arc(0, 0.27, 0.05, Math.PI, 0, 4);
  pts.push(new THREE.Vector2(0.05, 0.27)); arc(0.19, 0.07, 0.08, Math.PI, Math.PI * 2, 6); pts.push(new THREE.Vector2(0.19, 0.3));
  pts.push(new THREE.Vector2(0.17, 0.5)); arc(0.42, 0.56, 0.075, -Math.PI / 2, Math.PI / 2, 6); pts.push(new THREE.Vector2(0.12, 0.74));
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 2, curveSegments: 6 });
  g.translate(0, 0, -0.05);
  const b = new Batch(MAT.gloss);
  b.add(g, '#b8743f');
  for (const [x, y] of [[-0.07, 0.95], [0.07, 0.95]]) b.add(GEO.sph(8, 6), '#2a1612', TRS(x, y, 0.1, 0, 0, 0, 0.028));
  b.add(GEO.torus(0.07, 0.014, 4, 12, Math.PI), '#ffffff', TRS(0, 0.87, 0.1, 0, 0, Math.PI));
  for (let i = 0; i < 3; i++) b.add(GEO.sph(8, 6), ['#e23a52', '#3aa07a', '#ffd34a'][i], TRS(0, 0.66 - i * 0.12, 0.1, 0, 0, 0, 0.035));
  for (const s of [-1, 1]) { b.add(GEO.box(), '#ffffff', TRS(s * 0.36, 0.6, 0.1, 0, 0, s * 0.5, 0.02, 0.1, 0.015)); b.add(GEO.box(), '#ffffff', TRS(s * 0.2, 0.14, 0.1, 0, 0, 0, 0.12, 0.02, 0.015)); }
  if (apron) b.add(roundBox(0.3, 0.26, 0.02, 0.04, 1), apron, TRS(0, 0.42, 0.11));
  if (hat) { b.add(GEO.cyl(12), '#ffffff', TRS(0, 1.15, 0, 0, 0, 0, 0.13, 0.12, 0.13)); for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; b.add(GEO.sph(8, 6), '#ffffff', TRS(Math.cos(a) * 0.09, 1.26, Math.sin(a) * 0.09, 0, 0, 0, 0.1)); } }
  body.add(b.build({ cast: false }));
  return {
    root, body, a: { t: rnd(0, 5), hop: 0 },
    update(dt, work = 1) {
      const a = this.a; a.t += dt; a.hop = Math.max(0, a.hop - dt);
      this.body.rotation.z = Math.sin(a.t * 3.1) * 0.07 * work;
      this.body.position.y = Math.abs(Math.sin(a.t * 3.1)) * 0.03 * work + Math.sin(Math.min(1, a.hop / 0.5) * Math.PI) * 0.35;
    },
  };
}
