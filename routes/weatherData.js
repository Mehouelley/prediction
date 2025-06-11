const express = require('express');
const router = express.Router();
const { WeatherData, RiskZone } = require('../models');
const { body, param, validationResult } = require('express-validator');
// Middlewares
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

/**
 * @swagger
 * tags:
 *   name: WeatherData
 *   description: Gestion des relevés météo
 */

/**
 * @swagger
 * /weather:
 *   get:
 *     summary: Récupère tous les relevés météo
 *     tags: [WeatherData]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des relevés
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WeatherData'
 */
// Middleware de validation
const validateWeather = [
  body('zoneId').isInt({ gt: 0 }).withMessage('zoneId doit être un entier positif'),
  body('timestamp').isISO8601().withMessage('timestamp invalide'),
  body('temperature').optional().isFloat().withMessage('temperature invalide'),
  body('humidity').optional().isFloat().withMessage('humidity invalide'),
  body('windSpeed').optional().isFloat().withMessage('windSpeed invalide'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

/**
 * @swagger
 * /weather:
 *   get:
 *     summary: Récupère tous les relevés météo
 *     tags: [WeatherData]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des relevés
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WeatherData'
 */
router.get('/', authMiddleware, checkRole(['user', 'admin']), async (req, res) => {
  try {
    const data = await WeatherData.findAll({ include: [RiskZone] });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des données météo' });
  }
});

/**
 * @swagger
 * /weather/zone/{zoneId}:
 *   get:
 *     summary: Récupère les relevés météo pour une zone
 *     tags: [WeatherData]
 *     parameters:
 *       - in: path
 *         name: zoneId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la zone
 *     responses:
 *       200:
 *         description: Liste des relevés pour la zone
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WeatherData'
 */
router.get('/zone/:zoneId', authMiddleware, checkRole(['user', 'admin']), async (req, res) => {
  try {
    const entries = await WeatherData.findAll({
      where: { zoneId: req.params.zoneId },
      order: [['timestamp', 'DESC']]
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des données pour la zone' });
  }
});

/**
 * @swagger
 * /weather/{id}:
 *   get:
 *     summary: Récupère un relevé météo par ID
 *     tags: [WeatherData]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du relevé
 *     responses:
 *       200:
 *         description: Détail du relevé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeatherData'
 *       404:
 *         description: Relevé non trouvé
 */
router.get('/:id', authMiddleware, checkRole(['user', 'admin']), async (req, res) => {
  try {
    const entry = await WeatherData.findByPk(req.params.id, { include: [RiskZone] });
    if (entry) res.json(entry);
    else res.status(404).json({ error: 'Donnée météo non trouvée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la donnée' });
  }
});

/**
 * @swagger
 * /weather:
 *   post:
 *     summary: Crée un nouveau relevé météo (Admin seulement)
 *     tags: [WeatherData]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WeatherData'
 *     responses:
 *       201:
 *         description: Relevé créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeatherData'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès interdit (rôle insuffisant)
 */
router.post('/', authMiddleware, checkRole('admin'), validateWeather, async (req, res) => {
  try {
    const { zoneId, timestamp, temperature, humidity, windSpeed } = req.body;
    const newEntry = await WeatherData.create({ zoneId, timestamp, temperature, humidity, windSpeed });
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(400).json({ error: 'Erreur lors de la création de la donnée météo' });
  }
});

/**
 * @swagger
 * /weather/{id}:
 *   put:
 *     summary: Met à jour un relevé météo (Admin seulement)
 *     tags: [WeatherData]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du relevé
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WeatherData'
 *     responses:
 *       200:
 *         description: Relevé mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès interdit (rôle insuffisant)
 *       404:
 *         description: Relevé non trouvé
 */
router.put('/:id', authMiddleware, checkRole('admin'), validateWeather, async (req, res) => {
  try {
    const { zoneId, timestamp, temperature, humidity, windSpeed } = req.body;
    const updatedEntry = await WeatherData.update(
      { zoneId, timestamp, temperature, humidity, windSpeed },
      { where: { id: req.params.id } }
    );
    if (updatedEntry[0] !== 0) res.json({ message: 'Donnée météo mise à jour' });
    else res.status(404).json({ error: 'Donnée météo non trouvée' });
  } catch (err) {
    res.status(400).json({ error: 'Erreur lors de la mise à jour de la donnée météo' });
  }
});

/**
 * @swagger
 * /weather/{id}:
 *   delete:
 *     summary: Supprime un relevé météo (Admin seulement)
 *     tags: [WeatherData]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du relevé
 *     responses:
 *       204:
 *         description: Relevé supprimé
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès interdit (rôle insuffisant)
 *       404:
 *         description: Relevé non trouvé
 */
router.delete('/:id', authMiddleware, checkRole('admin'), async (req, res) => {
  try {
    const deleted = await WeatherData.destroy({ where: { id: req.params.id } });
    if (deleted) res.json({ message: 'Donnée supprimée' });
    else res.status(404).json({ error: 'Donnée météo non trouvée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la donnée' });
  }
});

module.exports = router;
