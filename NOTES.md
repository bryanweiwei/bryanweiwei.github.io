# Redesign v3 "Broadsheet Helix" — build notes

Built overnight per PRD-v3.md on branch `redesign-v3` (off `redesign-v2`). Main untouched;
nothing is live. Four commits: core scene, little Bryan, feature layer, QA.

## What you're looking at

The site is now the mockup-d experience with real content:

- **Hero:** giant uppercase Fraunces "SHIPS REAL THINGS FOR *real people.*", line-by-line rise.
- **Descent:** the ink line runs down the screen; Taipei / New York / Kuala Lumpur stations ride past, alternating sides. Little Bryan hops the line between them.
- **Elbow:** green node lights, the line turns horizontal, "the work, in order".
- **Revolve:** five ink-bordered cards revolve around the line in chronological order, each easing to a stop facing front (scroll-driven, with dwell so cards settle rather than drift). Ghost year bottom-right tracks the front card. Back cards keep a 0.45 opacity floor, no blur or desaturation.
- **Finale:** loud "WORKING ON SOMETHING INTERESTING? SAY HI.", stats band, GitHub activity strip, the mint-chip line. Little Bryan stands on the headline baseline and waves.
- **Features:** Ctrl+K / Cmd+K command palette (jump, copy email, copy page as Markdown, toggle the scroll experience on/off), live GitHub strip, `llms.txt`.
- **Mobile (<760px) and no-JS:** a designed vertical timeline (ink line down the left, stations and cards docked to it, little Bryan hops down it and waves at the bottom). **Reduced motion:** same layout, fully static, little Bryan in a single standing pose. These aren't afterthoughts; the static flow layout is the default and the scene is opted into.

## Decisions made autonomously

1. **mockup-d.html is truncated** (cuts off mid-script; no closing tags). The final ~10% — how little Bryan's transform is applied, the finale fade, scroll wiring — is reconstructed from the file's phase-map comments and the PRD. The feel of the ending is my reading of it.
2. **Flow-first architecture:** the mockup defaults to the fixed scene and overrides it in a media query. I inverted that: static layout is the default, JS adds the scene only when viewport ≥760px + motion allowed + not user-disabled. Safer with JS off and simpler to reason about.
3. **No photography.** Mockup-d is purely typographic, so the headshot, project screenshots, and VOINOSIS logo are not on the page. The files remain in `images/` untouched; easy to reintroduce if you miss your face.
4. **Kicker green:** the mockup's `--pop` (#41b06e) fails WCAG contrast for small text on paper, so tiny green labels use a darker `--pop-deep` (#2c7a4a); the bright pop stays for dots, rules, underlines. Slightly less zingy, passes AA.
5. **Card tags/titles from the mockup, descriptions from v2** (per PRD), VOINOSIS updated to past tense + July 2026 completion. The AI Middleware card keeps its live Lovable prototype link. The one em-dash inside a v2 description ("content — recently shipping") became a comma; year ranges use en dashes (2007–2025), which I read as allowed ("no em-dashes").
6. **Ctrl K vs ⌘K:** the nav chip and palette show Ctrl K on Windows/Linux, ⌘K on Mac.
7. **Motion toggle** flips the experience live (no reload) and persists in localStorage.
8. **Palette markup keeps `role="listbox"`** — html-validate wanted a native `<select>`, which is the wrong element for a command palette; rule disabled for that one line with a comment.
9. `llms.txt` and the "Copy this page as Markdown" text are maintained as two copies of the same content (no build step to share them). If you edit copy later, update both.

## Two technical notes for future-you (or future-Claude)

- **Never give `#ring` opacity below 1.** Opacity < 1 forces the browser to flatten `preserve-3d` and the whole 3D revolve collapses into a tilted mess (this bit us mid-build: even `0.999999` from a fade calculation triggers it). Fades live on the individual cards.
- The ring's x-offset is clamped by the perspective magnification (~1.354×) so the front card never overflows narrow scene viewports (768–900px).

## QA done

- Screenshots at 375 / 768 / 1280 including 13 scrolled stops through every phase (headless Chrome + puppeteer-core; artifacts in `..\_qa-shots\`).
- Reduced-motion emulation: static render, zero running animations.
- Keyboard: skip link → logo → palette → contact links; palette fully keyboard-driven (Ctrl+K, arrows, Enter, Esc, focus restore). Cards stay in the accessibility tree in scene mode (opacity, not visibility).
- html-validate clean; no console or page errors at any width; no horizontal overflow; no em-dashes in rendered copy (scripted sweep).
- The scroll engine runs only on scroll events — verified ~0 style mutations/sec while idle.
- GitHub strip fetches real events (shows your last pushes), caches for 30 minutes, hides on failure.

## Needs your taste pass

- **The revolve pacing** — dwell is 18% of each card's slice. If cards feel like they linger too long or too little, `DWELL` in script.js is one number.
- **Little Bryan's poses** — three hand-drawn-ish SVG poses. If leap reads as "falling", the paths are tiny and easy to tweak.
- **The 768–1000px scene** — it works, but the cards dominate more than at 1280. If you'd rather tablets get the mobile timeline, change the 760 breakpoint to ~1000 in two places (style.css media query + the bootstrap/script matchMedia).
- Whether "SHIPS REAL THINGS" hero framing + no headshot feels right for recruiters — this was the approved direction, just confirming you still like it in the flesh.

## Public-if-merged warning

These files are on the branch and would be **publicly reachable** on your live domain after merge, e.g. `bryanweiwei.github.io/PRD-v3.md`:

- `PRD.md` (v2 spec, already on the branch history)
- `PRD-v3.md`
- `design-reference/mockup-d.html`
- `NOTES.md` (this file)
- `llms.txt` — **intentionally public**, leave it

Delete the first four before or right after merging if you don't want them readable (they're harmless, but they're your internal docs). `git rm PRD.md PRD-v3.md NOTES.md && git rm -r design-reference` then commit.

## Morning checklist

1. **Review:** `git checkout redesign-v3`, open `index.html` in Chrome/Edge. Scroll the whole thing. Try Ctrl+K. Narrow the window below 760 for the mobile layout; check your phone too.
2. **Decide** on the taste-pass items above (especially: keep internal docs public or delete them).
3. **Ship:** `git checkout main`, `git merge redesign-v3`, `git push` — pushing main puts it live.
