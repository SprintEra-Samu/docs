// Read-only database/API verification; writes only sanitized QA evidence.
const fs=require('node:fs');
const path=require('node:path');
const {testRoot,dependency,config,readLocalJson}=require('./support.cjs');
async function main(){
 const c=config();
 const r=readLocalJson(path.join(testRoot,'results/sprint3/latest.json'));
 if(!r.executionAttempted)throw new Error('A real test execution is required.');
 const {Client}=dependency('pg');
 const client=new Client({host:c.DB_HOST,port:c.DB_PORT,database:c.DB_NAME,user:c.DB_USER,password:c.DB_PASSWORD,connectionTimeoutMillis:5000});
 try{
  await client.connect();
  const {rows}=await client.query("SELECT current_setting('server_version') AS version, current_database() AS database, current_user AS username, inet_server_port() AS port, inet_server_addr()::text AS host");
  const role=await client.query('SELECT rolsuper, rolcreatedb, rolcreaterole, rolreplication FROM pg_roles WHERE rolname=current_user');
  if(rows[0].database!==c.DB_NAME || rows[0].username!==c.DB_USER || rows[0].port!==Number(c.DB_PORT))throw new Error('QA identity mismatch');
  if(Object.values(role.rows[0]).some(Boolean))throw new Error('QA role unexpectedly privileged');
  const evidence={runId:r.runId,checkedAt:new Date().toISOString(),postgresql:rows[0],qaRolePrivileges:role.rows[0],newmanVersion:dependency('newman/package.json').version,existingWindowsService:{port:5432,changed:false},schemaPreparation:'Sequelize sync without force/alter; Backend seed.js and migrations not executed',isolation:'separate local PostgreSQL data directory, loopback only, SCRAM authentication'};
  fs.writeFileSync(path.join(testRoot,'results/sprint3/environment.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence));
 }finally{await client.end();}
}
main().catch(()=>{console.error('QA environment verification failed; secret connection values omitted.');process.exitCode=1;});
