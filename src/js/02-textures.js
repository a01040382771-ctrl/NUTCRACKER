/* =====================================================================
   02 · TEXTURES — every surface is hand-painted on a canvas at load time
   ===================================================================== */
let MAX_ANISO = 4;
const TEX = {};

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function toTex(cv, o = {}) {
  const t = new THREE.CanvasTexture(cv);
  if (o.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  if (o.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = o.aniso || Math.min(4, MAX_ANISO);
  if (o.nomip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  return t;
}

/* soft elongated brush dabs, wrapped so tiles stay seamless */
function dabs(ctx, w, h, n, colors, rMin, rMax, alpha, elong = 2.2, ang = null, wrap = true) {
  for (let i = 0; i < n; i++) {
    const x = rnd(0, w), y = rnd(0, h), r = rnd(rMin, rMax);
    const a = ang === null ? rnd(0, TAU) : ang + rnd(-0.35, 0.35);
    ctx.fillStyle = pick(colors);
    ctx.globalAlpha = alpha * rnd(0.45, 1);
    const ext = r * elong;
    const draw = (ox, oy) => {
      ctx.save(); ctx.translate(x + ox, y + oy); ctx.rotate(a); ctx.scale(elong, 1);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.restore();
    };
    draw(0, 0);
    if (wrap) {
      if (x < ext) draw(w, 0); if (x > w - ext) draw(-w, 0);
      if (y < ext) draw(0, h); if (y > h - ext) draw(0, -h);
    }
  }
  ctx.globalAlpha = 1;
}
function speckle(ctx, w, h, n, color, alpha, size = 1.2) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = alpha * rng();
    ctx.fillRect(rnd(0, w), rnd(0, h), size, size);
  }
  ctx.globalAlpha = 1;
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function starPath(ctx, cx, cy, R, r, n = 5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 ? r : R, a = rot + (i * Math.PI) / n;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
}

/* ---- generic painterly detail map (multiplies vertex colours) ---- */
function brushTex() {
  const s = 256, cv = makeCanvas(s, s), c = cv.getContext('2d');
  c.fillStyle = '#f4f1ee'; c.fillRect(0, 0, s, s);
  dabs(c, s, s, 260, ['#ffffff', '#fffaf3'], 6, 18, 0.35, 2.6);
  dabs(c, s, s, 180, ['#d9d1cc', '#e3dbd6', '#cfc6c2'], 4, 14, 0.22, 2.8);
  speckle(c, s, s, 1600, '#b9aea8', 0.25);
  return toTex(cv, { repeat: true });
}

/* ---- damask wallpaper (powder pink, ivory, gold) ---- */
function damaskMotif(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(253,244,236,0.72)';
  c.strokeStyle = 'rgba(196,150,74,0.85)';
  c.lineWidth = 1.7;
  const ell = (ex, ey, rx, ry, rot) => { c.beginPath(); c.ellipse(ex, ey, rx, ry, rot, 0, TAU); c.fill(); c.stroke(); };
  ell(0, -8, 10, 27, 0);
  ell(-17, 0, 7, 20, 0.62); ell(17, 0, 7, 20, -0.62);
  ell(0, -45, 5.5, 7, 0);
  c.beginPath(); c.arc(0, 20, 26, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  for (const m of [-1, 1]) {
    c.beginPath();
    for (let i = 0; i <= 26; i++) {
      const t = i / 26, a = m * (t * 4.2) - (m > 0 ? 0 : Math.PI), r = 13 * (1 - t * 0.78);
      const px = m * 27 + Math.cos(a + (m > 0 ? -1.2 : 1.2)) * r, py = 22 + Math.sin(a + (m > 0 ? -1.2 : 1.2)) * r;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.stroke();
    c.beginPath(); c.ellipse(m * 34, -26, 4, 9, m * 0.5, 0, TAU); c.fill(); c.stroke();
  }
  c.beginPath(); c.moveTo(0, 30); c.quadraticCurveTo(7, 40, 0, 50); c.quadraticCurveTo(-7, 40, 0, 30); c.fill(); c.stroke();
  c.fillStyle = 'rgba(196,150,74,0.8)';
  for (const [dx, dy] of [[0, -58], [-30, 36], [30, 36]]) { c.beginPath(); c.arc(dx, dy, 2.4, 0, TAU); c.fill(); }
  c.restore();
}
function wallpaperTex() {
  const s = 512, cv = makeCanvas(s, s), c = cv.getContext('2d');
  c.fillStyle = '#f0c9cd'; c.fillRect(0, 0, s, s);
  // soft stripes
  for (const x0 of [0, 256]) {
    c.fillStyle = '#ebbcc2'; c.fillRect(x0 + 108, 0, 40, s);
    c.fillStyle = 'rgba(201,160,82,0.85)'; c.fillRect(x0 + 106, 0, 2, s); c.fillRect(x0 + 148, 0, 2, s);
    c.fillStyle = 'rgba(253,244,236,0.55)'; c.fillRect(x0 + 112, 0, 1.5, s); c.fillRect(x0 + 143, 0, 1.5, s);
    for (let y = 0; y < s; y += 32) { c.fillStyle = 'rgba(201,160,82,0.7)'; c.beginPath(); c.arc(x0 + 128, y + 16, 2.2, 0, TAU); c.fill(); }
  }
  dabs(c, s, s, 120, ['#f6d6d8', '#eab9bf', '#f8e0dc'], 10, 26, 0.18, 2.4);
  // half-drop damask
  for (const [x, y] of [[0, 128], [256, 128], [0, 384], [256, 384], [512, 128], [512, 384], [128, 0], [384, 0], [128, 256], [384, 256], [128, 512], [384, 512]]) {
    damaskMotif(c, x, y, 1.05);
  }
  dabs(c, s, s, 90, ['#fff6f2', '#e5b0b8'], 4, 10, 0.12, 3);
  speckle(c, s, s, 2200, '#a7737a', 0.12);
  return toTex(cv, { repeat: true });
}

/* ---- chevron parquet floor ---- */
function parquetTex() {
  const s = 512, cv = makeCanvas(s, s), c = cv.getContext('2d');
  const tones = ['#c99862', '#b9844f', '#d6a874', '#ad7848', '#c28d58', '#d1a06a', '#b67f4c', '#cc9a66'];
  const cols = 4, W = s / cols, P = 32;
  for (let col = 0; col < cols; col++) {
    const x0 = col * W, sl = col % 2 ? 1 : -1;
    c.save(); c.beginPath(); c.rect(x0, 0, W, s); c.clip();
    for (let j = -12; j < 30; j++) {
      const k = ((j % 16) + 16) % 16;
      const y0 = j * P;
      c.beginPath();
      const ya = (x) => y0 + sl * (x - x0) + (sl < 0 ? W : 0);
      c.moveTo(x0, ya(x0)); c.lineTo(x0 + W, ya(x0 + W));
      c.lineTo(x0 + W, ya(x0 + W) + P); c.lineTo(x0, ya(x0) + P); c.closePath();
      c.fillStyle = tones[(k * 3 + col * 5) % tones.length]; c.fill();
      // grain
      c.save(); c.clip();
      for (let g = 0; g < 7; g++) {
        c.strokeStyle = g % 2 ? 'rgba(120,70,35,0.22)' : 'rgba(255,230,190,0.16)';
        c.lineWidth = rnd(0.6, 1.6);
        const off = rnd(2, P - 2);
        c.beginPath();
        for (let x = x0; x <= x0 + W; x += 8) { const yy = ya(x) + off + Math.sin(x * 0.07 + g) * 1.4; x === x0 ? c.moveTo(x, yy) : c.lineTo(x, yy); }
        c.stroke();
      }
      c.restore();
      c.strokeStyle = 'rgba(70,38,20,0.55)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(x0, ya(x0)); c.lineTo(x0 + W, ya(x0 + W)); c.stroke();
    }
    c.restore();
    c.fillStyle = 'rgba(70,38,20,0.6)'; c.fillRect(x0, 0, 1.6, s);
  }
  dabs(c, s, s, 70, ['#e8c08c', '#a06c3e'], 12, 30, 0.08, 3);
  speckle(c, s, s, 1800, '#5b3519', 0.2);
  return toTex(cv, { repeat: true, aniso: 8 });
}

/* ---- Persian-style carpet: burgundy field, pastel-blue medallion, gold border ---- */
function carpetTex() {
  const W = 1024, H = 640, cv = makeCanvas(W, H), c = cv.getContext('2d');
  c.fillStyle = '#7a1c35'; c.fillRect(0, 0, W, H);
  // field lattice
  c.save(); c.beginPath(); c.rect(70, 70, W - 140, H - 140); c.clip();
  c.strokeStyle = 'rgba(70,10,28,0.7)'; c.lineWidth = 3;
  for (let d = -H; d < W + H; d += 64) {
    c.beginPath(); c.moveTo(d, 0); c.lineTo(d + H, H); c.stroke();
    c.beginPath(); c.moveTo(d, H); c.lineTo(d + H, 0); c.stroke();
  }
  for (let y = 70 + 32; y < H - 70; y += 64) for (let x = 70 + ((y / 64) % 2 ? 0 : 32); x < W - 70; x += 64) {
    c.fillStyle = '#e8a3b2';
    for (let p = 0; p < 4; p++) { c.beginPath(); c.ellipse(x + Math.cos(p * TAU / 4) * 6, y + Math.sin(p * TAU / 4) * 6, 5, 3, p * TAU / 4, 0, TAU); c.fill(); }
    c.fillStyle = '#e2bb69'; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill();
  }
  // corner spandrels
  for (const [cx, cy] of [[70, 70], [W - 70, 70], [70, H - 70], [W - 70, H - 70]]) {
    c.fillStyle = '#a9c4df'; c.beginPath(); c.ellipse(cx, cy, 170, 120, 0, 0, TAU); c.fill();
    c.strokeStyle = '#d9b260'; c.lineWidth = 5; c.stroke();
    c.fillStyle = '#7a1c35'; c.beginPath(); c.ellipse(cx, cy, 120, 80, 0, 0, TAU); c.fill();
    c.strokeStyle = '#f0d6a0'; c.lineWidth = 2; c.stroke();
    for (let p = 0; p < 10; p++) { const a = (p / 10) * TAU; c.fillStyle = p % 2 ? '#f2c2cb' : '#fbf1e2'; c.beginPath(); c.ellipse(cx + Math.cos(a) * 95, cy + Math.sin(a) * 63, 10, 5, a, 0, TAU); c.fill(); }
  }
  c.restore();
  // central medallion
  const mx = W / 2, my = H / 2;
  const lobed = (rx, ry, n, amp) => {
    c.beginPath();
    for (let i = 0; i <= 200; i++) {
      const a = (i / 200) * TAU, k = 1 + amp * Math.pow(Math.abs(Math.cos((a * n) / 2)), 3);
      c.lineTo(mx + Math.cos(a) * rx * k, my + Math.sin(a) * ry * k);
    }
    c.closePath();
  };
  lobed(250, 170, 16, 0.12); c.fillStyle = '#d9b260'; c.fill();
  lobed(238, 160, 16, 0.12); c.fillStyle = '#a9c4df'; c.fill();
  c.strokeStyle = '#fbf1e2'; c.lineWidth = 2; c.stroke();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU; c.fillStyle = i % 2 ? '#f2c2cb' : '#7a1c35';
    c.beginPath(); c.ellipse(mx + Math.cos(a) * 200, my + Math.sin(a) * 133, 16, 8, a, 0, TAU); c.fill();
  }
  c.fillStyle = '#7a1c35'; c.beginPath(); c.ellipse(mx, my, 160, 106, 0, 0, TAU); c.fill();
  c.strokeStyle = '#d9b260'; c.lineWidth = 4; c.stroke();
  c.fillStyle = '#fbf1e2'; c.beginPath(); c.ellipse(mx, my, 108, 72, 0, 0, TAU); c.fill();
  c.strokeStyle = '#d9b260'; c.lineWidth = 3; c.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    c.fillStyle = '#eaa0b0'; c.beginPath(); c.ellipse(mx + Math.cos(a) * 46, my + Math.sin(a) * 32, 30, 13, a, 0, TAU); c.fill();
    c.strokeStyle = '#b8465f'; c.lineWidth = 1.5; c.stroke();
  }
  c.fillStyle = '#d9b260'; c.beginPath(); c.arc(mx, my, 20, 0, TAU); c.fill();
  c.fillStyle = '#7a1c35'; c.beginPath(); c.arc(mx, my, 9, 0, TAU); c.fill();
  for (const sgn of [-1, 1]) { // pendants
    c.fillStyle = '#d9b260';
    c.beginPath(); c.moveTo(mx + sgn * 262, my); c.lineTo(mx + sgn * 300, my - 22); c.lineTo(mx + sgn * 338, my); c.lineTo(mx + sgn * 300, my + 22); c.closePath(); c.fill();
    c.fillStyle = '#a9c4df'; c.beginPath(); c.arc(mx + sgn * 300, my, 9, 0, TAU); c.fill();
  }
  // border bands
  c.fillStyle = '#4c0f20';
  c.fillRect(0, 0, W, 62); c.fillRect(0, H - 62, W, 62); c.fillRect(0, 0, 62, H); c.fillRect(W - 62, 0, 62, H);
  c.strokeStyle = '#d9b260'; c.lineWidth = 5; c.strokeRect(64, 64, W - 128, H - 128);
  c.strokeStyle = '#f2c2cb'; c.lineWidth = 3; c.strokeRect(72, 72, W - 144, H - 144);
  c.strokeStyle = '#d9b260'; c.lineWidth = 3; c.strokeRect(8, 8, W - 16, H - 16);
  // vine meander on border
  const vine = (x0, y0, x1, y1) => {
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(len / 46);
    c.strokeStyle = '#d9b260'; c.lineWidth = 3; c.beginPath();
    for (let i = 0; i <= 120; i++) {
      const t = i / 120, px = lerp(x0, x1, t), py = lerp(y0, y1, t), off = Math.sin(t * n * Math.PI) * 11;
      const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
      i ? c.lineTo(px + nx * off, py + ny * off) : c.moveTo(px + nx * off, py + ny * off);
    }
    c.stroke();
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, px = lerp(x0, x1, t), py = lerp(y0, y1, t);
      c.fillStyle = i % 2 ? '#f2c2cb' : '#a9c4df'; c.beginPath(); c.arc(px, py, 7, 0, TAU); c.fill();
      c.fillStyle = '#d9b260'; c.beginPath(); c.arc(px, py, 2.5, 0, TAU); c.fill();
    }
  };
  vine(36, 36, W - 36, 36); vine(36, H - 36, W - 36, H - 36); vine(36, 36, 36, H - 36); vine(W - 36, 36, W - 36, H - 36);
  // wear & pile
  dabs(c, W, H, 260, ['#ffffff', '#2a0510'], 8, 30, 0.04, 2.5, null, false);
  speckle(c, W, H, 26000, '#ffffff', 0.08, 1.3);
  speckle(c, W, H, 26000, '#2a0510', 0.12, 1.3);
  return toTex(cv, { aniso: 8 });
}

/* ---- snowy night village behind the windows ---- */
function nightTex() {
  const W = 1024, H = 512, cv = makeCanvas(W, H), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#121a44'); g.addColorStop(0.42, '#34418a'); g.addColorStop(0.72, '#8f86c3'); g.addColorStop(0.86, '#d9b9d2'); g.addColorStop(1, '#e9d2df');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 220; i++) {
    const x = rnd(0, W), y = rnd(0, H * 0.62), r = rnd(0.5, 1.7);
    c.fillStyle = `rgba(255,250,235,${rnd(0.4, 1)})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  // moon
  const mx = 810, my = 150;
  let mg = c.createRadialGradient(mx, my, 20, mx, my, 190);
  mg.addColorStop(0, 'rgba(255,246,214,0.55)'); mg.addColorStop(1, 'rgba(255,246,214,0)');
  c.fillStyle = mg; c.fillRect(mx - 200, my - 200, 400, 400);
  mg = c.createRadialGradient(mx - 12, my - 12, 4, mx, my, 54);
  mg.addColorStop(0, '#fffbea'); mg.addColorStop(1, '#f2deaa');
  c.fillStyle = mg; c.beginPath(); c.arc(mx, my, 52, 0, TAU); c.fill();
  c.fillStyle = 'rgba(214,190,140,0.35)';
  for (const [dx, dy, r] of [[-14, -8, 10], [16, 12, 8], [4, -22, 5], [-20, 20, 6]]) { c.beginPath(); c.arc(mx + dx, my + dy, r, 0, TAU); c.fill(); }
  // far hills
  const hills = (base, amp, col, snow) => {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) c.lineTo(x, base - Math.sin(x * 0.006 + amp) * 26 - Math.sin(x * 0.017 + amp * 2) * 12);
    c.lineTo(W, H); c.closePath(); c.fill();
    if (snow) { c.strokeStyle = 'rgba(240,244,255,0.65)'; c.lineWidth = 3; c.stroke(); }
  };
  hills(330, 1.3, '#7c78b4', true);
  hills(362, 4.1, '#6a6aa6', true);
  // village
  const house = (x, y, w, h, roof, wall) => {
    c.fillStyle = wall; c.fillRect(x, y - h, w, h);
    c.fillStyle = roof; c.beginPath(); c.moveTo(x - 6, y - h); c.lineTo(x + w / 2, y - h - roof * 0); c.lineTo(x + w / 2, y - h - w * 0.55); c.lineTo(x + w + 6, y - h); c.closePath(); c.fill();
    c.fillStyle = '#eef2ff'; c.beginPath(); c.moveTo(x - 7, y - h + 1); c.lineTo(x + w / 2, y - h - w * 0.55 - 2); c.lineTo(x + w + 7, y - h + 1); c.lineTo(x + w + 2, y - h + 5); c.lineTo(x + w / 2, y - h - w * 0.55 + 6); c.lineTo(x - 2, y - h + 5); c.closePath(); c.fill();
    for (let i = 0; i < Math.floor(w / 14); i++) {
      const wx = x + 6 + i * 14, wy = y - h * 0.62;
      const lg = c.createRadialGradient(wx + 3, wy + 4, 1, wx + 3, wy + 4, 14);
      lg.addColorStop(0, 'rgba(255,214,130,0.55)'); lg.addColorStop(1, 'rgba(255,214,130,0)');
      c.fillStyle = lg; c.fillRect(wx - 12, wy - 10, 30, 30);
      c.fillStyle = '#ffd98a'; c.fillRect(wx, wy, 6, 8);
    }
  };
  const roofs = ['#3a3f78', '#463f7a', '#353a70'];
  for (let i = 0; i < 26; i++) {
    const x = i * 40 + rnd(-8, 8), w = rnd(26, 46), h = rnd(26, 52);
    house(x, 412 + rnd(-6, 6), w, h, 0, pick(['#4a4e8a', '#555891', '#4b4683']));
  }
  // church (left window)
  const cx = 205;
  c.fillStyle = '#434886'; c.fillRect(cx - 24, 330, 48, 86);
  c.beginPath(); c.moveTo(cx - 30, 332); c.lineTo(cx, 220); c.lineTo(cx + 30, 332); c.closePath(); c.fill();
  c.fillStyle = '#eef2ff'; c.beginPath(); c.moveTo(cx - 30, 332); c.lineTo(cx, 220); c.lineTo(cx - 4, 240); c.lineTo(cx - 24, 334); c.closePath(); c.fill();
  c.fillStyle = '#ffd98a'; c.beginPath(); c.arc(cx, 350, 8, Math.PI, 0); c.fillRect(cx - 8, 350, 16, 14); c.fill();
  c.fillStyle = '#e8c56a'; c.fillRect(cx - 1.5, 200, 3, 22); c.fillRect(cx - 7, 206, 14, 3);
  // pines
  const pine = (x, y, s) => {
    for (let k = 0; k < 4; k++) {
      const yy = y - k * 12 * s, ww = (22 - k * 4.5) * s;
      c.fillStyle = '#25375c'; c.beginPath(); c.moveTo(x - ww, yy); c.lineTo(x, yy - 20 * s); c.lineTo(x + ww, yy); c.closePath(); c.fill();
      c.fillStyle = 'rgba(236,242,255,0.9)'; c.beginPath(); c.moveTo(x - ww * 0.6, yy - 6 * s); c.lineTo(x, yy - 20 * s); c.lineTo(x + ww * 0.3, yy - 12 * s); c.closePath(); c.fill();
    }
  };
  for (let i = 0; i < 22; i++) pine(rnd(0, W), 446 + rnd(-6, 10), rnd(0.8, 1.4));
  // foreground snow
  const sg = c.createLinearGradient(0, 430, 0, H);
  sg.addColorStop(0, '#dfe6fb'); sg.addColorStop(1, '#f6f2fb');
  c.fillStyle = sg; c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += 16) c.lineTo(x, 440 + Math.sin(x * 0.02) * 6 + Math.sin(x * 0.05) * 3);
  c.lineTo(W, H); c.closePath(); c.fill();
  for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(255,255,255,${rnd(0.35, 0.9)})`; c.beginPath(); c.arc(rnd(0, W), rnd(0, H), rnd(0.8, 2.4), 0, TAU); c.fill(); }
  dabs(c, W, H, 120, ['#ffffff', '#a8a0d8'], 10, 30, 0.04, 2.5, null, false);
  return toTex(cv, { nomip: false });
}

/* ---- porcelain doll faces (planar-projected onto the head) ---- */
function faceTex(kind, expr) {
  const s = 512, cv = makeCanvas(s, s), c = cv.getContext('2d');
  const cfg = {
    clara: { skin: '#fbe5d9', iris: ['#8a5634', '#2e170d'], brow: '#8c5537', lips: '#d8566e', blush: 'rgba(240,120,138,0.5)', lash: '#3a2015' },
    fairy: { skin: '#fcebe3', iris: ['#7da2c9', '#253a5c'], brow: '#b58a5a', lips: '#e0607b', blush: 'rgba(244,128,160,0.5)', lash: '#3d2420' },
    prince: { skin: '#f9e2d4', iris: ['#6d4a32', '#22140c'], brow: '#6a4026', lips: '#c9606e', blush: 'rgba(232,130,130,0.32)', lash: '#2f1a12' },
  }[kind];
  c.fillStyle = cfg.skin; c.fillRect(0, 0, s, s);
  const glow = c.createRadialGradient(256, 250, 30, 256, 256, 250);
  glow.addColorStop(0, 'rgba(255,248,242,0.6)'); glow.addColorStop(1, 'rgba(255,248,242,0)');
  c.fillStyle = glow; c.fillRect(0, 0, s, s);
  for (const sx of [-1, 1]) {
    const bg = c.createRadialGradient(256 + sx * 104, 318, 4, 256 + sx * 104, 318, 50);
    bg.addColorStop(0, cfg.blush); bg.addColorStop(1, 'rgba(240,120,138,0)');
    c.fillStyle = bg; c.fillRect(256 + sx * 104 - 52, 266, 104, 104);
  }
  const ex = 80, ey = 262;
  c.lineCap = 'round'; c.lineJoin = 'round';
  // brows
  c.strokeStyle = cfg.brow; c.lineWidth = kind === 'prince' ? 7 : 4.5;
  for (const sx of [-1, 1]) {
    c.beginPath();
    if (expr === 'determined') { c.moveTo(256 + sx * (ex + 30), 198); c.quadraticCurveTo(256 + sx * ex, 196, 256 + sx * (ex - 30), 214); }
    else if (expr === 'surprised') { c.moveTo(256 + sx * (ex + 30), 196); c.quadraticCurveTo(256 + sx * ex, 172, 256 + sx * (ex - 28), 192); }
    else { c.moveTo(256 + sx * (ex + 32), 206); c.quadraticCurveTo(256 + sx * ex, 186, 256 + sx * (ex - 28), 202); }
    c.stroke();
  }
  // eyes
  for (const sx of [-1, 1]) {
    const x = 256 + sx * ex, y = ey;
    if (expr === 'blink' || expr === 'happy') {
      c.strokeStyle = cfg.lash; c.lineWidth = 6;
      c.beginPath();
      if (expr === 'blink') { c.moveTo(x - 24, y); c.quadraticCurveTo(x, y + 14, x + 24, y); }
      else { c.moveTo(x - 23, y + 8); c.quadraticCurveTo(x, y - 18, x + 23, y + 8); }
      c.stroke();
      if (kind !== 'prince') { c.lineWidth = 3.5; c.beginPath(); c.moveTo(x + sx * 22, y + (expr === 'blink' ? 1 : 6)); c.lineTo(x + sx * 32, y + (expr === 'blink' ? 6 : -2)); c.stroke(); }
      continue;
    }
    const big = expr === 'surprised' ? 1.12 : 1;
    const rx = 23 * big, ry = (kind === 'prince' ? 25 : 29) * big;
    c.fillStyle = '#fffaf6'; c.beginPath(); c.ellipse(x, y + 2, rx + 4, ry + 3, 0, 0, TAU); c.fill();
    const ig = c.createRadialGradient(x, y + 10, 3, x, y + 2, ry);
    ig.addColorStop(0, cfg.iris[0]); ig.addColorStop(1, cfg.iris[1]);
    c.fillStyle = ig; c.beginPath(); c.ellipse(x, y + 4, rx, ry, 0, 0, TAU); c.fill();
    c.fillStyle = '#120806'; c.beginPath(); c.ellipse(x, y + 5, rx * (expr === 'surprised' ? 0.38 : 0.5), ry * 0.52, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(x - 8, y - 9, 8, 9.5, -0.3, 0, TAU); c.fill();
    c.globalAlpha = 0.85; c.beginPath(); c.arc(x + 9, y + 15, 4, 0, TAU); c.fill(); c.globalAlpha = 1;
    if (kind === 'fairy') { // serene lid
      c.fillStyle = cfg.skin; c.beginPath(); c.ellipse(x, y - ry * 0.75, rx + 6, ry * 0.5, 0, 0, TAU); c.fill();
    }
    c.strokeStyle = cfg.lash; c.lineWidth = kind === 'prince' ? 5 : 7;
    c.beginPath();
    const ly = kind === 'fairy' ? y - ry * 0.3 : y - ry + 4;
    c.moveTo(x - rx - 3, y - 2); c.quadraticCurveTo(x, ly - 14, x + rx + 3, y - 2); c.stroke();
    if (kind !== 'prince') {
      c.lineWidth = 3.5;
      for (let k = 0; k < 3; k++) { c.beginPath(); const bx = x + sx * (rx - 2 + k * 3), by = y - 6 - k * 7; c.moveTo(bx, by); c.lineTo(bx + sx * 11, by - 6 - k * 2); c.stroke(); }
    }
    c.strokeStyle = 'rgba(90,50,40,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - rx + 4, y + ry + 4); c.quadraticCurveTo(x, y + ry + 10, x + rx - 4, y + ry + 4); c.stroke();
  }
  // nose
  c.strokeStyle = 'rgba(214,140,120,0.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(250, 304); c.quadraticCurveTo(256, 309, 262, 304); c.stroke();
  // mouth
  if (expr === 'happy') {
    c.fillStyle = '#9e2f47'; c.beginPath(); c.moveTo(232, 336); c.quadraticCurveTo(256, 372, 280, 336); c.closePath(); c.fill();
    c.fillStyle = '#ef8fa0'; c.beginPath(); c.ellipse(256, 352, 11, 6, 0, 0, Math.PI); c.fill();
  } else if (expr === 'surprised') {
    c.fillStyle = '#a3344c'; c.beginPath(); c.ellipse(256, 346, 9, 12, 0, 0, TAU); c.fill();
    c.fillStyle = '#e9849a'; c.beginPath(); c.ellipse(256, 352, 6, 4, 0, 0, TAU); c.fill();
  } else if (expr === 'determined') {
    c.strokeStyle = cfg.lips; c.lineWidth = 5; c.beginPath(); c.moveTo(240, 342); c.quadraticCurveTo(256, 348, 272, 340); c.stroke();
  } else {
    c.strokeStyle = cfg.lips; c.lineWidth = kind === 'fairy' ? 6 : 5;
    c.beginPath(); c.moveTo(234, 336); c.quadraticCurveTo(256, 354, 278, 336); c.stroke();
    c.fillStyle = kind === 'fairy' ? 'rgba(236,110,140,0.75)' : 'rgba(239,143,158,0.55)';
    c.beginPath(); c.ellipse(256, 347, kind === 'fairy' ? 12 : 9, 4, 0, 0, TAU); c.fill();
  }
  return toTex(cv);
}

/* ---- the Nutcracker's lacquered painted face ---- */
function nutFaceTex(open) {
  const s = 512, cv = makeCanvas(s, s), c = cv.getContext('2d');
  c.fillStyle = '#f6d3b6'; c.fillRect(0, 0, s, s);
  const gl = c.createRadialGradient(256, 220, 20, 256, 256, 260);
  gl.addColorStop(0, 'rgba(255,240,226,0.7)'); gl.addColorStop(1, 'rgba(255,240,226,0)');
  c.fillStyle = gl; c.fillRect(0, 0, s, s);
  for (const sx of [-1, 1]) {
    const g = c.createRadialGradient(256 + sx * 118, 318, 6, 256 + sx * 118, 318, 46);
    g.addColorStop(0, 'rgba(222,64,84,0.95)'); g.addColorStop(0.65, 'rgba(222,64,84,0.75)'); g.addColorStop(1, 'rgba(222,64,84,0)');
    c.fillStyle = g; c.fillRect(256 + sx * 118 - 50, 268, 100, 100);
  }
  c.lineCap = 'round';
  for (const sx of [-1, 1]) {
    const x = 256 + sx * 80, y = 238;
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(x, y, 34, 40, 0, 0, TAU); c.fill();
    c.strokeStyle = '#1b0e0a'; c.lineWidth = 6; c.stroke();
    c.fillStyle = '#3a5ea0'; c.beginPath(); c.arc(x + sx * -3, y - 2, 19, 0, TAU); c.fill();
    c.fillStyle = '#0f0806'; c.beginPath(); c.arc(x + sx * -3, y - 2, 11, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x - 6, y - 10, 5, 0, TAU); c.fill();
    c.strokeStyle = '#1b0e0a'; c.lineWidth = 15;
    c.beginPath(); c.moveTo(x - sx * 40, 176); c.quadraticCurveTo(x, 150, x + sx * 44, 182); c.stroke();
    c.lineWidth = 3; c.strokeStyle = 'rgba(30,14,10,0.6)';
    for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x + k * 14, y + 42); c.lineTo(x + k * 16, y + 52); c.stroke(); }
  }
  // hair line under the hat
  c.fillStyle = '#f4f0ea'; c.fillRect(0, 0, s, 70);
  if (open) { c.fillStyle = '#4a1414'; c.fillRect(200, 470, 112, 42); }
  return toTex(cv);
}

/* ---- gift wrapping papers atlas (4x4) ---- */
const GIFT_CELLS = 4;
function giftAtlasTex() {
  const s = 512, n = GIFT_CELLS, cs = s / n, cv = makeCanvas(s, s), c = cv.getContext('2d');
  const cells = [
    (x, y) => { c.fillStyle = '#7d1d36'; c.fillRect(x, y, cs, cs); c.save(); c.beginPath(); c.rect(x, y, cs, cs); c.clip(); c.strokeStyle = '#fbf1e2'; c.lineWidth = 10; for (let d = -cs; d < cs * 2; d += 32) { c.beginPath(); c.moveTo(x + d, y); c.lineTo(x + d + cs, y + cs); c.stroke(); } c.restore(); },
    (x, y) => { c.fillStyle = '#a9c8e8'; c.fillRect(x, y, cs, cs); c.fillStyle = '#e3b85c'; for (let i = 0; i < 9; i++) { starPath(c, x + 16 + (i % 3) * 44 + (Math.floor(i / 3) % 2) * 10, y + 20 + Math.floor(i / 3) * 42, 11, 4.6); c.fill(); } },
    (x, y) => { c.fillStyle = '#f2bfc9'; c.fillRect(x, y, cs, cs); c.fillStyle = '#fff8f2'; for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(x + 16 + (i % 4) * 32 + (Math.floor(i / 4) % 2) * 16, y + 16 + Math.floor(i / 4) * 32, 7, 0, TAU); c.fill(); } },
    (x, y) => { c.fillStyle = '#fbf1e2'; c.fillRect(x, y, cs, cs); c.strokeStyle = '#d4a752'; c.lineWidth = 3; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const px = x + 16 + i * 32, py = y + 16 + j * 32; c.beginPath(); c.moveTo(px, py - 12); c.lineTo(px + 10, py); c.lineTo(px, py + 12); c.lineTo(px - 10, py); c.closePath(); c.stroke(); } },
    (x, y) => { c.fillStyle = '#2f6450'; c.fillRect(x, y, cs, cs); c.fillStyle = 'rgba(176,47,69,0.75)'; for (let i = 0; i < 4; i++) { c.fillRect(x + i * 32 + 8, y, 12, cs); c.fillRect(x, y + i * 32 + 8, cs, 12); } c.fillStyle = 'rgba(226,186,98,0.8)'; for (let i = 0; i < 4; i++) { c.fillRect(x + i * 32 + 25, y, 2, cs); c.fillRect(x, y + i * 32 + 25, cs, 2); } },
    (x, y) => { c.fillStyle = '#d9b260'; c.fillRect(x, y, cs, cs); c.fillStyle = '#7d1d36'; for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(x + 16 + (i % 4) * 32, y + 16 + Math.floor(i / 4) * 32, 5, 0, TAU); c.fill(); } },
    (x, y) => { c.fillStyle = '#b9d4ee'; c.fillRect(x, y, cs, cs); c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; for (let i = 0; i < 4; i++) { const px = x + 32 + (i % 2) * 64, py = y + 32 + Math.floor(i / 2) * 64; for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * 18, py + Math.sin(a) * 18); c.stroke(); } } },
    (x, y) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fbf1e2' : '#f0b6c2'; c.fillRect(x + i * 16, y, 16, cs); } },
    (x, y) => { c.fillStyle = '#7d1d36'; c.fillRect(x, y, cs, cs); c.fillStyle = '#e3b85c'; for (let i = 0; i < 6; i++) { starPath(c, x + 22 + (i % 3) * 42, y + 32 + Math.floor(i / 3) * 64, 14, 6); c.fill(); } },
    (x, y) => { c.fillStyle = '#fbf1e2'; c.fillRect(x, y, cs, cs); c.fillStyle = '#c03a52'; for (let i = 0; i < 9; i++) { const px = x + 22 + (i % 3) * 42, py = y + 22 + Math.floor(i / 3) * 42; c.beginPath(); c.arc(px - 5, py, 6, 0, TAU); c.arc(px + 5, py, 6, 0, TAU); c.fill(); c.fillStyle = '#2f6450'; c.beginPath(); c.ellipse(px, py - 10, 9, 4, 0.5, 0, TAU); c.fill(); c.fillStyle = '#c03a52'; } },
    (x, y) => { const g = c.createLinearGradient(x, y, x, y + cs); g.addColorStop(0, '#26305e'); g.addColorStop(1, '#3b4a8a'); c.fillStyle = g; c.fillRect(x, y, cs, cs); c.fillStyle = '#f1d38a'; for (let i = 0; i < 12; i++) { starPath(c, x + rnd(10, cs - 10), y + rnd(10, cs - 10), rnd(5, 10), 2.6); c.fill(); } c.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 30; i++) c.fillRect(x + rnd(0, cs), y + rnd(0, cs), 1.5, 1.5); },
    (x, y) => { c.fillStyle = '#c9e4d4'; c.fillRect(x, y, cs, cs); c.fillStyle = '#f0b6c2'; for (let i = 0; i < 4; i++) c.fillRect(x + i * 32 + 6, y, 10, cs); },
  ];
  for (let i = 0; i < n * n; i++) cells[i % cells.length]((i % n) * cs, Math.floor(i / n) * cs);
  dabs(c, s, s, 160, ['#ffffff', '#000000'], 6, 18, 0.05, 2.4, null, false);
  return toTex(cv);
}
/* uv rect for an atlas cell (v flipped because canvas y grows downward) */
function atlasRect(i, n = GIFT_CELLS, pad = 0.03) {
  const cx = i % n, cy = Math.floor(i / n);
  return [(cx + pad) / n, 1 - (cy + 1 - pad) / n, (cx + 1 - pad) / n, 1 - (cy + pad) / n];
}

/* ---- alphabet blocks atlas ---- */
function blockAtlasTex() {
  const s = 512, n = 4, cs = s / n, cv = makeCanvas(s, s), c = cv.getContext('2d');
  const items = ['N', 'O', 'E', 'L', '★', 'A', 'B', 'C', '♥', '1', '2', '3', '✦', 'K', 'Z', '♪'];
  const bgs = ['#f3c3cc', '#b7d2ec', '#c6e3d2', '#f6e2b0'];
  const fgs = ['#7d1d36', '#2b3767', '#7d1d36', '#9a5a1c'];
  items.forEach((ch, i) => {
    const x = (i % n) * cs, y = Math.floor(i / n) * cs, k = i % 4;
    c.fillStyle = '#fbf4e6'; c.fillRect(x, y, cs, cs);
    c.fillStyle = bgs[k]; rr(c, x + 10, y + 10, cs - 20, cs - 20, 10); c.fill();
    c.strokeStyle = '#d4a752'; c.lineWidth = 3; rr(c, x + 16, y + 16, cs - 32, cs - 32, 8); c.stroke();
    c.fillStyle = fgs[k]; c.font = 'bold 72px Georgia, "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(ch, x + cs / 2, y + cs / 2 + 5);
  });
  dabs(c, s, s, 200, ['#ffffff', '#5a3a2a'], 5, 14, 0.06, 2.2, null, false);
  return toTex(cv);
}

/* ---- clock dial ---- */
function clockFaceTex() {
  const s = 256, cv = makeCanvas(s, s), c = cv.getContext('2d');
  c.fillStyle = '#d7ad5a'; c.fillRect(0, 0, s, s);
  const g = c.createRadialGradient(128, 118, 10, 128, 128, 120);
  g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#efe0c2');
  c.fillStyle = g; c.beginPath(); c.arc(128, 128, 118, 0, TAU); c.fill();
  c.strokeStyle = '#9a7232'; c.lineWidth = 4; c.stroke();
  c.lineWidth = 1.5; c.beginPath(); c.arc(128, 128, 84, 0, TAU); c.stroke();
  c.fillStyle = '#3a2418'; c.font = 'bold 22px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  R.forEach((t, i) => {
    const a = (i / 12) * TAU - Math.PI / 2;
    c.save(); c.translate(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); c.rotate(a + Math.PI / 2); c.fillText(t, 0, 0); c.restore();
  });
  for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU; c.fillStyle = '#6b4a2a'; c.fillRect(128 + Math.cos(a) * 86 - 1, 128 + Math.sin(a) * 86 - 1, i % 5 ? 2 : 4, i % 5 ? 2 : 4); }
  c.fillStyle = '#c07a8a';
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; c.beginPath(); c.ellipse(128 + Math.cos(a) * 30, 128 + Math.sin(a) * 30, 12, 6, a, 0, TAU); c.fill(); }
  c.fillStyle = '#d7ad5a'; c.beginPath(); c.arc(128, 128, 12, 0, TAU); c.fill();
  return toTex(cv);
}

/* ---- oil paintings ---- */
function portraitTex() {
  const W = 256, H = 320, cv = makeCanvas(W, H), c = cv.getContext('2d');
  const g = c.createRadialGradient(128, 130, 10, 128, 160, 220);
  g.addColorStop(0, '#9b6a5c'); g.addColorStop(0.5, '#5a2f30'); g.addColorStop(1, '#22100f');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  dabs(c, W, H, 90, ['#7a4a40', '#3a1c1c', '#a77a62'], 8, 24, 0.18, 2.6, null, false);
  c.fillStyle = 'rgba(40,18,18,0.6)'; c.fillRect(0, 262, W, 58);
  const sk = '#f6d9c8';
  c.lineCap = 'round';
  c.strokeStyle = '#f0c3cc'; c.lineWidth = 7;
  c.beginPath(); c.moveTo(124, 205); c.lineTo(122, 284); c.stroke();
  c.beginPath(); c.moveTo(134, 205); c.lineTo(156, 236); c.lineTo(128, 252); c.stroke();
  c.fillStyle = '#f7d0d8';
  c.beginPath(); c.ellipse(128, 200, 64, 15, -0.06, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 26; i++) { c.beginPath(); c.ellipse(128 + rnd(-58, 58), 200 + rnd(-8, 8), rnd(4, 9), 2, rnd(-0.3, 0.3), 0, TAU); c.fill(); }
  c.fillStyle = '#e88da0'; rr(c, 116, 150, 24, 48, 9); c.fill();
  c.strokeStyle = sk; c.lineWidth = 6;
  c.beginPath(); c.moveTo(118, 156); c.quadraticCurveTo(84, 120, 112, 92); c.stroke();
  c.beginPath(); c.moveTo(138, 156); c.quadraticCurveTo(172, 120, 144, 92); c.stroke();
  c.fillStyle = sk; c.beginPath(); c.arc(128, 132, 14, 0, TAU); c.fill();
  c.fillStyle = '#5a3020'; c.beginPath(); c.arc(128, 124, 13, Math.PI, TAU); c.fill(); c.beginPath(); c.arc(128, 112, 7, 0, TAU); c.fill();
  c.fillStyle = '#f2d58a'; for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(128 + i * 5, 118 - Math.abs(i) * -1, 2, 0, TAU); c.fill(); }
  const lg = c.createRadialGradient(128, 160, 10, 128, 160, 120);
  lg.addColorStop(0, 'rgba(255,230,200,0.25)'); lg.addColorStop(1, 'rgba(255,230,200,0)');
  c.fillStyle = lg; c.fillRect(0, 0, W, H);
  speckle(c, W, H, 2400, '#000000', 0.18);
  return toTex(cv);
}
function landscapeTex() {
  const W = 320, H = 200, cv = makeCanvas(W, H), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#e9b9c4'); g.addColorStop(0.5, '#f3d6c8'); g.addColorStop(1, '#f7efe8');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,240,210,0.8)'; c.beginPath(); c.arc(240, 62, 18, 0, TAU); c.fill();
  const hill = (b, col, ph) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 6) c.lineTo(x, b - Math.sin(x * 0.02 + ph) * 12 - Math.sin(x * 0.045 + ph) * 6); c.lineTo(W, H); c.fill(); };
  hill(118, '#c9cbe6', 1); hill(138, '#e8ecf8', 3);
  for (let i = 0; i < 6; i++) {
    const x = 40 + i * 44, y = 150;
    c.fillStyle = ['#c98d8f', '#a9b8d6', '#d6b27a'][i % 3]; c.fillRect(x, y - 22, 26, 22);
    c.fillStyle = '#7d1d36'; c.beginPath(); c.moveTo(x - 4, y - 22); c.lineTo(x + 13, y - 38); c.lineTo(x + 30, y - 22); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x - 4, y - 22); c.lineTo(x + 13, y - 38); c.lineTo(x + 18, y - 33); c.lineTo(x + 2, y - 21); c.fill();
    c.fillStyle = '#ffd98a'; c.fillRect(x + 9, y - 14, 7, 8);
  }
  for (let i = 0; i < 9; i++) { const x = rnd(0, W), y = rnd(150, 178); c.fillStyle = '#3d6a55'; c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x, y - 26); c.lineTo(x + 9, y); c.fill(); }
  dabs(c, W, H, 160, ['#ffffff', '#c7a5b2', '#9fb1d6'], 4, 12, 0.18, 2.6, null, false);
  speckle(c, W, H, 1500, '#3a2020', 0.15);
  return toTex(cv);
}

/* ---- particle sprite atlas (4x2, all white so they tint) ---- */
function particleAtlasTex() {
  const cs = 128, cv = makeCanvas(cs * 4, cs * 2), c = cv.getContext('2d');
  const cell = (i, fn) => { c.save(); c.translate((i % 4) * cs + cs / 2, Math.floor(i / 4) * cs + cs / 2); fn(); c.restore(); };
  cell(0, () => { const g = c.createRadialGradient(0, 0, 0, 0, 0, 62); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(0.6, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-64, -64, 128, 128); });
  cell(1, () => {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-64, -64, 128, 128);
    c.fillStyle = '#fff';
    for (const [l, w, r] of [[60, 7, 0], [60, 7, Math.PI / 2], [30, 4, Math.PI / 4], [30, 4, -Math.PI / 4]]) { c.save(); c.rotate(r); c.beginPath(); c.moveTo(-l, 0); c.quadraticCurveTo(0, -w, l, 0); c.quadraticCurveTo(0, w, -l, 0); c.fill(); c.restore(); }
  });
  cell(2, () => {
    c.strokeStyle = '#fff'; c.lineCap = 'round';
    for (let k = 0; k < 6; k++) {
      c.save(); c.rotate((k / 6) * TAU);
      c.lineWidth = 7; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -54); c.stroke();
      c.lineWidth = 5; for (const d of [-22, -38]) { c.beginPath(); c.moveTo(0, d); c.lineTo(-13, d - 12); c.moveTo(0, d); c.lineTo(13, d - 12); c.stroke(); }
      c.restore();
    }
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.fill();
  });
  cell(3, () => {
    for (const [x, y, r] of [[-14, 6, 34], [16, 4, 30], [0, -14, 34], [4, 16, 28]]) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  });
  cell(4, () => { const g = c.createRadialGradient(0, 0, 0, 0, 0, 62); g.addColorStop(0, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-64, -64, 128, 128); c.fillStyle = '#fff'; starPath(c, 0, 4, 46, 20); c.fill(); });
  cell(5, () => { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, 40); c.bezierCurveTo(-60, -4, -30, -52, 0, -20); c.bezierCurveTo(30, -52, 60, -4, 0, 40); c.fill(); });
  cell(6, () => { c.fillStyle = '#fff'; c.fillRect(-30, -18, 60, 36); });
  cell(7, () => { c.strokeStyle = '#fff'; c.lineWidth = 8; c.beginPath(); c.arc(0, 0, 52, 0, TAU); c.stroke(); const g = c.createRadialGradient(0, 0, 40, 0, 0, 62); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-64, -64, 128, 128); });
  return toTex(cv, { srgb: false });
}
function starburstTex() {
  const s = 256, cv = makeCanvas(s, s), c = cv.getContext('2d');
  c.translate(128, 128);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU, L = i % 2 ? 80 : 124, w = i % 2 ? 3 : 6;
    const g = c.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.save(); c.rotate(a); c.beginPath(); c.moveTo(0, -w); c.lineTo(L, 0); c.lineTo(0, w); c.fill(); c.restore();
  }
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 70); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(-128, -128, 256, 256);
  return toTex(cv, { srgb: false });
}
function blobTex() {
  const s = 128, cv = makeCanvas(s, s), c = cv.getContext('2d');
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 62);
  g.addColorStop(0, 'rgba(40,12,20,0.55)'); g.addColorStop(0.55, 'rgba(40,12,20,0.3)'); g.addColorStop(1, 'rgba(40,12,20,0)');
  c.fillStyle = g; c.fillRect(0, 0, s, s);
  return toTex(cv);
}
function runeTex() {
  const s = 512, cv = makeCanvas(s, s), c = cv.getContext('2d');
  c.translate(256, 256); c.strokeStyle = '#fff'; c.fillStyle = '#fff';
  for (const [r, w] of [[240, 6], [222, 2], [168, 3], [150, 1.5], [70, 3]]) { c.lineWidth = w; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; starPath(c, Math.cos(a) * 196, Math.sin(a) * 196, 14, 6, 5, a); c.fill(); }
  for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU; c.beginPath(); c.arc(Math.cos(a) * 231, Math.sin(a) * 231, 2.5, 0, TAU); c.fill(); }
  c.lineWidth = 2;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 70, Math.sin(a) * 70); c.lineTo(Math.cos(a + Math.PI / 3) * 150, Math.sin(a + Math.PI / 3) * 150); c.lineTo(Math.cos(a + (2 * Math.PI) / 3) * 70, Math.sin(a + (2 * Math.PI) / 3) * 70); c.stroke(); }
  starPath(c, 0, 0, 52, 22); c.fill();
  return toTex(cv, { srgb: false });
}
function beamTex() {
  const cv = makeCanvas(64, 256), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 256);
  const h = c.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.25, 'rgba(0,0,0,0)'); h.addColorStop(0.75, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = h; c.fillRect(0, 0, 64, 256);
  return toTex(cv, { srgb: false });
}
function needleTex() {
  const s = 256, cv = makeCanvas(s, s), c = cv.getContext('2d');
  c.fillStyle = '#e9efe6'; c.fillRect(0, 0, s, s);
  c.lineCap = 'round';
  for (let i = 0; i < 1500; i++) {
    const x = rnd(0, s), y = rnd(0, s), a = Math.PI / 2 + rnd(-0.9, 0.9), L = rnd(6, 14);
    c.strokeStyle = pick(['#ffffff', '#c9d8c4', '#a8bfa6', '#f6fff2', '#8fa88e']); c.globalAlpha = rnd(0.4, 0.9); c.lineWidth = rnd(1, 2.2);
    for (const [ox, oy] of [[0, 0], [s, 0], [-s, 0], [0, s], [0, -s]]) { c.beginPath(); c.moveTo(x + ox, y + oy); c.lineTo(x + ox + Math.cos(a) * L, y + oy + Math.sin(a) * L); c.stroke(); }
  }
  c.globalAlpha = 1;
  return toTex(cv, { repeat: true });
}
function ermineTex() {
  const s = 128, cv = makeCanvas(s, s), c = cv.getContext('2d');
  c.fillStyle = '#fbf8f2'; c.fillRect(0, 0, s, s);
  dabs(c, s, s, 60, ['#ffffff', '#e8e2da'], 4, 9, 0.5, 2.5);
  c.fillStyle = '#1d1418';
  for (let i = 0; i < 8; i++) { const x = 16 + (i % 4) * 32 + (Math.floor(i / 4) % 2) * 16, y = 24 + Math.floor(i / 4) * 64; c.beginPath(); c.moveTo(x, y - 8); c.quadraticCurveTo(x + 6, y + 6, x, y + 12); c.quadraticCurveTo(x - 6, y + 6, x, y - 8); c.fill(); }
  return toTex(cv, { repeat: true });
}
function marbleTex() {
  const s = 256, cv = makeCanvas(s, s), c = cv.getContext('2d');
  c.fillStyle = '#f6ece6'; c.fillRect(0, 0, s, s);
  dabs(c, s, s, 60, ['#ecdcd6', '#fbf6f2', '#efd9d4'], 16, 40, 0.5, 1.8);
  for (let v = 0; v < 7; v++) {
    let x = rnd(0, s), y = rnd(0, s), a = rnd(0, TAU);
    c.strokeStyle = v % 2 ? 'rgba(190,150,150,0.45)' : 'rgba(170,130,120,0.3)'; c.lineWidth = rnd(0.6, 2);
    c.beginPath(); c.moveTo(x, y);
    for (let i = 0; i < 60; i++) { a += rnd(-0.5, 0.5); x += Math.cos(a) * 6; y += Math.sin(a) * 6; c.lineTo(x, y); }
    c.stroke();
  }
  return toTex(cv, { repeat: true });
}
function bgGradientTex() {
  const cv = makeCanvas(4, 512), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#2b1124'); g.addColorStop(0.45, '#1c0a16'); g.addColorStop(1, '#0c0509');
  c.fillStyle = g; c.fillRect(0, 0, 4, 512);
  return toTex(cv, { nomip: true });
}

/* paper grain for the DOM storybook panels */
function paperDataURL() {
  const s = 256, cv = makeCanvas(s, s), c = cv.getContext('2d');
  c.fillStyle = '#f6ead2'; c.fillRect(0, 0, s, s);
  dabs(c, s, s, 140, ['#fbf3e2', '#efdcbc', '#f3e3c6'], 8, 26, 0.35, 2.4);
  speckle(c, s, s, 3500, '#9a7a52', 0.12);
  c.strokeStyle = 'rgba(150,120,80,0.08)';
  for (let i = 0; i < 70; i++) { c.lineWidth = rnd(0.5, 1.2); c.beginPath(); const x = rnd(0, s), y = rnd(0, s); c.moveTo(x, y); c.quadraticCurveTo(x + rnd(-20, 20), y + rnd(-6, 6), x + rnd(-40, 40), y + rnd(-10, 10)); c.stroke(); }
  return cv.toDataURL('image/png');
}

function buildTextures() {
  TEX.brush = brushTex();
  TEX.wallpaper = wallpaperTex(); TEX.wallpaper.repeat.set(1 / 3.2, 1 / 3.2);
  TEX.parquet = parquetTex(); TEX.parquet.repeat.set(1 / 3.6, 1 / 3.6);
  TEX.carpet = carpetTex();
  TEX.night = nightTex();
  TEX.faceClara = { smile: faceTex('clara', 'smile'), blink: faceTex('clara', 'blink'), happy: faceTex('clara', 'happy'), surprised: faceTex('clara', 'surprised'), determined: faceTex('clara', 'determined') };
  TEX.faceFairy = { smile: faceTex('fairy', 'smile'), blink: faceTex('fairy', 'blink') };
  TEX.facePrince = { smile: faceTex('prince', 'smile'), blink: faceTex('prince', 'blink'), happy: faceTex('prince', 'happy') };
  TEX.nutFace = nutFaceTex(false);
  TEX.gifts = giftAtlasTex();
  TEX.blocks = blockAtlasTex();
  TEX.clock = clockFaceTex();
  TEX.portrait = portraitTex();
  TEX.landscape = landscapeTex();
  TEX.particles = particleAtlasTex();
  TEX.starburst = starburstTex();
  TEX.blob = blobTex();
  TEX.rune = runeTex();
  TEX.beam = beamTex();
  TEX.needles = needleTex(); TEX.needles.repeat.set(6, 2);
  TEX.ermine = ermineTex(); TEX.ermine.repeat.set(3, 1);
  TEX.marble = marbleTex();
  TEX.bg = bgGradientTex();
}
