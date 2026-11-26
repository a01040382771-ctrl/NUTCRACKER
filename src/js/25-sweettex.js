/* =====================================================================
   25 · KINGDOM OF SWEETS TEXTURES AND MATERIALS — painted when the chapter first opens
   ===================================================================== */
const TEX4 = {}, MAT4 = {};

/* candy-floss twilight: violet sky, a pink horizon, cotton-candy clouds and far sugar hills; every wave repeats a whole number of times so the seam is invisible */
function sweetSkyTex() {
  const W = 2048, H = 768, cv = makeCanvas(W, H), c = cv.getContext('2d');
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2c1f5e'); sky.addColorStop(0.3, '#6a4a9c'); sky.addColorStop(0.56, '#d98ab8'); sky.addColorStop(0.78, '#ffc3b4'); sky.addColorStop(1, '#ffe3d2');
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 360; i++) {
    const x = rnd(0, W), y = rnd(0, H * 0.5);
    c.globalAlpha = rnd(0.3, 0.9) * (1 - y / (H * 0.56)); c.fillStyle = pick(['#ffffff', '#ffe9f6', '#e9f2ff']);
    c.beginPath(); c.arc(x, y, rnd(0.6, 1.7), 0, TAU); c.fill();
  }
  c.globalAlpha = 0.85; c.fillStyle = '#fff6dc';
  for (let i = 0; i < 22; i++) { starPath(c, rnd(0, W), rnd(10, H * 0.4), rnd(4, 8), 1.5, 4, 0); c.fill(); }
  c.globalAlpha = 1;
  // cotton-candy clouds: soft round puffs, drawn twice near the edges so they wrap
  const puffAt = (x, y, r, col) => {
    for (const ox of [0, -W, W]) {
      if (x + ox < -r * 2 || x + ox > W + r * 2) continue;
      const g = c.createRadialGradient(x + ox, y - r * 0.25, r * 0.1, x + ox, y, r);
      g.addColorStop(0, col); g.addColorStop(0.6, col.replace('1)', '0.55)')); g.addColorStop(1, col.replace('1)', '0)'));
      c.fillStyle = g; c.beginPath(); c.arc(x + ox, y, r, 0, TAU); c.fill();
    }
  };
  for (let k = 0; k < 9; k++) {
    const cx = (k / 9) * W + rnd(-60, 60), cy = H * rnd(0.3, 0.55), n = rndi(5, 8), col = pick(['rgba(255,214,232,1)', 'rgba(255,240,248,1)', 'rgba(226,206,255,1)', 'rgba(255,226,214,1)']);
    for (let i = 0; i < n; i++) puffAt(cx + (i - n / 2) * rnd(24, 40), cy + rnd(-18, 14), rnd(34, 70), col);
  }
  // far sugar hills with white icing along the crest
  const ridge = (base, amp, k1, k2, ph, col, ice) => {
    const yAt = (x) => { const u = (x / W) * TAU; return H * base - (Math.abs(Math.sin(u * k1 + ph)) * amp + Math.sin(u * k2 + ph * 2) * amp * 0.35); };
    c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) c.lineTo(x, yAt(x));
    c.lineTo(W, H); c.closePath(); c.fill();
    if (ice) { c.strokeStyle = ice; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath(); for (let x = 0; x <= W; x += 6) { const y = yAt(x) + 2; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    return yAt;
  };
  ridge(0.86, 64, 5, 13, 0.6, '#c98bbd', 'rgba(255,246,252,0.7)');
  const near = ridge(0.92, 40, 8, 19, 2.4, '#e5a1c2', 'rgba(255,250,246,0.75)');
  // lollipop and candy-cane silhouettes on the near hills
  for (let i = 0; i < 30; i++) {
    const x = (i / 30) * W + rnd(-20, 20), y = near(x) + 4, h = rnd(18, 40);
    c.fillStyle = '#b77aa6';
    if (i % 3) { c.fillRect(x - 1.5, y - h, 3, h); c.beginPath(); c.arc(x, y - h, rnd(7, 13), 0, TAU); c.fill(); }
    else { c.lineWidth = 4; c.strokeStyle = '#b77aa6'; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.arc(x + 6, y - h, 6, Math.PI, 0); c.stroke(); }
  }
  const fade = c.createLinearGradient(0, H * 0.9, 0, H); fade.addColorStop(0, 'rgba(246,207,224,0)'); fade.addColorStop(1, 'rgba(246,207,224,1)');
  c.fillStyle = fade; c.fillRect(0, H * 0.9, W, H * 0.1);
  const t = toTex(cv, { repeat: true });
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/* strawberry and vanilla wafer tiles for the festival avenue */
function waferTex() {
  const s = 512, cv = makeCanvas(s, s), c = cv.getContext('2d'), h = s / 2;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const pink = (i + j) % 2 === 0, x = i * h, y = j * h;
    c.fillStyle = pink ? '#f4b4c6' : '#f8e6c8'; c.fillRect(x, y, h, h);
    c.strokeStyle = pink ? 'rgba(196,96,128,0.45)' : 'rgba(190,140,80,0.4)'; c.lineWidth = 3;
    for (let k = -h; k < h * 2; k += 26) { c.beginPath(); c.moveTo(x + k, y); c.lineTo(x + k + h, y + h); c.stroke(); c.beginPath(); c.moveTo(x + k + h, y); c.lineTo(x + k, y + h); c.stroke(); }
    c.fillStyle = pink ? 'rgba(255,230,238,0.5)' : 'rgba(255,248,232,0.55)';
    for (let k = 0; k < 40; k++) { c.beginPath(); c.arc(x + rnd(8, h - 8), y + rnd(8, h - 8), rnd(1, 2.4), 0, TAU); c.fill(); }
    // bevel: light top-left, shadow bottom-right
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x, y, h, 5); c.fillRect(x, y, 5, h);
    c.fillStyle = 'rgba(90,40,40,0.22)'; c.fillRect(x, y + h - 6, h, 6); c.fillRect(x + h - 6, y, 6, h);
  }
  return toTex(cv, { repeat: true });
}

/* soft frosting with sprinkles for the ground around the avenue */
function icingTex() {
  const s = 512, cv = makeCanvas(s, s), c = cv.getContext('2d');
  c.fillStyle = '#fbf1ee'; c.fillRect(0, 0, s, s);
  dabs(c, s, s, 160, ['#ffffff', '#fff7f4'], 10, 26, 0.5, 2.4);
  dabs(c, s, s, 110, ['#f3dfe2', '#efe1ea', '#f6e4dc'], 8, 22, 0.35, 2.6);
  const cols = ['#ff8fb1', '#8fd3ff', '#ffe27a', '#a8e6b8', '#c9a6ff', '#ffffff', '#ff6f6f'];
  for (let i = 0; i < 520; i++) {
    const x = rnd(0, s), y = rnd(0, s), a = rnd(0, TAU), L = rnd(5, 10);
    for (const [ox, oy] of [[0, 0], [s, 0], [-s, 0], [0, s], [0, -s]]) {
      const px = x + ox, py = y + oy; if (px < -12 || px > s + 12 || py < -12 || py > s + 12) continue;
      c.save(); c.translate(px, py); c.rotate(a); c.fillStyle = pick(cols); c.globalAlpha = 0.9;
      rr(c, -L / 2, -1.6, L, 3.2, 1.6); c.fill(); c.restore();
    }
  }
  c.globalAlpha = 1;
  return toTex(cv, { repeat: true });
}

/* melted chocolate with slow swirls; scrolls along x to make the river flow */
function chocTex() {
  const W = 512, H = 256, cv = makeCanvas(W, H), c = cv.getContext('2d');
  c.fillStyle = '#5b2e1d'; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 26; k++) {
    const y0 = rnd(0, H), amp = rnd(6, 20), f = rndi(1, 3), ph = rnd(0, TAU), col = pick(['#6f3a24', '#4a2416', '#7c4429', '#3f1e12']);
    c.strokeStyle = col; c.lineWidth = rnd(4, 14); c.globalAlpha = rnd(0.35, 0.8);
    for (const oy of [0, -H, H]) { c.beginPath(); for (let x = 0; x <= W; x += 8) { const y = y0 + oy + Math.sin((x / W) * TAU * f + ph) * amp; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  }
  c.globalAlpha = 1;
  for (let k = 0; k < 18; k++) {
    const y0 = rnd(0, H), amp = rnd(4, 12), f = rndi(1, 3), ph = rnd(0, TAU);
    c.strokeStyle = 'rgba(196,128,96,0.55)'; c.lineWidth = rnd(1.2, 2.6);
    for (const oy of [0, -H, H]) { c.beginPath(); for (let x = 0; x <= W; x += 8) { const y = y0 + oy + Math.sin((x / W) * TAU * f + ph) * amp; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  }
  return toTex(cv, { repeat: true });
}

/* three painted backdrops for the dance stages: chocolate (fans and roses) · coffee (arches and stars) · tea (blossoms and clouds) */
function bannerTex() {
  const cw = 256, ch = 384, cv = makeCanvas(cw * 3, ch), c = cv.getContext('2d');
  const frame = (x, col) => { c.strokeStyle = col; c.lineWidth = 8; c.strokeRect(x + 10, 10, cw - 20, ch - 20); c.lineWidth = 2; c.strokeRect(x + 22, 22, cw - 44, ch - 44); };
  // 1 · chocolate: red velvet, a golden fan and roses
  { const x = 0;
    const g = c.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, '#b3263a'); g.addColorStop(1, '#6e1424'); c.fillStyle = g; c.fillRect(x, 0, cw, ch);
    c.globalAlpha = 0.18; c.fillStyle = '#000000';
    for (let yy = 30; yy < ch; yy += 36) for (let xx = 18; xx < cw; xx += 36) { c.beginPath(); c.arc(x + xx + ((yy / 36) % 2) * 18, yy, 9, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    const fx = x + cw / 2, fy = ch * 0.56, R = 96;
    for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; c.strokeStyle = '#f1cf7a'; c.lineWidth = 3; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + Math.cos(a) * R, fy + Math.sin(a) * R); c.stroke(); }
    c.fillStyle = 'rgba(30,8,12,0.55)'; c.beginPath(); c.moveTo(fx, fy); c.arc(fx, fy, R, Math.PI, TAU); c.closePath(); c.fill();
    for (let i = 0; i < 12; i++) { const a = Math.PI + ((i + 0.5) / 12) * Math.PI; c.fillStyle = i % 2 ? '#e5b95f' : '#f6dd96'; c.beginPath(); c.arc(fx + Math.cos(a) * R * 0.78, fy + Math.sin(a) * R * 0.78, 7, 0, TAU); c.fill(); }
    c.strokeStyle = '#f6dd96'; c.lineWidth = 5; c.beginPath(); c.arc(fx, fy, R, Math.PI, TAU); c.stroke();
    const rose = (rx, ry, r) => { c.fillStyle = '#d8344c'; c.beginPath(); c.arc(rx, ry, r, 0, TAU); c.fill(); c.strokeStyle = '#7a0f22'; c.lineWidth = 2; c.beginPath(); for (let a = 0; a < TAU * 2.2; a += 0.2) { const rr2 = (a / (TAU * 2.2)) * r * 0.9; c.lineTo(rx + Math.cos(a) * rr2, ry + Math.sin(a) * rr2); } c.stroke(); c.fillStyle = '#3f7a46'; c.beginPath(); c.ellipse(rx + r * 0.9, ry + r * 0.6, r * 0.6, r * 0.3, 0.6, 0, TAU); c.fill(); };
    rose(x + 54, 70, 16); rose(x + cw - 54, 70, 16); rose(x + 64, ch - 72, 18); rose(x + cw - 64, ch - 72, 18); rose(fx, fy + 18, 20);
    frame(x, '#e9c46e'); }
  // 2 · coffee: plum and teal, a golden arch and eight-pointed stars
  { const x = cw;
    const g = c.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, '#2c1b46'); g.addColorStop(1, '#174f57'); c.fillStyle = g; c.fillRect(x, 0, cw, ch);
    const star8 = (sx, sy, r, col) => { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, rad = i % 2 ? r * 0.62 : r; c.lineTo(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad); } c.closePath(); c.fill(); };
    for (let yy = 40; yy < ch; yy += 46) for (let xx = 28; xx < cw; xx += 46) star8(x + xx + ((yy / 46) % 2) * 23, yy, 7, 'rgba(233,196,110,0.32)');
    const ax = x + cw / 2, top = 70, bot = ch - 40, hw = 78;
    c.strokeStyle = '#efcf7f'; c.lineWidth = 7; c.beginPath(); c.moveTo(ax - hw, bot); c.lineTo(ax - hw, 190); c.quadraticCurveTo(ax - hw, 120, ax, top); c.quadraticCurveTo(ax + hw, 120, ax + hw, 190); c.lineTo(ax + hw, bot); c.stroke();
    c.fillStyle = 'rgba(255,214,140,0.12)'; c.fill();
    star8(ax, 168, 30, '#f2d48a'); star8(ax, 168, 14, '#2c1b46');
    for (const [lx, ly] of [[ax - 40, 250], [ax + 40, 250], [ax, 300]]) { c.fillStyle = '#f6d58c'; c.beginPath(); c.moveTo(lx, ly - 22); c.lineTo(lx + 11, ly); c.lineTo(lx, ly + 18); c.lineTo(lx - 11, ly); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,240,200,0.5)'; c.beginPath(); c.arc(lx, ly, 18, 0, TAU); c.fill(); }
    frame(x, '#e9c46e'); }
  // 3 · tea: jade with a cream panel, plum blossoms on a branch and gold clouds
  { const x = cw * 2;
    c.fillStyle = '#2d7764'; c.fillRect(x, 0, cw, ch);
    c.fillStyle = '#f6ecd6'; rr(c, x + 34, 34, cw - 68, ch - 68, 18); c.fill();
    const cloud = (cx, cy, s) => { c.strokeStyle = '#d6a84f'; c.lineWidth = 3; for (const [ox, r] of [[-s, s * 0.8], [0, s], [s, s * 0.8]]) { c.beginPath(); c.arc(cx + ox, cy, r, Math.PI, TAU); c.stroke(); } c.beginPath(); c.moveTo(cx - s * 1.8, cy); c.lineTo(cx + s * 1.8, cy); c.stroke(); };
    cloud(x + 80, 80, 14); cloud(x + 180, 112, 11); cloud(x + 150, ch - 70, 13);
    c.strokeStyle = '#5a3a2a'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x + 48, ch - 90); c.quadraticCurveTo(x + 120, 250, x + 200, 160); c.stroke();
    c.lineWidth = 3.5; c.beginPath(); c.moveTo(x + 120, 236); c.quadraticCurveTo(x + 100, 190, x + 120, 150); c.stroke();
    const bloom = (bx, by, r) => { for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - Math.PI / 2; c.fillStyle = '#e8566e'; c.beginPath(); c.arc(bx + Math.cos(a) * r * 0.62, by + Math.sin(a) * r * 0.62, r * 0.55, 0, TAU); c.fill(); } c.fillStyle = '#ffd97a'; c.beginPath(); c.arc(bx, by, r * 0.32, 0, TAU); c.fill(); };
    for (const [bx, by, r] of [[x + 92, 258, 13], [x + 150, 214, 15], [x + 196, 166, 12], [x + 120, 152, 11], [x + 70, 300, 10], [x + 175, 196, 9]]) bloom(bx, by, r);
    c.strokeStyle = '#c23a4c'; c.lineWidth = 4; c.beginPath(); c.arc(x + cw / 2, ch * 0.5, 58, 0, TAU); c.globalAlpha = 0.25; c.stroke(); c.globalAlpha = 1;
    frame(x, '#d6a84f'); }
  return toTex(cv);
}

function buildSweetTextures() {
  if (TEX4.ready) return;
  reseed(4041);
  TEX4.sky = sweetSkyTex();
  TEX4.wafer = waferTex();
  TEX4.icing = icingTex();
  TEX4.choc = chocTex();
  TEX4.banner = bannerTex();
  TEX4.ready = true;
}

function buildSweetMaterials() {
  if (MAT4.ready) return;
  MAT4.sky = new THREE.MeshBasicMaterial({ map: TEX4.sky, side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false });
  MAT4.wafer = new THREE.MeshStandardMaterial({ map: TEX4.wafer, roughness: 0.62, metalness: 0 });
  MAT4.icing = new THREE.MeshLambertMaterial({ map: TEX4.icing, vertexColors: true });
  MAT4.choc = new THREE.MeshStandardMaterial({ map: TEX4.choc, roughness: 0.2, metalness: 0.02, envMapIntensity: 0.7 });
  MAT4.flow = new THREE.MeshStandardMaterial({ map: TEX4.choc.clone(), roughness: 0.18, metalness: 0.02, envMapIntensity: 0.8 });
  MAT4.flow.map.wrapS = MAT4.flow.map.wrapT = THREE.RepeatWrapping; MAT4.flow.map.needsUpdate = true;
  MAT4.banner = new THREE.MeshLambertMaterial({ map: TEX4.banner, side: THREE.DoubleSide });
  MAT4.crystal = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.88, emissive: '#ff9fcf', emissiveIntensity: 0.18, envMapIntensity: 1 });
  MAT4.palace = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.05, emissive: '#ffd6ea', emissiveIntensity: 0 });
  MAT4.ready = true;
}
