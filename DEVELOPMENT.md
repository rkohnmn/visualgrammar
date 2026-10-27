# Developer & Future Agent Guide (`DEVELOPMENT.md`)

## 1. Engineering Conventions

1. **Zero External Dependencies**: Do not add runtime npm packages or external CDN `<script>` / `<link>` tags. All calculations belong in `js/math-engine.js` or `js/data-engine.js`, and all plotting belongs in `js/renderer.js`.
2. **Subpath Safety**: Always reference local assets in `index.html` using `./css/...` and `./js/...`. Never use root-relative `/css/...` paths.
3. **Tabular Numerals**: Apply `font-variant-numeric: tabular-nums` (via `.mono` or `.numeric` classes) to every numeric readout and table cell.

## 2. Adding a New Chart Family

1. Add the structured 20-point definition to `CHART_REGISTRY` in `js/chart-registry.js`.
2. Register its suitability scoring rule in `js/recommendation-engine.js`.
3. Add any applicable integrity safeguards to `js/integrity-engine.js`.
4. Implement the Canvas 2D rendering and hit-region generation in `js/renderer.js`.
5. Add unit and rendering assertions in `tests/` and run `npm run check`.
