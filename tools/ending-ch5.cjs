// Chapter V ending: the dream scatters, the mansion comes back with the pink settee carried in front of the tree, Clara asleep with the nutcracker under a blanket,
// the camera comes down, she wakes and sits up, the dialogue, the final card, and everything put back where the story had it when the gala is left.
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: process.env.VIEW === 'mobile' ? 'end5m' : 'end5', mobile: process.env.VIEW === 'mobile' });
  const { ev, shot, until, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };

  /* the room as the story has it before the gala */
  const before = await ev(() => {
    const n = window.__nut, S = n.World.W1.settee;
    return { sofa: [S.pivot.position.x, S.pivot.position.z].map((v) => +v.toFixed(2)), sofaYaw: S.pivot.rotation.y, tree: n.World.W1.tree.lit, claraS: n.clara.root.scale.x, claraY: n.clara.root.position.y, nutS: n.nut.root.scale.x, claraVis: n.clara.root.visible, nutVis: n.nut.root.visible, children: n.scene.children.length };
  });
  ok('before the gala the settee stands in its corner (as a piece of its own), the tree is dark', before.sofa[0] === -12.15 && before.sofa[1] === 2.6 && before.sofaYaw === 0 && before.tree === 0, before);

  /* the ending on its own, as the last act hands over to it: three finished acts, the whole gala */
  await ev(async () => {
    const n = window.__nut, P = n.Palace;
    n.DEBUG.timeScale = 3;
    await P.preview(2, innerWidth < innerHeight ? 'showPhone' : 'show', false);
    P.only = -1; P.results = [{ stars: 3 }, { stars: 2 }, { stars: 3 }]; P.galaT = 150; P.showing = true; n.G.mode = 'cutscene';
    P.shot = P.snapshot(); n.PalaceEnding.play(P);
  });
  await until(() => window.__nut.G.phase === 'ending' && window.__nut.Palace.ending && window.__nut.World.W1.root.visible, 240000, 'the mansion is shown');
  await page.waitForTimeout(600);
  const room = await ev(() => {
    const n = window.__nut, S = n.World.W1.settee, P = n.Palace, E = n.PalaceEnding;
    return { mansion: n.World.W1.root.visible, stage: P.W.root.visible, chapter: n.G.chapter, mode: n.G.mode, sofa: [S.pivot.position.x, S.pivot.position.z].map((v) => +v.toFixed(2)), sofaYaw: +S.pivot.rotation.y.toFixed(2), tree: n.World.W1.tree.lit,
      clara: n.clara.root.visible, lying: +n.clara.root.rotation.x.toFixed(2), claraPos: [n.clara.root.position.x, n.clara.root.position.y, n.clara.root.position.z].map((v) => +v.toFixed(2)), nut: n.nut.root.visible, nutS: +n.nut.root.scale.x.toFixed(2),
      blanket: !!E.blanket && E.blanket.visible && !!E.blanket.parent, camY: +n.camera.position.y.toFixed(1), music: n.Sound.current || '' };
  });
  ok('the mansion is back and the gala\'s stage is away; the settee has been carried in front of the tree and turned to face the room; the tree is lit', room.mansion && !room.stage && room.chapter === 5 && room.mode === 'cutscene' && Math.abs(room.sofa[0]) < 0.01 && Math.abs(room.sofa[1] - -2.75) < 0.01 && Math.abs(room.sofaYaw - -1.57) < 0.02 && room.tree === 1, room);
  ok('Clara lies on her back on the settee (on the seat, between its arms) with the nutcracker and a blanket', room.clara && Math.abs(room.lying - -1.57) < 0.02 && room.claraPos[1] > 0.8 && room.claraPos[1] < 1.1 && Math.abs(room.claraPos[2] - -2.75) < 0.3 && Math.abs(room.claraPos[0]) < 1.6 && room.nut && room.nutS === 0.34 && room.blanket, room);
  await shot('1-room');
  await until(() => document.getElementById('dlgText') && /호두까기 인형을 꼭 안은/.test(document.getElementById('dlgText').textContent), 240000, 'the first line');
  await page.waitForTimeout(300);
  await shot('2-sleeping');
  const lines = [];
  const seen = await (async () => {
    const t0 = Date.now(); let last = '';
    while (Date.now() - t0 < 300000) {
      await ev(() => { const n = window.__nut; if (n.UI.dlg.open) { n.UI.advance(); n.UI.advance(); } });
      const txt = await ev(() => (document.getElementById('dlgText') || {}).textContent || '');
      if (txt && txt !== last && !/호두까기 인형을 꼭 안은/.test(txt) && !lines.includes(txt)) { lines.push(txt); }
      const sit = await ev(() => window.__nut.PalaceEnding.sit);
      if (sit > 0.9 && !seen_sit) { seen_sit = true; await shot('3-sitting'); }
      if (await ev(() => window.__nut.G.mode === 'clear')) return true;
      last = txt; await page.waitForTimeout(150);
    }
    return false;
  })();
  var seen_sit;
  ok('she wakes, sits up and the story goes on to the card', seen && lines.length >= 3, { lines: lines.length });
  const sat = await ev(() => { const n = window.__nut; return { sit: n.PalaceEnding.sit, rx: +n.clara.root.rotation.x.toFixed(2), y: +n.clara.root.position.y.toFixed(2) }; });
  ok('at the end she sits up on the seat, facing the room', sat.sit === 1 && Math.abs(sat.rx) < 0.02 && sat.y > 0.2 && sat.y < 0.45, sat);
  const clr = await ev(() => { const n = window.__nut, q = (id) => document.getElementById(id); return { kicker: q('clrKicker').textContent, title: q('clrTitle').textContent, stats: [...document.querySelectorAll('#clrStats div')].map((d) => [d.children[0].textContent, d.children[1].textContent]), saved: n.Save.data.done.palace, unlock: q('clrUnlock').textContent }; });
  ok('the final card: the chapter ends, one line for each act with its stars, the result saved', clr.kicker === '제5장 · 이야기 끝' && clr.title === '꿈에서 깨어나다' && clr.stats.length === 3 && clr.stats[0][1] === '★★★' && clr.stats[1][1] === '★★☆' && clr.stats[2][1] === '★★★' && clr.saved && clr.saved.stars === 8 && clr.saved.max === 9 && /클라라의 크리스마스 이야기/.test(clr.unlock), clr);
  await shot('4-card');

  /* leaving puts everything back where the story had it */
  await ev(() => { document.getElementById('btnClearMap').click(); });
  await page.waitForTimeout(900);
  const back = await ev(() => {
    const n = window.__nut, S = n.World.W1.settee;
    return { sofa: [S.pivot.position.x, S.pivot.position.z].map((v) => +v.toFixed(2)), sofaYaw: S.pivot.rotation.y, tree: n.World.W1.tree.lit, claraS: n.clara.root.scale.x, claraRx: +n.clara.root.rotation.x.toFixed(3), claraOrder: n.clara.root.rotation.order, nutS: n.nut.root.scale.x, nutOrder: n.nut.root.rotation.order, children: n.scene.children.length, gift: [n.World.W1.props.gift.grp.position.x, n.World.W1.props.gift.grp.position.z], giftOn: n.World.W1.props.gift.col.on, blanket: n.PalaceEnding.blanket ? !!n.PalaceEnding.blanket.parent : false, ending: n.Palace.ending, on: n.PalaceEnding.on };
  });
  ok('leaving the gala: the settee is back in its corner, the tree dark again, Clara and the nutcracker as they were, the blanket gone', back.sofa[0] === -12.15 && back.sofa[1] === 2.6 && back.sofaYaw === 0 && back.tree === 0 && back.claraS === before.claraS && Math.abs(back.claraRx) < 0.001 && back.claraOrder === 'XYZ' && back.nutS === before.nutS && back.nutOrder === 'XYZ' && !back.blanket && !back.ending && !back.on && back.children <= before.children + 1 && back.gift[0] === 0 && back.gift[1] === -1.7 && back.giftOn, { before, back });
  await shot('5-map');

  /* the gala can be played again from its last card too */
  await ev(() => { const n = window.__nut; n.DEBUG.timeScale = 1; n.Recital.auto = null; n.Palace.results = [{ stars: 3 }]; n.PalaceEnding.on = false; n.Palace.start(); });
  await until(() => window.__nut.Recital.running && window.__nut.Recital.game === window.__nut.PalaceShow, 300000, 'act I again');
  const again = await ev(() => { const n = window.__nut; return { phase: n.G.phase, act: n.Palace.actNo, stage: n.Palace.W.root.visible, mansion: n.World.W1.root.visible, ending: n.Palace.ending, asleep: n.PalaceShow.D.every((d) => d.st === 0) }; });
  ok('playing the gala again: act I starts on the stage, the dancers asleep', again.phase === 'show' && again.act === 0 && again.stage && !again.mansion && !again.ending && again.asleep, again);

  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
