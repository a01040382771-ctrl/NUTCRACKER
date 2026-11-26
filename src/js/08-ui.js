/* =====================================================================
   08 · UI & INPUT — storybook HUD, dialog pages, joystick and buttons
   ===================================================================== */
const $ = (id) => document.getElementById(id);
const UI = {
  portraits: {},
  speakers: {
    narrator: { name: '이야기' },
    clara: { name: '클라라' },
    nut: { name: '호두까기 인형' },
    king: { name: '생쥐 왕' },
    prince: { name: '호두까기 왕자' },
    fairy: { name: '설탕 요정' },
    mouse: { name: '생쥐 보초' },
    soldier: { name: '장난감 병정' },
    snowfairy: { name: '눈꽃 요정' },
    choco: { name: '초콜릿 무용수' },
    coffee: { name: '커피 무용수' },
    tea: { name: '차 무용수' },
    baker: { name: '생강과자 요리사' },
  },
  init() {
    try { document.documentElement.style.setProperty('--paper', `url(${paperDataURL()})`); } catch (e) { /* no paper grain */ }
    if (DEVICE.touch) document.body.classList.add('touch');
    this.helpMain = DEVICE.touch
      ? '왼쪽 아래를 끌어서 이동 · 점프 버튼으로 그랑 제테 · 큰 금빛 버튼으로 살펴보기와 슬리퍼 던지기'
      : '이동 WASD·방향키 · 점프 Space · 살펴보기·슬리퍼 E 또는 Enter · 일시정지 Esc';
    this.setHelp();
  },
  /* the line of controls under the pause menu: a chapter may bring its own, empty text goes back to the walking controls */
  setHelp(text) { $('helpText').textContent = text || this.helpMain; },
  show(id) { $(id).hidden = false; },
  hide(id) { $(id).hidden = true; },
  setLoading(p, text) { $('loadBar').style.width = `${Math.round(p * 100)}%`; if (text) $('loadText').textContent = text; },
  setObjective(text, pop = true) {
    $('objText').textContent = text;
    const o = $('objective');
    if (pop) { o.classList.remove('pop'); void o.offsetWidth; o.classList.add('pop'); }
  },
  setStars(n) {
    $('starNum').textContent = n;
    const c = $('starCounter'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
  },
  flyStar(x, y) {
    const tgt = $('starCounter').getBoundingClientRect();
    const tx = tgt.left + 22, ty = tgt.top + tgt.height / 2;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('class', 'flystar'); el.setAttribute('viewBox', '0 0 24 24');
    el.innerHTML = '<use href="#i-star"/>';
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    $('app').appendChild(el);
    const dx = tx - x, dy = ty - y;
    const anim = el.animate([
      { transform: 'translate(0,0) scale(.6) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 60}px) scale(1.3) rotate(160deg)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${dx}px, ${dy}px) scale(.7) rotate(360deg)`, opacity: 0.9 },
    ], { duration: 800, easing: 'cubic-bezier(.5,0,.3,1)' });
    anim.onfinish = () => { el.remove(); };
  },
  toastTimer: 0,
  toast(text, ms = 2600) {
    const t = $('toast');
    t.textContent = text; t.hidden = false;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { t.hidden = true; }, ms);
  },
  hintTimer: 0,
  hint(text, ms = 6000) {
    const h = $('hint'); h.textContent = text; h.hidden = false;
    clearTimeout(this.hintTimer); this.hintTimer = setTimeout(() => { h.hidden = true; }, ms);
  },
  prompt(text, x, y) {
    const p = $('prompt');
    if (text === null) { if (!p.hidden) p.hidden = true; return; }
    if ($('promptText').textContent !== text) $('promptText').textContent = text;
    p.hidden = false;
    p.style.left = `${clamp(x, 80, window.innerWidth - 80)}px`; p.style.top = `${clamp(y, 90, window.innerHeight - 40)}px`;
  },
  actKind: '',
  setAction(kind, label) {
    if (this.actKind === kind + label) return;
    this.actKind = kind + label;
    const icon = { interact: '#i-wand', gift: '#i-gift', music: '#i-music', clock: '#i-clock', star: '#i-star', eye: '#i-eye', throw: '#i-slipper', spin: '#i-wand', next: '#i-next', portal: '#i-star', build: '#i-castle', piece: '#i-block', lever: '#i-lever' }[kind] || '#i-wand';
    $('actUse').setAttribute('href', icon);
    $('actLabel').textContent = label;
    $('btnAct').classList.toggle('ready', kind !== 'spin' && kind !== 'next');
  },
  setChapterHud(no, title, icon, max = 12) {
    $('plNo').textContent = no; $('plTitle').textContent = title;
    $('cntUse').setAttribute('href', `#${icon}`); $('objUse').setAttribute('href', `#${icon}`);
    $('cntMax').textContent = `/ ${max}`;
  },
  clearCard(o) {
    $('clrKicker').textContent = o.kicker; $('clrTitle').textContent = o.title;
    $('clrSeal').setAttribute('href', `#${o.icon}`);
    const dl = $('clrStats'); dl.textContent = '';
    for (const [k, v] of o.stats) {
      const d = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = k; dd.textContent = v; d.append(dt, dd); dl.appendChild(d);
    }
    $('clrUnlock').innerHTML = o.unlock;
    $('btnClearNext').hidden = !o.next;
    $('btnClearNext').textContent = o.nextLabel || '다음 장으로 떠나기';
    $('btnClearMap').classList.toggle('primary', !o.next);
  },
  chapterCard(no, title, onBright) {
    const c = $('chapterCard');
    c.classList.toggle('bright', !!onBright); // a soft dark plate behind the words when the scene behind them is pale (snow)
    c.querySelector('.cc-no').textContent = no; c.querySelector('.cc-title').textContent = title;
    c.hidden = false; c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
    setTimeout(() => { c.hidden = true; }, 3300);
  },
  fade(to, dur = 0.6, dark = false) {
    const f = $('fade');
    f.classList.toggle('dark', dark);
    f.style.transition = `opacity ${dur}s ease`;
    f.style.opacity = to;
    return new Promise((r) => setTimeout(r, dur * 1000 + 30));
  },
  /* ---- storybook dialog ---- */
  dlg: { open: false, full: '', shown: 0, resolve: null, timer: 0, auto: 0 },
  say(who, text, o = {}) {
    const d = this.dlg;
    const sp = this.speakers[who] || this.speakers.narrator;
    $('dlgName').textContent = sp.name;
    const port = $('dlgPortrait');
    if (port.dataset.who !== who) {
      port.dataset.who = who;
      port.textContent = '';
      if (this.portraits[who]) {
        port.className = 'portrait';
        const img = document.createElement('img'); img.alt = ''; img.src = this.portraits[who]; port.appendChild(img);
      } else {
        port.className = 'portrait narrator';
        port.innerHTML = '<svg style="width:46%;height:46%;color:#f1d998" viewBox="0 0 24 24"><use href="#i-star"/></svg>';
      }
    }
    $('dlgText').textContent = '';
    $('dialog').classList.remove('done');
    $('dialog').hidden = false;
    d.open = true; d.full = text; d.shown = 0; d.auto = o.auto || 0; d.t = 0;
    Bus.emit('say', who);
    return new Promise((res) => { d.resolve = res; });
  },
  updateDialog(dt) {
    const d = this.dlg; if (!d.open) return;
    d.t += dt;
    if (d.shown < d.full.length) {
      d.shown = Math.min(d.full.length, d.shown + dt * 34);
      $('dlgText').textContent = d.full.slice(0, Math.floor(d.shown));
      if (d.shown >= d.full.length) $('dialog').classList.add('done');
    } else if (d.auto && d.t > d.auto) this.advance();
  },
  advance() {
    const d = this.dlg; if (!d.open) return false;
    if (d.shown < d.full.length) { d.shown = d.full.length; $('dlgText').textContent = d.full; $('dialog').classList.add('done'); return true; }
    d.open = false; $('dialog').hidden = true;
    Sound.sfxUI();
    const r = d.resolve; d.resolve = null; if (r) r();
    return true;
  },
  closeDialog() { const d = this.dlg; d.open = false; d.resolve = null; $('dialog').hidden = true; },
};

/* ---------------- input ---------------- */
const Input = {
  keys: {}, stick: { id: null, x: 0, y: 0, active: false }, jump: false, act: false, pause: false, anyMove: false,
  R: 54,
  init() {
    const zone = $('stickZone'), base = $('stickBase'), knob = $('stickKnob');
    const home = () => { base.style.left = ''; base.style.top = ''; knob.style.transform = ''; };
    const setKnob = (dx, dy) => { knob.style.transform = `translate(${dx}px, ${dy}px)`; };
    zone.addEventListener('pointerdown', (e) => {
      if (this.stick.id !== null) return;
      e.preventDefault();
      this.stick.id = e.pointerId; this.stick.active = true;
      try { zone.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      // the base is positioned inside the zone, so work in zone-local pixels
      const zr = zone.getBoundingClientRect();
      const lx = clamp(e.clientX - zr.left, 72, Math.max(72, zr.width - 30)), ly = clamp(e.clientY - zr.top, 72, Math.max(72, zr.height - 72));
      base.style.left = `${lx}px`; base.style.top = `${ly}px`;
      this.stick.ox = zr.left + lx; this.stick.oy = zr.top + ly;
      this.moveStick(e.clientX, e.clientY, setKnob);
      Sound.init();
    });
    zone.addEventListener('pointermove', (e) => { if (e.pointerId === this.stick.id) { e.preventDefault(); this.moveStick(e.clientX, e.clientY, setKnob); } });
    const end = (e) => { if (e.pointerId !== this.stick.id) return; this.stick.id = null; this.stick.active = false; this.stick.x = 0; this.stick.y = 0; home(); };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end); zone.addEventListener('lostpointercapture', end);
    const btn = (el, key) => {
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this[key] = true; el.classList.add('on'); Sound.init(); });
      const up = () => el.classList.remove('on');
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
    };
    btn($('btnJump'), 'jump'); btn($('btnAct'), 'act');
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (e.repeat) { this.keys[k] = true; return; }
      this.keys[k] = true;
      if (k === ' ' || k === 'k') this.jump = true;
      if (k === 'e' || k === 'enter' || k === 'j' || k === 'f') this.act = true;
      if (k === 'escape' || k === 'p') this.pause = true;
      Sound.init();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
    $('dialog').addEventListener('pointerdown', (e) => { e.preventDefault(); UI.advance(); });
    document.addEventListener('touchmove', (e) => { if (!e.target.closest || !e.target.closest('.scroll-ok')) e.preventDefault(); }, { passive: false });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  },
  moveStick(x, y, setKnob) {
    let dx = x - this.stick.ox, dy = y - this.stick.oy;
    const l = Math.hypot(dx, dy), R = this.R;
    if (l > R) { dx *= R / l; dy *= R / l; }
    setKnob(dx, dy);
    this.stick.x = dx / R; this.stick.y = dy / R;
  },
  read() {
    let x = 0, z = 0;
    const k = this.keys;
    if (k.a || k.arrowleft) x -= 1; if (k.d || k.arrowright) x += 1;
    if (k.w || k.arrowup) z -= 1; if (k.s || k.arrowdown) z += 1;
    if (this.stick.active) { x += this.stick.x; z += this.stick.y; }
    let m = Math.hypot(x, z);
    if (m < 0.14) return { x: 0, z: 0, m: 0 };
    if (m > 1) { x /= m; z /= m; m = 1; }
    const mm = smoothstep(0.14, 0.95, m);
    return { x: (x / m) * mm, z: (z / m) * mm, m: mm };
  },
  consume(key) { const v = this[key]; this[key] = false; return v; },
  clear() { this.jump = false; this.act = false; this.pause = false; },
};
