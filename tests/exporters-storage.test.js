/**
 * VisualGrammar — Automated Unit Tests for exporters.js and storage.js
 * Tests CSV formula-injection sanitization, DataSense JSON round-tripping, and URL hash state.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeCsvCell,
  exportToCSV,
  exportConfigurationJSON,
  exportDataSenseDatasetJSON,
  exportToRScript,
  exportToPythonScript,
  exportToLatexTable,
  encodeShareableHash,
  decodeShareableHash
} from '../js/exporters.js';
import { parseDataSenseJSON, profileDataset } from '../js/data-engine.js';
import { getPresetById } from '../js/presets.js';

test('1. CSV Exporter complies with RFC 4180 and neutralizes spreadsheet formula injection (=, +, -, @)', () => {
  assert.equal(escapeCsvCell('=cmd|\'/C calc\'!A0'), "'=cmd|'/C calc'!A0");
  assert.equal(escapeCsvCell('+SUM(A1:A10)'), "'+SUM(A1:A10)");
  assert.equal(escapeCsvCell('-2+3'), "'-2+3");
  assert.equal(escapeCsvCell('@IMPORTXML()'), "'@IMPORTXML()");
  // Genuine negative finite number is NOT prefixed with apostrophe
  assert.equal(escapeCsvCell(-42.5), '-42.5');

  const rows = [
    { obs_id: '1', label: '=EVIL()', val: 12.5 },
    { obs_id: '2', label: 'Normal, "Quoted"', val: -3.2 }
  ];
  const csv = exportToCSV(rows, ['obs_id', 'label', 'val']);
  assert.ok(csv.includes("'=EVIL()"));
  assert.ok(csv.includes('"Normal, ""Quoted"""'));
});

test('2. Reproducible Configuration JSON & DataSenseDataset v1.0.0 lossless round-trip', () => {
  const preset = getPresetById('anscombe_1');
  const profile = profileDataset(preset.rows, preset.headers, preset.overrides);
  const mockState = {
    datasetId: preset.id,
    datasetTitle: preset.title,
    datasetDescription: preset.description,
    explanationLevel: 'technical',
    activeRows: preset.rows,
    profile,
    transformations: [{ type: 'sort', column: 'explanatory_x', direction: 'asc' }],
    chartConfig: {
      chartType: 'scatter_ols',
      x: 'explanatory_x',
      y: 'response_y',
      yBaseline: 0,
      palette: 'okabe_ito'
    }
  };

  const configJson = exportConfigurationJSON(mockState);
  const reimported = parseDataSenseJSON(configJson);
  assert.equal(reimported.valid, true);
  assert.equal(reimported.rows.length, 11);
  assert.equal(reimported.savedChartConfig.chartType, 'scatter_ols');
  assert.equal(reimported.savedChartConfig.palette, 'okabe_ito');

  const rScript = exportToRScript(preset.rows, mockState.chartConfig, preset.title);
  const pyScript = exportToPythonScript(preset.rows, mockState.chartConfig, preset.title);
  const latex = exportToLatexTable(profile, preset.title);
  assert.ok(rScript.includes('ggplot'));
  assert.ok(pyScript.includes('pandas'));
  assert.ok(latex.includes('\\toprule'));
});

test('3. Shareable URL Hash state round-trips configuration without leaking personal row payloads', () => {
  const state = {
    isPreset: true,
    datasetId: 'simpsons_paradox_clinical',
    explanationLevel: 'technical',
    chartConfig: {
      chartType: 'small_multiples',
      x: 'dosage_mg',
      y: 'recovery_score',
      color: 'severity_stratum',
      yBaseline: 0
    }
  };
  const hash = encodeShareableHash(state);
  assert.ok(hash.startsWith('#state='));
  const decoded = decodeShareableHash(hash);
  assert.equal(decoded.p, 'simpsons_paradox_clinical');
  assert.equal(decoded.lvl, 'technical');
  assert.equal(decoded.cfg.chartType, 'small_multiples');
});
