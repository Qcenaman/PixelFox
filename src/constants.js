(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.PF = root.PF || {}; Object.assign(root.PF, factory()); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return {
    T: 16, W: 256, H: 240, SOLID: '#B?MUP=', LEVEL_TIME: 300,
    PHYS: { ACC: 0.1, ACC_RUN: 0.13, MAX_WALK: 1.4, MAX_RUN: 2.4, FRICTION: 0.08, SKID: 0.22, JUMP_V: -6.6, GRAV: 0.38, GRAV_CUT: 0.95, MAX_FALL: 7, WALK_SPD: 0.5, SLIDE_SPD: 3.5, STOMP_BOUNCE: -3.8, STOMP_BOUNCE_HELD: -5.5 },
    PALETTE: { k: '#1a1c2c', w: '#f4f4f4', r: '#d8282f', R: '#8c1d2b', o: '#ef7d2d', O: '#b34a1a', y: '#ffd23f', Y: '#c78f12', g: '#38b64a', G: '#1f7a3a', b: '#4aa8ff', B: '#2a58c8', n: '#8a5a2e', N: '#5a3418', s: '#f2c9a0', p: '#c04fd6', P: '#7a2b9a', e: '#9aa0ae', E: '#5d6272', c: '#ffe9b0' }
  };
});
