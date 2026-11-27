// Chapter V act III, the grand finale: the stage dressed for it, the star and what lights its dots, the long line, the layers of the music, the finale that
// begins when the star is drawn (or when the time is up), the company on the turning star, Clara and the Prince, and the act played through on autoplay.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: process.env.VIEW === 'mobile' ? 'fin5m' : 'fin5', mobile: process.env.VIEW === 'mobile' });
  const { ev, shot, until, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };
  const running = () => window.__nut.Recital.running && window.__nut.Recital.game === window.__nut.PalaceFinale;

  /* 1. the act opens on its own, dressed for the finale */
  const before = await ev(() => { const n = window.__nut; return { s: n.clara.root.scale.x, y: n.clara.root.position.y, v: n.prince.root.scale.x }; });
  await ev(() => { const n = window.__nut; n.Recital.auto = null; n.Palace.startFinale(); });
  await until(running, 240000, 'finale runs');
  const lay = await ev(() => {
    const n = window.__nut, P = n.Palace, W = P.W, F = n.PalaceFinale, f = document.getElementById('rcField').getBoundingClientRect();
    return { cls: document.getElementById('recital').className, field: [f.left, f.top, f.width, f.height].map(Math.round), vw: innerWidth, vh: innerHeight, hud: !document.getElementById('hud').hidden, phase: n.G.phase, act: P.actNo, only: P.only,
      star: W.starGroup.visible, dots: W.star.n, spots: W.spotGroup.visible, pads: Object.values(W.pads).some((p) => p.g.visible), leaders: Object.values(P.leaders).every((l) => l.root.visible), fairy: P.fairy.root.visible,
      company: F.order.length, inLine: F.order.every((e) => e.st === 6), clara: n.clara.root.visible, obj: document.getElementById('objText').textContent, quality: n.Perf.quality };
  });
  ok('act III alone: the full-screen overlay, the star in dots on the glass, the leaders and the Sugar Plum Fairy ready, no spots or pads, everyone in the line, Clara not yet there',
    lay.cls === 'palace' && lay.field[0] === 0 && lay.field[1] === 0 && lay.field[2] === lay.vw && lay.field[3] === lay.vh && lay.hud && lay.phase === 'show' && lay.act === 2 && lay.only === 2 && lay.star && lay.dots > 130 && lay.dots < 150 && !lay.spots && !lay.pads && lay.leaders && lay.fairy &&
    (lay.company === 34 || lay.company === 25) && lay.inLine && !lay.clara && /큰 별|맨 위 꼭짓점/.test(lay.obj), lay);

  /* 2. the game's steps, on a stopped game stepped by hand */
  const g = await ev(() => {
    const n = window.__nut, S = n.PalaceShow, F = n.PalaceFinale, R = n.Recital, A = n.PALACE_CFG.act3, out = {}, bar = 2.4;
    R.stop(); R.spb = 60 / n.PALACE_CFG.bpm; n.Palace.chain = false; S.reset(); S.toRing(); F.prepare(R);
    let rel = 0;
    const step = () => { F.sim(0.05, rel); rel += 0.05; };
    const run = (secs) => { for (let t = 0; t < secs - 1e-9; t += 0.05) step(); };
    const G0 = F.geom, V = G0.verts;
    out.geom = { per: +G0.per.toFixed(1), n: G0.n, top: V[0].map((v) => +v.toFixed(2)), next: V[1].map((v) => +v.toFixed(2)), tips: V.filter((_, k) => k % 2 === 0).map((v) => +Math.hypot(v[0], v[1]).toFixed(1)).join(), inner: +Math.hypot(V[1][0], V[1][1]).toFixed(1), expectN: Math.round(G0.per / A.star.spacing) };
    /* wandering inside the star lights nothing */
    S.setTarget(0, 0); run(1.5); S.setTarget(2, 2); run(0.6); S.setTarget(-2, 1); run(0.6); out.inside = { cov: F.cov, covered: F.covered };
    /* the line: the Sugar Plum Fairy first, the leaders, then the dancers with the nations taking turns, a set distance apart along the baton's trail */
    S.setTarget(0, -10); run(2.2); S.setTarget(7, -3); run(1.4);
    const gaps = []; for (let k = 0; k < 8; k++) gaps.push(+Math.hypot(F.order[k].x - (k ? F.order[k - 1].x : S.baton.x), F.order[k].z - (k ? F.order[k - 1].z : S.baton.z)).toFixed(2));
    out.line = { ids: F.order.slice(0, 4).map((e) => e.id).join(), nations: F.order.slice(4, 10).map((e) => e.n).join(), gaps, gap: n.PALACE_CFG.steer.gap };
    /* round the star corner by corner: the dots light along the way and the layers of the music come in at their shares */
    F.prepare(R); S.baton = { x: 0, z: 3.2, tx: 0, tz: 3.2, v: 0 }; S.trail = [{ x: 0, z: 3.2, s: 0 }]; rel = 0; const ev0 = R.events.length;
    const marks = {}, goto = (x, z, max = 4) => { S.setTarget(x, z); for (let t = 0; t < max && Math.hypot(S.baton.x - x, S.baton.z - z) > 0.3; t += 0.05) { step(); for (const q of [0.25, 0.5, 0.75, 0.95]) if (F.cov >= q && marks[q] === undefined) marks[q] = { rel: +rel.toFixed(2), from: F.layerFrom[[0.25, 0.5, 0.75, 0.95].indexOf(q) + 1] }; } };
    goto(V[0][0], V[0][1]); out.atTop = +F.cov.toFixed(3);
    for (let k = 1; k <= 5; k++) goto(V[k][0], V[k][1]); out.half = { cov: +F.cov.toFixed(2), layers: F.layersOn, drawn: F.drawn };
    for (let k = 6; k < 10; k++) goto(V[k][0], V[k][1]); goto(V[0][0], V[0][1]); run(0.3);
    out.full = { cov: +F.cov.toFixed(3), layers: F.layersOn, drawn: F.drawn, drawnAt: +F.drawnAt.toFixed(2), formAt: +F.formAt.toFixed(2), sched: F.sched };
    out.marks = marks;
    /* the finale: its time, its music added, the bar line */
    out.fin = { events: { before: ev0, after: R.events.length }, finT: +F.finT.toFixed(2), endRel: +F.endRel.toFixed(2), onBar: Math.abs(F.finT / bar - Math.round(F.finT / bar)) < 1e-6, lead: +(F.finT - F.drawnAt).toFixed(2), bars: A.bars };
    return out;
  });
  ok('the star: ten corners, five tips at the full radius and five inner corners, the first tip at the back and the next to its right (clockwise for the audience)', g.geom.top[0] === 0 && g.geom.top[1] === -10 && g.geom.next[0] > 0 && g.geom.tips === '10,10,10,10,10' && g.geom.inner === 4.3 && g.geom.n === g.geom.expectN, g.geom);
  ok('wandering inside the star lights none of its dots', g.inside.covered === 0 && g.inside.cov === 0, g.inside);
  ok('the line: the Sugar Plum Fairy and the three leaders first, the dancers behind with the nations taking turns, a set distance apart', g.line.ids === 'fairy,choco,coffee,tea' && g.line.nations === '0,1,2,0,1,2' && g.line.gaps.every((q) => Math.abs(q - g.line.gap) < 0.3), g.line);
  ok('drawing: the dots light where the baton goes, the layers of the music come in at a quarter, a half, three quarters and the whole star', g.atTop < 0.2 && g.half.cov > 0.4 && g.half.cov < 0.62 && g.full.cov >= 0.95 && g.full.layers === 4 && g.full.drawn && Object.keys(g.marks).length === 4 && [0.25, 0.5, 0.75, 0.95].every((q) => g.marks[q].from > g.marks[q].rel && g.marks[q].from <= g.marks[q].rel + 2.4 + 0.7 + 1e-6 && Math.abs(g.marks[q].from / 2.4 - Math.round(g.marks[q].from / 2.4)) < 1e-6), { atTop: g.atTop, half: g.half, full: g.full, marks: g.marks });
  ok('the finale starts at a bar line soon after the star is drawn (not at the deadline), and lasts six bars', g.fin.onBar && g.fin.lead > 0.9 && g.fin.lead < 4 && g.fin.finT < 20 && g.fin.events.before === 0 && g.fin.events.after > 40 && Math.abs(g.fin.endRel - g.fin.finT - 6 * 2.4 - 1.2) < 0.01, g.fin);

  /* 3. the finale itself, stepped: the company takes its places on the turning star, Clara and the Prince come, the stars */
  const f = await ev(() => {
    const n = window.__nut, S = n.PalaceShow, F = n.PalaceFinale, R = n.Recital, A = n.PALACE_CFG.act3, out = {};
    let rel = F.drawnAt;
    const step = () => { F.sim(0.05, rel); rel += 0.05; };
    const finT = F.finT, before = R.events.length;
    while (rel < F.formAt + 0.05) step();    // up to the moment the company starts walking
    out.events = { before: false, added: R.events.length - before, hasFanfare: R.events.some((e) => e.kind === 'stomp' && Math.abs(e.t - F.finT) < 1e-6), hasRun: R.events.some((e) => e.kind === 'bell' && e.t > F.endRel - 2.5) };
    out.formed = { formed: F.formed, walking: F.order.every((e) => e.st === 7 || e.st === 8) };
    for (let t = 0; t < 6; t += 0.05) step();
    const G0 = F.geom, phi = A.form.spin * (rel - F.formT), c = Math.cos(phi), s = Math.sin(phi), p = [0, 0];
    const err = F.order.map((e) => { G0.at(e.slot, p); return Math.hypot(e.x - (p[0] * c + p[1] * s), e.z - (-p[0] * s + p[1] * c)); });
    out.onStar = { all: F.order.every((e) => e.st === 8), maxErr: +Math.max(...err).toFixed(3), radius: +Math.max(...F.order.map((e) => Math.hypot(e.x, e.z))).toFixed(1), tipFairy: +Math.hypot(F.lead[0].x, F.lead[0].z).toFixed(1) };
    const a0 = Math.atan2(F.lead[0].x, F.lead[0].z); for (let t = 0; t < 2; t += 0.05) step(); const a1 = Math.atan2(F.lead[0].x, F.lead[0].z);
    out.turn = +(((a1 - a0 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI).toFixed(3);
    /* the stars from the share of the star drawn when the finale began */
    const stars = []; for (const q of [0.3, 0.69, 0.7, 0.9, 0.92, 1]) { F.covFinal = q; stars.push(F.result().stars); } out.stars = stars.join();
    return out;
  });
  ok('the finale\'s music is added when it is scheduled (a fanfare on its first beat, a last run of bells), not before', f.events.hasFanfare && f.events.hasRun, f.events);
  ok('the company takes its places on the star: everyone on her place on the outline, the leaders at the tips, and the star turns round the dais', f.formed.formed && f.formed.walking && f.onStar.all && f.onStar.maxErr < 0.2 && f.onStar.radius <= 10.1 && f.onStar.tipFairy > 9.5 && Math.abs(f.turn) > 0.02, { onStar: f.onStar, turn: f.turn });
  ok('stars: under 70% of the star is one star, 70% two, 92% three', f.stars === '1,1,2,2,3,3', f.stars);

  /* 4. the whole act on autoplay, with a pause in the middle */
  await ev(() => { const n = window.__nut; n.Recital.auto = {}; n.Palace.startFinale(); });
  await until(running, 240000, 'finale again');
  await until(() => window.__nut.PalaceFinale.cov > 0.3, 120000, 'drawing');
  await shot('act3-drawing');
  const snap = () => window.__nut.PalaceShow.D.slice(0, 6).map((d) => [d.x, d.z].map((v) => +v.toFixed(3)).join(',')).join('|') + '#' + window.__nut.PalaceFinale.covered;
  const p1 = await ev(() => { window.__nut.Story.pause(); return window.__nut.Recital.rel(); });
  const s1 = await ev(snap); await page.waitForTimeout(1500);
  const p2 = await ev(() => window.__nut.Recital.rel()), s2 = await ev(snap);
  const pz = await ev(() => ({ mode: window.__nut.G.mode, screen: !document.getElementById('screenPause').hidden, help: document.querySelector('#screenPause').textContent.includes('꼭지점') || document.querySelector('#screenPause').textContent.includes('꼭짓점') }));
  await ev(() => window.__nut.Story.resume());
  ok('pause: the card opens with this act\'s help, the music clock, the line and the dots stand still, and the game goes on after', pz.mode === 'paused' && pz.screen && pz.help && Math.abs(p2 - p1) < 0.1 && s1 === s2, { before: +p1.toFixed(2), after: +p2.toFixed(2), same: s1 === s2 });
  await until(() => window.__nut.PalaceFinale.formed, 180000, 'formed');
  await page.waitForTimeout(2500); await shot('act3-formed');
  await until(() => window.__nut.PalaceFinale.finale && window.__nut.Recital.lastRel > window.__nut.PalaceFinale.finT + 2.4 * 1.9, 180000, 'pas de deux');
  const pas = await ev(() => { const n = window.__nut; return { clara: n.clara.root.visible, prince: n.prince.root.visible, scale: +n.clara.root.scale.x.toFixed(2), fin: n.PalaceFinale.finT, cam: [n.camera.position.x, n.camera.position.y, n.camera.position.z].every(Number.isFinite) }; });
  await shot('act3-pas');
  ok('the pas de deux: Clara and the Prince stand on the dais at full size, and the camera is sound', pas.clara && pas.prince && pas.scale > 1.5 && pas.cam, pas);
  await until(() => window.__nut.Recital.lastRel > window.__nut.PalaceFinale.finT + 4 * 2.4 + 1.4, 180000, 'fireworks');
  await shot('act3-fireworks');
  await until(() => window.__nut.Palace.lastResult, 240000, 'act end');
  const end = await ev(() => { const n = window.__nut, F = n.PalaceFinale; return { res: n.Palace.lastResult, phase: n.G.phase, finT: +F.finT.toFixed(1), endRel: +F.endRel.toFixed(1), rel: +n.Recital.lastRel.toFixed(1), obj: document.getElementById('objText').textContent, pillars: Math.min(...Array.from(n.Palace.W.pillarK)) }; });
  ok('autoplay: the whole star drawn, three stars, four layers; the finale began long before the deadline (31 s) and the act ended six bars later', end.res && end.res.cov === 100 && end.res.stars === 3 && end.res.layers === 4 && end.res.drawn && end.phase === 'showEnd' && end.finT < 20 && end.rel >= end.endRel - 0.5 && end.pillars >= 1, end);
  await page.waitForTimeout(900);
  await shot('act3-end');

  /* 5. alone, the act ends with its own clear card; Clara and the Prince are put back as they were; a half-drawn star waits for the deadline */
  await until(() => window.__nut.G.mode === 'clear', 240000, 'clear card');
  const clr = await ev(() => { const n = window.__nut, q = (id) => document.getElementById(id); return { kicker: q('clrKicker').textContent, stats: [...document.querySelectorAll('#clrStats div')].map((d) => [d.children[0].textContent, d.children[1].textContent]) }; });
  ok('clear card (act III alone): its stars, the share of the star and the whole company', clr.kicker === '제5장 · 3막 끝' && clr.stats[0][1] === '★★★' && clr.stats[1][1] === '100%' && /^(34|25)명$/.test(clr.stats[2][1]), clr);
  await ev(() => { const n = window.__nut; n.Story.toTitle(); });
  await page.waitForTimeout(500);
  const back = await ev(() => { const n = window.__nut; return { s: n.clara.root.scale.x, y: n.clara.root.position.y, v: n.prince.root.scale.x }; });
  ok('leaving the gala puts Clara and the Prince back as they were (size and place)', Math.abs(back.s - before.s) < 1e-6 && Math.abs(back.y - before.y) < 1e-6 && Math.abs(back.v - before.v) < 1e-6, { before, back });
  await ev(() => { const n = window.__nut; n.Recital.auto = { cover: 0.6 }; n.Palace.startFinale(); });
  await until(running, 240000, 'finale, a part of the star');
  await until(() => window.__nut.Palace.lastResult, 300000, 'act end, a part');
  const part = await ev(() => { const n = window.__nut, F = n.PalaceFinale; return { res: n.Palace.lastResult, finT: +F.finT.toFixed(1), deadline: +((n.PALACE_CFG.act3.bars.intro + n.PALACE_CFG.act3.bars.draw) * F.bar).toFixed(1) }; });
  ok('a star drawn only to 60%: the finale waits for the deadline and the act earns one star', part.res.cov >= 55 && part.res.cov < 70 && part.res.stars === 1 && !part.res.drawn && Math.abs(part.finT - part.deadline) < 0.01 && part.res.layers >= 2, part);

  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
