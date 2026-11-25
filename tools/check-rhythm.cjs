// Logic checks for the rhythm engine: chart, judgement windows, sweeping misses, audio clock, pause, input mapping, config knobs.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'rh' });
  const { ev, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };
  const near = (a, b, tol) => Math.abs(a - b) <= tol;

  /* 1. the chart */
  const c3 = await ev(() => {
    const R = window.__nut.Rhythm, C = R.chart(), cfg = window.__nut.SNOW_CFG;
    const gaps = C.notes.slice(1).map((n, i) => n.rel - C.notes[i].rel);
    return { n: C.notes.length, len: C.lengthSec, lanes: [...new Set(C.notes.map((n) => n.lane))].sort(), minGap: Math.min(...gaps), sorted: C.notes.every((n, i, a) => !i || n.rel >= a[i - 1].rel), lastFlags: C.notes.filter((n) => n.last).length, lastIsLast: C.notes[C.notes.length - 1].last, minGapCfg: cfg.minGapSec };
  });
  ok('chart: 20-30 s long', c3.len >= 20 && c3.len <= 30, { len: +c3.len.toFixed(2), notes: c3.n });
  ok('chart: 3 lanes all used', JSON.stringify(c3.lanes) === '[0,1,2]', c3.lanes);
  ok('chart: notes sorted and thinned by minGapSec', c3.sorted && c3.minGap >= c3.minGapCfg - 1e-6, { minGap: +c3.minGap.toFixed(3) });
  ok('chart: exactly one final note, and it is the last', c3.lastFlags === 1 && c3.lastIsLast);
  const c4 = await ev(() => { const cfg = window.__nut.SNOW_CFG; cfg.lanes = 4; const C = window.__nut.Rhythm.chart(); cfg.lanes = 3; return { lanes: [...new Set(C.notes.map((n) => n.lane))].sort(), n: C.notes.length }; });
  ok('chart: lane count is a constant (4 lanes)', JSON.stringify(c4.lanes) === '[0,1,2,3]' && c4.n === c3.n, c4);
  const slow = await ev(() => { const cfg = window.__nut.SNOW_CFG; cfg.audio.bpm = 120; const C = window.__nut.Rhythm.chart(); cfg.audio.bpm = 144; return C.lengthSec; });
  ok('chart: follows the configured bpm', slow > c3.len, { at120: +slow.toFixed(1), at144: +c3.len.toFixed(1) });

  /* 2. judgement windows, around the beat of one note */
  const win = await ev(() => window.__nut.SNOW_CFG.windows);
  const judge = (delta, lane) => ev(([d, l]) => {
    const R = window.__nut.Rhythm;
    R.prepare(); R.running = true; R.paused = false; R.onJudge = null;
    const n = R.notes[5]; const res = R.tapRel(l === undefined ? n.lane : l, n.rel + d);
    R.running = false; return { rating: res.rating, state: n.state };
  }, [delta, lane]);
  const exp = [
    [0, 'perfect'], [win.perfect - 0.001, 'perfect'], [-(win.perfect - 0.001), 'perfect'],
    [win.perfect + 0.001, 'good'], [-(win.perfect + 0.001), 'good'], [win.good - 0.001, 'good'], [-(win.good - 0.001), 'good'],
    [win.good + 0.001, 'none'], [-(win.good + 0.001), 'none'], [0.4, 'none'], [-0.4, 'none'],
  ];
  for (const [d, want] of exp) { const r = await judge(d); ok(`window: tap ${d >= 0 ? '+' : ''}${(d * 1000).toFixed(0)} ms → ${want}`, r.rating === want, r); }
  const wrong = await ev(() => { const R = window.__nut.Rhythm; R.prepare(); R.running = true; const n = R.notes[5]; const res = R.tapRel((n.lane + 1) % 3, n.rel); R.running = false; return res.rating; });
  ok('window: the wrong lane never hits', wrong === 'none', wrong);
  const near2 = await ev(() => {
    const R = window.__nut.Rhythm; R.prepare(); R.running = true;
    R.notes = [{ i: 0, rel: 1.0, lane: 0, state: 'wait', f: 440 }, { i: 1, rel: 1.2, lane: 0, state: 'wait', f: 440 }];
    const res = R.tapRel(0, 1.11); R.running = false; return { picked: res.note && res.note.i, rating: res.rating };
  });
  ok('window: the nearest note in the lane is taken', near2.picked === 1 && near2.rating === 'good', near2);
  const tight = await ev(() => { const cfg = window.__nut.SNOW_CFG, old = cfg.windows.perfect; cfg.windows.perfect = 0.02; const R = window.__nut.Rhythm; R.prepare(); R.running = true; const n = R.notes[3]; const a = R.tapRel(n.lane, n.rel + 0.04).rating; cfg.windows.perfect = old; R.running = false; return a; });
  ok('window: sizes are constants (perfect 0.02 turns +40 ms into good)', tight === 'good', tight);

  /* 3. misses are swept in when a note is more than the good window late */
  const sw = await ev(() => {
    const R = window.__nut.Rhythm, good = window.__nut.SNOW_CFG.windows.good; R.prepare(); R.running = true;
    const seen = []; R.onJudge = (n, r) => seen.push([n.i, r]);
    const n0 = R.notes[0], n1 = R.notes[1];
    R.sweep(n0.rel + good - 0.001); const before = n0.state;
    R.sweep(n0.rel + good + 0.001); const after = [n0.state, n1.state];
    R.sweep(n1.rel + 5); R.running = false;
    return { before, after, seen: seen.slice(0, 3), missCount: R.stats.miss };
  });
  ok('sweep: a note inside the window is still waiting', sw.before === 'wait', sw);
  ok('sweep: a note past the window becomes a miss, later notes keep waiting', sw.after[0] === 'miss' && sw.after[1] === 'wait', sw.after);
  ok('sweep: the miss reaches the onJudge callback', sw.seen[0] && sw.seen[0][1] === 'miss' && sw.missCount >= 2, sw);
  const plan = await ev(() => {
    const R = window.__nut.Rhythm; R.prepare(); R.running = true; R.onJudge = null;
    const a = { perfect: 0.6, good: 0.25 }, want = { perfect: 0, good: 0, miss: 0 };
    for (const n of R.notes) { const k = R.autoKind(n, a); want[k]++; if (k === 'perfect') R.tapRel(n.lane, n.rel + 0.02); else if (k === 'good') R.tapRel(n.lane, n.rel - 0.1); }
    R.sweep(1e9); R.running = false;
    return { want, got: { ...R.stats }, total: R.notes.length, sum: R.stats.perfect + R.stats.good + R.stats.miss };
  });
  ok('run: every note ends up judged exactly once', plan.sum === plan.total && JSON.stringify(plan.want) === JSON.stringify(plan.got), plan);

  /* 4. the audio clock */
  await ev(() => { window.__nut.Sound.init(); });
  await page.waitForTimeout(400);
  const started = await ev(async () => { const R = window.__nut.Rhythm; const okk = await R.start({}); return { okk, clock: R.clock, state: window.__nut.Sound.ctx && window.__nut.Sound.ctx.state, evCount: R.events.length }; });
  ok('clock: the rhythm runs on the audio clock', started.okk && started.clock === 'audio' && started.state === 'running', started);
  const drift = await ev(() => new Promise((res) => {
    const R = window.__nut.Rhythm, c = window.__nut.Sound.ctx, r0 = R.rel(), t0 = c.currentTime;
    setTimeout(() => res({ dRel: R.rel() - r0, dCtx: c.currentTime - t0, lat: R.latency() }), 400);
  }));
  ok('clock: rel() advances exactly like AudioContext.currentTime', near(drift.dRel, drift.dCtx, 0.003) && drift.dCtx > 0.3, drift);
  const upd = await ev(() => { const R = window.__nut.Rhythm; R.update(); return { lastRel: R.lastRel, rel: R.rel() }; });
  ok('clock: frames only read the clock (lastRel follows rel())', near(upd.lastRel, upd.rel, 0.002), upd);
  const sched = await ev(() => new Promise((res) => setTimeout(() => { const R = window.__nut.Rhythm; res({ idx: R.evIdx, total: R.events.length, t0ahead: R.t0 - window.__nut.Sound.ctx.currentTime }); }, 700)));
  ok('clock: the temporary track is scheduled ahead of the audio clock', sched.idx > 0 && sched.idx < sched.total, sched);

  /* 5. pause freezes the clock, and a key press cannot restart it */
  await ev(() => { window.__nut.Rhythm.pause(); });
  await page.waitForTimeout(300);
  const paused = await ev(() => new Promise((res) => {
    const R = window.__nut.Rhythm, S = window.__nut.Sound, a = R.rel(), st0 = S.ctx.state;
    S.init(); // what any key press does
    setTimeout(() => res({ st0, st1: S.ctx.state, moved: R.rel() - a, hold: S.hold, paused: R.paused }), 400);
  }));
  ok('pause: the audio context is suspended and rel() stands still', paused.st0 === 'suspended' && paused.st1 === 'suspended' && Math.abs(paused.moved) < 0.002 && paused.hold, paused);
  const tapPaused = await ev(() => window.__nut.Rhythm.tapLane(0));
  ok('pause: taps are ignored while paused', tapPaused === null, tapPaused);
  await ev(() => { window.__nut.Rhythm.resume(); });
  await page.waitForTimeout(400);
  const resumed = await ev(() => new Promise((res) => { const R = window.__nut.Rhythm, a = R.rel(); setTimeout(() => res({ state: window.__nut.Sound.ctx.state, moved: R.rel() - a, hold: window.__nut.Sound.hold }), 300); }));
  ok('resume: the clock runs again', resumed.state === 'running' && resumed.moved > 0.25 && !resumed.hold, resumed);
  await ev(() => { window.__nut.Rhythm.stop(); });

  /* 6. real input: a pointer event and a key press reach the same judge, with the event time mapped onto the audio clock */
  await ev(() => {
    const n = window.__nut; n.UI.show('rhythm'); n.Rhythm.mount(); n.Rhythm.resize();
  });
  await ev(async () => { await window.__nut.Rhythm.start({}); });
  for (const lanes of [3, 4]) {
    await ev((L) => { const R = window.__nut.Rhythm; window.__nut.SNOW_CFG.lanes = L; R.prepare(); R.running = true; R.resize(); }, lanes);
    for (let lane = 0; lane < lanes; lane++) {
      const res = await ev(([l, ago]) => {
        const R = window.__nut.Rhythm, cv = R.cv, r = cv.getBoundingClientRect(), k = R.geom();
        const now = R.rel(); R.notes = [{ i: 0, rel: now - ago + 0.02, lane: l, state: 'wait', f: 440 }];
        const e = new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: r.left + k.pad + (l + 0.5) * k.laneW, clientY: r.top + r.height * 0.8, bubbles: true, cancelable: true });
        Object.defineProperty(e, 'timeStamp', { value: performance.now() - ago * 1000 });
        let got = null; R.onJudge = (n, rating) => { got = rating; };
        cv.dispatchEvent(e);
        return { got, state: R.notes[0].state, w: Math.round(k.W) };
      }, [lane, 0.05]);
      ok(`input: touch on lane ${lane + 1}/${lanes} (50 ms old event, note 20 ms off) → perfect`, res.got === 'perfect', res);
    }
  }
  // an event stamped long ago (a stalled queue, a wrong time base) counts as at most 0.25 s old
  const clamp = await ev(() => {
    const R = window.__nut.Rhythm, cv = R.cv, r = cv.getBoundingClientRect(), k = R.geom(), out = {};
    for (const [name, gap] of [['inside', 0.2], ['outside', 0.45]]) {
      const now = R.rel(); R.notes = [{ i: 0, rel: now - gap, lane: 0, state: 'wait', f: 440 }];
      const e = new PointerEvent('pointerdown', { pointerId: 2, pointerType: 'touch', clientX: r.left + k.pad + 4, clientY: r.top + 20, bubbles: true, cancelable: true });
      Object.defineProperty(e, 'timeStamp', { value: performance.now() - 5000 });
      R.onJudge = null; cv.dispatchEvent(e); out[name] = R.notes[0].state;
    }
    return out;
  });
  ok('input: a 5 s old event is clamped to 0.25 s (hits a note 0.2 s back, not one 0.45 s back)', clamp.inside === 'perfect' && clamp.outside === 'wait', clamp);
  await ev(() => { const R = window.__nut.Rhythm; window.__nut.SNOW_CFG.lanes = 3; R.prepare(); R.running = true; R.onJudge = null; });
  const keyRes = await ev(() => {
    const R = window.__nut.Rhythm, out = {}; const now = R.rel();
    for (const [code, key, lane] of [['KeyA', 'ㅁ', 0], ['KeyS', 'ㄴ', 1], ['KeyD', 'ㅇ', 2], ['ArrowRight', 'ArrowRight', 2]]) {
      R.notes = [{ i: 0, rel: R.rel() + 0.01, lane, state: 'wait', f: 440 }];
      window.dispatchEvent(new KeyboardEvent('keydown', { code, key, bubbles: true, cancelable: true }));
      out[code] = R.notes[0].state;
    }
    R.notes = [{ i: 0, rel: R.rel() + 0.01, lane: 1, state: 'wait', f: 440 }];
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS', repeat: true, bubbles: true }));
    out.repeat = R.notes[0].state;
    return out;
  });
  ok('input: keys work by physical code, also with a Korean IME', keyRes.KeyA === 'perfect' && keyRes.KeyS === 'perfect' && keyRes.KeyD === 'perfect' && keyRes.ArrowRight === 'perfect', keyRes);
  ok('input: a held key does not repeat', keyRes.repeat === 'wait', keyRes);
  await ev(() => { window.__nut.Rhythm.stop(); window.__nut.UI.hide('rhythm'); });

  /* 7. a missing recording falls back to the built-in track; no audio at all falls back to the wall clock */
  const missing = await ev(async () => {
    const cfg = window.__nut.SNOW_CFG, R = window.__nut.Rhythm; cfg.audio.url = 'assets/does-not-exist.mp3';
    const okk = await R.start({}); const out = { okk, running: R.running, buf: R.buf === null, clock: R.clock, events: R.events.length };
    R.stop(); cfg.audio.url = ''; return out;
  });
  ok('audio: an unreachable file falls back to the temporary track', missing.okk && missing.buf && missing.events > 50, missing);
  const perf = await ev(async () => {
    const S = window.__nut.Sound, R = window.__nut.Rhythm, ctx = S.ctx, init = S.init;
    S.ctx = null; S.init = () => {};
    const okk = await R.start({}); const a = R.rel(), w0 = performance.now(); await new Promise((r) => setTimeout(r, 300)); const d = R.rel() - a;
    const out = { okk, clock: R.clock, moved: d, wall: (performance.now() - w0) / 1000 };
    R.stop(); S.ctx = ctx; S.init = init; return out;
  });
  ok('audio: without WebAudio the run still works on the wall clock', perf.okk && perf.clock === 'perf' && perf.moved > 0.25 && Math.abs(perf.moved - perf.wall) < 0.01, perf);

  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
