// Skip validation when running under Jest
const isTest = !!process.env.JEST_WORKER_ID;
require('dotenv').config();

if (!isTest) {
  const Joi = require('joi');
  const envSchema = Joi.object({
    PORT: Joi.number().default(3000),
    DB_HOST: Joi.string().required(),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().allow('').required(),
    DB_NAME: Joi.string().required(),
    OPENWEATHER_API_KEY: Joi.string().required(),
    CORS_ORIGIN: Joi.string().uri().required(),
    EMAIL_HOST: Joi.string().required(),
    EMAIL_PORT: Joi.number().required(),
    EMAIL_USER: Joi.string().required(),
    EMAIL_PASS: Joi.string().required(),
    TWILIO_ACCOUNT_SID: Joi.string().pattern(/^AC/).required(),
    TWILIO_AUTH_TOKEN: Joi.string().required(),
    TWILIO_FROM_NUMBER: Joi.string().required(),
    NOTIFICATION_THRESHOLD: Joi.number().min(0).max(1).default(0.7),
    API_KEY: Joi.string().required().description('Clé API pour authentification via header x-api-key'),
    JWT_SECRET: Joi.string().required().description('Secret pour signature des JWT'),
    TOKEN_EXPIRATION: Joi.string().default('1h').description('Durée de validité du JWT')
  }).unknown();

  const { error, value: envVars } = envSchema.validate(process.env);
  if (error) {
    throw new Error(`Configuration ENV invalide: ${error.message}`);
  }
  Object.assign(process.env, envVars);
}