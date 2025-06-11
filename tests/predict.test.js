const request = require('supertest');
const app = require('../index');
const { sequelize, RiskZone, WeatherData } = require('../models');

let userToken;

beforeAll(async () => {
  // Réinitialiser la DB pour les tests
  await sequelize.sync({ force: true });
  // Créer une zone et des données météo
  const zone = await RiskZone.create({ name: 'TestZone', latitude: 0, longitude: 0, riskLevel: 0 });
  await WeatherData.create({ zoneId: zone.id, timestamp: new Date(), temperature: 20, humidity: 50, windSpeed: 5 });

  // Enregistrer un utilisateur pour obtenir un token
  const userRes = await request(app)
    .post('/auth/register')
    .send({ email: 'user@test.com', password: 'password123', role: 'user' });
  userToken = userRes.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('GET /predict', () => {
  it('Devrait retourner un tableau de prédictions', async () => {
    const res = await request(app)
      .get('/predict')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('zoneId');
    expect(res.body[0]).toHaveProperty('riskLevel');
  });
});

// Ajouter un test pour GET /predict/:zoneId
describe('GET /predict/:zoneId', () => {
  it('Devrait retourner une prédiction pour une zone spécifique', async () => {
    // Récupérer l'ID de la zone créée
    const zones = await RiskZone.findAll();
    const zoneId = zones[0].id;
    const res = await request(app)
      .get(`/predict/${zoneId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('zoneId', zoneId);
    expect(res.body).toHaveProperty('riskLevel');
  });
  it('Devrait retourner 404 pour une zone non existante', async () => {
    const res = await request(app)
      .get('/predict/9999')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(404);
  });
});

describe('Authentication for /predict', () => {
  it('should require authentication on GET /predict', async () => {
    const res = await request(app).get('/predict');
    expect(res.statusCode).toBe(401);
  });

  it('should require authentication on GET /predict/:zoneId', async () => {
    const res = await request(app).get('/predict/1');
    expect(res.statusCode).toBe(401);
  });
});
