// Chapter III: the gate opens only when enough snowflakes are caught (SNOW_CFG.gateNeed).
// Below it the gate stays shut and the rhythm can be tried again from the start; at or above it the dance and the gate follow.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'gt' });
  const { ev, shot, until, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };
  // speech boxes move on by themselves here; the watch records whether the dance ever runs
  await ev(() => {
    window.__autoAdv = setInterval(() => { const n = window.__nut; if (n.UI.dlg.open) n.UI.advance(); }, 250);
    window.__danceSeen = false;
    window.__danceWatch = setInterval(() => { if (window.__nut.Dance.running) window.__danceSeen = true; }, 50);
  });
  // how many notes a plan catches (the same plan the autoplay follows)
  const planOf = (auto) => ev((a) => {
    const R = window.__nut.Rhythm, want = { perfect: 0, good: 0, miss: 0 };
    for (const n of R.chart().notes) want[R.autoKind(n, a)]++;
    return want;
  }, auto);

  /* 1. the first try: 23 snowflakes caught, not enough for the gate */
  const low = await planOf({ perfect: 0.3, good: 0.2 });
  await ev(() => { const n = window.__nut; n.Save.data.unlocked = 3; n.Rhythm.auto = { perfect: 0.3, good: 0.2 }; n.DEBUG.timeScale = 3; n.Snow.start(); });
  await until(() => window.__nut.G.mode === 'clear', 300000, 'the first try ends on a card');
  const f1 = await ev(() => {
    const n = window.__nut, S = n.Snow, q = (id) => document.getElementById(id);
    return {
      mode: n.G.mode, gate: S.W.gate.open, danced: window.__danceSeen, caught: S.caught(), need: n.SNOW_CFG.gateNeed,
      kicker: q('clrKicker').textContent, next: !q('btnClearNext').hidden, nextLabel: q('btnClearNext').textContent,
      stats: [...document.querySelectorAll('#clrStats div')].map((d) => [d.children[0].textContent, d.children[1].textContent]),
      unlock: q('clrUnlock').textContent, unlocked: n.Save.data.unlocked, savedSnow: !!n.Save.data.done.snow,
    };
  });
  const lowCaught = low.perfect + low.good;
  await shot('short');
  ok('below the gate: the gate stays shut, no dance, and the card offers another try', f1.caught === lowCaught && lowCaught < f1.need && f1.gate === 0 && !f1.danced && f1.kicker === '제3장 · 다시 시도' && f1.next && f1.nextLabel === '다시 시도', { caught: f1.caught, expected: lowCaught, need: f1.need, kicker: f1.kicker, next: f1.nextLabel });
  ok('below the gate: the card shows the snowflakes caught out of the gate’s number and says how many are missing', f1.stats[0][0] === '모은 눈송이' && f1.stats[0][1] === `${lowCaught} / ${f1.need}` && f1.unlock.includes(`${f1.need - lowCaught}개`), { stat: f1.stats[0], unlock: f1.unlock });
  ok('below the gate: nothing is saved as a finished chapter and chapter IV stays closed', f1.unlocked === 3 && !f1.savedSnow, { unlocked: f1.unlocked, saved: f1.savedSnow });

  /* 2. the rule itself: 29 caught is not enough, 30 is */
  const rule = await ev(() => { const S = window.__nut.Snow, keep = S.hits, out = {}; S.hits = 29; out.p29 = S.passes(); S.hits = 30; out.p30 = S.passes(); S.hits = keep; return out; });
  ok('gate rule: 29 caught is not enough, 30 is', rule.p29 === false && rule.p30 === true, rule);

  /* 3. try again: the same song from the start, the path snowed in again, the counter back to zero */
  const high = await planOf({ perfect: 0.6, good: 0.25 });
  await ev(() => { const n = window.__nut; n.Rhythm.auto = { perfect: 0.6, good: 0.25 }; n.DanceMusic.rate = 6; document.getElementById('btnClearNext').click(); });
  await until(() => window.__nut.G.phase === 'rhythm' && window.__nut.G.mode === 'play', 120000, 'the second try starts');
  const r2 = await ev(() => {
    const n = window.__nut, S = n.Snow;
    return { hits: S.hits, opened: S.opened, goalSum: S.goal.reduce((a, b) => a + b, 0), gate: S.W.gate.open, cardHidden: document.getElementById('screenClear').hidden, rhythm: !document.getElementById('rhythm').hidden, objective: document.getElementById('objText').textContent, fairy: S.fairy.root.visible };
  });
  ok('try again: the same chapter starts over, the counter is back to zero and the path is snowed in', r2.hits === 0 && r2.opened === 0 && r2.goalSum === 0 && r2.gate === 0 && r2.cardHidden && r2.rhythm && r2.fairy && r2.objective.includes('0 / 30'), r2);

  /* 4. enough snowflakes this time: the dance, the path, the gate, then the clear card */
  await until(() => window.__nut.G.mode === 'clear', 300000, 'the second try ends on the clear card');
  const p2 = await ev(() => {
    const n = window.__nut, S = n.Snow, q = (id) => document.getElementById(id);
    return { gate: S.W.gate.open, caught: S.caught(), need: n.SNOW_CFG.gateNeed, kicker: q('clrKicker').textContent, next: !q('btnClearNext').hidden, nextLabel: q('btnClearNext').textContent, unlocked: n.Save.data.unlocked, saved: !!n.Save.data.done.snow, danced: window.__danceSeen };
  });
  await shot('gate-open');
  ok('enough snowflakes: the dance runs, the gate opens, the chapter is saved as finished and the card leads on to chapter IV', p2.gate === 1 && p2.caught === high.perfect + high.good && p2.caught >= p2.need && p2.danced && p2.kicker === '제3장 · 이야기 끝' && p2.next && p2.nextLabel === '제4장으로 떠나기' && p2.unlocked >= 4 && p2.saved, { ...p2, expected: high.perfect + high.good });

  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
