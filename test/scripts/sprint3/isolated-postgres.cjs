// Dedicated QA cluster. Never reads or changes the existing Windows PG service.
const fs=require('node:fs');
const path=require('node:path');
const net=require('node:net');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {runtime,readLocalJson}=require('./support.cjs');
const bin='C:\\Program Files\\PostgreSQL\\18\\bin';
const data=path.join(runtime,'postgres-data');
const adminFile=path.join(runtime,'isolated-admin.json');
const marker=path.join(runtime,'cluster.json');
const port=55432;
const call=(exe,args)=>{
 const fd=fs.openSync(path.join(runtime,'postgres-control.log'),'a');
 try{return execFileSync(path.join(bin,exe),args,{windowsHide:true,timeout:exe==='initdb.exe'?120000:45000,stdio:['ignore',fd,fd]});}
 finally{fs.closeSync(fd);}
};
const validateMarker=()=>{const m=readLocalJson(marker);if(m.dataDirectory!==data || m.port!==port)throw new Error('Cluster marker mismatch; operation refused.');};
const checkPort=()=>new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',()=>reject(new Error('QA port 55432 is occupied.')));probe.listen(port,'127.0.0.1',()=>probe.close(resolve));});
async function main(){
  fs.mkdirSync(runtime,{recursive:true});
  if(process.argv[2]==='stop'){
    validateMarker();
    call('pg_ctl.exe',['-D',data,'-m','fast','-w','stop']);
    console.log('Only the dedicated QA cluster was stopped; existing service untouched.');return;
  }
  if(process.argv[2]==='start'){
    validateMarker();
    try{call('pg_ctl.exe',['-D',data,'status']);console.log('Dedicated QA cluster is already running.');return;}catch{}
    await checkPort();
    call('pg_ctl.exe',['-D',data,'-l',path.join(runtime,'postgres.log'),'-o','-h 127.0.0.1 -p 55432','-w','-t','30','start']);
    console.log('Preserved QA cluster started; data was not reset.');return;
  }
  if(fs.existsSync(path.join(data,'PG_VERSION')) || fs.existsSync(adminFile) || fs.existsSync(marker))throw new Error('QA cluster already exists; initialization refused to preserve data.');
  await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',()=>reject(new Error('QA port 55432 is occupied.')));probe.listen(port,'127.0.0.1',()=>probe.close(resolve));});
  const admin={host:'127.0.0.1',port,database:'postgres',user:'sprintera_qa_admin',password:crypto.randomBytes(32).toString('hex')};
  fs.writeFileSync(adminFile,JSON.stringify(admin,null,2)+'\n',{mode:0o600,flag:'wx'});
  const passwordFile=path.join(runtime,'initdb-password.txt');
  fs.writeFileSync(passwordFile,admin.password+'\n',{mode:0o600,flag:'wx'});
  try{
    call('initdb.exe',['-D',data,'-U',admin.user,'--auth-host=scram-sha-256','--auth-local=scram-sha-256','--encoding=UTF8','--locale=C','--pwfile='+passwordFile]);
  }finally{fs.unlinkSync(passwordFile);}
  fs.writeFileSync(marker,JSON.stringify({dataDirectory:data,port,host:'127.0.0.1',createdAt:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
  call('pg_ctl.exe',['-D',data,'-l',path.join(runtime,'postgres.log'),'-o','-h 127.0.0.1 -p 55432','-w','-t','30','start']);
  console.log('Dedicated QA PostgreSQL started on 127.0.0.1:55432; credentials stored only in ignored local files.');
}
main().catch(()=>{console.error('Dedicated QA cluster setup/stop failed; no existing PostgreSQL service was changed. Inspect ignored local logs, without publishing credentials.');process.exitCode=1;});
