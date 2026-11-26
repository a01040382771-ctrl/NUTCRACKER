// Chapter IV rules and the paths around a rehearsal: how taps, the bead and the cups are judged (checked on the game code itself),
// failing and trying again, going back to the avenue, continuing from the save, and leaving in the middle of a song.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'r4' });
  const { ev, shot, until, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };

  /* 1. the rules, on the game code with a stand-in stage (no music needed) */
  const rules = await ev(() => {
    const n = window.__nut, G4 = n.REHEARSAL_GAMES, out = {};
    const R = { spb: 60 / n.SWEET_CFG.choco.bpm, W: 400, H: 420, ptr: { type: 'touch', down: false, inside: false, x: 0, y: 0 }, emit() {}, finish(r) { this.done = r; }, endLoop(b) { return b; }, melody() { return []; } };
    // chocolate: a pattern played back
    const C = G4.choco; C.prepare(R);
    const r0 = C.rounds[0], n0 = r0.resp[0], n1 = r0.resp[1], n2 = r0.resp[2];
    out.perfect = C.tap(R, 'cast', n0.t + 0.03);
    out.good = C.tap(R, 'cast', n1.t + 0.12);
    out.wrong = C.tap(R, 'stomp', n2.t);
    out.stray = C.tap(R, 'cast', r0.resp[2].t + C.slot * 4);
    out.free = C.tap(R, 'cast', r0.callT + 0.01);
    C.update(R, r0.endT + 0.2);
    out.round0 = { ok: r0.ok, done: r0.done, wrong: r0.wrong, stray: r0.stray, miss: r0.miss };
    // a quick run of eighth notes: a late tap keeps its own note, the next tap gets the next note
    C.prepare(R);
    const r3 = C.rounds[3], q = r3.resp;   // 'CCC.S.|S.C.C.' starts with three castanets in a row
    out.run = [C.tap(R, 'cast', q[0].t + 0.11), C.tap(R, 'cast', q[1].t + 0.01), C.tap(R, 'cast', q[2].t - 0.02)].concat(q.slice(0, 3).map((x) => x.state));
    // a round with six or more notes forgives one slip; a short one does not
    C.prepare(R);
    const a = C.rounds[2], b = C.rounds[1];
    a.resp.forEach((x, i) => { if (i) C.tap(R, x.type, x.t); });   // all but the first note
    b.resp.forEach((x, i) => { if (i) C.tap(R, x.type, x.t); });
    C.update(R, Math.max(a.endT, b.endT) + 0.3);
    out.forgive = { six: a.ok, four: b.ok };
    // coffee: the share of time on the bead
    const K = G4.coffee, pct = (off) => {
      K.prepare(R); R.done = null;
      const p = K.phrases[0];
      for (let t = p.start; t <= p.end + 0.02; t += 1 / 60) { K.auto(R, t, { off: [off] }); K.update(R, t); }
      return p.pct;
    };
    R.spb = 60 / n.SWEET_CFG.coffee.bpm;
    out.coffee = { on: pct(0), ring: pct(0.8), near: pct(1.4), off: pct(3) };
    // tea: a cup over the tower is exact, a little late is good, far off slips; three slips and the tower must be built again
    const T = G4.tea; R.spb = 60 / n.SWEET_CFG.tea.bpm; T.prepare(R);
    const period = R.spb * n.SWEET_CFG.tea.swingBeats;
    out.tea = [T.drop(R, period), (T.land(R, period + 0.3), T.hand.state = 'ready', T.drop(R, period * 2 + 0.1)), (T.land(R, period * 2 + 0.4), T.hand.state = 'ready', T.drop(R, period * 3 + period * 0.45))];
    T.land(R, period * 3 + 0.7);
    out.teaCups = T.cups.length; out.teaLives = T.lives;
    for (let i = 0; i < 2; i++) { T.hand.state = 'ready'; T.drop(R, period * (5 + i) + period * 0.45); T.land(R, period * (5 + i) + 0.6); }
    out.teaEnd = { state: T.state, lives: T.lives, pass: T.result().pass };
    return out;
  });
  ok('chocolate: on the beat is exact, a little late is good, the other pad is a wrong sound, a gap is off the beat', rules.perfect === 'perfect' && rules.good === 'good' && rules.wrong === 'wrong' && rules.stray === 'stray', rules);
  ok('chocolate: taps while the dancer plays are free (never judged)', rules.free === 'free', rules.free);
  ok('chocolate: a short pattern with a wrong sound and a stray tap is not played back', rules.round0.done && !rules.round0.ok && rules.round0.wrong === 1 && rules.round0.stray === 1, rules.round0);
  ok('chocolate: in a quick run a late tap keeps its own note and the next taps take the next notes', JSON.stringify(rules.run) === JSON.stringify(['good', 'perfect', 'perfect', 'good', 'perfect', 'perfect']), rules.run);
  ok('chocolate: one slip is forgiven in a pattern of six notes, not in a pattern of four', rules.forgive.six === true && rules.forgive.four === false, rules.forgive);
  ok('coffee: on the bead 100%, inside the ring 100%, just outside it half, far away nothing', rules.coffee.on === 100 && rules.coffee.ring === 100 && rules.coffee.near === 50 && rules.coffee.off === 0, rules.coffee);
  ok('tea: over the tower exact, a little late good, far off it slips off', JSON.stringify(rules.tea) === JSON.stringify(['perfect', 'good', 'miss']) && rules.teaCups === 2 && rules.teaLives === 2, { tea: rules.tea, cups: rules.teaCups, lives: rules.teaLives });
  ok('tea: three slips and the tower has to be built again', rules.teaEnd.state === 'lost' && rules.teaEnd.lives === 0 && !rules.teaEnd.pass, rules.teaEnd);

  /* 2. a failed rehearsal: the card offers another try, nothing is decorated or saved */
  await ev(() => { const n = window.__nut; n.Save.data.unlocked = 4; delete n.Save.data.ch4; n.DEBUG.timeScale = 3; n.Sweet.start(); });
  await until(() => window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 300000, 'explore');
  await ev(() => { const n = window.__nut; n.Recital.auto = { fail: [0, 1, 2] }; n.Sweet.rehearse('choco'); });
  await until(() => window.__nut.Recital.running, 120000, 'choco starts');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await until(() => !document.getElementById('screenRehearse').hidden, 240000, 'fail card');
  const f1 = await ev(() => { const n = window.__nut, q = (id) => document.getElementById(id); return { title: q('rcTitle').textContent, info: q('rcInfo').textContent, main: q('btnRcMain').textContent, sub: q('btnRcSub').hidden ? '' : q('btnRcSub').textContent, stat: [...document.querySelectorAll('#rcStats div')].map((d) => d.children[1].textContent)[0], done: !!n.Sweet.done.choco, deco: n.Sweet.W.deco.choco, cp: n.Save.data.ch4 || null }; });
  await shot('fail-card');
  ok('fail: three of six patterns is not enough; the card says how many more and offers another try or the avenue', f1.title === '조금만 더 연습해요' && f1.stat === '3 / 6' && /패턴 4개를 맞추면 성공이에요/.test(f1.info) && /1개만 더/.test(f1.info) && f1.main === '다시 하기' && f1.sub === '광장으로', f1);
  ok('fail: no decoration and nothing saved', !f1.done && f1.deco === 0 && f1.cp === null, f1);
  await ev(() => { const n = window.__nut; n.Recital.auto = { good: 0 }; n.DEBUG.timeScale = 3; document.getElementById('btnRcMain').click(); });
  await until(() => window.__nut.Recital.running && window.__nut.Recital.lastRel > 0.5, 120000, 'second try runs');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  const f2 = await ev(() => { const n = window.__nut, C = n.REHEARSAL_GAMES.choco; return { ok: C.ok, doneRounds: C.rounds.filter((r) => r.done).length, perfect: C.stats.perfect, overlay: !document.getElementById('recital').hidden, card: !document.getElementById('screenRehearse').hidden }; });
  ok('try again: the same rehearsal starts over with a clean slate', f2.ok === 0 && f2.doneRounds === 0 && f2.perfect === 0 && f2.overlay && !f2.card, f2);
  await until(() => !document.getElementById('screenRehearse').hidden, 240000, 'pass card');
  const f3 = await ev(() => ({ title: document.getElementById('rcTitle').textContent, stat: [...document.querySelectorAll('#rcStats div')].map((d) => d.children[1].textContent)[0] }));
  ok('try again: all six patterns played back, the rehearsal passes', f3.title === '리허설 성공!' && f3.stat === '6 / 6', f3);
  await ev(() => { window.__nut.DEBUG.timeScale = 3; document.getElementById('btnRcMain').click(); });
  await until(() => window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 240000, 'back after choco');

  /* 3. a tower that falls: back to the avenue, the stage still waiting */
  await ev(() => { const n = window.__nut; n.Recital.auto = { miss: [0, 1, 2] }; n.Sweet.rehearse('tea'); });
  await until(() => window.__nut.Recital.running, 120000, 'tea starts');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await until(() => !document.getElementById('screenRehearse').hidden, 240000, 'tea fail card');
  const t1 = await ev(() => ({ title: document.getElementById('rcTitle').textContent, info: document.getElementById('rcInfo').textContent, stats: [...document.querySelectorAll('#rcStats div')].map((d) => d.children[1].textContent) }));
  ok('tea: three cups slip off and the card says the tower needs eight', t1.title === '조금만 더 연습해요' && t1.stats[0] === '0 / 8' && t1.stats[2] === '0 · 3' && /찻잔 8개/.test(t1.info), t1);
  await ev(() => { window.__nut.DEBUG.timeScale = 3; document.getElementById('btnRcSub').click(); });
  await until(() => window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 240000, 'back to the avenue');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  const t2 = await ev(() => { const n = window.__nut; return { tea: !!n.Sweet.done.tea, count: n.Sweet.count(), overlay: !document.getElementById('recital').hidden, locked: n.G.locked, cam: n.Cam.mode, music: n.Sound.music && n.Sound.music.name, hold: n.comp.hold }; });
  ok('to the avenue: free to walk again, the tea stage still waits, the plaza tune is back', !t2.tea && t2.count === 1 && !t2.overlay && !t2.locked && t2.cam === 'follow' && t2.music === 'sweets', t2);
  // the prince was held in place at the stage; back on the avenue he follows Clara again
  const pr0 = await ev(() => { const n = window.__nut; n.player.pos.set(-2, 0, 9); return n.comp.pos.toArray(); });
  await page.waitForTimeout(2500);
  const pr1 = await ev(() => { const n = window.__nut; return { pos: n.comp.pos.toArray(), d: Math.hypot(n.comp.pos.x - n.player.pos.x, n.comp.pos.z - n.player.pos.z), hold: n.comp.hold }; });
  ok('to the avenue: the prince follows Clara again', !t2.hold && !pr1.hold && Math.hypot(pr1.pos[0] - pr0[0], pr1.pos[2] - pr0[2]) > 1 && pr1.d < 3, { before: pr0, after: pr1 });

  /* 4. continue from the save: the chocolate decoration is still up */
  await ev(() => { const n = window.__nut; n.Story.toTitle(); n.Story.mapSel = 3; n.Story.openMap(); });
  await page.waitForTimeout(800);
  const c1 = await ev(() => ({ cont: !document.getElementById('btnContinue').hidden, contText: document.getElementById('btnContinue').textContent, btn: document.getElementById('btnPlayChapter').textContent, stats: document.getElementById('mapStats').textContent }));
  ok('map: a saved chapter IV offers to continue at 1 / 3, or to start over', c1.cont && c1.contText === '이어하기 · 리허설 1 / 3' && c1.btn === '처음부터' && /저장된 진행 · 리허설 1 \/ 3/.test(c1.stats), c1);
  await shot('map-continue');
  await ev(() => { window.__nut.DEBUG.timeScale = 3; document.getElementById('btnContinue').click(); });
  await until(() => window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 300000, 'continued');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  const c2 = await ev(() => { const n = window.__nut, S = n.Sweet, f = S.W.stages.choco.front; n.player.pos.set(f.x, 0, f.z); return { done: S.done, count: S.count(), fountain: S.W.fountain.on, obj: document.getElementById('objText').textContent, stars: document.getElementById('starNum').textContent }; });
  await page.waitForTimeout(500);
  const c3 = await ev(() => { const nr = window.__nut.Story.near; return nr ? (typeof nr.label === 'function' ? nr.label() : nr.label) : ''; });
  ok('continue: the chocolate rehearsal stays done, its fountain flows and the count is 1 / 3', c2.done.choco && !c2.done.tea && c2.count === 1 && c2.fountain === 1 && c2.obj === '세 무대의 춤 리허설 돕기 1 / 3' && c2.stars === '1', c2);
  ok('continue: a finished stage offers to dance again', c3 === '스페인 춤 다시 춤추기', c3);

  /* 5. leaving in the middle of a song stops everything */
  await ev(() => { const n = window.__nut; n.Recital.auto = null; n.Sweet.rehearse('coffee'); n.DEBUG.timeScale = 3; });
  await until(() => window.__nut.Recital.running, 120000, 'coffee starts');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await page.waitForTimeout(2500);
  await ev(() => { window.__nut.Story.toTitle(); });
  await page.waitForTimeout(900);
  const lv = await ev(() => { const n = window.__nut; return { mode: n.G.mode, running: n.Recital.running, overlay: !document.getElementById('recital').hidden, view: !!(n.camera.view && n.camera.view.enabled), hold: !!n.Sound.hold, ctx: n.Sound.ctx.state, card: !document.getElementById('screenRehearse').hidden }; });
  ok('leave mid-song: no rehearsal, no panel, no camera offset, the audio clock free', lv.mode === 'title' && !lv.running && !lv.overlay && !lv.view && !lv.hold && lv.ctx === 'running' && !lv.card, lv);

  /* 6. a save with all three rehearsals done (the page closed during the finale): continuing goes straight to the bridge */
  await ev(() => { const n = window.__nut; n.Story.toTitle(); n.Save.data.ch4 = { v: 1, time: 120, done: { choco: { pass: true, ok: 5, total: 6, perfect: 20 }, coffee: { pass: true, pct: 80, parts: [80, 80, 80] }, tea: { pass: true, cups: 8, goal: 8, perfect: 6, miss: 1 } } }; n.Save.write(); n.Story.mapSel = 3; n.Story.openMap(); });
  await page.waitForTimeout(700);
  const z1 = await ev(() => ({ cont: !document.getElementById('btnContinue').hidden, text: document.getElementById('btnContinue').textContent }));
  ok('map: a save with all three rehearsals done can still be continued', z1.cont && z1.text === '이어하기 · 리허설 3 / 3', z1);
  await ev(() => { window.__nut.DEBUG.timeScale = 4; document.getElementById('btnContinue').click(); });
  await until(() => window.__nut.G.phase === 'finale', 240000, 'finale from the save');
  const z2 = await ev(() => { const S = window.__nut.Sweet; return { count: S.count(), deco: S.W.deco }; });
  await until(() => window.__nut.G.mode === 'clear', 300000, 'clear from the save');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  const z3 = await ev(() => { const n = window.__nut; return { kicker: document.getElementById('clrKicker').textContent, stats: [...document.querySelectorAll('#clrStats div')].map((d) => d.children[1].textContent), saved: !!n.Save.data.done.sweets, cp: n.Save.data.ch4 || null, unlocked: n.Save.data.unlocked }; });
  ok('continue at 3 / 3: every decoration is up and the finale plays at once', z2.count === 3 && z2.deco.choco === 1 && z2.deco.coffee === 1 && z2.deco.tea === 1, z2);
  ok('continue at 3 / 3: the chapter ends with the saved results and the save is cleared', z3.kicker === '제4장 · 이야기 끝' && JSON.stringify(z3.stats) === JSON.stringify(['5 / 6', '80%', '8 / 8']) && z3.saved && z3.cp === null && z3.unlocked >= 5, z3);

  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
