(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.PF = root.PF || {}; Object.assign(root.PF, factory()); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // One character per tile. Rows are 15 tall; short rows are padded (with # if they end in #).
  // . air  # ground  B brick  ? coin block  M berry block  U used block  P pipe  = platform
  // o coin  @ start  g walker  k shell enemy  F goal flag
  // Each row is written as 8-column groups: cols 0-7, 8-15, ... 56-63.
  const g = function () { return Array.prototype.join.call(arguments, ''); };
  const E = '.';
  const LEVELS = [
    { name: '1-1', rows: [
      E, E, E, E, E, E, E, E, E,
      g('........', '..?.BMB?', '........', '........', '........', '....?M?.', '........', '........'),
      g('........', '........', '........', '........', '.ooo....', '........', '..oo....', '........'),
      g('........', '........', '........', 'PP......', '........', 'PP......', '.====...', '........'),
      g('..@.o.o.', '........', '....g...', 'PP....g.', '........', 'PP..k...', '........', '....F...'),
      g('########', '########', '########', '########', '#...####', '########', '##...###', '########'),
      g('########', '########', '########', '########', '#...####', '########', '##...###', '########')
    ] },
    { name: '1-2', rows: [
      E, E, E, E, E, E, E, E, E,
      g('........', '.?.BMB..', '........', '........', '........', '........', '........', '........'),
      g('........', '........', '........', '........', '........', '........', 'oo......', '........'),
      g('........', '........', '..PP....', '........', '........', '..PP..==', '==......', '........'),
      g('..@.o.o.', '....g...', '..PP..k.', '........', '....g.g.', '..PP....', '...g....', '....F...'),
      g('########', '########', '########', '###....#', '########', '######..', '..######', '..######'),
      g('########', '########', '########', '###....#', '########', '######..', '..######', '..######')
    ] }
  ];
  return { LEVELS: LEVELS };
});
