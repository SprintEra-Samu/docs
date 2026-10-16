const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {testRoot}=require('./support.cjs');
const read=name=>JSON.parse(fs.readFileSync(path.join(testRoot,'postman',name),'utf8'));
const old=read('SprintEra-week2.postman_collection.json');
const current=read('SprintEra-sprint3.postman_collection.json');
const env=read('SprintEra-sprint3.postman_environment.json');
const flat=items=>items.flatMap(i=>i.item?flat(i.item):[i]);
const items=flat(current.item);
for(const item of old.item.filter(i=>/^PT-0[1-8](?:\D|$)/.test(i.name))){
  const copy=items.find(i=>i.name===item.name);
  assert.ok(copy,`Regresyon kayıp: ${item.name}`);
  assert.deepEqual(copy.request,item.request);
  const originalTests=item.event.filter(e=>e.listen==='test');
  assert.deepEqual(copy.event.filter(e=>e.listen==='test').slice(0,originalTests.length),originalTests);
}
for(const id of [1,2,3,4,5,6,7,8,11,12,13,14,15,16,17,18,19])assert.ok(items.some(i=>i.name.startsWith('PT-'+String(id).padStart(2,'0'))));
assert.ok(!items.some(i=>/^PT-(09|10)/.test(i.name)));
assert.equal(new Set(items.map(i=>i.name)).size,items.length);
for(const item of items)for(const e of item.event||[])new vm.Script(e.script.exec.join('\n'),{filename:item.name});
for(const e of current.event||[])new vm.Script(e.script.exec.join('\n'));
for(const entry of env.values)if(entry.key!=='baseUrl')assert.equal(entry.value,'');
assert.equal(env.values.find(e=>e.key==='baseUrl').value,'http://127.0.0.1:3001');
console.log(`Statik doğrulama geçti: ${items.length} istek; Week 2 regresyon assertion’ları korundu; PT-09/10 eklenmedi; ortam şablonu boş.`);
