/* =====================================================================
   13 · THE TOY PALACE — twelve porcelain pieces, their blueprint ghosts
   Palace-local frame: origin on the dais top, front faces +z.
   ===================================================================== */
const MAT2 = {};
function buildToyMaterials() {
  if (MAT2.ready) return;
  const std = (o) => new THREE.MeshStandardMaterial(o);
  MAT2.checker = std({ map: TEX2.checker, roughness: 0.42 });
  MAT2.felt = new THREE.MeshLambertMaterial({ map: TEX2.felt, vertexColors: true });
  MAT2.sky = new THREE.MeshBasicMaterial({ map: TEX2.sky, side: THREE.BackSide, fog: false, toneMapped: false });
  MAT2.window = std({ vertexColors: true, roughness: 0.12, metalness: 0.15, emissive: '#ffc977', emissiveIntensity: 0.0 });
  MAT2.signs = std({ map: TEX2.signs, roughness: 0.5 });
  MAT2.panel = std({ map: TEX2.panel, roughness: 0.38 });
  MAT2.sheet = new THREE.MeshLambertMaterial({ map: TEX2.sheet, side: THREE.DoubleSide });
  MAT2.cheese = new THREE.MeshLambertMaterial({ map: TEX2.cheese, vertexColors: true });
  MAT2.blueprint = new THREE.MeshBasicMaterial({ map: TEX2.blueprint, toneMapped: false });
  MAT2.cone = new THREE.MeshBasicMaterial({ map: TEX2.cone, color: '#ffd56e', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
  MAT2.coneAlert = new THREE.MeshBasicMaterial({ map: TEX2.cone, color: '#ff6a5a', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
  for (const [m, k] of [[MAT2.checker, 0.35], [MAT2.window, 0.9], [MAT2.signs, 0.3], [MAT2.panel, 0.45]]) m.envMapIntensity = k;
  MAT2.ready = true;
}

/* ---------- shared shapes ---------- */
function archShape(w = 1, h = 1, grow = 0) {
  const s = new THREE.Shape(), r = w / 2 + grow, rise = Math.min(r, h * 0.38), y0 = h - rise;
  s.moveTo(-r, -grow); s.lineTo(r, -grow); s.lineTo(r, y0); s.absellipse(0, y0, r, rise + grow, 0, Math.PI, false); s.closePath();
  return s;
}
const ARCH = {
  glass: () => cached('archGlass', () => new THREE.ShapeGeometry(archShape(1, 1), 16)),
  frame: () => cached('archFrame', () => { const o = archShape(1, 1, 0.09); o.holes.push(archShape(1, 1)); const g = new THREE.ExtrudeGeometry(o, { depth: 0.05, bevelEnabled: false, curveSegments: 16 }); g.translate(0, 0, -0.025); return g; }),
  slab: () => cached('archSlab', () => { const g = new THREE.ExtrudeGeometry(archShape(1, 1), { depth: 1, bevelEnabled: false, curveSegments: 18 }); g.translate(0, 0, -0.5); return g; }),
};
/* square frustum with axis-aligned edges (half-width 1 at the bottom) */
const pyrGeo = (top = 0.6) => cached(`pyr${top}`, () => { const g = new THREE.CylinderGeometry(top * Math.SQRT2, Math.SQRT2, 1, 4, 1); g.rotateY(Math.PI / 4); return g; });
const heartGeo = () => cached('heart', () => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5); s.bezierCurveTo(-0.6, -0.05, -0.55, 0.45, -0.18, 0.42); s.bezierCurveTo(-0.05, 0.41, 0, 0.3, 0, 0.22);
  s.bezierCurveTo(0, 0.3, 0.05, 0.41, 0.18, 0.42); s.bezierCurveTo(0.55, 0.45, 0.6, -0.05, 0, -0.5);
  return new THREE.ShapeGeometry(s, 12);
});

const PC = { wall: '#fbf1e4', wallWarm: '#f7e6d6', pink: '#f3c3cc', pinkDeep: '#e595aa', rose: '#d77b91', gold: '#d9ad5a', door: '#7d1d36', glass: '#bcd6ef', carpet: '#8a2140', roofA: '#ea9fb3', roofB: '#fff1ee' };

/* window on a wall: (x,y,z) bottom centre, facing yaw ry */
function addWindow(P, x, y, z, ry, w = 0.56, h = 1.05, col = PC.glass) {
  P.push(TRS(x, y, z, 0, ry, 0));
  P.glass.add(ARCH.glass(), col, TRS(0, 0, 0.012, 0, 0, 0, w, h, 1));
  P.gold.add(ARCH.frame(), PC.gold, TRS(0, 0, 0.02, 0, 0, 0, w, h, 1));
  P.gold.add(GEO.box(), PC.gold, TRS(0, -0.06, 0.07, 0, 0, 0, w + 0.22, 0.07, 0.14));
  P.gold.add(GEO.box(), PC.gold, TRS(0, h * 0.42, 0.03, 0, 0, 0, w, 0.025, 0.02));
  P.gold.add(GEO.box(), PC.gold, TRS(0, h * 0.45, 0.03, 0, 0, 0, 0.025, h * 0.9, 0.02));
  P.pop();
}
function addPilaster(P, x, z, y0, h, ry = 0, col = PC.pink) {
  P.push(TRS(x, y0, z, 0, ry, 0));
  P.wall.add(roundBox(0.26, h, 0.12, 0.03, 2), col, TRS(0, h / 2, 0));
  P.gold.add(GEO.box(), PC.gold, TRS(0, h - 0.06, 0.02, 0, 0, 0, 0.32, 0.08, 0.16));
  P.gold.add(GEO.box(), PC.gold, TRS(0, 0.05, 0.02, 0, 0, 0, 0.32, 0.08, 0.16));
  P.pop();
}
function addRailing(P, x0, x1, y, z, ry = 0, n = 0) {
  P.push(TRS(0, 0, 0, 0, ry, 0));
  const L = x1 - x0, cnt = n || Math.max(3, Math.round(L / 0.22));
  P.gold.add(GEO.cyl(8), PC.gold, TRS((x0 + x1) / 2, y, z, 0, 0, Math.PI / 2, 0.035, L, 0.035));
  for (let i = 0; i <= cnt; i++) { const x = lerp(x0, x1, i / cnt); P.gold.add(lathe([[0.025, 0], [0.045, 0.08], [0.025, 0.2], [0.04, 0.3], [0.03, y - 0.02]].map(([r, yy]) => [r, Math.min(yy, y)]), 8, 0), PC.gold, TRS(x, 0, z, 0, 0, 0, 1, 1, 1)); }
  P.pop();
}

/* ---------- the twelve pieces ---------- */
const PIECES = [
  { id: 'base', tier: 1, name: '기단', sym: 2, pivot: [0, 0, 0], hint: '선물 상자 안에서 반짝여요' },
  { id: 'stairs', tier: 1, name: '대리석 계단', sym: 1, pivot: [0, 0, 3.1], req: ['base'], hint: '알파벳 블록 꼭대기에 있어요' },
  { id: 'gate', tier: 1, name: '정문', sym: 1, pivot: [0, 0.7, 0.3], req: ['base'], hint: '분수 옆에 떨어져 있어요' },
  { id: 'wingL', tier: 2, name: '왼쪽 날개', sym: 1, pivot: [-2.45, 0.7, 0], hint: '기차역 지붕 위! 나무 상자를 밟고 올라가요' },
  { id: 'wingR', tier: 2, name: '오른쪽 날개', sym: 1, pivot: [2.45, 0.7, 0], hint: '크레인 레버를 당겨 보세요' },
  { id: 'colon', tier: 2, name: '기둥 회랑', sym: 2, pivot: [0, 3.5, 1.9], hint: '꼬마 기차의 화물칸에 실려 있어요. 역에서 기다려요' },
  { id: 'towerL', tier: 3, name: '왼쪽 탑', sym: 1, pivot: [-3.6, 0.7, 2.35], hint: '돌아가는 회전목마 위에 있어요' },
  { id: 'towerR', tier: 3, name: '오른쪽 탑', sym: 1, pivot: [3.6, 0.7, 2.35], hint: '장난감 북을 밟으면 높이 튀어 올라요' },
  { id: 'arch', tier: 3, name: '아치 발코니', sym: 1, pivot: [0, 5.27, 2.7], req: ['colon'], hint: '생쥐 진지 안쪽. 등불 빛을 피해서 가요' },
  { id: 'dome', tier: 4, name: '양파 돔', sym: 4, pivot: [0, 3.5, -0.9], hint: '거대한 오르골의 태엽을 감아 보세요' },
  { id: 'spire', tier: 4, name: '첨탑', sym: 4, pivot: [0, 6.9, -0.9], req: ['dome'], hint: '피아노 건반 계단 위 보면대에 있어요' },
  { id: 'star', tier: 4, name: '꼭대기 별', sym: 2, pivot: [0, 8.5, -0.9], req: ['spire'], hint: '오르골 발레리나의 손끝에서 빛나요' },
];
const TIER_NAMES = ['', '기단과 정문', '날개와 기둥 회랑', '탑과 아치', '돔과 꼭대기 별'];
const PIECE = Object.fromEntries(PIECES.map((p) => [p.id, p]));

function pieceBatches() {
  const P = {
    wall: new Batch(MAT.porcelain), gold: new Batch(MAT.gold), roof: new Batch(MAT.gloss), cloth: new Batch(MAT.satin),
    glass: new Batch(MAT2.window), marble: new Batch(MAT.marble), star: new Batch(MAT.starGold),
  };
  Object.defineProperty(P, 'push', { value: (m) => { for (const k in P) P[k].push(m); }, enumerable: false });
  Object.defineProperty(P, 'pop', { value: () => { for (const k in P) P[k].pop(); }, enumerable: false });
  return P;
}

const PIECE_BUILD = {
  base(P) {
    P.marble.add(roundBox(8.2, 0.56, 6.2, 0.06, 2), '#fbeee8', TRS(0, 0.36, 0));
    P.wall.add(roundBox(8.44, 0.16, 6.44, 0.05, 2), PC.pinkDeep, TRS(0, 0.08, 0));
    P.gold.add(GEO.box(), PC.gold, TRS(0, 0.6, 0, 0, 0, 0, 8.24, 0.05, 6.24));
    P.wall.add(roundBox(8.32, 0.08, 6.32, 0.03, 2), '#fff6ea', TRS(0, 0.66, 0));
    for (let x = -3.6; x <= 3.61; x += 1.2) for (const z of [-3.11, 3.11]) P.gold.add(GEO.sph(10, 8), PC.gold, TRS(x, 0.36, z, 0, 0, 0, 0.13, 0.13, 0.04));
    for (let z = -2.4; z <= 2.41; z += 1.2) for (const x of [-4.11, 4.11]) P.gold.add(GEO.sph(10, 8), PC.gold, TRS(x, 0.36, z, 0, 0, 0, 0.04, 0.13, 0.13));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.gold.add(GEO.sph(10, 8), PC.gold, TRS(sx * 4.15, 0.72, sz * 3.15, 0, 0, 0, 0.12));
  },
  stairs(P) {
    for (let k = 0; k < 5; k++) {
      const yk = 0.7 - 0.14 * k, z = 0.17 + 0.32 * k;
      P.marble.add(roundBox(3.0, yk, 0.34, 0.03, 2), '#fbf1ec', TRS(0, yk / 2, z));
      P.cloth.add(GEO.box(), PC.carpet, TRS(0, yk + 0.008, z, 0, 0, 0, 1.3, 0.016, 0.34));
      P.gold.add(GEO.cyl(8), PC.gold, TRS(0, yk + 0.01, z + 0.15, 0, 0, Math.PI / 2, 0.018, 1.36, 0.018));
    }
    const side = new THREE.Shape(); side.moveTo(0, 0); side.lineTo(1.72, 0); side.lineTo(1.72, 0.26); side.lineTo(0, 0.86); side.closePath();
    const sideGeo = new THREE.ExtrudeGeometry(side, { depth: 0.26, bevelEnabled: false });
    for (const sx of [-1, 1]) {
      P.wall.add(sideGeo, PC.wall, TRS(sx * 1.63 + 0.13, 0, 0, 0, -Math.PI / 2, 0));
      P.wall.add(roundBox(0.34, 1.0, 0.34, 0.04, 2), PC.pink, TRS(sx * 1.63, 0.5, 1.56));
      P.gold.add(GEO.sph(12, 8), PC.gold, TRS(sx * 1.63, 1.12, 1.56, 0, 0, 0, 0.13));
      P.gold.add(tubeGeo([[sx * 1.63, 0.98, 1.5], [sx * 1.63, 1.22, 0.75], [sx * 1.63, 1.46, 0.02]], 0.035, 10, 6), PC.gold);
      for (let i = 0; i < 5; i++) { const z = 1.3 - i * 0.3, top = lerp(0.98, 1.46, (1.5 - z) / 1.48), bottom = lerp(0.26, 0.86, (1.72 - z) / 1.72); P.gold.add(GEO.cyl(6), PC.gold, TRS(sx * 1.63, (top + bottom) / 2, z, 0, 0, 0, 0.022, top - bottom, 0.022)); }
    }
  },
  gate(P) {
    P.wall.add(roundBox(2.6, 2.8, 5.4, 0.05, 2), PC.wall, TRS(0, 1.4, 0));
    for (const sx of [-1, 1]) addPilaster(P, sx * 1.16, 2.72, 0, 2.62);
    P.roof.add(ARCH.slab(), PC.door, TRS(0, 0, 2.72, 0, 0, 0, 1.1, 2.05, 0.06));
    P.gold.add(ARCH.frame(), PC.gold, TRS(0, 0, 2.76, 0, 0, 0, 1.12, 2.06, 1.6));
    P.gold.add(GEO.box(), PC.gold, TRS(0, 0.9, 2.76, 0, 0, 0, 0.02, 1.8, 0.03));
    for (const sx of [-1, 1]) { P.gold.add(GEO.torus(0.06, 0.016, 6, 14), PC.gold, TRS(sx * 0.14, 0.95, 2.78)); for (let r = 0; r < 4; r++) P.gold.add(GEO.sph(6, 4), PC.gold, TRS(sx * 0.32, 0.3 + r * 0.38, 2.77, 0, 0, 0, 0.03)); }
    P.star.add(starGeo(0.24, 0.1, 0.06, 0.03), '#ffd77a', TRS(0, 2.35, 2.76));
    P.gold.add(GEO.box(), PC.gold, TRS(0, 2.62, 0, 0, 0, 0, 2.64, 0.06, 5.44));
    P.wall.add(roundBox(2.74, 0.14, 5.54, 0.04, 2), '#fff6ea', TRS(0, 2.73, 0));
    for (const x of [-0.6, 0.6]) addWindow(P, x, 0.7, -2.72, Math.PI);
    for (const sx of [-1, 1]) P.wall.add(GEO.box(), PC.pink, TRS(sx * 0.75, 1.9, 2.72, 0, 0, 0, 0.22, 0.04, 0.02));
  },
  wing(P, s) {
    P.wall.add(roundBox(2.3, 2.3, 4.8, 0.05, 2), PC.wall, TRS(0, 1.15, 0));
    for (const x of [-0.5, 0.5]) {
      addWindow(P, x, 0.55, 2.41, 0);
      addWindow(P, x, 0.55, -2.41, Math.PI);
      P.cloth.add(roundBox(0.62, 0.14, 0.2, 0.05, 2), '#f2a2b4', TRS(x, 0.42, 2.5));
      for (let k = 0; k < 4; k++) P.cloth.add(GEO.sph(8, 6), pick(['#e65c78', '#f6d3dc', '#ffffff']), TRS(x - 0.22 + k * 0.15, 0.52, 2.52, 0, 0, 0, 0.06));
    }
    for (const z of [-1.4, 0, 1.4]) addWindow(P, s * 1.16, 0.55, z, s * Math.PI / 2);
    addPilaster(P, s * 1.05, 2.42, 0, 2.15); addPilaster(P, -s * 1.05, 2.42, 0, 2.15);
    addPilaster(P, s * 1.17, 2.28, 0, 2.15, s * Math.PI / 2); addPilaster(P, s * 1.17, -2.28, 0, 2.15, s * Math.PI / 2);
    P.gold.add(GEO.box(), PC.gold, TRS(0, 2.2, 0, 0, 0, 0, 2.34, 0.05, 4.84));
    P.wall.add(roundBox(2.44, 0.14, 4.94, 0.04, 2), '#fff6ea', TRS(0, 2.33, 0));
    P.roof.add(pyrGeo(0.55), (x, y, z) => (Math.floor((z + 3) * 2.2) % 2 ? PC.roofA : '#f4bccb'), TRS(0, 2.72, 0, 0, 0, 0, 1.18, 0.66, 2.42));
    P.gold.add(GEO.box(), PC.gold, TRS(0, 3.06, 0, 0, 0, 0, 0.7, 0.05, 2.7));
    for (const z of [-1.2, 0, 1.2]) P.gold.add(GEO.sph(10, 8), PC.gold, TRS(0, 3.12, z, 0, 0, 0, 0.09));
    // balcony on the outer side
    P.push(TRS(s * 1.15, 1.05, 0, 0, s * Math.PI / 2, 0));
    P.marble.add(new THREE.CylinderGeometry(0.62, 0.5, 0.14, 20, 1, false, -Math.PI / 2, Math.PI), '#fbf1ec', TRS(0, 0, 0));
    P.gold.add(GEO.torus(0.6, 0.03, 6, 20, Math.PI), PC.gold, TRS(0, 0.42, 0, Math.PI / 2, 0, 0));
    for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI; P.gold.add(GEO.cyl(6), PC.gold, TRS(Math.cos(a) * 0.6, 0.24, Math.sin(a) * 0.6, 0, 0, 0, 0.02, 0.34, 0.02)); }
    P.roof.add(ARCH.slab(), PC.door, TRS(0, 0.07, 0.02, 0, 0, 0, 0.55, 1.0, 0.05));
    P.pop();
  },
  wingL(P) { this.wing(P, -1); },
  wingR(P) { this.wing(P, 1); },
  colon(P) {
    P.marble.add(roundBox(2.7, 0.16, 2.3, 0.04, 2), '#fbf1ec', TRS(0, 0.08, 0));
    const col = lathe([[0.17, 0], [0.17, 0.06], [0.12, 0.1], [0.1, 0.2], [0.09, 1.1], [0.1, 1.18], [0.15, 1.24], [0.15, 1.28]], 14, 0);
    for (const z of [-0.95, 0.95]) for (const x of [-1.05, -0.35, 0.35, 1.05]) {
      P.wall.add(col, PC.wall, TRS(x, 0.16, z));
      P.gold.add(GEO.torus(0.11, 0.025, 6, 14), PC.gold, TRS(x, 1.36, z, Math.PI / 2, 0, 0));
      P.gold.add(GEO.torus(0.13, 0.025, 6, 14), PC.gold, TRS(x, 0.24, z, Math.PI / 2, 0, 0));
    }
    P.wall.add(roundBox(2.74, 0.2, 2.34, 0.04, 2), PC.wall, TRS(0, 1.54, 0));
    P.gold.add(GEO.box(), PC.gold, TRS(0, 1.5, 0, 0, 0, 0, 2.78, 0.05, 2.38));
    P.wall.add(roundBox(2.8, 0.08, 2.4, 0.03, 2), PC.pink, TRS(0, 1.68, 0));
    for (const z of [-1.0, 1.0]) addRailing(P, -0.85, 0.85, 0.55, z, 0, 8);
    P.cloth.add(GEO.box(), '#f6c9d4', TRS(0, 0.17, 0, 0, 0, 0, 1.9, 0.02, 1.5));
  },
  tower(P, s) {
    P.wall.add(GEO.cyl(28), PC.wall, TRS(0, 2.3, 0, 0, 0, 0, 0.95, 4.6, 0.95));
    for (const y of [1.5, 3.05]) P.wall.add(GEO.torus(0.96, 0.05, 6, 32), PC.pink, TRS(0, y, 0, Math.PI / 2, 0, 0));
    P.gold.add(GEO.torus(0.98, 0.04, 6, 32), PC.gold, TRS(0, 4.5, 0, Math.PI / 2, 0, 0));
    P.wall.add(GEO.cyl(28), '#fff6ea', TRS(0, 4.68, 0, 0, 0, 0, 1.08, 0.2, 1.08));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; P.wall.add(roundBox(0.26, 0.26, 0.2, 0.04, 1), PC.pink, TRS(Math.sin(a) * 0.98, 4.9, Math.cos(a) * 0.98, 0, a, 0)); }
    const roof = lathe([[1.16, 0], [1.02, 0.18], [0.74, 0.62], [0.4, 1.12], [0.12, 1.6], [0.02, 1.78]], 32, 10);
    P.roof.add(roof, (x, y, z) => (Math.floor(((Math.atan2(x, z) + Math.PI) / TAU) * 14) % 2 ? PC.roofA : PC.roofB), TRS(0, 4.78, 0));
    P.gold.add(GEO.torus(1.12, 0.035, 6, 32), PC.gold, TRS(0, 4.8, 0, Math.PI / 2, 0, 0));
    P.gold.add(GEO.cyl(6), PC.gold, TRS(0, 6.85, 0, 0, 0, 0, 0.025, 0.7, 0.025));
    P.gold.add(GEO.sph(12, 8), PC.gold, TRS(0, 6.62, 0, 0, 0, 0, 0.1));
    const flag = new THREE.Shape(); flag.moveTo(0, 0); flag.lineTo(0.62 * s, -0.12); flag.lineTo(0, -0.26); flag.closePath();
    P.cloth.add(new THREE.ShapeGeometry(flag), '#b02f45', TRS(0, 7.18, 0));
    P.cloth.add(new THREE.ShapeGeometry(flag), '#b02f45', TRS(0, 7.18, -0.005, 0, Math.PI, 0));
    // front windows, heart window and a half balcony on the front
    for (const y of [0.55, 2.0]) addWindow(P, 0, y, 0.955, 0, 0.42, 0.85);
    P.glass.add(heartGeo(), '#f6b9c8', TRS(0, 3.75, 0.965, 0, 0, 0, 0.5, 0.5, 1));
    P.gold.add(GEO.torus(0.27, 0.03, 6, 20), PC.gold, TRS(0, 3.73, 0.97));
    addWindow(P, s * 0.955, 2.0, 0, s * Math.PI / 2, 0.42, 0.85);
    P.marble.add(new THREE.CylinderGeometry(1.3, 1.0, 0.12, 24, 1, false, -Math.PI / 2, Math.PI), '#fbf1ec', TRS(0, 1.62, 0));
    P.gold.add(GEO.torus(1.28, 0.03, 6, 24, Math.PI), PC.gold, TRS(0, 1.98, 0, Math.PI / 2, 0, 0));
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; P.gold.add(GEO.cyl(6), PC.gold, TRS(Math.cos(a) * 1.28, 1.81, Math.sin(a) * 1.28, 0, 0, 0, 0.02, 0.34, 0.02)); }
  },
  towerL(P) { this.tower(P, -1); },
  towerR(P) { this.tower(P, 1); },
  arch(P) {
    P.wall.add(ARCH.slab(), PC.wall, TRS(0, 0, -0.05, 0, 0, 0, 2.5, 1.55, 0.36));
    P.gold.add(ARCH.frame(), PC.gold, TRS(0, 0, 0.15, 0, 0, 0, 2.5, 1.56, 1.5));
    P.glass.add(GEO.circle(28), '#f4b6c6', TRS(0, 0.74, 0.14, 0, 0, 0, 0.42, 0.42, 1));
    P.gold.add(GEO.torus(0.43, 0.04, 6, 28), PC.gold, TRS(0, 0.74, 0.15));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; P.gold.add(GEO.box(), PC.gold, TRS(Math.cos(a) * 0.21, 0.74 + Math.sin(a) * 0.21, 0.16, 0, 0, a, 0.42, 0.025, 0.02)); }
    P.gold.add(GEO.sph(10, 8), PC.gold, TRS(0, 0.74, 0.17, 0, 0, 0, 0.07));
    P.marble.add(roundBox(2.6, 0.1, 0.62, 0.03, 2), '#fbf1ec', TRS(0, 0.05, 0.38));
    addRailing(P, -1.2, 1.2, 0.42, 0.64, 0, 12);
    for (const sx of [-1, 1]) {
      P.gold.add(GEO.torus(0.16, 0.035, 6, 18, Math.PI * 1.5), PC.gold, TRS(sx * 1.32, 0.3, 0.12, 0, 0, sx > 0 ? 0 : Math.PI / 2));
      P.wall.add(GEO.sph(10, 8), PC.pink, TRS(sx * 1.3, 1.5, 0.1, 0, 0, 0, 0.13));
    }
    P.star.add(starGeo(0.18, 0.08, 0.05, 0.02), '#ffd77a', TRS(0, 1.62, 0.12));
  },
  dome(P) {
    P.wall.add(GEO.cyl(28), PC.wall, TRS(0, 0.5, 0, 0, 0, 0, 1.2, 1.0, 1.2));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + Math.PI / 8; addWindow(P, Math.sin(a) * 1.2, 0.18, Math.cos(a) * 1.2, a, 0.3, 0.6); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; P.wall.add(roundBox(0.14, 1.0, 0.1, 0.03, 1), PC.pink, TRS(Math.sin(a) * 1.21, 0.5, Math.cos(a) * 1.21, 0, a, 0)); }
    P.gold.add(GEO.torus(1.22, 0.06, 8, 32), PC.gold, TRS(0, 1.02, 0, Math.PI / 2, 0, 0));
    const bulb = lathe([[1.22, 1.04], [1.42, 1.38], [1.5, 1.72], [1.36, 2.12], [1.02, 2.5], [0.58, 2.84], [0.22, 3.12], [0.06, 3.36], [0.01, 3.42]], 40, 24);
    P.roof.add(bulb, (x, y, z) => (Math.floor(((Math.atan2(x, z) + Math.PI) / TAU) * 16) % 2 ? '#ec9db2' : '#fff3ee'), TRS(0, 0, 0));
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; P.gold.add(GEO.sph(6, 4), PC.gold, TRS(Math.sin(a) * 1.5, 1.72, Math.cos(a) * 1.5, 0, 0, 0, 0.05)); }
  },
  spire(P) {
    P.gold.add(lathe([[0.26, 0], [0.26, 0.05], [0.14, 0.1], [0.2, 0.22], [0.2, 0.32], [0.08, 0.44], [0.06, 0.62], [0.13, 0.72], [0.13, 0.82], [0.05, 0.92], [0.035, 1.25], [0.0, 1.62]], 18, 30), PC.gold, TRS(0, 0, 0));
    P.wall.add(GEO.torus(0.12, 0.03, 6, 16), PC.pink, TRS(0, 0.62, 0, Math.PI / 2, 0, 0));
  },
  star(P) {
    P.gold.add(lathe([[0.14, 0], [0.16, 0.05], [0.08, 0.12], [0.05, 0.2]], 14, 0), PC.gold, TRS(0, 0, 0));
    P.star.add(starGeo(0.62, 0.27, 0.16, 0.06), '#ffd77a', TRS(0, 0.8, 0));
  },
};

/* geometry merge for ghosts (positions + normals only) */
function mergeGeos(list) {
  let nv = 0, ni = 0;
  for (const { geo } of list) { nv += geo.attributes.position.count; ni += geo.index ? geo.index.count : geo.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), idx = new Uint32Array(ni);
  let vo = 0, io = 0;
  const v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
  for (const { geo, m } of list) {
    const P = geo.attributes.position, N = geo.attributes.normal;
    nm.getNormalMatrix(m);
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(m); pos.set([v.x, v.y, v.z], (vo + i) * 3);
      n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nrm.set([n.x, n.y, n.z], (vo + i) * 3);
    }
    if (geo.index) for (let k = 0; k < geo.index.count; k++) idx[io + k] = geo.index.getX(k) + vo;
    else for (let k = 0; k < P.count; k++) idx[io + k] = vo + k;
    vo += P.count; io += geo.index ? geo.index.count : P.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

/* blueprint hologram */
const GHOST_VERT = /* glsl */`
  varying vec3 vN; varying vec3 vW;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const GHOST_FRAG = /* glsl */`
  uniform float uTime; uniform float uAlpha; uniform float uPulse; uniform vec3 uColor;
  varying vec3 vN; varying vec3 vW;
  void main() {
    vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
    float f = 1.0 - abs(dot(N, V));
    float rim = pow(f, 2.0);
    float scan = smoothstep(0.9, 1.0, sin(vW.y * 5.0 - uTime * 2.2) * 0.5 + 0.5);
    vec3 q = abs(fract(vW * 1.25) - 0.5), n = abs(N);
    float gl = n.x > 0.6 ? max(q.y, q.z) : n.y > 0.6 ? max(q.x, q.z) : max(q.x, q.y);
    float grid = smoothstep(0.44, 0.49, gl);
    float pulse = 0.78 + 0.22 * sin(uTime * 4.0) * uPulse;
    float a = (0.04 + rim * 0.62 + scan * 0.14 + grid * 0.3) * uAlpha * pulse;
    vec3 col = mix(uColor, vec3(1.0), 0.2 + rim * 0.45 + grid * 0.2);
    gl_FragColor = vec4(col, clamp(a, 0.0, 0.92));
    #include <colorspace_fragment>
  }`;
function ghostMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: FX.uniforms.uTime, uAlpha: { value: 0.3 }, uPulse: { value: 0 }, uColor: { value: new THREE.Color('#9fd8ff') } },
    vertexShader: GHOST_VERT, fragmentShader: GHOST_FRAG, transparent: true, depthWrite: false, fog: false,
  });
}

/* one piece: full-size group (pivot at bottom centre), its ghost, sizes for miniatures */
function buildPiece(def) {
  const P = pieceBatches();
  PIECE_BUILD[def.id](P);
  const group = new THREE.Group(), parts = [];
  for (const k in P) {
    if (P[k].empty) continue;
    const m = P[k].build({ cast: true, receive: true });
    group.add(m); parts.push({ geo: m.geometry, m: new THREE.Matrix4() });
  }
  const ghostGeo = mergeGeos(parts);
  const ghost = new THREE.Mesh(ghostGeo, ghostMaterial());
  ghost.renderOrder = 12; ghost.userData.piece = def.id;
  const bb = ghostGeo.boundingBox, size = bb.getSize(V3());
  const maxDim = Math.max(size.x, size.y, size.z);
  return { def, group, ghost, size, center: bb.getCenter(V3()), maxDim };
}

/* storybook thumbnails of every piece, rendered once */
function renderPieceThumbs(pieces) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#f4e7cf');
  studio.environment = scene.environment;
  studio.add(new THREE.HemisphereLight('#fff4ea', '#c99aa6', 1.5));
  const d = new THREE.DirectionalLight('#fff1e0', 2.3); d.position.set(-3, 5, 6); studio.add(d);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 200);
  const S = 160, out = {};
  const cv = makeCanvas(S, S), c2 = cv.getContext('2d');
  const size = new THREE.Vector2(); renderer.getDrawingBufferSize(size);
  const pr = renderer.getPixelRatio();
  for (const pc of pieces) {
    const g = pc.group, parent = g.parent, pos = g.position.clone(), rot = g.rotation.y, scl = g.scale.clone(), vis = g.visible;
    studio.add(g); g.position.set(0, 0, 0); g.rotation.y = 0; g.scale.setScalar(1); g.visible = true;
    g.updateMatrixWorld(true);
    const c = pc.center, r = Math.max(pc.size.x, pc.size.y * 1.05, pc.size.z) * 0.62 + 0.15;
    const dist = r / Math.tan(THREE.MathUtils.degToRad(15)) * 0.98;
    const dir = V3(0.55, 0.42, 1).normalize();
    cam.position.set(c.x + dir.x * dist, c.y + dir.y * dist, c.z + dir.z * dist); cam.lookAt(c.x, c.y, c.z);
    renderer.setViewport(0, 0, S / pr, S / pr); renderer.setScissor(0, 0, S / pr, S / pr); renderer.setScissorTest(true);
    renderer.render(studio, cam);
    c2.clearRect(0, 0, S, S);
    c2.drawImage(renderer.domElement, 0, size.y - S, S, S, 0, 0, S, S);
    out[pc.def.id] = cv.toDataURL('image/png');
    renderer.setScissorTest(false);
    if (parent) parent.add(g);
    g.position.copy(pos); g.rotation.y = rot; g.scale.copy(scl); g.visible = vis;
  }
  renderer.setViewport(0, 0, size.x / pr, size.y / pr);
  return out;
}
