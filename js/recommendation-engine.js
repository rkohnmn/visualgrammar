/**
 * VisualGrammar — Explainable Visualization Recommendation Engine (recommendation-engine.js)
 * Conforms strictly to Part 7 of the VisualGrammar specification and VISUALIZATION_STANDARDS.md Section G.2.
 * Pure deterministic rule-based evaluation of 14 data/context inputs across 13 analytical objectives.
 */

import { CHART_REGISTRY, getChartById } from './chart-registry.js';

/**
 * Evaluate Dataset Profile + Selected Variables + Analytical Objective
 * Returns structured recommendations classified into:
 * - Recommended
 * - Appropriate alternative
 * - Conditionally suitable
 * - Inappropriate for the selected structure
 */
export function evaluateRecommendations(profile, selection = {}) {
  if (!profile || !Array.isArray(profile.variables) || profile.variables.length === 0) {
    return {
      valid: false,
      structuralSummary: 'No active dataset loaded.',
      recommendations: []
    };
  }

  const objective = selection.objective || 'show_distribution';
  const audience = selection.audience || 'general'; // 'general' | 'student' | 'instructor' | 'researcher'

  // Determine selected variables (or auto-select non-identifier variables from profile)
  let selectedVars = [];
  if (Array.isArray(selection.variables) && selection.variables.length > 0) {
    selectedVars = selection.variables
      .map(name => profile.variableMap[name])
      .filter(Boolean);
  } else {
    selectedVars = profile.variables.filter(v => v.taxonomy.family !== 'metadata');
  }

  const nRows = profile.rowCount;
  const catVars = selectedVars.filter(v => v.taxonomy.family === 'categorical');
  const quantVars = selectedVars.filter(v => v.taxonomy.family === 'quantitative');
  const tempVars = selectedVars.filter(v => v.taxonomy.family === 'temporal');
  const geoCoordVars = selectedVars.filter(v => v.inferredType === 'geographic_coordinate');
  const geoRegionVars = selectedVars.filter(v => v.inferredType === 'geographic_region');
  const uncertaintyVars = selectedVars.filter(v => v.inferredType === 'derived_statistic');
  const idVars = selectedVars.filter(v => v.inferredType === 'identifier');

  const maxCatCardinality = catVars.reduce((m, v) => Math.max(m, v.uniqueCount), 0);
  const hasOrdinal = catVars.some(v => v.inferredType === 'ordinal_categorical') || tempVars.some(v => v.inferredType === 'cyclic_temporal');
  const hasHighSkew = quantVars.some(v => v.numericStats && Math.abs(v.numericStats.skewness) > 1.0);
  const hasOutliers = quantVars.some(v => v.numericStats && v.numericStats.outliers.length > 0);
  const hasMissing = selectedVars.some(v => v.missingCount > 0);

  // Detect primary data signature
  let signature = 'general';
  if (uncertaintyVars.length >= 2) {
    signature = 'uncertainty_intervals';
  } else if (geoCoordVars.length >= 2) {
    signature = 'spatial_coordinates';
  } else if (geoRegionVars.length >= 1 && quantVars.length >= 1) {
    signature = 'spatial_regions';
  } else if (tempVars.length >= 1 && quantVars.length >= 1) {
    signature = 'time_series';
  } else if (catVars.length === 1 && quantVars.length === 0 && tempVars.length === 0) {
    signature = hasOrdinal ? 'one_ordinal' : 'one_nominal';
  } else if (catVars.length === 0 && quantVars.length === 1) {
    signature = 'one_quantitative';
  } else if (catVars.length >= 2 && quantVars.length === 0) {
    signature = 'two_categorical';
  } else if (catVars.length === 2 && quantVars.length === 1 && selectedVars.some(v => /source|target|flow/i.test(v.name))) {
    signature = 'network_flow';
  } else if (catVars.length === 2 && quantVars.length === 1 && selectedVars.some(v => /division|department|budget/i.test(v.name))) {
    signature = 'hierarchical_composition';
  } else if (catVars.length >= 1 && quantVars.length === 1) {
    signature = 'cat_plus_quantitative';
  } else if (quantVars.length === 2 && catVars.length === 0) {
    signature = 'two_quantitative';
  } else if (quantVars.length === 2 && catVars.length >= 1) {
    signature = 'two_quantitative_grouped';
  } else if (quantVars.length >= 3) {
    signature = 'multivariate_quantitative';
  }

  const results = [];

  for (const chart of CHART_REGISTRY) {
    const evalItem = scoreChartCandidate(chart, {
      signature,
      objective,
      audience,
      nRows,
      catVars,
      quantVars,
      tempVars,
      geoCoordVars,
      geoRegionVars,
      uncertaintyVars,
      idVars,
      maxCatCardinality,
      hasOrdinal,
      hasHighSkew,
      hasOutliers,
      hasMissing
    });
    results.push(evalItem);
  }

  const tierOrder = {
    'Recommended': 1,
    'Appropriate alternative': 2,
    'Conditionally suitable': 3,
    'Inappropriate for the selected structure': 4
  };

  results.sort((a, b) => {
    if (tierOrder[a.suitability] !== tierOrder[b.suitability]) {
      return tierOrder[a.suitability] - tierOrder[b.suitability];
    }
    return b.score - a.score;
  });

  return {
    valid: true,
    signature,
    objective,
    nRows,
    structuralSummary: describeSignature(signature, selectedVars, nRows),
    recommendations: results
  };
}

function describeSignature(signature, selectedVars, nRows) {
  const varSummary = selectedVars.map(v => `${v.name} (${v.taxonomy.shortLabel})`).join(', ');
  const map = {
    one_nominal: `1 Nominal Categorical structure (${nRows} obs): ${varSummary}`,
    one_ordinal: `1 Ordered Categorical structure (${nRows} obs): ${varSummary}`,
    one_quantitative: `1 Quantitative Univariate distribution (${nRows} obs): ${varSummary}`,
    two_categorical: `2 Categorical Variables / Contingency structure (${nRows} obs): ${varSummary}`,
    cat_plus_quantitative: `Categorical Factor + Quantitative Outcome (${nRows} obs): ${varSummary}`,
    two_quantitative: `Bivariate Quantitative structure (${nRows} obs): ${varSummary}`,
    two_quantitative_grouped: `Grouped Bivariate Quantitative structure (${nRows} obs): ${varSummary}`,
    multivariate_quantitative: `Multivariate Quantitative structure (${nRows} obs): ${varSummary}`,
    time_series: `Time-Indexed Temporal structure (${nRows} obs): ${varSummary}`,
    uncertainty_intervals: `Parameter Estimates with Uncertainty Bounds (${nRows} obs): ${varSummary}`,
    spatial_coordinates: `Geographic Coordinate Observations (${nRows} obs): ${varSummary}`,
    spatial_regions: `Geographic Regional Observations (${nRows} obs): ${varSummary}`,
    hierarchical_composition: `Hierarchical Part-to-Whole structure (${nRows} obs): ${varSummary}`,
    network_flow: `Relational Source-Target Flow structure (${nRows} obs): ${varSummary}`
  };
  return map[signature] || `Dataset structure (${nRows} obs): ${varSummary}`;
}

function scoreChartCandidate(chart, ctx) {
  const {
    signature,
    objective,
    nRows,
    catVars,
    quantVars,
    tempVars,
    geoCoordVars,
    geoRegionVars,
    uncertaintyVars,
    idVars,
    maxCatCardinality,
    hasOrdinal,
    hasOutliers
  } = ctx;

  let suitability = 'Inappropriate for the selected structure';
  let score = 10;
  let whySuitable = '';
  let requiredTransformations = chart.applicableTransformations.join('; ');
  let whenAnotherBetter = '';

  // Check if user only selected Identifier variables
  if (idVars.length > 0 && catVars.length === 0 && quantVars.length === 0 && tempVars.length === 0) {
    return buildRecOutput(chart, 'Inappropriate for the selected structure', 0,
      `Selected variable "${idVars[0].name}" is classified as a General Identifier. Identifiers label individual records and should not be aggregated or plotted as continuous measurements.`,
      requiredTransformations,
      'Select a categorical or quantitative measurement variable or override the variable type if it represents a true measurement.',
      ctx
    );
  }

  // Always flag prohibited dynamite plot as Inappropriate
  if (chart.id === 'dynamite_plot_prohibited') {
    return buildRecOutput(chart, 'Inappropriate for the selected structure', 0,
      'PROHIBITED by VISUALIZATION_STANDARDS.md Section B.4: Bar charts of continuous group means conceal sample size, skewness, bimodality, and outliers.',
      'Do not use; replace with Grouped Boxplot + Jittered Points or Violin Plot.',
      'Use Grouped Boxplot with Jittered Points, Violin Plot, or Point-and-Interval Plot instead.',
      ctx
    );
  }

  const matchesObjective = chart.objectives.includes(objective);
  const objBonus = matchesObjective ? 18 : 0;

  // Evaluate by structural signature
  if (signature === 'one_nominal' || signature === 'one_ordinal') {
    if (['bar_vertical', 'bar_horizontal', 'dot_plot', 'lollipop_chart'].includes(chart.id)) {
      suitability = 'Recommended';
      score = 82 + objBonus;
      if (chart.id === 'bar_horizontal' && maxCatCardinality > 5) score += 8;
      if (chart.id === 'bar_vertical' && hasOrdinal) score += 6;
      whySuitable = `Directly encodes discrete category frequencies or proportions from a true zero baseline (${hasOrdinal ? 'preserving natural ordinal rank order' : 'sorted by magnitude'}).`;
      whenAnotherBetter = maxCatCardinality > 8
        ? 'Prefer Horizontal Bar Chart or Cleveland Dot Plot so long category labels do not collide.'
        : 'Use Waffle Chart if emphasizing part-to-whole percentage out of 100.';
    } else if (chart.id === 'waffle_chart') {
      suitability = objective === 'show_composition' ? 'Recommended' : 'Appropriate alternative';
      score = 74 + objBonus;
      whySuitable = 'Represents category proportions as countable 1% unit squares in a 10×10 grid without angular pie distortion.';
      whenAnotherBetter = 'Use Horizontal Bar Chart or Dot Plot when comparing exact counts across many categories.';
    } else if (['pie_chart', 'donut_chart'].includes(chart.id)) {
      if (maxCatCardinality <= 3 && objective === 'show_composition') {
        suitability = 'Conditionally suitable';
        score = 52;
        whySuitable = `Permitted only because category count (${maxCatCardinality}) is ≤ 3 and objective is part-to-whole composition.`;
      } else {
        suitability = 'Inappropriate for the selected structure';
        score = 15;
        whySuitable = `Inappropriate when comparing > 3 categories (${maxCatCardinality} detected) because human perception of angle and area is far less accurate than bar length.`;
      }
      whenAnotherBetter = 'Use Bar Chart, Lollipop Chart, or 100% Stacked Bar for accurate magnitude perception.';
    } else {
      whySuitable = `Requires quantitative, bivariate, or temporal coordinates not present in a single categorical variable.`;
      whenAnotherBetter = 'Use Vertical/Horizontal Bar Chart, Cleveland Dot Plot, or Lollipop Chart.';
    }
  } else if (signature === 'one_quantitative') {
    if (['histogram', 'ecdf_plot', 'boxplot'].includes(chart.id)) {
      if (chart.id === 'histogram' && nRows < 20) {
        suitability = 'Conditionally suitable';
        score = 62 + objBonus;
        whySuitable = `Sample size (n = ${nRows}) is small (< 20), so histogram shape is sensitive to bin width choice.`;
        whenAnotherBetter = 'For n < 30, ECDF or Strip Plot avoids binning artifacts.';
      } else {
        suitability = 'Recommended';
        score = 85 + objBonus;
        whySuitable = chart.id === 'ecdf_plot'
          ? `Displays every exact observation and quantile (n = ${nRows}) with zero binning or bandwidth tuning artifacts.`
          : chart.id === 'histogram'
            ? `Reveals empirical modality, skewness, and density over contiguous intervals for n = ${nRows}.`
            : `Summarizes median, IQR, and Tukey 1.5 IQR outliers (${hasOutliers ? 'outliers detected in sample' : 'no extreme outliers'}).`;
        whenAnotherBetter = chart.id === 'boxplot'
          ? 'Pair with Violin Plot, KDE, or Histogram to ensure bimodality is not hidden inside the IQR box.'
          : 'Use Boxplot to isolate Tukey 1.5 IQR outliers or ECDF to read exact percentiles.';
      }
    } else if (['kde_density', 'violin_plot', 'frequency_polygon', 'strip_plot', 'beeswarm_plot', 'normal_qq'].includes(chart.id)) {
      if ((chart.id === 'kde_density' || chart.id === 'violin_plot') && nRows < 30) {
        suitability = 'Conditionally suitable';
        score = 58 + objBonus;
        whySuitable = `Kernel density smoothing on n = ${nRows} (< 30) can produce bandwidth artifacts; inspect alongside raw points.`;
      } else {
        suitability = matchesObjective ? 'Recommended' : 'Appropriate alternative';
        score = 78 + objBonus;
        whySuitable = `Complementary view of the same univariate numeric observations (${chart.statisticalPurpose}).`;
      }
      whenAnotherBetter = 'Compare synchronized Histogram + KDE + ECDF + Boxplot in Known Visualization Unity.';
    } else {
      whySuitable = `Designed for categorical, bivariate, or temporal structures rather than a single quantitative distribution.`;
      whenAnotherBetter = 'Use Histogram, ECDF, Boxplot, or Kernel Density Plot.';
    }
  } else if (signature === 'two_categorical') {
    if (['bar_grouped', 'bar_stacked_100', 'bivariate_heatmap', 'bar_stacked'].includes(chart.id)) {
      suitability = 'Recommended';
      score = 84 + objBonus;
      if (chart.id === 'bar_stacked_100' && (objective === 'show_composition' || objective === 'compare_groups')) score += 8;
      if (chart.id === 'bar_grouped' && objective === 'compare_exact_values') score += 8;
      whySuitable = chart.id === 'bar_stacked_100'
        ? 'Normalizes each group to 100% to compare conditional proportions P(Y | X) across categories while labeling group sample sizes.'
        : chart.id === 'bar_grouped'
          ? 'Places subgroup counts or proportions on a shared zero baseline for direct within-group comparison.'
          : 'Encodes the two-way contingency table with explicit cell counts and proportions.';
      whenAnotherBetter = chart.id === 'bar_stacked'
        ? 'Use 100% Stacked Bar when comparing relative proportions across unequally sized groups, or Grouped Bar to give every subgroup a flat baseline.'
        : 'Use Stacked Bar when total marginal count per group is as important as subgroup shares.';
    } else if (['sankey_diagram', 'waffle_chart'].includes(chart.id)) {
      suitability = 'Appropriate alternative';
      score = 70 + objBonus;
      whySuitable = 'Visualizes cross-classified category counts as bipartite flows or unit percentage squares.';
      whenAnotherBetter = 'Use Grouped Bar or 100% Stacked Bar for higher positional reading precision.';
    } else {
      whySuitable = 'Requires quantitative measurements or continuous coordinates.';
      whenAnotherBetter = 'Use Grouped Bar Chart, 100% Stacked Bar Chart, or Contingency Heatmap.';
    }
  } else if (signature === 'cat_plus_quantitative') {
    if (['grouped_boxplot', 'strip_plot', 'beeswarm_plot', 'violin_plot', 'ridgeline_plot', 'density_overlay'].includes(chart.id)) {
      const avgGroupN = catVars[0] ? nRows / Math.max(1, catVars[0].uniqueCount) : nRows;
      if ((chart.id === 'violin_plot' || chart.id === 'ridgeline_plot') && avgGroupN < 10) {
        suitability = 'Conditionally suitable';
        score = 60 + objBonus;
        whySuitable = `Average group size (${avgGroupN.toFixed(1)}) is small for standalone kernel density estimation; overlay raw points.`;
      } else {
        suitability = ['grouped_boxplot', 'strip_plot', 'beeswarm_plot'].includes(chart.id) || matchesObjective
          ? 'Recommended'
          : 'Appropriate alternative';
        score = 83 + objBonus;
        whySuitable = `Honest comparison of quantitative distributions across "${catVars[0]?.name}" groups without hiding spread or sample size.`;
      }
      whenAnotherBetter = 'Use Point-and-Interval Plot when specifically communicating parameter confidence intervals.';
    } else if (['point_interval', 'error_bars'].includes(chart.id)) {
      suitability = objective === 'show_uncertainty' ? 'Recommended' : 'Appropriate alternative';
      score = 74 + objBonus;
      whySuitable = 'Displays group means alongside explicit 95% confidence intervals or standard errors.';
      whenAnotherBetter = 'Use Grouped Boxplot or Strip Plot when showing the full empirical spread of observations.';
    } else if (['bar_vertical', 'bar_horizontal', 'lollipop_chart', 'dot_plot'].includes(chart.id)) {
      suitability = 'Conditionally suitable';
      score = 54;
      whySuitable = 'Suitable ONLY if plotting additive group totals or counts—never use solid bars to represent continuous group means ("dynamite plot").';
      whenAnotherBetter = 'Use Grouped Boxplot with Jittered Points to compare continuous outcomes across groups.';
    } else {
      whySuitable = 'Incompatible with 1 categorical + 1 quantitative variable structure.';
      whenAnotherBetter = 'Use Grouped Boxplot, Jittered Strip Plot, Violin Plot, or Ridgeline Plot.';
    }
  } else if (signature === 'two_quantitative' || signature === 'two_quantitative_grouped') {
    if (['scatter_plot', 'scatter_ols'].includes(chart.id)) {
      suitability = 'Recommended';
      score = 88 + objBonus;
      whySuitable = `Maps paired quantitative variables (${quantVars.map(v => v.name).join(' vs ')}) along orthogonal Rank-1 positional scales, exposing linearity, curvature, leverage, and confounding groups.`;
      whenAnotherBetter = nRows > 500
        ? 'Use 2D Hexbin / Binned Scatterplot if point overlap obscures density.'
        : 'Always inspect Residual-vs-Fitted and Normal Q-Q plots alongside OLS lines.';
    } else if (['residual_fitted', 'normal_qq'].includes(chart.id)) {
      suitability = objective === 'examine_model' || objective === 'find_outliers' ? 'Recommended' : 'Appropriate alternative';
      score = 80 + objBonus;
      whySuitable = 'Essential diagnostic companion to OLS regression for checking linearity, homoscedasticity, and normality of errors.';
      whenAnotherBetter = 'Pair directly with Scatterplot + OLS Fit.';
    } else if (['hexbin_2d', 'bubble_plot', 'small_multiples'].includes(chart.id)) {
      suitability = (chart.id === 'small_multiples' && signature === 'two_quantitative_grouped') ? 'Recommended' : 'Appropriate alternative';
      score = 74 + objBonus;
      whySuitable = chart.id === 'small_multiples'
        ? `Facets the bivariate relationship across "${catVars[0]?.name}" panels to eliminate overlap and expose Simpson's Paradox.`
        : 'Aggregates 2D spatial density or encodes a third quantitative variable via marker area.';
      whenAnotherBetter = 'Use standard Scatterplot when sample size is small ($n < 50$) so individual points remain distinct.';
    } else if (['line_chart', 'area_chart'].includes(chart.id)) {
      suitability = 'Inappropriate for the selected structure';
      score = 12;
      whySuitable = 'Connecting cross-sectional quantitative points that lack a chronological time ordering creates false sequential trajectories.';
      whenAnotherBetter = 'Use Scatterplot or Scatterplot with OLS Fit.';
    } else {
      whySuitable = 'Does not match paired bivariate quantitative structure.';
      whenAnotherBetter = 'Use Scatterplot with OLS Fit, Residual-vs-Fitted Plot, or Small Multiples.';
    }
  } else if (signature === 'time_series') {
    if (['line_chart', 'seasonal_plot', 'area_chart', 'stacked_area', 'connected_scatter', 'lag_plot', 'acf_plot', 'calendar_heatmap', 'slopegraph'].includes(chart.id)) {
      const isPrimary = ['line_chart', 'seasonal_plot'].includes(chart.id) || matchesObjective;
      suitability = isPrimary ? 'Recommended' : 'Appropriate alternative';
      score = (isPrimary ? 86 : 75) + objBonus;
      whySuitable = `Respects chronological ordering of "${tempVars[0]?.name}" to reveal trend, seasonal cycles, or serial autocorrelation.`;
      whenAnotherBetter = chart.id === 'line_chart'
        ? 'Use Seasonal Subseries Plot or Calendar Heatmap to isolate repeating monthly cycles across years, or ACF/Lag Plot to diagnose serial dependence.'
        : 'Use Chronological Line Chart for the primary unaggregated trajectory.';
    } else if (['radar_chart', 'streamgraph'].includes(chart.id)) {
      suitability = 'Conditionally suitable';
      score = 62 + objBonus;
      whySuitable = 'Suitable when emphasizing circular seasonal continuity (Radar) or organic multi-group flow (Streamgraph), though less precise than Cartesian axes.';
      whenAnotherBetter = 'Use Seasonal Plot or Stacked Area Chart for exact vertical scale reading.';
    } else {
      whySuitable = 'Ignores the chronological time ordering of observations.';
      whenAnotherBetter = 'Use Chronological Line Chart, Seasonal Plot, or Lag/ACF Diagnostic Plots.';
    }
  } else if (signature === 'multivariate_quantitative') {
    if (['correlogram', 'parallel_coordinates', 'bubble_plot', 'splom_matrix', 'matrix_heatmap', 'small_multiples', 'scatter_ols'].includes(chart.id)) {
      suitability = ['correlogram', 'parallel_coordinates', 'bubble_plot', 'splom_matrix'].includes(chart.id)
        ? 'Recommended'
        : 'Appropriate alternative';
      score = 84 + objBonus;
      whySuitable = `Handles ${quantVars.length} quantitative variables simultaneously via pairwise correlation matrices, standardized parallel axes, or area-scaled glyphs.`;
      whenAnotherBetter = chart.id === 'correlogram'
        ? 'Pair with Scatterplot Matrix (SPLOM) to verify that pairwise correlations are not distorted by nonlinear curvature or outliers.'
        : 'Use Correlogram for an immediate overview of all pairwise linear associations.';
    } else {
      whySuitable = 'Displays only 1 or 2 variables at a time.';
      whenAnotherBetter = 'Use Correlogram, Parallel Coordinates, Scatterplot Matrix (SPLOM), or Bubble Plot.';
    }
  } else if (signature === 'uncertainty_intervals') {
    if (['point_interval', 'error_bars', 'interval_ribbon'].includes(chart.id)) {
      suitability = 'Recommended';
      score = 92 + objBonus;
      whySuitable = 'Directly plots the documented point estimates and uncertainty bounds while preserving explicit statistical labels (SE vs 95% CI vs 95% PI).';
      whenAnotherBetter = 'Switch between 95% Confidence Intervals (for the mean parameter) and 95% Prediction Intervals (for individual future centers) to compare their meanings.';
    } else if (chart.id === 'dot_plot') {
      suitability = 'Conditionally suitable';
      score = 55;
      whySuitable = 'Shows point estimates cleanly, but omits the documented uncertainty intervals unless crossbars are enabled.';
      whenAnotherBetter = 'Use Point Estimate with Confidence Interval Plot.';
    } else {
      whySuitable = 'Does not encode the pre-computed confidence/prediction interval bounds.';
      whenAnotherBetter = 'Use Point Estimate with Confidence Interval or Multi-Tier Error Bar Plot.';
    }
  } else if (signature === 'spatial_coordinates' || signature === 'spatial_regions') {
    if (['geo_bubble_map', 'geo_point_map', 'choropleth_map'].includes(chart.id)) {
      suitability = 'Recommended';
      score = 90 + objBonus;
      whySuitable = 'Projects spatial coordinates or regional identifiers accurately while distinguishing area-scaled volume from normalized per-capita rates.';
      whenAnotherBetter = chart.id === 'choropleth_map'
        ? 'Ensure you map a normalized rate (%) rather than raw population counts; use Geographic Bubble Map for raw totals.'
        : 'Use Horizontal Bar Chart or Cleveland Dot Plot when comparing exact numerical rankings across stations.';
    } else if (['bar_horizontal', 'dot_plot', 'scatter_plot'].includes(chart.id)) {
      suitability = 'Appropriate alternative';
      score = 72 + objBonus;
      whySuitable = 'Provides high-precision non-spatial comparison of station metrics along aligned Cartesian axes.';
      whenAnotherBetter = 'Use Geographic Bubble Map or Point Map to see spatial basin clustering.';
    } else {
      whySuitable = 'Does not utilize the geographic coordinate or regional structure.';
      whenAnotherBetter = 'Use Geographic Bubble Map, Geographic Point Map, or Regional Choropleth Map.';
    }
  } else if (signature === 'hierarchical_composition') {
    if (['treemap', 'bar_stacked', 'dendrogram', 'waffle_chart', 'bar_horizontal'].includes(chart.id)) {
      suitability = ['treemap', 'bar_stacked', 'dendrogram'].includes(chart.id) ? 'Recommended' : 'Appropriate alternative';
      score = 86 + objBonus;
      whySuitable = 'Respects the hierarchical parent-division to child-department composition structure.';
      whenAnotherBetter = 'Use Horizontal Bar Chart when exact quantitative differences between individual departments matter more than hierarchical grouping.';
    } else {
      whySuitable = 'Does not encode hierarchical part-to-whole structure.';
      whenAnotherBetter = 'Use Treemap, Hierarchical Dendrogram, or Stacked Bar Chart.';
    }
  } else if (signature === 'network_flow') {
    if (['sankey_diagram', 'chord_diagram', 'network_diagram', 'bivariate_heatmap'].includes(chart.id)) {
      suitability = ['sankey_diagram', 'chord_diagram', 'network_diagram'].includes(chart.id) ? 'Recommended' : 'Appropriate alternative';
      score = 90 + objBonus;
      whySuitable = 'Directly encodes directed source-to-target flow edges and conservation of volume across nodes.';
      whenAnotherBetter = 'Use Bivariate Heatmap or Grouped Bar Chart to inspect exact tabular cell values.';
    } else {
      whySuitable = 'Does not represent relational source-to-target edge topology.';
      whenAnotherBetter = 'Use Sankey Flow Diagram, Chord Diagram, or Node-Link Network Graph.';
    }
  }

  return buildRecOutput(chart, suitability, score, whySuitable, requiredTransformations, whenAnotherBetter, ctx);
}

function buildRecOutput(chart, suitability, score, whySuitable, requiredTransformations, whenAnotherBetter, ctx) {
  return {
    chartId: chart.id,
    chartName: chart.name,
    category: chart.category,
    familyGroup: chart.familyGroup,
    supportLevel: chart.supportLevel,
    suitability,
    score,
    whySuitable,
    requiredVariables: chart.dataStructure,
    requiredTransformations,
    whatItReveals: chart.strengths.join('; '),
    whatItObscures: chart.weaknesses.join('; '),
    limitations: chart.commonMistakes.join('; '),
    alternatives: chart.relatedCharts.map(id => getChartById(id)?.name || id),
    alternativeIds: chart.relatedCharts,
    whenAnotherBetter,
    unityGroup: chart.unityGroup
  };
}
