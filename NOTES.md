# Redesign v4 "Broadsheet Helix, Cinematic Cut" — build notes

Branch `redesign-v4` (off `redesign-v3`). Main untouched; nothing is live.
Built phase-by-phase with checkpoints per PRD-v4; Bryan reviewed and steered
after every phase (A feel → B depth → C character → D polish).

## The stack (the "$20k ingredients")

All pinned, loaded from CDNs, no build step:

- **Lenis 1.3.4** (jsdelivr) — weighted, inertial scrolling. Integrated with
  ScrollTrigger via `scrollerProxy` so the two never fight over scroll position.
- **GSAP 3.13.0 + ScrollTrigger** (cdnjs) — every scroll behavior lives on one
  master scrubbed timeline (100 authored units) with real easing per beat and
  snap-to-composition (nearest-label, computed from actual progress, because
  ScrollTrigger's velocity projection flings hard flicks to the extremes).
- **Three.js 0.149** (cdnjs, last UMD build) — the ink line as a real 3D tube
  with paper fog, drifting ink specks at three parallax depths, and the camera
  moves. Renders on demand only; verified zero work at idle.

If any CDN script fails, the site silently falls back: no GSAP → static flow
layout; no WebGL → DOM line elements run the same choreography.

## The experience, beat by beat

1. **Hero** (deliberate): character-stagger headline rise; the ink line draws down.
2. **Descent** (rhythmic): one beat per station — enter, settle composed, exit.
   Ghost roman numerals drift behind at a slower parallax rate. Little Bryan
   takes one long readable hop per station gap, grounded at every stop.
3. **The bend** (held): the node pops with overshoot, and the camera swings ~23
   degrees around the corner in 3D — the one moment the scene reveals its depth.
   Confined to the window where nothing DOM-registered is visible, so GL/DOM
   registration never breaks. Little Bryan ducks around the bend.
4. **The revolve** (playful): five cards take turns facing front with eased
   settling. Little Bryan lives ON the cards: sprints across each top edge,
   leaps the gap with full jump animation, lands on the incoming card while it
   is still swinging to center, and keeps moving whenever the scroll moves (no
   parked dwell — verified zero still-frames across a cycle). A soft shadow
   under the front card widens and lightens mid-flip. VOINOSIS (twice the copy)
   gets a dense card variant so it fits every viewport.
5. **The exit** (the signature shot): he hops off the last card onto the line,
   and the camera dollies horizontally along it — cards stream away, the
   vertical and its corner node are left behind, ink specks fly past at three
   speeds, and for a beat it's just the runner on an endless line. The end page
   arrives WITH the camera (slides in from the right as the dolly decelerates),
   and the line eases down and docks as the broadsheet rule under the sign-off.
6. **Home** (calm): he waves from the line at "Say hi." — bounce, wrist
   follow-through, pleased head tilt. Composed snap point; long quiet tail.

## Little Bryan (the mascot got the works)

One articulated SVG rig (hips/knees, shoulders/elbows, neck, scarf) driven by
a parametric pose system. Jumps are pure functions of progress (anticipation
crouch with a real dip, launch stretch, tuck, squash-and-stretch landing, dust
puff) so they play backward when you scrub up. Run cycle speed follows real
displacement. The scarf has spring physics (follow-through). Stop scrolling
anywhere and he settles to a stand, then fidgets (looks around / adjusts the
scarf, alternating); mid-stride stalls settle too instead of freezing. His
card positions are solved from the exact ring-transform math every frame
(`cardTopPoint`), so his feet stay glued at any scroll speed or direction.

## Decisions made autonomously (beyond the PRD text)

1. Choreography for the character runs in tween-time while card positions use
   their eased motion — this is what makes the run/leap/ride timing hold up.
2. Card revolve ease changed from back.out overshoot to power2.inOut: the
   overshoot front-loaded card motion so hard that character beats got no
   scroll-time. The playfulness moved into the leaps themselves.
3. Snap ignores ScrollTrigger's velocity projection (see stack notes).
4. The finale overlay is transparent in scene mode so the line can persist.
5. Three.js 0.149 (not latest) because it is the last classic-script build;
   modern ESM builds would need an import map. Noted as acceptable debt.
6. Little Bryan's on-card perch/run positions, arc heights, and the dolly
   length (~2.2 screen widths) are tuned numbers, all near the top of their
   code blocks for future taste passes.

## Perf posture

- No free-running loops: the master timeline renders on ScrollTrigger updates;
  the GL layer renders only when marked dirty; character writes go silent when
  settled (verified 0 style mutations/sec at true idle through the Lenis path).
- GL: DPR capped at 1.5, ~60 speck points, two tube geometries, no lights or
  shadow maps (the "soft shadow" is a CSS gradient). Three.js only initializes
  in scene mode (desktop + motion allowed).
- Tested at 375 / 768 / 1280 / 1520: all snap stops composed, no console
  errors, no horizontal overflow, html-validate clean, no em-dashes in copy.

## Parity

- **Mobile (<760px)** keeps the v3 designed vertical timeline; little Bryan
  hops down the left line (with landing squash + dust when GSAP is present)
  and waves at the bottom. No scroll-jacking, no Lenis.
- **Reduced motion**: fully static single-column render, zero running
  animations (verified by emulation), little Bryan in a static stand.
- Palette (Ctrl/Cmd+K), GitHub strip, llms.txt, copy-as-Markdown all carried
  over from v3 unchanged; palette jumps map to timeline labels in scene mode.

## Known rough edges (honest list)

- Pausing exactly mid-dolly snaps to the nearer of card-5 / home; before the
  midpoint that means re-running part of the travel in reverse. Watchable, but
  if it bothers you the snap could special-case the dolly window.
- The GL line is absent for the ~1% of desktops without WebGL; the DOM
  fallback line follows the same choreography but without depth/taper.
- `_qa-shots\` (outside the repo) holds ~150 QA screenshots from this run.

## Public-if-merged warning (same as v3)

`PRD.md`, `PRD-v3.md`, `PRD-v4.md`, `design-reference/`, and this `NOTES.md`
will be publicly reachable on the live domain if merged as-is. `llms.txt` is
intentionally public. Delete the internal docs before/after merging if you
prefer: `git rm PRD.md PRD-v3.md PRD-v4.md NOTES.md; git rm -r design-reference`.

## Morning checklist

1. **Review:** `git checkout redesign-v4`, open `index.html` in Chrome
   (hard-refresh, Ctrl+Shift+R). Scroll the whole thing slowly, then flick
   through it fast. Try stopping anywhere; try scrolling backward mid-leap.
   Check your phone (mobile timeline) and, if you can, a reduced-motion pass
   (Windows: Settings → Accessibility → Visual effects → Animation effects off).
2. **Taste pass:** the tuned numbers listed above are all one-line changes —
   say the word and I'll adjust.
3. **Ship:** `git checkout main`, `git merge redesign-v4`, `git push` — pushing
   main deploys it live. (Consider the public-files cleanup first.)
