// Jest'ten ÖNCE çalışır (package.json -> jest.setupFiles).
// dotenv var olan değişkenlerin üzerine yazmaz; bu yüzden .env.test burada önce
// yüklenirse, server.js / config/database.js içindeki .env yüklemesine baskın gelir.
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test') });

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// GÜVENLİK: testler sequelize.sync({ force: true }) ile tabloları siler.
// Gerçek veritabanına yanlışlıkla çalışmasın diye DB adında "test" geçmiyorsa durdur.
if (!/test/i.test(process.env.DB_NAME || '')) {
  throw new Error(
    'Test veritabanı ayarlı değil! .env.test dosyasında DB_NAME içinde "test" geçmeli ' +
    '(örn. SprintEra_test). Gerçek veritabanını silmemek için testler durduruldu.'
  );
}
