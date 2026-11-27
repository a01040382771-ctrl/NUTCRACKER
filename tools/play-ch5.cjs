// Chapter V from the map to the last card, on autoplay: the map entry, act I → act II → act III (the company, the baton and the dancers carried from one act to the next),
// the dream's end, Clara waking on the settee, the final card with a line for every act, the save, the map afterwards, and the gala played again.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: process.env.LITE ? 'play5l' : process.env.VIEW === 'mobile' ? 'play5m' : 'play5', mobile: process.env.VIEW === 'mobile' });
  const { ev, shot, until, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };
  const isGame = (nm) => window.__nut.Recital.running && window.__nut.Recital.game === window.__nut[nm];   // (the page gets the name as an argument)
  const T = 900000;

  if (process.env.LITE) await ev(() => { window.__nut.setQuality('low'); });   // the low quality tier: seven dancers for each nation
  /* the real route: the chapter map, chapter V, the story button */
  await ev(() => { document.getElementById('btnChapters').click(); });
  await page.waitForTimeout(900);
  await ev(() => { document.querySelectorAll('#screenMap .toc-item')[4].click(); });
  const start = await ev(() => ({ btn: document.getElementById('btnPlayChapter').textContent, title: document.getElementById('mapTitle').textContent, saved: window.__nut.Save.data.done.palace || null }));
  ok('the map offers chapter V from the start', start.title === '설탕 요정의 궁전' && start.btn === '이야기 펼치기' && !start.saved, start);
  await ev(() => { const n = window.__nut; n.Recital.auto = {}; n.DEBUG.timeScale = 3; document.getElementById('btnPlayChapter').click(); });

  /* act I */
  await until(isGame, T, 'act I', 'PalaceShow');
  const a1 = await ev(() => { const n = window.__nut; return { chapter: n.G.chapter, act: n.Palace.actNo, only: n.Palace.only, results: n.Palace.results.length, asleep: n.PalaceShow.D.every((d) => d.st === 0), hudMax: document.getElementById('cntMax').textContent }; });
  ok('act I starts from the map: the whole gala (not one act), the dancers asleep', a1.chapter === 5 && a1.act === 0 && a1.only === -1 && a1.results === 0 && a1.asleep && /30|21/.test(a1.hudMax), a1);
  await shot('1-act1');

  /* act I → act II */
  await until(isGame, T, 'act II', 'PalaceSolo');
  const a2 = await ev(() => {
    const n = window.__nut, P = n.Palace, S = n.PalaceShow, Q = n.PalaceSolo;
    return { act: P.actNo, chain: P.chain, results: P.results.length, r1: P.results[0] && P.results[0].stars, swarm: S.D.every((d) => d.st === 5), spots: P.W.spotGroup.visible, pads: Object.values(P.W.pads).some((p) => p.g.visible), obj: document.getElementById('objText').textContent, hudMax: document.getElementById('cntMax').textContent, lit: Q.lit };
  });
  ok('act II follows act I: the first result kept, the same thirty dancers now a swarm, the spots on the glass, the pads gone', a2.act === 1 && a2.chain && a2.results === 1 && a2.r1 === 3 && a2.swarm && a2.spots && !a2.pads && /\/ 12/.test(a2.hudMax), a2);
  await shot('2-act2');

  /* act II → act III */
  await until(isGame, T, 'act III', 'PalaceFinale');
  const a3 = await ev(() => {
    const n = window.__nut, P = n.Palace, F = n.PalaceFinale, S = n.PalaceShow;
    return { act: P.actNo, chain: P.chain, results: P.results.length, r2: P.results[1] && P.results[1].lit, line: F.order.length, inLine: F.order.every((e) => e.st === 6), star: P.W.starGroup.visible, spots: P.W.spotGroup.visible, baton: [S.baton.x, S.baton.z].map((v) => +v.toFixed(1)), leaders: Object.values(P.leaders).every((l) => l.root.visible) };
  });
  ok('act III follows act II: both results kept, the star on the glass, the whole company in the line, the leaders back', a3.act === 2 && a3.chain && a3.results === 2 && a3.r2 === 12 && a3.line >= 25 && a3.inLine && a3.star && !a3.spots && a3.leaders, a3);
  await shot('3-act3');

  /* act III → the dream ends */
  await until(() => window.__nut.G.phase === 'ending' && window.__nut.World.W1.root.visible, T, 'the mansion');
  const room = await ev(() => { const n = window.__nut, S = n.World.W1.settee; return { results: n.Palace.results.length, r3: n.Palace.results[2] && n.Palace.results[2].stars, sofa: [S.pivot.position.x, S.pivot.position.z].map((v) => +v.toFixed(2)), tree: n.World.W1.tree.lit }; });
  ok('the dream ends in the mansion: three results kept, the settee in front of the tree, the tree lit', room.results === 3 && room.r3 === 3 && room.sofa[0] === 0 && Math.abs(room.sofa[1] - -2.75) < 0.01 && room.tree === 1, room);
  await shot('4-room');
  await until(() => window.__nut.G.mode === 'clear', T, 'the final card');
  const fin = await ev(() => { const n = window.__nut, q = (id) => document.getElementById(id); return { kicker: q('clrKicker').textContent, title: q('clrTitle').textContent, stats: [...document.querySelectorAll('#clrStats div')].map((d) => [d.children[0].textContent, d.children[1].textContent]), saved: n.Save.data.done.palace, raw: JSON.parse(localStorage.getItem('nutcracker-clara-v1')).done.palace, unlocked: n.Save.data.unlocked, shot: n.Palace.shot.length, time: n.Palace.galaT }; });
  ok('the final card: "wake from the dream", a line for each of the three acts, three stars each', fin.kicker === '제5장 · 이야기 끝' && fin.title === '꿈에서 깨어나다' && fin.stats.length === 3 && fin.stats.every((r) => r[1] === '★★★') && fin.stats[0][0] === '1막 · 세 나라 축제' && fin.stats[1][0] === '2막 · 설탕 요정의 솔로' && fin.stats[2][0] === '3막 · 대피날레', fin);
  ok('the result is saved: nine stars of nine, the time by the music, a picture for the map', fin.saved && fin.saved.stars === 9 && fin.saved.max === 9 && fin.saved.time > 120 && fin.saved.time < 400 && JSON.stringify(fin.raw) === JSON.stringify(fin.saved) && fin.shot > 1000, { saved: fin.saved, shot: fin.shot });
  await shot('5-card');
  await ev(() => { document.getElementById('btnClearMap').click(); });
  await page.waitForTimeout(900);
  const map = await ev(() => ({ sel: window.__nut.Story.mapSel, stats: document.getElementById('mapStats').textContent, btn: document.getElementById('btnPlayChapter').textContent, state: [...document.querySelectorAll('.toc-state')][4].textContent, img: !document.getElementById('mapImg').hidden }));
  ok('the map afterwards: chapter V shows nine of nine and a picture of the stage', map.sel === 4 && /별 9\/9/.test(map.stats) && map.btn === '다시 펼치기' && /9\/9/.test(map.state) && map.img, map);
  await shot('6-map');

  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
