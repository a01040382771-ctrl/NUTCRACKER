/* =====================================================================
   05 · CHARACTERS — porcelain dolls, the Nutcracker, the Mouse King, toys
   All built from lathes, tubes and rounded solids, baked per joint.
   ===================================================================== */

/* ---------------- shared doll rig (Clara · Sugar Plum Fairy · Prince) ---------------- */
/* opts.lod: a lighter build for crowds (the corps de ballet); without it every count below is exactly the original */
function buildDoll(kind, opts = {}) {
  const D = opts.lod ? 0.5 : 1, q = (n, m = 3) => (D === 1 ? n : Math.max(m, Math.round(n * D)));
  const C = {
    clara: { dress: '#f2bccb', dress2: '#f8d8df', trim: '#fdf6ea', sash: '#8a2140', hair: '#6c3a21', hair2: '#8f5634', legs: '#fbf6f1', shoe: '#efb0c0', hip: 0.5, legLen: 0.31, face: TEX.faceClara },
    fairy: { dress: '#f3b3c7', dress2: '#fde0e8', trim: '#fff8fb', sash: '#e2bb69', hair: '#d9a75c', hair2: '#f1cf8c', legs: '#f6d8de', shoe: '#f1b6c6', hip: 0.6, legLen: 0.41, face: TEX.faceFairy },
    prince: { dress: '#f7efe1', dress2: '#e7d7bb', trim: '#d9b05c', sash: '#a9c8ea', hair: '#9a6235', hair2: '#c08a52', legs: '#f7f1e8', shoe: '#7d1d36', hip: 0.6, legLen: 0.4, face: TEX.facePrince },
    snowfairy: { dress: '#bcd8f4', dress2: '#e8f2fd', trim: '#ffffff', sash: '#8db5e6', hair: '#cdd9ee', hair2: '#f1f6fd', legs: '#e8f0fa', shoe: '#b6cde9', hip: 0.6, legLen: 0.41, face: TEX.faceFairy, bodice: '#9cc0ea', accent: '#a9cdf2', gem: '#ffffff', metal: '#dbe6f5', metal2: '#f1f7ff', crown: '#8fd2ff' },
    /* the snowflakes of the corps de ballet: white tutus with silver and ice-blue, a softer cousin of the snow fairy */
    snowflake: { dress: '#ffffff', dress2: '#eef5ff', trim: '#ffffff', sash: '#c3d8f2', hair: '#e2dccf', hair2: '#f6f2ea', legs: '#f2f5fb', shoe: '#d9e5f5', hip: 0.6, legLen: 0.41, face: TEX.faceFairy, bodice: '#e4eefa', accent: '#b9d4f1', gem: '#ffffff', metal: '#e3ebf6', metal2: '#ffffff', crown: '#cfe8ff' },
    /* the three dancers of the Kingdom of Sweets (chapter IV): the fairy rig without wings or wand, each with her own costume and props */
    choco: { dancer: 'choco', dress: '#9a2236', dress2: '#c9374e', trim: '#2a1216', sash: '#e2b85e', hair: '#3a2118', hair2: '#5b3726', legs: '#f2d8d2', shoe: '#2a1418', hip: 0.6, legLen: 0.41, face: TEX.faceFairy, bodice: '#5e1626', accent: '#e8475e', gem: '#f3cf7a', metal: '#e2b85e', metal2: '#f6dd96' },
    coffee: { dancer: 'coffee', dress: '#5b2f72', dress2: '#2f8790', trim: '#f2d48a', sash: '#e9c46e', hair: '#221726', hair2: '#3d2c44', legs: '#ecd6dc', shoe: '#e9c46e', hip: 0.6, legLen: 0.41, face: TEX.faceFairy, bodice: '#3e2054', accent: '#53b9b4', gem: '#f2d48a', metal: '#e9c46e', metal2: '#fff0c2' },
    tea: { dancer: 'tea', dress: '#3a957a', dress2: '#f6edd8', trim: '#d13a4c', sash: '#e0b25c', hair: '#1f1a20', hair2: '#3a3138', legs: '#f4e2e2', shoe: '#d13a4c', hip: 0.6, legLen: 0.41, face: TEX.faceFairy, bodice: '#2f7d68', accent: '#e8566e', gem: '#ffe08a', metal: '#e0b25c', metal2: '#ffe9a8' },
  }[kind];
  const isClara = kind === 'clara', isFairy = kind === 'fairy' || kind === 'snowfairy' || kind === 'snowflake' || !!C.dancer, isPrince = kind === 'prince';
  const root = new THREE.Group();
  const body = new THREE.Group(); body.position.y = C.hip; root.add(body);
  const skin = PAL.skin;
  const shade = (base, amt) => { const c = new THREE.Color(base); return (x, y, z) => { const a = Math.atan2(x, z); const k = 1 - amt + amt * (0.5 + 0.5 * Math.sin(a * 14)); return c.clone().multiplyScalar(k); }; };

  /* --- skirt / tutu / tunic hem (separate so it can flare) --- */
  const sk = new Batch(MAT.satin);
  if (isClara) {
    const g = lathe([[0.0, 0.27], [0.118, 0.27], [0.13, 0.23], [0.17, 0.13], [0.24, 0.02], [0.32, -0.09], [0.37, -0.165], [0.385, -0.19]], 40, 24);
    deform(g, (v) => { const a = Math.atan2(v.x, v.z), w = smoothstep(0.22, -0.18, v.y); const k = 1 + 0.04 * w * Math.sin(a * 14); v.x *= k; v.z *= k; });
    sk.add(g, shade(C.dress, 0.12));
    const pet = lathe([[0.3, -0.08], [0.36, -0.2], [0.355, -0.225], [0.2, -0.2], [0.0, -0.18]], 40, 12);
    deform(pet, (v) => { const a = Math.atan2(v.x, v.z); if (v.y < -0.19) v.y += 0.012 * Math.sin(a * 30); });
    sk.add(pet, C.trim);
    const hem = new THREE.TorusGeometry(0.382, 0.02, 6, 64);
    hem.rotateX(Math.PI / 2);
    deform(hem, (v) => { const a = Math.atan2(v.x, v.z); v.y += 0.012 * Math.sin(a * 28); });
    sk.add(hem, C.trim, TRS(0, -0.19, 0));
    // embroidered gold dots near the hem
    for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; sk.add(GEO.sph(6, 4), '#e8c070', TRS(Math.sin(a) * 0.335, -0.115, Math.cos(a) * 0.335, 0, 0, 0, 0.014)); }
  } else if (C.dancer === 'coffee') {
    // a long, flowing skirt in two silks: plum over teal, with a gold hem
    const g = lathe([[0.0, 0.2], [0.13, 0.2], [0.16, 0.1], [0.24, -0.08], [0.32, -0.28], [0.38, -0.44], [0.395, -0.47]], 40, 22);
    deform(g, (v) => { const a = Math.atan2(v.x, v.z), w = smoothstep(0.1, -0.4, v.y); const k = 1 + 0.07 * w * Math.sin(a * 9); v.x *= k; v.z *= k; });
    sk.add(g, (x, y, z) => new THREE.Color(C.dress).lerp(new THREE.Color(C.dress2), 0.5 + 0.5 * Math.sin(Math.atan2(x, z) * 9)).lerp(new THREE.Color(C.dress), smoothstep(-0.1, 0.18, y)));
    const hem = new THREE.TorusGeometry(0.39, 0.016, 6, 60); hem.rotateX(Math.PI / 2);
    deform(hem, (v) => { const a = Math.atan2(v.x, v.z); const k = 1 + 0.07 * Math.sin(a * 9); v.x *= k; v.z *= k; });
    sk.add(hem, C.trim, TRS(0, -0.465, 0));
    const belt = new THREE.TorusGeometry(0.15, 0.022, 6, 32); belt.rotateX(Math.PI / 2);
    sk.add(belt, C.trim, TRS(0, 0.18, 0));
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; sk.add(GEO.sph(6, 4), C.metal2, TRS(Math.sin(a) * 0.165, 0.135, Math.cos(a) * 0.165, 0, 0, 0, 0.018)); }
  } else if (isFairy) {
    for (let L = 0; L < 3; L++) {
      const R = 0.52 - L * 0.06, y0 = 0.07 + L * 0.035;
      const g = lathe([[0.1, y0 + 0.05], [0.16, y0 + 0.035], [R * 0.7, y0 + 0.02], [R, y0 - 0.005], [R * 0.98, y0 - 0.03], [R * 0.7, y0 - 0.035], [0.1, y0 - 0.02]], q(48), q(18, 6));
      deform(g, (v) => { const a = Math.atan2(v.x, v.z), r = Math.hypot(v.x, v.z), w = smoothstep(0.15, R, r); v.y += w * 0.022 * Math.sin(a * 22 + L * 2); const k = 1 + w * 0.03 * Math.sin(a * 31 + L); v.x *= k; v.z *= k; });
      sk.add(g, (x, y, z) => { const r = Math.hypot(x, z); return new THREE.Color(L === 2 ? C.dress : C.dress2).lerp(new THREE.Color(C.trim), smoothstep(0.3, 0.55, r) * 0.6); });
    }
    const nGem = opts.lod ? 8 : 26;
    for (let i = 0; i < nGem; i++) { const a = (i / nGem) * TAU, r = rnd(0.22, 0.44); sk.add(GEO.sph(6, 4), i % 3 ? (C.gem || '#f6d68a') : '#ffffff', TRS(Math.sin(a) * r, 0.17, Math.cos(a) * r, 0, 0, 0, 0.012)); }
  } else {
    const g = lathe([[0.0, 0.08], [0.165, 0.08], [0.18, 0.0], [0.205, -0.1], [0.215, -0.135], [0.0, -0.12]], 36, 12);
    deform(g, (v) => { const a = Math.atan2(v.x, v.z); if (v.y < 0.02) { const k = 1 + 0.03 * Math.sin(a * 10); v.x *= k; v.z *= k; } });
    sk.add(g, shade(C.dress, 0.08));
    const band = new THREE.TorusGeometry(0.21, 0.014, 6, 40); band.rotateX(Math.PI / 2);
    sk.add(band, C.trim, TRS(0, -0.128, 0));
  }
  const skirt = sk.build();
  body.add(skirt);

  /* --- bodice / torso --- */
  const bd = new Batch(MAT.satin);
  if (isClara) {
    bd.add(lathe([[0.0, 0.25], [0.12, 0.25], [0.135, 0.32], [0.152, 0.4], [0.142, 0.46], [0.11, 0.5], [0.06, 0.53], [0.0, 0.535]], 28, 16), shade(C.dress, 0.05));
    const sash = new THREE.TorusGeometry(0.124, 0.03, 8, 32); sash.rotateX(Math.PI / 2);
    bd.add(sash, C.sash, TRS(0, 0.262, 0, 0, 0, 0, 1, 0.75, 1));
    for (const s of [-1, 1]) bd.add(GEO.torus(0.06, 0.022, 8, 18), C.sash, TRS(s * 0.06, 0.275, -0.135, 0.15, 0, s * 0.45, 1, 0.68, 0.5));
    bd.add(GEO.sph(10, 8), C.sash, TRS(0, 0.27, -0.13, 0, 0, 0, 0.032));
    for (const s of [-1, 1]) bd.add(GEO.box(), C.sash, TRS(s * 0.04, 0.17, -0.14, 0.15, 0, s * 0.25, 0.04, 0.18, 0.012));
    const collar = new THREE.TorusGeometry(0.078, 0.026, 8, 30); collar.rotateX(Math.PI / 2);
    deform(collar, (v) => { const a = Math.atan2(v.x, v.z); v.y += 0.008 * Math.sin(a * 16); });
    bd.add(collar, C.trim, TRS(0, 0.515, 0));
    for (let i = 0; i < 3; i++) bd.add(GEO.sph(8, 6), '#e3b565', TRS(0, 0.31 + i * 0.055, 0.145 - i * 0.002, 0, 0, 0, 0.013));
  } else if (isFairy) {
    bd.add(lathe([[0.0, 0.2], [0.11, 0.2], [0.118, 0.28], [0.135, 0.36], [0.14, 0.42], [0.125, 0.455], [0.0, 0.46]], q(28), q(14, 6)), shade(C.bodice || '#e58ba6', 0.06));
    const tr = new THREE.TorusGeometry(0.128, 0.012, 6, 30); tr.rotateX(Math.PI / 2);
    bd.add(tr, C.sash, TRS(0, 0.452, 0, 0, 0, 0, 1, 1, 1.04));
    for (let i = 0; i < 4; i++) bd.add(GEO.sph(8, 6), i % 2 ? '#ffffff' : (C.gem || '#f5cf7c'), TRS(0, 0.25 + i * 0.05, 0.12 + i * 0.006, 0, 0, 0, 0.014));
    bd.add(GEO.cyl(14), skin, TRS(0, 0.49, 0, 0, 0, 0, 0.046, 0.08, 0.046));
    bd.add(GEO.sph(14, 10), skin, TRS(0, 0.452, 0, 0, 0, 0, 0.13, 0.04, 0.1));
    const neck = new THREE.TorusGeometry(0.05, 0.007, 6, 24); neck.rotateX(Math.PI / 2.2);
    bd.add(neck, C.metal || '#e8c070', TRS(0, 0.5, 0.012));
    bd.add(GEO.sph(8, 6), C.accent || '#f19bb3', TRS(0, 0.475, 0.055, 0, 0, 0, 0.014));
  } else {
    bd.add(lathe([[0.0, 0.08], [0.165, 0.08], [0.17, 0.2], [0.19, 0.34], [0.2, 0.43], [0.16, 0.49], [0.07, 0.53], [0.0, 0.535]], 28, 16), shade(C.dress, 0.04));
    const belt = new THREE.TorusGeometry(0.168, 0.02, 6, 32); belt.rotateX(Math.PI / 2);
    bd.add(belt, C.trim, TRS(0, 0.1, 0));
    const sash = new THREE.TorusGeometry(0.2, 0.026, 6, 32); sash.rotateX(Math.PI / 2);
    bd.add(sash, C.sash, TRS(0, 0.3, 0.0, 0, 0, 0.55, 0.95, 1, 0.97));
    for (let i = 0; i < 4; i++) { bd.add(GEO.box(), C.trim, TRS(0, 0.22 + i * 0.055, 0.178 + i * 0.006, 0, 0, 0, 0.12 - i * 0.012, 0.012, 0.012)); bd.add(GEO.sph(6, 4), C.trim, TRS(0, 0.22 + i * 0.055, 0.186 + i * 0.006, 0, 0, 0, 0.014)); }
    for (const s of [-1, 1]) { bd.add(GEO.cyl(16), C.trim, TRS(s * 0.17, 0.48, 0, 0, 0, s * 0.35, 0.075, 0.03, 0.075)); }
    bd.add(GEO.cyl(16), C.dress, TRS(0, 0.545, 0, 0, 0, 0, 0.07, 0.05, 0.07));
    bd.add(GEO.torus(0.07, 0.012, 6, 20), C.trim, TRS(0, 0.57, 0, Math.PI / 2, 0, 0));
  }
  if (!isFairy) bd.add(GEO.cyl(14), skin, TRS(0, 0.56, 0, 0, 0, 0, 0.042, 0.1, 0.042));
  const torso = bd.build();
  body.add(torso);

  /* --- cape for the prince --- */
  let cape = null;
  if (isPrince) {
    const cb = new Batch(MAT.satin);
    const dg = drapeGeo(0.5, 1.05, 3, 0.04, { flare: 0.5, segX: 24, segY: 14 });
    cb.add(dg, '#8a2140', TRS(0, 0, 0, 0.12, Math.PI, 0));
    const trimG = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6); trimG.rotateZ(Math.PI / 2);
    cb.add(trimG, C.trim, TRS(0, -1.04, 0.13, 0, 0, 0, 1.3, 1, 1));
    cape = cb.build();
    cape.material = MAT.satin.clone(); cape.material.side = THREE.DoubleSide;
    cape.position.set(0, 0.5, -0.16);
    body.add(cape);
  }

  /* --- head --- */
  const head = new THREE.Group(); head.position.y = isFairy ? 0.52 : 0.585; body.add(head);
  const hg = new THREE.SphereGeometry(0.255, q(36), q(28));
  planarFaceUV(hg, 0.255, 0.255, 0, 0.47);
  const faceMat = new THREE.MeshStandardMaterial({ map: C.face.smile, roughness: 0.34, metalness: 0 });
  const headMesh = new THREE.Mesh(hg, faceMat);
  headMesh.position.y = 0.23; headMesh.scale.set(1, 1.04, 0.97); headMesh.castShadow = true;
  head.add(headMesh);
  const hb = new Batch(MAT.satin);
  hb.push(TRS(0, 0.23, 0));
  const hairCol = (x, y, z) => new THREE.Color(C.hair).lerp(new THREE.Color(C.hair2), 0.5 + 0.5 * Math.sin(Math.atan2(x, z) * 9 + y * 20));
  if (isClara) {
    hb.add(new THREE.SphereGeometry(0.272, 30, 18, 0, TAU, 0, 1.78), hairCol, TRS(0, 0.004, -0.012, -0.5, 0, 0));
    const back = lathe([[0.262, 0.05], [0.268, -0.06], [0.25, -0.18], [0.215, -0.29], [0.18, -0.35], [0.15, -0.37], [0.13, -0.34]], 22, 16, Math.PI / 2, Math.PI);
    hb.add(back, hairCol, TRS(0, 0, -0.012));
    for (const s of [-1, 1]) {
      for (const [ox, oz, len] of [[0.205, -0.02, 0.32], [0.165, -0.12, 0.3]]) {
        const pts = [];
        for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * TAU * 2.6; pts.push(new THREE.Vector3(s * ox + Math.cos(a) * 0.032, -0.06 - t * len, oz + Math.sin(a) * 0.032)); }
        hb.add(tubeGeo(pts, 0.027 - 0.008 * 0, 60, 7), hairCol);
      }
    }
    // side-swept fringe: one soft sweep and a small curl
    hb.add(GEO.sph(18, 12), hairCol, TRS(-0.035, 0.155, 0.19, -0.42, 0.08, -0.38, 0.165, 0.052, 0.07));
    hb.add(GEO.sph(14, 10), hairCol, TRS(0.135, 0.135, 0.175, -0.3, 0.55, 0.55, 0.085, 0.045, 0.05));
    hb.add(GEO.sph(12, 8), hairCol, TRS(-0.17, 0.11, 0.15, -0.2, -0.6, -0.2, 0.07, 0.05, 0.05));
    // big satin bow
    hb.push(TRS(0.07, 0.2, -0.1, -0.5, 0.25, 0.2));
    for (const s of [-1, 1]) hb.add(GEO.torus(0.075, 0.028, 8, 20), C.sash, TRS(s * 0.075, 0.01, 0, 0, 0, s * 0.35, 1, 0.72, 0.5));
    hb.add(GEO.sph(10, 8), C.sash, TRS(0, 0, 0, 0, 0, 0, 0.034));
    for (const s of [-1, 1]) hb.add(GEO.box(), C.sash, TRS(s * 0.035, -0.08, -0.01, 0.2, 0, s * 0.35, 0.04, 0.15, 0.012));
    hb.pop();
  } else if (isFairy) {
    hb.add(new THREE.SphereGeometry(0.27, q(30), q(18), 0, TAU, 0, 1.7), hairCol, TRS(0, 0.006, -0.014, -0.42, 0, 0));
    if (C.dancer !== 'tea') {
      hb.add(GEO.sph(q(18), q(14)), hairCol, TRS(0, 0.21, -0.17, 0, 0, 0, 0.1, 0.095, 0.1));
      hb.add(GEO.torus(0.1, 0.022, q(8, 4), q(24)), C.hair2, TRS(0, 0.19, -0.15, -0.6, 0, 0, 1, 1, 0.8));
    }
    for (const s of [-1, 1]) hb.add(GEO.sph(q(12), q(8)), hairCol, TRS(s * 0.19, 0.02, 0.1, 0, 0, s * 0.3, 0.07, 0.1, 0.06));
    if (!C.dancer) {
      // tiara
      const tg = new THREE.TorusGeometry(0.2, 0.012, q(6), q(30), Math.PI * 0.9);
      hb.add(tg, C.metal || '#e8c070', TRS(0, 0.16, 0.04, -0.75, 0, Math.PI * 0.05));
      for (let i = 0; i < 7; i++) { const a = lerp(0.35, Math.PI - 0.35, i / 6); hb.add(GEO.cone(6), C.metal2 || '#f0d080', TRS(Math.cos(a) * 0.2, 0.16 + Math.sin(a) * 0.2 * 0.73, 0.04 + Math.sin(a) * 0.2 * 0.68, -0.75 + Math.PI * 0.0, 0, Math.cos(a) * -0.9, 0.018, i === 3 ? 0.09 : 0.05, 0.018)); }
      hb.add(GEO.sph(10, 8), C.crown || '#f28aa8', TRS(0, 0.33, 0.17, 0, 0, 0, 0.026));
    } else if (C.dancer === 'choco') {
      // a tall comb behind the bun and a red rose over one ear
      hb.add(GEO.torus(0.15, 0.022, 6, 22, Math.PI), '#2a1216', TRS(0, 0.25, -0.24, -0.25, 0, 0, 1, 1.25, 1));
      for (let i = 0; i < 7; i++) { const a = (i / 6) * Math.PI; hb.add(GEO.sph(6, 4), C.metal2, TRS(Math.cos(a) * 0.15, 0.25 + Math.sin(a) * 0.19, -0.24 - Math.sin(a) * 0.05, 0, 0, 0, 0.016)); }
      hb.add(GEO.sph(12, 10), C.accent, TRS(0.2, 0.13, 0.08, 0, 0, 0, 0.058, 0.05, 0.05));
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; hb.add(GEO.sph(8, 6), '#c42a40', TRS(0.2 + Math.cos(a) * 0.045, 0.13 + Math.sin(a) * 0.04, 0.09, 0, 0, 0, 0.032, 0.026, 0.02)); }
      hb.add(GEO.sph(8, 6), '#3f7a46', TRS(0.25, 0.08, 0.06, 0, 0, 0.7, 0.045, 0.016, 0.022));
    } else if (C.dancer === 'coffee') {
      // a gold circlet with a teal jewel and little gold coins across the brow
      const cg = new THREE.TorusGeometry(0.262, 0.012, 6, 40); cg.rotateX(Math.PI / 2);
      hb.add(cg, C.metal, TRS(0, 0.1, -0.02, -0.32, 0, 0));
      hb.add(GEO.sph(12, 10), C.accent, TRS(0, 0.135, 0.255, 0, 0, 0, 0.032, 0.04, 0.02));
      for (let i = -3; i <= 3; i++) { if (!i) continue; const a = i * 0.24; hb.add(GEO.cyl(8), C.metal2, TRS(Math.sin(a) * 0.255, 0.065 - Math.abs(i) * 0.004, Math.cos(a) * 0.245, Math.PI / 2, 0, -a, 0.016, 0.006, 0.016)); }
    } else {
      // two buns on top, tied with red ribbons and small blossoms
      for (const s of [-1, 1]) {
        hb.add(GEO.sph(q(16), q(12)), hairCol, TRS(s * 0.16, 0.2, -0.04, 0, 0, 0, 0.085, 0.08, 0.085));
        hb.add(GEO.torus(0.075, 0.016, 6, 20), C.trim, TRS(s * 0.15, 0.16, -0.035, Math.PI / 2 + s * 0.3, 0, 0, 1, 1, 0.8));
        for (let i = 0; i < 3; i++) { const a = i * 2.1 + (s > 0 ? 0.5 : 0); hb.add(GEO.sph(6, 4), i % 2 ? '#ffd1dc' : C.accent, TRS(s * 0.16 + Math.cos(a) * 0.07, 0.24 + Math.sin(a) * 0.03, 0.02, 0, 0, 0, 0.022)); }
      }
      hb.add(GEO.sph(10, 8), '#1f1a20', TRS(0, 0.13, 0.2, -0.6, 0, 0, 0.17, 0.04, 0.06));
    }
  } else {
    hb.add(new THREE.SphereGeometry(0.27, 30, 18, 0, TAU, 0, 1.68), hairCol, TRS(0, 0.006, -0.014, -0.32, 0, 0));
    hb.add(GEO.sph(12, 10), hairCol, TRS(0.04, 0.2, 0.15, -0.4, 0, -0.3, 0.13, 0.07, 0.1));
    for (const s of [-1, 1]) hb.add(GEO.sph(12, 8), hairCol, TRS(s * 0.22, -0.02, 0.02, 0, 0, s * 0.2, 0.07, 0.11, 0.09));
    const cg = new THREE.TorusGeometry(0.24, 0.016, 6, 34); cg.rotateX(Math.PI / 2);
    hb.add(cg, '#e2bb69', TRS(0, 0.17, -0.02, -0.25, 0, 0));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; hb.add(GEO.cone(6), '#e9c46e', TRS(Math.sin(a) * 0.24, 0.23 + Math.cos(a) * 0.06, Math.cos(a) * 0.24 - 0.02 - Math.cos(a) * 0.06, -0.25, 0, 0, 0.022, 0.08, 0.022)); }
    hb.add(GEO.sph(10, 8), '#c0304a', TRS(0, 0.215, 0.235, 0, 0, 0, 0.022));
  }
  hb.pop();
  const hair = hb.build();
  head.add(hair);

  /* --- arms --- */
  const mkArm = (side) => {
    const sh = new THREE.Group();
    sh.position.set(side * (isPrince ? 0.19 : 0.15), isFairy ? 0.425 : isPrince ? 0.47 : 0.475, 0);
    const ab = new Batch(MAT.satin);
    if (isClara) {
      ab.add(GEO.sph(14, 10), C.dress, TRS(0, -0.02, 0, 0, 0, 0, 0.072, 0.066, 0.072));
      ab.add(GEO.torus(0.052, 0.014, 6, 18), C.trim, TRS(0, -0.07, 0, Math.PI / 2, 0, 0));
    } else if (isPrince) {
      ab.add(GEO.capsule(0.05, 0.14, 4, 10), C.dress, TRS(0, -0.1, 0));
      ab.add(GEO.torus(0.045, 0.014, 6, 18), C.trim, TRS(0, -0.19, 0, Math.PI / 2, 0, 0));
    } else {
      ab.add(GEO.torus(0.036, 0.008, q(6), q(16)), C.metal || '#e8c070', TRS(0, -0.1, 0, Math.PI / 2, 0, 0));
    }
    ab.add(GEO.capsule(0.031, 0.13, q(4, 2), q(10, 5)), skin, TRS(0, isPrince ? -0.06 : -0.12, 0, 0, 0, 0, isPrince ? 0.8 : 1));
    const upper = ab.build();
    sh.add(upper);
    const el = new THREE.Group(); el.position.y = isFairy ? -0.21 : -0.2; sh.add(el);
    const fb = new Batch(MAT.porcelain);
    fb.add(GEO.capsule(0.028, 0.12, q(4, 2), q(10, 5)), isPrince ? C.dress : skin, TRS(0, -0.08, 0));
    if (isPrince) fb.add(GEO.torus(0.034, 0.012, 6, 16), C.trim, TRS(0, -0.15, 0, Math.PI / 2, 0, 0));
    fb.add(GEO.sph(q(12), q(10)), skin, TRS(0, -0.175, 0.005, 0, 0, 0, 0.036, 0.046, 0.03));
    const fore = fb.build();
    el.add(fore);
    const hand = new THREE.Object3D(); hand.position.y = -0.19; el.add(hand);
    body.add(sh);
    return { sh, el, hand };
  };
  const armL = mkArm(1), armR = mkArm(-1);

  /* --- legs --- */
  const mkLeg = (side) => {
    const hip = new THREE.Group(); hip.position.set(side * 0.072, -0.02, 0);
    const lb = new Batch(MAT.satin);
    const L = C.legLen;
    lb.add(GEO.capsule(0.042, L, q(4, 2), q(10, 5)), C.legs, TRS(0, -(0.02 + 0.042 + L / 2), 0));
    const footY = -(C.hip - 0.05);
    if (isPrince) {
      lb.add(GEO.cyl(12), C.shoe, TRS(0, footY + 0.09, 0, 0, 0, 0, 0.05, 0.16, 0.05));
      lb.add(GEO.torus(0.05, 0.01, 6, 16), C.trim, TRS(0, footY + 0.17, 0, Math.PI / 2, 0, 0));
    }
    lb.add(GEO.sph(q(14), q(10)), C.shoe, TRS(0, footY, 0.03, 0, 0, 0, 0.048, 0.032, 0.088));
    lb.add(GEO.torus(0.04, 0.007, q(6), q(16)), C.shoe, TRS(0, footY + 0.05, 0, Math.PI / 2.4, 0, 0));
    const leg = lb.build();
    hip.add(leg);
    body.add(hip);
    return hip;
  };
  const legL = mkLeg(1), legR = mkLeg(-1);

  /* --- the sweets dancers' props: castanets (chocolate) or a paper fan (tea); the coffee dancer's veil is added by the chapter --- */
  if (C.dancer === 'choco') {
    for (const arm of [armL, armR]) {
      const cb = new Batch(MAT.gloss);
      for (const s of [-1, 1]) cb.add(GEO.sph(10, 8), '#3b1d14', TRS(s * 0.014, -0.03, 0.022, 0, 0, 0, 0.012, 0.04, 0.036));
      cb.add(GEO.torus(0.014, 0.005, 4, 10), C.accent, TRS(0, 0.012, 0.02, 0, Math.PI / 2, 0));
      arm.hand.add(cb.build());
    }
  } else if (C.dancer === 'tea') {
    const fb = new Batch(MAT.satin.clone());
    fb.mat.side = THREE.DoubleSide;
    fb.add(new THREE.CircleGeometry(0.22, 18, Math.PI * 1.08, Math.PI * 0.84), (x, y) => { const a = Math.atan2(y, x), r = Math.hypot(x, y); return r > 0.19 ? C.trim : Math.floor(a * 9) % 2 ? '#f6edd8' : '#ffe3e8'; }, TRS(0, -0.01, 0.03));
    for (let i = 0; i <= 6; i++) { const a = Math.PI * (1.1 + (i / 6) * 0.8); fb.add(GEO.box(), '#8a5a3a', TRS(Math.cos(a) * 0.1, -0.01 + Math.sin(a) * 0.1, 0.035, 0, 0, a + Math.PI / 2, 0.006, 0.2, 0.004)); }
    const fan = fb.build(); fan.castShadow = false;
    armR.hand.add(fan);
  }

  /* --- fairy extras: wand and wings --- */
  let wand = null, wings = null;
  if (isFairy && !C.dancer) {
    const wb = new Batch(MAT.gold);
    wb.add(GEO.cyl(8), C.metal || '#e8c070', TRS(0, 0.18, 0, 0, 0, 0, 0.008, 0.36, 0.008));
    wb.add(starGeo(0.06, 0.026, 0.02, 0.012), C.metal2 || '#ffe08a', TRS(0, 0.38, 0, 0, 0, 0));
    wand = wb.build();
    wand.position.set(0, -0.19, 0.02); wand.rotation.x = 0.3;
    armR.el.add(wand);
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0); wingShape.bezierCurveTo(0.12, 0.08, 0.38, 0.32, 0.3, 0.46); wingShape.bezierCurveTo(0.22, 0.56, 0.06, 0.34, 0, 0);
    const wingShape2 = new THREE.Shape();
    wingShape2.moveTo(0, 0); wingShape2.bezierCurveTo(0.1, -0.04, 0.3, -0.12, 0.26, -0.24); wingShape2.bezierCurveTo(0.2, -0.32, 0.05, -0.16, 0, 0);
    const wm = new THREE.MeshBasicMaterial({ color: '#d8e8ff', transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
    wings = new THREE.Group(); wings.position.set(0, 0.42, -0.12);
    for (const s of [-1, 1]) {
      const w = new THREE.Group();
      const a = new THREE.Mesh(new THREE.ShapeGeometry(wingShape, q(12, 5)), wm); const b = new THREE.Mesh(new THREE.ShapeGeometry(wingShape2, q(10, 5)), wm);
      w.add(a, b); w.scale.x = s; w.rotation.y = s * -0.5;
      wings.add(w);
    }
    body.add(wings);
  }

  const doll = {
    kind, root, body, skirt, torso, head, headMesh, faceMat, hair, armL, armR, legL, legR, cape, wand, wings, C,
    a: { t: rnd(0, 5), walk: 0, phase: 0, air: 0, action: null, at: 0, ad: 0, blink: rnd(1, 3), expr: 'smile', exprHold: 0, spin: 0, lookYaw: 0 },
    setExpr(e, hold = 0) { this.a.expr = e; this.a.exprHold = hold; this.applyFace(e); },
    applyFace(e) { const t = C.face[e] || C.face.smile; if (this.faceMat.map !== t) { this.faceMat.map = t; } },
    play(action, dur) { this.a.action = action; this.a.at = 0; this.a.ad = dur; },
  };
  doll.update = (dt, speed = 0, grounded = true, vy = 0) => updateDoll(doll, dt, speed, grounded, vy);
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  return doll;
}

function updateDoll(d, dt, speed, grounded, vy) {
  const a = d.a, C = d.C;
  a.t += dt;
  a.walk = damp(a.walk, clamp(speed, 0, 1), 10, dt);
  a.air = damp(a.air, grounded ? 0 : 1, grounded ? 14 : 9, dt);
  if (a.walk > 0.03) a.phase += dt * (4.5 + 7.5 * a.walk);
  const s = Math.sin(a.phase);
  const W = a.walk * (1 - a.air), A = a.air;
  const fairy = d.kind === 'fairy' || d.kind === 'snowfairy' || d.kind === 'snowflake' || !!C.dancer, prince = d.kind === 'prince';
  // rest pose
  let by = C.hip + Math.sin(a.t * 2.1) * 0.006, lean = 0, twist = 0, roll = 0;
  let lsx = -0.12, lsz = 0.2, rsx = -0.12, rsz = -0.2, lel = -0.45, rel = -0.45, llx = 0, rlx = 0, llz = 0, rlz = 0;
  let hx = Math.sin(a.t * 0.6) * 0.04, hz = Math.sin(a.t * 0.7) * 0.05, hy = a.lookYaw;
  let flare = 1;
  if (fairy) { lsz = 0.95; rsz = -0.95; lel = -0.55; rel = -0.55; lsx = -0.3; rsx = -0.3; }
  if (d.pose === 'fifth') { lsz = 2.75; rsz = -2.75; lel = -0.75; rel = -0.75; lsx = -0.1; rsx = -0.1; rlx = -0.6; rlz = -0.3; }
  if (prince) { lsz = 0.14; rsz = -0.14; lel = -0.2; rel = -0.2; }
  // locomotion
  by += Math.abs(s) * 0.035 * W;
  lean += 0.13 * W;
  llx += -s * 0.7 * W; rlx += s * 0.7 * W;
  lsx += s * 0.5 * W; rsx += -s * 0.5 * W; lsz += 0.12 * W; rsz -= 0.12 * W;
  roll += s * 0.04 * W;
  // grand jeté in the air
  llx = lerp(llx, -1.2, A); rlx = lerp(rlx, 0.95, A);
  lsz = lerp(lsz, 1.95, A); rsz = lerp(rsz, -1.95, A); lsx = lerp(lsx, -0.35, A); rsx = lerp(rsx, -0.1, A);
  lel = lerp(lel, -0.2, A); rel = lerp(rel, -0.2, A);
  lean = lerp(lean, vy > 0 ? -0.1 : 0.16, A);
  flare = lerp(flare, 1.1, A);
  // actions
  if (a.action) {
    a.at += dt;
    const k = Math.min(1, a.at / a.ad);
    const env = Math.sin(k * Math.PI);
    switch (a.action) {
      case 'throw': {
        const wind = k < 0.4 ? Ease.out(k / 0.4) : 1 - Ease.out((k - 0.4) / 0.6);
        rsx = k < 0.4 ? lerp(rsx, 2.5, Ease.out(k / 0.4)) : lerp(2.5, -1.3, Ease.out(Math.min(1, (k - 0.4) / 0.25)));
        if (k > 0.75) rsx = lerp(-1.3, -0.12, (k - 0.75) / 0.25);
        rsz = lerp(rsz, -0.35, env); rel = lerp(rel, -0.15, env);
        twist = (k < 0.4 ? 0.35 * wind : -0.3 * env);
        lsz = lerp(lsz, 0.9, env); lsx = lerp(lsx, -0.6, env);
        break;
      }
      case 'interact':
        lsx = lerp(lsx, -1.25, env); rsx = lerp(rsx, -1.25, env); lel = lerp(lel, -0.15, env); rel = lerp(rel, -0.15, env);
        lsz = lerp(lsz, 0.08, env); rsz = lerp(rsz, -0.08, env); lean += 0.18 * env; by -= 0.03 * env;
        break;
      case 'cheer':
        lsz = lerp(lsz, 2.6, env); rsz = lerp(rsz, -2.6, env); lel = lerp(lel, -0.3, env); rel = lerp(rel, -0.3, env);
        by += Math.abs(Math.sin(k * Math.PI * 2)) * 0.12; flare = lerp(flare, 1.12, env);
        break;
      case 'spin':
        a.spin = Ease.inOut(k) * TAU;
        lsz = lerp(lsz, 2.75, env); rsz = lerp(rsz, -2.75, env); lel = lerp(lel, -0.7, env); rel = lerp(rel, -0.7, env);
        rlx = lerp(rlx, -0.75, env); rlz = lerp(rlz, -0.35, env); by += 0.05 * env; flare = lerp(flare, 1.2, env);
        break;
      case 'hurt':
        lean = lerp(lean, -0.35, env); lsz = lerp(lsz, 1.2, env); rsz = lerp(rsz, -1.2, env); by -= 0.02 * env;
        break;
      case 'curtsy':
        by -= 0.09 * env; rlx = lerp(rlx, 0.55, env); lsz = lerp(lsz, 0.75, env); rsz = lerp(rsz, -0.75, env);
        lsx = lerp(lsx, -0.4, env); rsx = lerp(rsx, -0.4, env); hx += 0.28 * env; lean += 0.08 * env; flare = lerp(flare, 1.08, env);
        break;
      case 'bow':
        lean += 0.45 * env; rsx = lerp(rsx, -1.2, env); rel = lerp(rel, -1.3, env); lsx = lerp(lsx, 0.5, env); hx += 0.2 * env;
        break;
      case 'wave':
        rsz = lerp(rsz, -2.5, env); rel = lerp(rel, -0.4 + Math.sin(a.at * 14) * 0.45, env);
        break;
      case 'surprise':
        lsz = lerp(lsz, 0.9, env); rsz = lerp(rsz, -0.9, env); lel = lerp(lel, -1.6, env); rel = lerp(rel, -1.6, env); lsx = lerp(lsx, -0.9, env); rsx = lerp(rsx, -0.9, env); by += 0.04 * env;
        break;
      case 'pose': // fairy arabesque
        lsz = lerp(lsz, 2.7, env); rsz = lerp(rsz, -1.4, env); rsx = lerp(rsx, -0.9, env); rlx = lerp(rlx, 1.1, env); lean += 0.25 * env; lel = lerp(lel, -0.6, env);
        break;
      /* the dances of the Kingdom of Sweets (chapter IV) */
      case 'castanet': // arms curved high over the head, wrists flicking, a turn of the shoulders
        lsz = lerp(lsz, 2.45, env); rsz = lerp(rsz, -2.45, env); lsx = lerp(lsx, -0.35, env); rsx = lerp(rsx, -0.35, env);
        lel = lerp(lel, -1.0, env); rel = lerp(rel, -1.0, env);
        twist += Math.sin(k * TAU) * 0.22 * env; hy += Math.sin(k * TAU) * 0.25 * env; by += 0.025 * env; flare = lerp(flare, 1.1, env);
        break;
      case 'stomp': { // hands on the hips, a knee comes up and the heel comes down
        const up = k < 0.45 ? Ease.out(k / 0.45) : 1 - Ease.in(Math.min(1, (k - 0.45) / 0.2));
        rlx = lerp(rlx, -1.05, up); by -= 0.045 * env; lean += 0.06 * env;
        lsz = lerp(lsz, 0.62, env); rsz = lerp(rsz, -0.62, env); lsx = lerp(lsx, 0.25, env); rsx = lerp(rsx, 0.25, env); lel = lerp(lel, -1.85, env); rel = lerp(rel, -1.85, env);
        break;
      }
      case 'veil': { // slow arms sweeping side to side, the body swaying with them
        const w = Math.sin(k * TAU);
        lsz = lerp(lsz, 1.35 + w * 0.65, env); rsz = lerp(rsz, -1.35 + w * 0.65, env); lsx = lerp(lsx, -0.45, env); rsx = lerp(rsx, -0.45, env);
        lel = lerp(lel, -0.35, env); rel = lerp(rel, -0.35, env); roll += w * 0.1 * env; twist += w * 0.18 * env; by += Math.sin(k * TAU * 2) * 0.02 * env; hz -= w * 0.12 * env;
        break;
      }
      case 'hop': // a quick little hop, arms held in front as if with a fan
        by += Math.sin(k * Math.PI) * 0.16; llx = lerp(llx, -0.55, env); rlx = lerp(rlx, -0.55, env); lean -= 0.05 * env;
        lsx = lerp(lsx, -1.1, env); lsz = lerp(lsz, 0.35, env); rsx = lerp(rsx, -1.5, env); rsz = lerp(rsz, -0.25, env); lel = lerp(lel, -1.1, env); rel = lerp(rel, -0.6, env);
        flare = lerp(flare, 1.12, env);
        break;
    }
    if (k >= 1) { a.action = null; a.spin = 0; }
  }
  // apply
  d.body.position.y = by;
  d.body.rotation.set(lean, twist + a.spin, roll);
  d.armL.sh.rotation.set(lsx, 0, lsz); d.armR.sh.rotation.set(rsx, 0, rsz);
  d.armL.el.rotation.x = lel; d.armR.el.rotation.x = rel;
  d.legL.rotation.set(llx, 0, llz); d.legR.rotation.set(rlx, 0, rlz);
  d.head.rotation.set(hx - lean * 0.4, hy, hz);
  d.skirt.scale.set(flare, 1, flare);
  d.skirt.rotation.z = -roll * 1.5;
  if (d.wings) { const f = Math.sin(a.t * 9) * 0.25; d.wings.children[0].rotation.y = -0.5 - f; d.wings.children[1].rotation.y = 0.5 + f; }
  if (d.cape) d.cape.rotation.x = 0.1 + W * 0.25 + A * 0.3 + Math.sin(a.t * 1.7) * 0.03;
  // blinking & expressions
  if (a.exprHold > 0) a.exprHold -= dt;
  a.blink -= dt;
  if (a.blink < 0) {
    if (a.expr === 'smile' || a.expr === 'determined') d.applyFace('blink');
    if (a.blink < -0.12) { a.blink = rnd(2.2, 4.8); d.applyFace(a.expr); }
  }
  if (a.exprHold <= 0 && a.expr !== 'smile' && a.exprHold > -1) { a.expr = 'smile'; a.exprHold = -2; d.applyFace('smile'); }
}

/* ---------------- the Nutcracker (doll → life size) ---------------- */
function buildNutcracker() {
  const root = new THREE.Group();
  const body = new THREE.Group(); body.position.y = 0.66; root.add(body);
  const red = '#a5223b', redDeep = '#7d1830', blue = '#93b3d8', gold = '#e0b25c', white = '#fbf6ee', black = '#1f1418';
  const tb = new Batch(MAT.gloss);
  // coat
  tb.add(lathe([[0.0, -0.08], [0.235, -0.08], [0.225, 0.0], [0.2, 0.12], [0.205, 0.3], [0.22, 0.45], [0.2, 0.56], [0.13, 0.62], [0.0, 0.63]], 32, 16), (x, y, z) => new THREE.Color(red).lerp(new THREE.Color(redDeep), smoothstep(0.1, -0.08, y) * 0.5));
  tb.add(GEO.box(), white, TRS(0.0, 0.33, 0.19, 0, 0, 0.62, 0.05, 0.62, 0.02));
  tb.add(GEO.box(), white, TRS(0.0, 0.33, 0.19, 0, 0, -0.62, 0.05, 0.62, 0.02));
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) tb.add(GEO.sph(8, 6), gold, TRS(s * 0.09, 0.18 + i * 0.1, 0.2 - Math.abs(i - 1.5) * 0.004, 0, 0, 0, 0.02));
  const belt = new THREE.TorusGeometry(0.205, 0.035, 8, 32); belt.rotateX(Math.PI / 2);
  tb.add(belt, black, TRS(0, 0.06, 0));
  tb.add(roundBox(0.11, 0.08, 0.04, 0.012, 2), gold, TRS(0, 0.06, 0.22));
  const collar = new THREE.CylinderGeometry(0.12, 0.14, 0.08, 20, 1, true);
  tb.add(collar, gold, TRS(0, 0.62, 0));
  // trousers & boots (part of body so they bob with it; legs separate)
  const coat = tb.build();
  body.add(coat);
  const gb = new Batch(MAT.gold);
  for (const s of [-1, 1]) {
    gb.add(GEO.cyl(18), gold, TRS(s * 0.23, 0.56, 0, 0, 0, s * 0.3, 0.1, 0.035, 0.1));
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI - Math.PI / 2; gb.add(GEO.cyl(5), gold, TRS(s * (0.23 + Math.cos(a) * 0.04) + s * 0.05, 0.5, Math.sin(a) * 0.085, 0, 0, s * 0.3, 0.012, 0.09, 0.012)); }
  }
  const epaulettes = gb.build();
  body.add(epaulettes);
  // head
  const head = new THREE.Group(); head.position.y = 0.64; body.add(head);
  const hgeo = faceHeadGeo(roundBox(0.36, 0.42, 0.34, 0.13, 4), 0.18, 0.21, 0, 0.46);   // group 0: the painted face in front · group 1: white hair behind
  const faceMat = new THREE.MeshStandardMaterial({ map: TEX.nutFace, roughness: 0.32 });
  const hairMat = new THREE.MeshStandardMaterial({ map: TEX.nutHair, roughness: 0.4 });
  const headMesh = new THREE.Mesh(hgeo, [faceMat, hairMat]); headMesh.position.y = 0.24; headMesh.castShadow = true;
  head.add(headMesh);
  const hb = new Batch(MAT.gloss);
  hb.add(GEO.sph(14, 10), '#f2bfa6', TRS(0, 0.22, 0.19, 0.2, 0, 0, 0.05, 0.075, 0.07));
  for (const s of [-1, 1]) {
    const pts = [[0, 0.155, 0.19], [s * 0.06, 0.15, 0.2], [s * 0.12, 0.17, 0.19], [s * 0.16, 0.21, 0.16], [s * 0.14, 0.235, 0.15]];
    hb.add(tubeGeo(pts, 0.026, 24, 8), black);
    hb.add(GEO.sph(10, 8), white, TRS(s * 0.2, 0.2, -0.02, 0, 0, 0, 0.05, 0.12, 0.09));
  }
  // shako hat
  hb.add(GEO.cyl(28, false, 1.12), black, TRS(0, 0.66, -0.01, -0.06, 0, 0, 0.205, 0.44, 0.2));
  hb.add(GEO.torus(0.2, 0.024, 8, 30), gold, TRS(0, 0.46, -0.0, Math.PI / 2 - 0.06, 0, 0));
  hb.add(GEO.torus(0.225, 0.02, 8, 30), gold, TRS(0, 0.87, -0.02, Math.PI / 2 - 0.06, 0, 0));
  hb.add(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 24, 1, false, -Math.PI / 2, Math.PI), black, TRS(0, 0.45, 0.06, 0.25, 0, 0, 1, 1, 0.8));
  hb.add(starGeo(0.085, 0.038, 0.03, 0.015), gold, TRS(0, 0.66, 0.21, -0.06, 0, 0));
  hb.add(lathe([[0, 0], [0.05, 0.04], [0.06, 0.12], [0.035, 0.22], [0, 0.27]], 14, 12), (x, y) => new THREE.Color(white).lerp(new THREE.Color('#d23b55'), smoothstep(0.08, 0.24, y)), TRS(0, 0.88, 0.08, -0.15, 0, 0));
  const hat = hb.build();
  head.add(hat);
  // hinged jaw with beard
  const jaw = new THREE.Group(); jaw.position.set(0, 0.06, -0.06); head.add(jaw);
  const jb = new Batch(MAT.gloss);
  jb.add(roundBox(0.28, 0.12, 0.26, 0.05, 2), '#f6d3b6', TRS(0, -0.03, 0.12));
  for (let i = 0; i < 5; i++) jb.add(GEO.box(), white, TRS(-0.08 + i * 0.04, 0.03, 0.245, 0, 0, 0, 0.034, 0.03, 0.02));
  const beard = lathe([[0.0, 0.0], [0.14, 0.0], [0.15, -0.06], [0.12, -0.14], [0.06, -0.2], [0.0, -0.22]], 20, 14, -Math.PI / 2, Math.PI);
  deform(beard, (v) => { const a = Math.atan2(v.x, v.z); const k = 1 + 0.08 * Math.sin(a * 9 + v.y * 30); v.x *= k; v.z *= k; });
  jb.add(beard, white, TRS(0, -0.06, 0.12, 0, 0, 0, 1, 1, 0.9));
  jaw.add(jb.build());
  // arms
  const mkArm = (side) => {
    const sh = new THREE.Group(); sh.position.set(side * 0.27, 0.52, 0); body.add(sh);
    const ab = new Batch(MAT.gloss);
    ab.add(GEO.capsule(0.065, 0.32, 4, 12), red, TRS(0, -0.2, 0));
    ab.add(GEO.cyl(14), gold, TRS(0, -0.4, 0, 0, 0, 0, 0.075, 0.06, 0.075));
    ab.add(GEO.sph(12, 10), white, TRS(0, -0.47, 0.01, 0, 0, 0, 0.07));
    sh.add(ab.build());
    const hand = new THREE.Object3D(); hand.position.y = -0.47; sh.add(hand);
    return { sh, hand };
  };
  const armL = mkArm(1), armR = mkArm(-1);
  // sword in right hand
  const sb = new Batch(MAT.gold);
  sb.add(GEO.box(), '#e8ecf4', TRS(0, 0.0, 0.33, Math.PI / 2, 0, 0, 0.03, 0.56, 0.008));
  sb.add(GEO.box(), gold, TRS(0, 0, 0.04, 0, 0, 0, 0.14, 0.025, 0.03));
  sb.add(GEO.cyl(10), gold, TRS(0, 0, -0.03, Math.PI / 2, 0, 0, 0.018, 0.12, 0.018));
  sb.add(GEO.sph(8, 6), gold, TRS(0, 0, -0.1, 0, 0, 0, 0.03));
  const sword = sb.build(); armR.hand.add(sword); sword.rotation.x = -0.4;
  // legs
  const mkLeg = (side) => {
    const hip = new THREE.Group(); hip.position.set(side * 0.1, -0.06, 0); body.add(hip);
    const lb = new Batch(MAT.gloss);
    lb.add(GEO.capsule(0.085, 0.26, 4, 12), blue, TRS(0, -0.17, 0));
    lb.add(GEO.box(), gold, TRS(side * 0.085, -0.17, 0, 0, 0, 0, 0.012, 0.3, 0.03));
    lb.add(GEO.cyl(16, false, 1.08), black, TRS(0, -0.42, 0, 0, 0, 0, 0.085, 0.26, 0.085));
    lb.add(GEO.sph(14, 10), black, TRS(0, -0.565, 0.06, 0, 0, 0, 0.085, 0.06, 0.15));
    lb.add(GEO.torus(0.09, 0.016, 6, 20), gold, TRS(0, -0.29, 0, Math.PI / 2, 0, 0));
    hip.add(lb.build());
    return hip;
  };
  const legL = mkLeg(1), legR = mkLeg(-1);
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const nut = {
    root, body, head, jaw, armL, armR, legL, legR, sword,
    a: { t: 0, walk: 0, phase: 0, chomp: 0, action: null, at: 0, ad: 0, hop: 0 },
    play(action, dur) { this.a.action = action; this.a.at = 0; this.a.ad = dur; },
    update(dt, speed = 0, doll = false) {
      const a = this.a; a.t += dt;
      a.walk = damp(a.walk, clamp(speed, 0, 1), 8, dt);
      if (a.walk > 0.03) a.phase += dt * (doll ? 12 : 7.5) * (0.5 + a.walk * 0.5);
      const s = Math.sin(a.phase);
      let by = 0.66 + Math.sin(a.t * 1.8) * 0.004, lsx = 0, rsx = -0.25, lsz = 0.12, rsz = -0.18, ll = 0, rl = 0, lean = 0;
      if (doll) { by += Math.abs(s) * 0.12 * a.walk; lean = 0.05 * a.walk; }
      else { ll = s * 0.55 * a.walk; rl = -s * 0.55 * a.walk; lsx = -s * 0.35 * a.walk; by += Math.abs(s) * 0.03 * a.walk; }
      a.chomp = Math.max(0, a.chomp - dt);
      let jawOpen = a.chomp > 0 ? Math.abs(Math.sin(a.chomp * 18)) * 0.35 : 0;
      if (a.action) {
        a.at += dt; const k = Math.min(1, a.at / a.ad), env = Math.sin(k * Math.PI);
        if (a.action === 'slash') { rsx = k < 0.35 ? lerp(-0.25, 2.4, Ease.out(k / 0.35)) : lerp(2.4, -1.2, Ease.out(Math.min(1, (k - 0.35) / 0.25))); if (k > 0.8) rsx = lerp(-1.2, -0.25, (k - 0.8) / 0.2); lean = 0.12 * env; }
        if (a.action === 'salute') { rsx = lerp(rsx, -2.2, env); rsz = lerp(rsz, -0.5, env); }
        if (a.action === 'bow') { lean = 0.5 * env; lsx = lerp(lsx, -0.6, env); rsx = lerp(rsx, 0.4, env); }
        if (a.action === 'cheer') { rsx = lerp(rsx, -2.8, env); by += Math.abs(Math.sin(k * Math.PI * 2)) * 0.1; jawOpen = 0.35 * env; }
        if (k >= 1) a.action = null;
      }
      this.body.position.y = by; this.body.rotation.x = lean;
      this.armL.sh.rotation.set(lsx, 0, lsz); this.armR.sh.rotation.set(rsx, 0, rsz);
      this.legL.rotation.x = ll; this.legR.rotation.x = rl;
      this.jaw.rotation.x = jawOpen;
      this.head.rotation.z = Math.sin(a.t * 0.9) * 0.03;
    },
  };
  return nut;
}

/* ---------------- the Mouse King ---------------- */
function buildMouseKing() {
  const root = new THREE.Group();
  const body = new THREE.Group(); body.position.y = 0.62; root.add(body);
  const furM = MAT.fur.clone(), satM = MAT.satin.clone(), goldM = MAT.gold.clone(), glossM = MAT.gloss.clone();
  satM.side = THREE.DoubleSide;
  const fur = '#8a7c86', furLight = '#d5c8cd', pinkS = '#e8a5b3';
  const fb = new Batch(furM);
  fb.add(lathe([[0, -0.2], [0.3, -0.18], [0.38, 0.02], [0.36, 0.28], [0.28, 0.48], [0.16, 0.6], [0, 0.62]], 30, 16), (x, y, z) => new THREE.Color(fur).lerp(new THREE.Color(furLight), smoothstep(0.05, 0.3, z) * smoothstep(0.55, 0.0, y) * 0.8));
  const torso = fb.build(); body.add(torso);
  // royal cape with ermine collar
  const cb = new Batch(satM);
  cb.add(drapeGeo(0.95, 1.05, 4, 0.06, { flare: 0.6, segX: 28, segY: 14 }), '#6e1b3e', TRS(0, 0.52, -0.25, 0.1, Math.PI, 0));
  const cape = cb.build(); body.add(cape);
  const er = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.075, 10, 30), MAT.ermine.clone());
  er.rotation.x = Math.PI / 2; er.position.y = 0.53; er.castShadow = true; body.add(er);
  // head
  const head = new THREE.Group(); head.position.set(0, 0.62, 0.04); body.add(head);
  const hb = new Batch(furM);
  hb.add(GEO.sph(24, 18), (x, y, z) => new THREE.Color(fur).lerp(new THREE.Color(furLight), smoothstep(0.2, 0.9, z) * smoothstep(0.5, -0.6, y) * 0.7), TRS(0, 0.2, 0, 0, 0, 0, 0.27, 0.25, 0.27));
  const snout = lathe([[0, 0], [0.17, 0.0], [0.15, 0.12], [0.09, 0.26], [0.03, 0.33], [0, 0.34]], 20, 12);
  hb.add(snout, (x, y, z) => new THREE.Color(fur).lerp(new THREE.Color(furLight), smoothstep(-0.05, -0.12, z) * 0.0 + 0.25), TRS(0, 0.14, 0.12, Math.PI / 2 - 0.12, 0, 0));
  for (const s of [-1, 1]) {
    hb.add(GEO.cyl(24), fur, TRS(s * 0.24, 0.44, -0.04, Math.PI / 2 - 0.15, 0, s * -0.45, 0.17, 0.035, 0.17));
    hb.add(GEO.cyl(24), pinkS, TRS(s * 0.245, 0.445, -0.02, Math.PI / 2 - 0.15, 0, s * -0.45, 0.12, 0.03, 0.12));
  }
  const headFur = hb.build(); head.add(headFur);
  const eb = new Batch(glossM);
  eb.add(GEO.sph(12, 10), '#1b0f12', TRS(0, 0.17, 0.48, 0, 0, 0, 0.045, 0.04, 0.04));
  for (const s of [-1, 1]) {
    eb.add(GEO.sph(14, 10), '#c41f35', TRS(s * 0.11, 0.28, 0.2, 0, 0, 0, 0.055, 0.06, 0.04));
    eb.add(GEO.sph(8, 6), '#ffffff', TRS(s * 0.1 - 0.015, 0.3, 0.235, 0, 0, 0, 0.016));
    eb.add(GEO.box(), '#3b2a30', TRS(s * 0.11, 0.36, 0.22, 0, 0, s * 0.45, 0.11, 0.025, 0.03));
    for (let w = 0; w < 3; w++) eb.add(GEO.cyl(4), '#f5eef0', TRS(s * 0.17, 0.15 + w * 0.025 - 0.02, 0.38, 0, 0, s * (Math.PI / 2 + (w - 1) * 0.18), 0.004, 0.32, 0.004));
  }
  eb.add(GEO.box(), '#fffaf0', TRS(-0.022, 0.07, 0.39, 0.2, 0, 0, 0.035, 0.06, 0.015));
  eb.add(GEO.box(), '#fffaf0', TRS(0.022, 0.07, 0.39, 0.2, 0, 0, 0.035, 0.06, 0.015));
  head.add(eb.build());
  // crown that carries the stolen stars
  const crown = new THREE.Group(); crown.position.set(0, 0.42, -0.02); head.add(crown);
  const gb = new Batch(goldM);
  gb.add(new THREE.CylinderGeometry(0.17, 0.15, 0.1, 24, 1, true), '#e0b25c', TRS(0, 0, 0));
  gb.add(GEO.torus(0.165, 0.018, 6, 24), '#e0b25c', TRS(0, -0.05, 0, Math.PI / 2, 0, 0));
  for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; gb.add(GEO.cone(6), '#e9c06a', TRS(Math.sin(a) * 0.17, 0.1, Math.cos(a) * 0.17, 0, 0, 0, 0.035, 0.12, 0.035)); gb.add(GEO.sph(8, 6), '#f1d48c', TRS(Math.sin(a) * 0.17, 0.17, Math.cos(a) * 0.17, 0, 0, 0, 0.022)); }
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; gb.add(GEO.sph(8, 6), i % 2 ? '#3a6ad0' : '#d02a48', TRS(Math.sin(a) * 0.168, 0, Math.cos(a) * 0.168, 0, 0, 0, 0.026)); }
  crown.add(gb.build());
  const crownStars = [];
  for (let i = 0; i < 4; i++) {
    const st = new THREE.Mesh(starGeo(0.07, 0.03, 0.025, 0.012), MAT.starGold);
    const a = -0.9 + i * 0.6;
    st.position.set(Math.sin(a) * 0.19, 0.12, Math.cos(a) * 0.19); st.rotation.y = a;
    crown.add(st); crownStars.push(st);
  }
  // arms & sabre
  const mkArm = (side) => {
    const sh = new THREE.Group(); sh.position.set(side * 0.32, 0.36, 0.02); body.add(sh);
    const ab = new Batch(furM);
    ab.add(GEO.capsule(0.06, 0.22, 4, 10), fur, TRS(0, -0.15, 0));
    ab.add(GEO.sph(10, 8), pinkS, TRS(0, -0.3, 0.02, 0, 0, 0, 0.055, 0.06, 0.05));
    sh.add(ab.build());
    const hand = new THREE.Object3D(); hand.position.y = -0.31; sh.add(hand);
    return { sh, hand };
  };
  const armL = mkArm(1), armR = mkArm(-1);
  const sbb = new Batch(goldM);
  const blade = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; blade.push([0, 0.04 + t * 0.62, Math.sin(t * 1.4) * 0.1]); }
  sbb.add(tubeGeo(blade, 0.02, 20, 4), '#dfe3ea');
  sbb.add(GEO.torus(0.05, 0.012, 6, 14, Math.PI), '#e0b25c', TRS(0, 0.02, 0, 0, Math.PI / 2, 0));
  sbb.add(GEO.cyl(8), '#5a2030', TRS(0, -0.04, 0, 0, 0, 0, 0.02, 0.1, 0.02));
  const sabre = sbb.build(); armR.hand.add(sabre); sabre.rotation.x = 0.6;
  // legs and tail
  const mkLeg = (side) => {
    const hip = new THREE.Group(); hip.position.set(side * 0.16, -0.14, 0.02); body.add(hip);
    const lb = new Batch(furM);
    lb.add(GEO.capsule(0.08, 0.2, 4, 10), fur, TRS(0, -0.17, 0));
    lb.add(GEO.sph(14, 10), pinkS, TRS(0, -0.33, 0.09, 0, 0, 0, 0.09, 0.05, 0.16));
    hip.add(lb.build());
    return hip;
  };
  const legL = mkLeg(1), legR = mkLeg(-1);
  const tail = new THREE.Group(); tail.position.set(0, -0.1, -0.28); body.add(tail);
  const tailSegs = [];
  let parent = tail;
  for (let i = 0; i < 7; i++) {
    const seg = new THREE.Group(); seg.position.set(0, 0, i === 0 ? 0 : -0.13);
    const m = new THREE.Mesh(GEO.capsule(0.03 - i * 0.003, 0.11, 3, 6), furM);
    m.rotation.x = Math.PI / 2; m.position.z = -0.065; m.material = furM;
    m.geometry = GEO.capsule(0.03 - i * 0.003, 0.11, 3, 6);
    seg.add(m); parent.add(seg); parent = seg; tailSegs.push(seg);
  }
  // colour the tail (vertex colours required by the fur material)
  tailSegs.forEach((sg) => { const m = sg.children[0]; const b = new Batch(furM); b.add(m.geometry, pinkS); const built = b.build(); sg.remove(m); built.rotation.copy(m.rotation); built.position.copy(m.position); sg.add(built); });
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const flashMats = [furM, satM, glossM];
  const king = {
    root, body, head, crown, crownStars, armL, armR, legL, legR, tailSegs, cape, flashMats,
    a: { t: 0, walk: 0, phase: 0, mode: 'idle', mt: 0, flash: 0 },
    flash(v) { flashMats.forEach((m) => { m.emissive = m.emissive || new THREE.Color(); m.emissive.setRGB(v, v * 0.85, v * 0.9); }); },
    update(dt, speed = 0) {
      const a = this.a; a.t += dt; a.mt += dt;
      a.walk = damp(a.walk, clamp(speed, 0, 1.5), 8, dt);
      a.phase += dt * (3 + 8 * a.walk);
      const s = Math.sin(a.phase);
      let by = 0.62 + Math.abs(s) * 0.05 * a.walk, lean = 0.08 * a.walk, roll = s * 0.12 * a.walk + Math.sin(a.t * 1.4) * 0.04;
      let rsx = -0.6 + Math.sin(a.t * 2.2) * 0.25, lsx = -0.3 + s * 0.3 * a.walk, rsz = -0.35, lsz = 0.4;
      if (a.mode === 'windup') { lean = -0.3; rsx = -2.6 + Math.sin(a.t * 30) * 0.1; by += 0.06; roll = Math.sin(a.t * 40) * 0.05; }
      if (a.mode === 'charge') { lean = 0.5; rsx = -1.4; }
      if (a.mode === 'dizzy') { roll = Math.sin(a.t * 6) * 0.25; lean = 0.1; rsx = 0.2; this.head.rotation.y = Math.sin(a.t * 5) * 0.4; }
      else this.head.rotation.y = damp(this.head.rotation.y, 0, 6, dt);
      if (a.mode === 'hurt') { lean = -0.4 * Math.max(0, 1 - a.mt * 2); roll = Math.sin(a.mt * 30) * 0.2 * Math.max(0, 1 - a.mt * 2); }
      if (a.mode === 'laugh') { by += Math.abs(Math.sin(a.t * 14)) * 0.05; lean = -0.15; rsx = -2.4; lsz = 1.0; }
      this.body.position.y = by; this.body.rotation.set(lean, 0, roll);
      this.legL.rotation.x = s * 0.6 * a.walk; this.legR.rotation.x = -s * 0.6 * a.walk;
      this.armR.sh.rotation.set(rsx, 0, rsz); this.armL.sh.rotation.set(lsx, 0, lsz);
      this.tailSegs.forEach((sg, i) => { sg.rotation.y = Math.sin(a.t * 3 - i * 0.7) * 0.25; sg.rotation.x = -0.18 + Math.sin(a.t * 2 - i) * 0.05; });
      this.cape.rotation.x = 0.04 + a.walk * 0.15;
      if (a.flash > 0) { a.flash = Math.max(0, a.flash - dt); this.flash(Math.sin(a.flash * 40) > 0 ? 0.6 : 0); if (a.flash === 0) this.flash(0); }
    },
  };
  return king;
}

/* ---------------- mouse soldiers ---------------- */
function buildMouse() {
  const root = new THREE.Group();
  const body = new THREE.Group(); body.position.y = 0.0; root.add(body);
  const fur = '#958891', light = '#d9ced3';
  const b = new Batch(MAT.fur);
  b.add(GEO.sph(16, 12), (x, y, z) => new THREE.Color(fur).lerp(new THREE.Color(light), smoothstep(0.2, 0.9, z) * 0.7), TRS(0, 0.25, 0, 0, 0, 0, 0.17, 0.2, 0.16));
  b.add(GEO.sph(16, 12), fur, TRS(0, 0.5, 0.04, 0, 0, 0, 0.13, 0.12, 0.13));
  b.add(lathe([[0, 0], [0.1, 0], [0.08, 0.08], [0.04, 0.16], [0, 0.18]], 14, 8), light, TRS(0, 0.47, 0.11, Math.PI / 2 - 0.15, 0, 0));
  b.add(GEO.sph(8, 6), '#e8a5b3', TRS(0, 0.445, 0.29, 0, 0, 0, 0.028));
  for (const s of [-1, 1]) {
    b.add(GEO.cyl(18), fur, TRS(s * 0.11, 0.63, 0, Math.PI / 2 - 0.2, 0, s * -0.4, 0.085, 0.02, 0.085));
    b.add(GEO.cyl(18), '#efb2be', TRS(s * 0.112, 0.632, 0.012, Math.PI / 2 - 0.2, 0, s * -0.4, 0.06, 0.02, 0.06));
    b.add(GEO.sph(8, 6), '#1b0f12', TRS(s * 0.06, 0.54, 0.13, 0, 0, 0, 0.022));
    b.add(GEO.sph(6, 4), '#ffffff', TRS(s * 0.06 - 0.006, 0.55, 0.15, 0, 0, 0, 0.007));
    b.add(GEO.capsule(0.03, 0.12, 3, 8), fur, TRS(s * 0.15, 0.26, 0.08, -1.0, 0, s * 0.3));
    b.add(GEO.sph(10, 8), '#e8a5b3', TRS(s * 0.09, 0.03, 0.06, 0, 0, 0, 0.06, 0.035, 0.09));
  }
  body.add(b.build());
  const m = new Batch(MAT.gold);
  m.add(GEO.hemi(16, 8), '#b9bec8', TRS(0, 0.58, 0.02, -0.15, 0, 0, 0.13, 0.1, 0.13));
  m.add(GEO.cone(8), '#c9ced8', TRS(0, 0.7, 0.0, 0, 0, 0, 0.02, 0.07, 0.02));
  m.add(GEO.cyl(6), '#8a5a3a', TRS(-0.17, 0.3, 0.16, 0.15, 0, 0, 0.012, 0.6, 0.012));
  m.add(GEO.cone(6), '#e2e6ee', TRS(-0.17, 0.62, 0.2, 0.15, 0, 0, 0.025, 0.08, 0.025));
  body.add(m.build());
  const tb = new Batch(MAT.fur);
  const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([Math.sin(t * 3) * 0.08, 0.12 + Math.sin(t * Math.PI) * 0.12, -0.14 - t * 0.38]); }
  tb.add(tubeGeo(pts, 0.018, 16, 5), '#e8a5b3');
  const tail = tb.build(); body.add(tail);
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return {
    root, body, tail, a: { t: rnd(0, 5), phase: rnd(0, 5) },
    update(dt, speed) {
      const a = this.a; a.t += dt; a.phase += dt * (6 + 12 * speed);
      this.body.position.y = Math.abs(Math.sin(a.phase)) * 0.06 * clamp(speed, 0.2, 1);
      this.body.rotation.z = Math.sin(a.phase) * 0.1;
      this.tail.rotation.y = Math.sin(a.t * 6) * 0.3;
    },
  };
}

/* ---------------- toy soldiers ---------------- */
function buildSoldier(variant = 0) {
  const root = new THREE.Group();
  const body = new THREE.Group(); body.position.y = 0.42; root.add(body);
  const coat = variant % 2 ? '#2c4a8a' : '#b02f45', trous = variant % 2 ? '#fbf6ee' : '#2b3767';
  const b = new Batch(MAT.gloss);
  b.add(GEO.cyl(18), coat, TRS(0, 0.2, 0, 0, 0, 0, 0.13, 0.42, 0.11));
  b.add(GEO.box(), '#fbf6ee', TRS(0, 0.22, 0.105, 0, 0, 0.6, 0.03, 0.42, 0.01));
  b.add(GEO.box(), '#fbf6ee', TRS(0, 0.22, 0.105, 0, 0, -0.6, 0.03, 0.42, 0.01));
  b.add(GEO.cyl(16), '#e0b25c', TRS(0, 0.02, 0, 0, 0, 0, 0.135, 0.04, 0.115));
  for (const s of [-1, 1]) { b.add(GEO.cyl(12), '#e0b25c', TRS(s * 0.14, 0.38, 0, 0, 0, s * 0.3, 0.055, 0.02, 0.055)); b.add(GEO.capsule(0.035, 0.22, 3, 8), coat, TRS(s * 0.16, 0.24, 0.0, 0, 0, s * 0.08)); b.add(GEO.sph(8, 6), '#fbf6ee', TRS(s * 0.165, 0.09, 0.0, 0, 0, 0, 0.038)); }
  b.add(GEO.sph(16, 12), '#f6d3b6', TRS(0, 0.53, 0, 0, 0, 0, 0.11, 0.12, 0.1));
  for (const s of [-1, 1]) { b.add(GEO.sph(6, 4), '#1d1418', TRS(s * 0.035, 0.55, 0.095, 0, 0, 0, 0.014)); b.add(GEO.sph(8, 6), '#e9677a', TRS(s * 0.06, 0.51, 0.08, 0, 0, 0, 0.022, 0.018, 0.01)); }
  b.add(GEO.box(), '#1d1418', TRS(0, 0.5, 0.1, 0, 0, 0, 0.05, 0.012, 0.01));
  b.add(GEO.cyl(18, false, 1.1), '#1d1418', TRS(0, 0.75, -0.005, 0, 0, 0, 0.11, 0.3, 0.1));
  b.add(GEO.sph(12, 8), '#1d1418', TRS(0, 0.9, -0.005, 0, 0, 0, 0.12, 0.06, 0.11));
  b.add(GEO.torus(0.105, 0.012, 6, 18), '#e0b25c', TRS(0, 0.47, 0.0, Math.PI / 2 - 0.35, 0, 0));
  b.add(lathe([[0, 0], [0.03, 0.03], [0.03, 0.09], [0, 0.12]], 8, 6), '#e33a52', TRS(0.07, 0.86, 0.04, 0, 0, -0.3));
  b.add(GEO.cyl(6), '#6a3a24', TRS(-0.2, 0.32, 0.03, 0, 0, 0.06, 0.016, 0.62, 0.016));
  b.add(GEO.cyl(6), '#cfd4dc', TRS(-0.21, 0.66, 0.035, 0, 0, 0.06, 0.008, 0.1, 0.008));
  body.add(b.build());
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.06, 0.0, 0); body.add(hip);
    const lb = new Batch(MAT.gloss);
    lb.add(GEO.capsule(0.045, 0.24, 3, 8), trous, TRS(0, -0.17, 0));
    lb.add(GEO.cyl(10), '#1d1418', TRS(0, -0.36, 0.0, 0, 0, 0, 0.05, 0.12, 0.05));
    lb.add(GEO.sph(10, 6), '#1d1418', TRS(0, -0.41, 0.04, 0, 0, 0, 0.05, 0.03, 0.08));
    hip.add(lb.build()); legs.push(hip);
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return {
    root, body, legs, a: { t: rnd(0, 3), phase: 0, poke: 0 },
    update(dt, speed) {
      const a = this.a; a.t += dt; a.phase += dt * 9 * speed;
      const s = Math.sin(a.phase);
      this.legs[0].rotation.x = s * 0.6 * Math.min(1, speed); this.legs[1].rotation.x = -s * 0.6 * Math.min(1, speed);
      this.body.position.y = 0.42 + Math.abs(s) * 0.03 * Math.min(1, speed);
      a.poke = Math.max(0, a.poke - dt);
      this.body.rotation.x = Math.sin(a.poke * 10) * 0.25;
    },
  };
}
