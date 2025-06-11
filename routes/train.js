const express = require('express');
const router = express.Router();
const { trainModel } = require('../services/trainService');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

/**
 * @swagger
 * /train:
 *   post:
 *     summary: Entraîne ou réentraine le modèle ML (Admin seulement)
 *     tags: [Machine Learning]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Modèle entraîné
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Modèle entraîné et sauvegardé
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès interdit (rôle insuffisant)
 *       500:
 *         description: Erreur d'entraînement
 */
router.post('/', authMiddleware, checkRole('admin'), async (req, res) => {
  try {
    const result = await trainModel();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
