// Chapter map: every chapter can be entered from a fresh save (saved progress is kept, it just no longer locks the map),
// chapter V (the dream gala) can be played from it, the whole list fits a phone screen without scrolling, and the chapter pictures
// fill their frame on a phone (the renderer may be narrower than the picture).
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'map', mobile: true });   // 390 × 844, pixel ratio 1, fresh saved data
  const { ev, shot, page } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };
  const openMap = async () => { await ev(() => document.getElementById('btnChapters').click()); await page.waitForTimeout(900); };
  const pick = (i) => ev((i) => { document.querySelectorAll('#screenMap .toc-item')[i].click(); }, i);
  const rows = () => ev(() => [...document.querySelectorAll('#screenMap .toc-item')].map((b) => ({
    locked: b.classList.contains('locked'), state: b.querySelector('.toc-state').textContent.trim(), bottom: Math.round(b.getBoundingClientRect().bottom),
  })));
  const detail = () => ev(() => ({
    title: document.getElementById('mapTitle').textContent, btn: document.getElementById('btnPlayChapter').textContent,
    veil: !document.getElementById('mapLock').hidden, lock: document.getElementById('mapLockText').textContent,
  }));

  await openMap();
  const fresh = await ev(() => window.__nut.Save.data.unlocked);
  const list = await rows();
  ok('fresh save: all five chapter rows are open, and the saved progress is untouched', list.length === 5 && list.every((r) => !r.locked) && fresh === 1, { rows: list.map((r) => r.state), saved: fresh });
  ok('the whole list fits the 390 × 844 screen without scrolling', list[4].bottom <= 844 - 8, { lastRowBottom: list[4].bottom });

  await pick(3);
  const d4 = await detail();
  ok('chapter IV can be played straight away (no need to finish chapter III)', d4.title === '과자의 왕국' && !d4.veil && d4.btn === '이야기 펼치기', d4);
  await shot('map-ch4');

  await pick(4);
  const d5 = await detail();
  ok('chapter V can be played from the map straight away: the dream gala', d5.title === '설탕 요정의 궁전' && !d5.veil && d5.btn === '이야기 펼치기' && (await rows())[4].state === '꿈의 대공연', d5);

  await pick(0);
  await page.waitForTimeout(300);
  const pic = await page.evaluate(async () => {
    const im = new Image(); im.src = document.getElementById('mapImg').src; await im.decode();
    const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    const c = cv.getContext('2d'); c.drawImage(im, 0, 0);
    const x0 = Math.floor(cv.width * 0.75), d = c.getImageData(x0, 0, cv.width - x0, cv.height).data;
    let dark = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 16 && d[i + 1] < 16 && d[i + 2] < 16) dark++;
    return { w: im.naturalWidth, h: im.naturalHeight, darkShareRightQuarter: +(dark / (d.length / 4)).toFixed(3) };
  });
  ok('the chapter I picture fills its frame on a phone (no black strip on the right)', pic.darkShareRightQuarter < 0.1, pic);
  await shot('map-ch1-phone');

  /* chapter IV really starts from the map with the saved progress still at 1 */
  await pick(3);
  await ev(() => { window.__nut.DEBUG.timeScale = 4; document.getElementById('btnPlayChapter').click(); });
  let started = false;
  for (let t = 0; t < 120 && !started; t++) { await page.waitForTimeout(1000); started = await ev(() => window.__nut.G.chapter === 4 && window.__nut.G.mode === 'cutscene'); }
  ok('chapter IV starts from the map on a fresh save', started, { chapter: await ev(() => window.__nut.G.chapter), mode: await ev(() => window.__nut.G.mode) });

  /* …and so does chapter V, with the stage built the first time it opens */
  await ev(() => { window.__nut.Story.toTitle(); });
  await openMap(); await pick(4);
  await ev(() => { document.getElementById('btnPlayChapter').click(); });
  let gala = false;
  for (let t = 0; t < 180 && !gala; t++) { await page.waitForTimeout(1000); gala = await ev(() => window.__nut.G.chapter === 5 && window.__nut.Recital.running && window.__nut.G.phase === 'show'); }
  ok('chapter V starts from the map on a fresh save and act I is running', gala, { chapter: await ev(() => window.__nut.G.chapter), phase: await ev(() => window.__nut.G.phase) });
  await shot('map-ch5-started');

  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
