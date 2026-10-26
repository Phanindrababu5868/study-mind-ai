import express from 'express'
import { body } from 'express-validator'
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
import { runValidation } from '../middleware/validate.js'

const router=express.Router()

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

// All fields optional — only the ones sent are checked and updated
const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),

  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('ageRange')
    .optional()
    .isIn(AGE_RANGES)
    .withMessage('Please provide a valid age range'),

  body('occupation')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Occupation cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Occupation must be no more than 120 characters'),

  body('profileImage')
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Profile image must be a valid http(s) URL'),
];

// Strength rules for newPassword are checked in the controller
// (validatePassword), which also returns the failed rules to the UI.
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Please provide your current password'),

  body('newPassword')
    .notEmpty()
    .withMessage('Please provide a new password'),
];

// Public routes
router.post('/register',authLimiter, registerValidation, runValidation, register);
router.post('/login',authLimiter, loginValidation, runValidation, login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidation, runValidation, updateProfile);
router.post('/change-password', protect, changePasswordValidation, runValidation, changePassword);

export default router