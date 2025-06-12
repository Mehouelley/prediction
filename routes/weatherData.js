const express = require('express');
const router = express.Router();
const { WeatherData, RiskZone } = require('../models');
const Joi = require('joi');
const { validateBody } = require('../middleware/validate');
// Middlewares
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Joi schema pour WeatherData
const weatherSchema = Joi.object({
  zoneId: Joi.number().integer().positive().required(),
  timestamp: Joi.date().iso().required(),
  temperature: Joi.number().optional(),
  humidity: Joi.number().optional(),
  windSpeed: Joi.number().optional()
});

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
router.get('/', authMiddleware, checkRole(['user', 'admin']), async (req, res, next) => {
  try {
    const data = await WeatherData.findAll({ include: [RiskZone] });
    res.json(data);
  } catch (err) {
    next(err);
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
router.get('/zone/:zoneId', authMiddleware, checkRole(['user', 'admin']), async (req, res, next) => {
  const zoneId = parseInt(req.params.zoneId, 10);
  if (isNaN(zoneId) || zoneId <= 0) return next({ status: 400, message: 'zoneId invalide' });
  try {
    const entries = await WeatherData.findAll({
      where: { zoneId },
      order: [['timestamp', 'DESC']]
    });
    res.json(entries);
  } catch (err) {
    next(err);
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
router.get('/:id', authMiddleware, checkRole(['user', 'admin']), async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) return next({ status: 400, message: 'ID invalide' });
  try {
    const entry = await WeatherData.findByPk(id, { include: [RiskZone] });
    if (entry) res.json(entry);
    else next({ status: 404, message: 'Donnée météo non trouvée' });
  } catch (err) {
    next(err);
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
router.post('/', authMiddleware, checkRole('admin'), validateBody(weatherSchema), async (req, res, next) => {
  try {
    const newEntry = await WeatherData.create(req.body);
    res.status(201).json(newEntry);
  } catch (err) {
    next(err);
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
router.put('/:id', authMiddleware, checkRole('admin'), validateBody(weatherSchema), async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) return next({ status: 400, message: 'ID invalide' });
  try {
    const [updated] = await WeatherData.update(req.body, { where: { id } });
    if (updated) {
      const updatedEntry = await WeatherData.findByPk(id);
      res.json(updatedEntry);
    } else next({ status: 404, message: 'Donnée météo non trouvée' });
  } catch (err) {
    next(err);
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
router.delete('/:id', authMiddleware, checkRole('admin'), async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) return next({ status: 400, message: 'ID invalide' });
  try {
    const deleted = await WeatherData.destroy({ where: { id } });
    if (deleted) res.json({ message: 'Donnée météo supprimée' });
    else next({ status: 404, message: 'Donnée météo non trouvée' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
