// Middleware de vérification de la clé API via header x-api-key
function apiKeyMiddleware(req, res, next) {
  // Bypass API key check en environnement de test
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  // Vérifier que l'utilisateur est authentifié et possède une clé API
  if (!req.user || !req.user.apiKey) {
    return res.status(401).json({ status: 'error', message: 'Utilisateur non authentifié ou sans API key' });
  }
  const headerKey = req.header('x-api-key');
  if (!headerKey || headerKey !== req.user.apiKey) {
    return res.status(401).json({ status: 'error', message: 'Clé API invalide' });
  }
  next();
}

module.exports = apiKeyMiddleware;
