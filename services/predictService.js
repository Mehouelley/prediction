const { RiskZone, WeatherData } = require('../models');
let tf;
try {
  tf = require('@tensorflow/tfjs-node');
} catch {
  tf = require('@tensorflow/tfjs');
}
const { loadModel } = require('./trainService');

let model = null;
async function ensureModelLoaded() {
  if (!model) {
    try { model = await loadModel(); }
    catch { model = null; }
  }
}

// Fonction de prédiction basique (placeholder)
async function predictRisk(zoneId) {
  await ensureModelLoaded();
  const useModel = !!model;
  const zones = zoneId
    ? await RiskZone.findAll({ where: { id: zoneId } })
    : await RiskZone.findAll();

  const predictions = [];
  for (const zone of zones) {
    // Récupérer la dernière donnée météo
    const data = await WeatherData.findOne({
      where: { zoneId: zone.id },
      order: [['timestamp', 'DESC']],
    });

    let risk = 0;
    if (data) {
      const features = [data.temperature || 0, data.humidity || 0, data.windSpeed || 0];
      if (useModel) {
        const input = tf.tensor2d([features]);
        risk = (await model.predict(input).data())[0];
        input.dispose();
      } else {
        // Heuristique simple : vent et faible humidité
        const windFactor = features[2] / 40; // normalisé
        const humidityFactor = (100 - features[1]) / 100; // plus l'humidité est basse, plus le risque est élevé
        risk = Math.min(1, windFactor * 0.7 + humidityFactor * 0.3);
      }
    }

    predictions.push({
      zoneId: zone.id,
      zoneName: zone.name,
      riskLevel: risk,
      timestamp: data ? data.timestamp : null,
    });
  }
  return predictions;
}

module.exports = { predictRisk };
