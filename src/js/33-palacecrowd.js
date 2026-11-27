/* =====================================================================
   33 · CHAPTER V CORPS — many dancers drawn instanced (one draw call per body part for the whole troupe),
   and what they do: sleep, follow the baton, wait on their pad, and dance their nation's dance
   ===================================================================== */
const _cm = new THREE.Matrix4(), _cm2 = new THREE.Matrix4(), _cq = new THREE.Quaternion(), _cp = new THREE.Vector3(), _cs = new THREE.Vector3();
const _cqFlat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), _cUp = new THREE.Vector3(0, 1, 0);

/* a troupe built from one posed template doll: pose(P) poses the template, write(i, …) copies it to dancer i */
function makeCrowd(root, make, cap) {
  const C = { group: new THREE.Group(), tpl: make(), lists: [], inst: [], n: cap, cap };
  C.group.name = 'crowd'; C.group.visible = false; root.add(C.group);
  C.tpl.root.traverse((o) => { if (o.isMesh && o !== C.tpl.wand) C.lists.push(o); });
  C.inst = C.lists.map((m) => {
    const im = new THREE.InstancedMesh(m.geometry, m.material, cap);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.renderOrder = m.renderOrder;
    C.group.add(im); return im;
  });
  C.blobs = new THREE.InstancedMesh(GEO.plane(), MAT.shadow, cap);
  C.blobs.instanceMatrix.setUsage(THREE.DynamicDrawUsage); C.blobs.frustumCulled = false; C.blobs.renderOrder = 2; C.group.add(C.blobs);
  C.tpl.root.updateMatrixWorld(true);
  C.setCount = (n) => { C.n = n; C.inst.forEach((im) => { im.count = n; }); C.blobs.count = n; };
  C.pose = (P, t) => { applyPose(C.tpl, P, t); C.tpl.root.updateMatrixWorld(true); };
  C.write = (i, x, y, z, yaw, s, floor = 0) => {
    _cq.setFromAxisAngle(_cUp, yaw); _cm.compose(_cp.set(x, y, z), _cq, _cs.set(s, s, s));
    for (let k = 0; k < C.lists.length; k++) { _cm2.multiplyMatrices(_cm, C.lists[k].matrixWorld); C.inst[k].setMatrixAt(i, _cm2); }
    _cm2.compose(_cp.set(x, floor + 0.024, z), _cqFlat, _cs.set(0.82 * s, 0.82 * s, 1)); C.blobs.setMatrixAt(i, _cm2);
  };
  C.flush = () => { C.inst.forEach((im) => { im.instanceMatrix.needsUpdate = true; }); C.blobs.instanceMatrix.needsUpdate = true; };
  C.setCount(cap);
  return C;
}

/* a small seeded random generator, so the stage is laid out the same way every time */
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------------- poses (P is a fresh newPose; t seconds of wall time, b beats into the dance, i the dancer) ---------------- */
const NATION_STEP = {
  /* Spanish, 3/4: a balancé with castanet arms and a stamp on every downbeat, a quick turn at the end of every fourth bar */
  choco(P, b, t, i) {
    const bar = Math.floor(b / 3), f = b / 3 - bar;
    if (bar % 4 === 3 && f > 0.35) { Step.pirouette(P, (f - 0.35) / 0.65, 'fifth'); return; }
    Step.balance(P, f, bar + (i % 2), i % 3 ? 1 : -1);
    if (f < 0.22) { const k = Math.sin((f / 0.22) * Math.PI); P.rlx = lerp(P.rlx, -0.5, k); P.by += 0.03 * k; }
    P.hz += 0.06 * Math.sin(t * 5 + i);
  },
  /* Arabian, 4/4: a slow sway of the hips with the arms flowing in an S, a turn at the end of every fourth bar */
  coffee(P, b, t, i) {
    const bar = Math.floor(b / 4), f = b / 4 - bar, sway = Math.sin((b / 2) * Math.PI + i * 0.35);
    P.roll += 0.13 * sway; P.twist += 0.22 * sway; P.hy += 0.3 * sway; P.by += 0.012 * Math.abs(sway);
    setArms(P, sway > 0 ? 'arab' : 'upR', 0.8);
    if (bar % 4 === 3) Step.pirouette(P, Ease.inOut(f), 'first');
  },
  /* Chinese, 2/4: little quick steps with the arms held out in front, a deep bow at the end of every fourth bar */
  tea(P, b, t, i) {
    const bar = Math.floor(b / 2), f = b / 2 - bar;
    Step.bourree(P, t + i * 0.3, 'first');
    P.hz += 0.1 * Math.sin(b * Math.PI + i); P.by += 0.01 * Math.sin(b * TAU);
    if (bar % 4 === 3) Step.reverence(P, Math.sin(f * Math.PI) * 0.9);
  },
  /* the grand ring: one waltz for everyone, a balancé every two beats and the arms floating */
  ring(P, b, t, i) {
    const n = Math.floor(b / 2), f = b / 2 - n;
    Step.balance(P, f, n + (i % 2), 1);
    if (Math.floor(b / 8) % 2 === 1 && f > 0.5) Step.pirouette(P, (f - 0.5) * 2, 'fifth');
  },
};
function sleepPose(P, t, i) { Step.kneel(P, 0.9); setArms(P, 'low', 1); P.hx += 0.42; P.by += 0.006 * Math.sin(t * 1.7 + i); }
function walkPose(P, t, i) { Step.bourree(P, t + i * 0.37, 'second'); P.lean += 0.07; }
function waitPose(P, t, i) { setArms(P, 'second', 0.55); P.roll += 0.04 * Math.sin(t * 2.2 + i); P.by += 0.012 * Math.abs(Math.sin(t * 3 + i)); }
