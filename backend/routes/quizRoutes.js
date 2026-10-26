import express from 'express';
import { body } from 'express-validator';
import {
  getQuizzes,
  getQuizById,
  submitQuiz,
  getQuizResults,
  deleteQuiz
} from '../controllers/quizController.js';
import protect from '../middleware/auth.js';
import { runValidation, validId } from '../middleware/validate.js';

const router = express.Router();

// Shape check only — submitQuiz itself skips out-of-range/duplicate indexes
const submitValidation = [
  validId('id'),
  body('answers')
    .isArray({ max: 100 })
    .withMessage('Please provide answers array'),
];

// All routes are protected
router.use(protect);

router.get('/:documentId', validId('documentId'), runValidation, getQuizzes);
router.get('/quiz/:id', validId('id'), runValidation, getQuizById);
router.post('/:id/submit', submitValidation, runValidation, submitQuiz);
router.get('/:id/results', validId('id'), runValidation, getQuizResults);
router.delete('/:id', validId('id'), runValidation, deleteQuiz);

export default router;
