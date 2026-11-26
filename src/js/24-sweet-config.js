/* =====================================================================
   24 · CHAPTER IV CONFIG — the Kingdom of Sweets: three dance rehearsals
   Every number worth tuning lives in this one file (edit it, then run `npm run build`).
   ===================================================================== */
const SWEET_CFG = {
  clock: {
    useOutputLatency: true, // judge against what the player hears (AudioContext.outputLatency, when the browser reports it)
    inputOffsetSec: 0,      // manual calibration: positive if taps feel late, negative if early
  },

  /* 스페인 춤 · 초콜릿 — the dancer plays a pattern of castanets (딱) and stamps (쿵); the player plays it back */
  choco: {
    bpm: 88, beatsPerBar: 3,    // a slow, easy waltz-time dance; patterns sit on the eighth-note grid (6 slots a bar)
    introBars: 1,               // guitar bars before the first pattern
    windows: { perfect: 0.11, good: 0.24 },    // seconds either side of a note
    /* The dancer plays a pattern, then the player plays it back; the dancer's pattern stays on screen the whole time.
       6 slots = 1 bar (played in one bar, answered in the next), 12 slots = 2 bars: C castanets · S stamp · . rest ('|' only for reading) */
    patterns: ['C.C.C.', 'S.C.C.', 'S.C.C.|S.C.C.', 'C.C.S.|C.C.S.', 'S.CCC.|S.C.S.', 'S.CCC.|S.CCS.'],
    forgive: 1,                 // slips forgiven in every pattern (a miss, a wrong pad or a stray tap)
    passRounds: 4,              // patterns played back before the rehearsal counts as done
    keys: { stomp: ['KeyA', 'KeyF', 'ArrowLeft'], cast: ['KeyD', 'KeyJ', 'ArrowRight'] },
  },

  /* 아라비아 춤 · 커피 — a glowing bead glides along the silk; the player keeps a finger (or the mouse) on it */
  coffee: {
    bpm: 80, beatsPerBar: 4,
    introBars: 1, phraseBars: 3, restBars: 1,   // each shape takes three bars, with a bar to breathe between shapes
    shapes: ['wave', 'eight', 'loops'],
    radius: 0.1,                // "on the bead": this share of the drawing area (the shorter side)
    nearK: 1.8,                 // within radius × nearK still counts half
    passPct: 60,                // average share of time on the bead, over all shapes
    keySpeed: 0.62,             // arrow keys move a cursor this far (share of the area) per second
  },

  /* 중국 춤 · 차 — a teacup swings over the tower in time with the music; tap to set it down */
  tea: {
    bpm: 112, beatsPerBar: 2,
    goal: 8,                    // cups in the finished tower
    lives: 3,                   // cups that may slip off before the tower has to be built again
    swingBeats: 2,              // the cup passes over the tower every second beat
    amp: [1.2, 1.6],            // swing width in cup widths, from the first cup to the last
    perfect: 0.2, good: 0.56,   // how far off the cup below (in cup widths) still counts as 정확 / 좋음
    keys: ['Space', 'Enter', 'ArrowDown', 'KeyS'],
  },
};
