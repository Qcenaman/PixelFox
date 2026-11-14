(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require);
  else { root.PF = root.PF || {}; Object.assign(root.PF, factory(function () { return root.PF; })); }
})(typeof self !== 'undefined' ? self : this, function (require) {
  'use strict';
  const C = require('./constants.js');
  const T = C.T, PAL = C.PALETTE;

  const FONT = {};
  ('A###/#.#/###/#.#/#.# B##./#.#/##./#.#/##. C###/#../#../#../### D##./#.#/#.#/#.#/##. E###/#../##./#../### F###/#../##./#../#.. G###/#../#.#/#.#/### H#.#/#.#/###/#.#/#.# I###/.#./.#./.#./### J..#/..#/..#/#.#/### K#.#/#.#/##./#.#/#.# L#../#../#../#../### M#.#/###/###/#.#/#.# N###/#.#/#.#/#.#/#.# O###/#.#/#.#/#.#/### P###/#.#/###/#../#.. Q###/#.#/#.#/###/..# R###/#.#/##./#.#/#.# S###/#../###/..#/### T###/.#./.#./.#./.#. U#.#/#.#/#.#/#.#/### V#.#/#.#/#.#/#.#/.#. W#.#/#.#/###/###/#.# X#.#/#.#/.#./#.#/#.# Y#.#/#.#/.#./.#./.#. Z###/..#/.#./#../###' +
    ' 0###/#.#/#.#/#.#/### 1.#./##./.#./.#./### 2###/..#/###/#../### 3###/..#/###/..#/### 4#.#/#.#/###/..#/..# 5###/#../###/..#/### 6###/#../###/#.#/### 7###/..#/..#/.#./.#. 8###/#.#/###/#.#/### 9###/#.#/###/..#/###' +
    ' -.../.../###/.../... !.#./.#./.#./.../.#. ?###/..#/.#./.../.#. :.../.#./.../.#./... ..../.../.../.../.#. x.../#.#/.#./#.#/...').split(' ').forEach(function (s) { FONT[s[0]] = s.slice(1).split('/'); });

  function text(g, s, x, y, sc, col, shadow) {
    s = String(s).toUpperCase();
    function pass(ox, oy, color) {
      g.fillStyle = color;
      for (let i = 0; i < s.length; i++) {
        const gl = FONT[s[i]];
        if (!gl) continue;
        for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (gl[r][c] === '#') g.fillRect(x + i * 4 * sc + c * sc + ox, y + r * sc + oy, sc, sc);
      }
    }
    if (shadow) pass(sc, sc, PAL.k);
    pass(0, 0, col);
  }
  function center(g, s, y, sc, col, shadow) { text(g, s, Math.round((256 - (String(s).length * 4 * sc - sc)) / 2), y, sc, col, shadow); }
  function pad(n, l) { return String(Math.max(0, Math.floor(n))).padStart(l, '0'); }

  const HEAD = ['....o......o....', '...oOo....oOo...', '...rrrrrrrrrr...', '..rrrrrrrrrrrr..', '..RRRRRRRRRRRRRR', '...oooooowkoooo.', '..oooooosssssoo.', '..ooooosssskssso', '...ooooosssssoo.', '....oooosssso...'];
  const BODY = ['...BBBBBBBBBB...', '..wBBBBBBBBBBw..', '..oBBBBBBBBBBo..', '...BBBBBBBBBB...'];
  const LEGS = { stand: ['...kk......kk...', '..kkk......kkk..'], walk: ['....kk....kk....', '...kkk....kkkk..'], jump: ['..kk........kk..', '.kkk.........kkk'] };
  const WALKER = ['................', '................', '.....nnnnnn.....', '...nnnnnnnnnn...', '..nnnNnnnnNnnn..', '.nnnnnnnnnnnnnn.', '.nnwwnnnnnnwwnn.', '.nwwkwnnnnwkwwn.', '.nnwwnnnnnnwwnn.', '.nnnnnnnnnnnnnn.', '..nnnnssssnnnn..', '...nnsssssssn...', '....ssssssss....', '....ssssssss....', '..kkkk....kkkk..', '.kkkkk....kkkkk.'];
  const KOOP = ['................', '................', '......gggg......', '....gggggggg....', '...gGggggggGg...', '..ggggGggGgggss.', '..ggggggggggsssk', '..GGGGGGGGGGssss', '..GGGGGGGGGG.ss.', '..yyyyyyyyyy....', '...yyyyyyyy.....', '....ssss.ssss...', '....ssss.ssss...', '....ssss.ssss...', '...kkkk..kkkk...', '...kkkk..kkkk...'];
  const SHELL = ['......gggg......', '....gggggggg....', '...gGggggggGg...', '..gggggGggGggg..', '..gggggggggggg..', '..GGGGGGGGGGGG..', '..yyyyyyyyyyyy..', '..yyyyyyyyyyyy..', '..GGGGGGGGGGGG..', '...GGGGGGGGGG...', '....GGGGGGGG....', '....kkkkkkkk....'];
  const BERRY = ['................', '.......gg.......', '......gg.g......', '....pppppppp....', '...ppwwpppppp...', '..pppwpppppppp..', '..pppppppppppp..', '..ppppppppPppp..', '..ppppPpppppPp..', '..pppppppppppp..', '...pppppppppp...', '...PpppppppPP...', '....PPPPPPPP....'];

  function make(rows) {
    const cv = document.createElement('canvas');
    cv.width = 16; cv.height = rows.length;
    const g = cv.getContext('2d');
    rows.forEach(function (r, y) {
      for (let x = 0; x < r.length; x++) { const col = PAL[r[x]]; if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } }
    });
    return cv;
  }
  function pipRows(big, leg) { let r = HEAD.slice(); for (let i = 0; i < (big ? 3 : 1); i++) r = r.concat(BODY); return r.concat(LEGS[leg]); }

  class Renderer {
    constructor(canvas) {
      this.g = canvas.getContext('2d'); this.g.imageSmoothingEnabled = false; this.f = 0;
      this.sp = { pip: {}, walker: make(WALKER), koop: make(KOOP), shell: make(SHELL), berry: make(BERRY) };
      ['stand', 'walk', 'jump'].forEach((l) => { this.sp.pip['s_' + l] = make(pipRows(false, l)); this.sp.pip['b_' + l] = make(pipRows(true, l)); });
    }
    blit(img, x, y, flip, vflip) {
      const g = this.g;
      g.save();
      g.translate(Math.round(x) + (flip ? img.width : 0), Math.round(y) + (vflip ? img.height : 0));
      g.scale(flip ? -1 : 1, vflip ? -1 : 1);
      g.drawImage(img, 0, 0);
      g.restore();
    }
    draw(game) {
      const g = this.g, st = game.state;
      this.f++;
      g.setTransform(1, 0, 0, 1, 0, 0);
      if (st === 'title') { this.title(game); return; }
      if (st === 'intro') {
        g.fillStyle = PAL.k; g.fillRect(0, 0, 256, 240);
        center(g, 'WORLD ' + game.worldName(), 88, 2, PAL.w, false);
        this.blit(this.sp.pip.s_stand, 100, 118, false, false);
        text(g, 'X ' + game.stats.lives, 124, 122, 2, PAL.w, false);
        return;
      }
      if (st === 'win') {
        g.fillStyle = PAL.k; g.fillRect(0, 0, 256, 240);
        center(g, 'THE END', 70, 4, PAL.y, false);
        center(g, 'THANKS FOR PLAYING', 120, 2, PAL.w, false);
        center(g, 'SCORE ' + pad(game.stats.score, 6), 150, 2, PAL.w, false);
        center(g, 'HI ' + pad(game.hi, 6), 170, 2, PAL.y, false);
        if ((this.f >> 5) & 1) center(g, 'PRESS ENTER', 200, 2, PAL.w, false);
        return;
      }
      this.world(game.world);
      this.hud(game);
      if (st === 'paused') { this.dim(); center(g, 'PAUSED', 108, 3, PAL.w, true); }
      if (st === 'clear') { this.dim(); center(g, 'COURSE CLEAR', 76, 3, PAL.y, true); center(g, 'BONUS ' + game.world.bonus, 118, 2, PAL.w, true); center(g, 'SCORE ' + pad(game.stats.score, 6), 142, 2, PAL.w, true); }
      if (st === 'gameover') {
        g.fillStyle = PAL.k; g.fillRect(0, 0, 256, 240);
        center(g, 'GAME OVER', 84, 4, PAL.r, false);
        center(g, 'SCORE ' + pad(game.stats.score, 6), 130, 2, PAL.w, false);
        center(g, 'HI ' + pad(game.hi, 6), 150, 2, PAL.y, false);
        if (game.timer > 45 && ((this.f >> 5) & 1)) center(g, 'PRESS ENTER', 190, 2, PAL.w, false);
      }
    }
    dim() { this.g.fillStyle = 'rgba(0,0,0,0.55)'; this.g.fillRect(0, 0, 256, 240); }
    title(game) {
      const g = this.g;
      g.fillStyle = PAL.b; g.fillRect(0, 0, 256, 240);
      this.backdrop(this.f * 0.5);
      g.fillStyle = PAL.n; g.fillRect(0, 208, 256, 32);
      g.fillStyle = PAL.g; g.fillRect(0, 208, 256, 4);
      center(g, 'PIXEL', 36, 6, PAL.r, true);
      center(g, 'FOX', 78, 6, PAL.o, true);
      this.blit(this.sp.pip.s_stand, 120, 192, false, false);
      if ((this.f >> 5) & 1) center(g, 'PRESS ENTER', 140, 2, PAL.w, true);
      center(g, 'HI ' + pad(game.hi, 6), 164, 2, PAL.y, true);
      center(g, 'ARROWS MOVE  Z JUMP  X RUN', 118, 1, PAL.k, false);
    }
    backdrop(cam) {
      const g = this.g;
      for (let i = 0; i < 12; i++) {
        const hx = i * 190 + 60 - cam * 0.7;
        if (hx > -100 && hx < 256) for (let r = 0; r < 5; r++) { g.fillStyle = PAL.g; g.fillRect(hx + r * 8, 208 - (r + 1) * 8, 80 - r * 16, 8); g.fillStyle = PAL.G; g.fillRect(hx + r * 8, 208 - (r + 1) * 8, 2, 8); }
      }
      g.fillStyle = PAL.w;
      for (let i = 0; i < 12; i++) {
        const x = Math.round(i * 170 + 30 - cam * 0.5), y = 24 + (i % 3) * 22;
        if (x > -44 && x < 256) { g.fillRect(x + 4, y + 8, 32, 8); g.fillRect(x + 10, y + 3, 12, 6); g.fillRect(x + 22, y + 5, 10, 4); }
      }
    }
    hud(game) {
      const g = this.g, s = game.stats;
      text(g, 'S' + pad(s.score, 6), 8, 3, 2, PAL.w, true);
      text(g, 'C' + pad(s.coins, 2), 88, 3, 2, PAL.y, true);
      text(g, 'W' + game.worldName(), 128, 3, 2, PAL.w, true);
      text(g, 'T' + pad(game.world.time, 3), 176, 3, 2, PAL.w, true);
      text(g, 'L' + Math.min(99, s.lives), 224, 3, 2, PAL.w, true);
    }
    world(w) {
      const g = this.g, cam = Math.floor(w.camX);
      g.fillStyle = PAL.b; g.fillRect(0, 0, 256, 240);
      this.backdrop(cam);
      g.save(); g.translate(-cam, 0);
      for (const it of w.items) {
        g.globalAlpha = 0.35 + 0.2 * Math.sin(this.f / 4); g.fillStyle = PAL.y; g.fillRect(Math.round(it.x) - 2, Math.round(it.y) - 2, 18, 18); g.globalAlpha = 1;
        this.blit(this.sp.berry, it.x + it.w / 2 - 8, it.y + it.h - 13, false, false);
      }
      const bm = {};
      w.bumps.forEach(function (b) { bm[b.tx + ',' + b.ty] = -Math.round(Math.sin(b.t / 8 * Math.PI) * 5); });
      const x0 = Math.floor(cam / T), x1 = Math.min(w.cols - 1, x0 + 16);
      for (let ty = 0; ty < w.rows; ty++) for (let tx = x0; tx <= x1; tx++) {
        const c = w.tiles[ty][tx];
        if (c !== '.') this.tile(c, tx * T, ty * T + (bm[tx + ',' + ty] || 0), w, tx, ty);
      }
      this.flag(w);
      for (const e of w.enemies) this.enemy(e);
      this.pip(w);
      for (const f of w.fx) this.effect(f);
      g.restore();
    }
    tile(c, x, y, w, tx, ty) {
      const g = this.g, up = w.tiles[ty - 1] && w.tiles[ty - 1][tx];
      if (c === 'o') {
        const wd = [8, 6, 2, 6][(this.f >> 3) & 3], ox = x + 4 + (8 - wd) / 2;
        g.fillStyle = PAL.Y; g.fillRect(ox, y + 2, wd, 12);
        if (wd > 2) { g.fillStyle = PAL.y; g.fillRect(ox + 1, y + 3, wd - 2, 10); }
      } else if (c === '#') {
        g.fillStyle = PAL.n; g.fillRect(x, y, 16, 16);
        g.fillStyle = PAL.N; g.fillRect(x + 3, y + 6, 2, 2); g.fillRect(x + 11, y + 10, 2, 2); g.fillRect(x + 7, y + 13, 2, 2);
        if (up !== '#') { g.fillStyle = PAL.g; g.fillRect(x, y, 16, 4); g.fillStyle = PAL.G; g.fillRect(x, y + 4, 16, 1); }
      } else if (c === 'B') {
        g.fillStyle = PAL.O; g.fillRect(x, y, 16, 16);
        g.fillStyle = PAL.N; g.fillRect(x, y + 7, 16, 1); g.fillRect(x, y + 15, 16, 1); g.fillRect(x + 7, y, 1, 7); g.fillRect(x + 3, y + 8, 1, 7); g.fillRect(x + 11, y + 8, 1, 7);
      } else if (c === '?') {
        g.fillStyle = ((this.f >> 4) & 3) === 0 ? PAL.c : PAL.y; g.fillRect(x, y, 16, 16);
        g.fillStyle = PAL.Y; g.fillRect(x, y, 16, 1); g.fillRect(x, y + 15, 16, 1); g.fillRect(x, y, 1, 16); g.fillRect(x + 15, y, 1, 16);
        text(g, '?', x + 5, y + 3, 2, PAL.N, false);
      } else if (c === 'U' || c === 'M') {
        if (c === 'M') { g.fillStyle = ((this.f >> 4) & 3) === 0 ? PAL.c : PAL.y; g.fillRect(x, y, 16, 16); g.fillStyle = PAL.Y; g.fillRect(x, y, 16, 1); g.fillRect(x, y + 15, 16, 1); g.fillRect(x, y, 1, 16); g.fillRect(x + 15, y, 1, 16); text(g, '?', x + 5, y + 3, 2, PAL.N, false); }
        else { g.fillStyle = PAL.E; g.fillRect(x, y, 16, 16); g.fillStyle = PAL.e; g.fillRect(x + 1, y + 1, 14, 1); g.fillRect(x + 1, y + 1, 1, 14); g.fillStyle = PAL.k; g.fillRect(x + 7, y + 7, 2, 2); }
      } else if (c === 'P') {
        const l = w.tiles[ty][tx - 1] !== 'P', r = w.tiles[ty][tx + 1] !== 'P', top = up !== 'P';
        g.fillStyle = PAL.g; g.fillRect(x, y, 16, 16);
        g.fillStyle = PAL.G; if (l) g.fillRect(x, y, 2, 16); if (r) g.fillRect(x + 14, y, 2, 16); if (top) g.fillRect(x, y, 16, 2);
        g.globalAlpha = 0.4; g.fillStyle = PAL.w; g.fillRect(x + (l ? 4 : 0), y + (top ? 2 : 0), 3, 16 - (top ? 2 : 0)); g.globalAlpha = 1;
      } else if (c === '=') {
        g.fillStyle = PAL.O; g.fillRect(x, y, 16, 16);
        g.fillStyle = PAL.y; g.fillRect(x, y, 16, 3); g.fillStyle = PAL.Y; g.fillRect(x, y + 3, 16, 1); g.fillStyle = PAL.N; g.fillRect(x, y + 15, 16, 1); g.fillRect(x + 15, y + 4, 1, 11);
      }
    }
    flag(w) {
      const g = this.g;
      g.fillStyle = PAL.e; g.fillRect(w.poleX, w.poleTop, 2, w.poleBottom - w.poleTop);
      g.fillStyle = PAL.y; g.fillRect(w.poleX - 1, w.poleTop - 4, 4, 4);
      g.fillStyle = PAL.r;
      for (let r = 0; r < 8; r++) { const wd = Math.round(12 * (1 - r / 8)); g.fillRect(w.poleX - wd, Math.round(w.flagY) + r, wd, 1); }
    }
    enemy(e) {
      const g = this.g, dx = e.x + e.w / 2 - 8;
      if (e.state === 'squash') { g.drawImage(this.sp.walker, 0, 10, 16, 6, Math.round(dx), Math.round(e.y + e.h - 6), 16, 6); return; }
      const vf = e.state === 'dead';
      if (e.type === 'walker') this.blit(this.sp.walker, dx, e.y + e.h - 16, ((this.f >> 3) & 1) === 1, vf);
      else if (e.state === 'walk') this.blit(this.sp.koop, dx, e.y + e.h - 16, e.dir < 0, vf);
      else this.blit(this.sp.shell, dx, e.y + e.h - 12, false, vf);
    }
    pip(w) {
      const p = w.p;
      if (p.inv > 0 && ((this.f >> 2) & 1)) return;
      let leg = 'stand';
      if (w.status === 'dying' || !p.onGround) leg = 'jump';
      else if (Math.abs(p.vx) > 0.2 && Math.floor(p.anim) % 2) leg = 'walk';
      if (w.status === 'won') leg = 'stand';
      const img = this.sp.pip[(p.big ? 'b_' : 's_') + leg];
      this.blit(img, p.x + p.w / 2 - 8, p.y + p.h - img.height, p.facing < 0, false);
    }
    effect(f) {
      const g = this.g;
      if (f.k === 'txt') text(g, f.txt, Math.round(f.x), Math.round(f.y), 1, PAL.w, true);
      else if (f.k === 'coin') { g.fillStyle = PAL.y; g.fillRect(Math.round(f.x), Math.round(f.y), 6 - (f.t % 6 > 3 ? 3 : 0), 10); }
      else if (f.k === 'deb') { g.fillStyle = PAL.O; g.fillRect(Math.round(f.x), Math.round(f.y), 8, 8); g.fillStyle = PAL.N; g.fillRect(Math.round(f.x), Math.round(f.y) + 7, 8, 1); }
    }
  }
  return { Renderer: Renderer };
});
