/* =====================================================================
   22 · DANCE MUSIC — the waltz the snowflakes dance to (finale of chapter III)
   Built in: a waltz written for this game (the path-opening theme, now in E major, with a variation,
   a hushed chorus and a finale) synthesised with WebAudio. It is not Tchaikovsky's score.
   Optional: a recording the player keeps on their own device (SNOW_DANCE.local), stored only in that
   browser and never part of the game files. Everything runs on the AudioContext clock.
   ===================================================================== */

/* chord → [bass, two bell tones for beats 2 and 3, three pad tones] */
const DANCE_VOICE = {
  E: ['E2', 'G#3+B3', 'E3+G#3+B3'], 'E/G#': ['G#2', 'B3+E4', 'G#3+B3+E4'], 'C#m': ['C#3', 'G#3+C#4', 'C#3+E3+G#3'],
  A: ['A2', 'A3+C#4', 'A3+C#4+E4'], B7: ['B2', 'A3+D#4', 'B3+D#4+A4'], B: ['B2', 'B3+D#4', 'B3+D#4+F#4'],
  'G#7': ['G#2', 'C4+F#4', 'G#3+C4+F#4'], 'F#m': ['F#2', 'A3+C#4', 'F#3+A3+C#4'], 'F#m7': ['F#2', 'A3+E4', 'F#3+A3+E4'],
};
/* the four parts match SNOW_DANCE.sections bar for bar (20 · 12 · 13 · 19) */
const DANCE_SCORE = {
  theme: {
    melody: 'E6:3 | B5:1 G#5:1 B5:1 | C#6:3 | A5:1 C#6:1 E6:1 | D#6:1 C#6:1 B5:1 | C#6:1 B5:1 G#5:1 | A5:1 B5:1 C#6:1 | B5:3 | ' +
      'E6:1 D#6:0.5 C#6:0.5 B5:1 | C#6:1 B5:0.5 A5:0.5 G#5:1 | A5:1 C#6:0.5 E6:0.5 F#6:1 | D#6:3 | ' +
      'E6:1 G#6:1 E6:1 | F#6:1 D#6:1 B5:1 | C#6:0.5 D#6:0.5 E6:1 F#6:1 | G#6:2 F#6:1 | E6:1 C#6:1 A5:1 | B5:1 G#5:1 E5:1 | F#5:1 G#5:1 B5:1 | E6:3',
    chords: ['E', 'E', 'C#m', 'A', 'B7', 'E', 'A', 'B7', 'E', 'C#m', 'A', 'B7', 'E', 'B', 'A', 'B7', 'E', 'E', 'B7', 'E'],
  },
  variation: {
    melody: 'G#5:2 E5:1 | G#5:1 C#6:1 B5:1 | C6:2 G#5:1 | C#6:3 | C#6:1 E6:1 C#6:1 | A5:2 C#6:1 | B5:1 D#6:1 F#6:1 | E6:3 | ' +
      'E6:1 C#6:1 A5:1 | F#6:1 E6:1 C#6:1 | D#6:1 E6:1 F#6:1 | D#6:2 B5:1',
    chords: ['C#m', 'C#m', 'G#7', 'C#m', 'A', 'F#m', 'B7', 'E', 'A', 'F#m7', 'B7', 'B7'],
  },
  hush: {
    choir: 'B5:6 | E5:3 G#5:3 | C#6:6 | B5:3 G#5:3 | A5:6 | A5:3 F#5:3 | G#5:3',
    chords: ['E', 'E', 'C#m', 'C#m', 'A', 'A', 'E/G#', 'E/G#', 'F#m', 'F#m', 'B7', 'B7', 'E'],
  },
  finale: {
    melody: 'E6:3 | B5:1 G#5:1 B5:1 | C#6:3 | A5:1 C#6:1 E6:1 | D#6:1 C#6:1 B5:1 | C#6:1 B5:1 G#5:1 | A5:1 B5:1 C#6:1 | B5:3 | ' +
      'E6:1 G#6:1 E6:1 | F#6:1 D#6:1 B5:1 | C#6:0.5 D#6:0.5 E6:1 F#6:1 | G#6:2 F#6:1 | ' +
      'G#6:1 E6:1 B5:1 | C#6:1 E6:1 G#6:1 | A6:1 F#6:1 C#6:1 | B5:1 D#6:1 A6:1 | G#6:3 | F#6:1 D#6:1 B5:1 | E6:3',
    chords: ['E', 'E', 'C#m', 'A', 'B7', 'E', 'A', 'B7', 'E', 'B', 'A', 'B7', 'E', 'C#m', 'F#m7', 'B7', 'E', 'B7', 'E'],
  },
};

/* ---------- one small IndexedDB store for the player's own recording (only in this browser) ---------- */
const MediaStore = {
  name: 'nutcracker-media', db: null, mem: {},
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res) => {
      try {
        const rq = indexedDB.open(this.name, 1);
        rq.onupgradeneeded = () => { rq.result.createObjectStore('files'); };
        rq.onsuccess = () => { this.db = rq.result; res(this.db); };
        rq.onerror = () => res(null);
        rq.onblocked = () => res(null);
      } catch (e) { res(null); }
    });
  },
  async get(key) {
    const db = await this.open();
    if (!db) return this.mem[key] || null;
    return new Promise((res) => {
      try { const rq = db.transaction('files', 'readonly').objectStore('files').get(key); rq.onsuccess = () => res(rq.result || null); rq.onerror = () => res(null); } catch (e) { res(null); }
    });
  },
  async put(key, val) {
    this.mem[key] = val;
    const db = await this.open();
    if (!db) return false;
    return new Promise((res) => {
      try { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(val, key); tx.oncomplete = () => res(true); tx.onerror = () => res(false); } catch (e) { res(false); }
    });
  },
  async del(key) {
    delete this.mem[key];
    const db = await this.open();
    if (!db) return;
    await new Promise((res) => { try { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').delete(key); tx.oncomplete = res; tx.onerror = res; } catch (e) { res(); } });
  },
};

/* ---------- MP3 layout: where the audio starts and how many bytes a second takes (CBR MPEG-1 Layer III) ---------- */
const MP3_KBPS = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0], MP3_SR = [44100, 48000, 32000];
function mp3Header(b, p) {
  if (p + 4 > b.length || b[p] !== 0xff || (b[p + 1] & 0xe0) !== 0xe0) return null;
  const ver = (b[p + 1] >> 3) & 3, layer = (b[p + 1] >> 1) & 3, bi = b[p + 2] >> 4, si = (b[p + 2] >> 2) & 3, pad = (b[p + 2] >> 1) & 1;
  if (ver !== 3 || layer !== 1 || !MP3_KBPS[bi] || si > 2) return null;       // MPEG-1, Layer III only
  const kbps = MP3_KBPS[bi], sr = MP3_SR[si], len = Math.floor((144000 * kbps) / sr) + pad, mono = (b[p + 3] >> 6) === 3;
  return { kbps, sr, len, mono };
}
function mp3Layout(b) {
  let p = 0;
  if (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) p = 10 + (((b[6] & 0x7f) << 21) | ((b[7] & 0x7f) << 14) | ((b[8] & 0x7f) << 7) | (b[9] & 0x7f)) + (b[5] & 0x10 ? 10 : 0);
  for (let guard = 0; p + 4 < b.length && guard < 65536; p++, guard++) {
    const h = mp3Header(b, p);
    if (!h) continue;
    const h2 = mp3Header(b, p + h.len);
    if (!h2 || h2.sr !== h.sr) continue;
    const tagAt = p + 4 + (h.mono ? 17 : 32), tag = String.fromCharCode(b[tagAt], b[tagAt + 1], b[tagAt + 2], b[tagAt + 3]);
    if (tag === 'Xing') return null;                       // variable bitrate: not sliced, decoded whole instead
    const first = tag === 'Info' ? p + h.len : p;           // an "Info" frame carries no sound
    return { audioStart: first, bytesPerSec: (h.kbps * 1000) / 8, frameBytes: (144000 * h.kbps) / h.sr, frameSec: 1152 / h.sr, sr: h.sr };
  }
  return null;
}

const DanceMusic = {
  source: 'builtin', rate: 1, running: false, paused: false, clock: 'audio', token: 0, lastT: 0,
  t0: 0, perfT0: 0, perfPausedAt: 0, bars: [], sectionBars: [0, 20, 32, 45, 64], endT: 0,
  events: [], evIdx: 0, bus: null, src: null, buf: null, bufOffset: 0, pumpTimer: 0,
  local: null, localBuf: null, localKey: '', note: '', pending: null,

  /* bar grid of the built-in performance: steady tempo */
  builtinGrid() {
    const D = SNOW_DANCE, bar = (3 * 60) / D.builtinBpm, n = D.sections.reduce((a, b) => a + b, 0);
    return { bars: Array.from({ length: n + 1 }, (_, k) => k * bar), endT: n * bar + D.tailSec };
  },
  /* bar grid of the recording: every third measured beat is a bar line */
  localGrid() {
    const L = SNOW_DANCE.local, bars = [];
    for (let i = 0; i < L.beats.length; i += 3) bars.push(L.beats[i]);
    return { bars, endT: L.end - L.start };
  },
  sectionStarts() { const s = [0]; for (const n of SNOW_DANCE.sections) s.push(s[s.length - 1] + n); return s; },

  /* ---------- the player's own recording ---------- */
  async loadLocalInfo() {
    const rec = await MediaStore.get('danceAudio');
    this.local = rec && rec.blob ? { name: rec.name || '', size: rec.blob.size } : null;
    return this.local;
  },
  matches(size) { const L = SNOW_DANCE.local; return Math.abs(size - L.sizeBytes) / L.sizeBytes <= L.sizeTolerance; },
  async setLocalFile(file) {
    if (!file) return { ok: false, reason: 'none' };
    if (!this.matches(file.size)) return { ok: false, reason: 'mismatch' };
    await MediaStore.put('danceAudio', { blob: file, name: file.name, savedAt: Date.now() });
    this.local = { name: file.name, size: file.size }; this.localBuf = null; this.localKey = ''; this.pending = null;
    return { ok: true };
  },
  async clearLocal() { this.local = null; this.localBuf = null; this.localKey = ''; this.pending = null; await MediaStore.del('danceAudio'); },
  decode(ab) {
    const c = Sound.ctx;
    return new Promise((res, rej) => { try { const p = c.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); } catch (e) { rej(e); } });
  },
  /* decode only the excerpt (plus a little lead-in for the decoder) instead of the whole 6½ minutes */
  async decodeLocal(blob) {
    const L = SNOW_DANCE.local, lead = 1.5;
    const head = new Uint8Array(await blob.slice(0, Math.min(blob.size, 768 * 1024)).arrayBuffer());
    const lay = mp3Layout(head);
    if (lay) {
      let pos = lay.audioStart + Math.floor(Math.max(0, L.start - lead) * lay.bytesPerSec);
      const scan = new Uint8Array(await blob.slice(pos, Math.min(blob.size, pos + 16384)).arrayBuffer());
      let k = 0; for (; k + 4 < scan.length; k++) { const h = mp3Header(scan, k); if (h && h.sr === lay.sr && mp3Header(scan, k + h.len)) break; }
      pos += k;
      const t0 = Math.round((pos - lay.audioStart) / lay.frameBytes) * lay.frameSec;
      const buf = await this.decode(await blob.slice(pos, blob.size).arrayBuffer());
      return { buf, offset: L.start - t0 };
    }
    const buf = await this.decode(await blob.arrayBuffer());
    return { buf, offset: L.start };
  },

  /* start decoding the player's recording early (while the fairy speaks), so the curtain does not wait for it */
  preload() {
    if (this.pending) return this.pending;
    this.pending = (async () => {
      const rec = await MediaStore.get('danceAudio');
      if (!rec || !rec.blob || !Sound.ctx) return null;
      if (!this.matches(rec.blob.size)) return { mismatch: true };
      const key = `${rec.name}:${rec.blob.size}:${rec.savedAt || 0}`;
      if (this.localBuf && this.localKey === key) return { ok: true };
      try { this.localBuf = await this.decodeLocal(rec.blob); this.localKey = key; return { ok: true }; } catch (e) { this.localBuf = null; this.localKey = ''; return { error: true }; }
    })();
    return this.pending;
  },
  /* ---------- choose the music for this performance ---------- */
  async prepare() {
    this.stop(true);
    Sound.init();
    this.note = ''; this.source = 'builtin';
    let grid = this.builtinGrid();
    const r = await this.preload(); this.pending = null;
    if (r && r.ok && this.localBuf) { this.source = 'local'; grid = this.localGrid(); }
    else if (r && r.mismatch) this.note = '내 기기의 음원이 박자 지도와 맞지 않아 기본 연주로 공연해요';
    else if (r && r.error) this.note = '내 기기의 음원을 열지 못해 기본 연주로 공연해요';
    this.bars = grid.bars; this.endT = grid.endT; this.sectionBars = this.sectionStarts();
    return { source: this.source, note: this.note };
  },

  /* ---------- clock: score seconds since the first bar (audio time, or wall time without sound) ---------- */
  now() { return this.clock === 'audio' && Sound.ctx ? Sound.ctx.currentTime : performance.now() / 1000; },
  time() {
    if (!this.running && !this.paused) return this.lastT || 0;
    if (this.clock === 'audio') return Math.max(0, (Sound.ctx.currentTime - this.t0) * this.rate);
    const n = this.paused ? this.perfPausedAt : performance.now() / 1000;
    return Math.max(0, (n - this.perfT0) * this.rate);
  },
  barAt(t) {
    const B = this.bars, n = B.length - 1;
    if (!n) return 0;
    if (t <= B[0]) return (t - B[0]) / (B[1] - B[0]);
    if (t >= B[n]) return n + (t - B[n]) / (B[n] - B[n - 1]);
    let lo = 0, hi = n;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (B[m] <= t) lo = m; else hi = m; }
    return lo + (t - B[lo]) / (B[lo + 1] - B[lo]);
  },
  timeOfBar(b) {
    const B = this.bars, n = B.length - 1, i = clamp(Math.floor(b), 0, n - 1);
    return B[i] + (b - i) * (B[i + 1] - B[i]);
  },

  start(lead = 0.2) {
    const my = ++this.token;
    const c = Sound.ctx;
    this.clock = c && c.state === 'running' ? 'audio' : 'perf';
    this.running = true; this.paused = false; this.lastT = 0;
    if (this.clock === 'perf') { this.perfT0 = performance.now() / 1000 + lead; return my; }
    this.t0 = c.currentTime + lead;
    this.bus = c.createGain(); this.bus.gain.value = 0.0001; this.bus.connect(Sound.musicBus);
    this.bus.gain.setValueAtTime(0.0001, this.t0 - 0.05); this.bus.gain.linearRampToValueAtTime(1, this.t0 + 0.08);
    if (this.source === 'local' && this.localBuf) {
      const src = c.createBufferSource(); src.buffer = this.localBuf.buf; src.playbackRate.value = this.rate; src.connect(this.bus);
      src.start(this.t0, Math.max(0, this.localBuf.offset)); this.src = src;
      this.events = [];
      const fadeAt = this.t0 + (this.endT - 1.2) / this.rate;
      this.bus.gain.setValueAtTime(1, fadeAt); this.bus.gain.linearRampToValueAtTime(0.0001, fadeAt + 1.1 / this.rate);
    } else {
      this.events = this.buildEvents(); this.evIdx = 0;
      this.dynamics();
    }
    this.pump();
    clearInterval(this.pumpTimer); this.pumpTimer = setInterval(() => this.pump(), 40);
    return my;
  },
  /* section loudness of the built-in performance */
  dynamics() {
    const g = this.bus.gain, at = (bar) => this.t0 + this.timeOfBar(bar) / this.rate, S = this.sectionBars;
    g.setValueAtTime(1, at(S[1]) - 0.4); g.linearRampToValueAtTime(0.88, at(S[1]));
    g.setValueAtTime(0.88, at(S[2]) - 0.4); g.linearRampToValueAtTime(0.92, at(S[2]));
    g.setValueAtTime(0.92, at(S[3])); g.linearRampToValueAtTime(1.18, at(S[4] - 2));
  },
  pause() {
    if (!this.running || this.paused) return;
    this.paused = true;
    if (this.clock === 'audio') { Sound.hold = true; Sound.ctx.suspend().catch(() => {}); } else this.perfPausedAt = performance.now() / 1000;
  },
  resume() {
    if (!this.paused) return;
    this.paused = false;
    if (this.clock === 'audio') { Sound.hold = false; Sound.ctx.resume().catch(() => {}); } else this.perfT0 += performance.now() / 1000 - this.perfPausedAt;
  },
  /* fade out and stop; keeps the current time readable for the dancers' last pose */
  stop(quick) {
    this.token++;
    if (this.running || this.paused) this.lastT = this.time();
    clearInterval(this.pumpTimer); this.pumpTimer = 0;
    if (this.paused && this.clock === 'audio' && Sound.ctx) { Sound.hold = false; Sound.ctx.resume().catch(() => {}); }
    this.running = false; this.paused = false;
    const bus = this.bus, src = this.src, c = Sound.ctx; this.bus = null; this.src = null; this.events = []; this.evIdx = 0;
    if (bus && c) {
      const t = c.currentTime;
      try { bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(bus.gain.value, t); bus.gain.linearRampToValueAtTime(0.0001, t + (quick ? 0.12 : 0.7)); } catch (e) { /* ignore */ }
      setTimeout(() => { try { if (src) src.stop(); bus.disconnect(); } catch (e) { /* already gone */ } }, quick ? 300 : 1000);
    }
  },

  /* ---------- the built-in performance ---------- */
  buildEvents() {
    const ev = [], spb = (this.bars[1] - this.bars[0]) / 3, S = this.sectionBars;
    const add = (bar, beat, e) => { e.t = this.timeOfBar(bar) + beat * spb; ev.push(e); };
    const tones = (s) => s.split('+').map(noteFreq);
    const melody = (str, bar0, vol, dbl) => {
      for (const e of parseSeq(str).ev) {
        const b = bar0 + Math.floor(e.beat / 3), bt = e.beat % 3;
        add(b, bt, { kind: 'bell', f: e.freqs[0], dur: Math.max(0.7, Math.min(2.2, e.dur * spb * 2.4)), vol });
        if (dbl) add(b, bt, { kind: 'bell', f: e.freqs[0] / 2, dur: Math.max(0.6, Math.min(1.8, e.dur * spb * 2)), vol: dbl });
      }
    };
    const waltz = (chords, bar0, o) => chords.forEach((ch, i) => {
      const [bass, up, pad] = DANCE_VOICE[ch], b = bar0 + i;
      add(b, 0, { kind: 'pluck', f: noteFreq(bass), dur: spb * 1.6, vol: o.bass });
      if (o.low) add(b, 0, { kind: 'pluck', f: noteFreq(bass) / 2, dur: spb * 2, vol: o.low });
      if (o.beats) for (const k of [1, 2]) tones(up).forEach((f) => add(b, k, { kind: 'bellLow', f, vol: o.beats }));
      if (o.pad) add(b, 0, { kind: 'pad', fs: tones(pad), dur: spb * 3.05, vol: o.pad });
      if (o.spark && i % o.spark === o.spark - 1) add(b, 2.5, { kind: 'sparkle' });
    });
    /* a harp sweep up the chord, leading into a bar (or, at the very start, rising through its first beat) */
    const gliss = (bar, ch, vol, from = -0.9) => { const p = tones(DANCE_VOICE[ch][2]), t = p.concat(p.map((f) => f * 2), p.map((f) => f * 4)); t.forEach((f, k) => add(bar, from + k * 0.08, { kind: 'bell', f, dur: 1.2, vol })); };

    // theme
    gliss(S[0], 'E', 0.04, 0);
    melody(DANCE_SCORE.theme.melody, S[0], 0.17);
    waltz(DANCE_SCORE.theme.chords, S[0], { bass: 0.24, beats: 0.05, spark: 2 });
    // variation: softer, with a string pad underneath
    melody(DANCE_SCORE.variation.melody, S[1], 0.14);
    waltz(DANCE_SCORE.variation.chords, S[1], { bass: 0.2, beats: 0.042, pad: 0.016, spark: 4 });
    // hush: a wordless choir over held chords, celesta flakes falling
    for (const e of parseSeq(DANCE_SCORE.hush.choir).ev) add(S[2] + Math.floor(e.beat / 3), e.beat % 3, { kind: 'choir', f: e.freqs[0], dur: e.dur * spb * 1.02, vol: 0.05 });
    waltz(DANCE_SCORE.hush.chords, S[2], { bass: 0.12, pad: 0.03 });
    DANCE_SCORE.hush.chords.forEach((ch, i) => {
      const t = tones(DANCE_VOICE[ch][2]);
      add(S[2] + i, 1.5, { kind: 'bell', f: t[(i * 2) % 3] * 4, dur: 1.4, vol: 0.035 });
      add(S[2] + i, 2.5, { kind: 'bell', f: t[(i * 2 + 1) % 3] * 4, dur: 1.4, vol: 0.03 });
    });
    // finale: full, louder, the theme doubled an octave down, then the cadence and the last chord
    gliss(S[3], 'E', 0.05); gliss(S[3] + 8, 'E', 0.05);
    melody(DANCE_SCORE.finale.melody, S[3], 0.18, 0.07);
    waltz(DANCE_SCORE.finale.chords.slice(0, -1), S[3], { bass: 0.28, low: 0.14, beats: 0.06, spark: 1 });
    DANCE_SCORE.finale.chords.slice(8, -1).forEach((ch, i) => add(S[3] + 8 + i, 0, { kind: 'pad', fs: tones(DANCE_VOICE[ch][2]), dur: spb * 3.05, vol: 0.022 + i * 0.002 }));
    const last = S[4] - 1;
    add(last - 1, 0, { kind: 'swell', dur: spb * 3 });
    ['E4', 'G#4', 'B4', 'E5', 'G#5', 'B5', 'E6'].forEach((n, k) => add(last, k * 0.1, { kind: 'bell', f: noteFreq(n), dur: 3.4, vol: 0.11 }));
    add(last, 0, { kind: 'pluck', f: noteFreq('E2'), dur: 1.6, vol: 0.3 }); add(last, 0, { kind: 'pluck', f: noteFreq('E1'), dur: 2.2, vol: 0.18 });
    add(last, 0, { kind: 'pad', fs: tones('E3+G#3+B3+E4'), dur: 3.6, vol: 0.05 });
    add(last, 0, { kind: 'timp', dur: 2.6 });
    return ev.sort((a, b) => a.t - b.t);
  },
  pump() {
    if (!this.running || this.paused || this.clock !== 'audio' || !this.bus) return;
    // handed over 1.5 s ahead of the audio clock: a slow frame (or a busy phone) never leaves a gap in the music
    const c = Sound.ctx, ahead = c.currentTime + 1.5;
    while (this.evIdx < this.events.length) {
      const e = this.events[this.evIdx], at = this.t0 + e.t / this.rate;
      if (at > ahead) break;
      this.evIdx++;
      if (at >= c.currentTime - 0.05) this.play(e, at);
    }
  },
  play(e, at) {
    const bus = this.bus; if (!bus) return;
    const r = this.rate;
    switch (e.kind) {
      case 'bell': Sound.bell(at, e.f, e.dur / Math.sqrt(r), e.vol, bus); break;
      case 'bellLow': Sound.bell(at, e.f, 0.8, e.vol, bus, 0.4); break;
      case 'pluck': Sound.pluck(at, e.f, e.dur / r, e.vol, bus); break;
      case 'sparkle': Sound.noiseHit(at, 0.05, 0.03, 'highpass', 7000, 0.8, bus); Sound.bell(at, noteFreq('B6'), 0.6, 0.025, bus, 1.6); break;
      case 'pad': e.fs.forEach((f) => this.pad(at, f, e.dur / r, e.vol, bus)); break;
      case 'choir': this.choir(at, e.f, e.dur / r, e.vol, bus); break;
      case 'swell': Sound.noiseHit(at, e.dur / r, 0.05, 'highpass', 5200, 0.6, bus, 9000); break;
      case 'timp': Sound.tone(at, 84, 78, e.dur / r, 0.2, 'sine', bus); Sound.noiseHit(at, 2.4 / r, 0.045, 'highpass', 6500, 0.4, bus); break;
    }
  },
  /* soft strings: two detuned saws through a low-pass, slow bow */
  pad(t, f, dur, vol, dest) {
    const c = Sound.ctx; if (!c || !f) return;
    const a = Math.min(0.5, dur * 0.35), rel = 0.6, g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setValueAtTime(vol, t + Math.max(a, dur - 0.05)); g.gain.linearRampToValueAtTime(0.0001, t + dur + rel);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(3000, 700 + f * 1.4); lp.Q.value = 0.4;
    lp.connect(g); g.connect(dest);
    for (const det of [-7, 7]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + rel + 0.05); }
  },
  /* a wordless "ah": a softened saw with a vowel formant and a little vibrato */
  choir(t, f, dur, vol, dest) {
    const c = Sound.ctx; if (!c || !f) return;
    const a = Math.min(0.45, dur * 0.3), rel = 0.7, g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setValueAtTime(vol, t + Math.max(a, dur - 0.1)); g.gain.linearRampToValueAtTime(0.0001, t + dur + rel);
    const form = c.createBiquadFilter(); form.type = 'peaking'; form.frequency.value = 900; form.Q.value = 2.2; form.gain.value = 9;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    form.connect(lp); lp.connect(g); g.connect(dest);
    const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 5.2; vg.gain.value = f * 0.006; vib.connect(vg);
    for (const [type, det, lv] of [['sawtooth', -5, 0.6], ['triangle', 5, 1]]) {
      const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = f; o.detune.value = det; og.gain.value = lv;
      vg.connect(o.frequency); o.connect(og); og.connect(form); o.start(t); o.stop(t + dur + rel + 0.05);
    }
    vib.start(t); vib.stop(t + dur + rel + 0.05);
  },
};
