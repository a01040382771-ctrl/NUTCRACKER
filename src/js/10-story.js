/* =====================================================================
   10 · STORY — chapter flow, cutscenes, title & storybook map, saving
   ===================================================================== */
const CHAPTERS = [
  { id: 'mansion', no: '제1장', roman: 'I', title: '크리스마스 저택', en: 'The Christmas Mansion', icon: 'i-house', desc: '크리스마스 이브, 슈탈바움 저택의 거실. 드로셀마이어 아저씨의 선물과 빛을 잃은 트리의 별, 그리고 자정의 비밀이 클라라를 기다려요.' },
  { id: 'toys', no: '제2장', roman: 'II', title: '장난감 왕국', en: 'The Toy Kingdom', icon: 'i-soldier', desc: '커다래진 트리 아래, 양철 병정과 태엽 인형이 사는 장난감 왕국. 생쥐 왕이 흩뜨려 놓은 왕궁 조각 열두 개를 찾아 설계도대로 다시 조립해야 해요.' },
  { id: 'snow', no: '제3장', roman: 'III', title: '눈송이의 숲', en: 'The Snowflake Forest', icon: 'i-snow', desc: '눈송이 요정들이 왈츠를 추는 은빛 숲. 바람을 타고 춤추듯 뛰어올라 길을 찾아야 해요.' },
  { id: 'sweets', no: '제4장', roman: 'IV', title: '과자의 왕국', en: 'The Kingdom of Sweets', icon: 'i-candy', desc: '사탕 지팡이 다리와 초콜릿 강이 흐르는 달콤한 나라. 과자 장인들이 클라라를 위한 축제를 준비하고 있어요.' },
  { id: 'palace', no: '제5장', roman: 'V', title: '설탕 요정의 궁전', en: 'The Sugar Plum Palace', icon: 'i-crown', desc: '설탕 결정으로 지은 반짝이는 궁전. 설탕 요정이 마지막 춤으로 클라라의 꿈을 완성해 줄 거예요.' },
];
const Save = {
  key: 'nutcracker-clara-v1',
  data: { done: {}, unlocked: 1, sound: true, quality: 'auto' },
  load(hot) {
    try { const s = localStorage.getItem(this.key); if (s) Object.assign(this.data, JSON.parse(s)); } catch (e) { /* private mode */ }
    if (hot && hot.save && typeof hot.save === 'object') Object.assign(this.data, hot.save);
    Sound.muted = !this.data.sound;
  },
  write() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* ignore */ } },
};
try { if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ save: Save.data })); } catch (e) { /* not hosted */ }

const STAR_DEFS = [
  { id: 's1', pos: [-2.6, 0.95, 4.4], hint: '카펫 위에서 별 하나가 반짝이고 있어요.' },
  { id: 's2', pos: [-12.05, 1.45, 2.6], hint: '분홍 소파 위를 살펴보세요. 점프로 올라갈 수 있어요.' },
  { id: 's3', train: true, hint: '트리 둘레를 도는 기차의 화물칸에 별이 실려 있어요!' },
  { id: 's4', hidden: true, base: [10.45, 1.15, 2.5], hint: '오른쪽 탁자 위 오르골의 태엽을 감아 보세요.' },
  { id: 's5', hidden: true, base: [9.2, 1.0, -2.45], hint: '흔들 목마를 흔들어 보면 어떨까요?' },
  { id: 's6', hidden: true, base: [10.0, 1.0, -7.05], hint: '벽난로 양말 속에 무언가 들어 있는 것 같아요.' },
  { id: 's7', pos: [-8.15, 2.15, 5.6], hint: '찻잔 테이블 위! 발받침을 밟고 뛰어올라 보세요.' },
  { id: 's8', pos: [9.05, 3.35, -8.4], hint: '벽난로 선반 위예요. 알파벳 블록을 계단 삼아 올라가 보세요.' },
];
const FLAVOR = {
  clock: ['narrator', '똑딱, 똑딱… 드로셀마이어 아저씨가 만든 부엉이 시계예요. 자정이 되면 부엉이가 눈을 뜬다는 소문이 있지요.'],
  soldiers: ['clara', '꼿꼿이 선 장난감 병정들. 왠지 누군가의 명령을 기다리고 있는 것 같아.'],
  window: ['clara', '창밖엔 하얀 눈이 소복소복… 마을의 불빛도 크리스마스를 축하하고 있어.'],
};
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* which stage is lit: 1 = the mansion, 2 = the toy kingdom */
const World = {
  W1: null,
  use(ch) {
    const toy = ch === 2 && !!Toy.W;
    G.chapter = toy ? 2 : 1;
    this.W1.root.visible = !toy;
    if (Toy.W) Toy.W.root.visible = toy;
    W = toy ? Toy.W : this.W1;
    scene.fog = toy ? Toy.fog : null;
    scene.background = toy ? Toy.bg : TEX.bg;
    Cam.cfg = toy ? CAM2 : CAM1;
    renderer.shadowMap.needsUpdate = true;
  },
};

const Story = {
  near: null, roomShot: '', mapSel: 0, spawnT: 0, crownDrop: null, prevMode: 'play', interacts: [],
  run(fn) { Promise.resolve().then(fn).catch((e) => { if (e !== CANCELLED) console.error(e); }); },
  setup() {
    const busy = ['gift', 'collect', 'tree'];
    this.interacts = [
      { id: 'gift', p: [0, 1.5, -1.7], x: 0, z: -1.7, r: 1.6, label: '선물 상자 열기', short: '열기', icon: 'gift', when: () => G.phase === 'gift', act: () => this.openGift() },
      { id: 'music', p: [11.55, 1.95, 1.65], x: 11.0, z: 1.6, r: 1.8, label: '오르골 태엽 감기', short: '태엽 감기', icon: 'music', when: () => G.phase === 'collect' && !flags.music, act: () => this.musicBox() },
      { id: 'horse', p: [10, 2.35, -3.6], x: 10, z: -2.8, r: 1.8, label: '흔들 목마 흔들기', short: '흔들기', icon: 'interact', when: () => G.phase === 'collect' && !flags.horse, act: () => this.horse() },
      { id: 'stocking', p: [10, 2.25, -7.9], x: 10, z: -7.25, r: 1.6, label: '양말 들여다보기', short: '살펴보기', icon: 'eye', when: () => G.phase === 'collect' && !flags.stocking, act: () => this.stocking() },
      { id: 'tree', p: [0, 3.1, -3.9], x: 0, z: -2.9, r: 2.4, label: '트리에 별빛 밝히기', short: '별빛 밝히기', icon: 'star', when: () => G.phase === 'tree', act: () => this.lightTree() },
      { id: 'portal', p: [0, 1.7, -0.5], x: 0, z: -0.5, r: 1.6, label: '별의 문으로 들어가기', short: '들어가기', icon: 'portal', when: () => G.phase === 'portal', act: () => this.enterPortal() },
      { id: 'clock', p: [-10, 3.5, -8.2], x: -10, z: -7.5, r: 1.6, label: '부엉이 시계 살펴보기', short: '살펴보기', icon: 'clock', when: () => busy.includes(G.phase), act: () => this.flavor('clock') },
      { id: 'soldiers', p: [8.6, 1.75, 7.3], x: 8.6, z: 6.3, r: 1.9, label: '장난감 병정 살펴보기', short: '살펴보기', icon: 'eye', when: () => busy.includes(G.phase), act: () => this.flavor('soldiers') },
      { id: 'window', p: [-4.6, 3.3, -8.9], x: -4.6, z: -7.9, r: 1.4, label: '창밖 바라보기', short: '바라보기', icon: 'eye', when: () => busy.includes(G.phase), act: () => this.flavor('window') },
    ];
    const on = (id, fn) => { $(id).addEventListener('click', (e) => { e.preventDefault(); Sound.init(); fn(); }); };
    on('btnStart', () => { Sound.sfxUI(); this.startChapter(); });
    on('btnChapters', () => { Sound.sfxUI(); this.openMap(); });
    on('btnMapBack', () => { Sound.sfxUI(); UI.hide('screenMap'); UI.show('screenTitle'); });
    on('btnPlayChapter', () => {
      if (this.mapSel === 0) { Sound.sfxUI(); this.startChapter(); }
      else if (this.mapSel === 1 && Save.data.unlocked >= 2) { Sound.sfxUI(); Toy.start(); }
    });
    on('btnPause', () => this.pause());
    on('btnResume', () => this.resume());
    on('btnRestart', () => { Sound.sfxUI(); if (G.chapter === 2) Toy.start(); else this.startChapter(); });
    on('btnToMap', () => { Sound.sfxUI(); this.toTitle(); this.openMap(); });
    on('btnSound', () => this.toggleSound());
    on('btnSoundTitle', () => this.toggleSound());
    on('btnQuality', () => { const order = ['auto', 'high', 'low']; const q = order[(order.indexOf(Perf.quality) + 1) % 3]; setQuality(q); Save.data.quality = q; Save.write(); this.syncToggles(); });
    on('btnClearMap', () => { Sound.sfxUI(); const next = Math.min(CHAPTERS.length - 1, G.chapter); this.toTitle(); this.mapSel = next; this.openMap(); });
    on('btnClearReplay', () => { Sound.sfxUI(); if (G.chapter === 2) Toy.start(); else this.startChapter(); });
    on('btnClearNext', () => { Sound.sfxUI(); Toy.start(); });
    this.syncToggles();
  },
  toggleSound() {
    Save.data.sound = !Save.data.sound; Save.write();
    Sound.setMuted(!Save.data.sound);
    if (Save.data.sound) Sound.sfxUI();
    this.syncToggles();
  },
  syncToggles() {
    $('soundState').textContent = Save.data.sound ? '켜짐' : '꺼짐';
    $('soundUse').setAttribute('href', Save.data.sound ? '#i-sound' : '#i-mute');
    $('qualityState').textContent = { auto: '자동', high: '선명하게', low: '부드럽게' }[Perf.quality] || '자동';
  },

  /* ---------- world reset ---------- */
  resetWorld() {
    Object.assign(G, { phase: 'none', stars: 0, time: 0, throws: 0, waveKills: 0, waveSpawned: 0, kingHits: 0, combat: false, markerAt: null, lastStarT: 0 });
    for (const k in flags) delete flags[k];
    Object.assign(player, { yaw: Math.PI, vy: 0, grounded: true, stun: 0, invuln: 0, knockT: 0, coyote: 0, jumpBuf: 0, throwCd: 0, speed: 0, float: false });
    player.pos.set(0, 0, 6.2); player.vel.set(0, 0, 0);
    clara.a.action = null; clara.setExpr('smile'); clara.root.visible = true;
    UI.setStars(0);
    comp.mode = 'off'; comp.hold = false; comp.target = null; comp.pos.set(1.0, 0, 7); comp.y = 0;
    nut.root.visible = false; nut.root.scale.setScalar(0.42); prince.root.visible = false; blobs.nut.visible = false;
    const tr = W.tree; tr.group.scale.setScalar(1); tr.col.r = 2.5; tr.lit = 0;
    const gp = W.props.gift; gp.grp.visible = true; gp.grp.scale.setScalar(1); gp.lid.position.set(0, 0.82, 0); gp.lid.rotation.set(0, 0, 0); gp.col.on = true;
    W.props.musicBox.playing = 0; W.props.horse.kick = 0;
    Object.assign(W.props.clock, { minutes: 45, hours: 11, flap: 0 });
    owlGlow.material.uniforms.uBoost.value = 0;
    starSet.reset(); starSet.items.length = 0;
    STAR_DEFS.forEach((s) => {
      if (s.train) { const it = starSet.add(s.id, V3(), { hidden: true }); const car = W.train.cars[1]; const tmp = V3(); it.follow = () => tmp.copy(car.g.position).setY(0.86); }
      else starSet.add(s.id, V3(...(s.pos || s.base)), { hidden: true });
    });
    mice.forEach((m) => { m.state = 'off'; m.m.root.visible = false; m.blob.visible = false; });
    K.state = 'off'; king.root.visible = false; blobs.king.visible = false; king.root.scale.setScalar(1); king.root.position.y = 0; king.crownStars.forEach((s) => (s.visible = true)); king.a.mode = 'idle'; king.flash(0);
    if (this.crownDrop) { scene.remove(this.crownDrop); this.crownDrop = null; }
    soldiers.forEach((s) => { s.pos.copy(s.home); s.yaw = 0; s.guard = null; s.cd = 1; });
    slippers.forEach((s) => { s.on = false; s.mesh.visible = false; });
    portal.visible = false; portal.scale.setScalar(1); fairyBig.root.visible = false;
    applyMood(0);
    magicSnow.material.uniforms.uOpacity.value = 0; magicSnow.visible = false;
    W.train.halt = false;
    Cam.shake = 0; UI.prompt(null);
    renderer.shadowMap.needsUpdate = true;
    FX.add.clear(); FX.norm.clear();
  },

  /* ---------- screens ---------- */
  toTitle(first) {
    RUN_ID++; Tasks.clear(); UI.closeDialog();
    Toy.leave(); World.use(1);
    this.resetWorld();
    G.mode = 'title'; G.locked = true;
    Cam.set([0, 6.6, 34], [0, 5.2, 0]); Cam.mode = 'title';
    W.theatre.set(0.34);
    stageSnow.visible = true;
    ['hud', 'controls', 'screenMap', 'screenClear', 'screenPause', 'hint', 'toast'].forEach((id) => UI.hide(id));
    UI.show('screenTitle');
    if (first) {
      const L = $('screenLoading'); L.style.transition = 'opacity .8s ease'; L.style.opacity = '0';
      setTimeout(() => { L.hidden = true; }, 820);
    }
    Sound.playMusic('title');
  },
  openMap() {
    UI.hide('screenTitle');
    this.renderMap();
    UI.show('screenMap');
  },
  renderMap() {
    const toc = $('toc'); toc.textContent = '';
    CHAPTERS.forEach((ch, i) => {
      const unlocked = i < Save.data.unlocked, done = Save.data.done[ch.id];
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.className = `toc-item${unlocked ? '' : ' locked'}${i === this.mapSel ? ' sel' : ''}`;
      const state = done ? (i === 1 ? `<svg><use href="#i-block"/></svg>${done.pieces}/12` : `<svg><use href="#i-star"/></svg>${done.stars}/12`) : unlocked ? (i === 0 ? '별 12개' : i === 1 ? '조각 12개' : '준비 중') : '잠김';
      b.innerHTML = `<span class="toc-ico"><svg><use href="#${unlocked ? ch.icon : 'i-lock'}"/></svg></span><span class="toc-no">${ch.roman}</span><span class="toc-name">${ch.title}</span><span class="toc-state">${state}</span>`;
      b.addEventListener('click', () => { this.mapSel = i; Sound.sfxUI(); this.renderMap(); });
      li.appendChild(b); toc.appendChild(li);
    });
    const sel = this.mapSel, ch = CHAPTERS[sel], unlocked = sel < Save.data.unlocked, done = Save.data.done[ch.id];
    const playable = unlocked && sel <= 1;
    $('mapNo').textContent = `${ch.no} · Chapter ${ch.roman}`; $('mapTitle').textContent = ch.title; $('mapEn').textContent = ch.en; $('mapDesc').textContent = ch.desc;
    const img = $('mapImg'), shot = sel === 0 ? this.roomShot : sel === 1 ? Toy.shot : '';
    if (shot) { img.src = shot; img.hidden = false; $('mapArtIco').hidden = true; }
    else { img.hidden = true; $('mapArtIco').hidden = false; $('mapArtUse').setAttribute('href', `#${ch.icon}`); }
    const veil = $('mapLock');
    if (!unlocked) { veil.hidden = false; $('mapLockText').textContent = `${CHAPTERS[sel - 1].title}을 마치면 열려요`; }
    else if (!playable) { veil.hidden = false; $('mapLockText').textContent = '이 무대는 지금 정성껏 꾸미는 중이에요'; }
    else veil.hidden = true;
    let stats = '';
    if (sel === 0) stats = done ? `최고 기록 ${fmtTime(done.best || done.time)} · 별 ${done.stars}/12` : '마법의 별 12개 · 약 8–12분';
    else if (sel === 1 && unlocked) stats = done ? `최고 기록 ${fmtTime(done.best || done.time)} · 조각 ${done.pieces}/12` : '왕궁 조각 12개 · 약 12–18분';
    $('mapStats').textContent = stats;
    const btn = $('btnPlayChapter');
    btn.disabled = !playable;
    btn.textContent = playable ? (done ? '다시 펼치기' : '이야기 펼치기') : unlocked ? '곧 공개돼요' : '잠겨 있어요';
  },
  pause() {
    if (G.mode !== 'play' && G.mode !== 'cutscene') return;
    this.prevMode = G.mode; G.mode = 'paused';
    this.syncToggles(); UI.show('screenPause');
  },
  resume() { if (G.mode !== 'paused') return; UI.hide('screenPause'); G.mode = this.prevMode || 'play'; },
  togglePause() { if (G.mode === 'paused') this.resume(); else this.pause(); },

  /* ---------- chapter flow ---------- */
  startChapter() {
    RUN_ID++; Tasks.clear(); UI.closeDialog();
    ['screenTitle', 'screenMap', 'screenClear', 'screenPause'].forEach((id) => UI.hide(id));
    Toy.leave(); World.use(1);
    UI.setChapterHud('제1장', '크리스마스 저택', 'i-star');
    this.resetWorld();
    G.mode = 'cutscene'; G.locked = true;
    Cam.mode = 'free';
    this.run(() => this.intro());
  },
  async intro() {
    Sound.playMusic('waltz');
    const o0 = W.theatre.open;
    tween(3.0, (k) => W.theatre.set(lerp(o0, 1, k)), Ease.inOut);
    tween(2.6, (k) => { stageSnow.material.uniforms.uOpacity.value = 0.9 * (1 - k); });
    await guard(Cam.to([0, 9.4, 19.5], [0, 2.2, -2.5], 3.2));
    stageSnow.visible = false; stageSnow.material.uniforms.uOpacity.value = 0.9;
    UI.chapterCard('Chapter I', '크리스마스 저택');
    await guard(wait(2.8));
    await guard(UI.say('narrator', '크리스마스 이브의 밤, 슈탈바움 저택의 거실에는 촛불과 금빛 장식이 반짝였어요.'));
    await guard(Cam.to([1.9, 2.7, 9.8], [0, 1.15, 5.8], 1.8));
    clara.play('curtsy', 1.5);
    await guard(UI.say('narrator', '손님들이 모두 돌아간 뒤, 클라라는 트리 아래에 놓인 특별한 선물 하나를 발견했지요.'));
    clara.setExpr('happy', 2.5);
    await guard(UI.say('clara', '드로셀마이어 아저씨의 선물이야! 리본에 내 이름이 적혀 있어.'));
    this.beginPlay();
    this.setPhase('gift');
    UI.hint(DEVICE.touch ? '왼쪽 아래를 끌어서 움직이고, 금빛 버튼으로 살펴보거나 점프해요' : 'WASD·방향키로 움직이고 Space로 점프, E로 살펴봐요', 7000);
  },
  beginPlay() {
    G.locked = false; G.mode = 'play'; Cam.follow();
    UI.show('hud'); $('hud').classList.remove('cine'); if (DEVICE.touch) UI.show('controls');
  },
  async cut(fn, resume = true) {
    G.locked = true; G.mode = 'cutscene';
    UI.hide('controls'); UI.prompt(null); $('hud').classList.add('cine');
    player.vel.set(0, 0, 0);
    await fn();
    if (resume) this.beginPlay();
  },
  setPhase(ph) {
    G.phase = ph;
    switch (ph) {
      case 'gift': UI.setObjective('트리 앞에서 반짝이는 선물 상자를 열어 보세요'); G.markerAt = V3(0, 2.0, -1.7); break;
      case 'collect': UI.setObjective(`마법의 별 모으기 ${G.stars} / ${STAR_GOAL}`); G.markerAt = null; G.lastStarT = G.time; break;
      case 'tree': UI.setObjective('트리 앞으로 가서 별빛을 밝혀 주세요'); G.markerAt = V3(0, 3.8, -3.6); break;
      case 'wave': UI.setObjective(`생쥐 군단 물리치기 ${G.waveKills} / ${WAVE_SIZE}`); G.combat = true; this.spawnT = 0.5; break;
      case 'boss': UI.setObjective(`생쥐 왕의 왕관에 슬리퍼 맞히기 ${G.kingHits} / ${KING_HP}`); G.combat = true; break;
      case 'portal': UI.setObjective('트리 앞 별의 문으로 들어가세요'); G.combat = false; G.markerAt = V3(0, 2.6, -0.5); this.portalT = G.time; break;
    }
    Sound.sfxChime();
  },
  interact(it) { this.near = null; UI.prompt(null); this.run(() => it.act()); },
  async flavor(id) {
    const [who, text] = FLAVOR[id];
    clara.play('interact', 0.5);
    await this.cut(async () => { await guard(UI.say(who, text)); });
  },

  /* ---------- gift ---------- */
  async openGift() {
    await this.cut(async () => {
      G.markerAt = null; G.phase = 'opening';
      const gp = W.props.gift;
      player.yaw = Math.atan2(-player.pos.x, -1.7 - player.pos.z);
      await guard(Cam.to([2.2, 2.7, 1.9], [0, 1.2, -1.7], 1.0));
      clara.play('interact', 0.7);
      await guard(wait(0.35));
      Sound.sfxOpen();
      confetti(0, 1.3, -1.7, 60); burst(0, 1.2, -1.7, { n: 40, speed: 4 });
      tween(1.1, (k) => { gp.lid.position.set(0.95 * k, 0.82 + Math.sin(k * Math.PI) * 1.3 - k * 0.75, 0.45 * k); gp.lid.rotation.set(0.2 * k, k * 1.1, -k * 1.75); }, Ease.out);
      comp.mode = 'doll'; comp.hold = true; comp.pos.set(0, 0, -1.7); comp.y = 0.5; comp.yaw = 0;
      nut.root.visible = true; nut.root.scale.setScalar(0.01); blobs.nut.visible = true;
      await guard(tween(1.2, (k) => { nut.root.scale.setScalar(lerp(0.01, 0.42, Ease.outBack(k))); comp.y = 0.5 + k * 0.6; }, Ease.linear));
      nut.a.chomp = 0.8; Sound.sfxChime();
      clara.setExpr('surprised', 1.5);
      await guard(UI.say('clara', '와아… 호두까기 인형이야! 빨간 군복이 정말 멋지다.'));
      clara.setExpr('happy', 2);
      const land = V3(player.pos.x + 0.9, 0, player.pos.z + 0.2);
      const from = comp.pos.clone(), y0 = comp.y;
      await guard(tween(0.7, (k) => { comp.pos.lerpVectors(from, land, k); comp.y = lerp(y0, 0, k) + Math.sin(k * Math.PI) * 0.5; }, Ease.linear));
      comp.hold = false;
      await guard(Cam.to([0, 7.6, 6.5], [0, 4.6, -5.6], 1.4));
      const top = W.tree.topper.getWorldPosition(V3());
      Sound.sfxTransform();
      burst(top.x, top.y, top.z, { n: 50, speed: 5, g: -1 });
      STAR_DEFS.forEach((s, i) => { if (!s.hidden) setTimeout(() => starSet.reveal(s.id, top), i * 90); });
      await guard(wait(1.3));
      await guard(UI.say('narrator', '그런데 그 순간, 트리 꼭대기의 별이 반짝 하고 빛을 잃더니 거실 곳곳으로 흩어져 버렸어요.'));
      await guard(UI.say('narrator', '마법의 별 여덟 개를 모아 트리에 다시 빛을 밝혀 주세요. 반짝이는 물건 속에도 별이 숨어 있대요.'));
    });
    this.setPhase('collect');
  },

  /* ---------- hidden stars ---------- */
  async musicBox() {
    flags.music = true;
    clara.play('interact', 0.6); Sound.sfxCrank();
    W.props.musicBox.playing = 8;
    Sound.duck(0.2, 7.5);
    setTimeout(() => Sound.playSeq(MUSICBOX_MEL, 112, 0.12, 1.3), 500);
    UI.toast('오르골 위에서 작은 발레리나가 춤을 춰요 ♪');
    await guard(wait(2.2));
    starSet.reveal('s4', V3(11.55, 1.85, 1.65)); Sound.sfxChime();
  },
  async horse() {
    flags.horse = true;
    clara.play('interact', 0.6);
    W.props.horse.kick = 1;
    Sound.pluck(Sound.now, noteFreq('G3'), 0.5, 0.2); Sound.pluck(Sound.now + 0.45, noteFreq('D3'), 0.5, 0.2);
    UI.toast('이랴! 흔들 목마가 신나게 흔들려요');
    await guard(wait(1.2));
    starSet.reveal('s5', V3(10, 1.8, -3.6)); Sound.sfxChime();
  },
  async stocking() {
    flags.stocking = true;
    clara.play('interact', 0.6);
    W.props.stockings[1].userData.wiggle = 1; Sound.sfxUI();
    UI.toast('양말 속에서 무언가 반짝여요!');
    await guard(wait(0.9));
    starSet.reveal('s6', V3(10, 2.0, -7.9)); Sound.sfxChime();
  },
  onStar() {
    if (G.phase === 'collect') {
      UI.setObjective(`마법의 별 모으기 ${G.stars} / ${STAR_GOAL}`);
      W.props.clock.minutes = 45 + Math.min(G.stars, STAR_GOAL) / STAR_GOAL * 14;
      if (G.stars >= STAR_GOAL) { UI.toast('별 여덟 개를 모두 모았어요!'); this.setPhase('tree'); }
    } else if (G.phase === 'boss') UI.toast(`되찾은 별 ${G.stars} / ${STAR_TOTAL}`, 1600);
  },
  collectStar(it) {
    it.state = 'collect'; it.ct = 0;
    G.stars++; G.lastStarT = G.time;
    burst(it.pos.x, it.pos.y, it.pos.z, { n: 28 });
    Sound.sfxStar(G.stars);
    const s = toScreen(it.pos); UI.flyStar(s.x, s.y);
    const n = G.stars; setTimeout(() => UI.setStars(n), 700);
    clara.setExpr('happy', 1.2);
    if (player.grounded && !clara.a.action && G.combat === false) clara.play('cheer', 0.8);
    this.onStar();
  },

  /* ---------- midnight ---------- */
  async lightTree() {
    await this.cut(async () => {
      G.markerAt = null; G.phase = 'midnight';
      Sound.stopMusic(1.6);
      player.yaw = Math.atan2(-player.pos.x, -6 - player.pos.z);
      clara.play('cheer', 1.0);
      await guard(Cam.to([3.6, 4.0, 4.2], [0, 4.1, -5.8], 1.5));
      const top = W.tree.topper.getWorldPosition(V3());
      const from = V3(player.pos.x, player.pos.y + 1.0, player.pos.z);
      for (let i = 0; i < 8; i++) {
        const a0 = (i / 8) * TAU;
        tween(1.9, (k) => {
          const r = (1 - k) * 1.6 + 0.2, a = a0 + k * 7;
          const p = V3().lerpVectors(from, top, Ease.inOut(k));
          FX.add.spawn({ x: p.x + Math.cos(a) * r, y: p.y, z: p.z + Math.sin(a) * r, life: 0.45, size: 0.42, size1: 0.1, color: '#ffe08a', cell: CELL.star, rot: a });
        }, Ease.linear);
      }
      Sound.sfxOpen();
      await guard(wait(2.0));
      Sound.sfxTransform();
      burst(top.x, top.y, top.z, { n: 70, speed: 6, g: -0.5, size: 1.3 });
      await guard(tween(1.3, (k) => { W.tree.lit = k; }));
      W.props.clock.flap = 3;
      tween(1, (k) => { owlGlow.material.uniforms.uBoost.value = k * 1.6; });
      await guard(UI.say('narrator', '여덟 개의 별빛이 트리 꼭대기에 모이자, 부엉이 시계가 번쩍 눈을 떴어요.'));
      await guard(Cam.to([-6.4, 4.7, -3.0], [-10, 4.6, -8.4], 1.4));
      const m0 = W.props.clock.minutes;
      tween(1.2, (k) => { W.props.clock.minutes = lerp(m0, 60, k); });
      for (let i = 0; i < 12; i++) {
        Sound.sfxBong(); W.props.clock.flap = 0.7; Cam.shake = 0.12;
        if (i === 2) { tween(4.5, (k) => applyMood(k)); magicSnow.visible = true; tween(4, (k) => { magicSnow.material.uniforms.uOpacity.value = k; }); }
        await guard(wait(i < 3 ? 1.0 : 0.55));
      }
      await guard(UI.say('narrator', '뎅— 뎅— 자정이에요. 그 순간, 트리가 점점, 점점 커지기 시작했어요!'));
      await guard(Cam.to([0, 5.6, 11.5], [0, 5.0, -5.5], 1.3));
      Sound.sfxRumble(3.2); Cam.shake = 3.2;
      renderer.shadowMap.autoUpdate = true;
      await guard(tween(3.2, (k) => {
        const s = 1 + 0.7 * k; W.tree.group.scale.setScalar(s); W.tree.col.r = 2.5 + 2.1 * k;
        if (Math.random() < 0.5) { const a = rnd(0, TAU); FX.add.spawn({ x: Math.cos(a) * 2.5 * s, y: rnd(0.5, 6 * s), z: -6 + Math.sin(a) * 2.5 * s, vy: 0.6, life: 1.2, size: 0.4, size1: 0, color: pick(GOLDS), cell: CELL.sparkle, rot: a }); }
      }, Ease.inOut));
      renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
      const gp = W.props.gift; puff(0, 0.6, -1.7, { n: 14, size: 0.9, colors: ['#fff1c4', '#f6e2ff', '#ffffff'] }); gp.grp.visible = false; gp.col.on = false;
      resolve(player.pos, PHYS.R, 0, PHYS.HGT); resolve(comp.pos, 0.2, 0, 0.6);
      clara.setExpr('surprised', 3);
      await guard(Cam.to([player.pos.x + 2.6, 2.7, player.pos.z + 4.2], [player.pos.x, 1.2, player.pos.z], 1.2));
      await guard(UI.say('clara', '트리가 커지는 걸까, 아니면… 내가 작아지고 있는 걸까?'));
      comp.hold = true;
      Sound.sfxTransform();
      const cp = comp.pos.clone();
      await guard(tween(1.5, (k) => {
        nut.root.scale.setScalar(lerp(0.42, 0.95, Ease.outBack(k)));
        if (Math.random() < 0.7) FX.add.spawn({ x: cp.x + rnd(-0.6, 0.6), y: rnd(0, 2.2), z: cp.z + rnd(-0.6, 0.6), vy: 1.2, life: 1, size: rnd(0.2, 0.4), size1: 0, color: pick(GOLDS), cell: CELL.sparkle, rot: rnd(0, 3) });
      }, Ease.linear));
      comp.mode = 'life'; nut.play('salute', 1.4); nut.a.chomp = 1.2;
      await guard(UI.say('nut', '클라라 아가씨, 저를 깨워 주셔서 고맙습니다! 하지만 조심하세요. 생쥐 군단이 몰려옵니다!'));
      await guard(Cam.to([-8.4, 2.6, 10.4], [-12.3, 0.5, 7.4], 1.2));
      for (let i = 0; i < 2; i++) { spawnMouse(); G.waveSpawned++; await guard(wait(0.6)); }
      await guard(wait(0.8));
      soldiers.forEach((s, i) => { s.guard = V3(-3 + i * 2, 0, 3.4 + (i % 2) * 1.2); });
      await guard(UI.say('nut', '병정들이여, 일어나라! 아가씨는 슬리퍼를 던져 생쥐들을 물리쳐 주세요!'));
      comp.hold = false;
      Sound.playMusic('march');
    });
    this.setPhase('wave');
    UI.hint(DEVICE.touch ? '금빛 큰 버튼을 누르면 가까운 생쥐에게 슬리퍼를 던져요' : 'E 키(또는 Enter)를 누르면 가까운 생쥐에게 슬리퍼를 던져요', 6500);
  },
  waveProgress() {
    UI.setObjective(`생쥐 군단 물리치기 ${Math.min(G.waveKills, WAVE_SIZE)} / ${WAVE_SIZE}`);
    if (G.waveKills >= WAVE_SIZE && G.phase === 'wave') { G.phase = 'kingIntro'; G.combat = false; this.run(() => this.kingEntrance()); }
  },
  async kingEntrance() {
    await guard(wait(1.0));
    await this.cut(async () => {
      Sound.stopMusic(0.8);
      const h = W.mouseHole;
      K.pos.set(h.x + 2.4, 0, h.z - 0.8); K.yaw = Math.PI / 2; K.state = 'pose';
      await guard(Cam.to([-6.6, 3.3, 11.0], [-10.2, 1.3, 6.9], 1.3));
      puff(K.pos.x, 0.6, K.pos.z, { n: 22, size: 1.4, colors: ['#8d7f8c', '#b8adb8', '#d8cfd8'] }); Sound.sfxPoof();
      king.root.visible = true; blobs.king.visible = true; king.a.mode = 'laugh';
      tween(0.7, (k) => king.root.scale.setScalar(lerp(0.3, 1, Ease.outBack(k))), Ease.linear);
      Sound.sfxLaugh();
      await guard(wait(1.1));
      await guard(UI.say('king', '찍찍찍! 감히 내 병사들을 쫓아내? 트리의 별빛은 이제 모두 내 왕관의 것이다!'));
      king.a.mode = 'idle';
      await guard(Cam.to([player.pos.x + 1.6, 2.7, player.pos.z + 4.3], [player.pos.x, 1.2, player.pos.z], 1.0));
      clara.setExpr('determined', 4);
      await guard(UI.say('clara', '그 별들을 돌려줘! 별빛이 없으면 크리스마스의 꿈도 사라져 버린단 말이야!'));
      await guard(UI.say('nut', '아가씨, 왕관을 노리세요! 슬리퍼가 맞을 때마다 빼앗긴 별이 떨어질 겁니다.'));
      Sound.playMusic('boss');
    });
    K.state = 'stalk'; K.t = 0; K.stalkFor = 2.6; K.nextSummon = 4; K.taunt = 9;
    this.setPhase('boss');
  },
  kingHit() {
    UI.setObjective(`생쥐 왕의 왕관에 슬리퍼 맞히기 ${G.kingHits} / ${KING_HP}`);
    UI.toast(G.kingHits < KING_HP ? '왕관에서 별이 떨어졌어요! 얼른 주워요' : '마지막 별이에요!', 2000);
    if (G.kingHits >= KING_HP) { K.state = 'defeated'; G.combat = false; G.phase = 'victory'; this.run(() => this.kingDefeat()); }
  },
  async kingDefeat() {
    mice.forEach((m) => { if (m.state !== 'off' && m.state !== 'dead') killMouse(m); });
    await guard(wait(1.2));
    await this.cut(async () => {
      Sound.stopMusic(1.2);
      starSet.items.forEach((it) => { if (it.magnet && (it.state === 'idle' || it.state === 'pop')) { it.state = 'idle'; this.collectStar(it); } });
      await guard(Cam.to([K.pos.x + 2.6, 2.9, K.pos.z + 4.6], [K.pos.x, 1.2, K.pos.z], 1.0));
      king.a.mode = 'dizzy';
      await guard(wait(0.6));
      const y0 = K.yaw;
      await guard(tween(1.4, (k) => { king.root.rotation.y = y0 + k * 12; king.root.scale.setScalar(Math.max(0.05, 1 - k * 0.9)); king.root.position.y = Math.sin(k * Math.PI) * 0.9; }, Ease.in));
      puff(K.pos.x, 0.8, K.pos.z, { n: 26, size: 1.4, colors: ['#8d7f8c', '#b8adb8', '#d8cfd8'] }); Sound.sfxPoof();
      king.root.visible = false; blobs.king.visible = false; K.state = 'off';
      const cr = king.crown.clone(); cr.traverse((o) => { if (o.isMesh) o.castShadow = false; });
      cr.position.set(K.pos.x, 0.07, K.pos.z); cr.rotation.set(0.35, 0.6, 0.25); scene.add(cr); this.crownDrop = cr;
      await guard(UI.say('narrator', '클라라의 슬리퍼가 마지막으로 왕관을 맞히자, 생쥐 왕은 연기처럼 사라져 버렸어요.'));
      comp.hold = true;
      const side = V3(player.pos.x + 1.3, 0, player.pos.z + 0.2); resolve(side, 0.3, 0, 1.5);
      const c0 = comp.pos.clone();
      player.yaw = Math.atan2(side.x - player.pos.x, side.z - player.pos.z);
      await guard(Cam.to([player.pos.x + 0.7, 2.5, player.pos.z + 4.8], [player.pos.x + 0.65, 1.4, player.pos.z], 1.2));
      await guard(tween(0.8, (k) => { comp.pos.lerpVectors(c0, side, k); comp.speed = 2; comp.yaw = Math.atan2(player.pos.x - comp.pos.x, player.pos.z - comp.pos.z); }));
      nut.play('bow', 1.2);
      await guard(wait(1.2));
      Sound.sfxTransform();
      const cp = comp.pos.clone();
      await guard(during(1.4, () => { for (let i = 0; i < 3; i++) FX.add.spawn({ x: cp.x + rnd(-0.7, 0.7), y: rnd(0, 0.4), z: cp.z + rnd(-0.7, 0.7), vy: rnd(1.5, 3), life: 1.2, size: rnd(0.25, 0.5), size1: 0, color: pick(['#ffffff', '#ffe9a8', '#ffd6e0']), cell: CELL.sparkle, rot: rnd(0, 3) }); }));
      await guard(UI.fade(0.92, 0.45));
      nut.root.visible = false; comp.mode = 'prince'; prince.root.visible = true;
      prince.root.position.set(cp.x, 0, cp.z); prince.root.rotation.y = comp.yaw;
      await guard(UI.fade(0, 0.9));
      prince.play('bow', 1.4);
      await guard(UI.say('prince', '고마워요, 클라라. 당신의 용기가 제게 걸린 저주를 풀어 주었어요.'));
      clara.play('curtsy', 1.5); clara.setExpr('happy', 3);
      await guard(UI.say('prince', '저는 과자의 왕국의 왕자랍니다. 함께 꿈의 나라로 떠나요!'));
      await guard(Cam.to([0, 4.2, 8.0], [0, 2.2, -0.9], 1.4));
      portal.visible = true; Sound.sfxPortal();
      await guard(tween(1.2, (k) => portal.scale.setScalar(Math.max(0.01, Ease.outBack(k))), Ease.linear));
      fairyBig.root.visible = true; fairyBig.root.position.set(0, 1.1, -1.25); fairyBig.root.rotation.y = 0;
      await guard(tween(1.0, (k) => fairyBig.root.scale.setScalar(Math.max(0.01, k)), Ease.out));
      fairyBig.play('pose', 2.2);
      await guard(UI.say('fairy', '어서 오렴, 용감한 클라라. 장난감 왕국을 지나 눈송이의 숲을 건너면, 설탕 궁전에서 너를 기다릴게.'));
      comp.hold = false;
      Sound.playMusic('waltz');
    });
    this.setPhase('portal');
  },
  async enterPortal() {
    await this.cut(async () => {
      G.markerAt = null; G.phase = 'leaving';
      const p0 = player.pos.clone(), dest = V3(0, 0, -0.5);
      player.yaw = Math.atan2(dest.x - p0.x, dest.z - p0.z);
      await guard(Cam.to([0, 3.6, 6.6], [0, 1.8, -0.5], 1.0));
      await guard(tween(0.9, (k) => { player.pos.lerpVectors(p0, dest, k); player.speed = 3; }, Ease.inOut));
      player.speed = 0;
      clara.play('spin', 1.2); Sound.sfxPortal();
      player.float = true;
      await guard(during(1.6, (dt) => { player.pos.y += dt * 1.6; for (let i = 0; i < 3; i++) FX.add.spawn({ x: player.pos.x + rnd(-0.5, 0.5), y: player.pos.y + rnd(0, 1.4), z: player.pos.z + rnd(-0.5, 0.5), vy: 1, life: 0.9, size: 0.3, size1: 0, color: pick(GOLDS), cell: CELL.star, rot: rnd(0, 3) }); }));
      await guard(UI.fade(1, 1.0));
      Sound.sfxFanfare();
      UI.hide('hud'); UI.hide('controls');
      Cam.set([0, 6.6, 34], [0, 5.2, 0]); Cam.mode = 'title';
      W.theatre.set(1);
      applyMood(0); magicSnow.visible = false; stageSnow.visible = true; player.float = false;
      await guard(UI.fade(0, 1.0));
      await guard(tween(2.4, (k) => W.theatre.set(1 - k), Ease.inOut));
    }, false);
    this.clearChapter();
  },
  clearChapter() {
    G.mode = 'clear'; G.locked = true;
    UI.hide('hud'); UI.hide('controls');
    const prev = Save.data.done.mansion;
    Save.data.done.mansion = { stars: G.stars, time: G.time, throws: G.throws, best: prev ? Math.min(prev.best || prev.time, G.time) : G.time };
    Save.data.unlocked = Math.max(Save.data.unlocked, 2);
    Save.write();
    UI.clearCard({
      kicker: '제1장 · 이야기 끝', title: '크리스마스 저택', icon: 'i-star',
      stats: [['모은 별', `${G.stars} / ${STAR_TOTAL}`], ['걸린 시간', fmtTime(G.time)], ['던진 슬리퍼', String(G.throws)]],
      unlock: '<b>제2장 · 장난감 왕국</b>이 열렸어요!<br><span>왕궁 조각을 찾아 조립하는 이야기가 이어져요.</span>', next: true,
    });
    UI.show('screenClear');
  },

  /* ---------- per-frame story logic ---------- */
  tick(dt) {
    if (G.chapter === 2) { Toy.tick(dt); return; }
    const t = FX.uniforms.uTime.value;
    if (fairyBig.root.visible) { fairyBig.root.position.y = 1.1 + Math.sin(t * 1.6) * 0.12; if (Math.random() < dt * 14) FX.add.spawn({ x: rnd(-0.7, 0.7), y: rnd(1, 3), z: -1.25 + rnd(-0.4, 0.4), vy: 0.4, life: 1, size: 0.25, size1: 0, color: pick(['#ffd6e0', '#cfe3ff', '#fff1c4']), cell: CELL.sparkle, rot: rnd(0, 3) }); }
    if (this.crownDrop && Math.random() < dt * 4) { const c = this.crownDrop.position; FX.add.spawn({ x: c.x + rnd(-0.3, 0.3), y: 0.3, z: c.z + rnd(-0.3, 0.3), vy: 0.4, life: 0.8, size: 0.2, size1: 0, color: '#ffe08a', cell: CELL.sparkle, rot: rnd(0, 3) }); }
    // interactions
    this.near = null;
    if (G.mode === 'play' && !G.locked && player.grounded) {
      let bd = 1e9;
      for (const it of this.interacts) { if (!it.when()) continue; const d = Math.hypot(player.pos.x - it.x, player.pos.z - it.z); if (d < it.r && d < bd) { bd = d; this.near = it; } }
    }
    if (this.near) { const s = toScreen(_v3.set(...this.near.p)); UI.prompt(this.near.label, s.x, s.y - 12); UI.setAction(this.near.icon, this.near.short); }
    else { UI.prompt(null); UI.setAction(G.combat ? 'throw' : 'spin', G.combat ? '슬리퍼' : '피루엣'); }
    if (G.mode !== 'play') return;
    // collecting stars
    const cx = player.pos.x, cy = player.pos.y + 0.8, cz = player.pos.z;
    for (const it of starSet.items) {
      if (it.state !== 'idle') continue;
      if (it.magnet) { const d = Math.hypot(it.base.x - cx, it.base.z - cz); if (d < 3.2) { it.base.x = damp(it.base.x, cx, 3, dt); it.base.z = damp(it.base.z, cz, 3, dt); it.base.y = damp(it.base.y, cy, 3, dt); } }
      const dx = it.pos.x - cx, dy = it.pos.y - cy, dz = it.pos.z - cz;
      if (dx * dx + dy * dy * 0.55 + dz * dz < 0.8) this.collectStar(it);
    }
    // waves of mice
    if (G.phase === 'wave') {
      this.spawnT -= dt;
      const alive = mice.filter((m) => m.state !== 'off' && m.state !== 'dead').length;
      if (G.waveSpawned < WAVE_SIZE && this.spawnT <= 0 && alive < 3) { spawnMouse(); G.waveSpawned++; this.spawnT = 1.7; }
      if (G.waveSpawned >= WAVE_SIZE && alive === 0 && G.waveKills < WAVE_SIZE) { G.waveKills = WAVE_SIZE; this.waveProgress(); }
    }
    // gentle hints
    if (G.phase === 'collect' && G.time - G.lastStarT > 35) {
      G.lastStarT = G.time;
      const nextS = STAR_DEFS.find((s) => { const it = starSet.get(s.id); return it && it.state !== 'done' && it.state !== 'collect'; });
      if (nextS) UI.hint(nextS.hint, 6000);
    }
    if (G.phase === 'portal' && G.time - (this.portalT || 0) > 2.5 && Math.hypot(player.pos.x - portal.position.x, player.pos.z - portal.position.z) < 0.8) { G.phase = 'leaving'; this.run(() => this.enterPortal()); }
    if (!Input.anyMove && G.time > 6 && !this.moveHinted) { this.moveHinted = true; UI.hint(DEVICE.touch ? '화면 왼쪽 아래를 손가락으로 끌어 클라라를 움직여요' : 'WASD 또는 방향키로 클라라를 움직여요', 6000); }
  },
};
