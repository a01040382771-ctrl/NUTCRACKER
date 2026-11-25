/* =====================================================================
   06 · THE STAHLBAUM MANSION — a dollhouse parlour on a ballet stage
   Room interior: x ∈ [-13, 13], z ∈ [-9, 9], walls 7.2 high, apron to z = 10.6
   ===================================================================== */
const ROOM = { x0: -13, x1: 13, z0: -9, z1: 9, H: 7.2, WAIN: 1.9, apron: 10.6 };

function buildMansion(scene) {
  const W = { colliders: [], dyn: [], anim: [], glowList: [], beams: [], props: {} };
  const B = {
    cloth: new Batch(MAT.cloth), wood: new Batch(MAT.wood), gloss: new Batch(MAT.gloss), gold: new Batch(MAT.gold),
    glow: new Batch(MAT.glow), satin: new Batch(MAT.satin), marble: new Batch(MAT.marble), gifts: new Batch(MAT.gifts),
    blocks: new Batch(MAT.blocks), porcelain: new Batch(MAT.porcelain),
  };
  Object.defineProperty(B, 'push', { value: (m) => { for (const k in B) B[k].push(m); }, enumerable: false });
  Object.defineProperty(B, 'pop', { value: () => { for (const k in B) B[k].pop(); }, enumerable: false });
  const glows = W.glowList;
  const boxC = (x0, x1, z0, z1, top, bottom = 0, walk = true) => { const c = { t: 'b', x0, x1, z0, z1, top, bottom, walk, on: true }; W.colliders.push(c); return c; };
  const circC = (x, z, r, top, bottom = 0, walk = true) => { const c = { t: 'c', x, z, r, top, bottom, walk, on: true }; W.colliders.push(c); return c; };
  const H = ROOM.H, WAIN = ROOM.WAIN;
  const gold = '#d9ad5a', ivory = '#f8f0e2', cream = '#efe2c9', base = '#4e1b25', velvet = '#7a1b34', velvetDeep = '#5a1226';
  const velvetFn = (x, y) => new THREE.Color(velvet).lerp(new THREE.Color(velvetDeep), smoothstep(-1, -6, y) * 0.6);

  /* ---------------- floor & stage ---------------- */
  const fg = new THREE.PlaneGeometry(26.8, 19.6); fg.rotateX(-Math.PI / 2);
  const fu = fg.attributes.uv; for (let i = 0; i < fu.count; i++) fu.setXY(i, fu.getX(i) * 26.8, fu.getY(i) * 19.6);
  const floor = new THREE.Mesh(fg, MAT.floor); floor.position.set(0, 0, 0.8); floor.receiveShadow = true; scene.add(floor);
  B.cloth.add(GEO.box(), '#2c0a15', TRS(0, -0.72, 10.78, 0, 0, 0, 36, 1.4, 0.32));
  B.gold.add(GEO.cyl(12), gold, TRS(0, -0.04, 10.62, 0, 0, Math.PI / 2, 0.075, 30.4, 0.075));
  B.gold.add(GEO.cyl(12), gold, TRS(0, -0.36, 10.95, 0, 0, Math.PI / 2, 0.05, 36, 0.05));
  const hood = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true, -Math.PI / 2, Math.PI);
  for (let i = 0; i < 10; i++) {
    const x = -11.7 + i * 2.6;
    B.gold.add(hood, '#c99a4c', TRS(x, 0.13, 10.38, 0, 0, Math.PI / 2, 0.17, 0.62, 0.17));
    glows.push({ p: [x, 0.13, 10.3], c: '#ffe2a6', s: 1.5, tw: 0.08 });
  }

  /* ---------------- walls ---------------- */
  const wallShape = new THREE.Shape();
  wallShape.moveTo(-13.4, WAIN); wallShape.lineTo(13.4, WAIN); wallShape.lineTo(13.4, H); wallShape.lineTo(-13.4, H); wallShape.closePath();
  const winOutline = (cx, grow) => {
    const s = new THREE.Shape();
    s.moveTo(cx - 1.2 - grow, WAIN + 0.05 - grow * 0.3); s.lineTo(cx + 1.2 + grow, WAIN + 0.05 - grow * 0.3);
    s.lineTo(cx + 1.2 + grow, 5.15); s.absarc(cx, 5.15, 1.2 + grow, 0, Math.PI, false); s.closePath();
    return s;
  };
  const WINX = [-4.6, 4.6];
  WINX.forEach((cx) => wallShape.holes.push(winOutline(cx, 0)));
  const wallGeo = new THREE.ExtrudeGeometry(wallShape, { depth: 0.5, bevelEnabled: false, curveSegments: 24 });
  const backWall = new THREE.Mesh(wallGeo, MAT.wall); backWall.position.z = -9.5; backWall.receiveShadow = true; backWall.castShadow = true; scene.add(backWall);
  for (const sx of [-1, 1]) {
    const pg = new THREE.PlaneGeometry(18, H - WAIN); pg.rotateY(-sx * Math.PI / 2);
    const pu = pg.attributes.uv; for (let i = 0; i < pu.count; i++) pu.setXY(i, pu.getX(i) * 18 + 0.7, pu.getY(i) * (H - WAIN) + WAIN);
    const side = new THREE.Mesh(pg, MAT.wall); side.position.set(sx * 12.99, (WAIN + H) / 2, 0); side.receiveShadow = true; scene.add(side);
    B.cloth.add(GEO.box(), '#e8d6bb', TRS(sx * 13.26, H / 2, -0.25, 0, 0, 0, 0.5, H, 18.5));
    B.gold.add(GEO.box(), gold, TRS(sx * 13.22, (H + 0.3) / 2, 9.07, 0, 0, 0, 0.62, H + 0.3, 0.14));
  }
  // wainscot, rails, mouldings — run along each wall
  const runs = [
    { ax: 'x', c: -8.95, from: -13, to: 13, n: [0, 0, 1], skip: (u) => Math.abs(u + 10) < 0.9 || (u > 7.9 && u < 12.1) },
    { ax: 'z', c: -12.93, from: -9, to: 9, n: [1, 0, 0], skip: (u) => (u > 0.6 && u < 4.6) || u > 7 },
    { ax: 'z', c: 12.93, from: -9, to: 9, n: [-1, 0, 0], skip: (u) => (u > 4.3 && u < 7.0) },
  ];
  for (const r of runs) {
    const len = r.to - r.from, mid = (r.from + r.to) / 2;
    const at = (u, y, off, sx, sy, sz) => (r.ax === 'x' ? TRS(u, y, r.c + off * r.n[2], 0, 0, 0, sx, sy, sz) : TRS(r.c + off * r.n[0], y, u, 0, 0, 0, sz, sy, sx));
    B.wood.add(GEO.box(), cream, at(mid, WAIN / 2, -0.02, len, WAIN, 0.14));
    B.wood.add(GEO.box(), '#fbf3e4', at(mid, WAIN, 0.03, len, 0.12, 0.16));
    B.gold.add(GEO.box(), gold, at(mid, WAIN - 0.1, 0.08, len, 0.04, 0.04));
    B.wood.add(GEO.box(), base, at(mid, 0.15, 0.06, len, 0.3, 0.1));
    B.wood.add(GEO.box(), '#fbf3e4', at(mid, H + 0.16, -0.2, len + 0.2, 0.32, 0.75));
    B.gold.add(GEO.box(), gold, at(mid, H - 0.03, 0.17, len + 0.1, 0.06, 0.06));
    for (let u = r.from + 0.15; u < r.to; u += 0.26) B.gold.add(GEO.sph(6, 4), gold, at(u, H + 0.03, 0.19, 0.045, 0.045, 0.045));
    for (let u = r.from + 1.0; u < r.to - 0.6; u += 1.75) {
      if (r.skip(u)) continue;
      const pw = 1.35, ph = 1.08, py = 0.98;
      B.wood.add(GEO.box(), '#fbf5e8', at(u, py + ph / 2, 0.07, pw, 0.07, 0.05));
      B.wood.add(GEO.box(), '#fbf5e8', at(u, py - ph / 2, 0.07, pw, 0.07, 0.05));
      B.wood.add(GEO.box(), '#fbf5e8', at(u - pw / 2, py, 0.07, 0.07, ph, 0.05));
      B.wood.add(GEO.box(), '#fbf5e8', at(u + pw / 2, py, 0.07, 0.07, ph, 0.05));
      B.gold.add(GEO.box(), gold, at(u, py + ph / 2 - 0.1, 0.06, pw - 0.24, 0.02, 0.02));
      B.gold.add(GEO.box(), gold, at(u, py - ph / 2 + 0.1, 0.06, pw - 0.24, 0.02, 0.02));
      B.gold.add(GEO.box(), gold, at(u - pw / 2 + 0.12, py, 0.06, 0.02, ph - 0.22, 0.02));
      B.gold.add(GEO.box(), gold, at(u + pw / 2 - 0.12, py, 0.06, 0.02, ph - 0.22, 0.02));
    }
  }

  /* ---------------- windows, drapes, night outside ---------------- */
  const glass = new Batch(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.1, depthWrite: false, toneMapped: false }));
  for (const cx of WINX) {
    const ring = winOutline(cx, 0.26); ring.holes.push(winOutline(cx, 0));
    B.wood.add(new THREE.ExtrudeGeometry(ring, { depth: 0.72, bevelEnabled: false, curveSegments: 28 }), ivory, TRS(0, 0, -9.52));
    const ring2 = winOutline(cx, 0.06); ring2.holes.push(winOutline(cx, 0));
    B.gold.add(new THREE.ExtrudeGeometry(ring2, { depth: 0.74, bevelEnabled: false, curveSegments: 28 }), gold, TRS(0, 0, -9.53));
    B.wood.add(GEO.box(), ivory, TRS(cx, (WAIN + 6.35) / 2, -9.15, 0, 0, 0, 0.08, 6.35 - WAIN, 0.08));
    for (const y of [3.4, 4.65]) B.wood.add(GEO.box(), ivory, TRS(cx, y, -9.15, 0, 0, 0, 2.4, 0.07, 0.08));
    for (const a of [Math.PI / 6, Math.PI / 3, (2 * Math.PI) / 3, (5 * Math.PI) / 6]) B.wood.add(GEO.box(), ivory, TRS(cx + Math.cos(a) * 0.6, 5.15 + Math.sin(a) * 0.6, -9.15, 0, 0, a - Math.PI / 2, 0.06, 1.2, 0.07));
    B.wood.add(GEO.torus(0.6, 0.035, 6, 24, Math.PI), ivory, TRS(cx, 5.15, -9.15));
    B.wood.add(roundBox(3.0, 0.14, 0.55, 0.04, 2), ivory, TRS(cx, WAIN, -8.82));
    glass.add(new THREE.ShapeGeometry(winOutline(cx, 0), 24), '#d6e4ff', TRS(0, 0, -9.2));
    // drapes with tie-backs
    for (const s of [-1, 1]) {
      B.cloth.add(drapeGeo(1.5, 6.6, 3.5, 0.12, { tie: 0.6, tieSide: s, segX: 30, segY: 24 }), velvetFn, TRS(cx + s * 1.75, 6.95, -8.68));
      const tx = cx + s * 2.27;
      B.gold.add(GEO.torus(0.26, 0.045, 8, 24), gold, TRS(tx, 3.0, -8.62, Math.PI / 2, 0, 0, 1, 0.6, 1));
      B.gold.add(lathe([[0, 0], [0.07, -0.05], [0.09, -0.22], [0.05, -0.3], [0, -0.32]], 12, 10), gold, TRS(tx + s * 0.1, 2.92, -8.4));
    }
    // swag valance with gold fringe
    const sw = [[-2.55, 0.5, 0], [-1.3, 0.02, 0.05], [0, -0.16, 0.08], [1.3, 0.02, 0.05], [2.55, 0.5, 0]];
    const swCurve = new THREE.CatmullRomCurve3(sw.map((p) => new THREE.Vector3(...p)));
    B.push(TRS(cx, 6.45, -8.55));
    B.cloth.add(new THREE.TubeGeometry(swCurve, 40, 0.32, 10), velvetFn, TRS(0, 0, 0, 0, 0, 0, 1, 1, 0.45));
    for (let t = 0.04; t < 0.97; t += 0.022) { const p = swCurve.getPoint(t); B.gold.add(GEO.cyl(4), gold, TRS(p.x, p.y - 0.36, p.z + 0.08, 0, 0, 0, 0.014, 0.2, 0.014)); }
    B.pop();
    for (const s of [-1, 1]) {
      B.cloth.add(GEO.cone(12), velvet, TRS(cx + s * 2.5, 5.95, -8.66, Math.PI, 0, 0, 0.36, 1.7, 0.16));
      B.gold.add(GEO.sph(8, 6), gold, TRS(cx + s * 2.5, 5.05, -8.66, 0, 0, 0, 0.08));
    }
    B.gold.add(GEO.cyl(12), gold, TRS(cx, 6.97, -8.78, 0, 0, Math.PI / 2, 0.05, 5.7, 0.05));
    for (const s of [-1, 1]) B.gold.add(GEO.sph(12, 8), gold, TRS(cx + s * 2.9, 6.97, -8.78, 0, 0, 0, 0.12));
    // moonbeam
    const top = new THREE.Vector3(cx, 5.4, -8.9), bot = new THREE.Vector3(cx * 0.55 + 1.0, 0.02, -2.6);
    const dir = top.clone().sub(bot), L = dir.length();
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(2.3, L), new THREE.MeshBasicMaterial({ map: TEX.beam, color: '#c9d8ff', transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    bm.position.copy(top.clone().add(bot).multiplyScalar(0.5));
    bm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    bm.renderOrder = 14; scene.add(bm); W.beams.push(bm);
  }
  const night = new THREE.Mesh(new THREE.PlaneGeometry(16, 6.2), new THREE.MeshBasicMaterial({ map: TEX.night, toneMapped: false }));
  night.position.set(0, 3.9, -10.4); scene.add(night);
  scene.add(makeSnow(DEVICE.mobile ? 110 : 170, [-6.5, 1.8, -10.3], [6.5, 6.8, -9.65], { size: 0.75, speed: 0.7 }));
  const glassMesh = glass.build({ cast: false, receive: false }); glassMesh.renderOrder = 13; scene.add(glassMesh);

  /* ---------------- wall sconces & paintings ---------------- */
  const sconce = (x, y, z, rotY) => {
    B.push(TRS(x, y, z, 0, rotY, 0));
    B.gold.add(roundBox(0.22, 0.42, 0.06, 0.03, 2), gold, TRS(0, 0, 0));
    B.gold.add(tubeGeo([[0, -0.1, 0.03], [0, -0.16, 0.22], [0, 0.0, 0.34]], 0.022, 12, 6), gold);
    B.gold.add(lathe([[0, 0], [0.07, 0.01], [0.09, 0.05], [0.04, 0.06]], 12, 0), gold, TRS(0, 0.0, 0.34));
    B.porcelain.add(GEO.cyl(10), '#fbf5ea', TRS(0, 0.15, 0.34, 0, 0, 0, 0.035, 0.26, 0.035));
    B.glow.add(GEO.sph(8, 6), '#ffd27a', TRS(0, 0.33, 0.34, 0, 0, 0, 0.028, 0.06, 0.028));
    B.pop();
    const p = new THREE.Vector3(0, 0.34, 0.34).applyMatrix4(TRS(x, y, z, 0, rotY, 0));
    glows.push({ p: [p.x, p.y, p.z], c: '#ffcf7a', s: 1.1, tw: 0.3 });
  };
  sconce(-7.4, 3.6, -8.96, 0); sconce(7.0, 3.6, -8.96, 0);
  sconce(-12.92, 3.4, -3.0, Math.PI / 2); sconce(-12.92, 3.4, 6.4, Math.PI / 2);
  sconce(12.92, 3.4, -0.2, -Math.PI / 2); sconce(12.92, 3.4, 7.6, -Math.PI / 2);
  const painting = (tex, w, h, x, y, z, rotY) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex }));
    m.position.set(x, y, z); m.rotation.y = rotY; m.receiveShadow = true; scene.add(m);
    B.push(TRS(x, y, z, 0, rotY, 0));
    const f = 0.14;
    B.gold.add(roundBox(w + f * 2, f, 0.1, 0.03, 2), gold, TRS(0, h / 2 + f / 2, 0.0));
    B.gold.add(roundBox(w + f * 2, f, 0.1, 0.03, 2), gold, TRS(0, -h / 2 - f / 2, 0.0));
    B.gold.add(roundBox(f, h, 0.1, 0.03, 2), gold, TRS(-w / 2 - f / 2, 0, 0.0));
    B.gold.add(roundBox(f, h, 0.1, 0.03, 2), gold, TRS(w / 2 + f / 2, 0, 0.0));
    for (const [cx, cy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.gold.add(GEO.sph(8, 6), gold, TRS(cx * (w / 2 + f / 2), cy * (h / 2 + f / 2), 0.05, 0, 0, 0, 0.09));
    B.gold.add(GEO.sph(10, 8), gold, TRS(0, h / 2 + f + 0.06, 0.03, 0, 0, 0, 0.16, 0.1, 0.06));
    B.pop();
  };
  painting(TEX.landscape, 2.1, 1.3, -12.94, 4.15, 2.6, Math.PI / 2);
  painting(TEX.landscape, 1.6, 1.0, 12.94, 4.3, 1.6, -Math.PI / 2);

  /* ---------------- grandfather clock with Drosselmeyer's owl ---------------- */
  {
    const x = -10, z = -8.55, mah = '#5a2219', mah2 = '#74321f', dark = '#24100c';
    B.wood.add(roundBox(1.3, 0.22, 0.82, 0.05, 2), mah, TRS(x, 0.11, z));
    B.wood.add(roundBox(1.12, 1.0, 0.7, 0.04, 2), mah2, TRS(x, 0.72, z));
    B.wood.add(roundBox(1.22, 0.1, 0.78, 0.03, 2), mah, TRS(x, 1.26, z));
    B.wood.add(roundBox(0.82, 2.25, 0.56, 0.03, 2), mah2, TRS(x, 2.42, z));
    B.wood.add(GEO.box(), dark, TRS(x, 2.5, z + 0.281, 0, 0, 0, 0.5, 1.5, 0.01));
    for (const [w, h, ox, oy] of [[0.58, 0.05, 0, 0.77], [0.58, 0.05, 0, -0.77], [0.05, 1.58, -0.27, 0], [0.05, 1.58, 0.27, 0]]) B.gold.add(GEO.box(), gold, TRS(x + ox, 2.5 + oy, z + 0.29, 0, 0, 0, w, h, 0.02));
    for (const [w, h, ox, oy] of [[0.8, 0.04, 0, 0.36], [0.8, 0.04, 0, -0.36], [0.04, 0.72, -0.4, 0], [0.04, 0.72, 0.4, 0]]) B.gold.add(GEO.box(), gold, TRS(x + ox, 0.72 + oy, z + 0.355, 0, 0, 0, w, h, 0.02));
    B.gold.add(GEO.sph(12, 8), gold, TRS(x, 0.72, z + 0.36, 0, 0, 0, 0.13, 0.13, 0.03));
    B.wood.add(roundBox(1.22, 0.1, 0.76, 0.03, 2), mah, TRS(x, 3.6, z));
    B.wood.add(roundBox(1.14, 1.32, 0.7, 0.04, 2), mah2, TRS(x, 4.3, z));
    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), new THREE.MeshStandardMaterial({ map: TEX.clock, roughness: 0.45 }));
    dial.position.set(x, 4.3, z + 0.355); dial.receiveShadow = true; scene.add(dial);
    B.gold.add(GEO.torus(0.44, 0.045, 8, 40), gold, TRS(x, 4.3, z + 0.355));
    for (const s of [-1, 1]) {
      B.gold.add(GEO.cyl(10), gold, TRS(x + s * 0.5, 4.3, z + 0.32, 0, 0, 0, 0.035, 1.22, 0.035));
      for (const yy of [3.69, 4.91]) B.gold.add(GEO.sph(8, 6), gold, TRS(x + s * 0.5, yy, z + 0.32, 0, 0, 0, 0.06));
    }
    const arch = new THREE.Shape(); arch.moveTo(-0.6, 0); arch.absarc(0, 0, 0.6, Math.PI, 0, true); arch.closePath();
    B.wood.add(new THREE.ExtrudeGeometry(arch, { depth: 0.62, bevelEnabled: false, curveSegments: 20 }), mah, TRS(x, 4.96, z - 0.31));
    B.gold.add(GEO.torus(0.6, 0.035, 6, 24, Math.PI), gold, TRS(x, 4.96, z + 0.32));
    B.wood.add(roundBox(0.34, 0.12, 0.34, 0.03, 2), mah, TRS(x, 5.6, z));
    // owl
    B.gold.add(GEO.sph(16, 12), gold, TRS(x, 5.86, z, 0, 0, 0, 0.17, 0.22, 0.15));
    B.gold.add(GEO.sph(16, 12), gold, TRS(x, 6.13, z + 0.01, 0, 0, 0, 0.14, 0.12, 0.13));
    for (const s of [-1, 1]) {
      B.gold.add(GEO.cone(6), gold, TRS(x + s * 0.09, 6.27, z, 0, 0, s * -0.4, 0.035, 0.1, 0.035));
      B.gold.add(GEO.sph(8, 6), '#fff4d0', TRS(x + s * 0.055, 6.14, z + 0.115, 0, 0, 0, 0.045, 0.045, 0.02));
      B.glow.add(GEO.sph(8, 6), '#ffb43c', TRS(x + s * 0.055, 6.14, z + 0.13, 0, 0, 0, 0.022));
      B.gold.add(GEO.sph(6, 4), gold, TRS(x + s * 0.06, 5.64, z + 0.08, 0, 0, 0, 0.04, 0.025, 0.06));
    }
    B.gold.add(GEO.cone(6), '#b07c34', TRS(x, 6.09, z + 0.14, Math.PI / 2, 0, 0, 0.025, 0.06, 0.025));
    W.owlEyes = [[x - 0.055, 6.14, z + 0.14], [x + 0.055, 6.14, z + 0.14]];
    const wings = [];
    for (const s of [-1, 1]) {
      const piv = new THREE.Group(); piv.position.set(x + s * 0.14, 5.98, z);
      const wb = new Batch(MAT.gold); wb.add(GEO.sph(12, 8), gold, TRS(s * 0.04, -0.12, 0, 0, 0, s * 0.15, 0.05, 0.18, 0.12));
      piv.add(wb.build()); scene.add(piv); wings.push(piv);
    }
    const hands = new THREE.Group(); hands.position.set(x, 4.3, z + 0.37); scene.add(hands);
    const mkHand = (w, l) => { const g = new THREE.BoxGeometry(w, l, 0.012); g.translate(0, l / 2 - 0.04, 0); const hb = new Batch(MAT.gold); hb.add(g, '#3a2418'); return hb.build({ cast: false }); };
    const hourHand = mkHand(0.04, 0.24), minuteHand = mkHand(0.026, 0.35);
    hands.add(hourHand, minuteHand);
    const pend = new THREE.Group(); pend.position.set(x, 3.35, z + 0.295); scene.add(pend);
    const pb = new Batch(MAT.gold);
    pb.add(GEO.cyl(6), gold, TRS(0, -0.5, 0, 0, 0, 0, 0.012, 0.95, 0.012));
    pb.add(GEO.cyl(24), gold, TRS(0, -1.02, 0, Math.PI / 2, 0, 0, 0.13, 0.02, 0.13));
    pend.add(pb.build({ cast: false }));
    W.props.clock = { hourHand, minuteHand, pend, wings, minutes: 45, hours: 11 };
    boxC(x - 0.65, x + 0.65, -9, z + 0.41, 6.2, 0, false);
  }

  /* ---------------- fireplace ---------------- */
  {
    const fx = 10, mw = '#fff3ee';
    B.marble.add(roundBox(4.0, 0.1, 1.3, 0.03, 2), mw, TRS(fx, 0.05, -8.35));
    for (const s of [-1, 1]) {
      B.marble.add(roundBox(0.6, 1.97, 0.75, 0.05, 2), mw, TRS(fx + s * 1.45, 1.08, -8.62));
      B.marble.add(roundBox(0.72, 0.14, 0.84, 0.03, 2), mw, TRS(fx + s * 1.45, 0.17, -8.6));
      B.gold.add(GEO.box(), gold, TRS(fx + s * 1.45, 1.1, -8.24, 0, 0, 0, 0.36, 1.4, 0.02));
    }
    B.marble.add(roundBox(3.5, 0.5, 0.75, 0.05, 2), mw, TRS(fx, 2.32, -8.62));
    B.gold.add(GEO.box(), gold, TRS(fx, 2.32, -8.24, 0, 0, 0, 2.6, 0.24, 0.02));
    B.gold.add(GEO.sph(12, 8), gold, TRS(fx, 2.32, -8.22, 0, 0, 0, 0.16, 0.16, 0.04));
    B.marble.add(roundBox(4.05, 0.14, 1.17, 0.04, 2), mw, TRS(fx, 2.64, -8.43));
    B.cloth.add(GEO.box(), '#1a0b09', TRS(fx, 1.08, -8.94, 0, 0, 0, 2.3, 1.97, 0.1));
    B.cloth.add(GEO.box(), '#2a110c', TRS(fx, 2.05, -8.62, 0, 0, 0, 2.3, 0.05, 0.7));
    B.cloth.add(GEO.box(), '#24100b', TRS(fx, 0.11, -8.62, 0, 0, 0, 2.3, 0.02, 0.7));
    for (const [a, z, y] of [[0.3, -8.6, 0.25], [-0.25, -8.5, 0.27], [0.05, -8.7, 0.45]]) B.wood.add(GEO.cyl(10), '#5a3221', TRS(fx, y, z, 0, a, Math.PI / 2, 0.11, 1.3, 0.11));
    for (const s of [-1, 1]) B.gold.add(GEO.cyl(8), gold, TRS(fx + s * 0.75, 0.3, -8.35, 0, 0, 0, 0.03, 0.45, 0.03));
    const flames = makeFlames(1.35, 1.15, 3); flames.position.set(fx, 0.28, -8.6); scene.add(flames);
    W.props.flames = flames;
    for (let i = 0; i < 9; i++) glows.push({ p: [fx + rnd(-0.6, 0.6), rnd(0.25, 0.45), -8.6 + rnd(-0.12, 0.15)], c: pick(['#ff7a2a', '#ffb347', '#ff9a3c']), s: rnd(0.5, 0.9), tw: 0.8 });
    glows.push({ p: [fx, 0.8, -8.5], c: '#ff9a40', s: 4.2, tw: 0.35 });
    // fender
    B.gold.add(GEO.cyl(8), gold, TRS(fx, 0.3, -7.82, 0, 0, Math.PI / 2, 0.03, 3.0, 0.03));
    B.gold.add(GEO.cyl(8), gold, TRS(fx, 0.14, -7.82, 0, 0, Math.PI / 2, 0.02, 3.0, 0.02));
    for (const s of [-1, 0, 1]) B.gold.add(GEO.sph(8, 6), gold, TRS(fx + s * 1.5, 0.34, -7.82, 0, 0, 0, s === 0 ? 0.04 : 0.06));
    // chimney breast with portrait
    B.cloth.add(GEO.box(), '#f3dcd4', TRS(fx, 4.96, -8.85, 0, 0, 0, 3.4, 4.5, 0.3));
    B.wood.add(GEO.box(), '#fbf3e4', TRS(fx, 2.78, -8.68, 0, 0, 0, 3.5, 0.1, 0.06));
    const port = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshLambertMaterial({ map: TEX.portrait }));
    port.scale.set(0.7, 0.88, 1); port.position.set(fx, 4.75, -8.69); scene.add(port);
    B.gold.add(GEO.torus(1, 0.07, 10, 48), gold, TRS(fx, 4.75, -8.68, 0, 0, 0, 0.74, 0.92, 1));
    B.gold.add(GEO.torus(1, 0.03, 6, 48), gold, TRS(fx, 4.75, -8.66, 0, 0, 0, 0.82, 1.0, 1));
    B.gold.add(GEO.sph(10, 8), gold, TRS(fx, 5.78, -8.64, 0, 0, 0, 0.2, 0.13, 0.06));
    for (const s of [-1, 1]) B.gold.add(GEO.torus(0.09, 0.03, 6, 14), gold, TRS(fx + s * 0.18, 5.76, -8.64, 0, 0, s * 0.6, 1, 0.7, 1));
    // garland with berries and bows
    const garl = [[fx - 2.05, 2.66, -7.88], [fx - 1.5, 2.32, -7.84], [fx - 0.95, 2.62, -7.86], [fx, 2.68, -7.88], [fx + 0.95, 2.62, -7.86], [fx + 1.5, 2.32, -7.84], [fx + 2.05, 2.66, -7.88]];
    const gc = new THREE.CatmullRomCurve3(garl.map((p) => new THREE.Vector3(...p)));
    const gg = new THREE.TubeGeometry(gc, 60, 0.13, 8);
    deform(gg, (v, i) => { const n = Math.sin(i * 12.9898) * 43758.5453; const r = n - Math.floor(n); v.y += (r - 0.5) * 0.05; v.z += (r - 0.5) * 0.04; });
    B.cloth.add(gg, (x, y, z, i) => new THREE.Color(PAL.pine).lerp(new THREE.Color(PAL.pineLight), ((i * 7) % 5) / 5));
    for (let t = 0.02; t < 1; t += 0.035) { const p = gc.getPoint(t); B.gloss.add(GEO.sph(8, 6), t % 0.07 > 0.035 ? '#c0283e' : '#e3b85c', TRS(p.x + rnd(-0.05, 0.05), p.y + rnd(-0.08, 0.06), p.z + 0.1, 0, 0, 0, 0.04)); }
    for (const bx of [fx - 2.0, fx, fx + 2.0]) for (const s of [-1, 1]) B.satin.add(GEO.torus(0.09, 0.03, 8, 16), '#8a2140', TRS(bx + s * 0.09, 2.72, -7.78, 0, 0, s * 0.4, 1, 0.7, 0.5));
    // candlesticks & a carriage clock on the mantel
    for (const s of [-1, 1]) {
      const cx = fx + s * 1.65;
      B.gold.add(lathe([[0, 0], [0.12, 0], [0.1, 0.04], [0.04, 0.08], [0.03, 0.4], [0.06, 0.45], [0.07, 0.5], [0.04, 0.52]], 14, 20), gold, TRS(cx, 2.71, -8.5));
      B.porcelain.add(GEO.cyl(10), '#fbf5ea', TRS(cx, 3.42, -8.5, 0, 0, 0, 0.04, 0.38, 0.04));
      B.glow.add(GEO.sph(8, 6), '#ffd27a', TRS(cx, 3.66, -8.5, 0, 0, 0, 0.03, 0.065, 0.03));
      glows.push({ p: [cx, 3.68, -8.5], c: '#ffcf7a', s: 1.0, tw: 0.3 });
    }
    B.gold.add(roundBox(0.34, 0.42, 0.22, 0.04, 2), gold, TRS(fx + 0.8, 2.92, -8.6));
    B.porcelain.add(GEO.circle(20), '#fffaf0', TRS(fx + 0.8, 2.96, -8.488, 0, 0, 0, 0.11));
    // stockings (the middle one hides a star)
    const stk = new THREE.Shape();
    stk.moveTo(-0.15, 0); stk.lineTo(0.15, 0); stk.lineTo(0.15, -0.48);
    stk.quadraticCurveTo(0.17, -0.6, 0.3, -0.62); stk.quadraticCurveTo(0.44, -0.66, 0.42, -0.78);
    stk.quadraticCurveTo(0.38, -0.9, 0.12, -0.88); stk.quadraticCurveTo(-0.15, -0.88, -0.15, -0.6); stk.closePath();
    const stkGeo = new THREE.ExtrudeGeometry(stk, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 10 });
    const cols = ['#8a2140', '#a9c8ea', '#f2b9c6'];
    W.props.stockings = [];
    [fx - 1.0, fx, fx + 1.0].forEach((sxp, i) => {
      const piv = new THREE.Group(); piv.position.set(sxp, 2.58, -7.92);
      const sb = new Batch(MAT.satin);
      sb.add(stkGeo, cols[i], TRS(0, -0.08, -0.04));
      sb.add(roundBox(0.42, 0.16, 0.2, 0.06, 2), '#fffdf8', TRS(0.0, -0.06, 0));
      if (i === 1) sb.add(starGeo(0.09, 0.04, 0.02, 0.012), '#e3b85c', TRS(0.0, -0.45, 0.07));
      sb.add(GEO.sph(8, 6), '#e3b85c', TRS(0.0, 0.03, 0.04, 0, 0, 0, 0.04));
      piv.add(sb.build({ cast: false }));
      piv.rotation.y = (i - 1) * 0.05;
      scene.add(piv); W.props.stockings.push(piv);
    });
    boxC(fx - 2.0, fx + 2.0, -9, -7.7, 0.1);
    boxC(fx - 1.75, fx + 1.75, -9, -8.25, 2.71);
    boxC(fx - 2.02, fx + 2.02, -9, -7.85, 2.71, 2.57);
    boxC(fx - 1.7, fx + 1.7, -9, -8.7, 7.2, 2.71, false);
  }

  /* ---------------- alphabet block stairs to the mantel ---------------- */
  {
    const bl = [[6.3, 0, 0, -0.08], [6.95, 0, 1, 0.06], [6.95, 1, 4, -0.04], [7.6, 0, 2, 0.05], [7.6, 1, 3, -0.06], [7.6, 2, 8, 0.03]];
    for (const [x, lvl, cell, rot] of bl) {
      B.blocks.add(roundBox(0.62, 0.62, 0.62, 0.05, 2), '#ffffff', TRS(x, 0.31 + lvl * 0.62, -8.25, 0, rot, 0), atlasRect(cell, 4, 0.04));
    }
    boxC(6.0, 6.6, -8.56, -7.94, 0.62); boxC(6.65, 7.26, -8.56, -7.94, 1.24); boxC(7.3, 7.92, -8.56, -7.94, 1.86);
  }

  /* ---------------- settee, tea table, ottoman (left) ---------------- */
  {
    const pinkV = '#e9a7b6', pinkD = '#d98a9d';
    B.gold.add(roundBox(1.2, 0.2, 3.2, 0.06, 2), gold, TRS(-12.15, 0.42, 2.6));
    for (const [lx, lz] of [[-12.65, 1.1], [-11.65, 1.1], [-12.65, 4.1], [-11.65, 4.1]]) B.gold.add(lathe([[0.075, 0], [0.05, 0.08], [0.04, 0.2], [0.065, 0.3], [0.05, 0.34]], 10, 0), gold, TRS(lx, 0, lz));
    B.satin.add(roundBox(1.15, 0.26, 3.05, 0.1, 3), pinkV, TRS(-12.12, 0.6, 2.6));
    const back = new THREE.Shape(); back.moveTo(1.0, 0.65);
    for (let i = 0; i <= 24; i++) { const z = lerp(1.0, 4.2, i / 24); back.lineTo(z, 1.45 + 0.32 * Math.sin(Math.PI * (i / 24))); }
    back.lineTo(4.2, 0.65); back.closePath();
    const bgeo = new THREE.ExtrudeGeometry(back, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.06, bevelSegments: 3, curveSegments: 8 });
    B.satin.add(bgeo, pinkV, TRS(-12.84, 0, 0, 0, -Math.PI / 2, 0));
    const topCurve = []; for (let i = 0; i <= 24; i++) { const z = lerp(1.0, 4.2, i / 24); topCurve.push([-12.71, 1.5 + 0.32 * Math.sin(Math.PI * (i / 24)), z]); }
    B.gold.add(tubeGeo(topCurve, 0.04, 48, 6), gold);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const z = 1.45 + i * 0.46 + (r % 2) * 0.23; const y = 1.05 + r * 0.26; B.satin.add(GEO.sph(6, 4), pinkD, TRS(-12.58, y, z, 0, 0, 0, 0.035)); }
    for (const z of [1.0, 4.2]) {
      B.satin.add(GEO.cyl(16), pinkV, TRS(-12.15, 1.0, z, 0, 0, Math.PI / 2, 0.17, 1.15, 0.17));
      B.satin.add(roundBox(1.1, 0.4, 0.2, 0.06, 2), pinkV, TRS(-12.15, 0.78, z));
      B.gold.add(GEO.torus(0.13, 0.03, 6, 18), gold, TRS(-11.57, 1.0, z, 0, Math.PI / 2, 0));
    }
    B.satin.add(roundBox(0.18, 0.55, 0.55, 0.14, 3), '#8a2140', TRS(-12.42, 1.02, 1.75, 0, 0, -0.25));
    B.satin.add(roundBox(0.18, 0.5, 0.5, 0.13, 3), '#a9c8ea', TRS(-12.42, 1.0, 3.45, 0, 0, -0.22));
    for (const [y, z] of [[1.28, 1.5], [1.28, 2.0], [0.76, 1.5], [0.76, 2.0]]) B.gold.add(GEO.sph(6, 4), gold, TRS(-12.36, y, z, 0, 0, 0, 0.035));
    boxC(-12.86, -11.55, 1.15, 4.05, 0.72);
    boxC(-12.86, -12.5, 0.85, 4.35, 1.85, 0, false);
    boxC(-12.86, -11.55, 0.8, 1.17, 1.17); boxC(-12.86, -11.55, 4.03, 4.4, 1.17);
    // tea table with cakes
    const tx = -8.4, tz = 5.3;
    const cloth = lathe([[0, 1.02], [0.82, 1.02], [0.87, 0.99], [0.9, 0.8], [0.94, 0.62]], 40, 14);
    deform(cloth, (v) => { const a = Math.atan2(v.x, v.z); if (v.y < 0.95) { const w = smoothstep(0.95, 0.62, v.y); v.y += w * 0.03 * Math.sin(a * 12); const k = 1 + w * 0.025 * Math.sin(a * 12); v.x *= k; v.z *= k; } });
    B.cloth.add(cloth, '#fbf3ea', TRS(tx, 0, tz));
    const lace = new THREE.TorusGeometry(0.94, 0.02, 6, 80); lace.rotateX(Math.PI / 2);
    deform(lace, (v) => { const a = Math.atan2(v.x, v.z); v.y += 0.03 * Math.sin(a * 12) + 0.008 * Math.sin(a * 60); });
    B.cloth.add(lace, '#ffffff', TRS(tx, 0.62, tz));
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; B.gold.add(lathe([[0.06, 0], [0.04, 0.1], [0.03, 0.4], [0.05, 0.62]], 8, 0), gold, TRS(tx + Math.sin(a) * 0.5, 0, tz + Math.cos(a) * 0.5)); }
    const sx0 = tx - 0.2, sz0 = tz - 0.25;
    B.gold.add(GEO.cyl(8), gold, TRS(sx0, 1.38, sz0, 0, 0, 0, 0.016, 0.72, 0.016));
    [[1.08, 0.3], [1.33, 0.24], [1.56, 0.18]].forEach(([y, r], li) => {
      B.porcelain.add(GEO.cyl(24), '#fffaf4', TRS(sx0, y, sz0, 0, 0, 0, r, 0.02, r));
      B.gold.add(GEO.torus(r, 0.008, 4, 28), gold, TRS(sx0, y + 0.01, sz0, Math.PI / 2, 0, 0));
      const n = 6 - li;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + li, rr2 = r * 0.62, px = sx0 + Math.sin(a) * rr2, pz = sz0 + Math.cos(a) * rr2;
        B.porcelain.add(roundBox(0.09, 0.07, 0.09, 0.025, 2), pick(['#f6c6d2', '#c9e4d4', '#fbefd6', '#cfe0f5']), TRS(px, y + 0.045, pz, 0, a, 0));
        B.gloss.add(GEO.sph(6, 4), '#c0283e', TRS(px, y + 0.1, pz, 0, 0, 0, 0.017));
      }
    });
    B.push(TRS(tx + 0.3, 1.02, tz + 0.05));
    B.porcelain.add(lathe([[0, 0], [0.12, 0], [0.17, 0.06], [0.18, 0.13], [0.14, 0.2], [0.08, 0.23], [0, 0.23]], 20, 16), '#fbf1f4');
    B.porcelain.add(GEO.sph(8, 6), '#f2b9c6', TRS(0, 0.26, 0, 0, 0, 0, 0.035));
    B.porcelain.add(tubeGeo([[0.15, 0.08, 0], [0.24, 0.12, 0], [0.3, 0.2, 0]], 0.025, 10, 6), '#fbf1f4');
    B.porcelain.add(GEO.torus(0.07, 0.016, 6, 14), '#fbf1f4', TRS(-0.18, 0.12, 0));
    B.gold.add(GEO.torus(0.16, 0.008, 4, 24), gold, TRS(0, 0.15, 0, Math.PI / 2, 0, 0));
    B.pop();
    for (const [cx, cz] of [[tx + 0.25, tz + 0.5], [tx - 0.45, tz + 0.35]]) {
      B.porcelain.add(GEO.cyl(20), '#fffaf4', TRS(cx, 1.03, cz, 0, 0, 0, 0.11, 0.01, 0.11));
      B.porcelain.add(lathe([[0, 0], [0.04, 0], [0.065, 0.06], [0.07, 0.08], [0.065, 0.08], [0.0, 0.01]], 16, 0), '#fbf1f4', TRS(cx, 1.035, cz));
    }
    circC(tx, tz, 0.94, 1.02);
    // ottoman
    const ox = -6.6, oz = 6.4;
    B.satin.add(lathe([[0, 0.52], [0.36, 0.52], [0.44, 0.47], [0.47, 0.32], [0.45, 0.14], [0.41, 0.09], [0, 0.09]], 30, 16), velvet, TRS(ox, 0, oz));
    for (const y of [0.5, 0.1]) B.gold.add(GEO.torus(y > 0.3 ? 0.42 : 0.41, 0.022, 6, 30), gold, TRS(ox, y, oz, Math.PI / 2, 0, 0));
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; B.satin.add(GEO.sph(6, 4), velvetDeep, TRS(ox + Math.sin(a) * 0.2, 0.53, oz + Math.cos(a) * 0.2, 0, 0, 0, 0.03)); }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.78; B.gold.add(GEO.sph(8, 6), gold, TRS(ox + Math.sin(a) * 0.32, 0.05, oz + Math.cos(a) * 0.32, 0, 0, 0, 0.06)); }
    circC(ox, oz, 0.47, 0.52);
    // mouse hole
    const mh = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#0d0505' }));
    mh.rotation.y = Math.PI / 2; mh.position.set(-12.85, 0.02, 7.6); scene.add(mh);
    B.wood.add(GEO.torus(0.36, 0.04, 6, 16, Math.PI), '#5a3221', TRS(-12.84, 0.02, 7.6, 0, Math.PI / 2, 0));
    B.gloss.add(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 3, 1), '#f3cf62', TRS(-12.3, 0.05, 8.2, 0, 0.4, 0));
    W.mouseHole = new THREE.Vector3(-12.6, 0, 7.6);
  }

  /* ---------------- rocking horse ---------------- */
  {
    const rock = new THREE.Group(); // pivot at the rocker arc centre
    const R = 3.0;
    const hx = 10.0, hz = -3.6;
    rock.position.set(hx, R, hz);
    scene.add(rock);
    const hb = new Batch(MAT.gloss), hw = new Batch(MAT.wood), hgld = new Batch(MAT.gold);
    const off = TRS(0, -R, 0, 0, Math.PI, 0); // face -x
    hb.push(off); hw.push(off); hgld.push(off);
    const dap = (x, y, z) => { const n = Math.sin(x * 13.1) * Math.sin(y * 11.7 + z * 9.3) * Math.sin(z * 7.7 + x * 3.1); return new THREE.Color(n > 0.18 ? '#bdb5bb' : '#f6f2ee'); };
    for (const s of [-1, 1]) {
      const arc = []; for (let i = 0; i <= 20; i++) { const th = lerp(-0.42, 0.42, i / 20); arc.push([R * Math.sin(th), R - R * Math.cos(th) + 0.06, s * 0.32]); }
      hw.add(tubeGeo(arc, 0.06, 40, 8), '#6e2b1e');
      for (const e of [0, 20]) hgld.add(GEO.sph(8, 6), gold, TRS(arc[e][0], arc[e][1], arc[e][2], 0, 0, 0, 0.08));
    }
    for (const x of [-0.6, 0, 0.6]) hw.add(GEO.box(), '#7a3626', TRS(x, 0.1 + Math.abs(x) * 0.03, 0, 0, 0, 0, 0.12, 0.05, 0.72));
    for (const [x, ang] of [[0.52, -0.35], [-0.52, 0.35]]) for (const s of [-1, 1]) hb.add(GEO.capsule(0.07, 0.6, 3, 8), dap, TRS(x, 0.55, s * 0.17, 0, 0, ang, 1));
    hb.add(GEO.capsule(0.3, 0.75, 6, 14), dap, TRS(0, 1.05, 0, 0, 0, Math.PI / 2));
    hb.add(GEO.capsule(0.16, 0.42, 4, 12), dap, TRS(0.45, 1.42, 0, 0, 0, -0.62));
    hb.add(GEO.capsule(0.13, 0.3, 4, 12), dap, TRS(0.66, 1.7, 0, 0, 0, 1.1));
    hb.add(GEO.sph(14, 10), '#f6f2ee', TRS(0.86, 1.6, 0, 0, 0, 0, 0.12, 0.1, 0.11));
    for (const s of [-1, 1]) {
      hb.add(GEO.cone(8), '#f6f2ee', TRS(0.6, 1.94, s * 0.07, s * 0.2, 0, -0.2, 0.045, 0.13, 0.045));
      hb.add(GEO.sph(8, 6), '#1d1418', TRS(0.72, 1.78, s * 0.105, 0, 0, 0, 0.03));
      hb.add(GEO.sph(6, 4), '#ffffff', TRS(0.735, 1.79, s * 0.125, 0, 0, 0, 0.01));
      hb.add(GEO.sph(6, 4), '#3a2a30', TRS(0.96, 1.6, s * 0.05, 0, 0, 0, 0.018));
    }
    for (let i = 0; i < 9; i++) { const t = i / 8; hb.add(GEO.sph(8, 6), '#8a2140', TRS(lerp(0.66, 0.25, t), lerp(1.92, 1.35, t) + 0.08, 0, 0, 0, 0, 0.075, 0.09, 0.06)); }
    hb.add(tubeGeo([[-0.48, 1.18, 0], [-0.7, 1.05, 0], [-0.78, 0.78, 0.02], [-0.74, 0.55, 0.0]], 0.07, 16, 8), '#8a2140');
    hb.add(roundBox(0.62, 0.05, 0.7, 0.02, 2), '#a9c8ea', TRS(0.02, 1.32, 0));
    hb.add(roundBox(0.45, 0.12, 0.6, 0.05, 2), '#8a2140', TRS(0.02, 1.38, 0));
    for (const s of [-1, 1]) { hgld.add(GEO.torus(0.06, 0.012, 6, 14), gold, TRS(0.02, 0.95, s * 0.34)); hgld.add(GEO.cyl(4), gold, TRS(0.02, 1.15, s * 0.33, 0, 0, 0, 0.006, 0.36, 0.006)); }
    hgld.add(GEO.torus(0.105, 0.014, 6, 18), gold, TRS(0.84, 1.62, 0, 0, Math.PI / 2, 0.5));
    hgld.add(tubeGeo([[0.9, 1.62, 0.1], [0.6, 1.5, 0.2], [0.25, 1.44, 0.2]], 0.012, 12, 4), gold);
    hb.pop(); hw.pop(); hgld.pop();
    [hb, hw, hgld].forEach((b) => rock.add(b.build()));
    W.props.horse = { rock, base: new THREE.Vector3(hx, R, hz), R, amp: 0.025, t: 0, kick: 0 };
    boxC(hx - 1.25, hx + 1.25, hz - 0.42, hz + 0.42, 1.95, 0, false);
  }

  /* ---------------- side table with the music box ---------------- */
  {
    const tx = 11.6, tz = 1.6;
    B.wood.add(GEO.cyl(28), '#7a1f35', TRS(tx, 1.0, tz, 0, 0, 0, 0.62, 0.06, 0.62));
    B.gold.add(GEO.torus(0.62, 0.025, 6, 40), gold, TRS(tx, 1.0, tz, Math.PI / 2, 0, 0));
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5; B.gold.add(tubeGeo([[Math.sin(a) * 0.45, 0.97, Math.cos(a) * 0.45], [Math.sin(a) * 0.36, 0.6, Math.cos(a) * 0.36], [Math.sin(a) * 0.44, 0.25, Math.cos(a) * 0.44], [Math.sin(a) * 0.52, 0.0, Math.cos(a) * 0.52]].map((p) => [p[0] + tx, p[1], p[2] + tz]), 0.035, 16, 6), gold); }
    B.wood.add(GEO.cyl(24), '#7a1f35', TRS(tx, 0.4, tz, 0, 0, 0, 0.42, 0.04, 0.42));
    const mb = new THREE.Group(); mb.position.set(tx - 0.05, 1.03, tz + 0.05); scene.add(mb);
    const bx = new Batch(MAT.gloss), bg = new Batch(MAT.gold);
    bx.add(roundBox(0.66, 0.3, 0.44, 0.03, 2), '#a9c8ea', TRS(0, 0.15, 0));
    for (const y of [0.01, 0.29]) { bg.add(GEO.box(), gold, TRS(0, y, 0.222, 0, 0, 0, 0.66, 0.025, 0.012)); bg.add(GEO.box(), gold, TRS(0, y, -0.222, 0, 0, 0, 0.66, 0.025, 0.012)); }
    for (const s of [-1, 1]) bg.add(GEO.sph(10, 8), gold, TRS(s * 0.2, 0.15, 0.225, 0, 0, 0, 0.05, 0.05, 0.012));
    bg.add(GEO.sph(10, 8), '#f2b9c6', TRS(0, 0.15, 0.226, 0, 0, 0, 0.06, 0.06, 0.012));
    const lid = new THREE.Group(); lid.position.set(0, 0.3, -0.22); lid.rotation.x = -1.82; mb.add(lid);
    const lb = new Batch(MAT.gloss); lb.add(roundBox(0.66, 0.04, 0.44, 0.02, 2), '#a9c8ea', TRS(0, 0.0, 0.22));
    lid.add(lb.build());
    const mir = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.32), MAT.mirror); mir.rotation.set(Math.PI / 2, 0, 0); mir.position.set(0, -0.025, 0.22); lid.add(mir);
    bg.add(GEO.cyl(24), gold, TRS(0, 0.31, 0.05, 0, 0, 0, 0.12, 0.02, 0.12));
    const crank = new THREE.Group(); crank.position.set(0.34, 0.15, 0); mb.add(crank);
    const cb = new Batch(MAT.gold); cb.add(GEO.cyl(8), gold, TRS(0.04, 0, 0, 0, 0, Math.PI / 2, 0.012, 0.08, 0.012)); cb.add(GEO.torus(0.05, 0.012, 6, 14), gold, TRS(0.08, 0.05, 0, 0, Math.PI / 2, 0)); cb.add(GEO.torus(0.05, 0.012, 6, 14), gold, TRS(0.08, -0.05, 0, 0, Math.PI / 2, 0));
    crank.add(cb.build());
    mb.add(bx.build(), bg.build());
    const turn = new THREE.Group(); turn.position.set(0, 0.32, 0.05); mb.add(turn);
    W.props.musicBox = { group: mb, turn, crank, playing: 0, pos: new THREE.Vector3(tx, 1.4, tz) };
    circC(tx, tz, 0.66, 1.5, 0, false);
  }

  /* ---------------- bookcase, drum, jack-in-the-box, spinning top ---------------- */
  {
    const bx = 12.62, bz = 5.6, wal = '#5e2c1f';
    B.wood.add(GEO.box(), wal, TRS(bx, 1.35, bz - 1.08, 0, 0, 0, 0.55, 2.7, 0.08));
    B.wood.add(GEO.box(), wal, TRS(bx, 1.35, bz + 1.08, 0, 0, 0, 0.55, 2.7, 0.08));
    B.wood.add(GEO.box(), '#4a2218', TRS(bx + 0.24, 1.35, bz, 0, 0, 0, 0.05, 2.7, 2.2));
    for (const y of [0.06, 0.9, 1.75, 2.65]) B.wood.add(GEO.box(), wal, TRS(bx, y, bz, 0, 0, 0, 0.58, 0.08, 2.24));
    B.gold.add(GEO.box(), gold, TRS(bx - 0.28, 2.72, bz, 0, 0, 0, 0.04, 0.05, 2.3));
    const bookCols = ['#7d1d36', '#2b3767', '#2e5b45', '#c9a04f', '#a9c8ea', '#e9a7b6', '#5a2a4a'];
    for (const y of [0.1, 0.94, 1.79]) {
      let z = bz - 1.0;
      while (z < bz + 0.95) {
        const w = rnd(0.06, 0.12), h = rnd(0.48, 0.72), lean = z > bz + 0.6 ? -0.25 : 0;
        if (Math.random() < 0.1) { z += 0.15; continue; }
        B.wood.add(GEO.box(), pick(bookCols), TRS(bx - 0.02, y + h / 2, z + w / 2, lean, 0, 0, 0.38, h, w));
        B.gold.add(GEO.box(), gold, TRS(bx - 0.215, y + h * 0.75, z + w / 2, lean, 0, 0, 0.01, 0.03, w * 0.9));
        z += w + 0.01;
      }
    }
    // teddy and drum on top
    B.cloth.add(GEO.sph(14, 10), '#b9824e', TRS(bx - 0.05, 2.95, bz - 0.5, 0, 0, 0, 0.2, 0.22, 0.18));
    B.cloth.add(GEO.sph(14, 10), '#b9824e', TRS(bx - 0.05, 3.27, bz - 0.5, 0, 0, 0, 0.15));
    for (const s of [-1, 1]) B.cloth.add(GEO.sph(8, 6), '#b9824e', TRS(bx - 0.05, 3.4, bz - 0.5 + s * 0.11, 0, 0, 0, 0.06));
    B.satin.add(GEO.torus(0.06, 0.02, 6, 12), '#8a2140', TRS(bx - 0.16, 3.15, bz - 0.5, 0, Math.PI / 2, 0));
    boxC(12.3, 12.95, bz - 1.15, bz + 1.15, 2.7, 0, false);
    const dx = 10.9, dz = 7.6;
    B.gloss.add(GEO.cyl(24), '#b02f45', TRS(dx, 0.2, dz, 0, 0, 0, 0.32, 0.34, 0.32));
    for (const y of [0.04, 0.36]) { B.gloss.add(GEO.cyl(24), '#fbf6ee', TRS(dx, y, dz, 0, 0, 0, 0.335, 0.05, 0.335)); B.gold.add(GEO.torus(0.335, 0.02, 6, 30), gold, TRS(dx, y, dz, Math.PI / 2, 0, 0)); }
    const zz = []; for (let i = 0; i <= 16; i++) { const a = (i / 16) * TAU; zz.push([dx + Math.sin(a) * 0.325, i % 2 ? 0.06 : 0.34, dz + Math.cos(a) * 0.325]); }
    B.gold.add(tubeGeo(zz, 0.012, 64, 4, false), gold);
    for (const s of [-1, 1]) { B.wood.add(GEO.cyl(6), '#e9d9bb', TRS(dx + s * 0.08, 0.43, dz, 0, s * 0.5, Math.PI / 2 - 0.15, 0.015, 0.5, 0.015)); B.wood.add(GEO.sph(8, 6), '#8a2140', TRS(dx + s * 0.08 + Math.cos(s * 0.5) * 0.25 * s, 0.47, dz - Math.sin(s * 0.5) * 0.25 * s, 0, 0, 0, 0.035)); }
    circC(dx, dz, 0.34, 0.38);
    // jack-in-the-box
    const jx = 5.6, jz = 1.0;
    const jb = new THREE.Group(); jb.position.set(jx, 0, jz); jb.rotation.y = -0.4; scene.add(jb);
    const jbb = new Batch(MAT.gifts);
    jbb.add(roundBox(0.55, 0.55, 0.55, 0.04, 2), '#ffffff', TRS(0, 0.275, 0), atlasRect(2));
    jb.add(jbb.build());
    const jg = new Batch(MAT.gold);
    for (const y of [0.02, 0.53]) for (const [ox, oz, w, d] of [[0, 0.27, 0.56, 0.02], [0, -0.27, 0.56, 0.02], [0.27, 0, 0.02, 0.56], [-0.27, 0, 0.02, 0.56]]) jg.add(GEO.box(), gold, TRS(ox, y, oz, 0, 0, 0, w, 0.03, d));
    jg.add(GEO.cyl(8), gold, TRS(0.31, 0.3, 0, 0, 0, Math.PI / 2, 0.015, 0.08, 0.015));
    jg.add(GEO.box(), gold, TRS(0.35, 0.36, 0, 0, 0, 0, 0.02, 0.14, 0.03));
    jb.add(jg.build());
    const jlid = new THREE.Group(); jlid.position.set(0, 0.55, -0.275); jb.add(jlid);
    const jl = new Batch(MAT.gifts); jl.add(roundBox(0.57, 0.05, 0.57, 0.02, 2), '#ffffff', TRS(0, 0.0, 0.275), atlasRect(2)); jlid.add(jl.build());
    const jack = new THREE.Group(); jack.position.set(0, 0.3, 0); jb.add(jack);
    const spring = []; for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * TAU * 6; spring.push([Math.cos(a) * 0.07, t * 0.5, Math.sin(a) * 0.07]); }
    const jsp = new Batch(MAT.gold); jsp.add(tubeGeo(spring, 0.012, 120, 4), '#d8dce6'); const springMesh = jsp.build(); jack.add(springMesh);
    const jh = new THREE.Group(); jh.position.y = 0.55; jack.add(jh);
    const jhb = new Batch(MAT.porcelain);
    jhb.add(GEO.sph(16, 12), PAL.skin, TRS(0, 0.1, 0, 0, 0, 0, 0.13));
    for (const s of [-1, 1]) { jhb.add(GEO.sph(6, 4), '#1d1418', TRS(s * 0.045, 0.13, 0.115, 0, 0, 0, 0.016)); jhb.add(GEO.sph(6, 4), '#ef7f92', TRS(s * 0.075, 0.08, 0.1, 0, 0, 0, 0.022, 0.018, 0.01)); }
    jhb.add(GEO.sph(8, 6), '#d9334e', TRS(0, 0.1, 0.13, 0, 0, 0, 0.025));
    jhb.add(GEO.torus(0.03, 0.008, 4, 10, Math.PI), '#b02f45', TRS(0, 0.05, 0.12, 0, 0, Math.PI));
    jhb.add(GEO.cone(10), '#8a2140', TRS(-0.07, 0.3, 0, 0, 0, 0.7, 0.08, 0.22, 0.08));
    jhb.add(GEO.cone(10), '#d7ad5a', TRS(0.07, 0.3, 0, 0, 0, -0.7, 0.08, 0.22, 0.08));
    jhb.add(GEO.sph(8, 6), '#f2d17a', TRS(-0.2, 0.36, 0, 0, 0, 0, 0.03)); jhb.add(GEO.sph(8, 6), '#f2d17a', TRS(0.2, 0.36, 0, 0, 0, 0, 0.03));
    const ruff = new THREE.TorusGeometry(0.11, 0.035, 6, 20); ruff.rotateX(Math.PI / 2);
    deform(ruff, (v) => { const a = Math.atan2(v.x, v.z); v.y += 0.015 * Math.sin(a * 10); });
    jhb.add(ruff, '#ffffff', TRS(0, -0.02, 0));
    jh.add(jhb.build());
    jack.scale.set(1, 0.01, 1); jack.visible = false;
    W.props.jack = { group: jb, lid: jlid, jack, head: jh, open: 0, target: 0, t: 0, pos: new THREE.Vector3(jx, 0, jz) };
    boxC(jx - 0.3, jx + 0.3, jz - 0.3, jz + 0.3, 0.55);
    // spinning top
    const top = new THREE.Group(); scene.add(top);
    const tb = new Batch(MAT.gloss);
    const bands = ['#f2b9c6', '#fbf4e6', '#a9c8ea', '#d7ad5a', '#8a2140'];
    tb.add(lathe([[0, 0], [0.12, 0.12], [0.3, 0.26], [0.32, 0.32], [0.2, 0.42], [0.04, 0.46], [0.03, 0.6], [0, 0.62]], 28, 24), (x, y) => new THREE.Color(bands[Math.floor(y * 14) % bands.length]));
    top.add(tb.build({ cast: false }));
    W.props.top = { group: top, center: new THREE.Vector3(-4.4, 0, 1.2), t: 0, col: null };
  }

  /* ---------------- carpet ---------------- */
  {
    const cw = 15, cd = 9.4, cx = 0, cz = 2.3;
    B.cloth.add(roundBox(cw, 0.03, cd, 0.012, 1), '#5e1427', TRS(cx, 0.015, cz));
    const cm = new THREE.Mesh(new THREE.PlaneGeometry(cw, cd), MAT.carpet);
    cm.rotation.x = -Math.PI / 2; cm.position.set(cx, 0.032, cz); cm.receiveShadow = true; scene.add(cm);
    for (const s of [-1, 1]) for (let z = cz - cd / 2 + 0.1; z < cz + cd / 2; z += 0.14) B.cloth.add(GEO.box(), '#f6eedd', TRS(cx + s * (cw / 2 + 0.08), 0.012, z + rnd(-0.01, 0.01), 0, rnd(-0.2, 0.2), 0, 0.17, 0.012, 0.03));
  }

  /* ---------------- toy train circling the tree ---------------- */
  W.train = buildTrain(scene, B);

  /* ---------------- presents under the tree ---------------- */
  {
    const gifts = [[-2.75, -4.4, 0.62, 0.5, 0.55, 0.3, 0], [-3.4, -5.3, 0.5, 0.42, 0.5, -0.2, 2], [-3.0, -6.4, 0.7, 0.6, 0.6, 0.15, 5], [-2.55, -3.6, 0.38, 0.32, 0.38, 0.5, 7],
      [2.8, -4.3, 0.6, 0.55, 0.5, -0.25, 1], [3.45, -5.4, 0.5, 0.4, 0.55, 0.3, 3], [2.95, -6.5, 0.66, 0.5, 0.66, -0.1, 4], [2.5, -3.55, 0.4, 0.3, 0.4, -0.5, 9],
      [-1.1, -3.9, 0.45, 0.4, 0.45, 0.2, 11], [1.15, -3.95, 0.48, 0.36, 0.48, -0.3, 8], [-2.95, -4.45, 0.32, 0.3, 0.32, 0.8, 6]];
    const ribbonCols = ['#e3b85c', '#8a2140', '#fbf4e6', '#e3b85c'];
    gifts.forEach(([x, z, w, h, d, rot, cell], i) => {
      const y0 = i === 10 ? 0.5 : 0;
      B.gifts.add(roundBox(w, h, d, 0.03, 2), '#ffffff', TRS(x, y0 + h / 2, z, 0, rot, 0), atlasRect(cell));
      const rc = ribbonCols[i % 4];
      B.satin.add(GEO.box(), rc, TRS(x, y0 + h / 2, z, 0, rot, 0, w + 0.012, h + 0.012, 0.07));
      B.satin.add(GEO.box(), rc, TRS(x, y0 + h / 2, z, 0, rot, 0, 0.07, h + 0.012, d + 0.012));
      B.push(TRS(x, y0 + h + 0.03, z, 0, rot, 0));
      for (const s of [-1, 1]) B.satin.add(GEO.torus(0.07, 0.024, 6, 14), rc, TRS(s * 0.06, 0.02, 0, 0, 0, s * 0.5, 1, 0.75, 0.5));
      B.satin.add(GEO.sph(8, 6), rc, TRS(0, 0.0, 0, 0, 0, 0, 0.035));
      B.pop();
    });
    boxC(-3.95, -2.25, -6.95, -3.3, 0.7); boxC(2.2, 3.95, -6.95, -3.25, 0.7);
  }

  /* ---------------- Drosselmeyer's gift ---------------- */
  {
    const grp = new THREE.Group(); grp.position.set(0, 0, -1.7); scene.add(grp);
    const gb = new Batch(MAT.gifts), gs = new Batch(MAT.satin);
    gb.add(roundBox(0.92, 0.82, 0.92, 0.04, 2), '#ffffff', TRS(0, 0.41, 0), atlasRect(10));
    gs.add(GEO.box(), '#e3b85c', TRS(0, 0.41, 0, 0, 0, 0, 0.935, 0.83, 0.1));
    gs.add(GEO.box(), '#e3b85c', TRS(0, 0.41, 0, 0, 0, 0, 0.1, 0.83, 0.935));
    gs.add(GEO.box(), '#2a1636', TRS(0, 0.824, 0, 0, 0, 0, 0.8, 0.012, 0.8));
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; gs.add(GEO.cone(4), i % 2 ? '#f6c9d4' : '#fbeef2', TRS(Math.cos(a) * 0.36, 0.86, Math.sin(a) * 0.36, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5, 0.09, 0.16, 0.03)); }
    const tag = new THREE.Group(); tag.position.set(0.3, 0.55, 0.47); tag.rotation.set(0.15, 0, -0.3); grp.add(tag);
    const tgb = new Batch(MAT.wood); tgb.add(roundBox(0.2, 0.13, 0.01, 0.02, 1), '#fbf4e6'); tgb.add(GEO.box(), '#8a2140', TRS(0, 0, 0.006, 0, 0, 0, 0.12, 0.012, 0.004)); tag.add(tgb.build({ cast: false }));
    grp.add(gb.build(), gs.build());
    const lid = new THREE.Group(); lid.position.set(0, 0.82, 0); grp.add(lid);
    const lb = new Batch(MAT.gifts), ls = new Batch(MAT.satin);
    lb.add(roundBox(0.98, 0.18, 0.98, 0.04, 2), '#ffffff', TRS(0, 0.09, 0), atlasRect(10));
    ls.add(GEO.box(), '#e3b85c', TRS(0, 0.09, 0, 0, 0, 0, 0.995, 0.19, 0.1));
    ls.add(GEO.box(), '#e3b85c', TRS(0, 0.09, 0, 0, 0, 0, 0.1, 0.19, 0.995));
    for (const s of [-1, 1]) {
      ls.add(GEO.torus(0.17, 0.05, 8, 20), '#e3b85c', TRS(s * 0.16, 0.3, 0, 0.3, 0, s * 0.55, 1, 0.72, 0.55));
      ls.add(GEO.box(), '#e3b85c', TRS(s * 0.12, 0.12, 0.25, 0.9, s * 0.3, 0, 0.08, 0.3, 0.015));
    }
    ls.add(GEO.sph(10, 8), '#e3b85c', TRS(0, 0.28, 0, 0, 0, 0, 0.07));
    lid.add(lb.build(), ls.build());
    W.props.gift = { grp, lid, opened: false, col: circC(0, -1.7, 0.6, 0.98) };
  }

  /* ---------------- the Christmas tree ---------------- */
  W.tree = buildTree();
  W.tree.group.position.set(0, 0, -6.0);
  scene.add(W.tree.group);
  W.tree.col = circC(0, -6.0, 2.5, 9, 0, false);

  /* ---------------- theatre: proscenium, curtains ---------------- */
  W.theatre = buildTheatre(scene);

  /* ---------------- finalize ---------------- */
  for (const k in B) {
    if (B[k].empty) continue;
    const m = B[k].build({ cast: k !== 'glow', receive: true, name: k });
    m.matrixAutoUpdate = false; m.updateMatrix();
    scene.add(m);
  }
  W.glows = makeGlowPoints(glows);
  scene.add(W.glows);

  /* ---------------- lights ---------------- */
  const L = {};
  L.hemi = new THREE.HemisphereLight('#ffe9d8', '#6a3446', 1.15);
  L.key = new THREE.DirectionalLight('#ffe6c8', 2.1);
  L.key.position.set(-6, 16, 12); L.key.target.position.set(0, 0, -1.5);
  L.key.castShadow = true;
  const sm = DEVICE.mobile ? 1024 : 2048;
  L.key.shadow.mapSize.set(sm, sm);
  Object.assign(L.key.shadow.camera, { left: -18, right: 18, top: 15, bottom: -15, near: 2, far: 50 });
  L.key.shadow.bias = -0.0006; L.key.shadow.normalBias = 0.03; L.key.shadow.radius = 3;
  L.rim = new THREE.DirectionalLight('#b8c8ff', 0.55); L.rim.position.set(2, 10, -16);
  L.fire = new THREE.PointLight('#ff9448', 7, 11, 1.4); L.fire.position.set(10, 1.0, -7.7);
  L.tree = new THREE.PointLight('#ffcf8a', 6, 11, 1.4); L.tree.position.set(0, 2.6, -3.6);
  L.spot = new THREE.SpotLight('#fff4e6', 0, 22, 0.42, 0.55, 1.0); L.spot.position.set(0, 10, 4);
  scene.add(L.hemi, L.key, L.key.target, L.rim, L.fire, L.tree, L.spot, L.spot.target);
  W.lights = L;

  W.bounds = { x0: -12.55, x1: 12.55, z0: -8.7, z1: 9.7 };
  return W;
}

/* ---------------- the tree ---------------- */
function buildTree() {
  const group = new THREE.Group();
  const nb = new Batch(MAT.needles), gb = new Batch(MAT.gold), pb = new Batch(MAT.porcelain), glow = new Batch(MAT.glow), sb = new Batch(MAT.satin);
  const skirt = lathe([[0.0, 0.07], [1.5, 0.06], [1.95, 0.03], [2.05, 0.0]], 64, 0);
  deform(skirt, (v) => { const a = Math.atan2(v.x, v.z), r = Math.hypot(v.x, v.z), w = smoothstep(1.2, 2.05, r); const k = 1 + w * 0.05 * Math.sin(a * 16); v.x *= k; v.z *= k; v.y += w * 0.03 * Math.sin(a * 16 + 1); });
  sb.add(skirt, '#7a1b34');
  const sr = new THREE.TorusGeometry(2.04, 0.035, 6, 96); sr.rotateX(Math.PI / 2);
  deform(sr, (v) => { const a = Math.atan2(v.x, v.z); const k = 1 + 0.05 * Math.sin(a * 16); v.x *= k; v.z *= k; v.y += 0.03 * Math.sin(a * 16 + 1); });
  gb.add(sr, '#d9ad5a', TRS(0, 0.02, 0));
  nb.add(GEO.cyl(10), '#5a3221', TRS(0, 0.5, 0, 0, 0, 0, 0.22, 1.0, 0.22));
  const tiers = 7, info = [];
  const dark = new THREE.Color('#1c4334'), mid = new THREE.Color('#2f6a4e'), tip = new THREE.Color('#6fa577');
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const yb = 0.78 + i * 0.75, R = lerp(2.3, 0.5, Math.pow(t, 0.92)), h = lerp(1.5, 1.05, t);
    info.push({ yb, R, h });
    const prof = [[0.04, yb + h], [R * 0.3, yb + h * 0.66], [R * 0.66, yb + h * 0.3], [R * 0.92, yb + 0.06], [R, yb - 0.04], [R * 0.9, yb - 0.12], [R * 0.55, yb + 0.02], [0.15, yb + 0.28]];
    const geo = lathe(prof, 64, 22);
    const nbr = Math.round(10 + R * 5.5);
    deform(geo, (v) => {
      const a = Math.atan2(v.x, v.z), r = Math.hypot(v.x, v.z), w = smoothstep(R * 0.35, R, r);
      const bump = 0.12 * Math.sin(a * nbr + i * 1.3) + 0.06 * Math.sin(a * nbr * 2.13 + i);
      const k = 1 + bump * w; v.x *= k; v.z *= k;
      v.y -= w * w * 0.12 * (0.5 + 0.5 * Math.sin(a * nbr + i * 1.3));
    });
    nb.add(geo, (x, y, z) => {
      const r = Math.hypot(x, z), w = smoothstep(R * 0.3, R * 1.05, r), a = Math.atan2(x, z);
      const c = dark.clone().lerp(mid, w).lerp(tip, w * w * (0.55 + 0.45 * Math.sin(a * nbr + i * 1.3)));
      if (y < yb) c.multiplyScalar(0.62);
      return c;
    });
  }
  // garlands: gold beads and pearls
  const env = (y) => { for (const ti of info) if (y >= ti.yb - 0.05 && y <= ti.yb + ti.h) { const k = (y - ti.yb) / ti.h; return lerp(ti.R * 0.92, 0.1, Math.pow(k, 0.8)); } return 0.2; };
  for (const [off, col, rad] of [[0, '#e7c26a', 0.03], [Math.PI, '#fff6ea', 0.026]]) {
    const pts = [];
    for (let i = 0; i <= 140; i++) {
      const s = i / 140, y = 0.95 + s * 4.9, a = s * TAU * 3.2 + off;
      const r = Math.max(0.25, env(y) * 0.98 + 0.06);
      pts.push(new THREE.Vector3(Math.sin(a) * r, y - 0.05, Math.cos(a) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tg = new THREE.TubeGeometry(curve, 420, rad, 6);
    const P = tg.attributes.position, tmp = new THREE.Vector3();
    for (let i = 0; i <= 420; i++) {
      const c = curve.getPointAt(i / 420), k = 0.55 + 0.45 * Math.abs(Math.sin(i * 0.9));
      for (let j = 0; j <= 6; j++) { const idx = i * 7 + j; tmp.fromBufferAttribute(P, idx).sub(c).multiplyScalar(k).add(c); P.setXYZ(idx, tmp.x, tmp.y, tmp.z); }
    }
    tg.computeVertexNormals();
    gb.add(tg, col);
  }
  // candles on branch tips
  const tipPos = (ti, a, f = 0.95) => { const I = info[ti]; return new THREE.Vector3(Math.sin(a) * I.R * f, I.yb + 0.02, Math.cos(a) * I.R * f); };
  const lightList = [];
  for (let i = 0; i < 16; i++) {
    const ti = i % 6, a = (i * 2.399 + ti) % TAU - Math.PI; if (Math.abs(a) > 2.3) continue;
    const p = tipPos(ti, a, 0.86);
    pb.add(GEO.cyl(8), '#fbf5ea', TRS(p.x, p.y + 0.12, p.z, 0, 0, 0, 0.032, 0.2, 0.032));
    glow.add(GEO.sph(6, 4), '#ffd27a', TRS(p.x, p.y + 0.27, p.z, 0, 0, 0, 0.022, 0.05, 0.022));
    lightList.push({ p: [p.x, p.y + 0.28, p.z], c: '#ffcf7a', s: 0.7, tw: 0.35 });
  }
  // fairy lights
  for (let i = 0; i < 120; i++) {
    const ti = Math.floor(rnd(0, tiers)), I = info[ti], a = rnd(-2.6, 2.6), f = rnd(0.55, 1.0);
    const r = I.R * f * (1 + 0.1 * Math.sin(a * (10 + I.R * 5.5)));
    const y = I.yb + (1 - f) * I.h * 0.55 + 0.03;
    lightList.push({ p: [Math.sin(a) * r, y, Math.cos(a) * r], c: pick(['#fff0c4', '#ffd27a', '#ffd27a', '#ffb7c8', '#bfe0ff']), s: rnd(0.28, 0.45), tw: 0.7 });
  }
  const lights = makeGlowPoints(lightList, { boost: 1 });
  // baubles (instanced, glossy)
  const orn = [];
  const ornCols = ['#e3b85c', '#a3203c', '#f4b6c6', '#a9c8ea', '#fff3e2', '#d8dce6', '#e3b85c', '#a3203c'];
  info.forEach((I, ti) => {
    const n = Math.round(4 + I.R * 4.2);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + ti * 0.7 + rnd(-0.15, 0.15) - Math.PI; if (Math.abs(a) > 2.4) continue;
      const p = tipPos(ti, a, 0.9); p.y -= 0.12;
      orn.push({ p, s: rnd(0.085, 0.14), c: ornCols[(k + ti * 3) % ornCols.length] });
    }
  });
  const im = new THREE.InstancedMesh(GEO.sph(16, 12), MAT.ornament, orn.length);
  const dmy = new THREE.Object3D(), cc = new THREE.Color();
  orn.forEach((o, i) => { dmy.position.copy(o.p); dmy.scale.setScalar(o.s); dmy.updateMatrix(); im.setMatrixAt(i, dmy.matrix); im.setColorAt(i, cc.set(o.c)); });
  im.castShadow = true; im.receiveShadow = true;
  // little gold stars and satin bows hanging
  info.forEach((I, ti) => { for (let k = 0; k < 3; k++) { const a = (k - 1) * 0.9 + ti * 0.37; const p = tipPos(ti, a, 0.8); if (ti % 2) gb.add(starGeo(0.09, 0.04, 0.03, 0.015), '#f0c868', TRS(p.x, p.y - 0.16, p.z, 0, a, 0)); else { for (const s of [-1, 1]) sb.add(GEO.torus(0.05, 0.018, 6, 12), '#8a2140', TRS(p.x + s * 0.05 * Math.cos(a), p.y - 0.06, p.z - s * 0.05 * Math.sin(a), 0, a, s * 0.5, 1, 0.7, 0.5)); } } });
  [nb, gb, pb, sb].forEach((b) => group.add(b.build()));
  group.add(glow.build({ cast: false }), im, lights);
  // topper star
  const topMat = new THREE.MeshStandardMaterial({ color: '#b89a5e', emissive: '#ffb347', emissiveIntensity: 0.0, roughness: 0.35, metalness: 0.7 });
  const topper = new THREE.Mesh(starGeo(0.46, 0.2, 0.14, 0.06), topMat);
  const topY = info[tiers - 1].yb + info[tiers - 1].h + 0.42;
  topper.position.set(0, topY, 0); topper.castShadow = true;
  group.add(topper);
  const rays = new THREE.Mesh(GEO.plane(), new THREE.MeshBasicMaterial({ map: TEX.starburst, color: '#ffd98a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  rays.position.copy(topper.position); rays.scale.setScalar(4.2); rays.renderOrder = 22;
  group.add(rays);
  const halo = makeGlowPoints([{ p: [0, topY, 0.1], c: '#ffd98a', s: 3.2, tw: 0.1 }], { boost: 0 });
  group.add(halo);
  return { group, topper, topMat, rays, halo, lights, info, topY, lit: 0 };
}

/* ---------------- toy train ---------------- */
function buildTrain(scene, B) {
  const T = { cx: 0, cz: -5.8, rx: 4.25, rz: 2.75, th: 0, speed: 0.95, cars: [], stop: 0, whistle: 0 };
  const P = (th) => new THREE.Vector3(T.cx + T.rx * Math.sin(th), 0, T.cz + T.rz * Math.cos(th));
  const dl = (th) => Math.hypot(T.rx * Math.cos(th), T.rz * Math.sin(th));
  T.P = P; T.dl = dl;
  for (const off of [-0.14, 0.14]) {
    const pts = []; for (let i = 0; i < 96; i++) { const th = (i / 96) * TAU; pts.push(new THREE.Vector3(Math.sin(th) * (T.rx + off), 0.07, T.cz + Math.cos(th) * (T.rz + off))); }
    B.gold.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 192, 0.022, 5, true), '#cfd3dc');
  }
  let th = 0;
  while (th < TAU) { const p = P(th), d = new THREE.Vector3(T.rx * Math.cos(th), 0, -T.rz * Math.sin(th)); B.wood.add(GEO.box(), '#6e3a26', TRS(p.x, 0.03, p.z, 0, Math.atan2(d.x, d.z), 0, 0.44, 0.04, 0.09)); th += 0.3 / dl(th); }
  const mkCar = (kind) => {
    const g = new THREE.Group(); scene.add(g);
    const c = new Batch(MAT.gloss), gl = new Batch(MAT.gold), gw = new Batch(MAT.glow);
    c.add(GEO.box(), '#2a1e22', TRS(0, 0.14, 0, 0, 0, 0, 0.36, 0.08, kind === 'loco' ? 0.92 : 0.7));
    const wz = kind === 'loco' ? [0.28, 0.0, -0.28] : [0.2, -0.2];
    for (const z of wz) for (const s of [-1, 1]) { c.add(GEO.cyl(14), '#b02f45', TRS(s * 0.2, 0.1, z, 0, 0, Math.PI / 2, 0.09, 0.05, 0.09)); gl.add(GEO.cyl(8), '#e3b85c', TRS(s * 0.23, 0.1, z, 0, 0, Math.PI / 2, 0.035, 0.03, 0.035)); }
    if (kind === 'loco') {
      c.add(GEO.cyl(18), '#2e5b45', TRS(0, 0.34, 0.12, Math.PI / 2, 0, 0, 0.16, 0.56, 0.16));
      for (const z of [-0.08, 0.12, 0.32]) gl.add(GEO.torus(0.162, 0.014, 6, 20), '#e3b85c', TRS(0, 0.34, z));
      c.add(lathe([[0.05, 0], [0.055, 0.12], [0.1, 0.2], [0.1, 0.23], [0.0, 0.23]], 14, 0), '#1d1418', TRS(0, 0.46, 0.3));
      gl.add(GEO.hemi(12, 6), '#e3b85c', TRS(0, 0.49, 0.06, 0, 0, 0, 0.07));
      c.add(roundBox(0.4, 0.38, 0.3, 0.03, 2), '#b02f45', TRS(0, 0.4, -0.24));
      c.add(roundBox(0.48, 0.05, 0.4, 0.02, 2), '#1d1418', TRS(0, 0.62, -0.24));
      for (const s of [-1, 1]) c.add(GEO.box(), '#3a2a30', TRS(s * 0.201, 0.45, -0.24, 0, 0, 0, 0.01, 0.12, 0.14));
      gl.add(new THREE.ConeGeometry(0.2, 0.18, 4), '#e3b85c', TRS(0, 0.17, 0.5, Math.PI / 2, Math.PI / 4, 0, 1, 1, 0.6));
      gl.add(GEO.cyl(12), '#e3b85c', TRS(0, 0.42, 0.42, Math.PI / 2, 0, 0, 0.05, 0.06, 0.05));
      gw.add(GEO.circle(12), '#fff1c4', TRS(0, 0.42, 0.455, 0, 0, 0, 0.04));
    } else if (kind === 'cargo') {
      for (const [x, z, w, d] of [[0.17, 0, 0.03, 0.66], [-0.17, 0, 0.03, 0.66], [0, 0.32, 0.36, 0.03], [0, -0.32, 0.36, 0.03]]) c.add(GEO.box(), '#a9c8ea', TRS(x, 0.28, z, 0, 0, 0, w, 0.2, d));
      for (const [x, z, w, d] of [[0.17, 0, 0.035, 0.68], [-0.17, 0, 0.035, 0.68], [0, 0.33, 0.37, 0.035], [0, -0.33, 0.37, 0.035]]) gl.add(GEO.box(), '#e3b85c', TRS(x, 0.39, z, 0, 0, 0, w, 0.025, d));
      for (let i = 0; i < 7; i++) c.add(GEO.sph(8, 6), pick(['#f2b9c6', '#fbf4e6', '#c0283e', '#c9e4d4']), TRS(rnd(-0.1, 0.1), 0.3, rnd(-0.22, 0.22), 0, 0, 0, 0.06));
    } else {
      c.add(roundBox(0.38, 0.32, 0.6, 0.03, 2), '#8a2140', TRS(0, 0.36, 0));
      c.add(roundBox(0.44, 0.04, 0.66, 0.02, 2), '#1d1418', TRS(0, 0.54, 0));
      c.add(roundBox(0.22, 0.12, 0.24, 0.02, 2), '#8a2140', TRS(0, 0.6, 0));
      for (const z of [-0.15, 0.1]) for (const s of [-1, 1]) gw.add(GEO.box(), '#ffd98a', TRS(s * 0.192, 0.4, z, 0, 0, 0, 0.005, 0.1, 0.1));
    }
    g.add(c.build({ cast: false }), gl.build({ cast: false }));
    if (!gw.empty) g.add(gw.build({ cast: false }));
    const blob = makeBlob(0.42); blob.scale.set(0.6, 1.1, 1); g.add(blob);
    const col = { t: 'c', x: 0, z: 0, r: 0.4, top: 3, bottom: 0, walk: false, on: true };
    return { g, kind, col, th: 0 };
  };
  T.cars = [mkCar('loco'), mkCar('cargo'), mkCar('caboose')];
  T.place = () => {
    let th = T.th;
    T.cars.forEach((car, i) => {
      if (i > 0) th -= (i === 1 ? 0.88 : 0.78) / dl(th);
      car.th = th;
      const p = P(th), d = new THREE.Vector3(T.rx * Math.cos(th), 0, -T.rz * Math.sin(th));
      car.g.position.copy(p); car.g.rotation.y = Math.atan2(d.x, d.z);
      car.col.x = p.x; car.col.z = p.z;
    });
  };
  T.place();
  return T;
}

/* ---------------- theatre: proscenium arch and curtains ---------------- */
function buildTheatre(scene) {
  // the proscenium never casts into the room (it would stripe the floor with shadows)
  const TB = { gold: new Batch(MAT.gold), cloth: new Batch(MAT.cloth) };
  const gold = '#d9ad5a';
  const pro = new THREE.Shape();
  pro.moveTo(-17.5, -1.6); pro.lineTo(17.5, -1.6); pro.lineTo(17.5, 16); pro.lineTo(-17.5, 16); pro.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-14.8, -1.6); hole.lineTo(14.8, -1.6); hole.lineTo(14.8, 11.2); hole.quadraticCurveTo(14.8, 12.6, 12.6, 12.6); hole.lineTo(-12.6, 12.6); hole.quadraticCurveTo(-14.8, 12.6, -14.8, 11.2); hole.closePath();
  pro.holes.push(hole);
  TB.gold.add(new THREE.ExtrudeGeometry(pro, { depth: 0.8, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2, curveSegments: 12 }), '#c89a4a', TRS(0, 0, 11.3));
  TB.gold.add(GEO.torus(2.2, 0.16, 8, 40, Math.PI), gold, TRS(0, 13.2, 12.25));
  TB.gold.add(starGeo(0.9, 0.38, 0.3, 0.12), '#f0cf7a', TRS(0, 14.4, 12.3));
  for (const s of [-1, 1]) {
    for (let i = 0; i < 7; i++) TB.gold.add(GEO.sph(10, 8), gold, TRS(s * 16.15, 0.6 + i * 2.2, 12.28, 0, 0, 0, 0.32, 0.32, 0.14));
    TB.gold.add(GEO.cyl(16), gold, TRS(s * 15.35, 6.0, 12.15, 0, 0, 0, 0.22, 15, 0.22));
  }
  for (let i = 0; i < 14; i++) TB.gold.add(GEO.sph(10, 8), gold, TRS(-12.2 + i * 1.88, 15.0, 12.28, 0, 0, 0, 0.3, 0.3, 0.14));
  const velvet = '#7a1b34';
  const velvetFn = (x, y) => new THREE.Color(velvet).lerp(new THREE.Color('#4c0f20'), smoothstep(-2, -11, y) * 0.55);
  // border valance & side legs (fixed)
  TB.cloth.add(drapeGeo(30, 2.4, 16, 0.22, { segX: 160, segY: 6 }), velvetFn, TRS(0, 12.7, 11.15));
  const fringe = []; for (let x = -14.9; x <= 14.9; x += 0.18) fringe.push(x);
  fringe.forEach((x) => TB.gold.add(GEO.cyl(4), gold, TRS(x, 10.12, 11.35 + Math.sin(x * 3.35) * 0.18, 0, 0, 0, 0.022, 0.32, 0.022)));
  TB.gold.add(GEO.cyl(8), gold, TRS(0, 10.34, 11.35, 0, 0, Math.PI / 2, 0.06, 30, 0.06));
  for (const s of [-1, 1]) TB.cloth.add(drapeGeo(2.2, 12.6, 3, 0.3, { segX: 24, segY: 20 }), velvetFn, TRS(s * 14.1, 12.6, 11.0));
  // main traveller curtain (animated)
  const halves = [];
  for (const s of [-1, 1]) {
    const geo = drapeGeo(15.4, 12.4, 11, 0.24, { segX: 132, segY: 24 });
    const colors = [];
    const P = geo.attributes.position, c = new THREE.Color();
    for (let i = 0; i < P.count; i++) { c.copy(velvetFn(P.getX(i), P.getY(i))); colors.push(c.r, c.g, c.b); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const base = Float32Array.from(P.array);
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, map: TEX.brush, side: THREE.DoubleSide }));
    mesh.position.set(s * 7.7, 12.4, 10.95);
    mesh.receiveShadow = true;
    scene.add(mesh);
    halves.push({ mesh, base, s });
  }
  // gold fringe along the bottom of each half (moves with it)
  const th = { halves, open: 0 };
  th.set = (open) => {
    th.open = open;
    for (const h of halves) {
      const P = h.mesh.geometry.attributes.position, b = h.base;
      const outer = h.s * 7.7; // local x of the outer edge
      for (let i = 0; i < P.count; i++) {
        const x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2];
        const t = -y / 12.4;
        const k = 1 - open * (0.9 - 0.06 * t);
        const nx = outer + (x - outer) * k;
        const lift = open * open * (Math.abs(x - outer) / 15.4) * t * 1.6;
        P.setXYZ(i, nx, y + lift, z * (1 + open * 1.4));
      }
      P.needsUpdate = true;
      h.mesh.geometry.computeVertexNormals();
      h.mesh.visible = open < 0.999;
    }
  };
  th.set(0);
  for (const k in TB) { const m = TB[k].build({ cast: false, receive: false }); m.matrixAutoUpdate = false; m.updateMatrix(); scene.add(m); }
  return th;
}
