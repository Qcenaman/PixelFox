const test = require('node:test');
const assert = require('node:assert/strict');
const LV = require('../src/level.js');
const { LEVELS } = require('../src/levels.js');
const { World } = require('../src/world.js');

const T = 16;

function decide(w) {
  const p = w.p, s = w.solidAt;
  const feet = Math.floor((p.y + p.h - 1) / T), fx = p.x + p.w;
  const wall = s(Math.floor((fx + 6) / T), feet) || s(Math.floor((fx + 6) / T), feet - 1);
  const pit = p.onGround && !s(Math.floor((fx + 4) / T), feet + 1);
  let foe = false;
  for (const e of w.enemies) {
    const d = e.x - fx;
    if (e.state !== 'dead' && e.state !== 'squash' && d > -4 && d < 40 && Math.abs(e.y - p.y) < 24) foe = true;
  }
  return { left: false, right: true, run: true, jump: wall || pit || foe || (!p.onGround && p.vy < 0) };
}

for (const def of LEVELS) {
  test('bot can finish level ' + def.name, function () {
    const w = new World(LV.parseLevel(def.rows, def.name), { score: 0, coins: 0, lives: 3, big: false });
    let f = 0;
    while (f < 4000 && w.status !== 'complete' && w.status !== 'dead') { w.update(decide(w)); f++; }
    assert.equal(w.status, 'complete', 'ended as ' + w.status + ' at x=' + Math.round(w.p.x) + ' y=' + Math.round(w.p.y) + ' after ' + f + ' frames');
  });
}
