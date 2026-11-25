// Plays chapter II from the first line of dialogue to the clear screen through the debug hook.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'c2', mobile: process.env.VIEW === 'mobile' });
  const { ev, shot, until, page, state } = h;
  const fast = (n) => ev((v) => { window.__nut.DEBUG.timeScale = v; }, n);
  const act = () => ev(() => { window.__nut.Input.act = true; });
  const tp = (x, y, z) => ev(([a, b, c]) => { const n = window.__nut; n.player.pos.set(a, b, c); n.player.vy = 0; n.player.vel.set(0, 0, 0); n.player.groundCol = null; }, [x, y, z]);
  const explore = (label) => until(() => { const n = window.__nut; return n.G.phase === 'explore' && n.G.mode === 'play'; }, 300000, label);
  // stand right next to a piece (works for pieces riding a train, a carousel or a stage)
  const grab = async (id) => {
    const ok = await until((pid) => {
      const n = window.__nut, pc = n.Toy.pieces[pid];
      if (n.TG.found[pid]) return true;
      if (pc.state === 'world' && !(pid === 'wingR' && pc.ride) && n.G.mode === 'play') { const p = pc.holder.position; n.player.pos.set(p.x, Math.max(0, p.y - 0.8), p.z); n.player.vy = 0; n.player.vel.set(0, 0, 0); }
      return false;
    }, 120000, 'grab ' + id, id);
    console.log('grab', id, ok);
  };
  const lectern = async () => {
    await explore('before lectern');
    await tp(0, 0, 2.75); await page.waitForTimeout(400); await act();
    await until(() => window.__nut.G.mode === 'build', 30000, 'build mode');
  };
  // build mode runs on game time, so wait on its state rather than the clock
  const B = () => ev(() => { const b = window.__nut.Build; return { sel: b.sel, stage: b.stage, busy: b.busy }; });
  const idle = (label) => until(() => { const b = window.__nut.Build; return !b.busy && b.stage !== 'snap'; }, 30000, label);
  const placeAll = async (order, wrongFirst) => {
    await ev(() => { window.__nut.DEBUG.timeScale = 3; });
    for (const id of order) {
      await idle('idle before ' + id);
      await ev((pid) => window.__nut.Build.select(pid), id);
      await until((pid) => window.__nut.Build.sel === pid, 20000, 'select ' + id, id);
      if (wrongFirst) {
        const other = order.find((o) => o !== id);
        await ev((pid) => window.__nut.Build.trySlot(pid), other);
        await page.waitForTimeout(100);
        console.log('wrong slot message:', await ev(() => document.getElementById('bdMsg').textContent));
        await idle('bonk');
        wrongFirst = false;
      }
      await ev((pid) => window.__nut.Build.trySlot(pid), id);
      await until((pid) => { const n = window.__nut, b = n.Build; return n.TG.placed[pid] || (!b.busy && b.stage === 'hover') || b.stage === 'snap'; }, 30000, 'flight ' + id, id);
      for (let i = 0; i < 4; i++) {
        const st = await B();
        if (st.stage !== 'hover' || st.busy) break;
        await ev(() => window.__nut.Build.rotate(1));
        await until(() => { const b = window.__nut.Build; return !b.busy || b.stage === 'snap'; }, 20000, 'rotate');
      }
      await until((pid) => !!window.__nut.TG.placed[pid], 30000, 'placed ' + id, id);
      console.log('placed', id);
    }
    await ev(() => { window.__nut.DEBUG.timeScale = 1; });
  };

  await ev(() => { const n = window.__nut; n.Save.data.unlocked = 2; n.DEBUG.timeScale = 4; n.Toy.start(); });
  await explore('intro');
  await fast(1);
  await page.waitForTimeout(1200);
  await shot('explore');

  /* ---- tier 1: the plaza ---- */
  await grab('gate');
  await grab('stairs');
  await tp(-6.7, 0, 4.5); await page.waitForTimeout(300); await act();
  await page.waitForTimeout(2200);
  await grab('base');
  await page.waitForTimeout(800);
  await shot('followers');
  await lectern();
  await page.waitForTimeout(800);
  await shot('build-open');
  await ev(() => window.__nut.Build.select('base'));
  await until(() => window.__nut.Build.sel === 'base', 20000, 'select base');
  await page.waitForTimeout(1500);
  await shot('build-select');
  await placeAll(['base', 'gate', 'stairs'], true);
  await shot('build-tier1');
  await fast(4);
  await explore('tier1 cutscene');
  await fast(1);
  console.log('after tier1', JSON.stringify(await state()), 'gateA open', await ev(() => window.__nut.Toy.W.gates[0].open));

  /* ---- tier 2: the train village ---- */
  await tp(-19.4, 1.6, -4.1); await page.waitForTimeout(300); // crate top
  await grab('wingL');
  await tp(-31.3, 0, -6.8); await page.waitForTimeout(400); await act();
  await fast(3);
  await until(() => window.__nut.TG.crane === 1 && !window.__nut.Toy.pieces.wingR.ride && window.__nut.G.mode === 'play', 120000, 'crane');
  await fast(1);
  await grab('wingR');
  // wait for the train to halt at the station, step onto the flat car and ride it
  await until(() => window.__nut.Toy.W.train.halt > 0.5, 90000, 'train halt');
  await page.waitForTimeout(300);
  await ev(() => { const n = window.__nut, car = n.Toy.W.train.cars[1]; n.player.pos.set(car.g.position.x, 0.7, car.g.position.z); n.player.vy = 0; });
  await page.waitForTimeout(400);
  await shot('train-ride');
  await until(() => window.__nut.Toy.W.train.v > 1.0, 90000, 'train moving');
  const ride0 = await ev(() => ({ x: window.__nut.player.pos.x, col: !!window.__nut.player.groundCol }));
  await page.waitForTimeout(2500);
  const ride1 = await ev(() => ({ x: window.__nut.player.pos.x, z: window.__nut.player.pos.z, found: !!window.__nut.TG.found.colon }));
  console.log('train ride', JSON.stringify(ride0), '->', JSON.stringify(ride1));
  await grab('colon');
  await lectern();
  await placeAll(['wingL', 'wingR', 'colon']);
  await fast(4);
  await explore('tier2 cutscene');
  await fast(1);

  /* ---- tier 3: carousel square ---- */
  await grab('towerL');
  const spin = await ev(() => { const n = window.__nut; return { col: n.player.groundCol === n.Toy.W.carousel.platCol, y: n.player.pos.y }; });
  console.log('on carousel', JSON.stringify(spin));
  // bounce drum: drop Clara onto it
  await tp(25.9, 2.0, -8.4); await page.waitForTimeout(120);
  let peak = 0; for (let i = 0; i < 12; i++) { peak = Math.max(peak, await ev(() => window.__nut.player.pos.y)); await page.waitForTimeout(60); }
  console.log('drum bounce peak', peak.toFixed(2));
  await tp(30.4, 3.2, -8.0);
  await grab('towerR');
  // get caught once by a sentry on purpose
  await ev(() => { const n = window.__nut, s = n.Toy.sentries[0]; n.player.pos.set(s.pos.x + Math.sin(s.yaw) * 2.2, 0, s.pos.z + Math.cos(s.yaw) * 2.2); });
  await page.waitForTimeout(300);
  await shot('spotted');
  await until(() => window.__nut.TG.caught >= 1, 20000, 'caught');
  await fast(3);
  await explore('after caught');
  await fast(1);
  console.log('caught', JSON.stringify(await ev(() => ({ caught: window.__nut.TG.caught, x: window.__nut.player.pos.x.toFixed(1), z: window.__nut.player.pos.z.toFixed(1) }))));
  // sneak: park the sentries far away for the test, then take the arch
  await ev(() => { const n = window.__nut; n.Toy.sentries.forEach((s) => { s.pos.set(24, 0, 3); s.state = 'wait'; s.t = 30; s.baseYaw = Math.PI; }); });
  await grab('arch');
  await lectern();
  await placeAll(['towerL', 'towerR', 'arch']);
  await fast(4);
  await explore('tier3 cutscene');
  await fast(1);

  /* ---- tier 4: music-box garden ---- */
  await tp(-8.0, 3.0, 21.8);
  await grab('spire');
  await tp(-8.0, 0.78, 14.45); await page.waitForTimeout(300);
  console.log('piano key press', await ev(() => window.__nut.Toy.W.piano.keys[1].press.toFixed(2)));
  for (let i = 0; i < 3; i++) { await tp(3.7, 0, 22.5); await page.waitForTimeout(500); await act(); await page.waitForTimeout(1300); }
  await fast(3);
  await explore('music box');
  await fast(1);
  await shot('musicbox-open');
  await grab('dome');
  // star: stand on the revolving stage and jump
  await ev(() => { const n = window.__nut, M = n.Toy.W.musicBox; n.player.pos.set(M.pos.x + 0.75, M.stage.position.y + 0.2, M.pos.z); n.player.vy = 0; });
  await page.waitForTimeout(500);
  console.log('on stage', JSON.stringify(await ev(() => { const n = window.__nut; return { stage: n.player.groundCol === n.Toy.W.musicBox.stageCol, y: n.player.pos.y.toFixed(2) }; })));
  await ev(() => { window.__nut.player.jumpBuf = 0.2; });
  await page.waitForTimeout(900);
  console.log('star by jumping', await ev(() => !!window.__nut.TG.found.star));
  await grab('star');
  await lectern();
  // prerequisite check: the star cannot go up before the dome
  await ev(() => window.__nut.Build.select('star'));
  await until(() => window.__nut.Build.sel === 'star', 20000, 'select star');
  await ev(() => window.__nut.Build.trySlot('star'));
  await page.waitForTimeout(150);
  console.log('prereq message:', await ev(() => document.getElementById('bdMsg').textContent));
  await idle('prereq bonk');
  await placeAll(['dome', 'spire', 'star']);
  await fast(4);
  await until(() => window.__nut.G.phase === 'portal2' && window.__nut.G.mode === 'play', 300000, 'finale');
  await fast(1);
  await page.waitForTimeout(1000);
  await shot('palace-done');
  await tp(0, 0, 5.6);
  await until(() => window.__nut.G.mode === 'clear', 120000, 'clear');
  await page.waitForTimeout(1500);
  await shot('clear');
  console.log('FINAL', JSON.stringify(await ev(() => { const n = window.__nut; return { mode: n.G.mode, placed: Object.keys(n.TG.placed).length, caught: n.TG.caught, time: Math.round(n.G.time), save: n.Save.data.done.toys, unlocked: n.Save.data.unlocked }; })));
  await ev(() => { document.getElementById('btnClearMap').click(); });
  await page.waitForTimeout(1500);
  await shot('map');
  await h.finish();
})();
