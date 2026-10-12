const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { app, sequelize, resetDb, uniqueEmail, createUser, loginAs } = require('./helpers');
const { User, Role } = require('../models');

beforeAll(resetDb);
afterAll(() => sequelize.close());

// 500 dönen senaryolarda errorHandler console.error ile stack basıyor; gürültüyü sustur.
beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => jest.restoreAllMocks());

describe('POST /api/auth/register', () => {
  const valid = () => ({ name: 'Ayşe Yılmaz', email: uniqueEmail('reg'), password: 'Passw0rd!' });

  it('geçerli bilgilerle 201 döner ve şifre bilgisi sızdırmaz', async () => {
    const body = valid();
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: body.name, email: body.email });
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('role_id');
    expect(res.body).toHaveProperty('created_at');
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('password_hash');
  });

  it('varsayılan rol "Ekip Üyesi" atanır', async () => {
    const res = await request(app).post('/api/auth/register').send(valid());
    const role = await Role.findByPk(res.body.role_id);
    expect(role.name).toBe('Ekip Üyesi');
  });

  it('şifre veritabanında bcrypt hash olarak saklanır', async () => {
    const body = valid();
    await request(app).post('/api/auth/register').send(body);

    const saved = await User.findOne({ where: { email: body.email } });
    expect(saved.password_hash).not.toBe(body.password);
    expect(saved.password_hash).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare(body.password, saved.password_hash)).toBe(true);
  });

  test.each(['name', 'email', 'password'])('%s eksikse 400 döner', async (field) => {
    const body = valid();
    delete body[field];
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test.each(['abc', 'a@b', '@sprintera.test', 'a b@sprintera.test', 'a@@sprintera.test'])(
    'geçersiz e-posta "%s" 400 döner',
    async (email) => {
      const res = await request(app).post('/api/auth/register').send({ ...valid(), email });
      expect(res.status).toBe(400);
    }
  );

  it('aynı e-posta ikinci kez kaydedilemez (409)', async () => {
    const body = valid();
    await request(app).post('/api/auth/register').send(body);
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // --- Kodu okuyarak tahmin ettiğim olası hatalar: şu an FAIL edebilirler (rapor edilecek bulgular) ---
  describe('olası hatalar', () => {
    it('e-posta büyük/küçük harf duyarsız tekil olmalı (409)', async () => {
      const body = valid();
      await request(app).post('/api/auth/register').send(body);
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...body, email: body.email.toUpperCase() });
      expect(res.status).toBe(409);
    });

    it('string olmayan şifre 500 yerine 400 döner', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...valid(), password: 12345678 });
      expect(res.status).toBe(400);
    });
  });
});

describe('POST /api/auth/login', () => {
  let account;
  beforeAll(async () => {
    account = await createUser({ roleName: 'Yönetici' });
  });

  it('doğru bilgilerle 200, token ve kullanıcı bilgisi döner', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: account.email, password: account.password });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({
      id: account.user.id,
      email: account.email,
      role_id: account.role.id
    });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('token doğru payload içerir ve 1 gün geçerlidir', async () => {
    const token = await loginAs(account.email, account.password);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    expect(payload.user).toEqual({ id: account.user.id, role_id: account.role.id });
    expect(payload.exp - payload.iat).toBe(24 * 60 * 60);
  });

  it('yanlış şifrede 401 döner', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: account.email, password: 'yanlis-sifre' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body).not.toHaveProperty('token');
  });

  it('kayıtsız e-postada 401 döner', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: uniqueEmail('yok'), password: 'x' });
    expect(res.status).toBe(401);
  });

  it('hata mesajı e-posta var/yok bilgisini ele vermez', async () => {
    const wrongPass = await request(app)
      .post('/api/auth/login')
      .send({ email: account.email, password: 'yanlis' });
    const noUser = await request(app)
      .post('/api/auth/login')
      .send({ email: uniqueEmail('yok'), password: 'yanlis' });

    expect(wrongPass.body.error).toBe(noUser.body.error);
  });

  test.each([
    ['email', { password: 'x' }],
    ['password', { email: 'a@b.com' }],
    ['ikisi de', {}]
  ])('%s eksikse 400 döner', async (_label, body) => {
    const res = await request(app).post('/api/auth/login').send(body);
    expect(res.status).toBe(400);
  });

  // Olası hata: tip kontrolü yok, bcrypt/Sequelize hata fırlatıp 500 dönebilir.
  test.each([
    ['sayısal şifre', { password: 12345678 }],
    ['nesne e-posta', { email: { toString: 'x' } }]
  ])('olası hata: %s 500 yerine 400/401 döner', async (_label, override) => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: account.email, password: account.password, ...override });
    expect([400, 401]).toContain(res.status);
  });
});

describe('GET /api/auth/me', () => {
  let account;
  let token;
  beforeAll(async () => {
    account = await createUser();
    token = await loginAs(account.email, account.password);
  });

  it('token yoksa 401 döner', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Bearer olmayan şemada 401 döner', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Basic ${token}`);
    expect(res.status).toBe(401);
  });

  it('bozuk token ile 401 döner', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer bozuk.token.degeri');
    expect(res.status).toBe(401);
  });

  it('başka secret ile imzalanmış token 401 döner', async () => {
    const forged = jwt.sign(
      { user: { id: account.user.id, role_id: account.role.id } },
      'baska-bir-secret'
    );
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('süresi dolmuş token 401 döner', async () => {
    const expired = jwt.sign(
      { user: { id: account.user.id, role_id: account.role.id } },
      process.env.JWT_SECRET,
      { expiresIn: -10 }
    );
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it('geçerli token ile kullanıcı bilgisini döner, hash sızdırmaz', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: account.user.id,
      name: account.user.name,
      email: account.email,
      role_id: account.role.id
    });
    expect(res.body).toHaveProperty('created_at');
    expect(res.body).not.toHaveProperty('password_hash');
  });

  it('kullanıcı silinmişse geçerli token ile bile 404 döner', async () => {
    const temp = await createUser();
    const tempToken = await loginAs(temp.email, temp.password);
    await temp.user.destroy();

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tempToken}`);
    expect(res.status).toBe(404);
  });
});
