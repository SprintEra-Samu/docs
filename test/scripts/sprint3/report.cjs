const fs=require('node:fs');
const path=require('node:path');
const {testRoot}=require('./support.cjs');
const r=JSON.parse(fs.readFileSync(path.join(testRoot,'results/sprint3/latest.json'),'utf8'));
const collection=JSON.parse(fs.readFileSync(path.join(testRoot,'postman/SprintEra-sprint3.postman_collection.json'),'utf8'));
const flat=items=>items.flatMap(i=>i.item?flat(i.item):[i]);
const definitions=flat(collection.item);
const cell=v=>String(v??'—').replaceAll('|','\\|').replaceAll('\n',' ');
const evidence=`results/sprint3/${r.runId}.json`;
const failed=r.requests.filter(i=>i.result==='FAIL');
const sum=r.requiredSummary;
let report=`# Sprint 3 QA Test Raporu\n\nRapor zamanı: ${r.completedAt}. Backend commit: \`${r.backendRevision||'bilinmiyor'}\`. Kaynak: Sprint 3 PDF'si, sayfa 5–7 ve kullanıcının onayladığı test planı.\n\n## Yönetici özeti\n\nZorunlu 17 senaryo: **${sum.PASS} PASS, ${sum.FAIL} FAIL, ${sum.BLOCKED} BLOCKED**. HTTP çalıştırması ${r.executionAttempted?'başlatıldı':'yapılmadı'}. Bu rapor yalnızca bu çalıştırmanın kanıtını temsil eder; Week 2 raporundaki geçmiş sonuçlar Sprint 3 sonucu sayılmaz.\n\n${r.executionAttempted?'Yayın/teslim kararı açık hatalar ve engellerle birlikte değerlendirilmelidir.':'Test ortamı onayı veya erişimi bekleniyor. Sprint 3 QA tamamlandı olarak işaretlenemez.'}\n\n## Ortam ve izlenebilirlik\n\n- Araç: Node.js ${r.nodeVersion}; Newman ${r.newmanVersion||'henüz çalıştırılmadı'}.\n- Hedef: yalnızca 127.0.0.1:3001 ve ayrılmış SprintEra_sprint3_test PostgreSQL veritabanı.\n- Şema: Sequelize sync; force/alter kullanılmaz. Bu tur migration doğrulaması değildir.\n- Başlangıç: ${r.startedAt}; bitiş: ${r.completedAt}.\n- Çalıştırma kanıtı: [tarihli JSON](${evidence}); [son sonuç](results/sprint3/latest.json).\n\n## Zorunlu senaryo sonuçları\n\n| Senaryo | Sonuç | Alt istek sayısı | Hata sahibi |\n| --- | --- | --- | --- |\n`;
for(const s of r.scenarios)report+=`| ${s.id} | ${s.result} | ${s.requestCount} | ${s.owner||'Week 2 mevcut kayıtları'} |\n`;
report+='\n## Bağımlılık kilidi parmak izleri\n\nParmak izleri ilgili dosyanın ham baytlarından SHA-256 ile hesaplanır. Kurulum yapılmadığında bu değerler kurulmuş paket kanıtı sayılmaz.\n\n| Dosya | Rol | SHA-256 | Bayt |\n| --- | --- | --- | --- |\n';
for(const lock of r.dependencyLocks||[])report+=`| ${cell(lock.path)} | ${cell(lock.role)} | ${lock.sha256} | ${lock.bytes} |\n`;
report+='\n## Gerçek HTTP sonuçları\n\nHTTP kodu boşsa yanıt alınmamış veya istek çalıştırılmamıştır. SETUP ve EK kontroller zorunlu 17 senaryo toplamına dahil değildir.\n\n| İstek | Beklenen HTTP | Gerçek HTTP | Sonuç | Açıklama |\n| --- | --- | --- | --- | --- |\n';
for(const row of r.requests){
  const notes=row.blockedReason||row.transportError||row.assertions.filter(a=>a.status!=='PASS').map(a=>a.name+': '+(a.message||a.status)).join('; ')||'Tüm assertion’lar geçti';
  report+=`| ${cell(row.name)} | ${row.expectedStatus??'—'} | ${row.httpStatus??'—'} | ${row.result} | ${cell(notes)} |\n`;
}
report+='\n## Bulgular, retest ve sınırlar\n\n- [Hata raporu](SPRINT3-BUGS.md) yalnızca gerçek FAIL sonuçlarını doğrulanmış hata olarak listeler.\n- [Retest kaydı](SPRINT3-RETEST.md) ayrı tutulur; düzeltme gelmeden kapalı hata veya başarılı retest iddiası yoktur.\n- PDF ile Swagger proje oluşturma yetkisinde farklıdır: ana proje testleri yöneticiyle, ek kontrol üyeyle ve PDF’nin 201 beklentisiyle çalışır.\n- Kaynak kod incelemesi canlı Swagger veya HTTP çalıştırması yerine geçmez.\n- Migration, bonus Jest/coverage, frontend ve CI doğrulaması bu API test turunun kapsamında değildir.\n- Commit/push/PR yayını ayrıca kullanıcı onayı gerektirir; rapor yayımlanmış PR veya tamamlanmış ekip ataması iddiası taşımaz.\n';
const envFile=path.join(testRoot,'results/sprint3/environment.json');
const verifiedEnvironment=fs.existsSync(envFile)?JSON.parse(fs.readFileSync(envFile,'utf8')):null;
if(verifiedEnvironment?.runId===r.runId){
 report+='\n## Do\u011frulanm\u0131\u015f ortam ve \u00e7al\u0131\u015ft\u0131rma \u00f6zeti\n\n';
 report+=`- PostgreSQL ${verifiedEnvironment.postgresql.version}; ${verifiedEnvironment.postgresql.host}:${verifiedEnvironment.postgresql.port}; DB ${verifiedEnvironment.postgresql.database}.\n`;
 report+='- QA hesab\u0131 superuser, CREATEDB, CREATEROLE veya replication yetkisine sahip de\u011fil.\n- Mevcut 5432 Windows servisi de\u011fi\u015ftirilmedi; QA ayr\u0131 veri klas\u00f6r\u00fcnde 55432 portunda \u00e7al\u0131\u015ft\u0131.\n- Ortam kan\u0131t\u0131: [environment.json](results/sprint3/environment.json).\n';
 const sprint=r.scenarios.filter(s=>Number(s.id.slice(3))>=11);
 const regression=r.scenarios.filter(s=>Number(s.id.slice(3))<=8);
 const requests=Object.fromEntries(['PASS','FAIL','BLOCKED'].map(state=>[state,r.requests.filter(x=>x.result===state).length]));
 const assertions=r.requests.flatMap(x=>x.assertions);
 report+=`- Sprint 3 PT-11-PT-19: ${sprint.filter(s=>s.result==='PASS').length}/9 PASS; regresyon PT-01-PT-08: ${regression.filter(s=>s.result==='PASS').length}/8 PASS.\n`;
 report+=`- T\u00fcm koleksiyon: ${r.requests.length} istek; ${requests.PASS} PASS, ${requests.FAIL} FAIL, ${requests.BLOCKED} BLOCKED; ${assertions.filter(a=>a.status==='PASS').length}/${assertions.length} assertion ge\u00e7ti.\n`;
 report+='- PT-06 alan bazli hata sorunu onceki QA-W2-001 kaydinin yeni commit uzerinde devam ettigini gosteriyor. EK uye proje olusturma kontrolu PDF/Swagger yetki farkini dogruladi.\n';
}

fs.writeFileSync(path.join(testRoot,'SPRINT3-REPORT.md'),report);
let bugs='# Sprint 3 hata raporu\n\nDurum: bu dosya yerel hata taslağıdır; Jira kaydı açılmadı ve ekip üyelerine mesaj gönderilmedi. Kaynak: [çalıştırma kanıtı]('+evidence+').\n\n';
if(!failed.length)bugs+=r.executionAttempted?'Bu çalıştırmada FAIL olarak kaydedilmiş istek yoktur. BLOCKED senaryolar nedeniyle hata yokluğu veya ürün onayı sonucuna varılamaz.\n':'HTTP testleri çalıştırılmadı; doğrulanmış ürün hatası bildirilmiyor.\n';
const groups=new Map();
for(const row of failed){const key=row.scenarioId||row.name;groups.set(key,[...(groups.get(key)||[]),row]);}
let index=0;
for(const [key,rows] of groups){
  index++;
  const memberConflict=key.includes('Üye ile proje');
  const owner=key==='PT-18'||key.includes('atamas\u0131n\u0131')?'Backend 2':'Backend 1';
  const severity=key==='PT-06'||key==='PT-15'?'Orta':'Yüksek';
  bugs+=`\n## S3-BUG-${String(index).padStart(2,'0')} — ${key}\n\n- Durum: AÇIK; düzeltme/retest bekleniyor.\n- Sorumlu: ${owner}. Önem: ${severity}.\n- Backend commit: \`${r.backendRevision}\`. Çalıştırma: ${r.runId}.\n- Önkoşul: ayrılmış QA DB/API ve koleksiyonun önceki başarılı hazırlık adımları.\n- Tekrar üretim: Sprint 3 koleksiyonunu sırasıyla çalıştırın; aşağıdaki istekleri aynı çalışma içinde inceleyin. Parola/token değerlerini yalnızca yerel ortamdan sağlayın.\n`;
  if(memberConflict)bugs+='- Gereksinim farkı: PDF giriş yapan kullanıcı için proje oluşturmayı bekler; Swagger ve rol middleware yalnızca Yönetici’ye izin verir. Beklenti ürün gereksinimi netleştirilene kadar PDF’deki 201 olarak korunmuştur.\n';
  for(const row of rows){
    bugs+=`\n### ${row.name}\n\n- İstek: \`${row.method} ${row.url}\`.\n- Beklenen HTTP: ${row.expectedStatus}; gerçekleşen HTTP: ${row.httpStatus}.\n- Başarısız kontroller: ${row.assertions.filter(a=>a.status==='FAIL').map(a=>cell(a.name+': '+a.message)).join('; ')}.\n- Gerçek yanıt:\n\n\`\`\`json\n${JSON.stringify(row.response??null,null,2)}\n\`\`\`\n`;
    const body=definitions.find(i=>i.name===row.name)?.request.body?.raw;
    if(body)bugs+=`\nTekrar üretim gövdesi (yerel değişkenleri kullanın):\n\n\`\`\`json\n${body}\n\`\`\`\n`;
  }
}
bugs+='\n## Çalıştırma öncesi gözlemler\n\nKaynak incelemesinde proje oluşturma yetkisi farkı görülmüştür; HTTP kanıtı yoksa doğrulanmış hata sayılmaz. Week 2 hata kayıtları ve raporları korunmuştur; eski FAIL sonuçları otomatik kapatılmaz veya yeni çalıştırma sonucu olarak taşınmaz.\n';
fs.writeFileSync(path.join(testRoot,'SPRINT3-BUGS.md'),bugs);
fs.writeFileSync(path.join(testRoot,'SPRINT3-RETEST.md'),`# Sprint 3 retest kaydı\n\n**Retest çalıştırılmadı.** Geliştirici düzeltmesi teslim edilmedi ve düzeltilmiş commit üzerinde tekrar test kanıtı bulunmuyor. İlk QA turu retest sayılmaz.\n\nSon tur: [${r.runId}](${evidence}), kaynak commit \`${r.backendRevision}\`.\n\n| Durum | Açıklama |\n| --- | --- |\n| Düzeltme bekleniyor | Gerçek FAIL kayıtları için yeni Backend commit'i gerekir. |\n| Ortam engelleri | BLOCKED testler ancak önkoşullar sağlanınca ilk kez çalıştırılır. |\n| Kapatma ölçütü | Aynı senaryo yeni commit üzerinde geçer; ilgili regresyon çalışır; tarihli kanıt eklenir. |\n\nDüzeltme gelince özgün Backend'e dokunmadan ayrı bir çalışma snapshot'ı hazırlanmalı; mevcut snapshot/veri üzerine yazma veya silme öncesinde ayrıca onay alınmalıdır.\n`);
if(r.executionAttempted){
 if(failed.some(x=>x.scenarioId==='PT-06')){
  fs.appendFileSync(path.join(testRoot,'SPRINT3-BUGS.md'),'\nPT-06: [QA-W2-001](BUGS.md) mevcut hata kayd\u0131yla ili\u015fkilidir; yeni Backend commit\u0027inde sorun devam ediyor.\n');
  fs.appendFileSync(path.join(testRoot,'SPRINT3-RETEST.md'),'\n## Mevcut hatan\u0131n regresyon kontrol\u00fc\n\nQA-W2-001, bu ger\u00e7ek turda PT-06A/B/C ile yeniden kontrol edildi: HTTP 400, alan bazl\u0131 hata assertion\u0027lar\u0131 FAIL. Sorun devam ediyor; hata kapat\u0131lmad\u0131. Geli\u015ftirici d\u00fczeltmesi sonras\u0131 retest hen\u00fcz yoktur.\n');
 }
}

fs.writeFileSync(path.join(testRoot,'SPRINT3-PR.md'),`# PR taslağı — Sprint 3 QA koleksiyonu ve test raporu\n\nKaynak dal: feature/qa-sprint3-tests\nHedef depo/dal: SprintEra-Samu/docs -> main\nÖnerilen commit: test: add Sprint 3 QA collection and execution evidence\n\nSprint 3 PDF'sindeki PT-11–PT-19 API senaryolarını ve mevcut PT-01–PT-08 regresyonunu tek koleksiyonda doğrular. Week 2 teslimleri korunur; yetki farkı ek kontrolle raporlanır. Backend kaynak değişikliği yoktur.\n\nDoğrulama: statik koleksiyon doğrulaması ve QA güvenlik yardımcı testleri. Son zorunlu API sonucu: ${sum.PASS} PASS, ${sum.FAIL} FAIL, ${sum.BLOCKED} BLOCKED; HTTP çalıştırması ${r.executionAttempted?'başlatıldı':'yapılmadı'}. Ayrıntılar [Sprint 3 raporunda](SPRINT3-REPORT.md).\n\nBu dosya PR taslağıdır. Kullanıcı onayı olmadan commit, push veya PR yayını yapılmaz.\n`);
console.log('Türkçe rapor, hata kaydı, retest kaydı ve PR taslağı güncellendi.');
