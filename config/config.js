require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql'
  },
  test: {
    username: process.env.DB_USER_TEST || process.env.DB_USER, // Utilise DB_USER_TEST si défini, sinon DB_USER
    password: process.env.DB_PASSWORD_TEST || process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST || `${process.env.DB_NAME}_test`, // Suffixe _test par défaut
    host: process.env.DB_HOST_TEST || process.env.DB_HOST,
    dialect: 'mysql',
    logging: false // Désactiver les logs SQL pour les tests
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql'
  }
};
