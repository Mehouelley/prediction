const axios = require('axios');
const cron = require('node-cron');
const { RiskZone, WeatherData } = require('../models');
const logger = require('./logger');

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Fonction pour récupérer et stocker les données météo pour chaque zone
async function fetchAndStoreWeather() {
  try {
    const zones = await RiskZone.findAll();
    for (const zone of zones) {
      const { latitude, longitude, id: zoneId } = zone;
      const url = `${BASE_URL}?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`;
      const response = await axios.get(url);
      const data = response.data;
      await WeatherData.create({
        zoneId,
        timestamp: new Date(),
        temperature: data.main.temp,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed
      });
    }
    logger.info('Données météo mises à jour');
  } catch (err) {
    logger.error('Erreur lors de l\'ingestion météo : %s', err.message);
  }
}

// Planifier l'exécution toutes les 30 minutes
function scheduleWeatherJob() {
  cron.schedule('*/30 * * * *', () => {
    logger.info('Lancement de la tâche d\'ingestion météo');
    fetchAndStoreWeather();
  });
}

module.exports = {
  fetchAndStoreWeather,
  scheduleWeatherJob
};
