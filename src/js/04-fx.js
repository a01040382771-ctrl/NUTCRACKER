/* =====================================================================
   04 · EFFECTS — sparkles, glows, snow, fire, magic stars, portal
   ===================================================================== */
const FX = { uniforms: { uTime: { value: 0 }, uScale: { value: 600 } } };

const SPRITE_VERT = /* glsl */`
  attribute vec3 aColor; attribute float aSize; attribute float aAlpha; attribute float aCell; attribute float aRot;
  uniform float uScale;
  varying vec3 vColor; varying float vAlpha; varying float vCell; varying float vRot;
  void main() {
    vColor = aColor; vAlpha = aAlpha; vCell = aCell; vRot = aRot;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / max(0.1, -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const SPRITE_FRAG = /* glsl */`
  uniform sampler2D uTex;
  varying vec3 vColor; varying float vAlpha; varying float vCell; varying float vRot;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float c = cos(vRot), s = sin(vRot);
    p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) * 1.3 + 0.5;
    if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) discard;
    float cx = mod(vCell, 4.0), cy = floor(vCell / 4.0);
    vec4 t = texture2D(uTex, vec2((cx + p.x) / 4.0, 1.0 - (cy + p.y) / 2.0));
    float a = t.a * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor * t.rgb, a);
    #include <colorspace_fragment>
  }`;

function spriteMaterial(additive) {
  return new THREE.ShaderMaterial({
    uniforms: { uTex: { value: TEX.particles }, uScale: FX.uniforms.uScale },
    vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG,
    transparent: true, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

/* cell ids in the particle atlas */
const CELL = { glow: 0, sparkle: 1, snow: 2, smoke: 3, star: 4, heart: 5, confetti: 6, ring: 7 };

class Particles {
  constructor(max, additive) {
    this.max = max; this.cursor = 0;
    const g = new THREE.BufferGeometry();
    this.aPos = new Float32Array(max * 3); this.aCol = new Float32Array(max * 3);
    this.aSize = new Float32Array(max); this.aAlpha = new Float32Array(max); this.aCell = new Float32Array(max); this.aRot = new Float32Array(max);
    const dyn = (arr, n) => { const a = new THREE.BufferAttribute(arr, n); a.setUsage(THREE.DynamicDrawUsage); return a; };
    g.setAttribute('position', dyn(this.aPos, 3)); g.setAttribute('aColor', dyn(this.aCol, 3));
    g.setAttribute('aSize', dyn(this.aSize, 1)); g.setAttribute('aAlpha', dyn(this.aAlpha, 1));
    g.setAttribute('aCell', dyn(this.aCell, 1)); g.setAttribute('aRot', dyn(this.aRot, 1));
    this.geo = g;
    this.points = new THREE.Points(g, spriteMaterial(additive));
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 20 : 19;
    this.p = [];
    for (let i = 0; i < max; i++) this.p.push({ alive: false });
    this.alive = 0;
  }
  spawn(o) {
    const i = this.cursor; this.cursor = (this.cursor + 1) % this.max;
    const p = this.p[i];
    p.alive = true; p.t = 0; p.life = o.life || 1;
    p.x = o.x; p.y = o.y; p.z = o.z;
    p.vx = o.vx || 0; p.vy = o.vy || 0; p.vz = o.vz || 0;
    p.g = o.g || 0; p.drag = o.drag || 0;
    p.s0 = o.size || 0.3; p.s1 = o.size1 !== undefined ? o.size1 : p.s0;
    p.a = o.alpha !== undefined ? o.alpha : 1;
    const c = o.color instanceof THREE.Color ? o.color : new THREE.Color(o.color || '#ffffff');
    p.r = c.r; p.gc = c.g; p.b = c.b;
    p.cell = o.cell || 0; p.rot = o.rot || 0; p.vr = o.vr || 0;
    p.fadeIn = o.fadeIn || 0.08; p.flicker = o.flicker || 0;
    p.follow = o.follow || null;
    return p;
  }
  update(dt) {
    const P = this.p;
    for (let i = 0; i < this.max; i++) {
      const p = P[i];
      if (!p.alive) { this.aAlpha[i] = 0; this.aSize[i] = 0; continue; }
      p.t += dt;
      if (p.t >= p.life) { p.alive = false; this.aAlpha[i] = 0; this.aSize[i] = 0; continue; }
      const k = p.t / p.life;
      p.vy += p.g * dt;
      if (p.drag) { const f = Math.exp(-p.drag * dt); p.vx *= f; p.vy *= f; p.vz *= f; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.rot += p.vr * dt;
      let a = p.a * Math.min(1, p.t / p.fadeIn) * (1 - smoothstep(0.55, 1, k));
      if (p.flicker) a *= 1 - p.flicker * 0.5 + p.flicker * 0.5 * Math.sin(p.t * 30 + i);
      const j = i * 3;
      this.aPos[j] = p.x; this.aPos[j + 1] = p.y; this.aPos[j + 2] = p.z;
      this.aCol[j] = p.r; this.aCol[j + 1] = p.gc; this.aCol[j + 2] = p.b;
      this.aSize[i] = lerp(p.s0, p.s1, k); this.aAlpha[i] = a; this.aCell[i] = p.cell; this.aRot[i] = p.rot;
    }
    const at = this.geo.attributes;
    at.position.needsUpdate = at.aColor.needsUpdate = at.aSize.needsUpdate = at.aAlpha.needsUpdate = at.aCell.needsUpdate = at.aRot.needsUpdate = true;
  }
  clear() { this.p.forEach((p) => (p.alive = false)); }
}

/* ---- burst presets ---- */
const GOLDS = ['#ffe9a8', '#ffd277', '#fff4d6', '#ffc0cf', '#cfe3ff'];
function burst(x, y, z, o = {}) {
  const n = o.n || 24, sp = o.speed || 3;
  for (let i = 0; i < n; i++) {
    const a = rnd(0, TAU), e = rnd(-0.4, 1.2), s = sp * rnd(0.4, 1);
    FX.add.spawn({
      x, y, z, vx: Math.cos(a) * Math.cos(e) * s, vy: Math.sin(e) * s + (o.up || 0), vz: Math.sin(a) * Math.cos(e) * s,
      g: o.g !== undefined ? o.g : -3, drag: 1.6, life: rnd(0.6, 1.2) * (o.life || 1),
      size: rnd(0.18, 0.4) * (o.size || 1), size1: 0.02, color: pick(o.colors || GOLDS),
      cell: o.cell !== undefined ? o.cell : (i % 3 === 0 ? CELL.star : CELL.sparkle), rot: rnd(0, TAU), vr: rnd(-6, 6), flicker: 0.6,
    });
  }
}
function puff(x, y, z, o = {}) {
  for (let i = 0; i < (o.n || 10); i++) {
    const a = rnd(0, TAU), s = rnd(0.6, 1.6) * (o.speed || 1);
    FX.norm.spawn({
      x: x + rnd(-0.15, 0.15), y: y + rnd(0, 0.3), z: z + rnd(-0.15, 0.15), vx: Math.cos(a) * s, vy: rnd(0.4, 1.4), vz: Math.sin(a) * s,
      drag: 2.2, life: rnd(0.7, 1.2), size: rnd(0.5, 0.9) * (o.size || 1), size1: rnd(1.1, 1.6) * (o.size || 1),
      color: pick(o.colors || ['#d9cfd6', '#efe7ec', '#bfb2bd']), alpha: 0.85, cell: CELL.smoke, rot: rnd(0, TAU), vr: rnd(-1, 1),
    });
  }
}
function confetti(x, y, z, n = 40) {
  const cols = ['#f3c3cc', '#d7ad5a', '#b7d2ec', '#7d1d36', '#fbf4e6', '#ffd77a'];
  for (let i = 0; i < n; i++) {
    const a = rnd(0, TAU), s = rnd(1.5, 4);
    FX.norm.spawn({
      x, y, z, vx: Math.cos(a) * s * 0.6, vy: rnd(3, 6.5), vz: Math.sin(a) * s * 0.6, g: -7, drag: 1.3, life: rnd(1.4, 2.2),
      size: rnd(0.12, 0.2), color: pick(cols), cell: CELL.confetti, rot: rnd(0, TAU), vr: rnd(-12, 12), alpha: 1,
    });
  }
}

/* ---- static twinkling glows (bulbs, candles, footlights) ---- */
const GLOW_VERT = /* glsl */`
  attribute vec3 aColor; attribute vec3 aInfo; // size, twinkle, phase
  uniform float uScale; uniform float uTime; uniform float uBoost;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    vColor = aColor;
    float tw = aInfo.y;
    vAlpha = (1.0 - tw * 0.55 + tw * 0.55 * sin(uTime * (1.6 + fract(aInfo.z * 7.13) * 2.6) + aInfo.z * 6.283)) * uBoost;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aInfo.x * uScale / max(0.1, -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const GLOW_FRAG = /* glsl */`
  uniform sampler2D uTex; uniform float uCell;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    vec2 p = gl_PointCoord;
    float cx = mod(uCell, 4.0), cy = floor(uCell / 4.0);
    vec4 t = texture2D(uTex, vec2((cx + p.x) / 4.0, 1.0 - (cy + p.y) / 2.0));
    gl_FragColor = vec4(vColor * t.rgb, t.a * vAlpha);
    #include <colorspace_fragment>
  }`;
function makeGlowPoints(list, o = {}) {
  const n = list.length, pos = new Float32Array(n * 3), colr = new Float32Array(n * 3), info = new Float32Array(n * 3);
  const c = new THREE.Color();
  list.forEach((g, i) => {
    pos.set(g.p, i * 3); c.set(g.c || '#ffd98a'); colr.set([c.r, c.g, c.b], i * 3);
    info.set([g.s || 0.4, g.tw !== undefined ? g.tw : 0.5, g.ph !== undefined ? g.ph : rnd(0, 1)], i * 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colr, 3));
  geo.setAttribute('aInfo', new THREE.BufferAttribute(info, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: TEX.particles }, uScale: FX.uniforms.uScale, uTime: FX.uniforms.uTime, uBoost: { value: o.boost || 1 }, uCell: { value: o.cell || 0 } },
    vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.renderOrder = 18;
  pts.frustumCulled = false;
  return pts;
}

/* ---- GPU snowfall ---- */
const SNOW_VERT = /* glsl */`
  attribute vec3 aSeed; // speed, phase, size
  uniform float uTime; uniform float uScale; uniform vec3 uMin; uniform vec3 uMax;
  varying float vAlpha; varying float vRot;
  void main() {
    vec3 p = position;
    float h = uMax.y - uMin.y;
    p.y = uMax.y - mod((uMax.y - position.y) + uTime * aSeed.x, h);
    p.x += sin(uTime * 0.7 + aSeed.y * 6.283) * 0.35;
    p.z += cos(uTime * 0.53 + aSeed.y * 4.0) * 0.25;
    vAlpha = smoothstep(uMin.y, uMin.y + 0.6, p.y) * smoothstep(uMax.y, uMax.y - 1.0, p.y);
    vRot = uTime * (aSeed.y - 0.5) * 2.0 + aSeed.y * 6.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSeed.z * uScale / max(0.1, -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const SNOW_FRAG = /* glsl */`
  uniform sampler2D uTex; uniform float uOpacity; uniform vec3 uColor; uniform float uCell;
  varying float vAlpha; varying float vRot;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float c = cos(vRot), s = sin(vRot);
    p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) * 1.25 + 0.5;
    if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) discard;
    float cx = mod(uCell, 4.0), cy = floor(uCell / 4.0);
    vec4 t = texture2D(uTex, vec2((cx + p.x) / 4.0, 1.0 - (cy + p.y) / 2.0));
    gl_FragColor = vec4(uColor * t.rgb, t.a * vAlpha * uOpacity);
    #include <colorspace_fragment>
  }`;
function makeSnow(count, min, max, o = {}) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos.set([rnd(min[0], max[0]), rnd(min[1], max[1]), rnd(min[2], max[2])], i * 3);
    seed.set([rnd(0.35, 0.9) * (o.speed || 1), rnd(0, 1), rnd(0.07, 0.17) * (o.size || 1)], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: TEX.particles }, uTime: FX.uniforms.uTime, uScale: FX.uniforms.uScale,
      uMin: { value: new THREE.Vector3(...min) }, uMax: { value: new THREE.Vector3(...max) },
      uOpacity: { value: o.opacity !== undefined ? o.opacity : 1 }, uColor: { value: new THREE.Color(o.color || '#ffffff') }, uCell: { value: o.cell !== undefined ? o.cell : CELL.snow },
    },
    vertexShader: SNOW_VERT, fragmentShader: SNOW_FRAG, transparent: true, depthWrite: false,
    blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false; pts.renderOrder = 17;
  return pts;
}

/* ---- fireplace flames (noise shader on crossed quads) ---- */
const FLAME_FRAG = /* glsl */`
  uniform float uTime; uniform float uSeed; uniform float uPower;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
  void main() {
    vec2 uv = vUv;
    float n = noise(vec2(uv.x * 4.0 + uSeed, uv.y * 3.0 - uTime * 2.4)) * 0.6 + noise(vec2(uv.x * 9.0 - uSeed, uv.y * 7.0 - uTime * 4.0)) * 0.4;
    float w = (1.0 - uv.y) * 0.5 * (0.7 + 0.5 * n);
    float d = abs(uv.x - 0.5 + (n - 0.5) * 0.18 * uv.y);
    float body = smoothstep(w, w * 0.25, d) * smoothstep(0.0, 0.12, uv.y);
    float top = 1.0 - smoothstep(0.35, 1.0, uv.y + (n - 0.5) * 0.5);
    float a = body * top * uPower;
    float core = smoothstep(0.55, 0.05, d / max(w, 0.001)) * (1.0 - uv.y);
    vec3 col = mix(vec3(0.95, 0.25, 0.05), vec3(1.0, 0.78, 0.35), core);
    col = mix(col, vec3(1.0, 0.95, 0.8), core * core * 0.6);
    gl_FragColor = vec4(col * a * 1.6, a);
    #include <colorspace_fragment>
  }`;
function makeFlames(w, h, count = 3) {
  const grp = new THREE.Group();
  const mats = [];
  for (let i = 0; i < count; i++) {
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: FX.uniforms.uTime, uSeed: { value: i * 3.7 }, uPower: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: FLAME_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    mats.push(m);
    const q = new THREE.Mesh(GEO.plane(), m);
    q.scale.set(w * (i === 1 ? 1 : 0.75), h * (i === 1 ? 1 : 0.8), 1);
    q.position.set((i - 1) * w * 0.32, h * (i === 1 ? 0.5 : 0.4), (i - 1) * 0.05);
    q.rotation.y = (i - 1) * 0.5;
    q.renderOrder = 21;
    grp.add(q);
  }
  grp.userData.mats = mats;
  return grp;
}

/* ---- magic star collectibles ---- */
class StarSet {
  constructor(max = 16) {
    this.max = max;
    this.mesh = new THREE.InstancedMesh(starGeo(0.3, 0.13, 0.09, 0.05), MAT.starGold, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = false; this.mesh.frustumCulled = false;
    this.items = [];
    this.halo = makeGlowPoints(Array.from({ length: max }, () => ({ p: [0, -50, 0], c: '#ffd98a', s: 1.6, tw: 0.25 })), { boost: 0.9 });
    this.dummy = new THREE.Object3D();
    this.hidden = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < max; i++) this.mesh.setMatrixAt(i, this.hidden);
  }
  add(id, pos, o = {}) {
    const it = { id, slot: this.items.length, base: pos.clone(), pos: pos.clone(), state: o.hidden ? 'hidden' : 'idle', t: rnd(0, 10), scale: o.hidden ? 0 : 1, follow: null, phase: o.phase || 1 };
    this.items.push(it);
    return it;
  }
  get(id) { return this.items.find((s) => s.id === id); }
  reveal(id, from) {
    const it = this.get(id); if (!it || it.state !== 'hidden') return it;
    it.state = 'pop'; it.pt = 0; it.from = (from || it.base).clone(); it.scale = 0;
    return it;
  }
  update(dt) {
    const posAttr = this.halo.geometry.attributes.position;
    for (const it of this.items) {
      it.t += dt;
      if (it.follow && (it.state === 'pop' || it.state === 'hidden')) it.base.copy(it.follow());
      if (it.state === 'pop') {
        it.pt += dt;
        const k = Math.min(1, it.pt / 0.9);
        it.pos.lerpVectors(it.from, it.base, Ease.out(k));
        it.pos.y += Math.sin(k * Math.PI) * 1.4;
        it.scale = Ease.outBack(Math.min(1, it.pt / 0.5));
        if (Math.random() < 0.5) FX.add.spawn({ x: it.pos.x, y: it.pos.y, z: it.pos.z, life: 0.6, size: 0.25, size1: 0, color: pick(GOLDS), cell: CELL.sparkle, vy: 0.3 });
        if (k >= 1) it.state = 'idle';
      } else if (it.state === 'idle') {
        if (it.follow) it.base.copy(it.follow());
        it.pos.copy(it.base); it.pos.y += Math.sin(it.t * 2.2) * 0.12;
      } else if (it.state === 'collect') {
        it.ct += dt;
        const k = Math.min(1, it.ct / 0.45);
        it.pos.y += dt * 2.5; it.scale = 1 + k * 0.6;
        if (k >= 1) { it.state = 'done'; it.scale = 0; }
      }
      if (it.state === 'hidden' || it.state === 'done') {
        this.mesh.setMatrixAt(it.slot, this.hidden);
        posAttr.setXYZ(it.slot, 0, -50, 0);
        continue;
      }
      const d = this.dummy;
      d.position.copy(it.pos);
      d.rotation.set(0, it.t * 1.8, Math.sin(it.t * 1.3) * 0.15);
      d.scale.setScalar(Math.max(0.0001, it.scale));
      d.updateMatrix();
      this.mesh.setMatrixAt(it.slot, d.matrix);
      posAttr.setXYZ(it.slot, it.pos.x, it.pos.y, it.pos.z);
      if (it.state === 'idle' && Math.random() < dt * 3) {
        const a = rnd(0, TAU);
        FX.add.spawn({ x: it.pos.x + Math.cos(a) * 0.35, y: it.pos.y + rnd(-0.3, 0.3), z: it.pos.z + Math.sin(a) * 0.35, vy: 0.35, life: 0.9, size: rnd(0.12, 0.24), size1: 0, color: pick(GOLDS), cell: CELL.sparkle, rot: rnd(0, 3) });
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    posAttr.needsUpdate = true;
  }
  reset() { this.items.length = 0; for (let i = 0; i < this.max; i++) this.mesh.setMatrixAt(i, this.hidden); }
}

/* ---- portal of stars ---- */
function makePortal() {
  const grp = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({ map: TEX.rune, color: '#ffd98a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const ring = new THREE.Mesh(GEO.plane(), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.scale.setScalar(3.2); ring.position.y = 0.03; ring.renderOrder = 16;
  const ring2 = new THREE.Mesh(GEO.plane(), ringMat.clone());
  ring2.material.color.set('#f6b6d0'); ring2.rotation.x = -Math.PI / 2; ring2.scale.setScalar(2.2); ring2.position.y = 0.05; ring2.renderOrder = 16;
  const colMat = new THREE.MeshBasicMaterial({ map: TEX.beam, color: '#ffe3a8', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, opacity: 0.9 });
  const colGeo = new THREE.CylinderGeometry(1.1, 1.3, 6, 32, 1, true);
  colGeo.translate(0, 3, 0);
  const uv = colGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i)); // beam texture: bright at the base
  const column = new THREE.Mesh(colGeo, colMat);
  column.rotation.x = Math.PI; column.position.y = 6; column.renderOrder = 15;
  grp.add(ring, ring2, column);
  grp.userData = { ring, ring2, column };
  grp.visible = false;
  return grp;
}

function makeBlob(r = 0.5) {
  const m = new THREE.Mesh(GEO.plane(), MAT.shadow);
  m.rotation.x = -Math.PI / 2; m.scale.set(r * 2, r * 2, 1); m.position.y = 0.015; m.renderOrder = 2;
  return m;
}
