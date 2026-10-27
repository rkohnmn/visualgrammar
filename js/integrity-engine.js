/**
 * VisualGrammar — Data Visualization Integrity Engine (integrity-engine.js)
 * Conforms strictly to Part 16 of the VisualGrammar specification and VISUALIZATION_STANDARDS.md.
 * Evaluates active chart configurations for mathematical, statistical, and perceptual integrity violations.
 */

import { getChartById } from './chart-registry.js';
import { computeUnivariateStats, EPSILON } from './math-engine.js';

/**
 * Audit a chart configuration against dataset profile and active rows.
 * Returns an array of structured warnings, each containing:
 * - id, statement, reason, interpretiveEffect, suggestedCorrection, severity ('fatal' | 'warning' | 'advisory'),
 *   learnConceptId, and optional autoFix descriptor.
 */
export function auditChartIntegrity(config, profile, rows) {
  if (!config || !profile || !Array.isArray(rows)) return [];

  const warnings = [];
  const chart = getChartById(config.chartType);
  const xVar = config.x ? profile.variableMap[config.x] : null;
  const yVar = config.y ? profile.variableMap[config.y] : null;
  const colorVar = config.color ? profile.variableMap[config.color] : null;
  const sizeVar = config.size ? profile.variableMap[config.size] : null;

  // 1. Prohibited "Dynamite Plot" (Bar chart of continuous group means)
  const isBarFamily = ['bar_vertical', 'bar_horizontal', 'lollipop_chart'].includes(config.chartType);
  if (
    config.chartType === 'dynamite_plot_prohibited' ||
    (isBarFamily && xVar && yVar &&
     ['nominal_categorical', 'ordinal_categorical', 'grouping_variable', 'binary_categorical'].includes(xVar.inferredType) &&
     yVar.inferredType === 'continuous_quantitative' &&
     (config.aggFunc === 'mean' || config.aggFunc === 'median'))
  ) {
    warnings.push({
      id: 'DYNAMITE_PLOT_PROHIBITED',
      severity: 'fatal',
      statement: 'Bar Chart Used for Continuous Group Means ("Dynamite Plot")',
      reason: `Drawing solid bars from zero to the ${config.aggFunc || 'mean'} of continuous variable "${yVar?.name || 'Y'}" violates VISUALIZATION_STANDARDS.md Section B.4.`,
      interpretiveEffect: 'Conceals within-group sample size, skewness, bimodality, and outliers while visually implying that data values exist uniformly inside the bar and not above it.',
      suggestedCorrection: 'Switch to a Grouped Boxplot with Jittered Points, Violin Plot, or Point Estimate with Confidence Interval plot.',
      learnConceptId: 'graphical_integrity',
      autoFix: {
        label: 'Switch to Grouped Boxplot + Points',
        patch: { chartType: 'grouped_boxplot' }
      }
    });
  }

  // 2. Misleading Non-Zero Baseline on Length/Area Encoded Charts
  const requiresZeroBaseline = ['bar_vertical', 'bar_horizontal', 'bar_grouped', 'bar_stacked', 'lollipop_chart', 'area_chart'].includes(config.chartType);
  const baselineVal = Number(config.yBaseline || 0);
  if (requiresZeroBaseline && Math.abs(baselineVal) > EPSILON) {
    warnings.push({
      id: 'NON_ZERO_BAR_BASELINE',
      severity: 'fatal',
      statement: `Truncated Non-Zero Baseline (Baseline set to ${baselineVal})`,
      reason: `${chart.name} encodes quantity via bar/stem length or shaded area from the origin. Setting the baseline to ${baselineVal} breaks the proportional relationship between visual length and numerical value.`,
      interpretiveEffect: 'Exaggerates small differences into dramatic visual multiples (e.g., a 10% difference can appear 300% taller).',
      suggestedCorrection: 'Reset the baseline to 0.0, or switch to a Cleveland Dot Plot if comparing narrow interval-scale differences.',
      learnConceptId: 'position_and_magnitude',
      autoFix: {
        label: 'Reset Baseline to 0',
        patch: { yBaseline: 0 }
      }
    });
  }

  // 3. Identifier or Postal Code Mapped as Quantitative Axis
  for (const [axisLabel, vObj] of [['X', xVar], ['Y', yVar], ['Size', sizeVar]]) {
    if (!vObj) continue;
    if (vObj.inferredType === 'identifier' && !['matrix_heatmap', 'slopegraph'].includes(config.chartType)) {
      warnings.push({
        id: `IDENTIFIER_ON_${axisLabel}_AXIS`,
        severity: 'fatal',
        statement: `Identifier Variable "${vObj.name}" Mapped to ${axisLabel} Axis`,
        reason: `"${vObj.name}" is classified as a General Identifier (${vObj.uniqueCount} unique labels). Identifiers carry no quantitative magnitude or distance.`,
        interpretiveEffect: 'Averaging, correlating, or binning arbitrary ID numbers produces mathematically meaningless patterns.',
        suggestedCorrection: `Select a true quantitative or categorical measurement variable for the ${axisLabel} axis.`,
        learnConceptId: 'aesthetic_mappings',
        autoFix: null
      });
    }
    if (vObj.inferredType === 'geographic_region' && axisLabel === 'Y' && isBarFamily && (config.aggFunc === 'mean' || config.aggFunc === 'sum')) {
      warnings.push({
        id: 'ZIP_CODE_ARITHMETIC',
        severity: 'fatal',
        statement: `Arithmetic Aggregation on Geographic Code "${vObj.name}"`,
        reason: `"${vObj.name}" represents postal/ZIP or region codes. Even when stored as digits, region codes are nominal identifiers, not continuous quantities.`,
        interpretiveEffect: 'Summing or averaging postal codes produces nonsensical numbers.',
        suggestedCorrection: 'Move the geographic region variable to the categorical X axis or group selector.',
        learnConceptId: 'aesthetic_mappings',
        autoFix: null
      });
    }
  }

  // 4. Invalid Logarithmic Domain (Non-Positive Values on Log Scale)
  if (config.logScaleX && xVar && xVar.numericStats && xVar.numericStats.min <= 0) {
    warnings.push({
      id: 'INVALID_LOG_DOMAIN_X',
      severity: 'fatal',
      statement: `Invalid Logarithmic Domain on X Axis ("${xVar.name}" has minimum ${xVar.numericStats.min})`,
      reason: 'The real logarithm ln(x) and log10(x) are mathematically undefined for x <= 0.',
      interpretiveEffect: 'Zero and negative observations cannot be plotted on a logarithmic axis and would be silently dropped or distorted.',
      suggestedCorrection: 'Switch X axis back to a Linear scale.',
      learnConceptId: 'linear_and_nonlinear_scales',
      autoFix: {
        label: 'Use Linear X Scale',
        patch: { logScaleX: false }
      }
    });
  }
  if (config.logScaleY && yVar && yVar.numericStats && yVar.numericStats.min <= 0) {
    warnings.push({
      id: 'INVALID_LOG_DOMAIN_Y',
      severity: 'fatal',
      statement: `Invalid Logarithmic Domain on Y Axis ("${yVar.name}" has minimum ${yVar.numericStats.min})`,
      reason: 'Logarithmic scaling requires strictly positive values (y > 0).',
      interpretiveEffect: 'Zero or negative values cannot be represented on a logarithmic scale.',
      suggestedCorrection: 'Switch Y axis back to a Linear scale.',
      learnConceptId: 'linear_and_nonlinear_scales',
      autoFix: {
        label: 'Use Linear Y Scale',
        patch: { logScaleY: false }
      }
    });
  }

  // 5. Improper Line Connection Across Unordered Nominal Categories
  if (['line_chart', 'area_chart'].includes(config.chartType) && xVar && xVar.inferredType === 'nominal_categorical') {
    warnings.push({
      id: 'UNORDERED_LINE_CONNECTION',
      severity: 'fatal',
      statement: `Line Connection Across Unordered Nominal Categories ("${xVar.name}")`,
      reason: `"${xVar.name}" is an unordered nominal categorical variable. Connecting discrete categories with continuous slope lines violates VISUALIZATION_STANDARDS.md Section A.1.`,
      interpretiveEffect: 'Implies a continuous sequential transition and meaningful intermediate slopes between arbitrary categories whose order can be shuffled.',
      suggestedCorrection: 'Switch to a Vertical Bar Chart, Horizontal Bar Chart, or Cleveland Dot Plot.',
      learnConceptId: 'ordering',
      autoFix: {
        label: 'Switch to Vertical Bar Chart',
        patch: { chartType: 'bar_vertical' }
      }
    });
  }

  // 6. Misleading Bubble Size Encoding (Radius Instead of Area)
  if (['bubble_plot', 'geo_bubble_map'].includes(config.chartType) && config.sizeEncoding === 'radius') {
    warnings.push({
      id: 'BUBBLE_RADIUS_DISTORTION',
      severity: 'fatal',
      statement: 'Bubble Size Mapped to Radius Instead of Area (Quadratic Distortion)',
      reason: 'Mapping a numeric value directly to circle radius r causes circle area A = pi * r^2 to grow with the square of the value (VISUALIZATION_STANDARDS.md Section C.2).',
      interpretiveEffect: 'A value that is 3x larger appears 9x larger in visual area, severely exaggerating differences.',
      suggestedCorrection: 'Map magnitude to Circle Area (r proportional to sqrt(value)).',
      learnConceptId: 'position_and_magnitude',
      autoFix: {
        label: 'Scale by Area (r ∝ √value)',
        patch: { sizeEncoding: 'area' }
      }
    });
  }

  // 7. Excessive Categorical Cardinality (Pie > 4 slices or Color Hue > 10 groups)
  if (['pie_chart', 'donut_chart'].includes(config.chartType) && xVar && xVar.uniqueCount > 4) {
    warnings.push({
      id: 'PIE_EXCESSIVE_SLICES',
      severity: 'warning',
      statement: `Pie/Donut Chart with ${xVar.uniqueCount} Categories (> 4 Threshold)`,
      reason: 'VISUALIZATION_STANDARDS.md Section B.1 prohibits pie/donut charts for quantitative comparisons with > 3–4 categories.',
      interpretiveEffect: 'Human visual perception cannot accurately rank acute sector angles and non-aligned wedge areas across many slices.',
      suggestedCorrection: 'Switch to a Horizontal Bar Chart or Lollipop Chart sorted by magnitude.',
      learnConceptId: 'perceptual_limitations',
      autoFix: {
        label: 'Switch to Horizontal Bar Chart',
        patch: { chartType: 'bar_horizontal' }
      }
    });
  }

  if (colorVar && ['categorical', 'metadata'].includes(colorVar.taxonomy.family) && colorVar.uniqueCount > 8) {
    warnings.push({
      id: 'EXCESSIVE_COLOR_CARDINALITY',
      severity: 'warning',
      statement: `High Color Hue Cardinality (${colorVar.uniqueCount} Distinct Categories in "${colorVar.name}")`,
      reason: 'Human working memory and color vision cannot reliably distinguish more than 7–8 discrete categorical hues, especially under color-vision deficiency.',
      interpretiveEffect: 'Readers must repeatedly scan back and forth to the legend, and similar hues become indistinguishable.',
      suggestedCorrection: 'Use a Horizontal Bar Chart, Small Multiples, or group minor categories.',
      learnConceptId: 'color_semantics',
      autoFix: null
    });
  }

  // 8. Geographic Count-vs-Rate Confusion on Choropleth Map
  if (config.chartType === 'choropleth_map' && yVar && ['count', 'discrete_quantitative'].includes(yVar.inferredType)) {
    warnings.push({
      id: 'CHOROPLETH_RAW_COUNT_CONFUSION',
      severity: 'warning',
      statement: `Raw Count Variable "${yVar.name}" Mapped to Choropleth Shading`,
      reason: 'Choropleth shading encodes regional intensity and should represent normalized rates, percentages, or per-capita ratios rather than raw counts.',
      interpretiveEffect: 'Shading raw totals largely reproduces a map of population size rather than underlying risk or rate intensity.',
      suggestedCorrection: 'Map a normalized rate variable (e.g., drought_stress_rate) or switch to a Geographic Bubble Map for raw totals.',
      learnConceptId: 'normalization',
      autoFix: {
        label: 'Switch to Geographic Bubble Map',
        patch: { chartType: 'geo_bubble_map' }
      }
    });
  }

  // 9. Small Sample Size Warning for KDE / Violin
  if (['kde_density', 'violin_plot'].includes(config.chartType) && rows.length < 25) {
    warnings.push({
      id: 'SMALL_SAMPLE_KDE_WARNING',
      severity: 'warning',
      statement: `Kernel Density Smoothing on Small Sample (n = ${rows.length} < 30)`,
      reason: 'VISUALIZATION_STANDARDS.md Section B.2 cautions against standalone KDE/Violin curves on small samples where kernel bandwidth dominates observed shape.',
      interpretiveEffect: 'Smooth curves can fabricate apparent density modes in empty gaps and bleed beyond physical minimum/maximum boundaries.',
      suggestedCorrection: 'Enable raw point/rug overlays or switch to an ECDF or Jittered Strip Plot.',
      learnConceptId: 'smoothing',
      autoFix: {
        label: 'Switch to ECDF Plot',
        patch: { chartType: 'ecdf_plot' }
      }
    });
  }

  // 10. Standalone Boxplot Concealing Bimodality
  if (config.chartType === 'boxplot' && xVar && xVar.numericStats) {
    const { excessKurtosis, n } = xVar.numericStats;
    if (n >= 20 && excessKurtosis < -0.7 && !config.showRawPoints) {
      warnings.push({
        id: 'BOXPLOT_BIMODAL_MASKING',
        severity: 'advisory',
        statement: `Standalone Boxplot May Conceal Platykurtic / Bimodal Structure (Kurtosis = ${excessKurtosis.toFixed(2)})`,
        reason: `"${xVar.name}" has negative excess kurtosis (${excessKurtosis.toFixed(2)}), often indicative of two separated modes or clusters.`,
        interpretiveEffect: 'A five-number summary boxplot looks identical whether observations cluster in the middle or split into two distinct peaks inside the IQR.',
        suggestedCorrection: 'Overlay individual jittered points or compare with a Violin Plot / Histogram.',
        learnConceptId: 'aggregation',
        autoFix: {
          label: 'Overlay Individual Points',
          patch: { showRawPoints: true }
        }
      });
    }
  }

  // 11. Overplotting Warning on Dense Scatterplots
  if (['scatter_plot', 'scatter_ols'].includes(config.chartType) && rows.length >= 50 && (config.opacity || 0.85) > 0.85) {
    warnings.push({
      id: 'OVERPLOTTING_OPAQUE_POINTS',
      severity: 'advisory',
      statement: `Potential Point Occlusion (${rows.length} Observations at High Opacity)`,
      reason: 'Opaque markers in dense scatter regions stack on top of one another, hiding coincident observations.',
      interpretiveEffect: 'A cluster of 20 overlapping points looks identical to a single point.',
      suggestedCorrection: 'Reduce marker opacity (alpha ≈ 0.55) or compare with a 2D Binned Scatterplot (Hexbin).',
      learnConceptId: 'perceptual_limitations',
      autoFix: {
        label: 'Set Opacity to 0.55',
        patch: { opacity: 0.55 }
      }
    });
  }

  // 12. Uncertainty Measure Clarity Check
  if (['point_interval', 'error_bars', 'interval_ribbon'].includes(config.chartType)) {
    const uncType = config.uncertaintyType || 'ci95';
    const labelMap = {
      ci95: '95% Confidence Interval for the Mean Parameter',
      pi95: '95% Prediction Interval for Individual Observations',
      se: '±1 Standard Error of the Mean (SE)',
      sd: '±1 Sample Standard Deviation (Raw Data Spread)'
    };
    warnings.push({
      id: 'UNCERTAINTY_SEMANTIC_DISCLOSURE',
      severity: 'advisory',
      statement: `Active Uncertainty Encoding: ${labelMap[uncType] || uncType}`,
      reason: 'VISUALIZATION_STANDARDS.md Section A.1 requires explicit designation of the exact statistical interval plotted.',
      interpretiveEffect: 'Standard Deviation (SD), Standard Error (SE), 95% Confidence Intervals (CI), and 95% Prediction Intervals (PI) have fundamentally different widths and meanings.',
      suggestedCorrection: 'Verify that chart captions and legends explicitly state the active interval type.',
      learnConceptId: 'uncertainty',
      autoFix: null
    });
  }

  // 13. Missing Data Disclosure Check
  const activeVars = [xVar, yVar, colorVar, sizeVar].filter(Boolean);
  const totalMissingInMapped = activeVars.reduce((s, v) => s + v.missingCount, 0);
  if (totalMissingInMapped > 0) {
    warnings.push({
      id: 'MISSING_DATA_COMPLETE_CASE_DISCLOSURE',
      severity: 'advisory',
      statement: `Missing Observations Detected Across Mapped Variables (${totalMissingInMapped} Missing Cells)`,
      reason: 'DATA_CONVENTIONS.md Section C.1 requires explicit disclosure when listwise complete-case deletion excludes rows.',
      interpretiveEffect: 'Excluding missing observations reduces effective sample size n and can introduce bias if missingness is not completely at random.',
      suggestedCorrection: 'Inspect the effective sample size badge (n) and missingness summary in the Understand Data tab.',
      learnConceptId: 'missing_data_representation',
      autoFix: null
    });
  }

  return warnings;
}
