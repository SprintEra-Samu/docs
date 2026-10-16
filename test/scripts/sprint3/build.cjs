const fs=require('node:fs');
const path=require('node:path');
const {testRoot}=require('./support.cjs');
const {hasFieldError}=require('../../field-errors');
const original=JSON.parse(fs.readFileSync(path.join(testRoot,'postman/SprintEra-week2.postman_collection.json'),'utf8'));
const event=(listen,source)=>({listen,script:{type:'text/javascript',exec:source.trim().split('\n')}});
const status=n=>`pm.test('HTTP ${n}',()=>pm.response.to.have.status(${n}));`;
const errorShape=`pm.test('Hata mesajı döner',()=>{const b=pm.response.json();pm.expect(b.success).to.eql(false);pm.expect(b.error).to.be.a('string').and.not.empty;});`;
const guard=variables=>variables.length?`const missing=${JSON.stringify(variables)}.filter(k=>!pm.variables.get(k));
if(missing.length){pm.collectionVariables.set('blocked:'+pm.info.requestName,'Eksik önkoşul: '+missing.join(', '));pm.execution.skipRequest();}`:'';
function request(name,method,endpoint,expected,test='',body=null,token=null,required=[],before='') {
  const [pathname,query]=endpoint.split('?');
  return {name,event:[...(required.length||before?[event('prerequest',guard(required)+'\n'+before)]:[]),event('test',status(expected)+'\n'+test)],request:{method,auth:{type:'noauth'},header:[...(body?[{key:'Content-Type',value:'application/json'}]:[]),...(token?[{key:'Authorization',value:`Bearer {{${token}}}`}]:[])],...(body?{body:{mode:'raw',raw:JSON.stringify(body,null,2),options:{raw:{language:'json'}}}}:{}),url:{raw:'{{baseUrl}}'+endpoint,host:['{{baseUrl}}'],path:pathname.slice(1).split('/'),...(query?{query:[...new URLSearchParams(query)].map(([key,value])=>({key,value}))}:{})}}};
}
// Preserve original regression assertions and requests. Only runtime secret generation
// and successful response captures are added to the new collection.
const regression=structuredClone(original.item.filter(i=>/^PT-0[1-8](?:\D|$)/.test(i.name)));
for(const item of regression){
  const needs=item.name.startsWith('PT-04')?['qaPassword']:/^PT-0[578]/.test(item.name)?['qaUserId','qaEmail','qaPassword']:item.name.startsWith('PT-06')?['qaName','qaEmail','qaPassword']:[];
  if(needs.length)item.event.unshift(event('prerequest',guard(needs)));
}
const register=regression.find(i=>i.name.startsWith('PT-04'));
for(const e of register.event.filter(e=>e.listen==='prerequest'))e.script.exec=e.script.exec.map(line=>line.includes("set('qaPassword'")?"pm.collectionVariables.set('qaPassword', pm.environment.get('qaPassword'));":line);
register.event.push(event('test',`if(pm.response.code===201) pm.collectionVariables.set('qaUserId',pm.response.json().id);`));
const login=regression.find(i=>i.name.startsWith('PT-07'));
login.event.push(event('test',`if(pm.response.code===200 && typeof pm.response.json().token==='string') pm.collectionVariables.set('memberToken',pm.response.json().token);`));
const setup=request('SETUP Yönetici girişi','POST','/api/auth/login',200,`pm.test('Yönetici kimliği ve JWT',()=>{const b=pm.response.json();pm.expect(b.user.Role.name).to.eql('Yönetici');pm.expect(b.token).to.be.a('string').and.not.empty;});
if(pm.response.code===200 && pm.response.json().user?.Role?.name==='Yönetici') pm.collectionVariables.set('adminToken',pm.response.json().token);`,{email:'{{adminEmail}}',password:'{{adminPassword}}'},null,['adminEmail','adminPassword']);
const project={name:'{{projectName}}',description:'Sprint 3 izole QA projesi',date:'2026-10-20'};
const task={title:'{{taskTitle}}',description:'Sprint 3 QA görevi',projectId:'{{projectId}}',status:'To Do',assignedTo:'{{memberUserId}}'};
const tests=[
 request('PT-11 Tokensız kullanıcı bilgisi','GET','/api/auth/me',401,errorShape),
 request('PT-12 Geçerli token ile kullanıcı bilgisi','GET','/api/auth/me',200,`pm.test('Doğru kullanıcı; parola dönmez',()=>{const b=pm.response.json();pm.expect(b.id).to.eql(Number(pm.collectionVariables.get('qaUserId')));pm.expect(b.email).to.eql(pm.collectionVariables.get('qaEmail'));pm.expect(b).not.to.have.property('password');pm.expect(b).not.to.have.property('password_hash');});`,null,'memberToken',['memberToken','qaUserId']),
 request('PT-13 Yönetici ile proje oluşturma','POST','/api/projects',201,`pm.test('Proje alanları ve oluşturan kullanıcı',()=>{const b=pm.response.json();pm.expect(b.id).to.be.a('number');pm.expect(b.name).to.eql(pm.variables.get('projectName'));pm.expect(b.description).to.eql('Sprint 3 izole QA projesi');pm.expect(b.date).to.eql('2026-10-20');pm.expect(b.created_by).to.eql(Number(pm.variables.get('adminUserId')));});
if(pm.response.code===201 && Number.isInteger(pm.response.json().id)) pm.collectionVariables.set('projectId',pm.response.json().id);`,project,'adminToken',['adminToken','adminUserId']),
 request('PT-14 Tokensız proje oluşturma','POST','/api/projects',401,errorShape,project),
 request('PT-15 Eksik proje adı','POST','/api/projects',400,errorShape+'\n'+hasFieldError.toString()+`\npm.test('Ad alanına özgü hata',()=>pm.expect(hasFieldError(pm.response.json(),'name')).to.eql(true));`,{description:'Ad alanı bilerek gönderilmez'},'adminToken',['adminToken']),
 request('PT-16 Projeleri listeleme','GET','/api/projects',200,`pm.test('Oluşturulan proje listede',()=>{const b=pm.response.json();pm.expect(b).to.be.an('array');pm.expect(b.some(p=>p.id===Number(pm.variables.get('projectId')))).to.eql(true);});`,null,'memberToken',['memberToken','projectId']),
 request('PT-17 Projeye görev ekleme','POST','/api/tasks',201,`pm.test('Görev, proje ve atama doğru',()=>{const b=pm.response.json();pm.expect(b.id).to.be.a('number');pm.expect(b.title).to.eql(pm.variables.get('taskTitle'));pm.expect(b.project_id).to.eql(Number(pm.variables.get('projectId')));pm.expect(b.assigned_to).to.eql(Number(pm.variables.get('memberUserId')));pm.expect(b.status).to.eql('To Do');});
if(pm.response.code===201 && Number.isInteger(pm.response.json().id)) pm.collectionVariables.set('taskId',pm.response.json().id);`,task,'memberToken',['memberToken','projectId','memberUserId']),
 request('PT-18A Görev durumunu In Progress yapma','PATCH','/api/tasks/{{taskId}}',200,`pm.test('Aynı görev In Progress oldu',()=>{const b=pm.response.json();pm.expect(b.id).to.eql(Number(pm.variables.get('taskId')));pm.expect(b.status).to.eql('In Progress');});`,{status:'In Progress'},'memberToken',['memberToken','taskId']),
 request('PT-18B Görev durumunu Done yapma','PATCH','/api/tasks/{{taskId}}',200,`pm.test('Aynı görev Done oldu',()=>{const b=pm.response.json();pm.expect(b.id).to.eql(Number(pm.variables.get('taskId')));pm.expect(b.status).to.eql('Done');});`,{status:'Done'},'memberToken',['memberToken','taskId']),
 request('PT-18C Durum kalıcılığını doğrulama','GET','/api/tasks?projectId={{projectId}}',200,`pm.test('Kaydedilmiş görev Done',()=>{const b=pm.response.json();pm.expect(b).to.be.an('array');const t=b.find(t=>t.id===Number(pm.variables.get('taskId')));pm.expect(t).to.be.an('object');pm.expect(t.status).to.eql('Done');});`,null,'memberToken',['memberToken','taskId','projectId']),
 request('PT-19 Olmayan projeye görev ekleme','POST','/api/tasks',404,errorShape,{title:'Olmayan projeye QA görevi',projectId:'{{missingProjectId}}'},'memberToken',['memberToken','missingProjectId'])
];
const extras=[
 request('EK Üye ile proje oluşturma — PDF yetki beklentisi','POST','/api/projects',201,`pm.test('Üye projesi oluşur',()=>pm.expect(pm.response.json().id).to.be.a('number'));`,{...project,name:'Üye QA {{runId}}'},'memberToken',['memberToken']),
 request('EK Proje detayı','GET','/api/projects/{{projectId}}',200,`pm.test('Doğru proje ve görev ilişkisi',()=>{const b=pm.response.json();pm.expect(b.id).to.eql(Number(pm.variables.get('projectId')));pm.expect(b.tasks).to.be.an('array');pm.expect(b.tasks.some(t=>t.id===Number(pm.variables.get('taskId')))).to.eql(true);});`,null,'memberToken',['memberToken','projectId','taskId']),
 request('EK Görev atamasını güncelleme','PATCH','/api/tasks/{{taskId}}',200,`pm.test('Yeni atama kaydedildi',()=>{const b=pm.response.json();pm.expect(b.id).to.eql(Number(pm.variables.get('taskId')));pm.expect(b.assigned_to).to.eql(Number(pm.variables.get('qaUserId')));});`,{assignedTo:'{{qaUserId}}'},'memberToken',['memberToken','taskId','qaUserId']),
 request('EK Görevleri proje ve kişiye göre filtreleme','GET','/api/tasks?projectId={{projectId}}&assignedTo={{qaUserId}}',200,`pm.test('Filtreler ve atama kalıcılığı',()=>{const b=pm.response.json();pm.expect(b).to.be.an('array');pm.expect(b.some(t=>t.id===Number(pm.variables.get('taskId')))).to.eql(true);b.forEach(t=>{pm.expect(t.project_id).to.eql(Number(pm.variables.get('projectId')));pm.expect(t.assigned_to).to.eql(Number(pm.variables.get('qaUserId')));});});`,null,'memberToken',['memberToken','projectId','taskId','qaUserId']),
 request('EK Swagger Sprint 3 uç noktaları','GET','/api/docs/swagger-ui-init.js',200,`pm.test('Yeni yollar ve yöntemler Swagger içinde',()=>{const text=pm.response.text();['/api/auth/me','/api/projects','/api/projects/{id}','/api/tasks','/api/tasks/{id}','"patch"'].forEach(v=>pm.expect(text).to.include(v));});`)
];
const collection={info:{name:'SprintEra Sprint 3 QA — PT-01–08 ve PT-11–19',schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',description:'Yalnızca izole test DB. Week 2 regresyon assertion’ları korunur. SETUP gerçek yönetici login’i yapar. Önkoşulu eksik testler atlanıp BLOCKED raporlanır. EK üye proje kontrolü PDF/Swagger yetki farkını doğrular.'},variable:['qaEmail','qaName','qaPassword','token','memberToken','adminToken','qaUserId','projectId','taskId'].map(key=>({key,value:'',type:'string'})),event:[event('prerequest',`if(pm.info.requestName==='PT-01 Health'){['token','memberToken','adminToken','qaUserId','projectId','taskId'].forEach(k=>pm.collectionVariables.unset(k));}`)],item:[{name:'Regresyon PT-01–PT-08',item:regression},{name:'Sprint 3 PT-11–PT-19',item:[setup,...tests]},{name:'Ek PDF kapsamı',item:extras}]};
const env={name:'SprintEra Sprint 3 izole yerel QA',values:[{key:'baseUrl',value:'http://127.0.0.1:3001',enabled:true,type:'default'},...['runId','qaPassword','adminEmail','adminPassword','adminUserId','memberUserId','projectName','taskTitle','missingProjectId'].map(key=>({key,value:'',enabled:true,type:/Password/.test(key)?'secret':'default'}))],_postman_variable_scope:'environment'};
fs.writeFileSync(path.join(testRoot,'postman/SprintEra-sprint3.postman_collection.json'),JSON.stringify(collection,null,2)+'\n');
fs.writeFileSync(path.join(testRoot,'postman/SprintEra-sprint3.postman_environment.json'),JSON.stringify(env,null,2)+'\n');
console.log(`Koleksiyon hazır: ${regression.length} regresyon, ${tests.length} Sprint 3, 1 setup, ${extras.length} ek istek.`);
