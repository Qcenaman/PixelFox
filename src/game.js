(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require);
  else { root.PF = root.PF || {}; Object.assign(root.PF, factory(function () { return root.PF; })); }
})(typeof self !== 'undefined' ? self : this, function (require) {
  'use strict';
  const LV = require('./level.js'), LS = require('./levels.js'), WD = require('./world.js');

  class Game {
    constructor(storage) {
      this.storage = storage || null;
      this.levels = LS.LEVELS.map(function (l) { return LV.parseLevel(l.rows, l.name); });
      this.state = 'title'; this.timer = 0; this.events = []; this.world = null;
      this.stats = { score: 0, coins: 0, lives: 3, big: false };
      this.levelIndex = 0; this.prevStart = false; this.prevJump = false; this.hiDirty = false; this.hi = 0;
      try { this.hi = Number(this.storage && this.storage.getItem('pixelfox.hi')) || 0; } catch { this.hi = 0; }
    }
    newGame() { this.stats = { score: 0, coins: 0, lives: 3, big: false }; this.levelIndex = 0; this.startLevel(); }
    startLevel() { this.world = new WD.World(this.levels[this.levelIndex], this.stats); this.state = 'intro'; this.timer = 110; }
    worldName() { return this.levels[this.levelIndex].name; }
    pause() { if (this.state === 'play') this.state = 'paused'; }
    musicOn() { return this.state === 'play' && this.world.status === 'play'; }
    saveHi() {
      if (!this.hiDirty) return;
      this.hiDirty = false;
      try { if (this.storage) this.storage.setItem('pixelfox.hi', String(this.hi)); } catch { /* storage unavailable */ }
    }
    update(input) {
      const start = !!input.start && !this.prevStart, jump = !!input.jump && !this.prevJump;
      this.prevStart = !!input.start; this.prevJump = !!input.jump;
      switch (this.state) {
        case 'title': if (start || jump) this.newGame(); break;
        case 'intro': if (--this.timer <= 0) this.state = 'play'; break;
        case 'play':
          if (start) { this.state = 'paused'; this.events.push('pause'); break; }
          this.world.update(input);
          for (const ev of this.world.events.splice(0)) this.events.push(ev);
          this.afterWorld();
          break;
        case 'paused': if (start) { this.state = 'play'; this.events.push('pause'); } break;
        case 'clear': if (--this.timer <= 0 || start) this.nextLevel(); break;
        case 'gameover': this.timer++; if (this.timer > 45 && (start || jump)) this.newGame(); break;
        case 'win': this.timer++; if (this.timer > 60 && (start || jump)) this.state = 'title'; break;
        default: break;
      }
    }
    afterWorld() {
      const w = this.world;
      if (this.stats.score > this.hi) { this.hi = this.stats.score; this.hiDirty = true; }
      if (w.status === 'dead') {
        this.saveHi(); this.stats.lives--;
        if (this.stats.lives <= 0) { this.state = 'gameover'; this.timer = 0; this.events.push('gameover'); }
        else this.startLevel();
      } else if (w.status === 'complete') { this.saveHi(); this.state = 'clear'; this.timer = 170; }
    }
    nextLevel() {
      this.levelIndex++;
      if (this.levelIndex >= this.levels.length) { this.levelIndex = this.levels.length - 1; this.state = 'win'; this.timer = 0; this.events.push('win'); }
      else this.startLevel();
    }
  }
  return { Game: Game };
});
