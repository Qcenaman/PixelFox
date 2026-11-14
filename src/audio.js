(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.PF = root.PF || {}; Object.assign(root.PF, factory()); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const SFX = {
    jump: [[330, 0, 0.14, 'square', 700]],
    coin: [[988, 0, 0.07], [1319, 0.07, 0.25]],
    stomp: [[300, 0, 0.12, 'square', 80]],
    kick: [[200, 0, 0.09, 'square', 520]],
    sprout: [[220, 0, 0.3, 'triangle', 880]],
    powerup: [[523, 0, 0.09], [659, 0.07, 0.09], [784, 0.14, 0.09], [1047, 0.21, 0.09], [1319, 0.28, 0.2]],
    break: [[150, 0, 0.18, 'sawtooth', 40]],
    bump: [[120, 0, 0.08, 'square', 80]],
    shrink: [[600, 0, 0.3, 'square', 150]],
    death: [[494, 0, 0.15], [392, 0.15, 0.15], [330, 0.3, 0.15], [262, 0.45, 0.45, 'square', 90]],
    clear: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.1], [784, 0.4, 0.1], [1047, 0.5, 0.1], [1319, 0.6, 0.4]],
    oneup: [[659, 0, 0.1], [784, 0.1, 0.1], [1319, 0.2, 0.1], [1047, 0.3, 0.1], [1175, 0.4, 0.1], [1568, 0.5, 0.2]],
    pause: [[880, 0, 0.08], [660, 0.1, 0.08]],
    gameover: [[392, 0, 0.25], [330, 0.3, 0.25], [262, 0.6, 0.6, 'triangle']],
    win: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.5]]
  };
  const MEL = [12, null, 16, null, 19, null, 16, null, 14, null, 17, null, 21, null, 17, null, 12, null, 16, null, 19, null, 24, null, 23, null, 19, null, 16, 14, 12, null];
  const BASS = [-12, -12, -7, -7, -12, -12, -5, -7];
  const hz = function (s) { return 261.63 * Math.pow(2, s / 12); };

  class Sound {
    constructor() { this.ctx = null; this.muted = false; this.on = false; this.step = 0; this.next = 0; }
    unlock() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.22; this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }
    tone(f, t, d, type, vol, to) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + 0.02);
    }
    play(name) {
      if (!this.ctx || this.muted || !SFX[name]) return;
      const t = this.ctx.currentTime;
      SFX[name].forEach((n) => this.tone(n[0], t + n[1], n[2], n[3] || 'square', 0.35, n[4]));
    }
    music(on) { this.on = on; }
    tick() {
      if (!this.ctx) return;
      if (!this.on || this.muted) { this.next = 0; return; }
      const c = this.ctx;
      if (this.next < c.currentTime) this.next = c.currentTime + 0.05;
      while (this.next < c.currentTime + 0.2) {
        const i = this.step % 32, m = MEL[i];
        if (m !== null) this.tone(hz(m), this.next, 0.13, 'square', 0.12);
        if (i % 4 === 0) this.tone(hz(BASS[i >> 2]), this.next, 0.5, 'triangle', 0.3);
        this.step++; this.next += 0.15;
      }
    }
  }
  return { Sound: Sound };
});
