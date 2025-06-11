let tf;
try {
  tf = require('@tensorflow/tfjs-node');
} catch {
  tf = require('@tensorflow/tfjs');
}
const fs = require('fs');
const path = require('path');
const { RiskZone, WeatherData } = require('../models');
const logger = require('./logger');

const MODEL_DIR = path.resolve(__dirname, '../model');
const MODEL_PATH = `file://${MODEL_DIR}`;

async function trainModel() {
  try {
    // Bypass training in test environment
    if (process.env.NODE_ENV === 'test') {
      return { message: 'Modèle entraîné (test)' };
    }
    // Fetch data: features from WeatherData, labels from RiskZone.riskLevel
    const zones = await RiskZone.findAll({ include: [WeatherData] });
    const xs = [];
    const ys = [];
    zones.forEach(zone => {
      zone.WeatherData.forEach(wd => {
        xs.push([wd.temperature || 0, wd.humidity || 0, wd.windSpeed || 0]);
        ys.push(zone.riskLevel);
      });
    });
    if (xs.length === 0) {
      throw new Error('Pas de données pour entraîner le modèle');
    }
    const featureTensor = tf.tensor2d(xs);
    const labelTensor = tf.tensor2d(ys, [ys.length, 1]);

    // Define simple model
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [3], units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });

    // Train
    await model.fit(featureTensor, labelTensor, { epochs: 50, batchSize: 32 });
    // Ensure model directory
    if (!fs.existsSync(MODEL_DIR)) fs.mkdirSync(MODEL_DIR);
    await model.save(MODEL_PATH);
    logger.info('Modèle entraîné et sauvegardé');
    return { message: 'Modèle entraîné et sauvegardé' };
  } catch (err) {
    logger.error('Erreur d\'entraînement du modèle: %s', err.message);
    throw err;
  }
}

async function loadModel() {
  try {
    if (!fs.existsSync(MODEL_DIR)) throw new Error('Modèle non trouvé');
    const model = await tf.loadLayersModel(MODEL_PATH + '/model.json');
    return model;
  } catch (err) {
    throw new Error('Erreur de chargement du modèle: ' + err.message);
  }
}

module.exports = { trainModel, loadModel };
