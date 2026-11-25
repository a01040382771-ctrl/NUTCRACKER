// Focused checks for chapter II toys: riding the carousel, the bounce drum, piano keys.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'ph' });
  const { ev, until, page } = h;
  await ev(() => { const n = window.__nut; n.Save.data.unlocked = 2; n.DEBUG.timeScale = 4; n.Toy.start(); });
  await until(() => window.__nut.G.phase === 'explore' && window.__nut.G.mode === 'play', 300000, 'explore');
  await ev(() => { const n = window.__nut; n.DEBUG.timeScale = 1; n.TG.tier = 4; n.Toy.W.gates.forEach((g) => g.set(1)); });
  // game-time sampler: records values every frame inside the page
  const sample = (expr, frames) => page.evaluate(([e, f]) => new Promise((res) => { const out = []; const fn = new Function('n', 'return ' + e); let i = 0; const step = () => { out.push(fn(window.__nut)); if (++i >= f) res(out); else requestAnimationFrame(step); }; step(); }), [expr, frames]);
  // carousel: stand on the platform, measure angular travel around the pole
  await ev(() => { const n = window.__nut, C = n.Toy.W.carousel; n.player.pos.set(C.center.x + 2.0, 0.6, C.center.z + 0.6); n.player.vy = 0; n.player.groundCol = null; });
  await page.waitForTimeout(1500);
  const car = await sample("({ on: n.player.groundCol === n.Toy.W.carousel.platCol, a: Math.atan2(n.player.pos.x - n.Toy.W.carousel.center.x, n.player.pos.z - n.Toy.W.carousel.center.z), ca: n.Toy.W.carousel.a, y: n.player.pos.y })", 40);
  const on = car.filter((s) => s.on).length;
  const da = car[car.length - 1].a - car[0].a, dca = car[car.length - 1].ca - car[0].ca;
  console.log('carousel: frames on platform', on, '/', car.length, ' clara turned', da.toFixed(3), 'platform turned', dca.toFixed(3), 'y', car[car.length - 1].y.toFixed(2));
  // drum: drop from 2 units above it, record the highest point of the bounce
  await ev(() => { const n = window.__nut, D = n.Toy.W.drum.pos; n.player.pos.set(D.x, 1.6, D.z); n.player.vy = 0; n.player.groundCol = null; n.player.grounded = false; });
  const drum = await sample('n.player.pos.y', 120);
  console.log('drum: lowest', Math.min(...drum).toFixed(2), 'highest after landing', Math.max(...drum.slice(drum.indexOf(Math.min(...drum)))).toFixed(2));
  // piano: land on key 3 and watch it sink
  await ev(() => { const n = window.__nut, k = n.Toy.W.piano.keys[3]; n.player.pos.set(k.x, k.top + 0.6, k.z); n.player.vy = 0; n.player.groundCol = null; n.player.grounded = false; });
  const keys = await sample('({ press: n.Toy.W.piano.keys[3].press, y: n.player.pos.y, g: n.player.grounded })', 60);
  console.log('piano key: max press', Math.max(...keys.map((k) => k.press)).toFixed(2), 'clara y', keys[keys.length - 1].y.toFixed(2), 'grounded', keys[keys.length - 1].g);
  await h.finish();
})();
