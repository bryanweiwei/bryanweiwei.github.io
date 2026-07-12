/* Portfolio v2 — motion & interaction.
   Everything here is enhancement: the page is fully usable if none of it runs.
   Motion respects prefers-reduced-motion live (not just at load). */

(function () {
  'use strict';

  var motionQuery = matchMedia('(prefers-reduced-motion: no-preference)');
  var finePointer = matchMedia('(pointer: fine)');
  var hasViewTimeline = CSS.supports('animation-timeline: view()');

  function motionOn() {
    return document.documentElement.classList.contains('js-motion');
  }

  motionQuery.addEventListener('change', function () {
    document.documentElement.classList.toggle('js-motion', motionQuery.matches);
    if (!motionQuery.matches) resetLetters();
  });

  /* ---------- Scroll reveals: IntersectionObserver fallback ----------
     Browsers with CSS scroll-driven animations handle .reveal in pure CSS. */

  if (!hasViewTimeline && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------- Reading progress: JS fallback for scroll() timeline ---------- */

  if (!CSS.supports('animation-timeline: scroll()')) {
    var bar = document.querySelector('.scroll-progress');
    if (bar) {
      var ticking = false;
      var updateBar = function () {
        ticking = false;
        if (!motionOn()) { bar.style.transform = 'scaleX(0)'; return; }
        var max = document.documentElement.scrollHeight - innerHeight;
        var p = max > 0 ? Math.min(1, scrollY / max) : 0;
        bar.style.transform = 'scaleX(' + p + ')';
      };
      addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(updateBar); }
      }, { passive: true });
      updateBar();
    }
  }

  /* ---------- Signature: hero headline reacts to the cursor ----------
     Each letter is a span; letters near the pointer swell in weight
     (Fraunces variable wght), easing back via CSS transition. */

  var letters = [];

  function wrapLetters() {
    document.querySelectorAll('.hero h1 .h1-line').forEach(function (line) {
      var walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          return node.parentNode.closest('svg')
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT;
        }
      });
      var textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);

      textNodes.forEach(function (node) {
        var frag = document.createDocumentFragment();
        node.textContent.split('').forEach(function (chr) {
          if (chr === ' ') {
            frag.appendChild(document.createTextNode(' '));
          } else {
            var span = document.createElement('span');
            span.className = 'ch';
            span.textContent = chr;
            frag.appendChild(span);
            letters.push(span);
          }
        });
        node.parentNode.replaceChild(frag, node);
      });
    });
  }

  function resetLetters() {
    letters.forEach(function (span) {
      span.style.fontVariationSettings = '';
    });
  }

  function initSignature() {
    var hero = document.querySelector('.hero');
    var h1 = document.querySelector('.hero h1');
    if (!hero || !h1) return;

    wrapLetters();

    var BASE = 380, SWELL = 250, SIGMA = 120;
    var pending = false, mx = 0, my = 0;

    function apply() {
      pending = false;
      letters.forEach(function (span) {
        var r = span.getBoundingClientRect();
        var dx = r.left + r.width / 2 - mx;
        var dy = r.top + r.height / 2 - my;
        var d2 = dx * dx + dy * dy;
        var w = BASE + SWELL * Math.exp(-d2 / (2 * SIGMA * SIGMA));
        span.style.fontVariationSettings =
          "'opsz' 144, 'wght' " + Math.round(w);
      });
    }

    hero.addEventListener('mousemove', function (e) {
      if (!motionOn() || !finePointer.matches) return;
      mx = e.clientX;
      my = e.clientY;
      if (!pending) { pending = true; requestAnimationFrame(apply); }
    });

    hero.addEventListener('mouseleave', resetLetters);
  }

  /* ---------- Subtly magnetic nav links & buttons ---------- */

  function initMagnetic() {
    if (!finePointer.matches) return;
    var els = document.querySelectorAll('.nav-links a, .btn');
    els.forEach(function (el) {
      var strength = el.classList.contains('btn') ? 4 : 2.5;
      el.addEventListener('mousemove', function (e) {
        if (!motionOn()) return;
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        var y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        el.style.transform =
          'translate(' + (x * strength).toFixed(1) + 'px, ' +
          (y * strength).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
  }

  initSignature();
  initMagnetic();
})();
