require('dotenv').config();
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const cron = require('node-cron');
const { predictRisk } = require('./predictService');
const { Subscription } = require('../models');
const logger = require('./logger');

const THRESHOLD = parseFloat(process.env.NOTIFICATION_THRESHOLD) || 0.7;

// Configureur Nodemailer
const mailer = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Configureur Twilio avec gestion d'erreur
let twilioClient;
try {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
} catch (err) {
  logger.warn(`Twilio client init failed: ${err.message}`);
  twilioClient = null;
}

async function notifySubscribers() {
  try {
    const predictions = await predictRisk();
    for (const { zoneId, zoneName, riskLevel, timestamp } of predictions) {
      if (riskLevel >= THRESHOLD) {
        const subs = await Subscription.findAll({ where: { zoneId } });
        for (const sub of subs) {
          const message = `Alerte: zone ${zoneName} à risque ${(riskLevel*100).toFixed(1)}%`;
          // Email
          if (sub.email) {
            await mailer.sendMail({
              from: process.env.EMAIL_USER,
              to: sub.email,
              subject: `Alerte catastrophes - ${zoneName}`,
              text: `${message} au ${timestamp}`
            });
          }
          // SMS uniquement si twilioClient initialisé
          if (sub.phoneNumber && twilioClient) {
            await twilioClient.messages.create({
              from: process.env.TWILIO_FROM_NUMBER,
              to: sub.phoneNumber,
              body: `${message} au ${timestamp}`
            });
          }
          logger.info(`Notification envoyée à ${sub.email || sub.phoneNumber} pour zone ${zoneName}`);
        }
      }
    }
  } catch (err) {
    logger.error('Erreur lors de l\'envoi des notifications : %s', err.message);
  }
}

function scheduleNotificationJob() {
  cron.schedule('*/30 * * * *', () => {
    logger.info('Lancement de la tâche de notification');
    notifySubscribers();
  });
}

module.exports = { notifySubscribers, scheduleNotificationJob };
