# PRD v3 — "Broadsheet Helix"

**Goal:** Rebuild the site as a scroll-driven experience per the approved design reference at `design-reference/mockup-d.html`. That file is the taste anchor — open it, scroll it, match its feel. This PRD supersedes PRD.md's visual direction; PRD.md's craft standards (accessibility, performance, no AI-slop) still apply.
**Date:** Jul 12, 2026. Bryan approved this direction after reviewing four mockups. Build unattended; decide autonomously, log decisions in NOTES.md.

## 0. Hard constraints (unchanged from PRD.md)
- Branch `redesign-v3` off `redesign-v2` (inherit its semantic HTML, a11y patterns, favicon, split files). **Never touch main.** Commit per phase. If there are uncommitted changes sitting in the working tree, commit them to redesign-v2 first as "v2 leftovers".
- Stack: static files only (html/css/js), no framework, no build step. Google Fonts only external dep.
- Full `prefers-reduced-motion` + mobile fallbacks — see §4.
- No em-dashes anywhere in site copy.

## 1. The experience (match mockup-d.html)
1. **Hero:** paper background, massive uppercase Fraunces "SHIPS REAL THINGS FOR REAL PEOPLE." (italic mint-green accent), line-by-line rise on load. Eyebrow: "Bryan Wei · NYU Stern '29".
2. **Descent:** a fixed vertical ink line; three city stations (Taipei / New York / Kuala Lumpur, alternating sides, dot on the line) ride upward past the viewer. This is the origin story.
3. **The elbow:** green node lights, horizontal branch grows right, "the work, in order" label. The line is an L that never rotates and never disappears; during the revolve the L slides left so the branch spans the screen.
4. **The revolve:** five project cards (ink-bordered paper cards, hard offset shadows) spaced along the horizontal line, revolving around it in 3D as scroll progresses, chronological order, ghost-outline year (2025→2026) bottom-right tracking the front card. Back-facing cards stay legible: NO blur, NO desaturation, opacity floor ~0.45 (Bryan found heavier dimming disorienting). Add scroll-snap or eased settling so cards come to rest facing front, and GPU-friendly transforms so text stays crisp mid-rotation.
5. **Finale:** loud broadsheet contact ("Working on something interesting? Say hi." with mint underline link), stats band (3 cities / 5+ real builds / 1 hospital pilot informed), footer line "the color is mint chip, and yes it's the ice cream".

## 2. Little Bryan (signature element — Bryan's favorite, do NOT cut)
An ink-drawn stick figure with a mint scarf who:
- hops station-to-station down the descent (one arc per station),
- rides at the elbow during the revolve, doing a small hop as each card lands in front,
- **at the finale, stands beside the contact heading and waves** (looping arm wave).
Upgrade him from the mockup's single pose to 2–3 SVG poses (run/leap/land + wave) swapped by phase, with springy easing. He should read as hand-drawn woodcut, not clip art. Hide under reduced motion (static standing pose is fine).

## 3. Content (copy updates ARE in scope this time)
Cards use the full v2 descriptions (not the mockup's abbreviations) PLUS a "Shipped for:" footer line per card (wording in the mockup). Apply these updates:
- **VOINOSIS:** past tense + completion: "...and built a U.S. hiring plan for entry-level technical roles covering sourcing, compensation, and visa pathways. The fellowship wrapped in July 2026 with both final deliverables submitted to the CEO."
- **About/story content** now lives in the three stations; keep station copy from the mockup. Kuala Lumpur station covers the summer (no "before sophomore year" phrasing anywhere).
- Contact: bryan.wei@stern.nyu.edu, linkedin.com/in/wei-bryan. Meta description updated to match the new framing.

## 4. Feature layer (fold in old PRD.md Phase 2b — it was never built)
- **Cmd/Ctrl+K command palette:** jump to hero/stations/projects/contact, copy email, toggle motion. Subtle "⌘K" hint in nav. Vanilla JS, styled to the broadsheet system (2px ink borders).
- **Live GitHub activity strip** in or near the finale: client-side fetch of `https://api.github.com/users/bryanweiwei/events/public`, last 3–5 events, sessionStorage cache, hides entirely on failure.
- **llms.txt** at root + "Copy this page as Markdown" affordance near contact.

## 5. Mobile + reduced motion (design them, don't punt)
- **Mobile (<760px):** no 3D. A designed vertical timeline instead: the ink line runs down the left edge, stations and project cards attach to it in order, little Bryan hops down it between sections (cheap 2D translate), wave at the bottom. Same content, same loudness, no scroll-jacking.
- **Reduced motion:** fully static single-column render, everything readable, zero animation. Verify with emulation, not assumption.

## 6. QA (repeat v2's standard)
Headless screenshots at 375/768/1280 incl. scrolled states; keyboard nav; no console errors; html-validate; no horizontal overflow; Lighthouse-conscious (the fixed-scene rAF loop must idle when out of range — no constant layout thrash). Write NOTES.md: decisions, anything needing Bryan's taste pass, morning checklist. Mention explicitly: PRD-v3.md, design-reference/, NOTES.md will be public if merged as-is — list them so Bryan can decide.

## 7. Done means
`redesign-v3` renders the full mockup-d experience with real content, little Bryan in all three behaviors, palette + GitHub strip + llms.txt working, designed mobile fallback, and Bryan can merge without touching code.

## 8. Out of scope
"Ask my portfolio" AI chat, audience lens switcher, project deep-dive pages, custom domain. Backlog lives in Bryan's Cowork memory.
