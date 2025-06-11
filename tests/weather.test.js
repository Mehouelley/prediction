const request = require('supertest');
const app = require('../index');
const { sequelize, RiskZone, WeatherData } = require('../models');

describe('Routes /weather', () => {
  let userToken;
  let adminToken;
  let entry;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    const zone = await RiskZone.create({ name: 'WZone', latitude: 0, longitude: 0, riskLevel: 0 });
    entry = await WeatherData.create({ zoneId: zone.id, timestamp: new Date(), temperature: 25, humidity: 60, windSpeed: 10 });

    // Créer user et admin pour obtenir tokens
    const userRes = await request(app)
      .post('/auth/register')
      .send({ email: 'user@test.com', password: 'password123', role: 'user' });
    userToken = userRes.body.token;
    const adminRes = await request(app)
      .post('/auth/register')
      .send({ email: 'admin@test.com', password: 'password123', role: 'admin' });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('GET /weather should return weather entries for authenticated user', async () => {
    const res = await request(app)
      .get('/weather')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('zoneId');
  });

  it('GET /weather/:id should return specific entry for authenticated user', async () => {
    const res = await request(app)
      .get(`/weather/${entry.id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', entry.id);
  });

  it('GET /weather/zone/:zoneId returns entries for zone for authenticated user', async () => {
    const zone = await RiskZone.findOne();
    const res = await request(app)
      .get(`/weather/zone/${zone.id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /weather should create an entry (admin only)', async () => {
    const zone = await RiskZone.findOne();
    const newEntry = { zoneId: zone.id, timestamp: new Date().toISOString(), temperature: 22, humidity: 55, windSpeed: 5 };
    const res = await request(app)
      .post('/weather')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newEntry);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('DELETE /weather/:id should delete an entry (admin only)', async () => {
    const created = await WeatherData.create({ zoneId: entry.zoneId, timestamp: new Date(), temperature: 30 });
    const res = await request(app)
      .delete(`/weather/${created.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});
