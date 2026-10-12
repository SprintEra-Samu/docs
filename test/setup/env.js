// Jest başlamadan yalnızca açıkça verilen test ortamını yükler.
const path = require('path');

const result = require('dotenv').config({
  path: path.resolve(__dirname, '../../.env.test'),
  override: true,
  quiet: true
});
if (result.error) {
  throw new Error('Test ortamı yüklenemedi. Backend test kopyasının kökünde .env.test hazırlayın.');
}

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// GÜVENLİK: testler sequelize.sync({ force: true }) ile tabloları siler.
// Gerçek veritabanına yanlışlıkla çalışmasın diye DB adında "test" geçmiyorsa durdur.
if (!/(?:^|_)test(?:_|$)/i.test(process.env.DB_NAME || '')) {
  throw new Error(
    'Test veritabanı ayarlı değil! .env.test dosyasında DB_NAME ayrı bir "test" bölümü içermeli ' +
    '(örn. SprintEra_test). Gerçek veritabanını silmemek için testler durduruldu.'
  );
}
