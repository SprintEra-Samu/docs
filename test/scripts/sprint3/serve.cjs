// Starts only the approved, dedicated QA database. No seed.js or force sync.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {runtime,dependency,loadBackend,redact,readLocalJson}=require('./support.cjs');
let db;
let secrets=[];
let server;
async function main() {
  const {app,models,c}=loadBackend();
  const {sequelize,Role,User,Project}=models;
  db=sequelize;
  secrets=[c.DB_PASSWORD,c.JWT_SECRET];
  const source=readLocalJson(path.join(runtime,'source.json'));
  const serverId=crypto.randomUUID();
  let ready=false;
  const outer=dependency('express')();
  outer.use((_req,res,next)=>ready?next():res.status(503).json({error:'QA hazırlığı devam ediyor'}));
  outer.get('/__qa_identity',(_req,res)=>res.json({serverId,database:c.DB_NAME,backendRevision:source.backendRevision}));
  outer.use(app);
  // Reserve the port before any connection or fixture write.
  server=await new Promise((resolve,reject)=>{
    const listener=outer.listen(3001,'127.0.0.1',()=>resolve(listener));
    listener.once('error',reject);
  });
  const [rows]=await sequelize.query('SELECT current_database() AS db, current_user AS username');
  if (rows[0].db!==c.DB_NAME || rows[0].username!==c.DB_USER) throw new Error('DB kimlik doğrulaması uyuşmuyor.');
  await sequelize.sync();
  const runId=Date.now()+'-'+crypto.randomBytes(4).toString('hex');
  const adminPassword=crypto.randomBytes(24).toString('hex');
  const memberPassword=crypto.randomBytes(24).toString('hex');
  secrets.push(adminPassword,memberPassword);
  const bcrypt=dependency('bcrypt');
  const [adminRole]=await Role.findOrCreate({where:{name:'Yönetici'}});
  const [memberRole]=await Role.findOrCreate({where:{name:'Ekip Üyesi'}});
  const admin=await User.create({name:'Sprint 3 QA Yönetici',email:`qa.admin.${runId}@sprintera.test`,password_hash:await bcrypt.hash(adminPassword,10),role_id:adminRole.id});
  const member=await User.create({name:'Sprint 3 QA Üye',email:`qa.member.${runId}@sprintera.test`,password_hash:await bcrypt.hash(memberPassword,10),role_id:memberRole.id});
  const missingProjectId=2147483647;
  if(await Project.findByPk(missingProjectId)) throw new Error('Yokluk kontrolü başarısız.');
  fs.writeFileSync(path.join(runtime,'fixtures.json'),JSON.stringify({runId,serverId,adminEmail:admin.email,adminPassword,adminUserId:admin.id,memberEmail:member.email,memberPassword,memberUserId:member.id,missingProjectId},null,2)+'\n',{mode:0o600});
  ready=true;
  console.log('QA API hazır: http://127.0.0.1:3001; ayrı test DB, kaynak değişmedi.');
  server.on('error',async e=>{console.error(e.code || 'API başlatılamadı');await sequelize.close();process.exitCode=1;});
  for(const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>server.close(async()=>{await sequelize.close();}));
}
main().catch(async e=>{console.error(redact(e.message,secrets));if(server)server.close();if(db)await db.close();process.exitCode=1;});
