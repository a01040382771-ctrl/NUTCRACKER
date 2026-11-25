// Chapter II ending only: every piece placed by hand, then finale → star door → clear → map.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'e2', mobile: process.env.VIEW === 'mobile' });
  const { ev, shot, until, page } = h;
  await ev(() => { const n = window.__nut; n.Save.data.unlocked = 2; n.DEBUG.timeScale = 4; n.Toy.start(); });
  await until(() => window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 300000, 'explore');
  await ev(() => {
    const n = window.__nut;
    n.Toy.W.gates.forEach((g) => g.set(1));
    for (const id of Object.keys(n.Toy.pieces)) { const pc = n.Toy.pieces[id]; n.TG.found[id] = true; pc.rot = 0; n.Build.place(pc); }
    n.TG.tier = 4; n.Toy.updateGhosts(); n.UI.setStars(12);
    n.player.pos.set(0, 0, 3.0); n.player.yaw = Math.PI;
    n.Story.run(() => n.Toy.finale());
  });
  await until(() => window.__nut.G.phase === 'portal2' && window.__nut.G.mode === 'play', 300000, 'finale');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await page.waitForTimeout(1500);
  await shot('portal');
  const P = await ev(() => { const p = window.__nut.Toy.portal.position; return [p.x, p.z]; });
  await ev(([x, z]) => { const n = window.__nut; n.player.pos.set(x, 0, z + 0.3); }, P);
  await until(() => window.__nut.G.mode === 'clear', 180000, 'clear');
  await page.waitForTimeout(1500);
  await shot('clear');
  console.log('FINAL', JSON.stringify(await ev(() => { const n = window.__nut; return { mode: n.G.mode, save: n.Save.data.done.toys, unlocked: n.Save.data.unlocked, shot: n.Toy.shot.length > 1000, next: !document.getElementById('btnClearNext').hidden, title: document.getElementById('clrTitle').textContent }; })));
  await ev(() => { document.getElementById('btnClearMap').click(); });
  await page.waitForTimeout(1800);
  await shot('map');
  console.log('MAP', JSON.stringify(await ev(() => ({ sel: window.__nut.Story.mapSel, title: document.getElementById('mapTitle').textContent, lock: document.getElementById('mapLockText').textContent, btn: document.getElementById('btnPlayChapter').textContent }))));
  await ev(() => { const n = window.__nut; n.Story.mapSel = 1; n.Story.renderMap(); });
  await page.waitForTimeout(800);
  await shot('map-ch2');
  console.log('MAP2', JSON.stringify(await ev(() => ({ img: !document.getElementById('mapImg').hidden, stats: document.getElementById('mapStats').textContent, btn: document.getElementById('btnPlayChapter').textContent, disabled: document.getElementById('btnPlayChapter').disabled }))));
  await h.finish();
})();
