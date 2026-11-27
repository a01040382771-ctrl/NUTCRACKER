// Chapter V act II, the Sugar Plum Fairy's solo: the stage dressed for it, the swarm round the baton, the spots that wake with the music, charging (still or moving, decay),
// lighting, the layers of the music, the score, and the act played through on autoplay (pause and the clear card included).
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: process.env.VIEW === 'mobile' ? 'solo5m' : 'solo5', mobile: process.env.VIEW === 'mobile' });
  const { ev, shot, until, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };
  const running = () => window.__nut.Recital.running && window.__nut.Recital.game === window.__nut.PalaceSolo;

  /* 1. the act opens on its own, dressed for the solo */
  await ev(() => { const n = window.__nut; n.Recital.auto = null; n.Palace.startSolo(); });
  await until(running, 240000, 'solo runs');
  const lay = await ev(() => {
    const n = window.__nut, P = n.Palace, W = P.W, S = n.PalaceShow, f = document.getElementById('rcField').getBoundingClientRect();
    return { cls: document.getElementById('recital').className, field: [f.left, f.top, f.width, f.height].map(Math.round), vw: innerWidth, vh: innerHeight, hud: !document.getElementById('hud').hidden, phase: n.G.phase, act: P.actNo, only: P.only,
      fairy: P.fairy.root.visible, fairyY: +P.fairy.root.position.y.toFixed(2), dais: W.daisTop, spots: W.spotGroup.visible, nSpots: W.spots.length, pads: Object.values(W.pads).some((p) => p.g.visible), leaders: Object.values(P.leaders).some((l) => l.root.visible), beacons: P.beacons.visible,
      swarm: S.D.length, allSwarm: S.D.every((d) => d.st === 5), pillars: Math.max(...Array.from(W.pillarK)), obj: document.getElementById('objText').textContent };
  });
  ok('act II alone: the full-screen overlay, the Sugar Plum Fairy on the dais, twelve spots on the glass, no pads, leaders or sleepers, every pillar dark', lay.cls === 'palace' && lay.field[0] === 0 && lay.field[1] === 0 && lay.field[2] === lay.vw && lay.field[3] === lay.vh && lay.hud && lay.phase === 'show' && lay.act === 1 && lay.only === 1 &&
    lay.fairy && Math.abs(lay.fairyY - lay.dais) < 0.01 && lay.spots && lay.nSpots === 12 && !lay.pads && !lay.leaders && !lay.beacons && lay.swarm === 30 && lay.allSwarm && lay.pillars < 0.5, lay);
  ok('the objective box starts with the swarm gathering', /모여들어요/.test(lay.obj), lay.obj);

  /* 2. the game's steps, on a stopped game stepped by hand */
  const g = await ev(() => {
    const n = window.__nut, S = n.PalaceShow, Q = n.PalaceSolo, R = n.Recital, A = n.PALACE_CFG.act2, out = {}, bar = 2.4;
    R.stop(); S.reset(); S.toRing(); Q.prepare(R);
    let rel = 0;
    const step = (dt = 0.05) => { Q.sim(dt, rel); rel += dt; };
    const run = (secs) => { for (let t = 0; t < secs - 1e-9; t += 0.05) step(); };
    const awake = () => Q.spots.filter((s) => s.awake).length;
    const mean = () => S.D.reduce((a, d) => a + Math.hypot(d.x - S.baton.x, d.z - S.baton.z), 0) / S.D.length;
    /* the spots wake with the music: the first at bar 2, then one every bar */
    run(4.7); out.wake0 = awake(); run(0.2); out.wake1 = awake(); run(16.9 - rel); out.wake6 = awake(); out.wakeAt = [Q.spots[0].awokeAt, Q.spots[5].awokeAt].map((v) => +v.toFixed(2));
    /* the swarm: every dancer in her ring round the baton, the rings turning against each other */
    const r = A.swarm.rings.map((rg, k) => { const ds = Q.rings[k]; return { r: rg.r, err: Math.max(...ds.map((d) => Math.abs(Math.hypot(d.x - Q.sw[k].x, d.z - Q.sw[k].z) / rg.r - 1))), n: ds.length }; });
    out.swarm = { joined: S.D.every((d) => d.jk === 1), rings: r.map((q) => [q.n, +q.err.toFixed(3)]), dirs: A.swarm.rings.map((q) => Math.sign(q.w)).join() };
    /* it gathers when the baton is still and streams out behind it when it runs */
    const still = mean(); S.setTarget(10, 4.6); run(0.45); const moving = mean(); S.setTarget(0, 4.6); run(2.5); const settled = mean();
    out.shape = { still: +still.toFixed(2), moving: +moving.toFixed(2), settled: +settled.toFixed(2) };
    /* charging: stand on the first spot, and it fills in about `time` seconds; only the first spots are awake so far */
    const s0 = Q.spots[0], s1 = Q.spots[1];
    S.setTarget(s0.x, s0.z); let t0 = rel, arrived = -1; while (!s0.lit && rel - t0 < 8) { step(); if (arrived < 0 && Math.hypot(S.baton.x - s0.x, S.baton.z - s0.z) < 0.05) arrived = rel; if (arrived >= 0 && rel - arrived > 0.8 && !out.half) out.half = +s0.ch.toFixed(2); }
    out.light = { lit: s0.lit, n: Q.lit, after: arrived < 0 ? -1 : +(rel - arrived).toFixed(2), half: out.half, time: A.charge.time, layer1: Q.layerFrom[1] };
    /* a spot is lost slowly when the swarm leaves it: stand on the next one for a short while, then go away */
    S.setTarget(s1.x, s1.z); run(1.2); const mid = +s1.ch.toFixed(2), litEarly = s1.lit;
    S.setTarget(0, 4.6); run(1.0);
    out.decay = { litEarly, mid, after: +s1.ch.toFixed(2) };
    /* running through a woken spot at full speed charges it hardly at all */
    const s2 = Q.spots[2]; S.setTarget(-4, 10.05); run(1.4); S.setTarget(8.4, 9.4);
    let maxCh = 0; for (let t = 0; t < 1.2; t += 0.05) { step(); maxCh = Math.max(maxCh, s2.ch); }
    out.pass = { awake: s2.awake, maxCh: +maxCh.toFixed(3), lit: s2.lit };
    return out;
  });
  ok('spots wake with the music: none before bar 2, the first at bar 2 (4.8 s), then one a bar', g.wake0 === 0 && g.wake1 === 1 && g.wake6 === 6 && Math.abs(g.wakeAt[0] - 4.8) < 0.06 && Math.abs(g.wakeAt[1] - 16.8) < 0.06, g);
  ok('the swarm: all thirty have run in to their ring (10 each) and keep the ring radius round the baton', g.swarm.joined && g.swarm.rings.every((q) => q[0] === 10 && q[1] < 0.1) && g.swarm.dirs === '1,-1,1', g.swarm);
  ok('the swarm gathers when the baton is still, streams behind it when it runs, and gathers again', g.shape.moving > g.shape.still * 1.2 && Math.abs(g.shape.settled - g.shape.still) < 0.2, g.shape);
  ok('charging: standing still on a woken spot fills it in about the set time, and it lights', g.light.lit && g.light.n === 1 && g.light.half > 0.3 && g.light.half < 0.62 && g.light.after > g.light.time - 0.5 && g.light.after < g.light.time + 0.9, g.light);
  ok('a spot that has been left loses its charge again', !g.decay.litEarly && g.decay.mid > 0.3 && g.decay.after < g.decay.mid - 0.2, g.decay);
  ok('running through a woken spot at full speed charges it hardly at all', g.pass.awake && !g.pass.lit && g.pass.maxCh < 0.12, g.pass);

  /* 3. lighting every spot: the layers of the music, the finale, the score */
  const m = await ev(() => {
    const n = window.__nut, S = n.PalaceShow, Q = n.PalaceSolo, R = n.Recital, A = n.PALACE_CFG.act2, out = {};
    R.stop(); S.reset(); S.toRing(); Q.prepare(R);
    let rel = 0;
    const step = () => { Q.sim(0.05, rel); rel += 0.05; };
    const lightSpot = (sp) => { while (!sp.awake) step(); S.setTarget(sp.x, sp.z); for (let t = 0; t < 12 && !sp.lit; t += 0.05) step(); };
    const marks = {};
    for (const sp of Q.spots) {
      lightSpot(sp);
      if (Q.lit === 2) marks.m2 = Q.layerFrom[1] === undefined;
      if (Q.lit === 3) marks.l1 = Q.layerFrom[1];
      if (Q.lit === 5) marks.m5 = Q.layerFrom[2] === undefined;
      if (Q.lit === 6) marks.l2 = Q.layerFrom[2];
      if (Q.lit === 9) marks.l3 = Q.layerFrom[3];
      if (Q.lit === 12) marks.l4 = Q.layerFrom[4];
    }
    out.marks = marks; out.lit = Q.lit; out.time = +rel.toFixed(1); out.layersOn = Q.layersOn;
    /* a layer waits for the bar line after the spot: muted before it, playing from it; the base, and everything in the finale, always plays */
    const bar = Q.bar, aheadOk = marks.l1 >= 0 && Math.abs(marks.l1 / bar - Math.round(marks.l1 / bar)) < 1e-6;
    out.mute = { onBar: aheadOk, before: Q.mute({ layer: 1, t: marks.l1 - 0.1 }), after: Q.mute({ layer: 1, t: marks.l1 + 0.01 }), base: Q.mute({ kind: 'pad', t: 1 }), finale: Q.mute({ layer: 4, t: Q.finT + 0.5 }) };
    /* the score */
    Q.layerFrom = {}; const ev = Q.score(R), layers = {}; for (const e of ev) if (e.layer) layers[e.layer] = (layers[e.layer] || 0) + 1;
    out.score = { n: ev.length, countIn: ev.filter((e) => e.t < 0).length, base: ev.filter((e) => !e.layer && e.t >= 0).length, layers, last: +Math.max(...ev.map((e) => e.t)).toFixed(2), endRel: +Q.endRel.toFixed(2), finT: +Q.finT.toFixed(1) };
    /* nothing is lit yet: the muted layers are all the layers; with the layers on every note plays */
    out.muted = ev.filter((e) => e.layer && Q.mute(e)).length === ev.filter((e) => e.layer && e.t < Q.finT - 1e-6).length;
    /* the stars */
    const stars = []; for (const k of [0, 7, 8, 10, 11, 12]) { Q.lit = k; stars.push(Q.result().stars); } out.stars = stars.join();
    return out;
  });
  ok('layers: the first comes in after three spots, the second after six, the third after nine, the fourth after twelve; none before', m.marks.m2 && m.marks.m5 && m.marks.l1 > 0 && m.marks.l2 > m.marks.l1 && m.marks.l3 > m.marks.l2 && m.marks.l4 > m.marks.l3 && m.layersOn === 4 && m.lit === 12, m.marks);
  ok('a layer is muted before its bar line and plays from it; the base and the whole finale always play', m.mute.onBar && m.mute.before === true && m.mute.after === false && m.mute.base === false && m.mute.finale === false, m.mute);
  ok('music: a count-in, a base in every bar, four layers, ending inside the act (22 bars of 2.4 s)', m.score.countIn === 3 && m.score.base >= 22 * 5 && Object.keys(m.score.layers).join() === '1,2,3,4' && m.score.last < m.score.endRel && m.score.finT === 45.6 && m.muted, m.score);
  ok('stars: 7 of 12 is one star, 8 two, 11 three', m.stars === '1,1,2,2,3,3', m.stars);

  /* 4. the whole act on autoplay, with a pause in the middle */
  await ev(() => { const n = window.__nut; n.Recital.auto = {}; n.Palace.startSolo(); });
  await until(running, 240000, 'solo again');
  await until(() => window.__nut.Recital.lastRel > 6.5, 120000, 'swarm gathers');
  await shot('act2-swarm');
  await until(() => window.__nut.Recital.lastRel > 15.5, 120000, 'first spots');
  const snap = () => window.__nut.PalaceShow.D.slice(0, 6).map((d) => [d.x, d.z].map((v) => +v.toFixed(3)).join(',')).join('|') + '#' + window.__nut.PalaceSolo.spots.map((s) => s.ch.toFixed(3)).join(',');
  const p1 = await ev(() => { window.__nut.Story.pause(); return window.__nut.Recital.rel(); });
  const s1 = await ev(snap); await page.waitForTimeout(1500);
  const p2 = await ev(() => window.__nut.Recital.rel()), s2 = await ev(snap);
  const pz = await ev(() => ({ mode: window.__nut.G.mode, screen: !document.getElementById('screenPause').hidden, help: document.querySelector('#screenPause') ? document.querySelector('#screenPause').textContent.includes('별무리') : false }));
  await ev(() => window.__nut.Story.resume());
  ok('pause: the card opens with this act\'s help, the music clock, the swarm and the charges stand still, and the game goes on after', pz.mode === 'paused' && pz.screen && pz.help && Math.abs(p2 - p1) < 0.1 && s1 === s2, { before: +p1.toFixed(2), after: +p2.toFixed(2), same: s1 === s2 });
  await shot('act2-spots');
  await until(() => window.__nut.PalaceSolo.lit >= 6, 120000, 'six lit');
  await shot('act2-lit6');
  await until(() => window.__nut.PalaceSolo.finale, 180000, 'finale');
  await page.waitForTimeout(2500);
  await shot('act2-finale');
  await until(() => window.__nut.Palace.lastResult, 180000, 'act end');
  const end = await ev(() => {
    const n = window.__nut, P = n.Palace, Q = n.PalaceSolo, W = P.W;
    return { res: P.lastResult, phase: n.G.phase, pillars: Math.min(...Array.from(W.pillarK)), lit: W.spots.every((s) => s.lit > 0.9), counter: document.getElementById('cntNum') ? document.getElementById('cntNum').textContent : '', obj: document.getElementById('objText').textContent };
  });
  ok('autoplay: every spot lit, every pillar blazing, three stars, four layers of music', end.res && end.res.lit === 12 && end.res.stars === 3 && end.res.layers === 4 && end.res.acc === 100 && end.phase === 'showEnd' && end.pillars >= 1 && end.lit, end);
  await page.waitForTimeout(900);
  await shot('act2-end');

  /* 5. alone, the act ends with its own clear card; with only some spots lit it earns fewer stars */
  await until(() => window.__nut.G.mode === 'clear', 240000, 'clear card');
  const clr = await ev(() => { const n = window.__nut, q = (id) => document.getElementById(id); return { kicker: q('clrKicker').textContent, stats: [...document.querySelectorAll('#clrStats div')].map((d) => [d.children[0].textContent, d.children[1].textContent]), saved: n.Save.data.done.palace }; });
  ok('clear card (act II alone): its stars, the pillars lit and the swarm', clr.kicker === '제5장 · 2막 끝' && clr.stats[0][1] === '★★★' && clr.stats[1][1] === '12 / 12' && clr.stats[2][1] === '30명' && clr.saved && clr.saved.stars === 3, clr);
  await ev(() => { const n = window.__nut; n.Story.toTitle(); n.Recital.auto = { only: 8 }; n.Palace.startSolo(); });
  await until(running, 240000, 'solo, only eight');
  await until(() => window.__nut.Palace.lastResult, 240000, 'act end, eight');
  const some = await ev(() => window.__nut.Palace.lastResult);
  ok('only eight spots lit: two stars (8 of 12)', some.lit === 8 && some.stars === 2 && some.layers === 2, some);

  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
