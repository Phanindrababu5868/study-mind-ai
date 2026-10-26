import express from 'express';
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

const router = express.Router();

router.use(protect);

router.post('/generate-flashcards', aiLimiter, generateFlashcards);
router.post('/generate-quiz', aiLimiter, generateQuiz);
router.post('/generate-summary', aiLimiter, generateSummary);
router.post('/chat', aiLimiter, chat);
router.post('/explain-concept', aiLimiter, explainConcept);
router.get('/chat-history/:documentId', getChatHistory);

export default router;