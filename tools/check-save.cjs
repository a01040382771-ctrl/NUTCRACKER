// Chapter II checkpoint saving: save at a tier boundary, reload the page, continue from the chapter map.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'sv', mobile: process.env.VIEW === 'mobile' });
  const { ev, shot, until, page } = h;
  const KEY = 'nutcracker-clara-v1';
  const raw = () => ev((k) => localStorage.getItem(k), KEY);
  const explore = (label) => until(() => window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 300000, label);
  const report = (label) => ev(() => {
    const n = window.__nut, T = n.Toy, W2 = T.W;
    return { tier: n.TG.tier, placed: Object.keys(n.TG.placed).length, found: Object.keys(n.TG.found).length, caught: n.TG.caught, time: Math.round(n.G.time), gates: W2.gates.map((g) => g.open), crane: n.TG.crane, craneRot: +W2.crane.jib.rotation.y.toFixed(2), gift: n.TG.gift, counter: document.getElementById('starNum').textContent, objective: document.getElementById('objText').textContent, phase: n.G.phase };
  }).then((r) => console.log(label, JSON.stringify(r)));

  /* 1. play tier I by hand, finish it, and let the game save */
  await ev(() => { const n = window.__nut; n.Save.data.unlocked = 2; n.DEBUG.timeScale = 4; n.Toy.start(); });
  await explore('explore');
  console.log('saved before any tier:', await raw() && JSON.parse(await raw()).ch2);
  await ev(() => {
    const n = window.__nut;
    for (const id of ['base', 'gate', 'stairs']) { const pc = n.Toy.pieces[id]; n.TG.found[id] = true; pc.rot = 0; n.Build.place(pc); }
    n.UI.setStars(3);
    n.G.time = 95; n.TG.caught = 2;
    n.Story.run(() => n.Toy.tierComplete(1));
  });
  await until(() => window.__nut.TG.tier === 2 && window.__nut.G.mode === 'play', 300000, 'tier 1 done');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await page.waitForTimeout(600);
  const saved = await raw();
  console.log('saved after tier I:', JSON.stringify(JSON.parse(saved).ch2));
  await shot('saved-toast');

  /* 2. reload the page: the checkpoint must survive, and the map must offer to continue */
  await page.reload();
  await page.waitForFunction(() => window.__nut && window.__nut.G.mode === 'title', null, { timeout: 180000 });
  await ev(() => { const n = window.__nut; n.Story.mapSel = 1; n.Story.openMap(); });
  await page.waitForTimeout(800);
  console.log('map after reload', JSON.stringify(await ev(() => ({ cont: !document.getElementById('btnContinue').hidden, contText: document.getElementById('btnContinue').textContent, playText: document.getElementById('btnPlayChapter').textContent, stats: document.getElementById('mapStats').textContent }))));
  await shot('map-continue');

  /* 3. continue: pieces of tier I stand on the dais, the first gate is open, progress carried over */
  await ev(() => { window.__nut.DEBUG.timeScale = 4; document.getElementById('btnContinue').click(); });
  await explore('continued');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await page.waitForTimeout(1500);
  await report('continued tier 2:');
  await shot('continued');
  await ev(() => { const n = window.__nut; n.G.locked = true; n.Cam.set([8, 5.5, 8], [0, 2, -5.5]); });
  await page.waitForTimeout(900);
  await shot('continued-palace');

  /* 4. "처음부터" starts over and does not drag the old state along */
  await ev(() => { const n = window.__nut; n.Story.toTitle(); n.Story.mapSel = 1; n.Story.openMap(); });
  await page.waitForTimeout(600);
  await ev(() => { window.__nut.DEBUG.timeScale = 4; document.getElementById('btnPlayChapter').click(); });
  await explore('fresh');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await report('fresh start:');

  /* 5. checkpoints for the later tiers restore the crane, the open gates and every finished piece */
  for (const tier of [3, 4]) {
    await ev((t) => { const n = window.__nut; n.Story.toTitle(); n.Save.data.ch2 = { v: 1, tier: t, time: 400, caught: 1 }; n.Save.write(); n.Story.mapSel = 1; n.Story.openMap(); }, tier);
    await page.waitForTimeout(500);
    await ev(() => { window.__nut.DEBUG.timeScale = 4; document.getElementById('btnContinue').click(); });
    await explore('tier ' + tier);
    await ev(() => { window.__nut.DEBUG.timeScale = 1; });
    await page.waitForTimeout(1200);
    await report(`continued tier ${tier}:`);
    if (tier === 4) {
      await ev(() => { const n = window.__nut; n.G.locked = true; n.Cam.set([10, 7, 12], [0, 3.5, -5.5]); });
      await page.waitForTimeout(900);
      await shot('continued-tier4');
    }
  }

  /* 6. a damaged or foreign save is ignored */
  for (const bad of [{ v: 1, tier: 9, time: 1, caught: 0 }, { v: 2, tier: 2 }, { tier: 3 }, 'junk']) {
    await ev((b) => { const n = window.__nut; n.Story.toTitle(); n.Save.data.ch2 = b; n.Story.mapSel = 1; n.Story.openMap(); }, bad);
    const shown = await ev(() => !document.getElementById('btnContinue').hidden);
    console.log('bad save', JSON.stringify(bad), '-> continue button shown:', shown);
  }

  /* 7. finishing the chapter wipes the checkpoint */
  await ev(() => {
    const n = window.__nut;
    n.Story.toTitle(); n.Save.data.ch2 = { v: 1, tier: 4, time: 400, caught: 0 }; n.Save.write();
    n.Toy.reset(); for (const id of Object.keys(n.Toy.pieces)) { n.TG.placed[id] = true; }
    n.Toy.clear();
  });
  console.log('after clear: ch2 in save =', await ev(() => JSON.stringify(window.__nut.Save.data.ch2)), ' in storage =', JSON.stringify(JSON.parse(await raw()).ch2), ' done.toys =', JSON.stringify(JSON.parse(await raw()).done.toys));
  await h.finish();
})();
