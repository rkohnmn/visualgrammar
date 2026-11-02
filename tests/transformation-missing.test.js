import test from 'node:test';
import assert from 'node:assert/strict';
import {applyTransformationStep} from '../js/data-engine.js';
test('derived arithmetic keeps missing inputs missing and genuine zero numeric', () => {
  for (const operation of ['sum','diff','prod','ratio','pct_change']) {
    const rows=[null,undefined,'',' ',false].map(a=>({a,b:5}));
    const result=applyTransformationStep({headers:['a','b'],rows},{type:'derived_expression',colA:'a',colB:'b',operation});
    assert.ok(result.rows.every(r=>r['a_'+operation+'_b']===null));
  }
  assert.equal(applyTransformationStep({headers:['a','b'],rows:[{a:0,b:5}]},{type:'derived_expression',colA:'a',colB:'b',operation:'sum'}).rows[0].a_sum_b,5);
});
test('univariate transforms and aggregates exclude missing observations', () => {
  const data={headers:['x','g'],rows:[{x:null,g:'A'},{x:' ',g:'A'},{x:0,g:'A'},{x:2,g:'A'},{x:4,g:'A'}]};
  for (const [type,suffix] of [['standardize_z','z'],['binning','bin'],['cumulative_total','cumsum']]) {
    const r=applyTransformationStep(data,{type,column:'x'});
    assert.equal(r.rows[0]['x_'+suffix],null); assert.equal(r.rows[1]['x_'+suffix],null);
    assert.notEqual(r.rows[2]['x_'+suffix],null);
  }
  const r=applyTransformationStep(data,{type:'group_aggregate',groupColumn:'g',targetColumn:'x',aggFunc:'mean'});
  assert.equal(r.rows[0].x_mean,2);
});
