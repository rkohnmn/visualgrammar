/**
 * VisualGrammar — Known Visualization Unity Engine & Similarity Ontology (unity-lab.js)
 * Conforms strictly to Part 10 of the VisualGrammar specification and VISUALIZATION_STANDARDS.md Section B.
 * Operationalizes "One Dataset, Many Views" across all 16 required Unity Groups.
 */

export const UNITY_GROUPS = [
  {
    id: 'nominal_1var',
    number: 1,
    title: '1. One Nominal Categorical Variable',
    presetId: 'categorical_triage_admissions',
    dataSignature: '1 unordered qualitative variable X with K discrete classes.',
    sharedInvariant: 'Underlying observation count N = 40 and exact class counts n_k across 5 clinical units.',
    defaultViews: ['bar_vertical', 'bar_horizontal', 'dot_plot', 'lollipop_chart', 'waffle_chart', 'donut_chart'],
    comparisonMatrix: {
      bar_vertical: {
        stayedConstant: 'Category counts n_k and total N = 40.',
        transformationChanged: 'Identity marginal tally: n_k = ∑ I(x_i = k).',
        encodingChanged: 'Vertical bar length from y = 0 baseline (Perceptual Rank 1/3).',
        infoPreserved: 'Exact counts and proportional ratios between categories.',
        moreVisible: 'Immediate height comparison across adjacent categories.',
        lostOrObscured: 'Individual observation arrival times.',
        normalizationEffect: 'Raw count scale; switching to proportion divides by N = 40 without changing bar height ratios.'
      },
      bar_horizontal: {
        stayedConstant: 'Exact category counts n_k and relative ratios.',
        transformationChanged: 'Coordinate transposition (X ↔ Y) with descending magnitude sort.',
        encodingChanged: 'Horizontal bar length from x = 0.',
        infoPreserved: 'All marginal frequencies and rank order.',
        moreVisible: 'Full horizontal legibility of long category names and rank hierarchy.',
        lostOrObscured: 'Nothing relative to vertical bar chart.',
        normalizationEffect: 'Identical linear zero-origin scaling.'
      },
      dot_plot: {
        stayedConstant: 'Exact category counts n_k.',
        transformationChanged: 'Same marginal counts mapped to point coordinate.',
        encodingChanged: 'Replaces solid bar ink with a single circular glyph along a horizontal guide line.',
        infoPreserved: 'Exact value position along aligned scale (Perceptual Rank 1).',
        moreVisible: 'Fine differences between similarly sized categories without visual bar weight.',
        lostOrObscured: 'Heavy visual ink indicating cumulative volume.',
        normalizationEffect: 'Relies purely on positional coordinate decoding.'
      },
      lollipop_chart: {
        stayedConstant: 'Exact category counts n_k.',
        transformationChanged: 'Marginal frequency tabulation sorted by magnitude.',
        encodingChanged: 'Thin zero-anchored stem + terminal circular marker.',
        infoPreserved: 'Both zero-referenced ratio length and crisp endpoint coordinate.',
        moreVisible: 'High data-ink ratio across many categories without moiré bar clutter.',
        lostOrObscured: 'Individual record timestamps.',
        normalizationEffect: 'Requires strict zero baseline because stem length encodes magnitude.'
      },
      waffle_chart: {
        stayedConstant: 'Total partition N = 40.',
        transformationChanged: 'Relative frequency normalization p_k = n_k / N quantized to 100 unit squares via Hamilton largest-remainder method.',
        encodingChanged: '10×10 icon grid where each square = 1% of the sample.',
        infoPreserved: 'Part-to-whole percentages summing strictly to 100%.',
        moreVisible: 'Intuitive part-of-100 share for public communication.',
        lostOrObscured: 'Absolute raw denominator N = 40 unless read from the caption, plus sub-1% precision.',
        normalizationEffect: 'Normalizes total to 100%, removing raw sample size scale.'
      },
      donut_chart: {
        stayedConstant: 'Total partition N = 40.',
        transformationChanged: 'Angular normalization θ_k = 2π (n_k / N).',
        encodingChanged: 'Polar arc length and central angle.',
        infoPreserved: 'Coarse part-to-whole dominance when K ≤ 5.',
        moreVisible: 'Single dominant share relative to 25% / 50% / 75% quadrants.',
        lostOrObscured: 'Fine differences between similarly sized slices (Perceptual Rank 6).',
        normalizationEffect: 'Normalizes total to 360° (100%).'
      }
    }
  },
  {
    id: 'ordinal_1var',
    number: 2,
    title: '2. One Ordinal Categorical Variable',
    presetId: 'categorical_triage_admissions',
    overrideMapping: { x: 'acuity_level', y: '', color: '' },
    dataSignature: '1 ordered qualitative factor X (Low < Moderate < High < Critical).',
    sharedInvariant: 'Intrinsic monotonic rank order of acuity levels across N = 40 admissions.',
    defaultViews: ['bar_vertical', 'lollipop_chart', 'dot_plot', 'waffle_chart'],
    comparisonMatrix: {
      bar_vertical: {
        stayedConstant: 'Natural severity ordering Low < Moderate < High < Critical.',
        transformationChanged: 'Ordered factor tabulation preserving scale index rather than alphabetical order.',
        encodingChanged: 'Aligned left-to-right spatial order matching severity progression.',
        infoPreserved: 'Both category frequency and ordinal rank structure.',
        moreVisible: 'Whether admissions peak in moderate or critical severity.',
        lostOrObscured: 'Alphabetical lookup (intentionally avoided because alphabetical order scrambles Low/Moderate/High/Critical).',
        normalizationEffect: 'Preserves cumulative ordinal interpretation.'
      },
      lollipop_chart: {
        stayedConstant: 'Ordered acuity sequence Low < Moderate < High < Critical.',
        transformationChanged: 'Ordered marginal count tabulation.',
        encodingChanged: 'Zero-based stems + endpoint dots in natural ordinal progression.',
        infoPreserved: 'Exact tier counts and monotonic rank order.',
        moreVisible: 'Step-by-step progression across ordered severity tiers.',
        lostOrObscured: 'Within-tier continuous measurements.',
        normalizationEffect: 'Zero-referenced count or percentage scale.'
      },
      dot_plot: {
        stayedConstant: 'Ordered acuity sequence and tier counts.',
        transformationChanged: 'Ordered marginal tabulation.',
        encodingChanged: 'Aligned horizontal position markers.',
        infoPreserved: 'Rank order and exact frequency coordinates.',
        moreVisible: 'Relative differences between adjacent severity tiers.',
        lostOrObscured: 'Cumulative bar area.',
        normalizationEffect: 'Common linear scale.'
      },
      waffle_chart: {
        stayedConstant: 'Ordered severity partition.',
        transformationChanged: 'Percentage quantization into 100 ordered cells.',
        encodingChanged: 'Sequential 10×10 grid blocks ordered by severity.',
        infoPreserved: 'Cumulative percentage thresholds (e.g., % High or Critical).',
        moreVisible: 'Cumulative tail share of high-acuity patients.',
        lostOrObscured: 'Exact raw count N = 40 without caption.',
        normalizationEffect: '100% part-to-whole normalization.'
      }
    }
  },
  {
    id: 'numeric_1var',
    number: 3,
    title: '3. One Numerical Variable (Synchronized Distribution Unity)',
    presetId: 'univariate_wafer_thickness',
    overrideMapping: { x: 'thickness_nm', y: '', color: '' },
    dataSignature: '1 continuous quantitative variable X (n = 56 silicon wafers).',
    sharedInvariant: 'Exact empirical vector x = (x_1, ..., x_56), mean = 57.99 nm, median = 56.70 nm, IQR = 12.68 nm.',
    defaultViews: ['histogram', 'kde_density', 'ecdf_plot', 'boxplot', 'violin_plot', 'strip_plot'],
    comparisonMatrix: {
      histogram: {
        stayedConstant: 'All 56 wafer thickness observations.',
        transformationChanged: 'Discretization into contiguous intervals [x_{k-1}, x_k) with density scaling f̂_k = n_k / (n · w_k).',
        encodingChanged: 'Contiguous bar heights and areas.',
        infoPreserved: 'Bimodal separation between Line A (~52 nm) and Line B (~64 nm).',
        moreVisible: 'Empirical frequency count per interval and bimodal gap around 58–60 nm.',
        lostOrObscured: 'Exact individual coordinates within each bin; appearance shifts if bin count changes.',
        normalizationEffect: 'Switching from Count to Probability Density divides by (n · binWidth) so total bar area equals 1.0.'
      },
      kde_density: {
        stayedConstant: 'All 56 wafer thickness observations.',
        transformationChanged: 'Continuous convolution with Gaussian kernel of bandwidth h: f̂_h(x) = (1/nh) ∑ K((x - x_i)/h).',
        encodingChanged: 'Smooth continuous curve + bottom rug ticks.',
        infoPreserved: 'Smooth bimodal density peaks without arbitrary bin-edge jumps.',
        moreVisible: 'Smooth population density contour and local modes.',
        lostOrObscured: 'Discrete sample size n (unless rug ticks are shown); large bandwidth h oversmooths the two peaks into one.',
        normalizationEffect: 'Strictly normalized so ∫ f̂_h(x) dx = 1.000.'
      },
      ecdf_plot: {
        stayedConstant: 'All 56 wafer thickness observations.',
        transformationChanged: 'Cumulative indicator sum F̂_n(t) = (1/n) ∑ I(x_i ≤ t).',
        encodingChanged: 'Right-continuous step function rising from 0.0 to 1.0.',
        infoPreserved: '100% lossless: every observation x_(i) and every quantile is recoverable with zero tuning parameters.',
        moreVisible: 'Exact percentiles (median at y = 0.50, quartiles at 0.25/0.75) and the flat plateau between 57 nm and 61 nm.',
        lostOrObscured: 'Density peaks must be read as steep slopes rather than high peaks.',
        normalizationEffect: 'Vertical axis is cumulative probability bounded in [0, 1].'
      },
      boxplot: {
        stayedConstant: 'Underlying 56 observations.',
        transformationChanged: 'Order-statistic compression to 5 Type-7 quantiles (Min, Q1, Median, Q3, Max) + Tukey 1.5 IQR fences.',
        encodingChanged: 'Central IQR box, median line, and whiskers.',
        infoPreserved: 'Median (56.70 nm), IQR (51.65 to 64.33 nm), and extreme range.',
        moreVisible: 'Compact five-number summary landmarks.',
        lostOrObscured: 'CRITICAL LOSS: Completely conceals the bimodal gap between 57 nm and 61 nm! The middle 50% box spans right across the empty valley.',
        normalizationEffect: 'Reduces n = 56 observations to 5 summary quantiles.'
      },
      violin_plot: {
        stayedConstant: 'Underlying 56 observations.',
        transformationChanged: 'Combines mirrored KDE silhouette ±f̂_h(x) with internal Type-7 quartile boxplot.',
        encodingChanged: 'Symmetrical density width + central boxplot spine.',
        infoPreserved: 'Both the bimodal pinch at 59 nm and the exact median/IQR landmarks.',
        moreVisible: 'Simultaneous comparison of multimodal shape and quartile summary.',
        lostOrObscured: 'Individual point positions unless raw points are overlaid.',
        normalizationEffect: 'Mirrored width is proportional to local probability density.'
      },
      strip_plot: {
        stayedConstant: 'All 56 wafer thickness observations.',
        transformationChanged: 'Identity mapping on measurement axis + orthogonal jitter.',
        encodingChanged: '56 individual circular glyphs.',
        infoPreserved: 'Every exact value, sample size n = 56, and the physical gap between clusters.',
        moreVisible: 'Individual wafer readings and exact cluster separation.',
        lostOrObscured: 'Formal parametric or nonparametric density height.',
        normalizationEffect: 'Zero aggregation; 1 mark = 1 observation.'
      }
    }
  },
  {
    id: 'categorical_2var',
    number: 4,
    title: '4. Two Categorical Variables (Contingency & Denominator Unity)',
    presetId: 'contingency_clinical_outcomes',
    overrideMapping: { x: 'regimen', y: '', color: 'response_tier' },
    dataSignature: '2 categorical variables (Regimen × Response Tier, N = 60 patients).',
    sharedInvariant: '3×3 contingency cell counts n_{ij} summing to Grand Total N = 60.',
    defaultViews: ['bar_grouped', 'bar_stacked', 'bar_stacked_100', 'bivariate_heatmap', 'sankey_diagram'],
    comparisonMatrix: {
      bar_grouped: {
        stayedConstant: 'All 9 contingency cell counts n_{ij} (N = 60).',
        transformationChanged: 'Raw cell tally n_{ij} per (Regimen, Response Tier) pair.',
        encodingChanged: 'Side-by-side vertical bars on a common y = 0 baseline.',
        infoPreserved: 'Absolute patient counts in every cell.',
        moreVisible: 'Direct height comparison of individual cells from a flat baseline.',
        lostOrObscured: 'Total sample size per regimen (n_1=22, n_2=22, n_3=16) is not visually summed.',
        normalizationEffect: 'Denominator is 1 patient (absolute count). Comparing raw counts across unequally sized cohorts can mislead.'
      },
      bar_stacked: {
        stayedConstant: 'All 9 cell counts n_{ij} (N = 60).',
        transformationChanged: 'Cumulative vertical sum within each regimen: n_{i•} = ∑_j n_{ij}.',
        encodingChanged: 'Stacked vertical segments.',
        infoPreserved: 'Both cell counts and marginal regimen totals (22, 22, 16).',
        moreVisible: 'Marginal sample size differences across regimens.',
        lostOrObscured: 'Upper segments (Partial & Complete Remission) lose a flat horizontal baseline.',
        normalizationEffect: 'Additive extensive count scale.'
      },
      bar_stacked_100: {
        stayedConstant: 'Underlying cell counts n_{ij}.',
        transformationChanged: 'Row-conditional normalization: p_{j|i} = n_{ij} / n_{i•} so each regimen sums to 100%.',
        encodingChanged: 'Normalized 100% height columns with explicit n_i labels.',
        infoPreserved: 'Conditional probability distribution P(Response | Regimen).',
        moreVisible: 'Complete Remission rises from 18.2% (4/22) in Standard Care to 56.3% (9/16) in Combination Protocol.',
        lostOrObscured: 'Marginal sample size differences (n=22 vs n=16) are normalized away—hence explicit n_i labels are mandatory.',
        normalizationEffect: 'Denominator changes per bar to row total n_{i•}.'
      },
      bivariate_heatmap: {
        stayedConstant: '3×3 contingency table.',
        transformationChanged: '2D matrix layout with cell luminance + direct tabular numerals.',
        encodingChanged: 'Grid position (X, Y) + color lightness + text label.',
        infoPreserved: 'Exact numerical counts and joint percentages.',
        moreVisible: 'Complete matrix pattern without bar clutter.',
        lostOrObscured: 'Length-based ratio perception.',
        normalizationEffect: 'Displays both raw count and joint percentage (denominator N = 60).'
      }
    }
  },
  {
    id: 'cat_numeric',
    number: 5,
    title: '5. Categorical Plus Numerical (Cohort Distribution Unity)',
    presetId: 'cat_numeric_battery_chemistry',
    overrideMapping: { x: 'chemistry', y: 'energy_density_wh_kg', color: 'chemistry' },
    dataSignature: '1 categorical factor (3 battery chemistries) + 1 continuous outcome (Wh/kg, N = 36).',
    sharedInvariant: '12 cell measurements per chemistry (LFP, NMC-811, Solid-State).',
    defaultViews: ['grouped_boxplot', 'violin_plot', 'strip_plot', 'beeswarm_plot', 'ridgeline_plot', 'point_interval'],
    comparisonMatrix: {
      grouped_boxplot: {
        stayedConstant: '36 battery cell observations across 3 chemistries.',
        transformationChanged: 'Within-group Type-7 quartiles + Tukey 1.5 IQR whiskers + jittered points.',
        encodingChanged: 'Aligned vertical boxplots + individual observation dots.',
        infoPreserved: 'Group medians, IQRs, means, and individual observations.',
        moreVisible: 'Clear non-overlapping separation between LFP (~168 Wh/kg), NMC-811 (~268 Wh/kg), and Solid-State (~388 Wh/kg).',
        lostOrObscured: 'Smooth kernel density contour.',
        normalizationEffect: 'Preserves original physical Wh/kg measurement scale.'
      },
      violin_plot: {
        stayedConstant: '36 battery cell observations across 3 chemistries.',
        transformationChanged: 'Within-group Gaussian KDE + internal Type-7 quartile spine.',
        encodingChanged: 'Mirrored density envelopes + median/IQR spine.',
        infoPreserved: 'Both within-group density profile and quartile landmarks.',
        moreVisible: 'Symmetry and tail behavior within each chemistry.',
        lostOrObscured: 'Discrete count of cells unless points are toggled on.',
        normalizationEffect: 'Normalizes maximum violin width per group.'
      },
      strip_plot: {
        stayedConstant: 'All 36 individual cell observations.',
        transformationChanged: 'Identity Y coordinate + deterministic horizontal jitter.',
        encodingChanged: 'Individual circular glyphs + mean crossbar.',
        infoPreserved: '100% of raw observations and exact group sample sizes (n_k = 12).',
        moreVisible: 'Exact empirical readings without smoothing assumptions.',
        lostOrObscured: 'Explicit Q1/Q3 quartile box boundaries.',
        normalizationEffect: 'Unaggregated physical Wh/kg scale.'
      },
      point_interval: {
        stayedConstant: 'Underlying group means and standard errors.',
        transformationChanged: 'Parametric reduction to group mean ȳ_k ± t_{0.975, n_k-1} · SE_k.',
        encodingChanged: 'Central point estimate + 95% confidence interval crossbar.',
        infoPreserved: 'Inferential precision for the population mean μ_k of each chemistry.',
        moreVisible: 'Formal 95% confidence bounds for parameter comparison.',
        lostOrObscured: 'Individual observation spread (which is √n_k times wider than the SE!).',
        normalizationEffect: 'Shifts statistical target from empirical data spread to estimator sampling precision.'
      }
    }
  },
  {
    id: 'numeric_2var',
    number: 6,
    title: '6. Two Numerical Variables (Bivariate Relationship Unity)',
    presetId: 'anscombe_1',
    overrideMapping: { x: 'explanatory_x', y: 'response_y', color: '' },
    dataSignature: '2 quantitative variables (X, Y).',
    sharedInvariant: 'Paired coordinate vectors (x_i, y_i), r = 0.8164, OLS fit ŷ = 3.00 + 0.500x.',
    defaultViews: ['scatter_plot', 'scatter_ols', 'hexbin_2d', 'residual_fitted'],
    comparisonMatrix: {
      scatter_plot: {
        stayedConstant: 'All paired coordinates (x_i, y_i).',
        transformationChanged: 'Identity 2D Cartesian mapping.',
        encodingChanged: 'Orthogonal horizontal and vertical positions.',
        infoPreserved: 'Every individual paired observation and exact leverage/outlier geometry.',
        moreVisible: 'Raw empirical point cloud without parametric model assumptions.',
        lostOrObscured: 'Explicit least-squares slope and confidence envelope.',
        normalizationEffect: 'Unaggregated observation level.'
      },
      scatter_ols: {
        stayedConstant: 'All paired coordinates (x_i, y_i).',
        transformationChanged: 'Orthogonal projection onto linear subspace span(1, x) + Student-t 95% mean confidence band.',
        encodingChanged: 'Adds regression line, hyperbolic 95% CI ribbon, and Cook’s D halos.',
        infoPreserved: 'Raw points plus parametric conditional mean E[Y | X].',
        moreVisible: 'Linear trend slope, centroid fulcrum (x̄, ȳ), and influential cases.',
        lostOrObscured: 'Can visually anchor the eye on a straight line even when subtle curvature exists (verify with Residual plot).',
        normalizationEffect: 'Combines observation marks with parametric model summary.'
      },
      hexbin_2d: {
        stayedConstant: 'Total observation count n.',
        transformationChanged: 'Spatial discretization into 2D grid cells with count aggregation n_{jk}.',
        encodingChanged: 'Tile color luminance + cell count numeral.',
        infoPreserved: 'Coarse bivariate density concentration.',
        moreVisible: 'Local point density in large overlapping datasets.',
        lostOrObscured: 'Exact coordinates (x_i, y_i) of individual points within each 2D bin.',
        normalizationEffect: 'Aggregates individual points into spatial bin counts.'
      },
      residual_fitted: {
        stayedConstant: 'All 11 paired observations and their OLS projection.',
        transformationChanged: 'Subtracts linear trend: e_i = y_i - (β̂_0 + β̂_1 x_i) plotted against ŷ_i.',
        encodingChanged: 'Vertical position now encodes orthogonal vertical deviation from y = 0 reference line.',
        infoPreserved: 'Nonlinear curvature, heteroscedasticity, and vertical outliers.',
        moreVisible: 'Deviations from linearity magnified by removing the tilted slope.',
        lostOrObscured: 'Original response magnitude y_i.',
        normalizationEffect: 'Centers vertical axis strictly at mean residual ē = 0.'
      }
    }
  },
  {
    id: 'numeric_2var_grouped',
    number: 7,
    title: "7. Two Numerical Variables + Grouping Variable (Simpson's Paradox)",
    presetId: 'simpsons_paradox_clinical',
    overrideMapping: { x: 'dosage_mg', y: 'recovery_score', color: 'severity_stratum' },
    dataSignature: '2 quantitative variables (Dosage, Recovery) + 1 confounding stratum (Severity, N = 30).',
    sharedInvariant: '30 patient records across Mild, Moderate, and Severe baseline strata.',
    defaultViews: ['scatter_ols', 'small_multiples', 'scatter_plot', 'grouped_boxplot'],
    comparisonMatrix: {
      scatter_ols: {
        stayedConstant: 'All 30 patient observations.',
        transformationChanged: 'Pooled marginal OLS (negative slope!) vs Stratified conditional OLS (positive slope in every group!).',
        encodingChanged: 'Color hue encoding severity stratum + within-group dashed regression lines.',
        infoPreserved: 'Both global confounding shift and within-stratum positive dose response.',
        moreVisible: 'Direct visual proof of Simpson’s Paradox on a single canvas.',
        lostOrObscured: 'If color is removed, the relationship reverses completely.',
        normalizationEffect: 'Conditioning on the confounder changes the statistical target from E[Y | X] to E[Y | X, Z].'
      },
      small_multiples: {
        stayedConstant: 'All 30 patient observations and shared X/Y coordinate scales.',
        transformationChanged: 'Spatial partitioning into 3 side-by-side stratum panels.',
        encodingChanged: 'Faceted sub-panels with locked axes.',
        infoPreserved: 'Within-stratum positive correlation (r ≈ +0.99 in each panel).',
        moreVisible: 'Uncluttered view of each cohort in isolation.',
        lostOrObscured: 'Direct superposition of all points in one frame.',
        normalizationEffect: 'Locked scales ensure slopes are visually comparable across facets.'
      },
      scatter_plot: {
        stayedConstant: 'All 30 patient observations.',
        transformationChanged: 'Identity Cartesian coordinates colored by stratum.',
        encodingChanged: 'Position (X, Y) + categorical color hue.',
        infoPreserved: 'Cluster separation and within-cluster upward tilt.',
        moreVisible: 'Three distinct diagonal clusters shifted downward as baseline severity increases.',
        lostOrObscured: 'Explicit numeric regression slopes.',
        normalizationEffect: 'Unaggregated observation coordinates.'
      },
      grouped_boxplot: {
        stayedConstant: '30 patient recovery scores across 3 severity strata.',
        transformationChanged: 'Marginal projection onto Y (Recovery Score) grouped by Severity, ignoring Dosage X.',
        encodingChanged: '3 vertical boxplots.',
        infoPreserved: 'Baseline differences in recovery score across Mild, Moderate, and Severe cohorts.',
        moreVisible: 'Why baseline severity acts as a confounder on recovery score.',
        lostOrObscured: 'Positive effect of Dosage X within each stratum.',
        normalizationEffect: 'Collapses continuous predictor X.'
      }
    }
  },
  {
    id: 'numeric_multivar',
    number: 8,
    title: '8. Multiple Numerical Variables (Multivariate Unity)',
    presetId: 'multivariate_air_quality',
    overrideMapping: { x: 'temp_c', y: 'ozone_ppb', color: 'zone', size: 'pm25_ugm3' },
    dataSignature: '5 correlated quantitative variables across N = 30 monitoring records.',
    sharedInvariant: '30 × 5 quantitative data matrix X and its 5×5 Pearson correlation matrix R.',
    defaultViews: ['correlogram', 'parallel_coordinates', 'splom_matrix', 'bubble_plot', 'matrix_heatmap'],
    comparisonMatrix: {
      correlogram: {
        stayedConstant: '5×5 pairwise Pearson correlation matrix R = (1/(n-1)) ZᵀZ.',
        transformationChanged: 'Standardizes all 5 variables and collapses N = 30 rows into p(p-1)/2 = 10 pairwise correlation coefficients r_{jk}.',
        encodingChanged: 'p×p grid with diverging color luminance + proportional circle area + numeric r_{jk} label.',
        infoPreserved: 'Linear association strength and sign across all variable pairs simultaneously.',
        moreVisible: 'Strong positive Temp–Ozone correlation vs negative Wind–PM2.5 correlation at a glance.',
        lostOrObscured: 'Individual observation records, outliers, and nonlinear curvature.',
        normalizationEffect: 'Dimensionless correlation scale bounded strictly in [-1, +1].'
      },
      parallel_coordinates: {
        stayedConstant: 'All 30 × 5 multivariate observation vectors.',
        transformationChanged: 'Min-Max normalization of each column j to [0, 1] mapped onto 5 parallel vertical axes.',
        encodingChanged: 'Each observation row becomes a continuous polyline connecting 5 vertical axes.',
        infoPreserved: 'Complete 5-dimensional profile of every monitoring station.',
        moreVisible: 'Multi-variable clusters (Urban Core vs Coastal) and inverse crossings between adjacent axes.',
        lostOrObscured: 'Non-adjacent pairwise relationships depend on axis ordering.',
        normalizationEffect: 'Normalizes each vertical axis independently to [min_j, max_j].'
      },
      splom_matrix: {
        stayedConstant: 'All pairwise 2D projections (X_j, X_k) for the top quantitative variables.',
        transformationChanged: 'Orthogonal 2D Cartesian projections on off-diagonal cells + 1D histograms on diagonal.',
        encodingChanged: 'Grid of miniature scatterplots.',
        infoPreserved: 'Individual points, bivariate outliers, and nonlinear shapes across all pairs.',
        moreVisible: 'Whether high correlations in the correlogram are genuinely linear or driven by outliers.',
        lostOrObscured: 'Compact screen footprint when p > 6.',
        normalizationEffect: 'Preserves original variable scales in each cell.'
      },
      bubble_plot: {
        stayedConstant: '30 observations across 4 selected variables (Temp, Ozone, PM2.5, Zone).',
        transformationChanged: 'Maps 3rd quantitative variable (PM2.5) to circle area r ∝ √PM2.5.',
        encodingChanged: '2D Cartesian position + Circle Area + Categorical Color.',
        infoPreserved: 'Exact X/Y coordinates plus coarse 3rd-variable magnitude.',
        moreVisible: 'Joint behavior of Temp, Ozone, and PM2.5 in a single coordinate frame.',
        lostOrObscured: '4th and 5th quantitative variables (Wind Speed, NO2).',
        normalizationEffect: 'Area scaling requires r ∝ √z so visual area is linear in z.'
      }
    }
  },
  {
    id: 'time_series',
    number: 9,
    title: '9. Time-Indexed Numerical Observations (Temporal Unity)',
    presetId: 'timeseries_seasonal_grid',
    overrideMapping: { x: 'year_month', y: 'demand_gwh', color: 'year_group' },
    dataSignature: '36 monthly electricity demand observations across 3 years (2023–2025).',
    sharedInvariant: 'Chronological series {y_t}_{t=1}^36 with summer/winter peaks and secular growth.',
    defaultViews: ['line_chart', 'seasonal_plot', 'calendar_heatmap', 'area_chart', 'lag_plot', 'acf_plot'],
    comparisonMatrix: {
      line_chart: {
        stayedConstant: 'All 36 chronological monthly observations y_t.',
        transformationChanged: 'Identity mapping along unfolded chronological time t = 1..36.',
        encodingChanged: 'Connected line segments encoding rate of change Δy/Δt via slope.',
        infoPreserved: 'Full chronological trajectory, secular trend, and repeating seasonal waves.',
        moreVisible: 'Multi-year continuity and overall trajectory from Jan 2023 to Dec 2025.',
        lostOrObscured: 'Exact month-by-month vertical alignment across different years.',
        normalizationEffect: 'Unfolded linear time coordinate.'
      },
      seasonal_plot: {
        stayedConstant: 'All 36 monthly observations.',
        transformationChanged: 'Modulo-12 time folding: t ↦ (Year_t, Month_t ∈ {Jan..Dec}).',
        encodingChanged: 'Superimposes 2023, 2024, and 2025 as 3 colored trajectories over a shared Jan–Dec axis.',
        infoPreserved: 'Exact monthly values plus direct year-over-year vertical differences.',
        moreVisible: 'July/August cooling peak (~585 GWh), April/October trough (~395 GWh), and consistent upward shift each year.',
        lostOrObscured: 'Continuous Dec→Jan transition across year boundaries.',
        normalizationEffect: 'Folds 36 time steps into 3 cycles of period s = 12.'
      },
      lag_plot: {
        stayedConstant: 'Adjacent pairs (y_{t-1}, y_t) for t = 2..36.',
        transformationChanged: 'Delay-coordinate embedding into 2D phase space (y_{t-1}, y_t).',
        encodingChanged: '2D scatterplot with y = x diagonal reference line.',
        infoPreserved: 'First-order autoregressive structure r_1.',
        moreVisible: 'Strong positive clustering along the diagonal confirming high lag-1 autocorrelation.',
        lostOrObscured: 'Explicit calendar timestamps.',
        normalizationEffect: 'Both axes share the exact same GWh measurement scale.'
      },
      acf_plot: {
        stayedConstant: 'Second-order autocovariance structure of {y_t}.',
        transformationChanged: 'Projects time series onto lag correlations r_k = ∑(y_t - ȳ)(y_{t-k} - ȳ) / ∑(y_t - ȳ)² for k = 1..15.',
        encodingChanged: 'Vertical correlation spikes from 0 with ±1.96/√T white-noise bounds.',
        infoPreserved: 'Periodic dependency structure across lags.',
        moreVisible: 'Significant positive peak at lag k = 12 months and negative trough at k = 6 months.',
        lostOrObscured: 'Original GWh level and raw time-domain values.',
        normalizationEffect: 'Normalized autocorrelation bounded in [-1, +1].'
      }
    }
  },
  {
    id: 'prob_distributions',
    number: 10,
    title: '10. Probability Distributions (Density vs CDF vs Quantile Function)',
    presetId: 'univariate_wafer_thickness',
    overrideMapping: { x: 'thickness_nm', y: '', color: '' },
    dataSignature: 'Three mathematically equivalent representations of a probability law: f(x), F(x) = ∫ f(t)dt, and F⁻¹(p).',
    sharedInvariant: 'Underlying probability measure P on R for n = 56 observations.',
    defaultViews: ['kde_density', 'ecdf_plot', 'normal_qq', 'histogram'],
    comparisonMatrix: {
      kde_density: {
        stayedConstant: 'Empirical probability law of the 56 observations.',
        transformationChanged: 'Differential view: local probability density f̂(x) = dF/dx.',
        encodingChanged: 'Height of curve encodes probability per unit nm.',
        infoPreserved: 'Local modes (peaks at ~52 nm and ~64 nm) and valley (~59 nm).',
        moreVisible: 'Where probability mass is most concentrated locally.',
        lostOrObscured: 'Cumulative tail probabilities require visually integrating area under the curve.',
        normalizationEffect: 'Total area under curve equals 1.0.'
      },
      ecdf_plot: {
        stayedConstant: 'Empirical probability law of the 56 observations.',
        transformationChanged: 'Integral view: cumulative probability F̂_n(x) = P(X ≤ x).',
        encodingChanged: 'Vertical height in [0, 1] directly reads cumulative probability at threshold x.',
        infoPreserved: 'All order statistics x_(1) ≤ ... ≤ x_(56) without smoothing bandwidth.',
        moreVisible: 'Direct reading of P(X ≤ x) on the Y axis and quantiles F⁻¹(p) on the X axis.',
        lostOrObscured: 'Modes appear as inflection points of maximum slope rather than peaks.',
        normalizationEffect: 'Monotonically non-decreasing from 0 to 1.'
      },
      normal_qq: {
        stayedConstant: 'All 56 sorted order statistics x_(i).',
        transformationChanged: 'Inverse CDF (Quantile) view: plots sample quantiles F̂⁻¹(p_i) against standard normal quantiles Φ⁻¹(p_i).',
        encodingChanged: '2D quantile-quantile coordinates + robust Q1–Q3 reference line.',
        infoPreserved: 'Exact order statistics relative to a Gaussian benchmark.',
        moreVisible: 'S-shaped bimodal departure from the straight Gaussian reference line.',
        lostOrObscured: 'Unnormalized frequency counts.',
        normalizationEffect: 'Horizontal axis is standardized normal z-score Φ⁻¹(p_i).'
      },
      histogram: {
        stayedConstant: 'All 56 observations.',
        transformationChanged: 'Piecewise-constant interval density approximation.',
        encodingChanged: 'Contiguous bars scaled to density.',
        infoPreserved: 'Coarse interval probability mass.',
        moreVisible: 'Direct step approximation to f(x).',
        lostOrObscured: 'Within-bin precision.',
        normalizationEffect: 'Sum of (bar height × bin width) = 1.0.'
      }
    }
  },
  {
    id: 'sampling_distributions',
    number: 11,
    title: '11. Sampling Distributions vs Empirical Data Distribution',
    presetId: 'univariate_wafer_thickness',
    overrideMapping: { x: 'thickness_nm', y: '', color: '' },
    dataSignature: 'Empirical observations x_1..x_n (spread s = 6.72 nm) vs Sampling Distribution of x̄ (spread SE = s/√n = 0.90 nm).',
    sharedInvariant: 'Sample mean x̄ = 57.99 nm across n = 56 observations.',
    defaultViews: ['histogram', 'point_interval', 'error_bars', 'ecdf_plot'],
    comparisonMatrix: {
      histogram: {
        stayedConstant: 'Sample mean x̄ = 57.99 nm.',
        transformationChanged: 'Displays empirical distribution of individual observations x_i (spread s = 6.72 nm).',
        encodingChanged: 'Contiguous frequency bars across [48.2, 72.1] nm.',
        infoPreserved: 'Bimodal distribution of individual silicon wafers.',
        moreVisible: 'Wide variability of individual units (range ~24 nm).',
        lostOrObscured: 'Precision of the sample mean estimator x̄.',
        normalizationEffect: 'Spread is sample SD s, which does NOT shrink as n → ∞.'
      },
      point_interval: {
        stayedConstant: 'Sample mean x̄ = 57.99 nm.',
        transformationChanged: 'Targets the Sampling Distribution of the Mean via x̄ ± t_{0.975, n-1} · (s/√n).',
        encodingChanged: 'Central dot at 57.99 nm + 95% confidence interval crossbar [56.19, 59.79] nm.',
        infoPreserved: 'Inferential uncertainty for the population mean parameter μ.',
        moreVisible: 'How tightly the sample mean is estimated (SE = 0.90 nm is √56 ≈ 7.48× narrower than s!).',
        lostOrObscured: 'Individual wafer bimodal spread.',
        normalizationEffect: 'Interval width scales as O(n^{-1/2}) by the Central Limit Theorem.'
      },
      error_bars: {
        stayedConstant: 'Group/cohort means and standard errors.',
        transformationChanged: 'Explicitly contrasts ±1 SD, ±1 SE, 95% CI, and 95% PI via the Interval Meaning selector.',
        encodingChanged: 'Point marker + vertical interval whiskers.',
        infoPreserved: 'Exact parametric interval bounds.',
        moreVisible: 'Direct visual ratio between SE (estimator uncertainty) and SD/PI (individual unit spread).',
        lostOrObscured: 'Full skewness/multimodality of raw data.',
        normalizationEffect: 'Always verify the caption to know whether bars represent SD, SE, 95% CI, or 95% PI.'
      }
    }
  },
  {
    id: 'uncertainty_estimates',
    number: 12,
    title: '12. Parameter Estimates & Uncertainty (SD vs SE vs 95% CI vs 95% PI)',
    presetId: 'uncertainty_meta_analysis',
    overrideMapping: { x: 'trial_center', y: 'point_estimate', color: 'region' },
    dataSignature: '8 clinical centers with Point Estimate, SE, 95% CI for Mean, and 95% Prediction Interval.',
    sharedInvariant: 'Center point estimates ŷ_k and sample sizes n_k across 8 centers.',
    defaultViews: ['point_interval', 'error_bars', 'interval_ribbon', 'dot_plot'],
    comparisonMatrix: {
      point_interval: {
        stayedConstant: 'All 8 clinical center point estimates (e.g., Boston -14.2 mmHg, Zurich -15.6 mmHg).',
        transformationChanged: 'Maps pre-computed 95% Confidence Intervals [ci95_low, ci95_high] for each center mean.',
        encodingChanged: 'Horizontal/vertical forest plot crossbars + zero-effect reference line.',
        infoPreserved: 'Both effect magnitude and estimation precision (narrower CI for larger sample size n_k).',
        moreVisible: 'How Tokyo (n = 310, SE = 1.4) has a much tighter 95% CI than Chicago (n = 64, SE = 3.1).',
        lostOrObscured: '95% Prediction Interval for an individual patient unless switched in Studio controls.',
        normalizationEffect: 'Measures parameter uncertainty around μ_k.'
      },
      error_bars: {
        stayedConstant: 'All 8 center point estimates.',
        transformationChanged: 'Allows toggling between 95% CI (mean parameter) and 95% PI (single future patient).',
        encodingChanged: 'Vertical interval whiskers with end caps.',
        infoPreserved: 'Exact upper and lower interval bounds.',
        moreVisible: '95% Prediction Intervals (e.g., [-39.0, +10.6] mmHg) are dramatically wider than 95% CIs ([-18.6, -9.8] mmHg) because they include individual patient variance σ².',
        lostOrObscured: 'Full continuous density.',
        normalizationEffect: 'PI width = √(SE² + s²) · t, whereas CI width = SE · t.'
      },
      interval_ribbon: {
        stayedConstant: 'Point estimates and nested 80% / 95% uncertainty bands.',
        transformationChanged: 'Connects ordered estimates with a shaded two-tier confidence/prediction envelope.',
        encodingChanged: 'Central trajectory line + translucent shaded polygon band.',
        infoPreserved: 'Continuous progression of uncertainty across ordered centers or horizons.',
        moreVisible: 'Fan expansion when uncertainty grows.',
        lostOrObscured: 'Discrete independence of unordered categories.',
        normalizationEffect: 'Visualizes nested confidence levels simultaneously.'
      }
    }
  },
  {
    id: 'model_relationships',
    number: 13,
    title: '13. Model Relationships (Linear vs Quadratic vs Nonparametric)',
    presetId: 'anscombe_2',
    overrideMapping: { x: 'explanatory_x', y: 'response_y', color: '' },
    dataSignature: "Anscombe's Quartet II (n = 11) where linear R² = 0.666 but quadratic R² = 1.000.",
    sharedInvariant: '11 paired coordinates with mean(X)=9.0, mean(Y)=7.50, linear slope=0.500.',
    defaultViews: ['scatter_ols', 'residual_fitted', 'scatter_plot'],
    comparisonMatrix: {
      scatter_ols: {
        stayedConstant: 'All 11 paired observations in Anscombe II.',
        transformationChanged: 'Projects exact quadratic parabola onto a misspecified straight line ŷ = 3.00 + 0.500x.',
        encodingChanged: 'Raw points + straight OLS line + 95% CI ribbon.',
        infoPreserved: 'Shows both the true smooth arch of the points and the rigid linear approximation.',
        moreVisible: 'Immediate visual proof that R² = 0.6665 and p = 0.0022 do NOT imply the relationship is linear!',
        lostOrObscured: 'Summary statistics alone completely miss the curvature.',
        normalizationEffect: 'Enable "Overlay Quadratic Fit" in Chart Studio to see the exact R² = 1.000 parabola.'
      },
      residual_fitted: {
        stayedConstant: 'All 11 observations.',
        transformationChanged: 'Subtracts the linear fit to isolate e_i = y_i - ŷ_i.',
        encodingChanged: 'Plots residuals e_i against fitted values ŷ_i.',
        infoPreserved: 'Exact deterministic quadratic functional form of the misspecification error.',
        moreVisible: 'Unmistakable inverted-U parabola in the residuals proving linear model misspecification.',
        lostOrObscured: 'Positive overall slope.',
        normalizationEffect: 'Magnifies vertical curvature by removing the 0.500x linear tilt.'
      }
    }
  },
  {
    id: 'model_diagnostics',
    number: 14,
    title: '14. Model Residuals & Influence Diagnostics',
    presetId: 'anscombe_3',
    overrideMapping: { x: 'explanatory_x', y: 'response_y', color: '' },
    dataSignature: 'Fitted values ŷ_i, raw residuals e_i, studentized residuals r_i, leverage h_i, and Cook’s D_i.',
    sharedInvariant: 'Algebraic OLS identities ∑ e_i = 0 and ∑ x_i e_i = 0 across n = 11 observations.',
    defaultViews: ['scatter_ols', 'residual_fitted', 'normal_qq'],
    comparisonMatrix: {
      scatter_ols: {
        stayedConstant: '10 perfectly co-linear points plus 1 contaminated outlier at (13.0, 12.74).',
        transformationChanged: 'Minimizes unweighted sum of squared vertical residuals ∑ e_i².',
        encodingChanged: 'Scatterplot + OLS line + red Cook’s D > 4/n halo on observation #3.',
        infoPreserved: 'Shows how a single outlier pulls the OLS slope from 0.345 to 0.4997.',
        moreVisible: 'The red influential halo on (13, 12.74) with Cook’s D = 1.42 > 4/11.',
        lostOrObscured: 'Without plotting, the summary table looks indistinguishable from Anscombe I.',
        normalizationEffect: 'Quadratic L2 loss gives extreme weight to large vertical deviations.'
      },
      residual_fitted: {
        stayedConstant: 'All 11 OLS residuals e_i.',
        transformationChanged: 'Maps vertical residual e_i against fitted value ŷ_i.',
        encodingChanged: 'Zero baseline + red highlight on Cook’s D > 4/n points.',
        infoPreserved: 'Shows 10 points along a tilted line of negative residuals and 1 massive positive outlier (+3.24).',
        moreVisible: 'How one outlier tilts the entire residual line for the remaining 10 clean observations.',
        lostOrObscured: 'Raw X coordinate.',
        normalizationEffect: 'Sum of residuals strictly equals 0.'
      },
      normal_qq: {
        stayedConstant: 'Distribution of response/residual values.',
        transformationChanged: 'Maps ordered quantiles against theoretical Gaussian quantiles Φ⁻¹(p_i).',
        encodingChanged: 'Blom Q–Q plot with Q1–Q3 reference line.',
        infoPreserved: 'Tail departure caused by the contaminated observation.',
        moreVisible: 'Single extreme point breaking sharply away from the normal line at the upper right.',
        lostOrObscured: 'Bivariate X–Y pairing.',
        normalizationEffect: 'Standardizes horizontal scale to Z-scores.'
      }
    }
  },
  {
    id: 'spatial_geo',
    number: 15,
    title: '15. Geographic Observations (Coordinates vs Regional Rates vs Ranked Bars)',
    presetId: 'geographic_hydrology_stations',
    overrideMapping: { x: 'longitude', y: 'latitude', size: 'withdrawal_mld', color: 'drought_stress_rate' },
    dataSignature: '16 North American hydrological monitoring stations with Lat/Lon, volume (ML/d), and drought rate (%).',
    sharedInvariant: '16 station records spanning 25.8°N to 47.6°N and 122.3°W to 71.1°W.',
    defaultViews: ['geo_bubble_map', 'geo_point_map', 'choropleth_map', 'bar_horizontal'],
    comparisonMatrix: {
      geo_bubble_map: {
        stayedConstant: 'All 16 station coordinates, withdrawal volumes, and drought stress rates.',
        transformationChanged: 'Projects (Lon, Lat) to 2D spatial frame + scales radius r ∝ √withdrawal_mld.',
        encodingChanged: 'Spatial (X, Y) + Proportional Circle Area + Color Hue.',
        infoPreserved: 'Geographic location plus extensive volume (ML/d) without polygon-area distortion.',
        moreVisible: 'High withdrawal volumes in Phoenix (680 ML/d) and Las Vegas (590 ML/d) in the arid Southwest.',
        lostOrObscured: 'Exact numerical rank order between close stations.',
        normalizationEffect: 'Extensive counts/totals (ML/d) are properly encoded by proportional symbol area.'
      },
      choropleth_map: {
        stayedConstant: '16 regional drought stress rates (%).',
        transformationChanged: 'Maps intensive rate variable (drought_stress_rate %) onto regional cells.',
        encodingChanged: '2D spatial grid + calibrated sequential color luminance.',
        infoPreserved: 'Regional rate intensity (e.g., Las Vegas 91.2%, Phoenix 86.5% vs Seattle 14.5%).',
        moreVisible: 'Spatial gradient of drought stress rate from Northwest/Northeast to Southwest.',
        lostOrObscured: 'Extensive total water withdrawal volume.',
        normalizationEffect: 'CRITICAL: Choropleths must encode normalized rates/densities, never raw unnormalized totals.'
      },
      bar_horizontal: {
        stayedConstant: 'All 16 station values.',
        transformationChanged: 'Drops spatial (Lon, Lat) coordinates and sorts stations by magnitude.',
        encodingChanged: 'Aligned horizontal bars from x = 0 (Perceptual Rank 1).',
        infoPreserved: 'Exact magnitude comparison and rank order across all 16 stations.',
        moreVisible: 'Exact rank hierarchy (which is much easier to read on a bar chart than from map colors).',
        lostOrObscured: 'Geographic proximity and spatial clustering.',
        normalizationEffect: 'Common zero-anchored linear scale.'
      }
    }
  },
  {
    id: 'hierarchical_flow',
    number: 16,
    title: '16. Hierarchical & Relational Data (Trees, Flows, & Partitions)',
    presetId: 'network_energy_flows',
    overrideMapping: { x: 'source_node', y: 'flow_twh', color: 'target_node' },
    dataSignature: 'Directed source-target flow edges conserving total energy volume (TWh).',
    sharedInvariant: 'Total flow volume ∑ f_{ij} = 419.5 TWh across 12 directed edges.',
    defaultViews: ['sankey_diagram', 'chord_diagram', 'network_diagram', 'bivariate_heatmap', 'bar_stacked'],
    comparisonMatrix: {
      sankey_diagram: {
        stayedConstant: 'All 12 directed energy flows f_{ij} summing to 419.5 TWh.',
        transformationChanged: 'Bipartite flow layout enforcing conservation of mass: ∑_j f_{ij} = Outflow(i) and ∑_i f_{ij} = Inflow(j).',
        encodingChanged: 'Left/right node block heights + proportional Bezier ribbon thickness.',
        infoPreserved: 'Exact source totals, target sector totals, and every directed coupling.',
        moreVisible: 'Dominant pathways (e.g., Natural Gas → Industrial 88 TWh, Solar → Residential 54 TWh).',
        lostOrObscured: 'Cyclic feedback loops.',
        normalizationEffect: 'Ribbon thickness is strictly proportional to TWh flow.'
      },
      chord_diagram: {
        stayedConstant: 'All 12 directed flows (419.5 TWh).',
        transformationChanged: 'Maps nodes onto a circular perimeter with angular arcs proportional to total node volume.',
        encodingChanged: 'Circular node arcs + internal quadratic Bezier ribbons.',
        infoPreserved: 'Reciprocal and cross-sector flow topology.',
        moreVisible: 'Overall network interconnectivity in a compact circular footprint.',
        lostOrObscured: 'Left-to-right directional hierarchy is harder to scan than a Sankey diagram.',
        normalizationEffect: 'Total circumference encodes 2 × 419.5 TWh (source + target endpoints).'
      },
      network_diagram: {
        stayedConstant: '8 nodes (4 generation sources, 4 demand sectors) and 12 weighted edges.',
        transformationChanged: 'Circular/force-directed graph embedding.',
        encodingChanged: 'Node circles + weighted connecting line segments.',
        infoPreserved: 'Bipartite adjacency topology (which sources feed which sectors).',
        moreVisible: 'Structural connectivity and node degree.',
        lostOrObscured: 'Additive conservation of TWh sums is less explicit than in a Sankey diagram.',
        normalizationEffect: 'Edge stroke width scales with flow_twh.'
      },
      bivariate_heatmap: {
        stayedConstant: '4×4 Source × Sector flow matrix (419.5 TWh).',
        transformationChanged: 'Tabulates flows into an orthogonal 2D adjacency matrix.',
        encodingChanged: 'Matrix cell color luminance + exact numeric TWh readout.',
        infoPreserved: 'Every exact flow value with zero ribbon crossings.',
        moreVisible: 'Exact numeric comparison of any (Source, Sector) cell without visual occlusion.',
        lostOrObscured: 'Visual flow continuity.',
        normalizationEffect: 'Linear color ramp from 0 to max cell flow (88 TWh).'
      }
    }
  }
];

/**
 * Structured Ontology of Pairwise Chart Relationships (Part 10.8)
 */
export const SIMILARITY_ONTOLOGY = [
  {
    fromChart: 'histogram',
    toChart: 'kde_density',
    relationshipType: 'Same underlying data',
    sharedSignature: '1 continuous quantitative variable',
    sharedTarget: 'Probability density f(x)',
    transformationDiff: 'Replaces discontinuous rectangular interval bins with smooth Gaussian kernel convolution.',
    encodingDiff: 'Contiguous vertical bars → continuous smooth curve + rug ticks.',
    normalizationDiff: 'Both integrate to 1.0 when histogram is on probability density scale.',
    infoPreservation: 'Preserves modality and spread; removes bin-edge sensitivity but introduces bandwidth sensitivity.',
    caution: 'KDE can bleed density below physical minimum (e.g., < 0) and oversmooth small samples (n < 30).'
  },
  {
    fromChart: 'histogram',
    toChart: 'ecdf_plot',
    relationshipType: 'Alternative view',
    sharedSignature: '1 quantitative variable',
    sharedTarget: 'Distribution law (Density f(x) vs Cumulative F(x))',
    transformationDiff: 'Integrates density into cumulative step function F̂_n(t) = (1/n) ∑ I(x_i ≤ t).',
    encodingDiff: 'Bar heights → right-continuous step height in [0, 1].',
    normalizationDiff: 'Y axis changes from count/density to cumulative probability [0, 1].',
    infoPreservation: 'ECDF is 100% lossless and parameter-free (no bin width required).',
    caution: 'Modes appear as steep slopes on the ECDF rather than visual peaks.'
  },
  {
    fromChart: 'boxplot',
    toChart: 'violin_plot',
    relationshipType: 'Same analytical question',
    sharedSignature: '1 quantitative variable (+ optional group)',
    sharedTarget: 'Location, spread, and distributional shape',
    transformationDiff: 'Augments the 5 Type-7 quantiles with a mirrored kernel density estimate.',
    encodingDiff: 'Rectangular IQR box → symmetric density silhouette enclosing the boxplot spine.',
    normalizationDiff: 'Violin width is normalized to local density.',
    infoPreservation: 'Recovers bimodality and clustering that a standalone boxplot completely conceals.',
    caution: 'Avoid standalone violins when group sample size n_k < 20; use Strip/Beeswarm instead.'
  },
  {
    fromChart: 'grouped_boxplot',
    toChart: 'point_interval',
    relationshipType: 'Different statistical target',
    sharedSignature: '1 categorical factor + 1 quantitative outcome',
    sharedTarget: 'Empirical data distribution (Boxplot) vs Population Mean Parameter μ_k (Point + 95% CI)',
    transformationDiff: 'Replaces quartiles (Q1, Q2, Q3) with sample mean ȳ_k and Student-t confidence interval ȳ_k ± t · SE.',
    encodingDiff: 'Five-number box + raw points → central dot + 95% CI crossbar.',
    normalizationDiff: 'CI width shrinks by 1/√n_k as sample size grows, whereas IQR converges to population IQR.',
    infoPreservation: 'Highlights parameter estimation precision but conceals individual observation spread.',
    caution: 'Never confuse a 95% CI crossbar for the mean with the spread of individual observations!'
  },
  {
    fromChart: 'bar_stacked',
    toChart: 'bar_stacked_100',
    relationshipType: 'Related visual encoding',
    sharedSignature: '2 categorical variables (contingency table)',
    sharedTarget: 'Joint counts n_{ij} vs Conditional proportions P(Y=j | X=i)',
    transformationDiff: 'Divides each segment in column i by marginal row sum n_{i•}.',
    encodingDiff: 'Unequal total column heights → uniform 100% column heights.',
    normalizationDiff: 'Changes denominator from 1 observation to marginal group size n_{i•}.',
    infoPreservation: 'Clarifies relative within-group proportions while hiding marginal sample size differences.',
    caution: 'Always print group sample sizes (n_i) on 100% stacked bars so small groups are not over-interpreted.'
  },
  {
    fromChart: 'grouped_boxplot',
    toChart: 'dynamite_plot_prohibited',
    relationshipType: 'Common misuse',
    sharedSignature: '1 categorical group + 1 continuous variable',
    sharedTarget: 'Group comparison',
    transformationDiff: 'Collapses full distribution into a solid bar at ȳ_k with a one-sided SE whisker.',
    encodingDiff: 'Box + raw points → solid bar from zero.',
    normalizationDiff: 'Falsely implies data occupy the bar volume from 0 to ȳ_k.',
    infoPreservation: 'Destroys visibility of sample size, skewness, bimodality, and outliers.',
    caution: 'Dynamite plots are strictly prohibited in DataSense standards; always use Grouped Boxplot + Points or Violin Plot.'
  }
];

export function getUnityComparisonDetails(groupId, chartType) {
  const grp = UNITY_GROUPS.find(g => g.id === groupId) || UNITY_GROUPS[0];
  if (grp.comparisonMatrix && grp.comparisonMatrix[chartType]) {
    return grp.comparisonMatrix[chartType];
  }
  return {
    stayedConstant: grp.sharedInvariant,
    transformationChanged: `Projects "${grp.dataSignature}" through the ${chartType} statistical operator.`,
    encodingChanged: `Maps transformed quantities to ${chartType} geometric marks and coordinate axes.`,
    infoPreserved: `Underlying observational records and invariant summary moments (${grp.sharedInvariant}).`,
    moreVisible: `Structural patterns emphasized by ${chartType} (see Atlas entry for full mathematical breakdown).`,
    lostOrObscured: `Features compressed by aggregation or smoothing; compare side-by-side with companion views in this Unity Group.`,
    normalizationEffect: `Verify whether axis units represent raw counts, conditional proportions, or probability densities.`
  };
}
