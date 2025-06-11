// Configuration Sequelize
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config.js'); // Charger la configuration

const env = process.env.NODE_ENV || 'development';

let sequelize;
if (env === 'test') {
  // Utiliser SQLite en mémoire pour les tests
  sequelize = new Sequelize('sqlite::memory:', { logging: false });
} else if (config[env].use_env_variable) {
  sequelize = new Sequelize(process.env[config[env].use_env_variable], config[env]);
} else {
  sequelize = new Sequelize(
    config[env].database,
    config[env].username,
    config[env].password,
    config[env]
  );
}

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.DataTypes = DataTypes;

// Exemple d'import de modèles : 
db.RiskZone = require('./riskZone')(sequelize, DataTypes);
db.WeatherData = require('./weatherData')(sequelize, DataTypes);
db.Subscription = require('./subscription')(sequelize, DataTypes);
db.User = require('./user')(sequelize, DataTypes);

// Exécution des associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
