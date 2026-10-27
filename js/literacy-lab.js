/**
 * VisualGrammar — Chart Literacy Lab: 15 Misleading Visualization Experiments & 7 Active Challenges (literacy-lab.js)
 * Conforms strictly to Part 12 of the VisualGrammar specification.
 */

export const READING_PROTOCOL_STEPS = [
  {
    step: 1,
    title: '1. Read Title, Scope, & Provenance',
    question: 'What observational units are measured, when/where were they collected, and is the dataset empirical or synthetic?',
    checklist: ['Identify the unit of analysis (1 row = 1 patient, 1 wafer, 1 year, or 1 station).', 'Check total sample size (n) and missing exclusions.', 'Verify data provenance and whether the study is observational or randomized.']
  },
  {
    step: 2,
    title: '2. Inspect Quantities, Units, Scales, & Baselines',
    question: 'What are the exact physical units, scale transformations (linear vs log), and axis baselines?',
    checklist: ['Check whether bar/area charts start at zero (y = 0).', 'Verify whether y-axis represents raw count, percentage (%), rate, or probability density.', 'Check if either axis uses a logarithmic transformation.']
  },
  {
    step: 3,
    title: '3. Decode Visual Marks & Aesthetic Channels',
    question: 'How are variables mapped to position, length, area, color, and shape?',
    checklist: ['Distinguish individual observation marks (scatter/strip) from aggregate summaries (bars/boxes).', 'Verify that bubble sizes scale by Area (r ∝ √value) rather than Radius.', 'Decode color legends and check group sample sizes (n_g).']
  },
  {
    step: 4,
    title: '4. Read Reference Lines, Denominators, & Uncertainty',
    question: 'What benchmarks or uncertainty intervals frame the data?',
    checklist: ['Identify reference lines (e = 0, y = x, mean crosshairs, Bartlett bounds).', 'Verify the exact uncertainty measure: SD (data spread) vs SE vs 95% CI (mean precision) vs 95% PI.', 'Confirm the denominator used for any proportion or rate.']
  },
  {
    step: 5,
    title: '5. Synthesize Patterns, Caveats, & Limitations',
    question: 'What does the evidence support, and what remains uncertain or obscured?',
    checklist: ['Check for multimodality, curvature, leverage points, or confounding strata (Simpson’s Paradox).', 'Distinguish descriptive association from causal claims.', 'Cross-check with an alternative view in Known Visualization Unity.']
  }
];

/**
 * 15 Interactive Misleading Visualization Experiments (Part 12.2)
 * Every experiment renders live on a dual-mode canvas (Misleading State vs Corrected State).
 */
export const MISLEADING_EXPERIMENTS = [
  {
    id: 'exp_truncated_bar',
    number: 1,
    title: '1. Truncated Bar-Chart Axis Baseline',
    category: 'Scale & Baseline Distortion',
    misleadingSummary: 'Starts the vertical bar axis at y = 150 kPa instead of 0 kPa, making a 1.38× pressure difference look like a 6.5× difference.',
    correctedSummary: 'Restores the mandatory y = 0 baseline so bar heights are strictly proportional to numerical values (or uses a Cleveland Dot Plot).',
    mathExplanation: 'For values y_1 = 160 and y_2 = 220 (true ratio 1.375:1), truncating at b = 150 produces visual bar heights (160-150)=10 and (220-150)=70—a 7.0:1 visual ratio (Lie Factor = 5.09).',
    tradeoffNote: 'While scatterplots and line charts may narrow their y-axis range to inspect fine fluctuations, bar charts encode magnitude via solid length from zero and must never be truncated.',
    data: [
      { label: 'Gas Dist.', val: 159.9 },
      { label: 'Water Works', val: 230.9 },
      { label: 'District Steam', val: 301.2 }
    ],
    unit: 'kPa',
    misleadingConfig: { baseline: 145, mode: 'bar_truncated' },
    correctedConfig: { baseline: 0, mode: 'bar_zero' }
  },
  {
    id: 'exp_incorrect_normalization',
    number: 2,
    title: '2. Incorrect Normalization (Comparing Raw Counts Across Unequal Cohorts)',
    category: 'Denominator & Normalization Errors',
    misleadingSummary: 'Compares raw counts of Complete Remission across cohorts of unequal sample sizes (n = 200 vs n = 20), making a 20% rate look larger than a 65% rate.',
    correctedSummary: 'Normalizes each cohort by its explicit sample size denominator n_i to compare conditional remission rates (%) alongside n_i labels.',
    mathExplanation: 'Cohort A has 40/200 (20.0%) remissions; Cohort B has 13/20 (65.0%) remissions. Plotting raw counts (40 vs 13) reverses the true conditional probability P(Remission | Cohort).',
    tradeoffNote: 'Always display both the normalized rate (%) and the explicit denominator (n_i) so neither relative efficacy nor sample size is hidden.',
    data: [
      { label: 'Cohort A (n=200)', rawCount: 40, denom: 200, pct: 20.0 },
      { label: 'Cohort B (n=20)', rawCount: 13, denom: 20, pct: 65.0 }
    ],
    unit: '%',
    misleadingConfig: { mode: 'raw_unequal_counts' },
    correctedConfig: { mode: 'normalized_rates' }
  },
  {
    id: 'exp_aspect_ratio',
    number: 3,
    title: '3. Extreme Aspect-Ratio Banking Distortion',
    category: 'Perceptual & Coordinate Distortion',
    misleadingSummary: 'Compresses the vertical scale into a flat ribbon so a steady +57 ppm atmospheric CO2 rise appears nearly horizontal.',
    correctedSummary: 'Banks the trajectory slope toward ~45° (Cleveland et al., 1988) with clear axis bounds so rate-of-change acceleration is legible.',
    mathExplanation: 'Visual slope angle θ = arctan((H/W) · (Δy/Δx)). Setting H/W too small forces θ → 0°; setting H/W too large forces θ → 90°.',
    tradeoffNote: 'Unlike bar charts, line charts do not require a zero baseline when zero is physically non-informative (e.g., CO2 around 370–427 ppm), provided the axis range is clearly labeled and banked near 45°.',
    data: [
      { x: 2000, y: 369.7 }, { x: 2005, y: 379.9 }, { x: 2010, y: 389.9 },
      { x: 2015, y: 400.8 }, { x: 2020, y: 414.2 }, { x: 2025, y: 427.1 }
    ],
    unit: 'ppm',
    misleadingConfig: { mode: 'flat_aspect' },
    correctedConfig: { mode: 'banked_aspect' }
  },
  {
    id: 'exp_counts_vs_pct',
    number: 4,
    title: '4. Confusing Joint Percentages with Within-Group Percentages',
    category: 'Denominator & Normalization Errors',
    misleadingSummary: 'Divides subgroup counts by the Grand Total (N = 60) while labeling the chart as "Within-Regimen Success Rate".',
    correctedSummary: 'Explicitly distinguishes Joint Share n_{ij}/N from Row-Conditional Share n_{ij}/n_{i•} using a 100% Stacked Bar Chart.',
    mathExplanation: 'In Combination Protocol (n_3 = 16), 9 patients achieved Complete Remission. Joint share is 9/60 = 15.0%, whereas within-regimen rate is 9/16 = 56.25%.',
    tradeoffNote: 'Both denominators are valid mathematical quantities, but their labels and analytical meanings must never be swapped.',
    data: [
      { label: 'Standard (n=22)', count: 4, rowPct: 18.2, jointPct: 6.7 },
      { label: 'Biologic (n=22)', count: 8, rowPct: 36.4, jointPct: 13.3 },
      { label: 'Combo (n=16)', count: 9, rowPct: 56.3, jointPct: 15.0 }
    ],
    unit: '%',
    misleadingConfig: { mode: 'joint_labeled_as_row' },
    correctedConfig: { mode: 'true_row_conditional' }
  },
  {
    id: 'exp_unequal_bins',
    number: 5,
    title: '5. Unequal Histogram Bins Plotted as Raw Counts Instead of Density',
    category: 'Scale & Baseline Distortion',
    misleadingSummary: 'Merges three upper intervals into one wide bin [60, 75] and plots raw count on the y-axis, creating a towering artificial spike in the tail.',
    correctedSummary: 'Scales the vertical axis to Probability Density f̂_k = n_k / (n · w_k) so bar AREA represents relative frequency.',
    mathExplanation: 'When bin width w_4 = 15 is 3× wider than w_1 = 5, plotting raw count n_4 inflates bar height by 3× relative to density.',
    tradeoffNote: 'Equal-width bins allow both Count and Density axes to share the same shape; variable-width bins strictly require a Density y-axis.',
    data: [
      { x0: 45, x1: 50, w: 5, count: 8 },
      { x0: 50, x1: 55, w: 5, count: 18 },
      { x0: 55, x1: 60, w: 5, count: 14 },
      { x0: 60, x1: 75, w: 15, count: 24 }
    ],
    unit: 'density',
    misleadingConfig: { mode: 'unequal_bins_count' },
    correctedConfig: { mode: 'unequal_bins_density' }
  },
  {
    id: 'exp_overplotting',
    number: 6,
    title: '6. Severe Overplotting Concealing High-Density Clusters',
    category: 'Aggregation & Occlusion',
    misleadingSummary: 'Renders 80 coincident observations as large opaque circles (α = 1.0), making a dense cluster of 45 points look identical to 3 points.',
    correctedSummary: 'Applies alpha blending (α = 0.35) + jitter/2D density contours so observation concentration is visually proportional to sample density.',
    mathExplanation: 'With α = 1.0, pixel luminance saturates at k = 1 observation; with α < 1, transmitted intensity (1 - α)^k decays monotonically with overlap count k.',
    tradeoffNote: 'For moderate samples, alpha blending + jitter works well; for n > 1,000, transition to 2D Hexbin density.',
    data: [],
    unit: 'pts',
    misleadingConfig: { mode: 'opaque_overplot' },
    correctedConfig: { mode: 'alpha_resolved' }
  },
  {
    id: 'exp_rainbow_scale',
    number: 7,
    title: '7. Misleading Non-Monotonic Rainbow Color Scale',
    category: 'Visual Channels & Perception',
    misleadingSummary: 'Maps a continuous sequential variable to an unordered rainbow spectrum where bright yellow sits in the middle, creating false visual cliffs.',
    correctedSummary: 'Uses a perceptually uniform monotonic luminance ramp (or diverging scale anchored at zero when signed).',
    mathExplanation: 'Human luminance perception L* peaks in yellow (~95) and drops in blue (~32) and red (~53), so a rainbow scale is non-monotonic in perceived magnitude.',
    tradeoffNote: 'Reserve multi-hue qualitative palettes for nominal categories and monotonic luminance ramps for continuous quantities.',
    data: [12, 24, 38, 52, 67, 81, 95],
    unit: 'index',
    misleadingConfig: { mode: 'rainbow_nonmonotonic' },
    correctedConfig: { mode: 'monotonic_luminance' }
  },
  {
    id: 'exp_dynamite_plot',
    number: 8,
    title: '8. Inappropriate Chart Selection ("Dynamite" Bar Plot of Continuous Means)',
    category: 'Aggregation & Occlusion',
    misleadingSummary: 'Uses solid bars for two treatment groups that share the exact same mean (50.0), completely hiding that Group B is strongly bimodal with extreme values.',
    correctedSummary: 'Replaces the bar chart with a Grouped Boxplot + Jittered Strip Plot (or Violin Plot), immediately exposing Group B’s bimodal split.',
    mathExplanation: 'Group A is unimodal N(50, 4²); Group B is a 50/50 bimodal mixture at 34 and 66 (mean = 50.0). A dynamite bar chart renders both groups identically.',
    tradeoffNote: 'Prohibited by VISUALIZATION_STANDARDS.md Section B.4.',
    data: {
      groupA: [45, 47, 48, 49, 50, 50, 51, 52, 53, 55],
      groupB: [32, 33, 34, 35, 36, 64, 65, 66, 67, 68]
    },
    unit: 'score',
    misleadingConfig: { mode: 'dynamite_bars' },
    correctedConfig: { mode: 'distribution_strip_box' }
  },
  {
    id: 'exp_unlabeled_uncertainty',
    number: 9,
    title: '9. Unlabeled Uncertainty (Conflating ±1 SE with 95% CI and ±1 SD)',
    category: 'Uncertainty Misrepresentation',
    misleadingSummary: 'Draws tiny ±1 SE whiskers labeled simply "Error Bars", leading readers to believe individual patient outcomes vary by only ±2 units.',
    correctedSummary: 'Explicitly labels and contrasts ±1 SE (2.1), 95% CI for Mean (±4.1), and ±1 SD of individual outcomes (±24.8).',
    mathExplanation: 'For n = 140 and s = 24.8, SE = s/√140 = 2.10. The individual spread s is √140 ≈ 11.8× wider than SE.',
    tradeoffNote: 'Every interval graphic in DataSense must explicitly state whether bars represent SD, SE, 95% CI, or 95% PI.',
    data: { est: 18.4, se: 2.1, ci: 4.12, sd: 24.8, n: 140 },
    unit: '%',
    misleadingConfig: { mode: 'unlabeled_se' },
    correctedConfig: { mode: 'explicit_multi_tier' }
  },
  {
    id: 'exp_simpsons_aggregation',
    number: 10,
    title: '10. Misleading Pooled Aggregation (Simpson’s Paradox)',
    category: 'Aggregation & Occlusion',
    misleadingSummary: 'Plots a single pooled regression line across all patients (r = -0.58), suggesting higher dosage worsens recovery.',
    correctedSummary: 'Stratifies and colors by Baseline Severity (Mild, Moderate, Severe), revealing a strong positive dose-response (r = +0.99) in every stratum.',
    mathExplanation: 'Severe patients receive higher doses (x̄ = 81 mg) and have lower baseline recovery (ȳ = 42), confounding the unstratified marginal covariance.',
    tradeoffNote: 'Always inspect conditioning variables via color or Small Multiples before interpreting observational slopes.',
    data: [],
    unit: 'pts',
    misleadingConfig: { mode: 'pooled_simpson' },
    correctedConfig: { mode: 'stratified_simpson' }
  },
  {
    id: 'exp_ordinal_sorting',
    number: 11,
    title: '11. Alphabetical Sorting of Ordinal & Cyclic Scales',
    category: 'Ordering & Sequence Errors',
    misleadingSummary: 'Sorts ordinal clinical severity alphabetically (Critical, High, Low, Moderate), creating a jagged sawtooth pattern.',
    correctedSummary: 'Preserves intrinsic ordinal scale rank (Low → Moderate → High → Critical) so monotonic progression is clear.',
    mathExplanation: 'Lexicographical string order is invariant to semantic scale rank and destroys monotonic trend assessment.',
    tradeoffNote: 'Sort nominal categories by magnitude, but always sort ordinal and cyclic variables by their intrinsic rank.',
    data: [
      { label: 'Low', val: 8 },
      { label: 'Moderate', val: 14 },
      { label: 'High', val: 11 },
      { label: 'Critical', val: 7 }
    ],
    unit: 'cases',
    misleadingConfig: { mode: 'alphabetical_ordinal' },
    correctedConfig: { mode: 'natural_ordinal' }
  },
  {
    id: 'exp_unordered_line',
    number: 12,
    title: '12. Improper Line Connection Across Unordered Nominal Categories',
    category: 'Ordering & Sequence Errors',
    misleadingSummary: 'Connects discrete hospital departments (Cardiology → Orthopedics → Respiratory → Neurology) with a continuous trend line.',
    correctedSummary: 'Uses discrete zero-anchored bars or dots without connecting lines because department order is arbitrary.',
    mathExplanation: 'A line segment between x_k and x_{k+1} implies a well-defined derivative Δy/Δx and continuous intermediate values, neither of which exists between nominal classes.',
    tradeoffNote: 'Reserve line charts strictly for temporal, sequential, or ordered numeric domains.',
    data: [
      { label: 'Cardiology', val: 10 },
      { label: 'Orthopedics', val: 12 },
      { label: 'Respiratory', val: 8 },
      { label: 'Neurology', val: 5 },
      { label: 'Pediatrics', val: 5 }
    ],
    unit: 'admissions',
    misleadingConfig: { mode: 'nominal_connected_line' },
    correctedConfig: { mode: 'nominal_discrete_bars' }
  },
  {
    id: 'exp_geo_count_vs_rate',
    number: 13,
    title: '13. Geographic Count-versus-Rate Confusion',
    category: 'Denominator & Normalization Errors',
    misleadingSummary: 'Shades regional tiles by raw water withdrawal volume (ML/day), making populous metropolitan regions look like the most drought-stressed.',
    correctedSummary: 'Shades regions by normalized Drought Stress Rate (%) or uses area-scaled bubbles alongside rate coloring.',
    mathExplanation: 'Extensive totals Y_i scale with population P_i; intensive rates r_i = Y_i / P_i isolate per-unit severity.',
    tradeoffNote: 'Choropleth color shading should always encode intensive rates or densities rather than extensive population totals.',
    data: [
      { label: 'US-NY (Pop 12.4M)', raw: 3790, rate: 24.5 },
      { label: 'US-IL (Pop 8.9M)', raw: 2740, rate: 19.6 },
      { label: 'US-NV (Pop 2.3M)', raw: 840, rate: 88.1 },
      { label: 'US-AZ (Pop 5.0M)', raw: 1890, rate: 84.5 }
    ],
    unit: '% stress',
    misleadingConfig: { mode: 'geo_raw_counts' },
    correctedConfig: { mode: 'geo_normalized_rates' }
  },
  {
    id: 'exp_bubble_radius',
    number: 14,
    title: '14. Distorted Bubble-Size Encoding (Radius vs Area Scaling)',
    category: 'Scale & Baseline Distortion',
    misleadingSummary: 'Scales circle radius r directly proportional to value (10 vs 30), making a 3× numerical value occupy 9× the ink area.',
    correctedSummary: 'Scales circle area A = πr² proportional to value (r ∝ √value), so the 3× value occupies exactly 3× the visual area.',
    mathExplanation: 'If r_2 / r_1 = V_2 / V_1 = 3, then Area_2 / Area_1 = (r_2 / r_1)² = 9. Correct scaling sets r_2 / r_1 = √3 ≈ 1.732.',
    tradeoffNote: 'Enforced across all Bubble and Geographic Bubble plots in VisualGrammar.',
    data: [
      { label: 'Station A (100 ML/d)', val: 100 },
      { label: 'Station B (300 ML/d)', val: 300 }
    ],
    unit: 'ML/day',
    misleadingConfig: { mode: 'bubble_radius_scaled' },
    correctedConfig: { mode: 'bubble_area_scaled' }
  },
  {
    id: 'exp_missing_context',
    number: 15,
    title: '15. Cherry-Picked Time Window & Omitted Seasonal Context',
    category: 'Contextual Framing',
    misleadingSummary: 'Isolates a 3-month spring dip (Jan → Apr) to claim regional electricity demand is collapsing permanently.',
    correctedSummary: 'Displays the full 36-month multi-year seasonal cycle with annual overlays, showing that April is the normal seasonal trough every year while year-over-year demand is rising.',
    mathExplanation: 'Evaluating y_{t} - y_{t-3} without seasonal adjustment S_t conflates predictable periodic phase with secular trend T_t.',
    tradeoffNote: 'Always provide full cycle context (at least 2–3 complete periods) when evaluating seasonal time series.',
    data: [412, 388, 354, 330, 362, 428, 476, 468, 392, 346, 374, 418, 424, 396, 361, 338, 371, 441, 492, 481],
    unit: 'GWh',
    misleadingConfig: { mode: 'cherry_picked_window' },
    correctedConfig: { mode: 'full_seasonal_context' }
  }
];

/**
 * 7 Interactive Chart Literacy Challenges (Part 12.3)
 * Rule-based grading with specific mathematical feedback.
 */
export const LITERACY_CHALLENGES = [
  {
    id: 'chal_1_baseline',
    number: 1,
    title: 'Challenge 1: Repair a Misleading Bar Baseline',
    scenario: 'A municipal report presents a vertical bar chart comparing Water Works (230.9 kPa) and Gas Distribution (159.9 kPa) with the vertical axis starting at 150 kPa. The bar for Water Works looks nearly 8 times taller.',
    question: 'Which action mathematically repairs this visualization while preserving length proportionality?',
    relatedExperimentId: 'exp_truncated_bar',
    options: [
      {
        id: 'a',
        text: 'Set the bar chart vertical axis baseline to 0 kPa so bar length ratio (230.9 / 159.9 = 1.44×) equals the numerical ratio.',
        isCorrect: true,
        feedback: 'Correct! Bar charts encode magnitude through length from the origin. Setting y_base = 0 ensures the physical height ratio matches 230.9 / 159.9 = 1.44×.'
      },
      {
        id: 'b',
        text: 'Keep the baseline at 150 kPa but change the bars to 3D cylinders.',
        isCorrect: false,
        feedback: 'Incorrect. 3D perspective foreshortening compounds the baseline truncation error and is prohibited by VISUALIZATION_STANDARDS.md.'
      },
      {
        id: 'c',
        text: 'Set the baseline to 100 kPa as a compromise.',
        isCorrect: false,
        feedback: 'Incorrect. Any non-zero baseline b ≠ 0 distorts the visual ratio (y_2 - b)/(y_1 - b) away from y_2 / y_1.'
      }
    ]
  },
  {
    id: 'chal_2_denominator',
    number: 2,
    title: 'Challenge 2: Choose the Correct Contingency Denominator',
    scenario: 'In a clinical trial (N = 60 total patients), 22 patients received Standard Care (4 achieved Complete Remission) and 16 received Combination Protocol (9 achieved Complete Remission). You want to compare the probability of achieving Complete Remission given each assigned regimen.',
    question: 'Which denominator and chart representation should you select?',
    relatedExperimentId: 'exp_counts_vs_pct',
    options: [
      {
        id: 'a',
        text: 'Divide each cell by the Grand Total N = 60 (4/60 = 6.7% vs 9/60 = 15.0%) in a pie chart.',
        isCorrect: false,
        feedback: 'Incorrect. Dividing by N = 60 computes the joint proportion P(Regimen ∩ Remission), which is Penalized whenever a regimen has fewer enrolled patients.'
      },
      {
        id: 'b',
        text: 'Normalize each regimen by its own row total n_{i•} (4/22 = 18.2% vs 9/16 = 56.3%) in a 100% Stacked Bar Chart with explicit n_i labels.',
        isCorrect: true,
        feedback: 'Correct! Conditioning on the assigned regimen requires the row denominator n_{i•}, yielding P(Remission | Standard) = 18.2% vs P(Remission | Combo) = 56.3%.'
      },
      {
        id: 'c',
        text: 'Plot only the raw counts (4 vs 9) without mentioning how many patients were in each regimen.',
        isCorrect: false,
        feedback: 'Incorrect. Raw counts without cohort denominators n_{i•} cannot establish whether a higher count is due to better efficacy or simply a larger cohort.'
      }
    ]
  },
  {
    id: 'chal_3_ci_interpretation',
    number: 3,
    title: 'Challenge 3: Interpret a 95% Frequentist Confidence Interval',
    scenario: 'In the Multi-Center Trial dataset, Boston Med (n = 140) reports a mean biomarker reduction of 18.4% with a 95% frequentist confidence interval of [14.28%, 22.52%].',
    question: 'Which statement is mathematically and statistically valid?',
    relatedExperimentId: 'exp_unlabeled_uncertainty',
    options: [
      {
        id: 'a',
        text: '95% of individual patients at Boston Med experienced a biomarker reduction between 14.28% and 22.52%.',
        isCorrect: false,
        feedback: 'Incorrect. That confuses the 95% Confidence Interval for the population mean μ with the ~12× wider distribution of individual patient outcomes!'
      },
      {
        id: 'b',
        text: 'The true fixed population mean μ jumps around randomly and spends 95% of its time inside [14.28%, 22.52%].',
        isCorrect: false,
        feedback: 'Incorrect. In frequentist inference, the population parameter μ is a fixed constant, not a random variable.'
      },
      {
        id: 'c',
        text: 'Under repeated independent sampling of size n = 140 from this population, approximately 95% of confidence intervals computed by this procedure would cover the true fixed population mean μ.',
        isCorrect: true,
        feedback: 'Correct! Conforms strictly to STATISTICAL_STANDARDS.md Section D.1: confidence resides in the long-run coverage rate of the random interval estimator [L(Y), U(Y)].'
      }
    ]
  },
  {
    id: 'chal_4_bubble_scaling',
    number: 4,
    title: 'Challenge 4: Correct a Distorted Bubble Encoding',
    scenario: 'An analyst maps station water withdrawal (Station A = 250 ML/d, Station B = 1,000 ML/d — a 4× ratio) directly to circle radius (r_A = 5px, r_B = 20px).',
    question: 'What visual distortion occurs, and how must the radius be calculated instead?',
    relatedExperimentId: 'exp_bubble_radius',
    options: [
      {
        id: 'a',
        text: 'Station B occupies 16× the circle area of Station A (A = πr²). Radius must scale with the square root of value (r_B / r_A = √4 = 2×) so area is 4×.',
        isCorrect: true,
        feedback: 'Correct! Scaling radius by 4× scales area by 4² = 16×. Mapping value to area requires r ∝ √V, so a 4× value has a 2× radius and 4× area.'
      },
      {
        id: 'b',
        text: 'Station B occupies 2× the area of Station A; radius should scale with value squared.',
        isCorrect: false,
        feedback: 'Incorrect. Scaling radius with V² would make the area grow as V⁴!'
      },
      {
        id: 'c',
        text: 'No distortion occurs because readers only judge diameter, never area.',
        isCorrect: false,
        feedback: 'Incorrect. Psychophysical studies confirm viewers perceive 2D closed circular glyphs by their enclosed area.'
      }
    ]
  },
  {
    id: 'chal_5_chart_selection',
    number: 5,
    title: 'Challenge 5: Replace a "Dynamite" Bar Plot on Multimodal Data',
    scenario: 'You are comparing silicon wafer oxide thickness across two calibration lines (n = 56). A colleague proposes a bar chart showing only the mean thickness of each line with a ±1 SE whisker.',
    question: 'Why does VisualGrammar reject the bar chart of means, and what view should replace it?',
    relatedExperimentId: 'exp_dynamite_plot',
    options: [
      {
        id: 'a',
        text: 'Bar charts of continuous means conceal sample size, skewness, outliers, and bimodality; replace with a Grouped Boxplot + Jittered Points or Violin Plot.',
        isCorrect: true,
        feedback: 'Correct! Grouped Boxplots with raw points or Violin Plots reveal the true empirical distribution, sample size, and bimodal clusters.'
      },
      {
        id: 'b',
        text: 'Replace the bar chart with a 3D Pie Chart of the two means.',
        isCorrect: false,
        feedback: 'Incorrect. Means are intensive quantities that do not form parts of a whole, and 3D pies are prohibited.'
      },
      {
        id: 'c',
        text: 'Keep the solid bar chart but remove the SE whisker.',
        isCorrect: false,
        feedback: 'Incorrect. Removing the whisker hides even more distributional information.'
      }
    ]
  },
  {
    id: 'chal_6_unity_boxplot_vs_kde',
    number: 6,
    title: 'Challenge 6: Known Visualization Unity — Boxplot vs Histogram/KDE',
    scenario: 'In Unity Group 3 (Semiconductor Wafer Thickness, n = 56), the standalone Boxplot shows a single box from Q1 = 51.65 nm to Q3 = 64.33 nm with median 56.70 nm. When you switch to the synchronized Histogram or KDE on the exact same 56 wafers, two distinct peaks appear around 52 nm and 64 nm.',
    question: 'What mathematical property explains why the Boxplot and KDE look so different on the exact same dataset?',
    relatedExperimentId: 'exp_dynamite_plot',
    options: [
      {
        id: 'a',
        text: 'The KDE altered the underlying wafer numbers.',
        isCorrect: false,
        feedback: 'Incorrect. Both graphics are computed on the exact same 56 observations.'
      },
      {
        id: 'b',
        text: 'The Boxplot compresses the sample to 5 quantiles (Min, Q1, Q2, Q3, Max), so an empty valley between two modes inside [Q1, Q3] is hidden inside the central IQR box.',
        isCorrect: true,
        feedback: 'Correct! Any distribution sharing the same 25th, 50th, and 75th percentiles produces the same IQR box, whether unimodal, uniform, or bimodal.'
      },
      {
        id: 'c',
        text: 'The Boxplot only plots the first 10 rows of the CSV.',
        isCorrect: false,
        feedback: 'Incorrect. The Boxplot uses all 56 observations via Hyndman-Fan Type 7 quantiles.'
      }
    ]
  },
  {
    id: 'chal_7_simpsons_paradox',
    number: 7,
    title: 'Challenge 7: Resolve Confounded Aggregation (Simpson’s Paradox)',
    scenario: 'In the Clinical Dosage dataset (N = 30), the uncolored scatterplot shows a negative OLS slope (higher dosage is associated with lower recovery). When you map `severity_stratum` to Color or Small Multiples, every single severity group shows a strong positive slope.',
    question: 'What is the correct statistical interpretation?',
    relatedExperimentId: 'exp_simpsons_aggregation',
    options: [
      {
        id: 'a',
        text: 'Baseline severity is a confounding variable: severe patients received higher dosages and started with lower baseline scores, reversing the pooled marginal slope.',
        isCorrect: true,
        feedback: 'Correct! Conditioning on the confounding stratum (Mild, Moderate, Severe) resolves Simpson’s Paradox and reveals the positive within-stratum association.'
      },
      {
        id: 'b',
        text: 'Ordinary least squares math failed because n = 30 is too large.',
        isCorrect: false,
        feedback: 'Incorrect. Both the pooled OLS and stratified OLS equations are algebraically exact; the difference is whether the model conditions on the confounder.'
      },
      {
        id: 'c',
        text: 'The positive within-group lines prove that dosage causes recovery with 100% certainty.',
        isCorrect: false,
        feedback: 'Incorrect. Even after conditioning on observed strata, observational associations do not establish causal proof without randomized assignment.'
      }
    ]
  }
];
