require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const db = require('./models');
const riskZoneRoutes = require('./routes/riskZone');
const weatherService = require('./services/weatherService');
const weatherRoutes = require('./routes/weatherData');
const predictRoutes = require('./routes/predict');
const logger = require('./services/logger');
const subscriptionRoutes = require('./routes/subscription');
const { swaggerUI, swaggerSpec } = require('./swagger');
require('./config/validateEnv');  // Valide process.env avec Joi
const auth = require('./middleware/auth');
const trainRoutes = require('./routes/train');
const authRoutes = require('./routes/auth');

const app = express();

// Middlewares de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
});
app.use(limiter);

// Parse JSON
app.use(express.json());

// Documentation Swagger disponible publiquement
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// Route publique de test de santé
app.get('/', (req, res) => {
  res.json({ message: 'API de prédiction de catastrophes opérationnelle' });
});

// Routes publiques d’authentification
app.use('/auth', authRoutes);

// Middleware d'authentification pour les routes protégées
app.use(auth);

// Routes protégées
app.use('/zones', riskZoneRoutes);
app.use('/weather', weatherRoutes);
app.use('/predict', predictRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/train', trainRoutes);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  logger.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Serveur démarré sur le port ${PORT}`);
  });
}

module.exports = app;
