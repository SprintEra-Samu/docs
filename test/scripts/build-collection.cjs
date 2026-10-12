const fs = require('node:fs');
const path = require('node:path');
const { hasFieldError } = require('../field-errors');
const output = path.resolve(__dirname, '../postman');
fs.mkdirSync(output, { recursive: true });

const event = (listen, source) => ({ listen, script: { type: 'text/javascript', exec: source.trim().split('\n') } });
const expectStatus = code => `pm.test('HTTP ${code}', () => pm.response.to.have.status(${code}));`;
const errorShape = `pm.test('Ortak hata biçimi', () => {
  const body = pm.response.json();
  pm.expect(body.success).to.eql(false);
  pm.expect(body.error).to.be.a('string').and.not.empty;
  pm.expect(body).to.have.property('details');
});`;
function request(name, method, endpoint, test, body, before) {
  return {
    name,
    event: [...(before ? [event('prerequest', before)] : []), event('test', test)],
    request: {
      method,
      auth: { type: 'noauth' },
      header: body ? [{ key: 'Content-Type', value: 'application/json' }] : [],
      ...(body ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}),
      url: { raw: `{{baseUrl}}${endpoint}`, host: ['{{baseUrl}}'], path: endpoint.replace(/^\//, '').split('/') }
    }
  };
}
const registration = { name: '{{qaName}}', email: '{{qaEmail}}', password: '{{qaPassword}}' };
const items = [
  request('PT-01 Health', 'GET', '/api/health', `${expectStatus(200)}
pm.test('API ve veritabanı çalışıyor', () => {
  pm.expect(pm.response.json()).to.eql({ status: 'ok', database: 'connected' });
});`),
  request('PT-02A Swagger sayfası', 'GET', '/api/docs/', `${expectStatus(200)}
pm.test('Swagger HTML ve yükleme scripti', () => {
  pm.expect(pm.response.headers.get('Content-Type')).to.include('text/html');
  pm.expect(pm.response.text()).to.include('swagger-ui');
  pm.expect(pm.response.text()).to.include('swagger-ui-init.js');
});`),
  request('PT-02B Swagger tüm uç noktalar', 'GET', '/api/docs/swagger-ui-init.js', `${expectStatus(200)}
pm.test('Mevcut dört API uç noktası Swagger tanımında', () => {
  ['/api/health', '/api/auth/register', '/api/auth/login', '/api/auth/me'].forEach(endpoint => {
    pm.expect(pm.response.text()).to.include('"' + endpoint + '"');
  });
});`),
  request('PT-03 Hatalı adres', 'GET', '/api/olmayan-adres', `${expectStatus(404)}\n${errorShape}`),
  request('PT-04 Geçerli kayıt', 'POST', '/api/auth/register', `${expectStatus(201)}
pm.test('Kullanıcı oluşur ve şifre dönmez', () => {
  const body = pm.response.json();
  pm.expect(body.id).to.be.a('number');
  pm.expect(body.email).to.eql(pm.collectionVariables.get('qaEmail'));
  pm.expect(body.name).to.eql(pm.collectionVariables.get('qaName'));
  pm.expect(body).not.to.have.property('password');
  pm.expect(body).not.to.have.property('password_hash');
});`, registration, `pm.collectionVariables.set('qaEmail', 'qa.' + Date.now() + '.' + pm.variables.replaceIn('{{$guid}}') + '@sprintera.test');
pm.collectionVariables.set('qaName', 'SprintEra QA Hafta 2');
pm.collectionVariables.set('qaPassword', 'QaPassw0rd!2026');
pm.collectionVariables.unset('token');`),
  request('PT-05 Tekrar kayıt', 'POST', '/api/auth/register', `${expectStatus(409)}\n${errorShape}
pm.test('Tekrar kayıt hata mesajı', () => pm.expect(pm.response.json().error).to.eql('Bu e-posta zaten kayıtlı'));`, registration)
];
for (const [index, field] of ['name', 'email', 'password'].entries()) {
  const body = { ...registration };
  delete body[field];
  items.push(request(`PT-06${String.fromCharCode(65 + index)} Eksik ${field}`, 'POST', '/api/auth/register', `${expectStatus(400)}\n${errorShape}
${hasFieldError.toString()}
pm.test('PT-06 alan bazlı hata: ${field}', () => pm.expect(hasFieldError(pm.response.json(), '${field}')).to.eql(true));`, body));
}
items.push(
  request('PT-06D Geçersiz e-posta', 'POST', '/api/auth/register', `${expectStatus(400)}\n${errorShape}
pm.test('E-posta alanı hata mesajında belirtilir', () => pm.expect(pm.response.json().error).to.match(/email|e-posta|eposta/i));`, { ...registration, email: 'gecersiz-eposta' }),
  request('PT-07 Doğru giriş', 'POST', '/api/auth/login', `${expectStatus(200)}
const body = pm.response.json();
pm.collectionVariables.unset('token');
if (pm.response.code === 200 && typeof body.token === 'string') pm.collectionVariables.set('token', body.token);
pm.test('JWT ve kullanıcı bilgisi', () => {
  pm.expect(body.token).to.be.a('string').and.not.empty;
  pm.expect(body.token.split('.')).to.have.lengthOf(3);
  pm.expect(body.user.email).to.eql(pm.collectionVariables.get('qaEmail'));
  pm.expect(body.user).not.to.have.property('password');
  pm.expect(body.user).not.to.have.property('password_hash');
});`, { email: '{{qaEmail}}', password: '{{qaPassword}}' }),
  request('PT-08 Yanlış şifre', 'POST', '/api/auth/login', `${expectStatus(401)}\n${errorShape}
pm.test('Yanlış şifre hata mesajı', () => pm.expect(pm.response.json().error).to.eql('E-posta veya şifre hatalı'));`, { email: '{{qaEmail}}', password: 'wrong-password-for-qa' }),
  request('PT-09 Tokensız kullanıcı bilgisi (ekstra)', 'GET', '/api/auth/me', `${expectStatus(401)}\n${errorShape}`),
  request('PT-10 Geçerli token (ekstra)', 'GET', '/api/auth/me', `${expectStatus(200)}
pm.test('Token ile aynı kullanıcının bilgileri döner', () => {
  const body = pm.response.json();
  pm.expect(body.id).to.be.a('number');
  pm.expect(body.email).to.eql(pm.collectionVariables.get('qaEmail'));
  pm.expect(body).not.to.have.property('password');
  pm.expect(body).not.to.have.property('password_hash');
});`)
);
items.at(-1).request.header.push({ key: 'Authorization', value: 'Bearer {{token}}' });
const collection = {
  info: {
    _postman_id: '47ea1a8e-4147-4d04-badb-5527e309dd2c',
    name: 'SprintEra Hafta 2 QA — PT-01–PT-10',
    description: 'Hafta 2 QA senaryoları. Koleksiyonu sırayla çalıştırın: PT-04 yeni bir test kullanıcısı, PT-07 token oluşturur. Her tur benzersiz e-posta kullanır. PT-06 alan bazlı hata gereksinimini de kontrol eder; backend hataları testleri başarısız bırakır. Yalnızca test ortamında çalıştırın.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: ['qaEmail', 'qaName', 'qaPassword', 'token'].map(key => ({ key, value: '', type: 'string' })),
  item: items
};
const environment = {
  id: 'bd3df0af-4d3b-49ef-9191-8189ddb0d642',
  name: 'SprintEra yerel QA',
  values: [{ key: 'baseUrl', value: 'http://127.0.0.1:3001', type: 'default', enabled: true }],
  _postman_variable_scope: 'environment'
};
fs.writeFileSync(path.join(output, 'SprintEra-week2.postman_collection.json'), JSON.stringify(collection, null, 2) + '\n');
fs.writeFileSync(path.join(output, 'SprintEra-local.postman_environment.json'), JSON.stringify(environment, null, 2) + '\n');
console.log(`${items.length} Postman isteği oluşturuldu.`);
