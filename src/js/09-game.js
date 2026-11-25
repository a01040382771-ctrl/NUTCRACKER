/* =====================================================================
   09 · GAME — Clara's controller, camera, collisions, toys, mice & the King
   ===================================================================== */
const PHYS = { R: 0.3, HGT: 1.5, STEP: 0.32, SPEED: 4.6, JUMP: 5.9, GRAV: 13.5 };
const STAR_GOAL = 8, STAR_TOTAL = 12, WAVE_SIZE = 5, KING_HP = 4;
const G = { mode: 'loading', phase: 'none', stars: 0, time: 0, locked: true, combat: false, throws: 0, waveKills: 0, waveSpawned: 0, kingHits: 0, lastStarT: 0, hintI: 0, mood: 0, shakeT: 0 };
const player = { pos: V3(0, 0, 6), vel: V3(), yaw: Math.PI, vy: 0, grounded: true, stun: 0, invuln: 0, knock: V3(), knockT: 0, coyote: 0, jumpBuf: 0, stepT: 0, throwCd: 0, speed: 0 };
const flags = {};
let renderer, scene, camera, W;
let clara, nut, prince, fairyFig, fairyBig, king, starSet, portal, magicSnow, stageSnow, marker, owlGlow;
const blobs = {};
const mice = [], soldiers = [], slippers = [], DYN = [];
const _v1 = V3(), _v2 = V3(), _v3 = V3(), _proj = V3();
const NOIN = { x: 0, z: 0, m: 0 };

/* ---------------- collisions ---------------- */
function resolve(pos, r, y, h) {
  const lists = [W.colliders, DYN];
  for (let it = 0; it < 3; it++) {
    let moved = false;
    for (const list of lists) for (const c of list) {
      if (!c.on || c.top <= y + PHYS.STEP || c.bottom >= y + h) continue;
      if (c.t === 'c') {
        const dx = pos.x - c.x, dz = pos.z - c.z, m = c.r + r, d2 = dx * dx + dz * dz;
        if (d2 < m * m) { const d = Math.sqrt(d2) || 1e-4; pos.x += (dx / d) * (m - d); pos.z += (dz / d) * (m - d); moved = true; }
      } else {
        const cx = clamp(pos.x, c.x0, c.x1), cz = clamp(pos.z, c.z0, c.z1);
        const dx = pos.x - cx, dz = pos.z - cz, d2 = dx * dx + dz * dz;
        if (d2 > 1e-8) {
          if (d2 < r * r) { const d = Math.sqrt(d2); pos.x += (dx / d) * (r - d); pos.z += (dz / d) * (r - d); moved = true; }
        } else {
          const l = pos.x - c.x0, rr = c.x1 - pos.x, b = pos.z - c.z0, f = c.z1 - pos.z, m = Math.min(l, rr, b, f);
          if (m === l) pos.x = c.x0 - r; else if (m === rr) pos.x = c.x1 + r; else if (m === b) pos.z = c.z0 - r; else pos.z = c.z1 + r;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  const B = W.bounds, e = r - PHYS.R;
  pos.x = clamp(pos.x, B.x0 + e, B.x1 - e); pos.z = clamp(pos.z, B.z0 + e, B.z1);
  return pos;
}
function groundAt(x, z, y) {
  let g = 0;
  for (const list of [W.colliders, DYN]) for (const c of list) {
    if (!c.on || !c.walk || c.top > y + PHYS.STEP + 0.001 || c.top <= g) continue;
    const m = 0.1;
    if (c.t === 'c') { const dx = x - c.x, dz = z - c.z; if (dx * dx + dz * dz <= (c.r + m) * (c.r + m)) g = c.top; }
    else if (x >= c.x0 - m && x <= c.x1 + m && z >= c.z0 - m && z <= c.z1 + m) g = c.top;
  }
  return g;
}
function toScreen(v) {
  _proj.copy(v).project(camera);
  const r = renderer.domElement.getBoundingClientRect();
  return { x: r.left + (_proj.x * 0.5 + 0.5) * r.width, y: r.top + (-_proj.y * 0.5 + 0.5) * r.height, ok: _proj.z < 1 };
}

/* ---------------- camera rig ---------------- */
const Cam = {
  pos: V3(0, 6.4, 31), target: V3(0, 5.2, 0), mode: 'free', shake: 0, zoom: 1, fov: 42, sway: 0,
  update(dt) {
    if (this.mode === 'follow') {
      const p = player.pos;
      const la = _v1.set(player.vel.x * 0.22, 0, player.vel.z * 0.16);
      const tx = p.x * 0.88 + la.x, ty = 1.2 + p.y * 0.65, tz = p.z - 1.9 + la.z;
      const z = this.zoom;
      const px = clamp(tx * 0.97, -9.5, 9.5), py = ty + 5.1 * z + p.y * 0.1, pz = tz + 9.9 * z;
      this.target.x = damp(this.target.x, tx, 5, dt); this.target.y = damp(this.target.y, ty, 5, dt); this.target.z = damp(this.target.z, tz, 5, dt);
      this.pos.x = damp(this.pos.x, px, 3.6, dt); this.pos.y = damp(this.pos.y, py, 3.6, dt); this.pos.z = damp(this.pos.z, pz, 3.6, dt);
    }
    this.sway += dt;
    camera.position.copy(this.pos);
    if (this.mode === 'title') { camera.position.x += Math.sin(this.sway * 0.25) * 0.8; camera.position.y += Math.sin(this.sway * 0.31) * 0.2; }
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt);
      const s = this.shake * 0.25;
      camera.position.x += (Math.random() - 0.5) * s; camera.position.y += (Math.random() - 0.5) * s;
    }
    camera.lookAt(this.target);
  },
  to(pos, target, dur = 1.6, ease = Ease.inOut) {
    this.mode = 'free';
    const p0 = this.pos.clone(), t0 = this.target.clone(), p1 = V3(...pos), t1 = V3(...target);
    return tween(dur, (k) => { this.pos.lerpVectors(p0, p1, k); this.target.lerpVectors(t0, t1, k); }, ease);
  },
  set(pos, target) { this.mode = 'free'; this.pos.set(...pos); this.target.set(...target); },
  follow() { this.mode = 'follow'; },
};

/* ---------------- lighting moods ---------------- */
const MOODS = {
  evening: { sky: '#ffe9d8', ground: '#6a3446', hemi: 1.15, key: '#ffe6c8', keyI: 2.1, rimI: 0.55, fire: 7, tree: 6, spot: 0, beams: 0.1, exp: 1.0, bg: '#2b1124' },
  midnight: { sky: '#aab9ff', ground: '#2a2246', hemi: 0.72, key: '#c3cfff', keyI: 1.05, rimI: 1.2, fire: 2.6, tree: 10, spot: 9, beams: 0.34, exp: 1.06, bg: '#141238' },
};
const _ca = new THREE.Color(), _cb = new THREE.Color();
function applyMood(k) {
  G.mood = k;
  const a = MOODS.evening, b = MOODS.midnight, L = W.lights;
  L.hemi.color.copy(_ca.set(a.sky)).lerp(_cb.set(b.sky), k);
  L.hemi.groundColor.copy(_ca.set(a.ground)).lerp(_cb.set(b.ground), k);
  L.hemi.intensity = lerp(a.hemi, b.hemi, k);
  L.key.color.copy(_ca.set(a.key)).lerp(_cb.set(b.key), k); L.key.intensity = lerp(a.keyI, b.keyI, k);
  L.rim.intensity = lerp(a.rimI, b.rimI, k);
  L.fireBase = lerp(a.fire, b.fire, k); L.treeBase = lerp(a.tree, b.tree, k);
  L.spot.intensity = lerp(a.spot, b.spot, k);
  W.beams.forEach((m) => { m.material.opacity = lerp(a.beams, b.beams, k); });
  renderer.toneMappingExposure = lerp(a.exp, b.exp, k);
}

/* ---------------- actors ---------------- */
function createActors() {
  clara = buildDoll('clara');
  scene.add(clara.root);
  blobs.clara = makeBlob(0.42); scene.add(blobs.clara);
  nut = buildNutcracker();
  scene.add(nut.root);
  blobs.nut = makeBlob(0.4); scene.add(blobs.nut);
  prince = buildDoll('prince');
  prince.root.scale.setScalar(1.12); prince.root.visible = false;
  scene.add(prince.root);
  fairyFig = buildDoll('fairy');
  fairyFig.root.scale.setScalar(0.24); fairyFig.pose = 'fifth';
  W.props.musicBox.turn.add(fairyFig.root);
  fairyBig = buildDoll('fairy');
  fairyBig.root.visible = false;
  scene.add(fairyBig.root);
  king = buildMouseKing();
  king.root.visible = false; scene.add(king.root);
  blobs.king = makeBlob(0.75); blobs.king.visible = false; scene.add(blobs.king);
  for (let i = 0; i < 6; i++) {
    const m = buildMouse(); m.root.visible = false; scene.add(m.root);
    const b = makeBlob(0.3); b.visible = false; scene.add(b);
    mice.push({ m, blob: b, pos: V3(), vel: V3(), state: 'off', t: 0, yaw: 0, seed: rnd(0, 10), speed: 0 });
  }
  const homes = [[7.4, 7.3], [8.2, 7.3], [9.0, 7.3], [9.8, 7.3]];
  homes.forEach(([x, z], i) => {
    const s = buildSoldier(i);
    s.root.position.set(x, 0, z); scene.add(s.root);
    const b = makeBlob(0.26); b.position.set(x, 0.015, z); scene.add(b);
    const col = { t: 'c', x, z, r: 0.22, top: 1.5, bottom: 0, walk: false, on: true };
    DYN.push(col);
    soldiers.push({ s, blob: b, home: V3(x, 0, z), pos: V3(x, 0, z), yaw: 0, cd: rnd(0, 1), col, target: null, poke: 0 });
  });
  for (let i = 0; i < 4; i++) {
    const sb = new Batch(MAT.satin);
    sb.add(GEO.sph(14, 10), '#efb0c0', TRS(0, 0, 0, 0, 0, 0, 0.07, 0.045, 0.13));
    sb.add(GEO.torus(0.055, 0.012, 6, 14), '#f7d3dc', TRS(0, 0.03, -0.03, Math.PI / 2.4, 0, 0));
    sb.add(tubeGeo([[0, 0.03, -0.02], [0.05, 0.1, -0.05], [0.1, 0.06, -0.12]], 0.008, 10, 4), '#f7d3dc');
    const mesh = sb.build({ cast: false });
    mesh.visible = false; scene.add(mesh);
    slippers.push({ mesh, on: false, t: 0, T: 0.4, from: V3(), to: V3(), h: 1, target: null, pos: V3() });
  }
  W.train.cars.forEach((c) => DYN.push(c.col));
  W.props.top.col = { t: 'c', x: 0, z: 0, r: 0.3, top: 0.7, bottom: 0, walk: false, on: true };
  DYN.push(W.props.top.col);
  starSet = new StarSet(16);
  scene.add(starSet.mesh, starSet.halo);
  portal = makePortal(); portal.position.set(0, 0, -0.5); scene.add(portal);
  magicSnow = makeSnow(DEVICE.mobile ? 220 : 380, [-12.5, 0.2, -8.5], [12.5, 9.5, 9.5], { size: 1.0, speed: 0.55, color: '#dfe9ff', additive: true, opacity: 0 });
  scene.add(magicSnow);
  stageSnow = makeSnow(DEVICE.mobile ? 160 : 260, [-16, 0, 10.8], [16, 15, 15], { size: 1.3, speed: 0.75, opacity: 0.9 });
  scene.add(stageSnow);
  const mb = new Batch(MAT.gold);
  mb.add(GEO.cone(4), '#ffd77a', TRS(0, 0, 0, Math.PI, 0, 0, 0.16, 0.3, 0.16));
  mb.add(GEO.sph(8, 6), '#ffe9a8', TRS(0, 0.22, 0, 0, 0, 0, 0.07));
  marker = mb.build({ cast: false }); marker.visible = false; scene.add(marker);
  owlGlow = makeGlowPoints(W.owlEyes.map((p) => ({ p, c: '#ffb43c', s: 0.7, tw: 0.2 })), { boost: 0 });
  scene.add(owlGlow);
  // dynamic actors never bake into the static shadow map
  [clara.root, nut.root, prince.root, fairyBig.root, king.root, ...mice.map((m) => m.m.root), ...soldiers.map((s) => s.s.root), ...slippers.map((s) => s.mesh)].forEach((r) => r.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } }));
  fairyFig.root.traverse((o) => { if (o.isMesh) o.castShadow = false; });
}

/* ---------------- Clara ---------------- */
function updatePlayer(dt) {
  const p = player;
  const inp = G.locked || p.stun > 0 ? NOIN : Input.read();
  if (inp.m > 0 && G.mode === 'play') Input.anyMove = true;
  const sp = PHYS.SPEED;
  const acc = p.grounded ? 13 : 5;
  p.vel.x = damp(p.vel.x, inp.x * sp, acc, dt); p.vel.z = damp(p.vel.z, inp.z * sp, acc, dt);
  if (p.knockT > 0) { p.knockT -= dt; p.vel.x = p.knock.x; p.vel.z = p.knock.z; }
  p.stun = Math.max(0, p.stun - dt); p.invuln = Math.max(0, p.invuln - dt); p.throwCd = Math.max(0, p.throwCd - dt);
  const np = _v2.set(p.pos.x + p.vel.x * dt, 0, p.pos.z + p.vel.z * dt);
  resolve(np, PHYS.R, p.pos.y, PHYS.HGT);
  const moved = Math.hypot(np.x - p.pos.x, np.z - p.pos.z) / Math.max(dt, 1e-4);
  p.speed = damp(p.speed, moved, 12, dt);
  p.pos.x = np.x; p.pos.z = np.z;
  p.jumpBuf -= dt; p.coyote -= dt;
  if (p.jumpBuf > 0 && (p.grounded || p.coyote > 0) && p.stun <= 0 && !G.locked) {
    p.vy = PHYS.JUMP; p.grounded = false; p.coyote = 0; p.jumpBuf = 0;
    Sound.sfxJump();
    for (let i = 0; i < 10; i++) FX.add.spawn({ x: p.pos.x + rnd(-0.3, 0.3), y: p.pos.y + 0.1, z: p.pos.z + rnd(-0.3, 0.3), vy: rnd(0.2, 1), life: 0.7, size: rnd(0.15, 0.3), size1: 0, color: pick(GOLDS), cell: CELL.sparkle, rot: rnd(0, 3) });
  }
  if (p.float) { p.vy = 0; p.grounded = false; }
  else p.vy -= PHYS.GRAV * dt;
  p.pos.y += p.vy * dt;
  const g = p.float ? -1e9 : groundAt(p.pos.x, p.pos.z, p.pos.y);
  if (p.pos.y <= g) {
    if (!p.grounded && p.vy < -3.2) { Sound.sfxLand(); clara.body.scale.set(1.06, 0.9, 1.06); }
    p.pos.y = g; p.vy = 0; p.grounded = true;
  } else if (p.pos.y > g + 0.04 && p.grounded) { p.grounded = false; p.coyote = 0.13; }
  if (!p.grounded && Math.random() < dt * 30) FX.add.spawn({ x: p.pos.x + rnd(-0.2, 0.2), y: p.pos.y + rnd(0.2, 0.9), z: p.pos.z + rnd(-0.2, 0.2), life: 0.6, size: rnd(0.12, 0.22), size1: 0, color: pick(GOLDS), cell: CELL.sparkle, rot: rnd(0, 3) });
  if (p.speed > 0.4 && !p.lockFacing) p.yaw = dampAngle(p.yaw, Math.atan2(p.vel.x, p.vel.z), 11, dt);
  if (p.grounded && p.speed > 1) { p.stepT += dt * p.speed * 0.5; if (p.stepT > 1) { p.stepT = 0; Sound.sfxStep(); } }
  // model
  clara.root.position.copy(p.pos);
  clara.root.rotation.y = p.yaw;
  clara.body.scale.x = damp(clara.body.scale.x, 1, 10, dt); clara.body.scale.y = damp(clara.body.scale.y, 1, 10, dt); clara.body.scale.z = clara.body.scale.x;
  clara.update(dt, p.speed / PHYS.SPEED, p.grounded, p.vy);
  clara.root.visible = p.invuln <= 0 || Math.floor(p.invuln * 14) % 2 === 0;
  const gy = groundAt(p.pos.x, p.pos.z, p.pos.y + 0.01);
  const hgt = p.pos.y - gy;
  blobs.clara.position.set(p.pos.x, gy + 0.016, p.pos.z);
  blobs.clara.scale.setScalar(0.84 * clamp(1 - hgt * 0.25, 0.45, 1));
}
function hurtPlayer(from, power = 6) {
  const p = player;
  if (p.invuln > 0 || G.locked) return false;
  const d = _v1.set(p.pos.x - from.x, 0, p.pos.z - from.z);
  if (d.lengthSq() < 1e-4) d.set(0, 0, 1);
  d.normalize().multiplyScalar(power);
  p.knock.copy(d); p.knockT = 0.22; p.stun = 0.4; p.invuln = 1.4;
  if (p.grounded) { p.vy = 3.2; p.grounded = false; }
  clara.play('hurt', 0.5); clara.setExpr('surprised', 0.9);
  Sound.sfxHurt(); Cam.shake = Math.max(Cam.shake, 0.25);
  burst(p.pos.x, p.pos.y + 0.9, p.pos.z, { n: 10, colors: ['#ffffff', '#ffc0cf'], speed: 2 });
  return true;
}

/* ---------------- Nutcracker / Prince companions ---------------- */
const comp = { pos: V3(1, 0, 7), yaw: Math.PI, y: 0, speed: 0, mode: 'off', scale: 0.42, cd: 0, target: null, followDist: 1.2 };
function updateCompanion(dt) {
  const who = comp.mode === 'prince' ? prince : nut;
  if (comp.mode === 'off') { return; }
  const doll = comp.mode === 'doll';
  const big = comp.mode === 'life' || comp.mode === 'prince';
  comp.cd = Math.max(0, comp.cd - dt);
  let goal = null, maxSp = doll ? 4.8 : 4.2;
  // pick a mouse to fight (life-size Nutcracker only)
  if (comp.mode === 'life' && G.combat && !G.locked) {
    let best = null, bd = 1e9;
    for (const ms of mice) {
      if (ms.state !== 'chase' && ms.state !== 'recoil') continue;
      const dc = ms.pos.distanceTo(player.pos), dn = ms.pos.distanceTo(comp.pos);
      if (dc < 3.2 && dn < 6 && dn < bd) { bd = dn; best = ms; }
    }
    comp.target = best;
    if (best) {
      goal = best.pos; maxSp = 4.0;
      if (bd < 1.0 && comp.cd <= 0) {
        comp.cd = 1.5; nut.play('slash', 0.5); Sound.sfxThrow();
        const victim = best;
        wait(0.2).then(() => { if (victim.state !== 'dead' && victim.state !== 'off' && victim.pos.distanceTo(comp.pos) < 1.4) killMouse(victim); });
      }
    }
  }
  if (!goal && !comp.hold) {
    const back = _v3.set(Math.sin(player.yaw), 0, Math.cos(player.yaw));
    const side = V3(back.z, 0, -back.x);
    goal = V3(player.pos.x - back.x * comp.followDist + side.x * 0.55, 0, player.pos.z - back.z * comp.followDist + side.z * 0.55);
  }
  let spd = 0;
  if (goal && !comp.hold) {
    const dx = goal.x - comp.pos.x, dz = goal.z - comp.pos.z, d = Math.hypot(dx, dz);
    const stopAt = comp.target ? 0.75 : 0.25;
    if (d > stopAt) {
      spd = Math.min(maxSp, d * 3);
      const np = _v2.set(comp.pos.x + (dx / d) * spd * dt, 0, comp.pos.z + (dz / d) * spd * dt);
      resolve(np, big ? 0.3 : 0.2, comp.y, big ? 1.5 : 0.6);
      comp.pos.x = np.x; comp.pos.z = np.z;
      comp.yaw = dampAngle(comp.yaw, Math.atan2(dx, dz), 9, dt);
    } else if (comp.target) comp.yaw = dampAngle(comp.yaw, Math.atan2(dx, dz), 9, dt);
    else comp.yaw = dampAngle(comp.yaw, player.yaw, 3, dt);
  }
  comp.speed = damp(comp.speed, spd, 8, dt);
  // hop up onto low furniture after Clara
  const g = groundAt(comp.pos.x, comp.pos.z, comp.y + (doll ? 1.4 : 0.3));
  comp.y = g > comp.y ? damp(comp.y, g, 14, dt) : damp(comp.y, g, 9, dt);
  who.root.position.set(comp.pos.x, comp.y, comp.pos.z);
  who.root.rotation.y = comp.yaw;
  if (comp.mode === 'prince') prince.update(dt, comp.speed / 4, true, 0);
  else nut.update(dt, comp.speed / 4, doll);
  const bl = blobs.nut; bl.position.set(comp.pos.x, comp.y + 0.016, comp.pos.z); bl.scale.setScalar(doll ? 0.42 : 0.85);
}

/* ---------------- toys & props ---------------- */
function updateProps(dt) {
  const t = FX.uniforms.uTime.value;
  // train
  const T = W.train;
  const ahead = T.P(T.th + 0.75 / T.dl(T.th));
  const blocked = player.pos.y < 0.9 && Math.hypot(player.pos.x - ahead.x, player.pos.z - ahead.z) < 0.85;
  T.v = damp(T.v || 0, blocked || T.halt ? 0 : T.speed, 3.5, dt);
  T.th += (T.v * dt) / T.dl(T.th);
  T.place();
  T.whistleCd = Math.max(0, (T.whistleCd || 0) - dt);
  if (blocked && T.whistleCd <= 0 && G.mode === 'play') { T.whistleCd = 4; Sound.sfxWhistle(); const lp = T.cars[0].g.localToWorld(_v1.set(0, 0.75, 0.3)); puff(lp.x, lp.y, lp.z, { n: 8, size: 0.6, colors: ['#ffffff', '#f2eef4'] }); }
  T.steam = (T.steam || 0) + dt * (0.6 + T.v);
  if (T.steam > 0.32) { T.steam = 0; const lp = T.cars[0].g.localToWorld(_v1.set(0, 0.72, 0.3)); FX.norm.spawn({ x: lp.x, y: lp.y, z: lp.z, vx: rnd(-0.1, 0.1), vy: 0.8, vz: rnd(-0.1, 0.1), drag: 0.8, life: 1.4, size: 0.22, size1: 0.7, color: '#f6f2f6', alpha: 0.65, cell: CELL.smoke, rot: rnd(0, 6), vr: 0.5 }); }
  // rocking horse
  const Hh = W.props.horse; Hh.t += dt; Hh.kick = Math.max(0, Hh.kick - dt * 0.3);
  const phi = Math.sin(Hh.t * 2.3) * (0.018 + Hh.kick * 0.3);
  Hh.rock.rotation.z = phi; Hh.rock.position.x = Hh.base.x - Hh.R * phi;
  // music box
  const Mb = W.props.musicBox; Mb.playing = Math.max(0, Mb.playing - dt);
  const spinSp = Mb.playing > 0 ? 2.6 : 0.0;
  Mb.turn.rotation.y += spinSp * dt; Mb.crank.rotation.x += spinSp * 0.8 * dt;
  fairyFig.update(dt, 0, true, 0);
  if (Mb.playing > 0 && !fairyFig.a.action && Math.random() < dt * 0.8) fairyFig.play(pick(['pose', 'spin']), 1.6);
  if (Mb.playing > 0 && Math.random() < dt * 6) { const p = Mb.pos; FX.add.spawn({ x: p.x + rnd(-0.3, 0.3), y: p.y + rnd(0, 0.5), z: p.z + rnd(-0.2, 0.2), vy: 0.5, life: 1.2, size: 0.25, size1: 0, color: pick(['#ffd6e0', '#fff1c4', '#cfe3ff']), cell: CELL.star, rot: rnd(0, 3) }); }
  // jack-in-the-box
  const J = W.props.jack;
  const near = Math.hypot(player.pos.x - J.pos.x, player.pos.z - J.pos.z) < 1.9;
  if (near && J.target === 0 && G.mode === 'play') { J.target = 1; J.t = 0; Sound.sfxBoing(); burst(J.pos.x, 0.9, J.pos.z, { n: 12, speed: 2 }); }
  if (!near && J.target === 1) { J.t += dt; if (J.t > 3) { J.target = 0; J.t = 0; } } else if (near) J.t = 0;
  J.open = damp(J.open, J.target, J.target ? 10 : 5, dt);
  J.lid.rotation.x = -J.open * 2.0;
  J.jack.visible = J.open > 0.05;
  const springK = J.target ? Ease.outElastic(Math.min(1, J.open * 1.15)) : J.open;
  J.jack.scale.y = Math.max(0.01, springK);
  J.head.rotation.z = Math.sin(t * 5) * 0.25 * J.open; J.head.rotation.x = Math.sin(t * 3.7) * 0.1;
  // spinning top
  const Tp = W.props.top; Tp.t += dt;
  const tx = Tp.center.x + Math.cos(Tp.t * 0.5) * 0.6, tz = Tp.center.z + Math.sin(Tp.t * 0.5) * 0.45;
  Tp.group.position.set(tx, 0, tz);
  Tp.group.rotation.set(Math.sin(Tp.t * 1.7) * 0.08, Tp.t * 18, Math.cos(Tp.t * 1.7) * 0.08);
  Tp.col.x = tx; Tp.col.z = tz;
  // clock, owl & pendulum
  const Ck = W.props.clock;
  Ck.pend.rotation.z = Math.sin(t * Math.PI * 0.9) * 0.16;
  const mins = Ck.minutes;
  Ck.minuteHand.rotation.z = -(mins / 60) * TAU;
  Ck.hourHand.rotation.z = -((Ck.hours % 12) + mins / 60) / 12 * TAU;
  const flap = Ck.flap || 0;
  if (flap > 0) Ck.flap = Math.max(0, flap - dt);
  Ck.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (flap > 0 ? 0.25 + Math.abs(Math.sin(t * 14)) * 0.9 : 0.05); });
  // fire & tree light flicker
  const L = W.lights;
  L.fire.intensity = (L.fireBase || 7) * (0.82 + 0.12 * Math.sin(t * 13.1) + 0.08 * Math.sin(t * 7.3 + 1));
  L.tree.intensity = (L.treeBase || 6) * (0.92 + 0.08 * Math.sin(t * 2.1)) * (1 + W.tree.lit * 0.35);
  W.props.flames.userData.mats.forEach((m) => { m.uniforms.uPower.value = lerp(1, 0.55, G.mood); });
  // stockings sway
  W.props.stockings.forEach((s, i) => { const w = s.userData.wiggle || 0; s.rotation.z = Math.sin(t * 1.3 + i) * 0.015 + Math.sin(t * 18) * w * 0.2; if (w > 0) s.userData.wiggle = Math.max(0, w - dt * 0.7); });
  // tree topper
  const tr = W.tree;
  tr.rays.quaternion.copy(camera.quaternion);
  tr.rays.material.rotation = t * 0.15;
  tr.rays.material.opacity = tr.lit * (0.75 + 0.15 * Math.sin(t * 2));
  tr.halo.material.uniforms.uBoost.value = tr.lit * 1.4;
  tr.topMat.emissiveIntensity = 0.05 + tr.lit * 1.6;
  tr.topper.rotation.y = Math.sin(t * 0.8) * 0.25;
  // gift glow sparkle
  if (G.phase === 'gift' && Math.random() < dt * 9) { const gp = W.props.gift.grp.position; FX.add.spawn({ x: gp.x + rnd(-0.6, 0.6), y: rnd(0.2, 1.4), z: gp.z + rnd(-0.6, 0.6), vy: 0.5, life: 1.1, size: rnd(0.18, 0.32), size1: 0, color: pick(GOLDS), cell: CELL.sparkle, rot: rnd(0, 3) }); }
  // shimmer on objects that hide stars
  if (G.phase === 'collect') {
    const shim = [];
    if (!flags.music) shim.push(W.props.musicBox.pos);
    if (!flags.horse) shim.push(_v3.set(10, 1.6, -3.6));
    if (!flags.stocking) shim.push(V3(10, 2.1, -7.9));
    for (const s of shim) if (Math.random() < dt * 2.2) FX.add.spawn({ x: s.x + rnd(-0.35, 0.35), y: s.y + rnd(-0.3, 0.3), z: s.z + rnd(-0.3, 0.3), vy: 0.3, life: 1.0, size: rnd(0.15, 0.26), size1: 0, color: pick(GOLDS), cell: CELL.sparkle, rot: rnd(0, 3) });
  }
  // guide marker
  if (G.markerAt && G.mode === 'play') {
    marker.visible = true;
    marker.position.set(G.markerAt.x, G.markerAt.y + Math.sin(t * 3) * 0.12, G.markerAt.z);
    marker.rotation.y = t * 1.5;
  } else marker.visible = false;
  // portal
  if (portal.visible) {
    const u = portal.userData;
    u.ring.rotation.z = t * 0.4; u.ring2.rotation.z = -t * 0.7;
    u.column.material.opacity = 0.65 + Math.sin(t * 2.5) * 0.15;
    if (Math.random() < dt * 22) { const a = rnd(0, TAU), r = rnd(0, 1.2); FX.add.spawn({ x: portal.position.x + Math.cos(a) * r, y: 0.1, z: portal.position.z + Math.sin(a) * r, vy: rnd(1.2, 2.6), life: rnd(1.4, 2.4), size: rnd(0.15, 0.35), size1: 0, color: pick(['#ffe3a8', '#ffc0d6', '#ffffff', '#cfe3ff']), cell: i2(CELL.star, CELL.sparkle), rot: rnd(0, 3) }); }
  }
  // soldiers' blobs and colliders
  soldiers.forEach((sd) => { sd.col.x = sd.pos.x; sd.col.z = sd.pos.z; });
}
const i2 = (a, b) => (Math.random() < 0.5 ? a : b);

/* ---------------- mice ---------------- */
function spawnMouse() {
  const ms = mice.find((m) => m.state === 'off');
  if (!ms) return null;
  const h = W.mouseHole;
  ms.pos.set(h.x, 0, h.z + rnd(-0.1, 0.1)); ms.state = 'emerge'; ms.t = 0; ms.exit = V3(h.x + 1.6, 0, h.z + rnd(-0.7, 0.4));
  ms.m.root.visible = true; ms.blob.visible = true; ms.m.root.scale.setScalar(1); ms.m.root.rotation.set(0, Math.PI / 2, 0);
  Sound.sfxSqueak(rnd(0.9, 1.2));
  return ms;
}
function killMouse(ms) {
  if (ms.state === 'dead' || ms.state === 'off') return;
  ms.state = 'dead'; ms.t = 0;
  Sound.sfxSqueak(1.35); Sound.sfxPoof();
  puff(ms.pos.x, 0.3, ms.pos.z, { n: 9, size: 0.7 });
  burst(ms.pos.x, 0.5, ms.pos.z, { n: 10, colors: ['#ffffff', '#ffd6e0', '#fff1c4'], speed: 2.2 });
  if (G.phase === 'wave') { G.waveKills++; Story.waveProgress(); }
}
function updateMice(dt) {
  const fighting = G.combat && !G.locked;
  for (const ms of mice) {
    if (ms.state === 'off') continue;
    ms.t += dt;
    let mvx = 0, mvz = 0, sp = 0;
    if (ms.state === 'emerge') {
      const dx = ms.exit.x - ms.pos.x, dz = ms.exit.z - ms.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.1 || ms.t > 1.6) { ms.state = fighting ? 'chase' : 'idle'; ms.t = 0; } else { mvx = dx / d; mvz = dz / d; sp = 2.2; }
    } else if (ms.state === 'idle') {
      if (fighting) ms.state = 'chase';
      sp = 0; ms.yaw = dampAngle(ms.yaw, Math.atan2(player.pos.x - ms.pos.x, player.pos.z - ms.pos.z), 4, dt);
    } else if (ms.state === 'chase') {
      if (!fighting) { ms.state = 'idle'; continue; }
      const dx = player.pos.x - ms.pos.x, dz = player.pos.z - ms.pos.z, d = Math.hypot(dx, dz) || 1;
      const w = Math.sin(ms.t * 3 + ms.seed) * 0.45;
      mvx = dx / d - (dz / d) * w; mvz = dz / d + (dx / d) * w;
      const l = Math.hypot(mvx, mvz); mvx /= l; mvz /= l;
      sp = G.phase === 'boss' ? 2.55 : 2.25;
      if (d < 0.62 && player.pos.y < 0.8) { if (hurtPlayer(ms.pos, 5.5)) Sound.sfxSqueak(1.1); ms.state = 'recoil'; ms.t = 0; }
    } else if (ms.state === 'recoil') {
      const dx = ms.pos.x - player.pos.x, dz = ms.pos.z - player.pos.z, d = Math.hypot(dx, dz) || 1;
      mvx = dx / d; mvz = dz / d; sp = 2.3;
      if (ms.t > 1.0) { ms.state = 'chase'; ms.t = 0; }
    } else if (ms.state === 'dead') {
      const k = Math.min(1, ms.t / 0.45);
      ms.m.root.rotation.y += dt * 18; ms.m.root.position.y = Math.sin(k * Math.PI) * 0.6;
      ms.m.root.scale.setScalar(Math.max(0.01, 1 - k));
      if (k >= 1) { ms.state = 'off'; ms.m.root.visible = false; ms.blob.visible = false; }
      continue;
    }
    if (sp > 0) {
      const np = _v2.set(ms.pos.x + mvx * sp * dt, 0, ms.pos.z + mvz * sp * dt);
      if (ms.state !== 'emerge') resolve(np, 0.24, 0, 0.6);
      ms.pos.x = np.x; ms.pos.z = np.z;
      ms.yaw = dampAngle(ms.yaw, Math.atan2(mvx, mvz), 10, dt);
    }
    for (const o of mice) {
      if (o === ms || o.state === 'off' || o.state === 'dead') continue;
      const dx = ms.pos.x - o.pos.x, dz = ms.pos.z - o.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.55 && d > 1e-4) { ms.pos.x += (dx / d) * (0.55 - d) * 0.5; ms.pos.z += (dz / d) * (0.55 - d) * 0.5; }
    }
    ms.speed = damp(ms.speed, sp / 2.4, 8, dt);
    ms.m.root.position.set(ms.pos.x, 0, ms.pos.z); ms.m.root.rotation.y = ms.yaw;
    ms.m.update(dt, ms.speed);
    ms.blob.position.set(ms.pos.x, 0.016, ms.pos.z);
  }
}

/* ---------------- toy soldiers come alive ---------------- */
function updateSoldiers(dt) {
  const alive = G.phase === 'wave' || G.phase === 'boss' || G.phase === 'midnight';
  for (const sd of soldiers) {
    sd.cd = Math.max(0, sd.cd - dt);
    let goal = null, sp = 0;
    if (alive && G.combat && !G.locked) {
      let best = null, bd = 3.6;
      for (const ms of mice) { if (ms.state !== 'chase' && ms.state !== 'recoil' && ms.state !== 'idle') continue; const d = ms.pos.distanceTo(sd.pos); if (d < bd) { bd = d; best = ms; } }
      if (best) {
        goal = best.pos;
        if (bd < 0.8 && sd.cd <= 0) {
          sd.cd = 2.2; sd.s.a.poke = 0.4;
          const v = best;
          if (Math.random() < 0.55) wait(0.25).then(() => { if (v.state !== 'dead' && v.state !== 'off') killMouse(v); });
          else if (v.state === 'chase') { v.state = 'recoil'; v.t = 0; Sound.sfxSqueak(1.2); }
        }
      }
    }
    if (!goal && alive) goal = sd.guard || sd.home;
    if (!goal && !alive) goal = sd.home;
    const dx = goal.x - sd.pos.x, dz = goal.z - sd.pos.z, d = Math.hypot(dx, dz);
    if (alive && d > 0.7) {
      sp = 1.45;
      const np = _v2.set(sd.pos.x + (dx / d) * sp * dt, 0, sd.pos.z + (dz / d) * sp * dt);
      sd.col.on = false; resolve(np, 0.22, 0, 1.2); sd.col.on = true;
      sd.pos.x = np.x; sd.pos.z = np.z;
      sd.yaw = dampAngle(sd.yaw, Math.atan2(dx, dz), 6, dt);
    } else if (alive) sd.yaw = dampAngle(sd.yaw, Math.atan2(player.pos.x - sd.pos.x, player.pos.z - sd.pos.z), 2, dt);
    sd.s.root.position.set(sd.pos.x, 0, sd.pos.z); sd.s.root.rotation.y = sd.yaw;
    sd.s.update(dt, sp > 0 ? 1 : 0);
    sd.blob.position.set(sd.pos.x, 0.015, sd.pos.z);
  }
}

/* ---------------- the Mouse King ---------------- */
const K = { pos: V3(), yaw: 0, state: 'off', t: 0, dir: V3(), invuln: 0, speed: 0, nextSummon: 0, taunt: 0 };
function updateKing(dt) {
  if (K.state === 'off') return;
  K.t += dt; K.invuln = Math.max(0, K.invuln - dt);
  let sp = 0, mvx = 0, mvz = 0;
  const dx = player.pos.x - K.pos.x, dz = player.pos.z - K.pos.z, d = Math.hypot(dx, dz) || 1;
  const fight = G.phase === 'boss' && !G.locked;
  switch (K.state) {
    case 'pose': K.yaw = dampAngle(K.yaw, Math.atan2(dx, dz), 4, dt); break;
    case 'stalk':
      if (!fight) break;
      mvx = dx / d; mvz = dz / d; sp = d > 2 ? 1.5 : 0.6;
      K.yaw = dampAngle(K.yaw, Math.atan2(dx, dz), 5, dt);
      if (K.t > K.stalkFor) { K.state = 'windup'; K.t = 0; king.a.mode = 'windup'; Sound.sfxSqueak(0.7); Sound.sfxLaugh(); }
      break;
    case 'windup':
      K.yaw = dampAngle(K.yaw, Math.atan2(dx, dz), 8, dt);
      if (K.t > 0.85) { K.state = 'charge'; K.t = 0; K.dir.set(Math.sin(K.yaw), 0, Math.cos(K.yaw)); king.a.mode = 'charge'; Sound.sfxThrow(); }
      break;
    case 'charge': {
      mvx = K.dir.x; mvz = K.dir.z; sp = 7.2;
      if (Math.random() < 0.6) puff(K.pos.x, 0.15, K.pos.z, { n: 1, size: 0.5, speed: 0.4 });
      if (K.t > 1.0) { K.state = 'dizzy'; K.t = 0; king.a.mode = 'dizzy'; }
      break;
    }
    case 'dizzy':
      if (Math.random() < dt * 10) { const a = K.t * 6; FX.add.spawn({ x: K.pos.x + Math.cos(a) * 0.5, y: 2.3, z: K.pos.z + Math.sin(a) * 0.5, life: 0.5, size: 0.3, size1: 0.1, color: '#ffe08a', cell: CELL.star, rot: a }); }
      if (K.t > 1.5) { K.state = 'stalk'; K.t = 0; K.stalkFor = rnd(2.2, 3.4); king.a.mode = 'idle'; }
      break;
    case 'hurt':
      mvx = -dx / d; mvz = -dz / d; sp = Math.max(0, 3.5 - K.t * 6);
      if (K.t > 0.8) { K.state = 'stalk'; K.t = 0; K.stalkFor = rnd(1.6, 2.6); king.a.mode = 'idle'; }
      break;
    case 'defeated': break;
  }
  if (sp > 0) {
    const np = _v2.set(K.pos.x + mvx * sp * dt, 0, K.pos.z + mvz * sp * dt);
    const before = _v3.copy(np);
    resolve(np, 0.5, 0, 1.8);
    if (K.state === 'charge' && before.distanceTo(np) > 0.02) { K.state = 'dizzy'; K.t = 0; king.a.mode = 'dizzy'; Cam.shake = 0.2; Sound.sfxLand(); }
    K.pos.x = np.x; K.pos.z = np.z;
  }
  K.speed = damp(K.speed, sp / 3, 8, dt);
  if (fight && (K.state === 'stalk' || K.state === 'charge') && d < 1.0 && player.pos.y < 1.1) { hurtPlayer(K.pos, K.state === 'charge' ? 9 : 6); if (K.state === 'charge') { K.state = 'dizzy'; K.t = 0; king.a.mode = 'dizzy'; } }
  if (fight) {
    K.nextSummon -= dt;
    const alive = mice.filter((m) => m.state !== 'off' && m.state !== 'dead').length;
    if (K.nextSummon <= 0 && alive < 2) { K.nextSummon = 6.5; spawnMouse(); }
    K.taunt -= dt;
    if (K.taunt <= 0) { K.taunt = rnd(9, 14); UI.toast(pick(['생쥐 왕: "찍찍! 내 왕관의 별은 못 가져간다!"', '생쥐 왕: "슬리퍼 따위, 피해 주마!"', '생쥐 왕: "병사들아, 저 소녀를 막아라!"']), 2200); }
  }
  king.root.position.set(K.pos.x, 0, K.pos.z); king.root.rotation.y = K.yaw;
  king.update(dt, K.speed);
  blobs.king.position.set(K.pos.x, 0.016, K.pos.z);
}
function hitKing() {
  if (K.invuln > 0 || K.state === 'defeated' || K.state === 'off') return false;
  G.kingHits++;
  K.invuln = 1.1; K.state = 'hurt'; K.t = 0; king.a.mode = 'hurt'; king.a.mt = 0; king.a.flash = 0.6;
  Sound.sfxHit(); Sound.sfxSqueak(0.8); Cam.shake = 0.3;
  const st = king.crownStars[G.kingHits - 1];
  if (st) st.visible = false;
  const from = st ? st.getWorldPosition(V3()) : V3(K.pos.x, 2.4, K.pos.z);
  burst(from.x, from.y, from.z, { n: 26, speed: 3.5 });
  const a = rnd(0, TAU), land = V3(clamp(K.pos.x + Math.cos(a) * 1.8, -11.5, 11.5), 0.9, clamp(K.pos.z + Math.sin(a) * 1.8, -2, 9));
  const it = starSet.add(`k${G.kingHits}`, land, { hidden: true });
  starSet.reveal(it.id, from);
  it.magnet = true;
  Story.kingHit();
  return true;
}

/* ---------------- slippers ---------------- */
function pickTarget() {
  let best = null, bs = 1e9;
  const fx = Math.sin(player.yaw), fz = Math.cos(player.yaw);
  const consider = (pos, isKing) => {
    const dx = pos.x - player.pos.x, dz = pos.z - player.pos.z, d = Math.hypot(dx, dz);
    if (d > 9.5) return;
    const facing = (dx * fx + dz * fz) / (d || 1);
    const score = d - facing * 1.6 - (isKing ? 0.8 : 0);
    if (score < bs) { bs = score; best = { pos, isKing }; }
  };
  for (const ms of mice) if (ms.state === 'chase' || ms.state === 'recoil' || ms.state === 'idle' || ms.state === 'emerge') consider(ms.pos, false);
  if (K.state !== 'off' && K.state !== 'defeated' && K.state !== 'pose') consider(K.pos, true);
  return best;
}
function throwSlipper() {
  if (player.throwCd > 0 || !player.grounded && player.vy > 2) return;
  const s = slippers.find((x) => !x.on); if (!s) return;
  player.throwCd = 0.42;
  const tgt = pickTarget();
  if (tgt) player.yaw = Math.atan2(tgt.pos.x - player.pos.x, tgt.pos.z - player.pos.z);
  clara.play('throw', 0.45); clara.setExpr('determined', 0.8);
  G.throws++;
  Sound.sfxThrow();
  s.on = true; s.t = 0; s.armed = 0.12;
  s.from.set(player.pos.x + Math.sin(player.yaw) * 0.25, player.pos.y + 1.35, player.pos.z + Math.cos(player.yaw) * 0.25);
  if (tgt) {
    const d = s.from.distanceTo(tgt.pos);
    s.T = clamp(d / 12, 0.22, 0.55);
    s.to.set(tgt.pos.x, tgt.isKing ? 1.3 : 0.35, tgt.pos.z);
    s.h = 0.5 + d * 0.06;
  } else {
    s.T = 0.5; s.to.set(player.pos.x + Math.sin(player.yaw) * 6, 0.1, player.pos.z + Math.cos(player.yaw) * 6); s.h = 1.2;
    resolve(s.to, 0.1, 0, 0.1);
  }
  s.mesh.visible = false;
}
function updateSlippers(dt) {
  for (const s of slippers) {
    if (!s.on) continue;
    if (s.armed > 0) { s.armed -= dt; if (s.armed <= 0) s.mesh.visible = true; else continue; }
    s.t += dt;
    const k = Math.min(1, s.t / s.T);
    s.pos.lerpVectors(s.from, s.to, k); s.pos.y += Math.sin(k * Math.PI) * s.h;
    s.mesh.position.copy(s.pos);
    s.mesh.rotation.set(s.t * 18, s.t * 7, 0);
    if (Math.random() < 0.9) FX.add.spawn({ x: s.pos.x, y: s.pos.y, z: s.pos.z, life: 0.45, size: rnd(0.14, 0.26), size1: 0, color: pick(['#ffd6e0', '#fff1c4', '#ffffff']), cell: CELL.sparkle, rot: rnd(0, 3) });
    let hit = false;
    for (const ms of mice) {
      if (ms.state === 'off' || ms.state === 'dead') continue;
      if (Math.hypot(ms.pos.x - s.pos.x, ms.pos.z - s.pos.z) < 0.55 && s.pos.y < 1.0) { killMouse(ms); Sound.sfxHit(); hit = true; break; }
    }
    if (!hit && K.state !== 'off' && K.state !== 'defeated' && K.state !== 'pose' && Math.hypot(K.pos.x - s.pos.x, K.pos.z - s.pos.z) < 0.85 && s.pos.y < 2.4) { hit = hitKing() || true; }
    if (hit || k >= 1) {
      s.on = false; s.mesh.visible = false;
      if (!hit) { puff(s.pos.x, s.pos.y, s.pos.z, { n: 4, size: 0.4, speed: 0.5 }); }
      burst(s.pos.x, s.pos.y, s.pos.z, { n: hit ? 16 : 6, speed: 2, colors: ['#ffd6e0', '#fff1c4', '#ffffff'] });
    }
  }
}

/* ---------------- pirouette (idle flourish) ---------------- */
function pirouette() {
  if (clara.a.action || !player.grounded) return;
  clara.play('spin', 0.9); clara.setExpr('happy', 0.9);
  Sound.bell(Sound.now, noteFreq('E6'), 1, 0.07); Sound.bell(Sound.now + 0.08, noteFreq('B6'), 1, 0.05);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; FX.add.spawn({ x: player.pos.x + Math.cos(a) * 0.5, y: player.pos.y + 0.2 + i * 0.05, z: player.pos.z + Math.sin(a) * 0.5, vx: Math.cos(a) * 0.6, vy: 0.8, vz: Math.sin(a) * 0.6, life: 0.9, size: 0.24, size1: 0, color: pick(GOLDS), cell: i % 2 ? CELL.star : CELL.sparkle, rot: a }); }
}
