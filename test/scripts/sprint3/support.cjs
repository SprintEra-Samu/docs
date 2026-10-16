const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const crypto = require('node:crypto');
const testRoot = path.resolve(__dirname, '../..');
const runtime = path.join(testRoot, '.runtime-sprint3');
const dependency = createRequire(path.join(testRoot, 'config/package.json'));
function fingerprintFile(file) {
  const bytes=fs.readFileSync(file);
  return {algorithm:'sha256',sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length};
}
function dependencyLockFingerprints() {
  const locks=[{path:'test/config/package-lock.json',role:'QA ve Backend çalışma bağımlılıkları',file:path.join(testRoot,'config/package-lock.json')}];
  const backendLock=path.join(runtime,'backend/package-lock.json');
  if(fs.existsSync(backendLock))locks.push({path:'backend/package-lock.json',role:'Kaynak snapshot referansı; kurulum QA lock üzerinden',file:backendLock});
  return locks.map(({file,...entry})=>({...entry,...fingerprintFile(file)}));
}
function validateConfig(c) {
  if (!c || c.DB_HOST !== '127.0.0.1' || ![5432,55432].includes(Number(c.DB_PORT)) || c.DB_NAME !== 'SprintEra_sprint3_test' || c.DB_USER !== 'sprintera_sprint3_qa') throw new Error('Yalnızca açıkça ayrılmış yerel Sprint 3 test bağlantısı kullanılabilir.');
  for (const key of ['DB_PASSWORD','JWT_SECRET']) if (typeof c[key] !== 'string' || !c[key].trim()) throw new Error(`${key} eksik.`);
  return c;
}
function readLocalJson(file) {
  try { return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')); }
  catch { throw new Error('Yerel QA JSON dosyası eksik veya geçersiz; içeriği güvenlik nedeniyle gösterilmez.'); }
}
function config() { return validateConfig(readLocalJson(path.join(runtime,'connection.json'))); }
function validateTarget(url,actual,expected) {
  if(url!=='http://127.0.0.1:3001')throw new Error('Yalnızca sabit yerel QA URL kullanılabilir.');
  for(const key of ['serverId','database','backendRevision'])if(!expected[key] || actual[key]!==expected[key])throw new Error('HTTP QA sunucu kimliği/DB/commit doğrulaması başarısız.');
  if(actual.database!=='SprintEra_sprint3_test')throw new Error('HTTP hedefi QA DB değil.');
}
function sensitiveValues(value) {
  if(!value || typeof value!=='object')return [];
  if(Array.isArray(value))return value.flatMap(sensitiveValues);
  const found=[];
  if(typeof value.key==='string' && /password|token|secret|authorization/i.test(value.key) && typeof value.value==='string')found.push(value.value);
  for(const [key,item] of Object.entries(value)){
    if(/password|token|secret|authorization/i.test(key) && typeof item==='string')found.push(item);
    if(item && typeof item==='object')found.push(...sensitiveValues(item));
  }
  return found;
}
function classify(row) {
  if (!row.httpStatus || row.transportError || row.blockedReason) return 'BLOCKED';
  if ((row.assertions || []).some(a=>a.status==='FAIL')) return 'FAIL';
  if (!row.assertions?.length || row.assertions.some(a=>a.status!=='PASS')) return 'BLOCKED';
  return 'PASS';
}
function redact(value, secrets=[]) {
  if (typeof value === 'string') {
    for (const secret of secrets.filter(s=>typeof s==='string' && s.length>0).sort((a,b)=>b.length-a.length)) value=value.split(secret).join('[REDACTED]');
    return value.replace(/Bearer\s+[^\s"']+/gi,'Bearer [REDACTED]').replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,'[REDACTED]');
  }
  if (Array.isArray(value)) return value.map(v=>redact(v,secrets));
  if (!value || typeof value!=='object') return value;
  if (typeof value.key==='string' && /password|token|secret|authorization/i.test(value.key)) return {...value,value:'[REDACTED]'};
  return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,/password|token|secret|authorization/i.test(k)?'[REDACTED]':redact(v,secrets)]));
}
function loadBackend() {
  const c=config();
  // NODE_ENV=test disables server.js automatic sync/listen. All values precede imports.
  for (const [k,v] of Object.entries(c)) process.env[k]=String(v);
  process.env.NODE_ENV='test';
  process.env.PORT='3001';
  process.env.NODE_PATH=path.join(testRoot,'config/node_modules');
  require('node:module').Module._initPaths();
  const backend=path.join(runtime,'backend');
  process.chdir(backend); // swagger-jsdoc resolves ./routes relative to cwd.
  return {app:require(path.join(backend,'server.js')),models:require(path.join(backend,'models')),c};
}
module.exports={testRoot,runtime,dependency,validateConfig,config,classify,redact,loadBackend,readLocalJson,validateTarget,sensitiveValues,fingerprintFile,dependencyLockFingerprints};
