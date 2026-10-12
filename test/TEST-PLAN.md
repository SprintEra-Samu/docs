# Hafta 2 QA test planı ve teslim kontrolü

Kaynak: kullanıcının verdiği **2. Hafta – Yapılacaklar (4).pdf**, QA bölümü s. 7–9; haftalık zorunlu/ekstra ayrımı s. 2 ve 10. Bu plan yalnızca QA görevlerini kapsar. Backend kodunun düzeltilmesi ve uygulama veritabanı migration'ları ilgili ekiplerin sorumluluğundadır.

## QA teslimleri

| PDF'deki görev | Teslim / durum |
| --- | --- |
| Postman çalışma alanı ve `baseUrl` | İçe aktarılabilir koleksiyon ve ortam dosyası hazır. Postman arayüzünde çalışma alanına aktarma adımları README'de. Kullanıcının Postman hesabında çalışma alanı oluşturulmadı. |
| Test senaryoları | Aşağıdaki PT-01–PT-10 matrisi ve koleksiyon script'leri hazır. |
| Health, Swagger, kayıt ve giriş testleri | PostgreSQL bağlantılı QA API üzerinde Newman ile gerçek tam tur yapıldı. |
| PT-01–PT-08 sonuçları | `REPORT.md` ve `results/postman-results.json` hazır; PT-06 başarısız. |
| Hata kayıtları | Dört Bug taslağı ve bir gereksinim netleştirme Task taslağı `BUGS.md` ve `jira-import.csv` içinde hazır. Jira'ya henüz aktarılmadı. |
| Düzeltilen backend hatalarını yeniden test | Backend düzeltmesi teslim edilmedi. Hatalar açık; aynı koleksiyonla yeniden test adımları hazır. |
| Test raporu | Gerçek ölçümlere dayalı `REPORT.md` hazır. |
| PT-09–PT-10 (ekstra) | İki token senaryosu da gerçek turda geçti. |
| Değerlendirmede canlı koleksiyon gösterimi ve retrospektif | Kullanıcının ekip toplantısında yapması gereken teslim; gerçekleştiği doğrulanmadı. |
| Jest ve coverage (ekstra) | PostgreSQL ile çalıştırıldı, sonuç ve coverage dosyaları eklendi. PDF'de Backend 2'nin ekstra işi; QA paketindeki mevcut ek çalışma olarak korunuyor. |

Jira işlemleri için Atlassian bağlantısı, proje bilgisi ve Backend 1'in gerçek Jira hesabı gerekir. Taslaklar oluşturulmuş Jira ticket'ları gibi gösterilmez. Backend 1'in kod incelemesi, Cuma kontrolü veya geçmiş toplantılara katılım bu dosyayla tamamlanmış sayılmaz.

## PT matrisi

Koleksiyon sırasıyla çalıştırılır. PT-04 her tur yeni bir test kullanıcısı oluşturur; PT-05, PT-07 ve PT-10 aynı turdaki kullanıcıyı kullanır. Jest'teki temel giriş testi ayrıca tek başına çalışabilir.

| No | İstek / senaryo | Beklenen sonuç | Sonuç | Hata sahibi |
| --- | --- | --- | --- | --- |
| PT-01 | `GET /api/health` | 200, `status: ok`, veritabanı bağlı | Geçti | Backend 1 |
| PT-02A | `GET /api/docs/` | Swagger HTML ve yükleme scripti | Geçti | Backend 2 |
| PT-02B | `GET /api/docs/swagger-ui-init.js` | Dört mevcut API uç noktası tanımda | Geçti | Backend 2 |
| PT-03 | `GET /api/olmayan-adres` | 404, ortak hata biçimi | Geçti | Backend 1 |
| PT-04 | Geçerli kayıt | 201, kullanıcı bilgisi, şifre/hash yok | Geçti | Backend 1 |
| PT-05 | Aynı e-postayla tekrar kayıt | 409, `Bu e-posta zaten kayıtlı` | Geçti | Backend 1 |
| PT-06A | `name` eksik kayıt | 400, eksik alana özel hata | Kaldı: genel mesaj | Backend 1 |
| PT-06B | `email` eksik kayıt | 400, eksik alana özel hata | Kaldı: genel mesaj | Backend 1 |
| PT-06C | `password` eksik kayıt | 400, eksik alana özel hata | Kaldı: genel mesaj | Backend 1 |
| PT-06D | Geçersiz e-posta | 400, e-posta alanını belirten hata | Geçti | Backend 1 |
| PT-07 | Doğru giriş | 200, JWT ve doğru kullanıcı | Geçti | Backend 1 |
| PT-08 | Yanlış şifre | 401, `E-posta veya şifre hatalı` | Geçti | Backend 1 |
| PT-09 (ekstra) | Tokensız `GET /api/auth/me` | 401 | Geçti | Backend 1 |
| PT-10 (ekstra) | Geçerli token ile `GET /api/auth/me` | 200, doğru kullanıcı, hash yok | Geçti | Backend 1 |

PT-02 HTTP üzerinden HTML, script ve uç nokta tanımlarını doğrular. Ayrıca Edge headless ile ekran görüntüsü alınıp incelendi; Swagger'ın render edildiği ve dört uç noktanın listelendiği doğrulandı (`results/swagger.png`). Swagger içinden Try it out ile kayıt/giriş isteği çalıştırılmadı.

## Yeniden test ve kapanış

1. Backend 1 düzeltme commit'ini paylaşır; QA test kopyasını o commit'e geçirir ve commit kimliğini rapora kaydeder.
2. Jira kayıtlarında belirtilen ilgili PT veya Jest senaryosu yeniden çalıştırılır.
3. PT-01–PT-08 ve varsa PT-09–PT-10 için tam koleksiyon turu yapılır.
4. `results/` raporları güncellenir; düzeltilmiş hatalar yalnızca tekrar doğrulandıktan sonra Jira'da kapatılır.
5. Ekip değerlendirmesinde Postman Collection Runner ile canlı tur gösterilir; retrospektifte bulunan hatalar ve test süreci anlatılır.
