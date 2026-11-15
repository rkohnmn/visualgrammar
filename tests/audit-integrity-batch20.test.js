import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDelimitedText, applyTransformationStep, runTransformationPipeline } from '../js/data-engine.js';
import { computeContingencyTable, computeHistogram } from '../js/math-engine.js';
import { collapseContingencyColorLevels } from '../js/renderer.js';
import { exportToRScript, exportToPythonScript } from '../js/exporters.js';

test('malformed quoted CSV is rejected instead of concatenated', () => {
  const malformed = parseDelimitedText('label,value\n"Acme"suffix,3\n');
  assert.equal(malformed.valid, false);
  assert.match(malformed.errors.join(' '), /closing quote|Unexpected text/i);
  const escaped = parseDelimitedText('label,value\n"ACME, Inc",3\n');
  assert.equal(escaped.valid, true);
  assert.equal(escaped.rows[0].label, 'ACME, Inc');
});

test('contingency keys protect __proto__ and constructor labels', () => {
  const rows = [
    { grp: '__proto__', category: 'constructor' },
    { grp: 'normal', category: '__proto__' },
    { grp: '__proto__', category: '__proto__' }
  ];
  const table = computeContingencyTable(rows, 'grp', 'category');
  assert.equal(table.valid, true);
  assert.equal(table.grandTotal, 3);
  assert.equal(table.rowTotals['__proto__'], 2);
  assert.equal(table.colTotals['__proto__'], 2);
  assert.equal(table.counts['__proto__']['constructor'], 1);
  assert.equal(table.counts['__proto__']['__proto__'], 1);
  assert.ok(Number.isFinite(table.chiSquare));
});

test('weighted contingency tables exclude missing and invalid measures', () => {
  const rows = [
    { grp:'A', category:'X', measure: 3 },
    { grp:'A', category:'X', measure: null },
    { grp:'B', category:'X', measure: 2 },
    { grp:'B', category:'Y', measure: 'not a number' },
    { grp:'B', category:'Y', measure: -5 }
  ];
  const table = computeContingencyTable(rows, 'grp', 'category', 'measure');
  assert.equal(table.grandTotal, 5);
  assert.equal(table.rowTotals.A, 3);
  assert.equal(table.rowTotals.B, 2);
});

test('100% stacked bars preserve all color-series mass by combining overflow', () => {
  const rows = Array.from({ length: 10 }, (_, i) => ({ group:'A', category:`C${i}` }));
  const table = computeContingencyTable(rows, 'group', 'category');
  const collapsed = collapseContingencyColorLevels(table, 8);
  assert.equal(collapsed.levels.length, 8);
  assert.match(collapsed.levels[7], /^Other \(3 categories\)$/);
  const sum = collapsed.levels.reduce((a, x) => a + collapsed.getCount('A', x), 0);
  assert.equal(sum, table.rowTotals.A);
  assert.equal(sum / table.rowTotals.A * 100, 100);
});

test('aggregation refuses missing target and unsupported function', () => {
  const state = { headers: ['group', 'x'], rows: [{ group:'A', x:2 }, { group:'A', x:4 }] };
  assert.throws(() => applyTransformationStep(state, {
    type: 'group_aggregate', groupColumn:'group', targetColumn:'typo', aggFunc:'mean'
  }), /existing numeric target/);
  assert.throws(() => applyTransformationStep(state, {
    type: 'group_aggregate', groupColumn:'group', targetColumn:'x', aggFunc:'bogus'
  }), /Unsupported aggregation/);
  assert.throws(() => runTransformationPipeline(state.rows, state.headers, [{
    type: 'group_aggregate', groupColumn:'group', targetColumn:'typo', aggFunc:'sum'
  }]), /existing numeric target/);
  assert.deepEqual(state.rows, [{ group:'A', x:2 }, { group:'A', x:4 }]);
});

test('valid group aggregates still compute actual means', () => {
  const state = { headers:['group','x'], rows:[{group:'A',x:2},{group:'A',x:4}] };
  const res = applyTransformationStep(state, {
    type:'group_aggregate', groupColumn:'group', targetColumn:'x', aggFunc:'mean'
  });
  assert.equal(res.rows[0].x_mean, 3);
  assert.equal(res.rows[0].group_n, 2);
});

test('histogram custom edges reject duplicates, nonfinite, and reversed values', () => {
  for (const edges of [[0,0,2], [0,Infinity,2], [2,1,0]]) {
    const out = computeHistogram([0,1,2], { binEdges: edges });
    assert.equal(out.valid, false, JSON.stringify(edges));
  }
  assert.equal(computeHistogram([0,1,2], { binEdges:[10,20] }).valid, false);
  assert.equal(computeHistogram([0,1,2], { binEdges:[0,1,2] }).valid, true);
});

test('generated R script safely quotes malicious dataset titles, labels, and column names', () => {
  const malicious = 'x"]])); system("touch /tmp/vg-audit-marker"); #';
  const title = 'Chart\nsystem("touch /tmp/vg-audit-marker")';
  const r = exportToRScript([], { chartType:'scatter_plot', x:malicious, y:'y', title }, title);
  assert.ok(r.includes(`.data[[${JSON.stringify(malicious)}]]`));
  assert.ok(r.includes(`title = ${JSON.stringify(title)}`));
  assert.doesNotMatch(r, /\nsystem\("touch \/tmp\/vg-audit-marker"\)/);
  const py = exportToPythonScript([], { chartType:'scatter_plot' }, title);
  assert.doesNotMatch(py, /\nsystem\("touch \/tmp\/vg-audit-marker"\)/);
});
