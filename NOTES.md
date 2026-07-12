# Redesign v2 — build notes

Overnight rebuild per PRD.md, on branch `redesign-v2`. Main untouched; nothing is live.
All three phases done, each committed separately.

## What changed

**Phase 1 — structure**
- Split the single file into `index.html` + `style.css` (and later `script.js`); no build step, still just files GitHub Pages can serve.
- New type system on variable Fraunces + Inter: hero headline scales up to 128px, tighter leading, bigger section headers. Same mint/forest palette, same copy — nothing was reworded.
- **Portrait images fixed**: the Empire Health cover and BowlDrop phone mockup no longer center-crop in a 4:3 box. They sit at their natural aspect ratio on a mint mat ("plate" treatment) with a hairline shadow. Landscape shots use a 3:2 crop; the VOINOSIS logo keeps its paper plate and now links to the site root (see review notes).
- Project rows alternate direction on desktop (figure left / figure right) for editorial asymmetry; roman-numeral section markers kept.
- Skills became a ruled 4-column ledger (hairlines, no boxes) instead of a card grid.
- New dark forest contact band (solid `#17211b`, no gradients) with the footer inside it.
- Added `favicon.svg` (serif "B" monogram on forest green).
- Replaced the v1 radial-gradient background blobs with a very faint SVG paper grain (blobs are on the PRD's banned list; grain fits "richer paper textures").
- Semantic pass: `main`/`article`/`figure`, skip link, focus-visible outlines, lazy-loaded images with reserved dimensions (verified zero layout shift), heading order clean.

**Phase 2 — motion** (all gated behind `prefers-reduced-motion: no-preference`)
- Load choreography: eyebrow rises, headline reveals line-by-line through overflow masks, the hand-drawn underline under "AI" draws itself, then the meta row + headshot rise.
- Scroll-driven reveals and project-image parallax use CSS `animation-timeline: view()` (scrubbed by scroll) with an IntersectionObserver fallback for browsers without it; a 2px reading-progress hairline at the top uses `scroll(root)` with a JS fallback.
- **Signature moment**: hero headline letters swell in weight (Fraunces variable `wght` axis) near the cursor and ease back — mouse-only (`pointer: fine`), off under reduced motion.
- Micro-interactions: nav underlines sweep left-to-right, arrow links widen their gap, project figures lift 5px and re-saturate on hover, nav links and buttons are subtly magnetic (max ~4px).
- With JS off or reduced motion on, the page renders complete and static — verified, not assumed.

## Decisions made autonomously

1. **Split files** (PRD allowed it "if the file gets unwieldy" — it did: three concerns, ~36KB total).
2. **Signature choice**: cursor-reactive headline over an SVG-draws-itself or constellation idea — it was on the PRD's example list, it shows off variable fonts, and it degrades to nothing on touch devices.
3. **Dark section** = the contact band (PRD said a dark section was allowed; ending on it gives the page an arc and makes the CTA read).
4. **VOINOSIS link**: `voinosis.com/en/` now returns 404 (checked in a real browser), so I pointed the logo at `voinosis.com` (200, Korean homepage). Flagging since the English page disappearing may matter to you.
5. **Velric screenshot** (800×339, very wide) is cropped to 3:2 in its frame — less cropping than v1's 4:3, but if you want it un-cropped it could get the plate treatment like the portraits.
6. Nav stays non-sticky (restrained option); the progress hairline covers orientation.
7. `PRD.md` and this file are committed on the branch. If you merge as-is they'd be publicly reachable at `/PRD.md` and `/NOTES.md` on your Pages site — harmless, but delete them before/after merging if you'd rather not.

## QA done (Phase 3)

- Screenshots at 375 / 768 / 1280 via headless Chrome (puppeteer-core), including scrolling passes so the scroll-driven states render as users see them. Artifacts in `..\_qa-shots\` (outside the repo) if you want to flip through.
- Reduced-motion emulated: zero animation, everything visible, smooth-scroll off.
- Keyboard: skip link → logo → nav → hero → project links, in order; visible focus rings.
- `html-validate`: clean. No console errors or page errors. No horizontal overflow at any width. All images load with alt text and reserved dimensions (no layout shift). External links checked live (LinkedIn returns its usual bot-block code; the link itself is v1 content, unchanged).

## Worth your eyes in the morning

- The cursor letter-swell on the headline — I verified it works (weights 381→629 by proximity) but taste is yours; if it feels like too much, deleting `initSignature()` in `script.js` (and the `.ch` rule in the CSS) removes it cleanly.
- The grain texture and dark band are the two boldest departures from v1 — check they feel like "same person, better craft."
- `README.md` in this repo is empty — fine to leave, easy to fill later.

## Morning checklist

1. **Review**: open the branch — `git checkout redesign-v2` — then open `index.html` in your browser (double-click it; no server needed). Resize the window / try your phone.
2. **Compare**: `git checkout main` and reopen to see v1 side by side if you want the before/after.
3. **Ship it**: if happy — `git checkout main`, `git merge redesign-v2`, `git push` (pushing main deploys it live).
