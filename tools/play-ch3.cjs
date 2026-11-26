// Plays chapter III from the chapter map to the clear card, with the built-in autoplay, then checks the saved result, pause and leaving.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'c3', mobile: process.env.VIEW === 'mobile' });
  const { ev, shot, until, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };

  /* 1. chapter map: chapter III is listed, unlocked and playable */
  await ev(() => { const n = window.__nut; n.Save.data.unlocked = 3; n.Story.mapSel = 2; n.Story.openMap(); });
  await page.waitForTimeout(800);
  const map = await ev(() => ({ title: document.getElementById('mapTitle').textContent, stats: document.getElementById('mapStats').textContent, btn: document.getElementById('btnPlayChapter').textContent, disabled: document.getElementById('btnPlayChapter').disabled, veil: !document.getElementById('mapLock').hidden, toc: [...document.querySelectorAll('.toc-state')].map((e) => e.textContent) }));
  ok('map: chapter III is playable', map.title === '눈송이의 숲' && !map.disabled && !map.veil && map.btn === '이야기 펼치기', map);
  ok('map: shows the note count and the length of the rhythm part', /눈송이 \d+개 · 리듬 구간 약 \d+초/.test(map.stats), map.stats);
  await shot('map');

  /* 2. play it: autoplay is switched on before the song starts so every note follows the plan */
  const plan = await ev(() => {
    const R = window.__nut.Rhythm; R.auto = { perfect: 0.6, good: 0.25 };
    window.__nut.DanceMusic.rate = 6;   // the snowflakes' waltz after the rhythm part, played fast for the test
    const C = R.chart(), want = { perfect: 0, good: 0, miss: 0 };
    for (const n of C.notes) want[R.autoKind(n, R.auto)]++;
    return { want, N: C.notes.length };
  });
  await ev(() => { window.__nut.DEBUG.timeScale = 3; document.getElementById('btnPlayChapter').click(); });
  await until(() => window.__nut.G.chapter === 3 && window.__nut.G.mode === 'cutscene', 300000, 'chapter III opens');
  ok('start: the map button opens chapter III with the forest visible and the mansion hidden', await ev(() => { const n = window.__nut; return n.G.chapter === 3 && n.Snow.W.root.visible && !n.World.W1.root.visible; }));
  await page.waitForTimeout(300);
  const fr = await ev(() => {
    const n = window.__nut, V = n.camera.position.constructor, v = new V(), out = {};
    n.camera.updateMatrixWorld(true);
    for (const k of ['clara', 'prince']) { n[k].root.getWorldPosition(v); const p = v.clone(); p.y += 0.6; p.project(n.camera); out[k] = { x: +p.x.toFixed(2), y: +p.y.toFixed(2), front: p.z < 1 }; }
    return out;
  });
  ok('opening shot: Clara and the prince are on screen', ['clara', 'prince'].every((k) => fr[k].front && Math.abs(fr[k].x) <= 0.8 && Math.abs(fr[k].y) <= 0.8), fr);
  await until(() => window.__nut.G.phase === 'rhythm' && window.__nut.G.mode === 'play', 300000, 'rhythm');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  const during = await ev(() => { const n = window.__nut; return { running: n.Rhythm.running, clock: n.Rhythm.clock, lanesUI: !document.getElementById('rhythm').hidden, controlsHidden: document.getElementById('controls').hidden, viewOffset: !!(n.camera.view && n.camera.view.enabled) || n.Snow.viewK > 0, hudMax: document.getElementById('cntMax').textContent, title: document.getElementById('plTitle').textContent }; });
  ok('rhythm: lanes are up, joystick hidden, HUD counts the path', during.running && during.clock === 'audio' && during.lanesUI && during.controlsHidden && during.hudMax === `/ ${plan.N}` && during.title === '눈송이의 숲', during);
  await page.waitForTimeout(6000);
  await shot('rhythm-early');
  // pause in the middle of the song: the audio clock and the notes stop together, and carry on afterwards
  await ev(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })); });
  await page.waitForTimeout(900);
  const p1 = await ev(() => { const n = window.__nut; return { mode: n.G.mode, paused: n.Rhythm.paused, ctx: n.Sound.ctx.state, rel: n.Rhythm.rel(), judged: n.Rhythm.stats.perfect + n.Rhythm.stats.good + n.Rhythm.stats.miss }; });
  await page.waitForTimeout(1500);
  const p2 = await ev(() => { const n = window.__nut; return { rel: n.Rhythm.rel(), judged: n.Rhythm.stats.perfect + n.Rhythm.stats.good + n.Rhythm.stats.miss }; });
  ok('pause: game, rhythm and audio clock are all paused', p1.mode === 'paused' && p1.paused && p1.ctx === 'suspended', p1);
  ok('pause: nothing moves or gets judged while paused', Math.abs(p2.rel - p1.rel) < 0.003 && p2.judged === p1.judged, { before: p1.rel, after: p2.rel, judged: [p1.judged, p2.judged] });
  const help = await ev(() => document.getElementById('helpText').textContent);
  ok('pause: the controls line explains the lane keys, not the walking controls', /A · S · D/.test(help) && /Esc/.test(help) && !/점프|WASD/.test(help), help);
  await shot('paused');
  await ev(() => { document.getElementById('btnResume').click(); });
  await page.waitForTimeout(800);
  const p3 = await ev(() => { const n = window.__nut; return { mode: n.G.mode, paused: n.Rhythm.paused, ctx: n.Sound.ctx.state, rel: n.Rhythm.rel(), hold: n.Sound.hold }; });
  ok('resume: the song carries on from where it stopped', p3.mode === 'play' && !p3.paused && p3.ctx === 'running' && !p3.hold && p3.rel > p2.rel && p3.rel - p2.rel < 1.2, { before: p2.rel, after: p3.rel });
  await page.waitForTimeout(5000);
  await shot('rhythm-mid');
  await until(() => window.__nut.G.phase === 'finale', 120000, 'finale');
  const end = await ev(() => { const n = window.__nut, S = n.Snow; return { stats: { ...n.Rhythm.stats }, opened: S.opened, goal1: S.goal.filter((g) => g === 1).length, goalHalf: S.goal.filter((g) => g === 0.5).length, goal0: S.goal.filter((g) => g === 0).length, lamps: S.lampOn.filter(Boolean).length, mode: n.G.mode }; });
  ok('result: perfect/good/miss counts follow the plan exactly (nothing lost to pause or slow frames)', JSON.stringify(end.stats) === JSON.stringify(plan.want), { want: plan.want, got: end.stats });
  ok('progress: opened path = perfect + good/2 (not a score)', Math.abs(end.opened - (plan.want.perfect + plan.want.good / 2)) < 1e-9, { opened: end.opened });
  await page.waitForTimeout(1200);

  /* 3. the snowflakes' waltz comes before the finale, then the finale, clear card, save */
  await ev(() => { window.__nut.DEBUG.timeScale = 3; });
  await until(() => window.__nut.G.phase === 'dance' && window.__nut.Dance.running, 300000, 'the snowflakes dance');
  const dz = await ev(() => { const n = window.__nut; return { gate: n.Snow.W.gate.open, corps: n.Corps.group.visible, n: n.Dance.n }; });
  ok('the snowflakes dance before the finale (gate still closed)', dz.gate === 0 && dz.corps && dz.n >= 8, dz);
  await until(() => window.__nut.G.mode === 'clear', 300000, 'clear card');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await page.waitForTimeout(1200);
  const fin = await ev(() => {
    const n = window.__nut, S = n.Snow, st = [...document.querySelectorAll('#clrStats div')].map((d) => [d.children[0].textContent, d.children[1].textContent]);
    return { saved: n.Save.data.done.snow, unlocked: n.Save.data.unlocked, stats: st, kicker: document.getElementById('clrKicker').textContent, next: document.getElementById('btnClearNext').hidden, gate: S.W.gate.open, tilesAfterSweep: S.goal.filter((g) => g === 1).length, N: S.N, shot: S.shot.length > 1000, raw: JSON.parse(localStorage.getItem('nutcracker-clara-v1')).done.snow };
  });
  ok('finale: the rest of the path is opened and the gate to chapter IV is open', fin.gate === 1 && fin.tilesAfterSweep === fin.N, { gate: fin.gate, tiles: fin.tilesAfterSweep });
  ok('clear card: shows the opened path first, not a score', fin.stats[0][0] === '열린 숲길' && fin.stats[1][0] === '정확한 눈송이' && fin.kicker === '제3장 · 이야기 끝', fin.stats);
  ok('clear card: the third box lists good and missed snowflakes (all three judgements shown)', fin.stats[2][0] === '좋음 · 놓침' && fin.stats[2][1] === `${plan.want.good} · ${plan.want.miss}`, fin.stats[2]);
  ok('save: result stored and chapter IV unlocked', fin.saved && fin.saved.perfect === plan.want.perfect && fin.saved.total === plan.N && fin.unlocked >= 4 && JSON.stringify(fin.raw) === JSON.stringify(fin.saved), fin.saved);
  ok('save: opened % matches perfect + good/2 over N', fin.saved.opened === Math.round(((plan.want.perfect + plan.want.good / 2) / plan.N) * 100), { opened: fin.saved.opened });
  await shot('clear');

  /* 4. the chapter map afterwards */
  await ev(() => { document.getElementById('btnClearMap').click(); });
  await page.waitForTimeout(1000);
  const m4 = await ev(() => ({ sel: window.__nut.Story.mapSel, title: document.getElementById('mapTitle').textContent, veil: !document.getElementById('mapLock').hidden, lock: document.getElementById('mapLockText').textContent, btn: document.getElementById('btnPlayChapter').textContent, toc: [...document.querySelectorAll('.toc-state')].map((e) => e.textContent) }));
  ok('map: chapter IV is unlocked and ready to play', m4.title === '과자의 왕국' && m4.veil === false && m4.btn === '이야기 펼치기', m4);
  await ev(() => { const n = window.__nut; n.Story.mapSel = 2; n.Story.renderMap(); });
  const m5 = await ev(() => ({ stats: document.getElementById('mapStats').textContent, img: !document.getElementById('mapImg').hidden, btn: document.getElementById('btnPlayChapter').textContent }));
  ok('map: chapter III shows the saved result and a picture of the open path', /열린 숲길 \d+%/.test(m5.stats) && m5.img && m5.btn === '다시 펼치기', m5);
  await shot('map-after');

  /* 5. replay starts clean; leaving mid-song stops the music and gives the camera back */
  await ev(() => { window.__nut.Rhythm.auto = null; window.__nut.DEBUG.timeScale = 3; document.getElementById('btnPlayChapter').click(); });
  await until(() => window.__nut.G.phase === 'rhythm' && window.__nut.G.mode === 'play', 300000, 'replay rhythm');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await page.waitForTimeout(1500);
  const rp = await ev(() => { const n = window.__nut, S = n.Snow; return { opened: S.opened, tiles: S.goal.filter((g) => g > 0).length, gate: S.W.gate.open, stats: { ...n.Rhythm.stats }, running: n.Rhythm.running }; });
  ok('replay: the forest starts snowed-in again and the run is fresh', rp.opened === 0 && rp.tiles === 0 && rp.gate === 0 && rp.running && rp.stats.perfect === 0, rp);
  await ev(() => { window.__nut.Story.toTitle(); });
  await page.waitForTimeout(1200);
  const lv = await ev(() => { const n = window.__nut; return { mode: n.G.mode, ch: n.G.chapter, running: n.Rhythm.running, hold: !!n.Sound.hold, ctx: n.Sound.ctx.state, rhythmUI: !document.getElementById('rhythm').hidden, view: !!(n.camera.view && n.camera.view.enabled), forest: n.Snow.W.root.visible, mansion: n.World.W1.root.visible, fairy: n.Snow.fairy.root.visible }; });
  ok('leave: back on the title with the mansion stage, no song, no lane UI, no camera offset', lv.mode === 'title' && lv.ch === 1 && !lv.running && !lv.hold && lv.ctx === 'running' && !lv.rhythmUI && !lv.view && !lv.forest && lv.mansion && !lv.fairy, lv);

  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
