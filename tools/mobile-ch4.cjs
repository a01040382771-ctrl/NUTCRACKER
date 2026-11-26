// Chapter IV on a phone (390 × 844, touch): the rehearsal panel fits under the HUD with the dancer still in view above it,
// and the games answer real touch input: the two pads, a finger following the bead, a tap that sets a cup down.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'm4', mobile: true });
  const { ev, shot, until, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };
  const start = async (id) => {
    await ev((id) => { const n = window.__nut; n.Recital.auto = null; n.DEBUG.timeScale = 3; n.Sweet.rehearse(id); }, id);
    await until(() => window.__nut.Recital.running && window.__nut.Recital.lastRel > 0.2, 120000, id + ' runs');
    await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  };
  const layout = () => ev(() => {
    const n = window.__nut, f = document.getElementById('rcField').getBoundingClientRect(), o = document.getElementById('objective').getBoundingClientRect();
    const d = n.Sweet.dancers[n.Sweet.active], V = n.camera.position.constructor, v = new V();
    n.camera.updateMatrixWorld(true); d.head.getWorldPosition(v); v.project(n.camera);
    return { field: [f.left, f.top, f.right, f.bottom].map(Math.round), hud: Math.round(o.bottom), vw: innerWidth, vh: innerHeight, head: Math.round((-v.y * 0.5 + 0.5) * innerHeight), headX: Math.round((v.x * 0.5 + 0.5) * innerWidth) };
  });
  const back = () => ev(() => { const n = window.__nut; n.Recital.stop(); n.Sweet.active = null; document.getElementById('recital').hidden = true; n.Sweet.setView(0); n.Sweet.backToPlaza(); });

  await ev(() => { const n = window.__nut; n.Save.data.unlocked = 4; delete n.Save.data.ch4; n.DEBUG.timeScale = 3; n.Sweet.start(); });
  await until(() => window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 300000, 'explore');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  const ex = await ev(() => ({ controls: !document.getElementById('controls').hidden, act: document.getElementById('actLabel').textContent }));
  ok('phone: the joystick and the action button are out while walking the avenue', ex.controls, ex);
  await shot('explore');

  /* chocolate: the left half of the panel is the stamp, the right half the castanets */
  await start('choco');
  const L1 = await layout();
  ok('chocolate: the panel fits the screen below the HUD, the dancer stands above it', L1.field[0] >= 0 && L1.field[2] <= L1.vw && L1.field[3] <= L1.vh && L1.field[1] > L1.hud && L1.head > L1.hud && L1.head < L1.field[1] && L1.headX > 0 && L1.headX < L1.vw, L1);
  const pads = await ev(() => { const r = document.getElementById('rcCv').getBoundingClientRect(), H = r.height, W = r.width, pr = Math.min(W * 0.19, H * 0.15, 88), py = r.top + H - pr - Math.max(18, H * 0.05); return { L: [r.left + W * 0.27, py], R: [r.left + W * 0.73, py] }; });
  const before = await ev(() => { const C = window.__nut.REHEARSAL_GAMES.choco; return C.pad.slice(); });
  await page.touchscreen.tap(pads.L[0], pads.L[1]);
  await page.waitForTimeout(250);
  const mid = await ev(() => { const C = window.__nut.REHEARSAL_GAMES.choco; return C.pad.slice(); });
  await page.touchscreen.tap(pads.R[0], pads.R[1]);
  await page.waitForTimeout(250);
  const after = await ev(() => { const C = window.__nut.REHEARSAL_GAMES.choco; return C.pad.slice(); });
  ok('chocolate: a touch on the left pad stamps, a touch on the right pad plays the castanets', mid[0] > before[0] && mid[1] === before[1] && after[1] > before[1], { before, mid, after });
  await shot('choco');
  await back();
  await until(() => window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 120000, 'back 1');

  /* coffee: a finger (touch pointer events) follows the bead through the first shape */
  await start('coffee');
  const L2 = await layout();
  ok('coffee: the drawing panel fits below the HUD with the dancer above it', L2.field[1] > L2.hud && L2.field[3] <= L2.vh && L2.head < L2.field[1], L2);
  await ev(() => {
    const n = window.__nut, R = n.Recital, K = n.REHEARSAL_GAMES.coffee, cv = document.getElementById('rcCv');
    const fire = (type, x, y) => { const r = cv.getBoundingClientRect(); cv.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: r.left + x, clientY: r.top + y, bubbles: true, cancelable: true })); };
    let down = false;
    const step = () => {
      if (!R.running) return;
      const p = K.phrases[0], bx = K.box(R), b = K.beadAt(R, p, Math.max(R.rel() + 0.06, p.go)), x = bx.x + b.xy[0] * bx.S, y = bx.y + b.xy[1] * bx.S;
      if (!down) { fire('pointerdown', x, y); down = true; } else fire('pointermove', x, y);
      if (!p.done) requestAnimationFrame(step); else fire('pointerup', x, y);
    };
    requestAnimationFrame(step);
  });
  await until(() => window.__nut.REHEARSAL_GAMES.coffee.phrases[0].done, 60000, 'first shape');
  const c1 = await ev(() => { const K = window.__nut.REHEARSAL_GAMES.coffee; return { pct: K.phrases[0].pct, trail: K.trail.length }; });
  ok('coffee: a finger kept on the bead draws the first shape almost perfectly', c1.pct >= 85, c1);
  await shot('coffee');
  await back();
  await until(() => window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 120000, 'back 2');

  /* tea: a tap anywhere on the panel sets the swinging cup down */
  await start('tea');
  await until(() => window.__nut.Recital.lastRel > 0.3, 30000, 'tea after the count-in');
  const L3 = await layout();
  ok('tea: the tower panel fits below the HUD with the dancer above it', L3.field[1] > L3.hud && L3.field[3] <= L3.vh && L3.head < L3.field[1], L3);
  await page.touchscreen.tap((L3.field[0] + L3.field[2]) / 2, (L3.field[1] + L3.field[3]) / 2);
  await page.waitForTimeout(900);
  const t1 = await ev(() => { const T = window.__nut.REHEARSAL_GAMES.tea; return { cups: T.cups.length, miss: T.stats.miss, state: T.hand.state }; });
  ok('tea: one tap drops one cup onto the tower (or off it)', t1.cups + t1.miss === 1, t1);
  await shot('tea');
  await back();

  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
