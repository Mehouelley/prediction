const express = require('express');
const Joi = require('joi');
const { validateBody } = require('../middleware/validate');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const { User } = require('../models');

const router = express.Router();
const isTest = process.env.NODE_ENV === 'test';

// Joi Schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user','admin')
});
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Enregistrer un nouvel utilisateur
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Erreur de validation ou email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validateBody(registerSchema), async (req, res) => {
     const { email, password, role } = req.body;
     try {
       const user = await authService.register(email, password, role);
       // Générer directement le token
       const secret = process.env.JWT_SECRET || 'test-secret';
       const expiresIn = process.env.TOKEN_EXPIRATION || '1h';
       const payload = { id: user.id, email: user.email, role: user.role, apiKey: user.apiKey };
       const token = jwt.sign(payload, secret, { expiresIn });
       return res.status(201).json({ token, user: payload });
     } catch (err) {
       return res.status(400).json({ error: err.message });
     }
   }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authentifier un utilisateur et obtenir un token JWT
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Authentification réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validateBody(loginSchema), async (req, res) => {
     const { email, password } = req.body;
     try {
       // Authentifier et générer le token
       const token = await authService.login(email, password);
       // Décoder le payload avec le fallback secret
       const payload = authService.verifyToken(token);
       // Récupérer la clé API depuis la base
       const userRecord = await User.findByPk(payload.id);
       return res.json({ token, user: { id: payload.id, email: payload.email, role: payload.role, apiKey: userRecord.apiKey } });
     } catch (err) {
       return res.status(401).json({ error: err.message });
     }
   }
);

module.exports = router;
