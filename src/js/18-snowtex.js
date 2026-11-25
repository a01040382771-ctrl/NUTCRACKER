/* =====================================================================
   18 · SNOWFLAKE FOREST TEXTURES AND MATERIALS — painted when the chapter first opens
   ===================================================================== */
const TEX3 = {}, MAT3 = {};

/* twilight sky with aurora, stars, moon, far mountains and pines; every wave repeats a whole number of times so the seam is invisible */
function snowSkyTex() {
  const W = 2048, H = 768, cv = makeCanvas(W, H), c = cv.getContext('2d');
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#101a4a'); sky.addColorStop(0.3, '#27337f'); sky.addColorStop(0.58, '#6877bf'); sky.addColorStop(0.8, '#b9c3ec'); sky.addColorStop(1, '#c9d4f1');
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 420; i++) {
    const x = rnd(0, W), y = rnd(0, H * 0.55);
    c.globalAlpha = rnd(0.35, 0.95) * (1 - y / (H * 0.62)); c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(x, y, rnd(0.6, 1.8), 0, TAU); c.fill();
  }
  c.globalAlpha = 0.9; c.fillStyle = '#ffffff';
  for (let i = 0; i < 26; i++) { starPath(c, rnd(0, W), rnd(10, H * 0.42), rnd(4, 8), 1.6, 4, 0); c.fill(); }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'lighter';
  for (const [col, base, amp, ph, a, k] of [['120,255,200', 0.27, 44, 0.7, 0.24, 3], ['150,255,170', 0.31, 36, 2.1, 0.17, 5], ['255,170,230', 0.23, 30, 4.0, 0.15, 4]]) {
    for (let x = 0; x < W; x += 3) {
      const u = (x / W) * TAU, y0 = H * base + Math.sin(u * k + ph) * amp + Math.sin(u * (k * 3) + ph * 2) * amp * 0.3, h = 120 + Math.sin(u * 2 + ph) * 50;
      const lg = c.createLinearGradient(0, y0, 0, y0 + h);
      lg.addColorStop(0, `rgba(${col},0)`); lg.addColorStop(0.25, `rgba(${col},${a})`); lg.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = lg; c.fillRect(x, y0, 3, h);
    }
  }
  c.globalCompositeOperation = 'source-over';
  const mx = 1480, my = 150, mg = c.createRadialGradient(mx, my, 10, mx, my, 150);
  mg.addColorStop(0, 'rgba(255,250,235,0.95)'); mg.addColorStop(0.3, 'rgba(255,248,230,0.35)'); mg.addColorStop(1, 'rgba(255,248,230,0)');
  c.fillStyle = mg; c.fillRect(mx - 150, my - 150, 300, 300);
  c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(mx, my, 46, 0, TAU); c.fill();
  c.fillStyle = 'rgba(210,214,232,0.55)'; for (const [dx, dy, r] of [[-14, -10, 9], [12, 8, 12], [-6, 20, 6]]) { c.beginPath(); c.arc(mx + dx, my + dy, r, 0, TAU); c.fill(); }
  const ridge = (base, amp, k1, k2, ph, col, snow) => {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) { const u = (x / W) * TAU; c.lineTo(x, H * base - (Math.abs(Math.sin(u * k1 + ph)) * amp + Math.sin(u * k2 + ph * 2) * amp * 0.4)); }
    c.lineTo(W, H); c.closePath(); c.fill();
    if (snow) { c.strokeStyle = snow; c.lineWidth = 3; c.beginPath(); for (let x = 0; x <= W; x += 6) { const u = (x / W) * TAU, y = H * base - (Math.abs(Math.sin(u * k1 + ph)) * amp + Math.sin(u * k2 + ph * 2) * amp * 0.4); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  };
  ridge(0.84, 70, 7, 17, 1.0, '#8d97cf', 'rgba(255,255,255,0.55)');
  ridge(0.9, 46, 9, 23, 3.0, '#6f7bb8', 'rgba(235,242,255,0.5)');
  c.fillStyle = '#4b5a9a';
  for (let x = 0; x < W; x += 15) { const h = rnd(26, 58), y = H * 0.955; c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x + rnd(-2, 2), y - h); c.lineTo(x + 9, y); c.fill(); }
  const fade = c.createLinearGradient(0, H * 0.9, 0, H); fade.addColorStop(0, 'rgba(201,212,241,0)'); fade.addColorStop(1, 'rgba(201,212,241,1)');
  c.fillStyle = fade; c.fillRect(0, H * 0.9, W, H * 0.1);
  const t = toTex(cv, { repeat: true });
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/* soft pink-gold light behind the gate to the Sweets Kingdom */
function doorGlowTex() {
  const s = 256, cv = makeCanvas(s, s), c = cv.getContext('2d');
  const g = c.createRadialGradient(s / 2, s * 0.62, 6, s / 2, s * 0.62, s * 0.7);
  g.addColorStop(0, 'rgba(255,248,226,1)'); g.addColorStop(0.35, 'rgba(255,214,200,0.85)'); g.addColorStop(0.75, 'rgba(255,170,210,0.35)'); g.addColorStop(1, 'rgba(255,170,210,0)');
  c.fillStyle = g; c.fillRect(0, 0, s, s);
  c.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 26; i++) { starPath(c, rnd(30, 226), rnd(30, 220), rnd(2, 5), 1, 4, 0); c.fill(); }
  return toTex(cv, { srgb: false });
}

function buildSnowTextures() {
  if (TEX3.ready) return;
  reseed(2813);
  TEX3.sky = snowSkyTex();
  TEX3.door = doorGlowTex();
  TEX3.ready = true;
}

function buildSnowMaterials() {
  if (MAT3.ready) return;
  MAT3.sky = new THREE.MeshBasicMaterial({ map: TEX3.sky, side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false });
  MAT3.ice = new THREE.MeshStandardMaterial({ color: '#cfe6ff', roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.74, emissive: '#6fa8ff', emissiveIntensity: 0.3, envMapIntensity: 0.8 });
  MAT3.frost = new THREE.MeshStandardMaterial({ color: '#eaf4ff', roughness: 0.35, transparent: true, opacity: 0.9, emissive: '#9ec7ff', emissiveIntensity: 0.2 });
  MAT3.tile = new THREE.MeshBasicMaterial({ toneMapped: false });
  MAT3.rim = new THREE.MeshBasicMaterial({ toneMapped: false });
  MAT3.print = new THREE.MeshBasicMaterial({ color: '#c9ecff', transparent: true, opacity: 0.92, depthWrite: false, toneMapped: false });
  MAT3.door = new THREE.MeshBasicMaterial({ map: TEX3.door, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, fog: false });
  MAT3.ready = true;
}
