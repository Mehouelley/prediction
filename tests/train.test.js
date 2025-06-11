const request = require('supertest');
const app = require('../index');
const { sequelize, RiskZone, WeatherData } = require('../models');

describe('Routes /train', () => {
  let userToken;
  let adminToken;
  let zone;

  beforeAll(async () => {
    // Préparer la DB pour l'entraînement
    await sequelize.sync({ force: true });
    // Créer une zone et un relevé pour entraîner le modèle
    zone = await RiskZone.create({ name: 'TrainZone', latitude: 0, longitude: 0, riskLevel: 1 });
    await WeatherData.create({ zoneId: zone.id, timestamp: new Date(), temperature: 10, humidity: 20, windSpeed: 5 });

    // Créer un user standard
    const userRes = await request(app)
      .post('/auth/register')
      .send({ email: 'user@test.com', password: 'password123', role: 'user' });
    userToken = userRes.body.token;

    // Créer un admin
    const adminRes = await request(app)
      .post('/auth/register')
      .send({ email: 'admin@test.com', password: 'password123', role: 'admin' });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should require authentication', async () => {
    const res = await request(app).post('/train');
    expect(res.statusCode).toBe(401);
  });

  it('should forbid non-admin users', async () => {
    const res = await request(app)
      .post('/train')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('should allow admin to train model', async () => {
    const res = await request(app)
      .post('/train')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message.toLowerCase()).toContain('modèle entraîné');
  });
});
