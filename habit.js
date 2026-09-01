/* «Привычка как игра» — движение.
   Правило: всё, что двигается, двигается через transform и opacity.
   Всё выключается, если у пользователя стоит prefers-reduced-motion. */
(function () {
  'use strict';

  var MOTION = document.documentElement.classList.contains('motion');

  /* ---------- тема ---------- */
  var tb = document.getElementById('theme');
  if (tb) {
    tb.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('hm-theme', next); } catch (e) {}
    });
  }

  /* ---------- раскрытие по скроллу ---------- */
  var io = null;
  if (MOTION && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  }

  function watch(el, delay) {
    if (!MOTION) return;
    if (delay) el.style.setProperty('--d', delay + 'ms');
    if (io) io.observe(el); else el.classList.add('in');
  }

  /* группы со ступенькой: [data-stagger] раздаёт задержки детям с [data-in] */
  Array.prototype.forEach.call(document.querySelectorAll('[data-stagger]'), function (group) {
    var step = parseInt(group.getAttribute('data-stagger'), 10) || 70;
    var kids = group.querySelectorAll(':scope > [data-in]');
    Array.prototype.forEach.call(kids, function (k, i) {
      k.setAttribute('data-staggered', '');
      k.style.setProperty('--d', (i * step) + 'ms');
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-in]'), function (el) {
    if (el.hasAttribute('data-hero')) return;      // герой запускается отдельно
    if (io) io.observe(el); else el.classList.add('in');
  });

  /* ---------- оркестрованный вход первого экрана ---------- */
  function bootHero() {
    var items = document.querySelectorAll('[data-hero]');
    if (!items.length) return;
    if (!MOTION) { Array.prototype.forEach.call(items, function (el) { el.classList.add('in'); }); return; }
    Array.prototype.forEach.call(items, function (el) {
      var d = parseInt(el.getAttribute('data-hero'), 10) || 0;
      el.style.setProperty('--d', d + 'ms');
      var go = function () { el.classList.add('in'); };
      requestAnimationFrame(function () { requestAnimationFrame(go); });
      setTimeout(go, 120);   /* rAF не тикает в фоновой вкладке — страховка */
    });
  }

  /* ---------- рисующиеся графики ---------- */
  function playChart(svg) {
    if (!svg) return;
    if (!MOTION) { svg.classList.add('play'); return; }
    svg.classList.remove('play');
    void svg.getBoundingClientRect();
    var go = function () { svg.classList.add('play'); };
    requestAnimationFrame(go);
    setTimeout(go, 80);
  }

  var heroChart = document.querySelector('.hchart[data-autoplay]');
  var replay = document.querySelector('.replay');
  if (replay && heroChart) {
    replay.addEventListener('click', function () { playChart(heroChart); });
  }
  /* графики, которые ждут скролла */
  Array.prototype.forEach.call(document.querySelectorAll('.hchart:not([data-autoplay])'), function (svg) {
    if (!MOTION || !('IntersectionObserver' in window)) { svg.classList.add('play'); return; }
    var o = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { playChart(svg); o.unobserve(e.target); } });
    }, { threshold: 0.3 });
    o.observe(svg);
  });

  /* ---------- живая сцена: вечерний разбор ---------- */
  function scene(root) {
    var track = root.querySelector('.sc-track');
    var body = root.querySelector('.sc-body');
    var beats = root.querySelectorAll('.beat');
    var rail = root.querySelector('.rail i');
    var bar = root.querySelector('.sc-bar i');
    var btn = root.querySelector('.sc-btn');
    var tapBtn = root.querySelector('.pbtn[data-tap]');
    var foot = root.querySelector('.ph-foot');
    var items = {};
    Array.prototype.forEach.call(track.children, function (el) {
      var k = el.getAttribute('data-k');
      if (k) items[k] = el;
    });

    function showAll() {
      Array.prototype.forEach.call(track.children, function (el) { el.classList.add('on'); });
      var typing = items.typing; if (typing) typing.classList.remove('on');
      var f0 = root.querySelector('.ph-foot'); if (f0) f0.classList.add('sent');
      Array.prototype.forEach.call(beats, function (b) { b.classList.add('on'); });
      if (rail) rail.style.transform = 'scaleY(1)';
      if (bar) bar.style.transform = 'scaleX(1)';
      var ctl = root.querySelector('.sc-ctl'); if (ctl) ctl.hidden = true;
    }

    if (!MOTION) { showAll(); return; }

    /* сдвиг ленты: содержимое прирастает снизу, разницу гасим transform-ом */
    function shift(before) {
      var d = track.offsetHeight - before;
      if (!d) return;
      track.style.transition = 'none';
      track.style.transform = 'translate3d(0,' + d + 'px,0)';
      void track.offsetHeight;
      track.style.transition = 'transform 460ms var(--e-out)';
      track.style.transform = 'translate3d(0,0,0)';
    }
    function show(k) {
      var el = items[k]; if (!el) return;
      var h = track.offsetHeight;
      el.classList.add('on');
      shift(h);
    }
    function hide(k) {
      var el = items[k]; if (!el) return;
      var h = track.offsetHeight;
      el.classList.remove('on');
      shift(h);
    }
    function beat(i) {
      Array.prototype.forEach.call(beats, function (b, j) { b.classList.toggle('on', j === i); });
      if (rail) rail.style.transform = 'scaleY(' + ((i + 1) / beats.length).toFixed(3) + ')';
    }

    var steps = [
      { at: 250,   run: function () { beat(0); show('q1'); } },
      { at: 1750,  run: function () { show('a1'); } },
      { at: 2700,  run: function () { show('typing'); } },
      { at: 3950,  run: function () { hide('typing'); beat(1); show('m1'); } },
      { at: 5400,  run: function () { show('m2'); } },
      { at: 6800,  run: function () { if (tapBtn) { tapBtn.classList.remove('tap'); void tapBtn.offsetWidth; tapBtn.classList.add('tap'); } } },
      { at: 7250,  run: function () { show('a2'); if (foot) foot.classList.add('sent'); } },
      { at: 8250,  run: function () { beat(2); show('hdr'); show('plan'); } },
      { at: 10700, run: function () { beat(3); show('note'); } }
    ];
    var CYCLE = 14800, FADE = 14100;

    function reset() {
      Array.prototype.forEach.call(track.children, function (el) {
        if (el.getAttribute('data-k') !== 'day') el.classList.remove('on');
      });
      track.style.transition = 'none';
      track.style.transform = 'translate3d(0,0,0)';
      if (foot) foot.classList.remove('sent');
      if (tapBtn) tapBtn.classList.remove('tap');
      body.classList.remove('fade');
      i = 0; t = 0;
    }

    var t = 0, i = 0, last = 0, raf = 0, paused = false, near = true;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!last) last = now;
      var dt = Math.min(now - last, 90); last = now;
      if (paused || !near) return;
      t += dt;
      while (i < steps.length && t >= steps[i].at) { steps[i].run(); i++; }
      if (t >= FADE) body.classList.add('fade');
      if (t >= CYCLE) reset();
      if (bar) bar.style.transform = 'scaleX(' + Math.min(1, t / CYCLE).toFixed(4) + ')';
    }

    function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        en.forEach(function (e) { near = e.isIntersecting; if (near) start(); else stop(); });
      }, { threshold: 0.15 }).observe(root);
    } else { start(); }

    /* вернулись на вкладку — не тащим за собой накопленный кадр */
    document.addEventListener('visibilitychange', function () { if (!document.hidden) last = 0; });

    if (btn) {
      btn.addEventListener('click', function () {
        paused = !paused;
        btn.setAttribute('data-paused', paused ? '1' : '0');
        btn.setAttribute('aria-label', paused ? 'Продолжить сцену' : 'Остановить сцену');
        if (!paused) last = 0;
      });
    }
    /* клик по такту — перемотка сцены к нему */
    Array.prototype.forEach.call(beats, function (b, j) {
      b.addEventListener('click', function () {
        var marks = [250, 3950, 8250, 10700];
        reset();
        t = 0; i = 0;
        var target = marks[j];
        while (i < steps.length && steps[i].at <= target) { steps[i].run(); i++; }
        t = target + 1;
        track.style.transition = 'none';
        track.style.transform = 'translate3d(0,0,0)';
        paused = false;
        btn && btn.setAttribute('data-paused', '0');
        last = 0; start();
      });
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-scene]'), scene);

  /* ---------- интерактивный список функций на LLM ---------- */
  var tabs = document.querySelectorAll('.llm-t');
  if (tabs.length) {
    var panes = document.querySelectorAll('.llm-p');
    function select(n) {
      Array.prototype.forEach.call(tabs, function (t2, j) {
        t2.setAttribute('aria-selected', j === n ? 'true' : 'false');
        t2.setAttribute('tabindex', j === n ? '0' : '-1');
      });
      Array.prototype.forEach.call(panes, function (p, j) { p.hidden = j !== n; });
    }
    var pane = document.querySelector('.llm-pane');
    Array.prototype.forEach.call(tabs, function (t2, j) {
      t2.addEventListener('click', function () {
        select(j);
        /* на узком экране панель стоит под списком — подводим её к глазам */
        if (pane && window.innerWidth <= 880) {
          var top = pane.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top: top, behavior: MOTION ? 'smooth' : 'auto' });
        }
      });
      t2.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
              : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = (j + d + tabs.length) % tabs.length;
        select(n); tabs[n].focus();
      });
    });
    select(0);
  }

  /* если пользователь включит «меньше движения» прямо сейчас — показываем всё как есть */
  try {
    var mq = matchMedia('(prefers-reduced-motion: reduce)');
    var onMQ = function () {
      if (!mq.matches) return;
      document.documentElement.classList.remove('motion');
      Array.prototype.forEach.call(document.querySelectorAll('[data-in]'), function (el) { el.classList.add('in'); });
    };
    mq.addEventListener ? mq.addEventListener('change', onMQ) : mq.addListener(onMQ);
  } catch (e) {}

  /* ---------- запуск ---------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootHero);
  else bootHero();

  if (heroChart) {
    var kick = function () { setTimeout(function () { playChart(heroChart); }, MOTION ? 620 : 0); };
    if (document.readyState === 'complete') kick();
    else window.addEventListener('load', kick);
  }
})();
