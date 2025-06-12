const express = require('express');
const router = express.Router();
const { predictRisk } = require('../services/predictService');
// validation via parseInt et Joi if needed
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

/**
 * @swagger
 * tags:
 *   name: Prediction
 *   description: Endpoints de prédiction de risque
 */

/**
 * @swagger
 * /predict:
 *   get:
 *     summary: Récupère les prédictions pour toutes les zones (Utilisateurs authentifiés)
 *     tags: [Prediction]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des prédictions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Prediction'
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès interdit (rôle insuffisant)
 */
// Prédiction pour toutes les zones
router.get('/', authMiddleware, checkRole(['user', 'admin']), async (req, res, next) => {
  try {
    const predictions = await predictRisk();
    res.json(predictions);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /predict/{zoneId}:
 *   get:
 *     summary: Récupère la prédiction pour une zone spécifique (Utilisateurs authentifiés)
 *     tags: [Prediction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: zoneId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la zone
 *     responses:
 *       200:
 *         description: Prédiction pour la zone
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prediction'
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès interdit (rôle insuffisant)
 *       404:
 *         description: Zone non trouvée
 */
// Prédiction pour une zone spécifique
router.get('/:zoneId', authMiddleware, checkRole(['user', 'admin']), async (req, res, next) => {
  const zoneId = parseInt(req.params.zoneId, 10);
  if (isNaN(zoneId) || zoneId <= 0) return next({ status: 400, message: 'zoneId invalide' });
  try {
    const predictions = await predictRisk(zoneId);
    if (predictions.length > 0) res.json(predictions[0]);
    else next({ status: 404, message: 'Zone non trouvée pour la prédiction' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
