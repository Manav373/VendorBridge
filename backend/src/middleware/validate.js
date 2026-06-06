const { badRequest } = require('../utils/apiResponse');

/**
 * Joi validation middleware factory
 * @param {import('joi').Schema} schema - Joi schema object
 * @param {'body'|'query'|'params'} target - Request property to validate
 */
const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return badRequest(res, 'Validation failed', errors);
    }

    req[target] = value;
    next();
  };
};

module.exports = { validate };
