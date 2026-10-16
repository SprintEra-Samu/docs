// Run only after explicit approval. Creates a new role/database; never drops/resets.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {runtime,dependency,redact,readLocalJson} = require('./support.cjs');
async function main() {
  const requiredPort=process.argv.includes('--isolated')?55432:5432;
  const admin=readLocalJson(path.join(runtime,process.argv.includes('--isolated')?'isolated-admin.json':'admin.json'));
  if (admin.host!=='127.0.0.1' || Number(admin.port)!==requiredPort || admin.database!=='postgres' || !admin.user || !admin.password || admin.password.includes('REPLACE')) throw new Error('Geçerli yerel admin.json gerekli; parola çıktılanmaz.');
  if (fs.existsSync(path.join(runtime,'connection.json'))) throw new Error('QA bağlantısı zaten mevcut; tekrar provision yapılmaz.');
  const {Client}=dependency('pg');
  const client=new Client({...admin,connectionTimeoutMillis:5000});
  const c={DB_HOST:'127.0.0.1',DB_PORT:Number(admin.port),DB_NAME:'SprintEra_sprint3_test',DB_USER:'sprintera_sprint3_qa',DB_PASSWORD:crypto.randomBytes(32).toString('hex'),JWT_SECRET:crypto.randomBytes(48).toString('hex')};
  try {
    await client.connect();
    const existing=await client.query('SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname=$1) AS db, EXISTS(SELECT 1 FROM pg_roles WHERE rolname=$2) AS role',[c.DB_NAME,c.DB_USER]);
    if (existing.rows[0].db || existing.rows[0].role) throw new Error('Hedef DB veya rol mevcut. Üzerine yazılmadı; kontrol/onay gerekiyor.');
    await client.query(`CREATE ROLE sprintera_sprint3_qa LOGIN PASSWORD '${c.DB_PASSWORD}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION`);
    await client.query('CREATE DATABASE "SprintEra_sprint3_test" OWNER sprintera_sprint3_qa');
    await client.query('REVOKE ALL ON DATABASE "SprintEra_sprint3_test" FROM PUBLIC');
    fs.writeFileSync(path.join(runtime,'connection.json'),JSON.stringify(c,null,2)+'\n',{mode:0o600,flag:'wx'});
    console.log('Yeni yerel QA veritabanı ve kısıtlı kullanıcı hazır; hiçbir mevcut tablo silinmedi.');
  } catch(e) { throw new Error(redact(e.message,[admin.password,c.DB_PASSWORD,c.JWT_SECRET])); }
  finally { await client.end().catch(()=>{}); }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
