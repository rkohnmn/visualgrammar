# VisualGrammar

[![Ecosystem Hub: DataSense Studio](https://img.shields.io/badge/Ecosystem%20Hub-DataSense%20Studio-0D1014?style=flat-square)](https://rkohnmn.github.io/datasense-studio/)
[![DataSense Compass](https://img.shields.io/badge/DataSense-Compass%20Engine-D9381E?style=flat-square)](https://rkohnmn.github.io/datasense-studio/compass/)

**Understand the data. Choose the view. Reveal the story.**

[![Deploy VisualGrammar to GitHub Pages](https://github.com/rkohnmn/visualgrammar/actions/workflows/deploy.yml/badge.svg)](https://github.com/rkohnmn/visualgrammar/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Runtime Dependencies](https://img.shields.io/badge/Dependencies-0%20(Pure%20Vanilla%20ES2022)-emerald.svg)](#2-quick-start--local-development)
[![DataSense Studio](https://img.shields.io/badge/DataSense%20Studio-Ecosystem%20v1.0.0-indigo.svg)](https://rkohnmn.github.io/quartetlab/)

VisualGrammar is an interactive laboratory for statistical data visualization, variable taxonomy, chart discovery, graphical literacy, and multi-view representation unity. Built as a core component of the **DataSense Studio** ecosystem alongside QuartetLab, ResampleLab, and ForecastLab, VisualGrammar operationalizes the principle that graphical representations are formal mathematical mappings from observational data structures to geometric marks, coordinate systems, visual encodings, and uncertainty bounds.

🔗 **Live Application:** [https://rkohnmn.github.io/visualgrammar/](https://rkohnmn.github.io/visualgrammar/)

---

## 1. Product Philosophy & Core Pillars

A visualization is not merely an aesthetic chart selection—it is an explicit mathematical projection of observations under specific modeling assumptions. Different charts can represent identical observations while emphasizing distinct distributional moments, quantiles, or topological associations. VisualGrammar structures graphical literacy across six functional pillars:

1. **Pillar A — Understand Data (`js/data-engine.js`)**: 
   - Strict RFC 4180 CSV/TSV parser handling quoted delimiters, newlines, escaped quotes, and spreadsheet formula injection sanitization (`=`, `+`, `-`, `@`).
   - 19-category semantic variable taxonomy with transparent heuristic type inference, confidence scoring, rationales, and non-destructive user overrides.
   - Profile metrics: completeness rates, uniqueness, Hyndman-Fan Type 7 quantiles, Shannon entropy, and skewness.
   - Non-destructive transformation pipeline (log transform, standardization, binning, filtering, and interaction terms) with 30-level Undo/Redo stacks and full provenance logging.

2. **Pillar B — Find a Visualization (`js/recommendation-engine.js`)**:
   - Deterministic, explainable recommendation engine evaluating 14 structural inputs across 13 analytical objectives.
   - Categorizes chart options into four suitability tiers: `Recommended`, `Appropriate alternative`, `Conditionally suitable`, and `Inappropriate for selected structure`.
   - Explains analytical trade-offs, required transformations, and common pitfalls for every recommendation.

3. **Pillar C — Chart Studio (`js/renderer.js`, `js/integrity-engine.js`)**:
   - Zero-dependency High-DPI Canvas 2D and vector SVG rendering engine supporting 34 chart families with crisp display across standard and Retina displays.
   - Side-by-side comparison mode for comparing two chart configurations or parameter variations simultaneously.
   - Interactive data mark inspection, keyboard-accessible mark selector, and full WCAG 2.2 AA compliance.
   - Adaptive 3-part interpretation panel offering progressive explanation depth:
     - **Simple**: Plain-language summaries and intuitive analogies.
     - **Standard**: Formal statistical interpretations, hypothesis tests, and diagnostic summaries.
     - **Technical**: Exact mathematical specifications, IEEE 754 precision parameters, and formulas.
   - 13-rule real-time **Visualization Integrity Auditor** detecting truncated bar baselines, dynamite plots, area-radius distortions, nominal line connections, 3D perspective distortions, and overplotting, with one-click auto-fixes.

4. **Pillar D — Known Visualization Unity (`js/unity-lab.js`)**:
   - Flagship *"One Dataset, Many Views"* laboratory covering 16 structural Unity Groups.
   - Synchronizes four distinct visual projections of the identical observations simultaneously (e.g., Histogram vs. KDE vs. Boxplot vs. ECDF for univariate continuous data).
   - Details preserved invariants across all four views (sample mean, median, IQR, total variance), distinct mathematical transformations applied, and specific perceptual information losses.

5. **Pillar E — Chart Literacy Lab (`js/literacy-lab.js`)**:
   - Repeatable 5-step chart-reading protocol: *Read the Frame → Decode the Marks → Audit the Scales → Assess the Uncertainty → Formulate the Conclusion*.
   - 15 interactive misleading-visualization repair experiments featuring instant toggle comparisons between the distorted view and mathematically corrected graphic.
   - 7 practical chart literacy challenges with instant rule-based statistical feedback and progress tracking.

6. **Pillar F — Visualization Atlas & Learn (`js/chart-registry.js`, `js/atlas-data.js`)**:
   - Searchable encyclopedia of 34 chart families, each documented with a structured 20-point specification and interactive live canvas example.
   - 26 comprehensive concept lessons organized across four curriculum tracks: Foundations, Advanced Graphics, Perception & Cognition, and Statistical Traps.

---

## 2. Supported Chart Families (34 Types)

VisualGrammar supports 34 distinct chart families across 8 structural categories:

| Category | Chart Families |
| :--- | :--- |
| **Univariate Distribution** | Histogram, Kernel Density Estimation (KDE), Empirical Cumulative Distribution (ECDF), Tukey Boxplot, Violin Plot, Quantile-Quantile (Q-Q) Plot |
| **Categorical & Amounts** | Standard Bar Chart, Grouped Bar Chart, Stacked Bar Chart, 100% Stacked Bar, Dot Plot / Cleveland Dot, Lollipop Chart |
| **Bivariate & Association** | Scatterplot, Grouped Scatterplot, Binned Hexbin / 2D Density, Parallel Coordinate Plot, Bubble Plot |
| **Time Series & Sequential** | Time-Series Line Plot, Multi-Series Line Plot, Stacked Area Chart, Calendar Heatmap, Seasonal Subseries Plot, Autocorrelation (ACF) Plot |
| **Proportions & Part-to-Whole** | Donut Chart, Treemap, Waffle Chart |
| **Hierarchical & Compositional** | Sunburst Diagram, Dendrogram |
| **Multivariate & High-Dimensional**| Heatmap Matrix, Radar / Spider Chart, Correlogram |
| **Uncertainty & Diagnostics** | Error Bar Chart (SD / SE / CI95 / PI95), Forest Plot, Residual Diagnostic Plot |

---

## 3. Built-In Pedagogical Datasets (17 Presets)

1. `ambiguous_sensor_audit`: Municipal sensor measurements with numeric IDs, ZIP codes, binary flags, and pressure readings.
2. `univariate_wafer_thickness`: Semiconductor wafer oxide thickness measurements (bimodal distribution).
3. `categorical_triage_admissions`: Hospital emergency room triage acuity ratings and wait times.
4. `contingency_clinical_outcomes`: Clinical trial regimen vs. recovery tier contingency table.
5. `cat_numeric_battery_chemistry`: Energy density comparisons across lithium and solid-state chemistries.
6. `anscombe_1`: Anscombe's Quartet I (well-behaved linear relationship).
7. `anscombe_2`: Anscombe's Quartet II (perfect nonlinear quadratic structure).
8. `anscombe_3`: Anscombe's Quartet III (linear relationship with a single outlier).
9. `anscombe_4`: Anscombe's Quartet IV (high-leverage point with zero variance in x).
10. `simpsons_paradox_clinical`: Treatment efficacy paradox reversed upon controlling for disease severity.
11. `timeseries_co2_trend`: Atmospheric CO2 secular trend measurements.
12. `timeseries_seasonal_grid`: Regional electric load patterns across seasonal cycles.
13. `hierarchical_university_budget`: Multi-tiered departmental budgetary allocations.
14. `contingency_market_survey`: Multi-demographic preference distribution.
15. `uncertainty_meta_analysis`: Meta-analysis effect sizes with standard errors and confidence intervals.
16. `multivariate_air_quality`: Ambient sensor readings across particulate, ozone, and meteorological dimensions.
17. `network_energy_flows`: Regional power grid transmission network matrices.

---

## 4. Quick Start & Local Development

VisualGrammar has **zero external runtime npm or CDN dependencies** and executes entirely in modern browsers (Chrome, Edge, Firefox, Safari) using native ECMAScript modules, Canvas 2D, and CSS Custom Properties.

```bash
# 1. Run automated unit and property-based invariant test suite (25 tests)
npm test

# 2. Run static subpath safety and prose authenticity verification
npm run verify

# 3. Run full verification suite (tests + build + prose auditor)
npm run check

# 4. Launch local static HTTP server
python -m http.server 8080
# Open http://localhost:8080 in your browser
```

---

## 5. Software Architecture & Directory Layout

```
visualgrammar/
├── index.html                        # Semantic HTML5 single-page application shell
├── package.json                      # ES module package descriptor & test runners
├── .github/workflows/deploy.yml      # Automated GitHub Pages CI/CD workflow
├── css/
│   ├── tokens.css                    # Archival paper (#F6F4EE) & dark instrument (#0D1014) palettes
│   ├── base.css                      # Modern typography (Inter), responsive bento layout
│   ├── components.css                # Cards, controls, modals, tables, accessibility styles
│   └── print.css                     # High-contrast stylesheet for classroom FRQ worksheets
├── js/
│   ├── math-engine.js                # Statistical moments, OLS, KDE, ECDF, Hyndman-Fan quantiles
│   ├── data-engine.js                # RFC 4180 parser, 19-type inference, non-destructive transforms
│   ├── presets.js                    # 17 built-in sample datasets with pedagogical metadata
│   ├── chart-registry.js             # Central registry of 34 chart types (20-point specifications)
│   ├── recommendation-engine.js      # Rule-based chart suitability engine (14 inputs, 13 objectives)
│   ├── integrity-engine.js           # 13-rule graphical integrity auditor & auto-fixes
│   ├── renderer.js                   # High-DPI Canvas 2D & vector SVG plotting engine
│   ├── unity-lab.js                  # 16 Known Visualization Unity groups & multi-view synchronizer
│   ├── atlas-data.js                 # 26 concept curriculum articles (Simple / Standard / Technical)
│   ├── literacy-lab.js               # 5-step reading protocol, 15 repair experiments, 7 challenges
│   ├── exporters.js                  # SVG, PNG, RFC 4180 CSV, JSON, R, Python, and LaTeX exporters
│   ├── storage.js                    # Local-first storage wrapper & privacy management
│   └── app.js                        # Central application coordinator, event bus, and undo/redo
├── tests/
│   ├── math-engine.test.js           # Numerical precision & property-based invariant tests
│   ├── data-engine.test.js           # Parser, type inference, & transformation pipeline tests
│   ├── recommendation-integrity.test.js # Recommendation engine & integrity rule tests
│   ├── exporters-storage.test.js     # Exporter sanitization & JSON round-tripping tests
│   ├── acceptance-scenarios.test.js  # 10 end-to-end user journey acceptance tests
│   └── verify-build.py               # Subpath safety, zero-CDN, and zero-TODO verifier
├── scripts/
│   ├── prose_linter.py               # Documentation authenticity & prose quality auditor
│   └── run-verify.js                 # Cross-platform test & audit runner
├── docs/
│   ├── ARCHITECTURE.md               # Technical architecture & subsystem boundaries
│   ├── RESEARCH.md                   # Theoretical foundations & literature references
│   ├── PRIVACY.md                    # Local-first privacy guarantees & zero-telemetry policy
│   └── LAUNCH_PLAN.md                # Deployment checklist & ecosystem integration guide
└── data/samples/                     # 17 raw sample CSV files for testing & offline inspection
```

---

## 6. Privacy & Security Guarantees

- **100% Client-Side Processing**: All uploaded CSV, TSV, and JSON datasets are processed purely in local browser memory. Zero rows, column names, or statistical summaries are transmitted to external servers.
- **Zero Third-Party CDNs**: All scripts, fonts, and stylesheets are locally hosted relative to the document root (`./css/...`, `./js/...`).
- **CSV Formula Injection Sanitization**: All exported CSV files escape cells starting with `=`, `+`, `-`, or `@` to neutralize spreadsheet code injection.
- **Privacy-Safe Shareable URLs**: Shareable URL hashes encode chart configurations and dataset identifiers without serializing raw observations into URL strings.

---

## 7. DataSense Studio Ecosystem Compatibility

VisualGrammar exchanges data and analytical artifacts seamlessly with other applications in the **DataSense Studio** suite via shared JSON schemas:
- **QuartetLab**: Lossless import of `DataSenseModelOutput` JSON files (bivariate OLS models, residual diagnostics, exact-moment datasets).
- **ResampleLab**: Direct ingestion of `DataSenseSimulationResult` JSON files (bootstrap distributions, permutation null distributions).
- **ForecastLab**: Native support for `DataSenseForecastResult` JSON structures (time-series horizons, forecast intervals).

---

## 8. License

VisualGrammar is open-source software licensed under the [MIT License](LICENSE).


## Product quality and browser checks

See [PRODUCT_AUDIT.md](PRODUCT_AUDIT.md) for the responsive-interface changes, import contracts and limits, regression coverage, and remaining work. After installing the development requirements and Chromium, run `npm run test:browser` for actual browser validation.
