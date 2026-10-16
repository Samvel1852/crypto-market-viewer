---
description: Use when the master CV must be imported from Canva, or to create a tailored Canva copy of the CV for a saved application pack.
---

# Canva CV

The master CV is the one-page Canva design `DAHYNhleQV4`
(https://www.canva.com/design/DAHYNhleQV4/htPca5hyr4h524p9R2tLaQ/edit). Canva tools come from
the Cursor account connector and are advertised by name (they usually contain `design`,
`editing` or `export`). If no Canva tools are available, say so and fall back to the Markdown CV.

## Import the master CV

1. Fetch the design's content (or search designs for "CV" / "Samvel" if fetching by id fails).
2. Rebuild it as Markdown: `# Name`, headline line, contact line, then `##` sections
   (Professional Summary, Experience, Skills, Education, Certifications, Languages) with
   `-` bullets. Keep every fact and number exactly as written.
3. Call `save_base_cv` with `source: "canva"`.

## Tailored copy for one pack

Never edit the master design in place.

1. Create a copy of the master design named `CV - <Company> - <Job title>`. If the connector
   cannot copy designs, skip Canva tailoring for this run and leave `canvaUrl` empty.
2. In the copy, replace only the headline text and the professional summary text with the
   pack's `headline` and `summary`. Keep fonts, layout and all other text unchanged. Commit
   the edit transaction; cancel it if any step fails.
3. Export the copy as PDF when the connector supports it.
4. Re-save the pack with `save_application` (same job and content) adding `canvaUrl` set to the
   copy's edit or export URL.
