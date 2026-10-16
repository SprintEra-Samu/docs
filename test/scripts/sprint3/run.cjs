const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {testRoot,runtime,dependency,config,classify,redact,readLocalJson,validateTarget,sensitiveValues,dependencyLockFingerprints}=require('./support.cjs');
const collection=JSON.parse(fs.readFileSync(path.join(testRoot,'postman/SprintEra-sprint3.postman_collection.json'),'utf8'));
const flatten=items=>items.flatMap(i=>i.item?flatten(i.item):[i]);
const items=flatten(collection.item);
const required=['01','02','03','04','05','06','07','08','11','12','13','14','15','16','17','18','19'].map(i=>'PT-'+i);
const output=path.join(testRoot,'results/sprint3');
function finish(rows,metadata,secrets=[]) {
  const scenarios=required.map(id=>{
    const children=rows.filter(r=>r.scenarioId===id);
    const status=children.some(r=>r.result==='FAIL')?'FAIL':children.length && children.every(r=>r.result==='PASS')?'PASS':'BLOCKED';
    return {id,result:status,requestCount:children.length,owner:id==='PT-18'?'Backend 2':Number(id.slice(3))>=11?'Backend 1':null};
  });
  const report=redact({schemaVersion:1,...metadata,completedAt:new Date().toISOString(),requiredSummary:Object.fromEntries(['PASS','FAIL','BLOCKED'].map(s=>[s,scenarios.filter(r=>r.result===s).length])),scenarios,requests:rows},secrets);
  fs.mkdirSync(output,{recursive:true});
  const name=metadata.runId || 'blocked-preparation';
  fs.writeFileSync(path.join(output,name+'.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(output,'latest.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({evidence:name+'.json',requiredSummary:report.requiredSummary,requests:rows.length}));
  process.exitCode=scenarios.some(r=>r.result!=='PASS') || rows.some(r=>r.result!=='PASS')?1:0;
}
function rowFor(item) {
  const match=item.name.match(/^PT-\d{2}/);
  const statusText=item.event.find(e=>e.listen==='test')?.script.exec.join('\n').match(/HTTP (\d{3})/);
  return {name:item.name,scenarioId:match?match[0]:null,method:item.request.method,url:item.request.url.raw,expectedStatus:statusText?Number(statusText[1]):null,httpStatus:null,assertions:[]};
}
async function main() {
  const source=fs.existsSync(path.join(runtime,'source.json'))?JSON.parse(fs.readFileSync(path.join(runtime,'source.json'),'utf8').replace(/^\uFEFF/,'')):{};
  const metadata={runId:new Date().toISOString().replace(/[:.]/g,'-'),startedAt:new Date().toISOString(),backendRevision:source.backendRevision||null,nodeVersion:process.version,dependencyLocks:dependencyLockFingerprints(),executionAttempted:false,scope:'PT-01–PT-08, PT-11–PT-19; setup ve EK kontroller ayrı',database:'SprintEra_sprint3_test',schemaPreparation:'Sequelize sync, force/alter kullanılmaz; migration testi değildir'};
  if(process.argv[2]==='--blocked') {
    const reason=process.argv.slice(3).join(' ') || 'Kurulum ve DB onayı/erişimi bekleniyor; HTTP testi çalıştırılmadı.';
    finish(items.map(i=>({...rowFor(i),result:'BLOCKED',blockedReason:reason})),metadata);
    return;
  }
  const c=config();
  metadata.databaseConnection={host:c.DB_HOST,port:Number(c.DB_PORT),database:c.DB_NAME,user:c.DB_USER};
  const fixtures=readLocalJson(path.join(runtime,'fixtures.json'));
  const secrets=[c.DB_PASSWORD,c.JWT_SECRET,fixtures.adminPassword,fixtures.memberPassword];
  const qaPassword=crypto.randomBytes(24).toString('hex');secrets.push(qaPassword);
  const {Client}=dependency('pg');
  const client=new Client({host:c.DB_HOST,port:c.DB_PORT,database:c.DB_NAME,user:c.DB_USER,password:c.DB_PASSWORD,connectionTimeoutMillis:5000});
  try {
    await client.connect();
    const identity=await client.query('SELECT current_database() AS db, current_user AS username');
    if(identity.rows[0].db!==c.DB_NAME || identity.rows[0].username!==c.DB_USER) throw new Error('Test DB kimliği uyuşmuyor.');
    const absent=await client.query('SELECT id FROM projects WHERE id=$1',[fixtures.missingProjectId]);
    if(absent.rowCount) throw new Error('Olmayan proje önkoşulu sağlanmadı.');
  } finally { await client.end(); }
  const runId=Date.now()+'-'+crypto.randomBytes(4).toString('hex');
  const environment=JSON.parse(fs.readFileSync(path.join(testRoot,'postman/SprintEra-sprint3.postman_environment.json'),'utf8'));
  const baseUrl=environment.values.find(v=>v.key==='baseUrl')?.value;
  const expected={serverId:fixtures.serverId,database:c.DB_NAME,backendRevision:source.backendRevision};
  // Validate the URL BEFORE even a read-only handshake; no redirects to another host.
  validateTarget(baseUrl,expected,expected);
  const identityResponse=await fetch(baseUrl+'/__qa_identity',{redirect:'error',signal:AbortSignal.timeout(5000)});
  if(!identityResponse.ok)throw new Error('QA HTTP kimlik uç noktası hazır değil.');
  validateTarget(baseUrl,await identityResponse.json(),expected);
  const values={...fixtures,runId,qaPassword,projectName:'Sprint 3 QA '+runId,taskTitle:'Sprint 3 QA Görev '+runId};
  environment.values.forEach(v=>{if(Object.hasOwn(values,v.key))v.value=String(values[v.key]);});
  const newman=dependency('newman');
  metadata.newmanVersion=dependency('newman/package.json').version;
  metadata.executionAttempted=true;
  const started=new Date().toISOString();
  const emitter=newman.run({collection,environment,reporters:[],ignoreRedirects:true,timeoutRequest:5000,timeoutScript:5000,timeout:180000},(error,summary)=>{
    const executions=summary?.run?.executions||[];
    const failures=summary?.run?.failures||[];
    const rows=items.map(item=>{
      const e=executions.find(v=>v.item.name===item.name);
      const row=rowFor(item);
      row.url=e?.request?.url?.toString()||row.url;
      row.httpStatus=e?.response?.code||null;
      row.responseTimeMs=e?.response?.responseTime??null;
      row.assertions=(e?.assertions||[]).map(a=>({name:a.assertion,status:a.skipped?'SKIPPED':a.error?'FAIL':'PASS',...(a.error?{message:a.error.message}:{})}));
      const runtimeFailures=failures.filter(f=>(f.source?.name===item.name || (e && f.source?.id===e.item.id)) && f.error?.name!=='AssertionError');
      for(const f of runtimeFailures) row.assertions.push({name:f.error?.name||'RuntimeError',status:'FAIL',message:f.error?.message||'Çalışma hatası'});
      if(e?.requestError)row.transportError=e.requestError.message||'İstek hatası';
      if(!e || !row.httpStatus)row.blockedReason=summary?.collection?.variables?.get('blocked:'+item.name)||error?.message||'HTTP yanıtı alınmadı veya önkoşul nedeniyle istek çalıştırılmadı.';
      try{row.response=e.response.json();secrets.push(...sensitiveValues(row.response));}catch{/* HTML/JS body is omitted; assertions remain. */}
      row.result=classify(row);
      return row;
    });
    finish(rows,{...metadata,startedAt:started,targetIdentityVerified:true,runnerError:error?.message||null},secrets);
  });
  emitter.on('request',(_err,args)=>{try{secrets.push(...sensitiveValues(args.response.json()));}catch{}});
}
main().catch(e=>{
  // Never print connection errors or input values. No HTTP request is claimed.
  const source=fs.existsSync(path.join(runtime,'source.json'))?JSON.parse(fs.readFileSync(path.join(runtime,'source.json'),'utf8')):{};
  finish(items.map(i=>({...rowFor(i),result:'BLOCKED',blockedReason:'Yerel QA bağlantısı/fixture/bağımlılık önkontrolü başarısız; ayrıntı yerel olarak incelenmeli.'})),{runId:new Date().toISOString().replace(/[:.]/g,'-'),startedAt:new Date().toISOString(),backendRevision:source.backendRevision||null,nodeVersion:process.version,dependencyLocks:dependencyLockFingerprints(),executionAttempted:false,preflightErrorType:e.code||e.name});
});
