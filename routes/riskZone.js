const express = require('express');
const router = express.Router();
const { RiskZone } = require('../models');
const { body, param, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

/**
 * @swagger
 * tags:
 *   name: RiskZones
 *   description: Gestion des zones à risque
 */

// Middleware de validation
const validateZone = [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude invalide'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude invalide'),
  body('riskLevel').optional().isInt({ min: 0 }).withMessage('riskLevel doit être un entier positif'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

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
router.get('/', authMiddleware, async (req, res) => {
  try {
    const zones = await RiskZone.findAll();
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des zones' });
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
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const zone = await RiskZone.findByPk(req.params.id);
    if (zone) res.json(zone);
    else res.status(404).json({ error: 'Zone non trouvée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la zone' });
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
router.post('/', authMiddleware, checkRole('admin'), validateZone, async (req, res) => {
  try {
    const { name, latitude, longitude, riskLevel } = req.body;
    const newZone = await RiskZone.create({ name, latitude, longitude, riskLevel });
    res.status(201).json(newZone);
  } catch (err) {
    res.status(400).json({ error: 'Erreur lors de la création de la zone' });
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
router.put('/:id', authMiddleware, checkRole('admin'), validateZone, async (req, res) => {
  try {
    const { name, latitude, longitude, riskLevel } = req.body;
    const [updated] = await RiskZone.update(
      { name, latitude, longitude, riskLevel },
      { where: { id: req.params.id } }
    );
    if (updated) {
      const updatedZone = await RiskZone.findByPk(req.params.id);
      res.json(updatedZone);
    } else {
      res.status(404).json({ error: 'Zone non trouvée' });
    }
  } catch (err) {
    res.status(400).json({ error: 'Erreur lors de la mise à jour de la zone' });
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
router.delete('/:id', authMiddleware, checkRole('admin'), async (req, res) => {
  try {
    const deleted = await RiskZone.destroy({ where: { id: req.params.id } });
    if (deleted) res.json({ message: 'Zone supprimée avec succès' });
    else res.status(404).json({ error: 'Zone non trouvée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la zone' });
  }
});

module.exports = router;
