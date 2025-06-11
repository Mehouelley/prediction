const request = require('supertest');
const app = require('../index');
const { sequelize, User } = require('../models');

describe('Auth Routes', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('POST /auth/register crée un nouvel utilisateur', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'secret123' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'test@example.com', role: 'user' });
  });

  it('POST /auth/register refuse un email dupliqué', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'secret123' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /auth/login authentifie avec des identifiants valides', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'secret123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('POST /auth/login rejette des identifiants invalides', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });
});
