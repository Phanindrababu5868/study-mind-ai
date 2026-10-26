import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import ChatHistory from '../models/ChatHistory.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Only look this far back for streak activity — a streak longer than this
// is capped, which keeps the activity queries bounded.
const STREAK_LOOKBACK_DAYS = 365;

// 'YYYY-MM-DD' in UTC, matching what $dateToString produces below.
const toDayKey = (date) => date.toISOString().slice(0, 10);
const dayKeyExpr = (field) => ({ $dateToString: { format: '%Y-%m-%d', date: field } });

// Collects the distinct UTC days the user did anything: uploaded a document,
// completed a quiz, reviewed a flashcard, or asked a chat question.
// Note: flashcards only store their *latest* review, so older review days
// for a card that was re-reviewed later don't count.
const getActivityDays = async (userId, since) => {
  const [docDays, quizDays, cardDays, chatDays] = await Promise.all([
    Document.distinct('uploadDate', { userId, uploadDate: { $gte: since } }),
    Quiz.distinct('completedAt', { userId, completedAt: { $gte: since } }),
    Flashcard.aggregate([
      { $match: { userId } },
      { $unwind: '$cards' },
      { $match: { 'cards.lastReviewed': { $gte: since } } },
      { $group: { _id: dayKeyExpr('$cards.lastReviewed') } },
    ]),
    ChatHistory.aggregate([
      { $match: { userId } },
      { $unwind: '$messages' },
      { $match: { 'messages.role': 'user', 'messages.timestamp': { $gte: since } } },
      { $group: { _id: dayKeyExpr('$messages.timestamp') } },
    ]),
  ]);

  return new Set([
    ...docDays.map(toDayKey),
    ...quizDays.map(toDayKey),
    ...cardDays.map(d => d._id),
    ...chatDays.map(d => d._id),
  ]);
};

// Consecutive active days ending today — or yesterday, so the streak isn't
// shown as broken before the user has had a chance to study today.
const calculateStreak = (activeDays, now = new Date()) => {
  let cursor = new Date(now);
  if (!activeDays.has(toDayKey(cursor))) {
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  let streak = 0;
  while (activeDays.has(toDayKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
};

// @desc    Get user learning statistics
// @route   GET /api/progress/dashboard
// @access  Private
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const since = new Date(Date.now() - STREAK_LOOKBACK_DAYS * DAY_MS);

    // All independent — run them in parallel instead of one after another.
    const [
      totalDocuments,
      totalFlashcardSets,
      totalQuizzes,
      flashcardStats,
      quizStats,
      recentDocuments,
      recentQuizzes,
      activeDays,
    ] = await Promise.all([
      Document.countDocuments({ userId }),
      Flashcard.countDocuments({ userId }),
      Quiz.countDocuments({ userId }),
      // Card counts computed in the database instead of loading every set
      Flashcard.aggregate([
        { $match: { userId } },
        { $unwind: '$cards' },
        {
          $group: {
            _id: null,
            totalFlashcards: { $sum: 1 },
            reviewedFlashcards: { $sum: { $cond: [{ $gt: ['$cards.reviewCount', 0] }, 1, 0] } },
            starredFlashcards: { $sum: { $cond: ['$cards.isStarred', 1, 0] } },
          },
        },
      ]),
      Quiz.aggregate([
        { $match: { userId, completedAt: { $ne: null } } },
        { $group: { _id: null, completedQuizzes: { $sum: 1 }, averageScore: { $avg: '$score' } } },
      ]),
      Document.find({ userId })
        .sort({ lastAccessed: -1 })
        .limit(5)
        .select('title fileName lastAccessed status'),
      Quiz.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('documentId', 'title')
        .select('title score totalQuestions completedAt'),
      getActivityDays(userId, since),
    ]);

    const {
      totalFlashcards = 0,
      reviewedFlashcards = 0,
      starredFlashcards = 0,
    } = flashcardStats[0] || {};
    const { completedQuizzes = 0, averageScore = 0 } = quizStats[0] || {};

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalDocuments,
          totalFlashcardSets,
          totalFlashcards,
          reviewedFlashcards,
          starredFlashcards,
          totalQuizzes,
          completedQuizzes,
          averageScore: Math.round(averageScore),
          studyStreak: calculateStreak(activeDays)
        },
        recentActivity: {
          documents: recentDocuments,
          quizzes: recentQuizzes
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
