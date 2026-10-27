# VisualGrammar Chart & Knowledge Coverage Matrix (`COVERAGE_MATRIX.md`)

Conforming to Part 4.3 and Part 23 of the specification, this matrix audits all 34 chart entries in `js/chart-registry.js` and all 26 concept lessons in `js/atlas-data.js`, distinguishing:
- **Level A — General Builder Supported**: Full data-driven construction in Chart Studio on uploaded or preset datasets, plus interactive Atlas & Unity views.
- **Level B — Interactive Atlas Example Supported**: Live interactive rendering in the Visualization Atlas and Chart Studio using compatible relational/spatial/cyclic structures.
- **Level C — Reference & Anti-Pattern Coverage**: Documented reference entry with live integrity warnings and educational comparison.

## 1. Chart Families Coverage Matrix (34 Families)

| # | Chart ID | Chart Family Name | Spec Section | Support Level | Default Compatible Dataset |
|---|---|---|---|---|---|
| 1 | `bar_vertical` | Vertical Bar Chart | 8.1 | Level A: General Builder | `categorical_triage_admissions` |
| 2 | `bar_horizontal` | Horizontal Bar Chart | 8.1 | Level A: General Builder | `categorical_triage_admissions` |
| 3 | `bar_grouped` | Grouped Bar Chart | 8.1 | Level A: General Builder | `contingency_clinical_outcomes` |
| 4 | `bar_stacked` | Stacked Bar Chart | 8.1 | Level A: General Builder | `contingency_clinical_outcomes` |
| 5 | `bar_stacked_100` | 100% Stacked Bar Chart | 8.1 | Level A: General Builder | `contingency_clinical_outcomes` |
| 6 | `dot_plot` | Cleveland Dot Plot | 8.1 | Level A: General Builder | `categorical_triage_admissions` |
| 7 | `lollipop_chart` | Lollipop Chart | 8.1 | Level A: General Builder | `categorical_triage_admissions` |
| 8 | `histogram` | Histogram (Count / Rel Freq / Density) | 8.2 | Level A: General Builder | `univariate_wafer_thickness` |
| 9 | `frequency_polygon` | Frequency Polygon | 8.2 | Level A: General Builder | `univariate_wafer_thickness` |
| 10 | `kde_density` | Kernel Density Plot (KDE) | 8.2 | Level A: General Builder | `univariate_wafer_thickness` |
| 11 | `ecdf_plot` | Empirical CDF (ECDF) | 8.2 | Level A: General Builder | `univariate_wafer_thickness` |
| 12 | `boxplot` | Boxplot (Tukey 5-Number Summary) | 8.2 | Level A: General Builder | `univariate_wafer_thickness` |
| 13 | `violin_plot` | Violin Plot | 8.2 | Level A: General Builder | `univariate_wafer_thickness` |
| 14 | `strip_plot` | Jittered Strip Plot | 8.2 | Level A: General Builder | `cat_numeric_battery_chemistry` |
| 15 | `beeswarm_plot` | Beeswarm Plot (Non-Overlapping) | 8.2 | Level A: General Builder | `cat_numeric_battery_chemistry` |
| 16 | `scatter_plot` | Scatterplot | 8.3 | Level A: General Builder | `anscombe_1` |
| 17 | `scatter_ols` | Scatterplot with OLS Fit & 95% CI | 8.3 | Level A: General Builder | `anscombe_1` |
| 18 | `bubble_plot` | Bubble Plot (Area-Scaled) | 8.3 | Level A: General Builder | `multivariate_air_quality` |
| 19 | `connected_scatter` | Connected Scatterplot | 8.3 | Level A: General Builder | `timeseries_co2_trend` |
| 20 | `hexbin_2d` | 2D Binned Scatterplot (Hexbin Grid) | 8.3 | Level A: General Builder | `multivariate_air_quality` |
| 21 | `bivariate_heatmap` | Contingency / Bivariate Heatmap | 8.3 | Level A: General Builder | `contingency_clinical_outcomes` |
| 22 | `line_chart` | Chronological Line Chart | 8.4 | Level A: General Builder | `timeseries_co2_trend` |
| 23 | `area_chart` | Area Chart | 8.4 | Level A: General Builder | `timeseries_seasonal_grid` |
| 24 | `stacked_area` | Stacked Area Chart | 8.4 | Level A: General Builder | `timeseries_seasonal_grid` |
| 25 | `slopegraph` | Slopegraph (Paired Comparison) | 8.4 | Level A: General Builder | `timeseries_seasonal_grid` |
| 26 | `grouped_boxplot` | Grouped Boxplot with Jittered Points | 8.5 | Level A: General Builder | `cat_numeric_battery_chemistry` |
| 27 | `small_multiples` | Small Multiples (Faceted Grid) | 8.5 | Level A: General Builder | `simpsons_paradox_clinical` |
| 28 | `correlogram` | Correlogram (Correlation Matrix) | 8.5 | Level A: General Builder | `multivariate_air_quality` |
| 29 | `matrix_heatmap` | Standardized Matrix Heatmap | 8.5 | Level A: General Builder | `multivariate_air_quality` |
| 30 | `normal_qq` | Normal Q–Q Plot (Blom Quantiles) | 8.6 | Level A: General Builder | `anscombe_1` |
| 31 | `residual_fitted` | Residual-vs-Fitted Diagnostic Plot | 8.6 | Level A: General Builder | `anscombe_2` |
| 32 | `point_interval` | Point Estimate with Confidence Interval | 8.6 | Level A: General Builder | `uncertainty_meta_analysis` |
| 33 | `error_bars` | Multi-Tier Error Bar Comparison | 8.6 | Level A: General Builder | `uncertainty_meta_analysis` |
| 34 | `interval_ribbon` | Interval Ribbon / Fan Band | 8.6 | Level A: General Builder | `uncertainty_meta_analysis` |
| 35 | `density_overlay` | Grouped Kernel Density Overlays | 8.6 | Level A: General Builder | `cat_numeric_battery_chemistry` |
| 36 | `ridgeline_plot` | Ridgeline Plot (Staggered KDE) | 8.7 | Level A: General Builder | `cat_numeric_battery_chemistry` |
| 37 | `pie_chart` | Pie Chart (≤ 4 slices rule) | 8.7 | Level B: Interactive Atlas | `categorical_triage_admissions` |
| 38 | `donut_chart` | Donut Chart (with Central N) | 8.7 | Level B: Interactive Atlas | `categorical_triage_admissions` |
| 39 | `waffle_chart` | Waffle Chart (10×10 Hamilton Grid) | 8.7 | Level A: General Builder | `contingency_clinical_outcomes` |
| 40 | `treemap` | Treemap (Hierarchical Area Partition) | 8.7 | Level A: General Builder | `hierarchical_university_budget` |
| 41 | `radar_chart` | Radar / Polar Cyclic Chart | 8.7 | Level B: Interactive Atlas | `timeseries_seasonal_grid` |
| 42 | `parallel_coordinates` | Parallel Coordinates Plot | 8.7 | Level A: General Builder | `multivariate_air_quality` |
| 43 | `splom_matrix` | Scatterplot Matrix (SPLOM) | 8.7 | Level B: Interactive Atlas | `multivariate_air_quality` |
| 44 | `seasonal_plot` | Seasonal Subseries / Overlay Plot | 8.7 | Level A: General Builder | `timeseries_seasonal_grid` |
| 45 | `calendar_heatmap` | Temporal / Seasonal Matrix Heatmap | 8.7 | Level B: Interactive Atlas | `timeseries_seasonal_grid` |
| 46 | `lag_plot` | Lag-1 Autocorrelation Scatterplot | 8.7 | Level B: Interactive Atlas | `timeseries_co2_trend` |
| 47 | `acf_plot` | Autocorrelation Function (ACF) | 8.7 | Level B: Interactive Atlas | `timeseries_co2_trend` |
| 48 | `dendrogram` | Hierarchical Dendrogram | 8.7 | Level B: Interactive Atlas | `hierarchical_university_budget` |
| 49 | `sankey_diagram` | Sankey Flow Diagram | 8.7 | Level A: General Builder | `network_energy_flows` |
| 50 | `chord_diagram` | Circular Chord Flow Diagram | 8.7 | Level B: Interactive Atlas | `network_energy_flows` |
| 51 | `network_diagram` | Node-Link Network Graph | 8.7 | Level B: Interactive Atlas | `network_energy_flows` |
| 52 | `geo_point_map` | Geographic Coordinate Point Map | 8.7 | Level B: Interactive Atlas | `geographic_hydrology_stations` |
| 53 | `geo_bubble_map` | Geographic Proportional Bubble Map | 8.7 | Level A: General Builder | `geographic_hydrology_stations` |
| 54 | `choropleth_map` | Regional Tile Choropleth Map | 8.7 | Level B: Interactive Atlas | `geographic_hydrology_stations` |
| 55 | `streamgraph` | Streamgraph (Centered Stacked Area) | 8.7 | Level B: Interactive Atlas | `timeseries_seasonal_grid` |
| 56 | `word_cloud` | Term Frequency Word Cloud | 8.7 | Level B: Interactive Atlas | `categorical_triage_admissions` |
| 57 | `dynamite_plot_prohibited`| Bar Chart of Means (Prohibited Anti-Pattern)| B.4 | Level C: Reference & Audit | `cat_numeric_battery_chemistry` |

*(Note: All 34 distinct `id` entries in `CHART_REGISTRY` render live on HTML5 Canvas 2D and export to SVG/PNG.)*

## 2. Concept Library Coverage (26 Topics — Part 11.4)

All 26 required topics (`visual_marks`, `aesthetic_mappings`, `coordinate_systems`, `linear_and_nonlinear_scales`, `color_semantics`, `position_and_magnitude`, `shape_and_symbol`, `grouping`, `faceting`, `ordering`, `aggregation`, `normalization`, `smoothing`, `binning`, `missing_data_representation`, `uncertainty`, `reference_lines`, `legends`, `labels`, `annotations`, `captions`, `graphical_integrity`, `accessibility`, `perceptual_limitations`, `chart_interpretation`, `statistical_vs_visual_evidence`) are implemented with `Simple`, `Standard`, and `Technical` explanations, mathematical formulas, and one-click interactive Studio demonstrations.
