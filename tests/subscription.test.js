const request = require('supertest');
const app = require('../index');
const { sequelize, RiskZone, Subscription } = require('../models');

describe('Routes /subscriptions', () => {
  let zone;
  let userToken;
  let adminToken;
  let userSub;
  let adminSub;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    zone = await RiskZone.create({ name: 'TestZone', latitude: 10, longitude: 20, riskLevel: 1 });
    
    // Enregistrer et authentifier un utilisateur standard
    const userRes = await request(app)
      .post('/auth/register')
      .send({ email: 'user@test.com', password: 'password123', role: 'user' });
    userToken = userRes.body.token;

    // Enregistrer et authentifier un administrateur
    const adminRes = await request(app)
      .post('/auth/register')
      .send({ email: 'admin@test.com', password: 'password123', role: 'admin' });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should forbid listing all subscriptions for non-admin', async () => {
    const res = await request(app)
      .get('/subscriptions')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('should allow user to create a subscription', async () => {
    const res = await request(app)
      .post('/subscriptions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: 'user@test.com', zoneId: zone.id });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('user.id');
    userSub = res.body;
  });

  it('should prevent duplicate subscription for same user and zone', async () => {
    const res = await request(app)
      .post('/subscriptions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: 'user@test.com', zoneId: zone.id });
    expect(res.statusCode).toBe(409);
  });

  it('should allow admin to list all subscriptions', async () => {
    const res = await request(app)
      .get('/subscriptions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty('user.id');
  });

  it('should allow user to list own subscriptions only', async () => {
    const res = await request(app)
      .get('/subscriptions/my')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(userSub.id);
  });

  it('should forbid user from accessing another user\'s subscription', async () => {
    // Admin crée un abonnement
    const adminCreate = await request(app)
      .post('/subscriptions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'admin@test.com', zoneId: zone.id });
    adminSub = adminCreate.body;

    const res = await request(app)
      .get(`/subscriptions/${adminSub.id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('should allow admin to access any subscription', async () => {
    const res = await request(app)
      .get(`/subscriptions/${userSub.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', userSub.id);
  });
});
