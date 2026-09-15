import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import quizService from '../../services/quizService';
import PageHeader from '../../components/common/PageHeader';
import PaginationDots from '../../components/common/PaginationDots';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';

const QuizTakePage = () => {

  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await quizService.getQuizById(quizId);
        setQuiz(response.data);
      } catch (error) {
        toast.error('Failed to fetch quiz.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleOptionChange = useCallback((questionId, optionIndex) => {
    setSelectedAnswers((prev) => {
      // No-op guard: re-selecting the same option shouldn't trigger a render.
      if (prev[questionId] === optionIndex) return prev;
      return { ...prev, [questionId]: optionIndex };
    });
  }, []);

  const totalQuestions = quiz?.questions.length ?? 0;

  const handleNextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  }, [totalQuestions]);

  const handlePreviousQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = Object.keys(selectedAnswers).map(questionId => {
        const question = quiz.questions.find(q => q._id === questionId);
        const questionIndex = quiz.questions.findIndex(q => q._id === questionId);
        const optionIndex = selectedAnswers[questionId];
        const selectedAnswer = question.options[optionIndex];
        return { questionIndex, selectedAnswer };
      });

      await quizService.submitQuiz(quizId, formattedAnswers);
      toast.success('Quiz submitted successfully!');
      navigate(`/quizzes/${quizId}/results`);
    } catch (error) {
      toast.error(error.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  // Indexes of answered questions, for the progress dots. Declared here —
  // above the early returns — because hooks must run unconditionally on
  // every render. Guarded with `quiz?.` since this runs while still loading.
  const answeredIndexes = useMemo(() => {
    if (!quiz) return [];
    return quiz.questions.reduce((acc, question, index) => {
      if (selectedAnswers[question._id] !== undefined) acc.push(index);
      return acc;
    }, []);
  }, [quiz, selectedAnswers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-600 text-lg">Quiz not found or has no questions.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

    return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title={quiz.title || 'Take Quiz'} />

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
          <span className="text-sm font-medium text-slate-500">
            {answeredCount} answered
          </span>
        </div>
        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-linear-to-r from-emerald-500 to-teal-500 transition-all duration-500 ease-out"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 p-8 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl mb-6">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-emerald-700">
            Question {currentQuestionIndex + 1}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-6 leading-relaxed">
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion._id] === index;
            return (
              <label
                key={index}
                className={`group relative flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white hover:shadow-md'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={index}
                  checked={isSelected}
                  onChange={() => handleOptionChange(currentQuestion._id, index)}
                  className="sr-only"
                />

                {/* Custom Radio Button */}
                <div className={`shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-slate-300 bg-white group-hover:border-emerald-400'
                }`}>
                  {isSelected && (
                    <div className="w-full h-full flex  items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>

                {/* Option Text */}
                <span className={`ml-4 text-sm font-medium transition-colors duration-200 ${
                  isSelected ? 'text-emerald-900' : 'text-slate-700 group-hover:text-slate-900'
                }`}>
                  {option}
                </span>

                {/* Selected Checkmark */}
                {isSelected && (
                  <CheckCircle2
                    className="ml-auto w-5 h-5 text-emerald-500"
                    strokeWidth={2.5}
                  />
                )}
              </label>
            );
          })}
        </div>

      </div>

      {/* Progress indicator — display only. Navigation is intentionally
          limited to the Previous / Next buttons below, so questions are
          answered in order rather than skipped around. */}
      <div className="mb-6">
        <PaginationDots
          total={quiz.questions.length}
          current={currentQuestionIndex}
          completed={answeredIndexes}
          label="Quiz progress"
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
          <Button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0 || submitting}
            variant='secondary'
          >
            <ChevronLeft className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" strokeWidth={2.5} />
            Previous
          </Button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="group relative px-8 h-12 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                    Submit Quiz
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              disabled={submitting}
            >
              Next
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-700" strokeWidth={2.5} />
            </Button>
          )}
      </div>

    </div>
  )
}

export default QuizTakePage