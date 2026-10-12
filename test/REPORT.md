# SprintEra test çalışması raporu

## Kapsam ve yapılan iş

Bu rapor, test uzmanının son test çalışmasını kapsar. Backend uygulama kaynağı [SprintEra backend](https://github.com/SprintEra-Samu/backend), GitHub'da bulunan commit `24fa8a6a2a3afbeae021051534b384ba49a82f57`'dir. Test çalışmasının yerel kaynak commit'i `bac382e62e82c46db6253a4a089498af8f42b418`'dir; bu commit henüz backend'in GitHub ana dalında bulunmamaktadır. İki commit arasındaki fark test dosyaları ve test yapılandırmasıdır; backend uygulama koduna yönelik bir düzeltme bu teslimin parçası değildir.

Git geçmişindeki `bac382e` değişikliğiyle `auth.test.js`, `health.test.js`, `models.test.js`, `helpers.js` ve `setup/env.js` eklenmiştir. `api.test.js` önceki kaynak sürümünde zaten bulunuyordu ve mevcut temel testleri korumak için teslim paketine dahil edilmiştir.

Test klasörü dışındaki ilgili çalışma, `package.json` dosyasına `cross-env` bağımlılığı ile Jest `setupFiles` ve `maxWorkers: 1` ayarlarının eklenmesini; `package-lock.json` güncellemesini ve `.env.test` yapılandırmasını içerir. `npm test` ve `npm run test:coverage` komutları önceki sürümde zaten tanımlıydı. Docs teslimine paket ayarlarının kopyaları ve gerçek bağlantı bilgileri yerine `.env.test.example` eklenmiştir.

Test uzmanı ayrı bir test veritabanı oluşturduğunu bildirmiştir. Bu incelemede veritabanının varlığı veya bağlantısı doğrulanmamıştır. Kurulum adımları README'de verilmiştir; veritabanı dökümü teslim edilmemiştir.

## Hazırlanan testler

| Alan | Kontrol edilen davranışlar |
| --- | --- |
| Kayıt | Başarılı kayıt, varsayılan rol, şifre hash'i, yanıtta şifre bulunmaması, eksik alanlar, hatalı ve tekrar eden e-posta |
| Giriş | Başarılı giriş, JWT içeriği ve süresi, yanlış şifre, bulunmayan kullanıcı, eksik alanlar ve hatalı veri türleri |
| Kullanıcı bilgisi | Eksik, hatalı ve süresi dolmuş token; geçerli token ile kullanıcı bilgisi; silinmiş kullanıcı |
| Health ve yönlendirme | Veritabanı bağlantısı, bağlantı hatasının mock ile simülasyonu, bilinmeyen rota ve yanlış HTTP metodu |
| Modeller | Zorunlu alanlar, benzersiz e-posta ve izin kodu, yabancı anahtar, kullanıcı-rol ve rol-izin ilişkileri |

Bu paket yukarıdaki alanların otomatik testlerini içerir. Performans, yük, uçtan uca arayüz testi veya tüm uygulama için eksiksiz güvenlik değerlendirmesi yapılmış olduğu anlamına gelmez.

## Doğrulama durumu

- Altı JavaScript dosyası kaynak `tests/` dosyalarıyla birebir eşleşmektedir.
- JavaScript sözdizimi `node --check` ile kontrol edilmiştir.
- Node.js `24.14.0` ve npm `11.9.0` ile kilit dosyasından bağımlılıklar kurulmuştur (`npm ci --ignore-scripts --no-audit --no-fund`, 440 paket). Bu kontrol paket kurulum script'lerini çalıştırmamıştır.
- Jest `--listTests` ile dört test dosyasını bulmuştur; bu komut test senaryolarını çalıştırmaz.
- README'deki PowerShell komut bloklarının sözdizimi kontrol edilmiştir.
- Backend uygulama kodu ile test beklentileri okunarak karşılaştırılmıştır.
- Jest senaryoları PostgreSQL üzerinde çalıştırılmamıştır. Geçen/kalan test sayısı ve coverage ölçümü bulunmamaktadır.

Aşağıdaki bulgular çalışma sırasında gözlenen test sonuçları değil, kaynak kod incelemesinden çıkan beklentilerdir. Backend ekibiyle gereksinimler netleştirilip testler çalıştırılarak doğrulanmalıdır.

## Backend ekibine bulgular ve öneriler

| Senaryo | Testin beklediği | Mevcut koddan beklenen davranış | Öneri |
| --- | --- | --- | --- |
| Aynı e-postanın büyük harfle tekrar kaydedilmesi | `409` | E-posta normalize edilmediği ve normal string alanı kullanıldığı için ikinci kayıt kabul edilebilir | E-posta tekilliğinin büyük/küçük harften bağımsız olup olmadığını netleştirin. Gereksinim buysa kayıt ve girişte aynı normalizasyonu uygulayın ve tekilliği veritabanında da koruyun. |
| Kayıtta sayısal şifre | `400` | Tür kontrolü olmadan bcrypt'e aktarılır; hata genel handler üzerinden `500` dönebilir | Hash işlemi öncesinde şifrenin string olduğunu doğrulayın ve istemci hatasına `400` verin. |
| Girişte sayısal şifre | `400` veya `401` | bcrypt karşılaştırması hata vererek `500` dönebilir | Şifre türünü doğrulayın; API sözleşmesinde hatalı veri türleri için kullanılacak durum kodunu netleştirin. |
| Girişte nesne biçiminde e-posta | `400` veya `401` | Tür kontrolü olmadan Sequelize sorgusuna aktarılır; sorgu hatası `500` dönebilir | Sorgudan önce e-postanın string ve uygun biçimde olduğunu doğrulayın. |

Bu bulgular `tests/auth.test.js` içindeki "olası hatalar" senaryolarıyla ilişkilidir. İlgili uygulama mantığı backend'in `controllers/authController.js` dosyasındadır. Gereksinimle uyuşan bir testin başarısız olması, testin yanlış yazıldığı anlamına gelmez; backend düzeltmesi gerektiren bir durum olabilir.

## Testlerin sürdürülebilirliği için öneriler

- `api.test.js` içindeki giriş testi önceki kayıt testine bağlıdır. Her senaryonun kendi gerekli verisini hazırlaması, tek başına çalıştırıldığında da aynı sonucu vermesini sağlar.
- `health.test.js` içindeki spy için test sonrasında `jest.restoreAllMocks()` eklenmesi mock temizliğini açık hale getirir.
- `.env.test` yüklemesi mevcut ortam değişkenlerini değiştirmez. Test bağlantısının başka bir shell ortamından etkilenmesini engellemek için test ayarlarının önceliğini belirleyin.
- Veritabanı adında `test` bulunması ek bir kontroldür. Tabloları silen testlerin yalnızca ayrı test veritabanına erişebilen bir kullanıcıyla veya ayrı bir PostgreSQL konteynerinde çalıştırılması önerilir.
- Backend entegrasyonunda test dosyalarıyla birlikte bağımlılık ve Jest ayarlarını koruyun. Gerçek şifreler yerine ortam şablonu kullanın.
- PostgreSQL ile testleri çalıştırdıktan sonra başarısız senaryoları, beklenen/alınan yanıtları ve coverage sonucunu ekip raporuna ekleyin; ardından bu çalıştırmayı CI sürecine taşıyın.

## Teslim

Docs reposunun `test/` klasöründe test kaynakları, gerekli paket ayarları, örnek ortam dosyası, yeniden çalıştırma talimatı ve bu rapor bulunur. README'deki adımlar sabit bir backend commit'inden ayrı bir yerel test kopyası oluşturur; ekip üyelerinin mevcut backend çalışma klasörünü değiştirmeleri gerekmez.
