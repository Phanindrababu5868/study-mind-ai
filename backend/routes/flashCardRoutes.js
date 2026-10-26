import express from 'express';
import {
  getFlashcards,
  getAllFlashcardSets,
  reviewFlashcard,
  toggleStarFlashcard,
  deleteFlashcardSet,
} from '../controllers/flashcardController.js';
import protect from '../middleware/auth.js';
import { runValidation, validId } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllFlashcardSets);
router.get('/:documentId', validId('documentId'), runValidation, getFlashcards);
router.post('/:cardId/review', validId('cardId'), runValidation, reviewFlashcard);
router.put('/:cardId/star', validId('cardId'), runValidation, toggleStarFlashcard);
router.delete('/:id', validId('id'), runValidation, deleteFlashcardSet);

export default router;
