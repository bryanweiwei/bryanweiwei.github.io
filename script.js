/* Portfolio v4 "Broadsheet Helix, Cinematic Cut" — scene engine.

   Phase A stack: Lenis (weighted scroll) + GSAP ScrollTrigger (all
   choreography). One master scrubbed timeline drives the narrative:

     0––10   hero; the ink line draws down
     10––38  DESCENT: one beat per station (enter, hold, exit)
     39––45  ELBOW: node pops (overshoot), branch grows, a held moment
     45––87  REVOLVE: cards ease front one at a time with playful
              overshoot, dwell, then hand off; the L slides left
     89––100 finale, calm

   Snap labels sit at every composed moment (each station, each front
   card, the finale) so the page settles composed, never in-between.

   Numeric scene state (lines, ring, guy) is tweened on the timeline
   and rendered in one onUpdate; hero/stations/finale elements are
   tweened directly. Flow mode (mobile / reduced motion / no JS / CDN
   failure) never touches GSAP and keeps the v3 static timeline. */

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

  var vw = innerWidth, vh = innerHeight;

  function hasStack() {
    return !!(window.gsap && window.ScrollTrigger && window.Lenis);
  }

  function userMotionOff() {
    try { return localStorage.getItem('bw-motion') === 'off'; } catch (e) { return false; }
  }

  function shouldScene() {
    return motionQ.matches && wideQ.matches && !userMotionOff() && hasStack();
  }

  function inScene() { return html.classList.contains('scene'); }

  function measure() { vw = innerWidth; vh = innerHeight; }

  /* ---------- text splitting (hand-rolled SplitText) ---------- */

  function splitUnits(root, mode) {
    /* wraps text into .ch (chars) or .w (words) spans; keeps child
       elements (em, a) intact; returns the created spans */
    var out = [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return n.textContent.trim() === '' && mode === 'w'
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (nd) {
      var frag = document.createDocumentFragment();
      var parts = mode === 'ch'
        ? nd.textContent.split('')
        : nd.textContent.split(/(\s+)/);
      parts.forEach(function (p) {
        if (p === '') return;
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
        var s = document.createElement('span');
        s.className = mode === 'ch' ? 'ch' : 'w';
        s.textContent = p;
        frag.appendChild(s);
        out.push(s);
      });
      nd.parentNode.replaceChild(frag, nd);
    });
    return out;
  }

  /* hero: char-level split needs an SR-safe mirror */
  var heroSplit = null;
  function splitHero() {
    if (heroSplit) return heroSplit;
    var h1 = hero.querySelector('h1');
    var sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = 'Ships real things for real people.';
    h1.insertBefore(sr, h1.firstChild);
    var rows = [].slice.call(h1.querySelectorAll('.row'));
    rows.forEach(function (r) { r.setAttribute('aria-hidden', 'true'); });
    heroSplit = rows.map(function (r) { return splitUnits(r, 'ch'); });
    return heroSplit;
  }

  var wordSplits = { st: null, end: null };
  function splitCopy() {
    if (!wordSplits.st) {
      wordSplits.st = stations.map(function (s) {
        return splitUnits(s.querySelector('h3'), 'w');
      });
    }
    if (!wordSplits.end) {
      var h2 = end.querySelector('h2');
      var link = h2.querySelector('a');
      var words = splitUnits(h2, 'w');
      /* the link stays whole (one unit) so it remains a single tab stop */
      wordSplits.end = words.filter(function (w) { return !link.contains(w); }).concat([link]);
    }
  }

  /* ---------- geometry ---------- */

  function placeCards() {
    cards.forEach(function (c, i) {
      c.style.transform =
        'translateX(' + (i * SPACING) + 'px) rotateX(' + (i * STEP) + 'deg) translateZ(' + RADIUS + 'px)';
    });
  }

  /* ---------- little Bryan (Phase A: v3 behavior, timeline-driven) ---------- */

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
    return 'stand';
  }

  /* ---------- the master timeline ---------- */

  var S = null;      /* numeric scene state, tweened by the timeline */
  var master = null;
  var lenis = null;

  /* ---------- Three.js layer: the ink line in real depth ----------
     Owns: the L as a 3D tube (receding in z, drawn by scroll), the
     elbow node, drifting ink specks at three depths, paper fog, and
     the camera swing around the bend. Cards/type stay DOM for
     crispness; the camera only performs when no DOM-registered
     element is on screen (the elbow window), so registration between
     the GL line and DOM dots never breaks. Renders on demand only. */

  var GL = { ready: false };
  var onSceneMouse = null;

  function glPx2World() {
    /* camera z=10, fov 40: world units per CSS pixel */
    return (2 * 10 * Math.tan(20 * Math.PI / 180)) / vh;
  }

  function buildTubes() {
    var w = glPx2World();
    var hh = (vh / 2) * w;          /* half screen height in world */
    var branchMax = vw * w;         /* longest the branch can get */

    if (GL.vTube) {
      GL.group.remove(GL.vTube); GL.vTube.geometry.dispose();
      GL.group.remove(GL.bTube); GL.bTube.geometry.dispose();
    }

    /* vertical: top of screen (receded) down through the corner to
       the bottom of screen; the below-corner tail retracts later */
    var vPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, hh * 1.02, -1.35),
      new THREE.Vector3(0, hh * 0.45, -0.55),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -hh * 0.55, 0.3),
      new THREE.Vector3(0, -hh * 1.02, 0.45)
    ], false, 'catmullrom', 0.0);
    var vGeo = new THREE.TubeGeometry(vPath, 120, 1.6 * w, 6, false);
    GL.vTube = new THREE.Mesh(vGeo, GL.inkMat);
    GL.vIndexCount = vGeo.index.count;
    GL.vTube.geometry.setDrawRange(0, 0);
    GL.group.add(GL.vTube);

    /* branch: a small bend at the corner, then out right, receding */
    var bPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, hh * 0.045, 0),
      new THREE.Vector3(0.004, hh * 0.008, 0),
      new THREE.Vector3(hh * 0.045, 0, 0.004),
      new THREE.Vector3(branchMax * 0.55, 0, -0.35),
      new THREE.Vector3(branchMax * 1.02, 0, -0.8)
    ], false, 'catmullrom', 0.12);
    var bGeo = new THREE.TubeGeometry(bPath, 140, 1.6 * w, 6, false);
    GL.bTube = new THREE.Mesh(bGeo, GL.inkMat);
    GL.bIndexCount = bGeo.index.count;
    GL.bTube.geometry.setDrawRange(0, 0);
    GL.group.add(GL.bTube);

    GL.node.scale.setScalar(1);
    GL.nodeBase = 5.5 * w;
  }

  function initGL() {
    if (!window.THREE) return false;
    var canvas = document.getElementById('gl');
    try {
      GL.renderer = new THREE.WebGLRenderer({
        canvas: canvas, alpha: true, antialias: true
      });
    } catch (e) { return false; }

    GL.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    GL.renderer.setSize(vw, vh, false);

    GL.scene = new THREE.Scene();
    GL.scene.fog = new THREE.Fog(0xf4f9f5, 10.4, 13.2);

    GL.camera = new THREE.PerspectiveCamera(40, vw / vh, 0.1, 40);
    GL.camera.position.set(0, 0, 10);

    GL.inkMat = new THREE.MeshBasicMaterial({ color: 0x0e1611 });
    GL.group = new THREE.Group();
    GL.scene.add(GL.group);

    /* elbow node: ink core + mint halo */
    var w = glPx2World();
    GL.node = new THREE.Group();
    var core = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x41b06e })
    );
    var halo = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 2.6, 24),
      new THREE.MeshBasicMaterial({
        color: 0x41b06e, transparent: true, opacity: 0.25, side: THREE.DoubleSide
      })
    );
    GL.node.add(core);
    GL.node.add(halo);
    GL.node.position.set(0, 0, 0.02);
    GL.group.add(GL.node);

    /* ink specks at three depths (parallax rates) */
    GL.specks = [];
    [[-2.6, 0.25, 0.05], [-1.2, 0.5, 0.1], [0.8, 1.0, 0.2]].forEach(function (cfg) {
      var g = new THREE.BufferGeometry();
      var pts = [];
      for (var i = 0; i < 18; i++) {
        pts.push((Math.random() - 0.5) * 13, (Math.random() - 0.5) * 9, cfg[0]);
      }
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      var m = new THREE.PointsMaterial({
        color: 0x0e1611, size: 0.028 + cfg[2] * 0.05,
        transparent: true, opacity: 0.16 + cfg[2]
      });
      var p = new THREE.Points(g, m);
      p.userData.rate = cfg[1];
      GL.scene.add(p);
      GL.specks.push(p);
    });

    buildTubes();

    GL.need = true;
    gsap.ticker.add(glTick);
    GL.ready = true;
    html.classList.add('gl');
    return true;
  }

  function glTick() {
    if (!GL.ready || !GL.need) return;
    GL.need = false;
    GL.renderer.render(GL.scene, GL.camera);
  }

  function updateGL(p) {
    if (!GL.ready) return;
    var w = glPx2World();

    /* line draw state (same formulas that drive the DOM fallback) */
    var vFrac = S.grow * (1 - S.retract * 0.5);
    GL.vTube.geometry.setDrawRange(0, Math.round(GL.vIndexCount * vFrac));

    var branchFrac = (S.elbow * 46 + S.slide * 46) / 94;
    GL.bTube.geometry.setDrawRange(0, Math.round(GL.bIndexCount * branchFrac));

    /* the L slides left with the revolve */
    var lxWorld = (-S.slide * 38 / 100) * vw * w;
    GL.group.position.x = lxWorld;

    /* node pop */
    var ns = GL.nodeBase * (0.001 + S.elbow);
    GL.node.scale.setScalar(ns);
    GL.node.children[1].material.opacity = 0.25 * S.elbow;

    /* camera: swing around the bend (only during the elbow window),
       plus a breathing dolly during the descent beats */
    var theta = S.swing * 0.4;
    var dolly = 0;
    if (p > 10 && p < 38.5) {
      var sfrac = ((p - 10) / 9.5) % 1;
      dolly = 0.45 * Math.sin(Math.PI * sfrac);
    }
    var pivotX = GL.group.position.x;
    GL.camera.position.x = pivotX + Math.sin(theta) * 10;
    GL.camera.position.z = Math.cos(theta) * (10 - dolly);
    GL.camera.lookAt(pivotX, 0, 0);

    /* specks drift upward at depth-dependent rates */
    GL.specks.forEach(function (sp) {
      var travel = (p / 100) * 7 * sp.userData.rate;
      sp.position.y = ((travel % 9) + 9) % 9 - 4.5;
      sp.position.x = (GL.mouseX || 0) * 0.3 * sp.userData.rate;
    });

    GL.need = true;
  }

  function killGL() {
    if (!GL.ready) return;
    gsap.ticker.remove(glTick);
    GL.renderer.dispose();
    html.classList.remove('gl');
    GL.ready = false;
  }

  function lenisRaf(time) { lenis.raf(time * 1000); }

  function renderScene() {
    /* p is timeline TIME in units (0..100), not progress — all phase
       thresholds below are authored in these units */
    var p = master ? master.time() : 0;
    prog.style.width = (master ? master.progress() * 100 : 0) + '%';

    /* lines */
    var lx = -S.slide * 38;
    vline.style.height = (S.grow * 100 * (1 - S.retract * 0.5)) + 'vh';
    vline.style.marginLeft = lx + 'vw';
    node.style.marginLeft = lx + 'vw';
    hline.style.marginLeft = lx + 'vw';
    hline.style.width = (S.elbow * 46 + S.slide * 46) + 'vw';

    /* ring */
    var MAG = 1300 / (1300 - RADIUS);
    var ringX = Math.max(0, Math.min(vw * 0.18, (vw / 2 - 300) / MAG));
    var u = S.u;
    var shift = u * SPACING;
    ring.style.transform =
      'translateX(' + (-shift + ringX) + 'px) rotateX(' + (-u * STEP) + 'deg)';
    ring.style.pointerEvents = S.ringIn > 0 ? 'auto' : 'none';

    var front = 0, best = 1e9;
    cards.forEach(function (c, i) {
      var a = ((i * STEP - u * STEP) % 360 + 360) % 360;
      if (a > 180) a = 360 - a;
      var face = 1 - Math.min(1, a / 130);
      var dx = Math.abs(i * SPACING - shift);
      var o = (0.45 + 0.55 * face * Math.max(0, 1 - dx / 1800)) * S.ringIn;
      c.style.opacity = o > 0.999 ? 1 : o.toFixed(3);
      if (dx < best) { best = dx; front = i; }
    });
    yearEl.textContent = YEARS[front];
    yearEl.style.opacity = S.ringIn > 0.25 ? 0.9 : 0;

    /* soft shadow the front card casts on the paper behind it */
    var bestFace = (function () {
      var a = ((front * STEP - u * STEP) % 360 + 360) % 360;
      if (a > 180) a = 360 - a;
      return 1 - Math.min(1, a / 130);
    })();
    var shadow = document.getElementById('ring-shadow');
    if (shadow) {
      var MAG2 = 1300 / (1300 - RADIUS);
      var sx = vw / 2 + ringX * MAG2 - 280;
      var widen = 1.25 - 0.35 * bestFace;   /* wider + lighter mid-flip */
      shadow.style.transform =
        'translate(' + sx + 'px, ' + (168 + 26 * (1 - bestFace)) + 'px) scale(' + widen + ', 1)';
      shadow.style.opacity = (S.ringIn * (0.35 + 0.5 * bestFace)).toFixed(3);
    }

    updateGL(p);

    end.classList.toggle('live', p > 90);

    /* ---- little Bryan ---- */
    if (p >= 91) {
      guy.style.opacity = Math.min(1, (p - 91) / 4);
      var r = waveAnchor.getBoundingClientRect();
      guy.style.transform =
        'translate(' + (r.left - vw / 2 + 34) + 'px,' + (r.bottom - vh / 2 + 14) + 'px)';
      setPose('stand', true);
    } else if (p > 6) {
      /* fades out while the camera swings the bend (he ducks around it) */
      guy.style.opacity =
        Math.min(1, (p - 6) / 3) * Math.max(0, Math.min(1, (89 - p) / 3)) *
        (1 - (S.swing || 0));
      var hop = 0, gx = 0, tilt = 0, frac = 0;
      if (p < 39) {
        var uu = Math.max(0, (p - 10) / 9.5);
        frac = uu - Math.floor(uu);
        hop = Math.sin(Math.PI * frac) * 34;
        tilt = Math.sin(Math.PI * 2 * frac) * 10;
      } else {
        frac = u - Math.floor(u);
        if (u >= N - 1 || u <= 0) frac = 0;
        hop = Math.sin(Math.PI * frac) * 20;
        tilt = Math.sin(Math.PI * 2 * frac) * 6;
        gx = lx * vw / 100 + 10;
      }
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

  function buildScene() {
    placeCards();
    splitHero();
    splitCopy();
    measure();

    gsap.registerPlugin(ScrollTrigger);

    /* Lenis: the weight */
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);

    /* Route ScrollTrigger's reads/writes through Lenis so the snap
       tween and Lenis never fight over the scroll position. */
    ScrollTrigger.scrollerProxy(window, {
      scrollTop: function (value) {
        if (arguments.length) { lenis.scrollTo(value, { immediate: true }); return; }
        return lenis.scroll;
      },
      getBoundingClientRect: function () {
        return { top: 0, left: 0, width: innerWidth, height: innerHeight };
      }
    });

    S = { grow: 0, retract: 0, elbow: 0, slide: 0, u: 0, ringIn: 0, swing: 0 };

    /* ghost station numerals: a deeper parallax layer behind the text */
    var ghosts = stations.map(function (st, i) {
      var g = st.querySelector('.st-ghost');
      if (!g) {
        g = document.createElement('span');
        g.className = 'st-ghost';
        g.setAttribute('aria-hidden', 'true');
        g.textContent = ['i.', 'ii.', 'iii.'][i];
        st.appendChild(g);
      }
      return g;
    });

    initGL();

    /* mouse parallax: specks (GL) + ghost numerals; the tube stays
       registered with the DOM dots, so it never shifts with cursor */
    var ghostX = ghosts.map(function (g) { return gsap.quickTo(g, 'x', { duration: 0.6, ease: 'power2.out' }); });
    onSceneMouse = function (e) {
      var mx = (e.clientX / vw) * 2 - 1;
      GL.mouseX = mx;
      GL.need = true;
      ghostX.forEach(function (fn) { fn(mx * -12); });
    };
    addEventListener('mousemove', onSceneMouse, { passive: true });

    /* hero entrance: staggered character rise, line by line (load, not scroll) */
    gsap.set(hero.querySelectorAll('.rise'), { y: 0 });
    heroSplit.forEach(function (chars, row) {
      gsap.from(chars, {
        yPercent: 118,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.022,
        delay: 0.15 + row * 0.14
      });
    });

    /* snap to the NEAREST composed moment (label), ignoring velocity
       projection — Lenis supplies the inertia; snap only tidies the
       landing so the page always rests composed */
    var labelRatios = [];
    function nearestLabel(value, self) {
      /* ST hands us a velocity-projected value; a hard flick projects
         to the extremes. Snap from ACTUAL progress instead — Lenis
         supplies the inertia, snap only tidies the landing. */
      var from = self ? self.progress : value;
      var best = 0, bd = 2;
      for (var i = 0; i < labelRatios.length; i++) {
        var d = Math.abs(labelRatios[i] - from);
        if (d < bd) { bd = d; best = labelRatios[i]; }
      }
      return best;
    }

    master = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '#runway',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        snap: {
          snapTo: nearestLabel,
          duration: { min: 0.25, max: 0.8 },
          ease: 'power3.inOut',
          delay: 0.12
        }
      },
      onUpdate: renderScene
    });

    master.addLabel('top', 0);

    /* the line draws down while the hero holds, then the hero lifts away */
    master.to(S, { grow: 1, duration: 8, ease: 'power2.inOut' }, 0);
    master.to(hero, { opacity: 0, y: -90, duration: 5, ease: 'power1.in' }, 4.5);

    /* DESCENT — one beat per station: enter (settle), hold, exit */
    stations.forEach(function (st, i) {
      var t0 = 10 + i * 9.5;
      var words = wordSplits.st[i];
      gsap.set(st, { opacity: 0 });
      master.fromTo(st, { y: '58vh', opacity: 0 },
        { y: '0vh', opacity: 1, duration: 4, ease: 'expo.out' }, t0);
      master.from(words, {
        yPercent: 90, opacity: 0, duration: 2.4,
        ease: 'power3.out', stagger: 0.12
      }, t0 + 0.6);
      master.addLabel('st' + i, t0 + 5.2);
      master.to(st, { y: '-62vh', opacity: 0, duration: 3.5, ease: 'power2.in' }, t0 + 6);
      /* the ghost numeral travels slower and linearly: depth */
      var ghost = st.querySelector('.st-ghost');
      if (ghost) {
        master.fromTo(ghost, { y: '26vh' }, { y: '-14vh', duration: 9.5, ease: 'none' }, t0);
      }
    });

    /* ELBOW — a held moment: retract, node pops with overshoot, branch grows */
    master.to(S, { retract: 1, duration: 4, ease: 'power2.inOut' }, 39);
    master.fromTo(node, { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 2.2, ease: 'back.out(2.5)' }, 40);
    master.to(S, { elbow: 1, duration: 4, ease: 'expo.out' }, 40.5);
    master.fromTo(tl, { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 3, ease: 'power2.out' }, 41);

    /* the camera swings around the bend and back — the held moment */
    master.to(S, { swing: 1, duration: 3, ease: 'power2.inOut' }, 39);
    master.to(S, { swing: 0, duration: 3, ease: 'power2.inOut' }, 42.2);
    master.addLabel('elbow', 45.3);

    /* REVOLVE — the L slides out, cards take turns facing front */
    master.to(S, { slide: 1, duration: 6, ease: 'power2.inOut' }, 45);
    master.to(S, { ringIn: 1, duration: 2.5, ease: 'power1.out' }, 45);
    master.addLabel('card0', 48);
    for (var i = 1; i < N; i++) {
      var seg = 48.5 + (i - 1) * 8;
      master.to(S, { u: i, duration: 5.5, ease: 'back.out(1.15)' }, seg);
      master.addLabel('card' + i, seg + 6.6);
    }
    /* ghost year drifts slowly upward through the revolve: depth */
    master.fromTo(yearEl, { y: 36 }, { y: -36, duration: 42, ease: 'none' }, 45);

    /* card4 label ≈ 87.1; ring hands off to the finale */
    master.to(S, { ringIn: 0, duration: 3, ease: 'power1.in' }, 88.5);
    master.to(tl, { opacity: 0, duration: 2, ease: 'power1.in' }, 88.5);

    /* FINALE — calm */
    gsap.set(end, { opacity: 0 });
    master.fromTo(end, { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 5, ease: 'power2.out' }, 90.5);
    master.from(wordSplits.end, {
      yPercent: 60, opacity: 0, duration: 3.2,
      ease: 'power3.out', stagger: 0.09
    }, 91);
    /* pad the tail so the timeline is exactly 100 units — a calm hold
       after the finale, and unit thresholds stay honest */
    var pad = 100 - master.duration();
    if (pad > 0) master.to({ _: 0 }, { _: 1, duration: pad }, master.duration());
    master.addLabel('end', 100);

    /* label positions as progress ratios, for the snap function */
    for (var k in master.labels) labelRatios.push(master.labels[k] / master.duration());

    ScrollTrigger.refresh();
    renderScene();
  }

  function killScene() {
    if (onSceneMouse) {
      removeEventListener('mousemove', onSceneMouse);
      onSceneMouse = null;
    }
    killGL();
    var shadow = document.getElementById('ring-shadow');
    if (shadow) shadow.removeAttribute('style');
    document.querySelectorAll('.st-ghost').forEach(function (g) {
      g.removeAttribute('style');
    });
    if (master) {
      if (master.scrollTrigger) master.scrollTrigger.kill();
      master.kill();
      master = null;
    }
    if (lenis) {
      gsap.ticker.remove(lenisRaf);
      lenis.destroy();
      lenis = null;
    }
    if (window.gsap) {
      gsap.killTweensOf('*');
      var els = [hero, end, tl, node].concat(stations);
      gsap.set(els, { clearProps: 'all' });
      if (heroSplit) gsap.set([].concat.apply([], heroSplit), { clearProps: 'all' });
      if (wordSplits.st) {
        wordSplits.st.forEach(function (ws) { gsap.set(ws, { clearProps: 'all' }); });
        gsap.set(wordSplits.end, { clearProps: 'all' });
      }
    }
    [vline, hline, node, ring, yearEl, guy].concat(cards).forEach(function (el) {
      el.removeAttribute('style');
    });
    guy.classList.remove('p-stand', 'p-run', 'p-leap', 'waving');
    lastPose = '';
    end.classList.remove('live');
    prog.style.width = '0';
  }

  /* flow mode keeps only the progress hairline */
  var ticking = false;
  function flowFrame() {
    ticking = false;
    var max = Math.max(1, document.body.scrollHeight - vh);
    prog.style.width = (Math.min(1, scrollY / max) * 100) + '%';
  }

  addEventListener('scroll', function () {
    if (inScene() || ticking) return;
    ticking = true;
    requestAnimationFrame(flowFrame);
  }, { passive: true });

  addEventListener('resize', function () {
    measure();
    if (inScene()) {
      placeCards();
      if (GL.ready) {
        GL.renderer.setSize(vw, vh, false);
        GL.camera.aspect = vw / vh;
        GL.camera.updateProjectionMatrix();
        buildTubes();
        GL.need = true;
      }
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      renderScene();
    } else {
      syncFlowGuy();
    }
  });

  /* ---------- mode switching ---------- */

  function setMode() {
    var want = shouldScene();
    if (want === inScene()) return;
    if (want) {
      html.classList.add('scene');
      scrollTo(0, 0);
      buildScene();
    } else {
      html.classList.remove('scene');
      killScene();
      scrollTo(0, 0);
    }
    syncFlowGuy();
  }

  motionQ.addEventListener('change', setMode);
  wideQ.addEventListener('change', setMode);

  /* ---------- flow-mode little Bryan (unchanged from v3) ---------- */

  var flowGuyIO = null;

  function guyDockPoint(el) {
    var r = el.getBoundingClientRect();
    var dot = el.querySelector('.dot');
    if (dot) {
      var dr = dot.getBoundingClientRect();
      return { x: dr.left + dr.width / 2 + scrollX, y: dr.top + dr.height / 2 + scrollY };
    }
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
      guy.classList.add('flow-guy');
      moveFlowGuyTo(title, true);
      guy.style.opacity = 1;
      return;
    }

    guy.classList.add('flow-guy');
    var stops = stations.concat(cards);
    var first = true;

    moveFlowGuyTo(stations[0], false);
    setPose('stand', false);
    guy.style.opacity = 1;

    flowGuyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (first) { first = false; guy.classList.add('hopping'); }
        moveFlowGuyTo(e.target, e.target === title);
      });
    }, { rootMargin: '-35% 0px -45% 0px' });

    stops.forEach(function (el) { flowGuyIO.observe(el); });
    flowGuyIO.observe(title);
  }

  /* ---------- palette bridge ---------- */

  window.__bw = {
    setMode: setMode,
    inScene: inScene,
    /* programmatic scrolling must go through Lenis in scene mode
       (native scrollTo bypasses it and the two would fight) */
    scrollToPos: function (pos, opts) {
      if (lenis) lenis.scrollTo(pos, opts || {});
      else scrollTo({ top: pos, behavior: 'auto' });
    },
    jump: function (where) {
      if (inScene() && master && master.scrollTrigger) {
        var label = { top: 'top', story: 'st0', work: 'card0', contact: 'end' }[where];
        var pos = master.scrollTrigger.labelToScroll(label);
        if (lenis) lenis.scrollTo(pos, { duration: 1.4 });
        else scrollTo({ top: pos, behavior: 'smooth' });
      } else {
        var el = document.getElementById(where === 'top' ? 'top' : where);
        if (el) el.scrollIntoView({ behavior: motionQ.matches ? 'smooth' : 'auto' });
      }
    }
  };

  /* ---------- init ---------- */

  /* the pre-paint bootstrap can't know if the CDN loaded; correct it here */
  if (inScene() && !hasStack()) html.classList.remove('scene');

  measure();
  if (inScene()) buildScene();
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
