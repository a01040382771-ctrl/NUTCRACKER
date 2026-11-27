// Chapter V act I — leading the three troupes with the baton: the full-screen overlay, the layout of the sleeping dancers,
// waking, the line behind the baton, the pads (the right nation peels off, the others stay), the sections and the score,
// the grand ring, the music, pause, and a whole act on autoplay.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'show5', mobile: process.env.VIEW === 'mobile' });
  const { ev, shot, until, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };
  const running = () => window.__nut.Recital.running && window.__nut.Recital.game === window.__nut.PalaceShow;

  /* 1. the act starts; the canvas covers the screen */
  await ev(() => { const n = window.__nut; n.Recital.auto = null; n.Palace.startShow(); });
  await until(running, 240000, 'show runs');
  const lay = await ev(() => {
    const n = window.__nut, f = document.getElementById('rcField').getBoundingClientRect(), S = n.PalaceShow, T = n.PALACE_CFG.troupes, D = S.D;
    let minGap = 1e9, nearPad = 1e9, nearDais = 1e9, maxR = 0;
    for (let i = 0; i < D.length; i++) {
      for (let j = i + 1; j < D.length; j++) minGap = Math.min(minGap, Math.hypot(D[i].x - D[j].x, D[i].z - D[j].z));
      for (const id of T.order) nearPad = Math.min(nearPad, Math.hypot(D[i].x - T[id].pad[0], D[i].z - T[id].pad[1]));
      nearDais = Math.min(nearDais, Math.hypot(D[i].x, D[i].z)); maxR = Math.max(maxR, Math.hypot(D[i].x, D[i].z));
    }
    return { cls: document.getElementById('recital').className, field: [f.left, f.top, f.width, f.height].map(Math.round), vw: innerWidth, vh: innerHeight, hud: !document.getElementById('hud').hidden, phase: n.G.phase,
      dancers: D.length, counts: S.count, asleep: D.every((d) => d.st === 0), minGap: +minGap.toFixed(2), nearPad: +nearPad.toFixed(2), nearDais: +nearDais.toFixed(2), maxR: +maxR.toFixed(2), T: { spacing: T.spacing, padR: T.padR } };
  });
  ok('overlay: the canvas covers the whole screen and the HUD stays on', lay.cls === 'palace' && lay.field[0] === 0 && lay.field[1] === 0 && lay.field[2] === lay.vw && lay.field[3] === lay.vh && lay.hud && lay.phase === 'show', lay);
  ok('layout: ten dancers for each nation, all asleep, apart from one another, off the pads and the dais, on the glass', lay.dancers === 30 && lay.counts.join() === '10,10,10' && lay.asleep && lay.minGap >= lay.T.spacing - 1e-6 && lay.nearPad >= lay.T.padR + 0.3 - 1e-6 && lay.nearDais >= 3.3 && lay.maxR <= 13, lay);

  /* 2. the game's steps, on a fresh stopped game: wake, the line, the pads, the sections and the ring */
  const g = await ev(() => {
    const n = window.__nut, S = n.PalaceShow, R = n.Recital, T = n.PALACE_CFG.troupes, K = n.PALACE_CFG.steer, out = {};
    R.stop(); S.prepare(R);
    out.objStart = n.Palace.objective(0);
    const rel0 = 1; let rel = rel0;   // the music stands still inside the intro while the steps run, so no section comes by itself
    const run = (secs, dt = 0.05) => { for (let t = 0; t < secs - 1e-9; t += dt) S.sim(dt, rel); };
    const goto = (x, z, secs = 6) => { S.setTarget(x, z); run(secs); };
    const sweep = (ni) => { for (const d of S.D.filter((q) => q.n === ni)) { if (d.st !== 0) continue; S.setTarget(d.x, d.z); run(1.4); } };
    const ringErr = (ni) => {   // how far the arrived dancers of a nation are from their ring round the pad, and how even the spacing is
      const U = T[T.order[ni]], ds = S.D.filter((q) => q.n === ni && q.st === 3);
      const ang = ds.map((q) => Math.atan2(q.z - U.pad[1], q.x - U.pad[0])).sort((a, b) => a - b), gaps = ang.map((a, i) => (i ? a - ang[i - 1] : a + Math.PI * 2 - ang[ang.length - 1]));
      return { n: ds.length, radius: Math.max(...ds.map((q) => Math.abs(Math.hypot(q.x - U.pad[0], q.z - U.pad[1]) - T.ringR))), gap: Math.max(...gaps.map((v) => Math.abs(v - (Math.PI * 2) / ds.length))) };
    };
    /* wake: the baton over the nearest sleeper wakes her (and only those it reaches); a sleeper on the far side stays asleep */
    const near = (q) => Math.hypot(q.x - P.x, q.z - P.z), P = { x: S.baton.x, z: S.baton.z };
    const first = S.D.filter((q) => q.n === 0).sort((a, b) => near(a) - near(b))[0], far = S.D.find((q) => q.n === 2);
    S.setTarget(first.x, first.z); run(2);
    out.wake = { st: first.st, inLine: S.line.includes(first), line: S.line.length, lineIsWoken: S.line.length === S.woken, farAsleep: far.st === 0, firstWake: +S.firstWake.toFixed(2) };
    /* the line: straight ahead, every dancer a set distance behind the next along the trail */
    sweep(0);
    out.objSpanish = n.Palace.objective(0);
    goto(0, 3, 3); goto(-9, 3, 2.5); goto(2, 3, 3);   // a straight run to the right
    const B = S.baton, gaps = S.line.map((q, k) => Math.hypot(q.x - (k ? S.line[k - 1].x : B.x), q.z - (k ? S.line[k - 1].z : B.z)));
    out.line = { n: S.line.length, first: +gaps[0].toFixed(2), maxErr: +Math.max(...gaps.slice(0, 7).map((v) => Math.abs(v - K.gap))).toFixed(2), gap: K.gap };
    /* a pad of a nation that is not in the line does nothing; the pad of the dancers' own nation sends them all in */
    goto(T.coffee.pad[0], T.coffee.pad[1], 6);
    out.wrongPad = { line: S.line.length, st: S.D.filter((q) => q.n === 0).every((q) => q.st === 1), delivered: S.delivered.join() };
    goto(T.choco.pad[0], T.choco.pad[1], 8);
    out.choco = Object.assign({ line: S.line.length, delivered: S.delivered.join() }, ringErr(0));
    /* the rest: Arabian dancers woken, then Chinese dancers woken; the Arabian pad takes only its own */
    sweep(1); goto(0, 3, 3);   // back to the middle of the front, so the way to the Chinese dancers does not pass the Arabian pad
    sweep(2); goto(T.coffee.pad[0], T.coffee.pad[1], 8);
    out.coffee = Object.assign({ delivered: S.delivered.join(), restInLine: S.line.every((q) => q.n === 2), line: S.line.length }, ringErr(1));
    out.objChinese = n.Palace.objective(2);
    /* sections and the score: the Spanish and Arabian troupes were there; the Chinese were not */
    S.update(R, S.starts[1] + 0.01, 0.016); S.update(R, S.starts[2] + 0.01, 0.016); S.update(R, S.starts[3] + 0.01, 0.016);
    out.pres = S.pres.map((v) => +v.toFixed(2)); out.res = S.result();
    /* the grand ring: everyone, wherever she is, runs to a place on it and the ring turns */
    rel = S.starts[4] + 0.01; S.update(R, rel, 0.016); run(10);
    const ds = S.D, ang = ds.map((q) => Math.atan2(q.z, q.x)).sort((a, b) => a - b), gp = ang.map((a, i) => (i ? a - ang[i - 1] : a + Math.PI * 2 - ang[ang.length - 1]));
    /* the baton plays the ring: sweeping once round it rings every dancer it passes and sets her leaping */
    for (let k = 0; k <= 36; k++) { const a = (k / 36) * Math.PI * 2; S.setTarget(Math.cos(a) * K.ringR2, Math.sin(a) * K.ringR2); run(0.3); }
    out.play = { rung: S.rung, hopped: S.D.filter((q) => q.hop >= 0).length, total: S.total };   // the music stands still here, so each dancer can ring only once
    const byAng = ds.slice().sort((a, b) => Math.atan2(a.z, a.x) - Math.atan2(b.z, b.x));
    out.ring = { all: ds.every((q) => q.st === 4), line: S.line.length, radius: +Math.max(...ds.map((q) => Math.abs(Math.hypot(q.x, q.z) - K.ringR2))).toFixed(2), gap: +Math.max(...gp.map((v) => Math.abs(v - (Math.PI * 2) / ds.length))).toFixed(2), delivered: S.delivered.join(),
      mixed: byAng.every((q, k) => q.n !== byAng[(k + 1) % byAng.length].n) };   // no two neighbours from the same nation
    return out;
  });
  ok('wake: the baton over a sleeper wakes her and she joins the line; sleepers far away stay asleep', g.wake.st === 1 && g.wake.inLine && g.wake.line >= 1 && g.wake.line <= 3 && g.wake.lineIsWoken && g.wake.farAsleep && g.wake.firstWake === 1, g.wake);
  ok('line: the dancers keep a set distance behind one another along the baton\'s trail', g.line.n === 10 && Math.abs(g.line.first - g.line.gap) < 0.3 && g.line.maxErr < 0.3, g.line);
  ok('pads: the pad of a nation that is not in the line changes nothing', g.wrongPad.line === 10 && g.wrongPad.st && g.wrongPad.delivered === '0,0,0', g.wrongPad);
  ok('pads: the dancers\' own pad sends them all in, evenly round the leader on the ring', g.choco.line === 0 && g.choco.delivered === '10,0,0' && g.choco.n === 10 && g.choco.radius < 0.05 && g.choco.gap < 0.03, g.choco);
  ok('pads: a mixed line peels off by nation: the Arabian pad takes only the Arabian dancers', g.coffee.delivered === '10,10,0' && g.coffee.restInLine && g.coffee.line === 10 && g.coffee.n === 10 && g.coffee.radius < 0.05, g.coffee);
  ok('objective: the box says what to do next, following who is in the line and where their pad is', /깨워요/.test(g.objStart) && /스페인 무용수들을 왼쪽 무대로/.test(g.objSpanish) && /아라비아 춤 공연 중/.test(g.objChinese) && /중국 무용수들을 앞쪽 무대로/.test(g.objChinese), { start: g.objStart, spanish: g.objSpanish, chinese: g.objChinese });
  ok('sections: each dance records how many of its dancers were on their pad when it began', JSON.stringify(g.pres) === '[1,1,0]', g.pres);
  ok('score: two of three nations on time is two stars', g.res.stars === 2 && g.res.acc === 67 && g.res.delivered.join() === '10,10,0', g.res);
  ok('ring: in the last section everyone, in the line or not, runs to an even place on the ring round the dais, the nations taking turns', g.ring.all && g.ring.line === 0 && g.ring.radius < 0.45 && g.ring.gap < 0.12 && g.ring.mixed, g.ring);

  ok('ring: the baton is an instrument — sweeping round the ring rings every dancer it passes, once, and sets her leaping', g.play.hopped === g.play.total && g.play.rung === g.play.total, g.play);

  /* 3. the music: five sections, each in its nation's voice */
  const m = await ev(() => {
    const n = window.__nut, S = n.PalaceShow, R = n.Recital; R.stop(); S.prepare(R);
    const ev = S.score(R), st = S.starts, inSec = (k, f) => ev.some((e) => e.t >= st[k] - 1e-6 && e.t < (st[k + 1] === undefined ? 1e9 : st[k + 1]) - 1e-6 && f(e));
    const lastEv = Math.max(...ev.map((e) => e.t)), kinds = (k) => [...new Set(ev.filter((e) => e.t >= st[k] - 1e-6 && e.t < (st[k + 1] === undefined ? 1e9 : st[k + 1]) - 1e-6).map((e) => e.kind))].sort().join(',');
    return { n: ev.length, countIn: ev.filter((e) => e.t < 0).length, starts: st.map((v) => +v.toFixed(2)), spanish: inSec(1, (e) => e.kind === 'castanet') && inSec(1, (e) => e.kind === 'strum') && !inSec(1, (e) => e.kind === 'zill'),
      arabian: inSec(2, (e) => e.kind === 'zill') && inSec(2, (e) => e.kind === 'dum') && inSec(2, (e) => e.kind === 'reed') && !inSec(2, (e) => e.kind === 'castanet'), chinese: inSec(3, (e) => e.kind === 'flute') && inSec(3, (e) => e.kind === 'wood') && !inSec(3, (e) => e.kind === 'castanet'),
      ring: inSec(4, (e) => e.kind === 'bell') && inSec(4, (e) => e.kind === 'strum') && inSec(4, (e) => e.kind === 'castanet') && inSec(4, (e) => e.kind === 'flute'), lastEv: +lastEv.toFixed(2), endRel: +S.endRel.toFixed(2), kinds: [1, 2, 3, 4].map(kinds) };
  });
  ok('music: a count-in, then a section for each nation in its own instruments, all five together at the end', m.countIn === 3 && m.spanish && m.arabian && m.chinese && m.ring && m.lastEv < m.endRel, m);

  /* 4. the whole act on autoplay, with a pause in the middle */
  await ev(() => { const n = window.__nut; n.Recital.auto = {}; n.Palace.startShow(); });
  await until(running, 240000, 'show again');
  await shot('act1-start');
  await until(() => window.__nut.Recital.lastRel > 12, 120000, 'first section');
  const snap = () => window.__nut.PalaceShow.D.slice(0, 6).map((d) => [d.x, d.z].map((v) => +v.toFixed(3)).join(',')).join('|') + '#' + window.__nut.PalaceShow.baton.x.toFixed(3);
  const p1 = await ev(() => { window.__nut.Story.pause(); return { rel: window.__nut.Recital.rel() }; });
  const s1 = await ev(snap);
  await page.waitForTimeout(1500);
  const p2 = await ev(() => window.__nut.Recital.rel()), s2 = await ev(snap);
  const pz = await ev(() => ({ mode: window.__nut.G.mode, screen: !document.getElementById('screenPause').hidden }));
  await ev(() => window.__nut.Story.resume());
  ok('pause: the pause card opens, the music clock and every dancer stand still, and the game goes on after', pz.mode === 'paused' && pz.screen && Math.abs(p2 - p1.rel) < 0.1 && s1 === s2, { before: +p1.rel.toFixed(2), after: +p2.toFixed(2), same: s1 === s2 });
  await until(() => window.__nut.Recital.lastRel > 24, 120000, 'Spanish dance');
  await shot('act1-spanish');
  await until(() => window.__nut.Recital.lastRel > window.__nut.PalaceShow.ringT0 + 6, 180000, 'the ring');
  await shot('act1-ring');
  await until(() => window.__nut.Palace.lastResult, 180000, 'act end');
  const end = await ev(() => {
    const n = window.__nut, P = n.Palace, S = n.PalaceShow, K = n.PALACE_CFG.steer, L = P.leaders.choco.root.position;
    return { res: P.lastResult, phase: n.G.phase, ringed: S.D.every((d) => d.st === 4), padsFull: S.delivered.join(), leader: +Math.hypot(L.x, L.z).toFixed(2), leaderY: +L.y.toFixed(2), dais: n.Palace.W.daisTop, obj: document.getElementById('objText').textContent };
  });
  ok('autoplay: every dancer is woken and brought to her own pad before her dance, three stars, and the ring was played', end.res && end.res.delivered.join() === '10,10,10' && end.res.woken === 30 && end.res.stars === 3 && end.res.acc >= 85 && end.res.rung >= 25 && end.phase === 'showEnd', end.res);
  ok('finale: the dancers stand in the ring, the three leaders have come to the dais, and the box says the grand dance is on', end.ringed && end.leader < 1.6 && Math.abs(end.leaderY - end.dais) < 0.1 && /대원무/.test(end.obj), end);
  await page.waitForTimeout(900);
  await shot('act1-end');

  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
