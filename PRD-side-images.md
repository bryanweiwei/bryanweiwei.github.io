# PRD — Side-column photos + "Also" ledger — v4

## v4 updates (Bryan, Jul 17 — overrides v3/v2 where they conflict)

### Two photo registers
- **STORY photos** (stations, future city shots) = **casual register**: tilted,
  paper borders, can overlap each other.
- **WORK photos** (work-section anchor, card 01, ledger rows) = **formal
  register**: straight ink-frame plates, small-caps captions.

### PRIVACY RULE (hard)
Any photo containing other people ships ONLY as a **file-level crop containing
just Bryan** — never a full group image hidden by CSS/overlap (the full file
stays downloadable). For the desk-photo overlap look: crop each shipped file to
roughly its visible region (small safety margin under the overlap), so the
occlusion is redundant. **Verify by opening each derivative directly: only
Bryan visible in every shipped file.** Same rule for the couch photo (031) if
the ledger uses it. Uncropped originals stay only in gitignored photos-src/.
(Blurred/background strangers count as "other people" — crop them out too.)

### Station photos (casual register)
The descent stations get chapter photos. **Station ii (New York)** gets three:
- **26-0495-150** (gray-shirt presenting) MOVES from the work-section anchor to
  station ii as its **main plate**, caption "BTE hackathon · Microsoft Garage".
- **251107-...-020** (BTE hoodies, Bryan LEFTMOST — privacy-crop to Bryan) and
  **IMG_4385** (Microsoft logo wall, solo) as two casually TILTED "desk photos"
  scattered/overlapping beside it. If three feel heavy at 1280px, overlap the
  two desk photos tighter.
- Stations i and iii get no photos yet — the pattern must take photos later
  without rework.

### Work-section anchor & card 01
- **Anchor becomes 26-0602-212** (case-comp close-up, privacy-crop away the
  audience/teammate edges), caption "PDCE × MCG case competition · Jun 2026".
- **Card 01 (Salesforce) gets IMG_6758** (Salesforce mascots, suit) as its side
  photo — the one honest per-card match. Caption "Salesforce office". (Mascots
  are costumes, not people, so no privacy crop needed; verify no bystanders.)

### Ledger
Proceeds as specced in v3, **minus photos used above** — no photo appears twice
on the page. Row 06 uses 216 (privacy-cropped to Bryan alone on stage).

---
# v3 below — still applies except where v4 above overrides it.

**DECISION (Bryan, Jul 17): add an "Also" ledger section.** The five curated cards stay untouched; AFTER the work section, add a compact numbered ledger of other real things Bryan has done. This is where the event photos legitimately live. Editorial framing: "selected work" made explicit — here's the rest.

## The "Also" ledger (new section)
- Placement: after the five project cards / end of the work sequence, before the finale. Editorial treatment consistent with the site: continue the numbering in smaller form (06, 07, ... in the italic serif style), hairline-divided rows, NOT full cards.
- Each row: number, title, one-line description, small photo plate (ink frame + caption) where one exists.
- Draft rows (Bryan tunes copy; his voice; NO em-dashes):
  - **06 · PDCE × MCG Case Competition** — "Presented market-entry strategy for team Astraeus Analytics at Stern's Paulson Auditorium, June 2026." Photos: 26-0602-216 (or 212; 225 team shot as alt).
  - **07 · AI Lie-Detector Hackathon** — "Built a hardware lie detector at an AI hackathon; a Meta engineer's grilling on AI safety became a coffee chat." Photos: IMG_2764 (breadboard demo, crop occlusion) + IMG_2770 as alt.
  - **08 · BTE Design Sprint** — "Prototyped and pitched in a weekend design sprint with the BTE cohort." Photo: 251107-...-031 (Bryan leftmost).
  - **09 · Founders Hall Advisory Board** — "Ran business admin on the E-board of NYU's Founders Hall." Photo: IMG_2293 (campaign flyers).
  - Rows without photos are fine; photos without rows go to texture duty or stay unused.
- Mobile: ledger rows stack naturally in the vertical timeline; photos inline, lazy-loaded.

## Left column (work section) — SIMPLIFIED by the ledger decision
One anchoring photo only: **26-0495-150** (Bryan presenting, gray sweatshirt), ink-plate + caption, present through the work section. No per-card cycling needed anymore (the ledger absorbed the event photos). Optional subtle parallax. Collision pre-check still MANDATORY (cards must never sweep through it at 1280/1520).

---
# Prior spec (v2) below — still applies except where v3 above overrides it (vignette-cycling in the left column is replaced by the anchor+ledger model).

**Goal:** Real photos of Bryan in the work section's unused LEFT whitespace. Humanize/de-AI phase.
**Branch:** `feat/side-images` off main. Checkpoint before merge. Bryan: run on Fable.

## ⚠️ THE HONESTY RULE (this is the core design constraint)
The photos are NOT from the projects on the site. They're from other real events (PDCE × MCG case competition, a BTE hackathon/design sprint, tech-office visits). There are NO face photos for VOINOSIS or BowlDrop, and none usable for Velric.
Therefore: **photos must NEVER be presented as depicting the project card they appear next to.** No per-card "matching." Instead, every photo is a **captioned vignette** — a small ink-style caption states what it actually is ("PDCE × MCG case competition · Jun 2026", "BTE design sprint", "Demoing hackathon hardware"). This turns a liability into a breadth signal: the captions show Bryan does MORE than the five cards.

## Design
- Left column of the work section = a photo vignette: ink-frame/mint-mat plate treatment (match card language), hard offset shadow, caption beneath in small caps.
- **Rotation:** the vignette may cycle through the photo set as the user scrolls the revolve (a new photo per card-landing beat is fine as a RHYTHM), but the pairing is explicitly ambient — the caption always describes the photo, never the adjacent card. If cycling reads as if photos belong to cards despite captions, fall back to: one anchoring photo (26-0495-150) for the whole section, or a slow ambient cycle detached from card timing.
- **MANDATORY pre-check:** revolving cards must never sweep through the photo zone at 1280/1520 widths. Adjust ring offset or photo-zone size if they do.
- Little Bryan photo-frame interaction: optional, only if cheap and charming.
- Mobile (<760px): photos appear as captioned inline vignettes in the vertical timeline (e.g., one after the stations, 1-2 between project cards). Lazy-load, srcset, sane weight.
- Derivatives: EXIF-normalize (Pillow ImageOps.exif_transpose), ~800-1200px long edge, q~80, into `images/`; srcset for retina. Specific alt text (use the descriptions below).
- `photos-src/` = raw source, `git rm -r photos-src` at merge; only derivatives ship.

## Photo manifest (14 staged in photos-src/; Bryan approved all)
Identification: Bryan = black-suit presenter in 26-0602 series; LEFTMOST in both 251107 group shots; gray-sweatshirt presenter in 26-0495-150; mic presenter in IMG_2770.

| File | What it actually shows | Caption direction | Priority |
|---|---|---|---|
| 26-0495-150.jpg | PRO: Bryan presenting w/ mic, gray sweatshirt, illustrated slide — BTE hackathon at Microsoft Garage | "BTE hackathon · Microsoft Garage" (confirmed by Bryan Jul 17) | **LEAD — use first** |
| 26-0602-216.jpg | PRO: Bryan speaking, slide + Stern podium + audience | "PDCE × MCG case competition · Jun 2026" | High |
| 26-0602-212.jpg | PRO close-up: warm smile mid-presentation, black suit | same event caption | High |
| IMG_2764.jpeg | Bryan demoing wired breadboard device | "Demoing hackathon hardware" | High (only build shot; crop the occluded right third) |
| IMG_2770.jpeg | Bryan w/ mic, hackathon slide | "Hackathon demo day" | Medium |
| 251107-...-031.jpg | BTE design-sprint couch, Bryan leftmost | "BTE design sprint" | Medium |
| 251107-...-020.jpg | Three BTE hoodies, Bryan leftmost | "BTE, NYU Stern" | Medium |
| IMG_6758.jpeg | Bryan w/ Salesforce mascots, suit | "Salesforce office" — NOTE: this one MAY sit near the Salesforce case-comp card (it is actually Salesforce-related) | Medium |
| IMG_4385.jpeg | Microsoft logo wall | "Microsoft, NYC" | Low |
| IMG_3943.jpeg | Candid thumbs-up, current hair, NYU lounge | personality filler | Low |
| IMG_2293.jpeg | FAB campaign flyers in dorm | "Running for dorm board" | Low |
| 26-0602-209/211/225.jpg | Spares of the case comp (225 = team, Bryan far left) | spares | Spares |

Use ~4-6 photos total in the cycle; more = noise. Lead + the two case-comp + breadboard + one BTE shot is a sensible default set.

**Extensibility:** city-station photos (Taipei/NY/KL) and a Velric photo may arrive later — leave the vignette pattern reusable at the stations without rework.

## Checkpoints
1. Derivatives + collision check + lead-photo layout w/ caption treatment → STOP, review.
2. Rotation/cycling + mobile integration → STOP, review (key question at this checkpoint: do captions successfully kill the photo-belongs-to-card read?).
3. Polish + QA (no CLS, lazy-load, reduced-motion static, no console errors) → STOP before merge; remind: `git rm -r photos-src`.
