// The Nutcracker's painted face lives on the FRONT of his head only; behind it he has white hair.
// (Regression: the box-shaped head used to pinch the face texture into a small second face — eyes, brows, cheeks — on the back.
//  And a plain skin-coloured back would look bald: his hair line, his white side puffs and his wig say the back is white.)
// 1. the head mesh: two materials; front half = straight face projection, back half = a hair strip that runs once round the back
// 2. the textures: the hair strip has no face on it, is white behind the temples, and its end columns match the face texture's edge
// 3. the pictures: from behind there is nothing red or dark in the middle of the head and it is whiter than skin;
//    from the front the cheeks are still there
const { open } = require('./harness.cjs');
(async () => {
  const h = await open({ tag: 'nb' });
  const { ev } = h;
  let fails = 0;
  const ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? 'PASS' : 'FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); };

  /* 1. geometry: which material and which UVs does each half of the head carry? */
  const g = await ev(() => {
    const n = window.__nut, mesh = n.nut.head.children.find((o) => o.isMesh && Array.isArray(o.material));
    if (!mesh) return { noMesh: true };
    const geo = mesh.geometry, P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv, I = geo.index.array;
    const pu = (x) => 0.5 + (x / 0.18) * 0.46, pv = (y) => 0.5 + (y / 0.21) * 0.46;   // the straight projection the front half must keep
    const r = { mats: mesh.material.length, groups: geo.groups.map((q) => [q.materialIndex, q.start, q.count]), tris: I.length / 3, front: 0, back: 0, frontOff: 0, vOff: 0, wrongGroup: 0, badNormal: 0, seamSplit: 0, backU: [1, 0], flat: [] };
    const seen = new Map();
    for (let t = 0; t < I.length; t += 3) {
      const back = (P.getZ(I[t]) + P.getZ(I[t + 1]) + P.getZ(I[t + 2])) / 3 < 0;
      if (back) r.back++; else r.front++;
      const gi = geo.groups.findIndex((q) => t >= q.start && t < q.start + q.count);   // the triangle's own material
      if (gi < 0 || geo.groups[gi].materialIndex !== (back ? 1 : 0)) r.wrongGroup++;
      for (let k = 0; k < 3; k++) {
        const i = I[t + k], x = P.getX(i), y = P.getY(i), z = P.getZ(i), u = U.getX(i), v = U.getY(i);
        if (Math.abs(v - pv(y)) > 1e-4) r.vOff++;                     // both halves keep the projection's height: the hair line runs round the head
        if (back) { r.backU[0] = Math.min(r.backU[0], u); r.backU[1] = Math.max(r.backU[1], u); if (z < -0.1699) r.flat.push([x, u]); }
        else if (Math.abs(u - pu(x)) > 1e-4) r.frontOff++;
        const nl = Math.hypot(N.getX(i), N.getY(i), N.getZ(i));
        if (Math.abs(nl - 1) > 1e-3) r.badNormal++;
        const key = [x, y, z].map((c) => Math.round(c * 1e4)).join(',');   // the cut duplicates vertices: both copies must shade the same
        const e = seen.get(key);
        if (!e) seen.set(key, [N.getX(i), N.getY(i), N.getZ(i)]);
        else if (Math.abs(e[0] - N.getX(i)) + Math.abs(e[1] - N.getY(i)) + Math.abs(e[2] - N.getZ(i)) > 1e-3) r.seamSplit++;
      }
    }
    r.flat.sort((a, b) => a[0] - b[0]);
    r.flatMonotone = r.flat.length > 4 && r.flat.every((p, i, a) => !i || p[1] <= a[i - 1][1] + 1e-6);   // along the flat back, u only ever falls as x rises
    r.flatN = r.flat.length; delete r.flat;
    r.maps = mesh.material.map((m) => !!m.map);
    return r;
  });
  ok('head: one mesh, two materials (face, hair), two triangle groups', !g.noMesh && g.mats === 2 && g.maps.every(Boolean) && g.groups.length === 2 && g.groups[0][1] === 0 && g.groups[0][1] + g.groups[0][2] === g.groups[1][1] && g.groups[1][1] + g.groups[1][2] === g.tris * 3, g.groups);
  ok('head: cut into a front and a back half, no triangle lost', g.front > 0 && g.back > 0 && g.front + g.back === g.tris && g.tris === 972, { tris: g.tris, front: g.front, back: g.back });
  ok('head: front triangles wear the face, back triangles the hair', g.wrongGroup === 0, { wrong: g.wrongGroup });
  ok('head: the front half keeps the straight face projection', g.frontOff === 0, { off: g.frontOff });
  ok('head: the hair strip runs once round the back, from one side (u = 0) to the other (u = 1)', g.backU[0] < 0.02 && g.backU[1] > 0.98 && g.flatMonotone, { u: g.backU.map((v) => +v.toFixed(3)), flatVerts: g.flatN, monotone: g.flatMonotone });
  ok('head: both halves keep the projection\'s height (the hair line carries on round the back)', g.vOff === 0, { off: g.vOff });
  ok('head: normals are unit length and the cut leaves no crease', g.badNormal === 0 && g.seamSplit === 0, { badNormal: g.badNormal, seamSplit: g.seamSplit });

  /* 2. the hair texture: no face on it, white behind the temples, skin at the ends where it meets the face texture */
  const t = await ev(() => {
    const n = window.__nut, mesh = n.nut.head.children.find((o) => o.isMesh && Array.isArray(o.material));
    const fi = mesh.material[0].map.image, hi = mesh.material[1].map.image;
    const fc = fi.getContext('2d'), hc = hi.getContext('2d'), FW = fi.width, FH = fi.height, HW = hi.width, HH = hi.height;
    const hd = hc.getImageData(0, 0, HW, HH).data, px = (d, W, x, y) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
    let busy = 0;
    for (let i = 0; i < HW * HH; i++) { const R = hd[i * 4], G = hd[i * 4 + 1], B = hd[i * 4 + 2], lum = 0.2126 * R + 0.7152 * G + 0.0722 * B; if (!(lum > 190 && R - G < 60)) busy++; }   // skin, hair, strands pass; cheeks, eyes, brows would not
    const row = (v, H) => Math.min(H - 1, Math.max(0, Math.floor((1 - v) * H)));
    const fd = fc.getImageData(0, 0, FW, FH).data;
    const rowsV = [0.97, 0.93, 0.9, 0.84, 0.78, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.05];   // none within 0.01 of the hair line at v = 0.863
    let seam = 0;
    for (const v of rowsV) {
      const a = px(hd, HW, 0, row(v, HH)), b = px(fd, FW, Math.floor(0.96 * FW), row(v, FH));          // right-hand seam: hair u = 0 ↔ face u = 0.96
      const c2 = px(hd, HW, HW - 1, row(v, HH)), d2 = px(fd, FW, Math.floor(0.04 * FW), row(v, FH));    // left-hand seam:  hair u = 1 ↔ face u = 0.04
      for (let k = 0; k < 3; k++) seam = Math.max(seam, Math.abs(a[k] - b[k]), Math.abs(c2[k] - d2[k]));
    }
    let centre = 0;                                                                    // straight behind (u = 0.5): white from crown to nape
    for (let y = 0; y < HH; y++) { const [R, G, B] = px(hd, HW, HW >> 1, y); if (!(R >= 200 && G >= 200 && B >= 190 && R - B <= 30)) centre++; }
    const temple = px(hd, HW, Math.round(HW * 0.05), row(0.5, HH)), behind = px(hd, HW, Math.round(HW * 0.25), row(0.5, HH));
    const ch = fc.getImageData(Math.round(FW * 0.27), Math.round(FH * 0.62), 1, 1).data;   // the left cheek on the face texture
    return { w: HW, h: HH, busy, seam, centre, temple, behind, cheek: [ch[0], ch[1], ch[2]] };
  });
  ok('hair texture: no cheeks, eyes or brows anywhere on it', t.busy === 0, { busyPixels: t.busy, of: t.w * t.h });
  ok('hair texture: white from the crown to the nape straight behind the head', t.centre === 0, { rowsNotWhite: t.centre });
  ok('hair texture: skin at the temple, white hair behind it', t.temple[0] - t.temple[2] >= 45 && t.behind[0] - t.behind[2] <= 25, { temple: t.temple, behind: t.behind });
  ok('hair texture: its two end columns match the face texture\'s edge columns (the seam does not show)', t.seam <= 12, { worstChannelDiff: t.seam });
  ok('face texture: the painted cheek is there (so the checks above mean something)', t.cheek[0] - t.cheek[1] > 100, t.cheek);

  /* 3. pictures: render from a few sides and look at the middle of the head (life size) */
  const look = (deg) => ev((deg) => {
    const n = window.__nut, T = n.camera.position.constructor, cam = n.camera, scale = 0.95, dist = 1.05;
    n.G.mode = 'cutscene'; n.comp.mode = 'off'; n.clara.root.visible = false;
    n.nut.root.visible = true; n.nut.root.scale.setScalar(scale); n.nut.root.position.set(0, 0, 2); n.nut.root.rotation.set(0, 0, 0);
    const a = (deg * Math.PI) / 180, hy = (0.66 + 0.64 + 0.24) * scale;
    cam.position.set(Math.sin(a) * dist, hy + 0.05, 2 + Math.cos(a) * dist); cam.lookAt(0, hy, 2); cam.updateMatrixWorld(true);
    n.renderer.render(n.scene, cam);                                     // render and read in the same task, while the buffer is still ours
    const gl = n.renderer.getContext(), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    const c = new T(0, hy, 2), right = new T().setFromMatrixColumn(cam.matrixWorld, 0), up = new T().setFromMatrixColumn(cam.matrixWorld, 1);
    const px = (p) => { const q = p.clone().project(cam); return [(q.x * 0.5 + 0.5) * W, (q.y * 0.5 + 0.5) * H]; };
    const lo = px(c.clone().addScaledVector(right, -0.09 * scale).addScaledVector(up, -0.12 * scale));
    const hi = px(c.clone().addScaledVector(right, 0.09 * scale).addScaledVector(up, 0.12 * scale));
    const x0 = Math.floor(Math.min(lo[0], hi[0])), y0 = Math.floor(Math.min(lo[1], hi[1])), w = Math.ceil(Math.abs(hi[0] - lo[0])), hh = Math.ceil(Math.abs(hi[1] - lo[1]));
    const buf = new Uint8Array(w * hh * 4); gl.readPixels(x0, y0, w, hh, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    let red = 0, dark = 0, lit = 0, warm = 0;
    for (let i = 0; i < buf.length; i += 4) {
      const R = buf[i], G = buf[i + 1], B = buf[i + 2];
      if (R > 150 && R - G > 90) red++;                 // painted cheeks
      if (R < 100 && G < 100 && B < 100) dark++;        // eyes, brows
      if (R > 140) lit++;
      warm += R - B;                                    // skin is warm (red well above blue), white hair is not
    }
    return { px: w * hh, red, dark, lit, warm: +(warm / (w * hh)).toFixed(1) };
  }, deg);
  const front = await look(0);
  ok('picture from the front: the painted cheeks and eyes are still there', front.red > 150 && front.dark > 100, front);
  for (const deg of [180, 150, -150]) {
    const back = await look(deg);
    ok(`picture from behind (${deg}°): white hair, no cheeks, no eyes or brows in the middle of the head`, back.px > 5000 && back.lit > back.px * 0.9 && back.red <= 3 && back.dark <= 3 && back.warm < 32, back);
  }

  console.log(fails ? `FAILED ${fails}` : 'ALL PASSED');
  await h.finish();
  process.exit(fails ? 1 : 0);
})();
