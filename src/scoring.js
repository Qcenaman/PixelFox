(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.PF = root.PF || {}; Object.assign(root.PF, factory()); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function addScore(stats, n) { stats.score += n; }
  function addCoin(stats) {
    stats.coins += 1; stats.score += 200;
    if (stats.coins >= 100) { stats.coins -= 100; stats.lives += 1; return true; }
    return false;
  }
  return { addScore: addScore, addCoin: addCoin };
});
