# VisualGrammar Software Architecture (`ARCHITECTURE.md`)

## 1. Architectural Principles

VisualGrammar follows the canonical **DataSense Application Guidelines** (`APPLICATION_GUIDELINES.md`):
- **100% Client-Side Static Execution**: Zero server-side computation, databases, or third-party telemetry.
- **Zero Runtime Dependencies**: All statistical algorithms, CSV/JSON parsers, recommendation engines, integrity audits, and High-DPI Canvas/SVG renderers are implemented in modular standard ECMAScript (ES2022+).
- **Strict Separation of Concerns**: Pure mathematical and data-processing modules have zero DOM dependencies and are directly verifiable under `node --test`.

## 2. Module Boundaries & Responsibilities

```
visualgrammar/
├── index.html                        # 9-destination semantic HTML5 shell, ARIA landmarks, modals
├── DESIGN.md                         # Canonical DataSense design specification
├── package.json                      # Zero-dependency ES module manifest & test scripts
├── .github/workflows/deploy.yml      # GitHub Pages CI/CD pipeline
├── css/
│   ├── tokens.css                    # Light archival (#F6F4EE) & dark instrument (#0D1014) tokens
│   ├── base.css                      # Reset, typography, responsive bento grids, focus rings
│   ├── components.css                # Cards, tables, segmented controls, canvas containers
│   └── print.css                     # High-contrast print stylesheet for classroom handouts
├── js/
│   ├── math-engine.js                # Pure statistical & numerical algorithms (Float64)
│   ├── data-engine.js                # RFC 4180 parser, 19-type inference, transformation pipeline
│   ├── presets.js                    # 17 built-in sample datasets with learning metadata
│   ├── chart-registry.js             # Central registry of 34 chart types (20-point specs)
│   ├── recommendation-engine.js      # Rule-based recommendation engine (14 inputs, 13 objectives)
│   ├── integrity-engine.js           # 13-rule graphical & mathematical integrity auditor
│   ├── renderer.js                   # High-DPI Canvas 2D & vector SVG plotting engine
│   ├── unity-lab.js                  # 16 Known Visualization Unity groups & similarity ontology
│   ├── atlas-data.js                 # 26 Concept Library articles (Simple/Standard/Technical)
│   ├── literacy-lab.js               # 5-step reading guide, 15 repair experiments, 7 challenges
│   ├── exporters.js                  # SVG, PNG, CSV, Config JSON, DataSense JSON, R, Python, LaTeX
│   ├── storage.js                    # Safe try/catch localStorage wrapper & privacy controls
│   └── app.js                        # Main event coordinator, state, & undo/redo stacks
├── tests/
│   ├── math-engine.test.js           # Unit & property-based invariant tests
│   ├── data-engine.test.js           # Parser, type inference, & transformation tests
│   ├── recommendation-integrity.test.js # Recommendation & integrity rule verification
│   ├── exporters-storage.test.js     # CSV sanitization & JSON round-tripping tests
│   └── verify-build.py               # Subpath & static asset verifier
└── scripts/
    └── prose_linter.py               # Deterministic prose quality auditor
```

## 3. Central Chart Registry & Similarity Ontology

`js/chart-registry.js` serves as the single source of truth across the entire application. Every chart definition specifies its accepted variable types, compatible analytical objectives, geometric marks, required transformations, mathematical interpretation, strengths, weaknesses, common mistakes, and `unityGroup` key. This eliminates metadata duplication across the Recommendation Engine, Chart Studio, Known Visualization Unity, and Visualization Atlas.
