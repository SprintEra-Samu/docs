const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const modulePath = path.join(__dirname, 'support.cjs');
const support = fs.existsSync(modulePath) ? require(modulePath) : {};

test('test connection rejects fallback, remote host, wrong database and privileged identity', () => {
  assert.equal(typeof support.validateConfig, 'function');
  const valid = { DB_HOST: '127.0.0.1', DB_PORT: 5432, DB_NAME: 'SprintEra_sprint3_test', DB_USER: 'sprintera_sprint3_qa', DB_PASSWORD: 'temporary-test-value', JWT_SECRET: 'temporary-jwt-value' };
  assert.doesNotThrow(() => support.validateConfig(valid));
  for (const change of [{DB_HOST:'db.example.com'}, {DB_NAME:'SprintEra'}, {DB_USER:'postgres'}, {DB_PASSWORD:''}, {DB_PORT:undefined}, {JWT_SECRET:''}]) {
    assert.throws(() => support.validateConfig({...valid,...change}));
  }
});

test('unexecuted, skipped and assertion-free requests can never be PASS', () => {
  assert.equal(typeof support.classify, 'function');
  assert.equal(support.classify({}), 'BLOCKED');
  assert.equal(support.classify({httpStatus:200, assertions:[]}), 'BLOCKED');
  assert.equal(support.classify({httpStatus:200, assertions:[{status:'SKIPPED'}]}), 'BLOCKED');
  assert.equal(support.classify({httpStatus:400, assertions:[{status:'FAIL'}]}), 'FAIL');
  assert.equal(support.classify({httpStatus:200, assertions:[{status:'PASS'}]}), 'PASS');
  assert.equal(support.classify({httpStatus:200, transportError:'timeout', assertions:[{status:'PASS'}]}), 'BLOCKED');
});

test('publishable evidence removes secrets from nested values and assertion messages', () => {
  assert.equal(typeof support.redact, 'function');
  const secret = 'sensitive-fixture-value';
  const input = {token:secret, request:{password:secret}, message:`expected '${secret}' to match`, headers:[{key:'Authorization', value:`Bearer ${secret}`}],status:401};
  const output = support.redact(input, [secret]);
  assert.equal(JSON.stringify(output).includes(secret), false);
  assert.equal(output.status,401);
  assert.equal(output.token,'[REDACTED]');
});

test('only the exact local QA URL and matching server/DB/revision identity can receive tests', () => {
  assert.equal(typeof support.validateTarget, 'function');
  const expected={serverId:'isolated-instance',database:'SprintEra_sprint3_test',backendRevision:'commit-a'};
  assert.doesNotThrow(()=>support.validateTarget('http://127.0.0.1:3001',expected,expected));
  for(const url of ['https://api.example.com','http://localhost:3001','http://127.0.0.1:3000','http://127.0.0.1:3001/other'])assert.throws(()=>support.validateTarget(url,expected,expected));
  for(const change of [{serverId:'other'},{database:'SprintEra'},{backendRevision:'commit-b'}])assert.throws(()=>support.validateTarget('http://127.0.0.1:3001',{...expected,...change},expected));
  assert.throws(()=>support.validateTarget('http://127.0.0.1:3001',{},{}));
});

test('unexpected sensitive response fields cannot survive in assertion failure messages', () => {
  assert.equal(typeof support.sensitiveValues,'function');
  const unexpectedHash='$2b$10$unexpected-real-response-hash';
  const response={nested:{password_hash:unexpectedHash},headers:[{key:'Authorization',value:'Bearer unforeseen-value'}]};
  const secrets=support.sensitiveValues(response);
  const cleaned=support.redact({response,message:`expected ${unexpectedHash} to be absent`},secrets);
  assert.equal(JSON.stringify(cleaned).includes(unexpectedHash),false);
});

test('invalid local secret JSON does not leak file contents through parser diagnostics', () => {
  assert.equal(typeof support.readLocalJson,'function');
  const os=require('node:os');
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'sprintera-qa-'));
  const file=path.join(folder,'invalid.json');
  const secret='unpublishable-local-credential';
  fs.writeFileSync(file,`{"password":"${secret}",oops}`);
  try {assert.throws(()=>support.readLocalJson(file),e=>!e.message.includes(secret));}
  finally {fs.unlinkSync(file);fs.rmdirSync(folder);}
});

test('dependent regressions skip without successful registration; PT-04 skips empty password', () => {
  const vm=require('node:vm');
  const collection=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../postman/SprintEra-sprint3.postman_collection.json'),'utf8'));
  const regressions=collection.item[0].item;
  for(const prefix of ['PT-04','PT-05','PT-07','PT-08']){
    const item=regressions.find(i=>i.name.startsWith(prefix));
    let skipped=false;
    const values=new Map([['qaEmail','fixture@sprintera.test'],['qaName','Fixture']]);
    if(prefix!=='PT-04')values.set('qaPassword','test-only-value');
    const stop=Symbol('skip');
    const pm={info:{requestName:item.name},variables:{get:k=>values.get(k),replaceIn:()=> 'fixture-guid'},environment:{get:k=>values.get(k)},collectionVariables:{get:k=>values.get(k),set:(k,v)=>values.set(k,v),unset:k=>values.delete(k)},execution:{skipRequest:()=>{skipped=true;throw stop;}}};
    try{for(const event of item.event.filter(e=>e.listen==='prerequest'))vm.runInNewContext(event.script.exec.join('\n'),{pm});}
    catch(e){if(e!==stop)throw e;}
    assert.equal(skipped,true,`${prefix} must be BLOCKED before issuing a misleading request`);
  }
});

test('PT-13 rejects a response whose project description differs from the sent description', () => {
  const vm=require('node:vm');
  const collection=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../postman/SprintEra-sprint3.postman_collection.json'),'utf8'));
  const item=collection.item[1].item.find(i=>i.name.startsWith('PT-13'));
  const check=description=>{
    const body={id:7,name:'QA Project',description,date:'2026-10-20',created_by:3};
    const values={projectName:'QA Project',adminUserId:3};
    const pm={test:(_name,fn)=>fn(),response:{code:201,json:()=>body,to:{have:{status:n=>assert.equal(n,201)}}},variables:{get:k=>values[k]},collectionVariables:{set:()=>{}},expect:value=>{
      const chain={eql:expected=>assert.deepEqual(value,expected),a:type=>assert.equal(typeof value,type)};
      chain.to=chain;chain.be=chain;return chain;
    }};
    for(const event of item.event.filter(e=>e.listen==='test'))vm.runInNewContext(event.script.exec.join('\n'),{pm});
  };
  assert.doesNotThrow(()=>check('Sprint 3 izole QA projesi'));
  assert.throws(()=>check('Yanlış veya kaybolmuş açıklama'));
});

test('dependency lock fingerprint records exact bytes and changes when the lock changes', () => {
  assert.equal(typeof support.fingerprintFile,'function');
  const os=require('node:os');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sprintera-lock-'));
  const file=path.join(dir,'package-lock.json');
  try{
    fs.writeFileSync(file,'abc');
    const before=support.fingerprintFile(file);
    assert.deepEqual(before,{algorithm:'sha256',sha256:'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',bytes:3});
    fs.writeFileSync(file,'abd');
    assert.notEqual(support.fingerprintFile(file).sha256,before.sha256);
  } finally {fs.unlinkSync(file);fs.rmdirSync(dir);}
});


test('isolated local PostgreSQL port is accepted while arbitrary ports remain rejected', () => {
  const c={DB_HOST:'127.0.0.1',DB_PORT:55432,DB_NAME:'SprintEra_sprint3_test',DB_USER:'sprintera_sprint3_qa',DB_PASSWORD:'temporary-value',JWT_SECRET:'temporary-value'};
  assert.doesNotThrow(()=>support.validateConfig(c));
  for(const port of [5433,55433,0]) assert.throws(()=>support.validateConfig({...c,DB_PORT:port}));
});
