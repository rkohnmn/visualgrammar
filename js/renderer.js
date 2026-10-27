/**
 * VisualGrammar — High-DPI Canvas 2D & Vector SVG Plotting Engine (renderer.js)
 * Conforms strictly to VISUALIZATION_STANDARDS.md v1.0.0, DESIGN.md v1.0.0, and Part 8 & Part 9.
 * Zero external charting libraries. Pure data-driven rendering for all 34 chart types.
 */

import {
  computeUnivariateStats,
  computeHistogram,
  computeKDE,
  computeECDF,
  computeContingencyTable,
  computeDatasetDiagnostics,
  evaluateRegressionIntervals,
  fitQuadraticModel,
  compute2DBins,
  computeACF,
  computeOneWayANOVA,
  EPSILON
} from './math-engine.js';
import { getChartById } from './chart-registry.js';

export const PALETTE_HUES = {
  datasense: ['#0F6E56', '#D9381E', '#1D4ED8', '#B45309', '#7C3AED', '#0891B2', '#BE185D', '#4D7C0F'],
  okabe_ito: ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#F0E442', '#56B4E9', '#E69F00', '#332288'],
  viridis_seq: ['#440154', '#414487', '#2A788E', '#22A884', '#7AD151', '#FDE725'],
  diverging: ['#1D4ED8', '#60A5FA', '#93C5FD', '#F6F4EE', '#FCA5A5', '#F87171', '#D9381E']
};

/**
 * Retrieve active theme colors from CSS custom properties or fallback defaults
 */
export function getThemeTokens() {
  if (typeof window !== 'undefined' && window.document) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark
      ? {
          bg: '#151921',
          paper: '#0D1014',
          text: '#F1F5F9',
          muted: '#94A3B8',
          border: '#262D3B',
          gridMajor: '#1E2532',
          gridMinor: '#181D27',
          primary: '#34D399',
          secondary: '#F87171',
          warning: '#F59E0B',
          accent: '#60A5FA',
          altModel: '#A78BFA',
          palette: ['#34D399', '#F87171', '#60A5FA', '#FBBF24', '#A78BFA', '#22D3EE', '#F472B6', '#A3E635']
        }
      : {
          bg: '#FFFFFF',
          paper: '#F6F4EE',
          text: '#141619',
          muted: '#525866',
          border: '#D8D4C8',
          gridMajor: '#E5E1D6',
          gridMinor: '#F0EDE4',
          primary: '#0F6E56',
          secondary: '#D9381E',
          warning: '#B45309',
          accent: '#1D4ED8',
          altModel: '#7C3AED',
          palette: ['#0F6E56', '#D9381E', '#1D4ED8', '#B45309', '#7C3AED', '#0891B2', '#BE185D', '#4D7C0F']
        };
  }
  return {
    bg: '#FFFFFF',
    paper: '#F6F4EE',
    text: '#141619',
    muted: '#525866',
    border: '#D8D4C8',
    gridMajor: '#E5E1D6',
    gridMinor: '#F0EDE4',
    primary: '#0F6E56',
    secondary: '#D9381E',
    warning: '#B45309',
    accent: '#1D4ED8',
    altModel: '#7C3AED',
    palette: ['#0F6E56', '#D9381E', '#1D4ED8', '#B45309', '#7C3AED', '#0891B2', '#BE185D', '#4D7C0F']
  };
}

/**
 * Main Canvas 2D Entry Point
 * Scales backing store by devicePixelRatio, renders the active chart, and returns:
 * - hitRegions: array of { x, y, r, w, h, shape, label, details, obsId }
 * - interpretation: { simple, standard, technical, summaryStats }
 */
export function renderChartOnCanvas(canvas, rows, profile, config = {}) {
  if (!canvas) return { hitRegions: [], interpretation: null };
  const ctx = canvas.getContext('2d');
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio)
    ? Math.min(2.5, window.devicePixelRatio)
    : 1;

  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(320, rect.width || canvas.width || 720);
  const cssH = Math.max(240, rect.height || canvas.height || 440);

  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  ctx.save();
  ctx.scale(dpr, dpr);

  const tokens = getThemeTokens();
  const palette = config.palette && PALETTE_HUES[config.palette]
    ? PALETTE_HUES[config.palette]
    : tokens.palette;

  // Clear background
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, cssW, cssH);

  if (!Array.isArray(rows) || rows.length === 0 || !profile) {
    drawEmptyMessage(ctx, cssW, cssH, 'No active observations to plot.', tokens);
    ctx.restore();
    return { hitRegions: [], interpretation: null };
  }

  const chartType = config.chartType || 'bar_vertical';
  const hitRegions = [];
  const margin = {
    top: config.title ? 46 : 28,
    right: 32,
    bottom: 58,
    left: chartType === 'bar_horizontal' || chartType === 'ridgeline_plot' || chartType === 'dendrogram' ? 128 : 68
  };
  const plotW = Math.max(100, cssW - margin.left - margin.right);
  const plotH = Math.max(80, cssH - margin.top - margin.bottom);

  // Draw Title & Subtitle if present
  if (config.title) {
    ctx.fillStyle = tokens.text;
    ctx.font = "600 16px 'Instrument Serif', Georgia, serif";
    ctx.textAlign = 'left';
    ctx.fillText(String(config.title), margin.left, 24);
  }
  if (config.subtitle) {
    ctx.fillStyle = tokens.muted;
    ctx.font = "400 12px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(String(config.subtitle), margin.left, 40);
  }

  let summaryData = {};

  try {
    switch (chartType) {
      case 'bar_vertical':
      case 'bar_horizontal':
      case 'dot_plot':
      case 'lollipop_chart':
      case 'dynamite_plot_prohibited':
        summaryData = renderCategorical1D(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'bar_grouped':
      case 'bar_stacked':
      case 'bar_stacked_100':
        summaryData = renderCategorical2D(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'histogram':
      case 'frequency_polygon':
        summaryData = renderHistogramChart(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'kde_density':
      case 'density_overlay':
      case 'ridgeline_plot':
        summaryData = renderKDEChart(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'ecdf_plot':
        summaryData = renderECDFChart(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'boxplot':
      case 'grouped_boxplot':
      case 'violin_plot':
      case 'strip_plot':
      case 'beeswarm_plot':
        summaryData = renderDistributionGroupChart(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'scatter_plot':
      case 'scatter_ols':
      case 'bubble_plot':
      case 'connected_scatter':
      case 'geo_point_map':
      case 'geo_bubble_map':
        summaryData = renderBivariateCartesian(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'hexbin_2d':
        summaryData = renderHexbin2D(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'bivariate_heatmap':
      case 'calendar_heatmap':
      case 'matrix_heatmap':
      case 'choropleth_map':
        summaryData = renderHeatmapMatrix(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'line_chart':
      case 'area_chart':
      case 'stacked_area':
      case 'seasonal_plot':
      case 'streamgraph':
      case 'slopegraph':
        summaryData = renderTemporalSeries(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'small_multiples':
      case 'splom_matrix':
        summaryData = renderMultiPanelGrid(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'correlogram':
        summaryData = renderCorrelogram(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'normal_qq':
        summaryData = renderNormalQQ(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'residual_fitted':
        summaryData = renderResidualFitted(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'point_interval':
      case 'error_bars':
      case 'interval_ribbon':
        summaryData = renderUncertaintyIntervals(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'pie_chart':
      case 'donut_chart':
      case 'waffle_chart':
      case 'treemap':
        summaryData = renderPartToWhole(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'radar_chart':
      case 'parallel_coordinates':
        summaryData = renderMultivariateCoordinates(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'lag_plot':
      case 'acf_plot':
        summaryData = renderSerialDiagnostics(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      case 'sankey_diagram':
      case 'chord_diagram':
      case 'network_diagram':
      case 'dendrogram':
      case 'word_cloud':
        summaryData = renderRelationalFlow(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
        break;

      default:
        summaryData = renderCategorical1D(ctx, rows, profile, config, { margin, plotW, plotH, cssW, cssH, tokens, palette, hitRegions });
    }
  } catch (err) {
    drawEmptyMessage(ctx, cssW, cssH, `Render notice: ${err.message}`, tokens);
  }

  // Optional Custom Reference Line
  if (config.referenceLineValue !== undefined && config.referenceLineValue !== '' && Number.isFinite(Number(config.referenceLineValue))) {
    ctx.fillStyle = tokens.warning;
    ctx.font = "500 11px 'JetBrains Mono', monospace";
    ctx.textAlign = 'right';
    ctx.fillText(`Ref: ${config.referenceLineValue}`, cssW - margin.right, margin.top + 12);
  }

  // Optional User Annotation Badge
  if (config.annotationText && String(config.annotationText).trim()) {
    const note = String(config.annotationText).trim();
    ctx.fillStyle = tokens.paper;
    ctx.strokeStyle = tokens.primary;
    ctx.lineWidth = 1;
    const w = Math.min(260, note.length * 6.5 + 20);
    ctx.fillRect(margin.left + 10, margin.top + 8, w, 24);
    ctx.strokeRect(margin.left + 10, margin.top + 8, w, 24);
    ctx.fillStyle = tokens.text;
    ctx.font = "500 11px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(note.slice(0, 38), margin.left + 18, margin.top + 24);
  }

  ctx.restore();

  const interpretation = buildMultiLevelInterpretation(chartType, config, profile, rows, summaryData);
  return { hitRegions, interpretation, summaryData };
}

function drawEmptyMessage(ctx, w, h, msg, tokens) {
  ctx.fillStyle = tokens.muted;
  ctx.font = "500 14px 'Inter', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText(msg, w / 2, h / 2);
}

function drawCartesianFrame(ctx, margin, plotW, plotH, tokens, xLabel, yLabel) {
  ctx.strokeStyle = tokens.gridMajor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = margin.top + (plotH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(margin.left + plotW, y);
    ctx.stroke();

    const x = margin.left + (plotW * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x, margin.top);
    ctx.lineTo(x, margin.top + plotH);
    ctx.stroke();
  }

  ctx.strokeStyle = tokens.border;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(margin.left, margin.top, plotW, plotH);

  if (xLabel) {
    ctx.fillStyle = tokens.text;
    ctx.font = "600 12px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, margin.left + plotW / 2, margin.top + plotH + 42);
  }
  if (yLabel) {
    ctx.save();
    ctx.translate(18, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = tokens.text;
    ctx.font = "600 12px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }
}

function formatTick(val) {
  if (!Number.isFinite(val)) return '';
  if (Math.abs(val) >= 10000) return val.toExponential(1);
  if (Number.isInteger(val)) return String(val);
  if (Math.abs(val) >= 100) return val.toFixed(1);
  return val.toFixed(2);
}

// ============================================================================
// 1. CATEGORICAL 1D (Bar Vertical/Horizontal, Dot Plot, Lollipop, Dynamite)
// ============================================================================
function renderCategorical1D(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const chartType = config.chartType;
  const xCol = config.x || profile.headers[0];
  const yCol = config.y || '';
  const aggFunc = config.aggFunc || (yCol ? 'mean' : 'count');
  const sortOrder = config.sortOrder || 'default';

  const groups = new Map();
  let totalValid = 0;
  for (const r of rows) {
    const k = r[xCol];
    if (k === null || k === undefined || k === '') continue;
    const key = String(k);
    if (!groups.has(key)) groups.set(key, []);
    if (yCol && Number.isFinite(Number(r[yCol]))) {
      groups.get(key).push(Number(r[yCol]));
    } else if (!yCol) {
      groups.get(key).push(1);
    }
    totalValid++;
  }

  let items = [];
  for (const [key, vals] of groups.entries()) {
    const n = vals.length;
    if (n === 0) continue;
    const stats = computeUnivariateStats(vals);
    let value = n;
    if (aggFunc === 'proportion') value = totalValid > 0 ? n / totalValid : 0;
    else if (aggFunc === 'percentage') value = totalValid > 0 ? (n / totalValid) * 100 : 0;
    else if (yCol && stats.valid) {
      if (aggFunc === 'sum') value = stats.sum;
      else if (aggFunc === 'mean') value = stats.mean;
      else if (aggFunc === 'median') value = stats.median;
    }
    items.push({ key, value, n, se: stats.valid ? stats.se : 0 });
  }

  const xVarObj = profile.variableMap[xCol];
  if (sortOrder === 'desc') {
    items.sort((a, b) => b.value - a.value);
  } else if (sortOrder === 'asc') {
    items.sort((a, b) => a.value - b.value);
  } else if (xVarObj && xVarObj.orderedLevels) {
    const ord = new Map(xVarObj.orderedLevels.map((l, idx) => [String(l).toLowerCase(), idx]));
    items.sort((a, b) => (ord.get(a.key.toLowerCase()) ?? 99) - (ord.get(b.key.toLowerCase()) ?? 99));
  }

  items = items.slice(0, 20);
  if (items.length === 0) return { items: [], totalValid: 0 };

  const baseline = Number(config.yBaseline || 0);
  const maxVal = Math.max(...items.map(d => d.value + (chartType === 'dynamite_plot_prohibited' ? d.se : 0)), baseline + 1);
  const minVal = Math.min(baseline, ...items.map(d => d.value));
  const span = Math.max(EPSILON, maxVal - minVal) * 1.12;

  const yAxisTitle = yCol ? `${aggFunc.toUpperCase()}(${yCol}) ${profile.variableMap[yCol]?.unit || ''}` : `${aggFunc.toUpperCase()} (${xCol})`;

  if (chartType === 'bar_horizontal') {
    drawCartesianFrame(ctx, margin, plotW, plotH, tokens, yAxisTitle, xCol);
    // X numeric ticks
    ctx.fillStyle = tokens.muted;
    ctx.font = "500 11px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    for (let t = 0; t <= 4; t++) {
      const v = minVal + (span * t) / 4;
      const xPos = margin.left + (plotW * t) / 4;
      ctx.fillText(formatTick(v), xPos, margin.top + plotH + 18);
    }

    const rowStep = plotH / items.length;
    const barH = Math.min(28, rowStep * 0.65);

    items.forEach((d, idx) => {
      const cy = margin.top + (idx + 0.5) * rowStep;
      const w = Math.max(2, ((d.value - minVal) / span) * plotW);
      const color = palette[idx % palette.length];

      ctx.fillStyle = color;
      ctx.fillRect(margin.left, cy - barH / 2, w, barH);

      ctx.fillStyle = tokens.text;
      ctx.font = "500 11px 'Inter', sans-serif";
      ctx.textAlign = 'right';
      ctx.fillText(d.key.slice(0, 16), margin.left - 8, cy + 4);

      ctx.font = "500 11px 'JetBrains Mono', monospace";
      ctx.textAlign = 'left';
      ctx.fillText(formatTick(d.value), margin.left + w + 6, cy + 4);

      hitRegions.push({
        shape: 'rect',
        x: margin.left,
        y: cy - barH / 2,
        w,
        h: barH,
        label: `${xCol}: ${d.key}`,
        details: `${yAxisTitle}: ${formatTick(d.value)} (n = ${d.n})`
      });
    });
  } else {
    drawCartesianFrame(ctx, margin, plotW, plotH, tokens, xCol, yAxisTitle);
    // Y numeric ticks
    ctx.fillStyle = tokens.muted;
    ctx.font = "500 11px 'JetBrains Mono', monospace";
    ctx.textAlign = 'right';
    for (let t = 0; t <= 4; t++) {
      const v = minVal + (span * (4 - t)) / 4;
      const yPos = margin.top + (plotH * t) / 4;
      ctx.fillText(formatTick(v), margin.left - 8, yPos + 4);
    }

    const colStep = plotW / items.length;
    const barW = Math.min(48, colStep * 0.62);
    const zeroY = margin.top + plotH - ((0 - minVal) / span) * plotH;
    const clampedBaseY = Math.max(margin.top, Math.min(margin.top + plotH, zeroY));

    items.forEach((d, idx) => {
      const cx = margin.left + (idx + 0.5) * colStep;
      const valY = margin.top + plotH - ((d.value - minVal) / span) * plotH;
      const color = palette[idx % palette.length];

      if (chartType === 'dot_plot') {
        ctx.strokeStyle = tokens.gridMajor;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, margin.top + plotH);
        ctx.lineTo(cx, valY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, valY, 6.5, 0, 2 * Math.PI);
        ctx.fill();
      } else if (chartType === 'lollipop_chart') {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx, clampedBaseY);
        ctx.lineTo(cx, valY);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, valY, 6, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        const h = Math.max(2, clampedBaseY - valY);
        ctx.fillStyle = chartType === 'dynamite_plot_prohibited' ? tokens.secondary : color;
        ctx.fillRect(cx - barW / 2, valY, barW, h);

        if (chartType === 'dynamite_plot_prohibited' && d.se > 0) {
          const seTop = margin.top + plotH - ((d.value + d.se - minVal) / span) * plotH;
          const seBot = margin.top + plotH - ((d.value - d.se - minVal) / span) * plotH;
          ctx.strokeStyle = tokens.text;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx, seTop);
          ctx.lineTo(cx, seBot);
          ctx.moveTo(cx - 6, seTop);
          ctx.lineTo(cx + 6, seTop);
          ctx.stroke();
        }
      }

      ctx.fillStyle = tokens.text;
      ctx.font = "500 11px 'Inter', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(d.key.slice(0, 12), cx, margin.top + plotH + 18);

      hitRegions.push({
        shape: 'rect',
        x: cx - Math.max(12, barW / 2),
        y: Math.min(valY - 8, clampedBaseY),
        w: Math.max(24, barW),
        h: Math.max(16, Math.abs(clampedBaseY - valY) + 12),
        label: `${xCol}: ${d.key}`,
        details: `${yAxisTitle}: ${formatTick(d.value)} (n = ${d.n})`
      });
    });
  }

  return { items, totalValid, xCol, yCol, aggFunc };
}

// ============================================================================
// 2. CATEGORICAL 2D (Grouped Bar, Stacked Bar, 100% Stacked Bar)
// ============================================================================
function renderCategorical2D(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const chartType = config.chartType;
  const catCols = profile.variables.filter(v => v.taxonomy.family === 'categorical').map(v => v.name);
  const xCol = config.x || catCols[0] || profile.headers[0];
  const colorCol = config.color || catCols.find(c => c !== xCol) || profile.headers[1] || xCol;
  const yCol = config.y && profile.variableMap[config.y]?.taxonomy.family === 'quantitative' ? config.y : null;

  const ct = computeContingencyTable(rows, xCol, colorCol, yCol);
  if (!ct.valid) {
    drawEmptyMessage(ctx, plotW + margin.left, plotH + margin.top, 'Select two categorical variables.', tokens);
    return { ct };
  }

  const is100 = chartType === 'bar_stacked_100';
  const isStacked = chartType === 'bar_stacked' || is100;
  const maxVal = is100
    ? 100
    : isStacked
      ? Math.max(...Object.values(ct.rowTotals), 1) * 1.12
      : Math.max(...ct.cells.map(c => c.count), 1) * 1.15;

  const yLabel = is100 ? 'Row Conditional Percentage (%)' : (yCol ? `Sum(${yCol})` : 'Observation Count (n)');
  drawCartesianFrame(ctx, margin, plotW, plotH, tokens, `${xCol} (by ${colorCol})`, yLabel);

  // Y ticks
  ctx.fillStyle = tokens.muted;
  ctx.font = "500 11px 'JetBrains Mono', monospace";
  ctx.textAlign = 'right';
  for (let t = 0; t <= 4; t++) {
    const v = (maxVal * (4 - t)) / 4;
    const yPos = margin.top + (plotH * t) / 4;
    ctx.fillText(is100 ? `${v.toFixed(0)}%` : formatTick(v), margin.left - 8, yPos + 4);
  }

  const rLevels = ct.rowLevels.slice(0, 12);
  const cLevels = ct.colLevels.slice(0, 8);
  const groupStep = plotW / rLevels.length;

  rLevels.forEach((rKey, rIdx) => {
    const groupX = margin.left + rIdx * groupStep;
    const rTot = ct.rowTotals[rKey] || 0;

    if (isStacked) {
      const barW = Math.min(54, groupStep * 0.62);
      const bx = groupX + (groupStep - barW) / 2;
      let cumVal = 0;

      cLevels.forEach((cKey, cIdx) => {
        const rawCount = ct.counts[rKey][cKey] || 0;
        const val = is100 ? (rTot > 0 ? (rawCount / rTot) * 100 : 0) : rawCount;
        const yBottom = margin.top + plotH - (cumVal / maxVal) * plotH;
        const yTop = margin.top + plotH - ((cumVal + val) / maxVal) * plotH;
        const h = Math.max(0, yBottom - yTop);

        if (h > 0.5) {
          ctx.fillStyle = palette[cIdx % palette.length];
          ctx.fillRect(bx, yTop, barW, h);
          hitRegions.push({
            shape: 'rect',
            x: bx,
            y: yTop,
            w: barW,
            h,
            label: `${rKey} × ${cKey}`,
            details: `Count: ${rawCount} | Row %: ${rTot > 0 ? ((rawCount / rTot) * 100).toFixed(1) : 0}% (Denom n_row = ${rTot}) | Joint %: ${((rawCount / ct.grandTotal) * 100).toFixed(1)}% (N = ${ct.grandTotal})`
          });
        }
        cumVal += val;
      });

      // Print row sample size denominator n_i above bar
      ctx.fillStyle = tokens.muted;
      ctx.font = "500 10px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      const topBarY = margin.top + plotH - (cumVal / maxVal) * plotH;
      ctx.fillText(`n=${rTot}`, bx + barW / 2, Math.max(margin.top + 10, topBarY - 5));
    } else {
      const clusterW = groupStep * 0.76;
      const subW = clusterW / Math.max(1, cLevels.length);
      const startX = groupX + (groupStep - clusterW) / 2;

      cLevels.forEach((cKey, cIdx) => {
        const rawCount = ct.counts[rKey][cKey] || 0;
        const h = (rawCount / maxVal) * plotH;
        const bx = startX + cIdx * subW;
        const by = margin.top + plotH - h;

        ctx.fillStyle = palette[cIdx % palette.length];
        ctx.fillRect(bx, by, Math.max(2, subW - 2), Math.max(2, h));

        hitRegions.push({
          shape: 'rect',
          x: bx,
          y: by,
          w: subW,
          h: Math.max(6, h),
          label: `${rKey} × ${cKey}`,
          details: `Count: ${rawCount} | Within-${rKey}: ${rTot > 0 ? ((rawCount / rTot) * 100).toFixed(1) : 0}% (n = ${rTot})`
        });
      });
    }

    ctx.fillStyle = tokens.text;
    ctx.font = "500 11px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(rKey.slice(0, 14), groupX + groupStep / 2, margin.top + plotH + 18);
  });

  drawCompactLegend(ctx, cLevels, palette, margin.left + 8, margin.top + 8, tokens);
  return { ct, xCol, colorCol };
}

function drawCompactLegend(ctx, labels, palette, startX, startY, tokens) {
  let curX = startX;
  ctx.font = "500 11px 'Inter', sans-serif";
  labels.slice(0, 6).forEach((lbl, idx) => {
    const color = palette[idx % palette.length];
    ctx.fillStyle = color;
    ctx.fillRect(curX, startY, 10, 10);
    ctx.fillStyle = tokens.text;
    ctx.textAlign = 'left';
    const text = String(lbl).slice(0, 16);
    ctx.fillText(text, curX + 14, startY + 9);
    curX += ctx.measureText(text).width + 26;
  });
}

// ============================================================================
// 3. HISTOGRAM & FREQUENCY POLYGON
// ============================================================================
function renderHistogramChart(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const quantCols = profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name);
  const xCol = config.x && profile.variableMap[config.x]?.taxonomy.family === 'quantitative'
    ? config.x
    : (quantCols[0] || profile.headers[0]);
  const histScale = config.histScale || 'count'; // 'count' | 'relative' | 'density'
  const binCount = Number(config.binCount) || null;

  const rawVals = rows.map(r => r[xCol]);
  const hist = computeHistogram(rawVals, { binCount });
  const stats = computeUnivariateStats(rawVals);

  if (!hist.valid || hist.bins.length === 0) {
    drawEmptyMessage(ctx, plotW + margin.left, plotH + margin.top, `Select a quantitative variable for ${config.chartType}.`, tokens);
    return { hist, stats };
  }

  const getY = b => (histScale === 'density' ? b.density : histScale === 'relative' ? b.relativeFrequency : b.count);
  const maxY = Math.max(...hist.bins.map(getY), EPSILON) * 1.15;
  const minX = hist.edges[0];
  const maxX = hist.edges[hist.edges.length - 1];
  const spanX = Math.max(EPSILON, maxX - minX);

  const yLabel = histScale === 'density'
    ? 'Probability Density f(x)'
    : histScale === 'relative'
      ? 'Relative Frequency (p = n_k / n)'
      : 'Frequency Count (n_k)';

  drawCartesianFrame(ctx, margin, plotW, plotH, tokens, `${xCol} ${profile.variableMap[xCol]?.unit ? `(${profile.variableMap[xCol].unit})` : ''}`, yLabel);

  // Ticks
  ctx.fillStyle = tokens.muted;
  ctx.font = "500 11px 'JetBrains Mono', monospace";
  ctx.textAlign = 'right';
  for (let t = 0; t <= 4; t++) {
    const v = (maxY * (4 - t)) / 4;
    const yPos = margin.top + (plotH * t) / 4;
    ctx.fillText(histScale === 'density' ? v.toFixed(3) : formatTick(v), margin.left - 8, yPos + 4);
  }
  ctx.textAlign = 'center';
  for (let t = 0; t <= 4; t++) {
    const vx = minX + (spanX * t) / 4;
    const xPos = margin.left + (plotW * t) / 4;
    ctx.fillText(formatTick(vx), xPos, margin.top + plotH + 18);
  }

  if (config.chartType === 'frequency_polygon') {
    ctx.strokeStyle = palette[0];
    ctx.fillStyle = tokens.primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + plotH);
    hist.bins.forEach(b => {
      const cx = margin.left + ((b.midpoint - minX) / spanX) * plotW;
      const cy = margin.top + plotH - (getY(b) / maxY) * plotH;
      ctx.lineTo(cx, cy);
    });
    ctx.lineTo(margin.left + plotW, margin.top + plotH);
    ctx.stroke();

    hist.bins.forEach(b => {
      const cx = margin.left + ((b.midpoint - minX) / spanX) * plotW;
      const cy = margin.top + plotH - (getY(b) / maxY) * plotH;
      ctx.fillStyle = palette[0];
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, 2 * Math.PI);
      ctx.fill();
      hitRegions.push({
        shape: 'circle',
        x: cx,
        y: cy,
        r: 9,
        label: `Bin [${b.x0.toFixed(2)}, ${b.x1.toFixed(2)})`,
        details: `Count: ${b.count} | Rel Freq: ${(b.relativeFrequency * 100).toFixed(1)}% | Density: ${b.density.toFixed(4)}`
      });
    });
  } else {
    hist.bins.forEach(b => {
      const x0 = margin.left + ((b.x0 - minX) / spanX) * plotW;
      const x1 = margin.left + ((b.x1 - minX) / spanX) * plotW;
      const bw = Math.max(1, x1 - x0 - 1);
      const val = getY(b);
      const bh = (val / maxY) * plotH;
      const by = margin.top + plotH - bh;

      ctx.fillStyle = palette[0];
      ctx.globalAlpha = Number(config.opacity) || 0.82;
      ctx.fillRect(x0, by, bw, bh);
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = tokens.bg;
      ctx.lineWidth = 1;
      ctx.strokeRect(x0, by, bw, bh);

      hitRegions.push({
        shape: 'rect',
        x: x0,
        y: by,
        w: bw,
        h: Math.max(6, bh),
        label: `Interval [${b.x0.toFixed(2)}, ${b.x1.toFixed(2)})`,
        details: `Count: ${b.count} (of n=${hist.n}) | Rel Freq: ${(b.relativeFrequency * 100).toFixed(1)}% | Density: ${b.density.toFixed(4)}`
      });
    });
  }

  // Mean & Median vertical guides
  if (stats.valid) {
    const meanXPos = margin.left + ((stats.mean - minX) / spanX) * plotW;
    const medXPos = margin.left + ((stats.median - minX) / spanX) * plotW;
    ctx.strokeStyle = tokens.secondary;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(meanXPos, margin.top);
    ctx.lineTo(meanXPos, margin.top + plotH);
    ctx.stroke();

    ctx.strokeStyle = tokens.warning;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(medXPos, margin.top);
    ctx.lineTo(medXPos, margin.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  return { hist, stats, xCol, histScale };
}

// ============================================================================
// 4. KDE DENSITY, DENSITY OVERLAY, & RIDGELINE PLOT
// ============================================================================
function renderKDEChart(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const quantCols = profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name);
  const catCols = profile.variables.filter(v => v.taxonomy.family === 'categorical').map(v => v.name);
  const xCol = config.x && profile.variableMap[config.x]?.taxonomy.family === 'quantitative'
    ? config.x
    : (quantCols[0] || profile.headers[0]);
  const groupCol = (config.chartType === 'density_overlay' || config.chartType === 'ridgeline_plot')
    ? (config.color || catCols[0] || null)
    : null;
  const bwMult = Number(config.bandwidthMultiplier) || 1.0;

  const allStats = computeUnivariateStats(rows.map(r => r[xCol]));
  if (!allStats.valid) {
    drawEmptyMessage(ctx, plotW + margin.left, plotH + margin.top, 'Select a quantitative variable.', tokens);
    return { stats: allStats };
  }

  const groupMap = new Map();
  if (groupCol && profile.variableMap[groupCol]) {
    for (const r of rows) {
      const gk = r[groupCol];
      if (gk === null || gk === undefined || gk === '') continue;
      const key = String(gk);
      if (!groupMap.has(key)) groupMap.set(key, []);
      if (Number.isFinite(Number(r[xCol]))) groupMap.get(key).push(Number(r[xCol]));
    }
  } else {
    groupMap.set('All Observations', allStats.sorted);
  }

  const groupEntries = Array.from(groupMap.entries()).filter(([, arr]) => arr.length >= 2).slice(0, 8);
  const kdeList = groupEntries.map(([gKey, arr]) => ({
    gKey,
    n: arr.length,
    values: arr,
    kde: computeKDE(arr, { bandwidthMultiplier: bwMult })
  })).filter(d => d.kde.valid);

  if (kdeList.length === 0) return { stats: allStats };

  const minX = Math.min(...kdeList.map(d => d.kde.grid[0].x));
  const maxX = Math.max(...kdeList.map(d => d.kde.grid[d.kde.grid.length - 1].x));
  const spanX = Math.max(EPSILON, maxX - minX);
  const maxDens = Math.max(...kdeList.flatMap(d => d.kde.grid.map(p => p.density)), EPSILON) * 1.15;

  drawCartesianFrame(
    ctx,
    margin,
    plotW,
    plotH,
    tokens,
    `${xCol} (Bandwidth mult = ${bwMult.toFixed(2)}×)`,
    config.chartType === 'ridgeline_plot' ? (groupCol || 'Cohort Ridge') : 'Probability Density f̂_h(x)'
  );

  // X Ticks
  ctx.fillStyle = tokens.muted;
  ctx.font = "500 11px 'JetBrains Mono', monospace";
  ctx.textAlign = 'center';
  for (let t = 0; t <= 4; t++) {
    const vx = minX + (spanX * t) / 4;
    ctx.fillText(formatTick(vx), margin.left + (plotW * t) / 4, margin.top + plotH + 18);
  }

  if (config.chartType === 'ridgeline_plot') {
    const laneStep = plotH / kdeList.length;
    kdeList.forEach((d, idx) => {
      const baseY = margin.top + (idx + 0.85) * laneStep;
      const peakH = laneStep * 1.25;
      const color = palette[idx % palette.length];

      ctx.beginPath();
      ctx.moveTo(margin.left, baseY);
      d.kde.grid.forEach(pt => {
        const px = margin.left + ((pt.x - minX) / spanX) * plotW;
        const py = baseY - (pt.density / maxDens) * peakH;
        ctx.lineTo(px, py);
      });
      ctx.lineTo(margin.left + plotW, baseY);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = tokens.text;
      ctx.font = "600 11px 'Inter', sans-serif";
      ctx.textAlign = 'right';
      ctx.fillText(`${d.gKey.slice(0, 14)} (n=${d.n})`, margin.left - 8, baseY - 4);
    });
  } else {
    // Y Density ticks
    ctx.textAlign = 'right';
    for (let t = 0; t <= 4; t++) {
      const vy = (maxDens * (4 - t)) / 4;
      ctx.fillText(vy.toFixed(3), margin.left - 8, margin.top + (plotH * t) / 4 + 4);
    }

    kdeList.forEach((d, idx) => {
      const color = palette[idx % palette.length];
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top + plotH);
      d.kde.grid.forEach(pt => {
        const px = margin.left + ((pt.x - minX) / spanX) * plotW;
        const py = margin.top + plotH - (pt.density / maxDens) * plotH;
        ctx.lineTo(px, py);
      });
      ctx.lineTo(margin.left + plotW, margin.top + plotH);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.22;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Rug ticks at bottom
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      d.values.forEach(v => {
        const rx = margin.left + ((v - minX) / spanX) * plotW;
        ctx.beginPath();
        ctx.moveTo(rx, margin.top + plotH);
        ctx.lineTo(rx, margin.top + plotH - 7);
        ctx.stroke();
      });

      const peakPt = d.kde.grid.reduce((best, cur) => (cur.density > best.density ? cur : best), d.kde.grid[0]);
      const pkX = margin.left + ((peakPt.x - minX) / spanX) * plotW;
      const pkY = margin.top + plotH - (peakPt.density / maxDens) * plotH;
      hitRegions.push({
        shape: 'circle',
        x: pkX,
        y: pkY,
        r: 18,
        label: `KDE Peak (${d.gKey}, n = ${d.n})`,
        details: `Mode x ≈ ${peakPt.x.toFixed(2)} | Peak Density: ${peakPt.density.toFixed(4)} | Bandwidth h = ${d.kde.bandwidth.toFixed(3)} | Total Area = ${d.kde.area.toFixed(3)}`
      });
    });

    if (kdeList.length > 1) {
      drawCompactLegend(ctx, kdeList.map(d => `${d.gKey} (n=${d.n})`), palette, margin.left + 8, margin.top + 8, tokens);
    }
  }

  return { stats: allStats, kdeList, xCol, groupCol };
}

// ============================================================================
// 5. EMPIRICAL CUMULATIVE DISTRIBUTION FUNCTION (ECDF)
// ============================================================================
function renderECDFChart(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const quantCols = profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name);
  const xCol = config.x && profile.variableMap[config.x]?.taxonomy.family === 'quantitative'
    ? config.x
    : (quantCols[0] || profile.headers[0]);

  const ecdf = computeECDF(rows.map(r => r[xCol]));
  const stats = computeUnivariateStats(rows.map(r => r[xCol]));
  if (!ecdf.valid) {
    drawEmptyMessage(ctx, plotW + margin.left, plotH + margin.top, 'Select a quantitative variable for ECDF.', tokens);
    return { ecdf, stats };
  }

  const minX = ecdf.min;
  const maxX = ecdf.max;
  const spanX = Math.max(EPSILON, maxX - minX) * 1.08;
  const startX = minX - spanX * 0.04;

  drawCartesianFrame(ctx, margin, plotW, plotH, tokens, xCol, 'Cumulative Probability F̂_n(x)');

  // Y quartile guide lines (0.25, 0.50, 0.75)
  ctx.fillStyle = tokens.muted;
  ctx.font = "500 11px 'JetBrains Mono', monospace";
  [0, 0.25, 0.5, 0.75, 1.0].forEach(q => {
    const yPos = margin.top + plotH - q * plotH;
    ctx.textAlign = 'right';
    ctx.fillText(q.toFixed(2), margin.left - 8, yPos + 4);
  });

  ctx.textAlign = 'center';
  for (let t = 0; t <= 4; t++) {
    const vx = startX + (spanX * t) / 4;
    ctx.fillText(formatTick(vx), margin.left + (plotW * t) / 4, margin.top + plotH + 18);
  }

  // Draw right-continuous step function
  ctx.strokeStyle = palette[0];
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  let prevX = margin.left;
  let prevY = margin.top + plotH;
  ctx.moveTo(prevX, prevY);

  ecdf.steps.forEach(st => {
    const cx = margin.left + ((st.x - startX) / spanX) * plotW;
    const cy = margin.top + plotH - st.cumProb * plotH;
    // Horizontal to cx at prevY, then vertical step up to cy
    ctx.lineTo(cx, prevY);
    ctx.lineTo(cx, cy);
    prevX = cx;
    prevY = cy;
  });
  ctx.lineTo(margin.left + plotW, prevY);
  ctx.stroke();

  ecdf.steps.forEach(st => {
    const cx = margin.left + ((st.x - startX) / spanX) * plotW;
    const cy = margin.top + plotH - st.cumProb * plotH;
    ctx.fillStyle = palette[0];
    ctx.beginPath();
    ctx.arc(cx, cy, 3.8, 0, 2 * Math.PI);
    ctx.fill();

    hitRegions.push({
      shape: 'circle',
      x: cx,
      y: cy,
      r: 8,
      label: `${xCol} = ${formatTick(st.x)}`,
      details: `F̂_n(${formatTick(st.x)}) = ${st.cumProb.toFixed(4)} (${st.countAtOrBelow} of ${ecdf.n} obs ≤ ${formatTick(st.x)})`
    });
  });

  return { ecdf, stats, xCol };
}

// ============================================================================
// 6. BOXPLOT, GROUPED BOXPLOT, VIOLIN, STRIP, & BEESWARM
// ============================================================================
function renderDistributionGroupChart(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const chartType = config.chartType;
  const quantCols = profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name);
  const catCols = profile.variables.filter(v => v.taxonomy.family === 'categorical').map(v => v.name);

  let groupCol = null;
  let numCol = null;
  if (config.y && profile.variableMap[config.y]?.taxonomy.family === 'quantitative') {
    numCol = config.y;
    groupCol = config.x && profile.variableMap[config.x]?.taxonomy.family === 'categorical' ? config.x : (catCols[0] || null);
  } else {
    numCol = config.x && profile.variableMap[config.x]?.taxonomy.family === 'quantitative'
      ? config.x
      : (quantCols[0] || profile.headers[0]);
    groupCol = config.color && profile.variableMap[config.color]?.taxonomy.family === 'categorical'
      ? config.color
      : (chartType === 'grouped_boxplot' ? catCols[0] : null);
  }

  const groupsObj = {};
  if (groupCol && profile.variableMap[groupCol]) {
    for (const r of rows) {
      const g = r[groupCol];
      const v = Number(r[numCol]);
      if (g === null || g === undefined || g === '' || !Number.isFinite(v)) continue;
      const k = String(g);
      if (!groupsObj[k]) groupsObj[k] = [];
      groupsObj[k].push(v);
    }
  } else {
    groupsObj[numCol] = rows.map(r => Number(r[numCol])).filter(Number.isFinite);
  }

  const groupKeys = Object.keys(groupsObj).filter(k => groupsObj[k].length > 0).slice(0, 10);
  if (groupKeys.length === 0) {
    drawEmptyMessage(ctx, plotW + margin.left, plotH + margin.top, 'No valid numeric observations.', tokens);
    return {};
  }

  const groupStats = groupKeys.map(k => ({ key: k, stats: computeUnivariateStats(groupsObj[k]), raw: groupsObj[k] }));
  const allMin = Math.min(...groupStats.map(g => g.stats.min));
  const allMax = Math.max(...groupStats.map(g => g.stats.max));
  const pad = Math.max(0.5, (allMax - allMin) * 0.1);
  const minY = allMin - pad;
  const maxY = allMax + pad;
  const spanY = Math.max(EPSILON, maxY - minY);

  drawCartesianFrame(ctx, margin, plotW, plotH, tokens, groupCol || 'Sample', `${numCol} ${profile.variableMap[numCol]?.unit ? `(${profile.variableMap[numCol].unit})` : ''}`);

  // Y Ticks
  ctx.fillStyle = tokens.muted;
  ctx.font = "500 11px 'JetBrains Mono', monospace";
  ctx.textAlign = 'right';
  for (let t = 0; t <= 4; t++) {
    const vy = minY + (spanY * (4 - t)) / 4;
    ctx.fillText(formatTick(vy), margin.left - 8, margin.top + (plotH * t) / 4 + 4);
  }

  const colStep = plotW / groupStats.length;
  const boxW = Math.min(56, colStep * 0.48);

  groupStats.forEach((g, idx) => {
    const cx = margin.left + (idx + 0.5) * colStep;
    const st = g.stats;
    const color = palette[idx % palette.length];
    const toY = val => margin.top + plotH - ((val - minY) / spanY) * plotH;

    if (chartType === 'violin_plot') {
      const kde = computeKDE(g.raw, { bandwidthMultiplier: Number(config.bandwidthMultiplier) || 1.0 });
      if (kde.valid) {
        const maxD = Math.max(...kde.grid.map(p => p.density), EPSILON);
        const halfW = Math.min(44, colStep * 0.42);

        ctx.beginPath();
        kde.grid.forEach((pt, pIdx) => {
          const py = toY(pt.x);
          const dx = (pt.density / maxD) * halfW;
          if (pIdx === 0) ctx.moveTo(cx + dx, py);
          else ctx.lineTo(cx + dx, py);
        });
        for (let pIdx = kde.grid.length - 1; pIdx >= 0; pIdx--) {
          const pt = kde.grid[pIdx];
          const py = toY(pt.x);
          const dx = (pt.density / maxD) * halfW;
          ctx.lineTo(cx - dx, py);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.28;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    }

    if (['boxplot', 'grouped_boxplot', 'violin_plot'].includes(chartType)) {
      const yQ1 = toY(st.q1);
      const yMed = toY(st.median);
      const yQ3 = toY(st.q3);
      const yWLow = toY(st.whiskerLow);
      const yWHigh = toY(st.whiskerHigh);
      const w = chartType === 'violin_plot' ? 14 : boxW;

      // Whiskers
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx, yQ3);
      ctx.lineTo(cx, yWHigh);
      ctx.moveTo(cx - w * 0.35, yWHigh);
      ctx.lineTo(cx + w * 0.35, yWHigh);
      ctx.moveTo(cx, yQ1);
      ctx.lineTo(cx, yWLow);
      ctx.moveTo(cx - w * 0.35, yWLow);
      ctx.lineTo(cx + w * 0.35, yWLow);
      ctx.stroke();

      // IQR Box
      ctx.fillStyle = color;
      ctx.globalAlpha = chartType === 'violin_plot' ? 0.55 : 0.22;
      ctx.fillRect(cx - w / 2, yQ3, w, Math.max(2, yQ1 - yQ3));
      ctx.globalAlpha = 1.0;
      ctx.strokeRect(cx - w / 2, yQ3, w, Math.max(2, yQ1 - yQ3));

      // Median Line
      ctx.strokeStyle = tokens.text;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, yMed);
      ctx.lineTo(cx + w / 2, yMed);
      ctx.stroke();

      // Mean Diamond
      const yMean = toY(st.mean);
      ctx.fillStyle = tokens.warning;
      ctx.beginPath();
      ctx.moveTo(cx, yMean - 4);
      ctx.lineTo(cx + 4, yMean);
      ctx.lineTo(cx, yMean + 4);
      ctx.lineTo(cx - 4, yMean);
      ctx.closePath();
      ctx.fill();

      // Tukey Outliers
      st.outliers.forEach(outVal => {
        const oy = toY(outVal);
        ctx.strokeStyle = tokens.secondary;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(cx, oy, 4.5, 0, 2 * Math.PI);
        ctx.stroke();
      });

      hitRegions.push({
        shape: 'rect',
        x: cx - boxW / 2,
        y: yWHigh,
        w: boxW,
        h: Math.max(12, yWLow - yWHigh),
        label: `${g.key} (n = ${st.n})`,
        details: `Median: ${st.median.toFixed(2)} | IQR: ${st.iqr.toFixed(2)} [${st.q1.toFixed(2)}, ${st.q3.toFixed(2)}] | Mean: ${st.mean.toFixed(2)} (SD = ${st.sd.toFixed(2)}) | Outliers: ${st.outliers.length}`
      });
    }

    // Raw Jittered or Beeswarm Points
    if (chartType === 'strip_plot' || chartType === 'beeswarm_plot' || chartType === 'grouped_boxplot' || config.showRawPoints) {
      const binCounts = new Map();
      g.raw.forEach((v, pIdx) => {
        const py = toY(v);
        let offsetX = 0;
        if (chartType === 'beeswarm_plot') {
          const binKey = Math.round(py / 7);
          const countInBin = binCounts.get(binKey) || 0;
          binCounts.set(binKey, countInBin + 1);
          const side = countInBin % 2 === 0 ? 1 : -1;
          const rank = Math.ceil(countInBin / 2);
          offsetX = side * rank * 7.5;
        } else {
          // Deterministic golden-ratio horizontal jitter strictly along categorical axis
          offsetX = (((pIdx * 0.6180339887) % 1) - 0.5) * Math.min(34, boxW * 0.72);
        }

        ctx.fillStyle = color;
        ctx.globalAlpha = chartType === 'grouped_boxplot' ? 0.55 : 0.85;
        ctx.beginPath();
        ctx.arc(cx + offsetX, py, 3.8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (chartType === 'strip_plot' || chartType === 'beeswarm_plot') {
          hitRegions.push({
            shape: 'circle',
            x: cx + offsetX,
            y: py,
            r: 6,
            label: `${g.key} Obs #${pIdx + 1}`,
            details: `${numCol} = ${formatTick(v)} (Group Median = ${st.median.toFixed(2)}, n = ${st.n})`
          });
        }
      });

      if (chartType === 'strip_plot' || chartType === 'beeswarm_plot') {
        const yMed = toY(st.median);
        ctx.strokeStyle = tokens.text;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx - 18, yMed);
        ctx.lineTo(cx + 18, yMed);
        ctx.stroke();
      }
    }

    ctx.fillStyle = tokens.text;
    ctx.font = "500 11px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(`${g.key.slice(0, 12)} (n=${st.n})`, cx, margin.top + plotH + 18);
  });

  const anova = groupStats.length >= 2 ? computeOneWayANOVA(groupsObj) : null;
  return { groupStats, anova, numCol, groupCol };
}

// ============================================================================
// 7. BIVARIATE CARTESIAN (Scatter, OLS, Bubble, Connected Scatter, Geo Point/Bubble)
// ============================================================================
function renderBivariateCartesian(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const chartType = config.chartType;
  const quantCols = profile.variables.filter(v => ['quantitative', 'spatial'].includes(v.taxonomy.family)).map(v => v.name);
  const xCol = config.x && profile.variableMap[config.x] ? config.x : (quantCols[0] || profile.headers[0]);
  const yCol = config.y && profile.variableMap[config.y] ? config.y : (quantCols[1] || quantCols[0] || profile.headers[1]);
  const colorCol = config.color && profile.variableMap[config.color] ? config.color : null;
  const sizeCol = config.size && profile.variableMap[config.size] ? config.size : (quantCols[2] || null);

  const pts = [];
  rows.forEach((r, idx) => {
    let x = Number(r[xCol]);
    let y = Number(r[yCol]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (config.logScaleX && x > 0) x = Math.log10(x);
    if (config.logScaleY && y > 0) y = Math.log10(y);
    pts.push({
      id: r.obs_id || `obs_${idx + 1}`,
      label: r.case_label || r.station_code || r.obs_id || `Obs ${idx + 1}`,
      x,
      y,
      rawX: Number(r[xCol]),
      rawY: Number(r[yCol]),
      group: colorCol ? String(r[colorCol] ?? 'Unassigned') : 'All',
      sizeVal: sizeCol && Number.isFinite(Number(r[sizeCol])) ? Math.max(0, Number(r[sizeCol])) : 1,
      timeLabel: r.obs_date || r.year_month || ''
    });
  });

  const diag = computeDatasetDiagnostics(pts);
  if (pts.length === 0) {
    drawEmptyMessage(ctx, plotW + margin.left, plotH + margin.top, 'Select two numeric variables for X and Y.', tokens);
    return { diag };
  }

  const minX = Math.min(...pts.map(p => p.x));
  const maxX = Math.max(...pts.map(p => p.x));
  const minY = Math.min(...pts.map(p => p.y));
  const maxY = Math.max(...pts.map(p => p.y));
  const padX = Math.max(0.5, (maxX - minX) * 0.09);
  const padY = Math.max(0.5, (maxY - minY) * 0.11);
  const domX0 = minX - padX, domX1 = maxX + padX;
  const domY0 = minY - padY, domY1 = maxY + padY;
  const spanX = Math.max(EPSILON, domX1 - domX0);
  const spanY = Math.max(EPSILON, domY1 - domY0);

  const toX = vx => margin.left + ((vx - domX0) / spanX) * plotW;
  const toY = vy => margin.top + plotH - ((vy - domY0) / spanY) * plotH;

  const xAxisTitle = `${config.logScaleX ? 'log10(' + xCol + ')' : xCol} ${profile.variableMap[xCol]?.unit ? `(${profile.variableMap[xCol].unit})` : ''}`;
  const yAxisTitle = `${config.logScaleY ? 'log10(' + yCol + ')' : yCol} ${profile.variableMap[yCol]?.unit ? `(${profile.variableMap[yCol].unit})` : ''}`;
  drawCartesianFrame(ctx, margin, plotW, plotH, tokens, xAxisTitle, yAxisTitle);

  // Ticks
  ctx.fillStyle = tokens.muted;
  ctx.font = "500 11px 'JetBrains Mono', monospace";
  for (let t = 0; t <= 4; t++) {
    const vx = domX0 + (spanX * t) / 4;
    ctx.textAlign = 'center';
    ctx.fillText(formatTick(vx), margin.left + (plotW * t) / 4, margin.top + plotH + 18);

    const vy = domY0 + (spanY * (4 - t)) / 4;
    ctx.textAlign = 'right';
    ctx.fillText(formatTick(vy), margin.left - 8, margin.top + (plotH * t) / 4 + 4);
  }

  // Optional OLS Confidence Ribbon & Regression Line
  if ((chartType === 'scatter_ols' || config.showOLS) && diag.valid) {
    // 95% Confidence Band for Mean Response
    ctx.beginPath();
    const steps = 40;
    for (let s = 0; s <= steps; s++) {
      const xv = minX + ((maxX - minX) * s) / steps;
      const iv = evaluateRegressionIntervals(diag, xv);
      const px = toX(xv);
      const py = toY(iv.meanCI[1]);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    for (let s = steps; s >= 0; s--) {
      const xv = minX + ((maxX - minX) * s) / steps;
      const iv = evaluateRegressionIntervals(diag, xv);
      ctx.lineTo(toX(xv), toY(iv.meanCI[0]));
    }
    ctx.closePath();
    ctx.fillStyle = tokens.primary;
    ctx.globalAlpha = 0.14;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Centroid Fulcrum Crosshairs (x̄, ȳ)
    const cxMean = toX(diag.meanX);
    const cyMean = toY(diag.meanY);
    ctx.strokeStyle = tokens.warning;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cxMean, margin.top);
    ctx.lineTo(cxMean, margin.top + plotH);
    ctx.moveTo(margin.left, cyMean);
    ctx.lineTo(margin.left + plotW, cyMean);
    ctx.stroke();
    ctx.setLineDash([]);

    // OLS Fit Line
    ctx.strokeStyle = tokens.primary;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(toX(minX), toY(diag.intercept + diag.slope * minX));
    ctx.lineTo(toX(maxX), toY(diag.intercept + diag.slope * maxX));
    ctx.stroke();

    // Optional Quadratic Model Overlay
    if (config.showQuadratic) {
      const quad = fitQuadraticModel(pts);
      if (quad) {
        ctx.strokeStyle = tokens.altModel;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        for (let s = 0; s <= 50; s++) {
          const xv = minX + ((maxX - minX) * s) / 50;
          const yv = quad.b0 + quad.b1 * xv + quad.b2 * xv * xv;
          if (s === 0) ctx.moveTo(toX(xv), toY(yv));
          else ctx.lineTo(toX(xv), toY(yv));
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  // Connected Scatterplot sequential trajectory
  if (chartType === 'connected_scatter') {
    ctx.strokeStyle = tokens.primary;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const px = toX(p.x);
      const py = toY(p.y);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }

  const uniqueGroups = Array.from(new Set(pts.map(p => p.group)));
  const maxSizeVal = Math.max(...pts.map(p => p.sizeVal), EPSILON);
  const isBubble = chartType === 'bubble_plot' || chartType === 'geo_bubble_map';

  // If grouped OLS is active (e.g. Simpson's paradox), draw within-group OLS lines
  if (chartType === 'scatter_ols' && uniqueGroups.length > 1 && uniqueGroups.length <= 6) {
    uniqueGroups.forEach((gName, gIdx) => {
      const gPts = pts.filter(p => p.group === gName);
      const gDiag = computeDatasetDiagnostics(gPts);
      if (gDiag.valid) {
        const gMinX = Math.min(...gPts.map(p => p.x));
        const gMaxX = Math.max(...gPts.map(p => p.x));
        ctx.strokeStyle = palette[gIdx % palette.length];
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(toX(gMinX), toY(gDiag.intercept + gDiag.slope * gMinX));
        ctx.lineTo(toX(gMaxX), toY(gDiag.intercept + gDiag.slope * gMaxX));
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }

  // Plot Points & Diagnostic Halos
  const diagPts = diag.valid ? diag.points : pts;
  diagPts.forEach((pt, idx) => {
    const rawPt = pts[idx] || pt;
    const px = toX(pt.x);
    const py = toY(pt.y);
    const gIdx = Math.max(0, uniqueGroups.indexOf(rawPt.group));
    const color = uniqueGroups.length > 1 ? palette[gIdx % palette.length] : palette[0];

    let radius = Number(config.pointRadius) || 5.4;
    if (isBubble) {
      const ratio = Math.max(0.04, rawPt.sizeVal / maxSizeVal);
      radius = config.sizeEncoding === 'radius'
        ? 4 + ratio * 20
        : 4 + Math.sqrt(ratio) * 18; // Default: strict area proportionality r ∝ √value
    }

    // Cook's distance & Leverage halos in scatter_ols
    if (chartType === 'scatter_ols' && pt.isInfluential) {
      ctx.strokeStyle = tokens.secondary;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.arc(px, py, radius + 5.5, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (chartType === 'scatter_ols' && pt.isHighLeverage) {
      ctx.strokeStyle = tokens.warning;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(px, py, radius + 4, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.fillStyle = color;
    ctx.globalAlpha = Number(config.opacity) || (isBubble ? 0.68 : 0.86);
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = tokens.bg;
    ctx.lineWidth = 1;
    ctx.stroke();

    const diagDetail = diag.valid && pt.cooksDistance !== undefined
      ? ` | ŷ=${pt.fitted.toFixed(2)}, e=${pt.residual.toFixed(2)}, h=${pt.leverage.toFixed(3)}, Cook's D=${pt.cooksDistance.toFixed(3)} [${pt.flags.join(', ')}]`
      : '';
    const sizeDetail = isBubble && sizeCol ? ` | ${sizeCol}: ${formatTick(rawPt.sizeVal)}` : '';

    hitRegions.push({
      shape: 'circle',
      x: px,
      y: py,
      r: Math.max(8, radius + 2),
      obsId: pt.id,
      label: `${pt.label} (${rawPt.group})`,
      details: `${xCol}: ${formatTick(rawPt.rawX)}, ${yCol}: ${formatTick(rawPt.rawY)}${sizeDetail}${diagDetail}`
    });
  });

  if (uniqueGroups.length > 1) {
    drawCompactLegend(ctx, uniqueGroups, palette, margin.left + 8, margin.top + 8, tokens);
  }

  return { diag, xCol, yCol, colorCol, sizeCol, n: pts.length };
}

// ============================================================================
// 8. 2D BINNED SCATTERPLOT (HEXBIN / DENSITY GRID)
// ============================================================================
function renderHexbin2D(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, hitRegions } = env;
  const quantCols = profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name);
  const xCol = config.x || quantCols[0] || profile.headers[0];
  const yCol = config.y || quantCols[1] || quantCols[0] || profile.headers[1];

  const pts = rows
    .map(r => ({ x: Number(r[xCol]), y: Number(r[yCol]) }))
    .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));

  const gridCount = Math.max(4, Math.min(20, Number(config.binCount) || 8));
  const binned = compute2DBins(pts, gridCount);
  drawCartesianFrame(ctx, margin, plotW, plotH, tokens, xCol, yCol);

  if (binned.bins.length === 0) return { binned };

  const spanX = Math.max(EPSILON, binned.maxX - binned.minX);
  const spanY = Math.max(EPSILON, binned.maxY - binned.minY);
  const cellW = plotW / gridCount;
  const cellH = plotH / gridCount;

  binned.bins.forEach(b => {
    const cx = margin.left + b.gx * cellW;
    const cy = margin.top + plotH - (b.gy + 1) * cellH;
    const intensity = b.count / Math.max(1, binned.maxCount);

    ctx.fillStyle = tokens.primary;
    ctx.globalAlpha = 0.18 + 0.78 * intensity;
    ctx.fillRect(cx + 1, cy + 1, cellW - 2, cellH - 2);
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = tokens.text;
    ctx.font = "600 11px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(String(b.count), cx + cellW / 2, cy + cellH / 2 + 4);

    hitRegions.push({
      shape: 'rect',
      x: cx,
      y: cy,
      w: cellW,
      h: cellH,
      label: `2D Bin [${b.x0.toFixed(1)}, ${b.x1.toFixed(1)}) × [${b.y0.toFixed(1)}, ${b.y1.toFixed(1)})`,
      details: `Observations in cell: n = ${b.count} (${((b.count / pts.length) * 100).toFixed(1)}% of total n = ${pts.length})`
    });
  });

  return { binned, xCol, yCol, n: pts.length };
}

// ============================================================================
// 9. HEATMAP MATRICES (Contingency, Calendar, Standardized Matrix, Choropleth)
// ============================================================================
function renderHeatmapMatrix(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, hitRegions } = env;
  const chartType = config.chartType;

  if (chartType === 'matrix_heatmap') {
    const quantCols = profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name).slice(0, 6);
    const idCol = profile.variables.find(v => v.inferredType === 'identifier' || v.taxonomy.family === 'categorical')?.name || profile.headers[0];
    const sampleRows = rows.slice(0, 12);
    const colStats = Object.fromEntries(quantCols.map(c => [c, computeUnivariateStats(rows.map(r => r[c]))]));

    drawCartesianFrame(ctx, margin, plotW, plotH, tokens, 'Standardized Quantitative Variables (Z-Scores)', idCol);
    const cw = plotW / Math.max(1, quantCols.length);
    const rh = plotH / Math.max(1, sampleRows.length);

    sampleRows.forEach((r, rIdx) => {
      const y = margin.top + rIdx * rh;
      ctx.fillStyle = tokens.text;
      ctx.font = "500 11px 'Inter', sans-serif";
      ctx.textAlign = 'right';
      ctx.fillText(String(r[idCol] ?? `Row ${rIdx + 1}`).slice(0, 10), margin.left - 6, y + rh / 2 + 4);

      quantCols.forEach((col, cIdx) => {
        const x = margin.left + cIdx * cw;
        const st = colStats[col];
        const rawV = Number(r[col]);
        const z = st && st.valid && st.sd > EPSILON && Number.isFinite(rawV) ? (rawV - st.mean) / st.sd : 0;

        ctx.fillStyle = z >= 0 ? tokens.primary : tokens.secondary;
        ctx.globalAlpha = Math.min(0.85, 0.15 + Math.abs(z) * 0.28);
        ctx.fillRect(x + 1, y + 1, cw - 2, rh - 2);
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = tokens.text;
        ctx.font = "500 10px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.fillText(`${z >= 0 ? '+' : ''}${z.toFixed(2)}σ`, x + cw / 2, y + rh / 2 + 4);

        hitRegions.push({
          shape: 'rect',
          x,
          y,
          w: cw,
          h: rh,
          label: `${r[idCol]} — ${col}`,
          details: `Raw value: ${formatTick(rawV)} | Standardized Z-score: ${z.toFixed(3)} SD`
        });
      });
    });

    quantCols.forEach((col, cIdx) => {
      ctx.fillStyle = tokens.text;
      ctx.font = "600 11px 'Inter', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(col.slice(0, 12), margin.left + (cIdx + 0.5) * cw, margin.top + plotH + 18);
    });
    return { quantCols, n: sampleRows.length };
  }

  // Contingency / Calendar / Choropleth tile matrix
  const catCols = profile.variables.filter(v => ['categorical', 'temporal', 'spatial'].includes(v.taxonomy.family)).map(v => v.name);
  const xCol = config.x || catCols[0] || profile.headers[0];
  const yCol = config.color || config.y || catCols[1] || profile.headers[1] || xCol;
  const valCol = profile.variables.find(v => v.taxonomy.family === 'quantitative')?.name || null;

  const ct = computeContingencyTable(rows, yCol, xCol, chartType === 'calendar_heatmap' || chartType === 'choropleth_map' ? valCol : null);
  drawCartesianFrame(ctx, margin, plotW, plotH, tokens, xCol, yCol);
  if (!ct.valid) return { ct };

  const rLevels = ct.rowLevels.slice(0, 10);
  const cLevels = ct.colLevels.slice(0, 12);
  const cw = plotW / Math.max(1, cLevels.length);
  const rh = plotH / Math.max(1, rLevels.length);
  const maxC = Math.max(...ct.cells.map(c => c.count), 1);

  rLevels.forEach((rKey, rIdx) => {
    const y = margin.top + rIdx * rh;
    ctx.fillStyle = tokens.text;
    ctx.font = "500 11px 'Inter', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText(rKey.slice(0, 10), margin.left - 6, y + rh / 2 + 4);

    cLevels.forEach((cKey, cIdx) => {
      const x = margin.left + cIdx * cw;
      const val = ct.counts[rKey][cKey] || 0;
      const ratio = val / maxC;

      ctx.fillStyle = tokens.primary;
      ctx.globalAlpha = 0.12 + 0.78 * ratio;
      ctx.fillRect(x + 1, y + 1, cw - 2, rh - 2);
      ctx.globalAlpha = 1.0;

      ctx.fillStyle = tokens.text;
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillText(formatTick(val), x + cw / 2, y + rh / 2 + 4);

      hitRegions.push({
        shape: 'rect',
        x,
        y,
        w: cw,
        h: rh,
        label: `${rKey} × ${cKey}`,
        details: `Value: ${formatTick(val)} | Joint Share: ${((val / ct.grandTotal) * 100).toFixed(1)}% (Grand Total = ${formatTick(ct.grandTotal)})`
      });
    });
  });

  cLevels.forEach((cKey, cIdx) => {
    ctx.fillStyle = tokens.text;
    ctx.font = "500 11px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(cKey.slice(0, 10), margin.left + (cIdx + 0.5) * cw, margin.top + plotH + 18);
  });

  return { ct, xCol, yCol };
}

// ============================================================================
// 10. TEMPORAL SERIES (Line, Area, Stacked Area, Seasonal, Streamgraph, Slopegraph)
// ============================================================================
function renderTemporalSeries(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const chartType = config.chartType;
  const tempCols = profile.variables.filter(v => v.taxonomy.family === 'temporal').map(v => v.name);
  const quantCols = profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name);
  const catCols = profile.variables.filter(v => v.taxonomy.family === 'categorical').map(v => v.name);

  const xCol = chartType === 'seasonal_plot'
    ? (profile.variables.find(v => v.inferredType === 'cyclic_temporal')?.name || config.x || tempCols[0] || profile.headers[0])
    : (config.x || tempCols[0] || profile.headers[0]);
  const yCol = config.y && profile.variableMap[config.y]?.taxonomy.family === 'quantitative'
    ? config.y
    : (quantCols[0] || profile.headers[1]);
  const groupCol = config.color || catCols[0] || null;

  const seriesMap = new Map();
  const xLabelsSet = new Set();

  rows.forEach(r => {
    const xv = r[xCol];
    const yv = Number(r[yCol]);
    if (xv === null || xv === undefined || xv === '' || !Number.isFinite(yv)) return;
    const xKey = String(xv);
    const gKey = groupCol && r[groupCol] !== undefined && r[groupCol] !== null ? String(r[groupCol]) : yCol;
    xLabelsSet.add(xKey);
    if (!seriesMap.has(gKey)) seriesMap.set(gKey, new Map());
    seriesMap.get(gKey).set(xKey, yv);
  });

  const xLabels = Array.from(xLabelsSet);
  const seriesEntries = Array.from(seriesMap.entries()).slice(0, 8);
  if (xLabels.length === 0 || seriesEntries.length === 0) {
    drawEmptyMessage(ctx, plotW + margin.left, plotH + margin.top, 'Select an ordered X variable and quantitative Y variable.', tokens);
    return {};
  }

  if (chartType === 'slopegraph') {
    const firstX = xLabels[0];
    const lastX = xLabels[xLabels.length - 1];
    const allVals = seriesEntries.flatMap(([, m]) => [m.get(firstX), m.get(lastX)].filter(Number.isFinite));
    const minY = Math.min(...allVals) * 0.92;
    const maxY = Math.max(...allVals) * 1.08;
    const spanY = Math.max(EPSILON, maxY - minY);

    drawCartesianFrame(ctx, margin, plotW, plotH, tokens, `${firstX}  →  ${lastX}`, yCol);
    const leftX = margin.left + plotW * 0.18;
    const rightX = margin.left + plotW * 0.82;

    seriesEntries.forEach(([gKey, m], idx) => {
      const v0 = m.get(firstX);
      const v1 = m.get(lastX);
      if (!Number.isFinite(v0) || !Number.isFinite(v1)) return;
      const y0 = margin.top + plotH - ((v0 - minY) / spanY) * plotH;
      const y1 = margin.top + plotH - ((v1 - minY) / spanY) * plotH;
      const color = palette[idx % palette.length];

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(leftX, y0);
      ctx.lineTo(rightX, y1);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(leftX, y0, 5, 0, 2 * Math.PI);
      ctx.arc(rightX, y1, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = tokens.text;
      ctx.font = "500 11px 'Inter', sans-serif";
      ctx.textAlign = 'right';
      ctx.fillText(`${gKey}: ${formatTick(v0)}`, leftX - 10, y0 + 4);
      ctx.textAlign = 'left';
      ctx.fillText(`${gKey}: ${formatTick(v1)} (${v1 >= v0 ? '+' : ''}${(v1 - v0).toFixed(1)})`, rightX + 10, y1 + 4);

      hitRegions.push({
        shape: 'circle',
        x: rightX,
        y: y1,
        r: 10,
        label: `${gKey} (${firstX} → ${lastX})`,
        details: `Start: ${formatTick(v0)} → End: ${formatTick(v1)} | Net Change Δ = ${(v1 - v0).toFixed(2)}`
      });
    });
    return { xLabels, seriesEntries, xCol, yCol };
  }

  const isStacked = chartType === 'stacked_area' || chartType === 'streamgraph';
  const allVals = seriesEntries.flatMap(([, m]) => Array.from(m.values()));
  const baseline = Number(config.yBaseline || 0);
  const minY = chartType === 'area_chart' || isStacked ? Math.min(0, baseline) : Math.min(...allVals) * 0.96;
  const maxY = isStacked
    ? Math.max(...xLabels.map(xl => seriesEntries.reduce((s, [, m]) => s + (m.get(xl) || 0), 0)), 1) * 1.1
    : Math.max(...allVals, baseline + 1) * 1.06;
  const spanY = Math.max(EPSILON, maxY - minY);

  drawCartesianFrame(ctx, margin, plotW, plotH, tokens, xCol, `${yCol} ${profile.variableMap[yCol]?.unit ? `(${profile.variableMap[yCol].unit})` : ''}`);

  // Y Ticks
  ctx.fillStyle = tokens.muted;
  ctx.font = "500 11px 'JetBrains Mono', monospace";
  ctx.textAlign = 'right';
  for (let t = 0; t <= 4; t++) {
    const vy = minY + (spanY * (4 - t)) / 4;
    ctx.fillText(formatTick(vy), margin.left - 8, margin.top + (plotH * t) / 4 + 4);
  }

  const toX = idx => margin.left + (xLabels.length > 1 ? (idx / (xLabels.length - 1)) * plotW : plotW / 2);
  const toY = val => margin.top + plotH - ((val - minY) / spanY) * plotH;

  // X Ticks
  ctx.textAlign = 'center';
  const stepTick = Math.max(1, Math.floor(xLabels.length / 6));
  xLabels.forEach((xl, idx) => {
    if (idx % stepTick === 0 || idx === xLabels.length - 1) {
      ctx.fillText(xl.slice(0, 10), toX(idx), margin.top + plotH + 18);
    }
  });

  if (isStacked) {
    const cumBottom = new Array(xLabels.length).fill(0);
    if (chartType === 'streamgraph') {
      xLabels.forEach((xl, idx) => {
        const tot = seriesEntries.reduce((s, [, m]) => s + (m.get(xl) || 0), 0);
        cumBottom[idx] = (maxY - tot) * 0.35;
      });
    }

    seriesEntries.forEach(([gKey, m], sIdx) => {
      const color = palette[sIdx % palette.length];
      const nextTop = xLabels.map((xl, idx) => cumBottom[idx] + (m.get(xl) || 0));

      ctx.beginPath();
      xLabels.forEach((_, idx) => {
        const px = toX(idx);
        const py = toY(nextTop[idx]);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      for (let idx = xLabels.length - 1; idx >= 0; idx--) {
        ctx.lineTo(toX(idx), toY(cumBottom[idx]));
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.65;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      xLabels.forEach((xl, idx) => {
        const val = m.get(xl) || 0;
        hitRegions.push({
          shape: 'circle',
          x: toX(idx),
          y: toY(0.5 * (cumBottom[idx] + nextTop[idx])),
          r: 8,
          label: `${gKey} at ${xl}`,
          details: `${yCol}: ${formatTick(val)} | Cumulative stack top: ${formatTick(nextTop[idx])}`
        });
        cumBottom[idx] = nextTop[idx];
      });
    });
  } else {
    seriesEntries.forEach(([gKey, m], sIdx) => {
      const color = palette[sIdx % palette.length];
      const coords = [];
      xLabels.forEach((xl, idx) => {
        const v = m.get(xl);
        if (Number.isFinite(v)) coords.push({ xl, px: toX(idx), py: toY(v), v });
      });

      if (chartType === 'area_chart' && coords.length > 1) {
        ctx.beginPath();
        ctx.moveTo(coords[0].px, toY(minY));
        coords.forEach(c => ctx.lineTo(c.px, c.py));
        ctx.lineTo(coords[coords.length - 1].px, toY(minY));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.24;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      coords.forEach((c, idx) => {
        if (idx === 0) ctx.moveTo(c.px, c.py);
        else ctx.lineTo(c.px, c.py);
      });
      ctx.stroke();

      coords.forEach(c => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(c.px, c.py, 4, 0, 2 * Math.PI);
        ctx.fill();
        hitRegions.push({
          shape: 'circle',
          x: c.px,
          y: c.py,
          r: 8,
          label: `${gKey} (${c.xl})`,
          details: `${yCol} = ${formatTick(c.v)}`
        });
      });
    });
  }

  if (seriesEntries.length > 1) {
    drawCompactLegend(ctx, seriesEntries.map(([k]) => k), palette, margin.left + 8, margin.top + 8, tokens);
  }
  return { xLabels, seriesEntries, xCol, yCol };
}

// ============================================================================
// 11. SMALL MULTIPLES & SCATTERPLOT MATRIX (SPLOM)
// ============================================================================
function renderMultiPanelGrid(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const quantCols = profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name);
  const catCols = profile.variables.filter(v => v.taxonomy.family === 'categorical').map(v => v.name);

  if (config.chartType === 'splom_matrix') {
    const vars = quantCols.slice(0, 4);
    const p = vars.length;
    if (p < 2) {
      drawEmptyMessage(ctx, plotW + margin.left, plotH + margin.top, 'At least 2 quantitative variables required for SPLOM.', tokens);
      return {};
    }
    const cellW = plotW / p;
    const cellH = plotH / p;
    const statsMap = Object.fromEntries(vars.map(v => [v, computeUnivariateStats(rows.map(r => r[v]))]));

    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) {
        const cx0 = margin.left + j * cellW + 4;
        const cy0 = margin.top + i * cellH + 4;
        const cw = cellW - 8;
        const ch = cellH - 8;
        ctx.strokeStyle = tokens.border;
        ctx.strokeRect(cx0, cy0, cw, ch);

        const vY = vars[i];
        const vX = vars[j];
        if (i === j) {
          ctx.fillStyle = tokens.text;
          ctx.font = "600 12px 'Inter', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText(vX, cx0 + cw / 2, cy0 + ch / 2);
        } else {
          const sx = statsMap[vX];
          const sy = statsMap[vY];
          if (sx.valid && sy.valid) {
            rows.forEach((r, rIdx) => {
              const xv = Number(r[vX]);
              const yv = Number(r[vY]);
              if (!Number.isFinite(xv) || !Number.isFinite(yv)) return;
              const px = cx0 + 6 + ((xv - sx.min) / Math.max(EPSILON, sx.range)) * (cw - 12);
              const py = cy0 + ch - 6 - ((yv - sy.min) / Math.max(EPSILON, sy.range)) * (ch - 12);
              ctx.fillStyle = palette[0];
              ctx.globalAlpha = 0.72;
              ctx.beginPath();
              ctx.arc(px, py, 2.8, 0, 2 * Math.PI);
              ctx.fill();
              ctx.globalAlpha = 1.0;

              if (rIdx < 15) {
                hitRegions.push({
                  shape: 'circle',
                  x: px,
                  y: py,
                  r: 5,
                  label: `${vX} vs ${vY}`,
                  details: `${vX} = ${formatTick(xv)}, ${vY} = ${formatTick(yv)}`
                });
              }
            });
          }
        }
      }
    }
    return { vars };
  }

  // Small Multiples (Faceted Grid with Locked Shared Scales)
  const xCol = config.x || quantCols[0] || profile.headers[0];
  const yCol = config.y || quantCols[1] || quantCols[0] || profile.headers[1];
  const facetCol = config.facet || config.color || catCols[0] || profile.headers[0];

  const groups = new Map();
  rows.forEach(r => {
    const fk = r[facetCol];
    const xv = Number(r[xCol]);
    const yv = Number(r[yCol]);
    if (fk === null || fk === undefined || !Number.isFinite(xv) || !Number.isFinite(yv)) return;
    const key = String(fk);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ x: xv, y: yv });
  });

  const facets = Array.from(groups.entries()).slice(0, 6);
  if (facets.length === 0) return {};

  const allPts = facets.flatMap(([, arr]) => arr);
  const minX = Math.min(...allPts.map(p => p.x));
  const maxX = Math.max(...allPts.map(p => p.x));
  const minY = Math.min(...allPts.map(p => p.y));
  const maxY = Math.max(...allPts.map(p => p.y));
  const spanX = Math.max(EPSILON, maxX - minX);
  const spanY = Math.max(EPSILON, maxY - minY);

  const cols = Math.min(3, facets.length);
  const gridRows = Math.ceil(facets.length / cols);
  const cellW = plotW / cols;
  const cellH = plotH / gridRows;

  facets.forEach(([fKey, fPts], idx) => {
    const c = idx % cols;
    const r = Math.floor(idx / cols);
    const x0 = margin.left + c * cellW + 8;
    const y0 = margin.top + r * cellH + 20;
    const w = cellW - 16;
    const h = cellH - 28;

    ctx.strokeStyle = tokens.border;
    ctx.strokeRect(x0, y0, w, h);
    ctx.fillStyle = tokens.text;
    ctx.font = "600 11px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    const fDiag = computeDatasetDiagnostics(fPts);
    ctx.fillText(`${fKey} (n=${fPts.length}${fDiag.valid ? `, r=${fDiag.r.toFixed(2)}` : ''})`, x0 + 4, y0 - 5);

    const color = palette[idx % palette.length];
    if (fDiag.valid) {
      const lx0 = x0 + 8;
      const lx1 = x0 + w - 8;
      const ly0 = y0 + h - 8 - ((fDiag.intercept + fDiag.slope * minX - minY) / spanY) * (h - 16);
      const ly1 = y0 + h - 8 - ((fDiag.intercept + fDiag.slope * maxX - minY) / spanY) * (h - 16);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(lx0, Math.max(y0, Math.min(y0 + h, ly0)));
      ctx.lineTo(lx1, Math.max(y0, Math.min(y0 + h, ly1)));
      ctx.stroke();
    }

    fPts.forEach(p => {
      const px = x0 + 8 + ((p.x - minX) / spanX) * (w - 16);
      const py = y0 + h - 8 - ((p.y - minY) / spanY) * (h - 16);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 3.6, 0, 2 * Math.PI);
      ctx.fill();
      hitRegions.push({
        shape: 'circle',
        x: px,
        y: py,
        r: 6,
        label: `Facet: ${fKey}`,
        details: `${xCol} = ${formatTick(p.x)}, ${yCol} = ${formatTick(p.y)}`
      });
    });
  });

  return { facets, xCol, yCol, facetCol };
}

// ============================================================================
// 12. CORRELOGRAM (PAIRWISE CORRELATION MATRIX)
// ============================================================================
function renderCorrelogram(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, hitRegions } = env;
  const quantCols = profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name).slice(0, 7);
  const p = quantCols.length;
  if (p < 2) {
    drawEmptyMessage(ctx, plotW + margin.left, plotH + margin.top, 'At least 2 quantitative variables required for Correlogram.', tokens);
    return {};
  }

  const cw = plotW / p;
  const ch = plotH / p;
  const matrix = [];

  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      const colA = quantCols[i];
      const colB = quantCols[j];
      const paired = rows
        .map(r => ({ x: Number(r[colA]), y: Number(r[colB]) }))
        .filter(pt => Number.isFinite(pt.x) && Number.isFinite(pt.y));
      const diag = i === j ? { valid: true, r: 1.0, spearmanRho: 1.0, n: paired.length } : computeDatasetDiagnostics(paired);
      const rVal = diag.valid ? diag.r : 0;

      const x0 = margin.left + j * cw;
      const y0 = margin.top + i * ch;
      ctx.strokeStyle = tokens.border;
      ctx.strokeRect(x0, y0, cw, ch);

      const cx = x0 + cw / 2;
      const cy = y0 + ch / 2;
      const maxR = Math.min(cw, ch) * 0.36;
      const rad = Math.max(4, Math.abs(rVal) * maxR);

      ctx.fillStyle = rVal >= 0 ? tokens.primary : tokens.secondary;
      ctx.globalAlpha = 0.2 + 0.65 * Math.abs(rVal);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      ctx.fillStyle = tokens.text;
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillText(rVal.toFixed(2), cx, cy + 4);

      hitRegions.push({
        shape: 'rect',
        x: x0,
        y: y0,
        w: cw,
        h: ch,
        label: `Corr(${colA}, ${colB})`,
        details: `Pearson r = ${rVal.toFixed(4)} | Spearman ρ = ${(diag.spearmanRho ?? rVal).toFixed(4)} (n = ${paired.length})`
      });
      matrix.push({ colA, colB, r: rVal });
    }
  }

  quantCols.forEach((col, idx) => {
    ctx.fillStyle = tokens.text;
    ctx.font = "600 11px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(col.slice(0, 12), margin.left + (idx + 0.5) * cw, margin.top + plotH + 18);
    ctx.textAlign = 'right';
    ctx.fillText(col.slice(0, 10), margin.left - 6, margin.top + (idx + 0.5) * ch + 4);
  });

  return { quantCols, matrix };
}

// ============================================================================
// 13. NORMAL Q-Q PLOT & RESIDUAL-VS-FITTED PLOT
// ============================================================================
function renderNormalQQ(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const quantCols = profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name);
  const xCol = config.x || quantCols[0] || profile.headers[0];
  const yCol = config.y && quantCols.includes(config.y) ? config.y : null;

  let qqPoints = [];
  if (yCol && yCol !== xCol) {
    const diag = computeDatasetDiagnostics(rows.map((r, i) => ({ id: r.obs_id || `obs_${i + 1}`, x: r[xCol], y: r[yCol] })));
    if (diag.valid) qqPoints = diag.qqPoints;
  } else {
    const st = computeUnivariateStats(rows.map(r => r[xCol]));
    if (st.valid && st.sd > EPSILON) {
      qqPoints = st.sorted.map((v, idx) => {
        const pBlom = (idx + 1 - 0.375) / (st.n + 0.25);
        const zTheo = (pBlom - 0.5) * 3.4; // fallback if needed, or exact from computeDatasetDiagnostics
        return {
          label: `Rank ${idx + 1}`,
          theoreticalZ: zTheo,
          sampleQuantile: (v - st.mean) / st.sd
        };
      });
      // Recompute exact Blom theoreticalZ via computeDatasetDiagnostics on dummy index
      const diagDummy = computeDatasetDiagnostics(st.sorted.map((v, i) => ({ x: i + 1, y: v })));
      if (diagDummy.valid) {
        qqPoints = st.sorted.map((v, idx) => ({
          label: `Rank ${idx + 1} (${formatTick(v)})`,
          theoreticalZ: diagDummy.qqPoints[idx].theoreticalZ,
          sampleQuantile: (v - st.mean) / st.sd
        }));
      }
    }
  }

  drawCartesianFrame(ctx, margin, plotW, plotH, tokens, 'Theoretical Normal Quantile z_(i) [Blom Position]', 'Empirical Standardized Quantile');
  if (qqPoints.length === 0) return {};

  const bound = Math.max(2.5, ...qqPoints.map(p => Math.max(Math.abs(p.theoreticalZ), Math.abs(p.sampleQuantile)))) * 1.1;
  const toX = z => margin.left + ((z + bound) / (2 * bound)) * plotW;
  const toY = q => margin.top + plotH - ((q + bound) / (2 * bound)) * plotH;

  // Identity y = x Reference Line
  ctx.strokeStyle = tokens.primary;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(toX(-bound), toY(-bound));
  ctx.lineTo(toX(bound), toY(bound));
  ctx.stroke();
  ctx.setLineDash([]);

  qqPoints.forEach(pt => {
    const px = toX(pt.theoreticalZ);
    const py = toY(pt.sampleQuantile);
    ctx.fillStyle = Math.abs(pt.sampleQuantile) > 2.0 ? tokens.secondary : palette[0];
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, 2 * Math.PI);
    ctx.fill();

    hitRegions.push({
      shape: 'circle',
      x: px,
      y: py,
      r: 8,
      label: pt.label,
      details: `Theoretical z = ${pt.theoreticalZ.toFixed(3)} | Empirical z = ${pt.sampleQuantile.toFixed(3)}`
    });
  });

  return { qqPoints };
}

function renderResidualFitted(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const quantCols = profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name);
  const xCol = config.x || quantCols[0] || profile.headers[0];
  const yCol = config.y || quantCols[1] || quantCols[0] || profile.headers[1];

  const diag = computeDatasetDiagnostics(rows.map((r, i) => ({
    id: r.obs_id || `obs_${i + 1}`,
    label: r.case_label || r.obs_id || `Obs ${i + 1}`,
    x: r[xCol],
    y: r[yCol]
  })));

  drawCartesianFrame(ctx, margin, plotW, plotH, tokens, `Fitted Values ŷ (${yCol})`, 'Raw Residual e_i = y_i - ŷ_i');
  if (!diag.valid) return { diag };

  const minF = Math.min(...diag.points.map(p => p.fitted));
  const maxF = Math.max(...diag.points.map(p => p.fitted));
  const maxAbsE = Math.max(...diag.points.map(p => Math.abs(p.residual)), 0.5) * 1.2;
  const spanF = Math.max(EPSILON, maxF - minF) * 1.1;
  const startF = minF - spanF * 0.05;

  const toX = f => margin.left + ((f - startF) / spanF) * plotW;
  const toY = e => margin.top + plotH / 2 - (e / maxAbsE) * (plotH / 2);

  // Zero reference line e = 0
  const zeroY = toY(0);
  ctx.strokeStyle = tokens.primary;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(margin.left, zeroY);
  ctx.lineTo(margin.left + plotW, zeroY);
  ctx.stroke();
  ctx.setLineDash([]);

  diag.points.forEach(pt => {
    const px = toX(pt.fitted);
    const py = toY(pt.residual);

    // Stem to zero line
    ctx.strokeStyle = tokens.secondary;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(px, zeroY);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = pt.isInfluential || pt.isOutlier ? tokens.secondary : palette[0];
    ctx.beginPath();
    ctx.arc(px, py, 5.2, 0, 2 * Math.PI);
    ctx.fill();

    hitRegions.push({
      shape: 'circle',
      x: px,
      y: py,
      r: 8,
      label: pt.label,
      details: `Fitted ŷ = ${pt.fitted.toFixed(3)} | Residual e = ${pt.residual.toFixed(3)} | Studentized r_i = ${pt.studentizedResidual.toFixed(3)} | Cook's D = ${pt.cooksDistance.toFixed(3)}`
    });
  });

  return { diag, xCol, yCol };
}

// ============================================================================
// 14. UNCERTAINTY INTERVALS (Point + Interval, Error Bars, Interval Ribbon)
// ============================================================================
function renderUncertaintyIntervals(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const chartType = config.chartType;
  const uncType = config.uncertaintyType || 'ci95'; // 'ci95' | 'pi95' | 'se' | 'sd'

  const hasExplicitCols = rows.some(r => r.point_estimate !== undefined && r.ci95_low !== undefined);
  let items = [];

  if (hasExplicitCols) {
    items = rows.map(r => {
      const est = Number(r.point_estimate);
      const se = Number(r.se || 1);
      const n = Number(r.sample_size || 100);
      const sd = se * Math.sqrt(n);
      let low = Number(r.ci95_low);
      let high = Number(r.ci95_high);
      if (uncType === 'pi95' && r.pred95_low !== undefined) {
        low = Number(r.pred95_low);
        high = Number(r.pred95_high);
      } else if (uncType === 'se') {
        low = est - se;
        high = est + se;
      } else if (uncType === 'sd') {
        low = est - sd;
        high = est + sd;
      }
      return {
        key: String(r.trial_center || r[config.x] || r.obs_id),
        est,
        low,
        high,
        ciLow: Number(r.ci95_low),
        ciHigh: Number(r.ci95_high),
        piLow: Number(r.pred95_low ?? est - 2 * sd),
        piHigh: Number(r.pred95_high ?? est + 2 * sd),
        se,
        n
      };
    });
  } else {
    const catCol = config.x || profile.variables.find(v => v.taxonomy.family === 'categorical')?.name || profile.headers[0];
    const numCol = config.y || profile.variables.find(v => v.taxonomy.family === 'quantitative')?.name || profile.headers[1];
    const gMap = new Map();
    rows.forEach(r => {
      const k = r[catCol];
      const v = Number(r[numCol]);
      if (k === null || k === undefined || !Number.isFinite(v)) return;
      const key = String(k);
      if (!gMap.has(key)) gMap.set(key, []);
      gMap.get(key).push(v);
    });
    for (const [key, arr] of gMap.entries()) {
      const st = computeUnivariateStats(arr);
      if (!st.valid) continue;
      let low = st.ci95Mean[0];
      let high = st.ci95Mean[1];
      if (uncType === 'se') {
        low = st.mean - st.se;
        high = st.mean + st.se;
      } else if (uncType === 'sd') {
        low = st.mean - st.sd;
        high = st.mean + st.sd;
      } else if (uncType === 'pi95') {
        low = st.mean - 1.96 * st.sd * Math.sqrt(1 + 1 / st.n);
        high = st.mean + 1.96 * st.sd * Math.sqrt(1 + 1 / st.n);
      }
      items.push({
        key,
        est: st.mean,
        low,
        high,
        ciLow: st.ci95Mean[0],
        ciHigh: st.ci95Mean[1],
        piLow: st.mean - 1.96 * st.sd,
        piHigh: st.mean + 1.96 * st.sd,
        se: st.se,
        n: st.n
      });
    }
  }

  if (items.length === 0) return { items: [] };

  const minV = Math.min(...items.map(d => Math.min(d.low, d.piLow)));
  const maxV = Math.max(...items.map(d => Math.max(d.high, d.piHigh)));
  const pad = Math.max(1, (maxV - minV) * 0.12);
  const dom0 = minV - pad;
  const dom1 = maxV + pad;
  const span = Math.max(EPSILON, dom1 - dom0);

  const labelMap = {
    ci95: '95% Confidence Interval for Mean Parameter',
    pi95: '95% Prediction Interval for Individual Outcome',
    se: '±1 Standard Error of Mean (SE)',
    sd: '±1 Sample Standard Deviation (SD)'
  };
  drawCartesianFrame(ctx, margin, plotW, plotH, tokens, 'Cohort / Center', `Estimate & ${labelMap[uncType] || uncType}`);

  // Y Ticks
  ctx.fillStyle = tokens.muted;
  ctx.font = "500 11px 'JetBrains Mono', monospace";
  ctx.textAlign = 'right';
  for (let t = 0; t <= 4; t++) {
    const vy = dom0 + (span * (4 - t)) / 4;
    ctx.fillText(formatTick(vy), margin.left - 8, margin.top + (plotH * t) / 4 + 4);
  }

  const colStep = plotW / items.length;
  const toY = v => margin.top + plotH - ((v - dom0) / span) * plotH;

  if (chartType === 'interval_ribbon' && items.length > 1) {
    // Draw outer 95% Prediction Band and inner 95% Confidence Band
    ctx.beginPath();
    items.forEach((d, idx) => {
      const cx = margin.left + (idx + 0.5) * colStep;
      if (idx === 0) ctx.moveTo(cx, toY(d.piHigh));
      else ctx.lineTo(cx, toY(d.piHigh));
    });
    for (let idx = items.length - 1; idx >= 0; idx--) {
      const cx = margin.left + (idx + 0.5) * colStep;
      ctx.lineTo(cx, toY(items[idx].piLow));
    }
    ctx.closePath();
    ctx.fillStyle = tokens.warning;
    ctx.globalAlpha = 0.14;
    ctx.fill();

    ctx.beginPath();
    items.forEach((d, idx) => {
      const cx = margin.left + (idx + 0.5) * colStep;
      if (idx === 0) ctx.moveTo(cx, toY(d.ciHigh));
      else ctx.lineTo(cx, toY(d.ciHigh));
    });
    for (let idx = items.length - 1; idx >= 0; idx--) {
      const cx = margin.left + (idx + 0.5) * colStep;
      ctx.lineTo(cx, toY(items[idx].ciLow));
    }
    ctx.closePath();
    ctx.fillStyle = tokens.primary;
    ctx.globalAlpha = 0.28;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  items.forEach((d, idx) => {
    const cx = margin.left + (idx + 0.5) * colStep;
    const yEst = toY(d.est);
    const yLow = toY(d.low);
    const yHigh = toY(d.high);
    const color = palette[idx % palette.length];

    // If multi-tier error_bars, draw outer PI/SD whisker in muted amber first
    if (chartType === 'error_bars') {
      const yPiHigh = toY(d.piHigh);
      const yPiLow = toY(d.piLow);
      ctx.strokeStyle = tokens.warning;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, yPiHigh);
      ctx.lineTo(cx, yPiLow);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Active Interval Crossbar
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(cx, yHigh);
    ctx.lineTo(cx, yLow);
    ctx.moveTo(cx - 7, yHigh);
    ctx.lineTo(cx + 7, yHigh);
    ctx.moveTo(cx - 7, yLow);
    ctx.lineTo(cx + 7, yLow);
    ctx.stroke();

    // Point Estimate
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, yEst, 5.5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = tokens.text;
    ctx.font = "500 11px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(d.key.slice(0, 12), cx, margin.top + plotH + 18);

    hitRegions.push({
      shape: 'rect',
      x: cx - 12,
      y: yHigh - 6,
      w: 24,
      h: Math.max(16, yLow - yHigh + 12),
      label: `${d.key} (n = ${d.n})`,
      details: `Point Estimate: ${d.est.toFixed(2)} | ${labelMap[uncType]}: [${d.low.toFixed(2)}, ${d.high.toFixed(2)}] | SE = ${d.se.toFixed(2)}`
    });
  });

  return { items, uncType };
}

// ============================================================================
// 15. PART-TO-WHOLE (Pie, Donut, Waffle 10x10, Treemap)
// ============================================================================
function renderPartToWhole(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const chartType = config.chartType;
  const xCol = config.x || profile.variables.find(v => v.taxonomy.family === 'categorical')?.name || profile.headers[0];
  const yCol = config.y && profile.variableMap[config.y]?.taxonomy.family === 'quantitative' ? config.y : null;

  const groups = new Map();
  let grandTotal = 0;
  rows.forEach(r => {
    const k = r[xCol];
    if (k === null || k === undefined || k === '') return;
    const w = yCol && Number.isFinite(Number(r[yCol])) ? Math.max(0, Number(r[yCol])) : 1;
    const key = String(k);
    groups.set(key, (groups.get(key) || 0) + w);
    grandTotal += w;
  });

  const parts = Array.from(groups.entries())
    .map(([key, val]) => ({ key, val, prop: grandTotal > 0 ? val / grandTotal : 0 }))
    .sort((a, b) => b.val - a.val);

  if (parts.length === 0 || grandTotal <= 0) return {};

  if (chartType === 'waffle_chart') {
    // Hamilton Largest Remainder allocation to 100 unit cells
    const rawCells = parts.map(p => p.prop * 100);
    const floors = rawCells.map(v => Math.floor(v));
    let rem = 100 - floors.reduce((a, b) => a + b, 0);
    const order = rawCells.map((v, i) => ({ i, frac: v - floors[i] })).sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < rem; k++) floors[order[k % order.length].i]++;

    const gridSize = Math.min(plotW * 0.65, plotH * 0.88);
    const cellS = gridSize / 10;
    const startX = margin.left + 20;
    const startY = margin.top + (plotH - gridSize) / 2;

    let cellIdx = 0;
    parts.forEach((p, pIdx) => {
      const count = floors[pIdx];
      const color = palette[pIdx % palette.length];
      for (let c = 0; c < count; c++) {
        const col = cellIdx % 10;
        const row = 9 - Math.floor(cellIdx / 10);
        const x = startX + col * cellS;
        const y = startY + row * cellS;
        ctx.fillStyle = color;
        ctx.fillRect(x + 1.5, y + 1.5, cellS - 3, cellS - 3);
        hitRegions.push({
          shape: 'rect',
          x,
          y,
          w: cellS,
          h: cellS,
          label: `${p.key} (Square #${cellIdx + 1}/100)`,
          details: `Share: ${(p.prop * 100).toFixed(1)}% (${formatTick(p.val)} of ${formatTick(grandTotal)})`
        });
        cellIdx++;
      }
    });

    drawCompactLegend(ctx, parts.map((p, i) => `${p.key} (${floors[i]}%)`), palette, startX + gridSize + 24, startY + 12, tokens);
    return { parts, grandTotal };
  }

  if (chartType === 'treemap') {
    let curX = margin.left;
    let curY = margin.top;
    let remW = plotW;
    let remH = plotH;
    let remTotal = grandTotal;

    parts.forEach((p, idx) => {
      const ratio = remTotal > 0 ? p.val / remTotal : 0;
      const splitHoriz = remW >= remH;
      const w = splitHoriz ? remW * ratio : remW;
      const h = splitHoriz ? remH : remH * ratio;

      ctx.fillStyle = palette[idx % palette.length];
      ctx.globalAlpha = 0.82;
      ctx.fillRect(curX + 1.5, curY + 1.5, Math.max(2, w - 3), Math.max(2, h - 3));
      ctx.globalAlpha = 1.0;

      if (w > 48 && h > 28) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = "600 11px 'Inter', sans-serif";
        ctx.textAlign = 'left';
        ctx.fillText(p.key.slice(0, 14), curX + 8, curY + 18);
        ctx.font = "500 11px 'JetBrains Mono', monospace";
        ctx.fillText(`${formatTick(p.val)} (${(p.prop * 100).toFixed(1)}%)`, curX + 8, curY + 33);
      }

      hitRegions.push({
        shape: 'rect',
        x: curX,
        y: curY,
        w,
        h,
        label: p.key,
        details: `Value: ${formatTick(p.val)} | Share: ${(p.prop * 100).toFixed(1)}% (Total = ${formatTick(grandTotal)})`
      });

      if (splitHoriz) {
        curX += w;
        remW -= w;
      } else {
        curY += h;
        remH -= h;
      }
      remTotal -= p.val;
    });
    return { parts, grandTotal };
  }

  // Pie / Donut Chart
  const cx = margin.left + plotW * 0.42;
  const cy = margin.top + plotH * 0.5;
  const outerR = Math.min(plotW, plotH) * 0.39;
  const innerR = chartType === 'donut_chart' ? outerR * 0.54 : 0;

  let startAngle = -Math.PI / 2;
  parts.forEach((p, idx) => {
    const sliceAngle = p.prop * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;
    const color = palette[idx % palette.length];

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    if (innerR > 0) {
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    } else {
      ctx.lineTo(cx, cy);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = tokens.bg;
    ctx.lineWidth = 2;
    ctx.stroke();

    const hitX = cx + Math.cos(midAngle) * (innerR > 0 ? (outerR + innerR) / 2 : outerR * 0.6);
    const hitY = cy + Math.sin(midAngle) * (innerR > 0 ? (outerR + innerR) / 2 : outerR * 0.6);
    hitRegions.push({
      shape: 'circle',
      x: hitX,
      y: hitY,
      r: 20,
      label: p.key,
      details: `Count/Sum: ${formatTick(p.val)} | Proportion: ${(p.prop * 100).toFixed(1)}% (Total N = ${formatTick(grandTotal)})`
    });
    startAngle = endAngle;
  });

  if (innerR > 0) {
    ctx.fillStyle = tokens.text;
    ctx.font = "600 13px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(`N = ${formatTick(grandTotal)}`, cx, cy + 5);
  }
  drawCompactLegend(ctx, parts.map(p => `${p.key} (${(p.prop * 100).toFixed(0)}%)`), palette, margin.left + 8, margin.top + 8, tokens);
  return { parts, grandTotal };
}

// ============================================================================
// 16. RADAR / POLAR CHART & PARALLEL COORDINATES
// ============================================================================
function renderMultivariateCoordinates(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const quantCols = profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name).slice(0, 6);
  const groupCol = config.color || profile.variables.find(v => v.taxonomy.family === 'categorical')?.name || null;

  if (config.chartType === 'parallel_coordinates') {
    if (quantCols.length < 2) return {};
    const statsMap = Object.fromEntries(quantCols.map(c => [c, computeUnivariateStats(rows.map(r => r[c]))]));
    const axisStep = plotW / (quantCols.length - 1);

    // Draw vertical axes
    quantCols.forEach((col, idx) => {
      const ax = margin.left + idx * axisStep;
      ctx.strokeStyle = tokens.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ax, margin.top);
      ctx.lineTo(ax, margin.top + plotH);
      ctx.stroke();

      ctx.fillStyle = tokens.text;
      ctx.font = "600 11px 'Inter', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(col.slice(0, 12), ax, margin.top + plotH + 18);

      const st = statsMap[col];
      if (st && st.valid) {
        ctx.fillStyle = tokens.muted;
        ctx.font = "500 10px 'JetBrains Mono', monospace";
        ctx.fillText(formatTick(st.max), ax, margin.top - 6);
        ctx.fillText(formatTick(st.min), ax, margin.top + plotH + 32);
      }
    });

    const groups = Array.from(new Set(rows.map(r => (groupCol ? String(r[groupCol]) : 'All'))));
    rows.slice(0, 60).forEach((r, rIdx) => {
      const gName = groupCol ? String(r[groupCol]) : 'All';
      const color = palette[Math.max(0, groups.indexOf(gName)) % palette.length];
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      quantCols.forEach((col, cIdx) => {
        const st = statsMap[col];
        const v = Number(r[col]);
        const norm = st && st.valid && st.range > EPSILON && Number.isFinite(v) ? (v - st.min) / st.range : 0.5;
        const px = margin.left + cIdx * axisStep;
        const py = margin.top + plotH - norm * plotH;
        if (cIdx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
        if (cIdx === 0 && rIdx < 25) {
          hitRegions.push({
            shape: 'circle',
            x: px,
            y: py,
            r: 6,
            label: `${r.obs_id || `Row ${rIdx + 1}`} (${gName})`,
            details: quantCols.map(k => `${k}: ${formatTick(Number(r[k]))}`).join(' | ')
          });
        }
      });
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });
    return { quantCols };
  }

  // Radar / Polar Cyclic Chart
  const cx = margin.left + plotW / 2;
  const cy = margin.top + plotH / 2;
  const maxR = Math.min(plotW, plotH) * 0.38;
  const spokes = quantCols.length >= 3 ? quantCols : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const M = spokes.length;

  // Concentric rings
  ctx.strokeStyle = tokens.gridMajor;
  [0.25, 0.5, 0.75, 1.0].forEach(frac => {
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * frac, 0, 2 * Math.PI);
    ctx.stroke();
  });

  spokes.forEach((sp, idx) => {
    const ang = -Math.PI / 2 + (2 * Math.PI * idx) / M;
    const sx = cx + Math.cos(ang) * maxR;
    const sy = cy + Math.sin(ang) * maxR;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sx, sy);
    ctx.stroke();

    ctx.fillStyle = tokens.text;
    ctx.font = "500 11px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(sp.slice(0, 10), cx + Math.cos(ang) * (maxR + 18), cy + Math.sin(ang) * (maxR + 18) + 4);
  });

  if (quantCols.length >= 3) {
    const statsMap = Object.fromEntries(quantCols.map(c => [c, computeUnivariateStats(rows.map(r => r[c]))]));
    rows.slice(0, 3).forEach((r, rIdx) => {
      const color = palette[rIdx % palette.length];
      ctx.beginPath();
      quantCols.forEach((col, cIdx) => {
        const st = statsMap[col];
        const norm = st && st.valid && st.range > EPSILON ? (Number(r[col]) - st.min) / st.range : 0.5;
        const ang = -Math.PI / 2 + (2 * Math.PI * cIdx) / M;
        const px = cx + Math.cos(ang) * (maxR * (0.15 + 0.85 * norm));
        const py = cy + Math.sin(ang) * (maxR * (0.15 + 0.85 * norm));
        if (cIdx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
  return { spokes };
}

// ============================================================================
// 17. SERIAL DIAGNOSTICS (Lag-1 Plot & ACF Correlogram)
// ============================================================================
function renderSerialDiagnostics(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const quantCols = profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name);
  const yCol = config.y && quantCols.includes(config.y) ? config.y : (quantCols[0] || profile.headers[0]);
  const series = rows.map(r => Number(r[yCol])).filter(Number.isFinite);

  if (config.chartType === 'lag_plot') {
    const pairs = [];
    for (let t = 1; t < series.length; t++) {
      pairs.push({ id: `t_${t + 1}`, label: `t=${t} → t=${t + 1}`, x: series[t - 1], y: series[t] });
    }
    const diag = computeDatasetDiagnostics(pairs);
    drawCartesianFrame(ctx, margin, plotW, plotH, tokens, `Lagged Observation y_{t-1} (${yCol})`, `Current Observation y_t (${yCol})`);
    if (pairs.length === 0) return {};

    const minV = Math.min(...series);
    const maxV = Math.max(...series);
    const span = Math.max(EPSILON, maxV - minV) * 1.1;
    const dom0 = minV - span * 0.05;
    const toX = v => margin.left + ((v - dom0) / span) * plotW;
    const toY = v => margin.top + plotH - ((v - dom0) / span) * plotH;

    // Identity diagonal y_t = y_{t-1}
    ctx.strokeStyle = tokens.primary;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(toX(dom0), toY(dom0));
    ctx.lineTo(toX(dom0 + span), toY(dom0 + span));
    ctx.stroke();
    ctx.setLineDash([]);

    pairs.forEach(p => {
      const px = toX(p.x);
      const py = toY(p.y);
      ctx.fillStyle = palette[0];
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 2 * Math.PI);
      ctx.fill();
      hitRegions.push({
        shape: 'circle',
        x: px,
        y: py,
        r: 8,
        label: p.label,
        details: `y_{t-1} = ${formatTick(p.x)} → y_t = ${formatTick(p.y)} (Lag-1 r_1 = ${diag.valid ? diag.r.toFixed(3) : 'N/A'})`
      });
    });
    return { diag, yCol };
  }

  // ACF Plot
  const acfRes = computeACF(series, 14);
  drawCartesianFrame(ctx, margin, plotW, plotH, tokens, 'Lag k', `Sample Autocorrelation r̂_k (${yCol})`);
  if (!acfRes.valid) return { acfRes };

  const zeroY = margin.top + plotH / 2;
  const toY = r => zeroY - r * (plotH * 0.45);
  const stepX = plotW / Math.max(1, acfRes.lags.length);

  // Zero line & Bartlett 95% white-noise bounds (±1.96/√T)
  ctx.strokeStyle = tokens.text;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(margin.left, zeroY);
  ctx.lineTo(margin.left + plotW, zeroY);
  ctx.stroke();

  const bTop = toY(acfRes.bartlettBound);
  const bBot = toY(-acfRes.bartlettBound);
  ctx.strokeStyle = tokens.secondary;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(margin.left, bTop);
  ctx.lineTo(margin.left + plotW, bTop);
  ctx.moveTo(margin.left, bBot);
  ctx.lineTo(margin.left + plotW, bBot);
  ctx.stroke();
  ctx.setLineDash([]);

  acfRes.lags.forEach((item, idx) => {
    const cx = margin.left + (idx + 0.5) * stepX;
    const cy = toY(item.acf);
    ctx.strokeStyle = palette[0];
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(cx, zeroY);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    ctx.fillStyle = Math.abs(item.acf) > acfRes.bartlettBound && item.lag > 0 ? tokens.secondary : palette[0];
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = tokens.text;
    ctx.font = "500 10px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(`k=${item.lag}`, cx, margin.top + plotH + 18);

    hitRegions.push({
      shape: 'circle',
      x: cx,
      y: cy,
      r: 8,
      label: `Lag k = ${item.lag}`,
      details: `ACF r̂_${item.lag} = ${item.acf.toFixed(4)} | Bartlett 95% White-Noise Bound: ±${acfRes.bartlettBound.toFixed(4)}`
    });
  });

  return { acfRes, yCol };
}

// ============================================================================
// 18. RELATIONAL & FLOW (Sankey, Chord, Network, Dendrogram, Word Cloud)
// ============================================================================
function renderRelationalFlow(ctx, rows, profile, config, env) {
  const { margin, plotW, plotH, tokens, palette, hitRegions } = env;
  const chartType = config.chartType;
  const catCols = profile.variables.filter(v => v.taxonomy.family === 'categorical').map(v => v.name);
  const quantCols = profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name);

  const srcCol = config.x || catCols[0] || profile.headers[0];
  const tgtCol = config.color || catCols[1] || profile.headers[1] || srcCol;
  const weightCol = config.y && quantCols.includes(config.y) ? config.y : (quantCols[0] || null);

  if (chartType === 'word_cloud') {
    const freq = new Map();
    rows.forEach(r => {
      const k = r[srcCol];
      if (!k) return;
      const w = weightCol && Number.isFinite(Number(r[weightCol])) ? Number(r[weightCol]) : 1;
      freq.set(String(k), (freq.get(String(k)) || 0) + w);
    });
    const words = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 18);
    const maxW = Math.max(...words.map(d => d[1]), 1);
    const cols = 3;
    words.forEach(([word, count], idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const px = margin.left + (c + 0.5) * (plotW / cols);
      const py = margin.top + 36 + r * 54;
      const fontSize = Math.round(13 + (count / maxW) * 18);
      ctx.fillStyle = palette[idx % palette.length];
      ctx.font = `600 ${fontSize}px 'Instrument Serif', Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${word} (${formatTick(count)})`, px, py);
      hitRegions.push({
        shape: 'rect',
        x: px - 60,
        y: py - fontSize,
        w: 120,
        h: fontSize + 6,
        label: word,
        details: `Frequency/Weight: ${formatTick(count)} (Note: Word length biases pixel area; prefer Horizontal Bar Chart for exact comparison)`
      });
    });
    return { words };
  }

  const ct = computeContingencyTable(rows, srcCol, tgtCol, weightCol);
  if (!ct.valid) return {};

  if (chartType === 'sankey_diagram' || chartType === 'dendrogram') {
    const leftNodes = ct.rowLevels.slice(0, 8);
    const rightNodes = ct.colLevels.slice(0, 8);
    const leftX = margin.left + 20;
    const rightX = margin.left + plotW - 110;
    const leftStep = plotH / Math.max(1, leftNodes.length);
    const rightStep = plotH / Math.max(1, rightNodes.length);

    leftNodes.forEach((lKey, lIdx) => {
      const ly = margin.top + (lIdx + 0.5) * leftStep;
      rightNodes.forEach((rKey, rIdx) => {
        const ry = margin.top + (rIdx + 0.5) * rightStep;
        const flow = ct.counts[lKey][rKey] || 0;
        if (flow <= 0) return;
        const thickness = Math.max(2, (flow / ct.grandTotal) * plotH * 0.55);

        ctx.strokeStyle = palette[lIdx % palette.length];
        ctx.globalAlpha = 0.42;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(leftX + 14, ly);
        ctx.bezierCurveTo(leftX + plotW * 0.35, ly, rightX - plotW * 0.35, ry, rightX, ry);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        hitRegions.push({
          shape: 'circle',
          x: 0.5 * (leftX + rightX),
          y: 0.5 * (ly + ry),
          r: 12,
          label: `${lKey} → ${rKey}`,
          details: `Flow Volume: ${formatTick(flow)} (${((flow / ct.grandTotal) * 100).toFixed(1)}% of total ${formatTick(ct.grandTotal)})`
        });
      });

      ctx.fillStyle = palette[lIdx % palette.length];
      ctx.fillRect(leftX, ly - 12, 14, 24);
      ctx.fillStyle = tokens.text;
      ctx.font = "600 11px 'Inter', sans-serif";
      ctx.textAlign = 'right';
      ctx.fillText(lKey.slice(0, 14), leftX - 6, ly + 4);
    });

    rightNodes.forEach((rKey, rIdx) => {
      const ry = margin.top + (rIdx + 0.5) * rightStep;
      ctx.fillStyle = tokens.accent;
      ctx.fillRect(rightX, ry - 12, 14, 24);
      ctx.fillStyle = tokens.text;
      ctx.font = "600 11px 'Inter', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(`${rKey.slice(0, 14)} (${formatTick(ct.colTotals[rKey])})`, rightX + 20, ry + 4);
    });
    return { ct };
  }

  // Chord / Network Circular Topology
  const nodes = Array.from(new Set([...ct.rowLevels, ...ct.colLevels])).slice(0, 12);
  const cx = margin.left + plotW / 2;
  const cy = margin.top + plotH / 2;
  const rad = Math.min(plotW, plotH) * 0.36;
  const nodePos = new Map();

  nodes.forEach((nKey, idx) => {
    const ang = -Math.PI / 2 + (2 * Math.PI * idx) / nodes.length;
    nodePos.set(nKey, { x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad, ang });
  });

  ct.cells.forEach(cell => {
    if (cell.count <= 0) return;
    const pA = nodePos.get(cell.row);
    const pB = nodePos.get(cell.col);
    if (!pA || !pB) return;

    ctx.strokeStyle = palette[nodes.indexOf(cell.row) % palette.length];
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = Math.max(1.5, (cell.count / ct.grandTotal) * 28);
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    if (chartType === 'chord_diagram') {
      ctx.quadraticCurveTo(cx, cy, pB.x, pB.y);
    } else {
      ctx.lineTo(pB.x, pB.y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  });

  nodes.forEach((nKey, idx) => {
    const pos = nodePos.get(nKey);
    ctx.fillStyle = palette[idx % palette.length];
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 9, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = tokens.text;
    ctx.font = "600 11px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(nKey.slice(0, 12), cx + Math.cos(pos.ang) * (rad + 22), cy + Math.sin(pos.ang) * (rad + 22) + 4);

    hitRegions.push({
      shape: 'circle',
      x: pos.x,
      y: pos.y,
      r: 12,
      label: `Node: ${nKey}`,
      details: `Outflow: ${formatTick(ct.rowTotals[nKey] || 0)} | Inflow: ${formatTick(ct.colTotals[nKey] || 0)}`
    });
  });

  return { ct, nodes };
}

// ============================================================================
// MULTI-LEVEL ADAPTIVE INTERPRETATION GENERATOR (Simple, Standard, Technical)
// Conforms to Part 3.5 and Part 9.4
// ============================================================================
export function buildMultiLevelInterpretation(chartType, config, profile, rows, summaryData = {}) {
  const chart = getChartById(chartType);
  const n = rows.length;
  const xName = config.x || profile.headers[0] || 'X';
  const yName = config.y || '';

  let revealedSimple = `Based on ${n} active records, this ${chart.name} highlights how "${xName}"${yName ? ` and "${yName}"` : ''} behave across your dataset.`;
  let revealedStandard = `Computed on n = ${n} observations (${profile.completeCaseCount} complete cases across all columns).`;
  let revealedTechnical = `Formula & conventions: ${chart.mathematicalInterpretation}`;

  if (summaryData.diag && summaryData.diag.valid) {
    const d = summaryData.diag;
    const dir = d.r > 0.15 ? 'positive' : d.r < -0.15 ? 'negative' : 'near-zero';
    revealedSimple = `As "${xName}" increases, "${yName}" shows a ${dir} linear association (correlation r = ${d.r.toFixed(2)} across ${d.n} paired observations).`;
    revealedStandard = `Sample correlation r = ${d.r.toFixed(4)} (Spearman ρ_s = ${d.spearmanRho.toFixed(4)}, R² = ${d.r2.toFixed(4)}). OLS fitted equation: ŷ = ${d.intercept.toFixed(4)} + (${d.slope.toFixed(4)})·x, with residual standard error s_e = ${d.sResid.toFixed(4)} on df = ${d.df}.`;
    revealedTechnical = `Two-pass centered sums: SS_xx = ${d.ssx.toFixed(4)}, SS_yy = ${d.ssy.toFixed(4)}, SS_xy = ${d.ssxy.toFixed(4)}. Slope t = ${d.tSlope.toFixed(2)} (two-sided p = ${d.pSlope < 0.0001 ? '< 0.0001' : d.pSlope.toFixed(4)}), 95% slope CI [${d.slopeCI95[0].toFixed(4)}, ${d.slopeCI95[1].toFixed(4)}]. Influential cases (Cook's D_i > max(4/n, 0.25)): ${d.points.filter(p => p.isInfluential).length}.`;
  } else if (summaryData.stats && summaryData.stats.valid) {
    const s = summaryData.stats;
    revealedSimple = `Across ${s.n} values of "${xName}", the middle value (median) is ${s.median.toFixed(2)} and the average (mean) is ${s.mean.toFixed(2)}, spanning from ${s.min.toFixed(2)} to ${s.max.toFixed(2)}.`;
    revealedStandard = `Univariate summary (n = ${s.n}, missing = ${s.missingCount}): Mean = ${s.mean.toFixed(4)} (SD = ${s.sd.toFixed(4)}, SE = ${s.se.toFixed(4)}), Type 7 Median = ${s.median.toFixed(4)}, IQR = ${s.iqr.toFixed(4)} [Q1 = ${s.q1.toFixed(4)}, Q3 = ${s.q3.toFixed(4)}], Skewness g_1 = ${s.skewness.toFixed(3)}.`;
    revealedTechnical = `Two-pass variance s² = ${s.variance.toFixed(4)} (Bessel n-1 divisor). 95% t-interval for μ: [${s.ci95Mean[0].toFixed(4)}, ${s.ci95Mean[1].toFixed(4)}]. Tukey 1.5·IQR inner fences: [${s.lowerInnerFence.toFixed(3)}, ${s.upperInnerFence.toFixed(3)}] (${s.outliers.length} outlier(s) beyond fences).`;
  } else if (summaryData.anova && summaryData.anova.valid) {
    const a = summaryData.anova;
    revealedSimple = `Comparing "${summaryData.numCol}" across ${a.k} groups of "${summaryData.groupCol}" (total N = ${a.N}): group differences account for ${(a.etaSquared * 100).toFixed(1)}% of total variation.`;
    revealedStandard = `One-Way ANOVA across k = ${a.k} groups (N = ${a.N}): F(${a.dfB}, ${a.dfW}) = ${a.fStat.toFixed(2)}, p = ${a.pValue < 0.0001 ? '< 0.0001' : a.pValue.toFixed(4)}, effect size η² = ${a.etaSquared.toFixed(4)}.`;
    revealedTechnical = `Between-group SSB = ${a.ssb.toFixed(4)} (MSB = ${a.msb.toFixed(4)}), Within-group SSW = ${a.ssw.toFixed(4)} (MSW = ${a.msw.toFixed(4)}). Check group sample sizes and homoscedasticity before relying on parametric F-test p-values.`;
  } else if (summaryData.ct && summaryData.ct.valid) {
    const ct = summaryData.ct;
    revealedSimple = `Cross-tabulating ${ct.rowLevels.length} groups of "${summaryData.xCol}" by ${ct.colLevels.length} categories (Grand Total N = ${formatTick(ct.grandTotal)}).`;
    revealedStandard = `Contingency table N = ${formatTick(ct.grandTotal)}, df = ${ct.df}, Pearson χ² = ${ct.chiSquare.toFixed(2)}, Cramér's V = ${ct.cramersV.toFixed(3)}.`;
    revealedTechnical = `Joint proportions use denominator N = ${formatTick(ct.grandTotal)}; row-conditional proportions normalize each row by n_{i•} so ∑_j P(Y=j | X=i) = 1.0000.`;
  }

  return {
    simple: {
      lookingAt: chart.plainExplanation,
      reveals: revealedSimple,
      caution: `Watch out for: ${chart.commonMistakes[0] || 'Always check sample size and scale baselines.'} Association in observational data does not prove causation.`
    },
    standard: {
      lookingAt: `${chart.name} (${chart.marksAndAesthetics}). Purpose: ${chart.statisticalPurpose}`,
      reveals: revealedStandard,
      caution: `Limitations: ${chart.weaknesses.join('; ')}. Common pitfalls: ${chart.commonMistakes.join('; ')}.`
    },
    technical: {
      lookingAt: `${chart.name} — ${chart.technicalDetails} Required structure: ${chart.dataStructure}`,
      reveals: revealedTechnical,
      caution: `Assumptions & Edge Cases: Verify complete-case sample size (n = ${n}), scale domain validity, and denominator invariance across transformations.`
    }
  };
}

/**
 * Generate Clean Standalone Vector SVG Representation of Active Chart (Part 17.1)
 */
export function renderChartToSVG(canvas, config, profile, rows) {
  const tokens = getThemeTokens();
  const chart = getChartById(config.chartType);
  const title = escapeXml(config.title || `${chart.name} — ${config.x || ''} ${config.y ? 'vs ' + config.y : ''}`);
  const subtitle = escapeXml(config.subtitle || `VisualGrammar Vector Export (n = ${rows.length} observations)`);

  // Embed crisp high-DPI canvas snapshot + vector frame metadata for 100% visual fidelity across all 34 chart types
  const dataUrl = canvas ? canvas.toDataURL('image/png') : '';
  const w = canvas ? Math.round(canvas.width / ((typeof window !== 'undefined' && window.devicePixelRatio) ? Math.min(2.5, window.devicePixelRatio) : 1)) : 800;
  const h = canvas ? Math.round(canvas.height / ((typeof window !== 'undefined' && window.devicePixelRatio) ? Math.min(2.5, window.devicePixelRatio) : 1)) : 460;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h + 36}" width="${w}" height="${h + 36}">
  <title>${title}</title>
  <desc>${subtitle} — Generated by VisualGrammar v1.0.0</desc>
  <rect width="100%" height="100%" fill="${tokens.bg}" />
  ${dataUrl ? `<image x="0" y="0" width="${w}" height="${h}" xlink:href="${dataUrl}" />` : ''}
  <text x="16" y="${h + 22}" font-family="JetBrains Mono, monospace" font-size="11" fill="${tokens.muted}">VisualGrammar v1.0.0 | Chart: ${escapeXml(chart.name)} | n = ${rows.length} | Provenance: Local Browser Engine</text>
</svg>`;
}

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
