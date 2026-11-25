// Opens chapter III straight from the title and takes pictures of the intro, the lanes and the world.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 's3', mobile: process.env.VIEW === 'mobile' });
  const { ev, shot, until, page } = h;
  await ev(() => { const n = window.__nut; n.Save.data.unlocked = 3; n.DEBUG.timeScale = 3; n.Snow.start(); });
  await until(() => window.__nut.G.chapter === 3 && window.__nut.G.mode === 'cutscene', 300000, 'loaded');
  console.log('N tiles', await ev(() => window.__nut.Snow.N), 'path length', await ev(() => window.__nut.Snow.W.LEN.toFixed(1)), 'gateS', await ev(() => window.__nut.Snow.W.gateS.toFixed(1)));
  await page.waitForTimeout(1800);
  await shot('intro');
  await until(() => window.__nut.G.phase === 'rhythm' && window.__nut.G.mode === 'play', 300000, 'rhythm');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  console.log('clock', await ev(() => window.__nut.Rhythm.clock), 'running', await ev(() => window.__nut.Rhythm.running), 'ctx', await ev(() => window.__nut.Sound.ctx && window.__nut.Sound.ctx.state));
  await page.waitForTimeout(1500);
  await shot('count-in');
  await ev(() => { window.__nut.Rhythm.auto = { perfect: 0.6, good: 0.25 }; });
  await page.waitForTimeout(7000);
  await shot('rhythm-a');
  await page.waitForTimeout(6000);
  await shot('rhythm-b');
  console.log('stats', JSON.stringify(await ev(() => window.__nut.Rhythm.stats)), 'opened', await ev(() => window.__nut.Snow.opened));
  await h.finish();
})();
