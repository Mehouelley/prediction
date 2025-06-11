const express = require('express');
const router = express.Router();
const { predictRisk } = require('../services/predictService');
const { param, validationResult } = require('express-validator');
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
// Validation middleware pour :zoneId
const validatePredict = [
  param('zoneId').optional().isInt({ gt: 0 }).withMessage('zoneId doit être un entier positif'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

// Prédiction pour toutes les zones
router.get('/', authMiddleware, checkRole(['user', 'admin']), async (req, res) => {
  try {
    const predictions = await predictRisk();
    res.json(predictions);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la prédiction' });
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
router.get('/:zoneId', authMiddleware, checkRole(['user', 'admin']), validatePredict, async (req, res) => {
  try {
    const predictions = await predictRisk(req.params.zoneId);
    if (predictions.length > 0) {
      res.json(predictions[0]);
    } else {
      res.status(404).json({ error: 'Zone non trouvée pour la prédiction' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la prédiction de la zone' });
  }
});

module.exports = router;
