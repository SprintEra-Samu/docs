const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {runtime,testRoot}=require('./support.cjs');
const source=path.resolve(testRoot,'../../backend');
const snapshot=path.join(runtime,'backend');
if(fs.existsSync(snapshot)) throw new Error('Çalışma kopyası mevcut; üzerine yazılmaz.');
const git=args=>execFileSync('git',['-c',`safe.directory=${source.replaceAll('\\','/')}`,...args],{cwd:source,encoding:'utf8'}).trim();
if(git(['status','--porcelain=v1'])) throw new Error('Backend temiz değil.');
const backendRevision=git(['rev-parse','HEAD']);
fs.mkdirSync(runtime,{recursive:true});
// git archive writes only to the ignored QA workspace; tar is Windows built-in.
const archive=path.join(runtime,'backend.tar');
git(['archive','--format=tar',`--output=${archive}`,'HEAD']);
fs.mkdirSync(snapshot);
execFileSync('tar',['-xf',archive,'-C',snapshot],{stdio:'pipe'});
fs.writeFileSync(path.join(runtime,'source.json'),JSON.stringify({backendRevision,createdAt:new Date().toISOString()},null,2)+'\n');
console.log(`Backend kaynak snapshot hazır: ${backendRevision}`);
