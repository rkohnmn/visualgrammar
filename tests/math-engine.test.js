/**
 * VisualGrammar — Automated Unit & Property-Based Invariant Tests for math-engine.js
 * Executed via Node.js native test runner: node --test tests/*.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMulberry32,
  studentTTwoSidedPValue,
  studentTCritical95,
  inverseNormalCDF,
  quantileSorted,
  computeUnivariateStats,
  computeHistogram,
  computeKDE,
  computeECDF,
  computeContingencyTable,
  computeDatasetDiagnostics,
  evaluateRegressionIntervals,
  fitQuadraticModel,
  projectToExactMoments,
  computeACF,
  computeOneWayANOVA,
  runBootstrapMean
} from '../js/math-engine.js';
import { getPresetById } from '../js/presets.js';

test('1. Anscombe Quartet I–IV moments, OLS regression, leverage h=1.0, and quadratic fit', () => {
  const ids = ['anscombe_1', 'anscombe_2', 'anscombe_3', 'anscombe_4'];
  for (const id of ids) {
    const preset = getPresetById(id);
    const pts = preset.rows.map(r => ({ id: r.obs_id, x: r.explanatory_x, y: r.response_y }));
    const diag = computeDatasetDiagnostics(pts);
    assert.equal(diag.valid, true);
    assert.equal(diag.n, 11);
    assert.ok(Math.abs(diag.meanX - 9.0) < 1e-4, `${id} meanX`);
    assert.ok(Math.abs(diag.sdX - Math.sqrt(11)) < 1e-4, `${id} sdX`);
    assert.ok(Math.abs(diag.meanY - 7.50) < 1e-2, `${id} meanY`);
    assert.ok(Math.abs(diag.sdY - Math.sqrt(4.125)) < 1e-2, `${id} sdY`);
    assert.ok(Math.abs(diag.r - 0.816) < 2e-3, `${id} r`);
    assert.ok(Math.abs(diag.slope - 0.500) < 2e-3, `${id} slope`);
    assert.ok(Math.abs(diag.intercept - 3.00) < 1e-2, `${id} intercept`);
  }

  // Anscombe II quadratic fit R^2 > 0.999
  const a2 = getPresetById('anscombe_2').rows.map(r => ({ x: r.explanatory_x, y: r.response_y }));
  const quad = fitQuadraticModel(a2);
  assert.ok(quad !== null);
  assert.ok(quad.r2 > 0.999);

  // Anscombe III Case 3 is flagged as Influential (Cook's D > 1.0)
  const a3 = getPresetById('anscombe_3').rows.map(r => ({ id: r.obs_id, x: r.explanatory_x, y: r.response_y }));
  const diag3 = computeDatasetDiagnostics(a3);
  assert.equal(diag3.points[2].isInfluential, true);
  assert.ok(diag3.points[2].cooksDistance > 1.0);

  // Anscombe IV Case 8 has extreme leverage h_8 = 1.0 without NaN crash
  const a4 = getPresetById('anscombe_4').rows.map(r => ({ id: r.obs_id, x: r.explanatory_x, y: r.response_y }));
  const diag4 = computeDatasetDiagnostics(a4);
  assert.ok(Math.abs(diag4.points[7].leverage - 1.0) < 1e-10);
  assert.ok(Number.isFinite(diag4.points[7].cooksDistance));
});

test('2. Property-Based Invariants: OLS residuals sum to 0, orthogonality, trace(H) = 2, and CI bounds', () => {
  const rng = createMulberry32(987654);
  for (let trial = 0; trial < 25; trial++) {
    const n = 15 + (trial % 20);
    const pts = Array.from({ length: n }, (_, i) => ({
      x: (rng() - 0.5) * 100,
      y: (rng() - 0.5) * 100,
      id: `p_${i}`
    }));
    const d = computeDatasetDiagnostics(pts);
    assert.equal(d.valid, true);

    const sumE = d.points.reduce((s, p) => s + p.residual, 0);
    const sumXE = d.points.reduce((s, p) => s + p.x * p.residual, 0);
    const sumH = d.points.reduce((s, p) => s + p.leverage, 0);

    assert.ok(Math.abs(sumE) < 1e-9, `Residual sum must be 0, got ${sumE}`);
    assert.ok(Math.abs(sumXE) < 1e-7, `Predictor-residual inner product must be 0, got ${sumXE}`);
    assert.ok(Math.abs(sumH - 2.0) < 1e-9, `Trace of hat matrix must equal 2, got ${sumH}`);
    assert.ok(d.r >= -1.0 && d.r <= 1.0);

    // Verify confidence interval at centroid x = meanX
    const ivAtMean = evaluateRegressionIntervals(d, d.meanX);
    assert.ok(Math.abs(ivAtMean.yHat - d.meanY) < 1e-10);
    const expectedHalfWidth = d.tCrit95 * d.sResid * Math.sqrt(1 / d.n);
    assert.ok(Math.abs((ivAtMean.meanCI[1] - d.meanY) - expectedHalfWidth) < 1e-10);
    // Prediction interval must be strictly wider than Mean CI
    assert.ok((ivAtMean.predictionInterval[1] - ivAtMean.predictionInterval[0]) > (ivAtMean.meanCI[1] - ivAtMean.meanCI[0]));
  }
});

test('3. Histogram probability density integrates to 1.0 for both equal-width and variable-width bins', () => {
  const wafers = getPresetById('univariate_wafer_thickness').rows.map(r => r.thickness_nm);
  const histEq = computeHistogram(wafers, { binCount: 10 });
  assert.equal(histEq.valid, true);
  assert.ok(Math.abs(histEq.totalArea - 1.0) < 1e-10);
  assert.ok(Math.abs(histEq.totalRelFreq - 1.0) < 1e-10);

  // Variable-width bins
  const histVar = computeHistogram(wafers, { binEdges: [45, 50, 55, 60, 75] });
  assert.equal(histVar.valid, true);
  assert.equal(histVar.isVariableWidth, true);
  assert.ok(Math.abs(histVar.totalArea - 1.0) < 1e-10);
});

test('4. Kernel Density Estimation (KDE) integrates to 1.0 and handles Epanechnikov/Gaussian kernels', () => {
  const wafers = getPresetById('univariate_wafer_thickness').rows.map(r => r.thickness_nm);
  const kdeGauss = computeKDE(wafers, { kernel: 'gaussian', bandwidthMultiplier: 1.0 });
  assert.equal(kdeGauss.valid, true);
  assert.ok(Math.abs(kdeGauss.area - 1.0) < 1e-6);

  const kdeEpan = computeKDE(wafers, { kernel: 'epanechnikov', bandwidthMultiplier: 0.8 });
  assert.equal(kdeEpan.valid, true);
  assert.ok(Math.abs(kdeEpan.area - 1.0) < 1e-6);
});

test('5. ECDF is non-decreasing, bounded in [0, 1], and exact at sample endpoints', () => {
  const wafers = getPresetById('univariate_wafer_thickness').rows.map(r => r.thickness_nm);
  const ecdf = computeECDF(wafers);
  assert.equal(ecdf.valid, true);
  assert.equal(ecdf.evaluate(ecdf.min - 10), 0);
  assert.equal(ecdf.evaluate(ecdf.max + 10), 1);

  for (let i = 1; i < ecdf.steps.length; i++) {
    assert.ok(ecdf.steps[i].x > ecdf.steps[i - 1].x);
    assert.ok(ecdf.steps[i].cumProb >= ecdf.steps[i - 1].cumProb);
  }
  assert.ok(Math.abs(ecdf.steps[ecdf.steps.length - 1].cumProb - 1.0) < 1e-12);
});

test('6. Hyndman-Fan Type 7 quantiles, Contingency Proportions, One-Way ANOVA, and Exact-Moment Projection', () => {
  const sorted = [10, 20, 30, 40, 50];
  assert.equal(quantileSorted(sorted, 0.5), 30);
  assert.equal(quantileSorted(sorted, 0.25), 20);
  assert.equal(quantileSorted(sorted, 0.75), 40);

  // Contingency table proportions sum to 1.0
  const clin = getPresetById('contingency_clinical_outcomes').rows;
  const ct = computeContingencyTable(clin, 'regimen', 'response_tier');
  assert.equal(ct.valid, true);
  assert.equal(ct.grandTotal, 60);
  const jointSum = ct.cells.reduce((s, c) => s + c.jointProportion, 0);
  assert.ok(Math.abs(jointSum - 1.0) < 1e-10);
  for (const rKey of ct.rowLevels) {
    const rowSum = ct.cells.filter(c => c.row === rKey).reduce((s, c) => s + c.rowProportion, 0);
    assert.ok(Math.abs(rowSum - 1.0) < 1e-10);
  }

  // One-Way ANOVA SST = SSB + SSW
  const anova = computeOneWayANOVA({
    LFP: [160, 165, 170, 175],
    NMC: [250, 260, 270, 280],
    Solid: [360, 380, 400, 420]
  });
  assert.equal(anova.valid, true);
  assert.ok(Math.abs(anova.sst - (anova.ssb + anova.ssw)) < 1e-9);
  assert.ok(anova.fStat > 50);

  // Exact-Moment Projection converges to 1e-10
  const rawPts = Array.from({ length: 12 }, (_, i) => ({ x: i + 1, y: (i % 3) * 4 + i }));
  const projected = projectToExactMoments(rawPts, { meanX: 15, sdX: 4, meanY: 50, sdY: 10, r: -0.75 });
  const pDiag = computeDatasetDiagnostics(projected);
  assert.ok(Math.abs(pDiag.meanX - 15) < 1e-10);
  assert.ok(Math.abs(pDiag.sdX - 4) < 1e-10);
  assert.ok(Math.abs(pDiag.meanY - 50) < 1e-10);
  assert.ok(Math.abs(pDiag.sdY - 10) < 1e-10);
  assert.ok(Math.abs(pDiag.r - (-0.75)) < 1e-10);
});

test('7. Special Functions, ACF, Bootstrap, and Degenerate Edge Cases', () => {
  assert.ok(Math.abs(studentTCritical95(9, 0.05) - 2.262157) < 1e-4);
  assert.ok(Math.abs(studentTTwoSidedPValue(2.262157, 9) - 0.05) < 1e-4);
  assert.ok(Math.abs(inverseNormalCDF(0.975) - 1.959964) < 1e-5);

  const acf = computeACF([10, 12, 15, 19, 24, 30, 37, 45], 4);
  assert.equal(acf.valid, true);
  assert.equal(acf.lags[0].acf, 1.0);

  const boot = runBootstrapMean([10, 12, 14, 16, 18, 20], 500, 12345);
  assert.equal(boot.valid, true);
  assert.equal(boot.bootstrapMeans.length, 500);

  // Degenerate n < 3 rejected gracefully
  const deg = computeDatasetDiagnostics([{ x: 1, y: 2 }, { x: 3, y: 4 }]);
  assert.equal(deg.valid, false);

  // Constant X vector does not throw
  const constX = computeDatasetDiagnostics([{ x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }]);
  assert.equal(constX.valid, true);
  assert.equal(constX.slope, 0);
});
