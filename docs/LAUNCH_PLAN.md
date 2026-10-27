# Static Deployment & Launch Plan (`docs/LAUNCH_PLAN.md`)

## 1. GitHub Pages Deployment Checklist

1. Push repository to GitHub (`main` branch).
2. In Repository Settings → **Pages**, set Build and Deployment source to **GitHub Actions**.
3. The included workflow `.github/workflows/deploy.yml` runs:
   - `node --test tests/*.test.js` (Unit & property-based mathematical verification)
   - `python3 tests/verify-build.py` (Relative asset path, zero-CDN, and zero-TODO verification)
   - `python3 scripts/prose_linter.py` (Documentation quality verification)
   - `actions/deploy-pages@v4` (Static publication to `https://<organization>.github.io/visualgrammar/`)

## 2. Ecosystem Integration Verification

- Verify cross-application navigation links in the top DataSense Studio bar (`QuartetLab`, `ResampleLab`, `ForecastLab`).
- Verify `DataSenseDataset` v1.0.0 JSON export/import round-tripping with QuartetLab.
