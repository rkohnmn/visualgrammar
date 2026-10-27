/**
 * VisualGrammar — Pure Statistical & Mathematical Engine (math-engine.js)
 * Conforms strictly to STATISTICAL_STANDARDS.md v1.0.0 and VISUALIZATION_STANDARDS.md v1.0.0.
 * Zero DOM dependencies. Pure ES2022+ double-precision Float64 algorithms.
 */

export const EPSILON = 1.0e-12;

/**
 * Deterministic Seedable PRNG (Mulberry32)
 * Conforms to STATISTICAL_STANDARDS.md Section E.3
 */
export function createMulberry32(seed = 4289104) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Lanczos approximation (g = 7, 9 coefficients) for ln(Gamma(z))
 */
export function logGamma(z) {
  if (!Number.isFinite(z) || z <= 0) return NaN;
  const coeffs = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  let x = coeffs[0];
  const zMinus1 = z - 1;
  for (let i = 1; i < coeffs.length; i++) {
    x += coeffs[i] / (zMinus1 + i);
  }
  const t = zMinus1 + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (zMinus1 + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Regularized Incomplete Beta Function I_x(a, b) via Lentz continued fraction
 */
export function regularizedBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  if (a <= 0 || b <= 0 || !Number.isFinite(x)) return NaN;

  const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta);

  if (x < (a + 1) / (a + b + 2)) {
    return (front * betaContinuedFraction(x, a, b)) / a;
  }
  return 1 - (front * betaContinuedFraction(1 - x, b, a)) / b;
}

function betaContinuedFraction(x, a, b) {
  const maxIterations = 200;
  const fpMin = 1.0e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1.0;
  let d = 1.0 - (qab * x) / qap;
  if (Math.abs(d) < fpMin) d = fpMin;
  d = 1.0 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < fpMin) d = fpMin;
    c = 1.0 + aa / c;
    if (Math.abs(c) < fpMin) c = fpMin;
    d = 1.0 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < fpMin) d = fpMin;
    c = 1.0 + aa / c;
    if (Math.abs(c) < fpMin) c = fpMin;
    d = 1.0 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < 1.0e-12) break;
  }
  return h;
}

/**
 * Two-sided Student-t p-value: P(|T| >= |tStat|)
 */
export function studentTTwoSidedPValue(tStat, df) {
  if (!Number.isFinite(tStat) || df <= 0) return NaN;
  if (Math.abs(tStat) < EPSILON) return 1.0;
  const x = df / (df + tStat * tStat);
  return Math.max(0, Math.min(1, regularizedBeta(x, 0.5 * df, 0.5)));
}

/**
 * Snedecor's F-distribution upper tail p-value: P(F >= fStat)
 */
export function fDistributionPValue(fStat, df1, df2) {
  if (!Number.isFinite(fStat) || fStat <= 0 || df1 <= 0 || df2 <= 0) return 1.0;
  const x = (df1 * fStat) / (df1 * fStat + df2);
  return Math.max(0, Math.min(1, 1 - regularizedBeta(x, 0.5 * df1, 0.5 * df2)));
}

/**
 * Acklam's rational minimax approximation for Inverse Standard Normal CDF Phi^-1(p)
 */
export function inverseNormalCDF(p) {
  if (!Number.isFinite(p)) return NaN;
  const clampedP = Math.max(1.0e-12, Math.min(1 - 1.0e-12, p));

  const a = [
    -3.969683028665376e+01,
    2.209460984245205e+02,
    -2.759285104469687e+02,
    1.383577518672690e+02,
    -3.066479806614716e+01,
    2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01,
    1.615858368580409e+02,
    -1.556989798598866e+02,
    6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
    4.374664141464968e+00,
    2.938163982698783e+00
  ];
  const d = [
    7.784695709041462e-03,
    3.224671290700398e-01,
    2.445134137142996e+00,
    3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (clampedP < pLow) {
    const q = Math.sqrt(-2 * Math.log(clampedP));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
           ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (clampedP <= pHigh) {
    const q = clampedP - 0.5;
    const r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
           (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  const q = Math.sqrt(-2 * Math.log(1 - clampedP));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
          ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

/**
 * Standard Normal PDF and CDF
 */
export function normalPDF(x, mean = 0, sd = 1) {
  if (sd <= 0 || !Number.isFinite(x)) return NaN;
  const z = (x - mean) / sd;
  return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
}

export function normalCDF(x, mean = 0, sd = 1) {
  if (sd <= 0 || !Number.isFinite(x)) return NaN;
  const z = (x - mean) / (sd * Math.SQRT2);
  return 0.5 * (1 + erf(z));
}

function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const t = 1.0 / (1.0 + 0.3275911 * ax);
  const y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}

/**
 * Student-t Critical Value for two-sided alpha (default alpha = 0.05 -> 95% CI)
 */
export function studentTCritical95(df, alpha = 0.05) {
  if (df <= 0 || !Number.isFinite(df)) return NaN;
  const z = inverseNormalCDF(1 - alpha / 2);
  const g1 = (z * z * z + z) / 4;
  const g2 = (5 * Math.pow(z, 5) + 16 * z * z * z + 3 * z) / 96;
  const g3 = (3 * Math.pow(z, 7) + 19 * Math.pow(z, 5) + 17 * z * z * z - 15 * z) / 384;
  let t = z + g1 / df + g2 / (df * df) + g3 / (df * df * df);

  for (let i = 0; i < 6; i++) {
    const pTwoSided = studentTTwoSidedPValue(t, df);
    const err = (1 - pTwoSided / 2) - (1 - alpha / 2);
    const lnPdf = logGamma((df + 1) / 2) - logGamma(df / 2) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log(1 + (t * t) / df);
    const pdf = Math.exp(lnPdf);
    if (pdf > 1e-14) {
      t -= err / pdf;
    }
  }
  return t;
}

/**
 * Hyndman-Fan Type 7 Quantile on pre-sorted ascending array
 * Conforms strictly to STATISTICAL_STANDARDS.md Section B.2
 */
export function quantileSorted(sorted, q) {
  if (!Array.isArray(sorted) || sorted.length === 0) return NaN;
  const n = sorted.length;
  if (q <= 0 || n === 1) return sorted[0];
  if (q >= 1) return sorted[n - 1];
  const k = (n - 1) * q + 1;
  const j = Math.floor(k);
  const gamma = k - j;
  const lower = sorted[j - 1];
  const upper = sorted[Math.min(n - 1, j)];
  return (1 - gamma) * lower + gamma * upper;
}

/**
 * Comprehensive Univariate Summary Statistics (Two-Pass Centered Algorithm)
 * Conforms to STATISTICAL_STANDARDS.md Section B & Section L.1
 */
export function computeUnivariateStats(rawValues) {
  const valid = [];
  let missingCount = 0;
  for (let i = 0; i < rawValues.length; i++) {
    const v = rawValues[i];
    if (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) {
      missingCount++;
    } else {
      const num = Number(v);
      if (Number.isFinite(num)) {
        valid.push(num);
      } else {
        missingCount++;
      }
    }
  }

  const n = valid.length;
  if (n === 0) {
    return {
      valid: false,
      n: 0,
      missingCount,
      reason: 'No valid finite numeric observations.'
    };
  }

  const sorted = [...valid].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  // Pass 1: Sample Mean
  let sum = 0;
  for (let i = 0; i < n; i++) sum += valid[i];
  const mean = sum / n;

  // Pass 2: Centered Sums of Powers (prevents catastrophic cancellation)
  let ss2 = 0;
  let ss3 = 0;
  let ss4 = 0;
  for (let i = 0; i < n; i++) {
    const dev = valid[i] - mean;
    const dev2 = dev * dev;
    ss2 += dev2;
    ss3 += dev2 * dev;
    ss4 += dev2 * dev2;
  }

  const variance = n > 1 ? ss2 / (n - 1) : 0;
  const sd = Math.sqrt(variance);
  const se = n > 0 ? sd / Math.sqrt(n) : NaN;

  const q1 = quantileSorted(sorted, 0.25);
  const median = quantileSorted(sorted, 0.50);
  const q3 = quantileSorted(sorted, 0.75);
  const iqr = q3 - q1;

  // Median Absolute Deviation (MAD)
  const absDevs = sorted.map(v => Math.abs(v - median)).sort((a, b) => a - b);
  const mad = quantileSorted(absDevs, 0.50);
  const madSigma = 1.482602218505602 * mad;

  // Higher-order moments (Skewness & Excess Kurtosis)
  const m2 = ss2 / n;
  const m3 = ss3 / n;
  const m4 = ss4 / n;
  const skewnessG1 = m2 > EPSILON ? m3 / Math.pow(m2, 1.5) : 0;
  const adjustedSkewness = n >= 3 && m2 > EPSILON ? (Math.sqrt(n * (n - 1)) / (n - 2)) * skewnessG1 : skewnessG1;
  const excessKurtosis = m2 > EPSILON ? m4 / (m2 * m2) - 3 : 0;

  // Tukey 1.5 IQR and 3.0 IQR Fences
  const lowerInnerFence = q1 - 1.5 * iqr;
  const upperInnerFence = q3 + 1.5 * iqr;
  const lowerOuterFence = q1 - 3.0 * iqr;
  const upperOuterFence = q3 + 3.0 * iqr;

  // Whiskers reach most extreme non-outlier observations within [Q1 - 1.5 IQR, Q3 + 1.5 IQR]
  let whiskerLow = min;
  for (let i = 0; i < n; i++) {
    if (sorted[i] >= lowerInnerFence) {
      whiskerLow = sorted[i];
      break;
    }
  }
  let whiskerHigh = max;
  for (let i = n - 1; i >= 0; i--) {
    if (sorted[i] <= upperInnerFence) {
      whiskerHigh = sorted[i];
      break;
    }
  }

  const mildOutliers = [];
  const extremeOutliers = [];
  const allOutliers = [];
  for (let i = 0; i < n; i++) {
    const val = sorted[i];
    if (val < lowerOuterFence || val > upperOuterFence) {
      extremeOutliers.push(val);
      allOutliers.push(val);
    } else if (val < lowerInnerFence || val > upperInnerFence) {
      mildOutliers.push(val);
      allOutliers.push(val);
    }
  }

  // 95% Confidence Interval for Population Mean
  const tCrit = n > 1 ? studentTCritical95(n - 1, 0.05) : NaN;
  const ci95Mean = n > 1 && Number.isFinite(tCrit)
    ? [mean - tCrit * se, mean + tCrit * se]
    : [mean, mean];

  return {
    valid: true,
    n,
    missingCount,
    sum,
    mean,
    variance,
    sd,
    se,
    min,
    q1,
    median,
    q3,
    max,
    range,
    iqr,
    mad,
    madSigma,
    skewness: skewnessG1,
    adjustedSkewness,
    excessKurtosis,
    lowerInnerFence,
    upperInnerFence,
    lowerOuterFence,
    upperOuterFence,
    whiskerLow,
    whiskerHigh,
    mildOutliers,
    extremeOutliers,
    outliers: allOutliers,
    ci95Mean,
    sorted,
    isConstant: range <= EPSILON
  };
}

/**
 * Histogram Binning & Density Calculation Engine
 * Distinguishes frequency (count), relative frequency (proportion), and probability density.
 * Supports equal-width strategies (Sturges, Scott, Freedman-Diaconis, Manual Count/Width)
 * and variable-width bin edges where total density area integrates to 1.0.
 */
export function computeHistogram(rawValues, options = {}) {
  const stats = computeUnivariateStats(rawValues);
  if (!stats.valid || stats.n === 0) {
    return { valid: false, bins: [], totalArea: 0, n: 0 };
  }

  const { sorted, n, min, max, sd, iqr } = stats;
  const customEdges = options.binEdges;

  let edges = [];
  if (Array.isArray(customEdges) && customEdges.length >= 2) {
    edges = [...customEdges].sort((a, b) => a - b);
  } else {
    let binCount = options.binCount ? Math.max(1, Math.min(100, Math.round(options.binCount))) : null;
    if (!binCount) {
      const rule = options.rule || 'freedman-diaconis';
      if (stats.isConstant || n < 2) {
        binCount = 1;
      } else if (rule === 'sturges') {
        binCount = Math.ceil(Math.log2(n) + 1);
      } else if (rule === 'scott' && sd > EPSILON) {
        const h = 3.49 * sd * Math.pow(n, -1 / 3);
        binCount = Math.max(1, Math.ceil((max - min) / h));
      } else if (iqr > EPSILON) {
        const h = 2 * iqr * Math.pow(n, -1 / 3);
        binCount = Math.max(1, Math.ceil((max - min) / h));
      } else {
        binCount = Math.max(1, Math.ceil(Math.sqrt(n)));
      }
      binCount = Math.max(3, Math.min(50, binCount));
    }

    const low = stats.isConstant ? min - 0.5 : min;
    const high = stats.isConstant ? max + 0.5 : max;
    const width = (high - low) / binCount;
    for (let k = 0; k <= binCount; k++) {
      edges.push(low + k * width);
    }
  }

  const numBins = edges.length - 1;
  const bins = [];
  for (let k = 0; k < numBins; k++) {
    const x0 = edges[k];
    const x1 = edges[k + 1];
    const width = Math.max(EPSILON, x1 - x0);
    bins.push({
      index: k,
      x0,
      x1,
      midpoint: 0.5 * (x0 + x1),
      width,
      count: 0,
      relativeFrequency: 0,
      density: 0
    });
  }

  let includedCount = 0;
  for (let i = 0; i < n; i++) {
    const v = sorted[i];
    if (v < edges[0] || v > edges[numBins]) continue;
    // Binary or linear search for bin; last bin is closed [x_{k-1}, x_k]
    let placed = false;
    for (let k = 0; k < numBins; k++) {
      const isLast = k === numBins - 1;
      if ((v >= bins[k].x0 && v < bins[k].x1) || (isLast && v <= bins[k].x1 + EPSILON)) {
        bins[k].count++;
        includedCount++;
        placed = true;
        break;
      }
    }
    if (!placed && v >= edges[numBins]) {
      bins[numBins - 1].count++;
      includedCount++;
    }
  }

  const denom = includedCount > 0 ? includedCount : n;
  let totalArea = 0;
  let totalRelFreq = 0;
  for (let k = 0; k < numBins; k++) {
    bins[k].relativeFrequency = bins[k].count / denom;
    bins[k].density = bins[k].relativeFrequency / bins[k].width;
    totalArea += bins[k].density * bins[k].width;
    totalRelFreq += bins[k].relativeFrequency;
  }

  return {
    valid: true,
    n: includedCount,
    bins,
    edges,
    isVariableWidth: bins.some(b => Math.abs(b.width - bins[0].width) > 1e-7),
    totalArea,
    totalRelFreq
  };
}

/**
 * Kernel Density Estimator (KDE)
 * Conforms to Part 13.2: Gaussian or Epanechnikov kernel with Silverman's rule of thumb
 * and trapezoidal numerical integration verification.
 */
export function computeKDE(rawValues, options = {}) {
  const stats = computeUnivariateStats(rawValues);
  if (!stats.valid || stats.n === 0) {
    return { valid: false, grid: [], bandwidth: 0, area: 0 };
  }

  const { sorted, n, min, max, sd, iqr } = stats;
  const gridSize = options.gridSize || 128;
  const kernelType = options.kernel || 'gaussian';
  const bwMultiplier = options.bandwidthMultiplier && options.bandwidthMultiplier > 0
    ? Number(options.bandwidthMultiplier)
    : 1.0;

  // Silverman's (1986) rule of thumb: h = 0.9 * min(sd, IQR / 1.34) * n^(-1/5)
  const spread = iqr > EPSILON ? Math.min(sd, iqr / 1.34) : sd;
  const baseSpread = spread > EPSILON ? spread : 1.0;
  const silvermanH = 0.9 * baseSpread * Math.pow(Math.max(1, n), -0.2);
  const bandwidth = Math.max(1e-6, (options.bandwidth || silvermanH) * bwMultiplier);

  const pad = 3.0 * bandwidth;
  const startX = stats.isConstant ? min - 2 * bandwidth : min - pad;
  const endX = stats.isConstant ? max + 2 * bandwidth : max + pad;
  const step = (endX - startX) / (gridSize - 1);

  const grid = [];
  let rawArea = 0;

  for (let g = 0; g < gridSize; g++) {
    const x = startX + g * step;
    let sumK = 0;
    for (let i = 0; i < n; i++) {
      const u = (x - sorted[i]) / bandwidth;
      if (kernelType === 'epanechnikov') {
        if (Math.abs(u) <= 1) {
          sumK += 0.75 * (1 - u * u);
        }
      } else {
        sumK += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
      }
    }
    const density = sumK / (n * bandwidth);
    grid.push({ x, density });
    if (g > 0) {
      rawArea += 0.5 * (grid[g - 1].density + density) * step;
    }
  }

  // Normalize strictly so integral equals 1.0 within machine precision
  if (rawArea > EPSILON) {
    for (let g = 0; g < grid.length; g++) {
      grid[g].density /= rawArea;
    }
  }

  let verifiedArea = 0;
  for (let g = 1; g < grid.length; g++) {
    verifiedArea += 0.5 * (grid[g - 1].density + grid[g].density) * step;
  }

  return {
    valid: true,
    n,
    bandwidth,
    silvermanH,
    kernel: kernelType,
    grid,
    area: verifiedArea,
    smallSampleWarning: n < 30
  };
}

/**
 * Empirical Cumulative Distribution Function (ECDF)
 * F_n(t) = (1/n) * sum_{i=1}^n I(x_i <= t)
 * Conforms strictly to Part 13.3
 */
export function computeECDF(rawValues) {
  const stats = computeUnivariateStats(rawValues);
  if (!stats.valid || stats.n === 0) {
    return { valid: false, steps: [], evaluate: () => NaN };
  }
  const { sorted, n } = stats;
  const steps = [];

  let i = 0;
  while (i < n) {
    const val = sorted[i];
    let j = i;
    while (j < n && Math.abs(sorted[j] - val) <= EPSILON) {
      j++;
    }
    steps.push({
      x: val,
      countAtOrBelow: j,
      cumProb: j / n
    });
    i = j;
  }

  function evaluate(t) {
    if (!Number.isFinite(t)) return NaN;
    if (t < sorted[0]) return 0;
    if (t >= sorted[n - 1]) return 1;
    let count = 0;
    for (let k = 0; k < n; k++) {
      if (sorted[k] <= t + EPSILON) count++;
      else break;
    }
    return count / n;
  }

  return {
    valid: true,
    n,
    steps,
    min: sorted[0],
    max: sorted[n - 1],
    evaluate
  };
}

/**
 * Contingency Table & Categorical Normalization Engine
 * Conforms to Part 10.5 and Part 13.5: explicitly tracks denominators for
 * counts, joint proportions, row-conditional proportions, and column-conditional proportions.
 */
export function computeContingencyTable(rows, rowVar, colVar, weightVar = null) {
  const rowLevelsSet = new Set();
  const colLevelsSet = new Set();
  const validRecords = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rv = r[rowVar];
    const cv = colVar ? r[colVar] : 'All';
    if (rv === null || rv === undefined || rv === '' || cv === null || cv === undefined || cv === '') {
      continue;
    }
    const w = weightVar && Number.isFinite(Number(r[weightVar])) ? Math.max(0, Number(r[weightVar])) : 1;
    const rKey = String(rv);
    const cKey = String(cv);
    rowLevelsSet.add(rKey);
    colLevelsSet.add(cKey);
    validRecords.push({ rKey, cKey, w });
  }

  const rowLevels = Array.from(rowLevelsSet);
  const colLevels = Array.from(colLevelsSet);
  const counts = {};
  const rowTotals = {};
  const colTotals = {};
  let grandTotal = 0;

  for (const rKey of rowLevels) {
    counts[rKey] = {};
    rowTotals[rKey] = 0;
    for (const cKey of colLevels) {
      counts[rKey][cKey] = 0;
      colTotals[cKey] = 0;
    }
  }

  for (const rec of validRecords) {
    counts[rec.rKey][rec.cKey] += rec.w;
    rowTotals[rec.rKey] += rec.w;
    colTotals[rec.cKey] += rec.w;
    grandTotal += rec.w;
  }

  const cells = [];
  let chiSquare = 0;
  for (const rKey of rowLevels) {
    for (const cKey of colLevels) {
      const c = counts[rKey][cKey];
      const rTot = rowTotals[rKey];
      const cTot = colTotals[cKey];
      const jointProp = grandTotal > 0 ? c / grandTotal : 0;
      const rowProp = rTot > 0 ? c / rTot : 0;
      const colProp = cTot > 0 ? c / cTot : 0;
      const expected = grandTotal > 0 ? (rTot * cTot) / grandTotal : 0;
      if (expected > EPSILON) {
        chiSquare += Math.pow(c - expected, 2) / expected;
      }
      cells.push({
        row: rKey,
        col: cKey,
        count: c,
        expected,
        jointProportion: jointProp,
        rowProportion: rowProp,
        colProportion: colProp,
        denominatorTotal: grandTotal,
        denominatorRow: rTot,
        denominatorCol: cTot
      });
    }
  }

  const minDim = Math.min(rowLevels.length - 1, colLevels.length - 1);
  const cramersV = minDim > 0 && grandTotal > 0
    ? Math.sqrt(chiSquare / (grandTotal * minDim))
    : 0;

  return {
    valid: grandTotal > 0,
    rowLevels,
    colLevels,
    counts,
    rowTotals,
    colTotals,
    grandTotal,
    cells,
    chiSquare,
    df: Math.max(0, (rowLevels.length - 1) * (colLevels.length - 1)),
    cramersV
  };
}

/**
 * Bivariate Ordinary Least Squares (OLS) & Complete Regression Diagnostics Engine
 * Conforms strictly to STATISTICAL_STANDARDS.md Section F & Section G and STATISTICAL_AUDIT.md
 */
export function computeDatasetDiagnostics(points) {
  if (!Array.isArray(points)) {
    return { valid: false, n: 0, reason: 'Invalid points array.' };
  }

  const validPoints = [];
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const x = Number(pt.x);
    const y = Number(pt.y);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      validPoints.push({
        id: pt.id ?? `obs_${i + 1}`,
        label: pt.label ?? `Obs ${i + 1}`,
        x,
        y,
        group: pt.group ?? null,
        size: pt.size ?? null
      });
    }
  }

  const n = validPoints.length;
  if (n < 3) {
    return {
      valid: false,
      n,
      excludedCount: points.length - n,
      reason: 'At least 3 valid paired observations are required for OLS regression and diagnostics.'
    };
  }

  // Pass 1: Sample Means
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += validPoints[i].x;
    sumY += validPoints[i].y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  // Pass 2: Centered Sums of Squares and Cross-Products
  let ssx = 0;
  let ssy = 0;
  let ssxy = 0;
  for (let i = 0; i < n; i++) {
    const dx = validPoints[i].x - meanX;
    const dy = validPoints[i].y - meanY;
    ssx += dx * dx;
    ssy += dy * dy;
    ssxy += dx * dy;
  }

  const sdX = Math.sqrt(ssx / (n - 1));
  const sdY = Math.sqrt(ssy / (n - 1));
  const covXY = ssxy / (n - 1);

  const rawR = ssx > EPSILON && ssy > EPSILON ? ssxy / Math.sqrt(ssx * ssy) : 0;
  const r = Math.max(-1, Math.min(1, rawR));
  const r2 = r * r;
  const r2Adj = n > 2 ? 1 - ((1 - r2) * (n - 1)) / (n - 2) : r2;

  const slope = ssx > EPSILON ? ssxy / ssx : 0;
  const intercept = meanY - slope * meanX;

  let sse = 0;
  let ssr = 0;
  const rawResiduals = [];
  const fittedValues = [];

  for (let i = 0; i < n; i++) {
    const yHat = intercept + slope * validPoints[i].x;
    const resid = validPoints[i].y - yHat;
    fittedValues.push(yHat);
    rawResiduals.push(resid);
    sse += resid * resid;
    ssr += (yHat - meanY) * (yHat - meanY);
  }

  const df = n - 2;
  const sResid = df > 0 ? Math.sqrt(sse / df) : 0;
  const seSlope = ssx > EPSILON ? sResid / Math.sqrt(ssx) : Infinity;
  const seIntercept = ssx > EPSILON
    ? sResid * Math.sqrt(1 / n + (meanX * meanX) / ssx)
    : Infinity;

  const tSlope = seSlope > EPSILON && Number.isFinite(seSlope) ? slope / seSlope : 0;
  const tIntercept = seIntercept > EPSILON && Number.isFinite(seIntercept) ? intercept / seIntercept : 0;
  const pSlope = studentTTwoSidedPValue(tSlope, df);
  const pIntercept = studentTTwoSidedPValue(tIntercept, df);
  const fStat = tSlope * tSlope;
  const tCrit95 = studentTCritical95(df, 0.05);
  const slopeCI95 = Number.isFinite(seSlope)
    ? [slope - tCrit95 * seSlope, slope + tCrit95 * seSlope]
    : [slope, slope];
  const interceptCI95 = Number.isFinite(seIntercept)
    ? [intercept - tCrit95 * seIntercept, intercept + tCrit95 * seIntercept]
    : [intercept, intercept];

  const leverageThreshold = 4 / n;
  const cooksThreshold = 4 / n;

  const pointDiagnostics = [];
  for (let i = 0; i < n; i++) {
    const x = validPoints[i].x;
    const y = validPoints[i].y;
    const yHat = fittedValues[i];
    const e = rawResiduals[i];
    const h = ssx > EPSILON ? 1 / n + Math.pow(x - meanX, 2) / ssx : 1 / n;
    const oneMinusH = Math.max(EPSILON, 1 - h);
    const stdResid = sResid > EPSILON ? e / (sResid * Math.sqrt(oneMinusH)) : 0;
    const extDenom = Math.max(EPSILON, df - stdResid * stdResid);
    const extStudentResid = n > 3 ? stdResid * Math.sqrt((n - 3) / extDenom) : stdResid;
    const cooksD = 0.5 * stdResid * stdResid * (h / oneMinusH);

    const isHighLeverage = n >= 5 && h > leverageThreshold;
    const isOutlier = Math.abs(stdResid) > 2.0;
    const isInfluential = cooksD > Math.max(cooksThreshold, 0.25);

    const flags = [];
    if (isInfluential) flags.push('INFLUENTIAL');
    if (isHighLeverage) flags.push('HIGH LEV');
    if (isOutlier) flags.push('OUTLIER');
    if (flags.length === 0) flags.push('OK');

    pointDiagnostics.push({
      index: i,
      id: validPoints[i].id,
      label: validPoints[i].label,
      x,
      y,
      group: validPoints[i].group,
      fitted: yHat,
      residual: e,
      leverage: h,
      studentizedResidual: stdResid,
      externallyStudentizedResidual: extStudentResid,
      cooksDistance: cooksD,
      isHighLeverage,
      isOutlier,
      isInfluential,
      flags
    });
  }

  // Normal Q-Q Plot Coordinates using Blom's Plotting Position: p_i = (i - 0.375) / (n + 0.25)
  const sortedByResid = [...pointDiagnostics].sort((a, b) => a.studentizedResidual - b.studentizedResidual);
  const qqPoints = sortedByResid.map((pt, idx) => {
    const rank = idx + 1;
    const pBlom = (rank - 0.375) / (n + 0.25);
    const theoreticalZ = inverseNormalCDF(pBlom);
    return {
      id: pt.id,
      label: pt.label,
      index: pt.index,
      theoreticalZ,
      sampleQuantile: pt.studentizedResidual,
      rawResidual: pt.residual,
      isOutlier: pt.isOutlier,
      isInfluential: pt.isInfluential
    };
  });

  const spearmanRho = computeSpearmanRank(
    validPoints.map(p => p.x),
    validPoints.map(p => p.y)
  );

  return {
    valid: true,
    n,
    excludedCount: points.length - n,
    df,
    meanX,
    meanY,
    sdX,
    sdY,
    covXY,
    ssx,
    ssy,
    ssxy,
    r,
    spearmanRho,
    r2,
    r2Adj,
    slope,
    intercept,
    sse,
    ssr,
    sst: ssy,
    sResid,
    seSlope,
    seIntercept,
    tSlope,
    tIntercept,
    pSlope,
    pIntercept,
    fStat,
    tCrit95,
    slopeCI95,
    interceptCI95,
    leverageThreshold,
    cooksThreshold,
    points: pointDiagnostics,
    qqPoints
  };
}

/**
 * Evaluate Confidence Interval for Mean Response and Prediction Interval at x0
 * Conforms to STATISTICAL_STANDARDS.md Section F.6
 */
export function evaluateRegressionIntervals(diag, x0) {
  if (!diag || !diag.valid || diag.ssx <= EPSILON) {
    return { yHat: NaN, meanCI: [NaN, NaN], predictionInterval: [NaN, NaN] };
  }
  const yHat = diag.intercept + diag.slope * x0;
  const distTerm = Math.pow(x0 - diag.meanX, 2) / diag.ssx;
  const seMean = diag.sResid * Math.sqrt(1 / diag.n + distTerm);
  const sePred = diag.sResid * Math.sqrt(1 + 1 / diag.n + distTerm);
  return {
    yHat,
    seMean,
    sePred,
    meanCI: [yHat - diag.tCrit95 * seMean, yHat + diag.tCrit95 * seMean],
    predictionInterval: [yHat - diag.tCrit95 * sePred, yHat + diag.tCrit95 * sePred]
  };
}

/**
 * Spearman Rank Correlation with Fractional Average Tie Ranks
 */
export function computeSpearmanRank(xArr, yArr) {
  const n = Math.min(xArr.length, yArr.length);
  if (n < 2) return NaN;

  function rankArray(arr) {
    const indexed = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(n);
    let i = 0;
    while (i < n) {
      let j = i;
      while (j < n && Math.abs(indexed[j].v - indexed[i].v) <= EPSILON) j++;
      const avgRank = 0.5 * (i + 1 + j);
      for (let k = i; k < j; k++) {
        ranks[indexed[k].i] = avgRank;
      }
      i = j;
    }
    return ranks;
  }

  const rx = rankArray(xArr);
  const ry = rankArray(yArr);
  const meanRx = (n + 1) / 2;
  const meanRy = (n + 1) / 2;
  let sxy = 0;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    const dx = rx[i] - meanRx;
    const dy = ry[i] - meanRy;
    sxy += dx * dy;
    sx += dx * dx;
    sy += dy * dy;
  }
  if (sx <= EPSILON || sy <= EPSILON) return 0;
  return Math.max(-1, Math.min(1, sxy / Math.sqrt(sx * sy)));
}

/**
 * Quadratic Polynomial Fit (y = b0 + b1*x + b2*x^2) via Gaussian Elimination with Partial Pivoting
 */
export function fitQuadraticModel(points) {
  const valid = points.filter(p => Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)));
  const n = valid.length;
  if (n < 4) return null;

  let sx1 = 0, sx2 = 0, sx3 = 0, sx4 = 0;
  let sy = 0, sxy = 0, sx2y = 0;
  for (let i = 0; i < n; i++) {
    const x = Number(valid[i].x);
    const y = Number(valid[i].y);
    const x2 = x * x;
    sx1 += x;
    sx2 += x2;
    sx3 += x2 * x;
    sx4 += x2 * x2;
    sy += y;
    sxy += x * y;
    sx2y += x2 * y;
  }

  const A = [
    [n, sx1, sx2, sy],
    [sx1, sx2, sx3, sxy],
    [sx2, sx3, sx4, sx2y]
  ];

  for (let col = 0; col < 3; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(A[row][col]) > Math.abs(A[pivotRow][col])) pivotRow = row;
    }
    if (Math.abs(A[pivotRow][col]) < 1.0e-11) return null;
    [A[col], A[pivotRow]] = [A[pivotRow], A[col]];

    for (let row = col + 1; row < 3; row++) {
      const factor = A[row][col] / A[col][col];
      for (let k = col; k <= 3; k++) {
        A[row][k] -= factor * A[col][k];
      }
    }
  }

  const coeffs = [0, 0, 0];
  for (let row = 2; row >= 0; row--) {
    let sum = A[row][3];
    for (let col = row + 1; col < 3; col++) {
      sum -= A[row][col] * coeffs[col];
    }
    coeffs[row] = sum / A[row][row];
  }

  const [b0, b1, b2] = coeffs;
  const meanY = sy / n;
  let sst = 0;
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const x = Number(valid[i].x);
    const y = Number(valid[i].y);
    const yHat = b0 + b1 * x + b2 * x * x;
    sst += (y - meanY) * (y - meanY);
    sse += (y - yHat) * (y - yHat);
  }
  const r2 = sst > EPSILON ? Math.max(0, 1 - sse / sst) : 0;

  return { b0, b1, b2, r2, sse };
}

/**
 * Exact-Moment Projection Solver via Gram-Schmidt Orthogonalization
 * Conforms strictly to STATISTICAL_STANDARDS.md Section H
 */
export function projectToExactMoments(points, targets) {
  const n = points.length;
  if (n < 3) return points;

  const targetMeanX = Number.isFinite(targets.meanX) ? targets.meanX : 9.0;
  const targetSdX = Number.isFinite(targets.sdX) && targets.sdX > 0 ? targets.sdX : Math.sqrt(11);
  const targetMeanY = Number.isFinite(targets.meanY) ? targets.meanY : 7.5;
  const targetSdY = Number.isFinite(targets.sdY) && targets.sdY > 0 ? targets.sdY : Math.sqrt(4.125);
  const targetR = Math.max(-0.9999, Math.min(0.9999, Number.isFinite(targets.r) ? targets.r : 0.8164));

  let meanX = 0, meanY = 0;
  for (let i = 0; i < n; i++) {
    meanX += points[i].x;
    meanY += points[i].y;
  }
  meanX /= n;
  meanY /= n;

  const u = points.map(p => p.x - meanX);
  const v = points.map(p => p.y - meanY);

  let ssu = u.reduce((acc, val) => acc + val * val, 0);
  if (ssu < EPSILON) {
    for (let i = 0; i < n; i++) {
      u[i] = i - (n - 1) / 2;
    }
    ssu = u.reduce((acc, val) => acc + val * val, 0);
  }

  const su = Math.sqrt(ssu / (n - 1));
  const zx = u.map(val => val / su);

  let dot = 0;
  for (let i = 0; i < n; i++) dot += zx[i] * v[i];
  const c = dot / (n - 1);

  let w = v.map((val, i) => val - c * zx[i]);
  const meanW = w.reduce((acc, val) => acc + val, 0) / n;
  w = w.map(val => val - meanW);

  let ssw = w.reduce((acc, val) => acc + val * val, 0);
  if (ssw < EPSILON) {
    for (let i = 0; i < n; i++) {
      w[i] = Math.cos((2 * Math.PI * (i + 1)) / n) + (i % 2 === 0 ? 0.25 : -0.25);
    }
    const dotFallback = w.reduce((acc, val, i) => acc + zx[i] * val, 0) / (n - 1);
    w = w.map((val, i) => val - dotFallback * zx[i]);
    const mw2 = w.reduce((acc, val) => acc + val, 0) / n;
    w = w.map(val => val - mw2);
    ssw = w.reduce((acc, val) => acc + val * val, 0);
  }

  const sw = Math.sqrt(ssw / (n - 1));
  const zPerp = w.map(val => val / sw);
  const orthoWeight = Math.sqrt(1 - targetR * targetR);

  return points.map((pt, i) => {
    const zy = targetR * zx[i] + orthoWeight * zPerp[i];
    return {
      ...pt,
      x: targetMeanX + targetSdX * zx[i],
      y: targetMeanY + targetSdY * zy
    };
  });
}

/**
 * 2D Binning (Hexbin / Grid Density) for Overplotting Mitigation
 */
export function compute2DBins(points, gridCount = 12) {
  const valid = points.filter(p => Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)));
  if (valid.length === 0) return { bins: [], maxCount: 0 };

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of valid) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const dx = Math.max(EPSILON, (maxX - minX) / gridCount);
  const dy = Math.max(EPSILON, (maxY - minY) / gridCount);
  const map = new Map();

  for (const p of valid) {
    const gx = Math.min(gridCount - 1, Math.max(0, Math.floor((p.x - minX) / dx)));
    const gy = Math.min(gridCount - 1, Math.max(0, Math.floor((p.y - minY) / dy)));
    const key = `${gx}_${gy}`;
    if (!map.has(key)) {
      map.set(key, {
        gx,
        gy,
        x0: minX + gx * dx,
        x1: minX + (gx + 1) * dx,
        y0: minY + gy * dy,
        y1: minY + (gy + 1) * dy,
        cx: minX + (gx + 0.5) * dx,
        cy: minY + (gy + 0.5) * dy,
        count: 0,
        points: []
      });
    }
    const cell = map.get(key);
    cell.count++;
    cell.points.push(p);
  }

  const bins = Array.from(map.values());
  const maxCount = bins.reduce((m, b) => Math.max(m, b.count), 0);
  return { bins, maxCount, minX, maxX, minY, maxY, dx, dy };
}

/**
 * Sample Autocorrelation Function (ACF) with Bartlett 95% White-Noise Confidence Bounds
 * Conforms strictly to STATISTICAL_STANDARDS.md Section K.2
 */
export function computeACF(seriesValues, maxLag = 16) {
  const valid = seriesValues.map(Number).filter(Number.isFinite);
  const T = valid.length;
  if (T < 3) return { valid: false, lags: [], bartlettBound: NaN };

  const mean = valid.reduce((a, b) => a + b, 0) / T;
  let gamma0 = 0;
  for (let t = 0; t < T; t++) {
    const d = valid[t] - mean;
    gamma0 += d * d;
  }
  gamma0 /= T;

  const limitLag = Math.min(maxLag, T - 2);
  const lags = [];
  for (let k = 0; k <= limitLag; k++) {
    if (k === 0 || gamma0 <= EPSILON) {
      lags.push({ lag: k, acf: 1.0 });
    } else {
      let gammaK = 0;
      for (let t = k; t < T; t++) {
        gammaK += (valid[t] - mean) * (valid[t - k] - mean);
      }
      gammaK /= T;
      lags.push({ lag: k, acf: gammaK / gamma0 });
    }
  }

  return {
    valid: true,
    n: T,
    mean,
    lags,
    bartlettBound: 1.96 / Math.sqrt(T)
  };
}

/**
 * One-Way Analysis of Variance (ANOVA) across Categorical Groups
 * Conforms strictly to STATISTICAL_STANDARDS.md Section I.1
 */
export function computeOneWayANOVA(groupsMap) {
  const groupKeys = Object.keys(groupsMap).filter(k => Array.isArray(groupsMap[k]) && groupsMap[k].length > 0);
  const k = groupKeys.length;
  if (k < 2) return { valid: false, reason: 'At least 2 non-empty groups required.' };

  let N = 0;
  let grandSum = 0;
  const groupStats = {};

  for (const key of groupKeys) {
    const stats = computeUnivariateStats(groupsMap[key]);
    if (stats.valid && stats.n > 0) {
      groupStats[key] = stats;
      N += stats.n;
      grandSum += stats.sum;
    }
  }

  if (N <= k) return { valid: false, reason: 'Insufficient total observations relative to group count.' };
  const grandMean = grandSum / N;

  let ssb = 0;
  let ssw = 0;
  for (const key of Object.keys(groupStats)) {
    const gs = groupStats[key];
    ssb += gs.n * Math.pow(gs.mean - grandMean, 2);
    ssw += (gs.n - 1) * gs.variance;
  }

  const dfB = k - 1;
  const dfW = N - k;
  const msb = ssb / dfB;
  const msw = ssw / dfW;
  const fStat = msw > EPSILON ? msb / msw : 0;
  const pValue = fDistributionPValue(fStat, dfB, dfW);

  return {
    valid: true,
    k,
    N,
    grandMean,
    ssb,
    ssw,
    sst: ssb + ssw,
    dfB,
    dfW,
    msb,
    msw,
    fStat,
    pValue,
    etaSquared: (ssb + ssw) > EPSILON ? ssb / (ssb + ssw) : 0,
    groupStats
  };
}

/**
 * Nonparametric Bootstrap Resampling for Sampling Distribution Demonstrations
 * Conforms strictly to STATISTICAL_STANDARDS.md Section E.1
 */
export function runBootstrapMean(rawValues, replicates = 1000, seed = 4289104) {
  const stats = computeUnivariateStats(rawValues);
  if (!stats.valid || stats.n < 2) return { valid: false, replicates: [] };

  const rng = createMulberry32(seed);
  const n = stats.n;
  const src = stats.sorted;
  const bootMeans = new Array(replicates);

  for (let b = 0; b < replicates; b++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(rng() * n);
      sum += src[idx];
    }
    bootMeans[b] = sum / n;
  }

  const bootStats = computeUnivariateStats(bootMeans);
  const ci95Percentile = [
    quantileSorted(bootStats.sorted, 0.025),
    quantileSorted(bootStats.sorted, 0.975)
  ];

  return {
    valid: true,
    originalMean: stats.mean,
    originalSD: stats.sd,
    originalSE: stats.se,
    replicates,
    seed,
    bootstrapMeans: bootMeans,
    bootstrapMean: bootStats.mean,
    bootstrapSE: bootStats.sd,
    bootstrapBias: bootStats.mean - stats.mean,
    ci95Percentile
  };
}
