import { body, param, validationResult } from 'express-validator';

// express-validator's checks only *collect* errors on the request — they
// don't reject anything by themselves. This middleware is what actually
// turns those into a 400 response.
export const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
      statusCode: 400,
    });
  }
  next();
};

// Rejects malformed ids up front with a clear 400, instead of letting
// Mongoose throw a CastError deeper in the controller.
export const validId = (name, location = param) =>
  location(name).isMongoId().withMessage(`Invalid ${name}`);

export const validTitle = (field = 'title') =>
  body(field)
    .isString()
    .withMessage('Title must be text')
    .trim()
    .notEmpty()
    .withMessage('Please provide a title')
    .isLength({ max: 200 })
    .withMessage('Title must be no more than 200 characters');
