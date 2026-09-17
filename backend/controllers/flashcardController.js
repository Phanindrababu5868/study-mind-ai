import Flashcard from '../models/Flashcard.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';

// @desc    Get all flashcards for a document
// @route   GET /api/flashcards/:documentId
// @access  Private
export const getFlashcards = async (req, res, next) => {
   try {
   const { page, limit, skip } = getPagination(req);
    const filter = {
       userId: req.user._id,
       documentId: req.params.documentId
   }

    const [flashcards, total] = await Promise.all([
      Flashcard.find(filter)
        .populate('documentId', 'title fileName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Flashcard.countDocuments(filter),
    ]);

     res.status(200).json({
       success: true,
       count: flashcards.length,
      pagination: buildPaginationMeta(page, limit, total),
       data: flashcards
     });
   } catch (error) {
     next(error);
   }
 };


// @desc    Get all flashcard sets for a user
// @route   GET /api/flashcards
// @access  Private
export const getAllFlashcardSets = async (req, res, next) => {
   try {

    const { page, limit, skip } = getPagination(req);
    const filter = { userId: req.user._id };

    const [flashcardSets, total] = await Promise.all([
      Flashcard.find(filter)
        .populate('documentId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
       .limit(limit),
      Flashcard.countDocuments(filter),
    ]);

     res.status(200).json({
       success: true,
       count: flashcardSets.length,
      pagination: buildPaginationMeta(page, limit, total),
       data: flashcardSets,
     });
   } catch (error) {
     next(error);
   }
 };



// @desc    Mark flashcard as reviwed
// @route   POST /api/flashcards/:cardId/review
// @access  Private
export const reviewFlashcard = async (req, res, next) => {
  try {
    const flashcardSet = await Flashcard.findOne({
      'cards._id': req.params.cardId,
      userId: req.user._id
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        error: 'Flashcard set or card not found',
        statusCode: 404
      });
    }

    const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === req.params.cardId);

    if (cardIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Card not found in set',
        statusCode: 404})
      }

    flashcardSet.cards[cardIndex].lastReviewed=new Date()
    flashcardSet.cards[cardIndex].reviewCount+=1

    await flashcardSet.save()

    res.status(200).json({
      success: true,
      message: 'flashcard reviewd succefully',
      data: flashcardSet,
    });
    }
    catch(error){
      next(error);
    }
}



// @desc    Toggle star/favorite on card
// @route   PUT /api/flashcards/:cardId/star
// @access  Private
export const toggleStarFlashcard = async (req, res, next) => {
  try {
    const flashcardSet = await Flashcard.findOne({
      'cards._id': req.params.cardId,
      userId: req.user._id
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        error: 'Flashcard set or card not found',
        statusCode: 404
      });
    }

    const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === req.params.cardId);

    if (cardIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Card not found in set',
        statusCode: 404
      });
    }

    // Toggle star
    flashcardSet.cards[cardIndex].isStarred = !flashcardSet.cards[cardIndex].isStarred;

    await flashcardSet.save()

    res.status(200).json({
      success: true,
      message: `Flashcard ${flashcardSet.cards[cardIndex].isStarred?'starred':'unStarred'}`,
      data: flashcardSet,
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Delete flashcard set
// @route   DELETE /api/flashcards/:id
// @access  Private
export const deleteFlashcardSet = async (req, res, next) => {
  try {
    const flashcardSet = await Flashcard.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        error: 'Flashcard set not found',
        statusCode: 404
      });
    }

    await flashcardSet.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Flashcard set deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};