const express = require('express');
const Joi = require('joi');
const { validateBody } = require('../middleware/validate');
const router = express.Router();
const { Subscription, RiskZone, User } = require('../models');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Joi schema pour Subscription
const subscriptionSchema = Joi.object({
  email: Joi.string().email().allow(null, ''),
  phoneNumber: Joi.string().pattern(/^\+?[0-9]{7,15}$/).allow(null, ''),
  zoneId: Joi.number().integer().positive().required()
}).xor('email','phoneNumber').messages({
  'object.missing': 'Au moins un email ou un numéro de téléphone doit être fourni.'
});

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Gestion des abonnements aux alertes
 */

/**
 * @swagger
 * /subscriptions:
 *   get:
 *     summary: Récupère tous les abonnements (Admin seulement)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des abonnements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subscription'
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès interdit (rôle insuffisant)
 */
router.get('/', authMiddleware, checkRole('admin'), async (req, res, next) => {
  try {
    const subs = await Subscription.findAll({ 
      include: [
        { model: RiskZone, as: 'zone' },
        { model: User, as: 'user', attributes: ['id', 'email'] }
      ]
    });
    res.json(subs);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /subscriptions/my:
 *   get:
 *     summary: Récupère les abonnements de l'utilisateur authentifié
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des abonnements de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subscription'
 *       401:
 *         description: Token manquant ou invalide
 */
router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const subs = await Subscription.findAll({ 
      where: { userId: req.user.id },
      include: [ { model: RiskZone, as: 'zone' } ]
    });
    res.json(subs);
  } catch (err) {
    next(err);
  }
});


/**
 * @swagger
 * /subscriptions/{id}:
 *   get:
 *     summary: Récupère un abonnement par ID
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'abonnement
 *     responses:
 *       200:
 *         description: Détail de l'abonnement
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Abonnement non trouvé
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const sub = await Subscription.findByPk(req.params.id, { 
      include: [ { model: RiskZone, as: 'zone' } ]
    });
    if (!sub) return res.status(404).json({ error: 'Abonnement non trouvé' });

    // Vérification des permissions
    if (req.user.role !== 'admin' && sub.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès interdit à cette ressource.' });
    }
    res.json(sub);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /subscriptions:
 *   post:
 *     summary: Crée un nouvel abonnement pour l'utilisateur authentifié
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - zoneId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *               zoneId:
 *                 type: integer
 *             example:
 *               email: "user@example.com"
 *               phoneNumber: "+1234567890"
 *               zoneId: 1
 *     responses:
 *       201:
 *         description: Abonnement créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Requête invalide
 *       401:
 *         description: Token manquant ou invalide
 */
router.post('/', authMiddleware, validateBody(subscriptionSchema), async (req, res, next) => {
  try {
    const { email, phoneNumber, zoneId } = req.body;
    const userId = req.user.id; // ID de l'utilisateur authentifié

    // Vérifier si la zone existe
    const zone = await RiskZone.findByPk(zoneId);
    if (!zone) {
        return res.status(404).json({ error: 'Zone à risque non trouvée.' });
    }

    // Vérifier si un abonnement similaire existe déjà pour cet utilisateur et cette zone
    const existingSubscription = await Subscription.findOne({
        where: { userId, zoneId }
    });
    if (existingSubscription) {
        return res.status(409).json({ error: 'Un abonnement existe déjà pour cette zone et cet utilisateur.' });
    }

    const newSubData = {
        email: email || null, // Mettre null si non fourni pour éviter les chaînes vides
        phoneNumber: phoneNumber || null,
        zoneId,
        userId
    };

    const newSub = await Subscription.create(newSubData);
    const subWithDetails = await Subscription.findByPk(newSub.id, {
      include: [
        { model: RiskZone, as: 'zone' },
        { model: User, as: 'user', attributes: ['id', 'email'] }
      ]
    });
    res.status(201).json(subWithDetails);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /subscriptions/{id}:
 *   put:
 *     summary: Met à jour un abonnement existant
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'abonnement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *               zoneId: # On ne permet pas de changer zoneId directement, l'utilisateur devrait supprimer et recréer
 *                 type: integer 
 *                 readOnly: true # Indique que ce champ ne devrait pas être modifié ici
 *             example:
 *               email: "new_user@example.com"
 *               phoneNumber: "+1987654321"
 *     responses:
 *       200:
 *         description: Abonnement mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Requête invalide
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Abonnement non trouvé
 */
router.put('/:id', authMiddleware, validateBody(subscriptionSchema), async (req, res, next) => {
  try {
    const sub = await Subscription.findByPk(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Abonnement non trouvé' });

    // Vérification des permissions
    if (req.user.role !== 'admin' && sub.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès interdit à cette ressource.' });
    }
    
    // Empêcher la modification de zoneId et userId par cette route
    const { zoneId, userId, ...updateData } = req.body;
    if (zoneId && zoneId !== sub.zoneId) {
        return res.status(400).json({ error: "La modification de zoneId n'est pas autorisée. Veuillez supprimer et recréer l'abonnement pour une nouvelle zone." });
    }


    const [updatedCount] = await Subscription.update(updateData, { where: { id: req.params.id } });
    if (updatedCount === 0) { // Devrait être redondant avec la vérification findByPk mais bonne pratique
        return res.status(404).json({ error: 'Abonnement non trouvé ou aucune donnée à mettre à jour.' });
    }
    
    const updatedSub = await Subscription.findByPk(req.params.id, {
      include: [
        { model: RiskZone, as: 'zone' },
        { model: User, as: 'user', attributes: ['id', 'email'] }
      ]
    });
    res.json(updatedSub);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /subscriptions/{id}:
 *   delete:
 *     summary: Supprime un abonnement
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'abonnement
 *     responses:
 *       204:
 *         description: Abonnement supprimé
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Abonnement non trouvé
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const sub = await Subscription.findByPk(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Abonnement non trouvé' });

    // Vérification des permissions
    if (req.user.role !== 'admin' && sub.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès interdit à cette ressource.' });
    }

    await Subscription.destroy({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
