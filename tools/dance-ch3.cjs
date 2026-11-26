// Chapter III: the snowflakes' waltz (corps de ballet) between the rhythm section and the finale.
// Choreography spacing, flow, pause, sound, skip, performance; with LOCAL_WALTZ=<file> also the player's own recording.
const { open } = require('./harness.cjs');
const fs = require('fs');
(async () => {
  const mobile = process.env.VIEW === 'mobile';
  const h = await open({ tag: mobile ? 'dm' : 'dc', mobile });
  const { ev, shot, until, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };
  const toFinale = async (rate) => {
    await ev(() => { const n = window.__nut; n.Save.data.unlocked = 3; n.DEBUG.timeScale = 4; n.Snow.start(); });
    await until(() => window.__nut.G.phase === 'rhythm' && window.__nut.G.mode === 'play', 300000, 'rhythm');
    await ev((r) => { const n = window.__nut; n.Rhythm.stop(); n.DanceMusic.rate = r; for (let i = 0; i < 35; i++) n.Snow.setOpen(i, 1); n.Snow.hits = 35; n.Story.run(() => n.Snow.finale()); }, rate);   // rhythm part skipped: 35 caught, the gate needs 30
  };

  /* 1. the snow fairy's invitation comes first, then the dance: before the finale's spin, path and gate */
  await toFinale(1);   // real speed: the waltz is checked as it sounds
  await until(() => window.__nut.G.phase === 'finale' && window.__nut.UI.dlg.open, 300000, 'invitation');
  const inv = await ev(() => { const n = window.__nut; return { phase: n.G.phase, gate: n.Snow.W.gate.open, swept: n.Snow.goal.filter((g) => g === 1).length, speaker: document.getElementById('dlgName') ? document.getElementById('dlgName').textContent : '', dancing: n.Dance.active }; });
  ok('order: after the rhythm the fairy invites everyone, the gate still closed and the finale sweep not yet run', inv.gate === 0 && inv.swept < 49 && !inv.dancing, inv);
  await until(() => window.__nut.Dance.running, 300000, 'dance running');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  const st = await ev(() => { const n = window.__nut, D = n.Dance; return { phase: n.G.phase, mode: n.G.mode, src: n.DanceMusic.source, clock: n.DanceMusic.clock, bars: n.DanceMusic.bars.length - 1, sections: n.DanceMusic.sectionBars, n: D.n, corps: n.Corps.group.visible, fx: D.fx.root.visible, skip: !document.getElementById('danceSkip').hidden, gate: n.Snow.W.gate.open, parts: n.Corps.inst.length, triPerDancer: n.Corps.triangles() }; });
  ok('dance: the corps is on stage with the built-in performance on the audio clock (64 bars)', st.phase === 'dance' && st.mode === 'cutscene' && st.src === 'builtin' && st.clock === 'audio' && st.bars === 64 && st.n >= 8 && st.corps && st.fx && st.skip && st.gate === 0, st);
  ok('corps drawn instanced: one draw call per body part, a light doll per dancer', st.parts <= 16 && st.triPerDancer < 7000, { parts: st.parts, triPerDancer: st.triPerDancer });

  /* 2. choreography: formations stay on the stage and nobody walks through anybody, over every bar */
  const ch = await ev(() => {
    const n = window.__nut, D = n.Dance, so = { x: 0, z: 0.25, yaw: 0 }, P = n.Dance, buf = [], out = { minPair: 9, at: null, minSolo: 9, soloAt: null, maxR: 0, rAt: null, kinds: new Set() };
    const ss = (a, c, v) => { const t = Math.min(1, Math.max(0, (v - a) / (c - a))); return t * t * (3 - 2 * t); };
    for (let b = -1; b <= 64.5; b += 0.05) {
      so.z = b >= 51 && b < 57 ? 0.25 - 2.15 * ss(52.4, 53.6, b) : b >= 57 && b < 61 ? -1.9 + 2.15 * ss(57, 58.2, b) : 0.25;
      const pos = P.positions(b, buf, so);
      out.kinds.add(n.DANCE_PLAN[P.formation(b)].f);
      for (let i = 0; i < D.n; i++) {
        const r = Math.hypot(pos[i].x, pos[i].z); if (b > 5.2 && r > out.maxR) { out.maxR = +r.toFixed(2); out.rAt = +b.toFixed(2); }
        if (b > 5.2) { const d = Math.hypot(pos[i].x - so.x, pos[i].z - so.z); if (d < out.minSolo) { out.minSolo = +d.toFixed(2); out.soloAt = +b.toFixed(2); } }
        for (let j = i + 1; j < D.n; j++) { const d = Math.hypot(pos[i].x - pos[j].x, pos[i].z - pos[j].z); if (d < out.minPair) { out.minPair = +d.toFixed(2); out.at = +b.toFixed(2); } }
      }
    }
    out.kinds = [...out.kinds];
    return out;
  });
  ok('choreography: eight formations — windmill, circle, snowflake star, horseshoe, counter-turning circles, wedge, spiral, tableau', ['windmill', 'circle', 'star', 'ring', 'counter', 'wedge', 'spiral', 'tableau'].every((k) => ch.kinds.includes(k)), ch.kinds);
  ok('choreography: tutus never pass through each other (≥ 0.78 m apart) and keep clear of the snow fairy (≥ 0.95 m)', ch.minPair >= 0.78 && ch.minSolo >= 0.95, { minPair: ch.minPair, at: ch.at, minSolo: ch.minSolo, soloAt: ch.soloAt });
  ok('choreography: everyone stays inside the clearing once on stage (r ≤ 5.8 m)', ch.maxR <= 5.8, { maxR: ch.maxR, at: ch.rAt });

  /* 3. sound, and steps on the music's clock */
  await ev(() => {
    const n = window.__nut, c = n.Sound.ctx, an = c.createAnalyser(); an.fftSize = 2048; n.Sound.master.connect(an); window.__lv = [];
    window.__lvT = setInterval(() => { const D = n.DanceMusic; if (!n.Dance.running || D.paused || D.time() < 0.1) return; const a = new Float32Array(an.fftSize); an.getFloatTimeDomainData(a); let s = 0, p = 0; for (const v of a) { s += v * v; p = Math.max(p, Math.abs(v)); } window.__lv.push({ t: D.time(), rms: Math.sqrt(s / a.length), peak: p, sched: D.evIdx, total: D.events.length }); }, 100);
  });
  await page.waitForTimeout(1600);
  await shot('dancing');
  /* 4. pause: music and dancers stop together and carry on together */
  await ev(() => { window.__nut.Story.pause(); });
  await page.waitForTimeout(700);
  const p1 = await ev(() => { const n = window.__nut; return { mode: n.G.mode, paused: n.DanceMusic.paused, ctx: n.Sound.ctx.state, tau: n.DanceMusic.time(), beta: n.Dance.beta, expect: n.DanceMusic.barAt(n.DanceMusic.time()) }; });
  await page.waitForTimeout(1300);
  const p2 = await ev(() => { const n = window.__nut; return { tau: n.DanceMusic.time(), beta: n.Dance.beta }; });
  ok('pause: game, music and dance all stop (audio clock suspended)', p1.mode === 'paused' && p1.paused && p1.ctx === 'suspended', p1);
  ok('pause: the dancers stand exactly on the paused music position and do not move', Math.abs(p2.tau - p1.tau) < 0.003 && Math.abs(p2.beta - p1.beta) < 1e-6 && Math.abs(p1.beta - p1.expect) < 0.02, { tau: [p1.tau, p2.tau], beta: [p1.beta, p2.beta], expect: p1.expect });
  await ev(() => { window.__nut.Story.resume(); });
  await page.waitForTimeout(900);
  const p3 = await ev(() => { const n = window.__nut; return { mode: n.G.mode, paused: n.DanceMusic.paused, ctx: n.Sound.ctx.state, tau: n.DanceMusic.time(), hold: !!n.Sound.hold }; });
  ok('resume: music and dance carry on from the same place', p3.mode === 'cutscene' && !p3.paused && p3.ctx === 'running' && !p3.hold && p3.tau > p2.tau && p3.tau - p2.tau < 9, { before: p2.tau, after: p3.tau });
  const perf = await ev(() => { const r = window.__nut.renderer.info.render; return { calls: r.calls, tris: r.triangles }; });
  ok('performance: the whole scene with the corps stays light (draw calls, triangles)', perf.calls < 140 && perf.tris < 320000, perf);

  /* 5. the dance ends on the last chord: bow, the snowflakes melt away, stage light fades, the finale opens the gate */
  await until(() => !window.__nut.Dance.running, 120000, 'dance ends');
  const snd = await ev(() => { clearInterval(window.__lvT); const L = window.__lv, last = L[L.length - 1] || null; return { n: L.length, silent: +(L.filter((x) => x.rms < 0.003).length / Math.max(1, L.length)).toFixed(2), peak: +Math.max(0, ...L.map((x) => x.peak)).toFixed(3), scheduledToEnd: !!last && last.total > 0 && last.sched === last.total, lastAt: last ? +last.t.toFixed(1) : 0 }; });
  ok('sound: every note of the waltz was handed to the audio clock before the end, and it is audible', snd.n >= 30 && snd.scheduledToEnd && snd.peak > 0.05 && snd.peak < 0.99, snd);
  await page.waitForTimeout(600);
  await shot('bow');
  await until(() => window.__nut.G.phase === 'finale' && !window.__nut.Dance.active, 60000, 'after the dance');
  const after = await ev(() => { const n = window.__nut, L = n.Snow.W.lights, B = n.Dance.base; return { corps: n.Corps.group.visible, fx: n.Dance.fx.root.visible, lights: Math.abs(L.hemi.intensity - B.hemi) < 1e-6 && Math.abs(L.key.intensity - B.key) < 1e-6, skip: document.getElementById('danceSkip').hidden, gate: n.Snow.W.gate.open }; });
  ok('after the dance: corps gone, stage light faded, the forest light back, gate not yet open', !after.corps && !after.fx && after.lights && after.skip && after.gate === 0, after);
  await ev(() => { window.__nut.DEBUG.timeScale = 3; });
  await until(() => window.__nut.Snow.W.gate.open > 0.99, 120000, 'gate opens');
  const swept = await ev(() => window.__nut.Snow.goal.filter((g) => g === 1).length === window.__nut.Snow.N);
  ok('finale after the dance: the whole path lit, then the gate opens', swept);
  await until(() => window.__nut.G.mode === 'clear', 120000, 'clear card');
  const fin = await ev(() => { const n = window.__nut; return { saved: !!n.Save.data.done.snow, unlocked: n.Save.data.unlocked }; });
  ok('clear card and save as before', fin.saved && fin.unlocked >= 4, fin);
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });

  /* 6. skip: from the button, mid-dance */
  await toFinale(1);
  await until(() => window.__nut.Dance.running, 300000, 'dance running again');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await page.waitForTimeout(1500);
  const sk0 = await ev(() => { const b = document.getElementById('danceSkip').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, inside: b.left >= 0 && b.right <= innerWidth && b.bottom <= innerHeight && b.width > 40 }; });
  ok('skip button is on screen and big enough to tap', sk0.inside, sk0);
  await page.mouse.click(sk0.x, sk0.y);
  await until(() => !window.__nut.Dance.running, 20000, 'skip ends the dance');
  const sk1 = await ev(() => { const n = window.__nut; return { music: n.DanceMusic.running, beta: n.Dance.beta, skipped: !!n.Dance.skipped }; });
  ok('skip: the music stops and the dancers go to the last picture', !sk1.music && sk1.beta > 62 && sk1.skipped, sk1);
  await ev(() => { window.__nut.DEBUG.timeScale = 3; });
  await until(() => window.__nut.G.mode === 'clear', 120000, 'clear after skip');
  ok('skip: the finale still opens the gate and ends on the clear card', await ev(() => window.__nut.Snow.W.gate.open > 0.99 && window.__nut.G.mode === 'clear'));
  await ev(() => { window.__nut.DEBUG.timeScale = 1; window.__nut.Story.toTitle(); });
  await page.waitForTimeout(800);
  const lv = await ev(() => { const n = window.__nut; return { dance: n.Dance.active, music: n.DanceMusic.running, corps: n.Corps.group.visible, fx: n.Dance.fx.root.visible, hold: !!n.Sound.hold }; });
  ok('leaving: nothing of the dance lingers', !lv.dance && !lv.music && !lv.corps && !lv.fx && !lv.hold, lv);

  /* 7. the player's own recording (only when a file is given; it never goes into the game files) */
  const FILE = process.env.LOCAL_WALTZ;
  if (FILE && fs.existsSync(FILE)) {
    await page.setInputFiles('#danceFile', FILE);
    await page.waitForFunction(() => !!window.__nut.DanceMusic.local, null, { timeout: 15000 }).catch(() => {});
    const r = await ev(async () => {
      const D = window.__nut.DanceMusic, p = await D.prepare(), B = D.localBuf;
      if (!B) return { p };
      const c = B.buf.getChannelData(0), sr = B.buf.sampleRate, o = B.offset;
      const rms = (a, b) => { let s = 0, k = 0; for (let i = Math.floor(a * sr); i < Math.floor(b * sr); i++) { s += c[i] * c[i]; k++; } return 20 * Math.log10(Math.sqrt(s / Math.max(1, k)) + 1e-9); };
      return { p, dur: +B.buf.duration.toFixed(1), offset: +o.toFixed(2), hush: +rms(o - 0.9, o - 0.3).toFixed(1), start: +rms(o + 0.05, o + 0.7).toFixed(1), bars: D.bars.length - 1, state: document.getElementById('danceMusicState').textContent };
    });
    ok('own recording: stored on this device and used for the dance, only the excerpt decoded', r.p && r.p.source === 'local' && r.dur > 60 && r.dur < 90 && r.bars === 64 && r.state === '내 기기 음원', r);
    ok('own recording: the excerpt starts right after the hush, where the beat map begins', r.hush < r.start - 6, { hush: r.hush, start: r.start, offset: r.offset });
    await ev(() => document.getElementById('btnDanceMusic').click());
    await page.waitForFunction(() => !window.__nut.DanceMusic.local, null, { timeout: 15000 }).catch(() => {});
    ok('own recording: one tap returns to the built-in performance', await ev(async () => !window.__nut.DanceMusic.local && !(await window.__nut.MediaStore.get('danceAudio'))));
  } else console.log('SKIP own recording (set LOCAL_WALTZ to a file to test it)');

  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
