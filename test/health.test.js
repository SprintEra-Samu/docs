const request = require('supertest');
const { app, sequelize, resetDb } = require('./helpers');

beforeAll(resetDb);
afterAll(() => sequelize.close());
afterEach(() => jest.restoreAllMocks());

describe('PT-02 Swagger', () => {
  it('dokümantasyon sayfası açılır', async () => {
    const res = await request(app).get('/api/docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('swagger-ui');
  });

  it('Swagger tanımında tüm mevcut API uç noktaları bulunur', async () => {
    const res = await request(app).get('/api/docs/swagger-ui-init.js');
    expect(res.status).toBe(200);
    for (const endpoint of ['/api/health', '/api/auth/register', '/api/auth/login', '/api/auth/me']) {
      expect(res.text).toContain(`"${endpoint}"`);
    }
  });
});

describe('GET /api/health', () => {
  it('veritabanı bağlıyken 200 ve ok döner', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'connected' });
  });

  it('veritabanı kopukken 500 ve disconnected döner', async () => {
    jest.spyOn(sequelize, 'authenticate').mockRejectedValueOnce(new Error('bağlantı yok'));
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.database).toBe('disconnected');
  });
});

describe('Bilinmeyen rotalar (404 handler)', () => {
  it('GET /api/yok -> 404 ve standart hata formatı', async () => {
    const res = await request(app).get('/api/yok');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, details: null });
    expect(typeof res.body.error).toBe('string');
  });

  it('yanlış metot (GET /api/auth/login) -> 404', async () => {
    const res = await request(app).get('/api/auth/login');
    expect(res.status).toBe(404);
  });
});
