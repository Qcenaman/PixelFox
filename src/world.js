(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require);
  else { root.PF = root.PF || {}; Object.assign(root.PF, factory(function () { return root.PF; })); }
})(typeof self !== 'undefined' ? self : this, function (require) {
  'use strict';
  const C = require('./constants.js'), P = require('./physics.js'), S = require('./scoring.js');
  const T = C.T, K = C.PHYS;

  class World {
    constructor(level, stats) {
      this.level = level; this.cols = level.width; this.rows = level.height;
      this.tiles = level.tiles.map(function (r) { return r.slice(); });
      this.solidAt = P.makeSolidAt(this.tiles, this.cols, this.rows);
      this.stats = stats; this.events = []; this.fx = []; this.bumps = []; this.items = [];
      const big = !!stats.big, h = big ? 24 : 14;
      this.p = { x: level.player.col * T + 2, y: (level.player.row + 1) * T - h, w: 12, h: h, vx: 0, vy: 0, big: big, onGround: false, facing: 1, inv: 0, coyote: 0, buffer: 0, prevJump: false, anim: 0 };
      this.enemies = level.enemies.map(function (e) {
        return { type: e.type, state: 'walk', x: e.col * T + 1, y: (e.row + 1) * T - 14, w: 14, h: 14, vx: 0, vy: 0, dir: -1, active: false, t: 0, grace: 0 };
      });
      this.camX = 0; this.time = C.LEVEL_TIME; this.sub = 0; this.frame = 0;
      this.status = 'play'; this.dyingT = 0; this.endT = 0; this.bonus = 0; this.jumpHeld = false;
      this.poleX = level.flag.col * T + 7; this.poleTop = (level.flag.row - 8) * T; this.poleBottom = (level.flag.row + 1) * T;
      this.flagY = this.poleTop + 4;
    }
    emit(n) { this.events.push(n); }
    update(input) {
      this.frame++;
      if (this.status === 'play') this.updatePlay(input);
      else if (this.status === 'dying') this.updateDying();
      else if (this.status === 'won') this.updateWon();
      this.updateFx();
    }
    updatePlay(input) {
      if (++this.sub >= 30) { this.sub = 0; this.time--; if (this.time <= 0) { this.time = 0; this.kill(false); return; } }
      this.movePip(input);
      if (this.status !== 'play') return;
      this.updateEnemies();
      this.updateItems();
      this.pipContacts();
      if (this.status !== 'play') return;
      this.collectCoins();
      const p = this.p;
      if (p.y > this.rows * T + 8) { this.kill(true); return; }
      if (p.x + p.w >= this.poleX && p.y + p.h > this.poleTop) this.win();
    }
    movePip(input) {
      const p = this.p, dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const maxV = input.run ? K.MAX_RUN : K.MAX_WALK, acc = input.run ? K.ACC_RUN : K.ACC;
      if (dir) {
        p.facing = dir;
        const s = p.vx * dir;
        if (s < 0) p.vx += dir * K.SKID;
        else if (s < maxV) p.vx = dir * Math.min(maxV, s + acc);
        else p.vx -= dir * Math.min(K.FRICTION, s - maxV);
      } else {
        const a = Math.min(Math.abs(p.vx), K.FRICTION);
        p.vx -= Math.sign(p.vx) * a;
      }
      const jp = !!input.jump && !p.prevJump;
      p.prevJump = !!input.jump; this.jumpHeld = !!input.jump;
      p.buffer = jp ? 6 : Math.max(0, p.buffer - 1);
      p.coyote = p.onGround ? 6 : Math.max(0, p.coyote - 1);
      if (p.buffer > 0 && p.coyote > 0) {
        p.vy = K.JUMP_V - Math.abs(p.vx) * 0.25; p.buffer = 0; p.coyote = 0; p.onGround = false; this.emit('jump');
      }
      p.vy = Math.min(K.MAX_FALL, p.vy + (p.vy < 0 && !input.jump ? K.GRAV_CUT : K.GRAV));
      if (p.inv > 0) p.inv--;
      const r = P.moveBody(p, this.solidAt);
      p.onGround = r.hitY > 0;
      if (r.hitY < 0) this.bumpTile(r.bumpTx, r.bumpTy);
      if (p.x < this.camX) { p.x = this.camX; if (p.vx < 0) p.vx = 0; }
      p.anim += Math.abs(p.vx) * 0.12;
      const maxCam = this.cols * T - C.W;
      this.camX = Math.max(0, Math.min(maxCam, Math.max(this.camX, p.x - 104)));
    }
    giveCoin(x, y) {
      if (S.addCoin(this.stats)) this.emit('oneup'); else this.emit('coin');
      this.fx.push({ k: 'coin', x: x, y: y, vy: -4, t: 26 });
    }
    popup(x, y, txt) { this.fx.push({ k: 'txt', x: x, y: y, txt: txt, t: 40 }); }
    bumpTile(tx, ty) {
      const c = this.tiles[ty] && this.tiles[ty][tx];
      if (!c) return;
      if (c === 'B') {
        if (this.p.big) {
          this.tiles[ty][tx] = '.'; S.addScore(this.stats, 50);
          for (let i = 0; i < 4; i++) this.fx.push({ k: 'deb', x: tx * T + (i % 2) * 8, y: ty * T + (i >> 1) * 8, vx: (i % 2 ? 1 : -1) * 1.2, vy: -4 - (i >> 1) * 1.5, t: 70 });
          this.emit('break');
        } else { this.bumps.push({ tx: tx, ty: ty, t: 0 }); this.emit('bump'); }
        this.killAbove(tx, ty);
      } else if (c === '?') {
        this.tiles[ty][tx] = 'U'; this.bumps.push({ tx: tx, ty: ty, t: 0 });
        this.giveCoin(tx * T + 4, ty * T - 16); this.killAbove(tx, ty);
      } else if (c === 'M') {
        this.tiles[ty][tx] = 'U'; this.bumps.push({ tx: tx, ty: ty, t: 0 });
        this.items.push({ kind: 'berry', x: tx * T + 1, y: ty * T + 2, w: 14, h: 14, vx: 0, vy: 0, dir: 1, rise: 16 });
        this.emit('sprout'); this.killAbove(tx, ty);
      } else this.emit('bump');
    }
    killAbove(tx, ty) {
      for (const e of this.enemies) {
        if ((e.state === 'walk' || e.state === 'shell' || e.state === 'slide') && Math.abs(e.y + e.h - ty * T) <= 3 && e.x + e.w > tx * T && e.x < (tx + 1) * T) this.defeat(e, 1);
      }
    }
    defeat(e, dir) {
      e.state = 'dead'; e.vy = -4; e.vx = dir * 1.2;
      S.addScore(this.stats, 200); this.popup(e.x, e.y, '200'); this.emit('stomp');
    }
    updateEnemies() {
      const list = this.enemies;
      for (const e of list) {
        if (e.state === 'squash') { if (--e.t <= 0) e.remove = true; continue; }
        if (!e.active) { if (e.x < this.camX + C.W + 16) e.active = true; else continue; }
        if (e.state === 'dead') { e.vy += K.GRAV; e.y += e.vy; e.x += e.vx; if (e.y > this.rows * T + 40) e.remove = true; continue; }
        if (e.grace > 0) e.grace--;
        e.vx = e.state === 'walk' ? e.dir * K.WALK_SPD : e.state === 'slide' ? e.dir * K.SLIDE_SPD : 0;
        e.vy = Math.min(K.MAX_FALL, e.vy + K.GRAV);
        const r = P.moveBody(e, this.solidAt);
        if (r.hitX) { e.dir = -r.hitX; if (e.state === 'slide') this.emit('bump'); }
        if (e.state === 'slide') {
          for (const o of list) {
            if (o !== e && o.active && (o.state === 'walk' || o.state === 'shell') && P.overlap(e, o)) this.defeat(o, e.dir);
          }
        }
        if (e.y > this.rows * T + 40 || e.x + e.w < this.camX - 32) e.remove = true;
      }
      this.enemies = list.filter(function (e) { return !e.remove; });
    }
    updateItems() {
      for (const it of this.items) {
        if (it.rise > 0) { it.y -= 1; it.rise--; continue; }
        it.vx = it.dir * 0.8; it.vy = Math.min(K.MAX_FALL, it.vy + K.GRAV);
        const r = P.moveBody(it, this.solidAt);
        if (r.hitX) it.dir = -r.hitX;
        if (P.overlap(this.p, it)) {
          it.remove = true;
          if (!this.p.big) { this.p.big = true; this.stats.big = true; this.p.h = 24; this.p.y -= 10; }
          S.addScore(this.stats, 1000); this.popup(it.x, it.y, '1000'); this.emit('powerup');
        } else if (it.y > this.rows * T + 16) it.remove = true;
      }
      this.items = this.items.filter(function (i) { return !i.remove; });
    }
    bounce(e) {
      const p = this.p;
      p.vy = this.jumpHeld ? K.STOMP_BOUNCE_HELD : K.STOMP_BOUNCE;
      p.y = Math.min(p.y, e.y - p.h);
    }
    pipContacts() {
      const p = this.p;
      for (const e of this.enemies) {
        if (!e.active || e.state === 'squash' || e.state === 'dead' || !P.overlap(p, e)) continue;
        const stomp = P.isStomp(p, e);
        if (e.type === 'shell' && e.state === 'shell') {
          e.state = 'slide'; e.dir = (p.x + p.w / 2 < e.x + e.w / 2) ? 1 : -1; e.grace = 14;
          this.emit('kick'); S.addScore(this.stats, 100);
          if (stomp) this.bounce(e);
          continue;
        }
        if (e.type === 'shell' && e.state === 'slide') {
          if (e.grace > 0) continue;
          if (stomp) { e.state = 'shell'; this.bounce(e); this.emit('stomp'); S.addScore(this.stats, 100); } else this.hurt();
          continue;
        }
        if (stomp) {
          if (e.type === 'walker') { e.state = 'squash'; e.t = 30; } else { e.state = 'shell'; e.y += 2; e.h = 12; e.vx = 0; }
          this.bounce(e); this.emit('stomp'); S.addScore(this.stats, 100); this.popup(e.x, e.y - 8, '100');
        } else this.hurt();
        if (this.status !== 'play') return;
      }
    }
    hurt() {
      const p = this.p;
      if (p.inv > 0) return;
      if (p.big) { p.big = false; this.stats.big = false; p.h = 14; p.y += 10; p.inv = 100; this.emit('shrink'); }
      else this.kill(false);
    }
    kill(fell) {
      if (this.status !== 'play') return;
      this.status = 'dying'; this.dyingT = 0;
      this.p.vx = 0; this.p.vy = fell ? 0 : -7; this.p.big = false; this.stats.big = false;
      this.emit('death');
    }
    updateDying() {
      this.dyingT++;
      if (this.dyingT > 20) { this.p.vy = Math.min(9, this.p.vy + 0.3); this.p.y += this.p.vy; }
      if (this.dyingT > 110) this.status = 'dead';
    }
    collectCoins() {
      const p = this.p;
      const ty1 = Math.floor((p.y + p.h - 0.01) / T), tx1 = Math.floor((p.x + p.w - 0.01) / T);
      for (let ty = Math.floor(p.y / T); ty <= ty1; ty++) {
        for (let tx = Math.floor(p.x / T); tx <= tx1; tx++) {
          if (this.tiles[ty] && this.tiles[ty][tx] === 'o') { this.tiles[ty][tx] = '.'; this.giveCoin(tx * T + 4, ty * T - 4); }
        }
      }
    }
    win() {
      const p = this.p;
      this.status = 'won'; p.x = this.poleX - p.w; p.vx = 0; p.vy = 0; p.facing = 1;
      const frac = Math.max(0, Math.min(1, (this.poleBottom - (p.y + p.h)) / (this.poleBottom - this.poleTop)));
      this.bonus = Math.max(100, Math.round(frac * 50) * 100);
      S.addScore(this.stats, this.bonus); this.emit('clear');
    }
    updateWon() {
      const p = this.p;
      if (p.y + p.h < this.poleBottom) p.y = Math.min(this.poleBottom - p.h, p.y + 2);
      if (this.flagY < this.poleBottom - 12) this.flagY = Math.min(this.poleBottom - 12, this.flagY + 2);
      else if (p.y + p.h >= this.poleBottom) {
        if (this.time > 0) { const u = Math.min(this.time, 3); this.time -= u; S.addScore(this.stats, u * 10); }
        else if (++this.endT > 70) this.status = 'complete';
      }
    }
    updateFx() {
      for (const f of this.fx) {
        f.t--;
        if (f.k === 'deb') { f.vy += 0.35; f.x += f.vx; f.y += f.vy; }
        else if (f.k === 'coin') { f.vy += 0.3; f.y += f.vy; }
        else f.y -= 0.5;
      }
      this.fx = this.fx.filter(function (f) { return f.t > 0; });
      for (const b of this.bumps) b.t++;
      this.bumps = this.bumps.filter(function (b) { return b.t < 8; });
    }
  }
  return { World: World };
});
