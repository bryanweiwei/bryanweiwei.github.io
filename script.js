/* Portfolio v3 "Broadsheet Helix" — scroll engine.
   Phase map (t = overall scroll 0..1), from design-reference/mockup-d.html:
     0.00–0.08  hero; vertical line grows down from under the headline
     0.08–0.38  DESCENT: stations ride up past the fixed line (0.10 each)
     0.38–0.44  ELBOW: node lights, horizontal branch grows; lower vline retracts
     0.44–0.88  REVOLVE: cards revolve around the horizontal line, eased settling
     0.88–1.00  finale
   The engine only runs in scene mode (html.scene) and only on scroll frames;
   there is no free-running rAF loop. */

(function () {
  'use strict';

  var html = document.documentElement;
  var motionQ = matchMedia('(prefers-reduced-motion: no-preference)');
  var wideQ = matchMedia('(min-width: 760px)');

  var $ = function (s) { return document.querySelector(s); };
  var vline = $('#vline'), hline = $('#hline'), node = $('#node'),
      hero = $('.hero'), tl = $('#tl'), yearEl = $('#year'),
      end = $('#contact'), prog = $('#progress'), guy = $('#guy'),
      ring = $('#ring'), waveAnchor = $('#wave-anchor');
  var stations = [].slice.call(document.querySelectorAll('.station'));
  var cards = [].slice.call(document.querySelectorAll('#ring .card'));

  var YEARS = ['2025', '2025', '2026', '2026', '2026'];
  var N = cards.length, STEP = 360 / N, RADIUS = 340, SPACING = 600;

  var vw = innerWidth, vh = innerHeight, maxScroll = 1;

  function userMotionOff() {
    try { return localStorage.getItem('bw-motion') === 'off'; } catch (e) { return false; }
  }

  function shouldScene() {
    return motionQ.matches && wideQ.matches && !userMotionOff();
  }

  function inScene() { return html.classList.contains('scene'); }

  var ease = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); };

  /* Eased settling: cards dwell facing front at each integer stop
     instead of drifting continuously. u in [0, N-1]. */
  var DWELL = 0.18;
  function settle(u) {
    if (u <= 0) return 0;
    if (u >= N - 1) return N - 1;
    var f = Math.floor(u), fr = u - f;
    var g = fr < DWELL ? 0 : fr > 1 - DWELL ? 1 : ease((fr - DWELL) / (1 - 2 * DWELL));
    return f + g;
  }

  function measure() {
    vw = innerWidth;
    vh = innerHeight;
    maxScroll = Math.max(1, document.body.scrollHeight - vh);
  }

  function setPose(pose, waving) {
    var want = 'p-' + pose + (waving ? ' waving' : '');
    if (guy.getAttribute('class') !== want) guy.setAttribute('class', want);
  }

  function poseForArc(frac) {
    if (frac <= 0.02 || frac >= 0.98) return 'stand';
    if (frac < 0.22) return 'run';
    if (frac < 0.78) return 'leap';
    return 'stand'; /* landing */
  }

  function placeCards() {
    cards.forEach(function (c, i) {
      c.style.transform =
        'translateX(' + (i * SPACING) + 'px) rotateX(' + (i * STEP) + 'deg) translateZ(' + RADIUS + 'px)';
    });
  }

  function clearInline() {
    [hero, end, tl, yearEl, node, vline, hline, ring, guy]
      .concat(stations, cards)
      .forEach(function (el) { el.removeAttribute('style'); });
    guy.removeAttribute('class');
    end.classList.remove('live');
    prog.style.width = '0';
  }

  /* ---------- the frame ---------- */

  function frame() {
    ticking = false;
    if (!inScene()) return;

    var t = Math.min(1, Math.max(0, scrollY / maxScroll));
    prog.style.width = (t * 100) + '%';

    /* hero */
    var heroFade = ease((t - 0.045) / 0.05);
    hero.style.opacity = 1 - heroFade;
    hero.style.transform = 'translateY(' + (-heroFade * 90) + 'px)';

    /* vertical line: grows to full height, then bottom retracts to the elbow */
    var grow = ease(t / 0.08);
    var retract = ease((t - 0.38) / 0.06);
    vline.style.height = (grow * 100 * (1 - retract * 0.5)) + 'vh';

    /* descent stations: each rides a 0.10 slice of scroll */
    stations.forEach(function (s, i) {
      var s0 = 0.08 + i * 0.10;
      var st = (t - s0) / 0.10;
      if (st < -0.25 || st > 1.4) { s.style.opacity = 0; return; }
      var y = (1 - ease(Math.min(1, Math.max(0, st)))) * 66 - 8;
      s.style.transform = 'translateY(' + y + 'vh)';
      var fadeIn = ease(st / 0.25), fadeOut = 1 - ease((st - 0.85) / 0.3);
      s.style.opacity = Math.max(0, Math.min(fadeIn, fadeOut));
    });

    /* elbow: node lights, branch grows */
    var elbow = ease((t - 0.38) / 0.06);
    node.style.opacity = elbow;

    /* revolve progress, with settling */
    var rtRaw = ease((t - 0.44) / 0.44);
    var uSet = settle(rtRaw * (N - 1));
    var shift = uSet * SPACING;

    /* the whole L slides left so the branch spans the screen */
    var slide = rtRaw > 0 ? Math.min(1, rtRaw * 2.2) : 0;
    var lx = -slide * 38; /* vw */
    vline.style.marginLeft = lx + 'vw';
    node.style.marginLeft = lx + 'vw';
    hline.style.marginLeft = lx + 'vw';
    hline.style.width = (elbow * 46 + slide * 46) + 'vw';

    tl.style.opacity = ease((t - 0.40) / 0.06) * (1 - ease((t - 0.86) / 0.06));
    tl.style.transform = 'translateY(' + ((1 - ease((t - 0.40) / 0.06)) * 20) + 'px)';

    /* ring — NEVER set opacity here: opacity < 1 forces the browser to
       flatten preserve-3d and the whole ring collapses. The fade is
       applied per-card instead (cards are leaf planes, safe to fade). */
    ring.style.transform =
      'translateX(' + (-shift + vw * 0.18) + 'px) rotateX(' + (-uSet * STEP) + 'deg)';
    var ringFade =
      Math.min(1, Math.max(0, (t - 0.42) / 0.04)) * (1 - ease((t - 0.86) / 0.06));
    ring.style.visibility = ringFade <= 0 ? '' : 'visible'; /* CSS default: hidden */

    /* per-card legibility: opacity floor 0.45, no blur, no desaturation */
    var front = 0, best = 1e9;
    cards.forEach(function (c, i) {
      var a = ((i * STEP - uSet * STEP) % 360 + 360) % 360;
      if (a > 180) a = 360 - a;
      var face = 1 - Math.min(1, a / 130);
      var dx = Math.abs(i * SPACING - shift);
      var o = (0.45 + 0.55 * face * Math.max(0, 1 - dx / 1800)) * ringFade;
      c.style.opacity = o > 0.999 ? 1 : o.toFixed(3);
      if (dx < best) { best = dx; front = i; }
    });
    yearEl.textContent = YEARS[front];
    yearEl.style.opacity = (rtRaw > 0.02 && t < 0.86) ? 0.9 : 0;

    /* finale */
    var endIn = ease((t - 0.88) / 0.06);
    end.style.opacity = endIn;
    end.classList.toggle('live', t > 0.88);

    /* ---------- little Bryan ---------- */
    if (t >= 0.90) {
      /* stands beside the contact heading and waves */
      guy.style.opacity = ease((t - 0.90) / 0.05);
      var r = waveAnchor.getBoundingClientRect();
      var gx2 = r.left - vw / 2 + 34;
      var gy2 = r.bottom - vh / 2 + 14; /* feet on the heading baseline */
      guy.style.transform = 'translate(' + gx2 + 'px,' + gy2 + 'px)';
      setPose('stand', true);
    } else if (t > 0.055) {
      guy.style.opacity =
        Math.min(1, (t - 0.055) / 0.03) * (1 - ease((t - 0.86) / 0.04));
      var hop = 0, gx = 0, tilt = 0, frac = 0;
      if (t < 0.40) {
        /* descent: one hop arc per station slice */
        var u = Math.max(0, (t - 0.08) / 0.10);
        frac = u - Math.floor(u);
        hop = Math.sin(Math.PI * frac) * 34;
        tilt = Math.sin(Math.PI * 2 * frac) * 10;
      } else {
        /* rides the (sliding) elbow; hops as each card settles in front */
        frac = uSet - Math.floor(uSet);
        if (uSet >= N - 1) frac = 0;
        hop = Math.sin(Math.PI * frac) * 20;
        tilt = Math.sin(Math.PI * 2 * frac) * 6;
        gx = lx * vw / 100 + 10;
      }
      guy.style.transform =
        'translate(' + gx + 'px,' + (-hop) + 'px) rotate(' + tilt + 'deg)';
      setPose(poseForArc(frac), false);
    } else {
      guy.style.opacity = 0;
      setPose('stand', false);
    }
  }

  /* flow mode keeps only the progress hairline */
  function flowFrame() {
    ticking = false;
    var t = Math.min(1, Math.max(0, scrollY / maxScroll));
    prog.style.width = (t * 100) + '%';
  }

  var ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(inScene() ? frame : flowFrame);
  }, { passive: true });

  addEventListener('resize', function () {
    measure();
    if (inScene()) { placeCards(); frame(); }
  });

  /* ---------- mode switching (viewport / OS setting / user toggle) ---------- */

  function setMode() {
    var want = shouldScene();
    if (want === inScene()) return;
    html.classList.toggle('scene', want);
    clearInline();
    scrollTo(0, 0);
    measure();
    if (want) { placeCards(); frame(); }
  }

  motionQ.addEventListener('change', setMode);
  wideQ.addEventListener('change', setMode);

  /* exposed for the command palette (phase 3) */
  window.__bw = {
    setMode: setMode,
    inScene: inScene,
    /* scroll targets: fraction of the runway per phase */
    jump: function (where) {
      var map = { top: 0, story: 0.10, work: 0.47, contact: 0.96 };
      if (inScene()) {
        scrollTo({ top: map[where] * maxScroll, behavior: 'smooth' });
      } else {
        var el = document.getElementById(where === 'top' ? 'top' : where);
        if (el) el.scrollIntoView({ behavior: motionQ.matches ? 'smooth' : 'auto' });
      }
    }
  };

  /* init */
  measure();
  if (inScene()) { placeCards(); frame(); }
})();
