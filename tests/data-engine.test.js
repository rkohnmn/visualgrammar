/**
 * VisualGrammar — Automated Unit Tests for data-engine.js
 * Tests RFC 4180 CSV/TSV parsing, 19-category variable taxonomy & inference, and transformations.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDelimitedText,
  parseDataSenseJSON,
  inferVariableType,
  profileDataset,
  runTransformationPipeline
} from '../js/data-engine.js';
import { getPresetById } from '../js/presets.js';

test('1. RFC 4180 CSV & TSV parsing with quoted commas, escaped quotes, and leading-zero ZIP codes', () => {
  const csv = [
    'sensor_id,zip_code,department,notes,pressure_kpa',
    '1001,02139,"Water Works, East","Calibrated ""OK""",215.4',
    '1002,02140,"District Steam",NA,310.2',
    '1003,02141,"Gas Distribution","Normal",158.0'
  ].join('\r\n');

  const parsed = parseDelimitedText(csv);
  assert.equal(parsed.valid, true);
  assert.equal(parsed.headers.length, 5);
  assert.equal(parsed.rows.length, 3);
  // Leading zero ZIP code "02139" preserved as string
  assert.equal(parsed.rows[0].zip_code, '02139');
  assert.equal(parsed.rows[0].department, 'Water Works, East');
  assert.equal(parsed.rows[0].notes, 'Calibrated "OK"');
  assert.equal(parsed.rows[1].notes, null);
  assert.equal(parsed.rows[0].pressure_kpa, 215.4);
});

test('2. Variable Type Inference Engine distinguishes identifiers, ZIP codes, 0/1 binary flags, ordinals, and continuous measurements', () => {
  const ambigPreset = getPresetById('ambiguous_sensor_audit');
  // Profile WITHOUT preset overrides to test automatic inference directly
  const autoProfile = profileDataset(ambigPreset.rows, ambigPreset.headers, {});

  const sensorIdVar = autoProfile.variableMap.sensor_id;
  const zipVar = autoProfile.variableMap.zip_code;
  const alarmVar = autoProfile.variableMap.alarm_triggered;
  const priorityVar = autoProfile.variableMap.priority_tier;
  const pressureVar = autoProfile.variableMap.pressure_kpa;

  assert.equal(sensorIdVar.inferredType, 'identifier', 'Sequential sensor_id should be classified as identifier, not continuous');
  assert.equal(zipVar.inferredType, 'geographic_region', 'zip_code should be classified as geographic_region');
  assert.equal(alarmVar.inferredType, 'binary_categorical', '0/1 alarm column should be classified as binary_categorical');
  assert.equal(priorityVar.inferredType, 'ordinal_categorical', 'Tier 1/2/3 should be classified as ordinal_categorical');
  assert.equal(pressureVar.inferredType, 'continuous_quantitative', 'pressure_kpa should be continuous_quantitative');

  // Test manual user override
  const overriddenProfile = profileDataset(ambigPreset.rows, ambigPreset.headers, {
    alarm_triggered: { overrideType: 'proportion' }
  });
  assert.equal(overriddenProfile.variableMap.alarm_triggered.inferredType, 'proportion');
  assert.equal(overriddenProfile.variableMap.alarm_triggered.confidence, 'User Override');
});

test('3. Non-destructive transformation pipeline preserves source rows and computes valid derived columns', () => {
  const preset = getPresetById('cat_numeric_battery_chemistry');
  const rawCopy = JSON.stringify(preset.rows);

  const steps = [
    { type: 'filter', column: 'energy_density_wh_kg', operator: 'gt', value: 165 },
    { type: 'standardize_z', column: 'energy_density_wh_kg' },
    { type: 'log_transform', column: 'cycle_life', base: 'ln' },
    { type: 'sort', column: 'energy_density_wh_kg', direction: 'desc' }
  ];

  const out = runTransformationPipeline(preset.rows, preset.headers, steps);
  assert.equal(JSON.stringify(preset.rows), rawCopy, 'Original rows must never be mutated');
  assert.ok(out.rows.length < preset.rows.length);
  assert.ok(out.headers.includes('energy_density_wh_kg_z'));
  assert.ok(out.headers.includes('cycle_life_ln'));
  assert.equal(out.provenanceLog.length, 4);
  assert.ok(out.rows[0].energy_density_wh_kg >= out.rows[out.rows.length - 1].energy_density_wh_kg);
});
