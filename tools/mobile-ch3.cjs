// Chapter III on phone-sized screens: layout, no horizontal scroll, and real touch events reaching the judge.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'm3', mobile: true });
  const { ev, shot, until, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };
  const layout = () => ev(() => {
    const r = document.getElementById('rhCv').getBoundingClientRect(), hud = document.getElementById('hud').getBoundingClientRect(), objective = document.getElementById('objective').getBoundingClientRect();
    return { vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sh: document.documentElement.scrollHeight, lanes: { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), w: Math.round(r.width) }, hudBottom: Math.round(objective.bottom), canvasPx: [document.getElementById('rhCv').width, document.getElementById('rhCv').height] };
  });

  await ev(() => { const n = window.__nut; n.Save.data.unlocked = 3; n.Story.mapSel = 2; n.Story.openMap(); });
  await page.waitForTimeout(800);
  await shot('map');
  const mp = await ev(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, btn: document.getElementById('btnPlayChapter').getBoundingClientRect().width > 0 }));
  ok('portrait: the chapter map has no horizontal scroll', mp.sw === mp.cw && mp.btn, mp);
  await ev(() => { window.__nut.Rhythm.auto = null; document.getElementById('btnPlayChapter').click(); });
  await until(() => window.__nut.G.chapter === 3 && window.__nut.G.mode === 'cutscene', 300000, 'chapter III opens');
  await page.waitForTimeout(500);
  /* the opening shot must have Clara and the prince on a tall phone screen (it once looked past them) */
  const fr = await ev(() => {
    const n = window.__nut, V = n.camera.position.constructor, v = new V(), out = {};
    n.camera.updateMatrixWorld(true);
    for (const k of ['clara', 'prince']) { n[k].root.getWorldPosition(v); const p = v.clone(); p.y += 0.6; p.project(n.camera); out[k] = { x: +p.x.toFixed(2), y: +p.y.toFixed(2), front: p.z < 1 }; }
    return out;
  });
  ok('portrait: the opening shot has Clara and the prince on screen', ['clara', 'prince'].every((k) => fr[k].front && Math.abs(fr[k].x) <= 0.8 && Math.abs(fr[k].y) <= 0.8), fr);
  await shot('opening');
  await ev(() => { window.__nut.DEBUG.timeScale = 3; });
  await until(() => window.__nut.G.phase === 'rhythm' && window.__nut.G.mode === 'play', 300000, 'rhythm');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await page.waitForTimeout(500);
  const a = await layout();
  ok('portrait 390x844: no horizontal or vertical scroll', a.sw === a.cw && a.sh <= a.vh + 1, a);
  ok('portrait: the lane field sits inside the screen, full width, below the HUD', a.lanes.l >= 0 && a.lanes.r <= a.vw && a.lanes.w >= a.vw - 24 && a.lanes.t >= a.hudBottom, a.lanes);
  ok('portrait: three lanes are at least 110 px wide (big touch targets)', a.lanes.w / 3 >= 110, { laneW: +(a.lanes.w / 3).toFixed(1) });
  await page.waitForTimeout(1200);
  await shot('count-in');

  /* real touch events on the canvas, each one aimed 50 ms before its note and stamped with the intended time */
  const tapped = await ev(() => new Promise((res) => {
    // slow screenshots can let the first notes pass before the taps start, so only aim at notes still ahead of the song
    const R = window.__nut.Rhythm, cv = R.cv, out = [], picks = R.notes.filter((n) => n.state === 'wait' && n.rel > R.rel() + 0.5).slice(0, 12);
    let k = 0;
    const next = () => {
      if (k >= picks.length) return res(out);
      const n = picks[k], intended = n.rel - 0.05, now = R.rel();
      if (now < intended) return setTimeout(next, 4);
      const r = cv.getBoundingClientRect(), g = R.geom();
      const e = new PointerEvent('pointerdown', { pointerId: 10 + k, pointerType: 'touch', clientX: r.left + g.pad + (n.lane + 0.5) * g.laneW, clientY: r.top + r.height * 0.7, bubbles: true, cancelable: true });
      Object.defineProperty(e, 'timeStamp', { value: performance.now() - Math.min(0.25, now - intended) * 1000 });
      cv.dispatchEvent(e); out.push({ i: n.i, lane: n.lane, state: n.state }); k++;
      setTimeout(next, 4);
    };
    next();
  }));
  const hits = tapped.filter((t) => t.state === 'perfect' || t.state === 'good').length;
  ok('touch: 12 real pointer events judged through the lanes', tapped.length === 12 && hits >= 11, { hits, of: tapped.length, states: tapped.map((t) => t.state[0]).join('') });
  await shot('after-taps');
  const st = await ev(() => ({ ...window.__nut.Rhythm.stats, opened: window.__nut.Snow.opened }));
  ok('touch: hits opened the path (progress moved)', st.opened >= hits * 0.5 && st.perfect + st.good >= hits, st);
  const scr = await ev(() => { const e = new PointerEvent('pointerdown', { pointerId: 99, pointerType: 'touch', bubbles: true, cancelable: true, clientX: 10, clientY: 10 }); const c = document.getElementById('rhCv'); c.dispatchEvent(e); return e.defaultPrevented; });
  ok('touch: taps on the lanes do not scroll or zoom the page', scr === true);

  /* smaller and wider phones */
  for (const [w, hgt, label] of [[320, 568, 'small phone 320x568'], [844, 390, 'landscape phone 844x390'], [768, 1024, 'tablet 768x1024']]) {
    await page.setViewportSize({ width: w, height: hgt });
    await page.waitForTimeout(1500);
    const b = await layout();
    const inside = b.lanes.l >= 0 && b.lanes.r <= b.vw && b.lanes.t >= 0 && b.lanes.b <= b.vh + 1;
    ok(`${label}: no horizontal scroll, lanes inside the screen`, b.sw === b.cw && inside, b);
    ok(`${label}: canvas resolution follows the new size`, Math.abs(b.canvasPx[0] / (await ev(() => window.__nut.Rhythm.dpr)) - b.lanes.w) < 2, b.canvasPx);
    await shot('r' + w);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
