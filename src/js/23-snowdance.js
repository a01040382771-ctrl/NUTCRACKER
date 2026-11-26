/* =====================================================================
   23 · THE SNOWFLAKES' WALTZ — a corps de ballet before the gate (finale of chapter III)
   The corps is drawn instanced: one draw call per body part for all the dancers together.
   Steps and formations follow the music's bar clock (DanceMusic), never the frame time,
   so they stay on the beat at any frame rate and stop together with the music.
   ===================================================================== */

/* ---------------- ballet arms and steps on the doll rig ---------------- */
const ARMS = {                 // shoulder x, shoulder z (left), shoulder x, shoulder z (right), elbows
  low: [-0.15, 0.32, -0.15, -0.32, -0.42, -0.42],
  first: [-1.1, 0.42, -1.1, -0.42, -0.72, -0.72],
  second: [-0.2, 1.35, -0.2, -1.35, -0.28, -0.28],
  fifth: [-0.08, 2.75, -0.08, -2.75, -0.8, -0.8],
  upL: [-0.08, 2.7, -0.2, -1.3, -0.78, -0.3],
  upR: [-0.2, 1.3, -0.08, -2.7, -0.3, -0.78],
  arab: [-1.9, 0.5, 0.35, -1.2, -0.18, -0.25],
};
function newPose(P) {
  P = P || {};
  return Object.assign(P, { by: 0, lean: 0, twist: 0, roll: 0, spin: 0, lsx: -0.15, lsz: 0.32, rsx: -0.15, rsz: -0.32, lel: -0.42, rel: -0.42, llx: 0, llz: 0.05, rlx: 0, rlz: -0.05, hx: 0, hy: 0, hz: 0, flare: 1 });
}
function setArms(P, name, k = 1) {
  const A = ARMS[name];
  P.lsx = lerp(P.lsx, A[0], k); P.lsz = lerp(P.lsz, A[1], k); P.rsx = lerp(P.rsx, A[2], k); P.rsz = lerp(P.rsz, A[3], k); P.lel = lerp(P.lel, A[4], k); P.rel = lerp(P.rel, A[5], k);
}
function applyPose(d, P, t) {
  d.body.position.y = d.C.hip + P.by;
  d.body.rotation.set(P.lean, P.twist, P.roll);
  d.armL.sh.rotation.set(P.lsx, 0, P.lsz); d.armR.sh.rotation.set(P.rsx, 0, P.rsz);
  d.armL.el.rotation.x = P.lel; d.armR.el.rotation.x = P.rel;
  d.legL.rotation.set(P.llx, 0, P.llz); d.legR.rotation.set(P.rlx, 0, P.rlz);
  d.head.rotation.set(P.hx - P.lean * 0.4, P.hy, P.hz);
  d.skirt.scale.set(P.flare, 1, P.flare); d.skirt.rotation.z = -P.roll * 1.5;
  if (d.wings) { const f = Math.sin(t * 9) * 0.25; d.wings.children[0].rotation.y = -0.5 - f; d.wings.children[1].rotation.y = 0.5 + f; }
}
const Step = {
  /* balancé: down on one, up on two and three, swaying to alternate sides with the arms following */
  balance(P, f, n, dir = 1) {
    const s = (n % 2 ? 1 : -1) * dir, down = f < 0.34 ? Math.sin((f / 0.34) * Math.PI) : 0, up = f >= 0.34 ? Math.sin(((f - 0.34) / 0.66) * Math.PI) : 0;
    P.by += -0.06 * down + 0.035 * up;
    P.roll += 0.07 * s * Math.sin(f * Math.PI); P.twist += 0.16 * s; P.hy += 0.28 * s; P.hz += 0.1 * s;
    const kick = 0.22 * Math.sin(Math.min(1, f / 0.34) * Math.PI);
    if (s > 0) P.llz += kick; else P.rlz -= kick;
    setArms(P, s > 0 ? 'upL' : 'upR', 0.85);
  },
  /* bourrée: tiny quick steps on pointe */
  bourree(P, t, arms = 'second') {
    const w = Math.sin(t * 24);
    P.llx += 0.1 * w; P.rlx -= 0.1 * w; P.by += 0.03 + 0.012 * Math.abs(w);
    setArms(P, arms, 0.9);
  },
  /* one turn with the working foot at the knee (k: 0 → 1 over the turn) */
  pirouette(P, k, arms = 'first') {
    const e = Math.sin(clamp(k, 0, 1) * Math.PI);
    P.spin += Ease.inOut(clamp(k, 0, 1)) * TAU;
    P.rlx = lerp(P.rlx, -0.78, e); P.rlz = lerp(P.rlz, -0.38, e);
    P.by += 0.045 * e; P.flare = lerp(P.flare, 1.22, e);
    setArms(P, arms, e);
  },
  arabesque(P, e) {
    P.rlx = lerp(P.rlx, 1.15, e); P.lean += 0.3 * e; P.by += 0.03 * e; P.hx -= 0.12 * e;
    setArms(P, 'arab', e);
  },
  /* grand jeté: a leap with the legs split (k: 0 → 1 over the leap) */
  jete(P, k) {
    const h = Math.sin(clamp(k, 0, 1) * Math.PI);
    P.by += 0.45 * h; P.llx = lerp(P.llx, -1.25, h); P.rlx = lerp(P.rlx, 1.0, h);
    P.lean -= 0.06 * h; P.flare = lerp(P.flare, 1.16, h);
    setArms(P, 'second', h);
  },
  kneel(P, e) { P.by -= 0.34 * e; P.llx = lerp(P.llx, -1.3, e); P.rlx = lerp(P.rlx, 1.4, e); P.lean += 0.14 * e; P.flare = lerp(P.flare, 1.14, e); },
  reverence(P, e) { P.by -= 0.1 * e; P.rlx = lerp(P.rlx, 0.55, e); P.hx += 0.3 * e; P.lean += 0.12 * e; P.flare = lerp(P.flare, 1.08, e); setArms(P, 'second', e * 0.7); },
  /* slow port de bras, like snow drifting down */
  float(P, t, k = 1) {
    const u = 0.5 + 0.5 * Math.sin(t * 1.3);
    setArms(P, 'second', k);
    P.lsz = lerp(P.lsz, lerp(1.2, 2.6, u), k); P.rsz = lerp(P.rsz, -lerp(2.6, 1.2, u), k); P.hz += 0.1 * Math.sin(t * 1.3) * k;
  },
};

/* ---------------- formations (stage coordinates: x across, z towards the gate; yaw 0 faces the gate) ----------------
   Each takes a slot (0 … n-1). At every change of formation the dancers are matched to the nearest free slots,
   so nobody has to cross the stage through the others. */
const FORM = {
  wings(s, n, b, o) { const side = s % 2 ? 1 : -1, m = n / 2, j = Math.floor(s / 2); o.x = side * 10.5; o.z = lerp(-1.6, 3.6, j / (m - 1)); o.yaw = side > 0 ? -Math.PI / 2 : Math.PI / 2; return o; },
  /* one line through the centre that turns like the sails of a windmill */
  windmill(s, n, b, o) {
    const side = s % 2 ? 1 : -1, m = n / 2, j = Math.floor(s / 2), th = 0.62 + Math.PI * smoothstep(4.6, 12, b), a = th + (side > 0 ? 0 : Math.PI), r = 1.3 + j * (4.05 / (m - 1));
    o.x = Math.sin(a) * r; o.z = Math.cos(a) * r; o.yaw = Math.PI; return o;
  },
  circle(s, n, b, o) { const a = 0.62 + (TAU / n) * (s - (n - 1) / 2) + (b - 12) * 0.1; o.x = Math.sin(a) * 4.2; o.z = Math.cos(a) * 4.2; o.yaw = Math.atan2(-o.x, -o.z); return o; },
  /* six arms of a snowflake, two dancers each, slowly turning */
  star(s, n, b, o) { const m = n / 2, k = Math.floor(s / 2), a = 1.42 + (TAU / m) * k + (b - 20) * (Math.PI / 3 / 12), r = s % 2 ? 4.4 : 2.2; o.x = Math.sin(a) * r; o.z = Math.cos(a) * r; o.yaw = a; return o; },
  /* a horseshoe open towards the audience, everyone turned to the snow fairy (as a corps frames a soloist on stage) */
  ring(s, n, b, o) { const a = -2.25 + (4.5 * s) / (n - 1); o.x = Math.sin(a) * 4.6; o.z = Math.cos(a) * 4.6 + 0.4; o.yaw = Math.atan2(-o.x, -(o.z - 0.25)); return o; },
  /* two circles turning against each other */
  counter(s, n, b, o) {
    const m = n / 2, k = Math.floor(s / 2), inner = s % 2 === 0, d = Math.max(0, b - 45);
    const a = inner ? 2.47 + (TAU / m) * k + d * 0.5 : 2.47 + (TAU / m) * k + Math.PI / m - d * 0.42, r = inner ? 2.4 : 4.6;
    o.x = Math.sin(a) * r; o.z = Math.cos(a) * r; o.yaw = a + (inner ? Math.PI / 2 : -Math.PI / 2); return o;
  },
  /* a V that opens towards the gate, the snow fairy at its point */
  wedge(s, n, b, o) { const side = s % 2 ? 1 : -1, m = n / 2, j = Math.floor(s / 2), u = j / (m - 1); o.x = side * (1.4 + 3.0 * u); o.z = -0.6 + 3.9 * u; o.yaw = Math.PI; return o; },
  /* everyone whirls in towards the snow fairy, faster and faster */
  spiral(s, n, b, o) {
    const k = smoothstep(57, 60.6, b), d = Math.max(0, b - 57), a = 0.3 + (TAU / n) * s + d * d * 0.18 + d * 0.3, r = lerp(4.4, 2.05 + 0.35 * (s % 2), k);
    o.x = Math.sin(a) * r; o.z = Math.cos(a) * r; o.yaw = a + Math.PI / 2; return o;
  },
  /* the last picture: a kneeling arc and a standing arc behind her, both open towards the audience */
  tableau(s, n, b, o) {
    const m = n / 2, k = Math.floor(s / 2), inner = s % 2 === 0, span = inner ? 3.6 : 4.4, r = inner ? 2.3 : 3.7, a = -span / 2 + (span * k) / (m - 1);
    o.x = Math.sin(a) * r; o.z = Math.cos(a) * r + 0.3; o.yaw = Math.atan2(-o.x, -(o.z - 0.25)); return o;
  },
};
/* bars: theme 0–20 · variation 20–32 · hush 32–45 · finale 45–64 */
const DANCE_PLAN = [
  { b: -99, f: 'windmill', enter: true },
  { b: 12, f: 'circle', tr: 2.2 },
  { b: 20, f: 'star', tr: 2.2 },
  { b: 32, f: 'ring', tr: 2.2, cart: true },
  { b: 45, f: 'counter', tr: 1.6, cart: true },
  { b: 51, f: 'wedge', tr: 1.8, cart: true },
  { b: 57, f: 'spiral', tr: 1.2, cart: true },
  { b: 61, f: 'tableau', tr: 1.6, cart: true },
];

/* steps of the corps: g is the dancer's group (inner/outer ring, or one line/the other) */
function corpsPose(g, b, t, P) {
  const n = Math.floor(b), f = b - n;
  if (b < 4.6) { Step.bourree(P, t + g * 0.4, 'second'); P.hz += 0.08 * Math.sin(t * 2 + g); return; }
  if (b < 12) { Step.balance(P, f, n, g ? -1 : 1); return; }
  if (b < 20) {
    if (n === 15 || n === 19) { Step.pirouette(P, f, 'fifth'); return; }
    if (b < 14.2) { Step.bourree(P, t, 'second'); return; }
    Step.balance(P, f, n, 1); return;
  }
  if (b < 32) {
    if (b < 22.2) { Step.bourree(P, t, 'fifth'); return; }
    if (n === 31) { Step.pirouette(P, f, 'fifth'); return; }
    if (((n - 22) % 2 === 0) === (g === 0)) Step.arabesque(P, Math.sin(Math.min(1, f * 1.15) * Math.PI)); else Step.bourree(P, t, 'second');
    return;
  }
  if (b < 45) { Step.kneel(P, smoothstep(33.5, 36, b) * (1 - smoothstep(41.5, 44, b))); Step.float(P, t + g * 0.6, 1); return; }
  if (b < 51) {
    if (b < 46.6) { Step.bourree(P, t, 'second'); return; }
    if ((n - 45) % 2 === 1) Step.pirouette(P, f, 'first'); else Step.balance(P, f, n, g ? -1 : 1);
    return;
  }
  if (b < 57) {
    if (b < 52.8) { Step.bourree(P, t, 'second'); return; }
    if (((n - 53) % 2 === 0) === (g === 0)) Step.jete(P, f); else Step.balance(P, f, n, 1);
    return;
  }
  if (b < 61) { Step.pirouette(P, (f * 2) % 1, 'fifth'); return; }
  const e = smoothstep(61.2, 62.8, b);
  if (g === 0) { Step.kneel(P, e); setArms(P, 'fifth', e); } else { setArms(P, 'upL', e); P.rlx = lerp(P.rlx, 0.35, e); P.by += 0.03 * e; }
}
/* the snow fairy dances the solo at the centre */
function soloPose(b, t, P, o) {
  const n = Math.floor(b), f = b - n;
  o.x = 0; o.z = 0.25; o.yaw = Math.PI;
  if (b < 4.6) {
    Step.reverence(P, smoothstep(0.3, 1.2, b) * (1 - smoothstep(2.4, 3.4, b))); setArms(P, 'second', 0.6);
    if (b > 3.2) Step.pirouette(P, smoothstep(3.2, 4.5, b), 'fifth');
    return;
  }
  if (b < 12) { Step.pirouette(P, Ease.inOut(((b - 4.6) % 2) / 2), 'fifth'); return; }
  if (b < 20) {
    if (n === 13 || n === 17) { Step.arabesque(P, Math.sin(f * Math.PI)); o.yaw = Math.PI - 0.6; } else if (n === 15 || n === 19) Step.pirouette(P, f, 'fifth'); else Step.balance(P, f, n, 1);
    return;
  }
  if (b < 26) { Step.arabesque(P, smoothstep(20, 20.8, b)); o.yaw = Math.PI + ((b - 20) / 6) * TAU; return; }   // promenade in arabesque
  if (b < 32) { if (n === 31) Step.jete(P, f); else Step.pirouette(P, f, 'first'); return; }                   // fouettés
  if (b < 45) {
    Step.float(P, t, 1);
    const up = smoothstep(37, 39, b) * (1 - smoothstep(40.5, 42, b)); setArms(P, 'fifth', up); P.by += 0.03 * up;   // reaching for the snow
    if (b > 42) Step.pirouette(P, smoothstep(42, 44.6, b), 'fifth'); else Step.arabesque(P, 0.45 * Math.sin((b - 32) * 0.7) ** 2);
    return;
  }
  if (b < 51) { Step.pirouette(P, f, 'fifth'); return; }
  if (b < 57) { o.z = lerp(0.25, -1.9, smoothstep(52.4, 53.6, b)); if ((n - 51) % 2 === 1) Step.jete(P, f); else Step.balance(P, f, n, 1); return; }
  if (b < 61) { o.z = lerp(-1.9, 0.25, smoothstep(57, 58.2, b)); Step.pirouette(P, (f * 2) % 1, 'fifth'); return; }
  Step.arabesque(P, smoothstep(61.2, 62.4, b)); o.yaw = Math.PI - 0.5;
}

/* camera keys in stage coordinates, by bar: always inside the clearing (r ≤ 8.5) or above the path, never among the trees */
const DANCE_CAM = [
  { b: -2, p: [-1.6, 2.9, -8.4], t: [0, 1.25, 0.6] },    // over Clara's shoulder
  { b: 6, p: [0.5, 3.6, -8.4], t: [0, 1.3, 0.6] },       // straight on: the line of dancers turning
  { b: 13, p: [-6.0, 3.2, -5.8], t: [0, 1.25, 0.2] },    // from the side: the ring
  { b: 19.5, p: [-5.6, 7.8, -6.4], t: [0, 0.6, 0.6] },   // rising: the snowflake star
  { b: 26, p: [5.4, 8.4, -6.0], t: [0, 0.5, 0.4] },
  { b: 32, p: [4.0, 2.9, -7.0], t: [0, 1.15, 0.2] },     // the hush: low, over the kneeling ring
  { b: 39, p: [-3.6, 2.7, -7.2], t: [0, 1.3, 0.2] },
  { b: 45, p: [-5.8, 2.9, -6.0], t: [0, 1.25, 0.2] },    // the finale: wheeling round
  { b: 51, p: [5.6, 3.6, -6.2], t: [0, 1.3, 0.4] },
  { b: 57, p: [0.4, 5.6, -8.4], t: [0, 1.4, 0.8] },
  { b: 63, p: [0.2, 3.4, -8.5], t: [0, 1.7, 1.6] },      // the last picture with the gate behind
  { b: 99, p: [0.2, 3.4, -8.5], t: [0, 1.7, 1.6] },
];
function camKey(b, out, which) {
  const K = DANCE_CAM; let i = 0;
  while (i < K.length - 2 && b >= K[i + 1].b) i++;
  const u = clamp((b - K[i].b) / (K[i + 1].b - K[i].b), 0, 1), p0 = K[Math.max(0, i - 1)][which], p1 = K[i][which], p2 = K[i + 1][which], p3 = K[Math.min(K.length - 1, i + 2)][which];
  const u2 = u * u, u3 = u2 * u, cr = (a, b1, c, d) => 0.5 * (2 * b1 + (-a + c) * u + (2 * a - 5 * b1 + 4 * c - d) * u2 + (-a + 3 * b1 - 3 * c + d) * u3);
  return out.set(cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1]), cr(p0[2], p1[2], p2[2], p3[2]));
}

/* optimal assignment (Hungarian method) of rows to columns for a square cost matrix: returns col of each row */
function assignShortest(cost) {
  const n = cost.length, INF = 1e18, u = new Array(n + 1).fill(0), v = new Array(n + 1).fill(0), p = new Array(n + 1).fill(0), way = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i; let j0 = 0;
    const minv = new Array(n + 1).fill(INF), used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0]; let delta = INF, j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) { if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta; }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const res = new Array(n);
  for (let j = 1; j <= n; j++) res[p[j] - 1] = j - 1;
  return res;
}

/* ---------------- the corps: two posed template dolls, copied to every dancer per body part ---------------- */
const _dm = new THREE.Matrix4(), _dm2 = new THREE.Matrix4(), _dq = new THREE.Quaternion(), _dqf = new THREE.Quaternion().setFromAxisAngle(V3(1, 0, 0), -Math.PI / 2), _dp = V3(), _ds = V3(), _dup = V3(0, 1, 0);
const Corps = {
  group: null, tpl: [], lists: [], inst: [], blobs: null, cap: 0, n: 0,
  build(root, cap) {
    this.cap = cap;
    this.group = new THREE.Group(); this.group.name = 'corps'; this.group.visible = false; root.add(this.group);
    this.tpl = [buildDoll('snowflake', { lod: 1 }), buildDoll('snowflake', { lod: 1 })];
    this.lists = this.tpl.map((d) => { const L = []; d.root.traverse((o) => { if (o.isMesh && o !== d.wand) L.push(o); }); return L; });
    this.inst = this.lists[0].map((m) => {
      const im = new THREE.InstancedMesh(m.geometry, m.material, cap);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.renderOrder = m.renderOrder;
      this.group.add(im); return im;
    });
    this.blobs = new THREE.InstancedMesh(GEO.plane(), MAT.shadow, cap);
    this.blobs.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.blobs.frustumCulled = false; this.blobs.renderOrder = 2; this.group.add(this.blobs);
    for (const d of this.tpl) d.root.updateMatrixWorld(true);
    this.setCount(cap);
  },
  setCount(n) { this.n = n; for (const im of this.inst) im.count = n; this.blobs.count = n; },
  pose(g, P, t) { applyPose(this.tpl[g], P, t); this.tpl[g].root.updateMatrixWorld(true); },
  write(i, g, x, y, z, yaw, s) {
    _dq.setFromAxisAngle(_dup, yaw); _dm.compose(_dp.set(x, y, z), _dq, _ds.set(s, s, s));
    const L = this.lists[g];
    for (let k = 0; k < L.length; k++) { _dm2.multiplyMatrices(_dm, L[k].matrixWorld); this.inst[k].setMatrixAt(i, _dm2); }
    _dm2.compose(_dp.set(x, 0.024, z), _dqf, _ds.set(0.82 * s, 0.82 * s, 1)); this.blobs.setMatrixAt(i, _dm2);
  },
  flush() { for (const im of this.inst) im.instanceMatrix.needsUpdate = true; this.blobs.instanceMatrix.needsUpdate = true; },
  triangles() { let t = 0; for (const im of this.inst) { const g = im.geometry; t += (g.index ? g.index.count : g.attributes.position.count) / 3; } return Math.round(t); },
};

/* ---------------- stage light: a frost ring on the snow, soft beams, a whirl of snow ---------------- */
function stageGlowTex() {
  const S = 256, cv = makeCanvas(S, S), g = cv.getContext('2d'), c = S / 2;
  const grd = g.createRadialGradient(c, c, 0, c, c, c);
  grd.addColorStop(0, 'rgba(190,220,255,0.30)'); grd.addColorStop(0.55, 'rgba(165,200,255,0.14)'); grd.addColorStop(0.83, 'rgba(225,240,255,0.55)'); grd.addColorStop(0.9, 'rgba(200,225,255,0.16)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  g.strokeStyle = 'rgba(235,245,255,0.38)'; g.lineWidth = 2; g.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * S * 0.38, c + Math.sin(a) * S * 0.38); g.stroke();
    for (let j = 1; j < 4; j++) { const r = S * 0.095 * j, bx = c + Math.cos(a) * r, by = c + Math.sin(a) * r; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(a + s * 0.7) * S * (0.06 - j * 0.01), by + Math.sin(a + s * 0.7) * S * (0.06 - j * 0.01)); g.stroke(); } }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function beamTex() {
  const cv = makeCanvas(4, 128), g = cv.getContext('2d');
  for (let y = 0; y < 128; y++) { const v = 1 - y / 127, a = smoothstep(0, 0.12, v) * (0.3 + 0.5 * v) * smoothstep(1, 0.55, v); g.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; g.fillRect(0, y, 4, 1); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const VORTEX_VERT = /* glsl */`
  attribute vec4 aSeed; // radius, angle, height, speed (0..1)
  uniform float uT; uniform float uScale; uniform float uR; uniform float uH; uniform float uDense;
  varying float vAlpha; varying float vRot;
  void main() {
    float r = mix(0.6, uR, aSeed.x);
    float a = aSeed.y * 6.2831853 + uT * (0.35 + 0.65 * aSeed.w) * (2.4 / (1.0 + r * 0.35));
    float h = uH - mod(uH * (1.0 - aSeed.z) + uT * (0.5 + 0.7 * aSeed.w), uH);
    vec3 p = vec3(sin(a) * r, h, cos(a) * r);
    vAlpha = step(aSeed.w, uDense) * smoothstep(0.0, 0.8, h) * smoothstep(uH, uH - 1.5, h);
    vRot = uT * (aSeed.w - 0.5) * 3.0 + aSeed.y * 6.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (0.08 + 0.1 * aSeed.x) * uScale / max(0.1, -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
function makeVortex(count, R, H) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count * 4), rr = mulberry32(731);
  for (let i = 0; i < count; i++) seed.set([Math.sqrt(rr()), rr(), rr(), rr()], i * 4);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: TEX.particles }, uT: { value: 0 }, uScale: FX.uniforms.uScale, uR: { value: R }, uH: { value: H }, uDense: { value: 0 }, uOpacity: { value: 0.95 }, uColor: { value: new THREE.Color('#ffffff') }, uCell: { value: CELL.snow } },
    vertexShader: VORTEX_VERT, fragmentShader: SNOW_FRAG, transparent: true, depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 17;
  return pts;
}

/* ---------------- the performance ---------------- */
const _dw = V3(), _dw2 = V3(), _dct = V3(), _dcp = V3();
const Dance = {
  W3: null, active: false, running: false, skipping: false, camOn: false, n: 0, t: 0, beta: -1, holdBeta: null, bowK: 0,
  fade: [], spin: [0, 0], P: [newPose(), newPose()], Ps: newPose(), slots: [], fx: {}, fxK: 0, base: null, done: null, _res: null, cues: {},
  build(W3) {
    this.W3 = W3;
    Corps.build(W3.root, SNOW_DANCE.corps);
    const st = W3.stage, fx = this.fx, root = new THREE.Group(); root.name = 'stagefx'; root.visible = false;
    root.position.set(st.x, 0, st.z); root.rotation.y = st.yaw; W3.root.add(root); fx.root = root;
    fx.disc = new THREE.Mesh(new THREE.PlaneGeometry(13.4, 13.4), new THREE.MeshBasicMaterial({ map: stageGlowTex(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
    fx.disc.rotation.x = -Math.PI / 2; fx.disc.position.y = 0.11; fx.disc.renderOrder = 2; root.add(fx.disc);
    const bm = new THREE.MeshBasicMaterial({ map: beamTex(), color: '#dbe9ff', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false });
    const bg = new THREE.CylinderGeometry(0.25, 2.2, 12, 20, 1, true); bg.translate(0, 6, 0);
    fx.beams = [[0, 0.25, 0, 0], [-3.6, 1.2, 0.12, 0.05], [3.6, 1.2, -0.12, 0.05]].map(([x, z, rz, rx]) => { const m = new THREE.Mesh(bg, bm); m.position.set(x, 0, z); m.rotation.set(rx, 0, rz); m.renderOrder = 16; root.add(m); return m; });
    fx.beamMat = bm;
    fx.vortex = makeVortex(DEVICE.mobile ? 340 : 620, st.r + 0.8, 9); root.add(fx.vortex);
    fx.rim = makeGlowPoints(Array.from({ length: 30 }, (_, i) => { const a = (i / 30) * TAU, r = st.r + 0.7 + (i % 3) * 0.25; return { p: [Math.sin(a) * r, 0.25 + (i % 5) * 0.22, Math.cos(a) * r], c: pick(['#dff0ff', '#ffffff', '#cfe4ff', '#fff1c8']), s: 0.7 + (i % 4) * 0.15, tw: 0.8 }; }), { boost: 1 });
    root.add(fx.rim);
    const L = W3.lights; this.base = { hemi: L.hemi.intensity, key: L.key.intensity, rim: L.rim.intensity };
  },
  get cap() { return Corps.cap; },
  corpsCount() { return Perf.quality === 'low' || DEVICE.lowMem ? SNOW_DANCE.corpsLite : SNOW_DANCE.corps; },

  /* slot of every dancer in every formation. At each change the dancers take the slots that make the total walk
     shortest (an optimal assignment): with that, no two straight paths cross. */
  plan(n) {
    const P = DANCE_PLAN, slots = [Array.from({ length: n }, (_, i) => i)], a = { x: 0, z: 0, yaw: 0 }, c = { x: 0, z: 0, yaw: 0 };
    for (let k = 1; k < P.length; k++) {
      const b0 = P[k].b, from = [], to = [];
      for (let i = 0; i < n; i++) { FORM[P[k - 1].f](slots[k - 1][i], n, b0, a); from.push([a.x, a.z]); }
      for (let s = 0; s < n; s++) { FORM[P[k].f](s, n, b0, c); to.push([c.x, c.z]); }
      slots.push(assignShortest(from.map((p) => to.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1])))));
    }
    return slots;
  },
  formation(b) { let k = DANCE_PLAN.length - 1; while (k > 0 && b < DANCE_PLAN[k].b) k--; return k; },
  /* where dancer i stands at bar b (stage coordinates) */
  place(i, b, o) {
    const n = this.n, k = this.formation(b), p = DANCE_PLAN[k], s = this.slots[k][i];
    const tgt = FORM[p.f](s, n, b, _fa);
    let w = 1, prev = null;
    if (p.enter) { const j = Math.floor(s / 2), st = j * 0.5 + (s % 2) * 0.22; w = smoothstep(st, st + 2.4, b); if (w < 1) prev = FORM.wings(s, n, b, _fb); }
    else if (p.tr && b < p.b + p.tr) { w = smoothstep(p.b, p.b + p.tr, b); prev = FORM[DANCE_PLAN[k - 1].f](this.slots[k - 1][i], n, p.cart ? p.b : b, _fb); }
    if (!prev) { o.x = tgt.x; o.z = tgt.z; o.yaw = tgt.yaw; return o; }
    if (p.cart || p.enter) { o.x = lerp(prev.x, tgt.x, w); o.z = lerp(prev.z, tgt.z, w); }
    else { const ra = Math.hypot(prev.x, prev.z), rb = Math.hypot(tgt.x, tgt.z), aa = Math.atan2(prev.x, prev.z), ab = Math.atan2(tgt.x, tgt.z), r = lerp(ra, rb, w), an = aa + angleDiff(aa, ab) * w; o.x = Math.sin(an) * r; o.z = Math.cos(an) * r; }
    o.yaw = prev.yaw + angleDiff(prev.yaw, tgt.yaw) * w;
    return o;
  },
  group(i, b) { const k = this.formation(b); return this.slots[k][i] % 2; },

  reset() {
    this.stop();
    this.cues = {};
  },
  stop() {
    DanceMusic.stop(true);
    const wasActive = this.active;
    this.active = false; this.running = false; this.skipping = false; this.camOn = false; this.holdBeta = null; this.bowK = 0; this.fxOut = false; this.skipped = false;
    if (Corps.group) Corps.group.visible = false;
    if (this.fx.root) this.fx.root.visible = false;
    if (wasActive) this.lights(1, 1, 1);
    UI.hide('danceSkip');
    if (this._res) { const r = this._res; this._res = null; r(); }
  },
  lights(h, k, r) { const L = this.W3 && this.W3.lights, B = this.base; if (!L || !B) return; L.hemi.intensity = B.hemi * h; L.key.intensity = B.key * k; L.rim.intensity = B.rim * r; },

  /* the whole performance: curtain, music, the last bow; resolves when the snowflakes have melted away */
  async perform() {
    const S = Snow, W3 = S.W, st = W3.stage;
    this.reset();
    await guard(UI.fade(1, 0.55, true));
    this.n = this.corpsCount(); Corps.setCount(this.n);
    this.slots = this.plan(this.n); this.fade = new Array(this.n).fill(1);
    this.active = true; this.running = false; this.camOn = true; this.t = 0; this.beta = -1; this.fxK = 0;
    Corps.group.visible = true; this.fx.root.visible = true;
    S.fairy.root.visible = true; S.blob.visible = true; S.fairy.root.scale.setScalar(1); S.fairy.a.action = null;
    clara.root.visible = true; prince.root.visible = true; blobs.clara.visible = true; blobs.nut.visible = true;
    this.tick(-1, 0.016);
    const slow = setTimeout(() => UI.toast('눈송이 왈츠를 준비하고 있어요…', 2400), 450);
    const prep = await guard(DanceMusic.prepare());
    clearTimeout(slow);
    if (prep.note) UI.toast(prep.note, 3800);
    UI.show('danceSkip');
    await guard(UI.fade(0, 0.9, true));
    this.done = new Promise((r) => { this._res = r; });
    DanceMusic.start(0.25);
    this.running = true;
    await guard(this.done);
    // the corps bows, then melts back into falling snow
    UI.hide('danceSkip');
    clara.play('cheer', 1.6); clara.setExpr('happy', 3); prince.play('bow', 1.6);
    await guard(tween(1.6, (k) => { this.bowK = Math.sin(Math.min(1, k * 1.25) * Math.PI * 0.5) * (k < 0.8 ? 1 : 1 - (k - 0.8) * 2.5); }, Ease.linear));
    this.bowK = 0;
    Sound.sfxTransform();
    for (let i = 0; i < this.n; i++) {
      const j = i;
      tween(0.75, (k) => {
        if (this.fade[j] === 1 && k > 0) { this.place(j, this.beta, _fo); st.toWorld(_fo.x, _fo.z, _dw); burst(_dw.x, 1.0, _dw.z, { n: 12, speed: 2.2, g: -0.5, cell: CELL.snow, colors: ['#ffffff', '#dceeff', '#eaf4ff'], size: 1.1 }); }
        this.fade[j] = Math.max(0.001, 1 - k);
      }, Ease.in).catch(() => {});
      await guard(wait(0.07));
    }
    await guard(wait(0.85));
    Corps.group.visible = false;
    // the stage light and the whirl of snow fade away and the forest's own light returns
    const fx = this.fx, L = W3.lights, B = this.base, d0 = fx.disc.material.opacity, b0 = fx.beamMat.opacity, u = fx.vortex.material.uniforms, v0 = u.uDense.value, h0 = L.hemi.intensity, k0 = L.key.intensity, r0 = L.rim.intensity;
    this.fxOut = true;
    await guard(tween(1.4, (k, kr, dt) => {
      const m = 1 - k; fx.disc.material.opacity = d0 * m; fx.beamMat.opacity = b0 * m; u.uDense.value = v0 * m; u.uT.value += (dt || 0.016) * 0.4;
      L.hemi.intensity = lerp(h0, B.hemi, k); L.key.intensity = lerp(k0, B.key, k); L.rim.intensity = lerp(r0, B.rim, k);
    }, Ease.inOut));
    fx.root.visible = false; this.fxOut = false;
    this.camOn = false; this.active = false;
  },
  async skip() {
    if (!this.running || this.skipping) return;
    this.skipping = true;
    UI.hide('danceSkip');
    await UI.fade(1, 0.35, true);
    if (!this.running) { this.skipping = false; return; }
    DanceMusic.stop(); this.running = false; this.holdBeta = 63.4; this.skipped = true;
    this.tick(this.holdBeta, 0.016);
    await UI.fade(0, 0.45, true);
    this.skipping = false;
    if (this._res) { const r = this._res; this._res = null; r(); }
  },
  onPause(on) {
    if (!this.running) return false;
    if (on) { DanceMusic.pause(); this.tick(DanceMusic.barAt(DanceMusic.time()), 0); }   // the still frame matches the stilled music
    else DanceMusic.resume();
    return true;
  },

  update(dt) {
    if (!this.active) return;
    this.t += dt;
    let b = this.holdBeta !== null ? this.holdBeta : this.beta;
    if (this.running) {
      const tau = DanceMusic.time();
      b = DanceMusic.barAt(tau);
      if (tau >= DanceMusic.endT) { this.running = false; this.holdBeta = Math.min(b, 64.5); DanceMusic.stop(); if (this._res) { const r = this._res; this._res = null; r(); } }
    }
    this.tick(b, dt);
  },
  /* where everyone stands at bar b: the formations, then a light nudge so no two tutus pass through each other while
     the dancers change places (pairs closer than `gap`, or nearer the snow fairy than `solo`, are eased apart) */
  positions(b, out, solo) {
    const n = this.n, gap = 0.86, soloGap = 1.0;
    for (let i = 0; i < n; i++) { const o = out[i] || (out[i] = { x: 0, z: 0, yaw: 0 }); this.place(i, b, o); }
    for (let it = 0; it < 3; it++) {
      for (let i = 0; i < n; i++) {
        const a = out[i];
        for (let j = i + 1; j < n; j++) {
          const c = out[j], dx = c.x - a.x, dz = c.z - a.z, d = Math.hypot(dx, dz);
          if (d < gap && d > 1e-4) { const k = (gap - d) / (2 * d); a.x -= dx * k; a.z -= dz * k; c.x += dx * k; c.z += dz * k; }
        }
        const sx = a.x - solo.x, sz = a.z - solo.z, sd = Math.hypot(sx, sz);
        if (sd < soloGap && sd > 1e-4) { const k = (soloGap - sd) / sd; a.x += sx * k; a.z += sz * k; }
      }
    }
    return out;
  },
  /* pose and place everyone for bar b */
  tick(b, dt) {
    const st = this.W3.stage, t = this.t, n = this.n;
    this.beta = b;
    for (let g = 0; g < 2; g++) { const P = newPose(this.P[g]); corpsPose(g, b, t, P); if (this.bowK) Step.reverence(P, this.bowK); Corps.pose(g, P, t); this.spin[g] = P.spin; }
    const P = newPose(this.Ps);
    soloPose(b, t, P, _so);
    const pos = this.positions(b, this.pos || (this.pos = []), _so);
    for (let i = 0; i < n; i++) {
      const o = pos[i], g = this.group(i, b);
      st.toWorld(o.x, o.z, _dw);
      Corps.write(i, g, _dw.x, 0.04, _dw.z, st.yaw + o.yaw + this.spin[g], 0.86 * this.fade[i]);
    }
    Corps.flush();
    // the snow fairy
    const f = Snow.fairy;
    if (this.bowK) Step.reverence(P, this.bowK);
    applyPose(f, P, t);
    st.toWorld(_so.x, _so.z, _dw); f.root.position.set(_dw.x, 0.04, _dw.z); f.root.rotation.y = st.yaw + _so.yaw + P.spin;
    Snow.blob.position.set(_dw.x, 0.02, _dw.z);
    // Clara and the prince watch from the front corner of the clearing
    for (const [doll, x, z, blob] of [[clara, -2.4, -6.6, blobs.clara], [prince, -3.6, -7.3, blobs.nut]]) {
      st.toWorld(x, z, _dw2); doll.root.position.set(_dw2.x, 0, _dw2.z); doll.root.rotation.y = st.yaw + Math.atan2(-x, -z);
      doll.update(dt, 0, true, 0); blob.position.set(_dw2.x, 0.02, _dw2.z);
    }
    this.cue(b);
    this.fxUpdate(b, dt);
    if (this.camOn) this.camUpdate(b);
  },
  /* small reactions from the audience */
  cue(b) {
    const once = (k, fn) => { if (b >= k && !this.cues[k]) { this.cues[k] = true; fn(); } };
    once(1, () => clara.setExpr('surprised', 1.8));
    once(20.5, () => { clara.setExpr('happy', 3); });
    once(33, () => clara.setExpr('surprised', 2.2));
    once(45.5, () => clara.setExpr('happy', 4));
  },
  fxUpdate(b, dt) {
    const fx = this.fx; if (!fx.root || this.fxOut) return;
    this.fxK = damp(this.fxK, this.active ? 1 : 0, 2.2, dt);
    const sec = b < 20 ? 0 : b < 32 ? 1 : b < 45 ? 2 : 3, rise = smoothstep(45, 63, b);
    const disc = [0.42, 0.5, 0.34, lerp(0.5, 0.72, rise)][sec], beam = [0.06, 0.085, 0.14, lerp(0.09, 0.17, rise)][sec];
    const dense = [lerp(0.15, 0.38, smoothstep(0, 8, b)), 0.5, lerp(0.55, 0.92, smoothstep(32, 44, b)), lerp(0.75, 1, rise)][sec], spin = [0.35, 0.45, 0.28, lerp(0.55, 1.15, rise)][sec];
    const k = this.fxK, high = 1 - 0.75 * smoothstep(4.5, 7.5, Cam.pos.y);   // beams are seen end-on from above: fade them
    fx.disc.material.opacity = damp(fx.disc.material.opacity, disc * k, 3, dt);
    fx.beamMat.opacity = damp(fx.beamMat.opacity, beam * k * high, 3, dt);
    const u = fx.vortex.material.uniforms; u.uDense.value = damp(u.uDense.value, dense * k, 2, dt); u.uT.value += dt * spin * (this.running || this.holdBeta !== null ? 1 : 0.4);
    const hush = sec === 2 ? smoothstep(32, 34, b) * (1 - smoothstep(43, 45, b)) : 0;
    this.lights(lerp(1, 0.8, hush) * (1 + 0.06 * rise), lerp(1, 0.72, hush) * (1 + 0.08 * rise), 1 + 0.4 * hush);
  },
  camUpdate(b) {
    const st = this.W3.stage;
    camKey(b, _dcp, 'p'); camKey(b, _dct, 't');
    // a tall phone sees less from side to side: rise and look down (the clearing's edge is the limit: trees beyond)
    const asp = camera.aspect, pf = asp < 1 ? (1 - asp) * 0.75 : 0;
    if (pf > 0) { _dcp.y += pf * 7; _dct.y -= pf * 0.8; }
    st.toWorld(_dcp.x, _dcp.z, _dw); Cam.pos.set(_dw.x, _dcp.y, _dw.z);
    st.toWorld(_dct.x, _dct.z, _dw); Cam.target.set(_dw.x, _dct.y, _dw.z);
    Cam.mode = 'free';
  },
};
const _fa = { x: 0, z: 0, yaw: 0 }, _fb = { x: 0, z: 0, yaw: 0 }, _fo = { x: 0, z: 0, yaw: 0 }, _so = { x: 0, z: 0, yaw: 0 };

/* ---------------- pause-menu button: the player's own recording of the waltz (kept in this browser only) ---------------- */
const DanceUI = {
  init() {
    const skip = $('danceSkip');
    if (skip) skip.addEventListener('click', (e) => { e.stopPropagation(); Sound.sfxUI(); Dance.skip(); });
    const btn = $('btnDanceMusic'), inp = $('danceFile');
    if (!btn || !inp) return;
    btn.addEventListener('click', async () => {
      Sound.sfxUI();
      if (DanceMusic.local) { const done = DanceMusic.clearLocal(); this.sync(); UI.toast('눈송이 왈츠를 게임 기본 연주로 되돌렸어요', 2600); await done; return; }
      inp.value = ''; inp.click();
    });
    inp.addEventListener('change', async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      const r = await DanceMusic.setLocalFile(f);
      UI.toast(r.ok ? '이 기기에만 저장했어요 · 군무 때 이 음원으로 공연해요' : '박자 지도를 만든 그 녹음 파일이 아니어서 쓸 수 없어요', 3800);
      this.sync();
    });
    DanceMusic.loadLocalInfo().then(() => this.sync());
  },
  sync() { const s = $('danceMusicState'); if (s) s.textContent = DanceMusic.local ? '내 기기 음원' : '기본 연주'; },
};
