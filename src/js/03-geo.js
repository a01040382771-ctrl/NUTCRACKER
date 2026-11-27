/* =====================================================================
   03 · GEOMETRY — static batching (one draw per material), shapes, materials
   ===================================================================== */
const _e = new THREE.Euler(), _q = new THREE.Quaternion();
function TRS(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(rx, ry, rz); _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.clone(), new THREE.Vector3(sx, sy, sz));
}

/* Merges many small parts into one mesh with baked vertex colours. */
class Batch {
  constructor(mat) { this.mat = mat; this.parts = []; this.stack = [new THREE.Matrix4()]; }
  push(m) { this.stack.push(this.stack[this.stack.length - 1].clone().multiply(m)); return this; }
  pop() { this.stack.pop(); return this; }
  add(geo, color, m, uvRect) {
    const M = this.stack[this.stack.length - 1].clone();
    if (m) M.multiply(m);
    this.parts.push({ geo, color, M, uvRect });
    return this;
  }
  get empty() { return this.parts.length === 0; }
  build(o = {}) {
    let nv = 0, ni = 0;
    for (const p of this.parts) {
      nv += p.geo.attributes.position.count;
      ni += p.geo.index ? p.geo.index.count : p.geo.attributes.position.count;
    }
    const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), cl = new Float32Array(nv * 3);
    const idx = nv > 65000 ? new Uint32Array(ni) : new Uint16Array(ni);
    const c = new THREE.Color(), v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
    let vo = 0, io = 0;
    for (const p of this.parts) {
      const g = p.geo, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
      nm.getNormalMatrix(p.M);
      const fn = typeof p.color === 'function';
      if (!fn) c.set(p.color);
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i);
        if (fn) c.set(p.color(v.x, v.y, v.z, i));
        v.applyMatrix4(p.M);
        const k = (vo + i) * 3;
        pos[k] = v.x; pos[k + 1] = v.y; pos[k + 2] = v.z;
        if (N) { n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nrm[k] = n.x; nrm[k + 1] = n.y; nrm[k + 2] = n.z; }
        cl[k] = c.r; cl[k + 1] = c.g; cl[k + 2] = c.b;
        if (U) {
          let uu = U.getX(i), vv = U.getY(i);
          if (p.uvRect) { uu = lerp(p.uvRect[0], p.uvRect[2], uu); vv = lerp(p.uvRect[1], p.uvRect[3], vv); }
          uv[(vo + i) * 2] = uu; uv[(vo + i) * 2 + 1] = vv;
        }
      }
      const cnt = g.index ? g.index.count : P.count;
      if (g.index) for (let k = 0; k < cnt; k++) idx[io + k] = g.index.getX(k) + vo;
      else for (let k = 0; k < cnt; k++) idx[io + k] = vo + k;
      if (p.M.determinant() < 0) for (let k = io; k < io + cnt; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
      vo += P.count; io += cnt;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.BufferAttribute(cl, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, o.mat || this.mat);
    mesh.castShadow = o.cast !== false; mesh.receiveShadow = o.receive !== false;
    if (o.name) mesh.name = o.name;
    return mesh;
  }
}

/* ---------- cached primitive geometries ---------- */
const _gcache = new Map();
function cached(key, make) { if (!_gcache.has(key)) _gcache.set(key, make()); return _gcache.get(key); }
const GEO = {
  box: () => cached('box', () => new THREE.BoxGeometry(1, 1, 1)),
  sph: (w = 16, h = 12) => cached(`s${w},${h}`, () => new THREE.SphereGeometry(1, w, h)),
  hemi: (w = 16, h = 8) => cached(`h${w},${h}`, () => new THREE.SphereGeometry(1, w, h, 0, TAU, 0, Math.PI / 2)),
  cyl: (s = 16, open = false, top = 1) => cached(`c${s}${open}${top}`, () => new THREE.CylinderGeometry(top, 1, 1, s, 1, open)),
  cone: (s = 16) => cached(`k${s}`, () => new THREE.ConeGeometry(1, 1, s)),
  torus: (r = 1, t = 0.3, rs = 8, ts = 24, arc = TAU) => cached(`t${r},${t},${rs},${ts},${arc}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc)),
  capsule: (r, len, cs = 6, rs = 12) => cached(`p${r},${len},${cs},${rs}`, () => new THREE.CapsuleGeometry(r, len, cs, rs)),
  circle: (s = 32) => cached(`ci${s}`, () => new THREE.CircleGeometry(1, s)),
  plane: () => cached('pl', () => new THREE.PlaneGeometry(1, 1)),
};

/* rounded box with true circular edges (k segments per corner) */
function roundBox(w, h, d, r, k = 3) {
  return cached(`rb${w},${h},${d},${r},${k}`, () => {
    r = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
    const N = 2 * k + 1;
    const g = new THREE.BoxGeometry(w, h, d, N, N, N);
    const P = g.attributes.position, Nn = g.attributes.normal;
    const half = [w / 2, h / 2, d / 2];
    const remap = (val, hf) => {
      const t = (val + hf) / (2 * hf), i = Math.round(t * N);
      if (i <= k) return -hf + r * (i / k) * (1 - 1e-4) + (i === 0 ? 0 : 0);
      if (i >= N - k) return hf - r * ((N - i) / k);
      return lerp(-hf + r, hf - r, (i - k) / (N - 2 * k));
    };
    const v = new THREE.Vector3(), inner = new THREE.Vector3(), nn = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) {
      v.set(remap(P.getX(i), half[0]), remap(P.getY(i), half[1]), remap(P.getZ(i), half[2]));
      inner.set(clamp(v.x, -half[0] + r, half[0] - r), clamp(v.y, -half[1] + r, half[1] - r), clamp(v.z, -half[2] + r, half[2] - r));
      nn.subVectors(v, inner);
      if (nn.lengthSq() < 1e-10) { nn.fromBufferAttribute(Nn, i); } else nn.normalize();
      v.copy(inner).addScaledVector(nn, r);
      if (nn.lengthSq() > 0 && inner.distanceTo(v) < 1e-6) v.fromBufferAttribute(P, i);
      P.setXYZ(i, v.x, v.y, v.z); Nn.setXYZ(i, nn.x, nn.y, nn.z);
    }
    return g;
  });
}

/* lathe from [r,y] pairs, optional Catmull-Rom smoothing (seam placed at the back) */
function lathe(pts, segs = 24, smooth = 0, phiStart = Math.PI, phiLen = TAU) {
  let v2 = pts.map((p) => new THREE.Vector2(p[0], p[1]));
  if (smooth) v2 = new THREE.SplineCurve(v2).getPoints(smooth);
  // close the profile through the axis; a clockwise outline would face inward, so flip it
  const poly = v2.concat([new THREE.Vector2(0, v2[v2.length - 1].y), new THREE.Vector2(0, v2[0].y)]);
  let area = 0;
  for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; area += p.x * q.y - q.x * p.y; }
  if (area < 0) v2.reverse();
  return new THREE.LatheGeometry(v2, segs, phiStart, phiLen);
}
/* average normals of coincident vertices so UV seams don't show as creases */
function smoothSeams(geo) {
  const P = geo.attributes.position, N = geo.attributes.normal, map = new Map();
  const key = (i) => `${Math.round(P.getX(i) * 1e4)},${Math.round(P.getY(i) * 1e4)},${Math.round(P.getZ(i) * 1e4)}`;
  for (let i = 0; i < P.count; i++) { const k = key(i); let e = map.get(k); if (!e) map.set(k, (e = [])); e.push(i); }
  const n = new THREE.Vector3(), t = new THREE.Vector3();
  for (const ids of map.values()) {
    if (ids.length < 2) continue;
    n.set(0, 0, 0);
    for (const i of ids) n.add(t.fromBufferAttribute(N, i));
    if (n.lengthSq() < 1e-12) continue;
    n.normalize();
    for (const i of ids) N.setXYZ(i, n.x, n.y, n.z);
  }
  N.needsUpdate = true;
  return geo;
}
/* displace every vertex: fn(v: Vector3) mutates v */
function deform(geo, fn) {
  const P = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); fn(v, i); P.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals();
  smoothSeams(geo);
  return geo;
}
function tubeGeo(points, radius, tubSeg = 48, radSeg = 8, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2]))), closed);
  return new THREE.TubeGeometry(curve, tubSeg, radius, radSeg, closed);
}
function starShape(R, r, n = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 ? r : R, a = Math.PI / 2 + (i * Math.PI) / n;
    const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  s.closePath();
  return s;
}
function starGeo(R = 0.32, r = 0.14, depth = 0.08, bevel = 0.045) {
  return cached(`star${R},${r},${depth},${bevel}`, () => {
    const g = new THREE.ExtrudeGeometry(starShape(R, r), { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 4 });
    g.translate(0, 0, -depth / 2);
    g.computeVertexNormals();
    return g;
  });
}
/* face-projection UVs: front of a head maps to the centre of a face texture */
function planarFaceUV(geo, rx, ry, cy = 0, spread = 0.46) {
  const P = geo.attributes.position, U = geo.attributes.uv;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i) / rx, y = (P.getY(i) - cy) / ry, z = P.getZ(i);
    if (z >= 0) U.setXY(i, 0.5 + x * spread, 0.5 + y * spread);
    else { const l = Math.hypot(x, y) || 1; U.setXY(i, 0.5 + (x / l) * 0.49, 0.5 + (y / l) * 0.49); }
  }
  U.needsUpdate = true;
  return geo;
}
/* A head with the painted face on its front half and hair round the back (for the Nutcracker's box-shaped head).
   planarFaceUV sends the far side of a head to the texture's rim by direction. A sphere under hair never shows it, but the
   flat back of a box has no single "outward" direction, so neighbouring vertices land on opposite sides of the rim and the
   triangles between them pull the middle of the texture across the back: a small second face (eyes, brows, cheeks).
   So the mesh is cut at z = 0 into two sets of vertices (the vertices along the cut are duplicated, so the seam can carry
   two UVs) and two triangle groups, one per material:
   group 0, the front half, is projected straight on, exactly like planarFaceUV (face texture);
   group 1, the back half, takes u from the angle round the head, 0 at the +x seam (the Nutcracker's left side), 0.5 straight
   behind, 1 at the -x seam (his right side), and v from the same height as the face, so a hair texture's end columns can match the face texture's edge.
   Returns a new geometry and leaves the source (usually cached) alone. */
function faceHeadGeo(src, rx, ry, cy = 0, spread = 0.46) {
  const P = src.attributes.position, N = src.attributes.normal, I = src.index.array;
  const pos = [], nor = [], uv = [], tri = [[], []], made = [new Map(), new Map()];   // made[side]: source vertex → new vertex
  for (let t = 0; t < I.length; t += 3) {
    const side = P.getZ(I[t]) + P.getZ(I[t + 1]) + P.getZ(I[t + 2]) < 0 ? 1 : 0;   // 0 = front half, 1 = back half
    for (let k = 0; k < 3; k++) {
      const i = I[t + k];
      let j = made[side].get(i);
      if (j === undefined) {
        j = pos.length / 3; made[side].set(i, j);
        const x = P.getX(i), y = P.getY(i), z = P.getZ(i), v = 0.5 + ((y - cy) / ry) * spread;
        let u = 0.5 + (x / rx) * spread;
        if (side) { let a = Math.atan2(x, z); if (a < 0) a += TAU; u = clamp((a - Math.PI / 2) / Math.PI, 0, 1); }   // a: 0 straight ahead, 90° at +x, 180° straight behind
        pos.push(x, y, z); nor.push(N.getX(i), N.getY(i), N.getZ(i)); uv.push(u, v);
      }
      tri[side].push(j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(tri[0].concat(tri[1]));
  g.addGroup(0, tri[0].length, 0); g.addGroup(tri[0].length, tri[1].length, 1);
  g.computeBoundingSphere();
  return g;
}
/* velvet drape: plane with vertical folds, optional tie-back pinch */
function drapeGeo(w, h, folds, depth, opts = {}) {
  const sx = opts.segX || Math.max(24, folds * 6), sy = opts.segY || 18;
  const g = new THREE.PlaneGeometry(w, h, sx, sy);
  g.translate(0, -h / 2, 0); // hang from top (y=0)
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    let x = P.getX(i), y = P.getY(i);
    const u = (x + w / 2) / w, t = -y / h;
    let z = Math.sin(u * folds * TAU) * depth * (0.55 + 0.45 * t);
    if (opts.tie !== undefined) {
      const d = Math.abs(t - opts.tie), pinch = Math.exp(-d * d * 30) * 0.68;
      const toward = opts.tieSide || 0;
      x = lerp(x, toward * w * 0.5, pinch);
      z *= 1 - pinch * 0.4;
      if (t > opts.tie) x = lerp(x, x * 1.12, (t - opts.tie) * 0.6);
    }
    if (opts.flare) x *= 1 + t * t * opts.flare;
    P.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/* ---------- materials ---------- */
const MAT = {};
function buildMaterials() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  MAT.cloth = new THREE.MeshLambertMaterial({ vertexColors: true, map: TEX.brush });
  MAT.wood = std({ vertexColors: true, map: TEX.brush, roughness: 0.55, metalness: 0.0 });
  MAT.gloss = std({ vertexColors: true, roughness: 0.22, metalness: 0.0 });
  MAT.porcelain = std({ vertexColors: true, roughness: 0.3, metalness: 0.0 });
  MAT.gold = std({ vertexColors: true, roughness: 0.3, metalness: 0.92 });
  MAT.glow = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  MAT.fur = new THREE.MeshLambertMaterial({ vertexColors: true, map: TEX.brush });
  MAT.satin = std({ vertexColors: true, roughness: 0.42, metalness: 0.05, map: TEX.brush });
  MAT.wall = new THREE.MeshLambertMaterial({ map: TEX.wallpaper });
  MAT.floor = std({ map: TEX.parquet, roughness: 0.46, metalness: 0.0 });
  MAT.carpet = new THREE.MeshLambertMaterial({ map: TEX.carpet });
  MAT.marble = std({ map: TEX.marble, vertexColors: true, roughness: 0.25 });
  MAT.gifts = std({ map: TEX.gifts, vertexColors: true, roughness: 0.5 });
  MAT.blocks = std({ map: TEX.blocks, vertexColors: true, roughness: 0.45 });
  MAT.needles = new THREE.MeshLambertMaterial({ map: TEX.needles, vertexColors: true });
  MAT.ermine = new THREE.MeshLambertMaterial({ map: TEX.ermine });
  MAT.mirror = std({ color: '#e9e3f2', roughness: 0.05, metalness: 1.0 });
  MAT.ornament = std({ roughness: 0.16, metalness: 0.55 });
  MAT.starGold = std({ color: '#ffd77a', emissive: '#ffb347', emissiveIntensity: 0.55, roughness: 0.25, metalness: 0.55 });
  MAT.shadow = new THREE.MeshBasicMaterial({ map: TEX.blob, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
}
