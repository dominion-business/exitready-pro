import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import { getExitQuizQuestions, submitExitQuiz, getExitQuizResults } from '../services/api';

const ExitStrategyQuiz = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [hasExistingResults, setHasExistingResults] = useState(false);

  useEffect(() => {
    fetchQuizData();
  }, []);

  const fetchQuizData = async () => {
    setLoading(true);
    try {
      // Fetch questions
      const questionsResult = await getExitQuizQuestions();
      if (questionsResult.success) {
        setQuestions(questionsResult.data.questions || []);
      }

      // Check for existing results
      const resultsResult = await getExitQuizResults();
      if (resultsResult.success && resultsResult.data.recommendations) {
        setHasExistingResults(true);
      }
    } catch (error) {
      console.error('Error fetching quiz data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate all questions answered
    const unansweredQuestions = questions.filter(q => !responses[q.id]);
    if (unansweredQuestions.length > 0) {
      alert(`Please answer all questions. ${unansweredQuestions.length} question(s) remaining.`);
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitExitQuiz(responses);
      if (result.success) {
        // Navigate to results page
        navigate('/exit-strategy-results');
      } else {
        alert('Failed to submit quiz: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(responses).length;
  const isCurrentQuestionAnswered = currentQuestion && responses[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canSubmit = answeredCount === questions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            {hasExistingResults && (
              <button
                onClick={() => navigate('/exit-strategy-results')}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition font-semibold"
              >
                <FileText size={18} />
                <span>View Previous Results</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white">
              <Target size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exit Strategy Quiz</h1>
              <p className="text-gray-600">Discover the best exit strategies for your business</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{answeredCount} / {questions.length} answered</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="mb-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {currentQuestionIndex + 1}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {currentQuestion.question}
                  </h2>
                </div>
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = responses[currentQuestion.id] === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(currentQuestion.id, option.value)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check size={16} className="text-white" />}
                      </div>
                      <span className={`font-medium ${
                        isSelected ? 'text-indigo-900' : 'text-gray-700'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition ${
              currentQuestionIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
            }`}
          >
            <ArrowLeft size={20} />
            <span>Previous</span>
          </button>

          {!isLastQuestion ? (
            <button
              onClick={goToNextQuestion}
              disabled={!isCurrentQuestionAnswered}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition shadow-md ${
                isCurrentQuestionAnswered
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>Next</span>
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-bold text-lg transition shadow-lg ${
                canSubmit && !submitting
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Check size={20} />
                  <span>Get My Results</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Quick Jump */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Quick Jump to Question:</h3>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => {
              const isAnswered = responses[q.id];
              const isCurrent = index === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg font-semibold transition ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md'
                      : isAnswered
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Info size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-blue-900 mb-2">About This Quiz</h4>
              <p className="text-blue-800 text-sm leading-relaxed">
                This quiz analyzes 20 key factors about your business, goals, and preferences to recommend
                the top three exit strategies that best fit your situation. Your responses help us consider
                factors like timing, valuation goals, culture preservation, tax implications, and more to
                provide personalized recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitStrategyQuiz;
