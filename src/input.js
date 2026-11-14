(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.PF = root.PF || {}; Object.assign(root.PF, factory()); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const BLOCK = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter'];
  class Input {
    constructor() {
      this.keys = {}; this.touch = {}; this.onFirst = null; this.onMute = null;
      window.addEventListener('keydown', (e) => {
        if (this.onFirst) this.onFirst();
        if (BLOCK.indexOf(e.code) >= 0) e.preventDefault();
        this.keys[e.code] = true;
        if (e.code === 'KeyM' && !e.repeat && this.onMute) this.onMute();
      });
      window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
      window.addEventListener('blur', () => { this.keys = {}; });
      document.querySelectorAll('[data-btn]').forEach((el) => {
        const b = el.dataset.btn;
        const on = (e) => { e.preventDefault(); this.touch[b] = true; el.classList.add('on'); if (this.onFirst) this.onFirst(); };
        const off = (e) => { e.preventDefault(); this.touch[b] = false; el.classList.remove('on'); };
        el.addEventListener('pointerdown', on);
        ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => el.addEventListener(n, off));
        el.addEventListener('contextmenu', (e) => e.preventDefault());
      });
    }
    any(codes) { return codes.some((c) => this.keys[c]); }
    read() {
      const s = {
        left: this.any(['ArrowLeft', 'KeyA']) || !!this.touch.left,
        right: this.any(['ArrowRight', 'KeyD']) || !!this.touch.right,
        jump: this.any(['Space', 'KeyZ', 'ArrowUp', 'KeyW']) || !!this.touch.jump,
        run: this.any(['ShiftLeft', 'ShiftRight', 'KeyX']) || !!this.touch.run,
        start: this.any(['Enter', 'KeyP']) || !!this.touch.start
      };
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const g of pads) {
        if (!g || !g.connected) continue;
        const b = (i) => !!(g.buttons[i] && g.buttons[i].pressed), ax = g.axes[0] || 0;
        s.left = s.left || ax < -0.4 || b(14);
        s.right = s.right || ax > 0.4 || b(15);
        s.jump = s.jump || b(0) || b(3);
        s.run = s.run || b(1) || b(2);
        s.start = s.start || b(9);
      }
      return s;
    }
  }
  return { Input: Input };
});
