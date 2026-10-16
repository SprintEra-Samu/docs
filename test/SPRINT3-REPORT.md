# Sprint 3 QA Test Raporu

Rapor zamanı: 2026-10-16T08:17:06.738Z. Backend commit: `dde1a34c90dc66af9dbc7e547218629fa425077d`. Kaynak: Sprint 3 PDF'si, sayfa 5–7 ve kullanıcının onayladığı test planı.

## Yönetici özeti

Zorunlu 17 senaryo: **16 PASS, 1 FAIL, 0 BLOCKED**. HTTP çalıştırması başlatıldı. Bu rapor yalnızca bu çalıştırmanın kanıtını temsil eder; Week 2 raporundaki geçmiş sonuçlar Sprint 3 sonucu sayılmaz.

Yayın/teslim kararı açık hatalar ve engellerle birlikte değerlendirilmelidir.

## Ortam ve izlenebilirlik

- Araç: Node.js v24.14.0; Newman 6.2.1.
- Hedef: yalnızca 127.0.0.1:3001 ve ayrılmış SprintEra_sprint3_test PostgreSQL veritabanı.
- Şema: Sequelize sync; force/alter kullanılmaz. Bu tur migration doğrulaması değildir.
- Başlangıç: 2026-10-16T08:17:03.115Z; bitiş: 2026-10-16T08:17:06.738Z.
- Çalıştırma kanıtı: [tarihli JSON](results/sprint3/2026-10-16T08-17-01-734Z.json); [son sonuç](results/sprint3/latest.json).

## Zorunlu senaryo sonuçları

| Senaryo | Sonuç | Alt istek sayısı | Hata sahibi |
| --- | --- | --- | --- |
| PT-01 | PASS | 1 | Week 2 mevcut kayıtları |
| PT-02 | PASS | 2 | Week 2 mevcut kayıtları |
| PT-03 | PASS | 1 | Week 2 mevcut kayıtları |
| PT-04 | PASS | 1 | Week 2 mevcut kayıtları |
| PT-05 | PASS | 1 | Week 2 mevcut kayıtları |
| PT-06 | FAIL | 4 | Week 2 mevcut kayıtları |
| PT-07 | PASS | 1 | Week 2 mevcut kayıtları |
| PT-08 | PASS | 1 | Week 2 mevcut kayıtları |
| PT-11 | PASS | 1 | Backend 1 |
| PT-12 | PASS | 1 | Backend 1 |
| PT-13 | PASS | 1 | Backend 1 |
| PT-14 | PASS | 1 | Backend 1 |
| PT-15 | PASS | 1 | Backend 1 |
| PT-16 | PASS | 1 | Backend 1 |
| PT-17 | PASS | 1 | Backend 1 |
| PT-18 | PASS | 3 | Backend 2 |
| PT-19 | PASS | 1 | Backend 1 |

## Bağımlılık kilidi parmak izleri

Parmak izleri ilgili dosyanın ham baytlarından SHA-256 ile hesaplanır. Kurulum yapılmadığında bu değerler kurulmuş paket kanıtı sayılmaz.

| Dosya | Rol | SHA-256 | Bayt |
| --- | --- | --- | --- |
| test/config/package-lock.json | QA ve Backend çalışma bağımlılıkları | 814114df5be92e143fb805b8dfbad6ecc62ec5df993263f81e6d7c0bd0ee259e | 289768 |
| backend/package-lock.json | Kaynak snapshot referansı; kurulum QA lock üzerinden | e3954fa02ab3a2763066030a5fa1c384474ccc9c0d6e56daa6bad4f0b7395fdc | 259022 |

## Gerçek HTTP sonuçları

HTTP kodu boşsa yanıt alınmamış veya istek çalıştırılmamıştır. SETUP ve EK kontroller zorunlu 17 senaryo toplamına dahil değildir.

| İstek | Beklenen HTTP | Gerçek HTTP | Sonuç | Açıklama |
| --- | --- | --- | --- | --- |
| PT-01 Health | 200 | 200 | PASS | Tüm assertion’lar geçti |
| PT-02A Swagger sayfası | 200 | 200 | PASS | Tüm assertion’lar geçti |
| PT-02B Swagger tüm uç noktalar | 200 | 200 | PASS | Tüm assertion’lar geçti |
| PT-03 Hatalı adres | 404 | 404 | PASS | Tüm assertion’lar geçti |
| PT-04 Geçerli kayıt | 201 | 201 | PASS | Tüm assertion’lar geçti |
| PT-05 Tekrar kayıt | 409 | 409 | PASS | Tüm assertion’lar geçti |
| PT-06A Eksik name | 400 | 400 | FAIL | PT-06 alan bazlı hata: name: expected false to deeply equal true |
| PT-06B Eksik email | 400 | 400 | FAIL | PT-06 alan bazlı hata: email: expected false to deeply equal true |
| PT-06C Eksik password | 400 | 400 | FAIL | PT-06 alan bazlı hata: password: expected false to deeply equal true |
| PT-06D Geçersiz e-posta | 400 | 400 | PASS | Tüm assertion’lar geçti |
| PT-07 Doğru giriş | 200 | 200 | PASS | Tüm assertion’lar geçti |
| PT-08 Yanlış şifre | 401 | 401 | PASS | Tüm assertion’lar geçti |
| SETUP Yönetici girişi | 200 | 200 | PASS | Tüm assertion’lar geçti |
| PT-11 Tokensız kullanıcı bilgisi | 401 | 401 | PASS | Tüm assertion’lar geçti |
| PT-12 Geçerli token ile kullanıcı bilgisi | 200 | 200 | PASS | Tüm assertion’lar geçti |
| PT-13 Yönetici ile proje oluşturma | 201 | 201 | PASS | Tüm assertion’lar geçti |
| PT-14 Tokensız proje oluşturma | 401 | 401 | PASS | Tüm assertion’lar geçti |
| PT-15 Eksik proje adı | 400 | 400 | PASS | Tüm assertion’lar geçti |
| PT-16 Projeleri listeleme | 200 | 200 | PASS | Tüm assertion’lar geçti |
| PT-17 Projeye görev ekleme | 201 | 201 | PASS | Tüm assertion’lar geçti |
| PT-18A Görev durumunu In Progress yapma | 200 | 200 | PASS | Tüm assertion’lar geçti |
| PT-18B Görev durumunu Done yapma | 200 | 200 | PASS | Tüm assertion’lar geçti |
| PT-18C Durum kalıcılığını doğrulama | 200 | 200 | PASS | Tüm assertion’lar geçti |
| PT-19 Olmayan projeye görev ekleme | 404 | 404 | PASS | Tüm assertion’lar geçti |
| EK Üye ile proje oluşturma — PDF yetki beklentisi | 201 | 403 | FAIL | HTTP 201: expected response to have status code 201 but got 403; Üye projesi oluşur: expected undefined to be a number |
| EK Proje detayı | 200 | 200 | PASS | Tüm assertion’lar geçti |
| EK Görev atamasını güncelleme | 200 | 200 | PASS | Tüm assertion’lar geçti |
| EK Görevleri proje ve kişiye göre filtreleme | 200 | 200 | PASS | Tüm assertion’lar geçti |
| EK Swagger Sprint 3 uç noktaları | 200 | 200 | PASS | Tüm assertion’lar geçti |

## Bulgular, retest ve sınırlar

- [Hata raporu](SPRINT3-BUGS.md) yalnızca gerçek FAIL sonuçlarını doğrulanmış hata olarak listeler.
- [Retest kaydı](SPRINT3-RETEST.md) ayrı tutulur; düzeltme gelmeden kapalı hata veya başarılı retest iddiası yoktur.
- PDF ile Swagger proje oluşturma yetkisinde farklıdır: ana proje testleri yöneticiyle, ek kontrol üyeyle ve PDF’nin 201 beklentisiyle çalışır.
- Kaynak kod incelemesi canlı Swagger veya HTTP çalıştırması yerine geçmez.
- Migration, bonus Jest/coverage, frontend ve CI doğrulaması bu API test turunun kapsamında değildir.
- Commit/push/PR yayını ayrıca kullanıcı onayı gerektirir; rapor yayımlanmış PR veya tamamlanmış ekip ataması iddiası taşımaz.

## Doğrulanmış ortam ve çalıştırma özeti

- PostgreSQL 18.6; 127.0.0.1/32:55432; DB SprintEra_sprint3_test.
- QA hesabı superuser, CREATEDB, CREATEROLE veya replication yetkisine sahip değil.
- Mevcut 5432 Windows servisi değiştirilmedi; QA ayrı veri klasöründe 55432 portunda çalıştı.
- Ortam kanıtı: [environment.json](results/sprint3/environment.json).
- Sprint 3 PT-11-PT-19: 9/9 PASS; regresyon PT-01-PT-08: 7/8 PASS.
- Tüm koleksiyon: 29 istek; 25 PASS, 4 FAIL, 0 BLOCKED; 60/65 assertion geçti.
- PT-06 alan bazli hata sorunu onceki QA-W2-001 kaydinin yeni commit uzerinde devam ettigini gosteriyor. EK uye proje olusturma kontrolu PDF/Swagger yetki farkini dogruladi.
