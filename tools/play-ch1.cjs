// Plays chapter I end to end through the debug hook (regression check).
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'c1', mobile: process.env.VIEW === 'mobile' });
  const { ev, shot, until, page } = h;
  await ev(() => { window.__nut.DEBUG.timeScale = 5; window.__nut.Story.startChapter(); });
  await until(() => window.__nut.G.phase === 'gift' && window.__nut.G.mode === 'play', 240000, 'gift');
  await page.waitForTimeout(800);
  await shot('gift');
  await ev(() => { window.__nut.player.pos.set(0, 0, -0.55); });
  await page.waitForTimeout(500);
  await ev(() => { window.__nut.Input.act = true; });
  await until(() => window.__nut.G.phase === 'collect' && window.__nut.G.mode === 'play', 240000, 'collect');
  for (const [x, z] of [[11.0, 1.7], [10.0, -2.7], [10.0, -7.2]]) {
    await ev(([a, b]) => { window.__nut.player.pos.set(a, 0, b); }, [x, z]);
    await page.waitForTimeout(500);
    await ev(() => { window.__nut.Input.act = true; });
    await page.waitForTimeout(1500);
  }
  await until(() => {
    const n = window.__nut;
    for (const it of n.starSet.items) if (it.state === 'idle') { n.player.pos.set(it.pos.x, Math.max(0, it.pos.y - 0.8), it.pos.z); n.player.vy = 0; break; }
    return n.G.stars >= 8;
  }, 240000, 'stars8');
  await page.waitForTimeout(600);
  await ev(() => { const n = window.__nut; n.player.pos.set(0, 0, -2.7); n.player.vy = 0; });
  await page.waitForTimeout(800);
  await ev(() => { window.__nut.Input.act = true; });
  await until(() => window.__nut.G.phase === 'wave' && window.__nut.G.mode === 'play', 300000, 'wave');
  await page.waitForTimeout(1500);
  await shot('wave');
  for (let i = 0; i < 6; i++) { await ev(() => { window.__nut.Input.act = true; }); await page.waitForTimeout(400); }
  await until(() => { const n = window.__nut; const m = n.mice.find((x) => x.state === 'chase' || x.state === 'recoil' || x.state === 'idle'); if (m) n.killMouse(m); return n.G.phase !== 'wave'; }, 240000, 'wave-clear');
  await until(() => window.__nut.G.phase === 'boss' && window.__nut.G.mode === 'play', 240000, 'boss');
  await page.waitForTimeout(1500);
  await shot('boss');
  await until(() => { const n = window.__nut; if (n.K.invuln <= 0 && n.G.phase === 'boss') n.hitKing(); return n.G.phase === 'portal' && n.G.mode === 'play'; }, 300000, 'portal');
  await page.waitForTimeout(1000);
  await ev(() => { window.__nut.player.pos.set(0, 0, -1.6); });
  await until(() => window.__nut.G.mode === 'clear', 240000, 'clear');
  await page.waitForTimeout(1200);
  await shot('clear');
  console.log('FINAL', JSON.stringify(await ev(() => { const n = window.__nut; return { mode: n.G.mode, stars: n.G.stars, unlocked: n.Save.data.unlocked, next: !document.getElementById('btnClearNext').hidden }; })));
  // "제2장으로 떠나기" goes straight into chapter II
  await ev(() => { window.__nut.DEBUG.timeScale = 4; document.getElementById('btnClearNext').click(); });
  await until(() => window.__nut.G.chapter === 2 && window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 300000, 'ch2 from clear');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await page.waitForTimeout(1200);
  await shot('ch2-from-ch1');
  // and back to the title: the mansion stage must come back intact
  await ev(() => { window.__nut.Story.toTitle(); });
  await page.waitForTimeout(1500);
  await shot('title-again');
  console.log('BACK', JSON.stringify(await ev(() => { const n = window.__nut; return { mode: n.G.mode, ch: n.G.chapter, mansion: n.W.root.visible, toy: n.Toy.W.root.visible }; })));
  await h.finish();
})();
