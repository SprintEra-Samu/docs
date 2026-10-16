# Sprint 3 QA çalıştırma

Tüm komutlar **docs deposu kökünden** çalıştırılır. Mevcut Week 2 dosyaları ve eski raporlar korunur. Yeni raporlar Sprint 3'e özeldir.


## 16 Ekim: unutulan parola icin uygulanan izole QA ortami

Kullanicinin kurulum ve yalnizca yeni QA veritabaninda veri yazma onayi alindi. Mevcut PostgreSQL yonetici parolasi sifirlanmadi ve 5432 servisi degistirilmedi. Kurulu PostgreSQL 18 araclari kullanilarak `test/.runtime-sprint3/postgres-data` klasorunde **ayri bir cluster**, yalnizca `127.0.0.1:55432` uzerinde SCRAM kimlik dogrulamasi ile hazirlandi. Docker kurulumu gerekmedi.

Bu yol icin `admin.json` doldurmak gerekmez; eski yonetim baglantisi sablonu oldugu gibi korunur. Yeni cluster yonetici parolasi otomatik uretilerek yalnizca Git disindaki `isolated-admin.json` dosyasina yazilir. QA kullanicisi ve JWT anahtari ayri `connection.json` dosyasindadir; bu dosyalar rapora veya Git'e alinmaz.

Uygulanan komutlar (docs kokunden):

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund --prefix test/config
node test/scripts/sprint3/isolated-postgres.cjs
node test/scripts/sprint3/provision.cjs --isolated
node test/scripts/sprint3/serve.cjs
```

API acikken ikinci terminalde gercek test ve rapor:

```powershell
node test/scripts/sprint3/run.cjs
node test/scripts/sprint3/environment.cjs
node test/scripts/sprint3/report.cjs
```

Mevcut cluster/veritabani uzerine tekrar ilk kurulum uygulanmaz. `seed.js`, migration, force/alter sync, parola sifirlama veya mevcut veri silme calistirilmadi. Asagidaki 15 Ekim kurulum bilgileri ilk durumu ve parolasi bilinen mevcut servis yolunu anlatir; gercek 16 Ekim calistirmasi 55432 uzerindedir.

## Bu bilgisayarda kontrol edilen kurulum

15 Ekim 2026 kontrolü: Node.js **24.14.0**, npm **11.9.0**, PostgreSQL istemcisi **18.6** mevcut; `postgresql-x64-18` servisi çalışıyor ve `127.0.0.1:5432` bağlantı kabul ediyor. `psql` PATH'te değil; tam yolu `C:\Program Files\PostgreSQL\18\bin\psql.exe`. Docker komutu/standart Docker Desktop kurulumu tespit edilmedi. Newman global veya QA yerel bağımlılıklarında kurulu değil. Backend ve QA `node_modules` klasörleri henüz yok.

Mevcut PostgreSQL kullanılacağı için Docker kurulumu gerekmez. Backend Docker Compose dosyası PostgreSQL 16'yı host üzerinde **5433** portuna açmak için hazırlanmış; mevcut servis ise **5432** kullanıyor. Backend `.env.example` ve kod varsayılanı 5433 iken README örneği 5432. QA sarmalayıcısı açıkça 5432 kullanarak bu farkı giderir; özgün Backend `.env` dosyası oluşturulmaz/değiştirilmez.

Backend `package.json` içindeki `start`, `migrate`, `seed` ve Jest komutları incelendi. Altı migration rol, izin, kullanıcı, rol-izin ilişkisi, proje ve görev tablolarını oluşturuyor. `seed.js` **sync({ force: true })** içerdiğinden QA akışında kullanılmaz. Mevcut model ile migration şemaları aynı varsayılmamalıdır; aşağıdaki API turu model üzerinden şema hazırladığı için migration testi olarak raporlanmaz.

## admin.json alanları

Yerel dosya: `test/.runtime-sprint3/admin.json`. Bu dosya yeni QA kullanıcısının değil, yeni veritabanını oluşturabilecek PostgreSQL yönetici hesabının bağlantısıdır.

| Alan | Bu bilgisayar için değer / işlem |
| --- | --- |
| `host` | `127.0.0.1`; yerel sunucu |
| `port` | `5432`; sayı olarak yazılır |
| `database` | `postgres`; yalnızca yönetim bağlantısı için kullanılan mevcut sistem DB'si; uygulama verisi buraya yazılmaz |
| `user` | Genellikle `postgres`; kendi yetkili PostgreSQL hesabınız farklıysa onu yazın |
| `password` | PostgreSQL kurulurken bu hesap için belirlediğiniz gerçek parola; yalnızca kendi editörünüzde doldurun |

Mevcut dosyada host/port/database/user alanları hazır, parola alanı yer tutucudur. Parola bilinmiyorsa tahmin veya hesap/parola sıfırlama yapılmaz; kullanıcı/DB yöneticisi tarafından erişim sağlanması beklenir. Mevcut dosyanın üzerine şablon tekrar kopyalanmaz. Gerçek parola terminal çıktısına, rapora veya sohbete alınmaz.

Yeni QA hesabının parolası ve JWT anahtarı `provision.cjs` tarafından rastgele oluşturulup göz ardı edilen `connection.json` dosyasına yazılır; bunları elle doldurmanız gerekmez.

## Önce güvenli hazırlık

```powershell
node test/scripts/sprint3/build.cjs
node test/scripts/sprint3/verify.cjs
node --test test/scripts/sprint3/safety.test.cjs
node test/scripts/sprint3/prepare.cjs
```

`prepare` temiz Backend HEAD'ini `test/.runtime-sprint3/backend` içine `git archive` ile çıkarır. Mevcut snapshot üzerine yazmaz, Backend dosyalarını değiştirmez. `source.json` commit bilgisini taşır. Bu adım ağ veya DB kullanmaz. Git sahiplik istisnası yalnızca bu komutun belirli kaynak dizinine uygulanır; global Git ayarı değiştirilmez.

## Onay gereken işlemler

Aşağıdaki kurulum, DB ve veri yazan API/test işlemleri yalnızca kullanıcı onayı sonrasında yapılır:

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund --prefix test/config
```

Mevcut QA kilit dosyası Newman ve Backend paketlerini sabitler. Backend snapshot'ı bu bağımlılıkları `NODE_PATH` ile kullanır; Backend package.json/lock dosyaları değiştirilmez.

```powershell
Copy-Item -LiteralPath test/scripts/sprint3/admin.example.json -Destination test/.runtime-sprint3/admin.json
```

Bu kopyalama yalnızca hedef dosya **yoksa** yapılmalıdır. Yerel editörünüzle `admin.json` içindeki PostgreSQL yönetici bilgilerini doldurun. Parolayı sohbete, terminal komut satırına veya Git'e yazmayın. Dosyanın göz ardı edildiğini `git check-ignore test/.runtime-sprint3/admin.json` ile doğrulayabilirsiniz.

```powershell
node test/scripts/sprint3/provision.cjs
```

Yalnızca yeni `SprintEra_sprint3_test` DB ve `sprintera_sprint3_qa` rolü oluşturulur. Hedef isim mevcutsa durur; üzerine yazma, silme veya reset yoktur. Rastgele test parolası/JWT anahtarı yerel `connection.json` dosyasına kaydedilir. Kurulum kısmi başarısız olursa tekrar denemeden önce mevcut DB/rol incelenir; otomatik silme yapılmaz.

Bir terminalde:

```powershell
node test/scripts/sprint3/serve.cjs
```

Önce `127.0.0.1:3001` portu ayrılır; port doluysa DB yazımı başlamadan durulur. Ardından DB kimliği doğrulanır, silmeden şema hazırlanır, benzersiz yönetici/üye fixture'ları oluşturulur. `fixtures.json` gizlidir. Dolu porttaki mevcut uygulama durdurulmaz. İş bitince bu terminalde Ctrl+C kullanılabilir; test verileri otomatik silinmez.

İkinci terminalde:

```powershell
node test/scripts/sprint3/run.cjs
node test/scripts/sprint3/report.cjs
```

Newman öncesinde sabit yerel hedef adresi ve `/__qa_identity` yanıtındaki çalışma kimliği, DB adı ve Backend commit'i yerel fixture/snapshot bilgileriyle eşleştirilir. Bu uç nokta yalnızca QA sarmalayıcısına aittir; Backend'e eklenmez. Kimlik doğrulanamazsa hiçbir Postman yazma isteği gönderilmez. HTTP yönlendirmeleri takip edilmez.

Raporlayıcı yayınlanabilir JSON ve Türkçe rapor üretir. Her çalıştırmanın tarihli kanıtı korunur; `latest.json` son çalıştırmayı işaret eder. Çıkış kodu 1, FAIL veya BLOCKED bulunduğunu gösterir. `safety.test.cjs` QA araç testidir; API senaryolarının PASS kanıtı değildir.

PT-13, gönderilen proje açıklamasının yanıtta aynen döndüğünü de doğrular. JSON sonuçları ve Türkçe rapor, kullanılan QA `package-lock.json` dosyasının SHA-256 parmak izini ve bayt sayısını içerir. Backend snapshot kilidi ayrıca referans olarak kaydedilir; paket kurulumu QA kilidi üzerinden yapılır. Tarihli eski kanıtlar değiştirilmez.

Ortam hazır değilse yalnızca dürüst engel kaydı üretmek için:

```powershell
node test/scripts/sprint3/run.cjs --blocked "Kurulum/DB erişimi bekleniyor; HTTP testleri çalıştırılmadı."
node test/scripts/sprint3/report.cjs
```

Postman arayüzünde `postman/SprintEra-sprint3.postman_collection.json` ve eşleşen ortam şablonu içe aktarılabilir. Yerel gizli değerleri yalnızca onaylanan test ortamında doldurun; tüm koleksiyonu sırasıyla çalıştırın. Eksik önkoşullar atlanır. Postman ortam değişkenlerinin doldurulduğu export'lar repoya alınmaz.

## Teslim

`SPRINT3-REPORT.md`, `SPRINT3-BUGS.md`, `SPRINT3-RETEST.md`, `SPRINT3-TEST-PLAN.md`, koleksiyon/ortam şablonu, yeni scriptler ve `results/sprint3/` incelemeye alınır. `SPRINT3-PR.md` PR taslağıdır; yayımlanmış PR anlamına gelmez. Stage öncesi sır taraması yapılır. Commit/push için ayrıca açık onay gerekir; hedef docs/main'dir.

## Korunan QA cluster ile sonraki calisma

Ilk kurulum komutunu tekrar calistirmayin. Durdurulmus QA cluster verileri korunarak soyle baslatilir:

```powershell
node test/scripts/sprint3/isolated-postgres.cjs start
node test/scripts/sprint3/serve.cjs
```

API terminalinde Ctrl+C ile API durdurulduktan sonra yalnizca QA cluster durdurulabilir:

```powershell
node test/scripts/sprint3/isolated-postgres.cjs stop
```

Bu komutlar Windows 5432 servisini yonetmez. Baslatma/cikis loglari Git disindaki `postgres-control.log` dosyasindadir; alt surecler icin zaman asimi uygulanir. Yeni test turu sentetik yeni veriler ekler; eski test verisi otomatik silinmez.
