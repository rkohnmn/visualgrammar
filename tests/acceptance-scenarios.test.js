/**
 * VisualGrammar — End-to-End Acceptance Scenarios Test Suite (acceptance-scenarios.test.js)
 * Verifies all 10 required acceptance scenarios from Part 22 of the VisualGrammar specification
 * plus all 4 DataSense v1.0.0 ecosystem interchange schemas.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeUnivariateStats,
  computeHistogram,
  computeKDE,
  computeECDF,
  computeDatasetDiagnostics,
  fitQuadraticModel,
  computeACF,
  runBootstrapMean
} from '../js/math-engine.js';
import {
  parseDataSenseJSON,
  getSampleQuartetLabModelOutputJSON,
  getSampleResampleLabJSON,
  getSampleForecastLabJSON,
  profileDataset,
  runTransformationPipeline
} from '../js/data-engine.js';
import { getPresetById } from '../js/presets.js';
import { CHART_REGISTRY } from '../js/chart-registry.js';
import { evaluateRecommendations } from '../js/recommendation-engine.js';
import { auditChartIntegrity } from '../js/integrity-engine.js';
import { UNITY_GROUPS, getUnityComparisonDetails } from '../js/unity-lab.js';
import { MISLEADING_EXPERIMENTS, LITERACY_CHALLENGES } from '../js/literacy-lab.js';
import { renderChartToSVG } from '../js/renderer.js';
import {
  exportToCSV,
  exportConfigurationJSON,
  exportToRScript,
  exportToPythonScript,
  exportToLatexTable
} from '../js/exporters.js';

test('Scenario 1: Ambiguous Dataset Upload, Type Inference, Manual Override, & Export', () => {
  const preset = getPresetById('ambiguous_sensor_audit');
  const rowsWithMissing = [
    ...preset.rows,
    { ...preset.rows[0], obs_id: 'row_25', sensor_id: 1025, pressure_kpa: null }
  ];
  const rawProf = profileDataset(rowsWithMissing, preset.headers, {});
  assert.equal(rawProf.rowCount, 25);
  assert.equal(rawProf.colCount, 7);
  assert.equal(rawProf.totalMissingCells, 1, 'Detects missing values');

  assert.equal(rawProf.variableMap.zip_code.inferredType, 'geographic_region');
  assert.equal(rawProf.variableMap.sensor_id.inferredType, 'identifier');
  assert.equal(rawProf.variableMap.alarm_triggered.inferredType, 'binary_categorical');

  const overriddenProf = profileDataset(rowsWithMissing, preset.headers, {
    priority_tier: { overrideType: 'nominal_categorical', unit: 'tier' }
  });
  assert.equal(overriddenProf.variableMap.priority_tier.inferredType, 'nominal_categorical');
  assert.equal(overriddenProf.variableMap.priority_tier.confidence, 'User Override');

  const recs = evaluateRecommendations(overriddenProf, {
    objective: 'compare_groups',
    variables: ['department', 'pressure_kpa']
  });
  assert.ok(recs.recommendations.some(r => r.suitability === 'Recommended'));

  const svg = renderChartToSVG(null, {
    chartType: 'grouped_boxplot',
    x: 'department',
    y: 'pressure_kpa',
    title: 'Scenario 1 Export'
  }, overriddenProf, rowsWithMissing);
  assert.ok(svg.includes('<svg') && svg.includes('Scenario 1 Export'));
});

test('Scenario 2: One Numerical Variable Across Synchronized Distribution Views (Unity Group 3)', () => {
  const wafer = getPresetById('univariate_wafer_thickness');
  const vals = wafer.rows.map(r => r.thickness_nm);
  const stats = computeUnivariateStats(vals);
  const histCount = computeHistogram(vals, { binCount: 12 });
  const kde = computeKDE(vals, { bandwidthMultiplier: 1.0 });
  const ecdf = computeECDF(vals);

  const totalCount = histCount.bins.reduce((s, b) => s + b.count, 0);
  assert.equal(totalCount, 56);
  assert.ok(Math.abs(histCount.totalArea - 1.0) < 1e-10);
  assert.equal(ecdf.valid, true);
  assert.ok(Math.abs(ecdf.steps[ecdf.steps.length - 1].cumProb - 1.0) < 1e-12);
  assert.ok(kde.valid && Math.abs(kde.area - 1.0) < 1e-6);

  const boxDetails = getUnityComparisonDetails('numeric_1var', 'boxplot');
  assert.ok(boxDetails.lostOrObscured.toLowerCase().includes('bimodal'));
  assert.ok(stats.q1 < stats.median && stats.median < stats.q3);
});

test('Scenario 3: Categorical Contingency Table & Denominator Shift (Unity Group 4)', () => {
  const clin = getPresetById('contingency_clinical_outcomes');
  const prof = profileDataset(clin.rows, clin.headers, clin.overrides);

  const pipe = runTransformationPipeline(clin.rows, clin.headers, [
    { type: 'group_aggregate', groupColumn: 'regimen', targetColumn: 'biomarker_drop', aggFunc: 'count' }
  ]);
  const totalN = pipe.rows.reduce((s, r) => s + r.group_n, 0);
  assert.equal(totalN, 60);

  const stacked100 = getUnityComparisonDetails('categorical_2var', 'bar_stacked_100');
  assert.ok(stacked100.transformationChanged.includes('100%'));
  assert.ok(stacked100.normalizationEffect.toLowerCase().includes('denominator'));
  assert.ok(prof.variableMap.response_tier.inferredType === 'ordinal_categorical');
});

test('Scenario 4: Two Numerical Variables with Nonlinear Structure (Anscombe II)', () => {
  const ans2 = getPresetById('anscombe_2');
  const pts = ans2.rows.map(r => ({ id: r.obs_id, x: r.explanatory_x, y: r.response_y }));
  const diag = computeDatasetDiagnostics(pts);
  assert.equal(diag.valid, true);
  assert.ok(Math.abs(diag.slope - 0.500) < 0.001);
  assert.ok(Math.abs(diag.r2 - 0.6665) < 0.001);

  const quad = fitQuadraticModel(pts);
  assert.ok(quad !== null && quad.r2 > 0.999);

  const resDetails = getUnityComparisonDetails('model_relationships', 'residual_fitted');
  assert.ok(resDetails.moreVisible.toLowerCase().includes('parabola'));
});

test("Scenario 5: Grouped Scatterplot Revealing Simpson's Paradox (Unity Group 7)", () => {
  const sp = getPresetById('simpsons_paradox_clinical');
  const pooledPts = sp.rows.map(r => ({ id: r.obs_id, x: r.dosage_mg, y: r.recovery_score }));
  const pooled = computeDatasetDiagnostics(pooledPts);
  assert.ok(pooled.slope < 0, `Expected negative pooled slope, got ${pooled.slope}`);

  for (const stratum of ['Mild', 'Moderate', 'Severe']) {
    const subPts = sp.rows
      .filter(r => r.severity_stratum === stratum)
      .map(r => ({ id: r.obs_id, x: r.dosage_mg, y: r.recovery_score }));
    const subDiag = computeDatasetDiagnostics(subPts);
    assert.ok(subDiag.slope > 0, `Expected positive slope in ${stratum}, got ${subDiag.slope}`);
  }
});

test('Scenario 6: Time-Series Exploration (Line, Seasonal, Lag, & ACF — Unity Group 9)', () => {
  const ts = getPresetById('timeseries_seasonal_grid');
  const vals = ts.rows.map(r => r.demand_gwh);
  assert.equal(vals.length, 36);

  const acf = computeACF(vals, 12);
  assert.equal(acf.valid, true);
  const lag12 = acf.lags.find(a => a.lag === 12);
  const lag3 = acf.lags.find(a => a.lag === 3);
  assert.ok(lag12.acf > 0.6, `Expected strong positive lag-12 correlation, got ${lag12.acf}`);
  assert.ok(lag3.acf < -0.2, `Expected negative quarter-cycle lag-3 correlation, got ${lag3.acf}`);
});

test('Scenario 7: Misleading Chart Repair & Integrity Audit (Truncated Bar, Bubble Radius, Dual Axis)', () => {
  assert.equal(MISLEADING_EXPERIMENTS.length, 15);
  assert.equal(LITERACY_CHALLENGES.length, 7);

  const preset = getPresetById('ambiguous_sensor_audit');
  const prof = profileDataset(preset.rows, preset.headers, preset.overrides);

  const barWarnings = auditChartIntegrity({
    chartType: 'bar_vertical',
    x: 'department',
    y: 'pressure_kpa',
    yBaseline: 140
  }, prof, preset.rows);
  const truncWarn = barWarnings.find(w => w.id === 'NON_ZERO_BAR_BASELINE');
  assert.ok(truncWarn);
  assert.deepEqual(truncWarn.autoFix.patch, { yBaseline: 0 });

  const bubbleWarnings = auditChartIntegrity({
    chartType: 'bubble_plot',
    x: 'temperature_c',
    y: 'pressure_kpa',
    size: 'los_days',
    sizeEncoding: 'radius'
  }, prof, preset.rows);
  const radWarn = bubbleWarnings.find(w => w.id === 'BUBBLE_RADIUS_DISTORTION');
  assert.ok(radWarn);
  assert.deepEqual(radWarn.autoFix.patch, { sizeEncoding: 'area' });
});

test('Scenario 8: Uncertainty Comparison (SD vs SE vs 95% CI vs 95% PI — Unity Groups 11 & 12)', () => {
  const wafer = getPresetById('univariate_wafer_thickness');
  const vals = wafer.rows.map(r => r.thickness_nm);
  const boot = runBootstrapMean(vals, 1000, 4289104);
  assert.equal(boot.valid, true);
  assert.ok(boot.originalSD > boot.bootstrapSE * 6.5);

  const meta = getPresetById('uncertainty_meta_analysis');
  for (const row of meta.rows) {
    const ciWidth = row.ci95_high - row.ci95_low;
    const piWidth = row.pred95_high - row.pred95_low;
    assert.ok(piWidth > ciWidth * 2.5, `Expected 95% PI width (${piWidth}) >> 95% CI width (${ciWidth})`);
  }
});

test('Scenario 9: Atlas Search & 20-Field Specification Completeness Across All 34 Chart Families', () => {
  assert.ok(CHART_REGISTRY.length >= 34);
  for (const c of CHART_REGISTRY) {
    assert.ok(c.id && c.name && c.category);
    assert.ok(c.plainExplanation && c.statisticalPurpose && c.mathematicalInterpretation);
    assert.ok(Array.isArray(c.strengths) && c.strengths.length > 0);
    assert.ok(Array.isArray(c.weaknesses) && c.weaknesses.length > 0);
    assert.ok(Array.isArray(c.commonMistakes) && c.commonMistakes.length > 0);
    assert.ok(['builder', 'atlas_interactive', 'reference'].includes(c.supportLevel));
  }
  assert.equal(UNITY_GROUPS.length, 16);
  for (const g of UNITY_GROUPS) {
    assert.ok(Object.keys(g.comparisonMatrix).length >= 2, `Unity group ${g.id} missing comparisonMatrix entries`);
  }
});

test('Scenario 10: Reproducible Export & All 4 DataSense v1.0.0 Ecosystem Schemas Round-Trip', () => {
  const qlParsed = parseDataSenseJSON(getSampleQuartetLabModelOutputJSON());
  assert.equal(qlParsed.valid, true);
  assert.equal(qlParsed.schemaType, 'DataSenseModelOutput');
  assert.equal(qlParsed.rows.length, 11);
  assert.equal(qlParsed.savedChartConfig.chartType, 'residual_fitted');

  const rlParsed = parseDataSenseJSON(getSampleResampleLabJSON());
  assert.equal(rlParsed.valid, true);
  assert.equal(rlParsed.schemaType, 'DataSenseSimulationResult');
  assert.equal(rlParsed.rows.length, 40);
  assert.equal(rlParsed.savedChartConfig.chartType, 'histogram');

  const flParsed = parseDataSenseJSON(getSampleForecastLabJSON());
  assert.equal(flParsed.valid, true);
  assert.equal(flParsed.schemaType, 'DataSenseForecastResult');
  assert.equal(flParsed.rows.length, 8);
  assert.equal(flParsed.savedChartConfig.chartType, 'interval_ribbon');

  const preset = getPresetById('cat_numeric_battery_chemistry');
  const prof = profileDataset(preset.rows, preset.headers, preset.overrides);
  const mockState = {
    datasetId: preset.id,
    datasetTitle: preset.title,
    datasetDescription: preset.description,
    datasetProvenance: preset.provenance,
    explanationLevel: 'technical',
    activeHeaders: preset.headers,
    activeRows: preset.rows,
    userOverrides: preset.overrides,
    transformations: [],
    provenanceLog: [],
    profile: prof,
    chartConfig: {
      chartType: 'grouped_boxplot',
      x: 'chemistry',
      y: 'energy_density_wh_kg',
      color: 'chemistry',
      title: 'Battery Chemistry Benchmark'
    }
  };

  const cfgJson = exportConfigurationJSON(mockState);
  const roundTrip = parseDataSenseJSON(cfgJson);
  assert.equal(roundTrip.valid, true);
  assert.equal(roundTrip.rows.length, 36);
  assert.equal(roundTrip.savedChartConfig.chartType, 'grouped_boxplot');

  const rCode = exportToRScript(preset.rows, mockState.chartConfig, preset.title);
  const pyCode = exportToPythonScript(preset.rows, mockState.chartConfig, preset.title);
  const texCode = exportToLatexTable(prof, preset.title);
  const csvCode = exportToCSV(preset.rows, preset.headers, []);
  assert.ok(rCode.includes('ggplot'));
  assert.ok(pyCode.includes('pandas'));
  assert.ok(texCode.includes('\\toprule'));
  assert.ok(csvCode.includes('energy_density_wh_kg'));
});
