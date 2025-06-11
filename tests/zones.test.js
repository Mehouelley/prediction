const request = require('supertest');
const app = require('../index');
const { sequelize, RiskZone } = require('../models');

describe('Routes /zones', () => {
  let userToken;
  let adminToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    // Créer un user et obtenir token
    const userRes = await request(app)
      .post('/auth/register')
      .send({ email: 'user@test.com', password: 'password123', role: 'user' });
    userToken = userRes.body.token;
    // Créer un admin et obtenir token
    const adminRes = await request(app)
      .post('/auth/register')
      .send({ email: 'admin@test.com', password: 'password123', role: 'admin' });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('GET /zones should return empty array initially', async () => {
    const res = await request(app)
      .get('/zones')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('POST /zones should create a new zone (admin only)', async () => {
    const newZone = { name: 'TestZone', latitude: 10, longitude: 20, riskLevel: 1 };
    const res = await request(app)
      .post('/zones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newZone);
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject(newZone);
    expect(res.body).toHaveProperty('id');
  });

  it('GET /zones/:id should return the created zone', async () => {
    const zone = await RiskZone.findOne();
    const res = await request(app)
      .get(`/zones/${zone.id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', zone.id);
  });

  it('PUT /zones/:id should update the zone (admin only)', async () => {
    const zone = await RiskZone.findOne();
    const res = await request(app)
      .put(`/zones/${zone.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated', latitude: 15, longitude: 25, riskLevel: 2 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated');
  });

  it('DELETE /zones/:id should remove the zone (admin only)', async () => {
    const zone = await RiskZone.findOne();
    const res = await request(app)
      .delete(`/zones/${zone.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});
