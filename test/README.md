# SprintEra test teslimi

Bu klasör, test uzmanının son çalışmasını ve ekibin aynı testleri yeniden çalıştırması için gereken dosyaları içerir. Backend uygulama kodu burada tutulmaz ve backend reposuna değişiklik gönderilmez.

Backend uygulama kaynağı: [SprintEra backend](https://github.com/SprintEra-Samu/backend), GitHub'da bulunan commit `24fa8a6a2a3afbeae021051534b384ba49a82f57`. Test dosyaları ve paket ayarları, test uzmanının yerel `bac382e62e82c46db6253a4a089498af8f42b418` commit'inden değiştirilmeden alınmıştır. Yerel test commit'inin backend reposuna gönderilmesi gerekmez; aşağıdaki kurulum test dosyalarını bu teslimden alır.

## İçerik

| Dosya | Amaç |
| --- | --- |
| `api.test.js` | Mevcut temel health, kayıt ve giriş testleri |
| `auth.test.js` | Kayıt, giriş, JWT ve kullanıcı bilgisi testleri |
| `health.test.js` | Veritabanı bağlantısı ve 404 yanıtları |
| `models.test.js` | Kullanıcı, rol, izin ve model ilişkileri |
| `helpers.js` | Ortak veritabanı ve kullanıcı yardımcıları |
| `setup/env.js` | Test ortamının yüklenmesi ve veritabanı adı kontrolü |
| `config/package.json` | Kaynak backend'in bağımlılık, test komutu ve Jest ayarları |
| `config/package-lock.json` | Aynı bağımlılık sürümlerini kurmak için kaynak kilit dosyası |
| `.env.test.example` | Gerçek erişim bilgileri içermeyen test ortamı şablonu |
| `REPORT.md` | Yapılan iş, doğrulama durumu ve backend ekibine öneriler |

## Gereksinimler

- Node.js 24 ve npm.
- Git ve PowerShell.
- Erişilebilir bir PostgreSQL sunucusu ve yalnızca bu testler için ayrılmış boş bir veritabanı.
- GitHub'dan backend kaynağını ve npm'den bağımlılıkları indirebilmek için ağ erişimi.

## Test veritabanını hazırlama

PostgreSQL'de uygun yetkiye sahip bir kullanıcıyla aşağıdaki komutu çalıştırın. Veritabanı zaten varsa yeniden oluşturmanız gerekmez.

```sql
CREATE DATABASE "SprintEra_test";
```

Test bağlantısındaki PostgreSQL kullanıcısının bu veritabanında tablo oluşturma ve silme yetkisi bulunmalıdır. Veritabanı içeriğinin GitHub'a yüklenmesi gerekmez; testler tabloları ve gerekli test kayıtlarını oluşturur.

**Testler `sequelize.sync({ force: true })` ile bağlandıkları veritabanındaki tabloları silip yeniden oluşturur.** Yalnızca testlere ayrılmış bir veritabanı kullanın. `setup/env.js` veritabanı adında `test` arar; bu kontrol tek başına bağlantının doğru sunucuya gittiğini garanti etmez.

Docs reposunun kökünde, yerel ortam dosyanızı oluşturun:

```powershell
Copy-Item -LiteralPath ./test/.env.test.example -Destination ./test/.env.test
```

`test/.env.test` içindeki `DB_USER`, `DB_PASSWORD`, `DB_HOST` ve `DB_PORT` değerlerini kendi test PostgreSQL bağlantınıza göre düzenleyin. Bu yerel dosya Git tarafından yok sayılır. Docker port eşlemeniz `5433:5432` ise `DB_PORT=5433` kullanın.

Dotenv mevcut ortam değişkenlerini değiştirmez. Testleri çalıştırdığınız PowerShell oturumunda önceden tanımlanmış `DB_*` veya `JWT_SECRET` değerleri bulunmamalıdır; böylece bağlantı ayarları yalnızca hazırladığınız `.env.test` dosyasından alınır.

## Aynı testleri yeniden çalıştırma

Docs reposunun kökünde aşağıdaki PowerShell komutlarını çalıştırın. `.runtime-backend` ayrı bir yerel test kopyasıdır ve Git tarafından yok sayılır. Klonlama bölümü ilk kurulumda bir kez çalıştırılır; bu klasörün önceden bulunmaması gerekir.

```powershell
$docsRoot = (Get-Location).Path
$testRoot = Join-Path $docsRoot 'test'
$backendTestPath = Join-Path $testRoot '.runtime-backend'

if (Test-Path -LiteralPath $backendTestPath) {
    throw 'Test kopyası zaten var. Mevcut kurulumu kullanın veya yeni bir docs klonunda kurulum yapın.'
}
if (-not (Test-Path -LiteralPath (Join-Path $testRoot '.env.test'))) {
    throw 'Önce test/.env.test dosyasını hazırlayın.'
}

git clone https://github.com/SprintEra-Samu/backend.git $backendTestPath
if ($LASTEXITCODE -ne 0) { throw 'Backend test kopyası indirilemedi.' }
git -C $backendTestPath checkout --detach 24fa8a6a2a3afbeae021051534b384ba49a82f57
if ($LASTEXITCODE -ne 0) { throw 'Kaynak commit bulunamadı.' }

New-Item -ItemType Directory -Path (Join-Path $backendTestPath 'tests/setup') -Force | Out-Null
$testFiles = @('api.test.js', 'auth.test.js', 'health.test.js', 'models.test.js', 'helpers.js')
foreach ($file in $testFiles) {
    Copy-Item -LiteralPath (Join-Path $testRoot $file) -Destination (Join-Path $backendTestPath "tests/$file") -Force
}
Copy-Item -LiteralPath (Join-Path $testRoot 'setup/env.js') -Destination (Join-Path $backendTestPath 'tests/setup/env.js') -Force
Copy-Item -LiteralPath (Join-Path $testRoot 'config/package.json') -Destination (Join-Path $backendTestPath 'package.json') -Force
Copy-Item -LiteralPath (Join-Path $testRoot 'config/package-lock.json') -Destination (Join-Path $backendTestPath 'package-lock.json') -Force
Copy-Item -LiteralPath (Join-Path $testRoot '.env.test') -Destination (Join-Path $backendTestPath '.env.test') -Force

Set-Location -LiteralPath $backendTestPath
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Bağımlılıklar kurulamadı.' }
npm.cmd test
```

Sonraki çalıştırmalarda docs reposunun kökünden:

```powershell
Set-Location -LiteralPath ./test/.runtime-backend
npm.cmd test
# Kod kapsamı raporu için:
npm.cmd run test:coverage
```

Yerel `.env.test` ayarlarını sonradan değiştirirseniz çalışma kopyasına yeniden kopyalayın. Jest, `setupFiles: ["./tests/setup/env.js"]` ve `maxWorkers: 1` ayarlarıyla çalışır; tabloları yeniden oluşturan test dosyaları aynı anda çalıştırılmaz.

## Sonuçları yorumlama

Bu teslimde JavaScript sözdizimi, kaynak dosyalarla birebir eşleşme, README PowerShell komutlarının sözdizimi, kilit dosyasından bağımlılık kurulumu (`npm ci --ignore-scripts --no-audit --no-fund`) ve Jest'in dört test dosyasını bulması (`--listTests`) kontrol edildi. PostgreSQL üzerinde Jest testleri çalıştırılmadı; geçen/kalan test veya ölçülmüş coverage sonucu sunulmuyor.

`auth.test.js` içindeki olası hata senaryoları mevcut backend davranışında başarısız olabilir. Beklenen davranışlar ve backend ekibine öneriler [raporda](REPORT.md) açıklanmıştır. Yeniden çalıştırma sonucunda başarısız senaryoları, beklenen ve alınan yanıtlarla birlikte raporlayın.
