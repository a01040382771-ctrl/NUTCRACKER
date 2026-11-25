// Opens chapter II straight from the title and takes a few pictures.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 's', mobile: process.env.VIEW === 'mobile' });
  const { ev, shot, until, page } = h;
  await ev(() => { const n = window.__nut; n.Save.data.unlocked = 2; n.DEBUG.timeScale = 3; n.Toy.start(); });
  await until(() => window.__nut.G.mode === 'cutscene' && window.__nut.G.chapter === 2, 240000, 'loaded');
  await page.waitForTimeout(2500);
  await shot('intro');
  await until(() => window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 240000, 'explore');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await page.waitForTimeout(1500);
  await shot('explore');
  const views = [
    ['plaza', [0, 9, 17], [0, 2.5, -4]],
    ['palace-ghost', [6, 6, 8], [0, 3, -5.5]],
    ['train', [-15, 9, 13], [-22, 1, -2]],
    ['carousel', [26, 9, 8], [21, 2, -5]],
    ['camp', [24, 8, -2], [28, 0.5, 7]],
    ['musicbox', [6, 7, 33], [0, 1.5, 21]],
  ];
  await ev(() => { const n = window.__nut; n.G.locked = true; });
  for (const [name, pos, tgt] of views) {
    await ev(([p, t]) => { const n = window.__nut; n.Cam.set(p, t); }, [pos, tgt]);
    await page.waitForTimeout(900);
    await shot(name);
  }
  await h.finish();
})();
