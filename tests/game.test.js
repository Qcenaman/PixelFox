const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/constants.js');
const P = require('../src/physics.js');
const S = require('../src/scoring.js');
const LV = require('../src/level.js');
const { LEVELS } = require('../src/levels.js');
const { World } = require('../src/world.js');
const { Game } = require('../src/game.js');

const NONE = { left: false, right: false, jump: false, run: false };
const fresh = function () { return { score: 0, coins: 0, lives: 3, big: false }; };
const mk = function (rows, stats) { return new World(LV.parseLevel(rows, 't'), stats || fresh()); };
const FLAT = ['.', '.', '.', '.', '.', '..@......g.....F', '#'];
const SHELLY = ['.', '.', '.', '.', '.', '..@......k.....F', '#'];

function jumpHeight(hold) {
  const w = mk(FLAT);
  w.update(NONE);
  const y0 = w.p.y;
  let min = y0;
  for (let i = 0; i < 90; i++) {
    w.update({ left: false, right: false, run: false, jump: i < hold });
    min = Math.min(min, w.p.y);
  }
  return { h: y0 - min, landed: w.p.onGround && w.p.y === y0 };
}

test('jump physics: tap is a short hop, hold is a high jump, Pip lands again', function () {
  const tap = jumpHeight(1), hold = jumpHeight(90);
  assert.ok(tap.h > 0 && tap.h < 30, 'tap height ' + tap.h);
  assert.ok(hold.h > 40 && hold.h < 70, 'hold height ' + hold.h);
  assert.ok(tap.h < hold.h);
  assert.ok(tap.landed && hold.landed);
});

test('tile collision: walls, floor and ceiling stop the body on every side', function () {
  const tiles = [['.', '.', '#'], ['.', '.', '#'], ['#', '#', '#']];
  const solid = P.makeSolidAt(tiles, 3, 3);
  const b = { x: 20, y: 18, w: 12, h: 14, vx: 10, vy: 0.4 };
  const r = P.moveBody(b, solid);
  assert.equal(b.x, 20); assert.equal(b.y, 18);
  assert.equal(r.hitX, 1); assert.equal(r.hitY, 1);
  assert.equal(b.vx, 0); assert.equal(b.vy, 0);
  const left = { x: 3, y: 18, w: 12, h: 14, vx: -5, vy: 0 };
  assert.equal(P.moveBody(left, solid).hitX, -1);
  assert.equal(left.x, 0);
  const grid2 = P.makeSolidAt([['#', '#'], ['.', '.'], ['#', '#']], 2, 3);
  const up = { x: 4, y: 16, w: 12, h: 14, vx: 0, vy: -5 };
  const ru = P.moveBody(up, grid2);
  assert.equal(ru.hitY, -1); assert.equal(up.y, 16); assert.equal(ru.bumpTx, 0);
  const fast = { x: 4, y: 16, w: 12, h: 14, vx: 0, vy: 7 };
  P.moveBody(fast, grid2);
  assert.equal(fast.y, 18);
});

test('stomp kills a walker, side hit hurts Pip', function () {
  const a = mk(FLAT); a.update(NONE);
  const e = a.enemies[0]; e.active = true;
  a.p.x = e.x; a.p.y = e.y - 20; a.p.vy = 3;
  for (let i = 0; i < 20 && e.state === 'walk'; i++) a.update(NONE);
  assert.equal(e.state, 'squash'); assert.equal(a.status, 'play'); assert.ok(a.p.vy < 0); assert.ok(a.stats.score >= 100);

  const b = mk(FLAT); b.update(NONE);
  const e2 = b.enemies[0]; e2.active = true;
  b.p.x = e2.x - b.p.w + 2; b.p.y = e2.y; b.p.vy = 0;
  b.update(NONE);
  assert.equal(b.status, 'dying');

  const c = mk(FLAT, { score: 0, coins: 0, lives: 3, big: true }); c.update(NONE);
  const e3 = c.enemies[0]; e3.active = true;
  c.p.x = e3.x - c.p.w + 2; c.p.y = 96 - c.p.h; c.p.vy = 0;
  c.update(NONE);
  assert.equal(c.status, 'play'); assert.equal(c.p.big, false); assert.ok(c.p.inv > 0);
});

test('shell enemy: stomp into shell, then kick it', function () {
  const w = mk(SHELLY); w.update(NONE);
  const e = w.enemies[0]; e.active = true;
  w.p.x = e.x; w.p.y = e.y - 20; w.p.vy = 3;
  for (let i = 0; i < 20 && e.state === 'walk'; i++) w.update(NONE);
  assert.equal(e.state, 'shell');
  w.p.x = e.x - 60;
  for (let i = 0; i < 120 && !w.p.onGround; i++) w.update(NONE);
  w.p.x = e.x - w.p.w + 2; w.p.y = 96 - w.p.h; w.p.vy = 0;
  w.update(NONE);
  assert.equal(e.state, 'slide'); assert.equal(e.dir, 1); assert.equal(w.status, 'play');
});

test('coins: 100 coins give an extra life', function () {
  const s = fresh();
  let gained = 0;
  for (let i = 0; i < 100; i++) if (S.addCoin(s)) gained++;
  assert.equal(gained, 1); assert.equal(s.lives, 4); assert.equal(s.coins, 0);
  const w = mk(['.', '.', '.', '.', '.', '..@o....F', '#']); w.update(NONE);
  w.p.x = 48; w.update(NONE);
  assert.equal(w.stats.coins, 1); assert.equal(w.tiles[5][3], '.');
});

test('blocks: ? pops a coin, big Pip breaks bricks, small Pip only bumps them', function () {
  const jumpUnder = function (tile, big) {
    const w = mk(['.', '.', '.', '..' + tile, '.', '..@.....F', '#'], { score: 0, coins: 0, lives: 3, big: big });
    w.update(NONE);
    for (let i = 0; i < 25; i++) w.update({ left: false, right: false, run: false, jump: true });
    return w;
  };
  const q = jumpUnder('?', false);
  assert.equal(q.tiles[3][2], 'U'); assert.equal(q.stats.coins, 1);
  assert.equal(jumpUnder('B', true).tiles[3][2], '.');
  assert.equal(jumpUnder('B', false).tiles[3][2], 'B');
  const m = jumpUnder('M', false);
  assert.equal(m.tiles[3][2], 'U'); assert.equal(m.items.length, 1);
});

test('level map parsing', function () {
  const L = LV.parseLevel(['....', '.@gF', '####'], 'x');
  assert.equal(L.width, 4); assert.equal(L.height, 3);
  assert.deepEqual(L.player, { col: 1, row: 1 });
  assert.deepEqual(L.enemies, [{ type: 'walker', col: 2, row: 1 }]);
  assert.deepEqual(L.flag, { col: 3, row: 1 });
  assert.equal(L.tiles[1][1], '.'); assert.equal(L.tiles[2][0], '#');
  assert.throws(function () { LV.parseLevel(['..@Z', '####'], 'bad'); });
  assert.throws(function () { LV.parseLevel(['....', '###F'], 'noplayer'); });
  assert.throws(function () { LV.parseLevel(['.@..', '####'], 'noflag'); });
  assert.ok(LEVELS.length >= 2);
  for (const def of LEVELS) {
    const lv = LV.parseLevel(def.rows, def.name);
    assert.equal(lv.height, 15); assert.ok(lv.enemies.length > 0);
    assert.equal(lv.tiles[lv.height - 1][lv.player.col], '#');
    assert.equal(lv.tiles[lv.height - 1][lv.flag.col], '#');
  }
});

test('game flow and saved high score', function () {
  const store = { d: {}, getItem: function (k) { return this.d[k] === undefined ? null : this.d[k]; }, setItem: function (k, v) { this.d[k] = v; } };
  const g = new Game(store);
  g.update({ start: true });
  assert.equal(g.state, 'intro');
  for (let i = 0; i < 120; i++) g.update(NONE);
  assert.equal(g.state, 'play');
  g.stats.score = 1234;
  g.world.kill(false);
  for (let i = 0; i < 200; i++) g.update(NONE);
  assert.equal(store.d['pixelfox.hi'], '1234');
  assert.equal(g.stats.lives, 2);
  assert.equal(C.W, 256);
});
