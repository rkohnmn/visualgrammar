import test from 'node:test';
import assert from 'node:assert/strict';
import {assertInputSize, assertTableSize, readDelimitedRecords, missingNumber} from '../js/import-safety.js';
test('interactive byte and cell bounds reject large inputs', () => {
  assert.doesNotThrow(()=>assertInputSize(2*1024*1024));
  assert.throws(()=>assertInputSize(2*1024*1024+1), /2 MB/);
  assert.throws(()=>assertInputSize('🙂'.repeat(600000)), /2 MB/);
  assert.throws(()=>assertTableSize(5001,2), /5,000/);
  assert.throws(()=>assertTableSize(3000,40), /100,000/);
});
test('quoted records preserve commas, escaped quotes, BOM and embedded newlines', () => {
  const {records} = readDelimitedRecords('\uFEFFlabel,value\r\n"A, B",2\r\n"A\nB",3\r\n"He said ""yes""",4');
  assert.deepEqual(records, [['label','value'],['A, B','2'],['A\nB','3'],['He said "yes"','4']]);
});
test('malformed quoted records are rejected',()=>{
  assert.throws(()=>readDelimitedRecords('a,b\n"open,2'),/Unclosed/);
  assert.throws(()=>readDelimitedRecords('a,b\n"closed"oops,2'),/Unexpected/);
});
test('missing values are never converted to observed zero',()=>{
  for (const x of [null,undefined,'',' ','NA','null',false,{}]) assert.ok(Number.isNaN(missingNumber(x)));
  assert.equal(missingNumber('0'),0);
  assert.equal(missingNumber('-12.5'),-12.5);
});
import {parseDelimitedText,parseDataSenseJSON} from '../js/data-engine.js';
test('VisualGrammar rejects duplicate columns, ragged rows and malformed quotes',()=>{
  for (const csv of ['a,a\n1,2','a,b\n1,2,3','a,b\n"open,2']) assert.equal(parseDelimitedText(csv).valid,false);
});
test('VisualGrammar preserves late JSON columns and rejects omitted or nested data',()=>{
  const good=parseDataSenseJSON(JSON.stringify({observations:[{id:'001'},{id:'002',amount:3}]}));
  assert.equal(good.valid,true);assert.deepEqual(good.headers,['id','amount']);assert.equal(good.rows[0].id,'001');
  for (const observations of [[null,{a:2}],[{a:{nested:1}}]]) assert.equal(parseDataSenseJSON(JSON.stringify({observations})).valid,false);
  assert.equal(parseDataSenseJSON(JSON.stringify({variables:[{name:'a'}],observations:[{a:1,b:2}]})).valid,false);
});
