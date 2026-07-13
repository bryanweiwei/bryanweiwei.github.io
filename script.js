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

  var lastPose = '';
  function setPose(pose, waving) {
    var want = pose + (waving ? '+w' : '');
    if (lastPose === want) return;
    lastPose = want;
    guy.classList.remove('p-stand', 'p-run', 'p-leap');
    guy.classList.add('p-' + pose);
    guy.classList.toggle('waving', !!waving);
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
    /* x-offset pushes cards right of the line, but the front card is
       magnified by perspective (1300/(1300-RADIUS) ≈ 1.354): clamp the
       offset so its apparent box never leaves the viewport */
    var MAG = 1300 / (1300 - RADIUS);
    var ringX = Math.max(0, Math.min(vw * 0.18, (vw / 2 - 300) / MAG));
    ring.style.transform =
      'translateX(' + (-shift + ringX) + 'px) rotateX(' + (-uSet * STEP) + 'deg)';
    var ringFade =
      Math.min(1, Math.max(0, (t - 0.42) / 0.04)) * (1 - ease((t - 0.86) / 0.06));
    ring.style.pointerEvents = ringFade > 0 ? 'auto' : 'none';

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
      /* springy landing: brief squash as the feet touch down */
      var sy = 1;
      if (frac > 0.8 && frac < 0.98) {
        sy = 1 - 0.09 * Math.sin(Math.PI * (frac - 0.8) / 0.18);
      }
      guy.style.transform =
        'translate(' + gx + 'px,' + (-hop) + 'px) rotate(' + tilt + 'deg) scale(1,' + sy + ')';
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
    syncFlowGuy();
  }

  motionQ.addEventListener('change', setMode);
  wideQ.addEventListener('change', setMode);

  /* ---------- flow-mode little Bryan ----------
     Hops station to station down the left timeline as sections come
     into view (cheap 2D translate), waves at the contact heading.
     Reduced motion: a single static standing pose by the contact
     heading, no animation. */

  var flowGuyIO = null;

  function guyDockPoint(el) {
    /* the dot each element attaches to on the timeline */
    var r = el.getBoundingClientRect();
    var dot = el.querySelector('.dot');
    if (dot) {
      var dr = dot.getBoundingClientRect();
      return { x: dr.left + dr.width / 2 + scrollX, y: dr.top + dr.height / 2 + scrollY };
    }
    /* cards: their ::before dot (10px + 2px border) hangs left of the card */
    var beforeLeft = parseFloat(getComputedStyle(el, '::before').left) || -39;
    return { x: r.left + beforeLeft + 7 + scrollX, y: r.top + 35 + scrollY };
  }

  function moveFlowGuyTo(el, wave) {
    var p;
    if (el.id === 'contact-title') {
      var r = el.getBoundingClientRect();
      p = { x: r.left + scrollX + 10, y: r.top + scrollY - 8 };
      guy.style.transform =
        'translate(' + (p.x) + 'px,' + (p.y - 50) + 'px)';
    } else {
      p = guyDockPoint(el);
      guy.style.transform =
        'translate(' + (p.x - 19) + 'px,' + (p.y - 48) + 'px)';
    }
    setPose(wave ? 'stand' : 'leap', !!wave);
    if (!wave) {
      clearTimeout(moveFlowGuyTo._t);
      moveFlowGuyTo._t = setTimeout(function () { setPose('stand', false); }, 650);
    }
  }

  function teardownFlowGuy() {
    if (flowGuyIO) { flowGuyIO.disconnect(); flowGuyIO = null; }
    guy.classList.remove('flow-guy', 'hopping');
    guy.removeAttribute('style');
  }

  function syncFlowGuy() {
    teardownFlowGuy();
    if (inScene()) return;

    var title = document.getElementById('contact-title');

    if (!motionQ.matches) {
      /* reduced motion: static standing pose by the contact heading
         (the wave keyframe is neutralized by the reduce media block) */
      guy.classList.add('flow-guy');
      moveFlowGuyTo(title, true);
      guy.style.opacity = 1;
      return;
    }

    guy.classList.add('flow-guy');
    var stops = stations.concat(cards);
    var first = true;

    /* park him at the first station dot to start */
    moveFlowGuyTo(stations[0], false);
    setPose('stand', false);
    guy.style.opacity = 1;

    flowGuyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (first) { first = false; guy.classList.add('hopping'); }
        if (e.target === title) {
          moveFlowGuyTo(title, true);
        } else {
          moveFlowGuyTo(e.target, false);
        }
      });
    }, { rootMargin: '-35% 0px -45% 0px' });

    stops.forEach(function (el) { flowGuyIO.observe(el); });
    flowGuyIO.observe(title);
  }

  addEventListener('resize', function () {
    if (!inScene()) syncFlowGuy();
  });

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
  syncFlowGuy();
})();

/* ============================================================
   Feature layer: command palette, GitHub strip, copy-as-markdown
   ============================================================ */

(function () {
  'use strict';

  var isMac = /Mac|iP(hone|ad|od)/.test(navigator.platform);

  /* ---------- copy helpers ---------- */

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); }
      catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  /* Markdown mirror of the page (kept in sync with llms.txt by hand;
     no build step to generate one from the other). */
  var PAGE_MD = [
    '# Bryan Wei',
    '',
    '> NYU Stern \'29 (Business, Technology, and Entrepreneurship). Ships real things for real people. Building from Taipei, New York, and Kuala Lumpur.',
    '',
    'Contact: bryan.wei@stern.nyu.edu · https://www.linkedin.com/in/wei-bryan/',
    '',
    '## The story, in three cities',
    '',
    '- **Taipei (2007–2025):** Grew up around technology, the kind that changes how people live and work. That proximity shaped what feels worth building.',
    '- **New York (2025–now):** Business, Technology, and Entrepreneurship at NYU Stern. Business student. Builds anyway.',
    '- **Kuala Lumpur (Summer 2026):** A summer of building from anywhere. Three cities so far. Same habit: find a real person with a real problem, then ship.',
    '',
    '## The work, in order',
    ''
  ];

  document.querySelectorAll('#ring .card').forEach(function (c) {
    var title = c.querySelector('h3').textContent;
    var no = c.querySelector('.no').textContent;
    var tag = c.querySelector('.tag').textContent;
    var body = c.querySelector('h3 + p').textContent;
    var link = c.querySelector('.card-link a');
    var forLine = c.querySelector('.for').textContent;
    PAGE_MD.push('### ' + no + ' · ' + title + ' — ' + tag, '', body);
    if (link) PAGE_MD.push('Prototype: ' + link.href);
    PAGE_MD.push(forLine + '.', '');
  });

  PAGE_MD.push('## Stats', '', '- 3 cities shipped from', '- 5+ real builds', '- 1 hospital pilot informed', '');

  var copyBtn = document.getElementById('copy-md');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      copyText(PAGE_MD.join('\n')).then(function () {
        copyBtn.textContent = 'Copied ✓';
        setTimeout(function () { copyBtn.textContent = 'Copy this page as Markdown'; }, 1800);
      }, function () {
        copyBtn.textContent = 'Copy failed';
        setTimeout(function () { copyBtn.textContent = 'Copy this page as Markdown'; }, 1800);
      });
    });
  }

  /* ---------- GitHub activity strip ---------- */

  (function github() {
    var box = document.getElementById('gh');
    var list = document.getElementById('gh-list');
    if (!box || !list) return;

    function rel(iso) {
      var s = (Date.now() - new Date(iso).getTime()) / 1000;
      if (s < 3600) return Math.max(1, Math.round(s / 60)) + 'm ago';
      if (s < 86400) return Math.round(s / 3600) + 'h ago';
      return Math.round(s / 86400) + 'd ago';
    }

    function phrase(ev) {
      var repo = ev.repo ? ev.repo.name : '';
      switch (ev.type) {
        case 'PushEvent':
          var n = ev.payload && ev.payload.commits ? ev.payload.commits.length : 1;
          return 'Pushed ' + n + ' commit' + (n === 1 ? '' : 's') + ' to <b>' + repo + '</b>';
        case 'CreateEvent':
          return 'Created ' + (ev.payload ? ev.payload.ref_type : 'repo') + ' in <b>' + repo + '</b>';
        case 'PullRequestEvent':
          return (ev.payload && ev.payload.action === 'closed' ? 'Merged' : 'Opened') + ' a pull request in <b>' + repo + '</b>';
        case 'IssuesEvent':
          return 'Issue activity in <b>' + repo + '</b>';
        case 'WatchEvent':
          return 'Starred <b>' + repo + '</b>';
        case 'ForkEvent':
          return 'Forked <b>' + repo + '</b>';
        case 'ReleaseEvent':
          return 'Published a release in <b>' + repo + '</b>';
        default:
          return 'Activity in <b>' + repo + '</b>';
      }
    }

    function render(events) {
      var seen = [];
      events.some(function (ev) {
        var p = phrase(ev);
        if (seen.some(function (s) { return s.p === p; })) return false;
        seen.push({ p: p, t: ev.created_at });
        return seen.length >= 4;
      });
      if (!seen.length) return;
      list.innerHTML = seen.map(function (s) {
        return '<li>' + s.p + ' · ' + rel(s.t) + '</li>';
      }).join('');
      box.hidden = false;
    }

    try {
      var cached = sessionStorage.getItem('bw-gh');
      if (cached) {
        var c = JSON.parse(cached);
        if (Date.now() - c.at < 30 * 60 * 1000) { render(c.events); return; }
      }
    } catch (e) { /* fall through to fetch */ }

    fetch('https://api.github.com/users/bryanweiwei/events/public')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (events) {
        if (!Array.isArray(events)) return;
        try {
          sessionStorage.setItem('bw-gh', JSON.stringify({ at: Date.now(), events: events.slice(0, 12) }));
        } catch (e) { /* cache is best-effort */ }
        render(events);
      })
      .catch(function () { /* strip stays hidden */ });
  })();

  /* ---------- command palette ---------- */

  var palette = document.getElementById('palette');
  var input = document.getElementById('palette-input');
  var listEl = document.getElementById('palette-list');
  var btn = document.getElementById('pal-btn');
  var keyLabel = document.getElementById('pal-key');
  if (!palette || !input || !listEl) return;

  if (keyLabel && isMac) keyLabel.textContent = '⌘K';

  function motionOff() {
    try { return localStorage.getItem('bw-motion') === 'off'; } catch (e) { return false; }
  }

  function ACTIONS() {
    return [
      { label: 'Jump to top', hint: 'Jump', run: function () { window.__bw.jump('top'); } },
      { label: 'Jump to the story', hint: 'Jump', run: function () { window.__bw.jump('story'); } },
      { label: 'Jump to the work', hint: 'Jump', run: function () { window.__bw.jump('work'); } },
      { label: 'Jump to contact', hint: 'Jump', run: function () { window.__bw.jump('contact'); } },
      { label: 'Copy email address', hint: 'Copy', run: function () { copyText('bryan.wei@stern.nyu.edu'); } },
      { label: 'Copy this page as Markdown', hint: 'Copy', run: function () { copyText(PAGE_MD.join('\n')); } },
      {
        label: motionOff() ? 'Turn the scroll experience on' : 'Turn the scroll experience off',
        hint: 'Toggle',
        run: function () {
          try { localStorage.setItem('bw-motion', motionOff() ? 'on' : 'off'); } catch (e) {}
          window.__bw.setMode();
        }
      },
      { label: 'Open GitHub profile', hint: 'Open', run: function () { open('https://github.com/bryanweiwei', '_blank', 'noopener'); } },
      { label: 'Open LinkedIn', hint: 'Open', run: function () { open('https://www.linkedin.com/in/wei-bryan/', '_blank', 'noopener'); } }
    ];
  }

  var current = [], sel = 0, lastFocus = null;

  function renderList() {
    var q = input.value.trim().toLowerCase();
    current = ACTIONS().filter(function (a) {
      return !q || a.label.toLowerCase().indexOf(q) !== -1;
    });
    sel = Math.min(sel, Math.max(0, current.length - 1));
    listEl.innerHTML = current.map(function (a, i) {
      return '<li role="option" data-i="' + i + '"' +
        (i === sel ? ' class="sel" aria-selected="true"' : ' aria-selected="false"') +
        '><span>' + a.label + '</span><span class="hintk">' + a.hint + '</span></li>';
    }).join('');
  }

  function openPal() {
    lastFocus = document.activeElement;
    palette.hidden = false;
    input.value = '';
    sel = 0;
    renderList();
    input.focus();
  }

  function closePal() {
    palette.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function runSel() {
    if (!current[sel]) return;
    var action = current[sel];
    closePal();
    action.run();
  }

  addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      palette.hidden ? openPal() : closePal();
      return;
    }
    if (palette.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closePal(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, current.length - 1); renderList(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); renderList(); }
    else if (e.key === 'Enter') { e.preventDefault(); runSel(); }
  });

  input.addEventListener('input', function () { sel = 0; renderList(); });

  listEl.addEventListener('click', function (e) {
    var li = e.target.closest('li');
    if (!li) return;
    sel = +li.dataset.i;
    runSel();
  });

  listEl.addEventListener('mousemove', function (e) {
    var li = e.target.closest('li');
    if (!li || +li.dataset.i === sel) return;
    sel = +li.dataset.i;
    renderList();
  });

  document.getElementById('palette-backdrop')
    .addEventListener('click', closePal);

  if (btn) btn.addEventListener('click', openPal);
})();
