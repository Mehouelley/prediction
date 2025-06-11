const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const SALT_ROUNDS = 10;

async function register(email, password, role = 'user') {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new Error('Email déjà utilisé');
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, password: hash, role });
  return user;
}

async function login(email, password) {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('Utilisateur non trouvé');
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Mot de passe invalide');
  const payload = { id: user.id, email: user.email, role: user.role };
  // Fallback secret for tests
  const secret = process.env.JWT_SECRET || 'test-secret';
  const expiresIn = process.env.TOKEN_EXPIRATION || '1h';
  const token = jwt.sign(payload, secret, { expiresIn });
  return token;
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.verify(token, secret);
}

module.exports = { register, login, verifyToken };
