// Shared Playwright harness for the headless checks in this folder.
// three.js is served from .work/three.min.js (copy three@0.159.0/build/three.min.js there).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.work', 'shots');
const THREE_PATH = path.join(ROOT, '.work', 'three.min.js');

async function open(opts = {}) {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mobile = opts.mobile;
  const ctx = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }
    : { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) logs.push('console.error: ' + m.text()); });
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.route('**/three.min.js', (r) => r.fulfill({ path: THREE_PATH, contentType: 'application/javascript' }));
  await page.route('https://fonts.googleapis.com/**', (r) => r.abort());
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForFunction(() => window.__nut && window.__nut.G.mode === 'title', null, { timeout: 180000 });
  const tag = opts.tag || 'x';
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const state = () => ev(() => { const n = window.__nut; return { mode: n.G.mode, ch: n.G.chapter, phase: n.G.phase, tier: n.TG.tier, found: Object.keys(n.TG.found).length, placed: Object.keys(n.TG.placed).length, locked: n.G.locked, dlg: n.UI.dlg.open, calls: n.renderer.info.render.calls, tris: n.renderer.info.render.triangles }; });
  const shot = async (name) => { await page.screenshot({ path: path.join(OUT, `${tag}-${name}.png`) }); console.log('shot', name, JSON.stringify(await state())); };
  const adv = () => ev(() => { const n = window.__nut; if (n.UI.dlg.open) { n.UI.advance(); n.UI.advance(); } });
  const until = async (cond, timeout = 240000, label = '', arg) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      await adv();
      if (await page.evaluate(cond, arg)) return true;
      await page.waitForTimeout(200);
    }
    console.log('TIMEOUT', label, JSON.stringify(await state()));
    return false;
  };
  const finish = async () => { console.log(logs.length ? logs.join('\n') : 'NO PAGE ERRORS'); await browser.close(); };
  return { browser, page, logs, ev, state, shot, adv, until, finish, OUT };
}
module.exports = { open, ROOT, OUT };
