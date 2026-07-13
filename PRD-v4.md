# PRD v4 — "Broadsheet Helix, Cinematic Cut"

**Goal:** Re-platform the v3 experience onto a real cinematic interaction stack. Keep the v3 narrative and art direction (paper broadsheet, ink line, city stations, elbow, revolving work, little Bryan); replace the mechanics so the page *feels* expensive: weighted scroll, choreographed motion, real depth.
**Critical framing:** v3 (`redesign-v3`) is the FLOOR, not the target. Every scene should feel meaningfully richer than its v3 counterpart. When in doubt, go more cinematic; Bryan will pull it back if it's too much (that has never been the failure mode so far — twice now the failure was too subtle).

## 0. Constraints
- Branch `redesign-v4` off `redesign-v3`. Never touch main. Commit per phase.
- Static hosting (GitHub Pages), no build step — but **CDN libraries are now explicitly ALLOWED and expected**: Lenis, GSAP + ScrollTrigger, Three.js (pin versions, load from cdnjs/jsdelivr). This supersedes all earlier "no external deps" rules.
- Keep: all v3 content/copy, palette + GitHub strip + llms.txt, designed mobile fallback, reduced-motion static render, a11y standard, no em-dashes in copy.
- **Checkpoint protocol (NOT fully unattended):** stop after each phase and tell Bryan to look before continuing. Taste cannot be batch-processed.

## 1. The interaction stack (the "$20k ingredients")
1. **Lenis** — weighted, inertial smooth scrolling. The page should feel like it has mass; this alone changes everything. Sync Lenis to ScrollTrigger.
2. **GSAP ScrollTrigger** — ALL scroll choreography moves here. Scrubbed timelines with real easing (expo/power curves, springs, overshoot), pinning, snap points so each station and each front-facing card settles composed. Staggered character/word reveals on headlines (SplitText-style; hand-split if the plugin's unavailable).
3. **Three.js** — the scene gains real depth. Options in ascending ambition (pick what stays coherent with the broadsheet aesthetic — ink-on-paper rendered in 3D, NOT generic glossy WebGL):
   - the ink line as a real 3D tube that draws itself, with the camera dollying along it (vertical, around the bend, then horizontal);
   - project cards as paper planes in 3D space with soft shadows, slight tilt toward cursor, depth-of-field-ish atmosphere (subtle fog/grain);
   - paper-grain environment with lighting so cards cast believable shadows.
   If full Three.js turns incoherent, an acceptable fallback is GSAP-driven CSS 3D — but with dramatically richer easing, parallax layers, and shadow play than v3. Try Three.js first.

## 2. Motion language (use this vocabulary deliberately)
Weighted scroll; scrubbed timelines; anticipation and overshoot; squash-and-stretch; staggered reveals; parallax at 3+ depths (ghost numerals, line, cards, foreground accents move at different rates); camera dolly, not element slide; sections that PIN and breathe rather than stream past; snap-to-composition; grain + soft shadow for atmosphere. Motion pacing: hero deliberate, descent rhythmic (one beat per station), the bend a held moment, the revolve playful, finale calm.

## 3. Little Bryan — full character pass (non-negotiable, he is the mascot)
Upgrade from pose-swapping to actual character animation:
- run cycle along the line (limbs articulate — animate SVG groups with GSAP timelines);
- jumps with anticipation (crouch), arc, squash-and-stretch landing, small dust puff;
- scarf trails with follow-through (secondary motion);
- idle fidgets when scroll pauses (looks around, adjusts scarf);
- the finale wave stays, now with personality (bounce, head tilt).
He remains hand-drawn ink style. He is the single highest-priority element in this PRD.

## 4. Phases + checkpoints
- **Phase A — feel:** Lenis + move all v3 scroll logic to ScrollTrigger with real easing/snap + headline stagger reveals. STOP → Bryan reviews (the page should already feel transformed with zero visual redesign).
- **Phase B — depth:** Three.js scene (or maximal CSS-3D fallback), parallax layers, shadows, grain, camera-dolly bend. STOP → Bryan reviews.
- **Phase C — character:** little Bryan full animation pass. STOP → Bryan reviews.
- **Phase D — polish + QA:** pacing pass end-to-end, mobile + reduced-motion parity, perf (lazy-init Three.js, target 60fps, test at 1280/1520/768/375), NOTES.md update.

## 5. Done means
Bryan scrolls it and says it feels like the Aura-lesson demos: weighted, directed, deep. Not "matches the mockup."
