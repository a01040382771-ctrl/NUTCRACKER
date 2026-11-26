/* =====================================================================
   29 · CHAPTER IV — the Kingdom of Sweets: three dance rehearsals, then the candy bridge
   ===================================================================== */
const CAM4 = { fx: 1, kx: 1, clamp: 1e9, look: 1.1, up: 6.1, back: 9.8, ahead: 1.8 };
const DANCE_ORDER = ['choco', 'coffee', 'tea'];
const DANCES = {
  choco: { name: '스페인 춤', treat: '초콜릿', game: '캐스터네츠 따라 치기', idle: ['castanet', 'stomp'] },
  coffee: { name: '아라비아 춤', treat: '커피', game: '비단 자락 따라 그리기', idle: ['veil', 'pose'] },
  tea: { name: '중국 춤', treat: '차', game: '찻잔 탑 쌓기', idle: ['hop', 'spin'] },
};
const DANCE_INTRO = {
  choco: [
    '올레! 저는 초콜릿 무용수예요. 제가 캐스터네츠와 발 구르기로 박자를 들려 드릴게요.',
    () => (DEVICE.touch ? '잘 듣고 똑같이 따라 쳐 주세요. 왼쪽을 누르면 발 구르기 \'쿵\', 오른쪽을 누르면 캐스터네츠 \'딱\'이에요.' : '잘 듣고 똑같이 따라 쳐 주세요. A나 ← 키는 발 구르기 \'쿵\', D나 → 키는 캐스터네츠 \'딱\'이에요. 화면을 눌러도 돼요.'),
    () => `패턴 여섯 개 가운데 ${SWEET_CFG.choco.passRounds}개를 맞히면 리허설 성공이에요!`,
  ],
  coffee: [
    '어서 오세요. 저는 커피 무용수예요. 제 비단 자락은 음악을 따라 천천히 춤을 춘답니다.',
    () => (DEVICE.touch ? '빛나는 구슬이 그리는 길을 손가락으로 따라와 주세요. 구슬에서 손가락이 멀어지지 않게요.' : '빛나는 구슬이 그리는 길을 마우스로 따라와 주세요. 방향키로도 움직일 수 있어요.'),
    () => `물결, 8자, 고리 세 가지 춤을 평균 ${SWEET_CFG.coffee.passPct}% 넘게 따라오면 성공이에요.`,
  ],
  tea: [
    '안녕하세요! 저는 차 무용수예요. 오늘은 찻잔으로 탑을 쌓는 춤을 연습해요.',
    () => (DEVICE.touch ? '찻잔이 박자에 맞춰 흔들리다가 탑 바로 위에 오면 화면을 톡! 눌러 주세요.' : '찻잔이 박자에 맞춰 흔들리다가 탑 바로 위에 오면 Space를 눌러 주세요. 화면을 눌러도 돼요.'),
    () => `${SWEET_CFG.tea.lives}번 미끄러지기 전에 찻잔 ${SWEET_CFG.tea.goal}개를 쌓으면 성공이에요!`,
  ],
};
const DANCE_AGAIN = { choco: '좋아요, 다시 한 번! 잘 듣고 따라 쳐요.', coffee: '천천히, 구슬을 놓치지 말고 따라와요.', tea: '찻잔은 아직 많아요. 다시 쌓아 봐요!' };
const DANCE_OBJ = {
  choco: '스페인 춤 · 무용수의 박자를 듣고 똑같이 따라 쳐요',
  coffee: '아라비아 춤 · 빛나는 구슬을 따라 비단 자락을 그려요',
  tea: '중국 춤 · 찻잔이 탑 위에 오면 내려놓아요',
};
const DANCE_DONE = {
  choco: ['narrator', '"올레!" 초콜릿 무용수가 마지막으로 발을 구르자, 거리 한가운데 초콜릿 분수가 다시 흐르기 시작했어요. 가로등마다 붉은 깃발도 펄럭였지요.'],
  coffee: ['narrator', '비단 자락이 마지막 고리를 그리자, 거리 위에 걸린 별 모양 등불이 하나둘 켜졌어요.'],
  tea: ['narrator', '여덟 번째 찻잔이 탑 꼭대기에 오르자, 거리의 종이 등불이 모두 붉게 빛났어요. 차 무대에는 찻잔 탑이 우뚝 섰지요.'],
};
const DANCE_THANKS = { choco: '고마워요, 클라라! 축제 날 무대에서 같이 발을 굴러요!', coffee: '비단 자락이 이렇게 곱게 춤춘 건 처음이에요. 고마워요.', tea: '찻잔 탑이 완성됐어요! 축제 때 이 탑 위에서 차를 대접할게요.' };
const DANCE_CHAT = { choco: '축제 날에는 장미를 머리에 꽂고 춤출 거예요. 올레!', coffee: '비단 자락이 바람에 흔들리는 소리, 들려요?', tea: '찻잔은 여덟 개가 딱 좋아요. 아홉 개는 너무 무거워요!' };
const SWEET_FLAVOR = {
  cake: ['baker', '오늘 밤 축제에 쓸 케이크예요! 맨 위에는 클라라 아가씨의 이름을 설탕으로 써 넣을 거랍니다.'],
  candy: ['baker', '유리병마다 맛이 달라요. 딸기, 박하, 레몬, 사과, 포도! 리허설이 끝나면 하나씩 맛보게 해 드릴게요.'],
  fountainDry: ['narrator', '초콜릿 분수가 말라 있어요. 스페인 춤 리허설이 끝나면 다시 흐를 거래요.'],
  fountain: ['narrator', '달콤한 초콜릿이 세 겹 그릇을 타고 흘러내려요. 향기만 맡아도 행복해져요.'],
  bridge: ['prince', '사탕 다리는 아직 놓이지 않았어요. 세 무대의 리허설이 모두 끝나면 설탕 요정님이 다리를 놓아 주실 거예요.'],
};

/* the plaza tune: a light celesta-and-pizzicato piece in G, written for this game */
const SWEETS_MEL =
  'B5:0.5 D6:0.5 G6:0.5 D6:0.5 | E6:0.5 C6:0.5 A5:1 | A5:0.5 C6:0.5 F#6:0.5 C6:0.5 | D6:0.5 B5:0.5 G5:1 |' +
  'G5:0.25 A5:0.25 B5:0.5 D6:0.5 B5:0.5 | C6:0.5 E6:0.5 A5:1 | F#5:0.5 A5:0.5 D6:0.5 C6:0.5 | B5:1 r:1 |' +
  'E6:0.5 D6:0.5 C6:0.5 B5:0.5 | A5:0.5 B5:0.5 C6:1 | D6:0.5 C6:0.5 B5:0.5 A5:0.5 | G5:0.5 A5:0.5 B5:1 |' +
  'C6:0.5 E6:0.5 D6:0.5 B5:0.5 | A5:0.5 C6:0.5 B5:0.5 G5:0.5 | F#5:0.5 A5:0.5 D6:0.5 C6:0.5 | B5:1 G5:1';
const SWEETS_CHORDS = ['G', 'C', 'D', 'G', 'G', 'Am', 'D', 'G', 'C', 'Am', 'D', 'G', 'C', 'Am', 'D7', 'G'];
Object.assign(Sound, {
  buildSweetTracks() {
    if (this.tracks.sweets) return;
    const mel = parseSeq(SWEETS_MEL), ev = [];
    mel.ev.forEach((e) => ev.push({ beat: e.beat, kind: 'bell', f: e.freqs[0], dur: Math.min(0.5, e.dur), vol: 0.15 }));
    SWEETS_CHORDS.forEach((ch, bar) => {
      const [b, up] = CHORD[ch], b0 = bar * 2;
      ev.push({ beat: b0, kind: 'pluck', f: noteFreq(b), dur: 0.3, vol: 0.24 });
      ev.push({ beat: b0 + 1, kind: 'pluck', f: noteFreq(b) * 1.5, dur: 0.25, vol: 0.16 });
      for (const off of [0.5, 1.5]) up.split('+').forEach((n) => ev.push({ beat: b0 + off, kind: 'bellLow', f: noteFreq(n) * 2, vol: 0.035 }));
      if (bar % 4 === 3) ev.push({ beat: b0 + 1.75, kind: 'tick', vol: 0.04 });
    });
    this.tracks.sweets = { bpm: 96, len: mel.len, ev: ev.sort((a, b) => a.beat - b.beat) };
  },
  sfxBridge(i) { if (!this.ctx) return; const t = this.now; this.bell(t, noteFreq('C5') * Math.pow(2, ([0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 24][i % 14]) / 12), 1.2, 0.08, this.sfx, 1.3); this.noiseHit(t, 0.08, 0.04, 'bandpass', 1800, 2); },
});

const Sweet = {
  W: null, fog: null, bg: null, shot: '', loading: null, dancers: {}, blobs: {}, ginger: [], interacts: [],
  done: {}, results: {}, seen: {}, active: null, viewK: 0, hopT: 0,

  /* ---------- build the stage once, the first time the chapter opens ---------- */
  ensure() {
    if (this.W) return Promise.resolve();
    if (!this.loading) this.loading = this.buildAll();
    return this.loading;
  },
  async buildAll() {
    const L = $('screenLoading');
    L.style.transition = 'none'; L.style.opacity = '1'; L.hidden = false;
    UI.setLoading(0.1, '과자의 왕국을 꾸미는 중…');
    await nextFrame(); await nextFrame();
    buildSweetTextures(); buildSweetMaterials();
    Sound.buildSweetTracks();
    UI.setLoading(0.35, '초콜릿 강과 사탕 다리를 놓는 중…');
    await nextFrame();
    const root = new THREE.Group(); root.name = 'sweetland'; root.visible = false; scene.add(root);
    const W4 = buildSweetland(root);
    UI.setLoading(0.62, '세 무대의 무용수들이 준비하는 중…');
    await nextFrame();
    for (const id of DANCE_ORDER) {
      const d = buildSweetDancer(id), s = W4.stages[id];
      d.root.position.copy(s.dancerAt); d.root.rotation.y = s.def.yaw; root.add(d.root);
      const b = makeBlob(0.4); b.position.set(s.dancerAt.x, 0.515, s.dancerAt.z); root.add(b);
      W4.dyn.push({ t: 'c', x: s.dancerAt.x, z: s.dancerAt.z, r: 0.32, top: 2.4, bottom: 0, walk: false, on: true });
      this.dancers[id] = d; this.blobs[id] = b;
    }
    const gpos = [[10.35, 7.85, -Math.PI / 2, '#f8c8d6'], [10.35, 9.4, -Math.PI / 2, '#ffe3a8'], [10.35, -8.6, -Math.PI / 2, '#c9f0e4']];
    for (const [x, z, yaw, ap] of gpos) { const gb = buildGingerbread(true, ap); gb.root.position.set(x, 0, z); gb.root.rotation.y = yaw; root.add(gb.root); this.ginger.push(gb); }
    const kid = buildGingerbread(false, null); kid.root.scale.setScalar(0.8); root.add(kid.root); kid.walk = { a: 0, col: { t: 'c', x: 0, z: 0, r: 0.3, top: 1, bottom: 0, walk: false, on: true } }; W4.dyn.push(kid.walk.col); this.ginger.push(kid); this.kid = kid;
    this.W = W4;
    this.fog = new THREE.Fog('#f2c4da', 36, 118);
    this.bg = new THREE.Color('#2c1f5e');
    this.setupInteracts();
    UI.setLoading(0.82, '설탕 요정을 부르는 중…');
    await nextFrame();
    // compile every shader now so nothing hitches when the kingdom first appears
    const roots = [World.W1.root, Toy.W && Toy.W.root, Snow.W && Snow.W.root, root].filter(Boolean), was = roots.map((r) => r.visible);
    roots.forEach((r) => { r.visible = r === root; });
    const hidden = []; root.traverse((o) => { if (o.visible === false && o !== root) { hidden.push(o); o.visible = true; } });
    const fog0 = scene.fog; scene.fog = this.fog;
    try { renderer.compile(scene, camera); } catch (e) { /* compile lazily */ }
    hidden.forEach((o) => { o.visible = false; });
    scene.fog = fog0; roots.forEach((r, i) => { r.visible = was[i]; });
    for (const id of DANCE_ORDER) { try { UI.portraits[id] = portraitOf(this.dancers[id].root, [0, 1.5, 0], 1.7); } catch (e) { /* the narrator star is used instead */ } }
    renderer.shadowMap.needsUpdate = true;
    UI.setLoading(1, '막이 오릅니다');
  },
  setupInteracts() {
    const W4 = this.W, st = (id) => W4.stages[id];
    this.interacts = DANCE_ORDER.map((id) => {
      const s = st(id), p = stageToWorld(s.def, 0, 2.85, -0.35);
      return {
        id, x: s.front.x, z: s.front.z, r: 2.3, p: [p.x, p.y, p.z],
        label: () => (this.done[id] ? `${DANCES[id].name} 다시 춤추기` : `리허설 돕기 · ${DANCES[id].name}`), short: () => (this.done[id] ? '다시 춤추기' : '리허설'), icon: 'music',
        when: () => G.phase === 'explore', act: () => this.rehearse(id),
      };
    });
    this.interacts.push(
      { id: 'cake', x: 7.9, z: 8.6, r: 1.6, p: [9.6, 2.7, 8.6], label: '케이크 가게 구경하기', short: '구경하기', icon: 'eye', when: () => G.phase === 'explore', act: () => this.flavor('cake') },
      { id: 'candy', x: 7.9, z: -8.6, r: 1.6, p: [9.6, 2.7, -8.6], label: '사탕 가게 구경하기', short: '구경하기', icon: 'eye', when: () => G.phase === 'explore', act: () => this.flavor('candy') },
      { id: 'fountain', x: 0, z: 3.5, r: 1.4, p: [0, 3.6, 0.6], label: '초콜릿 분수 살펴보기', short: '살펴보기', icon: 'eye', when: () => G.phase === 'explore', act: () => this.flavor(this.done.choco ? 'fountain' : 'fountainDry') },
      { id: 'bridge', x: 0, z: -12.3, r: 2.2, p: [0, 2.0, -13.4], label: '강가 살펴보기', short: '살펴보기', icon: 'eye', when: () => G.phase === 'explore', act: () => this.flavor('bridge') },
    );
  },

  /* ---------- chapter flow ---------- */
  async start(resume = false) {
    RUN_ID++; Tasks.clear(); UI.closeDialog();
    ['screenTitle', 'screenMap', 'screenClear', 'screenPause', 'screenRehearse', 'build', 'rhythm', 'recital'].forEach((id) => UI.hide(id));
    G.mode = 'loading'; G.locked = true;
    UI.hide('hud'); UI.hide('controls'); UI.prompt(null);
    Sound.stopMusic(0.6);
    Toy.leave(); Snow.leave();
    const fresh = !this.W;
    if (fresh) await this.ensure(); else await UI.fade(1, 0.4);
    RUN_ID++;
    World.use(4);
    this.reset();
    const cp = resume ? this.checkpoint() : null;
    if (cp) this.restore(cp);
    G.mode = 'cutscene';
    const L = $('screenLoading');
    if (!L.hidden) { L.style.transition = 'opacity .8s ease'; L.style.opacity = '0'; setTimeout(() => { L.hidden = true; }, 820); }
    UI.fade(0, 1.0);
    Story.run(() => (cp ? this.resumeIntro() : this.intro()));
  },
  leave() {
    if (!this.W) return;
    Recital.stop();
    UI.hide('recital'); UI.hide('screenRehearse');
    this.active = null; this.viewK = 0; camera.clearViewOffset();
    fairyBig.root.visible = false;
    marker.visible = false; marker.scale.setScalar(1);
    clara.root.visible = true; blobs.clara.visible = true; player.float = false;
    UI.setChapterHud('제1장', '크리스마스 저택', 'i-star'); // the hidden HUD goes back to its first-chapter look
    Input.clear();
  },
  reset() {
    const W4 = this.W;
    Object.assign(G, { phase: 'none', stars: 0, time: 0, throws: 0, combat: false, markerAt: null });
    Object.assign(player, { yaw: Math.PI, vy: 0, grounded: true, groundCol: null, stun: 0, invuln: 0, knockT: 0, coyote: 0, jumpBuf: 0, throwCd: 0, speed: 0, float: false });
    player.pos.copy(SWEET.start); player.vel.set(0, 0, 0);
    clara.a.action = null; clara.setExpr('smile'); clara.root.visible = true; blobs.clara.visible = true;
    comp.mode = 'prince'; comp.hold = false; comp.target = null; comp.pos.set(1.1, 0, SWEET.start.z + 0.9); comp.y = 0; comp.yaw = Math.PI;
    nut.root.visible = false; prince.root.visible = true; prince.root.scale.setScalar(1.12); blobs.nut.visible = true;
    fairyBig.root.visible = false; fairyBig.root.scale.setScalar(1);
    this.done = {}; this.results = {}; this.seen = {}; this.active = null; this.hopT = 0;
    Recital.stop(); UI.hide('recital'); UI.hide('screenRehearse'); this.setView(0);
    W4.reset();
    for (const id of DANCE_ORDER) { const d = this.dancers[id], s = W4.stages[id]; d.root.position.copy(s.dancerAt); d.root.rotation.y = s.def.yaw; d.a.action = null; d.setExpr('smile'); }
    UI.setChapterHud('제4장', '과자의 왕국', 'i-candy', 3); UI.setStars(0);
    $('hud').classList.remove('cine'); UI.prompt(null);
    Cam.shake = 0;
    renderer.shadowMap.needsUpdate = true;
    FX.add.clear(); FX.norm.clear();
  },

  /* ---------- saving: a checkpoint after every rehearsal ---------- */
  /* a save with one to three rehearsals done (three: the page was closed before the finale finished, so it resumes there) */
  checkpoint() {
    const cp = Save.data.ch4;
    return cp && cp.v === 1 && cp.done && DANCE_ORDER.some((id) => cp.done[id]) ? cp : null;
  },
  saveCheckpoint() {
    const done = {}; DANCE_ORDER.forEach((id) => { if (this.done[id]) done[id] = this.brief(this.results[id]); });
    Save.data.ch4 = { v: 1, done, time: Math.round(G.time) };
    Save.write();
  },
  brief(r) {
    if (!r) return { pass: true };
    if (r.id === 'choco') return { pass: r.pass, ok: r.ok, total: r.total, perfect: r.perfect };
    if (r.id === 'coffee') return { pass: r.pass, pct: r.pct, parts: r.parts };
    return { pass: r.pass, cups: r.cups, goal: r.goal, perfect: r.perfect, miss: r.miss };
  },
  restore(cp) {
    G.time = +cp.time || 0;
    for (const id of DANCE_ORDER) if (cp.done[id]) { this.done[id] = true; this.seen[id] = true; this.results[id] = Object.assign({ id }, cp.done[id]); this.W.setDeco(id, 1); }
    UI.setStars(this.count());
    renderer.shadowMap.needsUpdate = true;
  },
  count() { return DANCE_ORDER.filter((id) => this.done[id]).length; },

  async intro() {
    const W4 = this.W, A = SWEET.arch;
    Sound.playMusic('sweets');
    // high above the avenue, gliding towards the chocolate river and the palace on its hill
    Cam.set([0, 15, 26], [0, 2.4, -14]);
    UI.chapterCard('Chapter IV', '과자의 왕국');
    clara.root.visible = true; prince.root.visible = true;
    player.pos.set(-0.5, 0, A.z - 0.5); player.yaw = Math.PI; comp.pos.set(0.7, 0, A.z - 0.3); comp.yaw = Math.PI; comp.hold = true;
    await guard(tween(3.8, (k) => { Cam.pos.set(0, lerp(15, 9.5, k), lerp(26, 3, k)); Cam.target.set(0, lerp(2.4, 4.5, k), lerp(-14, -44, k)); }, Ease.inOut));
    // Clara and the prince step out of the glowing gate (seen from the avenue)
    Cam.set([2.5, 1.6, 9.0], [0, 1.6, 13.9]);
    const p0 = player.pos.clone(), c0 = comp.pos.clone();
    await guard(tween(2.6, (k) => { player.pos.lerpVectors(p0, V3(-0.4, 0, SWEET.start.z), k); player.speed = 2.2; comp.pos.lerpVectors(c0, V3(0.9, 0, SWEET.start.z + 0.6), k); comp.speed = 2.2; comp.yaw = Math.PI; }, Ease.inOut));
    player.speed = 0; comp.speed = 0;
    await guard(wait(0.4));
    await guard(UI.say('narrator', '눈송이 숲의 문을 지나자, 달콤한 향기가 가득한 과자의 왕국이 펼쳐졌어요. 초콜릿 강이 반짝이고, 강 건너 언덕 위에는 설탕 궁전이 빛나고 있었지요.'));
    // the Sugar Plum Fairy arrives in a shower of sparkles
    const fp = V3(0.3, 1.3, 9.4);
    await guard(Cam.to([3.9, 2.4, 13.0], [0.1, 1.6, 10.6], 1.2));
    fairyBig.root.visible = true; fairyBig.root.position.copy(fp); fairyBig.root.rotation.y = 0; fairyBig.root.scale.setScalar(0.01);
    Sound.sfxTransform(); burst(fp.x, fp.y + 0.6, fp.z, { n: 40, speed: 3.5, g: -0.6 });
    await guard(tween(1.0, (k) => fairyBig.root.scale.setScalar(Math.max(0.01, Ease.outBack(k))), Ease.linear));
    fairyBig.play('pose', 2.0);
    await guard(UI.say('fairy', '어서 오렴, 클라라! 오늘 밤 과자의 왕국에서 너를 위한 축제가 열린단다.'));
    await guard(UI.say('fairy', '그런데 세 무대의 춤 리허설이 아직 끝나지 않았어. 스페인 춤, 아라비아 춤, 중국 춤 무용수들을 도와주겠니?'));
    await guard(Cam.to([1.2, 10.5, 12.0], [0, 1.0, -4.0], 1.6));
    await guard(UI.say('prince', '리허설이 끝날 때마다 축제 장식이 하나씩 완성돼요. 세 무대가 모두 끝나면 궁전으로 가는 사탕 다리가 놓일 거예요.'));
    await guard(Cam.to([2.0, 2.7, SWEET.start.z + 4.2], [0, 1.3, SWEET.start.z - 0.4], 1.2));
    clara.setExpr('happy', 2.5);
    await guard(UI.say('clara', '좋아! 어느 무대부터 가 볼까?'));
    await guard(UI.say('fairy', '궁전에서 기다릴게. 무대 앞으로 가서 무용수들에게 말을 걸어 보렴.'));
    Sound.sfxPortal();
    await guard(tween(0.8, (k) => { fairyBig.root.scale.setScalar(Math.max(0.01, 1 - k)); fairyBig.root.position.y = fp.y + k * 1.2; }, Ease.in));
    burst(fp.x, fp.y + 1.4, fp.z, { n: 30, speed: 3, g: -0.4 });
    fairyBig.root.visible = false;
    comp.hold = false;
    this.beginExplore();
    UI.hint(DEVICE.touch ? '무대 앞으로 걸어가 금빛 버튼을 눌러요 · 순서는 마음대로예요' : '무대 앞으로 걸어가 E를 눌러요 · 순서는 마음대로예요', 6500);
  },
  async resumeIntro() {
    Sound.playMusic('sweets');
    Cam.set([3.2, 6.4, SWEET.start.z + 9.5], [0.2, 1.6, SWEET.start.z - 1]);
    await guard(Cam.to([2.0, 2.7, SWEET.start.z + 4.2], [0, 1.3, SWEET.start.z - 0.4], 1.5));
    if (this.count() >= 3) { await this.finale(); return; }   // all three were done: straight on to the bridge
    this.beginExplore();
    UI.toast(`저장된 곳에서 이어서 시작해요 · 리허설 ${this.count()} / 3`, 3200);
  },
  beginExplore() {
    G.phase = 'explore'; this.lastProgress = G.time;
    comp.hold = false;   // the prince was held in place at the stage; he follows Clara again
    Story.beginPlay();
    this.objective();
  },
  objective() {
    const n = this.count();
    UI.setObjective(n >= 3 ? '세 무대의 리허설을 모두 마쳤어요' : `세 무대의 춤 리허설 돕기 ${n} / 3`);
  },
  async flavor(key) {
    const [who, text] = SWEET_FLAVOR[key];
    clara.play('interact', 0.5);
    await Story.cut(async () => { await guard(UI.say(who, text)); });
    G.phase = 'explore';
  },

  /* ---------- a rehearsal: walk to the stage, the dancer explains, the game runs on the overlay ---------- */
  /* a little to the side of the stage's axis, so the fountain in the middle of the avenue never stands in the way */
  stageView(id) {
    const st = this.W.stages[id].def;
    return { pos: stageToWorld(st, -2.0, 2.45, 7.2), look: stageToWorld(st, 0.2, 1.5, 0) };
  },
  async rehearse(id) {
    if (this.active) return;
    const first = !this.seen[id], again = !!this.done[id];
    this.seen[id] = true;
    await Story.cut(async () => {
      G.phase = 'stage'; G.markerAt = null;
      const st = this.W.stages[id].def, d = this.dancers[id];
      // Clara watches from just in front of the stage, to the left of the steps; the prince stands back on the right
      const cp = stageToWorld(st, -1.55, 0, 2.95), pp = stageToWorld(st, 1.0, 0, 4.0), look = stageToWorld(st, 0, 0, 0);
      const v = this.stageView(id);
      Cam.to([v.pos.x, v.pos.y, v.pos.z], [v.look.x, v.look.y, v.look.z], 1.3);
      const p0 = player.pos.clone(), c0 = comp.pos.clone(); comp.hold = true;
      await guard(tween(1.1, (k) => {
        player.pos.lerpVectors(p0, cp, k); player.pos.y = 0; player.speed = 2.6; player.yaw = Math.atan2(look.x - player.pos.x, look.z - player.pos.z);
        comp.pos.lerpVectors(c0, pp, k); comp.speed = 2.4; comp.yaw = Math.atan2(look.x - comp.pos.x, look.z - comp.pos.z);
      }, Ease.inOut));
      player.speed = 0; comp.speed = 0; player.vel.set(0, 0, 0);
      await guard(wait(0.25));
      d.play('curtsy', 1.4);
      const lines = again ? ['다시 춤추러 왔군요! 이번에도 잘 부탁해요.'] : first ? DANCE_INTRO[id] : [DANCE_AGAIN[id]];
      for (const line of lines) await guard(UI.say(id, typeof line === 'function' ? line() : line));
    }, false);
    await this.play(id);
  },
  async play(id) {
    this.active = id; G.phase = 'rehearse'; G.mode = 'play'; G.locked = true;
    Sound.stopMusic(0.6);
    $('hud').classList.remove('cine'); UI.show('hud'); UI.hide('controls'); UI.prompt(null);
    UI.setObjective(DANCE_OBJ[id]);
    UI.show('recital');
    tween(0.6, (k) => this.setView(k), Ease.inOut);
    await Recital.start(REHEARSAL_GAMES[id], { onEnd: (res) => Story.run(() => this.afterGame(id, res)), cue: (kind, data) => this.cue(id, kind, data) });
  },
  /* the 3D stage answers the game: the dancer plays her pattern, Clara answers, cups land */
  cue(id, kind, data) {
    const d = this.dancers[id], s = this.W.stages[id].dancerAt;
    if (id === 'choco') {
      if (kind === 'call') d.play(data.type === 'cast' ? 'castanet' : 'stomp', 0.42);
      else if (kind === 'hit' && (data.rating === 'perfect' || data.rating === 'good')) { clara.play(data.type === 'cast' ? 'castanet' : 'stomp', 0.4); }
      else if (kind === 'round' && data.ok) { burst(s.x, 1.8, s.z, { n: 18, speed: 2.6, colors: ['#ffd6a0', '#ffffff', '#ff9cb0'] }); clara.setExpr('happy', 1.2); }
    } else if (id === 'coffee') {
      if (kind === 'beat' && data.moving && data.i % 4 === 0) d.play('veil', Recital.spb * 4);
      else if (kind === 'phrase') { d.play('pose', 1.3); if (data.pct >= SWEET_CFG.coffee.passPct) burst(s.x, 1.8, s.z, { n: 18, speed: 2.4, colors: ['#9ff0e6', '#ffe3a8', '#ffffff'] }); }
    } else if (kind === 'land') {
      if (data.rating !== 'miss') { d.play('hop', 0.45); burst(s.x, 1.6, s.z, { n: 8, speed: 2, colors: ['#ffe9a8', '#ffffff', '#c9f0e4'] }); } else d.play('surprise', 0.6);
    } else if (kind === 'won') d.play('spin', 1.2);
  },
  async afterGame(id, res) {
    G.mode = 'cutscene'; G.locked = true; G.phase = 'stage';
    $('hud').classList.add('cine');
    await guard(wait(1.1));
    UI.hide('recital');
    tween(0.6, (k) => this.setView(1 - k), Ease.inOut);
    this.active = null;
    const prev = this.results[id];
    this.results[id] = this.better(prev, res);
    const d = this.dancers[id], s = this.W.stages[id].dancerAt, firstWin = res.pass && !this.done[id];
    if (res.pass) { d.play('spin', 1.2); clara.play('cheer', 1.0); clara.setExpr('happy', 2); Sound.sfxFanfare(); confetti(s.x, 2.2, s.z, 50); }
    else { d.play('curtsy', 1.2); }
    await guard(wait(0.8));
    const D = DANCES[id];
    this.card({
      kicker: `${D.name} · ${D.treat}`, title: res.pass ? '리허설 성공!' : '조금만 더 연습해요',
      stats: res.stats,
      info: res.pass ? (firstWin ? '축제 장식 하나가 완성돼요' : '다시 춰도 멋진 무대였어요') : `${res.need}. ${res.more}${res.unit === '%' ? '%' : '개'}만 더!`,
      main: res.pass ? (firstWin ? '축제 장식 보기' : '광장으로') : '다시 하기',
      sub: res.pass ? '' : '광장으로',
      onMain: () => { if (!res.pass) this.retry(id); else if (firstWin) Story.run(() => this.celebrate(id)); else this.backToPlaza(); },
      onSub: () => this.backToPlaza(),
    });
  },
  better(a, b) {
    if (!a) return b;
    if (b.pass !== a.pass) return b.pass ? b : a;
    const key = b.id === 'choco' ? 'ok' : b.id === 'coffee' ? 'pct' : 'cups';
    return (b[key] || 0) >= (a[key] || 0) ? b : a;
  },
  /* the small result card of a rehearsal */
  card(o) {
    $('rcKicker').textContent = o.kicker; $('rcTitle').textContent = o.title;
    const dl = $('rcStats'); dl.textContent = '';
    for (const [k, v] of o.stats) { const d = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = k; dd.textContent = v; if (String(v).length > 6) dd.className = 'long'; d.append(dt, dd); dl.appendChild(d); }
    $('rcInfo').textContent = o.info;
    const main = $('btnRcMain'), sub = $('btnRcSub');
    main.textContent = o.main; sub.textContent = o.sub; sub.hidden = !o.sub;
    this.cardActs = { main: o.onMain, sub: o.onSub };
    G.mode = 'clear'; G.locked = true;
    UI.show('screenRehearse');
    setTimeout(() => { try { main.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 60);
  },
  cardPress(which) {
    const fn = this.cardActs && this.cardActs[which]; this.cardActs = null;
    UI.hide('screenRehearse');
    if (fn) fn();
  },
  retry(id) {
    G.mode = 'cutscene'; G.locked = true;
    Story.run(async () => {
      await guard(UI.say(id, DANCE_AGAIN[id]));
      await this.play(id);
    });
  },
  backToPlaza() {
    G.mode = 'cutscene';
    Sound.playMusic('sweets');
    Story.run(async () => {
      Cam.follow();
      this.beginExplore();
    });
  },
  async celebrate(id) {
    this.done[id] = true;
    await Story.cut(async () => {
      G.phase = 'celebrate'; G.mode = 'cutscene';
      const shots = {
        choco: [[5.2, 3.8, 8.0], [0, 1.7, 0.6]],
        coffee: [[0.4, 1.9, 13.4], [0, 3.4, 0.2]],
        tea: [[-1.8, 3.2, -0.6], [-7.0, 1.8, -6.6]],
      };
      await guard(Cam.to(shots[id][0], shots[id][1], 1.5));
      Sound.sfxTransform();
      await guard(tween(2.4, (k) => this.W.setDeco(id, k), Ease.inOut));
      renderer.shadowMap.needsUpdate = true;
      for (let i = 0; i < 3; i++) setTimeout(() => { if (G.chapter === 4) confetti(rnd(-4, 4), 4.2, shots[id][1][2] + rnd(-3, 3), 40); }, i * 260);
      UI.setStars(this.count());
      await guard(UI.say(DANCE_DONE[id][0], DANCE_DONE[id][1]));
      const st = this.W.stages[id].def, v = this.stageView(id);
      await guard(Cam.to([v.pos.x, v.pos.y, v.pos.z], [v.look.x, v.look.y, v.look.z], 1.2));
      this.dancers[id].play('curtsy', 1.4);
      await guard(UI.say(id, DANCE_THANKS[id]));
      void st;
    }, false);
    this.saveCheckpoint();
    if (this.count() >= 3) { await this.finale(); return; }
    UI.toast('여기까지 진행을 저장했어요', 2400);
    this.backToPlaza();
    const left = DANCE_ORDER.filter((x) => !this.done[x]).map((x) => DANCES[x].name);
    UI.hint(`남은 무대 · ${left.join(', ')}`, 4200);
  },

  /* ---------- all three done: the candy bridge rises from the chocolate, the palace lights up ---------- */
  async finale() {
    await Story.cut(async () => {
      G.phase = 'finale'; G.markerAt = null;
      Sound.stopMusic(1.0);
      UI.setObjective('세 무대의 리허설을 모두 마쳤어요');
      // everyone gathers on the riverbank, past the last string of lanterns so nothing hangs in front of the camera
      const p0 = player.pos.clone(), c0 = comp.pos.clone(), cp = V3(-0.7, 0, -12.2), pp = V3(0.8, 0, -12.0);
      comp.hold = true;
      Cam.to([4.2, 2.3, -10.9], [-0.2, 1.3, -13.2], 1.6);
      await guard(tween(1.8, (k) => { player.pos.lerpVectors(p0, cp, k); player.pos.y = 0; player.speed = 3; player.yaw = Math.atan2(cp.x - p0.x, cp.z - p0.z); comp.pos.lerpVectors(c0, pp, k); comp.speed = 3; comp.yaw = Math.atan2(pp.x - c0.x, pp.z - c0.z); }, Ease.inOut));
      player.speed = 0; comp.speed = 0; player.yaw = Math.PI; comp.yaw = Math.PI;
      const fp = V3(0, 1.7, -14.1);
      fairyBig.root.visible = true; fairyBig.root.position.copy(fp); fairyBig.root.rotation.y = 0; fairyBig.root.scale.setScalar(0.01);
      Sound.sfxPortal(); burst(fp.x, fp.y + 0.6, fp.z, { n: 40, speed: 3.5, g: -0.6 });
      await guard(tween(1.0, (k) => fairyBig.root.scale.setScalar(Math.max(0.01, Ease.outBack(k))), Ease.linear));
      fairyBig.play('pose', 2.0);
      await guard(UI.say('fairy', '세 나라의 춤이 모두 준비됐구나! 고마워, 클라라. 이제 궁전으로 가는 다리를 놓아 줄게.'));
      await guard(Cam.to([6.4, 3.4, -11.4], [0, 0.5, -16.8], 1.4));
      fairyBig.play('spin', 2.4); Sound.sfxTransform();
      let shown = -1;
      await guard(tween(3.4, (k) => {
        this.W.bridge.set(k);
        const i = Math.floor(clamp(k * 1.5, 0, 0.999) * this.W.bridge.NB);
        if (i > shown && k * 1.5 <= 1.0) { shown = i; Sound.sfxBridge(i); const z = lerp(this.W.bridge.z0, this.W.bridge.z1, (i + 0.5) / this.W.bridge.NB); burst(0, 0.4, z, { n: 6, speed: 2, colors: ['#ffd6e6', '#ffffff', '#ffe9a8'] }); }
      }, Ease.linear));
      Sound.sfxGate();
      for (let i = 0; i < 7; i++) {
        setTimeout(() => {
          if (G.chapter !== 4) return;
          burst(rnd(-14, 14), rnd(13, 19), rnd(-40, -24), { n: 46, speed: 6, g: -1.2, size: 1.6, life: 1.6, colors: pick([GOLDS, ['#ffc0d6', '#ffffff', '#f3c3cc'], ['#9ff0e6', '#ffffff', '#ffe9a8']]) });
          Sound.sfxFirework();
        }, 300 + i * 480);
      }
      await guard(Cam.to([2.4, 4.4, -11.8], [0, 6.0, -48], 1.8));
      await guard(tween(2.0, (k) => this.W.palace.set(k), Ease.inOut));
      await guard(UI.say('narrator', '초콜릿 강 위로 사탕 다리가 솟아오르고, 강 건너 설탕 궁전의 창문마다 불이 켜졌어요.'));
      await guard(Cam.to([player.pos.x + 2.5, 2.0, player.pos.z + 2.3], [player.pos.x + 0.5, 1.25, player.pos.z - 0.6], 1.2));
      prince.play('bow', 1.2);
      await guard(UI.say('prince', '궁전에서 축제가 시작될 거예요. 함께 가요, 클라라!'));
      clara.play('curtsy', 1.5); clara.setExpr('happy', 3);
      await guard(UI.say('clara', '응! 초콜릿, 커피, 차 무용수들 모두 정말 고마워!'));
      Sound.playMusic('waltz');
      // across the bridge (only x and z are led: the planks carry them up and over the arch)
      const B = this.W.bridge, along = (k) => V3(0, 0, lerp(B.z0, B.z1, k));
      const q0 = player.pos.clone(), r0 = comp.pos.clone();
      await guard(Cam.to([5.4, 3.2, -11.6], [0, 1.2, -17.0], 1.0));
      await guard(tween(3.6, (k) => {
        const a = clamp(k * 1.25, 0, 1), b = clamp(k * 1.25 - 0.2, 0, 1);
        const pa = a < 0.25 ? V3().lerpVectors(q0, along(0), a / 0.25) : along(((a - 0.25) / 0.75) * 0.85), pb = b < 0.25 ? V3().lerpVectors(r0, along(0), b / 0.25) : along(((b - 0.25) / 0.75) * 0.85);
        player.pos.x = pa.x - 0.45; player.pos.z = pa.z; player.speed = 2.6; player.yaw = Math.PI;
        comp.pos.set(pb.x + 0.45, 0, pb.z); comp.speed = 2.6; comp.yaw = Math.PI;
      }, Ease.inOut));
      await guard(UI.fade(1, 1.0));
      Sound.sfxFanfare();
      UI.hide('hud');
      clara.root.visible = false; prince.root.visible = false; blobs.clara.visible = false; blobs.nut.visible = false; fairyBig.root.visible = false;
      Cam.set([14, 9, 16], [0, 2.4, -6]);
      this.shot = this.snapshot();
      await guard(UI.fade(0, 1.0));
    }, false);
    this.clear();
  },
  clear() {
    G.mode = 'clear'; G.locked = true;
    UI.hide('hud'); UI.hide('controls'); UI.hide('recital');
    const prev = Save.data.done.sweets, R0 = this.results;
    const rec = { choco: this.brief(R0.choco), coffee: this.brief(R0.coffee), tea: this.brief(R0.tea), time: G.time, best: prev ? Math.min(prev.best || prev.time, G.time) : G.time };
    Save.data.done.sweets = rec;
    Save.data.unlocked = Math.max(Save.data.unlocked, 5);
    delete Save.data.ch4;
    Save.write();
    UI.clearCard({
      kicker: '제4장 · 이야기 끝', title: '과자의 왕국', icon: 'i-candy',
      stats: [['캐스터네츠', rec.choco.ok !== undefined ? `${rec.choco.ok} / ${rec.choco.total || 6}` : '성공'], ['비단 자락', rec.coffee.pct !== undefined ? `${rec.coffee.pct}%` : '성공'], ['찻잔 탑', rec.tea.cups !== undefined ? `${rec.tea.cups} / ${rec.tea.goal || 8}` : '성공']],
      unlock: '<b>제5장 · 설탕 요정의 궁전</b>으로 가는 다리가 놓였어요!<br><span>다음 무대는 지금 정성껏 꾸미고 있어요.</span>', next: false,
    });
    UI.show('screenClear');
  },
  snapshot() {
    try {
      const cv = makeCanvas(640, 400), c2 = cv.getContext('2d');
      const cam = new THREE.PerspectiveCamera(40, 1.6, 0.1, 220);
      cam.position.set(11, 8.5, 15); cam.lookAt(0, 2.6, -8);
      const size = new THREE.Vector2(); renderer.getDrawingBufferSize(size);
      const pr = renderer.getPixelRatio(), w = 640, h = 400;
      camera.clearViewOffset();
      renderer.setViewport(0, 0, w / pr, h / pr); renderer.setScissor(0, 0, w / pr, h / pr); renderer.setScissorTest(true);
      renderer.render(scene, cam);
      c2.drawImage(renderer.domElement, 0, size.y - h, w, h, 0, 0, w, h);
      renderer.setScissorTest(false); renderer.setViewport(0, 0, size.x / pr, size.y / pr);
      return cv.toDataURL('image/jpeg', 0.86);
    } catch (e) { return ''; }
  },

  /* ---------- the 3D view steps aside for the rehearsal panel (above it on a phone, beside it on a wide screen) ---------- */
  setView(k) {
    this.viewK = k;
    const w = window.innerWidth, h = window.innerHeight;
    if (k <= 0.001) { camera.clearViewOffset(); return; }
    if (h > w * 1.1) camera.setViewOffset(w, h, 0, Math.round(h * 0.2 * k), w, h);
    else if (w >= 760) camera.setViewOffset(w, h, Math.round(w * 0.12 * k), 0, w, h);
    else camera.clearViewOffset();
  },
  applyView() { if (G.chapter === 4) this.setView(this.viewK); },
  onPause(on) { if (!Recital.running) return; if (on) Recital.pause(); else Recital.resume(); },
  helpText() {
    const id = this.active;
    if (!id) return '';
    if (id === 'choco') return DEVICE.touch ? '왼쪽은 발 구르기, 오른쪽은 캐스터네츠 · 무용수가 들려준 박자를 그대로 따라 쳐요' : '발 구르기 A·F·← · 캐스터네츠 D·J·→ · 화면을 눌러도 돼요 · 일시정지 Esc';
    if (id === 'coffee') return DEVICE.touch ? '빛나는 구슬을 손가락으로 따라가요 · 구슬 둘레의 고리 안에 있으면 돼요' : '마우스로 빛나는 구슬을 따라가요 · 방향키·WASD도 돼요 · 일시정지 Esc';
    return DEVICE.touch ? '찻잔이 탑 바로 위에 오면 화면을 톡 · 박자에 맞추면 정확!' : 'Space·Enter·↓로 찻잔 내려놓기 · 화면을 눌러도 돼요 · 일시정지 Esc';
  },

  /* ---------- per frame ---------- */
  update(dt) {
    const W4 = this.W; if (!W4) return;
    const t = FX.uniforms.uTime.value;
    // the river and the fountain flow
    const m = MAT4.choc.map; m.offset.x = (m.offset.x + dt * 0.03) % 1;
    const f = MAT4.flow.map; f.offset.y = (f.offset.y + dt * 0.45) % 1;
    if (W4.fountain.on > 0.5 && Math.random() < dt * 5) { const F = SWEET.fountain, a = rnd(0, TAU); FX.norm.spawn({ x: F.x + Math.cos(a) * 1.15, y: 0.55, z: F.z + Math.sin(a) * 1.15, vx: Math.cos(a) * 0.5, vy: rnd(0.6, 1.1), vz: Math.sin(a) * 0.5, g: -5, life: 0.5, size: 0.08, size1: 0.03, color: '#6b3a24', alpha: 0.9, cell: CELL.glow }); }
    if (W4.flags.k > 0) W4.flags.set(W4.flags.k, t);
    // the dancers practise on their stages while nobody rehearses with them
    for (const id of DANCE_ORDER) {
      const d = this.dancers[id];
      if (this.active !== id && !d.a.action && G.phase !== 'stage' && Math.random() < dt * 0.35) { const mv = pick(DANCES[id].idle); d.play(mv, mv === 'veil' ? 3.0 : mv === 'spin' ? 1.2 : mv === 'pose' ? 1.6 : 0.5); }
      d.update(dt, 0, true, 0);
      if (d.updateVeil) d.updateVeil(t);
    }
    // the candy makers at work, and a gingerbread child strolling around the fountain
    this.ginger.forEach((gb) => gb.update(dt, gb === this.kid ? 0.6 : 1));
    if (this.kid) {
      const k = this.kid, F = SWEET.fountain, near = Math.hypot(player.pos.x - k.root.position.x, player.pos.z - k.root.position.z) < 1.2;
      if (!near) k.walk.a += dt * 0.16;
      const x = F.x + Math.cos(k.walk.a) * 3.4, z = F.z + Math.sin(k.walk.a) * 3.4;
      k.root.position.set(x, 0, z); k.root.rotation.y = -k.walk.a + (near ? 0 : Math.PI);
      if (near) k.root.rotation.y = Math.atan2(player.pos.x - x, player.pos.z - z);
      k.walk.col.x = x; k.walk.col.z = z;
      if (near && k.a.hop <= 0 && Math.random() < dt * 0.8) k.a.hop = 0.5;
    }
    W4.sky.position.set(camera.position.x, 0, camera.position.z);
    W4.clouds.rotation.y += dt * 0.004;
    if (fairyBig.root.visible) { fairyBig.update(dt, 0, false, 0); if (G.phase !== 'finale') fairyBig.root.position.y += Math.sin(t * 1.6) * 0.002; if (Math.random() < dt * 12) { const p = fairyBig.root.position; FX.add.spawn({ x: p.x + rnd(-0.6, 0.6), y: p.y + rnd(0, 1.6), z: p.z + rnd(-0.4, 0.4), vy: 0.4, life: 1, size: 0.25, size1: 0, color: pick(['#ffd6e0', '#cfe3ff', '#fff1c4']), cell: CELL.sparkle, rot: rnd(0, 3) }); } }
    if (W4.archGlow) W4.archGlow.material.opacity = 0.26 + Math.sin(t * 1.8) * 0.05;
    // the entrance arch steps out of the way while the camera stands right behind it
    const A = SWEET.arch; W4.arch.visible = Math.hypot(camera.position.x - A.x, camera.position.y - 3, camera.position.z - A.z) > 7;
    if (this.active) Recital.update(dt);
    // the prince keeps up (a sparkle hop if he falls far behind)
    if (comp.mode === 'prince' && G.mode === 'play' && !G.locked && !comp.hold) {
      const dd = Math.hypot(comp.pos.x - player.pos.x, comp.pos.z - player.pos.z);
      if (dd > 8.5 || (player.grounded && player.pos.y > 0.4 && dd > 4.5 && !this.hopT)) {
        puff(comp.pos.x, 0.6, comp.pos.z, { n: 8, size: 0.7, colors: ['#fff1c4', '#ffffff'] });
        const np = V3(player.pos.x - Math.sin(player.yaw) * 1.4, 0, player.pos.z - Math.cos(player.yaw) * 1.4); resolve(np, 0.3, 0, 1.5); comp.pos.copy(np);
        burst(np.x, 1, np.z, { n: 12, speed: 2 }); this.hopT = 3;
      }
    }
    this.hopT = Math.max(0, (this.hopT || 0) - dt);
    this.updateMarker(t);
  },
  /* a guide above the next stage that still needs help, while Clara is far from it */
  updateMarker(t) {
    let mk = null;
    if (G.phase === 'explore' && G.mode === 'play') {
      const next = DANCE_ORDER.find((id) => !this.done[id]);
      if (next) { const s = this.W.stages[next], p = stageToWorld(s.def, 0, 3.6, -0.35); if (Math.hypot(player.pos.x - s.front.x, player.pos.z - s.front.z) > 5.5) mk = p; }
    }
    if (mk) { marker.visible = true; marker.position.set(mk.x, mk.y + Math.sin(t * 3) * 0.12, mk.z); marker.rotation.y = t * 1.5; marker.scale.setScalar(1.6); }
    else marker.visible = false;
  },
  /* ---------- per-frame story logic: prompts and hints ---------- */
  tick() {
    Story.near = null;
    if (G.mode === 'play' && !G.locked && player.grounded) {
      let bd = 1e9;
      for (const it of this.interacts) {
        if (!it.when()) continue;
        const d = Math.hypot(player.pos.x - it.x, player.pos.z - it.z);
        if (d < it.r && d < bd) { bd = d; Story.near = it; }
      }
    }
    const nr = Story.near;
    if (nr) { const s = toScreen(_v3.set(...nr.p)); const lab = typeof nr.label === 'function' ? nr.label() : nr.label; UI.prompt(lab, s.x, s.y - 12); UI.setAction(nr.icon, typeof nr.short === 'function' ? nr.short() : nr.short); }
    else { UI.prompt(null); UI.setAction('spin', '피루엣'); }
    if (G.mode !== 'play' || G.phase !== 'explore') return;
    if (G.time - (this.lastProgress || 0) > 45) {
      this.lastProgress = G.time;
      const next = DANCE_ORDER.find((id) => !this.done[id]);
      if (next) UI.hint(`빛나는 표시를 따라 ${DANCES[next].name} 무대로 가 보세요`, 5200);
    }
    if (!Input.anyMove && G.time > 6 && !this.moveHinted) { this.moveHinted = true; UI.hint(DEVICE.touch ? '화면 왼쪽 아래를 손가락으로 끌어 클라라를 움직여요' : 'WASD 또는 방향키로 클라라를 움직여요', 6000); }
  },
};
