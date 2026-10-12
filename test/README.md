# SprintEra — Hafta 2 QA teslimi

Bu paket, **2. Hafta – Yapılacaklar (4).pdf** içindeki QA görevlerine göre hazırlanmıştır. Zorunlu teslim Postman koleksiyonu ve gerçek PT-01–PT-08 sonuçlarıdır. Önceden yazılan Jest testleri ek çalışma olarak korunmuş ve düzeltilmiştir.

Backend kaynak sürümü: [24fa8a6](https://github.com/SprintEra-Samu/backend/commit/24fa8a6a2a3afbeae021051534b384ba49a82f57). Testlerin ilk yerel kaynağı `bac382e`'dir; güncel test dosyaları bu docs tesliminde bulunur. Kurulum backend'in yayınlanmış sürümünden ayrı bir test kopyası oluşturur.

## Dosyalar

| Dosya / klasör | İçerik |
| --- | --- |
| `postman/` | İçe aktarılabilir Postman Collection v2.1 ve `baseUrl` ortam dosyası |
| `TEST-PLAN.md` | PDF görev eşlemesi, PT senaryoları ve teslim kontrolü |
| `REPORT.md` | Gerçek test turu, sonuçlar, coverage ve backend ekibine öneriler |
| `BUGS.md`, `jira-import.csv` | Dört Bug ve bir gereksinim netleştirme Task taslağı |
| `results/` | Güvenli JSON sonuçları, coverage özeti ve Swagger ekran görüntüsü |
| `*.test.js`, `helpers.js`, `field-errors.js`, `setup/` | Jest testleri ve ortak yardımcılar |
| `config/package.json`, `config/package-lock.json` | Test komutları, Jest/Newman bağımlılıkları ve kilit dosyası |
| `scripts/` | QA sunucusu, test raporu araçları ve koleksiyon üreticisi |
| `.env.test.example` | Yerel test veritabanı ortam şablonu |

## Gereksinimler ve test ortamı

Doğrulama Node.js `24.14.0`, npm `11.9.0`, PostgreSQL `18.6` ve Newman `6.2.1` ile yapıldı. Tekrar çalıştırma için Node.js 24, npm, Git, PowerShell ve erişilebilir PostgreSQL gerekir. GitHub/npm indirmeleri için ağ erişimi gerekir.

**Jest testleri bağlandıkları veritabanındaki tabloları `sync({ force: true })` ile silip yeniden oluşturur.** Veritabanı yöneticisinden yalnızca QA'ya ayrılmış bir test veritabanı ve o veritabanına ait kullanıcı isteyin. Örnek ilk kurulum SQL'i (yetkili PostgreSQL hesabıyla, bir kez):

```sql
CREATE ROLE sprintera_qa LOGIN PASSWORD 'replace-with-your-test-database-password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE "SprintEra_test" OWNER sprintera_qa;
```

Docs reposunun kökünde:

```powershell
Copy-Item -LiteralPath ./test/.env.test.example -Destination ./test/.env.test
```

`test/.env.test` dosyasındaki bağlantıyı kendi QA veritabanınıza göre düzenleyin. Önceden hazırladığınız bir dosya varsa üzerine kopyalamayın. PostgreSQL port eşlemeniz `5433:5432` ise `DB_PORT=5433` kullanın. Yerel `.env.test`, bağımlılıklar ve çalışma kopyası Git tarafından yok sayılır.

`setup/env.js` bu dosyayı backend modüllerinden önce, mevcut shell değişkenlerini geçersiz kılarak yükler. Dosya bulunmazsa veya veritabanı adında ayrı bir `test` bölümü yoksa çalışmayı durdurur. İsim kontrolü bağlantının doğru sunucuya gittiğini tek başına garanti etmez; ayrı kullanıcı/veritabanı kullanın.

## İlk kurulum: ayrı backend test kopyası

Docs reposunun kökünde aşağıdaki PowerShell komutlarını bir kez çalıştırın. Mevcut backend geliştirme klasörünüzü kullanmanız gerekmez.

```powershell
$docsRoot = (Get-Location).Path
$testRoot = Join-Path $docsRoot 'test'
$backendTestPath = Join-Path $testRoot '.runtime-backend'

if (Test-Path -LiteralPath $backendTestPath) {
    throw 'Test kopyası zaten var. Aşağıdaki sonraki çalıştırma adımlarını kullanın.'
}
if (-not (Test-Path -LiteralPath (Join-Path $testRoot '.env.test'))) {
    throw 'Önce test/.env.test dosyasını hazırlayın.'
}

git clone https://github.com/SprintEra-Samu/backend.git $backendTestPath
if ($LASTEXITCODE -ne 0) { throw 'Backend test kopyası indirilemedi.' }
git -C $backendTestPath checkout --detach 24fa8a6a2a3afbeae021051534b384ba49a82f57
if ($LASTEXITCODE -ne 0) { throw 'Kaynak commit bulunamadı.' }

$runtimeTests = Join-Path $backendTestPath 'tests'
foreach ($file in Get-ChildItem -LiteralPath $testRoot -Filter '*.js' -File) {
    Copy-Item -LiteralPath $file.FullName -Destination $runtimeTests -Force
}
foreach ($folder in @('setup', 'scripts', 'postman')) {
    Copy-Item -LiteralPath (Join-Path $testRoot $folder) -Destination $runtimeTests -Recurse -Force
}
Copy-Item -LiteralPath (Join-Path $testRoot 'config/package.json') -Destination (Join-Path $backendTestPath 'package.json') -Force
Copy-Item -LiteralPath (Join-Path $testRoot 'config/package-lock.json') -Destination (Join-Path $backendTestPath 'package-lock.json') -Force
Copy-Item -LiteralPath (Join-Path $testRoot '.env.test') -Destination (Join-Path $backendTestPath '.env.test') -Force

Set-Location -LiteralPath $backendTestPath
npm.cmd ci --ignore-scripts --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'Bağımlılıklar kurulamadı.' }
```

## Jest ve coverage: ek testler

Docs reposunun kökünden:

```powershell
Set-Location -LiteralPath ./test/.runtime-backend
npm.cmd run test:coverage
# Coverage olmadan JSON raporu:
# npm.cmd run test:report
# Yalnızca Jest konsol çıktısı:
# npm.cmd test
```

Jest bitmeden aynı veritabanıyla canlı Postman turuna başlamayın. Jest tek worker kullanır ve veritabanını yeniden oluşturur. Raporlar test kopyasının `tests/results/` klasörüne yazılır. Ham Jest çıktısı güvenli rapora dönüştürülüp silinir.

Bu backend sürümünde bilinen hatalar nedeniyle test komutlarının çıkış kodu `1` olabilir. Test beklentileri hataları gizlemek için gevşetilmez; ayrıntılar `BUGS.md` içindedir. E-posta harf duyarlılığı PDF'de tanımlı olmadığı için ilgili keşif kontrolü 201 veya 409 yanıtının biçimini doğrular; ekip gereksinimi netleştirmelidir.

## Postman / Newman: zorunlu QA turu

Jest tamamlandıktan sonra ilk terminalde, docs reposunun kökünden QA API'yi başlatın:

```powershell
Set-Location -LiteralPath ./test/.runtime-backend
npm.cmd run start:qa
```

Bu yardımcı yalnızca `.env.test` bağlantısını yükler, eksik test tablolarını oluşturur ve API'yi `127.0.0.1:3001` üzerinde açar. Backend kaynak dosyalarını değiştirmez. Terminal açık kalır; tur bitince `Ctrl+C` ile durdurun.

İkinci terminalde, docs reposunun kökünden:

```powershell
Set-Location -LiteralPath ./test/.runtime-backend
npm.cmd run test:postman
```

Komut 14 Postman isteğini sırayla çalıştırır ve güvenli `tests/results/postman-results.json` raporunu yazar. PT-04 yeni bir kullanıcı, PT-07 token oluşturur; tüm koleksiyon sırası korunmalıdır. Her tam tur benzersiz e-posta kullanır. PT-09 ve PT-10 ekstra token senaryolarıdır.

PORT değerini değiştirdiyseniz ikinci terminalde Newman adresini de değiştirin:

```powershell
$env:QA_BASE_URL = 'http://127.0.0.1:3002'
npm.cmd run test:postman
```

Postman arayüzünde çalıştırmak için:

1. Bir çalışma alanı açın ve **Import** ile `postman/SprintEra-week2.postman_collection.json` dosyasını aktarın.
2. `postman/SprintEra-local.postman_environment.json` dosyasını aktarın ve bu ortamı seçin.
3. Ortamdaki `baseUrl` değerini QA API adresine ayarlayın.
4. **Collection Runner** ile tüm koleksiyonu sırayla çalıştırın. PT-06 hata mesajı kontrolleri mevcut sürümde kalır.
5. Ekip değerlendirmesinde aynı turu canlı gösterin; backend düzeltmesinden sonra tekrar çalıştırın.

Swagger `http://127.0.0.1:3001/api/docs/` adresinde açılır. Mevcut backend'in Swagger `servers` tanımı `localhost:3000` değerini sabit kullanır; QA API 3001'deyken bu ekrandan Try it out işlemlerinin 3000'e gideceğini dikkate alın. QA koleksiyonu doğru `baseUrl` üzerinden çalışır. Backend 2'ye sunucu adresini ortama göre ayarlama önerisi raporda verilmiştir.

## Sonuçları teslim etme ve yeniden test

Güncel çalıştırmalarda üretilen `tests/results/` dosyalarını docs reposundaki `test/results/` klasörüne alın ve rapordaki tarih/commit/sonuçları güncelleyin. JSON araçları token ve şifreleri yayınlanabilir sonuçlardan çıkarır; gerçek `.env.test` veya ham Postman environment/collection export'larını paylaşmayın.

Bu teslimin gerçek sonuçları: Postman **31/34 kontrol geçti**, Jest **47/53 test geçti**. PT-06'daki üç hata aynı backend sorununun alt senaryolarıdır. Diğer üç Jest başarısızlığı kayıt/giriş veri türü kontrolüyle ilgilidir. Detaylar ve coverage ölçümü [raporda](REPORT.md).

Jira taslakları [BUGS.md](BUGS.md) ve `jira-import.csv` içinde hazırdır. Jira bağlantısı/proje hesabı olmadan gerçek ticket veya atama yapılmış sayılmaz. Backend düzeltmesini yeni test kopyasında doğrulayın, tam turu tekrarlayın ve Jira kaydını ancak doğrulamadan sonra kapatın.
