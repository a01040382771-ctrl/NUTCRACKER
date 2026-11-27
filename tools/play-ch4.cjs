// Plays chapter IV from the chapter map to the clear card: the intro, walking up to each stage, the three rehearsals with the
// built-in autoplay (judged through the same code as real input), pause in the middle of a song, the decorations, the finale and the save.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'c4', mobile: process.env.VIEW === 'mobile' });
  const { ev, shot, until, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };
  const key = (k, code) => ev(([k, code]) => { window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code, bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { key: k, code, bubbles: true })); }, [k, code]);

  /* 1. the chapter map: chapter IV is listed, unlocked and playable; chapter V (the dream gala) is open as well */
  await ev(() => { const n = window.__nut; n.Save.data.unlocked = 4; delete n.Save.data.ch4; n.Story.mapSel = 3; n.Story.openMap(); });
  await page.waitForTimeout(700);
  const map = await ev(() => ({ title: document.getElementById('mapTitle').textContent, stats: document.getElementById('mapStats').textContent, btn: document.getElementById('btnPlayChapter').textContent, disabled: document.getElementById('btnPlayChapter').disabled, veil: !document.getElementById('mapLock').hidden, toc: [...document.querySelectorAll('.toc-state')].map((e) => e.textContent) }));
  ok('map: chapter IV is playable and lists its three rehearsals', map.title === '과자의 왕국' && !map.disabled && !map.veil && map.btn === '이야기 펼치기' && /리허설 3개/.test(map.stats) && map.toc[3] === '춤 리허설 3개' && map.toc[4] === '꿈의 대공연', map);
  await shot('map');

  /* 2. the intro, then walking in the avenue */
  await ev(() => { window.__nut.DEBUG.timeScale = 3; document.getElementById('btnPlayChapter').click(); });
  await until(() => window.__nut.G.chapter === 4 && window.__nut.G.mode === 'cutscene', 240000, 'chapter IV opens');
  const st = await ev(() => { const n = window.__nut; return { sweet: n.Sweet.W.root.visible, mansion: n.World.W1.root.visible, title: document.getElementById('plTitle').textContent, max: document.getElementById('cntMax').textContent }; });
  ok('start: the kingdom is on stage and the HUD belongs to chapter IV', st.sweet && !st.mansion && st.title === '과자의 왕국' && st.max === '/ 3', st);
  await until(() => window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 300000, 'explore');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await page.waitForTimeout(600);
  const ex = await ev(() => { const n = window.__nut; return { obj: document.getElementById('objText').textContent, fairy: n.fairyBig.root.visible, prince: n.prince.root.visible, controls: document.getElementById('controls').hidden, marker: n.Sweet.W && true }; });
  ok('explore: the objective counts the rehearsals and the fairy has gone ahead to her palace', ex.obj === '세 무대의 춤 리허설 돕기 0 / 3' && !ex.fairy && ex.prince, ex);
  await shot('explore');

  /* 3. each rehearsal: walk to the stage, press the action key, play it with the autoplay */
  const expect = await ev(() => {
    const n = window.__nut, C = n.SWEET_CFG.choco, plan = { good: 0.25, fail: [1] }, out = { perfect: 0, good: 0, miss: 0, ok: 0 };
    C.patterns.forEach((p, r) => {
      const notes = p.replace(/[^CS]/g, '').length;
      if (plan.fail.includes(r)) { out.miss += notes; return; }
      out.ok++;
      for (let i = 0; i < notes; i++) (((r * 7 + i) * 19) % 100) / 100 < plan.good ? out.good++ : out.perfect++;
    });
    return out;
  });
  const plans = { choco: { good: 0.25, fail: [1] }, coffee: { off: [0, 0.5, 1.2] }, tea: { good: [1], miss: [4] } };
  const cards = {};
  for (const id of ['choco', 'coffee', 'tea']) {
    await ev((id) => { const n = window.__nut, f = n.Sweet.W.stages[id].front; n.player.pos.set(f.x, 0, f.z); n.player.vel.set(0, 0, 0); }, id);
    await page.waitForTimeout(500);
    const near = await ev(() => { const n = window.__nut.Story.near; return n ? { id: n.id, label: typeof n.label === 'function' ? n.label() : n.label } : null; });
    ok(`${id}: standing in front of the stage offers the rehearsal`, near && near.id === id && /리허설 돕기/.test(near.label), near);
    await ev(([plan]) => { const n = window.__nut; n.Recital.auto = plan; n.DEBUG.timeScale = 3; }, [plans[id]]);
    await key('e', 'KeyE');
    await until(() => window.__nut.Recital.running && window.__nut.G.phase === 'rehearse', 120000, id + ' starts');
    await ev(() => { window.__nut.DEBUG.timeScale = 1; });
    const run = await ev(() => { const n = window.__nut; return { clock: n.Recital.clock, overlay: !document.getElementById('recital').hidden, cls: document.getElementById('recital').className, controls: document.getElementById('controls').hidden, locked: n.G.locked, view: !!(n.camera.view && n.camera.view.enabled) || n.Sweet.viewK > 0, bus: !!n.Recital.bus }; });
    ok(`${id}: the rehearsal runs on the audio clock with its own panel, the joystick put away`, run.clock === 'audio' && run.overlay && run.cls === id && run.controls && run.locked && run.bus, run);
    // the music of the rehearsal is really there: the level after the master bus over two seconds of song (after the count-in)
    await until(() => window.__nut.Recital.lastRel > 0.3, 30000, id + ' after the count-in');
    const snd = await ev(() => new Promise((res) => {
      const n = window.__nut, c = n.Sound.ctx, an = c.createAnalyser(); an.fftSize = 2048; n.Sound.master.connect(an);
      const a = new Float32Array(an.fftSize), L = []; let k = 0;
      const iv = setInterval(() => { an.getFloatTimeDomainData(a); let sq = 0, pk = 0; for (const v of a) { sq += v * v; pk = Math.max(pk, Math.abs(v)); } L.push({ rms: Math.sqrt(sq / a.length), pk }); if (++k >= 20) { clearInterval(iv); try { n.Sound.master.disconnect(an); } catch (e) { /* gone */ } res({ n: L.length, peak: +Math.max(...L.map((x) => x.pk)).toFixed(3), loud: L.filter((x) => x.rms > 0.003).length, events: n.Recital.evIdx + (n.Recital.loop ? n.Recital.loop.n * 1000 + n.Recital.loop.idx : 0) }); } }, 100);
    }));
    ok(`${id}: its music is audible and does not clip`, snd.peak > 0.03 && snd.peak < 0.99 && snd.loud >= 8 && snd.events > 3, snd);
    if (id === 'choco') {
      await page.waitForTimeout(5000);
      await shot('choco-play');
      // pause in the middle of the song: the clock and the game stop together, and carry on afterwards
      await key('Escape', 'Escape');
      await page.waitForTimeout(900);
      const p1 = await ev(() => { const n = window.__nut, R = n.Recital; return { mode: n.G.mode, paused: R.paused, ctx: n.Sound.ctx.state, rel: R.rel(), ev: R.evIdx, help: document.getElementById('helpText').textContent }; });
      await page.waitForTimeout(1500);
      const p2 = await ev(() => { const n = window.__nut, R = n.Recital; return { rel: R.rel(), ev: R.evIdx }; });
      ok('pause: game, rehearsal and audio clock are all paused, and nothing moves on', p1.mode === 'paused' && p1.paused && p1.ctx === 'suspended' && Math.abs(p2.rel - p1.rel) < 0.003 && p2.ev === p1.ev, { p1, p2 });
      ok('pause: the controls line explains the two pads, not the walking controls', /캐스터네츠/.test(p1.help) && /발 구르기/.test(p1.help) && !/점프|WASD/.test(p1.help), p1.help);
      await ev(() => { window.__resumeAt = performance.now(); document.getElementById('btnResume').click(); });
      await page.waitForTimeout(800);
      const p3 = await ev(() => { const n = window.__nut, R = n.Recital; return { mode: n.G.mode, paused: R.paused, ctx: n.Sound.ctx.state, rel: R.rel(), hold: !!n.Sound.hold, since: (performance.now() - window.__resumeAt) / 1000 }; });
      // the song moves on by the time since the resume, not by the time spent paused (≥ 1.5 s)
      ok('resume: the song carries on from where it stopped', p3.mode === 'play' && !p3.paused && p3.ctx === 'running' && !p3.hold && p3.rel > p2.rel && p3.rel - p2.rel <= p3.since + 0.2, { before: p2.rel, after: p3.rel, since: p3.since });
    } else { await page.waitForTimeout(6000); await shot(`${id}-play`); }
    await until(() => !document.getElementById('screenRehearse').hidden, 240000, id + ' card');
    cards[id] = await ev(() => ({ title: document.getElementById('rcTitle').textContent, kicker: document.getElementById('rcKicker').textContent, stats: [...document.querySelectorAll('#rcStats div')].map((d) => [d.children[0].textContent, d.children[1].textContent]), main: document.getElementById('btnRcMain').textContent, sub: !document.getElementById('btnRcSub').hidden, overlay: !document.getElementById('recital').hidden }));
    await shot(`${id}-card`);
    ok(`${id}: a passing rehearsal ends on its own result card with the way on to the decoration`, cards[id].title === '리허설 성공!' && cards[id].main === '축제 장식 보기' && !cards[id].sub && !cards[id].overlay, cards[id]);
    if (id === 'choco') ok('choco: the card counts the patterns played back and every note, exactly as planned', cards.choco.stats[0][1] === `${expect.ok} / 6` && cards.choco.stats[1][1] === String(expect.perfect) && cards.choco.stats[2][1] === `${expect.good} · ${expect.miss}`, { want: expect, got: cards.choco.stats });
    if (id === 'coffee') ok('coffee: 100 · 100 · 50 (one shape followed from just outside the ring) is 83% on average', cards.coffee.stats[0][1] === '83%' && cards.coffee.stats[2][1] === '100·100·50', cards.coffee.stats);
    if (id === 'tea') ok('tea: eight cups, seven of them exact, one good and one that slipped off', cards.tea.stats[0][1] === '8 / 8' && cards.tea.stats[1][1] === '7' && cards.tea.stats[2][1] === '1 · 1', cards.tea.stats);
    await ev(() => { window.__nut.DEBUG.timeScale = 3; document.getElementById('btnRcMain').click(); });
    if (id !== 'tea') {
      await until(() => window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 240000, id + ' back to the avenue');
      await ev(() => { window.__nut.DEBUG.timeScale = 1; });
      const after = await ev((id) => { const n = window.__nut, S = n.Sweet; return { done: !!S.done[id], deco: S.W.deco[id], count: S.count(), stars: document.getElementById('starNum').textContent, obj: document.getElementById('objText').textContent, cp: n.Save.data.ch4 && n.Save.data.ch4.done[id], view: !!(n.camera.view && n.camera.view.enabled) }; }, id);
      ok(`${id}: the decoration is up, the counter moves on and the progress is saved`, after.done && after.deco === 1 && after.stars === String(after.count) && after.obj === `세 무대의 춤 리허설 돕기 ${after.count} / 3` && after.cp && after.cp.pass && !after.view, after);
    }
  }
  /* 4. the finale (it follows the third decoration): the candy bridge, the palace lights, the clear card */
  await until(() => window.__nut.G.phase === 'finale', 240000, 'finale');
  const deco = await ev(() => { const W = window.__nut.Sweet.W; return { fountain: W.fountain.on, flags: W.flags.k, star: W.starGlow.material.uniforms.uBoost.value, lantern: W.lanternGlow.material.uniforms.uBoost.value, pagoda: W.pagoda.visible }; });
  ok('decorations: the chocolate fountain flows, pennants fly, star lanterns and paper lanterns glow, the teacup tower stands', deco.fountain === 1 && deco.flags === 1 && deco.star > 1 && deco.lantern > 1 && deco.pagoda, deco);
  await ev(() => { window.__nut.DEBUG.timeScale = 3; });
  await until(() => window.__nut.G.mode === 'clear', 300000, 'clear card');
  await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  await page.waitForTimeout(1000);
  const fin = await ev(() => {
    const n = window.__nut, W = n.Sweet.W, q = (id) => document.getElementById(id);
    return { bridge: W.bridge.k, palace: n.MAT4.palace.emissiveIntensity, kicker: q('clrKicker').textContent, stats: [...document.querySelectorAll('#clrStats div')].map((d) => [d.children[0].textContent, d.children[1].textContent]), next: !q('btnClearNext').hidden, nextLabel: q('btnClearNext').textContent, unlock: q('clrUnlock').textContent, saved: n.Save.data.done.sweets, unlocked: n.Save.data.unlocked, cp: n.Save.data.ch4 || null, shot: n.Sweet.shot.length, raw: JSON.parse(localStorage.getItem('nutcracker-clara-v1')).done.sweets };
  });
  ok('finale: the candy bridge stands over the chocolate river and the palace is lit', fin.bridge === 1 && fin.palace > 0.3, { bridge: fin.bridge, palace: fin.palace });
  ok('clear card: one box per rehearsal, and a button that goes on to chapter V', fin.kicker === '제4장 · 이야기 끝' && fin.stats[0][0] === '캐스터네츠' && fin.stats[0][1] === `${expect.ok} / 6` && fin.stats[1][1] === '83%' && fin.stats[2][1] === '8 / 8' && fin.next && /제5장 · 설탕 요정의 궁전/.test(fin.unlock) && fin.nextLabel === '제5장으로 떠나기', fin.stats);
  ok('save: the chapter is stored as finished, chapter V unlocked and the checkpoint cleared', fin.saved && fin.saved.choco.ok === expect.ok && fin.saved.coffee.pct === 83 && fin.saved.tea.cups === 8 && fin.unlocked >= 5 && fin.cp === null && JSON.stringify(fin.raw) === JSON.stringify(fin.saved) && fin.shot > 1000, { saved: fin.saved, unlocked: fin.unlocked });
  await shot('clear');

  /* 5. the map afterwards, and leaving cleanly */
  await ev(() => { document.getElementById('btnClearMap').click(); });
  await page.waitForTimeout(900);
  const m5 = await ev(() => ({ title: document.getElementById('mapTitle').textContent, lock: document.getElementById('mapLockText').textContent, btn: document.getElementById('btnPlayChapter').textContent, toc: [...document.querySelectorAll('.toc-state')].map((e) => e.textContent) }));
  ok('map: chapter V is open to play, chapter IV shows 3/3', m5.title === '설탕 요정의 궁전' && m5.btn === '이야기 펼치기' && m5.toc[3] === '3/3' && m5.toc[4] === '꿈의 대공연', m5);
  await ev(() => { const n = window.__nut; n.Story.mapSel = 3; n.Story.renderMap(); });
  const m4 = await ev(() => ({ stats: document.getElementById('mapStats').textContent, img: !document.getElementById('mapImg').hidden, btn: document.getElementById('btnPlayChapter').textContent, cont: !document.getElementById('btnContinue').hidden }));
  ok('map: chapter IV shows its result and a picture of the kingdom', /리허설 3 \/ 3/.test(m4.stats) && m4.img && m4.btn === '다시 펼치기' && !m4.cont, m4);
  await shot('map-after');
  const lv = await ev(() => { const n = window.__nut; n.Story.toTitle(); return true; });
  await page.waitForTimeout(800);
  const lv2 = await ev(() => { const n = window.__nut; return { mode: n.G.mode, ch: n.G.chapter, running: n.Recital.running, overlay: !document.getElementById('recital').hidden, view: !!(n.camera.view && n.camera.view.enabled), sweet: n.Sweet.W.root.visible, mansion: n.World.W1.root.visible, ctx: n.Sound.ctx.state, hold: !!n.Sound.hold }; });
  ok('leave: back on the title with the mansion stage, no rehearsal, no panel, no camera offset', lv && lv2.mode === 'title' && lv2.ch === 1 && !lv2.running && !lv2.overlay && !lv2.view && !lv2.sweet && lv2.mansion && lv2.ctx === 'running' && !lv2.hold, lv2);

  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
