# PRD — Portfolio v2: Full Visual Rebuild

**Project:** bryanweiwei.github.io (live personal portfolio, GitHub Pages)
**Goal:** Rebuild the site's visual layer so it reads as "this person can really build" to peers, recruiters, and startup people. Showcase modern animation, interaction, and UI craft. This is a statement site, not a template.
**Date:** Jul 12, 2026. Built unattended overnight in Claude Code — make decisions autonomously (see Autonomy rules at bottom).

---

## 1. Hard constraints

- **Do NOT push to main.** GitHub Pages deploys from main root, so pushing = live. Work on branch `redesign-v2`, commit after each phase. Bryan reviews in the morning and merges himself.
- **Content is frozen.** Keep all existing copy exactly: hero one-liner, bio, all 5 project cards (AI Middleware, Empire Health Labs, Velric, BowlDrop, VOINOSIS), skills, contact (bryan.wei@stern.nyu.edu, LinkedIn). Rewriting copy is out of scope. Restructuring how content is *presented* is fine.
- **Stack stays:** single `index.html`, vanilla CSS + JS, no framework, no build step, no npm. External deps limited to Google Fonts. (Splitting into `style.css` / `script.js` is allowed if the file gets unwieldy, nothing beyond that.)
- **Must not look AI-generated.** This audience knows the tells. Banned: purple/indigo gradient heroes, glassmorphism cards, emoji as icons, generic "Crafting digital experiences" copy vibes, uniform border-radius-16 card grids, floating blob backgrounds. If a design choice would appear in a "top 10 AI website tells" post, don't make it.
- **Accessibility & performance are features of the "good builder" signal:** full `prefers-reduced-motion` support (site must be completely usable with all animation off), semantic HTML, keyboard navigable, images lazy-loaded, no layout shift, fast on mobile. Target: would pass Lighthouse 90+ across the board.

## 2. Design direction

Evolve, don't discard, the identity: editorial/magazine aesthetic, Fraunces + Inter, the mint/forest palette (`#e8f3ec`, `#d4e8db`, `#f6faf7`, accent `#2d5a3d`, ink `#1f2a24`). You may push it — deeper contrast, a dark section, richer paper textures, bolder type scale — but a visitor who saw v1 should recognize v2 as the same person with dramatically better craft. Taste references: editorial portfolio sites like those featured on siteinspire / minimal.gallery — restrained, typographic, confident whitespace. Not dribbble-shot maximalism.

## 3. What to build

### Phase 1 — Structural rebuild (core)
- Rework layout and type system from scratch: stronger typographic hierarchy, larger scale contrast, deliberate grid with asymmetry (keep the editorial roman-numeral section markers if they still earn their place).
- Fix the punch list: portrait images (project-2, project-4) currently center-crop badly in the 4:3 container — give portrait images a treatment that respects their aspect. Add a favicon (simple monogram SVG, matches palette). 
- Project links: "Ask me about it" anchors are fine to keep, but where a real link exists (Lovable link for AI Middleware) wire it.
- Fully responsive, mobile-first checked at 375 / 768 / 1280.

### Phase 2 — Motion & interaction (the showcase layer)
Choreographed, not decorated. Every animation should feel intentional:
- **Page-load choreography:** staggered hero entrance (type reveals line-by-line or by word, not a generic fade).
- **Scroll-driven storytelling:** use CSS scroll-driven animations (`animation-timeline: view()`) where supported with IntersectionObserver fallback — this itself is a "builder knows modern CSS" signal. Section reveals, image parallax on project cards, a progress indicator if it fits the editorial frame.
- **Micro-interactions:** link underline animations, project-card hover states with depth (image scale/shift, not box-shadow-bloom), magnetic or subtly-reactive nav, smooth anchor scrolling.
- **One signature moment:** a single memorable interactive flourish (e.g., hero headline that reacts to cursor, an SVG accent that draws itself on scroll, an interactive skills constellation). One, executed perfectly — not five gimmicks.
- Everything gated behind `prefers-reduced-motion: no-preference`.

### Phase 2b — Product-minded features (static-safe, build after Phase 2 core)
- **Cmd+K command palette:** keyboard-driven navigation of the whole site (jump to sections/projects, copy email, toggle reduced motion), styled to match the editorial system — Linear/Raycast energy, pure vanilla JS. Show a subtle "⌘K" hint in the nav. This may double as the signature moment.
- **Live GitHub activity strip:** client-side fetch of `https://api.github.com/users/bryanweiwei/events/public` (no auth key needed), rendered as a quiet "recently shipped" line or strip — repo name + event type + relative time, last 3–5 items. Graceful degradation: if the fetch fails or rate-limits, the section hides entirely (never show an error or skeleton). Cache in sessionStorage.
- **AI-native touches:** an `llms.txt` at root (machine-readable summary of who Bryan is + projects + contact) and a small "Copy this page as Markdown for your AI" button near contact that copies a clean markdown version of the site to clipboard. Cheap, static, and exactly the kind of detail AI-literate visitors notice.

### Phase 3 — Self-review & QA loop
- Re-read the full page top to bottom as a skeptical recruiter. Kill anything that reads as gimmick or AI-slop per the banned list.
- Verify: reduced-motion pass, keyboard tab order, all links resolve, images lazy-load, no console errors, valid HTML (run through a validator mentally or with a local check), file size sane.
- If Playwright/puppeteer is available, screenshot at 375/768/1280 and inspect; if not, do a careful code-level review and note in NOTES.md that visual QA needs Bryan's morning pass.
- Write `NOTES.md` (repo root): what changed, decisions made autonomously, anything needing Bryan's review, and a 3-step morning checklist (review branch → open locally → merge & push).

## 4. Done means

The `redesign-v2` branch contains a fully working, animated, responsive rebuild that Bryan can review in a browser and merge without touching code. Ugly-corners logged in NOTES.md are fine; a broken page is not.

## 5. Later list (do NOT build tonight)

Custom domain, project deep-dive pages, dark-mode toggle, blog, profile README refresh, "Ask my portfolio" AI chat (needs serverless key proxy), audience-lens view switcher, terminal mode, git-log life timeline, CMS-ification of any kind. (Full v3 idea backlog lives in Bryan's Cowork memory.)

## 6. Autonomy rules (unattended run)

- Make design decisions yourself; log significant ones in NOTES.md instead of stopping to ask.
- If something is ambiguous, choose the more restrained option.
- Commit at the end of each phase with a clear message. Never force-push, never touch main.
- If you finish all three phases with time left, iterate on Phase 3 polish — do not expand scope into the Later list.
