/* =====================================================================
   30 · CHAPTER V CONFIG — the Sugar Plum Palace: the dream gala on a glass stage in the night sky
   Every number worth tuning lives in this one file (edit it, then run `npm run build`).
   The gala has three acts: I the Kingdom of Sweets (the three nations), II the Sugar Plum Fairy's solo, III the grand finale.
   ===================================================================== */
const PALACE_CFG = {
  bpm: 100,                          // one tempo for the whole gala: the acts change the metre and the colours, not the speed

  stage: {
    radius: 14,                      // the floating glass disc
    rings: [4.4, 8.6, 12.2],         // light rings on the floor (gold inlays under them on the floor texture)
    dais: 2.4,                       // the round step in the middle, for the soloists
    pillars: 12, pillarRing: 19,     // sugar-crystal pillars floating round the stage
  },

  /* the look of every act: the sky (zenith, middle, horizon), the aurora ribbons, the floor rings, the beams, the pillars */
  acts: [
    { id: 'sweets', title: '세 나라 축제',
      sky: ['#0d0620', '#4f1d5c', '#d9708a'], glow: ['#ff8a5c', '#2fb8ac'], aurora: ['#ffcf70', '#39d0c2', '#ff6f86'],
      ring: '#ffd98a', beam: '#ffe6b8', pillar: ['#ffcf8a', '#8ee6dc', '#ff9aa6'] },
    { id: 'sugar', title: '설탕 요정의 솔로',
      sky: ['#0a0317', '#3c165e', '#d27cb2'], glow: ['#ff6fbf', '#8e6bff'], aurora: ['#ff90d4', '#b08aff', '#ffe8f8'],
      ring: '#ffc4ec', beam: '#ffe0f4', pillar: ['#ffc2e6', '#d7b8ff', '#fff3fb'] },
    { id: 'finale', title: '대피날레',
      sky: ['#05040f', '#271868', '#d6a26a'], glow: ['#ff69b3', '#69bfff'], aurora: ['#ff86c4', '#86d4ff', '#ffe08a'],
      ring: '#fff1c4', beam: '#fff4dc', pillar: ['#ffd6f0', '#c8e6ff', '#fff0c0'] },
  ],

  /* ---------------- act I: the three nations of the Kingdom of Sweets ----------------
     Each nation has a troupe of sleeping dancers on the stage (the friends from chapter IV, with their companions), a pad
     (their own stage) and a leader who waits on it. The baton wakes the dancers it passes, they follow it in a line, and
     the line peels off at the right pad. */
  troupes: {
    order: ['choco', 'coffee', 'tea'],
    choco:  { name: '스페인',   who: '초콜릿', n: 10, lowN: 7, pad: [-6.6, -1.2], home: [-6.4, 5.4], color: '#ff4f66', glow: '#ff9aa8' },
    coffee: { name: '아라비아', who: '커피',   n: 10, lowN: 7, pad: [6.6, -1.2],  home: [6.4, 5.4],  color: '#1fb8aa', glow: '#7ff0e2' },
    tea:    { name: '중국',     who: '차',     n: 10, lowN: 7, pad: [0, 7.4],     home: [0, -6.6],   color: '#f0a52a', glow: '#ffe19a' },
    padR: 2.9,                       // a pad: its glowing disc
    ringR: 1.75,                     // the ring of dancers round their leader
    homeR: 3.4, spacing: 1.7, seed: 5,   // the sleeping dancers' scatter: radius round their home, least gap, random seed
  },
  steer: {
    speed: 13,                       // top speed of the baton over the floor (units per second)
    keySpeed: 9.5,                   // …and with the arrow keys or WASD
    wakeR: 1.9,                      // a sleeping dancer within this of the baton wakes and follows it
    gap: 0.95,                       // distance between the dancers in the line, along the baton's trail
    follow: 9,                       // how tightly a dancer keeps its place in the line (per second)
    padLead: 3.0,                    // the baton within this of a pad sends that nation's dancers in from the line
    arrive: 5.5,                     // speed of a dancer walking from the line to her place on the pad
    ringR2: 6.4, ringSpin: 0.07,     // act I's last section: the grand ring round the dais, and how fast it turns (turns per bar)
    playR: 1.6, playGap: 0.8,        // …where the baton is an instrument: it rings the dancer it passes (within playR), who can ring again after playGap seconds
  },
  /* act I timeline: five sections, in beats from the first beat */
  act1: {
    sections: [
      { id: 'intro',  beats: 32, meter: 4 },   // wake the dancers
      { id: 'choco',  beats: 33, meter: 3 },   // the Spanish dance
      { id: 'coffee', beats: 32, meter: 4 },   // the Arabian dance
      { id: 'tea',    beats: 32, meter: 2 },   // the Chinese dance
      { id: 'ring',   beats: 32, meter: 4 },   // all three together round the dais
    ],
    countIn: 3,
    stars: [0.6, 0.85],              // accuracy needed for two and three stars (one star always)
    keys: { up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'] },
  },
  /* ---------------- act II: the Sugar Plum Fairy's solo ----------------
     Every dancer circles the baton like a swarm of stars. Twelve spots on the glass, one under each crystal pillar, wake one by one
     with the music; the swarm held still over an awake spot charges it, and a charged spot lights its pillar, rings its note and
     brings another layer into the music. 22 bars of 4/4 (53 s): two to gather, seventeen to light the spots, three for the finale. */
  act2: {
    bars: { intro: 2, main: 17, finale: 3 },
    spots: { n: 12, ring: 10.4, r: 2.0, first: 2, every: 1 },   // the first spot wakes at bar 2, then one every bar
    charge: { time: 1.7, decay: 0.45, still: 3.5, movingK: 0.18 },   // seconds of stillness to light a spot; per-second loss when the swarm is away; speed counted as still; charge rate while moving
    swarm: { rings: [{ r: 1.6, w: 1.7, lag: 15 }, { r: 2.7, w: -1.25, lag: 9 }, { r: 3.8, w: 0.9, lag: 5.5 }], stretch: 0.3, join: 1.8 },
    layers: [3, 6, 9, 12],           // lit spots needed to bring in each added layer of the music
    stars: [0.6, 0.85],              // share of the spots lit for two and three stars
    notes: ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6', 'F#6', 'A6', 'B6', 'D7', 'E7'],   // the note each spot rings (D major pentatonic round the ring)
  },
  /* ---------------- act III: the grand finale ----------------
     The whole company, the Sugar Plum Fairy and the three leaders at its head, follows the baton in one long line. A big star lies
     on the glass in dots; leading the line along its outline lights the dots, and the more of the star is drawn the more of the
     music comes in. When it is drawn the company takes its places on the star, which turns slowly round the dais while Clara and the
     Prince dance their pas de deux under fireworks. 19 bars of 4/4 (46 s): two to gather, eleven to draw, six for the finale. */
  act3: {
    bars: { intro: 2, draw: 11, finale: 6 },
    star: { outer: 10, inner: 4.3, spacing: 0.5, tol: 1.6 },   // the star: radius of its five tips and of its five inner corners, the gap between dots, how near the baton must come to light a dot
    done: 0.95,                       // the share of the star that counts as drawn
    layers: [0.25, 0.5, 0.75, 0.95],  // the share of the star drawn for each layer of the music
    stars: [0.7, 0.92],
    form: { speed: 6, spin: 0.26 },   // the company walks to its places at this speed (units a second), and the star turns round the dais (radians a second)
  },
};

/* the star of act III: ten corners (a tip, an inner corner, a tip …) starting at the tip at the back of the stage and going clockwise as the audience sees it;
   at(s) is the point s units along its outline */
function palaceStarGeom() {
  const St = PALACE_CFG.act3.star, verts = [], cum = [0];
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? St.inner : St.outer; verts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  for (let k = 0; k < 10; k++) { const v = verts[k], w = verts[(k + 1) % 10]; cum.push(cum[k] + Math.hypot(w[0] - v[0], w[1] - v[1])); }
  const per = cum[10];
  const at = (s, out = [0, 0]) => {
    s = ((s % per) + per) % per; let k = 0; while (k < 9 && cum[k + 1] <= s) k++;
    const v = verts[k], w = verts[(k + 1) % 10], u = (s - cum[k]) / (cum[k + 1] - cum[k]); out[0] = v[0] + (w[0] - v[0]) * u; out[1] = v[1] + (w[1] - v[1]) * u; return out;
  };
  return { verts, cum, per, n: Math.round(per / St.spacing), at };
}
