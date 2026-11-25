/* =====================================================================
   14 · THE TOY KINGDOM — a toy-theatre diorama under the giant tree
   Plaza x∈[-11,11] z∈[-13,11] · Train village x<-11 · Carousel square x>11 · Music-box garden z>11
   ===================================================================== */
const TOY = {
  palace: V3(0, 0.36, -5.5), lectern: V3(0, 0, 1.6), start: V3(0, 0, 5.4),
  train: { cx: -22, cz: -3.0, rx: 6.2, rz: 4.0, speed: 1.7 },
  carousel: V3(20.0, 0, -6.6), musicBox: V3(0, 0, 22.5),
};

function buildToyland(root) {
  const W = { root, colliders: [], dyn: [], props: {}, gates: [], glowList: [], spots: {}, beacons: [] };
  const B = {
    felt: new Batch(MAT2.felt), wood: new Batch(MAT.wood), gloss: new Batch(MAT.gloss), gold: new Batch(MAT.gold), glow: new Batch(MAT.glow),
    satin: new Batch(MAT.satin), marble: new Batch(MAT.marble), blocks: new Batch(MAT.blocks), porcelain: new Batch(MAT.porcelain),
    cloth: new Batch(MAT.cloth), gifts: new Batch(MAT.gifts), cheese: new Batch(MAT2.cheese), signs: new Batch(MAT2.signs), panel: new Batch(MAT2.panel),
  };
  const glows = W.glowList;
  const boxC = (x0, x1, z0, z1, top, walk = false, o = {}) => { const c = Object.assign({ t: 'b', x0, x1, z0, z1, top, bottom: 0, walk, on: true }, o); W.colliders.push(c); return c; };
  const circC = (x, z, r, top, walk = false, o = {}) => { const c = Object.assign({ t: 'c', x, z, r, top, bottom: 0, walk, on: true }, o); W.colliders.push(c); return c; };
  const dynC = (o) => { const c = Object.assign({ bottom: 0, on: true }, o); W.dyn.push(c); return c; };
  const stripes = (a, b, n = 10, k = 1) => (x, y, z) => (Math.floor(((Math.atan2(x, z) + Math.PI) / TAU) * n + y * k) % 2 ? a : b);
  const feltPlane = (x0, x1, z0, z1, col, y = 0) => {
    const w = x1 - x0, d = z1 - z0, g = new THREE.PlaneGeometry(w, d, 1, 1); g.rotateX(-Math.PI / 2);
    const U = g.attributes.uv; for (let i = 0; i < U.count; i++) U.setXY(i, U.getX(i) * w / 3.2, U.getY(i) * d / 3.2);
    B.felt.add(g, col, TRS((x0 + x1) / 2, y, (z0 + z1) / 2));
  };

  /* ---------------- ground ---------------- */
  const pg = new THREE.PlaneGeometry(22, 24); pg.rotateX(-Math.PI / 2);
  const pu = pg.attributes.uv; for (let i = 0; i < pu.count; i++) pu.setXY(i, pu.getX(i) * 22, pu.getY(i) * 24);
  const plaza = new THREE.Mesh(pg, MAT2.checker); plaza.position.set(0, 0, -1); plaza.receiveShadow = true; root.add(plaza);
  feltPlane(-33, -11, -13, 11, '#cfe6d3');
  feltPlane(11, 33, -13, 11, '#efd5e2');
  feltPlane(-11, 11, 11, 33, '#d6e4f4');
  const outer = new THREE.CircleGeometry(95, 48); outer.rotateX(-Math.PI / 2);
  const ou = outer.attributes.uv; for (let i = 0; i < ou.count; i++) ou.setXY(i, ou.getX(i) * 30, ou.getY(i) * 30);
  B.felt.add(outer, '#c9b9cf', TRS(0, -0.03, 0));
  // a gilt edge where the checker tiles meet the felt
  for (const [x, z, w, d] of [[-11, -1, 0.14, 24], [11, -1, 0.14, 24], [0, 11, 22, 0.14], [0, -13, 22, 0.14]]) B.gold.add(GEO.box(), '#d9ad5a', TRS(x, 0.02, z, 0, 0, 0, w, 0.04, d));

  /* ---------------- reusable props ---------------- */
  const block = (x, y, z, s, cell, ry = 0) => B.blocks.add(roundBox(s, s, s, 0.07 * s, 1), '#ffffff', TRS(x, y + s / 2, z, 0, ry, 0), atlasRect(cell, 4));
  const toyTree = (x, z, h = 3.2, col = '#3f7a5c', withCol = true) => {
    B.wood.add(GEO.cyl(10), '#7a4a30', TRS(x, h * 0.12, z, 0, 0, 0, 0.12 * h / 3, h * 0.24, 0.12 * h / 3));
    B.gold.add(GEO.cyl(16), '#d9ad5a', TRS(x, 0.05, z, 0, 0, 0, 0.42 * h / 3, 0.1, 0.42 * h / 3));
    const c0 = new THREE.Color(col), c1 = c0.clone().offsetHSL(0, -0.05, 0.12);
    for (let k = 0; k < 3; k++) {
      const r = (0.95 - k * 0.24) * h / 3, y = h * (0.28 + k * 0.2), hh = h * 0.34;
      B.cloth.add(GEO.cone(14), (vx, vy) => c0.clone().lerp(c1, vy + 0.5), TRS(x, y + hh / 2, z, 0, k * 0.4, 0, r, hh, r));
      for (let i = 0; i < 5; i++) { const a = i * 1.26 + k; B.gloss.add(GEO.sph(6, 4), pick(['#e65c78', '#fbf1e2', '#7fb0e0', '#f2c14e']), TRS(x + Math.sin(a) * r * 0.82, y + hh * 0.18, z + Math.cos(a) * r * 0.82, 0, 0, 0, 0.07 * h / 3)); }
    }
    B.gold.add(starGeo(0.18, 0.08, 0.05, 0.02), '#ffd77a', TRS(x, h * 0.96 + 0.12, z));
    if (withCol) circC(x, z, 0.36 * h / 3, h);
  };
  const lampPost = (x, z, h = 3.2) => {
    B.gold.add(lathe([[0.3, 0], [0.3, 0.08], [0.18, 0.16], [0.14, 0.36], [0.1, 0.42]], 14, 0), '#d9ad5a', TRS(x, 0, z));
    B.gloss.add(GEO.cyl(14), (vx, vy, vz) => (Math.floor((vy + 0.5) * 9 + (Math.atan2(vx, vz) / TAU) * 2 + 4) % 2 ? '#c0283e' : '#fbf4e6'), TRS(x, 0.4 + (h - 0.4) / 2, z, 0, 0, 0, 0.08, h - 0.4, 0.08));
    B.gold.add(GEO.cyl(10), '#d9ad5a', TRS(x, h + 0.02, z, 0, 0, 0, 0.2, 0.06, 0.2));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; B.gold.add(GEO.cyl(4), '#d9ad5a', TRS(x + Math.sin(a) * 0.16, h + 0.3, z + Math.cos(a) * 0.16, 0, 0, 0, 0.015, 0.5, 0.015)); }
    B.gold.add(GEO.cone(8), '#d9ad5a', TRS(x, h + 0.66, z, 0, Math.PI / 8, 0, 0.28, 0.24, 0.28));
    B.gold.add(GEO.sph(8, 6), '#d9ad5a', TRS(x, h + 0.82, z, 0, 0, 0, 0.06));
    B.glow.add(GEO.sph(10, 8), '#ffe3a6', TRS(x, h + 0.3, z, 0, 0, 0, 0.12, 0.17, 0.12));
    glows.push({ p: [x, h + 0.3, z], c: '#ffd68a', s: 1.9, tw: 0.12 });
    circC(x, z, 0.2, h + 1);
  };
  const fence = (x0, z0, x1, z1) => {
    const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / 0.34));
    for (const y of [0.3, 0.62]) B.porcelain.add(GEO.box(), '#fbf6ee', TRS((x0 + x1) / 2, y, (z0 + z1) / 2, 0, ry, 0, 0.05, 0.07, L));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t), big = i % 6 === 0;
      B.porcelain.add(GEO.box(), '#fbf6ee', TRS(x, big ? 0.5 : 0.4, z, 0, ry, 0, big ? 0.12 : 0.07, big ? 1.0 : 0.8, big ? 0.12 : 0.1));
      B.porcelain.add(GEO.cone(4), '#fbf6ee', TRS(x, big ? 1.06 : 0.86, z, 0, ry + Math.PI / 4, 0, big ? 0.09 : 0.06, 0.12, big ? 0.09 : 0.06));
      if (big) B.gold.add(GEO.sph(8, 6), '#d9ad5a', TRS(x, 1.16, z, 0, 0, 0, 0.06));
    }
  };
  const gift = (x, z, s, cell, ribbon = '#e3b85c', ry = 0, h = s) => {
    B.gifts.add(roundBox(s, h, s, 0.05 * s, 1), '#ffffff', TRS(x, h / 2, z, 0, ry, 0), atlasRect(cell));
    B.satin.add(GEO.box(), ribbon, TRS(x, h / 2, z, 0, ry, 0, s * 1.01, h * 1.005, s * 0.12));
    B.satin.add(GEO.box(), ribbon, TRS(x, h / 2, z, 0, ry, 0, s * 0.12, h * 1.005, s * 1.01));
    for (const sgn of [-1, 1]) B.satin.add(GEO.torus(0.17 * s, 0.05 * s, 8, 18), ribbon, TRS(x + Math.cos(ry) * sgn * 0.15 * s, h + 0.12 * s, z - Math.sin(ry) * sgn * 0.15 * s, 0.3, ry, sgn * 0.6, 1, 0.75, 0.55));
  };
  const tulip = (x, z, col) => {
    B.cloth.add(GEO.cyl(5), '#5f9469', TRS(x, 0.25, z, 0, 0, 0, 0.025, 0.5, 0.025));
    B.cloth.add(lathe([[0.02, 0], [0.12, 0.05], [0.14, 0.16], [0.11, 0.26], [0.13, 0.3]], 10, 0), col, TRS(x, 0.48, z));
    B.cloth.add(GEO.sph(8, 6), '#6fa577', TRS(x + 0.08, 0.16, z, 0, 0, 0.6, 0.12, 0.03, 0.05));
  };
  const bunting = (a, b, sag = 0.7, n = 12) => {
    const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(V3(lerp(a[0], b[0], t), lerp(a[1], b[1], t) - Math.sin(t * Math.PI) * sag, lerp(a[2], b[2], t))); }
    B.gold.add(tubeGeo(pts, 0.015, 32, 4), '#d9ad5a');
    const curve = new THREE.CatmullRomCurve3(pts), tri = new THREE.Shape(); tri.moveTo(-0.22, 0); tri.lineTo(0.22, 0); tri.lineTo(0, -0.5); tri.closePath();
    const tg = new THREE.ShapeGeometry(tri), ry = Math.atan2(b[0] - a[0], b[2] - a[2]) - Math.PI / 2;
    for (let i = 1; i < n; i++) {
      const p = curve.getPoint(i / n), col = ['#f3c3cc', '#fbf1e2', '#b7d2ec', '#d7ad5a', '#b02f45'][i % 5];
      B.satin.add(tg, col, TRS(p.x, p.y, p.z, 0, ry, 0)); B.satin.add(tg, col, TRS(p.x, p.y, p.z, 0, ry + Math.PI, 0));
    }
  };
  const house = (x, z, w, d, h, wallCol, roofCol, ry = 0, colli = true) => {
    const M = TRS(x, 0, z, 0, ry, 0);
    for (const b of [B.porcelain, B.gloss, B.gold, B.glow, B.wood]) b.push(M);
    B.porcelain.add(roundBox(w, h, d, 0.06, 2), wallCol, TRS(0, h / 2, 0));
    const roof = new THREE.Shape(); roof.moveTo(-w / 2 - 0.25, 0); roof.lineTo(w / 2 + 0.25, 0); roof.lineTo(0, h * 0.55); roof.closePath();
    const rg = new THREE.ExtrudeGeometry(roof, { depth: d + 0.3, bevelEnabled: false }); rg.translate(0, 0, -(d + 0.3) / 2);
    B.gloss.add(rg, (vx, vy) => (Math.floor(vy * 6) % 2 ? roofCol : new THREE.Color(roofCol).offsetHSL(0, 0, 0.08).getStyle()), TRS(0, h, 0));
    B.gold.add(GEO.box(), '#d9ad5a', TRS(0, h + 0.02, 0, 0, 0, 0, w + 0.55, 0.05, d + 0.32));
    B.wood.add(roundBox(0.7, 1.15, 0.08, 0.04, 2), '#7d1d36', TRS(0, 0.58, d / 2 + 0.03));
    B.gold.add(GEO.sph(6, 4), '#d9ad5a', TRS(0.2, 0.58, d / 2 + 0.09, 0, 0, 0, 0.04));
    for (const sx of [-1, 1]) {
      if (w > 2) { B.glow.add(roundBox(0.46, 0.56, 0.04, 0.05, 1), '#ffe0a0', TRS(sx * w * 0.3, h * 0.62, d / 2 + 0.02)); B.porcelain.add(GEO.box(), '#ffffff', TRS(sx * w * 0.3, h * 0.62, d / 2 + 0.05, 0, 0, 0, 0.56, 0.05, 0.03)); }
      B.glow.add(roundBox(0.04, 0.5, 0.42, 0.04, 1), '#ffe0a0', TRS(sx * w / 2 + sx * 0.01, h * 0.55, 0));
    }
    B.porcelain.add(roundBox(0.34, 0.9, 0.34, 0.03, 2), '#d9cfc6', TRS(w * 0.25, h + h * 0.45, -d * 0.15));
    for (const b of [B.porcelain, B.gloss, B.gold, B.glow, B.wood]) b.pop();
    if (colli) {
      const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)), hw = (w * c + d * s) / 2 + 0.05, hd = (w * s + d * c) / 2 + 0.05;
      boxC(x - hw, x + hw, z - hd, z + hd, h + 2);
    }
  };

  /* ---------------- plaza walls, gates & the palace dais ---------------- */
  reseed(77);
  const wallRun = (fixed, from, to, axis, rows = 2) => {
    let n = 0;
    for (let u = from + 0.5; u < to - 0.3; u += 1.0, n++) {
      const x = axis === 'x' ? fixed : u, z = axis === 'x' ? u : fixed;
      for (let r = 0; r < rows; r++) block(x, r * 1.0, z, 0.98, rndi(0, 15), rnd(-0.05, 0.05));
      if (n % 2 === 0) block(x, rows * 1.0, z, 0.56, rndi(0, 15));
    }
  };
  wallRun(-11, -13, -2.7, 'x'); wallRun(-11, 2.7, 11, 'x');
  wallRun(11, -13, -2.7, 'x'); wallRun(11, 2.7, 11, 'x');
  wallRun(11, -10.4, -2.7, 'z', 1); wallRun(11, 2.7, 10.4, 'z', 1);
  boxC(-11.55, -10.5, -13.2, -1.6, 2.6); boxC(-11.55, -10.5, 1.6, 11.6, 2.6);
  boxC(10.5, 11.55, -13.2, -1.6, 2.6); boxC(10.5, 11.55, 1.6, 11.6, 2.6);
  boxC(-11.5, -1.6, 10.5, 11.55, 2.6); boxC(1.6, 11.5, 10.5, 11.55, 2.6);

  const gates = [
    { id: 'A', x: -11, z: 0, axis: 'x', out: -1, sign: 0 },
    { id: 'B', x: 11, z: 0, axis: 'x', out: 1, sign: 1 },
    { id: 'C', x: 0, z: 11, axis: 'z', out: 1, sign: 2 },
  ];
  for (const gd of gates) {
    const ry = gd.axis === 'x' ? Math.PI / 2 : 0; // the arch spans along the wall
    const low = gd.axis === 'z'; // the south gate faces the camera, so it stays low
    const M = TRS(gd.x, 0, gd.z, 0, ry, 0);
    for (const b of Object.values(B)) b.push(M);
    const ph = low ? 2.2 : 3.3, top = low ? 2.75 : 3.95;
    for (const sx of [-1, 1]) {
      for (let k = 0; k < (low ? 2 : 3); k++) block(sx * 2.15, k * 1.1, 0, 1.08, rndi(0, 15));
      B.gold.add(GEO.cone(8), '#d9ad5a', TRS(sx * 2.15, top + 0.25, 0, 0, Math.PI / 8, 0, 0.62, 0.5, 0.62));
      B.gold.add(GEO.cyl(4), '#d9ad5a', TRS(sx * 2.15, top + 0.9, 0, 0, 0, 0, 0.02, 0.9, 0.02));
      const fl = new THREE.Shape(); fl.moveTo(0, 0); fl.lineTo(0.55, -0.1); fl.lineTo(0, -0.24); fl.closePath();
      B.satin.add(new THREE.ShapeGeometry(fl), '#b02f45', TRS(sx * 2.15, top + 1.3, 0.01)); B.satin.add(new THREE.ShapeGeometry(fl), '#b02f45', TRS(sx * 2.15, top + 1.3, -0.01, 0, Math.PI, 0));
      if (low) B.porcelain.add(roundBox(1.12, top - ph, 1.12, 0.05, 2), '#f6c9d3', TRS(sx * 2.15, ph + (top - ph) / 2, 0));
    }
    if (low) {
      B.gold.add(GEO.cyl(10), '#d9ad5a', TRS(0, 2.05, 0, 0, 0, Math.PI / 2, 0.06, 3.2, 0.06));
      for (const sz of [-1, 1]) B.signs.add(GEO.plane(), '#ffffff', TRS(0, 2.44, sz * 0.07, 0, sz > 0 ? 0 : Math.PI, 0, 2.5, 0.63, 1), signRect(gd.sign));
      B.wood.add(roundBox(2.6, 0.72, 0.1, 0.04, 2), '#7d1d36', TRS(0, 2.44, 0));
    }
    if (!low) {
    const lint = new THREE.Shape(); lint.moveTo(-2.7, 0); lint.lineTo(2.7, 0); lint.lineTo(2.7, 2.35); lint.lineTo(-2.7, 2.35); lint.closePath();
    const hole = new THREE.Path(); hole.moveTo(-1.62, 0); hole.lineTo(1.62, 0); hole.absarc(0, 0, 1.62, 0, Math.PI, false); lint.holes.push(hole);
    const lg = new THREE.ExtrudeGeometry(lint, { depth: 1.0, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 20 }); lg.translate(0, 0, -0.5);
    B.porcelain.add(lg, '#f6c9d3', TRS(0, 1.6, 0));
    B.gold.add(GEO.torus(1.66, 0.06, 6, 28, Math.PI), '#d9ad5a', TRS(0, 1.6, 0.57));
    B.gold.add(GEO.torus(1.66, 0.06, 6, 28, Math.PI), '#d9ad5a', TRS(0, 1.6, -0.57));
    for (const sz of [-1, 1]) B.signs.add(GEO.plane(), '#ffffff', TRS(0, 3.52, sz * 0.58, 0, sz > 0 ? 0 : Math.PI, 0, 2.7, 0.68, 1), signRect(gd.sign));
    }
    for (const b of Object.values(B)) b.pop();
    // swinging doors and a gift ribbon that keeps them shut
    const doors = [];
    for (const sx of [-1, 1]) {
      const hinge = new THREE.Group();
      const hx = gd.axis === 'x' ? gd.x : gd.x + sx * 1.6, hz = gd.axis === 'x' ? gd.z + sx * 1.6 : gd.z;
      hinge.position.set(hx, 0, hz); hinge.rotation.y = ry; root.add(hinge);
      const db = new Batch(MAT.wood), dg = new Batch(MAT.gold);
      const dir = gd.axis === 'x' ? sx : -sx; // leaf runs from the hinge towards the middle of the arch
      const leaf = new THREE.Shape(); leaf.moveTo(0, 0); leaf.lineTo(dir * 1.58, 0);
      for (let i = 0; i <= 10; i++) { const d = 1.58 * (i / 10); leaf.lineTo(dir * (1.58 - d), low ? 1.86 + Math.cos((d / 1.58) * Math.PI / 2) * 0.12 : 1.58 + Math.sqrt(Math.max(0, 2.56 - d * d)) * 0.98); }
      leaf.closePath();
      const leafGeo = new THREE.ExtrudeGeometry(leaf, { depth: 0.14, bevelEnabled: false, curveSegments: 12 }); leafGeo.translate(0, 0, -0.07);
      db.add(leafGeo, '#8a2c3c');
      for (const y of [0.5, 1.4]) dg.add(GEO.box(), '#d9ad5a', TRS(dir * 0.8, y, 0, 0, 0, 0, 1.5, 0.08, 0.18));
      for (let i = 0; i < 6; i++) dg.add(GEO.sph(6, 4), '#d9ad5a', TRS(dir * (0.25 + (i % 3) * 0.55), 0.95 + Math.floor(i / 3) * 0.8, 0.09, 0, 0, 0, 0.05));
      dg.add(GEO.torus(0.13, 0.03, 6, 16), '#d9ad5a', TRS(dir * 1.35, 1.2, 0.1));
      hinge.add(db.build({ cast: true }), dg.build({ cast: true }));
      doors.push({ hinge, sx });
    }
    const bow = new THREE.Group(); bow.position.set(gd.x + (gd.axis === 'x' ? -gd.out * 0.12 : 0), 1.35, gd.z + (gd.axis === 'z' ? -gd.out * 0.12 : 0)); bow.rotation.y = ry; root.add(bow);
    const bb = new Batch(MAT.satin);
    bb.add(GEO.box(), '#f08aa6', TRS(0, 0, 0, 0, 0, 0, 3.3, 0.32, 0.06));
    bb.add(GEO.box(), '#f08aa6', TRS(0, 0, 0, 0, 0, 0, 0.32, 2.7, 0.06));
    for (const s2 of [-1, 1]) { bb.add(GEO.torus(0.36, 0.11, 8, 20), '#f08aa6', TRS(s2 * 0.34, 0.18, 0.08, 0, 0, s2 * 0.5, 1, 0.7, 0.4)); bb.add(GEO.box(), '#f08aa6', TRS(s2 * 0.22, -0.5, 0.06, 0, 0, s2 * 0.3, 0.2, 0.9, 0.04)); }
    bb.add(GEO.sph(10, 8), '#e9759a', TRS(0, 0.02, 0.1, 0, 0, 0, 0.18, 0.18, 0.12));
    bow.add(bb.build({ cast: false }));
    const gx0 = gd.axis === 'x' ? gd.x - 0.5 : gd.x - 1.6, gx1 = gd.axis === 'x' ? gd.x + 0.5 : gd.x + 1.6;
    const gz0 = gd.axis === 'x' ? gd.z - 1.6 : gd.z - 0.5, gz1 = gd.axis === 'x' ? gd.z + 1.6 : gd.z + 0.5;
    const col = boxC(gx0, gx1, gz0, gz1, 3);
    const gate = { id: gd.id, doors, bow, col, open: 0, out: gd.out, axis: gd.axis, pos: V3(gd.x, 0, gd.z) };
    gate.set = (k) => {
      gate.open = k;
      for (const d of doors) d.hinge.rotation.y = ry + d.sx * gd.out * (gd.axis === 'x' ? -1 : 1) * k * 1.75;
      bow.visible = k < 0.05; col.on = k < 0.5;
    };
    gate.set(0);
    W.gates.push(gate);
  }

  // the palace dais and blueprint lectern
  const P0 = TOY.palace;
  B.marble.add(lathe([[5.62, 0], [5.62, 0.16], [5.5, 0.22], [5.3, 0.3], [5.24, 0.36], [0, 0.36]], 72, 0), '#fbeee8', TRS(P0.x, 0, P0.z));
  B.porcelain.add(new THREE.TorusGeometry(5.6, 0.1, 8, 96), (x, y, z) => (Math.floor((Math.atan2(x, y) + Math.PI) / TAU * 48) % 2 ? '#f3c3cc' : '#fbf1e2'), TRS(P0.x, 0.12, P0.z, Math.PI / 2, 0, 0));
  B.gold.add(new THREE.TorusGeometry(5.3, 0.04, 6, 96), '#d9ad5a', TRS(P0.x, 0.34, P0.z, Math.PI / 2, 0, 0));
  for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2) < 0.24) continue; B.gold.add(GEO.cyl(6), '#d9ad5a', TRS(P0.x + Math.cos(a) * 5.45, 0.55, P0.z + Math.sin(a) * 5.45, 0, 0, 0, 0.035, 0.42, 0.035)); B.gold.add(GEO.sph(8, 6), '#d9ad5a', TRS(P0.x + Math.cos(a) * 5.45, 0.78, P0.z + Math.sin(a) * 5.45, 0, 0, 0, 0.07)); }
  circC(P0.x, P0.z, 5.62, 9);
  W.palaceRoot = new THREE.Group(); W.palaceRoot.position.copy(P0); root.add(W.palaceRoot);
  const L0 = TOY.lectern;
  B.gold.add(lathe([[0.42, 0], [0.42, 0.06], [0.24, 0.14], [0.13, 0.3], [0.1, 0.9], [0.16, 1.0], [0.3, 1.06]], 16, 0), '#d9ad5a', TRS(L0.x, 0, L0.z));
  B.wood.add(roundBox(1.25, 0.1, 0.9, 0.04, 2), '#7d1d36', TRS(L0.x, 1.13, L0.z + 0.04, 0.42, 0, 0));
  for (const sx of [-1, 1]) {
    const pg2 = new THREE.PlaneGeometry(0.56, 0.78); pg2.rotateX(-Math.PI / 2);
    const u2 = pg2.attributes.uv; for (let i = 0; i < u2.count; i++) u2.setX(i, sx < 0 ? u2.getX(i) * 0.5 : 0.5 + u2.getX(i) * 0.5);
    const page = new THREE.Mesh(pg2, MAT2.blueprint); page.position.set(L0.x + sx * 0.3, 1.2, L0.z + 0.04); page.rotation.set(0.42, 0, -sx * 0.06); root.add(page);
  }
  circC(L0.x, L0.z, 0.45, 1.4);
  W.lectern = { pos: L0.clone(), top: V3(L0.x, 1.5, L0.z) };

  /* ---------------- plaza decoration ---------------- */
  for (const [x, z] of [[-9.6, -11.4], [9.6, -11.4], [-9.6, 9.4], [9.6, 9.4], [-3.4, 3.4], [3.4, 3.4]]) lampPost(x, z);
  for (const [x, z, h, c] of [[-9.0, -7.4, 3.4, '#3f7a5c'], [9.0, -7.4, 3.4, '#4a8a6a'], [-9.3, 6.2, 2.8, '#5a9470'], [9.3, 6.2, 2.8, '#3f7a5c'], [-6.6, -11.6, 2.6, '#4a8a6a'], [6.6, -11.6, 2.6, '#5a9470']]) toyTree(x, z, h, c);
  bunting([-9.6, 3.4, 9.4], [-3.4, 3.4, 3.4], 0.6); bunting([9.6, 3.4, 9.4], [3.4, 3.4, 3.4], 0.6); bunting([-3.4, 3.4, 3.4], [3.4, 3.4, 3.4], 0.4, 9);
  bunting([-9.6, 3.4, -11.4], [9.6, 3.4, -11.4], 1.1, 20);
  // fountain
  const F = V3(-7.4, 0, -3.4);
  B.marble.add(lathe([[1.55, 0], [1.6, 0.1], [1.6, 0.5], [1.45, 0.58], [1.36, 0.42], [0, 0.42]], 40, 0), '#fbeee8', TRS(F.x, 0, F.z));
  B.gold.add(GEO.torus(1.56, 0.04, 6, 40), '#d9ad5a', TRS(F.x, 0.58, F.z, Math.PI / 2, 0, 0));
  B.marble.add(lathe([[0.18, 0], [0.24, 0.4], [0.14, 0.8], [0.7, 1.0], [0.72, 1.1], [0.6, 1.14], [0.12, 1.06], [0.1, 1.5], [0.32, 1.6], [0.3, 1.66], [0.0, 1.62]], 28, 0), '#fbf1ec', TRS(F.x, 0.42, F.z));
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.38, 40), new THREE.MeshStandardMaterial({ color: '#a9d0f0', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.78 }));
  water.rotation.x = -Math.PI / 2; water.position.set(F.x, 0.5, F.z); root.add(water);
  const top = new THREE.Group(); top.position.set(F.x, 2.2, F.z); root.add(top);
  const tb = new Batch(MAT.gloss);
  tb.add(lathe([[0, -0.3], [0.1, -0.22], [0.32, 0], [0.34, 0.06], [0.2, 0.14], [0.05, 0.18], [0.04, 0.38], [0, 0.42]], 20, 12), stripes('#d77b91', '#fbf1e2', 8));
  top.add(tb.build({ cast: false }));
  W.props.fountain = { pos: F, top };
  circC(F.x, F.z, 1.6, 0.9);
  // the gift box that hides the base, block stack for the stairs
  const G1 = V3(-7.0, 0, 3.3);
  const gbox = new THREE.Group(); gbox.position.copy(G1); gbox.rotation.y = 0.35; root.add(gbox);
  const gb = new Batch(MAT.gifts), gs = new Batch(MAT.satin);
  gb.add(roundBox(1.6, 1.3, 1.6, 0.06, 2), '#ffffff', TRS(0, 0.65, 0), atlasRect(8));
  gs.add(GEO.box(), '#e3b85c', TRS(0, 0.65, 0, 0, 0, 0, 1.62, 1.31, 0.16)); gs.add(GEO.box(), '#e3b85c', TRS(0, 0.65, 0, 0, 0, 0, 0.16, 1.31, 1.62));
  gbox.add(gb.build(), gs.build());
  const glid = new THREE.Group(); glid.position.set(0, 1.3, 0); gbox.add(glid);
  const lb = new Batch(MAT.gifts), ls = new Batch(MAT.satin);
  lb.add(roundBox(1.72, 0.26, 1.72, 0.05, 2), '#ffffff', TRS(0, 0.13, 0), atlasRect(8));
  ls.add(GEO.box(), '#e3b85c', TRS(0, 0.13, 0, 0, 0, 0, 1.74, 0.27, 0.16)); ls.add(GEO.box(), '#e3b85c', TRS(0, 0.13, 0, 0, 0, 0, 0.16, 0.27, 1.74));
  for (const s of [-1, 1]) ls.add(GEO.torus(0.28, 0.08, 8, 20), '#e3b85c', TRS(s * 0.26, 0.46, 0, 0.3, 0, s * 0.55, 1, 0.72, 0.55));
  glid.add(lb.build(), ls.build());
  W.props.gift = { grp: gbox, lid: glid, pos: G1, col: circC(G1.x, G1.z, 1.05, 1.6) };
  const stackAt = [[6.0, 4.6, 1], [7.05, 3.65, 2], [8.1, 2.7, 3]];
  for (const [x, z, n] of stackAt) { for (let k = 0; k < n; k++) block(x, k * 0.9, z, 0.9, rndi(0, 15), rnd(-0.1, 0.1)); boxC(x - 0.47, x + 0.47, z - 0.47, z + 0.47, n * 0.9, true); }
  W.spots.base = V3(G1.x + 1.5, 0, G1.z + 1.4); W.spots.stairs = V3(8.1, 2.7, 2.7); W.spots.gate = V3(-7.4, 0, -1.2);
  // guard soldiers at the lectern
  W.guards = [];
  for (const sx of [-1, 1]) {
    const s = buildSoldier(sx > 0 ? 1 : 0); s.root.position.set(sx * 2.25, 0, 1.9); s.root.traverse((o) => { if (o.isMesh) o.castShadow = false; }); root.add(s.root);
    const bl = makeBlob(0.3); bl.position.set(sx * 2.25, 0.016, 1.9); root.add(bl);
    W.guards.push({ s, home: V3(sx * 2.25, 0, 1.9), pos: V3(sx * 2.25, 0, 1.9), yaw: 0, blob: bl, col: circC(sx * 2.25, 1.9, 0.26, 1.5) });
  }

  /* ---------------- train village (west) ---------------- */
  const T = TOY.train;
  const tp = (th) => V3(T.cx + T.rx * Math.sin(th), 0, T.cz + T.rz * Math.cos(th));
  const tdl = (th) => Math.hypot(T.rx * Math.cos(th), T.rz * Math.sin(th));
  for (const off of [-0.55, 0.55]) {
    const pts = []; for (let i = 0; i < 128; i++) { const th = (i / 128) * TAU; pts.push(V3(T.cx + Math.sin(th) * (T.rx + off), 0.09, T.cz + Math.cos(th) * (T.rz + off))); }
    B.gold.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 256, 0.05, 6, true), '#cfd3dc');
  }
  for (let th = 0; th < TAU - 0.02;) { const p = tp(th), d = V3(T.rx * Math.cos(th), 0, -T.rz * Math.sin(th)); B.wood.add(GEO.box(), '#7a4630', TRS(p.x, 0.035, p.z, 0, Math.atan2(d.x, d.z), 0, 1.5, 0.07, 0.24)); th += 0.62 / tdl(th); }
  // platform on the south side of the loop, a step up from the east
  boxC(-25.2, -18.8, 1.55, 3.45, 0.42, true);
  B.marble.add(roundBox(6.4, 0.42, 1.9, 0.04, 2), '#f2e3d4', TRS(-22, 0.21, 2.5));
  B.gold.add(GEO.box(), '#d9ad5a', TRS(-22, 0.43, 1.57, 0, 0, 0, 6.4, 0.03, 0.06));
  B.marble.add(roundBox(0.7, 0.21, 1.4, 0.03, 2), '#f2e3d4', TRS(-18.45, 0.105, 2.5));
  boxC(-18.8, -18.1, 1.8, 3.2, 0.21, true);
  for (const sx of [-1, 1]) { B.gloss.add(roundBox(1.3, 0.1, 0.42, 0.03, 2), '#7d1d36', TRS(-22 + sx * 1.8, 0.86, 3.05)); B.gloss.add(roundBox(1.3, 0.42, 0.08, 0.03, 2), '#7d1d36', TRS(-22 + sx * 1.8, 1.12, 3.28)); for (const e of [-0.55, 0.55]) B.gold.add(GEO.cyl(6), '#d9ad5a', TRS(-22 + sx * 1.8 + e, 0.63, 3.05, 0, 0, 0, 0.03, 0.42, 0.03)); }
  house(-27.3, 3.0, 2.6, 2.6, 2.5, '#f6dfe4', '#7d1d36');
  // toy shop inside the loop: a flat roof you can climb on
  const SH = { x0: -24, x1: -20, z0: -4.6, z1: -1.4, h: 2.6 };
  B.porcelain.add(roundBox(4.0, 2.6, 3.2, 0.06, 2), '#e8f0f9', TRS(-22, 1.3, -3.0));
  B.porcelain.add(roundBox(4.24, 0.16, 3.44, 0.05, 2), '#fbf4e6', TRS(-22, 2.64, -3.0));
  for (const [x, z, w, d] of [[-22, -4.66, 4.24, 0.12], [-24.06, -3.0, 0.12, 3.44]]) B.porcelain.add(GEO.box(), '#f3c3cc', TRS(x, 2.86, z, 0, 0, 0, w, 0.32, d));
  B.satin.add(GEO.box(), (x) => (Math.floor((x + 0.5) * 9) % 2 ? '#2c4a8a' : '#fbf1e2'), TRS(-22, 2.05, -1.05, 0.45, 0, 0, 3.6, 0.06, 0.9));
  for (const x of [-23.1, -20.9]) { B.glow.add(roundBox(1.1, 0.9, 0.04, 0.05, 1), '#ffe0a0', TRS(x, 1.05, -1.38)); B.porcelain.add(GEO.box(), '#ffffff', TRS(x, 1.05, -1.35, 0, 0, 0, 0.04, 0.92, 0.03)); }
  B.wood.add(roundBox(0.8, 1.4, 0.08, 0.04, 2), '#b02f45', TRS(-22, 0.7, -1.38));
  boxC(SH.x0, SH.x1, SH.z0, SH.z1, SH.h, true);
  for (const [x, z, n] of [[-19.4, -2.9, 1], [-19.4, -4.1, 2]]) { for (let k = 0; k < n; k++) { B.wood.add(roundBox(0.96, 0.78, 0.96, 0.04, 2), '#c8925a', TRS(x, k * 0.8 + 0.39, z)); B.wood.add(GEO.box(), '#8a5a32', TRS(x, k * 0.8 + 0.39, z, 0, 0, Math.PI / 4, 1.2, 0.08, 0.98)); } boxC(x - 0.5, x + 0.5, z - 0.5, z + 0.5, n * 0.8, true); }
  W.spots.wingL = V3(-22.3, 2.6, -3.0);
  // village houses along the back
  house(-26.2, -10.6, 3.0, 2.6, 2.8, '#f8e1e6', '#c0283e');
  house(-21.6, -10.8, 2.6, 2.4, 3.3, '#e5eef8', '#2c4a8a');
  house(-17.0, -10.5, 2.8, 2.4, 2.5, '#fbf1e2', '#2e5b45');
  house(-31.0, -0.4, 2.4, 2.6, 2.6, '#fbe8d6', '#b02f45', Math.PI / 2);
  house(-31.0, 4.6, 2.4, 2.4, 2.4, '#e9f1e6', '#7d1d36', Math.PI / 2);
  // crane and its lever
  const CR = V3(-29.8, 0, -9.6);
  B.wood.add(roundBox(1.6, 0.3, 1.6, 0.05, 2), '#3a2a30', TRS(CR.x, 0.15, CR.z));
  for (let k = 0; k < 6; k++) { B.gloss.add(GEO.box(), '#f2c14e', TRS(CR.x, 0.3 + k * 0.72 + 0.36, CR.z, 0, 0, 0, 0.7, 0.72, 0.7)); B.gloss.add(GEO.box(), '#c0283e', TRS(CR.x, 0.3 + k * 0.72 + 0.36, CR.z, 0, 0, Math.PI / 4, 0.98, 0.06, 0.74)); }
  circC(CR.x, CR.z, 0.6, 6);
  const jib = new THREE.Group(); jib.position.set(CR.x, 4.75, CR.z); root.add(jib);
  const jb = new Batch(MAT.gloss);
  jb.add(roundBox(1.1, 0.9, 1.1, 0.06, 2), '#c0283e', TRS(0, 0.45, 0));
  jb.add(GEO.box(), '#f2c14e', TRS(2.4, 0.95, 0, 0, 0, 0, 5.2, 0.26, 0.32));
  jb.add(GEO.box(), '#f2c14e', TRS(-1.1, 0.95, 0, 0, 0, 0, 1.4, 0.26, 0.32));
  jb.add(roundBox(0.8, 0.6, 0.6, 0.05, 2), '#3a2a30', TRS(-1.6, 0.8, 0));
  jb.add(GEO.box(), '#fbf4e6', TRS(0.2, 0.5, 0.56, 0, 0, 0, 0.5, 0.4, 0.02));
  jib.add(jb.build({ cast: false }));
  const cable = new THREE.Mesh(GEO.cyl(6), new THREE.MeshStandardMaterial({ color: '#3a3438', roughness: 0.6 }));
  cable.scale.set(0.025, 1, 0.025); jib.add(cable);
  const hook = new THREE.Group(); jib.add(hook);
  const hb = new Batch(MAT.gold); hb.add(GEO.torus(0.14, 0.04, 6, 14, Math.PI * 1.4), '#cfd3dc', TRS(0, -0.12, 0, 0, 0, Math.PI * 0.8)); hb.add(GEO.cyl(8), '#cfd3dc', TRS(0, 0.1, 0, 0, 0, 0, 0.06, 0.2, 0.06));
  hook.add(hb.build({ cast: false }));
  const LV = V3(-31.3, 0, -7.4);
  const lever = new THREE.Group(); lever.position.copy(LV); root.add(lever);
  const lvb = new Batch(MAT.gloss);
  lvb.add(roundBox(0.8, 0.5, 0.5, 0.05, 2), '#3a2a30', TRS(0, 0.25, 0));
  lever.add(lvb.build());
  const stick = new THREE.Group(); stick.position.set(0, 0.5, 0); lever.add(stick);
  const stb = new Batch(MAT.gloss); stb.add(GEO.cyl(8), '#cfd3dc', TRS(0, 0.4, 0, 0, 0, 0, 0.045, 0.8, 0.045)); stb.add(GEO.sph(12, 8), '#c0283e', TRS(0, 0.84, 0, 0, 0, 0, 0.12));
  stick.add(stb.build());
  circC(LV.x, LV.z, 0.45, 1);
  W.crane = { jib, cable, hook, stick, base: CR, a: 0, drop: 0, lever: LV, land: V3(CR.x, 0, CR.z + 4.6) };
  W.spots.wingR = V3(CR.x, 0, CR.z + 4.6);
  for (const [x, z, h, c] of [[-14.2, -7.6, 3.0, '#3f7a5c'], [-13.6, 7.6, 2.6, '#4a8a6a'], [-31.4, -11.2, 3.2, '#5a9470'], [-31.6, 9.4, 2.8, '#3f7a5c'], [-24.6, 8.8, 2.4, '#4a8a6a'], [-18.4, 8.6, 2.6, '#5a9470']]) toyTree(x, z, h, c);
  for (const [x, z] of [[-13.4, -3.4], [-13.4, 3.4], [-25.6, 4.4], [-16.0, 9.2]]) lampPost(x, z, 3.0);
  fence(-32.6, -12.6, -11.4, -12.6); fence(-32.6, -12.6, -32.6, 10.6); fence(-32.6, 10.6, -11.4, 10.6);
  // signal lamps
  for (const [x, z] of [[-15.0, 1.8], [-29.2, -3.0]]) { B.gold.add(GEO.cyl(8), '#3a3438', TRS(x, 1.3, z, 0, 0, 0, 0.06, 2.6, 0.06)); B.gloss.add(roundBox(0.34, 0.7, 0.24, 0.05, 2), '#2a2228', TRS(x, 2.6, z)); B.glow.add(GEO.sph(8, 6), '#ff6a5a', TRS(x, 2.78, z + 0.12, 0, 0, 0, 0.09)); B.glow.add(GEO.sph(8, 6), '#7dff9c', TRS(x, 2.44, z + 0.12, 0, 0, 0, 0.09)); circC(x, z, 0.15, 3); }

  // the train itself (dynamic)
  const mkCar = (kind, len) => {
    const g = new THREE.Group(); root.add(g);
    const c = new Batch(MAT.gloss), gl = new Batch(MAT.gold), gw = new Batch(MAT.glow), wd = new Batch(MAT.wood);
    c.add(roundBox(1.36, 0.22, len, 0.05, 2), '#2a1e22', TRS(0, 0.42, 0));
    const wz = []; for (let z = -len / 2 + 0.45; z <= len / 2 - 0.44; z += (len - 0.9) / (kind === 'loco' ? 2 : 1)) wz.push(z);
    for (const z of wz) for (const s of [-1, 1]) { c.add(GEO.cyl(18), '#b02f45', TRS(s * 0.62, 0.32, z, 0, 0, Math.PI / 2, 0.3, 0.12, 0.3)); gl.add(GEO.cyl(10), '#e3b85c', TRS(s * 0.69, 0.32, z, 0, 0, Math.PI / 2, 0.1, 0.05, 0.1)); }
    if (kind === 'loco') {
      c.add(GEO.cyl(22), '#2e5b45', TRS(0, 1.05, 0.35, Math.PI / 2, 0, 0, 0.55, 1.9, 0.55));
      for (const z of [-0.4, 0.3, 1.0]) gl.add(GEO.torus(0.555, 0.04, 6, 24), '#e3b85c', TRS(0, 1.05, z));
      c.add(lathe([[0.16, 0], [0.18, 0.4], [0.32, 0.66], [0.32, 0.76], [0.0, 0.76]], 16, 0), '#1d1418', TRS(0, 1.5, 0.95));
      gl.add(GEO.hemi(14, 8), '#e3b85c', TRS(0, 1.55, 0.1, 0, 0, 0, 0.22));
      c.add(roundBox(1.36, 1.25, 1.15, 0.05, 2), '#b02f45', TRS(0, 1.15, -0.9));
      c.add(roundBox(1.56, 0.12, 1.35, 0.04, 2), '#1d1418', TRS(0, 1.84, -0.9));
      for (const s of [-1, 1]) gw.add(GEO.box(), '#ffe0a0', TRS(s * 0.69, 1.3, -0.9, 0, 0, 0, 0.02, 0.4, 0.5));
      gl.add(new THREE.ConeGeometry(0.6, 0.5, 4), '#e3b85c', TRS(0, 0.5, len / 2 + 0.05, Math.PI / 2, Math.PI / 4, 0, 1, 1, 0.55));
      gl.add(GEO.cyl(14), '#e3b85c', TRS(0, 1.05, len / 2 - 0.12, Math.PI / 2, 0, 0, 0.16, 0.14, 0.16));
      gw.add(GEO.circle(14), '#fff1c4', TRS(0, 1.05, len / 2 - 0.04, 0, 0, 0, 0.12));
    } else if (kind === 'flat') {
      wd.add(roundBox(1.4, 0.12, len - 0.1, 0.03, 2), '#c8925a', TRS(0, 0.58, 0));
      for (let i = 0; i < 5; i++) wd.add(GEO.box(), '#a8743f', TRS(-0.56 + i * 0.28, 0.645, 0, 0, 0, 0, 0.02, 0.01, len - 0.14));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) gl.add(GEO.cyl(6), '#e3b85c', TRS(sx * 0.64, 0.82, sz * (len / 2 - 0.12), 0, 0, 0, 0.04, 0.46, 0.04));
    } else {
      c.add(roundBox(1.36, 1.1, len - 0.2, 0.05, 2), '#8a2140', TRS(0, 1.08, 0));
      c.add(roundBox(1.52, 0.1, len, 0.04, 2), '#1d1418', TRS(0, 1.68, 0));
      c.add(roundBox(0.7, 0.4, 0.8, 0.04, 2), '#8a2140', TRS(0, 1.9, 0));
      for (const z of [-0.5, 0.4]) for (const s of [-1, 1]) gw.add(GEO.box(), '#ffd98a', TRS(s * 0.69, 1.2, z, 0, 0, 0, 0.02, 0.34, 0.36));
    }
    for (const b of [c, gl, wd]) if (!b.empty) g.add(b.build({ cast: false }));
    if (!gw.empty) g.add(gw.build({ cast: false }));
    const blob = makeBlob(0.9); blob.scale.set(1.5, len * 0.75, 1); g.add(blob);
    const walk = kind === 'flat', top = walk ? 0.64 : 2.2;
    const cols = [-1, 1].map((s) => dynC({ t: 'c', x: 0, z: 0, r: 0.72, top, walk, stick: walk, mv: { ox: 0, oz: 0, nx: 0, nz: 0, dyaw: 0 }, along: s * len * 0.25 }));
    return { g, kind, len, cols, th: 0, yaw: 0 };
  };
  const train = { cars: [mkCar('loco', 3.0), mkCar('flat', 2.5), mkCar('flat', 2.5), mkCar('cab', 2.6)], th: 0.4, v: 0, P: tp, dl: tdl, halt: 0, stopCd: 0 };
  train.place = (first) => {
    let th = train.th;
    train.cars.forEach((car, i) => {
      if (i > 0) th -= ((train.cars[i - 1].len + car.len) / 2 + 0.35) / tdl(th);
      const p = tp(th), d = V3(T.rx * Math.cos(th), 0, -T.rz * Math.sin(th)), yaw = Math.atan2(d.x, d.z);
      const dyaw = first ? 0 : angleDiff(car.yaw, yaw);
      car.th = th; car.yaw = yaw;
      car.g.position.copy(p); car.g.rotation.y = yaw;
      for (const c of car.cols) {
        const nx = p.x + Math.sin(yaw) * c.along, nz = p.z + Math.cos(yaw) * c.along;
        c.mv.ox = first ? nx : c.x; c.mv.oz = first ? nz : c.z; c.mv.nx = nx; c.mv.nz = nz; c.mv.dyaw = dyaw;
        c.x = nx; c.z = nz;
      }
    });
  };
  train.place(true);
  W.train = train;

  /* ---------------- carousel square (east) ---------------- */
  const CB = TOY.carousel;
  B.marble.add(lathe([[4.62, 0], [4.62, 0.12], [4.52, 0.2], [4.2, 0.21], [0, 0.21]], 64, 0), '#fbf1ec', TRS(CB.x, 0, CB.z));
  B.gold.add(new THREE.TorusGeometry(4.6, 0.04, 6, 96), '#d9ad5a', TRS(CB.x, 0.17, CB.z, Math.PI / 2, 0, 0));
  circC(CB.x, CB.z, 4.62, 0.21, true);
  const car = new THREE.Group(); car.position.copy(CB); root.add(car);
  const cbP = new Batch(MAT.gloss), cbG = new Batch(MAT.gold), cbS = new Batch(MAT.satin), cbW = new Batch(MAT.glow);
  const plat = lathe([[4.1, 0.21], [4.1, 0.36], [4.0, 0.43], [0, 0.43]], 72, 0);
  deform(plat, (v) => { const r = Math.hypot(v.x, v.z), a = Math.atan2(v.x, v.z); if (r > 3.9) { const k = 1 + 0.025 * Math.cos(a * 24); v.x *= k; v.z *= k; } });
  cbP.add(plat, (x, y, z) => (Math.floor(((Math.atan2(x, z) + Math.PI) / TAU) * 24) % 2 ? '#f3c3cc' : '#fbf1e2'));
  cbG.add(new THREE.TorusGeometry(4.08, 0.05, 6, 96), '#d9ad5a', TRS(0, 0.4, 0, Math.PI / 2, 0, 0));
  cbG.add(GEO.cyl(24), (x, y) => (Math.floor((y + 0.5) * 14) % 2 ? '#d9ad5a' : '#f6dc98'), TRS(0, 2.75, 0, 0, 0, 0, 0.5, 4.7, 0.5));
  cbP.add(GEO.cyl(32), '#fbf1e2', TRS(0, 5.15, 0, 0, 0, 0, 1.3, 0.5, 1.3));
  const roofG = lathe([[5.0, 0], [4.6, 0.3], [3.4, 0.85], [1.8, 1.4], [0.5, 1.8], [0.1, 1.95], [0, 1.96]], 48, 14);
  cbP.add(roofG, (x, y, z) => (Math.floor(((Math.atan2(x, z) + Math.PI) / TAU) * 16) % 2 ? '#ea9fb3' : '#fff1ee'), TRS(0, 5.35, 0));
  const val = new THREE.CylinderGeometry(5.0, 5.0, 0.55, 48, 1, true);
  deform(val, (v) => { const a = Math.atan2(v.x, v.z); if (v.y < 0) v.y -= 0.12 * Math.abs(Math.sin(a * 12)); });
  cbS.add(val, '#b02f45', TRS(0, 5.12, 0));
  cbG.add(new THREE.TorusGeometry(5.0, 0.05, 6, 96), '#d9ad5a', TRS(0, 5.38, 0, Math.PI / 2, 0, 0));
  cbG.add(GEO.sph(14, 10), '#d9ad5a', TRS(0, 7.45, 0, 0, 0, 0, 0.26));
  cbG.add(starGeo(0.34, 0.15, 0.08, 0.03), '#ffd77a', TRS(0, 7.95, 0));
  const carGlows = [];
  for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; cbW.add(GEO.sph(8, 6), '#fff1cf', TRS(Math.sin(a) * 5.0, 5.0, Math.cos(a) * 5.0, 0, 0, 0, 0.09)); carGlows.push({ p: [Math.sin(a) * 5.0, 5.0, Math.cos(a) * 5.0], c: i % 2 ? '#ffd68a' : '#ffc0d6', s: 0.9, tw: 0.5 }); }
  const HR = 2.85, NH = 6;
  for (let i = 0; i < NH; i++) { const a = (i / NH) * TAU; cbG.add(GEO.cyl(8), (x, y) => (Math.floor((y + 0.5) * 18) % 2 ? '#d9ad5a' : '#fff1cf'), TRS(Math.sin(a) * HR, 2.75, Math.cos(a) * HR, 0, 0, 0, 0.05, 4.7, 0.05)); }
  car.add(cbP.build({ cast: false }), cbG.build({ cast: false }), cbS.build({ cast: false }), cbW.build({ cast: false }));
  const cg = makeGlowPoints(carGlows, { boost: 1 }); car.add(cg);
  // horses (instanced, bobbing on their poles)
  const hb2 = new Batch(MAT.gloss);
  hb2.add(GEO.sph(18, 12), '#fbf6ee', TRS(0, 0, 0, 0, 0, 0, 0.34, 0.3, 0.62));
  hb2.add(GEO.capsule(0.13, 0.38, 4, 10), '#fbf6ee', TRS(0, 0.36, 0.46, -0.7, 0, 0));
  hb2.add(roundBox(0.22, 0.24, 0.42, 0.09, 2), '#fbf6ee', TRS(0, 0.62, 0.68, -0.35, 0, 0));
  for (const s of [-1, 1]) { hb2.add(GEO.cone(6), '#fbf6ee', TRS(s * 0.07, 0.8, 0.6, -0.2, 0, 0, 0.04, 0.14, 0.04)); hb2.add(GEO.sph(6, 4), '#1d1418', TRS(s * 0.1, 0.68, 0.78, 0, 0, 0, 0.025)); }
  for (const [x, z, rx2] of [[-0.18, 0.4, -0.9], [0.18, 0.3, -1.3], [-0.18, -0.4, 0.5], [0.18, -0.35, 0.9]]) hb2.add(GEO.capsule(0.06, 0.46, 3, 8), '#fbf6ee', TRS(x, -0.32, z, rx2, 0, 0));
  hb2.add(roundBox(0.4, 0.08, 0.42, 0.04, 2), '#b02f45', TRS(0, 0.29, -0.02));
  for (let k = 0; k < 6; k++) hb2.add(GEO.sph(8, 6), pick(['#f3c3cc', '#e595aa', '#d9ad5a']), TRS(0, 0.5 + k * 0.05, 0.3 + k * 0.07, 0, 0, 0, 0.09));
  hb2.add(GEO.capsule(0.07, 0.3, 3, 8), '#e595aa', TRS(0, 0.06, -0.66, 0.9, 0, 0));
  const horseGeo = hb2.build().geometry;
  const horses = new THREE.InstancedMesh(horseGeo, MAT.gloss, NH);
  horses.castShadow = false; horses.frustumCulled = false; car.add(horses);
  const hcols = []; for (let i = 0; i < NH; i++) hcols.push(dynC({ t: 'c', x: 0, z: 0, r: 0.42, top: 2.3, walk: false }));
  const pole = dynC({ t: 'c', x: CB.x, z: CB.z, r: 0.56, top: 8, walk: false });
  const platCol = dynC({ t: 'c', x: CB.x, z: CB.z, r: 4.1, top: 0.43, walk: true, stick: true, mv: { ox: CB.x, oz: CB.z, nx: CB.x, nz: CB.z, dyaw: 0 } });
  W.carousel = { group: car, horses, hcols, pole, platCol, a: 0, w: 0.42, HR, NH, dummy: new THREE.Object3D(), center: CB };
  // a hedge closes the gap behind the carousel
  for (let x = 14.2; x < 26.2; x += 1.3) B.felt.add(roundBox(1.36, 1.5, 1.2, 0.4, 3), '#4f8a66', TRS(x, 0.75, -11.95));
  boxC(13.6, 26.6, -12.6, -11.3, 2);
  // bounce drum and the toy theatre with a roof terrace
  const D1 = V3(25.9, 0, -8.4);
  B.gold.add(GEO.torus(0.8, 0.06, 8, 36), '#d9ad5a', TRS(D1.x, 0.08, D1.z, Math.PI / 2, 0, 0));
  B.gloss.add(GEO.cyl(36, true), (x, y, z) => { const a = Math.atan2(x, z), zig = Math.abs(((a / TAU) * 12 + 100) % 1 - 0.5) * 2; return Math.abs((y + 0.5) - zig) < 0.08 ? '#fbf1e2' : '#c0283e'; }, TRS(D1.x, 0.38, D1.z, 0, 0, 0, 0.8, 0.62, 0.8));
  B.gold.add(GEO.torus(0.8, 0.06, 8, 36), '#d9ad5a', TRS(D1.x, 0.69, D1.z, Math.PI / 2, 0, 0));
  const skin = new THREE.Mesh(GEO.circle(28), new THREE.MeshStandardMaterial({ color: '#fbf4e6', roughness: 0.6 }));
  skin.rotation.x = -Math.PI / 2; skin.position.set(D1.x, 0.7, D1.z); skin.scale.setScalar(0.78); root.add(skin);
  const drumCol = circC(D1.x, D1.z, 0.82, 0.72, true, { bounce: 10.8 });
  W.drum = { skin, col: drumCol, pos: D1, wob: 0 };
  B.gloss.add(GEO.cyl(30), (x, y) => (Math.floor((y + 0.5) * 3) % 2 ? '#2c4a8a' : '#fbf1e2'), TRS(27.4, 0.35, -4.6, 0, 0, 0, 0.6, 0.7, 0.6));
  B.gold.add(GEO.torus(0.6, 0.05, 6, 30), '#d9ad5a', TRS(27.4, 0.7, -4.6, Math.PI / 2, 0, 0));
  circC(27.4, -4.6, 0.62, 0.72, true);
  const TH = { x0: 28.2, x1: 31.8, z0: -10.2, z1: -6.6, h: 3.2 };
  B.porcelain.add(roundBox(3.6, 3.2, 3.6, 0.06, 2), '#e9eef9', TRS(30, 1.6, -8.4));
  B.porcelain.add(roundBox(3.8, 0.14, 3.8, 0.04, 2), '#fbf4e6', TRS(30, 3.25, -8.4));
  for (const [x, z, w, d] of [[30, -10.26, 3.8, 0.12], [31.86, -8.4, 0.12, 3.8]]) B.porcelain.add(GEO.box(), '#f3c3cc', TRS(x, 3.45, z, 0, 0, 0, w, 0.3, d));
  B.satin.add(GEO.box(), (x) => (Math.floor((x + 0.5) * 8) % 2 ? '#c0283e' : '#fbf1e2'), TRS(30, 2.5, -6.25, 0.4, 0, 0, 3.4, 0.06, 0.9));
  B.wood.add(roundBox(0.9, 1.6, 0.1, 0.05, 2), '#7d1d36', TRS(30, 0.8, -6.58));
  for (const x of [29.0, 31.0]) B.glow.add(roundBox(0.5, 0.7, 0.04, 0.05, 1), '#ffe0a0', TRS(x, 1.9, -6.58));
  boxC(TH.x0, TH.x1, TH.z0, TH.z1, TH.h, true);
  W.spots.towerR = V3(30.4, 3.2, -8.6);
  // mouse camp in the south-east corner: cheese tents, a flag and the arch they guard
  const wedge = (x, z, w, h, d, ry) => {
    const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(-d / 2, h); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1 }); g.translate(0, 0, -w / 2);
    const U = g.attributes.uv; for (let i = 0; i < U.count; i++) U.setXY(i, U.getX(i) * 0.4, U.getY(i) * 0.4);
    B.cheese.add(g, '#ffffff', TRS(x, 0, z, 0, ry, 0));
  };
  wedge(25.4, 8.8, 2.0, 1.9, 2.6, 0.3); boxC(24.0, 26.8, 7.5, 10.1, 2.2);
  wedge(31.5, 5.6, 1.8, 1.6, 2.2, -0.6); boxC(30.4, 32.5, 4.5, 6.8, 2.0);
  B.gold.add(GEO.cyl(6), '#8a5a3a', TRS(29.2, 1.6, 10.2, 0, 0, 0, 0.05, 3.2, 0.05));
  const mflag = new THREE.Shape(); mflag.moveTo(0, 0); mflag.lineTo(1.0, -0.25); mflag.lineTo(0, -0.6); mflag.closePath();
  B.satin.add(new THREE.ShapeGeometry(mflag), '#6a6070', TRS(29.2, 3.1, 10.2)); B.satin.add(new THREE.ShapeGeometry(mflag), '#6a6070', TRS(29.2, 3.1, 10.19, 0, Math.PI, 0));
  B.cheese.add(GEO.sph(10, 6), '#ffffff', TRS(29.6, 2.82, 10.22, 0, 0, 0, 0.14, 0.12, 0.02));
  circC(29.2, 10.2, 0.12, 4);
  for (const [x, z] of [[24.4, 5.0], [32.0, 9.2], [23.6, 10.0]]) { B.wood.add(roundBox(0.8, 0.8, 0.8, 0.04, 2), '#b98352', TRS(x, 0.4, z)); boxC(x - 0.42, x + 0.42, z - 0.42, z + 0.42, 0.8, true); }
  B.glow.add(GEO.sph(10, 8), '#ffb347', TRS(27.4, 0.25, 7.2, 0, 0, 0, 0.3, 0.22, 0.3));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; B.wood.add(GEO.cyl(6), '#6b3a22', TRS(27.4 + Math.cos(a) * 0.32, 0.1, 7.2 + Math.sin(a) * 0.32, 0, 0, Math.PI / 2 - 0.3, 0.05, 0.7, 0.05)); }
  glows.push({ p: [27.4, 0.5, 7.2], c: '#ffb347', s: 2.2, tw: 0.4 });
  circC(27.4, 7.2, 0.45, 0.5);
  W.spots.arch = V3(31.0, 0, 9.3);
  W.sentries = [
    { path: [V3(24.2, 0, 4.0), V3(30.2, 0, 4.0)], speed: 1.3, wait: 1.6 },
    { path: [V3(28.2, 0, 5.4), V3(28.2, 0, 9.6)], speed: 1.0, wait: 1.8 },
  ];
  W.campEntry = V3(26.0, 0, 1.0);
  W.camp = { x0: 23.2, x1: 32.6, z0: 2.6, z1: 10.6 };
  for (const [x, z, h, c] of [[13.8, -8.4, 3.0, '#4a8a6a'], [14.0, 7.6, 2.6, '#3f7a5c'], [32.0, -2.4, 3.2, '#5a9470'], [18.6, 9.4, 2.4, '#4a8a6a'], [21.0, 6.4, 2.8, '#5a9470']]) toyTree(x, z, h, c);
  for (const [x, z] of [[13.4, -3.4], [13.4, 3.4], [23.6, 1.8], [17.2, 4.6]]) lampPost(x, z, 3.0);
  bunting([13.4, 3.0, -3.4], [20.0, 7.4, -6.6], 0.5, 14); bunting([23.6, 3.0, 1.8], [20.0, 7.4, -6.6], 0.5, 14);
  fence(11.4, -12.6, 32.6, -12.6); fence(32.6, -12.6, 32.6, 10.6); fence(11.4, 10.6, 32.6, 10.6);
  for (const [x, z] of [[16.0, 1.6], [30.4, -1.6]]) { B.gold.add(GEO.cyl(6), '#d9ad5a', TRS(x, 0.5, z, 0, 0, 0, 0.12, 1.0, 0.12)); for (let k = 0; k < 4; k++) { const bx = x + Math.sin(k * 1.7) * 0.4, bz = z + Math.cos(k * 1.7) * 0.4, by = 2.6 + k * 0.3; B.gold.add(tubeGeo([[x, 1.0, z], [bx, by - 0.35, bz]], 0.008, 4, 3), '#fbf4e6'); B.gloss.add(GEO.sph(14, 10), ['#e65c78', '#7fb0e0', '#f2c14e', '#f3c3cc'][k], TRS(bx, by, bz, 0, 0, 0, 0.3, 0.36, 0.3)); } circC(x, z, 0.2, 2); }

  /* ---------------- music-box garden (south) ---------------- */
  const MB = TOY.musicBox;
  B.panel.add(GEO.plane(), '#ffffff', TRS(MB.x, 0.85, MB.z + 1.91, 0, 0, 0, 4.9, 1.5, 1));
  B.panel.add(GEO.plane(), '#ffffff', TRS(MB.x, 0.85, MB.z - 1.91, 0, Math.PI, 0, 4.9, 1.5, 1));
  B.panel.add(GEO.plane(), '#ffffff', TRS(MB.x + 2.61, 0.85, MB.z, 0, Math.PI / 2, 0, 3.5, 1.5, 1), [0.15, 0, 0.85, 1]);
  B.panel.add(GEO.plane(), '#ffffff', TRS(MB.x - 2.61, 0.85, MB.z, 0, -Math.PI / 2, 0, 3.5, 1.5, 1), [0.15, 0, 0.85, 1]);
  B.gloss.add(roundBox(5.2, 1.7, 3.8, 0.06, 2), '#7d1d36', TRS(MB.x, 0.85, MB.z));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { B.gold.add(roundBox(0.24, 1.8, 0.24, 0.05, 2), '#d9ad5a', TRS(MB.x + sx * 2.6, 0.9, MB.z + sz * 1.9)); B.gold.add(GEO.sph(12, 8), '#d9ad5a', TRS(MB.x + sx * 2.5, 0.12, MB.z + sz * 1.8, 0, 0, 0, 0.26, 0.2, 0.26)); }
  B.gold.add(GEO.box(), '#d9ad5a', TRS(MB.x, 1.72, MB.z, 0, 0, 0, 5.28, 0.08, 3.88));
  B.cloth.add(GEO.box(), '#5a1226', TRS(MB.x, 1.6, MB.z, 0, 0, 0, 4.9, 0.05, 3.5));
  const mbCol = boxC(MB.x - 2.62, MB.x + 2.62, MB.z - 1.92, MB.z + 1.92, 2.02, true);
  const lid = new THREE.Group(); lid.position.set(MB.x, 1.76, MB.z - 1.9); root.add(lid);
  const lidB = new Batch(MAT.gloss), lidP = new Batch(MAT2.panel), lidG = new Batch(MAT.gold), lidM = new Batch(MAT.mirror);
  lidB.add(roundBox(5.3, 0.24, 3.9, 0.06, 2), '#7d1d36', TRS(0, 0.12, 1.9));
  lidP.add(GEO.plane(), '#ffffff', TRS(0, 0.245, 1.9, -Math.PI / 2, 0, 0, 4.7, 3.3, 1));
  lidG.add(GEO.box(), '#d9ad5a', TRS(0, 0.25, 1.9, 0, 0, 0, 4.9, 0.02, 0.06)); lidG.add(GEO.box(), '#d9ad5a', TRS(0, 0.25, 1.9, 0, 0, 0, 0.06, 0.02, 3.5));
  lidM.add(GEO.plane(), '#ffffff', TRS(0, -0.005, 1.9, Math.PI / 2, 0, 0, 4.6, 3.2, 1));
  lid.add(lidB.build({ cast: false }), lidP.build({ cast: false }), lidG.build({ cast: false }), lidM.build({ cast: false }));
  const stage = new THREE.Group(); stage.position.set(MB.x, 0.05, MB.z); root.add(stage);
  const stB = new Batch(MAT.gloss), stG = new Batch(MAT.gold);
  stB.add(lathe([[1.38, 0], [1.38, 0.12], [1.3, 0.2], [0, 0.2]], 48, 0), (x, y, z) => (Math.floor(((Math.atan2(x, z) + Math.PI) / TAU) * 16) % 2 ? '#f3c3cc' : '#fbf1e2'));
  stG.add(new THREE.TorusGeometry(1.36, 0.04, 6, 48), '#d9ad5a', TRS(0, 0.16, 0, Math.PI / 2, 0, 0));
  stG.add(lathe([[0.32, 0.2], [0.3, 0.3], [0.18, 0.36], [0, 0.36]], 20, 0), '#d9ad5a');
  stage.add(stB.build({ cast: false }), stG.build({ cast: false }));
  const ballerina = buildDoll('fairy'); ballerina.pose = 'fifth';
  ballerina.root.scale.setScalar(0.95); ballerina.root.position.y = 0.36; stage.add(ballerina.root);
  ballerina.root.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  const stageCol = dynC({ t: 'c', x: MB.x, z: MB.z, r: 1.38, top: 1.2, walk: true, stick: true, on: false, mv: { ox: MB.x, oz: MB.z, nx: MB.x, nz: MB.z, dyaw: 0 } });
  const balCol = dynC({ t: 'c', x: MB.x, z: MB.z, r: 0.32, top: 4.2, walk: false, on: false });
  const key = new THREE.Group(); key.position.set(MB.x + 2.75, 0.95, MB.z); root.add(key);
  const kb = new Batch(MAT.gold);
  kb.add(GEO.cyl(10), '#d9ad5a', TRS(0.35, 0, 0, 0, 0, Math.PI / 2, 0.09, 0.7, 0.09));
  for (const s of [-1, 1]) kb.add(GEO.torus(0.3, 0.07, 8, 22), '#d9ad5a', TRS(0.76, s * 0.32, 0, 0, Math.PI / 2, 0));
  kb.add(GEO.sph(10, 8), '#d9ad5a', TRS(0.76, 0, 0, 0, 0, 0, 0.12));
  key.add(kb.build({ cast: false }));
  W.musicBox = { pos: MB, lid, stage, ballerina, key, col: mbCol, stageCol, balCol, open: 0, winds: 0, spin: 0, a: 0, keyAt: V3(MB.x + 3.7, 0, MB.z) };
  W.spots.dome = V3(MB.x + 1.8, 0, MB.z + 3.4);
  // jewel boxes to climb on
  for (const [x, z, w, h, col] of [[-3.75, 19.7, 1.0, 0.7, '#b7d2ec'], [-3.75, 21.0, 1.1, 1.35, '#f3c3cc']]) {
    B.gloss.add(roundBox(w, h, w, 0.06, 2), col, TRS(x, h / 2, z)); B.gold.add(GEO.box(), '#d9ad5a', TRS(x, h - 0.03, z, 0, 0, 0, w + 0.02, 0.05, w + 0.02));
    B.gold.add(GEO.sph(8, 6), '#d9ad5a', TRS(x, h + 0.05, z, 0, 0, 0, 0.1)); boxC(x - w / 2, x + w / 2, z - w / 2, z + w / 2, h, true);
  }
  // piano-key staircase up to the music stand
  const keys = [];
  const kbat = new Batch(MAT.gloss); kbat.add(roundBox(2.6, 1, 0.96, 0.05, 2), '#fbf8f2');
  const keyMesh = new THREE.InstancedMesh(kbat.build().geometry, MAT.gloss, 7);
  keyMesh.castShadow = false; keyMesh.receiveShadow = true; root.add(keyMesh);
  const NOTES = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'];
  for (let k = 0; k < 7; k++) {
    const z = 13.4 + k * 1.05, top = 0.38 + k * 0.4;
    const col = boxC(-9.3, -6.7, z - 0.48, z + 0.48, top, true, { stick: true });
    keys.push({ z, top, col, press: 0, note: NOTES[k], x: -8.0 });
    if (k < 6 && k !== 2) { B.gloss.add(roundBox(1.25, 0.3, 0.56, 0.05, 2), '#1d1418', TRS(-8.95, top + 0.15, z + 0.52)); }
  }
  W.piano = { keys, mesh: keyMesh, dummy: new THREE.Object3D() };
  boxC(-10.2, -5.8, 20.5, 23.4, 3.0, true);
  B.wood.add(roundBox(4.4, 0.24, 2.9, 0.05, 2), '#6a2a20', TRS(-8.0, 2.88, 21.95));
  B.gold.add(GEO.cyl(10), '#d9ad5a', TRS(-8.0, 1.4, 21.95, 0, 0, 0, 0.2, 2.8, 0.2));
  B.gold.add(lathe([[0.9, 0], [0.9, 0.08], [0.3, 0.16], [0.22, 0.3]], 20, 0), '#d9ad5a', TRS(-8.0, 0, 21.95));
  const sheet = new THREE.Mesh(GEO.plane(), MAT2.sheet); sheet.position.set(-8.0, 4.35, 20.7); sheet.rotation.x = -0.12; sheet.scale.set(2.4, 2.6, 1); root.add(sheet);
  B.wood.add(roundBox(3.2, 0.14, 0.34, 0.04, 2), '#6a2a20', TRS(-8.0, 3.05, 20.75));
  W.spots.spire = V3(-8.0, 3.0, 22.2);
  // garden dressing
  reseed(915);
  for (let i = 0; i < 60; i++) { const x = rnd(-10, 10), z = rnd(12.2, 32); if (Math.abs(x) < 3.6 && z < 26.5 && z > 18) continue; if (x < -5.2 && z < 24) continue; if (Math.abs(x) < 1.8 && z < 15) continue; tulip(x, z, pick(['#e65c78', '#f3c3cc', '#fbf1e2', '#f2c14e', '#b7d2ec'])); }
  for (const [x, z] of [[-3.6, 13.2], [3.6, 13.2], [7.6, 25.6], [-3.6, 30.6], [3.6, 30.6]]) lampPost(x, z, 3.0);
  for (const [x, z, h, c] of [[8.4, 14.2, 3.0, '#5a9470'], [9.0, 31.2, 2.8, '#3f7a5c'], [-9.2, 31.0, 3.2, '#4a8a6a'], [6.4, 30.0, 2.4, '#5a9470']]) toyTree(x, z, h, c);
  fence(-10.6, 11.4, -10.6, 32.6); fence(10.6, 11.4, 10.6, 32.6); fence(-10.6, 32.6, 10.6, 32.6);
  const noteGeo = (() => { const s = new THREE.Shape(); s.absellipse(0, 0, 0.32, 0.24, 0, TAU, false, -0.4); const g = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }); g.translate(0, 0, -0.06); return g; })();
  W.notes = new THREE.Group(); root.add(W.notes);
  const nb = new Batch(MAT.gloss);
  for (const [x, y, z] of [[5.2, 3.6, 18.0], [-2.0, 4.6, 27.6], [6.6, 4.2, 24.6]]) { nb.add(noteGeo, '#2a1e30', TRS(x, y, z)); nb.add(GEO.cyl(6), '#2a1e30', TRS(x + 0.3, y + 0.62, z, 0, 0, 0, 0.04, 1.2, 0.04)); nb.add(GEO.box(), '#2a1e30', TRS(x + 0.52, y + 1.12, z, 0, 0, -0.5, 0.5, 0.12, 0.1)); }
  W.notes.add(nb.build({ cast: false }));

  /* ---------------- outer corners: giant toys beyond the fences ---------------- */
  reseed(4410);
  for (const sx of [-1, 1]) {
    gift(sx * 16.5, 16.0, 3.2, 1, '#e3b85c', 0.3 * sx); gift(sx * 22.0, 19.5, 4.2, 9, '#b02f45', -0.2 * sx); gift(sx * 15.8, 24.8, 2.6, 6, '#fbf1e2', 0.5);
    for (let k = 0; k < 4; k++) block(sx * (26.0 + (k % 2) * 1.3), Math.floor(k / 2) * 1.3, 14.5 + (k % 2) * 0.3, 1.28, rndi(0, 15), rnd(-0.3, 0.3));
    house(sx * 27.0, 27.0, 4.0, 3.4, 4.2, sx > 0 ? '#f8e1e6' : '#e5eef8', sx > 0 ? '#2c4a8a' : '#c0283e', sx * 0.5, false);
    toyTree(sx * 13.6, 30.2, 4.2, '#3f7a5c', false); toyTree(sx * 20.0, 30.0, 5.0, '#2e5b45', false); toyTree(sx * 31.0, 16.0, 4.6, '#4a8a6a', false);
  }
  boxC(-40, -10.6, 10.6, 40, 9); boxC(10.6, 40, 10.6, 40, 9);
  // the giant tree's trunk far behind the palace, with presents the size of houses
  B.wood.add(GEO.cyl(32), '#5a3221', TRS(0, 10, -58, 0, 0, 0, 7, 22, 7));
  B.satin.add(lathe([[0, 0.02], [24, 0.02], [30, -0.02]], 64, 0), '#7a1b34', TRS(0, 0, -58));
  gift(-16, -36, 9, 1, '#e3b85c', 0.4); gift(15, -38, 11, 9, '#fbf1e2', -0.3); gift(-30, -24, 7, 6, '#b02f45', 0.2); gift(30, -26, 8, 3, '#e3b85c', -0.5); gift(0, -30, 6, 10, '#f3c3cc', 0.1);

  /* ---------------- sky backdrop, giant baubles, fairy lights ---------------- */
  const skyGeo = new THREE.CylinderGeometry(84, 84, 70, 48, 1, true);
  const sky = new THREE.Mesh(skyGeo, MAT2.sky); sky.position.set(0, 26, 8); root.add(sky);
  const capGeo = new THREE.CircleGeometry(84, 48); capGeo.rotateX(Math.PI / 2);
  const cap = new THREE.Mesh(capGeo, new THREE.MeshBasicMaterial({ color: '#2f3468', fog: false, toneMapped: false })); cap.position.set(0, 60, 8); root.add(cap);
  const baub = new THREE.InstancedMesh(GEO.sph(24, 16), MAT.ornament, 7);
  const dm = new THREE.Object3D(), bc = new THREE.Color();
  [[-34, 30, -40, 4.5, '#b02f45'], [26, 34, -46, 5.5, '#e3b85c'], [52, 26, -10, 4.0, '#7fb0e0'], [-54, 24, -6, 4.2, '#f3c3cc'], [-44, 34, 30, 3.6, '#e3b85c'], [48, 30, 34, 4.0, '#b02f45'], [6, 40, -60, 6.0, '#cfd3dc']].forEach(([x, y, z, r, c], i) => {
    dm.position.set(x, y, z); dm.scale.setScalar(r); dm.updateMatrix(); baub.setMatrixAt(i, dm.matrix); baub.setColorAt(i, bc.set(c));
    B.gold.add(GEO.cyl(12), '#d9ad5a', TRS(x, y + r * 1.02, z, 0, 0, 0, r * 0.22, r * 0.3, r * 0.22));
    B.gold.add(GEO.cyl(4), '#cfd3dc', TRS(x, y + r + 12, z, 0, 0, 0, 0.06, 24, 0.06));
  });
  baub.castShadow = false; root.add(baub);
  const skyGlow = [];
  for (let i = 0; i < 70; i++) { const a = rnd(0, TAU), r = rnd(30, 70); skyGlow.push({ p: [Math.cos(a) * r, rnd(20, 46), 8 + Math.sin(a) * r], c: pick(['#ffd68a', '#ffc0d6', '#cfe3ff', '#fff1cf']), s: rnd(5, 11), tw: 0.5 }); }
  const sg = makeGlowPoints(skyGlow, { boost: 0.9 }); root.add(sg);

  /* ---------------- finalize static batches ---------------- */
  for (const k in B) {
    if (B[k].empty) continue;
    const m = B[k].build({ cast: k !== 'glow' && k !== 'signs', receive: true, name: k });
    m.matrixAutoUpdate = false; m.updateMatrix();
    root.add(m);
  }
  W.glows = makeGlowPoints(glows); root.add(W.glows);

  /* ---------------- lights ---------------- */
  const L = {};
  L.hemi = new THREE.HemisphereLight('#fff1f4', '#b48aa6', 1.2);
  L.key = new THREE.DirectionalLight('#fff0dc', 2.25);
  L.key.position.set(-18, 34, 30); L.key.target.position.set(0, 0, 8);
  L.key.castShadow = true;
  const sm = DEVICE.mobile ? 1024 : 2048;
  L.key.shadow.mapSize.set(sm, sm);
  Object.assign(L.key.shadow.camera, { left: -40, right: 40, top: 36, bottom: -36, near: 4, far: 110 });
  L.key.shadow.bias = -0.0008; L.key.shadow.normalBias = 0.05; L.key.shadow.radius = 2.5;
  L.rim = new THREE.DirectionalLight('#c9d8ff', 0.55); L.rim.position.set(12, 20, -34);
  root.add(L.hemi, L.key, L.key.target, L.rim);
  W.lights = L;
  W.bounds = { x0: -32.4, x1: 32.4, z0: -12.5, z1: 32.4 };
  return W;
}

/* a lit window for the station (static batch) */
function addWindowW(B, x, y, z) {
  B.glow.add(ARCH.glass(), '#ffe0a0', TRS(x, y, z + 0.01, 0, 0, 0, 0.6, 1.0, 1));
  B.gold.add(ARCH.frame(), '#d9ad5a', TRS(x, y, z + 0.02, 0, 0, 0, 0.6, 1.0, 1));
}
