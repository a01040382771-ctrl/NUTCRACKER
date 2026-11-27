/* =====================================================================
   38 · CHAPTER V ENDING — the dream scatters into snow and candy dust, and Clara wakes on the pink settee in front of the tree
   The mansion is shown again with the settee carried from its corner to the tree, the tree lit, Clara asleep under a blanket with the
   little nutcracker in her arms. The camera comes down from the star on the tree to her; she wakes, sits up, and the nutcracker
   seems to wink. The gala's own frame loop keeps running (G.chapter stays 5); this file poses Clara, the nutcracker and the blanket.
   ===================================================================== */
const PalaceEnding = {
  on: false, sit: 0, wake: 0, blanket: null, lit0: 0, nutXf: null, gaze: 0, glint: 0, giftXf: null,
  /* where things go: the settee's middle in front of the tree; Clara lies with her head to the left on the blue cushion */
  SOFA: { x: 0, z: -2.75, yaw: -Math.PI / 2 },

  helpText() { return '꿈에서 깨어나는 마지막 장면이에요. 화면을 눌러(또는 Space · Enter) 이야기를 넘겨요.'; },

  /* ---------- the script ---------- */
  async play(P) {
    this.on = true;
    G.phase = 'ending'; G.mode = 'cutscene'; G.locked = true;
    UI.hide('recital'); UI.hide('hud'); UI.hide('controls'); P.showing = false; Recital.stop();
    /* the stage scatters */
    await guard(tween(1.9, () => {
      for (let i = 0; i < 2; i++) burst(rnd(-9, 9), rnd(0.2, 4), rnd(-8, 7), { n: 10, speed: 3, up: 2, g: -0.6, life: 1.6, size: 1.7, colors: ['#ffffff', '#ffd1ee', '#d9c2ff', '#fff3c4', '#bfe6ff'] });
    }, Ease.linear));
    await guard(UI.fade(1, 1.3));
    this.toRoom(P);
    await guard(UI.fade(0, 1.4));
    await guard(Cam.to([2.5, 2.8, 3.2], [0.1, 1.05, -2.9], 4.2));
    await guard(UI.say('narrator', '크리스마스 아침, 트리 앞 분홍 소파에서 클라라는 호두까기 인형을 꼭 안은 채 곤히 잠들어 있었어요.'));
    /* she stirs */
    this.wake = 1;
    await guard(Cam.to([1.7, 2.1, 2.2], [0, 1.15, -2.9], 2.2));
    clara.setExpr('surprised', 0);
    await guard(wait(0.7));
    await guard(tween(1.9, (k) => { this.sit = k; }, Ease.inOut));
    clara.setExpr('smile', 0);
    await guard(UI.say('clara', '…으음… 어? 여기는… 우리 집 거실이잖아?'));
    await guard(UI.say('clara', '꿈이었구나. 하늘 위의 무대, 설탕 요정, 그리고 반짝이던 커다란 별까지… 정말 멋진 꿈이었어.'));
    this.glint = 1; Sound.sfxChime(); burst(0.02, 1.45, -2.45, { n: 26, speed: 2.4, up: 1.4, g: -0.5, colors: ['#fff3c4', '#ffe08a', '#ffffff'] });
    await guard(wait(0.9));
    await guard(UI.say('narrator', '품 안의 호두까기 인형이 눈을 반짝이며 속삭인 것 같았어요.'));
    await guard(UI.say('nut', '…또 만나요, 클라라.'));
    clara.setExpr('happy', 0);
    await guard(UI.say('clara', '응, 꼭 또 만나자!'));
    await guard(Cam.to([3.4, 3.4, 5.4], [0, 1.7, -3.6], 3.4));
    await guard(UI.say('narrator', '꿈은 끝났지만, 클라라의 마음속에는 반짝이는 무대가 오래오래 남았답니다.'));
    await guard(UI.fade(1, 1.2));
    P.clear();
    await guard(UI.fade(0, 0.6));
  },

  /* ---------- the room as the last scene needs it ---------- */
  toRoom(P) {
    P.setVisible(false); P.fairy.root.visible = false; P.fairyBlob.visible = false; P.pdBlobs.forEach((b) => { b.visible = false; });
    P.W.starGroup.visible = false; P.W.spotGroup.visible = false;
    World.use(1); G.chapter = 5; P.ending = true;      // the mansion is shown, and the gala's frame loop goes on (now with this file's frame)
    const W1 = World.W1, S = W1.settee, SF = this.SOFA;
    applyMood(0); this.lit0 = W1.tree.lit; W1.tree.lit = 1;
    S.pivot.position.set(SF.x, 0, SF.z); S.pivot.rotation.y = SF.yaw;
    const gp = W1.props.gift; this.giftXf = { p: gp.grp.position.clone(), v: gp.grp.visible, on: gp.col.on }; gp.grp.position.set(3.1, 0, -1.0); gp.grp.rotation.y = 0.5; gp.col.on = false;   // Drosselmeyer's box stands beside the settee, out of the way
    renderer.shadowMap.needsUpdate = true;
    this.nutXf = { p: nut.root.position.clone(), r: nut.root.rotation.clone(), s: nut.root.scale.clone() };
    clara.root.visible = true; blobs.clara.visible = false; nut.root.visible = true; blobs.nut.visible = false;
    clara.root.rotation.order = 'YXZ'; nut.root.rotation.order = 'YXZ';
    clara.setExpr('blink', 0);
    if (!this.blanket) this.blanket = this.buildBlanket();
    this.blanket.visible = true; scene.add(this.blanket);
    this.sit = 0; this.wake = 0; this.glint = 0; this.gaze = 0;
    Cam.set([0.8, 7.2, 4.6], [0, 6.0, -6]);   // high in the room, looking at the star on the tree
    Sound.playMusic('waltz');
    this.frame(P, 0.016);
  },
  /* a cream blanket with a red stripe and a fringe, lying across Clara from her chest to her feet */
  buildBlanket() {
    const g = new THREE.Group();
    const cream = new THREE.MeshStandardMaterial({ color: '#f7ecda', roughness: 0.93 }), red = new THREE.MeshStandardMaterial({ color: '#a3243f', roughness: 0.85 }), gold = new THREE.MeshStandardMaterial({ color: '#d9ad5a', roughness: 0.5, metalness: 0.4 });
    const body = new THREE.Mesh(roundBox(1.3, 0.17, 0.86, 0.08, 3), cream); g.add(body);
    for (const x of [-0.42, 0.42]) { const s = new THREE.Mesh(roundBox(0.1, 0.19, 0.88, 0.04, 2), red); s.position.x = x; g.add(s); }
    const fr = new THREE.Mesh(roundBox(0.06, 0.12, 0.84, 0.03, 2), gold); fr.position.x = 0.66; g.add(fr);
    g.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    return g;
  },

  /* ---------- every frame: Clara breathes, wakes and sits up; the nutcracker goes with her; the room goes on ---------- */
  frame(P, dt) {
    const t = P.t, W1 = World.W1, S = W1.settee, zc = S.pivot.position.z, PP = P._P || (P._P = newPose({}));
    updateProps(dt);
    const k = smoothstep(0, 1, this.sit), br = 0.5 + 0.5 * Math.sin(t * 1.5);
    /* Clara: lying on her back with her head on the blue cushion, then sitting on the seat facing us */
    newPose(PP);
    setArms(PP, 'low', 1); PP.by += 0.006 * br * (1 - k);
    if (k > 0) {
      PP.llx = lerp(0, -1.4, k); PP.rlx = lerp(0, -1.4, k); PP.by += lerp(0, -0.05, k);
      setArms(PP, 'first', k * 0.8);                              // she holds the nutcracker
      PP.hx += 0.25 * k * this.wake; PP.hy += 0.5 * k * Math.sin(Math.min(1, k * 1.2) * Math.PI) * this.wake;   // she looks down at him, then around the room
    }
    applyPose(clara, PP, t);
    clara.root.position.set(lerp(0.65, 0, k), lerp(0.95, 0.3, k), zc + lerp(0.02, 0.1, k));
    clara.root.rotation.set(lerp(-Math.PI / 2, 0, k), lerp(Math.PI / 2, 0, k), 0);
    clara.root.scale.setScalar(1);
    /* the little nutcracker: on her chest while she sleeps, in her arms when she sits */
    nut.root.scale.setScalar(0.34);
    nut.root.position.set(lerp(-0.12, -0.05, k), lerp(1.26, 0.9, k), zc + lerp(0.02, 0.52, k));
    nut.root.rotation.set(lerp(-Math.PI / 2, -1.05, k), lerp(Math.PI / 2, 1.25, k), 0);   // cradled across her lap, his face turned up to the room
    /* the blanket slides down to her lap and rests there */
    this.blanket.position.set(lerp(0.33, 0.55, k), lerp(1.2, 0.82, k), zc + lerp(0.02, 0.5, k));
    this.blanket.rotation.set(0, lerp(0, -0.35, k), lerp(0, 0.18, k));
    /* a few last specks of the dream over her, and the nutcracker's glint */
    if (this.sit < 0.6 && Math.random() < dt * 5) FX.add.spawn({ x: rnd(-0.9, 1.1), y: rnd(1.1, 1.6), z: zc + rnd(-0.3, 0.3), vx: rnd(-0.05, 0.05), vy: rnd(0.12, 0.3), vz: 0, g: 0, drag: 0.5, life: rnd(1.4, 2.4), size: rnd(0.1, 0.2), size1: 0.02, color: pick(['#fff3c4', '#ffd1ee', '#d9c2ff']), cell: CELL.sparkle, rot: rnd(0, TAU), vr: rnd(-2, 2), flicker: 0.6 });
    if (this.glint > 0) { this.glint = Math.max(0, this.glint - dt * 0.6); if (Math.random() < dt * 14) FX.add.spawn({ x: 0.02 + rnd(-0.08, 0.08), y: 1.48 + rnd(-0.05, 0.12), z: zc + 0.62, vx: 0, vy: rnd(0.1, 0.4), vz: 0, g: 0, drag: 1, life: rnd(0.4, 0.8), size: rnd(0.12, 0.22), size1: 0.02, color: '#fff3c4', cell: CELL.star, rot: rnd(0, TAU), vr: rnd(-3, 3), flicker: 0.5 }); }
  },

  /* leaving the gala (from the map button or the pause menu, or after the card): everything back where the story had it */
  restore() {
    if (!this.on) return;
    this.on = false;
    const W1 = World.W1;
    if (W1 && W1.settee) { W1.settee.pivot.position.copy(W1.settee.home); W1.settee.pivot.rotation.y = 0; }
    if (W1 && W1.tree) W1.tree.lit = this.lit0;
    if (W1 && this.giftXf) { const gp = W1.props.gift; gp.grp.position.copy(this.giftXf.p); gp.grp.rotation.y = 0; gp.col.on = this.giftXf.on; this.giftXf = null; }
    if (this.blanket) { this.blanket.visible = false; if (this.blanket.parent) this.blanket.parent.remove(this.blanket); }
    clara.root.rotation.order = 'XYZ'; nut.root.rotation.order = 'XYZ';
    if (this.nutXf) { nut.root.position.copy(this.nutXf.p); nut.root.rotation.copy(this.nutXf.r); nut.root.scale.copy(this.nutXf.s); this.nutXf = null; }
    clara.setExpr('smile', 0);
    renderer.shadowMap.needsUpdate = true;
  },
};
