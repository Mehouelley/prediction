const logger = require('../services/logger');

// Middleware global de gestion des erreurs
function errorHandler(err, req, res, next) {
  // Log de l'erreur complète
  logger.error(err.stack || err.message);

  // Statut HTTP
  const statusCode = err.status || (err.isJoi ? 400 : 500);

  // Message pour le client
  const message = err.message || 'Erreur interne du serveur';

  res.status(statusCode).json({
    status: 'error',
    message
  });
}

module.exports = errorHandler;
