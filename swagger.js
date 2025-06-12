const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Prédiction de Catastrophes',
      version: '1.0.0',
      description: 'Documentation des endpoints de l’API de prédiction de catastrophes naturelles'
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 3000}` }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Clé API fournie à l’utilisateur'
        }
      },
      schemas: {
        RiskZone: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Zone A' },
            latitude: { type: 'number', example: 48.8566 },
            longitude: { type: 'number', example: 2.3522 },
            riskLevel: { type: 'integer', example: 2 }
          }
        },
        WeatherData: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            zoneId: { type: 'integer', example: 1 },
            timestamp: { type: 'string', format: 'date-time' },
            temperature: { type: 'number', example: 20.5 },
            humidity: { type: 'number', example: 75 },
            windSpeed: { type: 'number', example: 5.4 }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            phoneNumber: { type: 'string', example: '+33123456789' },
            zoneId: { type: 'integer', example: 1 }
          }
        },
        Prediction: {
          type: 'object',
          properties: {
            zoneId: { type: 'integer', example: 1 },
            zoneName: { type: 'string', example: 'Zone A' },
            riskLevel: { type: 'number', example: 0.45 },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        RegisterRequest: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            role: { type: 'string', enum: ['user', 'admin'] }
          },
          required: ['email', 'password']
        },
        LoginRequest: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' }
          },
          required: ['email', 'password']
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                email: { type: 'string' },
                role: { type: 'string' },
                apiKey: { type: 'string' }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    security: [
      { bearerAuth: [] },
      { apiKeyAuth: [] }
    ]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = { swaggerUI, swaggerSpec };
