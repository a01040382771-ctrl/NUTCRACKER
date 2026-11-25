/* =====================================================================
   12 · TOY KINGDOM TEXTURES — painted at the moment the chapter opens
   ===================================================================== */
const TEX2 = {};

/* candy tiles for the palace square */
function checkerTex() {
  const s = 512, n = 8, cs = s / n, cv = makeCanvas(s, s), c = cv.getContext('2d');
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    c.fillStyle = (i + j) % 2 ? '#f6c9d1' : '#fbf1e2';
    c.fillRect(i * cs, j * cs, cs, cs);
  }
  dabs(c, s, s, 260, ['#ffffff', '#f3dcd2', '#efc0c8'], 8, 22, 0.16, 2.4);
  c.strokeStyle = '#d9b46a'; c.lineWidth = 3;
  for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * cs, 0); c.lineTo(i * cs, s); c.stroke(); c.beginPath(); c.moveTo(0, i * cs); c.lineTo(s, i * cs); c.stroke(); }
  c.fillStyle = '#d9b46a';
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if ((i + j) % 2) continue;
    c.save(); c.translate(i * cs + cs / 2, j * cs + cs / 2); c.rotate(Math.PI / 4);
    c.globalAlpha = 0.5; c.fillRect(-6, -6, 12, 12); c.restore();
  }
  c.globalAlpha = 1;
  speckle(c, s, s, 1800, '#a07a62', 0.1);
  return toTex(cv, { repeat: true });
}

/* felt cloth (white, tinted by vertex colours) with running stitches */
function feltTex() {
  const s = 256, cv = makeCanvas(s, s), c = cv.getContext('2d');
  c.fillStyle = '#efefef'; c.fillRect(0, 0, s, s);
  dabs(c, s, s, 420, ['#ffffff', '#f7f7f7', '#dedede', '#e6e6e6'], 3, 9, 0.5, 3.2);
  c.lineCap = 'round';
  for (let i = 0; i < 2600; i++) {
    const x = rnd(0, s), y = rnd(0, s), a = rnd(0, TAU), L = rnd(2, 6);
    c.strokeStyle = pick(['#ffffff', '#d2d2d2', '#c8c8c8']); c.globalAlpha = rnd(0.2, 0.5); c.lineWidth = rnd(0.6, 1.2);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke();
  }
  c.globalAlpha = 0.55; c.strokeStyle = '#ffffff'; c.lineWidth = 2.2; c.setLineDash([7, 6]);
  c.beginPath(); c.moveTo(0, 18); c.lineTo(s, 18); c.stroke();
  c.beginPath(); c.moveTo(18, 0); c.lineTo(18, s); c.stroke();
  c.setLineDash([]); c.globalAlpha = 1;
  return toTex(cv, { repeat: true });
}

/* painted backdrop: twilight under the giant tree */
function toySkyTex() {
  const W = 2048, H = 640, cv = makeCanvas(W, H), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#3b3f7a'); g.addColorStop(0.28, '#7d7fbd'); g.addColorStop(0.55, '#d8a9c9'); g.addColorStop(0.78, '#f7cdbf'); g.addColorStop(1, '#fbe6cf');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // far bokeh of fairy lights
  for (let i = 0; i < 90; i++) {
    const x = rnd(0, W), y = rnd(10, H * 0.5), r = rnd(5, 18);
    const rg = c.createRadialGradient(x, y, 0, x, y, r);
    const col = pick(['255,220,140', '255,190,200', '200,225,255', '255,240,200']);
    rg.addColorStop(0, `rgba(${col},0.85)`); rg.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = rg; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // soft clouds
  for (let i = 0; i < 22; i++) {
    const x = rnd(0, W), y = rnd(H * 0.36, H * 0.66), w = rnd(120, 260);
    c.fillStyle = 'rgba(255,240,236,0.32)';
    for (let k = 0; k < 6; k++) { c.beginPath(); c.ellipse(x + rnd(-w / 2, w / 2), y + rnd(-14, 10), rnd(40, 80), rnd(16, 28), 0, 0, TAU); c.fill(); }
  }
  // distant toy hills and castle silhouettes
  const hill = (base, col, amp, f, ph) => {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) c.lineTo(x, base - Math.sin(x * f + ph) * amp - Math.sin(x * f * 2.7 + ph * 2) * amp * 0.35);
    c.lineTo(W, H); c.closePath(); c.fill();
  };
  hill(H * 0.83, '#c5a4c8', 18, 0.006, 1);
  for (let i = 0; i < 9; i++) {
    const x = 120 + i * 230 + rnd(-40, 40), b = H * 0.82, w = rnd(40, 70), h = rnd(50, 110);
    c.fillStyle = '#b392bb';
    c.fillRect(x - w / 2, b - h, w, h);
    c.beginPath(); c.moveTo(x - w / 2 - 8, b - h); c.lineTo(x, b - h - rnd(40, 70)); c.lineTo(x + w / 2 + 8, b - h); c.fill();
    c.fillRect(x - w / 2 - 22, b - h * 0.6, 18, h * 0.6);
    c.beginPath(); c.moveTo(x - w / 2 - 26, b - h * 0.6); c.lineTo(x - w / 2 - 13, b - h * 0.6 - 30); c.lineTo(x - w / 2, b - h * 0.6); c.fill();
    c.fillStyle = 'rgba(255,222,150,0.8)';
    for (let k = 0; k < 3; k++) c.fillRect(x - 6 + rnd(-10, 10), b - h + 14 + k * 22, 7, 10);
  }
  hill(H * 0.9, '#d9b9c9', 14, 0.009, 3);
  hill(H * 0.97, '#ecd2cf', 10, 0.012, 5);
  // giant pine branches hanging from above
  for (let i = 0; i < 16; i++) {
    const x = (i / 16) * W + rnd(-40, 40), drop = rnd(70, 150), w = rnd(260, 380);
    for (let layer = 0; layer < 3; layer++) {
      c.fillStyle = ['#183528', '#21473a', '#2c5a47'][layer];
      c.beginPath(); c.moveTo(x - w / 2, -10);
      const n = 9;
      for (let k = 0; k <= n; k++) {
        const t = k / n, px = x - w / 2 + t * w, py = drop * Math.sin(t * Math.PI) * (1 - layer * 0.22) + (k % 2 ? 16 : -4);
        c.lineTo(px, py);
      }
      c.lineTo(x + w / 2, -10); c.closePath(); c.fill();
    }
  }
  dabs(c, W, H * 0.28, 300, ['#2f5d49', '#16301f', '#3d6c56'], 4, 12, 0.35, 3, Math.PI / 2, false);
  speckle(c, W, H, 5000, '#ffffff', 0.08);
  return toTex(cv, { repeat: true });
}

/* the blueprint page on the lectern */
function blueprintTex() {
  const W = 512, H = 384, cv = makeCanvas(W, H), c = cv.getContext('2d');
  c.fillStyle = '#2d4f86'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(200,225,255,0.18)'; c.lineWidth = 1;
  for (let x = 0; x < W; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let y = 0; y < H; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.strokeStyle = '#e8f2ff'; c.lineWidth = 2.4; c.lineJoin = 'round';
  const gx = 256, gy = 320;
  c.strokeRect(gx - 170, gy - 22, 340, 22);
  c.strokeRect(gx - 140, gy - 130, 90, 108); c.strokeRect(gx + 50, gy - 130, 90, 108);
  c.strokeRect(gx - 50, gy - 160, 100, 138);
  c.beginPath(); c.arc(gx, gy - 52, 26, Math.PI, 0); c.lineTo(gx + 26, gy - 22); c.moveTo(gx - 26, gy - 22); c.lineTo(gx - 26, gy - 52); c.stroke();
  for (const sx of [-1, 1]) {
    const tx = gx + sx * 160;
    c.strokeRect(tx - 22, gy - 210, 44, 188);
    c.beginPath(); c.moveTo(tx - 28, gy - 210); c.lineTo(tx, gy - 268); c.lineTo(tx + 28, gy - 210); c.stroke();
  }
  c.beginPath(); c.moveTo(gx - 46, gy - 160); c.bezierCurveTo(gx - 60, gy - 210, gx - 12, gy - 232, gx, gy - 268); c.bezierCurveTo(gx + 12, gy - 232, gx + 60, gy - 210, gx + 46, gy - 160); c.stroke();
  c.beginPath(); c.moveTo(gx, gy - 268); c.lineTo(gx, gy - 300); c.stroke();
  starPath(c, gx, gy - 314, 14, 6); c.stroke();
  c.setLineDash([5, 5]); c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(30, gy + 14); c.lineTo(W - 30, gy + 14); c.stroke();
  c.beginPath(); c.moveTo(30, 40); c.lineTo(30, gy + 14); c.stroke();
  c.setLineDash([]);
  c.fillStyle = '#e8f2ff'; c.font = 'italic 22px Georgia, serif'; c.textAlign = 'left'; c.fillText('Palais des Jouets', 40, 36);
  c.font = '13px Georgia, serif'; c.fillText('I · II · III · IV', 40, 56);
  dabs(c, W, H, 120, ['#ffffff', '#132a50'], 6, 20, 0.05, 2.4, null, false);
  return toTex(cv);
}

/* wooden plaques with zone names (4 rows) */
async function signTex() {
  try { if (document.fonts && document.fonts.load) await Promise.race([document.fonts.load('800 60px "Nanum Myeongjo"'), new Promise((r) => setTimeout(r, 1500))]); } catch (e) { /* fallback font */ }
  const W = 512, R = 128, names = ['기차 마을', '회전목마 광장', '오르골 정원', '왕궁 광장'];
  const cv = makeCanvas(W, R * 4), c = cv.getContext('2d');
  names.forEach((t, i) => {
    const y = i * R;
    c.fillStyle = '#7d1d36'; c.fillRect(0, y, W, R);
    const g = c.createLinearGradient(0, y, 0, y + R); g.addColorStop(0, '#9b2944'); g.addColorStop(1, '#5e1329');
    c.fillStyle = g; rr(c, 6, y + 6, W - 12, R - 12, 14); c.fill();
    c.strokeStyle = '#e8c878'; c.lineWidth = 5; rr(c, 14, y + 14, W - 28, R - 28, 10); c.stroke();
    c.fillStyle = '#fff1cf'; c.font = '800 58px "Nanum Myeongjo", "Gowun Batang", "Apple SD Gothic Neo", "Noto Serif KR", serif';
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, W / 2, y + R / 2 + 3);
    c.fillStyle = '#e8c878';
    for (const sx of [34, W - 34]) { starPath(c, sx, y + R / 2, 11, 4.6); c.fill(); }
  });
  dabs(c, W, R * 4, 160, ['#ffffff', '#000000'], 5, 14, 0.05, 2.2, null, false);
  return toTex(cv);
}
const signRect = (i) => [0.01, 1 - (i + 1) / 4 + 0.006, 0.99, 1 - i / 4 - 0.006];

/* painted roses and gilt scrolls for the music box */
function boxPanelTex() {
  const W = 512, H = 256, cv = makeCanvas(W, H), c = cv.getContext('2d');
  c.fillStyle = '#7d1d36'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#fbf1e2'; rr(c, 18, 18, W - 36, H - 36, 18); c.fill();
  c.strokeStyle = '#d4a752'; c.lineWidth = 6; rr(c, 28, 28, W - 56, H - 56, 14); c.stroke();
  const rose = (x, y, r, col) => {
    for (let k = 0; k < 5; k++) { c.fillStyle = k % 2 ? col : '#f7c9d2'; c.beginPath(); c.arc(x + Math.cos(k * 1.3) * r * 0.25, y + Math.sin(k * 1.3) * r * 0.25, r * (1 - k * 0.16), 0, TAU); c.fill(); }
    c.fillStyle = '#5f8f6d';
    for (const a of [0.6, 2.4, 4.0]) { c.beginPath(); c.ellipse(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3, r * 0.7, r * 0.3, a, 0, TAU); c.fill(); }
  };
  c.strokeStyle = '#c9a04f'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(60, H / 2); c.bezierCurveTo(140, 60, 200, 200, 256, H / 2); c.bezierCurveTo(312, 60, 372, 200, 452, H / 2); c.stroke();
  rose(256, H / 2, 30, '#d77b91'); rose(140, 96, 20, '#e29aab'); rose(372, 160, 20, '#e29aab'); rose(90, 170, 14, '#d77b91'); rose(422, 86, 14, '#d77b91');
  c.fillStyle = '#c9a04f';
  for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(40 + i * 33, 40, 3, 0, TAU); c.fill(); c.beginPath(); c.arc(40 + i * 33, H - 40, 3, 0, TAU); c.fill(); }
  dabs(c, W, H, 120, ['#ffffff', '#5a2a2a'], 5, 16, 0.06, 2.4, null, false);
  return toTex(cv);
}

/* sheet music for the piano stand */
function sheetTex() {
  const W = 256, H = 320, cv = makeCanvas(W, H), c = cv.getContext('2d');
  c.fillStyle = '#fbf3e2'; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#5a3a2a'; c.fillStyle = '#3a2418'; c.lineWidth = 1.4;
  for (let st = 0; st < 5; st++) {
    const y0 = 40 + st * 56;
    for (let l = 0; l < 5; l++) { c.beginPath(); c.moveTo(18, y0 + l * 7); c.lineTo(W - 18, y0 + l * 7); c.stroke(); }
    for (let k = 0; k < 7; k++) {
      const x = 40 + k * 29, y = y0 + 28 - ((k * 3 + st) % 7) * 3.5;
      c.beginPath(); c.ellipse(x, y, 5, 3.6, -0.4, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(x + 4.5, y); c.lineTo(x + 4.5, y - 22); c.stroke();
    }
  }
  c.font = 'italic 18px Georgia, serif'; c.textAlign = 'center'; c.fillText('Valse des Jouets', W / 2, 24);
  dabs(c, W, H, 90, ['#e8d5b5', '#ffffff'], 6, 18, 0.2, 2.4, null, false);
  return toTex(cv);
}

/* holey cheese for the mouse camp tents */
function cheeseTex() {
  const s = 256, cv = makeCanvas(s, s), c = cv.getContext('2d');
  c.fillStyle = '#f3cf6a'; c.fillRect(0, 0, s, s);
  dabs(c, s, s, 120, ['#f8dc86', '#e9bd4f'], 8, 20, 0.35, 1.6);
  for (let i = 0; i < 26; i++) {
    const x = rnd(0, s), y = rnd(0, s), r = rnd(5, 16);
    for (const [ox, oy] of [[0, 0], [s, 0], [-s, 0], [0, s], [0, -s]]) {
      const g = c.createRadialGradient(x + ox - r * 0.25, y + oy - r * 0.25, 0, x + ox, y + oy, r);
      g.addColorStop(0, '#b98a2a'); g.addColorStop(0.75, '#d9a840'); g.addColorStop(1, 'rgba(233,189,79,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x + ox, y + oy, r, 0, TAU); c.fill();
    }
  }
  return toTex(cv, { repeat: true });
}

/* soft fan of lantern light (white, tinted by material) */
function coneTex() {
  const s = 128, cv = makeCanvas(s, s), c = cv.getContext('2d');
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.7, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, s, s);
  return toTex(cv, { srgb: false });
}

async function buildToyTextures() {
  if (TEX2.ready) return;
  reseed(2412);
  TEX2.checker = checkerTex(); TEX2.checker.repeat.set(1 / 10.4, 1 / 10.4);
  TEX2.felt = feltTex();
  TEX2.sky = toySkyTex(); TEX2.sky.repeat.set(2, 1);
  TEX2.blueprint = blueprintTex();
  TEX2.signs = await signTex();
  TEX2.panel = boxPanelTex();
  TEX2.sheet = sheetTex();
  TEX2.cheese = cheeseTex();
  TEX2.cone = coneTex();
  TEX2.ready = true;
}
