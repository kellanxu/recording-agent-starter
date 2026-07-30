# Stage 8 Local Material QA

Updated: 2026-07-30

## Locked toolchain

- `@slidev/cli`: `52.18.0`
- `@slidev/theme-default`: `0.25.0`
- `playwright-chromium`: `1.62.0`
- Node.js contract: `>=20.12`

The workshop has no production dependency. `npm audit --omit=dev` reported zero vulnerabilities.
The complete workshop development tree also reports zero vulnerabilities after pinning
DOMPurify `3.4.12` through an exact override. No `--force` or broad unsafe override was used.

## Build results

- `npm run build`: passed.
- Static output: repository-ignored `release/workshop-html/`.
- `npm run export:pdf`: passed.
- PDF output: `output/pdf/recording-agent-starter-workshop.pdf`.
- PDF properties: 16 pages, 735.12 x 414 points, not encrypted, no embedded JavaScript.

## Visual review

All 16 final PDF pages were rendered to PNG and reviewed individually at full size. The final
montage was also reviewed for pacing and consistency.

Result:

- no clipped titles or wrapped one-line banners;
- no unintended overlap;
- no missing Chinese glyphs;
- no broken code blocks;
- consistent title, body, spacing and color hierarchy;
- all audience-facing claims trace back to repository truth sources in speaker notes.

## Offline browser review

The static build was served locally while every non-localhost request was blocked.

Verified:

- first slide loaded at `/1`;
- `ArrowRight` advanced to `/2`;
- repeated keyboard navigation reached `/16`;
- presenter mode loaded at `/presenter/1`;
- presenter notes and `[Sources]` blocks were visible;
- external requests: zero;
- failed local resource requests: zero.

Headless Chromium denied Wake Lock permission. This is an expected browser permission result and did
not affect navigation, rendering or presenter mode.

## Defects found and fixed

1. The default theme initially requested Google Fonts despite the custom system-font CSS.
   `fonts.provider` is now `none`; the final offline run made zero external requests.
2. A relative `base` made presenter assets resolve under `/presenter/assets/` and return 404.
   The final build uses root-local assets and the documented local preview command; presenter mode
   then loaded without failed resources.
3. Repository-wide Prettier changed Slidev page-frontmatter separators and expanded the PDF from
   16 to 31 pages. `workshop/slides.md` is now excluded from Prettier; the final source has 15
   page separators and exports exactly 16 pages.

## Boundaries retained

- No PPT was created.
- No private configuration, recording, Transcript, token, ID or Feishu URL entered the materials.
- GitHub Release and Feishu synchronization remain external publication steps and are not treated
  as local rendering evidence.
- No Feishu public permission was changed.
