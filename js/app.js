/**
 * VisualGrammar — Main Application Controller & State Coordinator (app.js)
 * Coordinates all 9 destinations, dataset state, variable overrides, transformation undo/redo,
 * recommendation engine, Chart Studio, Known Visualization Unity, Visualization Atlas,
 * Chart Literacy Lab, Learn curriculum, and multi-format exports.
 */

import {
  computeUnivariateStats,
  computeDatasetDiagnostics,
  runBootstrapMean
} from './math-engine.js';
import {
  VARIABLE_TAXONOMY,
  parseDelimitedText,
  parseDataSenseJSON,
  getSampleQuartetLabModelOutputJSON,
  getSampleResampleLabJSON,
  getSampleForecastLabJSON,
  profileDataset,
  runTransformationPipeline
} from './data-engine.js';
import { PRESET_DATASETS, getPresetById } from './presets.js';
import { ANALYTICAL_OBJECTIVES, CHART_REGISTRY, getChartById } from './chart-registry.js';
import { evaluateRecommendations } from './recommendation-engine.js';
import { auditChartIntegrity } from './integrity-engine.js';
import { renderChartOnCanvas, renderChartToSVG, getThemeTokens } from './renderer.js';
import {
  exportToCSV,
  exportConfigurationJSON,
  exportDataSenseDatasetJSON,
  exportToRScript,
  exportToPythonScript,
  exportToLatexTable,
  encodeShareableHash,
  decodeShareableHash
} from './exporters.js';
import {
  loadPreferences,
  savePreferences,
  saveRecentWorkspace,
  loadRecentWorkspace,
  saveLiteracyProgress,
  loadLiteracyProgress,
  clearAllLocalData
} from './storage.js';
import { UNITY_GROUPS, SIMILARITY_ONTOLOGY, getUnityComparisonDetails } from './unity-lab.js';
import { CONCEPT_LIBRARY } from './atlas-data.js';
import { READING_PROTOCOL_STEPS, MISLEADING_EXPERIMENTS, LITERACY_CHALLENGES } from './literacy-lab.js';

// ============================================================================
// CENTRAL APPLICATION STATE
// ============================================================================
const prefs = loadPreferences();

export const appState = {
  activeView: 'home',
  theme: prefs.theme || 'light',
  explanationLevel: prefs.explanationLevel || 'standard', // 'simple' | 'standard' | 'technical'
  allowLocalSave: prefs.allowLocalSave !== false,

  // Active Dataset State
  isPreset: true,
  datasetId: PRESET_DATASETS[0].id,
  datasetTitle: PRESET_DATASETS[0].title,
  datasetDescription: PRESET_DATASETS[0].description,
  datasetProvenance: PRESET_DATASETS[0].provenance,
  rawHeaders: [...PRESET_DATASETS[0].headers],
  rawRows: PRESET_DATASETS[0].rows.map(r => ({ ...r })),
  userOverrides: JSON.parse(JSON.stringify(PRESET_DATASETS[0].overrides || {})),

  // Non-Destructive Transformation Pipeline & Undo/Redo Stack
  transformations: [],
  transformRedoStack: [],
  activeHeaders: [],
  activeRows: [],
  provenanceLog: [],
  profile: null,

  // Recommendation Engine State
  recObjective: PRESET_DATASETS[0].recommendedObjective || 'compare_groups',
  recAudience: 'general',
  recSelectedVars: [],
  recTierFilter: 'all',

  // Chart Studio Configuration & Undo/Redo History (Depth >= 30)
  chartConfig: {
    chartType: 'grouped_boxplot',
    x: 'department',
    y: 'pressure_kpa',
    color: 'alarm_triggered',
    size: '',
    facet: '',
    aggFunc: 'count',
    sortOrder: 'default',
    histScale: 'count',
    binCount: 12,
    bandwidthMultiplier: 1.0,
    uncertaintyType: 'ci95',
    sizeEncoding: 'area',
    yBaseline: 0,
    logScaleX: false,
    logScaleY: false,
    opacity: 0.85,
    pointRadius: 5.4,
    palette: 'datasense',
    showOLS: false,
    showQuadratic: false,
    showRawPoints: false,
    title: '',
    subtitle: '',
    annotationText: '',
    referenceLineValue: ''
  },
  studioHistory: [],
  studioRedoStack: [],
  compareMode: false,
  compareChartType: 'violin_plot',
  lastHitRegions: [],
  lastCompareHitRegions: [],
  lastHomeHitRegions: [],
  lastUnityHitRegions: [[], [], [], []],
  lastAtlasHitRegions: [],
  selectedMarkLabel: null,
  showWorksheetAnswers: false,

  // Known Visualization Unity State
  activeUnityGroupId: UNITY_GROUPS[2].id, // Default to Group 3: 1 Numerical Variable
  unitySlotCharts: ['histogram', 'kde_density', 'ecdf_plot', 'boxplot'],
  unityBins: 12,
  unityBandwidth: 1.0,

  // Visualization Atlas State
  selectedAtlasChartId: 'histogram',

  // Chart Literacy Lab State
  activeExperimentId: MISLEADING_EXPERIMENTS[0].id,
  experimentMode: 'misleading', // 'misleading' | 'corrected'
  activeChallengeId: LITERACY_CHALLENGES[0].id,
  literacyProgress: loadLiteracyProgress(),

  // Learn State
  selectedConceptId: CONCEPT_LIBRARY[0].id
};

// ============================================================================
// INITIALIZATION & EVENT WIRING
// ============================================================================
export function initVisualGrammarApp() {
  if (typeof document === 'undefined') return;

  applyTheme(appState.theme);
  updateExplanationButtons();

  populateGlobalPresetsDropdown();
  populateObjectivesDropdowns();
  populateChartStudioSelectors();
  populateUnityControls();
  populateAtlasControls();
  populateLiteracyLabControls();
  populateLearnCurriculum();

  // Load initial dataset (or restore from URL hash if present)
  loadPresetDataset(PRESET_DATASETS[0].id, false);
  if (window.location.hash && window.location.hash.startsWith('#state=')) {
    const restored = decodeShareableHash(window.location.hash);
    if (restored) {
      if (restored.p) loadPresetDataset(restored.p, false);
      if (restored.lvl) setExplanationLevel(restored.lvl);
      if (restored.cfg) {
        Object.assign(appState.chartConfig, restored.cfg);
      }
      navigateToView('studio');
    }
  }

  wireGlobalNavigationAndHeader();
  wireHomeWorkbench();
  wireUnderstandDataEvents();
  wireRecommendationEvents();
  wireChartStudioEvents();
  wireUnityLabEvents();
  wireAtlasEvents();
  wireLiteracyLabEvents();
  wireLearnEvents();
  wireUploadModalEvents();
  wireWorksheetModalEvents();

  refreshAllViews();

  window.addEventListener('resize', () => {
    renderActiveViewCanvases();
  });
}

function showToast(message) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

function applyTheme(theme) {
  appState.theme = theme === 'dark' ? 'dark' : 'light';
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', appState.theme);
  }
  savePreferences({
    theme: appState.theme,
    explanationLevel: appState.explanationLevel,
    allowLocalSave: appState.allowLocalSave
  });
  renderActiveViewCanvases();
}

function setExplanationLevel(level) {
  if (!['simple', 'standard', 'technical'].includes(level)) return;
  appState.explanationLevel = level;
  updateExplanationButtons();
  savePreferences({
    theme: appState.theme,
    explanationLevel: appState.explanationLevel,
    allowLocalSave: appState.allowLocalSave
  });
  refreshAllViews();
}

function updateExplanationButtons() {
  document.querySelectorAll('[data-exp-level]').forEach(btn => {
    const isMatch = btn.getAttribute('data-exp-level') === appState.explanationLevel;
    btn.classList.toggle('active', isMatch);
    btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
  });
  const modeBadge = document.getElementById('studio-exp-mode-badge');
  if (modeBadge) {
    modeBadge.textContent = `Mode: ${appState.explanationLevel.charAt(0).toUpperCase() + appState.explanationLevel.slice(1)}`;
  }
}

export function navigateToView(viewId) {
  appState.activeView = viewId;
  document.querySelectorAll('.nav-tab').forEach(tab => {
    const active = tab.getAttribute('data-view') === viewId;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.toggle('active', sec.id === `view-${viewId}`);
  });
  renderActiveViewCanvases();
}

function renderActiveViewCanvases() {
  if (appState.activeView === 'home') {
    renderHomePreview();
  } else if (appState.activeView === 'studio') {
    renderChartStudioWorkspace();
  } else if (appState.activeView === 'unity') {
    renderUnityWorkbench();
  } else if (appState.activeView === 'atlas') {
    renderAtlasDetail();
  } else if (appState.activeView === 'literacy') {
    renderLiteracyExperimentCanvas();
  }
}

// ============================================================================
// DATASET LOADING, PROFILING, & TRANSFORMATION PIPELINE
// ============================================================================
export function loadPresetDataset(presetId, notify = true) {
  const preset = getPresetById(presetId);
  appState.isPreset = true;
  appState.datasetId = preset.id;
  appState.datasetTitle = preset.title;
  appState.datasetDescription = preset.description;
  appState.datasetProvenance = preset.provenance;
  appState.rawHeaders = [...preset.headers];
  appState.rawRows = preset.rows.map(r => ({ ...r }));
  appState.userOverrides = JSON.parse(JSON.stringify(preset.overrides || {}));
  appState.transformations = [];
  appState.transformRedoStack = [];
  appState.recObjective = preset.recommendedObjective || 'show_distribution';
  appState.selectedMarkLabel = null;

  recomputeDatasetPipeline();

  // Apply default chart mappings for this preset
  const def = preset.defaultMappings || {};
  pushStudioHistory();
  appState.chartConfig = {
    ...appState.chartConfig,
    chartType: def.chartType || 'bar_vertical',
    x: def.x || appState.activeHeaders[0] || '',
    y: def.y !== undefined ? def.y : (appState.activeHeaders[1] || ''),
    color: def.color || '',
    size: def.size || '',
    facet: def.facet || '',
    yBaseline: 0,
    logScaleX: false,
    logScaleY: false,
    title: preset.title
  };

  const globalSel = document.getElementById('global-preset-select');
  if (globalSel) globalSel.value = preset.id;

  refreshAllViews();
  if (notify) showToast(`Loaded preset: ${preset.title}`);
}

export function recomputeDatasetPipeline() {
  const pipe = runTransformationPipeline(appState.rawRows, appState.rawHeaders, appState.transformations);
  appState.activeRows = pipe.rows;
  appState.activeHeaders = pipe.headers;
  appState.provenanceLog = pipe.provenanceLog;
  appState.profile = profileDataset(appState.activeRows, appState.activeHeaders, appState.userOverrides);

  // Default selected variables for recommendation engine = all non-metadata columns
  appState.recSelectedVars = appState.profile.variables
    .filter(v => v.taxonomy.family !== 'metadata')
    .map(v => v.name);

  saveRecentWorkspace({
    datasetId: appState.datasetId,
    datasetTitle: appState.datasetTitle,
    isPreset: appState.isPreset,
    chartConfig: appState.chartConfig
  }, appState.allowLocalSave);
}

function refreshAllViews() {
  renderHomePresetsGrid();
  renderHomePreview();
  renderUnderstandDataView();
  renderRecommendationsView();
  syncStudioControlsFromState();
  renderChartStudioWorkspace();
  if (appState.activeView === 'unity') renderUnityWorkbench();
  if (appState.activeView === 'atlas') renderAtlasDetail();
  if (appState.activeView === 'literacy') renderLiteracyExperimentCanvas();
  renderLearnLessonDetail();
}

// ============================================================================
// GLOBAL HEADER & HOME WORKBENCH
// ============================================================================
function populateGlobalPresetsDropdown() {
  const sel = document.getElementById('global-preset-select');
  if (!sel) return;
  sel.innerHTML = PRESET_DATASETS.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
}

function wireGlobalNavigationAndHeader() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      navigateToView(tab.getAttribute('data-view'));
    });
  });

  document.querySelectorAll('[data-goto-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateToView(btn.getAttribute('data-goto-view'));
    });
  });

  const brandLink = document.getElementById('brand-home-link');
  if (brandLink) {
    brandLink.addEventListener('click', e => {
      e.preventDefault();
      navigateToView('home');
    });
  }

  const presetSel = document.getElementById('global-preset-select');
  if (presetSel) {
    presetSel.addEventListener('change', () => {
      loadPresetDataset(presetSel.value, true);
    });
  }

  document.querySelectorAll('[data-exp-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      setExplanationLevel(btn.getAttribute('data-exp-level'));
    });
  });

  const themeBtn = document.getElementById('btn-toggle-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      applyTheme(appState.theme === 'dark' ? 'light' : 'dark');
    });
  }

  // Global keyboard shortcuts for Undo/Redo in Studio
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) {
        studioRedo();
      } else {
        studioUndo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      studioRedo();
    }
  });
}

function wireHomeWorkbench() {
  const uploadBtn = document.getElementById('home-btn-upload');
  if (uploadBtn) uploadBtn.addEventListener('click', openUploadModal);

  const homeCanvas = document.getElementById('home-preview-canvas');
  const homeTooltip = document.getElementById('home-preview-tooltip');
  if (homeCanvas && homeTooltip) {
    homeCanvas.addEventListener('mousemove', e => {
      handleCanvasHover(e, homeCanvas, homeTooltip, appState.lastHomeHitRegions);
    });
    homeCanvas.addEventListener('mouseleave', () => {
      homeTooltip.style.display = 'none';
    });
  }

  const restoreBtn = document.getElementById('home-btn-restore-recent');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', () => {
      const recent = loadRecentWorkspace();
      if (!recent) {
        showToast('No saved local session found.');
        return;
      }
      if (recent.datasetId) loadPresetDataset(recent.datasetId, false);
      if (recent.chartConfig) Object.assign(appState.chartConfig, recent.chartConfig);
      refreshAllViews();
      navigateToView('studio');
      showToast(`Restored session from ${new Date(recent.savedAt).toLocaleTimeString()}`);
    });
  }

  const clearBtn = document.getElementById('home-btn-clear-local');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearAllLocalData();
      const statusEl = document.getElementById('home-recent-status');
      if (statusEl) statusEl.textContent = 'Cleared all locally stored browser state.';
      showToast('All local storage data cleared.');
    });
  }
}

function renderHomePresetsGrid() {
  const grid = document.getElementById('home-presets-grid');
  if (!grid) return;
  grid.innerHTML = PRESET_DATASETS.map(p => {
    const isActive = p.id === appState.datasetId;
    return `
      <div class="card card-compact" style="border-color: ${isActive ? 'var(--color-primary)' : 'var(--color-border)'};">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
          <strong style="font-size:13px;">${p.title}</strong>
          <span class="badge ${p.isSynthetic ? '' : 'badge-primary'}">${p.isSynthetic ? 'Synthetic' : 'Benchmark'}</span>
        </div>
        <details class="collapsible-panel">
          <summary>Dataset Summary &amp; Learning Goal</summary>
          <div class="collapsible-body" style="font-size:12px;">
            <div style="margin-bottom:4px;">${p.description}</div>
            <div style="color:var(--color-text-muted);"><strong>Goal:</strong> ${p.learningGoal}</div>
          </div>
        </details>
        <div style="display:flex; gap:6px; margin-top:auto; padding-top:4px;">
          <button type="button" class="btn ${isActive ? 'btn-primary' : ''} btn-sm" data-load-preset="${p.id}">
            ${isActive ? '✓ Active Dataset' : 'Load Dataset'}
          </button>
          <button type="button" class="btn btn-sm" data-preset-studio="${p.id}">Open in Studio →</button>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('[data-load-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      loadPresetDataset(btn.getAttribute('data-load-preset'), true);
    });
  });
  grid.querySelectorAll('[data-preset-studio]').forEach(btn => {
    btn.addEventListener('click', () => {
      loadPresetDataset(btn.getAttribute('data-preset-studio'), false);
      navigateToView('studio');
    });
  });
}

function renderHomePreview() {
  const canvas = document.getElementById('home-preview-canvas');
  if (!canvas || !appState.profile) return;

  const badge = document.getElementById('home-active-dataset-badge');
  if (badge) badge.textContent = `${appState.datasetTitle.slice(0, 32)} (n = ${appState.activeRows.length})`;

  const titleEl = document.getElementById('home-preview-title');
  const chart = getChartById(appState.chartConfig.chartType);
  if (titleEl) titleEl.textContent = `${chart.name} — ${appState.datasetTitle}`;

  const res = renderChartOnCanvas(canvas, appState.activeRows, appState.profile, appState.chartConfig);
  appState.lastHomeHitRegions = res.hitRegions || [];
  const summaryEl = document.getElementById('home-preview-summary');
  if (summaryEl && res.interpretation) {
    const modeObj = res.interpretation[appState.explanationLevel] || res.interpretation.standard;
    summaryEl.innerHTML = `<strong>${chart.name} (${appState.explanationLevel.toUpperCase()} mode):</strong> ${modeObj.reveals}`;
  }
}

// ============================================================================
// DESTINATION 2: UNDERSTAND DATA VIEW
// ============================================================================
function wireUnderstandDataEvents() {
  const upBtn = document.getElementById('understand-btn-upload');
  if (upBtn) upBtn.addEventListener('click', openUploadModal);

  const resetOverridesBtn = document.getElementById('btn-reset-type-overrides');
  if (resetOverridesBtn) {
    resetOverridesBtn.addEventListener('click', () => {
      const preset = PRESET_DATASETS.find(p => p.id === appState.datasetId);
      appState.userOverrides = preset && appState.isPreset ? JSON.parse(JSON.stringify(preset.overrides || {})) : {};
      recomputeDatasetPipeline();
      refreshAllViews();
      showToast('Variable type overrides reset.');
    });
  }

  const transTypeSel = document.getElementById('transform-type-select');
  if (transTypeSel) {
    transTypeSel.addEventListener('change', updateTransformParameterUI);
  }

  const applyTransBtn = document.getElementById('btn-apply-transform');
  if (applyTransBtn) {
    applyTransBtn.addEventListener('click', handleApplyTransformation);
  }

  const undoBtn = document.getElementById('btn-transform-undo');
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      if (appState.transformations.length === 0) return;
      const popped = appState.transformations.pop();
      appState.transformRedoStack.push(popped);
      recomputeDatasetPipeline();
      refreshAllViews();
    });
  }

  const redoBtn = document.getElementById('btn-transform-redo');
  if (redoBtn) {
    redoBtn.addEventListener('click', () => {
      if (appState.transformRedoStack.length === 0) return;
      const next = appState.transformRedoStack.pop();
      appState.transformations.push(next);
      recomputeDatasetPipeline();
      refreshAllViews();
    });
  }

  const resetTransBtn = document.getElementById('btn-transform-reset');
  if (resetTransBtn) {
    resetTransBtn.addEventListener('click', () => {
      appState.transformations = [];
      appState.transformRedoStack = [];
      recomputeDatasetPipeline();
      refreshAllViews();
      showToast('Reverted to original raw dataset.');
    });
  }

  const searchInput = document.getElementById('data-preview-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderDataPreviewTable(searchInput.value);
    });
  }

  const addRowBtn = document.getElementById('btn-add-observation-row');
  if (addRowBtn) {
    addRowBtn.addEventListener('click', () => {
      const templateRow = appState.rawRows[appState.rawRows.length - 1] || {};
      const newRow = { obs_id: `row_${appState.rawRows.length + 1}` };
      for (const h of appState.rawHeaders) {
        if (h === 'obs_id') newRow[h] = `obs_${appState.rawRows.length + 1}`;
        else newRow[h] = templateRow[h] !== undefined ? templateRow[h] : 0;
      }
      appState.rawRows.push(newRow);
      recomputeDatasetPipeline();
      refreshAllViews();
      showToast(`Added observation row #${appState.rawRows.length}. Double-click any cell in the preview table to edit.`);
    });
  }
}

function updateTransformParameterUI() {
  const type = document.getElementById('transform-type-select')?.value || 'sort';
  const paramLabel = document.getElementById('transform-param-label');
  const paramInput = document.getElementById('transform-param-input');
  const colBGroup = document.getElementById('transform-col-b-group');
  if (!paramLabel || !paramInput || !colBGroup) return;

  colBGroup.style.display = ['derived_expression', 'group_aggregate'].includes(type) ? 'flex' : 'none';

  const map = {
    sort: { label: 'Direction (asc / desc)', placeholder: 'asc or desc', val: 'desc' },
    filter: { label: 'Condition (e.g., > 50, == Line A, not_null)', placeholder: '> 50', val: 'not_null' },
    standardize_z: { label: 'Output Suffix', placeholder: '_z', val: '_z' },
    log_transform: { label: 'Log Base (ln or log10)', placeholder: 'ln', val: 'ln' },
    binning: { label: 'Number of Equal-Width Bins (2–20)', placeholder: '5', val: '5' },
    cumulative_total: { label: 'Running Sum Mode', placeholder: 'cumsum', val: 'cumsum' },
    date_extract: { label: 'Date Part (year or month)', placeholder: 'year', val: 'year' },
    derived_expression: { label: 'Operation (diff, sum, ratio, prod, pct_change)', placeholder: 'diff', val: 'diff' },
    rename_variable: { label: 'New Variable Name', placeholder: 'new_column_name', val: '' },
    group_aggregate: { label: 'Aggregation (mean, median, sum, count, percentage)', placeholder: 'mean', val: 'mean' }
  };

  const cfg = map[type] || map.sort;
  paramLabel.textContent = cfg.label;
  paramInput.placeholder = cfg.placeholder;
  paramInput.value = cfg.val;
}

function handleApplyTransformation() {
  const type = document.getElementById('transform-type-select')?.value || 'sort';
  const colA = document.getElementById('transform-col-a')?.value || '';
  const colB = document.getElementById('transform-col-b')?.value || '';
  const rawParam = (document.getElementById('transform-param-input')?.value || '').trim();

  let step = null;
  if (type === 'sort') {
    step = { type: 'sort', column: colA, direction: rawParam.toLowerCase() === 'desc' ? 'desc' : 'asc' };
  } else if (type === 'filter') {
    if (rawParam === 'not_null') {
      step = { type: 'filter', column: colA, operator: 'not_null', value: '' };
    } else {
      const m = rawParam.match(/^(>=|<=|!=|==|>|<|=)\s*(.+)$/);
      if (m) {
        const opMap = { '>': 'gt', '>=': 'gte', '<': 'lt', '<=': 'lte', '==': 'eq', '=': 'eq', '!=': 'neq' };
        step = { type: 'filter', column: colA, operator: opMap[m[1]] || 'eq', value: m[2].trim() };
      } else {
        step = { type: 'filter', column: colA, operator: 'contains', value: rawParam };
      }
    }
  } else if (type === 'standardize_z') {
    step = { type: 'standardize_z', column: colA };
  } else if (type === 'log_transform') {
    step = { type: 'log_transform', column: colA, base: rawParam.toLowerCase() === 'log10' ? 'log10' : 'ln' };
  } else if (type === 'binning') {
    step = { type: 'binning', column: colA, bins: Number(rawParam) || 5 };
  } else if (type === 'cumulative_total') {
    step = { type: 'cumulative_total', column: colA };
  } else if (type === 'date_extract') {
    step = { type: 'date_extract', column: colA, part: rawParam.toLowerCase() === 'month' ? 'month' : 'year' };
  } else if (type === 'derived_expression') {
    step = { type: 'derived_expression', colA, colB, operation: rawParam || 'diff' };
  } else if (type === 'rename_variable') {
    if (!rawParam) {
      showToast('Enter a new variable name first.');
      return;
    }
    step = { type: 'rename_variable', oldName: colA, newName: rawParam };
  } else if (type === 'group_aggregate') {
    step = { type: 'group_aggregate', groupColumn: colA, targetColumn: colB, aggFunc: rawParam || 'mean' };
  }

  if (step) {
    appState.transformations.push(step);
    appState.transformRedoStack = [];
    recomputeDatasetPipeline();
    refreshAllViews();
    showToast(`Applied transformation: ${step.type}`);
  }
}

function renderUnderstandDataView() {
  const prof = appState.profile;
  if (!prof) return;

  const titleEl = document.getElementById('understand-dataset-title');
  const descEl = document.getElementById('understand-dataset-desc');
  const provEl = document.getElementById('understand-provenance-badge');
  if (titleEl) titleEl.textContent = appState.datasetTitle;
  if (descEl) descEl.textContent = appState.datasetDescription;
  if (provEl) provEl.textContent = appState.datasetProvenance;

  const metricsEl = document.getElementById('understand-summary-metrics');
  if (metricsEl) {
    const ambigCount = prof.variables.filter(v => v.isAmbiguous).length;
    metricsEl.innerHTML = `
      <div class="metric-box"><span class="metric-label">Observations (n)</span><span class="metric-val">${prof.rowCount}</span></div>
      <div class="metric-box"><span class="metric-label">Variables (p)</span><span class="metric-val">${prof.colCount}</span></div>
      <div class="metric-box"><span class="metric-label">Complete Cases</span><span class="metric-val">${prof.completeCaseCount}</span></div>
      <div class="metric-box"><span class="metric-label">Missing Cells</span><span class="metric-val">${prof.totalMissingCells}</span></div>
      <div class="metric-box"><span class="metric-label">Ambiguous Columns</span><span class="metric-val">${ambigCount}</span></div>
      <div class="metric-box"><span class="metric-label">Transform Steps</span><span class="metric-val">${appState.transformations.length}</span></div>
    `;
  }

  // Variable Taxonomy Table with Interactive Type Override Dropdowns
  const tbody = document.getElementById('variable-profile-tbody');
  if (tbody) {
    const taxOptions = Object.values(VARIABLE_TAXONOMY);
    tbody.innerHTML = prof.variables.map(v => {
      const selectHtml = `
        <select class="var-type-override-select" data-var-name="${v.name}" aria-label="Override variable type for ${v.name}">
          ${taxOptions.map(t => `<option value="${t.id}" ${t.id === v.inferredType ? 'selected' : ''}>${t.label}</option>`).join('')}
        </select>
      `;

      const badgeClass = v.confidence === 'User Override'
        ? 'badge-info'
        : v.isAmbiguous
          ? 'badge-warning'
          : 'badge-primary';

      let summaryHtml = '';
      if (v.numericStats) {
        const s = v.numericStats;
        summaryHtml = `<span class="mono">Mean=${s.mean.toFixed(2)}, SD=${s.sd.toFixed(2)}, Med=${s.median.toFixed(2)}, IQR=${s.iqr.toFixed(2)}, Range=[${s.min.toFixed(2)}, ${s.max.toFixed(2)}]</span>`;
      } else if (v.dateRange) {
        summaryHtml = `<span class="mono">Date Range: ${v.dateRange.start} → ${v.dateRange.end}</span>`;
      } else {
        const topFreqs = v.frequencies.slice(0, 4).map(f => `${f.value} (${f.count})`).join(', ');
        summaryHtml = `<span>Top classes: ${topFreqs}</span>`;
      }

      return `
        <tr>
          <td><strong>${v.name}</strong></td>
          <td>${selectHtml}</td>
          <td><span class="badge">${v.physicalType}</span></td>
          <td>
            <details class="inline-toggle">
              <summary><span class="badge ${badgeClass}">${v.confidence}${v.isAmbiguous ? ' • Review' : ''}</span> <span>Why?</span></summary>
              <div class="inline-toggle-body">${v.reasoning}</div>
            </details>
          </td>
          <td class="numeric">${v.nValid} / ${v.missingCount} (${v.missingPct.toFixed(1)}%)</td>
          <td class="numeric">${v.uniqueCount}</td>
          <td style="font-size:12px;">${summaryHtml}</td>
          <td>
            <input type="text" class="var-unit-input" data-var-unit="${v.name}" value="${v.unit || ''}" placeholder="unit" style="width:70px; padding:4px 6px;" aria-label="Unit for ${v.name}">
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.var-type-override-select').forEach(sel => {
      sel.addEventListener('change', () => {
        const colName = sel.getAttribute('data-var-name');
        if (!appState.userOverrides[colName]) appState.userOverrides[colName] = {};
        appState.userOverrides[colName].overrideType = sel.value;
        recomputeDatasetPipeline();
        refreshAllViews();
        showToast(`Updated "${colName}" semantic type to ${VARIABLE_TAXONOMY[sel.value]?.label}.`);
      });
    });

    tbody.querySelectorAll('.var-unit-input').forEach(inp => {
      inp.addEventListener('change', () => {
        const colName = inp.getAttribute('data-var-unit');
        if (!appState.userOverrides[colName]) appState.userOverrides[colName] = {};
        appState.userOverrides[colName].unit = inp.value.trim();
        recomputeDatasetPipeline();
        refreshAllViews();
      });
    });
  }

  // Transformation dropdowns
  const colASel = document.getElementById('transform-col-a');
  const colBSel = document.getElementById('transform-col-b');
  if (colASel && colBSel) {
    const opts = prof.headers.map(h => `<option value="${h}">${h}</option>`).join('');
    colASel.innerHTML = opts;
    colBSel.innerHTML = opts;
    if (prof.headers.length > 1) colBSel.value = prof.headers[1];
  }

  const provBox = document.getElementById('transform-provenance-list');
  const fbMsg = document.getElementById('transform-feedback-msg');
  if (fbMsg) fbMsg.textContent = `${appState.provenanceLog.length} transformation step(s) active.`;
  if (provBox) {
    if (appState.provenanceLog.length === 0) {
      provBox.innerHTML = '<strong>Provenance Log:</strong> Original imported dataset active (0 transformations applied).';
    } else {
      provBox.innerHTML = `<strong>Provenance Lineage (${appState.provenanceLog.length} steps):</strong><br>` +
        appState.provenanceLog.map(p => `${p.stepIndex}. ${p.description}`).join('<br>');
    }
  }

  renderDataPreviewTable(document.getElementById('data-preview-search')?.value || '');
}

function renderDataPreviewTable(searchQuery = '') {
  const thead = document.getElementById('data-preview-thead');
  const tbody = document.getElementById('data-preview-tbody');
  if (!thead || !tbody || !appState.profile) return;

  const cols = appState.activeHeaders;
  thead.innerHTML = `<tr><th>#</th>${cols.map(c => `<th>${c}</th>`).join('')}</tr>`;

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? appState.activeRows.filter(r => cols.some(c => String(r[c] ?? '').toLowerCase().includes(q)))
    : appState.activeRows;

  tbody.innerHTML = filtered.slice(0, 60).map((r, idx) => {
    return `<tr><td class="numeric">${idx + 1}</td>${cols.map(c => {
      const v = r[c];
      const isNum = typeof v === 'number' && Number.isFinite(v);
      return `<td class="${isNum ? 'numeric' : ''} editable-cell" data-obs-id="${r.obs_id || ''}" data-col-name="${c}" title="Double-click to edit cell value">${v === null || v === undefined ? '<span class="badge badge-warning">NULL</span>' : v}</td>`;
    }).join('')}</tr>`;
  }).join('');

  tbody.querySelectorAll('.editable-cell').forEach(td => {
    td.addEventListener('dblclick', () => {
      const obsId = td.getAttribute('data-obs-id');
      const colName = td.getAttribute('data-col-name');
      const rawRow = appState.rawRows.find(r => String(r.obs_id) === String(obsId));
      if (!rawRow || !colName) return;

      const currentVal = rawRow[colName] ?? '';
      const input = document.createElement('input');
      input.type = 'text';
      input.value = String(currentVal);
      input.style.width = '90px';
      input.style.padding = '2px 4px';
      td.innerHTML = '';
      td.appendChild(input);
      input.focus();

      const commitEdit = () => {
        const nextStr = input.value.trim();
        if (nextStr === '' || nextStr.toLowerCase() === 'null' || nextStr.toLowerCase() === 'na') {
          rawRow[colName] = null;
        } else {
          const num = Number(nextStr);
          rawRow[colName] = (!/⁰\d+$/.test(nextStr) && Number.isFinite(num)) ? num : nextStr;
        }
        recomputeDatasetPipeline();
        refreshAllViews();
        showToast(`Updated ${colName} on observation ${obsId}.`);
      };

      input.addEventListener('blur', commitEdit, { once: true });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') input.blur();
      });
    });
  });
}

// ============================================================================
// DESTINATION 3: FIND A VISUALIZATION (RECOMMENDATION ENGINE)
// ============================================================================
function populateObjectivesDropdowns() {
  const recObjSel = document.getElementById('rec-objective-select');
  const atlasObjSel = document.getElementById('atlas-objective-filter');
  const html = ANALYTICAL_OBJECTIVES.map(o => `<option value="${o.id}">${o.label} — ${o.description}</option>`).join('');
  if (recObjSel) recObjSel.innerHTML = html;
  if (atlasObjSel) {
    atlasObjSel.innerHTML = `<option value="all">All Analytical Objectives</option>` +
      ANALYTICAL_OBJECTIVES.map(o => `<option value="${o.id}">${o.label}</option>`).join('');
  }
}

function wireRecommendationEvents() {
  const objSel = document.getElementById('rec-objective-select');
  if (objSel) {
    objSel.addEventListener('change', () => {
      appState.recObjective = objSel.value;
      renderRecommendationsView();
    });
  }

  const audSel = document.getElementById('rec-audience-select');
  if (audSel) {
    audSel.addEventListener('change', () => {
      appState.recAudience = audSel.value;
      renderRecommendationsView();
    });
  }

  const allBtn = document.getElementById('btn-rec-select-all');
  if (allBtn) {
    allBtn.addEventListener('click', () => {
      appState.recSelectedVars = appState.profile.variables
        .filter(v => v.taxonomy.family !== 'metadata')
        .map(v => v.name);
      renderRecommendationsView();
    });
  }

  document.querySelectorAll('[data-rec-tier]').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.recTierFilter = btn.getAttribute('data-rec-tier');
      document.querySelectorAll('[data-rec-tier]').forEach(b => b.classList.toggle('active', b === btn));
      renderRecommendationsView();
    });
  });
}

function renderRecommendationsView() {
  if (!appState.profile) return;
  const objSel = document.getElementById('rec-objective-select');
  if (objSel && objSel.value !== appState.recObjective) {
    objSel.value = appState.recObjective;
  }

  // Render variable checkboxes
  const chkContainer = document.getElementById('rec-variable-checkboxes');
  if (chkContainer) {
    chkContainer.innerHTML = appState.profile.variables.map(v => {
      const checked = appState.recSelectedVars.includes(v.name);
      return `
        <label class="badge ${checked ? 'badge-primary' : ''}" style="cursor:pointer;">
          <input type="checkbox" class="rec-var-chk" value="${v.name}" ${checked ? 'checked' : ''}>
          ${v.name} (${v.taxonomy.shortLabel})
        </label>
      `;
    }).join('');

    chkContainer.querySelectorAll('.rec-var-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        const chosen = Array.from(chkContainer.querySelectorAll('.rec-var-chk:checked')).map(c => c.value);
        appState.recSelectedVars = chosen;
        renderRecommendationsView();
      });
    });
  }

  const recOut = evaluateRecommendations(appState.profile, {
    objective: appState.recObjective,
    audience: appState.recAudience,
    variables: appState.recSelectedVars
  });

  const banner = document.getElementById('rec-signature-banner');
  if (banner) {
    banner.innerHTML = `<strong>Detected Data Structure Signature:</strong> ${recOut.structuralSummary}`;
  }

  const grid = document.getElementById('recommendations-grid');
  if (!grid) return;

  const filtered = appState.recTierFilter === 'all'
    ? recOut.recommendations.slice(0, 14)
    : recOut.recommendations.filter(r => r.suitability === appState.recTierFilter);

  grid.innerHTML = filtered.map(r => {
    const badgeClass = r.suitability === 'Recommended'
      ? 'badge-primary'
      : r.suitability === 'Appropriate alternative'
        ? 'badge-info'
        : r.suitability === 'Conditionally suitable'
          ? 'badge-warning'
          : 'badge-error';

    return `
      <div class="card card-compact">
        <div class="card-header">
          <div>
            <h3 style="margin:0;">${r.chartName}</h3>
            <span class="card-subtitle">${r.familyGroup} • ${r.category}</span>
          </div>
          <span class="badge ${badgeClass}">${r.suitability}</span>
        </div>

        <div style="font-size:13px; display:flex; flex-direction:column; gap:6px;">
          <div><strong>Suitability:</strong> ${r.whySuitable}</div>
          <details class="collapsible-panel">
            <summary>Structure, Trade-Offs &amp; Alternatives</summary>
            <div class="collapsible-body" style="display:flex; flex-direction:column; gap:4px; font-size:12px;">
              <div><strong>Required structure:</strong> ${r.requiredVariables}</div>
              <div><strong>Transformations:</strong> ${r.requiredTransformations}</div>
              <div><strong>Reveals:</strong> ${r.whatItReveals}</div>
              <div><strong>May obscure:</strong> ${r.whatItObscures}</div>
              <div><strong>When another is better:</strong> ${r.whenAnotherBetter}</div>
              <div><strong>Alternatives:</strong> ${r.alternatives.slice(0, 4).join(', ')}</div>
            </div>
          </details>
        </div>

        <div style="display:flex; gap:8px; margin-top:auto; padding-top:6px;">
          <button type="button" class="btn btn-primary btn-sm" data-launch-rec-chart="${r.chartId}">Build in Chart Studio →</button>
          <button type="button" class="btn btn-sm" data-inspect-atlas-chart="${r.chartId}">View in Atlas</button>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('[data-launch-rec-chart]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cId = btn.getAttribute('data-launch-rec-chart');
      applyRecommendedChartToStudio(cId);
      navigateToView('studio');
    });
  });

  grid.querySelectorAll('[data-inspect-atlas-chart]').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.selectedAtlasChartId = btn.getAttribute('data-inspect-atlas-chart');
      navigateToView('atlas');
    });
  });
}

function applyRecommendedChartToStudio(chartId) {
  pushStudioHistory();
  appState.chartConfig.chartType = chartId;
  const prof = appState.profile;
  if (prof) {
    const catVars = prof.variables.filter(v => v.taxonomy.family === 'categorical').map(v => v.name);
    const quantVars = prof.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name);
    const tempVars = prof.variables.filter(v => v.taxonomy.family === 'temporal').map(v => v.name);

    if (['histogram', 'frequency_polygon', 'kde_density', 'ecdf_plot', 'boxplot'].includes(chartId) && quantVars[0]) {
      appState.chartConfig.x = quantVars[0];
    } else if (['scatter_plot', 'scatter_ols', 'hexbin_2d', 'residual_fitted'].includes(chartId) && quantVars.length >= 2) {
      appState.chartConfig.x = quantVars[0];
      appState.chartConfig.y = quantVars[1];
    } else if (['line_chart', 'area_chart', 'stacked_area', 'seasonal_plot'].includes(chartId) && tempVars[0] && quantVars[0]) {
      appState.chartConfig.x = tempVars[0];
      appState.chartConfig.y = quantVars[0];
    } else if (['grouped_boxplot', 'violin_plot', 'strip_plot', 'beeswarm_plot'].includes(chartId) && catVars[0] && quantVars[0]) {
      appState.chartConfig.x = catVars[0];
      appState.chartConfig.y = quantVars[0];
    }
  }
  syncStudioControlsFromState();
}

// ============================================================================
// DESTINATION 4: CHART STUDIO WORKSPACE
// ============================================================================
function populateChartStudioSelectors() {
  const chartSel = document.getElementById('studio-chart-type');
  const compSel = document.getElementById('studio-compare-chart-type');
  if (!chartSel) return;

  const groups = new Map();
  for (const c of CHART_REGISTRY) {
    if (!groups.has(c.familyGroup)) groups.set(c.familyGroup, []);
    groups.get(c.familyGroup).push(c);
  }

  let html = '';
  for (const [gName, items] of groups.entries()) {
    html += `<optgroup label="${gName}">` +
      items.map(c => `<option value="${c.id}">${c.name}</option>`).join('') +
      `</optgroup>`;
  }
  chartSel.innerHTML = html;
  if (compSel) compSel.innerHTML = html;
}

function pushStudioHistory() {
  appState.studioHistory.push(JSON.parse(JSON.stringify(appState.chartConfig)));
  if (appState.studioHistory.length > 40) appState.studioHistory.shift();
  appState.studioRedoStack = [];
}

function studioUndo() {
  if (appState.studioHistory.length === 0) return;
  appState.studioRedoStack.push(JSON.parse(JSON.stringify(appState.chartConfig)));
  appState.chartConfig = appState.studioHistory.pop();
  syncStudioControlsFromState();
  renderChartStudioWorkspace();
  showToast('Undid chart edit.');
}

function studioRedo() {
  if (appState.studioRedoStack.length === 0) return;
  appState.studioHistory.push(JSON.parse(JSON.stringify(appState.chartConfig)));
  appState.chartConfig = appState.studioRedoStack.pop();
  syncStudioControlsFromState();
  renderChartStudioWorkspace();
  showToast('Redid chart edit.');
}

function syncStudioControlsFromState() {
  const prof = appState.profile;
  if (!prof) return;
  const cols = prof.headers;
  const reqOpts = cols.map(c => `<option value="${c}">${c} (${prof.variableMap[c]?.taxonomy.shortLabel || ''})</option>`).join('');
  const optNone = `<option value="">— None —</option>` + reqOpts;

  const setSelectOptions = (id, html, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = html;
    el.value = cols.includes(val) ? val : (html.startsWith('<option value="">') ? '' : (cols[0] || ''));
  };

  setSelectOptions('studio-map-x', reqOpts, appState.chartConfig.x);
  setSelectOptions('studio-map-y', optNone, appState.chartConfig.y);
  setSelectOptions('studio-map-color', optNone, appState.chartConfig.color);
  setSelectOptions('studio-map-size', optNone, appState.chartConfig.size);
  setSelectOptions('studio-map-facet', optNone, appState.chartConfig.facet);

  const cfg = appState.chartConfig;
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v;
  };
  const setChk = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(v);
  };

  setVal('studio-chart-type', cfg.chartType);
  setVal('studio-agg-func', cfg.aggFunc);
  setVal('studio-sort-order', cfg.sortOrder);
  setVal('studio-hist-scale', cfg.histScale);
  setVal('studio-bin-count', cfg.binCount);
  setVal('studio-bw-mult', cfg.bandwidthMultiplier);
  setVal('studio-uncertainty-type', cfg.uncertaintyType);
  setVal('studio-size-encoding', cfg.sizeEncoding);
  setVal('studio-y-baseline', cfg.yBaseline);
  setVal('studio-palette', cfg.palette);
  setVal('studio-opacity', cfg.opacity);
  setVal('studio-point-radius', cfg.pointRadius);
  setVal('studio-title-input', cfg.title);
  setVal('studio-ref-line', cfg.referenceLineValue);
  setVal('studio-annotation', cfg.annotationText);

  setChk('studio-log-x', cfg.logScaleX);
  setChk('studio-log-y', cfg.logScaleY);
  setChk('studio-show-ols', cfg.showOLS);
  setChk('studio-show-quad', cfg.showQuadratic);
  setChk('studio-show-raw-points', cfg.showRawPoints);

  const binLbl = document.getElementById('studio-bin-count-val');
  if (binLbl) binLbl.textContent = String(cfg.binCount);
  const bwLbl = document.getElementById('studio-bw-mult-val');
  if (bwLbl) bwLbl.textContent = `${Number(cfg.bandwidthMultiplier).toFixed(2)}×`;
  const opLbl = document.getElementById('studio-opacity-val');
  if (opLbl) opLbl.textContent = Number(cfg.opacity).toFixed(2);
  const radLbl = document.getElementById('studio-radius-val');
  if (radLbl) radLbl.textContent = Number(cfg.pointRadius).toFixed(1);

  updateStudioContextAwareControls(cfg.chartType);
}

function updateStudioContextAwareControls(chartType) {
  const show = (id, cond) => {
    const el = document.getElementById(id);
    if (el) el.style.display = cond ? 'flex' : 'none';
  };
  show('studio-ctrl-hist-scale', ['histogram', 'frequency_polygon'].includes(chartType));
  show('studio-ctrl-bins', ['histogram', 'frequency_polygon', 'hexbin_2d'].includes(chartType));
  show('studio-ctrl-bw', ['kde_density', 'density_overlay', 'ridgeline_plot', 'violin_plot'].includes(chartType));
  show('studio-ctrl-uncertainty', ['point_interval', 'error_bars', 'interval_ribbon'].includes(chartType));
  show('studio-ctrl-bubble-enc', ['bubble_plot', 'geo_bubble_map'].includes(chartType));
  show('studio-group-size', ['bubble_plot', 'geo_bubble_map'].includes(chartType));
  show('studio-group-facet', chartType === 'small_multiples');
}

function wireChartStudioEvents() {
  const bindControl = (id, key, isCheckbox = false, isNumeric = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      pushStudioHistory();
      let val = isCheckbox ? el.checked : el.value;
      if (isNumeric && val !== '') val = Number(val);
      appState.chartConfig[key] = val;
      syncStudioControlsFromState();
      renderChartStudioWorkspace();
    });
    if (el.type === 'range' || el.type === 'text') {
      el.addEventListener('input', () => {
        let val = el.value;
        if (isNumeric && val !== '') val = Number(val);
        appState.chartConfig[key] = val;
        syncStudioControlsFromState();
        renderChartStudioWorkspace();
      });
    }
  };

  bindControl('studio-chart-type', 'chartType');
  bindControl('studio-map-x', 'x');
  bindControl('studio-map-y', 'y');
  bindControl('studio-map-color', 'color');
  bindControl('studio-map-size', 'size');
  bindControl('studio-map-facet', 'facet');
  bindControl('studio-agg-func', 'aggFunc');
  bindControl('studio-sort-order', 'sortOrder');
  bindControl('studio-hist-scale', 'histScale');
  bindControl('studio-bin-count', 'binCount', false, true);
  bindControl('studio-bw-mult', 'bandwidthMultiplier', false, true);
  bindControl('studio-uncertainty-type', 'uncertaintyType');
  bindControl('studio-size-encoding', 'sizeEncoding');
  bindControl('studio-y-baseline', 'yBaseline', false, true);
  bindControl('studio-palette', 'palette');
  bindControl('studio-opacity', 'opacity', false, true);
  bindControl('studio-point-radius', 'pointRadius', false, true);
  bindControl('studio-log-x', 'logScaleX', true);
  bindControl('studio-log-y', 'logScaleY', true);
  bindControl('studio-show-ols', 'showOLS', true);
  bindControl('studio-show-quad', 'showQuadratic', true);
  bindControl('studio-show-raw-points', 'showRawPoints', true);
  bindControl('studio-title-input', 'title');
  bindControl('studio-ref-line', 'referenceLineValue');
  bindControl('studio-annotation', 'annotationText');

  document.getElementById('studio-btn-undo')?.addEventListener('click', studioUndo);
  document.getElementById('studio-btn-redo')?.addEventListener('click', studioRedo);
  document.getElementById('studio-btn-reset')?.addEventListener('click', () => {
    loadPresetDataset(appState.datasetId, true);
  });

  // Comparison mode toggle
  const compToggle = document.getElementById('studio-compare-toggle');
  const compSel = document.getElementById('studio-compare-chart-type');
  if (compToggle && compSel) {
    compToggle.addEventListener('change', () => {
      appState.compareMode = compToggle.checked;
      compSel.style.display = appState.compareMode ? 'inline-block' : 'none';
      const compCont = document.getElementById('studio-compare-container');
      const grid = document.getElementById('studio-canvas-grid');
      if (compCont) compCont.style.display = appState.compareMode ? 'block' : 'none';
      if (grid) grid.style.gridTemplateColumns = appState.compareMode ? 'repeat(2, minmax(0, 1fr))' : '1fr';
      compSel.value = appState.compareChartType;
      renderChartStudioWorkspace();
    });
    compSel.addEventListener('change', () => {
      appState.compareChartType = compSel.value;
      renderChartStudioWorkspace();
    });
  }

  // Hover, Click Selection, & Keyboard Inspection on Main and Comparison Canvases
  const mainCanvas = document.getElementById('studio-main-canvas');
  const mainTooltip = document.getElementById('studio-main-tooltip');
  if (mainCanvas && mainTooltip) {
    mainCanvas.addEventListener('mousemove', e => {
      handleCanvasHover(e, mainCanvas, mainTooltip, appState.lastHitRegions);
    });
    mainCanvas.addEventListener('mouseleave', () => {
      mainTooltip.style.display = 'none';
    });
    mainCanvas.addEventListener('click', e => {
      handleCanvasClickSelect(e, mainCanvas, appState.lastHitRegions);
    });
  }

  const compCanvas = document.getElementById('studio-compare-canvas');
  const compTooltip = document.getElementById('studio-compare-tooltip');
  if (compCanvas && compTooltip) {
    compCanvas.addEventListener('mousemove', e => {
      handleCanvasHover(e, compCanvas, compTooltip, appState.lastCompareHitRegions);
    });
    compCanvas.addEventListener('mouseleave', () => {
      compTooltip.style.display = 'none';
    });
    compCanvas.addEventListener('click', e => {
      handleCanvasClickSelect(e, compCanvas, appState.lastCompareHitRegions);
    });
  }

  document.getElementById('studio-btn-clear-selection')?.addEventListener('click', () => {
    appState.selectedMarkLabel = null;
    updateSelectionButtons();
    renderChartStudioWorkspace();
  });

  document.getElementById('studio-btn-filter-selected')?.addEventListener('click', () => {
    if (!appState.selectedMarkLabel) return;
    const label = appState.selectedMarkLabel;
    // Check if label is "Observation #k" or a category value on X
    const obsMatch = label.match(/^Observation #(\d+)$/);
    if (obsMatch) {
      const idx = Number(obsMatch[1]) - 1;
      const targetRow = appState.activeRows[idx];
      if (targetRow && appState.chartConfig.x) {
        appState.transformations.push({
          type: 'filter',
          column: appState.chartConfig.x,
          operator: 'neq',
          value: String(targetRow[appState.chartConfig.x])
        });
      }
    } else if (appState.chartConfig.x) {
      appState.transformations.push({
        type: 'filter',
        column: appState.chartConfig.x,
        operator: 'neq',
        value: label
      });
    }
    appState.selectedMarkLabel = null;
    updateSelectionButtons();
    recomputeDatasetPipeline();
    refreshAllViews();
    showToast(`Filtered out "${label}" (Undo anytime in Understand Data).`);
  });

  const keyInsp = document.getElementById('studio-keyboard-inspector');
  if (keyInsp) {
    keyInsp.addEventListener('change', () => {
      const idx = Number(keyInsp.value);
      const hit = appState.lastHitRegions[idx];
      const readout = document.getElementById('studio-live-readout');
      if (hit && readout) {
        appState.selectedMarkLabel = hit.label;
        readout.textContent = `Selected: ${hit.label} — ${hit.details}`;
        updateSelectionButtons();
        renderChartStudioWorkspace();
      }
    });
  }

  wireExportButtons();
}

function findHitRegionAtEvent(e, canvas, hitRegions) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  for (let i = hitRegions.length - 1; i >= 0; i--) {
    const h = hitRegions[i];
    if (h.shape === 'circle') {
      const dist = Math.hypot(mx - h.x, my - h.y);
      if (dist <= (h.r || 10)) {
        return { matched: h, mx, my, rect };
      }
    } else if (h.shape === 'rect') {
      if (mx >= h.x && mx <= h.x + h.w && my >= h.y && my <= h.y + h.h) {
        return { matched: h, mx, my, rect };
      }
    }
  }
  return { matched: null, mx, my, rect };
}

function handleCanvasHover(e, canvas, tooltipEl, hitRegions) {
  const { matched, mx, my, rect } = findHitRegionAtEvent(e, canvas, hitRegions || []);
  if (matched) {
    tooltipEl.style.display = 'block';
    tooltipEl.style.left = `${Math.min(rect.width - 240, Math.max(8, mx + 12))}px`;
    tooltipEl.style.top = `${Math.max(8, my - 36)}px`;
    tooltipEl.innerHTML = `<strong>${matched.label}</strong><br>${matched.details}`;
    const readout = document.getElementById('studio-live-readout');
    if (readout && !appState.selectedMarkLabel) {
      readout.textContent = `${matched.label} — ${matched.details}`;
    }
  } else {
    tooltipEl.style.display = 'none';
  }
}

function handleCanvasClickSelect(e, canvas, hitRegions) {
  const { matched } = findHitRegionAtEvent(e, canvas, hitRegions || []);
  const readout = document.getElementById('studio-live-readout');
  if (matched) {
    appState.selectedMarkLabel = matched.label;
    if (readout) readout.textContent = `Selected: ${matched.label} — ${matched.details}`;
  } else {
    appState.selectedMarkLabel = null;
    if (readout) readout.textContent = 'Move pointer over chart or click a mark to select →';
  }
  updateSelectionButtons();
  renderChartStudioWorkspace();
}

function updateSelectionButtons() {
  const filterBtn = document.getElementById('studio-btn-filter-selected');
  const clearBtn = document.getElementById('studio-btn-clear-selection');
  const hasSel = Boolean(appState.selectedMarkLabel);
  if (filterBtn) filterBtn.style.display = hasSel ? 'inline-flex' : 'none';
  if (clearBtn) clearBtn.style.display = hasSel ? 'inline-flex' : 'none';
}

function highlightSelectedMarkOnCanvas(canvas, hitRegions, selectedLabel) {
  if (!canvas || !selectedLabel || !Array.isArray(hitRegions)) return;
  const hit = hitRegions.find(h => h.label === selectedLabel);
  if (!hit) return;
  const ctx = canvas.getContext('2d');
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? Math.min(2.5, window.devicePixelRatio) : 1;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.strokeStyle = '#C84B31';
  ctx.lineWidth = 3;
  if (hit.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(hit.x, hit.y, (hit.r || 8) + 4, 0, 2 * Math.PI);
    ctx.stroke();
  } else if (hit.shape === 'rect') {
    ctx.strokeRect(hit.x - 2, hit.y - 2, hit.w + 4, hit.h + 4);
  }
  ctx.restore();
}

function renderChartStudioWorkspace() {
  const canvas = document.getElementById('studio-main-canvas');
  if (!canvas || !appState.profile) return;

  const chart = getChartById(appState.chartConfig.chartType);
  const heading = document.getElementById('studio-canvas-heading');
  if (heading) heading.textContent = `${chart.name} — ${appState.datasetTitle}`;

  const res = renderChartOnCanvas(canvas, appState.activeRows, appState.profile, appState.chartConfig);
  appState.lastHitRegions = res.hitRegions || [];
  if (appState.selectedMarkLabel) {
    highlightSelectedMarkOnCanvas(canvas, appState.lastHitRegions, appState.selectedMarkLabel);
  }

  // Comparison Canvas if enabled
  if (appState.compareMode) {
    const compCanvas = document.getElementById('studio-compare-canvas');
    if (compCanvas) {
      const compRes = renderChartOnCanvas(compCanvas, appState.activeRows, appState.profile, {
        ...appState.chartConfig,
        chartType: appState.compareChartType,
        title: `Comparison: ${getChartById(appState.compareChartType).name}`
      });
      appState.lastCompareHitRegions = compRes.hitRegions || [];
      if (appState.selectedMarkLabel) {
        highlightSelectedMarkOnCanvas(compCanvas, appState.lastCompareHitRegions, appState.selectedMarkLabel);
      }
    }
  }

  // Populate Keyboard Inspector
  const keyInsp = document.getElementById('studio-keyboard-inspector');
  if (keyInsp) {
    keyInsp.innerHTML = `<option value="-1">Select mark (${appState.lastHitRegions.length} items)...</option>` +
      appState.lastHitRegions.slice(0, 60).map((h, idx) => `<option value="${idx}">${h.label}</option>`).join('');
  }

  // Update 3-Part Adaptive Interpretation Panel
  if (res.interpretation) {
    const modeObj = res.interpretation[appState.explanationLevel] || res.interpretation.standard;
    const lookEl = document.getElementById('interp-looking-at');
    const revEl = document.getElementById('interp-reveals');
    const cautEl = document.getElementById('interp-caution');
    if (lookEl) lookEl.textContent = modeObj.lookingAt;
    if (revEl) revEl.textContent = modeObj.reveals;
    if (cautEl) cautEl.textContent = modeObj.caution;
  }

  // Update Integrity Audit Warnings (Part 16)
  const warnings = auditChartIntegrity(appState.chartConfig, appState.profile, appState.activeRows);
  const warnBadge = document.getElementById('integrity-count-badge');
  const warnContainer = document.getElementById('studio-integrity-warnings');
  if (warnBadge) {
    warnBadge.textContent = `${warnings.length} Notice(s)`;
    warnBadge.className = `badge ${warnings.some(w => w.severity === 'fatal') ? 'badge-error' : warnings.length > 0 ? 'badge-warning' : 'badge-primary'}`;
  }

  if (warnContainer) {
    if (warnings.length === 0) {
      warnContainer.innerHTML = `<div class="callout">✓ Zero graphical or mathematical integrity violations detected for this configuration.</div>`;
    } else {
      warnContainer.innerHTML = warnings.map((w, idx) => {
        const cls = w.severity === 'fatal' ? 'callout-error' : w.severity === 'warning' ? 'callout-warning' : 'callout-info';
        return `
          <div class="callout ${cls}">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
              <strong>${w.statement}</strong>
              <span class="badge">${w.severity.toUpperCase()}</span>
            </div>
            <details class="collapsible-panel">
              <summary>Diagnostic Rationale &amp; Correction</summary>
              <div class="collapsible-body" style="font-size:12px; display:flex; flex-direction:column; gap:4px;">
                <div><strong>Reason:</strong> ${w.reason}</div>
                <div><strong>Effect:</strong> ${w.interpretiveEffect}</div>
                <div><strong>Fix:</strong> ${w.suggestedCorrection}</div>
              </div>
            </details>
            <div style="display:flex; gap:6px; margin-top:4px;">
              ${w.autoFix ? `<button type="button" class="btn btn-primary btn-sm" data-autofix-idx="${idx}">⚡ ${w.autoFix.label}</button>` : ''}
              ${w.learnConceptId ? `<button type="button" class="btn btn-sm" data-learn-concept="${w.learnConceptId}">Read Concept →</button>` : ''}
            </div>
          </div>
        `;
      }).join('');

      warnContainer.querySelectorAll('[data-autofix-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const w = warnings[Number(btn.getAttribute('data-autofix-idx'))];
          if (w && w.autoFix && w.autoFix.patch) {
            pushStudioHistory();
            Object.assign(appState.chartConfig, w.autoFix.patch);
            syncStudioControlsFromState();
            renderChartStudioWorkspace();
            showToast(`Applied integrity correction: ${w.autoFix.label}`);
          }
        });
      });

      warnContainer.querySelectorAll('[data-learn-concept]').forEach(btn => {
        btn.addEventListener('click', () => {
          appState.selectedConceptId = btn.getAttribute('data-learn-concept');
          renderLearnLessonDetail();
          navigateToView('learn');
        });
      });
    }
  }

  renderStudioStatisticalSummaryTable(res.summaryData);
}

function renderStudioStatisticalSummaryTable(summaryData = {}) {
  const box = document.getElementById('studio-statistical-summary-box');
  const nBadge = document.getElementById('studio-effective-n-badge');
  if (nBadge) nBadge.textContent = `Effective n = ${appState.activeRows.length}`;
  if (!box) return;

  if (summaryData.diag && summaryData.diag.valid) {
    const d = summaryData.diag;
    box.innerHTML = `
      <div class="table-scroll">
        <table class="data-table" aria-label="OLS Regression Computer Output Table">
          <thead>
            <tr>
              <th>Term / Predictor</th>
              <th class="numeric">Coef (β̂)</th>
              <th class="numeric">SE Coef</th>
              <th class="numeric">T-Stat</th>
              <th class="numeric">P-Value</th>
              <th class="numeric">95% CI Lower</th>
              <th class="numeric">95% CI Upper</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>(Intercept)</strong></td>
              <td class="numeric">${d.intercept.toFixed(4)}</td>
              <td class="numeric">${d.seIntercept.toFixed(4)}</td>
              <td class="numeric">${d.tIntercept.toFixed(2)}</td>
              <td class="numeric">${d.pIntercept < 0.0001 ? '< 0.0001' : d.pIntercept.toFixed(4)}</td>
              <td class="numeric">${d.interceptCI95[0].toFixed(4)}</td>
              <td class="numeric">${d.interceptCI95[1].toFixed(4)}</td>
            </tr>
            <tr>
              <td><strong>${summaryData.xCol || 'Slope X'}</strong></td>
              <td class="numeric">${d.slope.toFixed(4)}</td>
              <td class="numeric">${d.seSlope.toFixed(4)}</td>
              <td class="numeric">${d.tSlope.toFixed(2)}</td>
              <td class="numeric">${d.pSlope < 0.0001 ? '< 0.0001' : d.pSlope.toFixed(4)}</td>
              <td class="numeric">${d.slopeCI95[0].toFixed(4)}</td>
              <td class="numeric">${d.slopeCI95[1].toFixed(4)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="margin-top:8px; font-family:var(--font-mono); font-size:12px;">
        S = ${d.sResid.toFixed(4)} &nbsp;|&nbsp; R-Sq = ${(d.r2 * 100).toFixed(2)}% &nbsp;|&nbsp; R-Sq(adj) = ${(d.r2Adj * 100).toFixed(2)}% &nbsp;|&nbsp; Pearson r = ${d.r.toFixed(4)} &nbsp;|&nbsp; Spearman ρ = ${d.spearmanRho.toFixed(4)} &nbsp;|&nbsp; F(1, ${d.df}) = ${d.fStat.toFixed(2)}
      </div>
    `;
  } else if (summaryData.groupStats && summaryData.groupStats.length > 0) {
    box.innerHTML = `
      <div class="table-scroll">
        <table class="data-table" aria-label="Grouped Distribution Summary Table">
          <thead>
            <tr>
              <th>Group / Cohort</th>
              <th class="numeric">n</th>
              <th class="numeric">Mean</th>
              <th class="numeric">SD</th>
              <th class="numeric">SE</th>
              <th class="numeric">Min</th>
              <th class="numeric">Q1 (25%)</th>
              <th class="numeric">Median (50%)</th>
              <th class="numeric">Q3 (75%)</th>
              <th class="numeric">Max</th>
            </tr>
          </thead>
          <tbody>
            ${summaryData.groupStats.map(g => {
              const s = g.stats;
              return `
                <tr>
                  <td><strong>${g.key}</strong></td>
                  <td class="numeric">${s.n}</td>
                  <td class="numeric">${s.mean.toFixed(3)}</td>
                  <td class="numeric">${s.sd.toFixed(3)}</td>
                  <td class="numeric">${s.se.toFixed(3)}</td>
                  <td class="numeric">${s.min.toFixed(3)}</td>
                  <td class="numeric">${s.q1.toFixed(3)}</td>
                  <td class="numeric">${s.median.toFixed(3)}</td>
                  <td class="numeric">${s.q3.toFixed(3)}</td>
                  <td class="numeric">${s.max.toFixed(3)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (summaryData.items && summaryData.items.length > 0) {
    box.innerHTML = `
      <div class="table-scroll">
        <table class="data-table" aria-label="Categorical Summary Equivalent Table">
          <thead>
            <tr>
              <th>Category / Group</th>
              <th class="numeric">Observation Count (n)</th>
              <th class="numeric">Displayed Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${summaryData.items.map(it => `
              <tr>
                <td><strong>${it.key}</strong></td>
                <td class="numeric">${it.n ?? '-'}</td>
                <td class="numeric">${Number(it.value ?? it.est ?? 0).toFixed(3)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else {
    box.innerHTML = `<div class="card-subtitle">Active chart rendered across n = ${appState.activeRows.length} observations. Use the Understand Data tab for full column-by-column statistics.</div>`;
  }
}

// ============================================================================
// EXPORTS & REPRODUCIBILITY HANDLERS (Part 17)
// ============================================================================
function downloadFileBlob(filename, content, mimeType = 'text/plain;charset=utf-8') {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function wireExportButtons() {
  document.getElementById('btn-export-svg')?.addEventListener('click', () => {
    const canvas = document.getElementById('studio-main-canvas');
    const svg = renderChartToSVG(canvas, appState.chartConfig, appState.profile, appState.activeRows);
    downloadFileBlob(`visualgrammar_${appState.chartConfig.chartType}.svg`, svg, 'image/svg+xml;charset=utf-8');
    showToast('Exported vector SVG chart.');
  });

  document.getElementById('btn-export-png')?.addEventListener('click', () => {
    const canvas = document.getElementById('studio-main-canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `visualgrammar_${appState.chartConfig.chartType}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Exported high-DPI PNG chart.');
  });

  document.getElementById('btn-export-csv')?.addEventListener('click', () => {
    const csv = exportToCSV(appState.activeRows, appState.activeHeaders, appState.provenanceLog);
    downloadFileBlob(`visualgrammar_${appState.datasetId}.csv`, csv, 'text/csv;charset=utf-8');
    showToast('Exported RFC 4180 CSV with formula-injection protection.');
  });

  document.getElementById('btn-export-config-json')?.addEventListener('click', () => {
    const json = exportConfigurationJSON(appState);
    downloadFileBlob(`visualgrammar_config_${appState.datasetId}.json`, json, 'application/json;charset=utf-8');
    showToast('Exported reproducible configuration JSON.');
  });

  document.getElementById('btn-export-datasense-json')?.addEventListener('click', () => {
    const json = exportDataSenseDatasetJSON(appState, false);
    downloadFileBlob(`datasense_dataset_${appState.datasetId}.json`, json, 'application/json;charset=utf-8');
    showToast('Exported DataSenseDataset v1.0.0 interchange JSON.');
  });

  document.getElementById('btn-export-r')?.addEventListener('click', () => {
    const rCode = exportToRScript(appState.activeRows, appState.chartConfig, appState.datasetTitle);
    downloadFileBlob(`visualgrammar_${appState.chartConfig.chartType}.R`, rCode, 'text/plain;charset=utf-8');
    showToast('Exported reproducible R (ggplot2) script.');
  });

  document.getElementById('btn-export-python')?.addEventListener('click', () => {
    const pyCode = exportToPythonScript(appState.activeRows, appState.chartConfig, appState.datasetTitle);
    downloadFileBlob(`visualgrammar_${appState.chartConfig.chartType}.py`, pyCode, 'text/plain;charset=utf-8');
    showToast('Exported reproducible Python script.');
  });

  document.getElementById('btn-export-latex')?.addEventListener('click', () => {
    const tex = exportToLatexTable(appState.profile, appState.datasetTitle);
    downloadFileBlob(`visualgrammar_${appState.datasetId}_table.tex`, tex, 'text/plain;charset=utf-8');
    showToast('Exported publication LaTeX booktabs table.');
  });

  document.getElementById('btn-copy-share-hash')?.addEventListener('click', () => {
    const hash = encodeShareableHash(appState);
    window.location.hash = hash;
    const fullUrl = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        showToast('Shareable configuration URL copied to clipboard!');
      }).catch(() => {
        showToast('Updated URL hash in address bar.');
      });
    } else {
      showToast('Updated shareable URL hash in address bar.');
    }
  });

  document.getElementById('btn-import-config-json')?.addEventListener('click', openUploadModal);
}

// ============================================================================
// DESTINATION 5: KNOWN VISUALIZATION UNITY (Part 10)
// ============================================================================
function populateUnityControls() {
  const grpSel = document.getElementById('unity-group-select');
  if (grpSel) {
    grpSel.innerHTML = UNITY_GROUPS.map(g => `<option value="${g.id}" ${g.id === appState.activeUnityGroupId ? 'selected' : ''}>${g.title}</option>`).join('');
  }

  for (let i = 0; i < 4; i++) {
    const slotSel = document.getElementById(`unity-slot-select-${i}`);
    if (slotSel) {
      slotSel.innerHTML = CHART_REGISTRY.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
  }

  const ontBody = document.getElementById('unity-ontology-tbody');
  if (ontBody) {
    ontBody.innerHTML = SIMILARITY_ONTOLOGY.map(rel => `
      <tr>
        <td><strong>${getChartById(rel.fromChart).name}</strong></td>
        <td><strong>${getChartById(rel.toChart).name}</strong></td>
        <td><span class="badge badge-info">${rel.relationshipType}</span></td>
        <td>${rel.sharedTarget}</td>
        <td>${rel.transformationDiff}</td>
        <td>${rel.infoPreservation} <br><em>Caution: ${rel.caution}</em></td>
      </tr>
    `).join('');
  }
}

function wireUnityLabEvents() {
  const grpSel = document.getElementById('unity-group-select');
  if (grpSel) {
    grpSel.addEventListener('change', () => {
      appState.activeUnityGroupId = grpSel.value;
      const grp = UNITY_GROUPS.find(g => g.id === grpSel.value) || UNITY_GROUPS[0];
      appState.unitySlotCharts = [
        grp.defaultViews[0] || 'histogram',
        grp.defaultViews[1] || 'kde_density',
        grp.defaultViews[2] || 'ecdf_plot',
        grp.defaultViews[3] || grp.defaultViews[0] || 'boxplot'
      ];
      renderUnityWorkbench();
    });
  }

  for (let i = 0; i < 4; i++) {
    const slotSel = document.getElementById(`unity-slot-select-${i}`);
    if (slotSel) {
      slotSel.addEventListener('change', () => {
        appState.unitySlotCharts[i] = slotSel.value;
        renderUnityWorkbench();
      });
    }
    const uCanvas = document.getElementById(`unity-canvas-${i}`);
    const uTooltip = document.getElementById(`unity-tooltip-${i}`);
    if (uCanvas && uTooltip) {
      uCanvas.addEventListener('mousemove', e => {
        handleCanvasHover(e, uCanvas, uTooltip, appState.lastUnityHitRegions[i]);
      });
      uCanvas.addEventListener('mouseleave', () => {
        uTooltip.style.display = 'none';
      });
    }
  }

  const binSl = document.getElementById('unity-bin-slider');
  if (binSl) {
    binSl.addEventListener('input', () => {
      appState.unityBins = Number(binSl.value);
      const lbl = document.getElementById('unity-bin-val');
      if (lbl) lbl.textContent = String(appState.unityBins);
      renderUnityWorkbench();
    });
  }

  const bwSl = document.getElementById('unity-bw-slider');
  if (bwSl) {
    bwSl.addEventListener('input', () => {
      appState.unityBandwidth = Number(bwSl.value);
      const lbl = document.getElementById('unity-bw-val');
      if (lbl) lbl.textContent = `${appState.unityBandwidth.toFixed(2)}×`;
      renderUnityWorkbench();
    });
  }

  document.getElementById('btn-run-unity-bootstrap')?.addEventListener('click', renderUnityBootstrapComparison);
}

function renderUnityWorkbench() {
  const grp = UNITY_GROUPS.find(g => g.id === appState.activeUnityGroupId) || UNITY_GROUPS[0];
  const preset = getPresetById(grp.presetId);
  const unityProfile = profileDataset(preset.rows, preset.headers, preset.overrides || {});

  const banner = document.getElementById('unity-invariant-banner');
  if (banner) {
    banner.innerHTML = `
      <strong>Active Unity Group: ${grp.title}</strong> — Dataset: <em>${preset.title}</em><br>
      <strong>Data Signature:</strong> ${grp.dataSignature} &nbsp;|&nbsp; <strong>Preserved Invariant Across All 4 Views:</strong> ${grp.sharedInvariant}
    `;
  }

  const baseMap = grp.overrideMapping || preset.defaultMappings || {};

  for (let i = 0; i < 4; i++) {
    const chartType = appState.unitySlotCharts[i] || grp.defaultViews[i] || 'histogram';
    const slotSel = document.getElementById(`unity-slot-select-${i}`);
    if (slotSel && slotSel.value !== chartType) slotSel.value = chartType;

    const titleEl = document.getElementById(`unity-slot-title-${i}`);
    const chartObj = getChartById(chartType);
    if (titleEl) titleEl.textContent = `View ${String.fromCharCode(65 + i)}: ${chartObj.name}`;

    const canvas = document.getElementById(`unity-canvas-${i}`);
    if (canvas) {
      const uRes = renderChartOnCanvas(canvas, preset.rows, unityProfile, {
        ...baseMap,
        chartType,
        binCount: appState.unityBins,
        bandwidthMultiplier: appState.unityBandwidth,
        histScale: 'density'
      });
      appState.lastUnityHitRegions[i] = uRes.hitRegions || [];
    }

    const details = getUnityComparisonDetails(grp.id, chartType);
    const metaEl = document.getElementById(`unity-slot-meta-${i}`);
    if (metaEl) {
      metaEl.innerHTML = `
        <div><strong>Reveals:</strong> ${details.moreVisible}</div>
        <details class="collapsible-panel">
          <summary>Transformation, Invariance &amp; Loss Breakdown</summary>
          <div class="collapsible-body" style="font-size:12px; display:flex; flex-direction:column; gap:4px;">
            <div><strong>What stayed constant:</strong> ${details.stayedConstant}</div>
            <div><strong>Mathematical transformation:</strong> ${details.transformationChanged}</div>
            <div><strong>Visual encoding:</strong> ${details.encodingChanged}</div>
            <div><strong>Lost or Obscured:</strong> ${details.lostOrObscured}</div>
            <div><strong>Normalization effect:</strong> ${details.normalizationEffect}</div>
          </div>
        </details>
      `;
    }
  }

  renderUnityBootstrapComparison();
}

function renderUnityBootstrapComparison() {
  const box = document.getElementById('unity-bootstrap-readout');
  if (!box) return;
  const waferPreset = getPresetById('univariate_wafer_thickness');
  const rawVals = waferPreset.rows.map(r => r.thickness_nm);
  const boot = runBootstrapMean(rawVals, 1000, 4289104);
  if (!boot.valid) return;

  box.innerHTML = `
    <div class="metric-box">
      <span class="metric-label">1. Raw Empirical Spread (SD s)</span>
      <span class="metric-val">${boot.originalSD.toFixed(3)} nm</span>
      <span style="font-size:11px; color:var(--color-text-muted);">Spread of individual wafers around x̄ = ${boot.originalMean.toFixed(2)} nm</span>
    </div>
    <div class="metric-box">
      <span class="metric-label">2. Sampling Dist. Spread (SE = s/√n)</span>
      <span class="metric-val">${boot.bootstrapSE.toFixed(3)} nm</span>
      <span style="font-size:11px; color:var(--color-text-muted);">Spread of B = ${boot.replicates} bootstrap sample means x̄*</span>
    </div>
    <div class="metric-box">
      <span class="metric-label">3. 95% Bootstrap CI for Mean μ</span>
      <span class="metric-val">[${boot.ci95Percentile[0].toFixed(2)}, ${boot.ci95Percentile[1].toFixed(2)}]</span>
      <span style="font-size:11px; color:var(--color-text-muted);">Covers fixed parameter μ in 95% of repeated samples</span>
    </div>
    <div class="metric-box">
      <span class="metric-label">4. 95% Prediction Range (Single Wafer)</span>
      <span class="metric-val">[48.55, 71.65]</span>
      <span style="font-size:11px; color:var(--color-text-muted);">Range for 95% of individual wafer observations</span>
    </div>
  `;
}

// ============================================================================
// DESTINATION 6: VISUALIZATION ATLAS (Part 11)
// ============================================================================
function populateAtlasControls() {
  renderAtlasCatalog();
}

function wireAtlasEvents() {
  ['atlas-search-input', 'atlas-category-filter', 'atlas-objective-filter', 'atlas-support-filter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', renderAtlasCatalog);
      el.addEventListener('change', renderAtlasCatalog);
    }
  });

  document.getElementById('atlas-btn-open-studio')?.addEventListener('click', () => {
    const chart = getChartById(appState.selectedAtlasChartId);
    if (chart.defaultPresetId) loadPresetDataset(chart.defaultPresetId, false);
    applyRecommendedChartToStudio(chart.id);
    navigateToView('studio');
  });

  const demoCanvas = document.getElementById('atlas-demo-canvas');
  const demoTooltip = document.getElementById('atlas-demo-tooltip');
  if (demoCanvas && demoTooltip) {
    demoCanvas.addEventListener('mousemove', e => {
      handleCanvasHover(e, demoCanvas, demoTooltip, appState.lastAtlasHitRegions);
    });
    demoCanvas.addEventListener('mouseleave', () => {
      demoTooltip.style.display = 'none';
    });
  }
}

function renderAtlasCatalog() {
  const listEl = document.getElementById('atlas-catalog-list');
  if (!listEl) return;

  const q = (document.getElementById('atlas-search-input')?.value || '').trim().toLowerCase();
  const cat = document.getElementById('atlas-category-filter')?.value || 'all';
  const obj = document.getElementById('atlas-objective-filter')?.value || 'all';
  const sup = document.getElementById('atlas-support-filter')?.value || 'all';

  const matches = CHART_REGISTRY.filter(c => {
    if (cat !== 'all' && c.category !== cat) return false;
    if (obj !== 'all' && !c.objectives.includes(obj)) return false;
    if (sup !== 'all' && c.supportLevel !== sup) return false;
    if (q) {
      const hay = `${c.name} ${c.altNames.join(' ')} ${c.category} ${c.plainExplanation} ${c.statisticalPurpose}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const countLbl = document.getElementById('atlas-count-label');
  if (countLbl) countLbl.textContent = String(matches.length);

  listEl.innerHTML = matches.map(c => {
    const isSel = c.id === appState.selectedAtlasChartId;
    const tierBadge = c.supportLevel === 'builder'
      ? '<span class="badge badge-primary">Level A: Builder</span>'
      : c.supportLevel === 'atlas_interactive'
        ? '<span class="badge badge-info">Level B: Atlas Interactive</span>'
        : '<span class="badge badge-warning">Level C: Reference / Anti-Pattern</span>';

    return `
      <div class="card card-compact" data-atlas-item="${c.id}" style="cursor:pointer; border-color:${isSel ? 'var(--color-primary)' : 'var(--color-border)'};">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <strong>${c.name}</strong>
          ${tierBadge}
        </div>
        <div class="card-subtitle" style="font-size:12px;">${c.plainExplanation}</div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('[data-atlas-item]').forEach(card => {
    card.addEventListener('click', () => {
      appState.selectedAtlasChartId = card.getAttribute('data-atlas-item');
      renderAtlasCatalog();
      renderAtlasDetail();
    });
  });

  renderAtlasDetail();
}

function renderAtlasDetail() {
  const chart = getChartById(appState.selectedAtlasChartId);
  if (!chart) return;

  const titleEl = document.getElementById('atlas-detail-title');
  const altEl = document.getElementById('atlas-detail-alt');
  if (titleEl) titleEl.textContent = chart.name;
  if (altEl) altEl.textContent = `Also known as: ${chart.altNames.join(', ')} | Category: ${chart.category}`;

  // Render live interactive example on atlas-demo-canvas using its compatible preset
  const demoCanvas = document.getElementById('atlas-demo-canvas');
  if (demoCanvas) {
    const preset = getPresetById(chart.defaultPresetId || 'univariate_wafer_thickness');
    const demoProfile = profileDataset(preset.rows, preset.headers, preset.overrides || {});
    const aRes = renderChartOnCanvas(demoCanvas, preset.rows, demoProfile, {
      ...(preset.defaultMappings || {}),
      chartType: chart.id,
      title: `Live Example: ${chart.name} (${preset.title.slice(0, 34)})`
    });
    appState.lastAtlasHitRegions = aRes.hitRegions || [];
  }

  const specsEl = document.getElementById('atlas-detail-specs');
  if (specsEl) {
    specsEl.innerHTML = `
      <div class="callout"><strong>Plain-Language Summary:</strong> ${chart.plainExplanation}</div>
      <div class="callout callout-info"><strong>Statistical Purpose:</strong> ${chart.statisticalPurpose}</div>
      <details class="collapsible-panel" open>
        <summary>Data Structure, Visual Marks &amp; Mathematical Interpretation</summary>
        <div class="collapsible-body" style="display:flex; flex-direction:column; gap:6px;">
          <div><strong>Required Data Structure:</strong> ${chart.dataStructure}</div>
          <div><strong>Visual Marks &amp; Aesthetics:</strong> ${chart.marksAndAesthetics}</div>
          <div><strong>Applicable Transformations:</strong> ${chart.applicableTransformations.join('; ')}</div>
          <div><strong>Mathematical Interpretation:</strong> ${chart.mathematicalInterpretation}</div>
        </div>
      </details>
      <details class="collapsible-panel">
        <summary>Strengths, Weaknesses &amp; Common Mistakes</summary>
        <div class="collapsible-body" style="display:flex; flex-direction:column; gap:8px;">
          <div class="bento-equal">
            <div class="callout"><strong>Strengths:</strong><br>• ${chart.strengths.join('<br>• ')}</div>
            <div class="callout callout-warning"><strong>Weaknesses:</strong><br>• ${chart.weaknesses.join('<br>• ')}</div>
          </div>
          <div class="bento-equal">
            <div class="callout"><strong>Appropriate Applications:</strong><br>• ${chart.appropriateApplications.join('<br>• ')}</div>
            <div class="callout callout-error"><strong>Inappropriate Uses &amp; Mistakes:</strong><br>• ${[...chart.inappropriateApplications, ...chart.commonMistakes].join('<br>• ')}</div>
          </div>
        </div>
      </details>
      <details class="collapsible-panel">
        <summary>Related Charts, Unity Group &amp; Technical Notes</summary>
        <div class="collapsible-body" style="display:flex; flex-direction:column; gap:4px;">
          <div><strong>Related Charts:</strong> ${chart.relatedCharts.map(id => getChartById(id)?.name || id).join(', ')}</div>
          <div><strong>Known Visualization Unity Group:</strong> <code>${chart.unityGroup}</code></div>
          <div><strong>Technical Specification:</strong> ${chart.technicalDetails}</div>
        </div>
      </details>
    `;
  }
}

// ============================================================================
// DESTINATION 7: CHART LITERACY LAB (Part 12)
// ============================================================================
function populateLiteracyLabControls() {
  const stepsEl = document.getElementById('literacy-reading-steps');
  if (stepsEl) {
    stepsEl.innerHTML = READING_PROTOCOL_STEPS.map(s => `
      <div class="card card-compact" style="background:var(--color-surface-elevated);">
        <h4>${s.title}</h4>
        <p style="font-size:12px; font-weight:600; margin-bottom:4px;">${s.question}</p>
        <ul style="padding-left:16px; font-size:12px; color:var(--color-text-muted);">
          ${s.checklist.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  }

  const expSel = document.getElementById('literacy-exp-select');
  if (expSel) {
    expSel.innerHTML = MISLEADING_EXPERIMENTS.map(e => `<option value="${e.id}">${e.title}</option>`).join('');
  }

  const chalSel = document.getElementById('literacy-challenge-select');
  if (chalSel) {
    chalSel.innerHTML = LITERACY_CHALLENGES.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
  }

  updateLiteracyScoreBadge();
  renderLiteracyExperimentCanvas();
  renderLiteracyChallenge();
}

function wireLiteracyLabEvents() {
  const expSel = document.getElementById('literacy-exp-select');
  if (expSel) {
    expSel.addEventListener('change', () => {
      appState.activeExperimentId = expSel.value;
      renderLiteracyExperimentCanvas();
    });
  }

  document.querySelectorAll('[data-lit-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.experimentMode = btn.getAttribute('data-lit-mode');
      document.querySelectorAll('[data-lit-mode]').forEach(b => b.classList.toggle('active', b === btn));
      renderLiteracyExperimentCanvas();
    });
  });

  const chalSel = document.getElementById('literacy-challenge-select');
  if (chalSel) {
    chalSel.addEventListener('change', () => {
      appState.activeChallengeId = chalSel.value;
      renderLiteracyChallenge();
    });
  }

  document.getElementById('btn-reset-challenges')?.addEventListener('click', () => {
    appState.literacyProgress = {};
    saveLiteracyProgress({});
    updateLiteracyScoreBadge();
    renderLiteracyChallenge();
    showToast('Reset literacy challenge progress.');
  });
}

function renderLiteracyExperimentCanvas() {
  const exp = MISLEADING_EXPERIMENTS.find(e => e.id === appState.activeExperimentId) || MISLEADING_EXPERIMENTS[0];
  const catBadge = document.getElementById('literacy-exp-category-badge');
  if (catBadge) catBadge.textContent = exp.category;

  const isMisleading = appState.experimentMode === 'misleading';
  const expEl = document.getElementById('literacy-exp-explanation');
  if (expEl) {
    expEl.innerHTML = `
      <div class="callout ${isMisleading ? 'callout-error' : ''}">
        <strong>${isMisleading ? '⚠ Active View: Misleading Distortion' : '✓ Active View: Mathematically Corrected Graphic'}</strong>
        <span>${isMisleading ? exp.misleadingSummary : exp.correctedSummary}</span>
      </div>
      <details class="collapsible-panel">
        <summary>Mathematical Mechanism &amp; Design Trade-Off</summary>
        <div class="collapsible-body" style="display:flex; flex-direction:column; gap:6px;">
          <div><strong>Mathematical &amp; Perceptual Mechanism:</strong> ${exp.mathExplanation}</div>
          <div><strong>Design Trade-Off vs Distortion:</strong> ${exp.tradeoffNote}</div>
        </div>
      </details>
    `;
  }

  const canvas = document.getElementById('literacy-exp-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? Math.min(2.5, window.devicePixelRatio) : 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(320, rect.width || 580);
  const h = Math.max(220, rect.height || 260);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.save();
  ctx.scale(dpr, dpr);

  const tokens = getThemeTokens();
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, w, h);

  const pad = { top: 34, right: 28, bottom: 44, left: 64 };
  const pw = w - pad.left - pad.right;
  const ph = h - pad.top - pad.bottom;

  ctx.strokeStyle = tokens.border;
  ctx.strokeRect(pad.left, pad.top, pw, ph);

  ctx.fillStyle = isMisleading ? tokens.secondary : tokens.primary;
  ctx.font = "600 13px 'Inter', sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText(`${exp.title} — ${isMisleading ? 'MISLEADING STATE' : 'CORRECTED STATE'}`, pad.left, 20);

  if (exp.id === 'exp_truncated_bar') {
    const base = isMisleading ? 145 : 0;
    const maxV = 320;
    const span = maxV - base;
    exp.data.forEach((d, idx) => {
      const cx = pad.left + (idx + 0.5) * (pw / 3);
      const bh = ((d.val - base) / span) * ph;
      ctx.fillStyle = isMisleading ? tokens.secondary : tokens.primary;
      ctx.fillRect(cx - 28, pad.top + ph - bh, 56, bh);
      ctx.fillStyle = tokens.text;
      ctx.font = "500 11px 'Inter', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(d.label, cx, pad.top + ph + 18);
      ctx.font = "500 11px 'JetBrains Mono', monospace";
      ctx.fillText(`${d.val} kPa`, cx, pad.top + ph - bh - 6);
    });
    ctx.textAlign = 'right';
    ctx.fillText(`Base=${base}`, pad.left - 6, pad.top + ph);
  } else if (exp.id === 'exp_bubble_radius') {
    const cx1 = pad.left + pw * 0.32;
    const cx2 = pad.left + pw * 0.70;
    const cy = pad.top + ph * 0.52;
    const r1 = 18;
    const r2 = isMisleading ? r1 * 3 : r1 * Math.sqrt(3);
    ctx.fillStyle = isMisleading ? tokens.secondary : tokens.primary;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.arc(cx1, cy, r1, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx2, cy, r2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = tokens.text;
    ctx.font = "500 11px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('Station A: 100 ML/d (1×)', cx1, pad.top + ph + 18);
    ctx.fillText(`Station B: 300 ML/d (${isMisleading ? 'Area = 9× !' : 'Area = 3× ✓'})`, cx2, pad.top + ph + 18);
  } else if (exp.id === 'exp_simpsons_aggregation') {
    const spPreset = getPresetById('simpsons_paradox_clinical');
    const spProf = profileDataset(spPreset.rows, spPreset.headers, spPreset.overrides);
    ctx.restore();
    renderChartOnCanvas(canvas, spPreset.rows, spProf, {
      chartType: 'scatter_ols',
      x: 'dosage_mg',
      y: 'recovery_score',
      color: isMisleading ? '' : 'severity_stratum',
      title: isMisleading ? 'Misleading: Pooled Regression (Negative Slope)' : 'Corrected: Stratified by Severity (Positive Slope in Every Group)'
    });
    return;
  } else if (exp.id === 'exp_aspect_ratio') {
    const activeH = isMisleading ? 26 : ph * 0.82;
    const topOff = pad.top + (ph - activeH) / 2;
    ctx.strokeStyle = tokens.gridMajor;
    ctx.strokeRect(pad.left + 20, topOff, pw - 40, activeH);
    ctx.strokeStyle = isMisleading ? tokens.secondary : tokens.primary;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    exp.data.forEach((pt, i) => {
      const px = pad.left + 20 + (i / (exp.data.length - 1)) * (pw - 40);
      const py = topOff + activeH - ((pt.y - 365) / 68) * activeH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.fillStyle = tokens.text;
    ctx.font = "500 11px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(isMisleading ? 'Compressed 18:1 Aspect Ratio (Flattens +57 ppm CO2 Rise)' : 'Banked ~45° Aspect Ratio (Reveals True Slope & Acceleration)', pad.left + pw / 2, pad.top + ph + 18);
  } else if (exp.id === 'exp_unequal_bins') {
    const totalW = 30;
    const totalN = 64;
    const maxVal = isMisleading ? 26 : 0.065;
    exp.data.forEach(b => {
      const x0 = pad.left + ((b.x0 - 45) / totalW) * pw;
      const bw = (b.w / totalW) * pw;
      const val = isMisleading ? b.count : b.count / (totalN * b.w);
      const bh = (val / maxVal) * ph * 0.88;
      ctx.fillStyle = isMisleading ? tokens.secondary : tokens.primary;
      ctx.globalAlpha = 0.78;
      ctx.fillRect(x0 + 1, pad.top + ph - bh, bw - 2, bh);
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = tokens.text;
      ctx.font = "500 10px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillText(`[${b.x0},${b.x1}) w=${b.w}`, x0 + bw / 2, pad.top + ph + 16);
      ctx.fillText(isMisleading ? `n=${b.count}` : `f̂=${val.toFixed(3)}`, x0 + bw / 2, pad.top + ph - bh - 5);
    });
  } else if (exp.id === 'exp_overplotting') {
    const rng = (i) => ((Math.sin(i * 9301 + 49297) * 233280) % 1 + 1) % 1;
    for (let i = 0; i < 65; i++) {
      const isCluster = i < 48;
      const bx = isCluster ? 0.52 + (rng(i) - 0.5) * (isMisleading ? 0.03 : 0.14) : 0.15 + rng(i * 2) * 0.72;
      const by = isCluster ? 0.48 + (rng(i + 77) - 0.5) * (isMisleading ? 0.03 : 0.16) : 0.18 + rng(i * 3) * 0.65;
      const px = pad.left + bx * pw;
      const py = pad.top + by * ph;
      ctx.fillStyle = isMisleading ? tokens.secondary : tokens.primary;
      ctx.globalAlpha = isMisleading ? 1.0 : 0.34;
      ctx.beginPath();
      ctx.arc(px, py, isMisleading ? 8.5 : 4.8, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = tokens.text;
    ctx.font = "500 11px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(isMisleading ? 'Opaque α = 1.0 (48 Central Points Look Like 2 Dots)' : 'Translucent α = 0.34 + Jitter (Reveals 48-Point Core Cluster)', pad.left + pw / 2, pad.top + ph + 18);
  } else if (exp.id === 'exp_rainbow_scale') {
    const rainbow = ['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF8800', '#FF0000', '#880044'];
    const step = pw / exp.data.length;
    exp.data.forEach((v, i) => {
      const x = pad.left + i * step;
      if (isMisleading) {
        ctx.fillStyle = rainbow[i % rainbow.length];
        ctx.fillRect(x + 3, pad.top + 18, step - 6, ph - 36);
      } else {
        ctx.fillStyle = tokens.primary;
        ctx.globalAlpha = 0.15 + (v / 100) * 0.82;
        ctx.fillRect(x + 3, pad.top + 18, step - 6, ph - 36);
        ctx.globalAlpha = 1.0;
      }
      ctx.fillStyle = tokens.text;
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillText(String(v), x + step / 2, pad.top + ph + 16);
    });
  } else if (exp.id === 'exp_dynamite_plot') {
    const gA = exp.data.groupA;
    const gB = exp.data.groupB;
    const cxA = pad.left + pw * 0.30;
    const cxB = pad.left + pw * 0.70;
    const toY = v => pad.top + ph - (v / 80) * ph;
    if (isMisleading) {
      [cxA, cxB].forEach((cx, idx) => {
        const bh = (50 / 80) * ph;
        ctx.fillStyle = tokens.secondary;
        ctx.fillRect(cx - 32, pad.top + ph - bh, 64, bh);
        ctx.fillStyle = tokens.text;
        ctx.font = "500 11px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(idx === 0 ? 'Group A (Mean=50.0)' : 'Group B (Mean=50.0)', cx, pad.top + ph + 18);
      });
    } else {
      [[cxA, gA, 'Group A (Unimodal)'], [cxB, gB, 'Group B (Bimodal Split!)']].forEach(([cx, arr, lbl]) => {
        arr.forEach((v, i) => {
          const jx = cx + ((i % 3) - 1) * 10;
          ctx.fillStyle = tokens.primary;
          ctx.beginPath();
          ctx.arc(jx, toY(v), 4.5, 0, 2 * Math.PI);
          ctx.fill();
        });
        ctx.strokeStyle = tokens.text;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 22, toY(50));
        ctx.lineTo(cx + 22, toY(50));
        ctx.stroke();
        ctx.fillStyle = tokens.text;
        ctx.font = "500 11px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(lbl, cx, pad.top + ph + 18);
      });
    }
  } else if (exp.id === 'exp_unlabeled_uncertainty') {
    const midY = pad.top + ph * 0.5;
    const toX = v => pad.left + ((v + 12) / 62) * pw;
    const items = isMisleading
      ? [{ label: 'Unlabeled "Error Bar" (±1 SE)', half: exp.data.se, y: midY, col: tokens.secondary }]
      : [
          { label: '±1 SE of Mean (±2.1%)', half: exp.data.se, y: pad.top + ph * 0.25, col: tokens.primary },
          { label: '95% CI for Mean (±4.1%)', half: exp.data.ci, y: pad.top + ph * 0.52, col: tokens.accent },
          { label: '±1 SD Individual Spread (±24.8%)', half: exp.data.sd, y: pad.top + ph * 0.79, col: tokens.warning }
        ];
    items.forEach(it => {
      const xEst = toX(exp.data.est);
      const xL = toX(exp.data.est - it.half);
      const xH = toX(exp.data.est + it.half);
      ctx.strokeStyle = it.col;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(xL, it.y);
      ctx.lineTo(xH, it.y);
      ctx.moveTo(xL, it.y - 6);
      ctx.lineTo(xL, it.y + 6);
      ctx.moveTo(xH, it.y - 6);
      ctx.lineTo(xH, it.y + 6);
      ctx.stroke();
      ctx.fillStyle = it.col;
      ctx.beginPath();
      ctx.arc(xEst, it.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = tokens.text;
      ctx.font = "500 11px 'JetBrains Mono', monospace";
      ctx.textAlign = 'left';
      ctx.fillText(it.label, xH + 8, it.y + 4);
    });
  } else {
    const vals = Array.isArray(exp.data) && exp.data.length > 0
      ? exp.data.map((d, i) => ({
          label: d.label || (d.x0 !== undefined ? `[${d.x0},${d.x1})` : `M${i + 1}`),
          v: typeof d === 'number'
            ? d
            : isMisleading
              ? (d.rawCount ?? d.jointPct ?? d.count ?? d.raw ?? d.val ?? d.y ?? 10)
              : (d.pct ?? d.rowPct ?? (d.count && d.w ? d.count / d.w : null) ?? d.rate ?? d.val ?? d.y ?? 10)
        }))
      : [];
    const list = isMisleading && exp.id === 'exp_ordinal_sorting'
      ? [...vals].sort((a, b) => a.label.localeCompare(b.label))
      : isMisleading && exp.id === 'exp_missing_context'
        ? vals.slice(0, 4)
        : vals;
    const maxV = Math.max(...list.map(d => d.v), 1) * 1.18;
    const step = pw / Math.max(1, list.length);

    if ((isMisleading && exp.id === 'exp_unordered_line') || exp.id === 'exp_missing_context') {
      ctx.strokeStyle = isMisleading ? tokens.secondary : tokens.primary;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      list.forEach((d, idx) => {
        const cx = pad.left + (idx + 0.5) * step;
        const cy = pad.top + ph - (d.v / maxV) * ph;
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
      list.forEach((d, idx) => {
        const cx = pad.left + (idx + 0.5) * step;
        const cy = pad.top + ph - (d.v / maxV) * ph;
        ctx.fillStyle = isMisleading ? tokens.secondary : tokens.primary;
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
        ctx.fill();
        if (list.length <= 8 || idx % 3 === 0) {
          ctx.fillStyle = tokens.text;
          ctx.font = "500 10px 'Inter', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText(String(d.label).slice(0, 10), cx, pad.top + ph + 16);
        }
      });
    } else {
      list.forEach((d, idx) => {
        const cx = pad.left + (idx + 0.5) * step;
        const bh = (d.v / maxV) * ph;
        const bw = Math.min(48, step * 0.65);
        ctx.fillStyle = isMisleading ? tokens.secondary : tokens.primary;
        ctx.fillRect(cx - bw / 2, pad.top + ph - bh, bw, bh);
        ctx.fillStyle = tokens.text;
        ctx.font = "500 10px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(String(d.label).slice(0, 12), cx, pad.top + ph + 16);
        ctx.font = "500 10px 'JetBrains Mono', monospace";
        ctx.fillText(`${Number(d.v).toFixed(1)}`, cx, pad.top + ph - bh - 5);
      });
    }
  }
  ctx.restore();
}

function renderLiteracyChallenge() {
  const chal = LITERACY_CHALLENGES.find(c => c.id === appState.activeChallengeId) || LITERACY_CHALLENGES[0];
  const card = document.getElementById('literacy-challenge-card');
  if (!card) return;

  const saved = appState.literacyProgress[chal.id];

  card.innerHTML = `
    <div class="callout callout-info">
      <strong>Scenario:</strong> ${chal.scenario}
    </div>
    <p style="font-weight:600; margin:0;">${chal.question}</p>
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${chal.options.map(opt => {
        const isChosen = saved && saved.selectedOption === opt.id;
        return `
          <button type="button" class="btn" data-chal-opt="${opt.id}" style="justify-content:flex-start; text-align:left; padding:10px 12px; border-color:${isChosen ? (opt.isCorrect ? 'var(--color-primary)' : 'var(--color-error)') : 'var(--color-border)'};">
            <strong>${opt.id.toUpperCase()}.</strong> &nbsp; ${opt.text}
          </button>
        `;
      }).join('')}
    </div>
    <div id="literacy-challenge-feedback">
      ${saved ? `<div class="callout ${saved.isCorrect ? '' : 'callout-error'}"><strong>${saved.isCorrect ? '✓ Mathematically Verified!' : '✗ Not Quite — Try Again:'}</strong> ${saved.feedback}</div>` : ''}
    </div>
  `;

  card.querySelectorAll('[data-chal-opt]').forEach(btn => {
    btn.addEventListener('click', () => {
      const optId = btn.getAttribute('data-chal-opt');
      const opt = chal.options.find(o => o.id === optId);
      if (!opt) return;
      appState.literacyProgress[chal.id] = {
        selectedOption: opt.id,
        isCorrect: opt.isCorrect,
        feedback: opt.feedback
      };
      saveLiteracyProgress(appState.literacyProgress);
      updateLiteracyScoreBadge();
      renderLiteracyChallenge();
    });
  });
}

function updateLiteracyScoreBadge() {
  const badge = document.getElementById('literacy-score-badge');
  if (!badge) return;
  const solvedCount = Object.values(appState.literacyProgress).filter(p => p && p.isCorrect).length;
  badge.textContent = `Challenges Solved: ${solvedCount} / ${LITERACY_CHALLENGES.length}`;
}

// ============================================================================
// DESTINATION 8: LEARN CURRICULUM (26 CONCEPTS) (Part 11.4 & Part 20)
// ============================================================================
function populateLearnCurriculum() {
  renderLearnTopicList();
  renderLearnLessonDetail();
}

function wireLearnEvents() {
  const searchIn = document.getElementById('learn-search-input');
  if (searchIn) {
    searchIn.addEventListener('input', renderLearnTopicList);
  }
}

function renderLearnTopicList() {
  const listEl = document.getElementById('learn-topic-list');
  if (!listEl) return;
  const q = (document.getElementById('learn-search-input')?.value || '').trim().toLowerCase();

  const items = CONCEPT_LIBRARY.filter(c => {
    if (!q) return true;
    return `${c.title} ${c.category} ${c.concept} ${c.whyItMatters}`.toLowerCase().includes(q);
  });

  listEl.innerHTML = items.map(c => {
    const isSel = c.id === appState.selectedConceptId;
    return `
      <div class="card card-compact" data-learn-item="${c.id}" style="cursor:pointer; border-color:${isSel ? 'var(--color-primary)' : 'var(--color-border)'};">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:13px;">${c.title}</strong>
          <span class="badge">${c.level}</span>
        </div>
        <div class="card-subtitle" style="font-size:11px;">${c.category}</div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('[data-learn-item]').forEach(el => {
    el.addEventListener('click', () => {
      appState.selectedConceptId = el.getAttribute('data-learn-item');
      renderLearnTopicList();
      renderLearnLessonDetail();
    });
  });
}

function renderLearnLessonDetail() {
  const detailEl = document.getElementById('learn-lesson-detail');
  if (!detailEl) return;
  const c = CONCEPT_LIBRARY.find(item => item.id === appState.selectedConceptId) || CONCEPT_LIBRARY[0];
  const expText = c.explanation[appState.explanationLevel] || c.explanation.standard;

  detailEl.innerHTML = `
    <div class="card-header">
      <div>
        <h2 class="card-title">${c.title}</h2>
        <p class="card-subtitle">${c.category} • Complexity: ${c.level}</p>
      </div>
      <button type="button" class="btn btn-primary btn-sm" id="btn-learn-launch-demo">Launch Live Demo in Studio →</button>
    </div>

    <div class="callout">
      <strong>Core Concept:</strong>
      <span>${c.concept}</span>
    </div>

    <div class="callout">
      <strong>Explanation (${appState.explanationLevel.toUpperCase()} Mode):</strong>
      <span>${expText}</span>
    </div>

    <div class="callout">
      <strong>Mathematical Specification &amp; Formula:</strong>
      <code class="mono">${c.formula}</code>
      <span style="font-size:12px; color:var(--color-text-muted);">Required Data Structure: ${c.dataStructure}</span>
    </div>

    <details class="collapsible-panel" open>
      <summary>Why It Matters &amp; Concrete Example</summary>
      <div class="collapsible-body" style="display:flex; flex-direction:column; gap:6px;">
        <div><strong>Why It Matters:</strong> ${c.whyItMatters}</div>
        <div><strong>Concrete VisualGrammar Example:</strong> ${c.example}</div>
      </div>
    </details>

    <details class="collapsible-panel">
      <summary>Common Mistakes &amp; Practical Interpretation</summary>
      <div class="collapsible-body" style="display:flex; flex-direction:column; gap:6px;">
        <div class="callout callout-error" style="margin:0;">
          <strong>Common Mistakes to Avoid:</strong>
          <span>• ${c.commonMistakes.join('<br>• ')}</span>
        </div>
        <div><strong>Practical Interpretation:</strong> ${c.practicalInterpretation}</div>
      </div>
    </details>

    <div class="callout">
      <strong>Related Concepts:</strong>
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
        ${c.relatedConcepts.map(rc => `<button type="button" class="btn btn-sm" data-goto-concept="${rc}">${rc}</button>`).join('')}
      </div>
    </div>
  `;

  detailEl.querySelector('#btn-learn-launch-demo')?.addEventListener('click', () => {
    if (c.interactiveDemoPreset) loadPresetDataset(c.interactiveDemoPreset, false);
    if (c.interactiveDemoChart) applyRecommendedChartToStudio(c.interactiveDemoChart);
    navigateToView('studio');
  });

  detailEl.querySelectorAll('[data-goto-concept]').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.selectedConceptId = btn.getAttribute('data-goto-concept');
      renderLearnTopicList();
      renderLearnLessonDetail();
    });
  });
}

// ============================================================================
// UPLOAD / PASTE / JSON IMPORT MODAL
// ============================================================================
function openUploadModal() {
  const modal = document.getElementById('upload-modal-backdrop');
  if (modal) modal.classList.add('open');
}

function closeUploadModal() {
  const modal = document.getElementById('upload-modal-backdrop');
  if (modal) modal.classList.remove('open');
}

function wireUploadModalEvents() {
  document.getElementById('btn-open-upload-modal')?.addEventListener('click', openUploadModal);
  document.getElementById('btn-close-upload-modal')?.addEventListener('click', closeUploadModal);

  const fileInput = document.getElementById('file-input-upload');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const titleIn = document.getElementById('paste-dataset-title');
      if (titleIn) titleIn.value = file.name.replace(/\.[^.]+$/, '');
      const reader = new FileReader();
      reader.onload = e => {
        const text = String(e.target?.result || '');
        const area = document.getElementById('paste-raw-textarea');
        if (area) area.value = text;
      };
      reader.readAsText(file);
    });
  }

  document.getElementById('btn-load-sample-paste')?.addEventListener('click', () => {
    const area = document.getElementById('paste-raw-textarea');
    if (area) {
      area.value = [
        'site_id,cohort,dosage_mg,response_rate,adverse_flag',
        'SITE-01,Standard,25,42.5,0',
        'SITE-02,Standard,30,45.1,0',
        'SITE-03,Standard,35,48.0,1',
        'SITE-04,Biologic,25,61.2,0',
        'SITE-05,Biologic,30,66.8,0',
        'SITE-06,Biologic,35,71.4,1',
        'SITE-07,Combination,25,74.0,0',
        'SITE-08,Combination,30,79.5,1',
        'SITE-09,Combination,35,84.2,0'
      ].join('\n');
    }
  });

  document.getElementById('btn-load-quartetlab-json')?.addEventListener('click', () => {
    const area = document.getElementById('paste-raw-textarea');
    if (area) area.value = getSampleQuartetLabModelOutputJSON();
  });

  document.getElementById('btn-load-resamplelab-json')?.addEventListener('click', () => {
    const area = document.getElementById('paste-raw-textarea');
    if (area) area.value = getSampleResampleLabJSON();
  });

  document.getElementById('btn-load-forecastlab-json')?.addEventListener('click', () => {
    const area = document.getElementById('paste-raw-textarea');
    if (area) area.value = getSampleForecastLabJSON();
  });

  document.getElementById('btn-confirm-import')?.addEventListener('click', () => {
    const raw = (document.getElementById('paste-raw-textarea')?.value || '').trim();
    const title = (document.getElementById('paste-dataset-title')?.value || 'Custom Dataset').trim();
    const msgEl = document.getElementById('upload-validation-msg');

    if (!raw) {
      if (msgEl) {
        msgEl.style.display = 'flex';
        msgEl.className = 'callout callout-error';
        msgEl.textContent = 'Please select a file or paste CSV/TSV/JSON data first.';
      }
      return;
    }

    // Check if JSON
    if (raw.startsWith('{')) {
      const parsedJson = parseDataSenseJSON(raw);
      if (!parsedJson.valid) {
        if (msgEl) {
          msgEl.style.display = 'flex';
          msgEl.className = 'callout callout-error';
          msgEl.textContent = parsedJson.error;
        }
        return;
      }
      appState.isPreset = false;
      appState.datasetId = parsedJson.metadata?.id || 'imported_json';
      appState.datasetTitle = parsedJson.metadata?.title || title;
      appState.datasetDescription = parsedJson.metadata?.description || 'Imported via DataSense JSON schema.';
      appState.datasetProvenance = `User-imported ${parsedJson.schemaType || 'DataSense'} JSON (Local Browser)`;
      appState.rawHeaders = parsedJson.headers;
      appState.rawRows = parsedJson.rows;
      appState.userOverrides = parsedJson.overrides || {};
      appState.transformations = parsedJson.savedTransformations || [];
      recomputeDatasetPipeline();
      if (parsedJson.savedChartConfig) {
        Object.assign(appState.chartConfig, parsedJson.savedChartConfig);
      }
      closeUploadModal();
      refreshAllViews();
      navigateToView(parsedJson.savedChartConfig ? 'studio' : 'understand');
      showToast(`Imported ${parsedJson.schemaType || 'DataSense'} JSON (${parsedJson.rows.length} rows).`);
      return;
    }

    // Parse CSV / TSV
    const parsedCsv = parseDelimitedText(raw);
    if (!parsedCsv.valid) {
      if (msgEl) {
        msgEl.style.display = 'flex';
        msgEl.className = 'callout callout-error';
        msgEl.textContent = parsedCsv.errors.join(' ');
      }
      return;
    }

    appState.isPreset = false;
    appState.datasetId = 'custom_csv';
    appState.datasetTitle = title;
    appState.datasetDescription = `Custom uploaded dataset (${parsedCsv.rows.length} observations, ${parsedCsv.headers.length} variables).`;
    appState.datasetProvenance = 'User-uploaded local delimited file';
    appState.rawHeaders = parsedCsv.headers;
    appState.rawRows = parsedCsv.rows;
    appState.userOverrides = {};
    appState.transformations = [];
    recomputeDatasetPipeline();

    const quantVars = appState.profile.variables.filter(v => v.taxonomy.family === 'quantitative').map(v => v.name);
    const catVars = appState.profile.variables.filter(v => v.taxonomy.family === 'categorical').map(v => v.name);
    if (catVars[0] && quantVars[0]) {
      appState.chartConfig.chartType = 'grouped_boxplot';
      appState.chartConfig.x = catVars[0];
      appState.chartConfig.y = quantVars[0];
    } else if (quantVars.length >= 2) {
      appState.chartConfig.chartType = 'scatter_ols';
      appState.chartConfig.x = quantVars[0];
      appState.chartConfig.y = quantVars[1];
    } else {
      appState.chartConfig.chartType = 'bar_vertical';
      appState.chartConfig.x = parsedCsv.headers[0];
      appState.chartConfig.y = '';
    }

    closeUploadModal();
    refreshAllViews();
    navigateToView('understand');
    showToast(`Imported ${parsedCsv.rows.length} observations across ${parsedCsv.headers.length} columns.`);
  });
}

// ============================================================================
// PRINTABLE CLASSROOM FRQ WORKSHEET & ANSWER KEY (APPLICATION_GUIDELINES.md H.2)
// ============================================================================
function wireWorksheetModalEvents() {
  const openBtn = document.getElementById('btn-open-worksheet-modal');
  const closeBtn = document.getElementById('btn-close-worksheet-modal');
  const toggleBtn = document.getElementById('btn-toggle-worksheet-answers');
  const printBtn = document.getElementById('btn-print-worksheet');
  const modal = document.getElementById('worksheet-modal-backdrop');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      renderClassroomWorksheetModal();
      modal.classList.add('open');
    });
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      appState.showWorksheetAnswers = !appState.showWorksheetAnswers;
      toggleBtn.textContent = appState.showWorksheetAnswers ? 'Hide Instructor Answer Key' : 'Show Instructor Answer Key';
      renderClassroomWorksheetModal();
    });
  }
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

function renderClassroomWorksheetModal() {
  const body = document.getElementById('worksheet-modal-body');
  if (!body || !appState.profile) return;

  const chart = getChartById(appState.chartConfig.chartType);
  const xVar = appState.profile.variableMap[appState.chartConfig.x];
  const yVar = appState.profile.variableMap[appState.chartConfig.y];
  const showAns = appState.showWorksheetAnswers;

  const xDesc = xVar
    ? `${xVar.name} (${xVar.taxonomy.label}${xVar.numericStats ? `, Mean = ${xVar.numericStats.mean.toFixed(2)}, SD = ${xVar.numericStats.sd.toFixed(2)}, Median = ${xVar.numericStats.median.toFixed(2)}, IQR = ${xVar.numericStats.iqr.toFixed(2)}` : ''})`
    : 'None';
  const yDesc = yVar
    ? `${yVar.name} (${yVar.taxonomy.label}${yVar.numericStats ? `, Mean = ${yVar.numericStats.mean.toFixed(2)}, SD = ${yVar.numericStats.sd.toFixed(2)}, Median = ${yVar.numericStats.median.toFixed(2)}, IQR = ${yVar.numericStats.iqr.toFixed(2)}` : ''})`
    : 'Count / Density / Derived Quantity';

  body.innerHTML = `
    <div class="callout">
      <strong>Dataset:</strong> ${appState.datasetTitle} (n = ${appState.activeRows.length} observational units) &nbsp;|&nbsp;
      <strong>Active Graphic:</strong> ${chart.name}<br>
      <strong>Primary X Variable:</strong> ${xDesc}<br>
      <strong>Secondary Y Variable:</strong> ${yDesc}
    </div>

    <div class="card card-compact">
      <h4>Question 1 — Observational Units &amp; Semantic Variable Taxonomy</h4>
      <p>Identify the observational unit in <em>${appState.datasetTitle}</em> and classify the statistical semantic types of the variables mapped to the horizontal and vertical axes. Why is physical storage type (string vs. number) insufficient to choose a valid visualization?</p>
      ${showAns ? `<div class="callout callout-info"><strong>Instructor Rubric / Answer Key:</strong> Each row represents one observational unit in <em>${appState.datasetTitle}</em> (total n = ${appState.activeRows.length}). The X variable is <code>${xVar?.name || 'N/A'}</code> (${xVar?.taxonomy.label || 'N/A'}) and the Y mapping is <code>${yVar?.name || 'Aggregated Count/Density'}</code> (${yVar?.taxonomy.label || 'Derived summary'}). Physical storage is insufficient because numeric digits can encode nominal/geographic identifiers (such as ZIP codes or serial IDs) or binary 0/1 flags where arithmetic means and linear regression slopes are meaningless.</div>` : `<div style="height:54px; border-bottom:1px dashed var(--color-border);"></div>`}
    </div>

    <div class="card card-compact">
      <h4>Question 2 — Mathematical Transformation &amp; Visual Encoding</h4>
      <p>Describe the mathematical transformation that maps the raw observations into the geometric marks of a <strong>${chart.name}</strong>. What property of the data is made immediately visible by this encoding, and what information is compressed or concealed?</p>
      ${showAns ? `<div class="callout callout-info"><strong>Instructor Rubric / Answer Key:</strong> ${chart.name} uses ${chart.marksAndAesthetics} with transformation: ${chart.applicableTransformations.join(', ')}. <strong>Reveals:</strong> ${chart.statisticalPurpose} <strong>Conceals/Weakness:</strong> ${chart.weaknesses[0] || 'Compresses raw observation detail.'}</div>` : `<div style="height:54px; border-bottom:1px dashed var(--color-border);"></div>`}
    </div>

    <div class="card card-compact">
      <h4>Question 3 — Graphical Integrity &amp; Uncertainty</h4>
      <p>Suppose an analyst replaces this graphic with a truncated-axis bar chart or confuses the Standard Error of the Mean (SE = s/√n) with the sample Standard Deviation (s). Explain how that change alters a reader's conclusion.</p>
      ${showAns ? `<div class="callout callout-info"><strong>Instructor Rubric / Answer Key:</strong> Length-encoded bars require a zero baseline so visual height ratio equals data ratio; truncating the baseline exaggerates small differences. Furthermore, SE = s/√n measures the precision of the sample mean estimator x̄ and shrinks by $1/√n, whereas s$ and the IQR measure the spread of individual observations.</div>` : `<div style="height:54px; border-bottom:1px dashed var(--color-border);"></div>`}
    </div>
  `;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisualGrammarApp);
  } else {
    initVisualGrammarApp();
  }
}
