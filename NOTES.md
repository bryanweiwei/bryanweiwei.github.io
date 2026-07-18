# NOTES — side-images feature (branch `feat/side-images`)

Internal working notes. Like the PRDs, this file is **stripped from `main` at
deploy** — it should never ship to GitHub Pages.

_Last updated: 2026-07-18 (Checkpoint 3 QA complete; not yet merged)._

---

## What shipped on this branch

Real photos of Bryan, added in three places, plus a new "Also" ledger section.
All source of truth is `PRD-side-images.md`.

1. **Station ii photo cluster** (STORY register — casual: paper borders, tilt,
   overlap). One captioned main plate (`photo-presenting`, "BTE hackathon ·
   Microsoft Garage") + two overlapping "desk" snapshots (`photo-bte-group`,
   `photo-msft`).
2. **Card 01 side plate** (WORK register — formal ink frame). `photo-salesforce`
   ("Salesforce office") in the work section's left column; in scene mode its
   visibility is tied to card 01 being front, flow/mobile shows it inline.
3. **"Also, in short." ledger** — a numbered list of four more things (06 Founders
   Hall Advisory Board → 07 BTE Design Sprint → 08 AI Lie-Detector Hackathon →
   09 PDCE × MCG Case Competition), each with a portrait photo + caption.
   - **Scene mode:** a literal horizontal timeline. The parked ink line is the
     spine; entries alternate above/below on node dots; little Bryan walks the
     line as you scroll, hopping node-to-node, and the node he's on "pops" while
     its number warms to green. **Free scroll — no snap stop** (removed the `also`
     snap label; the camera park still gives it its readable window).
   - **Flow / mobile:** the same four entries as a vertical timeline, photo inline
     under each title.

## Key decisions

- **Two photo registers:** STORY (casual, tilted, paper) at the stations; WORK
  (formal, straight ink frame, small-caps caption) for card 01 + the ledger.
- **Hard privacy rule:** every shipped file is cropped to **Bryan alone** — never
  a group image hidden by CSS. Uncropped originals live only in gitignored
  `photos-src/`. (All 8 derivatives re-verified this pass — see QA below.)
- **No photo appears twice** on the page.
- **Also section = free scroll, no snap** (Bryan's call, 2026-07-18). The
  per-node micro-moments replace the old snap-rest.

## Checkpoint 3 QA — results (2026-07-18)

Ran headless Chrome (puppeteer-core driving the installed Chrome) over a full
top-to-bottom scroll at three configs. All green:

| Check | Result |
|---|---|
| Console errors / page exceptions / failed requests @ 1280 (scene) | **0 / 0 / 0** |
| Same @ 375 (mobile flow) | **0 / 0 / 0** |
| Same @ 1280 reduced-motion (flow) | **0 / 0 / 0** |
| All 8 photos loaded (`naturalWidth > 0`) in every config | **yes** |
| File aspect ratios match HTML `width`/`height` (→ zero CLS) | **all 8 match exactly** |
| `loading="lazy"` + `srcset` + `sizes` on every new `<img>` | **yes** |
| Derivative weights | **1x 16–33 KB, 2x 50–108 KB — sane** |
| Privacy: opened every derivative directly, only Bryan visible | **all 8 pass** (bte-group double-checked at zoom: neighbour was his own hood/undershirt + brick wall) |
| Mobile: station cluster + card 01 + all 4 ledger entries render, captioned, reachable | **verified via screenshots** |
| Reduced motion: static alternating ledger, all photos visible | **verified** |

## Morning checklist (eyeball before merge)

1. Hard-refresh and slow-scroll the **Also** section in scene mode — does the
   node-hop feel good? (dot pop size, number warm timing, hop cadence are all
   one-line tweaks if not.)
2. Glance at the site at phone width — ledger + station cluster read okay.
3. Confirm you're happy with the four ledger captions/copy (your voice).

## To merge (when you say go — NOT done yet)

1. `git rm -r photos-src` — **the raw originals must not ship.** (They're
   gitignored, so only do this if any got tracked; otherwise just confirm
   `git ls-files photos-src/` is empty.)
2. Strip internal docs from what lands on `main`: `PRD-side-images.md` and this
   `NOTES.md` (same treatment the other PRDs get).
3. Merge `feat/side-images` → `main`; Pages redeploys from `main`.
