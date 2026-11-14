(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.PF = root.PF || {}; Object.assign(root.PF, factory()); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const KNOWN = '.#B?MUP=o@gkF';
  function parseLevel(rows, name) {
    let width = 0;
    rows.forEach(function (r) { width = Math.max(width, r.length); });
    const tiles = [], enemies = [];
    let player = null, flag = null;
    rows.forEach(function (r, y) {
      const pad = r.length && r[r.length - 1] === '#' ? '#' : '.';
      const row = [];
      for (let x = 0; x < width; x++) {
        let c = x < r.length ? r[x] : pad;
        if (KNOWN.indexOf(c) < 0) throw new Error('Unknown tile ' + c + ' in level ' + name + ' at ' + x + ',' + y);
        if (c === '@') { player = { col: x, row: y }; c = '.'; }
        else if (c === 'g' || c === 'k') { enemies.push({ type: c === 'g' ? 'walker' : 'shell', col: x, row: y }); c = '.'; }
        else if (c === 'F') { flag = { col: x, row: y }; c = '.'; }
        row.push(c);
      }
      tiles.push(row);
    });
    if (!player) throw new Error('Level ' + name + ' has no player start (@)');
    if (!flag) throw new Error('Level ' + name + ' has no flag (F)');
    return { name: name, width: width, height: rows.length, tiles: tiles, enemies: enemies, player: player, flag: flag };
  }
  return { parseLevel: parseLevel, KNOWN: KNOWN };
});
