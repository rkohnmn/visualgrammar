/**
 * VisualGrammar — Automated Unit Tests for recommendation-engine.js and integrity-engine.js
 * Verifies Part 7 decision rules and Part 16 visualization integrity rules.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { profileDataset } from '../js/data-engine.js';
import { getPresetById } from '../js/presets.js';
import { evaluateRecommendations } from '../js/recommendation-engine.js';
import { auditChartIntegrity } from '../js/integrity-engine.js';

test('1. Recommendation Engine rules match expected chart families across all 8 canonical structures (Part 7.4)', () => {
  // 1. One nominal variable -> count bar / horizontal bar / dot / lollipop
  const nomPreset = getPresetById('categorical_triage_admissions');
  const nomProf = profileDataset(nomPreset.rows, nomPreset.headers, nomPreset.overrides);
  const nomRec = evaluateRecommendations(nomProf, {
    objective: 'compare_exact_values',
    variables: ['service_unit']
  });
  const topNomIds = nomRec.recommendations.filter(r => r.suitability === 'Recommended').map(r => r.chartId);
  assert.ok(topNomIds.includes('bar_vertical') || topNomIds.includes('bar_horizontal'));

  // 2. One continuous variable -> histogram, ECDF, boxplot, KDE
  const numPreset = getPresetById('univariate_wafer_thickness');
  const numProf = profileDataset(numPreset.rows, numPreset.headers, numPreset.overrides);
  const numRec = evaluateRecommendations(numProf, {
    objective: 'show_distribution',
    variables: ['thickness_nm']
  });
  const topNumIds = numRec.recommendations.filter(r => r.suitability === 'Recommended').map(r => r.chartId);
  assert.ok(topNumIds.includes('histogram'));
  assert.ok(topNumIds.includes('ecdf_plot'));
  assert.ok(topNumIds.includes('boxplot'));

  // 3. Two quantitative variables -> scatterplot / scatter_ols
  const bivPreset = getPresetById('anscombe_1');
  const bivProf = profileDataset(bivPreset.rows, bivPreset.headers, bivPreset.overrides);
  const bivRec = evaluateRecommendations(bivProf, {
    objective: 'examine_relationship',
    variables: ['explanatory_x', 'response_y']
  });
  const topBivIds = bivRec.recommendations.filter(r => r.suitability === 'Recommended').map(r => r.chartId);
  assert.ok(topBivIds.includes('scatter_plot'));
  assert.ok(topBivIds.includes('scatter_ols'));
  // Line chart must be rejected as Inappropriate for unordered cross-sectional quantitative pairs
  const lineRec = bivRec.recommendations.find(r => r.chartId === 'line_chart');
  assert.equal(lineRec.suitability, 'Inappropriate for the selected structure');

  // 4. Two categorical variables -> grouped bar, 100%-stacked bar, heatmap
  const cat2Preset = getPresetById('contingency_clinical_outcomes');
  const cat2Prof = profileDataset(cat2Preset.rows, cat2Preset.headers, cat2Preset.overrides);
  const cat2Rec = evaluateRecommendations(cat2Prof, {
    objective: 'show_composition',
    variables: ['regimen', 'response_tier']
  });
  const topCat2Ids = cat2Rec.recommendations.filter(r => r.suitability === 'Recommended').map(r => r.chartId);
  assert.ok(topCat2Ids.includes('bar_stacked_100'));
  assert.ok(topCat2Ids.includes('bar_grouped'));

  // 5. Categorical + quantitative -> grouped boxplot, strip plot, beeswarm
  const cqPreset = getPresetById('cat_numeric_battery_chemistry');
  const cqProf = profileDataset(cqPreset.rows, cqPreset.headers, cqPreset.overrides);
  const cqRec = evaluateRecommendations(cqProf, {
    objective: 'compare_groups',
    variables: ['chemistry', 'energy_density_wh_kg']
  });
  const topCqIds = cqRec.recommendations.filter(r => r.suitability === 'Recommended').map(r => r.chartId);
  assert.ok(topCqIds.includes('grouped_boxplot'));
  // Dynamite plot must always be rejected
  const dynRec = cqRec.recommendations.find(r => r.chartId === 'dynamite_plot_prohibited');
  assert.equal(dynRec.suitability, 'Inappropriate for the selected structure');

  // 6. Time + quantitative -> chronological line chart
  const tsPreset = getPresetById('timeseries_co2_trend');
  const tsProf = profileDataset(tsPreset.rows, tsPreset.headers, tsPreset.overrides);
  const tsRec = evaluateRecommendations(tsProf, {
    objective: 'show_change_over_time',
    variables: ['obs_date', 'co2_ppm']
  });
  const topTsIds = tsRec.recommendations.filter(r => r.suitability === 'Recommended').map(r => r.chartId);
  assert.ok(topTsIds.includes('line_chart'));

  // 7. Parameter estimates with uncertainty -> point_interval, error_bars
  const uncPreset = getPresetById('uncertainty_meta_analysis');
  const uncProf = profileDataset(uncPreset.rows, uncPreset.headers, uncPreset.overrides);
  const uncRec = evaluateRecommendations(uncProf, {
    objective: 'show_uncertainty'
  });
  const topUncIds = uncRec.recommendations.filter(r => r.suitability === 'Recommended').map(r => r.chartId);
  assert.ok(topUncIds.includes('point_interval'));

  // 8. Many correlated quantitative variables -> correlogram, parallel_coordinates
  const mvPreset = getPresetById('multivariate_air_quality');
  const mvProf = profileDataset(mvPreset.rows, mvPreset.headers, mvPreset.overrides);
  const mvRec = evaluateRecommendations(mvProf, {
    objective: 'examine_relationship',
    variables: ['pm25_ugm3', 'no2_ppb', 'ozone_ppb', 'temp_c', 'wind_kph']
  });
  const topMvIds = mvRec.recommendations.filter(r => r.suitability === 'Recommended').map(r => r.chartId);
  assert.ok(topMvIds.includes('correlogram'));
  assert.ok(topMvIds.includes('parallel_coordinates'));
});

test('2. Visualization Integrity Engine detects truncated baselines, dynamite plots, radius-scaled bubbles, and nominal lines', () => {
  const cqPreset = getPresetById('cat_numeric_battery_chemistry');
  const cqProf = profileDataset(cqPreset.rows, cqPreset.headers, cqPreset.overrides);

  // Detect prohibited dynamite plot + non-zero baseline
  const warnings = auditChartIntegrity({
    chartType: 'bar_vertical',
    x: 'chemistry',
    y: 'energy_density_wh_kg',
    aggFunc: 'mean',
    yBaseline: 100
  }, cqProf, cqPreset.rows);

  const ids = warnings.map(w => w.id);
  assert.ok(ids.includes('DYNAMITE_PLOT_PROHIBITED'));
  assert.ok(ids.includes('NON_ZERO_BAR_BASELINE'));

  // Detect radius-scaled bubble distortion
  const mvPreset = getPresetById('multivariate_air_quality');
  const mvProf = profileDataset(mvPreset.rows, mvPreset.headers, mvPreset.overrides);
  const bubWarnings = auditChartIntegrity({
    chartType: 'bubble_plot',
    x: 'temp_c',
    y: 'ozone_ppb',
    size: 'pm25_ugm3',
    sizeEncoding: 'radius'
  }, mvProf, mvPreset.rows);
  assert.ok(bubWarnings.some(w => w.id === 'BUBBLE_RADIUS_DISTORTION'));

  // Detect line connection across unordered nominal categories
  const nomPreset = getPresetById('categorical_triage_admissions');
  const nomProf = profileDataset(nomPreset.rows, nomPreset.headers, nomPreset.overrides);
  const lineWarn = auditChartIntegrity({
    chartType: 'line_chart',
    x: 'service_unit',
    y: 'wait_minutes'
  }, nomProf, nomPreset.rows);
  assert.ok(lineWarn.some(w => w.id === 'UNORDERED_LINE_CONNECTION'));
});
