# Sprint 3 QA test planı

Kaynak: çalışma alanındaki **3. Hafta – Yapılacaklar (2).pdf**, dokuz sayfa; özellikle 5–7. sayfalar. Kullanıcının talebi doğrultusunda hedef bugün tamamlamaktır; PDF'deki 18 Ekim teslim tarihi beklenmez. Backend kaynakları değiştirilmeyecek, yalnızca docs/test teslimleri hazırlanacaktır.

## Test matrisi

| Kimlik | İstek / koşul | Beklenen sonuç | Hata sahibi |
| --- | --- | --- | --- |
| PT-01–PT-08 | Week 2 regresyonu, mevcut tüm alt senaryolar | Mevcut assertion'lar aynen korunur | Mevcut hata kayıtlarıyla ilişkilendirilir |
| PT-11 | GET /api/auth/me, tokensız | 401 ve hata mesajı | Backend 1 |
| PT-12 | GET /api/auth/me, üye login token'ı | 200; aynı kullanıcı; parola/hash yok | Backend 1 |
| PT-13 | POST /api/projects, yönetici ve geçerli ad/açıklama/tarih | 201; proje adı, açıklama, tarih, oluşturan kullanıcı | Backend 1 |
| PT-14 | POST /api/projects, tokensız | 401 | Backend 1 |
| PT-15 | POST /api/projects, yönetici; ad gönderilmez | 400 ve ad alanına özgü hata | Backend 1 |
| PT-16 | GET /api/projects, üye | 200; dizi ve oluşturulan proje | Backend 1 |
| PT-17 | POST /api/tasks, mevcut proje ve atanan kullanıcı | 201; görev/proje/atama; To Do | Backend 1 |
| PT-18 | PATCH /api/tasks/:id | 200; In Progress ve Done geçişleri; GET ile kalıcılık | Backend 2 |
| PT-19 | POST /api/tasks, yokluğu DB'de doğrulanmış proje | 404 ve hata mesajı | Backend 1 |

PT-02 iki, PT-06 dört, PT-18 üç alt istek içerir. Toplam zorunlu senaryo sayısı **17**, zorunlu HTTP isteği sayısı **23**. Yönetici login'i bir hazırlık isteğidir. Beş ek istek üye proje oluşturma yetkisini, proje detayını, görev atamasını, görev filtrelerini ve Swagger kapsamını doğrular. Toplam koleksiyon **29 istek** içerir. PT-09/PT-10 eklenmez; Week 2 arşivindeki mevcut ekstra testler korunur.

## Ortam ve yürütme

- Backend commit'i izole kaynak snapshot'ından çalıştırılır; kaynak commit her sonuç dosyasında kaydedilir.
- Yeni `SprintEra_sprint3_test` DB ve `sprintera_sprint3_qa` kullanıcısı; yalnızca `127.0.0.1:5432`. Normal Backend veritabanı kullanılmaz.
- QA API `127.0.0.1:3001` üzerinde çalışır. Ortam kontrolü açık bağlantı değerleri ve DB kimliği doğrulaması gerektirir.
- Bağımlılık kurulumu, DB oluşturma, şema/fixture yazma ve API/test başlatma açık onaydan sonra yapılır. `seed.js`, force/alter sync ve mevcut yıkıcı Jest testleri çalıştırılmaz.
- Şema model üzerinden `sync()` ile hazırlanır; bu tur migration uygulanabilirliğini kanıtlamaz.
- Regresyon benzersiz kullanıcı oluşturur; gerçek login'den token alınır. Yönetici fixture'ı da gerçek login ile token alır. Proje/görev kimlikleri başarılı yanıtlardan aktarılır.
- Gizli bilgiler Git tarafından yok sayılan `.runtime-sprint3/` içinde kalır. Yayınlanabilir ortam şablonunda parola/token bulunmaz.

## Yetki kararı ve sonuç kuralları

PDF giriş yapan kullanıcının proje oluşturmasını bekler; kaynak kodu ve Swagger yalnızca Yönetici'ye izin verir. Kullanıcının seçimi: PT-13/PT-15 yöneticiyle çalıştırılır; üyeyle oluşturma ek senaryoda PDF'nin **201** beklentisine göre sınanır. 403 alınırsa fark FAIL ve gereksinim/Swagger uyuşmazlığı olarak Backend 1'e raporlanır; beklenen sonuç 403'e çevrilmez.

PASS: istek gerçekten çalışmış, HTTP yanıtı alınmış ve tüm assertion'lar geçmiştir. FAIL: çalışan istekte en az bir assertion başarısızdır. BLOCKED: çalıştırılmamış, önkoşulu eksik, bağlantı hatalı veya doğrulaması eksik istektir. Alt senaryolardan biri FAIL ise ana senaryo FAIL; FAIL yoksa ancak tüm alt senaryolar PASS olduğunda ana senaryo PASS olur. Aksi durumda BLOCKED.

Ham token içeren environment/collection export'u veya ham Newman çıktısı paylaşılmaz. Başarısız assertion mesajları da sır değerleri açısından temizlenir. Bug kapanışı ancak geliştirici düzeltmesinin gerçek retest'i sonrasında yapılır.
