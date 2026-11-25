/* =====================================================================
   01 · CORE — math helpers, palette, device profile, game-time tasks
   ===================================================================== */
const THREE = window.THREE;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, v) => clamp((v - a) / (b - a), 0, 1);
const smoothstep = (a, b, v) => { const t = invLerp(a, b, v); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const angleDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const dampAngle = (a, b, k, dt) => a + angleDiff(a, b) * (1 - Math.exp(-k * dt));
const Ease = {
  linear: (t) => t,
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: (t) => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rng = mulberry32(1224);
const reseed = (s) => { rng = mulberry32(s); };
const rnd = (a = 0, b = 1) => a + (b - a) * rng();
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (arr) => arr[Math.floor(rng() * arr.length) % arr.length];
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/* Storybook palette: powder pink · ivory · burgundy · gold · pastel blue */
const PAL = {
  pink: '#f3c3cc', pinkSoft: '#f8dade', pinkDeep: '#e29aab', rose: '#d77b91',
  ivory: '#fbf4e6', cream: '#f2e3c8', parchment: '#f4e6cc',
  burgundy: '#7d1d36', burgundyDeep: '#4c0f20', wine: '#9b2944', crimson: '#b02f45',
  gold: '#d7ad5a', goldLight: '#f6dc98', goldDeep: '#9a7232', brass: '#c4964a',
  blue: '#b7d2ec', blueSoft: '#d6e6f5', blueDeep: '#7f9fcb', navy: '#2b3767',
  mint: '#c6e3d2', pine: '#2e5b45', pineDeep: '#1b3d30', pineLight: '#5f9469',
  walnut: '#5b2f22', mahogany: '#6a2a20', oak: '#b98352', honey: '#cf9c63',
  skin: '#fbe7dc', skinWarm: '#f6d2bd', hairBrown: '#6b3a22', hairGold: '#d9a55b',
  white: '#ffffff', black: '#1d1418', grey: '#a69aa1', mouse: '#8f8189', mouseLight: '#cbbfc4',
};

const DEVICE = (() => {
  const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const touch = coarse || navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const ua = navigator.userAgent || '';
  const phoneUA = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const small = Math.min(window.innerWidth, window.innerHeight) < 820;
  const mobile = (touch && small) || phoneUA;
  return { touch, mobile, lowMem: (navigator.deviceMemory || 8) <= 3, dpr: window.devicePixelRatio || 1 };
})();

/* ---------- game-time tasks (tweens / waits that pause with the game) ---------- */
const Tasks = {
  list: [],
  add(t) { this.list.push(t); return t; },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const t = this.list[i];
      if (!t) continue;
      t.t += dt;
      const k = t.d > 0 ? Math.min(1, t.t / t.d) : 1;
      if (t.fn) t.fn(t.ease ? t.ease(k) : k, k, dt);
      if (k >= 1) { this.list.splice(i, 1); if (t.end) t.end(); }
    }
  },
  clear() { this.list.length = 0; },
};
const wait = (sec) => new Promise((res) => Tasks.add({ t: 0, d: sec, end: res }));
const tween = (dur, fn, ease = Ease.inOut) => new Promise((res) => Tasks.add({ t: 0, d: dur, fn, ease, end: res }));
/* every-frame callback for a duration (fn gets dt) */
const during = (dur, fn) => new Promise((res) => Tasks.add({ t: 0, d: dur, fn: (e, k, dt) => fn(dt, k), end: res }));

/* cancellation for scripted sequences (restart / quit mid-cutscene) */
const CANCELLED = { cancelled: true };
let RUN_ID = 0;
async function guard(p) {
  const id = RUN_ID;
  const r = await p;
  if (id !== RUN_ID) throw CANCELLED;
  return r;
}

/* tiny event bus */
const Bus = {
  map: {},
  on(n, f) { (this.map[n] || (this.map[n] = [])).push(f); },
  emit(n, a) { (this.map[n] || []).forEach((f) => f(a)); },
};

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
