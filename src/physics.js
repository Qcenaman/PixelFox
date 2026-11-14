(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require);
  else { root.PF = root.PF || {}; Object.assign(root.PF, factory(function () { return root.PF; })); }
})(typeof self !== 'undefined' ? self : this, function (require) {
  'use strict';
  const C = require('./constants.js');
  const T = C.T, EPS = 1e-6;
  function makeSolidAt(tiles, cols, rows) {
    return function (tx, ty) {
      if (tx < 0 || tx >= cols) return true;
      if (ty < 0 || ty >= rows) return false;
      return C.SOLID.indexOf(tiles[ty][tx]) >= 0;
    };
  }
  function moveBody(b, solidAt) {
    const res = { hitX: 0, hitY: 0, bumpTx: -1, bumpTy: -1 };
    b.x += b.vx;
    if (b.vx !== 0) {
      const d = b.vx > 0 ? 1 : -1;
      const tx = Math.floor((d > 0 ? b.x + b.w - EPS : b.x) / T);
      const y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - EPS) / T);
      for (let ty = y0; ty <= y1; ty++) {
        if (solidAt(tx, ty)) { b.x = d > 0 ? tx * T - b.w : (tx + 1) * T; b.vx = 0; res.hitX = d; break; }
      }
    }
    b.y += b.vy;
    if (b.vy !== 0) {
      const d = b.vy > 0 ? 1 : -1;
      const ty = Math.floor((d > 0 ? b.y + b.h - EPS : b.y) / T);
      const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - EPS) / T);
      const cx = b.x + b.w / 2;
      let hit = -1, best = 1e9;
      for (let tx = x0; tx <= x1; tx++) {
        if (solidAt(tx, ty)) { const dist = Math.abs(tx * T + T / 2 - cx); if (dist < best) { best = dist; hit = tx; } }
      }
      if (hit >= 0) { b.y = d > 0 ? ty * T - b.h : (ty + 1) * T; b.vy = 0; res.hitY = d; res.bumpTx = hit; res.bumpTy = ty; }
    }
    return res;
  }
  function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function isStomp(p, e) { return p.vy > 0 && p.y + p.h - p.vy <= e.y + 6; }
  return { makeSolidAt: makeSolidAt, moveBody: moveBody, overlap: overlap, isStomp: isStomp };
});
