import express from 'express';
import { body } from 'express-validator';
import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  chat,
  explainConcept,
  getChatHistory
} from '../controllers/aiController.js';
import protect from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { runValidation, validId } from '../middleware/validate.js';

const router = express.Router();

const documentIdInBody = validId('documentId', body);

// Matches MAX_GENERATE_COUNT in aiController
const countField = (field) =>
  body(field)
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage(`${field} must be a whole number between 1 and 30`);

const textField = (field, max) => {
  const label = field[0].toUpperCase() + field.slice(1);
  return body(field)
    .isString()
    .withMessage(`Please provide a ${field}`)
    .trim()
    .notEmpty()
    .withMessage(`Please provide a ${field}`)
    .isLength({ max })
    .withMessage(`${label} must be no more than ${max} characters`);
};

router.use(protect);

router.post('/generate-flashcards', aiLimiter, documentIdInBody, countField('count'), runValidation, generateFlashcards);
router.post(
  '/generate-quiz',
  aiLimiter,
  documentIdInBody,
  countField('numQuestions'),
  body('title').optional().isString().trim().isLength({ max: 200 }).withMessage('Title must be no more than 200 characters'),
  runValidation,
  generateQuiz
);
router.post('/generate-summary', aiLimiter, documentIdInBody, runValidation, generateSummary);
router.post('/chat', aiLimiter, documentIdInBody, textField('question', 2000), runValidation, chat);
router.post('/explain-concept', aiLimiter, documentIdInBody, textField('concept', 500), runValidation, explainConcept);
router.get('/chat-history/:documentId', validId('documentId'), runValidation, getChatHistory);

export default router;
