import express from 'express'
import { body, validationResult } from 'express-validator'
import {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword
} from '../controllers/authController.js'
import { AGE_RANGES } from '../models/User.js'
import { authLimiter } from '../middleware/rateLimiter.js'
import protect from '../middleware/auth.js'

const router=express.Router()

// express-validator's body() checks only *populate* errors on the request —
// they don't reject anything by themselves. This middleware is what
// actually turns those into a 400 response.
const runValidation = (req, res, next) => {
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

// Validation middleware
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must contain at least one special character'),

  body('ageRange')
    .isIn(AGE_RANGES)
    .withMessage('Please provide a valid age range'),

  body('occupation')
    .trim()
    .notEmpty()
    .withMessage('Occupation is required')
    .isLength({ max: 120 })
    .withMessage('Occupation must be no more than 120 characters'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Public routes
router.post('/register',authLimiter, registerValidation, runValidation, register);
router.post('/login',authLimiter, loginValidation, runValidation, login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

export default router