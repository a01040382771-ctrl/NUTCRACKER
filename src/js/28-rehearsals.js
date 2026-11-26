/* =====================================================================
   28 · THE THREE REHEARSALS — chocolate (castanets), coffee (the silk veil), tea (the teacup tower)
   Each tune is an original piece written for this game in the spirit of the dance, not a transcription.
   ===================================================================== */

/* ---------- little painted icons (canvas) ---------- */
function glowDot(g, x, y, r, rgb, a) { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, `rgba(${rgb},${a})`); rg.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
function drawCastanet(g, x, y, s, alpha = 1, glow = 0) {
  g.save(); g.globalAlpha = alpha;
  if (glow > 0) glowDot(g, x, y, s * 1.05, '255,214,140', 0.6 * glow);
  g.translate(x, y);
  for (const sx of [-1, 1]) {
    g.save(); g.translate(sx * s * 0.2, s * 0.08); g.rotate(sx * 0.25);
    const grd = g.createRadialGradient(-s * 0.08, -s * 0.14, s * 0.04, 0, 0, s * 0.4); grd.addColorStop(0, '#9a5634'); grd.addColorStop(1, '#3b1d14');
    g.fillStyle = grd; g.beginPath(); g.ellipse(0, 0, s * 0.27, s * 0.36, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,222,180,0.45)'; g.lineWidth = Math.max(1, s * 0.045); g.beginPath(); g.ellipse(0, 0, s * 0.17, s * 0.25, 0, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
    g.restore();
  }
  g.strokeStyle = '#ef5a70'; g.lineWidth = Math.max(1.5, s * 0.08); g.lineCap = 'round'; g.beginPath(); g.arc(0, -s * 0.36, s * 0.17, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  g.restore();
}
function drawShoe(g, x, y, s, alpha = 1, glow = 0) {
  g.save(); g.globalAlpha = alpha;
  if (glow > 0) glowDot(g, x, y, s * 1.05, '255,170,150', 0.55 * glow);
  g.translate(x, y);
  g.fillStyle = '#c42d42'; g.beginPath();
  g.moveTo(-s * 0.42, -s * 0.02); g.quadraticCurveTo(-s * 0.42, -s * 0.3, -s * 0.18, -s * 0.3); g.lineTo(s * 0.04, -s * 0.12);
  g.quadraticCurveTo(s * 0.42, -s * 0.12, s * 0.46, s * 0.08); g.lineTo(s * 0.46, s * 0.15); g.lineTo(-s * 0.16, s * 0.15);
  g.lineTo(-s * 0.2, s * 0.36); g.lineTo(-s * 0.36, s * 0.36); g.lineTo(-s * 0.4, s * 0.12); g.closePath(); g.fill();
  g.fillStyle = '#2a1216'; g.fillRect(-s * 0.36, s * 0.13, s * 0.82, s * 0.05);
  g.fillStyle = '#f0c96e'; g.beginPath(); g.arc(-s * 0.08, -s * 0.18, s * 0.065, 0, TAU); g.fill();
  g.restore();
}
/* a teacup on its saucer; (x, y) is the bottom of the saucer, w the saucer width */
function drawCup(g, x, y, w, rot = 0, alpha = 1) {
  const h = w * 0.5;
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = alpha;
  g.fillStyle = '#efe6d2'; g.beginPath(); g.ellipse(0, -h * 0.09, w * 0.5, h * 0.15, 0, 0, TAU); g.fill();
  g.strokeStyle = '#2f7d68'; g.lineWidth = Math.max(1, w * 0.03); g.stroke();
  g.beginPath(); g.moveTo(-w * 0.36, -h * 0.98); g.bezierCurveTo(-w * 0.35, -h * 0.34, -w * 0.2, -h * 0.17, 0, -h * 0.17); g.bezierCurveTo(w * 0.2, -h * 0.17, w * 0.35, -h * 0.34, w * 0.36, -h * 0.98); g.closePath();
  const grd = g.createLinearGradient(-w * 0.36, 0, w * 0.36, 0); grd.addColorStop(0, '#e3dac6'); grd.addColorStop(0.42, '#fffaf0'); grd.addColorStop(1, '#d4c9b2');
  g.fillStyle = grd; g.fill();
  g.save(); g.clip();
  g.fillStyle = '#d13a4c'; g.fillRect(-w * 0.4, -h * 0.84, w * 0.8, h * 0.13);
  g.fillStyle = '#3a957a'; g.fillRect(-w * 0.4, -h * 0.36, w * 0.8, h * 0.06);
  g.fillStyle = '#e0b25c'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(i * w * 0.115, -h * 0.55, Math.max(1, w * 0.026), 0, TAU); g.fill(); }
  g.restore();
  g.fillStyle = '#f8f1e2'; g.beginPath(); g.ellipse(0, -h * 0.98, w * 0.36, h * 0.1, 0, 0, TAU); g.fill();
  g.strokeStyle = '#c9a24d'; g.lineWidth = Math.max(1, w * 0.02); g.stroke();
  g.fillStyle = '#b8742e'; g.beginPath(); g.ellipse(0, -h * 0.965, w * 0.3, h * 0.065, 0, 0, TAU); g.fill();
  g.restore();
}
function drawLeaf(g, x, y, s, on) {
  g.save(); g.translate(x, y); g.rotate(-0.6);
  g.fillStyle = on ? '#6fd39d' : 'rgba(255,255,255,0.16)'; g.beginPath(); g.ellipse(0, 0, s * 0.32, s * 0.6, 0, 0, TAU); g.fill();
  g.strokeStyle = on ? '#2f7d68' : 'rgba(255,255,255,0.3)'; g.lineWidth = Math.max(1, s * 0.08); g.beginPath(); g.moveTo(0, -s * 0.55); g.lineTo(0, s * 0.6); g.stroke();
  g.restore();
}

/* =========================================================
   스페인 춤 · 초콜릿 — listen to the pattern, then play it back
   ========================================================= */
const ANDALUZ = { Am: ['A2', 'E3', 'A3', 'C4', 'E4'], G: ['G2', 'B2', 'D3', 'G3', 'B3'], F: ['F2', 'C3', 'F3', 'A3', 'C4'], E: ['E2', 'B2', 'E3', 'G#3', 'B3'] };
const ChocoGame = {
  id: 'choco', countIn: 3,
  get bpm() { return SWEET_CFG.choco.bpm; },
  prepare(R) {
    const C = SWEET_CFG.choco, bar = R.spb * C.beatsPerBar, slot = R.spb / 2;
    this.bar = bar; this.slot = slot; this.win = C.windows; this.forgive = C.forgive;
    let t = C.introBars * bar;   // a pattern of one bar is played and answered in two bars, a pattern of two bars in four
    this.rounds = C.patterns.map((p, r) => {
      const s = p.replace(/[^CS.]/g, ''), notes = [];
      for (let i = 0; i < s.length; i++) if (s[i] !== '.') notes.push({ slot: i, type: s[i] === 'C' ? 'cast' : 'stomp' });
      const slots = s.length, bars = Math.max(1, Math.round(slots / 6)), callT = t, respT = callT + bars * bar, endT = respT + bars * bar;
      t = endT;
      return {
        r, notes, slots, bars, callT, respT, endT,
        resp: notes.map((n) => ({ slot: n.slot, type: n.type, t: respT + n.slot * slot, state: 'wait' })), taps: [], cue: 0, miss: 0, wrong: 0, stray: 0, done: false, ok: false,
      };
    });
    this.outroT = t;
    this.endT = this.outroT + 2 * bar;
    this.cur = 0; this.ok = 0; this.label = null; this.pad = [-9, -9]; this.free = [];
    this.stats = { perfect: 0, good: 0, miss: 0, wrong: 0, stray: 0 };
  },
  score(R) {
    const ev = R.countInEvents(this.countIn), spb = R.spb, bar = this.bar, C = SWEET_CFG.choco;
    const strumBar = (b, ch, accent = 1) => {
      const t = b * bar, notes = ANDALUZ[ch];
      ev.push({ t, kind: 'strum', notes, vol: 0.115 * accent, spread: 0.016, dur: 0.9 });
      ev.push({ t: t + spb, kind: 'strum', notes: notes.slice(2), vol: 0.068 * accent, spread: 0.01, dur: 0.45 });
      ev.push({ t: t + 2 * spb, kind: 'strum', notes: notes.slice(2), vol: 0.068 * accent, spread: 0.01, dur: 0.45 });
      ev.push({ t, kind: 'pluck', f: noteFreq(notes[0]), dur: bar * 0.9, vol: 0.2 });
    };
    for (let b = 0; b < C.introBars; b++) strumBar(b, b === C.introBars - 1 ? 'E' : 'Am');
    ev.push(...R.melody(C.introBars >= 2 ? 'E5:1 F5:0.5 E5:0.5 D5:1 | C5:0.5 B4:0.5 G#4:1 E4:1' : 'E5:1 D5:0.5 C5:0.5 B4:1', 0, 'guit', 0.09, { legato: 1.4 }));
    this.rounds.forEach((rd) => {
      const b0 = rd.callT / bar, prog = rd.bars === 1 ? ['Am', 'E'] : ['Am', 'G', 'F', 'E'];   // the Andalusian cadence, shortened for a pattern of one bar
      prog.forEach((ch, k) => strumBar(b0 + k, ch, k < prog.length / 2 ? 0.8 : 1));
      for (const n of rd.notes) ev.push({ t: rd.callT + n.slot * this.slot, kind: n.type === 'cast' ? 'castanet' : 'stomp', vol: n.type === 'cast' ? 0.2 : 0.26 });
      ev.push({ t: rd.respT - spb * 0.5, kind: 'sparkle' });
    });
    // ending: a run up the scale, a flourish of strums, a castanet roll and one last stamp — ¡olé!
    const o = this.outroT;
    strumBar(o / bar, 'Am', 1.1);
    ev.push(...R.melody('A4:0.5 C5:0.5 E5:0.5 A5:0.5 G#5:0.5 A5:0.5', o, 'guit', 0.08, { legato: 1.2 }));
    for (let i = 0; i < 3; i++) ev.push({ t: o + bar + i * 0.07, kind: 'strum', notes: ANDALUZ.Am, vol: 0.09, spread: 0.008, dur: 1.4 });
    for (let i = 0; i < 9; i++) ev.push({ t: o + bar + i * 0.06, kind: 'castanet', vol: 0.12 + i * 0.01 });
    ev.push({ t: o + bar + spb * 1.5, kind: 'stomp', vol: 0.3 }, { t: o + bar + spb * 1.5, kind: 'castanet', vol: 0.24 }, { t: o + bar, kind: 'pluck', f: noteFreq('A2'), dur: 1.6, vol: 0.26 });
    return ev;
  },
  roundAt(t) { const w = this.win.good; return this.rounds.find((rd) => !rd.done && t >= rd.respT - w && t <= rd.endT + w) || null; },
  /* one tap of the stamp or the castanets at audible time t (seconds from the first beat) */
  tap(R, type, t) {
    const pad = type === 'stomp' ? 0 : 1;
    this.pad[pad] = t;
    if (type === 'cast') Voice.castanet(Sound.now, 0.2); else Voice.stomp(Sound.now, 0.26);
    const rd = this.roundAt(t);
    if (!rd) { this.free.push({ type, t }); if (this.free.length > 8) this.free.shift(); R.emit('free', { type }); return 'free'; }
    // the earliest unplayed note of the same sound within the window (so a late tap in a quick run never takes the next note);
    // a tap with only the other sound nearby is a wrong pad, a tap with nothing nearby is off the beat
    const near = rd.resp.filter((n) => n.state === 'wait' && Math.abs(n.t - t) <= this.win.good);
    const same = near.filter((n) => n.type === type).sort((a, b) => a.t - b.t)[0];
    let rating;
    if (same) { rating = Math.abs(same.t - t) <= this.win.perfect ? 'perfect' : 'good'; same.state = rating; this.stats[rating]++; }
    else if (near.length) { const other = near.sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t))[0]; rating = 'wrong'; other.state = 'wrong'; rd.wrong++; this.stats.wrong++; }
    else { rating = 'stray'; rd.stray++; this.stats.stray++; }
    rd.taps.push({ type, t, rating });
    this.label = { text: { perfect: '정확!', good: '좋음', wrong: '다른 소리', stray: '엇박' }[rating], rating, born: t };
    R.emit('hit', { type, rating });
    return rating;
  },
  update(R, rel) {
    const w = this.win.good;
    for (const rd of this.rounds) {
      // the dancer's own pattern: a cue for the 3D dancer on every note she plays
      while (rd.cue < rd.notes.length && rel >= rd.callT + rd.notes[rd.cue].slot * this.slot) { R.emit('call', { type: rd.notes[rd.cue].type }); rd.cue++; }
      if (rd.done) continue;
      for (const n of rd.resp) if (n.state === 'wait' && rel > n.t + w) { n.state = 'miss'; rd.miss++; this.stats.miss++; }
      if (rel >= rd.endT + w) {
        rd.done = true;
        const errors = rd.miss + rd.wrong + rd.stray;
        rd.ok = errors <= this.forgive;
        if (rd.ok) this.ok++;
        const clean = errors === 0 && rd.resp.every((n) => n.state === 'perfect');
        this.label = { text: rd.ok ? (clean ? '완벽해요!' : '좋아요!') : '아쉬워요', rating: rd.ok ? 'perfect' : 'miss', born: rel, big: true };
        R.emit('round', { ok: rd.ok, r: rd.r });
      }
    }
    this.cur = this.rounds.findIndex((rd) => rel < rd.endT);
    if (rel >= this.endT) R.finish(this.result());
  },
  pointer(R, type, x, y, t) { if (type === 'down') this.tap(R, x < R.W / 2 ? 'stomp' : 'cast', t); },
  key(R, code, t, down) {
    if (!down) return false;
    const K = SWEET_CFG.choco.keys;
    if (K.stomp.includes(code)) { this.tap(R, 'stomp', t); return true; }
    if (K.cast.includes(code)) { this.tap(R, 'cast', t); return true; }
    return false;
  },
  /* test hook: plays the notes of every round at their exact times through tap(); `fail` rounds are left silent, `wrong` rounds use the other pad, `good` notes come late by the middle of the good window */
  auto(R, rel, plan) {
    for (const rd of this.rounds) {
      if (rd.done || rel < rd.respT - 0.2) continue;
      const fail = (plan.fail || []).includes(rd.r), wrong = (plan.wrong || []).includes(rd.r);
      rd.resp.forEach((n, i) => {
        if (n.state !== 'wait' || fail || n.autoDone) return;
        const late = (((rd.r * 7 + i) * 19) % 100) / 100 < (plan.good || 0) ? (this.win.perfect + this.win.good) / 2 : 0.02;
        if (rel >= n.t + late) { n.autoDone = true; this.tap(R, wrong ? (n.type === 'cast' ? 'stomp' : 'cast') : n.type, n.t + late); }
      });
    }
  },
  result() {
    const C = SWEET_CFG.choco, N = this.rounds.length, st = this.stats;
    return {
      id: 'choco', pass: this.ok >= C.passRounds, ok: this.ok, total: N, perfect: st.perfect, good: st.good, slips: st.miss + st.wrong + st.stray,
      stats: [['맞춘 패턴', `${this.ok} / ${N}`], ['정확', String(st.perfect)], ['좋음 · 실수', `${st.good} · ${st.miss + st.wrong + st.stray}`]],
      need: `패턴 ${C.passRounds}개를 맞추면 성공이에요`, more: Math.max(1, C.passRounds - this.ok), unit: '패턴',
    };
  },
  /* ---------- drawing ---------- */
  /* where the strip of a round sits in the panel: its slots, its two rows (the dancer's above, the player's below) and the size of a mark */
  geom(R, rd) {
    const W = R.W, H = R.H, n = rd.slots, x0 = W * 0.05, x1 = W * 0.95, sw = (x1 - x0) / n, sy = H * 0.2, sh = Math.min(H * 0.3, 140);
    return { W, H, n, x0, x1, sw, sy, sh, row1: sy + sh * 0.3, row2: sy + sh * 0.74, icon: Math.min(sw * 0.92, sh * 0.34), xOf: (slotF) => x0 + sw * (slotF + 0.5) };
  },
  draw(R, g) {
    const W = R.W, H = R.H, rel = R.lastRel, C = SWEET_CFG.choco;
    R.panel(g, 'rgba(70,14,26,0.78)', 'rgba(36,6,12,0.92)');
    const rd = this.cur >= 0 ? this.rounds[this.cur] : this.rounds[this.rounds.length - 1];
    const states = this.rounds.map((x) => (x.done ? (x.ok ? 'ok' : 'no') : ''));
    R.dots(g, W / 2, 22, this.rounds.length, states, this.cur, Math.min(7, W * 0.016));
    // what the stage is doing: counting in, the dancer playing her pattern, or the player's turn (her pattern stays up the whole time)
    const finale = this.cur < 0 || rel >= this.outroT;
    const calling = !finale && rel >= rd.callT && rel < rd.respT - 0.05, answering = !finale && rel >= rd.respT - 0.05 && rel < rd.endT + 0.1;
    let phase = '박자를 느껴 보세요', pcol = '#fff1d6';
    if (finale) { phase = '올레!'; pcol = '#ffe08a'; }
    else if (calling) { phase = '무용수의 박자를 잘 들어요'; pcol = '#ffe3c0'; }
    else if (answering) { phase = '위의 박자를 보며 따라 쳐요!'; pcol = '#ffe08a'; }
    else if (rel >= 0) phase = '잘 들어 보세요';
    R.text(g, phase, W / 2, 50, Math.min(20, W * 0.05), pcol);
    // the strip: the dancer's row above the player's row, one slot per eighth note (six to a bar)
    const { n, x0, x1, sw, sy, sh, row1, row2, icon, xOf } = this.geom(R, rd);
    const mark = (type, x, y, s, a, glow) => (type === 'cast' ? drawCastanet : drawShoe)(g, x, y, s, a, glow);
    g.fillStyle = 'rgba(20,4,8,0.45)'; rr(g, x0 - 6, sy, x1 - x0 + 12, sh, 12); g.fill();
    g.strokeStyle = 'rgba(241,217,152,0.35)'; g.lineWidth = 1;
    for (let b = 1; b < rd.bars; b++) { g.beginPath(); g.moveTo(x0 + sw * 6 * b, sy + 6); g.lineTo(x0 + sw * 6 * b, sy + sh - 6); g.stroke(); }
    g.beginPath(); g.moveTo(x0, (row1 + row2) / 2); g.lineTo(x1, (row1 + row2) / 2); g.strokeStyle = 'rgba(241,217,152,0.18)'; g.stroke();
    for (let i = 0; i < n; i++) {
      const cx = xOf(i), beat = i % 2 === 0;
      for (const y of [row1, row2]) { g.fillStyle = beat ? 'rgba(255,236,200,0.28)' : 'rgba(255,236,200,0.12)'; g.beginPath(); g.arc(cx, y, beat ? 3.2 : 2, 0, TAU); g.fill(); }
    }
    R.text(g, '무용수의 박자', x0 + 2, sy - 9, 12, 'rgba(255,228,200,0.85)', { align: 'left', weight: 700, stroke: false });
    R.text(g, '내 박자', x0 + 2, sy + sh + 11, 12, 'rgba(255,228,200,0.85)', { align: 'left', weight: 700, stroke: false });
    // the player's row: a faint mark where each note has to land, clearer as its time comes, until it is played
    const lead = clamp((rel - (rd.respT - 0.7)) / 0.5, 0, 1);
    if (lead > 0) for (const nn of rd.resp) if (nn.state === 'wait') mark(nn.type, xOf(nn.slot), row2, icon * 0.9, lead * (0.28 + 0.5 * clamp(1 - (nn.t - rel) / 0.75, 0, 1)), 0);
    // the dancer's row: every note she has played stays on the strip for the whole round
    for (const nn of rd.notes) {
      const age = rel - (rd.callT + nn.slot * this.slot);
      if (age < 0) continue;
      mark(nn.type, xOf(nn.slot), row1, icon * (age < 0.25 ? 1 + 0.5 * (1 - age / 0.25) : 1), 1, age < 0.4 ? 1 - age / 0.4 : 0);
    }
    // the note about to be played back: a ring closes in on it in the dancer's row, and a thread leads down to its place in the player's row
    if (answering) for (const nn of rd.resp) {
      if (nn.state !== 'wait') continue;
      const dt = nn.t - rel; if (dt > 0.75) continue;
      const k = clamp(1 - dt / 0.75, 0, 1), x = xOf(nn.slot);
      g.strokeStyle = `rgba(255,233,168,${0.2 + 0.45 * k})`; g.lineWidth = 1.5; g.setLineDash([2, 4]); g.beginPath(); g.moveTo(x, row1 + icon * 0.62); g.lineTo(x, row2 - icon * 0.55); g.stroke(); g.setLineDash([]);
      g.strokeStyle = `rgba(255,233,168,${0.3 + 0.65 * k})`; g.lineWidth = 2.5; g.beginPath(); g.arc(x, row1, icon * (0.98 - 0.36 * k), 0, TAU); g.stroke();
    }
    for (const tp of rd.taps) {
      const sf = (tp.t - rd.respT) / this.slot, age = rel - tp.t;
      const x = xOf(clamp(sf, -0.4, n - 0.6));
      mark(tp.type, x, row2, icon * (age < 0.2 ? 1.25 - age : 1), 1, tp.rating === 'perfect' || tp.rating === 'good' ? Math.max(0.25, 1 - age * 2) : 0);
      if (tp.rating === 'wrong' || tp.rating === 'stray') { g.strokeStyle = 'rgba(255,140,150,0.9)'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, row2, icon * 0.55, 0, TAU); g.stroke(); }
    }
    for (const nn of rd.resp) if (nn.state === 'miss') { g.strokeStyle = 'rgba(255,170,180,0.55)'; g.setLineDash([3, 4]); g.lineWidth = 2; g.beginPath(); g.arc(xOf(nn.slot), row2, icon * 0.45, 0, TAU); g.stroke(); g.setLineDash([]); }
    // the playhead runs across the dancer's row while she plays, and across both rows while the player answers
    if (rel >= rd.callT && rel < rd.endT) {
      const inResp = rel >= rd.respT, sf = (rel - (inResp ? rd.respT : rd.callT)) / this.slot - 0.5;
      const x = xOf(clamp(sf, -0.5, n - 0.5)), yTop = row1 - icon * 0.6, yBot = (inResp ? row2 : row1) + icon * 0.6;
      const lg = g.createLinearGradient(x - 14, 0, x + 2, 0); lg.addColorStop(0, 'rgba(255,224,150,0)'); lg.addColorStop(1, 'rgba(255,224,150,0.55)');
      g.fillStyle = lg; g.fillRect(x - 14, yTop, 16, yBot - yTop);
      g.fillStyle = '#fff3c9'; g.fillRect(x, yTop, 2, yBot - yTop);
    }
    // the label of the last tap or round
    const lb = this.label;
    if (lb && rel - lb.born >= 0 && rel - lb.born < (lb.big ? 1.1 : 0.6)) {
      const age = rel - lb.born, k = 1 + 0.25 * Math.max(0, 1 - age / 0.12), col = lb.rating === 'perfect' ? '#ffe9a8' : lb.rating === 'good' ? '#ffd9c2' : '#f2b8c6';
      g.save(); g.translate(W / 2, sy + sh + (lb.big ? 30 : 26) - age * 14); g.scale(k, k);
      R.text(g, lb.text, 0, 0, lb.big ? Math.min(26, W * 0.065) : Math.min(19, W * 0.048), col, { alpha: 1 - clamp((age - (lb.big ? 0.8 : 0.35)) / 0.3, 0, 1) });
      g.restore();
    }
    // the two pads: stamp on the left, castanets on the right; they rest while the dancer plays and light up for the player's turn
    const listening = rel >= 0 && !finale && !answering, padA = listening ? 0.55 + 0.45 * clamp((rel - (rd.respT - R.spb)) / R.spb, 0, 1) : 1;
    const pr = Math.min(W * 0.19, H * 0.15, 88), py = H - pr - Math.max(18, H * 0.05);
    g.save(); g.globalAlpha = padA;
    [['stomp', W * 0.27, '쿵 · 발 구르기', C.keys.stomp], ['cast', W * 0.73, '딱 · 캐스터네츠', C.keys.cast]].forEach(([type, px, label, keys], i) => {
      const age = rel - this.pad[i], flash = age >= 0 && age < 0.18 ? 1 - age / 0.18 : 0;
      const grd = g.createRadialGradient(px - pr * 0.3, py - pr * 0.35, pr * 0.1, px, py, pr);
      grd.addColorStop(0, i ? '#f8dca0' : '#f3a0aa'); grd.addColorStop(0.55, i ? '#c9903e' : '#b3263a'); grd.addColorStop(1, i ? '#6e4416' : '#5e1020');
      g.fillStyle = grd; g.beginPath(); g.arc(px, py, pr * (1 - flash * 0.06), 0, TAU); g.fill();
      g.lineWidth = 3; g.strokeStyle = flash ? '#fff6d6' : 'rgba(255,236,190,0.8)'; g.stroke();
      if (flash) glowDot(g, px, py, pr * 1.35, '255,230,170', 0.5 * flash);
      (type === 'cast' ? drawCastanet : drawShoe)(g, px, py - pr * 0.08, pr * 0.95, 1, 0);
      R.text(g, label, px, py + pr * 0.66, Math.min(14, W * 0.034), '#fff4e2', { weight: 700 });
      if (!DEVICE.touch) R.text(g, keys.map((k) => k.replace('Key', '').replace('Arrow', '').replace('Left', '←').replace('Right', '→')).join(' · '), px, py - pr - 10, 12, 'rgba(255,236,200,0.85)', { weight: 700, font: 'Cinzel, serif' });
    });
    g.restore();
  },
};

/* =========================================================
   아라비아 춤 · 커피 — keep a finger on the bead as it draws the silk
   ========================================================= */
const COFFEE_SHAPES = {
  wave: { name: '물결', f: (s) => [0.08 + 0.84 * s, 0.5 - 0.27 * Math.sin(TAU * 1.25 * s)] },
  eight: { name: '8자', f: (s) => [0.5 + 0.4 * Math.sin(TAU * s), 0.5 - 0.27 * Math.sin(TAU * 2 * s)] },
  loops: { name: '고리', f: (s) => { const p = TAU * 3 * s; return [0.13 + 0.74 * s - 0.085 * Math.sin(p), 0.52 - 0.2 * Math.cos(p)]; } },
};
const COFFEE_MEL = [
  'D5:1 Eb5:0.5 F#5:0.5 G5:2 | A5:1 G5:0.5 F#5:0.5 Eb5:2 | D5:4',
  'A5:1 Bb5:0.5 A5:0.5 G5:1 F#5:1 | G5:1 A5:0.5 G5:0.5 F#5:1 Eb5:1 | D5:2 F#5:1 D5:1',
  'D6:1 C6:0.5 Bb5:0.5 A5:1 G5:1 | F#5:1 G5:0.5 A5:0.5 Bb5:1 A5:1 | G5:0.5 F#5:0.5 Eb5:1 D5:2',
];
const CoffeeGame = {
  id: 'coffee', countIn: 2,
  get bpm() { return SWEET_CFG.coffee.bpm; },
  lut(id) {
    const f = COFFEE_SHAPES[id].f, N = 360, pts = [], cum = [0];
    for (let i = 0; i <= N; i++) pts.push(f(i / N));
    for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, len: cum[N] };
  },
  /* point at a share u of the arc length */
  at(L, u) {
    const target = clamp(u, 0, 1) * L.len, c = L.cum;
    let lo = 0, hi = c.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] < target) lo = m; else hi = m; }
    const k = c[hi] > c[lo] ? (target - c[lo]) / (c[hi] - c[lo]) : 0, a = L.pts[lo], b = L.pts[hi];
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  },
  prepare(R) {
    const C = SWEET_CFG.coffee, bar = R.spb * C.beatsPerBar;
    this.bar = bar;
    this.phrases = C.shapes.map((id, i) => {
      const start = (C.introBars + i * (C.phraseBars + C.restBars)) * bar;
      return { id, i, start, go: start + R.spb, end: start + C.phraseBars * bar, L: this.lut(id), score: 0, time: 0, pct: 0, done: false, beats: C.phraseBars * C.beatsPerBar - 1 };
    });
    this.endT = this.phrases[this.phrases.length - 1].end + bar;
    this.cur = 0; this.prev = null; this.trail = []; this.kc = { x: 0.5, y: 0.5, used: false }; this.keys = {}; this.onBead = 0; this.label = null;
    this.beatCue = -1;
  },
  score(R) {
    const ev = R.countInEvents(this.countIn), spb = R.spb, bar = this.bar, nBars = Math.round(this.endT / bar);
    for (let b = 0; b < nBars; b++) {
      const t = b * bar;
      ev.push({ t, kind: 'pad', fs: [noteFreq('D3'), noteFreq('A3')], dur: bar * 1.02, vol: 0.026 });
      ev.push({ t, kind: 'dum', vol: 0.2 }, { t: t + spb, kind: 'tek', vol: 0.09 }, { t: t + spb * 1.5, kind: 'tek', vol: 0.06 }, { t: t + spb * 2, kind: 'dum', vol: 0.16 }, { t: t + spb * 3, kind: 'tek', vol: 0.09 }, { t: t + spb * 3.5, kind: 'tambo', vol: 0.04 });
      ev.push({ t, kind: 'pluck', f: noteFreq('D2'), dur: bar * 0.8, vol: 0.14 });
    }
    this.phrases.forEach((p, i) => {
      ev.push({ t: p.start, kind: 'zill', vol: 0.05 });
      ev.push(...R.melody(COFFEE_MEL[i], p.start, 'reed', 0.07, { legato: 0.98 }));
    });
    const last = this.endT - bar;
    ev.push({ t: last, kind: 'zill', vol: 0.06 }, { t: last + spb * 2, kind: 'zill', vol: 0.05 });
    ev.push(...R.melody('A5:1 G5:0.5 F#5:0.5 D5:2', last, 'reed', 0.06));
    return ev;
  },
  /* the square the shapes are drawn in */
  box(R) { const S = Math.min(R.W * 0.9, R.H * 0.74), x = (R.W - S) / 2, y = R.H * 0.16 + (R.H * 0.8 - S) / 2; return { S, x, y }; },
  beadAt(R, p, rel) {
    const C = SWEET_CFG.coffee, b = (rel - p.go) / R.spb, B = p.beats;
    const u = rel < p.go ? 0 : clamp((b + 0.12 * Math.sin(TAU * b)) / B, 0, 1);
    return { u, xy: this.at(p.L, u) };
  },
  cursor(R) {
    const P = R.ptr;
    if (this.kc.used) return { on: true, x: this.kc.x, y: this.kc.y, px: true };
    if (P.type === 'mouse' || P.type === 'pen') return { on: P.inside || P.down, x: P.x, y: P.y };
    return { on: P.down, x: P.x, y: P.y };
  },
  update(R, rel) {
    const C = SWEET_CFG.coffee, bx = this.box(R), Rr = C.radius * bx.S;
    // keyboard cursor
    const dtk = this.prev === null ? 0 : clamp(rel - this.prev, 0, 0.1);
    let kx = 0, ky = 0; const K = this.keys;
    if (K.ArrowLeft || K.KeyA) kx -= 1; if (K.ArrowRight || K.KeyD) kx += 1; if (K.ArrowUp || K.KeyW) ky -= 1; if (K.ArrowDown || K.KeyS) ky += 1;
    if (kx || ky) {
      if (!this.kc.used) { const c0 = this.cursor(R); this.kc.x = c0.on ? c0.x : R.W / 2; this.kc.y = c0.on ? c0.y : R.H / 2; this.kc.used = true; }
      const l = Math.hypot(kx, ky); this.kc.x = clamp(this.kc.x + (kx / l) * C.keySpeed * bx.S * dtk, 0, R.W); this.kc.y = clamp(this.kc.y + (ky / l) * C.keySpeed * bx.S * dtk, 0, R.H);
    }
    const cur = this.cursor(R);
    if (cur.on) { this.trail.push({ x: cur.x, y: cur.y, t: rel }); }
    while (this.trail.length && rel - this.trail[0].t > 0.9) this.trail.shift();
    if (this.trail.length > 64) this.trail.shift();
    // score: time on the bead while it moves (counted in song time, so slow frames do not change it)
    const p = this.phrases.find((x) => !x.done && rel < x.end + 0.001) || null;
    const d = this.prev === null ? 0 : Math.max(0, rel - this.prev);
    this.onBead = 0;
    if (p && rel >= p.go) {
      const bead = this.beadAt(R, p, rel), x = bx.x + bead.xy[0] * bx.S, y = bx.y + bead.xy[1] * bx.S;
      let s = 0;
      if (cur.on) { const dist = Math.hypot(cur.x - x, cur.y - y); s = dist <= Rr ? 1 : dist <= Rr * C.nearK ? 0.5 : 0; }
      this.onBead = s; p.score += s * d; p.time += d;
    }
    // beat cues for the dancer
    const bi = Math.floor(rel / R.spb);
    if (bi !== this.beatCue && rel >= 0) { this.beatCue = bi; R.emit('beat', { i: bi, moving: !!(p && rel >= p.go) }); }
    for (const q of this.phrases) {
      if (!q.done && rel >= q.end) {
        q.done = true; q.pct = q.time > 0 ? Math.round((q.score / q.time) * 100) : 0;
        this.label = { text: q.pct >= 85 ? '아름다워요!' : q.pct >= C.passPct ? '좋아요!' : '조금 더 가까이!', pct: q.pct, born: rel, ok: q.pct >= C.passPct };
        R.emit('phrase', { i: q.i, pct: q.pct });
      }
    }
    this.cur = this.phrases.findIndex((x) => !x.done);
    this.prev = rel;
    if (rel >= this.endT) R.finish(this.result());
  },
  pointer() { /* the cursor is read from Recital.ptr each frame */ this.kc.used = false; },
  key(R, code, t, down) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(code)) return false;
    this.keys[code] = down; return true;
  },
  /* test hook: the cursor rides on the bead (or `off` px away from it) */
  auto(R, rel, plan) {
    const p = this.phrases.find((x) => !x.done) || this.phrases[this.phrases.length - 1], bx = this.box(R);
    const bead = this.beadAt(R, p, Math.max(rel, p.go)), off = ((plan.off || [])[p.i] || 0) * SWEET_CFG.coffee.radius * bx.S;
    R.ptr.type = 'touch'; R.ptr.down = true; R.ptr.inside = true;
    R.ptr.x = bx.x + bead.xy[0] * bx.S + off; R.ptr.y = bx.y + bead.xy[1] * bx.S;
  },
  avg() { return Math.round(this.phrases.reduce((a, p) => a + p.pct, 0) / this.phrases.length); },
  result() {
    const C = SWEET_CFG.coffee, pct = this.avg(), best = this.phrases.reduce((a, p) => (p.pct > a.pct ? p : a), this.phrases[0]);
    return {
      id: 'coffee', pass: pct >= C.passPct, pct, best: COFFEE_SHAPES[best.id].name, parts: this.phrases.map((p) => p.pct),
      stats: [['따라 그린 정도', `${pct}%`], ['가장 잘 그린 춤', `${COFFEE_SHAPES[best.id].name} ${best.pct}%`], ['물결 · 8자 · 고리', this.phrases.map((p) => `${p.pct}`).join('·')]],
      need: `평균 ${C.passPct}% 이상 따라가면 성공이에요`, more: Math.max(1, C.passPct - pct), unit: '%',
    };
  },
  draw(R, g) {
    const W = R.W, H = R.H, rel = R.lastRel, C = SWEET_CFG.coffee, bx = this.box(R), Rr = C.radius * bx.S;
    R.panel(g, 'rgba(44,20,70,0.7)', 'rgba(12,48,54,0.9)');
    const states = this.phrases.map((p) => (p.done ? (p.pct >= C.passPct ? 'ok' : 'no') : ''));
    R.dots(g, W / 2, 22, this.phrases.length, states, this.cur, Math.min(7, W * 0.016));
    const p = this.cur >= 0 ? this.phrases[this.cur] : this.phrases[this.phrases.length - 1];
    const live = this.cur >= 0 && rel >= p.go - R.spb * 0.2 && rel < p.end;
    const head = this.cur < 0 ? '마지막 인사' : rel < p.start ? (rel < 0 ? '비단 자락을 준비해요' : `다음 춤 · ${COFFEE_SHAPES[p.id].name}`) : `${COFFEE_SHAPES[p.id].name} 춤 · 구슬을 따라가요`;
    R.text(g, head, W / 2, 50, Math.min(20, W * 0.05), '#fff1d6');
    // the path: dotted ahead, glowing behind the bead
    if (this.cur >= 0) {
      const preview = rel >= p.start - this.bar ? clamp((rel - (p.start - this.bar)) / (this.bar * 0.6), 0, 1) : 0;
      const bead = this.beadAt(R, p, rel), L = p.L;
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
      g.setLineDash([2, 9]); g.lineWidth = 3; g.strokeStyle = `rgba(246,214,140,${0.55 * preview})`; g.beginPath();
      L.pts.forEach((q, i) => { const x = bx.x + q[0] * bx.S, y = bx.y + q[1] * bx.S; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.setLineDash([]);
      if (bead.u > 0) {
        g.lineWidth = 6; g.strokeStyle = 'rgba(110,230,220,0.55)'; g.shadowColor = 'rgba(110,230,220,0.8)'; g.shadowBlur = 10; g.beginPath();
        const n = Math.max(2, Math.round(bead.u * 120));
        for (let i = 0; i <= n; i++) { const q = this.at(L, (i / n) * bead.u), x = bx.x + q[0] * bx.S, y = bx.y + q[1] * bx.S; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke(); g.shadowBlur = 0;
      }
      g.restore();
      // the bead and the ring you keep your finger in
      if (preview > 0 || live) {
        const x = bx.x + bead.xy[0] * bx.S, y = bx.y + bead.xy[1] * bx.S, beatK = Math.pow(1 - (((rel / R.spb) % 1) + 1) % 1, 3);
        const on = this.onBead;
        g.lineWidth = 2.5; g.strokeStyle = on >= 1 ? 'rgba(255,240,190,0.95)' : on > 0 ? 'rgba(255,220,160,0.7)' : 'rgba(255,240,220,0.35)';
        g.beginPath(); g.arc(x, y, Rr * (1 + 0.06 * beatK), 0, TAU); g.stroke();
        glowDot(g, x, y, Rr * 0.95, on >= 1 ? '255,226,150' : '255,214,140', 0.35 + 0.35 * on);
        const bg2 = g.createRadialGradient(x - 3, y - 3, 1, x, y, Rr * 0.32); bg2.addColorStop(0, '#ffffff'); bg2.addColorStop(0.5, '#ffe7a6'); bg2.addColorStop(1, '#c9903e');
        g.fillStyle = bg2; g.beginPath(); g.arc(x, y, Rr * 0.3 * (1 + 0.12 * beatK), 0, TAU); g.fill();
        if (rel < p.go && rel > p.start - this.bar * 0.5) R.text(g, DEVICE.touch ? '여기에 손가락을 올려요' : '구슬 위에 마우스를 올려요', x, y - Rr - 14, Math.min(15, W * 0.038), '#fff4e2', { weight: 700 });
      }
    }
    // the silk ribbon that follows the player's finger
    const tr = this.trail;
    if (tr.length > 2) {
      for (let i = 1; i < tr.length; i++) {
        const a = tr[i - 1], b = tr[i], age = rel - b.t, k = 1 - clamp(age / 0.9, 0, 1), wv = 4 + 7 * k * (0.6 + 0.4 * Math.sin(b.t * 9 + i * 0.5));
        g.strokeStyle = `hsla(${(318 + i * 1.7) % 360},78%,${64 + 12 * k}%,${0.12 + 0.78 * k})`; g.lineWidth = wv; g.lineCap = 'round';
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
      const last = tr[tr.length - 1]; if (rel - last.t < 0.15) glowDot(g, last.x, last.y, 12, '255,236,190', 0.5);
    }
    if (this.kc.used) { g.fillStyle = '#ffe7a6'; g.save(); g.translate(this.kc.x, this.kc.y); g.rotate(Math.PI / 4); g.fillRect(-5, -5, 10, 10); g.restore(); }
    // the meter for this shape, and the verdict after it
    if (live && p.time > 0.3) {
      const pct = Math.round((p.score / p.time) * 100), mw = Math.min(W * 0.5, 220), mx = (W - mw) / 2, my = H - 22;
      g.fillStyle = 'rgba(255,255,255,0.14)'; rr(g, mx, my - 5, mw, 10, 5); g.fill();
      g.fillStyle = pct >= C.passPct ? '#f6d27a' : '#e9a7b6'; rr(g, mx, my - 5, Math.max(10, (mw * pct) / 100), 10, 5); g.fill();
      R.text(g, `${pct}%`, mx + mw + 22, my, 14, '#fff1d6', { weight: 700, font: 'Cinzel, serif' });
    }
    const lb = this.label;
    if (lb && rel - lb.born >= 0 && rel - lb.born < 1.6) {
      const age = rel - lb.born, k = 1 + 0.25 * Math.max(0, 1 - age / 0.15);
      g.save(); g.translate(W / 2, H * 0.55 - age * 10); g.scale(k, k);
      R.text(g, `${lb.text} ${lb.pct}%`, 0, 0, Math.min(26, W * 0.065), lb.ok ? '#ffe9a8' : '#f2b8c6', { alpha: 1 - clamp((age - 1.2) / 0.4, 0, 1) });
      g.restore();
    }
  },
};

/* =========================================================
   중국 춤 · 차 — set each swinging cup down on the tower
   ========================================================= */
const TEA_MEL = 'D6:0.5 E6:0.5 G6:0.5 E6:0.5 | D6:0.5 B5:0.5 A5:1 | G5:0.5 A5:0.5 B5:0.5 D6:0.5 | E6:1 D6:1 | ' +
  'G6:0.5 E6:0.5 D6:0.5 B5:0.5 | A5:0.5 G5:0.5 E5:1 | D5:0.5 E5:0.5 G5:0.5 A5:0.5 | G5:2';
const TEA_BASS = [['G2', 'D3'], ['G2', 'D3'], ['E2', 'B2'], ['G2', 'D3'], ['C3', 'G2'], ['D3', 'A2'], ['E2', 'B2'], ['G2', 'D3']];
const TeaGame = {
  id: 'tea', countIn: 4,
  get bpm() { return SWEET_CFG.tea.bpm; },
  prepare(R) {
    const C = SWEET_CFG.tea;
    this.bar = R.spb * C.beatsPerBar;
    this.cups = []; this.fallers = []; this.lives = C.lives; this.state = 'play'; this.endAt = Infinity;
    this.hand = { state: 'ready', x: 0, t: 0, spawn: -9 };
    this.scroll = 0; this.stats = { perfect: 0, good: 0, miss: 0 }; this.label = null; this.wob = 0;
  },
  score(R) { return R.countInEvents(this.countIn); },
  loop(R) {
    const spb = R.spb, ev = [];
    ev.push(...R.melody(TEA_MEL, 0, 'flute', 0.075, { legato: 0.82 }));
    TEA_BASS.forEach(([a, b], k) => {
      const t = k * this.bar;
      ev.push({ t, kind: 'pluck', f: noteFreq(a), dur: spb * 0.7, vol: 0.2 }, { t: t + spb, kind: 'pluck', f: noteFreq(b), dur: spb * 0.6, vol: 0.15 });
      ev.push({ t: t + spb * 0.5, kind: 'wood', vol: 0.05, hi: true }, { t: t + spb * 1.5, kind: 'wood', vol: 0.05, hi: true });
      if (k % 4 === 0) ev.push({ t, kind: 'bell', f: noteFreq('G6'), dur: 1.1, vol: 0.035 });
    });
    return { start: 0, len: this.bar * TEA_BASS.length, ev: ev.sort((a, b) => a.t - b.t) };
  },
  amp() { const C = SWEET_CFG.tea; return lerp(C.amp[0], C.amp[1], this.cups.length / C.goal); },
  topX() { return this.cups.length ? this.cups[this.cups.length - 1].x : 0; },
  /* where the swinging cup is (in cup widths from the tower's centre line): over the tower on every second beat */
  swing(R, rel) { const C = SWEET_CFG.tea; return this.topX() + this.amp() * Math.sin((Math.PI * rel) / (R.spb * C.swingBeats)); },
  drop(R, t) {
    if (this.state !== 'play' || this.hand.state !== 'ready' || t < 0) return null;
    const C = SWEET_CFG.tea, x = this.swing(R, t), dx = x - this.topX(), ad = Math.abs(dx);
    const rating = ad <= C.perfect ? 'perfect' : ad <= C.good ? 'good' : 'miss';
    Object.assign(this.hand, { state: 'fall', x, t, rating, dx });
    R.emit('drop', {});
    return rating;
  },
  land(R, rel) {
    const C = SWEET_CFG.tea, h = this.hand, rating = h.rating;
    this.stats[rating]++;
    if (rating === 'miss') {
      this.lives--;
      this.fallers.push({ x: h.x, y: this.cups.length, vx: Math.sign(h.dx || 1) * 1.6, vy: 1.2, r: 0, vr: Math.sign(h.dx || 1) * 5, t: 0 });
      Sound.tone(Sound.now, 520, 260, 0.22, 0.08, 'triangle'); Sound.noiseHit(Sound.now + 0.05, 0.12, 0.05, 'bandpass', 2400, 2);
    } else {
      this.cups.push({ x: rating === 'perfect' ? this.topX() : this.topX() + h.dx, rating, t: rel });
      this.wob = rating === 'perfect' ? 0.25 : 0.8;
      const n = this.cups.length, f = noteFreq('G5') * Math.pow(2, [0, 2, 4, 7, 9, 12, 14, 16, 19][Math.min(8, n)] / 12);
      Sound.bell(Sound.now, f, 0.8, rating === 'perfect' ? 0.09 : 0.06, Sound.sfx, 1.3); Voice.wood(Sound.now, 0.08, Sound.sfx, true);
    }
    this.label = { text: { perfect: '정확!', good: '좋음', miss: '앗, 미끄러졌어요' }[rating], rating, born: rel };
    R.emit('land', { rating, n: this.cups.length });
    h.state = 'wait'; h.spawn = rel + 0.42;
    if (this.cups.length >= C.goal) this.end(R, rel, true);
    else if (this.lives <= 0) this.end(R, rel, false);
  },
  end(R, rel, won) {
    this.state = won ? 'won' : 'lost';
    const bar = this.bar, spb = R.spb;
    const outro = won
      ? R.melody('G5:0.5 B5:0.5 D6:0.5 G6:1.5', 0, 'flute', 0.09).concat([{ t: 0, kind: 'pluck', f: noteFreq('G2'), dur: 1.6, vol: 0.24 }], ['G5', 'B5', 'D6', 'G6', 'B6'].map((n, i) => ({ t: spb * 1.5 + i * 0.06, kind: 'bell', f: noteFreq(n), dur: 1.8, vol: 0.06 })))
      : R.melody('D6:0.5 B5:0.5 A5:0.5 G5:1.5', 0, 'flute', 0.06).concat([{ t: 0, kind: 'pluck', f: noteFreq('E2'), dur: 1.4, vol: 0.18 }]);
    const barRel = R.endLoop(rel + 0.15, bar, outro);
    this.endAt = barRel + bar * 1.5;
    R.emit(won ? 'won' : 'lost', {});
  },
  update(R, rel) {
    const h = this.hand;
    if (h.state === 'fall' && rel >= h.t + 0.24) this.land(R, rel);
    if (h.state === 'wait' && rel >= h.spawn && this.state === 'play') { h.state = 'ready'; h.born = rel; }
    for (const f of this.fallers) { f.t = rel - (f.t0 === undefined ? (f.t0 = rel) : f.t0); }
    this.wob = Math.max(0, this.wob - 0.02);
    if (rel >= this.endAt) R.finish(this.result(), 1.2);
  },
  pointer(R, type, x, y, t) { if (type === 'down') this.drop(R, t); },
  key(R, code, t, down) { if (!down || !SWEET_CFG.tea.keys.includes(code)) return false; this.drop(R, t); return true; },
  /* test hook: each cup is set down when it is over the tower (perfect), a little late (good) or far off (miss) */
  auto(R, rel, plan) {
    const h = this.hand; if (h.state !== 'ready' || this.state !== 'play') return;
    const C = SWEET_CFG.tea, i = this.cups.length + this.stats.miss, period = R.spb * C.swingBeats;
    const kind = (plan.miss || []).includes(i) ? 'miss' : (plan.good || []).includes(i) ? 'good' : 'perfect';
    const off = kind === 'miss' ? period * 0.42 : kind === 'good' ? 0.1 : 0;
    if (h.autoAt === undefined || h.autoFor !== h.born) { h.autoFor = h.born; h.autoAt = Math.ceil((Math.max(0, rel) + 0.05) / period) * period + off; }
    if (rel >= h.autoAt) { this.drop(R, h.autoAt); h.autoAt = undefined; }
  },
  result() {
    const C = SWEET_CFG.tea, st = this.stats, n = this.cups.length;
    return {
      id: 'tea', pass: n >= C.goal, cups: n, goal: C.goal, perfect: st.perfect, good: st.good, miss: st.miss,
      stats: [['쌓은 찻잔', `${n} / ${C.goal}`], ['정확', String(st.perfect)], ['좋음 · 미끄러짐', `${st.good} · ${st.miss}`]],
      need: `찻잔 ${C.goal}개를 쌓으면 성공이에요 (${C.lives}번 미끄러지기 전에)`, more: Math.max(1, C.goal - n), unit: '찻잔',
    };
  },
  draw(R, g) {
    const W = R.W, H = R.H, rel = R.lastRel, C = SWEET_CFG.tea;
    R.panel(g, 'rgba(20,70,56,0.72)', 'rgba(8,34,28,0.9)');
    const cw = Math.min(W * 0.25, H * 0.2, 104), ch = cw * 0.5, cx = W / 2, baseY = H - Math.max(26, H * 0.07);
    const n = this.cups.length, want = Math.max(0, (n + 1) * ch - H * 0.46);
    this.scroll = damp(this.scroll, want, 4, 1 / 60);
    const yOf = (k) => baseY - k * ch + this.scroll;
    // header: cups and lives
    R.text(g, `찻잔 ${n} / ${C.goal}`, W / 2, 26, Math.min(20, W * 0.05), '#fff1d6');
    for (let i = 0; i < C.lives; i++) drawLeaf(g, W - 26 - i * 22, 26, 18, i < this.lives);
    const tip = this.state === 'won' ? '찻잔 탑 완성!' : this.state === 'lost' ? '탑이 흔들려요…' : rel < 0 ? '박자를 느껴 보세요' : DEVICE.touch ? '찻잔이 탑 위에 오면 톡!' : '찻잔이 탑 위에 오면 Space';
    R.text(g, tip, W / 2, 52, Math.min(15, W * 0.038), this.state === 'won' ? '#ffe08a' : '#e6fff4', { weight: 700 });
    // the lacquered tray and the tower
    g.save(); g.beginPath(); g.rect(4, 64, W - 8, H - 68); g.clip();
    const ty = yOf(0) + ch * 0.12;
    g.fillStyle = '#8f1d2c'; g.beginPath(); g.ellipse(cx, ty, cw * 0.95, ch * 0.3, 0, 0, TAU); g.fill();
    g.strokeStyle = '#e0b25c'; g.lineWidth = 2.5; g.stroke();
    const sway = Math.sin(rel * 12) * this.wob * 0.04;
    this.cups.forEach((c, k) => {
      const age = rel - c.t, drop = age < 0.12 ? (1 - age / 0.12) * 6 : 0;
      drawCup(g, cx + c.x * cw + sway * k * cw * 0.25, yOf(k) - drop, cw, sway * 0.4 * (k / Math.max(1, n)));
      if (age < 0.5 && c.rating === 'perfect') glowDot(g, cx + c.x * cw, yOf(k) - ch * 0.6, cw * 0.7, '255,236,170', 0.6 * (1 - age / 0.5));
    });
    // the guide: a faint line above the top cup
    const topX = cx + this.topX() * cw, topY = yOf(n);
    g.setLineDash([3, 6]); g.strokeStyle = 'rgba(230,255,240,0.3)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(topX, topY - ch * 0.2); g.lineTo(topX, topY - ch * 2.4); g.stroke(); g.setLineDash([]);
    // the cup in the air (swinging), or falling
    const h = this.hand, hoverY = topY - ch * 2.0;
    if (h.state === 'ready' && this.state === 'play') {
      const x = this.swing(R, Math.max(0, rel)), pop = h.born !== undefined && rel - h.born < 0.2 ? Ease.outBack((rel - h.born) / 0.2) : 1;
      const A = this.amp();
      g.strokeStyle = 'rgba(255,240,200,0.16)'; g.lineWidth = 1; g.beginPath(); g.moveTo(topX - A * cw, hoverY - ch * 0.4); g.quadraticCurveTo(topX, hoverY - ch * 0.1, topX + A * cw, hoverY - ch * 0.4); g.stroke();
      const over = Math.abs(x - this.topX()) <= C.perfect;
      if (over) glowDot(g, cx + x * cw, hoverY - ch * 0.5, cw * 0.75, '255,236,170', 0.45);
      drawCup(g, cx + x * cw, hoverY, cw * Math.max(0.05, pop), Math.cos((Math.PI * rel) / (R.spb * C.swingBeats)) * 0.12);
    } else if (h.state === 'fall') {
      const k = clamp((rel - h.t) / 0.24, 0, 1), y = lerp(hoverY, topY, k * k);
      drawCup(g, cx + h.x * cw, y, cw);
    }
    for (const f of this.fallers) {
      const t = f.t || 0, x = cx + (f.x + f.vx * t) * cw, y = yOf(f.y) - (f.vy * t - 4.5 * t * t) * ch * 2;
      if (t < 1.4) drawCup(g, x, y, cw, f.vr * t, Math.max(0, 1 - t / 1.4));
    }
    g.restore();
    const lb = this.label;
    if (lb && rel - lb.born >= 0 && rel - lb.born < 0.8) {
      const age = rel - lb.born, k = 1 + 0.25 * Math.max(0, 1 - age / 0.12);
      g.save(); g.translate(cx + this.topX() * cw, topY - ch * 3.0 - age * 16); g.scale(k, k);
      R.text(g, lb.text, 0, 0, Math.min(22, W * 0.055), lb.rating === 'perfect' ? '#ffe9a8' : lb.rating === 'good' ? '#d6fff0' : '#f2b8c6', { alpha: 1 - clamp((age - 0.5) / 0.3, 0, 1) });
      g.restore();
    }
  },
};
const REHEARSAL_GAMES = { choco: ChocoGame, coffee: CoffeeGame, tea: TeaGame };
