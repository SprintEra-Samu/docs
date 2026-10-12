# SprintEra — Hafta 2 QA test raporu

Rapor tarihi: **13 Ekim 2026**, Europe/Istanbul. Görev kaynağı: kullanıcının verdiği **2. Hafta – Yapılacaklar (4).pdf**, özellikle QA bölümü s. 7–9. Bu rapor son test çalışmasını, tamamlanan QA eksiklerini ve backend ekibine bulguları kapsar.

## Sonuç

Zorunlu Postman teslimi ve gerçek test sonuçları hazırlandı. **PT-06 alan bazlı hata gereksinimi karşılanmıyor.** Diğer zorunlu PT senaryoları ve ekstra iki token senaryosu geçti. Sonuçlar backend'in yayınlanmış `24fa8a6a2a3afbeae021051534b384ba49a82f57` sürümünde, ayrı PostgreSQL QA veritabanıyla ölçüldü.

| Çalıştırma | Toplam | Geçen | Kalan |
| --- | ---: | ---: | ---: |
| Postman/Newman istek alt senaryoları | 14 | 11 | 3 |
| Postman/Newman assertion | 34 | 31 | 3 |
| Jest test senaryoları | 53 | 47 | 6 |
| Jest test dosyaları | 4 | 3 | 1 |

Postman'da üç kalan kontrol PT-06A/B/C alan bazlı mesaj kontrolleridir; tüm isteklerin HTTP durum kodu beklentisi karşılandı. Jest'te aynı üç durum ile sayısal kayıt şifresi, sayısal giriş şifresi ve nesne e-posta senaryoları kaldı. Kalan testler backend hatalarını gösterir; QA teslimi uygulama hatalarını düzeltmez.

## Mevcut çalışma ve tamamlanan eksikler

Yerel `bac382e` çalışmasında auth, health ve model testleri; ortak yardımcılar; `.env.test` yüklemesi ve Jest ayarları eklenmişti. Temel `api.test.js` ve npm test komutları daha eski sürümde zaten vardı. PDF'nin asıl QA teslimi olan Postman koleksiyonu ve gerçek test sonuçları eksikti.

Bu teslimde:

- PDF'deki PT-01–PT-08 ve ekstra PT-09–PT-10 için Postman Collection v2.1, `baseUrl` ortamı ve assertion script'leri eklendi.
- Zorunlu senaryolar ile ek keşif/Jest çalışması ayrımı `TEST-PLAN.md` ile açıklandı.
- Kayıt/giriş testinin önceki testte oluşturulan kullanıcıya bağımlılığı kaldırıldı. Temel giriş testi tek başına da çalıştırılıp geçti (1 geçti, diğer 2 senaryo bu bağımsızlık kontrolünde seçilmedi).
- Swagger HTML, yükleme scripti ve dört uç nokta için eksik kontroller eklendi. Edge headless ekran görüntüsü incelenerek sayfanın render edildiği ve dört uç noktanın listelendiği doğrulandı.
- PDF PT-06'daki alan bazlı hata beklentisi hem Postman hem Jest testlerine eklendi; tek bir JSON hata şeması zorunlu tutulmadı.
- PDF'de belirtilmeyen e-posta harf duyarlılığı için zorunlu 409 varsayımı kaldırıldı. Keşif kontrolü geçerli 201/409 yanıt biçimlerini doğrular; gözlem ve gereksinim netleştirme kaydı korunur.
- Health testlerindeki mock temizliği eklendi. Test ortamı açık `.env.test` dosyasından öncelikli yüklenir; dosya bulunmazsa veya veritabanı adı test kuralına uymuyorsa çalışma durur.
- Test paketine Newman, tekrar çalıştırma komutları ve güvenli JSON rapor araçları eklendi. Dört Bug ve bir Task için Jira'ya aktarılabilir taslak hazırlandı.

## Çalıştırma ortamı ve kanıt

- Backend commit: `24fa8a6a2a3afbeae021051534b384ba49a82f57`.
- Node.js: `24.14.0`; npm: `11.9.0`; PostgreSQL: `18.6`; Newman: `6.2.1`.
- Ayrı, yeni QA veritabanı ve yalnızca bu veritabanının sahibi olan, superuser/createdb/createrole yetkisi olmayan kullanıcı oluşturuldu. Önceden var olan veritabanlarında test turu yapılmadı.
- QA API: `http://127.0.0.1:3001`. Backend uygulama kaynakları değiştirilmedi; ayrı yerel test kopyası kullanıldı.
- Bağımlılıklar kilit dosyasından `npm ci --ignore-scripts --no-audit --no-fund` ile kuruldu.
- Postman turu: `2026-10-12T22:12:45.436Z`–`22:12:47.243Z` (İstanbul: 13 Ekim 01:12).
- Son Jest/coverage turu: `2026-10-12T22:15:05.689Z`–`22:15:11.321Z` (İstanbul: 13 Ekim 01:15).

Kanıtlar:

- [Postman sonuçları](results/postman-results.json): her istek, durum kodu, güvenli yanıt ve assertion sonucu.
- [Jest sonuçları](results/jest-results.json): 53 senaryonun sonucu ve başarısızlık ayrıntıları.
- [Coverage özeti](results/coverage-summary.json).
- [E-posta harf duyarlılığı gözlemi](results/email-case-observation.json).
- [Swagger ekran görüntüsü](results/swagger.png).

Raporlardaki JWT ve şifre alanları maskelenmiştir. Gerçek veritabanı bağlantı bilgileri yalnızca yerel, Git tarafından yok sayılan ortam dosyalarındadır. Postman hesabında bir çalışma alanı oluşturulduğu veya manuel GUI Collection Runner turu yapıldığı iddia edilmez; koleksiyon Newman ile çalıştırılmıştır.

## PT sonuçları

| Senaryo | Beklenen / gerçek sonuç | Durum |
| --- | --- | --- |
| PT-01 | Health 200, `status: ok`, `database: connected` | Geçti |
| PT-02 | Swagger HTML ve tanım scripti 200; dört API uç noktası listede; görsel ekran doğrulandı | Geçti |
| PT-03 | Bilinmeyen adres 404 ve ortak hata biçimi | Geçti |
| PT-04 | Geçerli kayıt 201, kullanıcı bilgisi, şifre/hash yok | Geçti |
| PT-05 | Tekrar kayıt 409 ve `Bu e-posta zaten kayıtlı` | Geçti |
| PT-06A/B/C | 400 doğru; eksik alana özel mesaj beklenirken üçünde aynı genel mesaj ve `details: null` | Kaldı — QA-W2-001 |
| PT-06D | Geçersiz e-posta 400 ve e-posta alanını belirten mesaj | Geçti |
| PT-07 | Doğru giriş 200, JWT ve doğru kullanıcı | Geçti |
| PT-08 | Yanlış şifre 401 ve `E-posta veya şifre hatalı` | Geçti |
| PT-09 (ekstra) | Tokensız kullanıcı bilgisi 401 | Geçti |
| PT-10 (ekstra) | Geçerli token ile 200 ve doğru kullanıcı bilgisi | Geçti |

PT-06 başarısız olduğundan zorunlu QA turu tamamen başarılı olarak işaretlenmez. Alt senaryoların tamamı `TEST-PLAN.md` içindedir.

## Backend ekibine bulgular ve öneriler

| Kayıt | Gerçek bulgu | Sorumlu / öneri |
| --- | --- | --- |
| QA-W2-001, Bug | Eksik name/email/password için aynı genel hata mesajı | Backend 1: eksik alanları ayrı belirtin; Backend 2 ile ortak hata sözleşmesini ve Swagger açıklamasını uyumlu hale getirin. |
| QA-W2-002, Bug | Kayıtta sayısal şifre 500 | Backend 1: bcrypt öncesinde string doğrulaması, istemci hatası için 400. |
| QA-W2-003, Bug | Girişte sayısal şifre 500 | Backend 1: veri türünü doğrulayın; 400/401 kararını API sözleşmesinde netleştirin. |
| QA-W2-004, Bug | Girişte nesne e-posta 500 | Backend 1: Sequelize sorgusu öncesinde e-posta türünü ve biçimini doğrulayın. |
| QA-W2-005, Task | Büyük harfle tekrar e-posta kaydı 201; PDF harf duyarlılığını belirtmiyor | Proje Yöneticisi + Backend 1: tekillik kuralını netleştirin; QA beklentisini karara göre kesinleştirin. |

Tekrar üretme adımları, beklenen/gerçekleşen sonuç ve önerilen önem dereceleri [BUGS.md](BUGS.md) içindedir. Jira CSV taslakları `jira-import.csv` içindedir.

Backend 2 için ek öneri: Swagger `servers` adresi `localhost:3000` olarak sabit. QA sunucusu 3001'de olduğunda Try it out yanlış porta yönlenir. Sunucu adresini çalışan ortama göre üretmek veya aynı origin'i kullanan göreli bir adres tanımlamak test ortamlarını kolaylaştırır. Mevcut PT-02 görsel/tanım kontrolleri geçti; Swagger içinden kayıt/giriş isteği çalıştırıldığı iddia edilmez.

## Coverage: ek ölçüm

| Ölçüm | Kapsanan / toplam | Oran |
| --- | ---: | ---: |
| Satır | 138 / 145 | %95,17 |
| Statement | 138 / 145 | %95,17 |
| Branch | 30 / 33 | %90,90 |
| Function | 7 / 10 | %70,00 |

Ölçüm backend `server.js`, config, controllers, middleware, models, routes ve Swagger tanım kodunu kapsar. Seed, frontend, test yardımcıları ve test araçları bu ölçüme dahil değildir. Yüksek coverage, başarısız senaryoların giderildiği veya tüm güvenlik/performans davranışlarının test edildiği anlamına gelmez.

## Tamamlanması gereken dış adımlar

1. Postman koleksiyonu ve ortamını kullanıcının çalışma alanına aktarın; değerlendirmede canlı tur gösterin ve retrospektif yapın.
2. Atlassian/Jira bağlantısı ve proje bilgisi sağlandığında dört Bug ve bir Task taslağını gerçek Jira kayıtlarına dönüştürün, gerçek Backend 1 hesabına atayın ve anahtarları rapora ekleyin. Bu incelemede Jira bağlantısı yoktu; kayıtlar açılmış gibi gösterilmedi.
3. Backend ekibi düzeltmeleri teslim edince ilgili senaryoları ve tam koleksiyonu yeni commit üzerinde yeniden çalıştırın; yalnızca doğrulanmış kayıtları kapatın.

PDF'deki geçmiş Cuma kontrolüne katılım veya ekip toplantıları gerçekleşmiş olarak işaretlenmez. QA dosya teslimi docs reposunun `test/` klasöründedir; uygulama geliştirme sorumluluğu backend ekibindedir.
