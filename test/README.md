# SprintEra backend testleri

Bu klasör, [SprintEra backend](https://github.com/SprintEra-Samu/backend) reposundaki `tests/` klasörünün kopyasıdır. Kaynak commit: `bac382e`.

- `api.test.js`: Temel health, kayıt ve giriş senaryoları.
- `auth.test.js`: Kayıt, giriş, JWT ve kullanıcı bilgisi senaryoları.
- `health.test.js`: Veritabanı bağlantısı ve 404 yanıtları.
- `models.test.js`: Kullanıcı, rol, izin ve model ilişkileri.
- `helpers.js`: Ortak test yardımcıları.
- `setup/env.js`: Test ortamının yüklenmesi ve test veritabanı kontrolü.

## Çalıştırma

Testler backend uygulamasının `server.js`, `models/` dosyalarına ve bağımlılıklarına ihtiyaç duyar. Çalıştırmak için bu klasörün içeriğini backend reposunun kökündeki `tests/` klasörüne kopyalayın; `setup/` alt klasörünü koruyun.

Backend kökünde `.env.test` dosyasını ayrı bir PostgreSQL test veritabanına göre yapılandırın. Veritabanı adında `test` bulunmalıdır. Testler `sequelize.sync({ force: true })` kullandığından bu veritabanındaki tabloları silip yeniden oluşturur.

Backend `package.json` dosyasındaki Jest ayarlarında `setupFiles` değeri `["./tests/setup/env.js"]`, `maxWorkers` değeri `1` olmalıdır. Kaynak commit bu ayarları ve gerekli bağımlılıkları içerir.

Backend kökünde:

```sh
npm ci
npm test
# Kod kapsamı raporu:
npm run test:coverage
```

`auth.test.js` içindeki olası hata senaryoları mevcut backend davranışında başarısız olabilir. Bu kopyalama sırasında testler çalıştırılmadı; dosyaların kaynakla birebir aynı olduğu ve JavaScript sözdizimi doğrulandı.
