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

/* ---------- the snowflakes' waltz: the corps de ballet before the gate opens ---------- */
const SNOW_DANCE = {
  corps: 12,            // dancers in the corps de ballet (all drawn together: one draw call per body part)
  corpsLite: 8,         // on the "부드럽게" quality setting or a low-memory phone
  stage: { back: 8.5, radius: 5.4 },   // centre of the clearing, metres in front of the gate · radius the formations use
  sections: [20, 12, 13, 19],          // bars of each part: theme · variation · hush · finale (64 bars)
  builtinBpm: 172,      // quarter-note tempo of the built-in performance (≈ 1.05 s a bar, like the recording below)
  tailSec: 3.6,         // the last chord rings this long after the final bar
  /* Optional: a recording the player keeps on their own device. It is picked in the pause menu and stored only in
     that browser; it is never part of the game files. The map below was measured on one recording of
     Tchaikovsky's "Waltz of the Snowflakes" (6:35, 6,380,697 bytes); a different file is not used, because the
     dancers would fall off the beat. */
  local: {
    sizeBytes: 6380697, sizeTolerance: 0.01,
    start: 325.567,     // the excerpt: the E major section after the last hush, to the final chord
    end: 395.3,
    // beat times from the start of the excerpt, every 3rd one is a bar line (64 bars)
    beats: [0,0.348,0.708,1.068,1.428,1.776,2.125,2.473,2.81,3.158,3.506,3.855,4.203,4.54,4.876,5.224,5.561,5.898,6.246,6.594,6.943,7.291,7.639,7.976,8.313,8.649,9.009,9.369,9.729,10.089,10.437,10.786,11.134,11.494,11.842,12.202,12.562,12.922,13.259,13.595,13.932,14.28,14.629,14.977,15.325,15.673,16.033,16.382,16.73,17.067,17.403,17.752,18.112,18.46,18.808,19.133,19.493,19.841,20.19,20.55,20.91,21.258,21.606,21.954,22.303,22.639,22.988,23.324,23.661,23.998,24.346,24.694,25.043,25.379,25.728,26.088,26.436,26.784,27.156,27.504,27.852,28.224,28.584,28.932,29.292,29.652,30.012,30.36,30.697,31.033,31.393,31.753,32.102,32.438,32.775,33.112,33.46,33.808,34.168,34.505,34.853,35.19,35.538,35.886,36.235,36.571,36.92,37.256,37.593,37.965,38.313,38.661,39.01,39.346,39.695,40.031,40.368,40.705,41.053,41.413,41.761,42.109,42.469,42.829,43.189,43.549,43.897,44.257,44.64,45,45.349,45.708,46.057,46.417,46.765,47.113,47.473,47.821,48.17,48.518,48.855,49.191,49.528,49.876,50.213,50.561,50.91,51.246,51.583,51.92,52.257,52.593,52.93,53.278,53.626,53.986,54.335,54.683,55.02,55.356,55.693,56.041,56.378,56.715,57.051,57.4,57.748,58.096,58.445,58.793,59.153,59.513,59.873,60.244,60.616,60.952,61.289,61.614,61.962,62.322,62.682,63.054,63.414,63.785,64.18,64.54,64.877,65.213,65.562,65.898,66.235,66.572,66.897],
  },
};
