# Sprint 3 hata raporu

Durum: bu dosya yerel hata taslağıdır; Jira kaydı açılmadı ve ekip üyelerine mesaj gönderilmedi. Kaynak: [çalıştırma kanıtı](results/sprint3/2026-10-16T08-17-01-734Z.json).


## S3-BUG-01 — PT-06

- Durum: AÇIK; düzeltme/retest bekleniyor.
- Sorumlu: Backend 1. Önem: Orta.
- Backend commit: `dde1a34c90dc66af9dbc7e547218629fa425077d`. Çalıştırma: 2026-10-16T08-17-01-734Z.
- Önkoşul: ayrılmış QA DB/API ve koleksiyonun önceki başarılı hazırlık adımları.
- Tekrar üretim: Sprint 3 koleksiyonunu sırasıyla çalıştırın; aşağıdaki istekleri aynı çalışma içinde inceleyin. Parola/token değerlerini yalnızca yerel ortamdan sağlayın.

### PT-06A Eksik name

- İstek: `POST http://127.0.0.1:3001/api/auth/register`.
- Beklenen HTTP: 400; gerçekleşen HTTP: 400.
- Başarısız kontroller: PT-06 alan bazlı hata: name: expected false to deeply equal true.
- Gerçek yanıt:

```json
{
  "success": false,
  "error": "Name, email and password are required",
  "details": null
}
```

Tekrar üretim gövdesi (yerel değişkenleri kullanın):

```json
{
  "email": "{{qaEmail}}",
  "password": "{{qaPassword}}"
}
```

### PT-06B Eksik email

- İstek: `POST http://127.0.0.1:3001/api/auth/register`.
- Beklenen HTTP: 400; gerçekleşen HTTP: 400.
- Başarısız kontroller: PT-06 alan bazlı hata: email: expected false to deeply equal true.
- Gerçek yanıt:

```json
{
  "success": false,
  "error": "Name, email and password are required",
  "details": null
}
```

Tekrar üretim gövdesi (yerel değişkenleri kullanın):

```json
{
  "name": "{{qaName}}",
  "password": "{{qaPassword}}"
}
```

### PT-06C Eksik password

- İstek: `POST http://127.0.0.1:3001/api/auth/register`.
- Beklenen HTTP: 400; gerçekleşen HTTP: 400.
- Başarısız kontroller: PT-06 alan bazlı hata: password: expected false to deeply equal true.
- Gerçek yanıt:

```json
{
  "success": false,
  "error": "Name, email and password are required",
  "details": null
}
```

Tekrar üretim gövdesi (yerel değişkenleri kullanın):

```json
{
  "name": "{{qaName}}",
  "email": "{{qaEmail}}"
}
```

## S3-BUG-02 — EK Üye ile proje oluşturma — PDF yetki beklentisi

- Durum: AÇIK; düzeltme/retest bekleniyor.
- Sorumlu: Backend 1. Önem: Yüksek.
- Backend commit: `dde1a34c90dc66af9dbc7e547218629fa425077d`. Çalıştırma: 2026-10-16T08-17-01-734Z.
- Önkoşul: ayrılmış QA DB/API ve koleksiyonun önceki başarılı hazırlık adımları.
- Tekrar üretim: Sprint 3 koleksiyonunu sırasıyla çalıştırın; aşağıdaki istekleri aynı çalışma içinde inceleyin. Parola/token değerlerini yalnızca yerel ortamdan sağlayın.
- Gereksinim farkı: PDF giriş yapan kullanıcı için proje oluşturmayı bekler; Swagger ve rol middleware yalnızca Yönetici’ye izin verir. Beklenti ürün gereksinimi netleştirilene kadar PDF’deki 201 olarak korunmuştur.

### EK Üye ile proje oluşturma — PDF yetki beklentisi

- İstek: `POST http://127.0.0.1:3001/api/projects`.
- Beklenen HTTP: 201; gerçekleşen HTTP: 403.
- Başarısız kontroller: HTTP 201: expected response to have status code 201 but got 403; Üye projesi oluşur: expected undefined to be a number.
- Gerçek yanıt:

```json
{
  "success": false,
  "error": "Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır.",
  "details": null
}
```

Tekrar üretim gövdesi (yerel değişkenleri kullanın):

```json
{
  "name": "Üye QA {{runId}}",
  "description": "Sprint 3 izole QA projesi",
  "date": "2026-10-20"
}
```

## Çalıştırma öncesi gözlemler

Kaynak incelemesinde proje oluşturma yetkisi farkı görülmüştür; HTTP kanıtı yoksa doğrulanmış hata sayılmaz. Week 2 hata kayıtları ve raporları korunmuştur; eski FAIL sonuçları otomatik kapatılmaz veya yeni çalıştırma sonucu olarak taşınmaz.

PT-06: [QA-W2-001](BUGS.md) mevcut hata kaydıyla ilişkilidir; yeni Backend commit'inde sorun devam ediyor.
