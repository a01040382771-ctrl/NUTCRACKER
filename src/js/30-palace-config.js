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
};
