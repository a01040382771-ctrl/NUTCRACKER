/* =====================================================================
   16 · BUILD MODE — pick a piece, tap its place on the blueprint, turn it, click!
   ===================================================================== */
const _bt = V3(), _bh = V3();
const Build = {
  on: false, sel: null, stage: 'idle', yaw: 0, pitch: 0.4, yawT: 0, pitchT: 0.4, dist: 18, fails: 0, hint: null, busy: false, drag: null, msgT: 0, bound: false,
  ray: new THREE.Raycaster(), ndc: new THREE.Vector2(),

  bind() {
    if (this.bound) return;
    this.bound = true;
    const cv = $('gl');
    cv.addEventListener('pointerdown', (e) => {
      if (!this.on) return;
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
      try { cv.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
    });
    cv.addEventListener('pointermove', (e) => {
      const d = this.drag;
      if (!this.on || !d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      d.moved += Math.abs(dx) + Math.abs(dy); d.x = e.clientX; d.y = e.clientY;
      if (d.moved > 8) { this.yawT -= dx * 0.009; this.pitchT = clamp(this.pitchT + dy * 0.004, 0.1, 0.95); }
    });
    const up = (e) => { const d = this.drag; if (!d || d.id !== e.pointerId) return; this.drag = null; if (this.on && d.moved <= 8) this.tap(e.clientX, e.clientY); };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', () => { this.drag = null; });
    $('btnBuildExit').addEventListener('click', (e) => { e.preventDefault(); Sound.init(); this.exit(); });
    $('btnRotL').addEventListener('click', (e) => { e.preventDefault(); Sound.init(); this.rotate(1); });
    $('btnRotR').addEventListener('click', (e) => { e.preventDefault(); Sound.init(); this.rotate(-1); });
    window.addEventListener('keydown', (e) => {
      if (!this.on || e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === 'q' || k === 'z') this.rotate(1);
      else if (k === 'e' || k === 'x' || k === 'r') this.rotate(-1);
      else if (k === 'tab') { e.preventDefault(); this.cycle(); }
      else if (/^[1-9]$/.test(k)) { const id = this.trayIds()[+k - 1]; if (id) this.select(id); }
    });
  },
  trayIds() { return Toy.tierIds().filter((id) => TG.found[id] && !TG.placed[id]); },
  target() { return _bt.set(TOY.palace.x, TOY.palace.y + [0, 2.2, 3.0, 4.2, 5.4][Math.min(4, TG.tier)], TOY.palace.z); },

  /* ---------- open / close ---------- */
  enter() {
    if (this.on) return;
    const ids = this.trayIds();
    if (!ids.length) { UI.toast('아직 맞출 조각이 없어요. 반짝이는 조각을 먼저 찾아와요', 2600); return; }
    this.bind();
    this.on = true; this.sel = null; this.stage = 'idle'; this.fails = 0; this.hint = null; this.busy = false;
    G.mode = 'build'; G.locked = true; G.phase = 'build';
    player.vel.set(0, 0, 0); player.yaw = Math.PI;
    UI.prompt(null); UI.hide('controls'); UI.hide('hud'); UI.hide('hint'); UI.show('build');
    $('bdRot').hidden = true;
    for (const id of ids) { const pc = Toy.pieces[id], p = pc.holder.position; burst(p.x, p.y, p.z, { n: 12, speed: 2 }); pc.state = 'tray'; pc.holder.visible = false; }
    Toy.followers = Toy.followers.filter((id) => !ids.includes(id));
    Cam.mode = 'free';
    this.yaw = this.yawT = 0; this.pitch = this.pitchT = 0.4;
    this.render(); this.banner(); Toy.updateGhosts();
    this.say(TG.buildTut ? '아래에서 맞출 조각을 하나 골라요' : '조각을 고르고, 들어갈 자리를 눌러요');
    Sound.sfxChime(); Sound.playMusic('title');
  },
  exit() {
    if (!this.on || this.busy) return;
    this.close();
    for (const id of this.trayIds()) { const pc = Toy.pieces[id]; pc.state = 'follow'; pc.fpos.set(player.pos.x, player.pos.y + 1.5, player.pos.z); Toy.followers.push(id); }
    G.phase = 'explore';
    Story.beginPlay();
    Input.clear();
    Toy.updateGhosts(); Toy.objective();
    Sound.playMusic('toys');
  },
  close() {
    if (!this.on) return;
    this.on = false; this.drag = null;
    if (this.sel) { const pc = Toy.pieces[this.sel]; if (pc.state === 'build') { pc.state = 'tray'; pc.holder.visible = false; } }
    this.sel = null; this.stage = 'idle'; this.busy = false;
    UI.hide('build'); $('bdRot').hidden = true;
  },

  /* ---------- tray & messages ---------- */
  render() {
    const tray = $('bdTray'); tray.textContent = '';
    const ids = this.trayIds();
    if (!ids.length) { const d = document.createElement('div'); d.className = 'bd-empty'; d.textContent = '찾은 조각을 모두 맞췄어요'; tray.appendChild(d); return; }
    ids.forEach((id) => {
      const b = document.createElement('button');
      b.className = `bd-piece${id === this.sel ? ' sel' : ''}`; b.setAttribute('aria-label', PIECE[id].name);
      const img = document.createElement('img'); img.alt = ''; img.src = Toy.thumbs[id] || '';
      const name = document.createElement('b'); name.textContent = PIECE[id].name;
      b.append(img, name);
      b.addEventListener('click', (e) => { e.preventDefault(); Sound.init(); this.select(id); });
      tray.appendChild(b);
    });
  },
  banner() {
    $('bdKick').textContent = `조립 · 제${TG.tier}단계`;
    $('bdName').textContent = TIER_NAMES[TG.tier];
    const dots = $('bdDots'); dots.textContent = '';
    Toy.tierIds().forEach((id) => { const i = document.createElement('i'); if (TG.placed[id]) i.className = 'on'; dots.appendChild(i); });
  },
  say(text, kind) {
    const m = $('bdMsg'); m.textContent = text;
    m.classList.remove('bad', 'good');
    if (kind) { void m.offsetWidth; m.classList.add(kind); }
  },

  /* ---------- choosing and placing ---------- */
  select(id) {
    if (!this.on || this.busy || this.stage === 'snap') return;
    const pc = Toy.pieces[id]; if (!pc || TG.placed[id]) return;
    if (this.sel && this.sel !== id) { const old = Toy.pieces[this.sel]; old.state = 'tray'; old.holder.visible = false; }
    if (this.sel === id && this.stage === 'stage') return;
    this.sel = id; this.stage = 'stage'; this.fails = 0; this.hint = null;
    pc.state = 'build';
    const per = 4 / pc.def.sym;
    let r = rndi(0, 3);
    if (pc.def.sym < 4 && r % per === 0 && Math.random() < 0.8) r = (r + 1) % 4;
    pc.rot = r; pc.yawGoal = r * Math.PI / 2; pc.yawVis = pc.yawGoal;
    pc.holder.visible = true; pc.holder.rotation.set(0, pc.yawVis, 0);
    pc.holder.scale.setScalar(this.stageScale(pc));
    this.stagePos(pc, pc.holder.position);
    burst(pc.holder.position.x, pc.holder.position.y, pc.holder.position.z, { n: 16, speed: 2.4 });
    Sound.sfxUI();
    this.render(); Toy.updateGhosts();
    $('bdRot').hidden = false; $('bdRot').classList.remove('pulse');
    this.say(TG.buildTut ? '빛나는 설계도에서 이 조각이 들어갈 자리를 눌러요 · 화면을 끌면 왕궁이 돌아가요' : `${josa(pc.def.name, '이', '가')} 들어갈 자리를 눌러요`);
  },
  cycle() { const ids = this.trayIds(); if (!ids.length) return; const i = ids.indexOf(this.sel); this.select(ids[(i + 1) % ids.length]); },
  stageScale(pc) { return Math.min(1, 4.0 / pc.maxDim); },
  stagePos(pc, out) {
    const tg = this.target(), dx = Cam.pos.x - tg.x, dz = Cam.pos.z - tg.z, d = Math.hypot(dx, dz) || 1;
    return out.set(tg.x + (dx / d) * 7.6, tg.y + 1.5, tg.z + (dz / d) * 7.6);
  },
  /* where the piece's centre sits once it is placed with turn th */
  slotCenter(pc, th, out) {
    const p = pc.def.pivot, c = pc.center, cs = Math.cos(th), sn = Math.sin(th);
    return out.set(TOY.palace.x + p[0] + c.x * cs + c.z * sn, TOY.palace.y + p[1] + c.y, TOY.palace.z + p[2] - c.x * sn + c.z * cs);
  },
  valid(pc) { return pc.rot % (4 / pc.def.sym) === 0; },
  tap(x, y) {
    if (this.busy || this.stage === 'snap') return;
    const r = renderer.domElement.getBoundingClientRect();
    this.ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, camera);
    const ghosts = PIECES.filter((p) => p.tier === TG.tier && !TG.placed[p.id]).map((p) => Toy.pieces[p.id].ghost);
    const hit = this.ray.intersectObjects(ghosts, false)[0];
    if (hit) this.trySlot(hit.object.userData.piece);
  },
  trySlot(slotId) {
    if (!this.on || this.busy || this.stage === 'snap') return;
    if (!this.sel) { this.say('먼저 아래에서 조각을 하나 골라요', 'bad'); Sound.sfxBonk(); return; }
    const pc = Toy.pieces[this.sel], slot = Toy.pieces[slotId], def = PIECE[slotId];
    if (slotId !== this.sel) {
      this.fails++;
      this.bonk(pc, slot);
      if (this.fails >= 3) { this.hint = this.sel; Toy.updateGhosts(this.sel); this.say('금빛으로 빛나는 자리가 이 조각의 자리예요', 'bad'); }
      else this.say('모양이 맞지 않아요. 설계도를 잘 보고 다른 자리를 찾아봐요', 'bad');
      return;
    }
    const missing = (def.req || []).filter((rq) => !TG.placed[rq]);
    if (missing.length) { this.bonk(pc, slot, true); this.say(`먼저 ${josa(PIECE[missing[0]].name, '이', '가')} 제자리에 있어야 해요`, 'bad'); return; }
    this.stage = 'hover'; this.busy = true;
    const from = pc.holder.position.clone(), s0 = pc.holder.scale.x;
    this.slotCenter(pc, pc.yawVis, _bh); _bh.y += 1.1;
    const to = _bh.clone();
    Sound.sfxThrow();
    tween(0.6, (k) => { pc.holder.position.lerpVectors(from, to, k); pc.holder.position.y += Math.sin(k * Math.PI) * 0.8; pc.holder.scale.setScalar(lerp(s0, 1, k)); }, Ease.inOut).then(() => {
      if (!this.on || this.sel !== pc.def.id) return;
      this.busy = false;
      if (this.valid(pc)) this.snap(pc);
      else { $('bdRot').classList.add('pulse'); this.say(TG.buildTut ? '자리는 맞아요! 돌리기 버튼으로 설계도와 같은 방향이 되게 돌려요' : '자리는 맞아요! 방향을 돌려 맞춰요', 'bad'); }
    });
  },
  rotate(dir) {
    if (!this.on || !this.sel || this.busy || this.stage === 'snap') return;
    const pc = Toy.pieces[this.sel];
    pc.yawGoal += dir * Math.PI / 2;
    pc.rot = ((Math.round(pc.yawGoal / (Math.PI / 2)) % 4) + 4) % 4;
    Sound.sfxRotate();
    if (this.stage === 'hover' && this.valid(pc)) { this.busy = true; wait(0.3).then(() => { if (this.on && this.sel === pc.def.id) { this.busy = false; this.snap(pc); } }); }
  },
  bonk(pc, slot, soft) {
    this.busy = true;
    const from = pc.holder.position.clone(), to = this.slotCenter(slot, 0, V3()), mid = from.clone().lerp(to, soft ? 0.35 : 0.55);
    Sound.sfxBonk();
    const u = slot.ghost.material.uniforms; u.uColor.value.set('#ff8a8a'); u.uAlpha.value = 1.2;
    tween(0.26, (k) => pc.holder.position.lerpVectors(from, mid, k), Ease.out)
      .then(() => tween(0.42, (k) => { pc.holder.position.lerpVectors(mid, from, k); pc.holder.position.x += Math.sin(k * Math.PI * 4) * 0.16 * (1 - k); }, Ease.out))
      .then(() => { this.busy = false; Toy.updateGhosts(this.hint); });
  },
  async snap(pc) {
    if (this.stage === 'snap') return;
    this.stage = 'snap'; this.busy = true;
    $('bdRot').hidden = true;
    const goal = pc.rot * Math.PI / 2;
    pc.yawGoal = pc.yawVis + angleDiff(pc.yawVis, goal);
    await wait(0.2);
    if (!this.on) return;
    pc.yawVis = pc.yawGoal; pc.holder.rotation.y = pc.yawVis;
    const from = pc.holder.position.clone(), to = this.slotCenter(pc, goal, V3());
    await tween(0.32, (k) => { pc.holder.position.lerpVectors(from, to, k); }, Ease.in);
    if (!this.on) return;
    this.place(pc);
    Sound.sfxSnap(); Cam.shake = Math.max(Cam.shake, 0.14);
    burst(to.x, to.y, to.z, { n: 34, speed: 4 });
    puff(to.x, TOY.palace.y + pc.def.pivot[1] + 0.1, to.z, { n: 8, size: 0.9, colors: ['#fff6ea', '#f6e2ff', '#ffffff'] });
    this.sel = null; this.stage = 'idle'; this.busy = false; this.fails = 0; this.hint = null;
    TG.lastProgress = G.time;
    this.render(); this.banner(); Toy.updateGhosts(); Toy.objective();
    const left = Toy.tierIds().filter((id) => !TG.placed[id]);
    if (!left.length) {
      TG.buildTut = false;
      this.say(TG.tier < 4 ? '딸깍! 이번 단계가 완성됐어요!' : '딸깍! 마지막 조각까지 모두 맞췄어요!', 'good');
      await wait(1.2);
      if (!this.on) return;
      this.finishTier();
    } else if (!this.trayIds().length) {
      this.say('딸깍! 찾은 조각을 모두 맞췄어요. 나머지 조각을 더 찾아와요', 'good');
      await wait(1.6);
      if (this.on && !this.busy) this.exit();
    } else this.say('딸깍! 꼭 맞았어요. 다음 조각을 골라요', 'good');
  },
  place(pc) {
    pc.state = 'placed';
    Toy.W.palaceRoot.add(pc.group);
    pc.group.position.set(...pc.def.pivot); pc.group.rotation.set(0, pc.rot * Math.PI / 2, 0); pc.group.scale.setScalar(1);
    pc.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    pc.holder.visible = false; pc.ghost.visible = false;
    TG.placed[pc.def.id] = true;
    renderer.shadowMap.needsUpdate = true;
  },
  finishTier() {
    const t = TG.tier;
    this.close();
    G.mode = 'cutscene';
    if (t < 4) Story.run(() => Toy.tierComplete(t)); else Story.run(() => Toy.finale());
  },

  /* ---------- every frame while building ---------- */
  update(dt) {
    const k = Input.keys;
    if (k.a || k.arrowleft) this.yawT += dt * 1.6;
    if (k.d || k.arrowright) this.yawT -= dt * 1.6;
    if (k.w || k.arrowup) this.pitchT = clamp(this.pitchT + dt * 0.8, 0.1, 0.95);
    if (k.s || k.arrowdown) this.pitchT = clamp(this.pitchT - dt * 0.8, 0.1, 0.95);
    this.yaw = damp(this.yaw, this.yawT, 8, dt); this.pitch = damp(this.pitch, this.pitchT, 8, dt);
    const tg = this.target(), r = this.dist * Cam.zoom;
    Cam.pos.set(tg.x + Math.sin(this.yaw) * Math.cos(this.pitch) * r, tg.y + Math.sin(this.pitch) * r, tg.z + Math.cos(this.yaw) * Math.cos(this.pitch) * r);
    Cam.target.copy(tg);
    if (this.sel) {
      const pc = Toy.pieces[this.sel];
      pc.yawVis = damp(pc.yawVis, pc.yawGoal, 12, dt); pc.holder.rotation.y = pc.yawVis;
      if (!this.busy && this.stage === 'stage') {
        const sp = this.stagePos(pc, _bh), h = pc.holder.position, t = FX.uniforms.uTime.value;
        h.x = damp(h.x, sp.x, 6, dt); h.y = damp(h.y, sp.y + Math.sin(t * 2) * 0.12, 6, dt); h.z = damp(h.z, sp.z, 6, dt);
      } else if (!this.busy && this.stage === 'hover') {
        const hp = this.slotCenter(pc, pc.yawVis, _bh), h = pc.holder.position, t = FX.uniforms.uTime.value;
        h.x = damp(h.x, hp.x, 8, dt); h.y = damp(h.y, hp.y + 1.1 + Math.sin(t * 2.4) * 0.06, 8, dt); h.z = damp(h.z, hp.z, 8, dt);
      }
      const hp = pc.holder.position, sz = Math.max(pc.size.x, pc.size.z) * pc.holder.scale.x;
      if (Math.random() < dt * 10) FX.add.spawn({ x: hp.x + rnd(-0.5, 0.5) * sz, y: hp.y + rnd(-0.6, 0.6), z: hp.z + rnd(-0.5, 0.5) * sz, vy: 0.3, life: 0.8, size: 0.24, size1: 0, color: pick(GOLDS), cell: CELL.sparkle, rot: rnd(0, 3) });
      if (this.stage !== 'snap' && Math.random() < dt * 2.2) FX.add.spawn({ x: hp.x, y: hp.y - pc.size.y * pc.holder.scale.x * 0.5 - 0.15, z: hp.z, life: 1.1, size: sz * 0.9, size1: sz * 1.4, color: '#ffe3a0', alpha: 0.55, cell: CELL.ring, rot: 0 });
    }
  },
};
