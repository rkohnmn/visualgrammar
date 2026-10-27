# Local-First Privacy & Security Guarantee (`docs/PRIVACY.md`)

## 1. Zero-Backend, 100% Client-Side Data Processing

VisualGrammar executes entirely inside the user's local web browser:
- **Zero Data Transmission**: Uploaded CSV, TSV, and JSON files are parsed in browser memory via the HTML5 `FileReader` API. No dataset rows, column names, or analytical outputs are ever transmitted to any external server, API, or telemetry endpoint.
- **Zero Third-Party Trackers or CDNs**: `index.html` loads zero external scripts, fonts, or tracking pixels, ensuring complete compliance with student data privacy regulations (FERPA, GDPR) and offline classroom networks.

## 2. Local Storage & Shareable Link Safety

- Active session preferences and recent workspace state are saved to `localStorage` wrapped in safe `try/catch` blocks (`js/storage.js`) and can be wiped at any time via the **Clear Stored Data** button on the Home screen.
- Shareable URL hashes (`#state=...`) encode only chart configuration settings and built-in preset identifiers—never raw uploaded user datasets.
