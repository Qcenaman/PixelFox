(function () {
  'use strict';
  const PF = window.PF, canvas = document.getElementById('screen');
  let storage = null;
  try { storage = window.localStorage; } catch { storage = null; }
  const game = new PF.Game(storage), input = new PF.Input(), sound = new PF.Sound(), view = new PF.Renderer(canvas);
  input.onFirst = function () { sound.unlock(); };
  input.onMute = function () { sound.muted = !sound.muted; };
  canvas.addEventListener('pointerdown', function () {
    sound.unlock();
    if (game.state === 'title' || game.state === 'gameover' || game.state === 'win') { input.touch.start = true; setTimeout(function () { input.touch.start = false; }, 100); }
  });
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.body.classList.add('touch');
  function resize() {
    const sc = Math.min(window.innerWidth / 256, window.innerHeight / 240), k = sc >= 1 ? Math.floor(sc) : sc;
    canvas.style.width = (256 * k) + 'px'; canvas.style.height = (240 * k) + 'px';
  }
  const STEP = 1000 / 60;
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(100, now - last); last = now;
    let n = 0;
    while (acc >= STEP && n < 5) {
      game.update(input.read());
      for (const ev of game.events.splice(0)) sound.play(ev);
      acc -= STEP; n++;
    }
    if (n === 5) acc = 0;
    sound.music(game.musicOn()); sound.tick();
    view.draw(game);
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) game.pause(); });
  window.addEventListener('resize', resize);
  resize();
  window.pixelfox = game;
  requestAnimationFrame(frame);
})();
