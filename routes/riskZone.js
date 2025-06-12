const express = require('express');
const router = express.Router();
const { RiskZone } = require('../models');
const Joi = require('joi');
const { validateBody } = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

/**
 * @swagger
 * tags:
 *   name: RiskZones
 *   description: Gestion des zones à risque
 */

// Middleware de validation
const zoneSchema = Joi.object({
  name: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  riskLevel: Joi.number().integer().min(0).default(0)
});

/**
 * @swagger
 * /zones:
 *   get:
 *     summary: Récupère toutes les zones à risque
 *     tags: [RiskZones]
 *     responses:
 *       200:
 *         description: Liste des zones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RiskZone'
 */
// Récupérer toutes les zones à risque
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const zones = await RiskZone.findAll();
    res.json(zones);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /zones/{id}:
 *   get:
 *     summary: Récupère une zone par ID
 *     tags: [RiskZones]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la zone
 *     responses:
 *       200:
 *         description: Détails de la zone
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RiskZone'
 *       404:
 *         description: Zone non trouvée
 */
// Récupérer une zone par ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) return next({ status: 400, message: 'ID invalide' });
  try {
    const zone = await RiskZone.findByPk(id);
    if (zone) res.json(zone);
    else next({ status: 404, message: 'Zone non trouvée' });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /zones:
 *   post:
 *     summary: Crée une nouvelle zone à risque (Admin seulement)
 *     tags: [RiskZones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RiskZone'
 *     responses:
 *       201:
 *         description: Zone créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RiskZone'
 *       400:
 *         description: Requête invalide
 *       403:
 *         description: Accès interdit (rôle insuffisant)
 */
// Créer une nouvelle zone à risque
router.post('/', authMiddleware, checkRole('admin'), validateBody(zoneSchema), async (req, res, next) => {
  try {
    const newZone = await RiskZone.create(req.body);
    res.status(201).json(newZone);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /zones/{id}:
 *   put:
 *     summary: Met à jour une zone à risque (Admin seulement)
 *     tags: [RiskZones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la zone
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RiskZone'
 *     responses:
 *       200:
 *         description: Zone mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RiskZone'
 *       400:
 *         description: Requête invalide
 *       403:
 *         description: Accès interdit (rôle insuffisant)
 *       404:
 *         description: Zone non trouvée
 */
// Mettre à jour une zone à risque
router.put('/:id', authMiddleware, checkRole('admin'), validateBody(zoneSchema), async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) return next({ status: 400, message: 'ID invalide' });
  try {
    const [updated] = await RiskZone.update(req.body, { where: { id } });
    if (updated) {
      const updatedZone = await RiskZone.findByPk(id);
      res.json(updatedZone);
    } else next({ status: 404, message: 'Zone non trouvée' });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /zones/{id}:
 *   delete:
 *     summary: Supprime une zone à risque (Admin seulement)
 *     tags: [RiskZones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la zone
 *     responses:
 *       200:
 *         description: Zone supprimée avec succès
 *       403:
 *         description: Accès interdit (rôle insuffisant)
 *       404:
 *         description: Zone non trouvée
 */
// Supprimer une zone à risque
router.delete('/:id', authMiddleware, checkRole('admin'), async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) return next({ status: 400, message: 'ID invalide' });
  try {
    const deleted = await RiskZone.destroy({ where: { id } });
    if (deleted) res.json({ message: 'Zone supprimée' });
    else next({ status: 404, message: 'Zone non trouvée' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
