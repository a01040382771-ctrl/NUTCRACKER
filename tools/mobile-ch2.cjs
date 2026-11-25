// Phone-sized check of chapter II: HUD, joystick, and build mode driven by real taps.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'm2', mobile: true });
  const { ev, shot, until, page } = h;
  await page.waitForTimeout(1000);
  await ev(() => { const n = window.__nut; n.Save.data.unlocked = 2; n.DEBUG.timeScale = 4; n.Toy.start(); });
  await until(() => window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 300000, 'explore');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await page.waitForTimeout(1500);
  await shot('explore');
  // joystick: drag right inside the stick zone
  const before = await ev(() => window.__nut.player.pos.x);
  await ev(() => { const z = document.getElementById('stickZone'), r = z.getBoundingClientRect(), x = r.left + 90, y = r.bottom - 120; const o = (cx, cy) => ({ pointerId: 7, pointerType: 'touch', clientX: cx, clientY: cy, bubbles: true, isPrimary: true }); z.dispatchEvent(new PointerEvent('pointerdown', o(x, y))); z.dispatchEvent(new PointerEvent('pointermove', o(x + 60, y))); });
  await page.waitForTimeout(2500);
  await ev(() => { document.getElementById('stickZone').dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, pointerType: 'touch', bubbles: true })); });
  const after = await ev(() => window.__nut.player.pos.x);
  console.log('joystick moved x', before.toFixed(2), '->', after.toFixed(2));
  // hand Clara the three plaza pieces and walk her to the lectern
  await ev(() => { const n = window.__nut; for (const id of ['base', 'gate', 'stairs']) { const pc = n.Toy.pieces[id]; n.TG.found[id] = true; pc.state = 'follow'; pc.fpos.copy(n.player.pos); n.Toy.followers.push(id); } n.UI.setStars(3); n.player.pos.set(0, 0, 2.75); });
  await page.waitForTimeout(1200);
  await shot('lectern');
  // press the big gold button
  await ev(() => { const b = document.getElementById('btnAct'); b.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, pointerType: 'touch', bubbles: true })); b.dispatchEvent(new PointerEvent('pointerup', { pointerId: 9, pointerType: 'touch', bubbles: true })); });
  await until(() => window.__nut.G.mode === 'build', 30000, 'build');
  await page.waitForTimeout(1500);
  await shot('build');
  // tap the first tray card, then tap the base's blueprint on the canvas
  await page.tap('#bdTray .bd-piece');
  await until(() => window.__nut.Build.sel === 'base', 20000, 'select base');
  await page.waitForTimeout(1500);
  await shot('build-selected');
  const pt = await ev(() => { const n = window.__nut, g = n.Toy.pieces.base.ghost, v = new n.camera.position.constructor(); g.getWorldPosition(v); v.y += 0.5; v.z += 2.6; v.project(n.camera); const r = n.renderer.domElement.getBoundingClientRect(); return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height }; });
  await page.touchscreen.tap(pt.x, pt.y);
  await until(() => { const b = window.__nut.Build; return b.stage === 'hover' || b.stage === 'snap' || !!window.__nut.TG.placed.base; }, 30000, 'tap slot');
  await until(() => { const b = window.__nut.Build; return !b.busy; }, 30000, 'flight');
  await page.waitForTimeout(800);
  await shot('build-hover');
  for (let i = 0; i < 4; i++) {
    if (await ev(() => !!window.__nut.TG.placed.base || window.__nut.Build.stage === 'snap')) break;
    await page.tap('#btnRotL', { force: true }); // the button bounces while it waits, so skip the stability check
    await until(() => { const b = window.__nut.Build; return !b.busy || b.stage === 'snap'; }, 20000, 'rotate');
  }
  await until(() => !!window.__nut.TG.placed.base, 30000, 'base placed');
  await page.waitForTimeout(1200);
  await shot('build-placed');
  console.log('placed by touch', await ev(() => JSON.stringify(window.__nut.TG.placed)));
  const ov = await ev(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  console.log('overflow', JSON.stringify(ov));
  await page.tap('#btnBuildExit', { force: true });
  await until(() => window.__nut.G.mode === 'play', 20000, 'exit build');
  await page.waitForTimeout(1000);
  await shot('after-build');
  await h.finish();
})();
