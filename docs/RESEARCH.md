# Educational & Market Research Analysis (`docs/RESEARCH.md`)

## 1. Problem Statement in Statistical Visualization Education

Traditional plotting software separates chart drawing from statistical reasoning: students and analysts select chart templates from a gallery of icons without understanding variable scales (Stevens, 1946), perceptual accuracy hierarchies (Cleveland & McGill, 1984), or how transformations alter denominators and statistical targets. Conversely, introductory textbooks explain distribution theory and regression diagnostics statically without allowing students to see how changing bin widths, kernel bandwidths, or contingency denominators alters visual conclusions on the exact same dataset.

## 2. VisualGrammar's Differentiated Architecture

1. **Semantic Type Inference Before Plotting**: Prevents common analytical errors—such as averaging numeric ZIP codes or treating `0/1` binary indicators as continuous predictors—before a chart is even drawn.
2. **Known Visualization Unity ("One Dataset, Many Views")**: Demonstrates mathematically how Histograms, KDEs, ECDFs, Boxplots, and Violins project the same univariate vector $\mathbf{x} \in \mathbb{R}^n$, and why a Boxplot conceals bimodality that KDE and Histogram expose.
3. **Live Graphical Integrity Auditing**: Operationalizes principles from Wilke (*Fundamentals of Data Visualization*) and Cairo (*How Charts Lie*) by automatically flagging "dynamite" mean bar plots, truncated bar baselines, and radius-scaled bubbles with one-click mathematical repairs.
