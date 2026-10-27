# Statistical & Mathematical Methods (`METHODS.md`)

All statistical routines in `js/math-engine.js` conform to `STATISTICAL_STANDARDS.md` v1.0.0 and `VISUALIZATION_STANDARDS.md` v1.0.0.

## 1. Univariate Moments & Numerical Stability
- **Two-Pass Centered Moments**: Sample mean $\bar{x} = \frac{1}{n}\sum_{i=1}^n x_i$ is computed in Pass 1; centered sums of powers $SS_k = \sum_{i=1}^n (x_i - \bar{x})^k$ are accumulated in Pass 2 to eliminate catastrophic floating-point cancellation.
- **Sample Variance & Standard Deviation**: Uses Bessel's correction $s^2 = \frac{1}{n-1} SS_2$, $s = \sqrt{s^2}$, and standard error $SE(\bar{x}) = s / \sqrt{n}$.

## 2. Quantiles, Boxplots, & Outlier Fences
- **Hyndman–Fan Type 7 Quantiles**: On ascending order statistics $x_{(1)} \le \dots \le x_{(n)}$, target probability $q \in [0, 1]$ maps to real index $k = (n - 1)q + 1 = j + \gamma$, yielding $\hat{Q}(q) = (1 - \gamma)x_{(j)} + \gamma x_{(j+1)}$.
- **Tukey Fences**: Inner fences are $[Q_1 - 1.5\,IQR, \; Q_3 + 1.5\,IQR]$; outer fences are $[Q_1 - 3.0\,IQR, \; Q_3 + 3.0\,IQR]$. Whiskers extend to the most extreme observed values inside the inner fences.

## 3. Histograms, Kernel Density Estimation (KDE), & ECDF
- **Histogram Scaling**: For bin $k$ with interval $[x_{k-1}, x_k)$ of width $w_k = x_k - x_{k-1}$ and count $n_k$, relative frequency is $p_k = n_k / n$ and probability density is $\hat{f}_k = \frac{n_k}{n \cdot w_k}$ so that $\sum_{k=1}^K \hat{f}_k w_k = 1.0$, even when bin widths are unequal.
- **Kernel Density Estimation**: Evaluates $\hat{f}_h(x) = \frac{1}{nh}\sum_{i=1}^n K\left(\frac{x - x_i}{h}\right)$ using Gaussian or Epanechnikov kernels with Silverman's (1986) rule-of-thumb bandwidth $h = 0.9 \min(s, IQR/1.34) n^{-1/5}$ scaled by user multiplier $m > 0$, verified via trapezoidal integration.
- **Empirical Cumulative Distribution Function (ECDF)**: Right-continuous step function $\widehat{F}_n(t) = \frac{1}{n}\sum_{i=1}^n \mathbb{I}(x_i \le t)$.

## 4. Contingency Tables & Categorical Proportions
- Explicitly distinguishes three denominators:
  1. **Joint Proportion**: $p_{ij} = n_{ij} / N$ ($\sum_{i,j} p_{ij} = 1$).
  2. **Row-Conditional Proportion**: $p_{j \mid i} = n_{ij} / n_{i\bullet}$ ($\sum_j p_{j \mid i} = 1$ for each row $i$).
  3. **Column-Conditional Proportion**: $p_{i \mid j} = n_{ij} / n_{\bullet j}$ ($\sum_i p_{i \mid j} = 1$ for each column $j$).
- Computes Pearson $\chi^2 = \sum_{i,j} \frac{(n_{ij} - E_{ij})^2}{E_{ij}}$ where $E_{ij} = \frac{n_{i\bullet} n_{\bullet j}}{N}$, and Cramér's $V = \sqrt{\frac{\chi^2}{N \cdot \min(R-1, C-1)}}$.

## 5. Bivariate OLS Regression, Intervals, & Influence Diagnostics
- **OLS Estimators**: $\hat{\beta}_1 = SS_{xy} / SS_{xx}$, $\hat{\beta}_0 = \bar{y} - \hat{\beta}_1 \bar{x}$, residual standard error $s_e = \sqrt{SSE / (n - 2)}$.
- **Confidence Band vs Prediction Band**:
  - 95% Confidence Interval for Mean Response $\mu_{Y \mid X=x_0}$: $\hat{y}_0 \pm t_{0.975, n-2} \, s_e \sqrt{\frac{1}{n} + \frac{(x_0 - \bar{x})^2}{SS_{xx}}}$.
  - 95% Prediction Interval for Individual Observation $Y_{\text{new}}$: $\hat{y}_0 \pm t_{0.975, n-2} \, s_e \sqrt{1 + \frac{1}{n} + \frac{(x_0 - \bar{x})^2}{SS_{xx}}}$.
- **Influence Diagnostics**: Hat leverage $h_i = \frac{1}{n} + \frac{(x_i - \bar{x})^2}{SS_{xx}}$, internally studentized residual $r_i = \frac{e_i}{s_e \sqrt{\max(\epsilon, 1 - h_i)}}$, externally studentized residual $t_i = r_i \sqrt{\frac{n - 3}{n - 2 - r_i^2}}$, and Cook's distance $D_i = \frac{r_i^2}{2}\frac{h_i}{\max(\epsilon, 1 - h_i)}$.
- **Normal Q–Q Positions**: Blom's plotting position $p_i = \frac{i - 0.375}{n + 0.25}$ mapped through Acklam's minimax rational approximation for $\Phi^{-1}(p_i)$.
