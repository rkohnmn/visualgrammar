/**
 * VisualGrammar — Concept Library & Structured Learning Curriculum (atlas-data.js)
 * Conforms strictly to Part 11.4 and Part 20 of the VisualGrammar specification.
 * Covers all 26 required graphical, perceptual, and statistical concepts with original explanations.
 */

export const CONCEPT_LIBRARY = [
  {
    id: 'visual_marks',
    title: '1. Visual Marks (Geometric Primitives)',
    category: 'Foundations of Visual Grammar',
    level: 'Foundational',
    concept: 'Visual marks are the geometric primitives—points, lines, areas, and bars—placed on a canvas to represent observational units or statistical aggregates.',
    whyItMatters: 'Choosing the wrong mark implies mathematical properties that do not exist in the data (such as connecting discrete categories with a continuous line mark).',
    dataStructure: 'Applies to all tabular, relational, and spatial structures.',
    explanation: {
      simple: 'Marks are the building blocks of any chart: dots stand for individual items, lines connect ordered sequences, and bars show amounts starting from zero.',
      standard: 'Following Wilkinson’s Grammar of Graphics and Wilke (2019), marks are classified by dimensionality: 0D points (position only), 1D lines/bars (length and slope), and 2D areas/polygons (enclosed extent).',
      technical: 'A mark is a geometric locus $M(θ) ⊂ ℝ² parameterized by aesthetic channels θ = (x, y, r, α, c)$. Containment and additivity invariants dictate whether a mark requires a zero origin.'
    },
    formula: 'M_i = Geom(x_i, y_i, s_i, c_i)',
    example: 'In a scatterplot, each wafer is a 0D point mark; in a histogram, each bin is a 2D rectangular area mark whose area equals relative frequency.',
    commonMistakes: ['Using 1D connected line marks for unordered nominal categories', 'Using 2D bar marks for continuous group means where values do not fill the bar from zero'],
    relatedConcepts: ['aesthetic_mappings', 'position_and_magnitude', 'coordinate_systems'],
    practicalInterpretation: 'Always ask: does one mark represent one observation (raw plot) or a summary of many observations (aggregate plot)?',
    interactiveDemoPreset: 'univariate_wafer_thickness',
    interactiveDemoChart: 'strip_plot'
  },
  {
    id: 'aesthetic_mappings',
    title: '2. Aesthetic Mappings & Variable Taxonomy',
    category: 'Foundations of Visual Grammar',
    level: 'Foundational',
    concept: 'An aesthetic mapping is a formal function binding a variable in a dataset to a visual channel such as horizontal position, vertical position, color hue, color luminance, size, or shape.',
    whyItMatters: 'Mapping a variable to an incompatible visual channel (like mapping a continuous measurement to unordered color hues or mapping a nominal ZIP code to bar height) corrupts interpretation.',
    dataStructure: 'Maps variable domain V to visual channel range A.',
    explanation: {
      simple: 'Every column in your table needs a visual job that fits its type: numbers map well to position on a ruler, while categories map well to separate lanes or distinct colors.',
      standard: 'Stevens (1946) and Mackinlay (1986) showed that nominal, ordinal, and quantitative variables admit distinct algebraic operations. Visual encodings must preserve those operations without inventing false order or false ratios.',
      technical: 'An encoding E: V → A must be a homomorphism preserving the relational structure of V: for ordinal v_1 ≺ v_2, E(v_1) ≺_A E(v_2); for ratio-scale v, E(α v) = α E(v).'
    },
    formula: 'E: D_variable →(scale) A_channel',
    example: 'In the Municipal Sensor Audit preset, `pressure_kpa` maps to vertical position, `department` maps to horizontal group lanes, and `sensor_id` is excluded from quantitative axes.',
    commonMistakes: ['Treating numeric identifiers or ZIP codes as continuous measurements', 'Mapping continuous values to discrete symbol shapes'],
    relatedConcepts: ['visual_marks', 'color_semantics', 'position_and_magnitude'],
    practicalInterpretation: 'Verify variable types in the Understand Data tab before assigning X, Y, Color, or Size.',
    interactiveDemoPreset: 'ambiguous_sensor_audit',
    interactiveDemoChart: 'grouped_boxplot'
  },
  {
    id: 'coordinate_systems',
    title: '3. Coordinate Systems (Cartesian, Polar, Spatial)',
    category: 'Foundations of Visual Grammar',
    level: 'Foundational',
    concept: 'The coordinate system defines how 2D positions on the screen are parameterized—most commonly orthogonal Cartesian (x, y), circular Polar (r, θ), or geographic (λ, φ).',
    whyItMatters: 'Coordinate transformations change geometric angles, areas, and perceived distances.',
    dataStructure: '2D coordinate pairs.',
    explanation: {
      simple: 'A flat grid (Cartesian) is best for almost all comparisons, while a circular grid (Polar) is useful when time repeats in a loop like the 12 months of the year.',
      standard: 'Cartesian coordinates preserve linear slopes and orthogonal independence. Polar coordinates map one variable to angle θ ∈ [0, 2π) and another to radius r, making them natural for cyclic temporal data.',
      technical: 'Jacobian area distortion in polar coordinates is dA = r dr dθ: a unit increment Δ r at large radius encloses vastly more area than the same Δ r near the origin.'
    },
    formula: '(x, y) = (r cosθ,   r sinθ),   dA = r dr dθ',
    example: 'Comparing Regional Grid Electricity Demand as a Cartesian Seasonal Plot vs a Polar Radar Chart.',
    commonMistakes: ['Using polar/radar coordinates for unordered variables where spoke order alters polygon area'],
    relatedConcepts: ['linear_and_nonlinear_scales', 'position_and_magnitude'],
    practicalInterpretation: 'Default to Cartesian coordinates unless the variable is genuinely cyclical or geographic.',
    interactiveDemoPreset: 'timeseries_seasonal_grid',
    interactiveDemoChart: 'radar_chart'
  },
  {
    id: 'linear_and_nonlinear_scales',
    title: '4. Linear, Logarithmic, & Square-Root Scales',
    category: 'Scales & Transformations',
    level: 'Intermediate',
    concept: 'A scale function maps data units to pixel coordinates. Linear scales preserve additive differences (y_2 - y_1), whereas logarithmic scales preserve multiplicative ratios (y_2 / y_1).',
    whyItMatters: 'Applying a logarithmic scale to zero or negative values is mathematically invalid (ln(x) is undefined for x ≤ 0).',
    dataStructure: 'Strictly positive quantitative variables (x > 0) for logarithmic scales.',
    explanation: {
      simple: 'On a linear ruler, moving one inch adds the same amount (+10, +20, +30). On a log ruler, moving one inch multiplies by the same factor (×10, ×100, ×1000).',
      standard: 'Logarithmic scales symmetrize right-skewed multiplicative data and turn exponential growth y = a e^{bx} into a straight line ln y = ln a + bx. However, they require strictly positive support.',
      technical: 'For x > 0, s_log(x) = \frac{log_10(x) - log_10(x_min)}{log_10(x_max) - log_10(x_min)}. Any x_i ≤ 0 lies outside dom(log).'
    },
    formula: 'y_pixel = a + b log_10(x),   x > 0',
    example: 'Toggling Log Scale in Chart Studio triggers a fatal Integrity Warning if the variable contains zero or negative numbers.',
    commonMistakes: ['Adding an arbitrary constant log(x + c) without disclosing that c changes the relative spacing of small values', 'Using log scales on bar charts'],
    relatedConcepts: ['coordinate_systems', 'graphical_integrity'],
    practicalInterpretation: 'Use log scales only for positive multiplicative ratios spanning multiple orders of magnitude, and label tick marks clearly.',
    interactiveDemoPreset: 'multivariate_air_quality',
    interactiveDemoChart: 'scatter_plot'
  },
  {
    id: 'color_semantics',
    title: '5. Color Semantics (Categorical, Sequential, Diverging, & CVD Safety)',
    category: 'Visual Channels & Perception',
    level: 'Foundational',
    concept: 'Color palettes must match the statistical structure of the mapped variable: qualitative hues for nominal categories, monotonic luminance ramps for sequential quantities, and balanced two-arm gradients anchored at a neutral midpoint for diverging quantities.',
    whyItMatters: 'Using a rainbow palette for continuous numbers creates false visual boundaries, while using red-green contrasts without luminance separation excludes readers with deuteranopia or protanopia.',
    dataStructure: 'Nominal, ordinal, or continuous variables.',
    explanation: {
      simple: 'Use distinct hues to tell groups apart, light-to-dark shading to show low-to-high numbers, and two contrasting colors meeting at white/neutral to show values above and below zero.',
      standard: 'Per VISUALIZATION_STANDARDS.md Section C.2, color must never be the sole carrier of diagnostic meaning and categorical palettes should not exceed 7–8 distinct hues.',
      technical: 'Sequential scales require monotonic lightness L^*(v) in CIELAB space; diverging scales require L^*(v_0) to be an extremum at the meaningful neutral reference v_0 (e.g., r = 0 or z = 0).'
    },
    formula: 'Δ E^*_ab = √((Δ L^*)² + (Δ a^*)² + (Δ b^*)²)',
    example: 'In the Correlogram and Standardized Matrix Heatmap, positive correlations/Z-scores use phosphor emerald while negative values use vermilion anchored at neutral paper.',
    commonMistakes: ['Using jet/rainbow colormaps for continuous density', 'Mapping > 10 categories to color hues'],
    relatedConcepts: ['accessibility', 'perceptual_limitations', 'aesthetic_mappings'],
    practicalInterpretation: 'Switch between the DataSense and Okabe-Ito colorblind-safe palettes in Chart Studio to verify distinguishability.',
    interactiveDemoPreset: 'multivariate_air_quality',
    interactiveDemoChart: 'correlogram'
  },
  {
    id: 'position_and_magnitude',
    title: '6. Position, Length, & Area Magnitude (Cleveland–McGill Hierarchy)',
    category: 'Visual Channels & Perception',
    level: 'Foundational',
    concept: 'Human visual perception decodes spatial position along a common scale most accurately (Rank 1), followed by length (Rank 3), slope/angle (Rank 4), area (Rank 5), and color luminance (Rank 7).',
    whyItMatters: 'Encoding primary quantities with low-accuracy channels (like pie angles or 3D volumes) degrades reader comprehension and can introduce systematic perceptual bias (Stevens’ Power Law).',
    dataStructure: 'Quantitative comparisons.',
    explanation: {
      simple: 'Our eyes are great at judging where dots or bar tops line up on a ruler, decent at comparing circle areas, and poor at comparing pie slice angles or 3D blocks.',
      standard: 'Cleveland & McGill (1984) proved experimentally that aligned positional judgments have the lowest relative error. Furthermore, when using 2D circle symbols (Bubble Plots), area A = π r² must scale linearly with value (r ∝ √V).',
      technical: 'Stevens’ Psychophysical Power Law states perceived magnitude ψ(I) = k I^β, where β ≈ 1.0 for linear length but β ≈ 0.7–$0.8 for 2D area. Scaling radius r ∝ V causes physical area A ∝ V²$, compounding distortion.'
    },
    formula: 'A_i ∝ V_i ⇔ r_i = r_max \sqrt{\frac{V_i}{V_max}}',
    example: 'In Chart Studio and the Chart Literacy Lab, compare true Area-scaled bubbles (r ∝ √V) against misleading Radius-scaled bubbles (r ∝ V).',
    commonMistakes: ['Scaling bubble radius proportional to value', 'Truncating bar chart baselines away from zero'],
    relatedConcepts: ['visual_marks', 'perceptual_limitations', 'graphical_integrity'],
    practicalInterpretation: 'Always map your most important quantitative comparison to aligned X or Y position.',
    interactiveDemoPreset: 'geographic_hydrology_stations',
    interactiveDemoChart: 'geo_bubble_map'
  },
  {
    id: 'shape_and_symbol',
    title: '7. Shape, Redundant Dual-Encoding, & Diagnostic Glyphs',
    category: 'Visual Channels & Perception',
    level: 'Foundational',
    concept: 'Geometric symbol shapes, dashed halo rings, and textual badges provide pre-attentive categorical separation that reinforces color channels.',
    whyItMatters: 'Redundant dual-encoding (color + geometry) ensures that critical statistical diagnostics remain legible in grayscale printouts and for users with color-vision deficiency.',
    dataStructure: 'Low-cardinality categorical flags (2–5 states).',
    explanation: {
      simple: 'Pairing color with distinct shapes—like a dashed ring for high-influence outliers or a diamond for the group average—means no one misses the signal.',
      standard: 'In DataSense scatter and regression plots, high Cook’s distance (D_i > 4/n) is dual-encoded with vermilion color AND a dashed outer halo ring, while high leverage (h_i > 4/n) uses an amber solid ring.',
      technical: 'Shape is a strictly nominal channel with zero intrinsic ordering (|S| ≤ 6 discriminable glyphs).'
    },
    formula: 'D_i = (r_i² / 2)(h_i / 1 - h_i) > (4 / n) ⇒ Dashed Vermilion Halo',
    example: 'Load Anscombe’s Quartet III or IV in Chart Studio to inspect the diagnostic halo rings on influential observations.',
    commonMistakes: ['Mapping ordinal or continuous variables to arbitrary shapes'],
    relatedConcepts: ['accessibility', 'color_semantics'],
    practicalInterpretation: 'Use redundant shape/halo encodings whenever flagging outliers or diagnostic thresholds.',
    interactiveDemoPreset: 'anscombe_3',
    interactiveDemoChart: 'scatter_ols'
  },
  {
    id: 'grouping',
    title: '8. Grouping, Stratification, & Simpson’s Paradox',
    category: 'Multivariate Structure',
    level: 'Intermediate',
    concept: 'Grouping partitions a dataset into conditioning cohorts G = g, allowing models and distributions to be evaluated within strata rather than pooled marginally.',
    whyItMatters: 'Pooling across heterogeneous groups can reverse the sign of a regression slope or correlation—a phenomenon known as Simpson’s Paradox.',
    dataStructure: 'Quantitative variables (X, Y) + categorical grouping factor G.',
    explanation: {
      simple: 'Combining different groups into one big pile can hide or even flip the true trend; coloring or splitting by group reveals what is actually happening inside each cohort.',
      standard: 'When a confounding variable G affects both predictor X and response Y, the marginal slope β̂_1,pooled is a weighted combination of within-group slopes and between-group centroid shifts.',
      technical: 'Cov(X, Y) = E[Cov(X, Y | G)] + Cov(E[X | G], E[Y | G])'
    },
    formula: 'sign (Cov(X, Y) ) ≠ sign (Cov(X, Y | G=g) )',
    example: 'In Preset 10 (Confounded Dosage Study), pooled correlation is negative, but within Mild, Moderate, and Severe strata the correlation is strongly positive (r ≈ +0.99).',
    commonMistakes: ['Reporting pooled observational regressions without checking key demographic or baseline severity strata'],
    relatedConcepts: ['faceting', 'statistical_vs_visual_evidence'],
    practicalInterpretation: 'Always test whether coloring or faceting by a grouping variable alters your bivariate conclusion.',
    interactiveDemoPreset: 'simpsons_paradox_clinical',
    interactiveDemoChart: 'scatter_ols'
  },
  {
    id: 'faceting',
    title: '9. Faceting & Small Multiples (Conditioning Plots)',
    category: 'Multivariate Structure',
    level: 'Intermediate',
    concept: 'Faceting splits a visualization into a grid of miniature panels—one per level of a conditioning variable—sharing identical axis domains.',
    whyItMatters: 'When 3 or more groups overlap on a single canvas, small multiples eliminate visual occlusion while preserving Rank-2 aligned scale comparisons.',
    dataStructure: 'Primary variables + categorical conditioning variable.',
    explanation: {
      simple: 'Instead of piling six noisy lines or point clouds on top of each other, give each group its own small box with the exact same rulers.',
      standard: 'Introduced by Tufte and formalized as Trellis displays by Becker, Cleveland, & Shyu (1996), small multiples rely on locked coordinate ranges across every panel.',
      technical: 'Every facet panel g ∈ \\{1,…,K\\} shares identical projection closures T_x: [x_min, x_max] → [0, W_p] and T_y: [y_min, y_max] → [H_p, 0].'
    },
    formula: '∀ g_1, g_2:   dom(X_g_1) = dom(X_g_2) = [min_i x_i, max_i x_i]',
    example: 'Compare Confounded Dosage Study in Small Multiples mode.',
    commonMistakes: ['Allowing each small-multiple panel to auto-scale its own y-axis without clear disclosure, making small fluctuations look as large as major trends'],
    relatedConcepts: ['grouping', 'position_and_magnitude'],
    practicalInterpretation: 'Use Small Multiples whenever overlapping groups obscure one another.',
    interactiveDemoPreset: 'simpsons_paradox_clinical',
    interactiveDemoChart: 'small_multiples'
  },
  {
    id: 'ordering',
    title: '10. Principle of Meaningful Ordering (Chronological, Ordinal, Magnitude)',
    category: 'Scales & Transformations',
    level: 'Foundational',
    concept: 'Discrete axes must be ordered by an informative statistical or domain criterion: chronological order for time, intrinsic rank for ordinal scales, and magnitude order (descending/ascending) for nominal categories.',
    whyItMatters: 'Default alphabetical sorting (`Apr, Aug, Dec...` or `Critical, High, Low, Moderate`) scrambles patterns and forces readers to hunt across the chart.',
    dataStructure: 'Categorical and temporal variables.',
    explanation: {
      simple: 'Never leave categories in random or alphabetical order unless people are looking up names in a phonebook: sort nominal bars from tallest to shortest, and keep ordinal/time scales in their natural sequence.',
      standard: 'Per VISUALIZATION_STANDARDS.md Section A.1, ordered factors must sort by factor level index, cyclic temporal variables by calendar cycle, and nominal categories by quantitative summary value.',
      technical: 'For nominal k ∈ \\{1,…,K\\}, apply permutation π such that y_π(1) ≥ y_π(2) ≥ … ≥ y_π(K). For ordinal (L, ≺), enforce π(a) < π(b) ⇔ a ≺ b.'
    },
    formula: 'y_π(1) ≥ y_π(2) ≥ … ≥ y_π(K)',
    example: 'In Preset 3 (Hospital Triage), `service_unit` sorts by admission count while `acuity_level` preserves `Low < Moderate < High < Critical`.',
    commonMistakes: ['Sorting ordinal Likert scales by frequency, which breaks the progression from Strongly Disagree to Strongly Agree', 'Sorting month names alphabetically'],
    relatedConcepts: ['aesthetic_mappings', 'coordinate_systems'],
    practicalInterpretation: 'Use the Sort Order control in Chart Studio (`Default / Ordinal`, `Descending`, `Ascending`) to match your variable’s nature.',
    interactiveDemoPreset: 'categorical_triage_admissions',
    interactiveDemoChart: 'bar_horizontal'
  },
  {
    id: 'aggregation',
    title: '11. Statistical Aggregation & Information Loss',
    category: 'Scales & Transformations',
    level: 'Intermediate',
    concept: 'Aggregation maps a vector of n observations to a lower-dimensional summary statistic (count, sum, mean, median, IQR). Every aggregation emphasizes a target property while discarding degrees of freedom.',
    whyItMatters: 'Four completely different datasets (Anscombe’s Quartet I–IV) can share identical means, standard deviations, correlations, and OLS lines.',
    dataStructure: 'Many-to-one mapping T: ℝⁿ → ℝ^k (k ≪ n).',
    explanation: {
      simple: 'Summarizing 50 numbers with a single average is helpful, but it throws away the shape of the data—two groups with the same average can look completely different.',
      standard: 'Sufficient statistics only capture all information when the parametric family is known and true. In exploratory analysis, summaries must be paired with distributional or residual views.',
      technical: 'Projection onto low-order sample moments (x̄, s_x, ȳ, s_y, r) leaves an (n - 3)-dimensional orthogonal manifold of datasets sharing identical OLS fits (STATISTICAL_STANDARDS.md Section H).'
    },
    formula: 'dim(ker(T)) = n - k',
    example: 'Compare Anscombe I, II, III, and IV or compare a Boxplot against a Violin/Histogram on Semiconductor Wafer Thickness.',
    commonMistakes: ['Publishing group means without showing within-group distribution or sample size n_k'],
    relatedConcepts: ['normalization', 'statistical_vs_visual_evidence'],
    practicalInterpretation: 'Always inspect the raw observations or distribution before trusting an aggregate summary.',
    interactiveDemoPreset: 'anscombe_2',
    interactiveDemoChart: 'scatter_ols'
  },
  {
    id: 'normalization',
    title: '12. Normalization, Proportions, & Explicit Denominators',
    category: 'Scales & Transformations',
    level: 'Intermediate',
    concept: 'Normalization divides raw counts or measurements by an explicit reference denominator (total sample size N, group size n_i•, bin width w_k, or population exposure P_i).',
    whyItMatters: 'Changing the denominator changes the statistical question being answered. Comparing raw counts across unequally sized groups or regions confuses sample size with rate.',
    dataStructure: 'Contingency tables, histograms, and regional data.',
    explanation: {
      simple: 'A raw count tells you "how many," while a percentage or rate tells you "how many out of each 100." You always need to know what the bottom number (the denominator) is.',
      standard: 'In a two-way contingency table, n_ij/N is the joint proportion, n_ij/n_i• is the row-conditional proportion, and n_ij/n_• j is the column-conditional proportion.',
      technical: '∑_i,j \frac{n_ij}{N} = 1,   ∀ i: ∑_j \frac{n_ij}{n_i•} = 1,   ∀ j: ∑_i \frac{n_ij}{n_• j} = 1'
    },
    formula: 'p_j | i = \frac{n_ij}{∑_m n_im} ≠ p_i | j = \frac{n_ij}{∑_k n_kj}',
    example: 'Explore Unity Group 4 (Clinical Regimen × Recovery Tier) to see how switching from raw counts to 100% row-normalized bars reconciles unequal regimen sample sizes.',
    commonMistakes: ['Confusing P(A | B) with P(B | A) (prosecutor’s fallacy / inverse conditional confusion)', 'Shading choropleth maps by raw counts instead of per-capita rates'],
    relatedConcepts: ['aggregation', 'binning', 'graphical_integrity'],
    practicalInterpretation: 'Check the denominator printed in VisualGrammar’s tooltips and table summaries.',
    interactiveDemoPreset: 'contingency_clinical_outcomes',
    interactiveDemoChart: 'bar_stacked_100'
  },
  {
    id: 'smoothing',
    title: '13. Kernel Smoothing & Bandwidth Bias–Variance Trade-Off',
    category: 'Scales & Transformations',
    level: 'Advanced',
    concept: 'Kernel Density Estimation (KDE) and regression smoothers estimate underlying continuous functions by averaging local neighborhoods controlled by a bandwidth parameter h.',
    whyItMatters: 'Bandwidth h governs the bias–variance trade-off: small h produces noisy spurious peaks (undersmoothing / high variance), while large h flattens real multimodal structure (oversmoothing / high bias).',
    dataStructure: 'Continuous quantitative samples.',
    explanation: {
      simple: 'A smoothing slider works like camera focus: too sharp and you see every speck of random noise; too blurry and two separate mountain peaks blur into one lump.',
      standard: 'Silverman’s (1986) rule of thumb h = 0.9 min(s, IQR/1.34) n^{-1/5} is optimal for unimodal Gaussian densities, but can slightly oversmooth bimodal distributions.',
      technical: 'MISE(f̂_h) = ∫ Bias²(f̂_h(x)) dx + ∫ Var(f̂_h(x)) dx = O(h⁴) + O ((1 / nh) )'
    },
    formula: 'f̂_h(x) = (1 / nh)∑_i=1ⁿ K ((x - x_i / h) ),   ∫_-∞^{∞} f̂_h(x) dx = 1',
    example: 'Adjust the Bandwidth Multiplier slider on Semiconductor Wafer Thickness from $0.4× to 2.0×$ to watch the bimodal peaks merge.',
    commonMistakes: ['Treating KDE curves on tiny samples (n < 20) as established population shapes', 'Ignoring density tail bleeding below physical zero'],
    relatedConcepts: ['binning', 'uncertainty'],
    practicalInterpretation: 'Always vary the bandwidth slider to check whether apparent peaks are stable structural features.',
    interactiveDemoPreset: 'univariate_wafer_thickness',
    interactiveDemoChart: 'kde_density'
  },
  {
    id: 'binning',
    title: '14. Histogram Binning & Probability Density Scaling',
    category: 'Scales & Transformations',
    level: 'Intermediate',
    concept: 'Binning partitions a continuous domain into intervals [x_k-1, x_k) of width w_k. When bin widths vary or when comparing against a continuous PDF, bar height must encode probability density n_k / (n · w_k).',
    whyItMatters: 'Plotting raw counts over unequal bin widths makes wide bins look artificially tall, violating the principle that histogram bar area represents relative frequency.',
    dataStructure: '1 quantitative variable.',
    explanation: {
      simple: 'In a true histogram, it is the area of each bar—not just its height—that represents the share of data. If a bucket is twice as wide, its height must be cut in half to represent the same amount of data.',
      standard: 'Freedman–Diaconis (w = 2 · IQR · n^{-1/3}), Scott (w = 3.49 s n^{-1/3}), and Sturges (K = ⌈ log_2 n + 1 ⌉) provide principled defaults, but interactive inspection across multiple bin counts is essential.',
      technical: 'f̂(x) = \frac{n_k}{n (x_k - x_k-1)}   for  x ∈ [x_k-1, x_k) ⇒ ∑_k=1^K f̂_k w_k = ∑_k=1^K (n_k / n) = 1'
    },
    formula: 'Area_k = w_k · Density_k = w_k · (n_k / n · w_k) = (n_k / n)',
    example: 'Switch between Count, Relative Frequency, and Probability Density scales in Chart Studio and inspect Experiment 5 in the Chart Literacy Lab.',
    commonMistakes: ['Plotting unequal bin widths on a raw count y-axis', 'Using a single arbitrary bin count without testing sensitivity'],
    relatedConcepts: ['smoothing', 'normalization'],
    practicalInterpretation: 'Vary the Histogram Bins slider in Chart Studio or Unity Lab to verify distribution shape.',
    interactiveDemoPreset: 'univariate_wafer_thickness',
    interactiveDemoChart: 'histogram'
  },
  {
    id: 'missing_data_representation',
    title: '15. Missing Data Representation & Complete-Case Disclosure',
    category: 'Data Integrity & Uncertainty',
    level: 'Intermediate',
    concept: 'Missing values (`null`) must be explicitly tracked, profiled, and disclosed whenever listwise complete-case deletion excludes observations from a chart or statistical calculation.',
    whyItMatters: 'Silently dropping rows with missing coordinates alters denominators and can bias estimates if missingness is related to the outcome.',
    dataStructure: 'Tabular datasets with `null` cells.',
    explanation: {
      simple: 'Never sweep missing data under the rug: always state how many rows were actually plotted (n) and how many were skipped because of missing values.',
      standard: 'Conforms to DATA_CONVENTIONS.md Section C: complete-case analysis is permitted when accompanied by explicit disclosure of effective sample size n vs total rows.',
      technical: 'Let $M_i ∈ \\{0, 1\\} indicate missingness. Complete-case estimators are unbiased only under Missing Completely at Random (MCAR: P(M_i = 1 | Y_i, X_i) = P(M_i = 1)$).'
    },
    formula: 'n_effective = ∑_i=1^{N_total} ∏_j ∈ mapped I(x_ij ≠ null)',
    example: 'Understand Data tab displays exact missing counts and percentages for every column.',
    commonMistakes: ['Replacing missing values with zero (`0`), which corrupts means, regressions, and minimums'],
    relatedConcepts: ['normalization', 'graphical_integrity'],
    practicalInterpretation: 'Always check the Missingness column in Understand Data before interpreting summaries.',
    interactiveDemoPreset: 'ambiguous_sensor_audit',
    interactiveDemoChart: 'bar_vertical'
  },
  {
    id: 'uncertainty',
    title: '16. Communicating Uncertainty (SD vs SE vs 95% CI vs 95% PI)',
    category: 'Data Integrity & Uncertainty',
    level: 'Advanced',
    concept: 'Visualizations of uncertainty must distinguish descriptive spread of individual observations (SD, IQR) from inferential precision of a parameter estimate (SE, 95% CI) and forecast range for a single future observation (95% PI).',
    whyItMatters: 'Labeling an error bar generically as "error" leaves readers unable to tell whether the bar shows narrow standard error (s/√n) or wide individual variability (s).',
    dataStructure: 'Raw samples or derived estimate/interval tables.',
    explanation: {
      simple: 'Standard Deviation (SD) shows how spread out individual items are. Standard Error (SE) and 95% Confidence Intervals (CI) show how closely we have pinned down the group average. Prediction Intervals (PI) show where a single new individual might land.',
      standard: 'Per STATISTICAL_STANDARDS.md Section D.1, a 95% frequentist confidence interval means that under repeated sampling, 95% of constructed intervals cover the fixed parameter θ—NOT that θ has a 95% probability of moving inside a fixed interval.',
      technical: 'SE(Ȳ) = (s / √n),   CI_95%(μ) = ȳ ± t_n-1(s / √n),   PI_95%(Y_new) = ȳ ± t_n-1 s √(1 + (1 / n))'
    },
    formula: 'lim_n → ∞ Width(CI_95%) = 0,   lim_n → ∞ Width(PI_95%) = 2 z_0.975σ > 0',
    example: 'Use Preset 14 (Multi-Center Trial Efficacy) in Chart Studio and switch the Uncertainty Measure selector between 95% CI, 95% PI, SE, and SD.',
    commonMistakes: ['Interpreting a realized 95% CI as a 95% posterior probability on a fixed parameter', 'Assuming two means are not significantly different if their ± 1 SD bars overlap'],
    relatedConcepts: ['statistical_vs_visual_evidence', 'reference_lines'],
    practicalInterpretation: 'Always state the exact interval formula and confidence level in the chart label.',
    interactiveDemoPreset: 'uncertainty_meta_analysis',
    interactiveDemoChart: 'error_bars'
  },
  {
    id: 'reference_lines',
    title: '17. Reference Lines, Thresholds, & Null Baselines',
    category: 'Contextual Framing',
    level: 'Foundational',
    concept: 'Reference lines anchor visual comparisons against meaningful mathematical or domain benchmarks: e = 0 in residual plots, y = x in Q–Q and lag plots, (x̄, ȳ) in OLS regression, and ± 1.96/√T in ACF correlograms.',
    whyItMatters: 'Without a reference line, subtle curvature away from zero or departures from normal quantiles are difficult to judge accurately.',
    dataStructure: 'Constant threshold y = c, diagonal identity y = x, or statistical critical boundary.',
    explanation: {
      simple: 'A dashed reference line acts like a carpenter’s level, letting your eye immediately spot where points drift above or below a benchmark.',
      standard: 'In Residual-vs-Fitted plots, the horizontal e = 0 line represents exact agreement with the linear model; in Normal Q–Q plots, y = x represents exact Gaussian conformity.',
      technical: 'Bartlett’s white-noise bounds ± z_1-α/2/√T provide asymptotic (1-α) acceptance thresholds under H_0: ρ_k = 0 for k ≥ 1.'
    },
    formula: 'e_i = 0,   z_emp = z_theo,   r_k = ± (1.96 / √T)',
    example: 'Enter a custom Reference Line value in Chart Studio or inspect the automatic e = 0 line in Residual-vs-Fitted.',
    commonMistakes: ['Omitting the zero line on residual plots or the identity line on Q–Q plots'],
    relatedConcepts: ['annotations', 'chart_interpretation'],
    practicalInterpretation: 'Use Reference Lines in Chart Studio to mark clinical thresholds, specification targets, or null values.',
    interactiveDemoPreset: 'anscombe_2',
    interactiveDemoChart: 'residual_fitted'
  },
  {
    id: 'legends',
    title: '18. Legends, Direct Labeling, & Cognitive Load',
    category: 'Contextual Framing',
    level: 'Foundational',
    concept: 'Legends decode non-positional visual channels (color hue, luminance, symbol size, line pattern) back into variable values and group sample sizes.',
    whyItMatters: 'Unlabeled colors or missing group sample sizes (n_g) force readers to guess what visual differences represent.',
    dataStructure: 'Categorical or continuous scale keys.',
    explanation: {
      simple: 'A legend is the translation key for colors and symbols; whenever possible, include the group name and sample size right in the label.',
      standard: 'Direct labeling (as used on VisualGrammar’s Slopegraphs, Horizontal Bars, and Ridgeline Plots) minimizes eye saccades between the plot plane and a separate legend box.',
      technical: 'Minimizes working-memory lookup cost O(|G|) during multi-series visual comparison.'
    },
    formula: 'Label_g = Name_g   (n = n_g)',
    example: 'Observe how VisualGrammar’s Grouped Boxplot, Ridgeline, and 100% Stacked Bar charts automatically append `(n=...)` to group labels.',
    commonMistakes: ['Ordering legend items in the opposite vertical order of the lines or stacked segments on the chart'],
    relatedConcepts: ['labels', 'color_semantics', 'accessibility'],
    practicalInterpretation: 'Keep category counts ≤ 6 when relying on a color legend.',
    interactiveDemoPreset: 'contingency_clinical_outcomes',
    interactiveDemoChart: 'bar_stacked_100'
  },
  {
    id: 'labels',
    title: '19. Axis Labels, Units of Measurement, & Tabular Numerals',
    category: 'Contextual Framing',
    level: 'Foundational',
    concept: 'Every axis and numeric table must state the variable name, any mathematical transformation applied (e.g., `log10`, `Z-score`, `MEAN`), and the physical unit of measurement (`nm`, `kPa`, `Wh/kg`, `%`).',
    whyItMatters: 'Numbers without units are uninterpretable, and proportional fonts cause live numerical readouts to jitter horizontally.',
    dataStructure: 'Variable metadata (`name`, `label`, `unit`, `transformation`).',
    explanation: {
      simple: 'Always label axes with both what is being measured and the units (like °C or Wh/kg), and use fixed-width numbers so digits line up cleanly.',
      standard: 'Conforms to DESIGN.md: all numeric readouts, tick labels, and statistical tables apply `JetBrains Mono` with `font-variant-numeric: tabular-nums`.',
      technical: 'Monospace tabular glyphs enforce constant advance width w(digit_a) = w(digit_b) across $0… 9$ and minus signs.'
    },
    formula: 'Axis Title = f(Variable)   [Unit]',
    example: 'Inspect the axis labels and Computer Regression Output Table in Chart Studio.',
    commonMistakes: ['Omitting units after applying a transformation (e.g., failing to note that probability density has units of $1/unit$)'],
    relatedConcepts: ['captions', 'annotations'],
    practicalInterpretation: 'You can customize units and variable labels in the Understand Data tab.',
    interactiveDemoPreset: 'cat_numeric_battery_chemistry',
    interactiveDemoChart: 'grouped_boxplot'
  },
  {
    id: 'annotations',
    title: '20. In-Canvas Annotations & Outlier Attribution',
    category: 'Contextual Framing',
    level: 'Foundational',
    concept: 'Annotations attach contextual callouts directly to notable data features—such as extreme leverage points, regime shifts, or specification limits—inside the plotting plane.',
    whyItMatters: 'Highlighting why an observation is unusual turns a passive graphic into an explanatory analytical instrument.',
    dataStructure: 'Observation-level or coordinate-anchored text.',
    explanation: {
      simple: 'Adding a short note right on the chart helps readers immediately understand special events or extreme points.',
      standard: 'Good annotations state factual provenance or diagnostic metrics (e.g., `Case 3: Cook’s D = 1.41`) without inventing unsupported causal stories.',
      technical: 'Anchors textual metadata to data coordinates (x_0, y_0) or canvas landmarks.'
    },
    formula: 'Callout(x_i, y_i) ↦ Diagnostic Context',
    example: 'Use the Custom Annotation input in Chart Studio’s Right Panel to stamp an analytical note onto the canvas.',
    commonMistakes: ['Cluttering every single point with long text labels instead of annotating key outliers and providing hover/keyboard inspection for the rest'],
    relatedConcepts: ['reference_lines', 'captions'],
    practicalInterpretation: 'Combine in-canvas annotations with interactive tooltips for clean visual hierarchy.',
    interactiveDemoPreset: 'anscombe_3',
    interactiveDemoChart: 'scatter_ols'
  },
  {
    id: 'captions',
    title: '21. Informative Titles, Subtitles, & Provenance Captions',
    category: 'Contextual Framing',
    level: 'Foundational',
    concept: 'A complete statistical graphic pairs a clear title and scope subtitle with a caption disclosing sample size (n), missing exclusions, uncertainty definitions, and data provenance.',
    whyItMatters: 'As Cairo (2019) emphasizes in *How Charts Lie*, stripping a chart of its source, sample size, and denominator context is one of the most common sources of public misinformation.',
    dataStructure: 'Dataset-level metadata.',
    explanation: {
      simple: 'A chart’s title, subtitle, and bottom caption tell the reader where the data came from, how many items were measured, and whether the data are real or synthetic.',
      standard: 'VisualGrammar automatically stamps every SVG export and dataset header with sample size n, complete-case count, and provenance (`Synthetic Pedagogical` vs `Benchmark`).',
      technical: 'Preserves full metadata lineage in `DataSenseDataset` v1.0.0 exports.'
    },
    formula: 'Provenance = (Source,   n_valid,   n_missing,   Transformations)',
    example: 'Check the dataset provenance badge at the top of Understand Data and Chart Studio.',
    commonMistakes: ['Presenting synthetic demonstration data as real empirical findings', 'Omitting sample size n from percentage charts'],
    relatedConcepts: ['graphical_integrity', 'missing_data_representation'],
    practicalInterpretation: 'Always fill in Title and Subtitle before exporting a chart for a report or classroom worksheet.',
    interactiveDemoPreset: 'timeseries_co2_trend',
    interactiveDemoChart: 'line_chart'
  },
  {
    id: 'graphical_integrity',
    title: '22. Graphical Integrity & Tufte’s Proportionality Principle',
    category: 'Chart Integrity & Literacy',
    level: 'Foundational',
    concept: 'The representation of numbers, as physically measured on the surface of the graphic itself, must be directly proportional to the numerical quantities represented.',
    whyItMatters: 'Truncated bar baselines, radius-scaled bubbles, 3D perspective foreshortening, and dual vertical axes systematically deceive the human eye.',
    dataStructure: 'Applies to all quantitative visual encodings.',
    explanation: {
      simple: 'If one number is twice as big as another, its bar or area on the screen should be twice as big—never stretched or shrunk by tricky axes.',
      standard: 'VisualGrammar operationalizes graphical integrity through its live 13-rule Integrity Engine and the 15 interactive repair experiments in the Chart Literacy Lab.',
      technical: 'Lie Factor = \frac{Relative Change in Graphic}{Relative Change in Data} = ((g_2 - g_1)/g_1 / (d_2 - d_1)/d_1) ≈ 1.0'
    },
    formula: 'Visual Ratio  (L_2 / L_1) = \frac{y_2 - y_base}{y_1 - y_base} = (y_2 / y_1) ⇔ y_base = 0',
    example: 'Visit the Chart Literacy Lab to repair truncated baselines, radius-scaled bubbles, and unnormalized counts interactively.',
    commonMistakes: ['Truncating bar chart axes', 'Using dual independent y-axes to manufacture false correlation'],
    relatedConcepts: ['position_and_magnitude', 'perceptual_limitations'],
    practicalInterpretation: 'Review the Integrity Warnings panel in Chart Studio before exporting any graphic.',
    interactiveDemoPreset: 'categorical_triage_admissions',
    interactiveDemoChart: 'bar_vertical'
  },
  {
    id: 'accessibility',
    title: '23. Accessible & Inclusive Statistical Visualization (WCAG 2.2 AA)',
    category: 'Chart Integrity & Literacy',
    level: 'Foundational',
    concept: 'Accessible visualization ensures that users relying on keyboard navigation, screen readers, reduced motion, or color-vision deficiency adaptations receive the same statistical truth as sighted mouse users.',
    whyItMatters: 'A canvas element without semantic summaries, keyboard-inspectable data tables, and colorblind-safe contrast is an opaque black box to assistive technologies.',
    dataStructure: 'DOM + ARIA + Synchronized Tabular Equivalents.',
    explanation: {
      simple: 'Every chart should work with a keyboard, use high-contrast colorblind-safe colors, and include a readable summary and data table for screen readers.',
      standard: 'VisualGrammar provides live ARIA descriptions (`aria-live="polite"`), synchronized accessible data tables under every chart, 15.8:1 primary text contrast, Okabe-Ito palettes, and `prefers-reduced-motion` support.',
      technical: 'Satisfies WCAG 2.2 Success Criteria 1.1.1 (Non-text Content), 1.4.1 (Use of Color), 1.4.3 (Contrast Minimum), and 2.1.1 (Keyboard).'
    },
    formula: 'Contrast Ratio = (L_1 + 0.05 / L_2 + 0.05) ≥ 4.5 : 1',
    example: 'Toggle the Accessible Data Table below the main Chart Studio canvas or switch to the Okabe-Ito palette.',
    commonMistakes: ['Encoding groups by red vs green alone', 'Rendering canvas charts with no textual or tabular fallback'],
    relatedConcepts: ['color_semantics', 'shape_and_symbol'],
    practicalInterpretation: 'Always keep the synchronized interpretation and summary table available alongside graphical exports.',
    interactiveDemoPreset: 'cat_numeric_battery_chemistry',
    interactiveDemoChart: 'grouped_boxplot'
  },
  {
    id: 'perceptual_limitations',
    title: '24. Perceptual Limitations (Angle, Slope Banking, Weber’s Law, Sine Illusion)',
    category: 'Visual Channels & Perception',
    level: 'Advanced',
    concept: 'Human visual cortex geometry introduces predictable biases when judging non-aligned vertical distances on steep curves, acute angles in pie charts, and extreme aspect ratios.',
    whyItMatters: 'On a steeply sloped curve, the eye judges the perpendicular (shortest orthogonal) width between two curves rather than the true vertical distance Δ y.',
    dataStructure: 'Continuous curves, ribbons, and aspect ratios.',
    explanation: {
      simple: 'Optical illusions happen in charts too: extreme wide or tall aspect ratios can hide a trend, and our eyes misjudge the vertical width of a ribbon when the line is very steep.',
      standard: 'Cleveland, McGill, & McGill (1988) showed that slope changes are judged most accurately when line segments are banked to an average orientation near $45°$.',
      technical: 'Perpendicular width w_⊥ = Δ y cosθ = (Δ y / √(1 + (f\'(x))²)) shrinks as |f\'(x)| increases (the Sine Illusion).'
    },
    formula: 'w_⊥ = \frac{U(x) - L(x)}{\sqrt{1 + [ŷ\'(x)]²}}',
    example: 'Explore the Aspect Ratio experiment in the Chart Literacy Lab and Residual-vs-Fitted plots (which flatten the slope to $0°$ to eliminate the sine illusion!).',
    commonMistakes: ['Flattening a chart aspect ratio to 10:1 to make a steep rise look flat', 'Judging residual spread directly off a steep regression line instead of a horizontal Residual-vs-Fitted plot'],
    relatedConcepts: ['position_and_magnitude', 'reference_lines'],
    practicalInterpretation: 'Use a horizontal Residual-vs-Fitted plot whenever checking whether variance is constant along a steep line.',
    interactiveDemoPreset: 'timeseries_co2_trend',
    interactiveDemoChart: 'line_chart'
  },
  {
    id: 'chart_interpretation',
    title: '25. Systematic 5-Step Chart Reading & Interpretation Protocol',
    category: 'Chart Integrity & Literacy',
    level: 'Foundational',
    concept: 'Reading a statistical graphic requires a disciplined sequence: (1) Title & provenance, (2) Axes, units, & scales, (3) Marks & visual encodings, (4) Annotations & denominators, and (5) Patterns, uncertainty, & limitations.',
    whyItMatters: 'Jumping straight to visual impressions without checking whether the y-axis is log-scaled, truncated, or normalized leads to immediate misinterpretation.',
    dataStructure: 'All statistical graphics.',
    explanation: {
      simple: 'Before reacting to a dramatic spike or gap on a chart, pause for 10 seconds to read the title, check the axes and zero baseline, verify the units, and check the sample size.',
      standard: 'Operationalized in the Chart Literacy Lab’s interactive 5-Step Walkthrough and Chart Studio’s 3-part Interpretation Panel.',
      technical: 'Separates syntactic decoding (scales, marks, coordinate system) from semantic inference (moments, models, sampling uncertainty).'
    },
    formula: 'Data →(Transform) Statistic →(Scale) Geometry →(Perception) Inference',
    example: 'Use the 5-Step Reading Walkthrough in the Chart Literacy Lab.',
    commonMistakes: ['Mistaking a density y-axis for a percentage y-axis', 'Ignoring the sample size badge n'],
    relatedConcepts: ['graphical_integrity', 'statistical_vs_visual_evidence'],
    practicalInterpretation: 'Switch between Simple, Standard, and Technical modes in the top bar to see how each step deepens in rigor.',
    interactiveDemoPreset: 'anscombe_1',
    interactiveDemoChart: 'scatter_ols'
  },
  {
    id: 'statistical_vs_visual_evidence',
    title: '26. Statistical Evidence vs Visual Appearance (Association ≠ Causation)',
    category: 'Chart Integrity & Literacy',
    level: 'Advanced',
    concept: 'A striking visual pattern in a small sample can arise from random sampling variation, and even a genuine population correlation (ρ ≠ 0) in observational data does not establish a causal effect.',
    whyItMatters: 'Visual inspection and statistical modeling are complementary partners: visualization exposes model violations (Anscombe), while statistical inference guards against over-interpreting random noise.',
    dataStructure: 'Observational vs experimental designs.',
    explanation: {
      simple: 'Seeing a pattern in a chart is the start of an investigation, not proof of cause and effect. In small samples, random luck can create bumps, and in observational data, hidden third factors can drive both variables.',
      standard: 'Per STATISTICAL_STANDARDS.md Section N, observational associations must be described with associational language ("is associated with", "correlates with"), never causal language ("causes", "drives"), unless backed by randomized experimental assignment.',
      technical: 'Observational conditional expectation E[Y | X=x] does not equal interventional expectation E[Y | do(X=x)] in the presence of unmeasured confounders U.'
    },
    formula: 'E[Y | X = x] ≠ E[Y | do(X = x)]',
    example: 'Compare Anscombe’s Quartet (where visualization rescues summary statistics) with Simpson’s Paradox (where conditioning rescues visual pooling).',
    commonMistakes: ['Using causal verbs for observational scatterplots', 'Declaring a small-sample histogram bump to be a true population sub-group'],
    relatedConcepts: ['grouping', 'uncertainty', 'aggregation'],
    practicalInterpretation: 'Combine visual diagnostics with explicit sample sizes, confidence intervals, and domain study design.',
    interactiveDemoPreset: 'simpsons_paradox_clinical',
    interactiveDemoChart: 'scatter_ols'
  }
];
