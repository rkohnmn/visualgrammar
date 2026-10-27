# Testing & Verification Strategy (`TESTING.md`)

VisualGrammar includes a multi-layer automated verification suite covering mathematical accuracy, algebraic invariants, data parsing, type inference, recommendation rules, visualization integrity warnings, export security, and static subpath deployability.

## 1. Running the Verification Suite

```bash
# Execute all Node.js unit and property-based invariant test suites
node --test tests/*.test.js

# Execute static build, relative-path, and zero-CDN verifier
python3 tests/verify-build.py

# Execute prose quality auditor across documentation
python3 scripts/prose_linter.py README.md ARCHITECTURE.md METHODS.md DATA_FORMATS.md TESTING.md COVERAGE_MATRIX.md DEVELOPMENT.md
```

## 2. Test Suite Breakdown

1. **`tests/math-engine.test.js`**:
   - Verifies Anscombe's Quartet I–IV moments, OLS slopes, intercepts, quadratic $R^2 > 0.999$, Cook's distance $D_3 > 1.0$, and extreme leverage $h_8 = 1.0000$.
   - Runs 25 randomized property-based invariant trials verifying $\sum e_i = 0$, $\sum x_i e_i = 0$, $\operatorname{tr}(\mathbf{H}) = \sum h_i = 2$, $r \in [-1, 1]$, and hyperbolic confidence/prediction band geometry.
   - Verifies that Histogram probability density integrates to $1.0000$ on both equal-width and variable-width bins.
   - Verifies KDE unit area normalization ($\int \hat{f}_h(x)dx = 1.0$) and ECDF monotonicity.
   - Verifies contingency table row-conditional and joint proportion reconciliation, One-Way ANOVA ($SST = SSB + SSW$), Student-$t$ critical values, ACF, Bootstrap, and Gram-Schmidt exact-moment projection ($10^{-10}$ precision).
2. **`tests/data-engine.test.js`**:
   - Verifies RFC 4180 CSV/TSV parsing with embedded commas, escaped quotes, missing tokens, and leading-zero ZIP codes.
   - Verifies automatic type disambiguation (distinguishing `sensor_id`, `zip_code`, `0/1` binary indicators, ordinal tiers, and continuous measurements) and user overrides.
   - Verifies non-destructive transformation immutability and provenance logging.
3. **`tests/recommendation-integrity.test.js`**:
   - Verifies recommendation rules across all 8 canonical data structures in Part 7.4.
   - Verifies Integrity Engine detection of dynamite plots, truncated bar baselines, radius-scaled bubbles, and nominal line connections.
4. **`tests/exporters-storage.test.js`**:
   - Verifies CSV formula injection protection (`=`, `+`, `-`, `@`) and lossless JSON / URL hash round-tripping.
