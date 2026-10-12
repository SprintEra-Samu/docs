# Backend ekibine hata kayıtları ve Jira taslakları

Kaynak sürüm: `24fa8a6a2a3afbeae021051534b384ba49a82f57`. Çalıştırma tarihi: 13 Ekim 2026 (Europe/Istanbul). Aşağıdaki Bug kayıtları gerçek PostgreSQL test sonuçlarına dayanır. Durumları **Jira'ya aktarılmayı bekliyor**; henüz ticket anahtarı, gerçek Jira ataması veya kapatılmış hata yoktur.

PDF'deki sorumlu rol Backend 1'dir. Önem dereceleri QA önerisidir; ekip triage sırasında kesinleştirmelidir. CSV'de gerçek hesap bilinmediğinden Assignee alanı yoktur.

## QA-W2-001 — Eksik kayıt alanları ayrı hata olarak belirtilmiyor

- Tür: Bug. Önerilen önem: Orta. Sorumlu: Backend 1; ortak hata biçimi için Backend 2 ile uyum.
- Gereksinim: PDF s. 8, PT-06: eksik alan veya geçersiz e-postada 400 ve alan bazlı hata mesajı.
- Adımlar: Koleksiyondaki PT-06A, PT-06B ve PT-06C'yi çalıştırın. Her istekte yalnızca bir zorunlu alan eksiktir.
- Beklenen: 400; yalnızca eksik alanı belirten bir mesaj veya alan bazlı `details`/`errors` bilgisi. Belirli bir JSON şeması dayatılmaz.
- Gerçekleşen: Üç istekte de 400 dönüyor, fakat aynı genel yanıt veriliyor:

```json
{"success":false,"error":"Name, email and password are required","details":null}
```

- Kanıt: `results/postman-results.json` içindeki PT-06A/B/C; `results/jest-results.json` içindeki üç eksik alan testi.
- Öneri: Mevcut alanları da eksikmiş gibi sıralamak yerine eksik alanları ayrı belirtin. Aynı alan bazlı hata sözleşmesini Swagger'a ekleyin.
- Yeniden test: PT-06A/B/C ve üç ilgili Jest senaryosu; ardından tam Postman turu.

## QA-W2-002 — Kayıtta sayısal şifre 500 döndürüyor

- Tür: Bug. Önerilen önem: Orta. Sorumlu: Backend 1.
- Kapsam: PT-06'ya ek veri türü doğrulama senaryosu.
- Adımlar: Geçerli `name` ve benzersiz `email` ile `POST /api/auth/register` isteğinde `password: 12345678` gönderin.
- Beklenen: Hatalı istemci girdisi için 400.
- Gerçekleşen: 500.
- Kanıt: Jest `POST /api/auth/register ek keşif senaryoları string olmayan şifre 500 yerine 400 döner`.
- Öneri: Bcrypt'e aktarmadan önce şifrenin string olduğunu doğrulayın.
- Yeniden test: İlgili Jest senaryosu ve normal kayıt regresyonu.

## QA-W2-003 — Girişte sayısal şifre 500 döndürüyor

- Tür: Bug. Önerilen önem: Orta. Sorumlu: Backend 1.
- Adımlar: Önce geçerli bir test kullanıcısı oluşturun. Bu kullanıcının e-postasıyla `POST /api/auth/login` isteğinde `password: 12345678` gönderin.
- Beklenen: İstemci hatası; mevcut keşif testi 400 veya 401 kabul eder. API sözleşmesinde tür doğrulama hatası için 400 netleştirilmesi önerilir.
- Gerçekleşen: 500.
- Kanıt: Jest `POST /api/auth/login olası hata: sayısal şifre 500 yerine 400/401 döner`.
- Öneri: Bcrypt karşılaştırmasından önce veri türlerini doğrulayın.
- Yeniden test: İlgili Jest senaryosu, PT-07 ve PT-08.

## QA-W2-004 — Girişte nesne e-posta 500 döndürüyor

- Tür: Bug. Önerilen önem: Orta. Sorumlu: Backend 1.
- Adımlar: Geçerli bir test hesabı hazırlayın. `POST /api/auth/login` isteğinde `email: {"toString":"x"}` ve hesabın string şifresini gönderin.
- Beklenen: İstemci hatası; mevcut keşif testi 400 veya 401 kabul eder. Tür doğrulama hatası için 400 önerilir.
- Gerçekleşen: 500.
- Kanıt: Jest `POST /api/auth/login olası hata: nesne e-posta 500 yerine 400/401 döner`.
- Öneri: Sequelize sorgusundan önce e-posta türünü ve biçimini doğrulayın.
- Yeniden test: İlgili Jest senaryosu ve giriş regresyonu.

## QA-W2-005 — E-posta büyük/küçük harf kuralını netleştirme

- Tür: Task / gereksinim netleştirme; doğrulanmış Bug olarak işaretlenmez.
- Önerilen önem: Düşük. Sorumlu: Proje Yöneticisi ve Backend 1.
- Gözlem: Aynı e-postanın büyük harfle tekrar kaydı mevcut sürümde 201 döndü. Kanıt: `results/email-case-observation.json`.
- PDF benzersiz e-posta ister, ancak harf duyarlılığını belirtmez. Önceki testteki zorunlu 409 varsayımı kaldırıldı. Güncel keşif testi, mevcut API sözleşmesindeki 201 veya 409 yanıtının biçimini doğrular.
- Karar istenen: E-posta tekilliği harf duyarsız olacak mı? Öyleyse kayıt ve girişte aynı normalizasyon ve veritabanı tekillik kuralı uygulanmalı; QA testi karara göre kesinleştirilmeli.

## Jira'ya aktarım

`jira-import.csv` dosyası dört Bug ve bir Task taslağını içerir. Proje seçildikten sonra sütunlar Issue Type, Summary, Description, Priority ve Labels alanlarına eşlenir. Jira projesinde farklı issue type veya priority adları varsa içe aktarmadan önce eşlemeyi uyarlayın. Kayıtları gerçek Backend 1 hesabına atayın; oluşan Jira anahtarlarını bu belgeye ekleyin.

Backend düzeltmesi teslim edilmediği için yeniden test veya hata kapanışı yapılmış olarak raporlanmaz.
