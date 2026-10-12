const request = require('supertest');
const { app, sequelize, resetDb, uniqueEmail, createUser } = require('./helpers');

beforeAll(resetDb);

afterAll(async () => {
  await sequelize.close();
});

describe('SprintEra API Tests', () => {

  it('GET /api/health should return status ok', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.database).toBe('connected');
  });

  it('POST /api/auth/register should create a new user', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: uniqueEmail('basic-register'),
      password: 'password123'
    });

    expect(response.status).toBe(201);
    expect(response.body.email).toMatch(/@sprintera\.test$/);
    expect(response.body).toHaveProperty('id');
  });

  it('POST /api/auth/login should return a token for valid credentials', async () => {
    const account = await createUser();
    const response = await request(app).post('/api/auth/login').send({
      email: account.email,
      password: account.password
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe(account.email);
  });
});
