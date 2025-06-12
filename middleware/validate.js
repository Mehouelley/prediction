const Joi = require('joi');

// Middleware pour valider req.body avec un schéma Joi
function validateBody(schema) {
  return (req, res, next) => {
    req.body = req.body || {};
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      error.isJoi = true;
      return next(error);
    }
    req.body = value;
    next();
  };
}

module.exports = { validateBody };
