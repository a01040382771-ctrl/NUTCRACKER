/* =====================================================================
   17 · CHAPTER III CONFIG — every number worth tuning lives in this one file
   (edit it, then run `npm run build`)
   ===================================================================== */
const SNOW_CFG = {
  /* music: leave `url` empty to play the built-in temporary waltz track */
  audio: {
    url: '',          // e.g. 'assets/waltz-of-the-snowflakes.mp3' (hosted next to index.html, or any CORS-enabled URL)
    bpm: 144,         // quarter-note beats per minute of the chart; for a real recording, set the recording's tempo
    firstBeatSec: 0,  // where the first beat of bar 1 sits inside the recording, in seconds (ignored by the built-in track)
    volume: 0.9,
  },
  lanes: 3,           // vertical lanes: 3 or 4
  fallSec: 1.7,       // note speed: seconds a snowflake takes to fall from the top to the hit circle
  windows: {          // judgement windows around the beat, in seconds
    perfect: 0.07,    // 정확: within this distance of the beat
    good: 0.14,       // 좋음: within this distance; anything later is 놓침
  },
  minGapSec: 0.3,     // the chart drops notes that would follow the previous one more closely than this
  countInBeats: 3,    // beats of "3 · 2 · 1" before the first snowflake
  tailSec: 1.4,       // quiet time after the last note before the finale starts
  clock: {
    useOutputLatency: true, // judge against what the player hears (AudioContext.outputLatency, when the browser reports it)
    inputOffsetSec: 0,      // manual calibration: positive if taps feel late, negative if early
  },
  keys: {             // keyboard lanes (KeyboardEvent.code, so any input method or keyboard layout works)
    3: [['KeyA', 'ArrowLeft'], ['KeyS', 'ArrowDown'], ['KeyD', 'ArrowRight']],
    4: [['KeyA', 'ArrowLeft'], ['KeyS', 'ArrowDown'], ['KeyK', 'ArrowUp'], ['KeyL', 'ArrowRight']],
  },
};
