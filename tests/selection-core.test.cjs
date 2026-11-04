const test = require('node:test');
const assert = require('node:assert/strict');
const {toggleSelection,isComplete}=require('../selection-core.js');

test('selection starts incomplete and becomes complete at exactly ten',()=>{
  let selected=new Set();
  assert.equal(isComplete(selected),false);
  for(let i=1;i<=10;i++) selected=toggleSelection(selected,'prompt-'+i);
  assert.equal(selected.size,10);
  assert.equal(isComplete(selected),true);
});

test('an eleventh distinct prompt is rejected',()=>{
  let selected=new Set(Array.from({length:10},(_,i)=>'prompt-'+(i+1)));
  selected=toggleSelection(selected,'prompt-11');
  assert.equal(selected.size,10);
  assert.equal(selected.has('prompt-11'),false);
});

test('selecting an existing prompt toggles it off',()=>{
  let selected=new Set(['prompt-1','prompt-2']);
  selected=toggleSelection(selected,'prompt-1');
  assert.deepEqual([...selected],['prompt-2']);
  assert.equal(isComplete(selected),false);
});

test('duplicate prompt IDs do not inflate the count',()=>{
  let selected=new Set(['prompt-1']);
  selected=toggleSelection(selected,'prompt-1');
  assert.equal(selected.size,0);
  selected=toggleSelection(selected,'prompt-1');
  selected=toggleSelection(selected,'prompt-1');
  assert.equal(selected.size,0);
});

test('invalid empty IDs are ignored',()=>{
  const selected=toggleSelection(new Set(['prompt-1']),'  ');
  assert.deepEqual([...selected],['prompt-1']);
});

test('custom selection limit is respected',()=>{
  let selected=new Set();
  for(let i=1;i<=3;i++) selected=toggleSelection(selected,'p-'+i,3);
  selected=toggleSelection(selected,'p-4',3);
  assert.equal(selected.size,3);
  assert.equal(isComplete(selected,3),true);
});