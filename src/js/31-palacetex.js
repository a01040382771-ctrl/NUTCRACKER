/* =====================================================================
   31 · CHAPTER V TEXTURES & MATERIALS — the glass stage, the crystals and the sky of the dream gala
   ===================================================================== */
const MAT5 = {};

/* the glass floor seen from above: a sugar-glass rose of sixteen petals, gold inlays under the light rings, scallops at the rim */
function palaceFloorTex() {
  const s = 1024, cv = makeCanvas(s, s), c = cv.getContext('2d'), C = s / 2, S = PALACE_CFG.stage;
  const rr = (r) => (r / S.radius) * C;   // stage metres → texture pixels
  const g0 = c.createRadialGradient(C, C, 0, C, C, C);
  g0.addColorStop(0, '#fff8fc'); g0.addColorStop(0.5, '#f1d6e8'); g0.addColorStop(1, '#d9b4d2');
  c.fillStyle = g0; c.fillRect(0, 0, s, s);
  const tints = ['#f4afd1', '#c8b1f4', '#afd5f4', '#f5d29e'];
  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * TAU + 0.02, a1 = a0 + TAU / 16 - 0.04, inR = rr(2.7), outR = rr(13.2);
    const g = c.createRadialGradient(C, C, inR, C, C, outR);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.3, tints[i % 4]); g.addColorStop(0.85, tints[(i + 1) % 4]); g.addColorStop(1, 'rgba(255,255,255,0.1)');
    c.fillStyle = g; c.globalAlpha = 0.82;
    c.beginPath(); c.moveTo(C + Math.cos(a0) * inR, C + Math.sin(a0) * inR); c.arc(C, C, outR, a0, a1); c.lineTo(C + Math.cos(a1) * inR, C + Math.sin(a1) * inR); c.closePath(); c.fill();
    // a thin bright vein down the middle of every petal
    const am = (a0 + a1) / 2; c.globalAlpha = 0.55; c.strokeStyle = '#ffffff'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(C + Math.cos(am) * inR, C + Math.sin(am) * inR); c.lineTo(C + Math.cos(am) * outR, C + Math.sin(am) * outR); c.stroke();
  }
  c.globalAlpha = 1;
  c.strokeStyle = '#d4a64c';
  for (const r of S.rings) {
    c.lineWidth = 6; c.beginPath(); c.arc(C, C, rr(r), 0, TAU); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.arc(C, C, rr(r) + 11, 0, TAU); c.stroke(); c.beginPath(); c.arc(C, C, rr(r) - 11, 0, TAU); c.stroke();
  }
  c.lineWidth = 4; c.beginPath(); c.arc(C, C, rr(13.65), 0, TAU); c.stroke();
  for (let i = 0; i < 112; i++) {
    const a = (i / 112) * TAU; c.beginPath(); c.arc(C + Math.cos(a) * rr(13.2), C + Math.sin(a) * rr(13.2), 6.5, 0, TAU);
    c.fillStyle = i % 2 ? '#f2c1d9' : '#fff1f7'; c.fill();
  }
  // sugar glitter
  for (let i = 0; i < 2600; i++) {
    const a = rnd(0, TAU), r = Math.sqrt(rnd(0, 1)) * C;
    c.fillStyle = `rgba(255,255,255,${rnd(0.2, 0.75)})`; c.fillRect(C + Math.cos(a) * r, C + Math.sin(a) * r, rnd(1, 2.6), rnd(1, 2.6));
  }
  return toTex(cv, { aniso: 8 });
}

/* the dais top: a gold eight-pointed star on pearl */
function palaceDaisTex() {
  const s = 512, cv = makeCanvas(s, s), c = cv.getContext('2d'), C = s / 2;
  const g = c.createRadialGradient(C, C, 0, C, C, C); g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#fbe9f3'); g.addColorStop(1, '#f1d2e6');
  c.fillStyle = g; c.fillRect(0, 0, s, s);
  const star = (R0, R1, n, rot, fill) => {
    c.beginPath();
    for (let i = 0; i < n * 2; i++) { const r = i % 2 ? R1 : R0, a = rot + (i * Math.PI) / n; const x = C + Math.cos(a) * r, y = C + Math.sin(a) * r; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath(); c.fillStyle = fill; c.fill();
  };
  star(236, 92, 8, -Math.PI / 2, '#e2b75e'); star(200, 80, 8, -Math.PI / 2 + Math.PI / 8, '#f6dc96'); star(120, 46, 8, -Math.PI / 2, '#fff4d6');
  c.strokeStyle = '#c99a42'; c.lineWidth = 5; c.beginPath(); c.arc(C, C, 246, 0, TAU); c.stroke();
  c.lineWidth = 2; c.beginPath(); c.arc(C, C, 226, 0, TAU); c.stroke();
  for (let i = 0; i < 700; i++) { const a = rnd(0, TAU), r = Math.sqrt(rnd(0, 1)) * C; c.fillStyle = `rgba(255,255,255,${rnd(0.25, 0.8)})`; c.fillRect(C + Math.cos(a) * r, C + Math.sin(a) * r, 1.6, 1.6); }
  return toTex(cv, { aniso: 8 });
}

/* an aurora ribbon: soft at both ends, a bright core with a curtain of rays below it (white; the material colours it) */
function palaceRibbonTex() {
  const w = 512, h = 128, cv = makeCanvas(w, h), c = cv.getContext('2d'), img = c.createImageData(w, h), D = img.data;
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);
      const ends = Math.pow(Math.sin(Math.PI * u), 0.85);
      const core = Math.exp(-(((v - 0.34) / 0.1) ** 2));
      const rays = (0.5 + 0.5 * Math.sin(u * 150 + Math.sin(u * 21) * 5)) * Math.exp(-(((v - 0.62) / 0.24) ** 2));
      const a = ends * clamp(core * 0.95 + rays * 0.55, 0, 1);
      const i = (y * w + x) * 4; D[i] = D[i + 1] = D[i + 2] = 255; D[i + 3] = Math.round(255 * a);
    }
  }
  c.putImageData(img, 0, 0);
  return toTex(cv);
}

/* a sugar crystal, bottom to top: dim at the root, white at the point, faceted stripes and a few bright flaws */
function palaceCrystalTex() {
  const w = 96, h = 256, cv = makeCanvas(w, h), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, h, 0, 0);
  g.addColorStop(0, '#3a3050'); g.addColorStop(0.45, '#9d92c9'); g.addColorStop(0.85, '#f3eeff'); g.addColorStop(1, '#ffffff');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? 'rgba(255,255,255,0.2)' : 'rgba(20,10,40,0.12)'; c.fillRect((k / 6) * w, 0, w / 6, h); }
  for (let i = 0; i < 46; i++) { c.fillStyle = `rgba(255,255,255,${rnd(0.15, 0.55)})`; c.fillRect(rnd(0, w), rnd(0, h), rnd(1, 3), rnd(4, 22)); }
  return toTex(cv);
}

/* the sky: a gradient dome (zenith, middle, horizon) with two soft nebula glows; it follows the camera */
const PSKY_VERT = /* glsl */`
  varying vec3 vDir;
  void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const PSKY_FRAG = /* glsl */`
  uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uLow; uniform vec3 uGlowA; uniform vec3 uGlowB;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir); float h = d.y;
    vec3 col = mix(uLow, uMid, smoothstep(-0.1, 0.14, h));
    col = mix(col, uTop, smoothstep(0.14, 0.66, h));
    col += uGlowA * pow(max(0.0, dot(d, normalize(vec3(-0.55, 0.22, -0.8)))), 6.0) * 0.42;
    col += uGlowB * pow(max(0.0, dot(d, normalize(vec3(0.62, 0.16, -0.77)))), 8.0) * 0.36;
    col += uLow * 0.35 * exp(-pow(h / 0.07, 2.0));   // a thin bright band on the horizon
    col = mix(col, uLow * 0.55, smoothstep(0.0, -0.4, h));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

function buildPalaceTextures() {
  TEX.p5floor = palaceFloorTex(); TEX.p5dais = palaceDaisTex(); TEX.p5ribbon = palaceRibbonTex(); TEX.p5crystal = palaceCrystalTex();
}
function buildPalaceMaterials() {
  MAT5.floor = new THREE.MeshStandardMaterial({ map: TEX.p5floor, roughness: 0.2, metalness: 0.06, emissive: '#ffffff', emissiveMap: TEX.p5floor, emissiveIntensity: 0.07 });
  MAT5.dais = new THREE.MeshStandardMaterial({ map: TEX.p5dais, roughness: 0.24, metalness: 0.12, emissive: '#ffffff', emissiveMap: TEX.p5dais, emissiveIntensity: 0.12 });
  MAT5.side = new THREE.MeshStandardMaterial({ color: '#f3d3e5', roughness: 0.32, metalness: 0.05 });
  MAT5.under = new THREE.MeshStandardMaterial({ color: '#ffc8e4', emissive: '#ff8cc8', emissiveIntensity: 0.6, roughness: 0.18, transparent: true, opacity: 0.86 });
  MAT5.crystal = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveMap: TEX.p5crystal, emissiveIntensity: 0.4, roughness: 0.1, metalness: 0, flatShading: true, transparent: true, opacity: 0.76, depthWrite: false });
  MAT5.core = new THREE.MeshBasicMaterial({ color: '#ffffff', map: TEX.p5crystal, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  MAT5.gold = new THREE.MeshStandardMaterial({ color: '#e6bb5e', metalness: 0.75, roughness: 0.28, emissive: '#6e4c12', emissiveIntensity: 0.3 });
  MAT5.palace = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.05, emissive: '#ffe2f0', emissiveIntensity: 0.08 });
  MAT5.glass = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.14, metalness: 0.1, emissive: '#ffffff', emissiveIntensity: 0.2 });
}
