// How the three chapters hand over to each other: clear card buttons, stage visibility, camera, audio and HUD state.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'fl' });
  const { ev, shot, until, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };
  const state = () => ev(() => { const n = window.__nut; return { ch: n.G.chapter, mode: n.G.mode, mansion: n.World.W1.root.visible, toy: !!n.Toy.W && n.Toy.W.root.visible, snow: !!n.Snow.W && n.Snow.W.root.visible, view: !!(n.camera.view && n.camera.view.enabled), running: n.Rhythm.running, hold: !!n.Sound.hold, ctx: n.Sound.ctx && n.Sound.ctx.state, plaque: document.getElementById('plTitle').textContent, max: document.getElementById('cntMax').textContent, rhythmUI: !document.getElementById('rhythm').hidden, bright: document.getElementById('chapterCard').classList.contains('bright') }; });
  const explore = (label) => until(() => window.__nut.G.chapter === 2 && window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 300000, label);

  /* chapter I → its clear card offers chapter II */
  await ev(() => { const n = window.__nut; n.Save.data.unlocked = 3; n.Story.startChapter(); });
  await page.waitForTimeout(2500);
  let s = await state();
  ok('chapter I: only the mansion is on stage, counter says / 12', s.ch === 1 && s.mansion && !s.toy && !s.snow && s.max === '/ 12' && s.plaque === '크리스마스 저택', s);
  await ev(() => { window.__nut.Story.clearChapter(); });
  const c1 = await ev(() => ({ label: document.getElementById('btnClearNext').textContent, hidden: document.getElementById('btnClearNext').hidden }));
  ok('chapter I clear card: "제2장으로 떠나기"', c1.label === '제2장으로 떠나기' && !c1.hidden, c1);

  /* chapter II → its clear card offers chapter III */
  await ev(() => { window.__nut.DEBUG.timeScale = 4; window.__nut.Toy.start(); });
  await explore('chapter II');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  s = await state();
  ok('chapter II: only the toy kingdom is on stage', s.ch === 2 && s.toy && !s.mansion && !s.snow && !s.view && s.plaque === '장난감 왕국' && s.max === '/ 12', s);
  await ev(() => { const n = window.__nut; for (const id of Object.keys(n.Toy.pieces)) n.TG.placed[id] = true; n.Toy.clear(); });
  const c2 = await ev(() => ({ label: document.getElementById('btnClearNext').textContent, hidden: document.getElementById('btnClearNext').hidden, text: document.getElementById('clrUnlock').textContent }));
  ok('chapter II clear card: "제3장으로 떠나기" and a line about chapter III', c2.label === '제3장으로 떠나기' && !c2.hidden && /제3장/.test(c2.text), c2);
  await shot('ch2-clear');
  await ev(() => { window.__nut.DEBUG.timeScale = 4; document.getElementById('btnClearNext').click(); });
  await until(() => window.__nut.G.chapter === 3 && window.__nut.G.phase === 'rhythm' && window.__nut.G.mode === 'play', 300000, 'chapter III from the clear card');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  s = await state();
  ok('chapter III: only the forest is on stage; the lanes are up and the song is running', s.ch === 3 && s.snow && !s.toy && !s.mansion && s.view && s.running && s.rhythmUI && s.plaque === '눈송이의 숲' && /^\/ \d+$/.test(s.max), s);
  ok('chapter III: its title card has the dark plate for the pale snow backdrop', s.bright === true, s.bright);

  /* back to chapter II from the map: nothing of the rhythm game may linger */
  await ev(() => { const n = window.__nut; n.Story.toTitle(); n.Story.mapSel = 1; n.Story.openMap(); });
  await page.waitForTimeout(800);
  await ev(() => { window.__nut.DEBUG.timeScale = 4; document.getElementById('btnPlayChapter').click(); });
  await explore('chapter II again');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  s = await state();
  ok('chapter II again: forest gone, no song, no lane UI, camera offset cleared, counter / 12', s.ch === 2 && s.toy && !s.snow && !s.running && !s.rhythmUI && !s.view && !s.hold && s.ctx === 'running' && s.max === '/ 12', s);
  ok('chapter II again: its title card is back to the plain look', s.bright === false, s.bright);
  await ev(() => { window.__nut.Story.pause(); });
  const walkHelp = await ev(() => document.getElementById('helpText').textContent);
  await ev(() => { window.__nut.Story.resume(); });
  ok('pause menu in chapter II is back to the walking controls', /WASD/.test(walkHelp) && !/줄 키/.test(walkHelp), walkHelp);

  /* chapter III straight from the map once the forest exists: the pause menu's restart and the clear card's replay stay in chapter III */
  await ev(() => { const n = window.__nut; n.Story.toTitle(); n.Story.mapSel = 2; n.Story.openMap(); });
  await page.waitForTimeout(600);
  await ev(() => { window.__nut.DEBUG.timeScale = 4; document.getElementById('btnPlayChapter').click(); });
  await until(() => window.__nut.G.chapter === 3 && window.__nut.G.phase === 'rhythm' && window.__nut.G.mode === 'play', 300000, 'chapter III from the map');
  await ev(() => { window.__nut.DEBUG.timeScale = 4; window.__nut.Story.pause(); document.getElementById('btnRestart').click(); });
  await until(() => window.__nut.G.chapter === 3 && window.__nut.G.phase === 'rhythm' && window.__nut.G.mode === 'play', 300000, 'restart from the pause menu');
  s = await state();
  ok('pause menu "처음부터 다시" restarts chapter III (not another chapter)', s.ch === 3 && s.running && !s.hold && s.ctx === 'running', s);
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await ev(() => { window.__nut.Story.toTitle(); });
  await page.waitForTimeout(1000);
  s = await state();
  ok('title: the mansion again, everything else cleaned up', s.ch === 1 && s.mansion && !s.toy && !s.snow && !s.view && !s.running && !s.hold && s.max === '/ 12', s);
  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
