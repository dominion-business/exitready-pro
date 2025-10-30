import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { saveAssessmentResponse } from '../services/api';

const AssessmentModal = ({ assessmentId, allQuestions, answeredQuestions, onClose, onSave }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [expandedDescription, setExpandedDescription] = useState(false);
  const scrollContainerRef = useRef(null);
  const [showScoringHelp, setShowScoringHelp] = useState(false);
  const [isScoringGuideCollapsed, setIsScoringGuideCollapsed] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const questionRefs = useRef([]);

  // Category descriptions
  const categoryDescriptions = {
    'financial_performance': {
      short: 'Measures financial quality, consistency, and transparency',
      long: 'Measures the quality, consistency, and transparency of your financial reporting, including GAAP compliance, margin stability, forecasting accuracy, and the separation of business finances from personal expenses. This is the foundation of buyer confidence and valuation credibility.'
    },
    'revenue_quality': {
      short: 'Evaluates revenue stability and predictability',
      long: 'Evaluates the stability and reliability of your revenue streams, including recurring income, pricing power, seasonal consistency, customer retention, and the ability to accurately forecast future results. This demonstrates sustainable cash flow that buyers can depend on.'
    },
    'customer_concentration': {
      short: 'Assesses customer diversification and relationship strength',
      long: 'Assesses the diversification and strength of your customer base, measuring whether revenue is appropriately spread across multiple clients, whether relationships are contractual and transferable, and whether customer satisfaction and retention rates indicate long-term loyalty.'
    },
    'management_team': {
      short: 'Examines leadership capability and independence',
      long: 'Examines the capability, independence, and depth of your leadership team, including their ability to operate without owner involvement, documented roles and responsibilities, track record of achieving goals, and whether succession plans ensure business continuity.'
    },
    'competitive_position': {
      short: 'Analyzes market standing and competitive advantages',
      long: 'Analyzes your market standing, competitive advantages, brand strength, and strategic positioning. This category measures whether you have a defensible market position, clear differentiation, and the competitive intelligence systems needed to maintain relevance in changing markets.'
    },
    'growth_potential': {
      short: 'Evaluates capacity for future expansion',
      long: 'Evaluates your company\'s capacity for future expansion, including market growth rates, strategic plans with milestones, operational infrastructure that can support 2-3x growth, innovation pipelines, and your ability to scale profitably without major reinvestment.'
    },
    'intellectual_property': {
      short: 'Measures strength of intangible assets and IP protection',
      long: 'Measures the strength and protection of your intangible assets, including patents, trademarks, proprietary processes, trade secrets, vendor relationships, and licensing agreements. These are the unique capabilities that create competitive advantage and prevent commoditization.'
    },
    'legal_compliance': {
      short: 'Assesses regulatory compliance and risk management',
      long: 'Assesses your regulatory compliance, corporate governance, insurance coverage, contract management practices, and history of avoiding legal issues. This protective framework minimizes buyer risk and prevents costly surprises during due diligence.'
    },
    'owner_dependency': {
      short: 'Evaluates business operations without owner involvement',
      long: 'Evaluates how well your business can operate without owner involvement, measuring whether critical relationships, knowledge, and decision-making authority have been systematically transferred to management. This is the single most important factor in achieving premium valuations.'
    },
    'strategic_positioning': {
      short: 'Examines external visibility and market presence',
      long: 'Examines your external visibility and market presence, including digital reputation, marketing effectiveness, thought leadership, industry recognition, customer testimonials, and alignment with emerging trends. These factors make your company attractive in a competitive buyer marketplace.'
    }
  };

  // Initialize answers from already answered questions
  useEffect(() => {
    const initialAnswers = {};
    answeredQuestions.forEach(q => {
      initialAnswers[q.question_id] = q.answer_value;
    });
    setAnswers(initialAnswers);
  }, [answeredQuestions]);

  // Reset expanded description and scroll to first unanswered question when changing pages
  useEffect(() => {
    setExpandedDescription(false);
    // Reset question refs when category changes
    questionRefs.current = [];

    // Find first unanswered question in the current category
    if (currentCategory) {
      const firstUnansweredIndex = currentCategory.questions.findIndex(
        q => answers[q.question_id] === undefined
      );

      // Set to first unanswered, or 0 if all are answered
      const targetIndex = firstUnansweredIndex !== -1 ? firstUnansweredIndex : 0;
      setCurrentQuestionIndex(targetIndex);

      // Scroll to top first
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Then scroll to target question after a brief delay
      setTimeout(() => {
        if (questionRefs.current[targetIndex]) {
          questionRefs.current[targetIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 300);
    }
  }, [currentPage]);

  // Show loading state if no questions loaded
  if (!allQuestions || allQuestions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Loading Questions...</h3>
          <p className="text-gray-600">Please wait while we load the assessment questions.</p>
        </div>
      </div>
    );
  }

  // Organize questions by category
  const organizeQuestions = () => {
    const organized = {};

    allQuestions.forEach(q => {
      if (!organized[q.category]) {
        organized[q.category] = {
          name: q.category_display,
          key: q.category,
          questions: []
        };
      }

      organized[q.category].questions.push(q);
    });

    return organized;
  };

  const questionsByCategory = organizeQuestions();
  const categoryKeys = Object.keys(questionsByCategory);
  const totalCategories = categoryKeys.length;

  // Get current category
  const currentCategoryKey = categoryKeys[currentPage];
  const currentCategory = currentCategoryKey ? questionsByCategory[currentCategoryKey] : null;
  const currentDescription = currentCategoryKey ? categoryDescriptions[currentCategoryKey] : null;

  // Calculate progress
  const totalQuestions = allQuestions.length;
  const totalAnswered = Object.keys(answers).length;
  const progressPercent = (totalAnswered / totalQuestions) * 100;

  // Calculate category progress
  const getCategoryAnsweredCount = (categoryKey) => {
    const category = questionsByCategory[categoryKey];
    return category.questions.filter(q => answers[q.question_id] !== undefined).length;
  };

  const currentCategoryAnswered = currentCategory 
    ? getCategoryAnsweredCount(currentCategoryKey) 
    : 0;
  const currentCategoryTotal = currentCategory ? currentCategory.questions.length : 0;
  const currentCategoryComplete = currentCategoryAnswered === currentCategoryTotal;

  const handleAnswerChange = async (question, value, questionIndex) => {
    // Update local state
    setAnswers(prev => ({
      ...prev,
      [question.question_id]: value
    }));

    // Save to backend immediately
    try {
      const responseData = {
        assessment_id: assessmentId,
        question_id: question.question_id,
        category: question.category,
        subject: question.subject,
        question_text: question.question_text,
        answer_value: value,
        answer_text: getAnswerText(value, question.scale_type),
        comments: '',
        rule_of_thumb: question.rule_of_thumb,
        considerations: question.considerations,
        related_task: question.related_task
      };

      const result = await saveAssessmentResponse(responseData);

      if (!result.success) {
        console.error('Failed to save:', result.error);
        alert('Failed to save response: ' + result.error);
      } else {
        // Auto-advance to next question after successful save
        const nextQuestionIndex = questionIndex + 1;
        if (nextQuestionIndex < currentCategory.questions.length) {
          // Scroll to next question within same category
          setTimeout(() => {
            setCurrentQuestionIndex(nextQuestionIndex);
            if (questionRefs.current[nextQuestionIndex]) {
              questionRefs.current[nextQuestionIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }, 300);
        } else if (currentPage < totalCategories - 1) {
          // Auto-advance to next category if this was the last question
          setTimeout(() => {
            setCurrentPage(currentPage + 1);
            setCurrentQuestionIndex(0);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      alert('Error saving response. Please try again.');
    }
  };

  const getAnswerText = (value, scaleType = 'comparative') => {
    if (value === 0) return 'N/A - Not Applicable';

    if (scaleType === 'documentation') {
      const docLabels = {
        1: "I Don't Know What You're Talking About",
        2: "I've Heard About It, But It's Not Clear",
        3: "It's Clear, But Not Documented",
        4: "It's Clear & Documented, But Not Transferable",
        5: "It's Clear, Documented, & Transferable",
        6: "It's Perfect - No Improvement Possible"
      };
      return docLabels[value] || '';
    }

    // Comparative questions (default)
    const comparativeLabels = {
      1: 'Weaker Than All Others',
      2: 'Weaker Than Most',
      3: 'Weak, But Gaining Strength',
      4: 'Strong, And Getting Stronger',
      5: 'Stronger Than Most',
      6: 'Stronger Than All Others'
    };
    return comparativeLabels[value] || '';
  };

  const getButtonColor = (value, isSelected) => {
    if (isSelected) {
      const selectedColors = {
        0: 'bg-gray-500 border-gray-700 text-white shadow-lg',
        1: 'bg-red-600 border-red-800 text-white shadow-lg',
        2: 'bg-orange-500 border-orange-700 text-white shadow-lg',
        3: 'bg-yellow-500 border-yellow-700 text-white shadow-lg',
        4: 'bg-blue-600 border-blue-800 text-white shadow-lg',
        5: 'bg-green-600 border-green-800 text-white shadow-lg',
        6: 'border-2 text-white shadow-lg'
      };

      // Custom gold color for score 6
      if (value === 6) {
        return selectedColors[6] + ' ' + 'bg-[#c49e73] border-[#a07d5a]';
      }

      return selectedColors[value] || selectedColors[0];
    }

    const unselectedColors = {
      0: 'bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-100',
      1: 'bg-red-50 border-red-300 text-red-700 hover:border-red-400 hover:bg-red-100',
      2: 'bg-orange-50 border-orange-300 text-orange-700 hover:border-orange-400 hover:bg-orange-100',
      3: 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:border-yellow-400 hover:bg-yellow-100',
      4: 'bg-blue-50 border-blue-300 text-blue-700 hover:border-blue-400 hover:bg-blue-100',
      5: 'bg-green-50 border-green-300 text-green-700 hover:border-green-400 hover:bg-green-100',
      6: 'border-2 hover:border-2'
    };

    // Custom gold color for score 6 (unselected)
    if (value === 6) {
      return unselectedColors[6] + ' ' + 'bg-[#f5e6d3] border-[#c49e73] text-[#8b6f47] hover:bg-[#e8d4bb] hover:border-[#a07d5a]';
    }

    return unselectedColors[value] || unselectedColors[0];
  };

  const getAnswerBadgeColor = (value) => {
    const colors = {
      0: 'bg-gray-100 text-gray-800 border-gray-300',
      1: 'bg-red-100 text-red-800 border-red-300',
      2: 'bg-orange-100 text-orange-800 border-orange-300',
      3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      4: 'bg-blue-100 text-blue-800 border-blue-300',
      5: 'bg-green-100 text-green-800 border-green-300',
      6: 'border'
    };

    // Custom gold color for score 6 badge
    if (value === 6) {
      return colors[6] + ' ' + 'bg-[#f5e6d3] text-[#8b6f47] border-[#c49e73]';
    }

    return colors[value] || colors[0];
  };

  const handleNext = () => {
    if (currentPage < totalCategories - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleFinish = async () => {
    // Trigger reload to refresh scores
    if (onSave) {
      await onSave();
    }
    onClose();
  };

  if (!currentCategory) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Business Attractiveness Assessment</h2>
            <p className="text-sm text-gray-600 mt-1">
              Category {currentPage + 1} of {totalCategories}: {currentCategory.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition ml-4"
          >
            <X size={28} />
          </button>
        </div>

        {/* Overall Progress Bar */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-900">
              Overall Progress: {totalAnswered} / {totalQuestions} questions
            </span>
            <span className="text-xs font-semibold text-blue-900">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Category Progress */}
        <div className="px-6 py-3 bg-green-50 border-b border-green-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-semibold text-green-900">
                {currentCategory.name}: {currentCategoryAnswered} / {currentCategoryTotal} questions
              </span>
              {/* Category Info Button */}
              {currentDescription && (
                <button
                  onClick={() => setExpandedDescription(!expandedDescription)}
                  className="text-blue-600 hover:text-blue-800 transition"
                  title="About this category"
                >
                  <Info size={18} />
                </button>
              )}
            </div>
            {currentCategoryComplete && (
              <span className="flex items-center text-sm font-semibold text-green-700">
                <Check size={16} className="mr-1" />
                Complete
              </span>
            )}
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentCategoryAnswered / currentCategoryTotal) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Category Description Modal - Shows when info button clicked */}
        {expandedDescription && currentDescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Info size={24} className="text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    About: {currentCategory.name}
                  </h3>
                </div>
                <button
                  onClick={() => setExpandedDescription(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  {currentDescription.long}
                </p>
              </div>
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setExpandedDescription(false)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                >
                  Got it, thanks!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6">
          {/* Inline Scoring Guide - Collapsible */}
          <div className="mb-8 flex justify-center">
            <div className="w-full max-w-3xl" style={{ transform: 'scale(1.125)', transformOrigin: 'top center' }}>
              {/* Collapsible Scoring Guide Card */}
              <div className="bg-white rounded-lg border-2 border-gray-300 shadow-sm mb-12">
                {/* Collapsible Header - FIXED: Changed from button to div */}
                <div
                  onClick={() => setIsScoringGuideCollapsed(!isScoringGuideCollapsed)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition rounded-t-lg cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      Assessment Scoring Guide
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowScoringHelp(true);
                      }}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition"
                      title="Learn more about Clear, Documented, & Transferable"
                    >
                      <Info size={18} />
                      <span className="text-xs font-medium">What does "Clear, Documented, & Transferable" mean?</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span className="text-sm">{isScoringGuideCollapsed ? 'Show' : 'Hide'}</span>
                    {isScoringGuideCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </div>
                </div>

                {/* Collapsible Content */}
                {!isScoringGuideCollapsed && (
                  <div className="px-4 pb-4">
                    <div className="flex justify-center">
                      <img
                        src="/scoring-guide.png"
                        alt="Assessment Scoring Guide"
                        className="w-full h-auto rounded"
                        style={{ maxHeight: '220px', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Questions */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {currentCategory.name}
            </h3>

            {currentCategory.questions.map((question, index) => {
              const currentAnswer = answers[question.question_id];
              const isAnswered = currentAnswer !== undefined;

              return (
                <div
                  key={question.question_id}
                  ref={(el) => (questionRefs.current[index] = el)}
                  className={`p-5 rounded-lg border-2 transition-all duration-300 ${
                    isAnswered
                      ? 'border-green-300 bg-green-50'
                      : currentQuestionIndex === index
                      ? 'border-blue-400 bg-blue-50 shadow-lg'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {/* Question Number and Text */}
                  <div className="mb-4">
                    <div className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          {question.question_title || question.subject}
                        </h4>
                        <p className="text-sm text-gray-800">
                          {question.question_text}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Button Scale 0-6 */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700">
                      Select your response (0 = Not Applicable):
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((value) => {
                        const isSelected = currentAnswer === value;
                        const shortLabels = {
                          0: 'N/A',
                          1: '1',
                          2: '2',
                          3: '3',
                          4: '4',
                          5: '5',
                          6: '6'
                        };

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleAnswerChange(question, value, index)}
                            className={`p-3 rounded-lg border-2 transition-all text-center ${
                              getButtonColor(value, isSelected)
                            } ${isSelected ? 'scale-105' : ''}`}
                            title={getAnswerText(value, question.scale_type)}
                          >
                            <div className="text-2xl font-bold">{shortLabels[value]}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Answered Badge */}
                  {isAnswered && (
                    <div className="mt-3 flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                        getAnswerBadgeColor(currentAnswer)
                      }`}>
                        <Check size={14} className="mr-1" />
                        {getAnswerText(currentAnswer, question.scale_type)}
                      </span>
                    </div>
                  )}

                  {/* Rule of Thumb (if exists) */}
                  {question.rule_of_thumb && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs text-blue-900">
                        <strong>💡 Rule of Thumb:</strong> {question.rule_of_thumb}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with Navigation */}
        <div className="border-t border-gray-200 bg-gray-50">
          {/* Category Navigation Dots */}
          <div className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-center space-x-2">
              {categoryKeys.map((catKey, index) => {
                const isComplete = getCategoryAnsweredCount(catKey) === questionsByCategory[catKey].questions.length;
                const isCurrent = index === currentPage;
                
                return (
                  <button
                    key={catKey}
                    onClick={() => setCurrentPage(index)}
                    className={`relative group transition-all ${
                      isCurrent 
                        ? 'w-12 h-3' 
                        : 'w-3 h-3'
                    }`}
                    title={questionsByCategory[catKey].name}
                  >
                    <div className={`w-full h-full rounded-full transition-all ${
                      isComplete 
                        ? 'bg-green-500' 
                        : isCurrent 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300'
                    }`}>
                      {isComplete && (
                        <Check size={10} className="text-white absolute inset-0 m-auto" />
                      )}
                    </div>
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                      {questionsByCategory[catKey].name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between p-6">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className={`flex items-center space-x-2 px-5 py-3 rounded-lg font-semibold transition ${
                currentPage === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ChevronLeft size={20} />
              <span>Previous</span>
            </button>

            <div className="text-sm text-gray-600">
              Page {currentPage + 1} of {totalCategories}
            </div>

            {currentPage < totalCategories - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-5 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <span>Next Category</span>
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  totalAnswered === totalQuestions
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {totalAnswered === totalQuestions ? 'Finish & View Results' : 'Save & Close'}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Help Modal - Inside AssessmentModal for proper z-index */}
      {showScoringHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Understanding "Clear, Documented, & Transferable"
              </h2>
              <button
                onClick={() => setShowScoringHelp(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Introduction */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-gray-700 leading-relaxed">
                  These three attributes represent the <strong>gold standard</strong> for business processes,
                  systems, and operations that maximize transferable value. Buyers pay premium prices for
                  businesses that can run independently of the current owner.
                </p>
              </div>

              {/* Clear */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                    1
                  </span>
                  Clear
                </h3>
                <div className="ml-11 space-y-2">
                  <p className="text-gray-700">
                    <strong>Definition:</strong> Processes and responsibilities are unambiguous, easy to understand,
                    and consistently executed.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-800 mb-2">Examples:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      <li>Step-by-step sales process that anyone can follow</li>
                      <li>Defined roles with explicit job descriptions</li>
                      <li>Straightforward pricing methodology</li>
                      <li>Transparent financial reporting with clear KPIs</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="font-semibold text-red-800 mb-2">Red Flags (Not Clear):</p>
                    <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                      <li>"We just figure it out as we go"</li>
                      <li>Tribal knowledge that only veterans understand</li>
                      <li>Inconsistent execution across team members</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Documented */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                    2
                  </span>
                  Documented
                </h3>
                <div className="ml-11 space-y-2">
                  <p className="text-gray-700">
                    <strong>Definition:</strong> Written procedures, policies, and systems exist that can be
                    referenced, updated, and used for training.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-800 mb-2">Examples:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      <li>Standard Operating Procedures (SOPs) for key processes</li>
                      <li>Employee handbook and training manuals</li>
                      <li>Written contracts and agreements with customers/vendors</li>
                      <li>Organizational charts and process flowcharts</li>
                      <li>Knowledge base or wiki for common issues</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="font-semibold text-red-800 mb-2">Red Flags (Not Documented):</p>
                    <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                      <li>"It's all in my head" or "I'll show the new owner"</li>
                      <li>No written procedures or manuals</li>
                      <li>Reliance on verbal instructions</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Transferable */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <span className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                    3
                  </span>
                  Transferable
                </h3>
                <div className="ml-11 space-y-2">
                  <p className="text-gray-700">
                    <strong>Definition:</strong> The system can be effectively handed off to a new person without
                    significant loss of efficiency or quality. The business doesn't depend on any single individual.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-800 mb-2">Examples:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      <li>New employees can be onboarded using documentation</li>
                      <li>Customer relationships aren't tied to one person</li>
                      <li>Systems and software can be accessed by others</li>
                      <li>Vendor relationships are company-based, not personal</li>
                      <li>Management team can operate without owner</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="font-semibold text-red-800 mb-2">Red Flags (Not Transferable):</p>
                    <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                      <li>Owner is the only one who can perform critical functions</li>
                      <li>Key relationships would leave with owner</li>
                      <li>Passwords, accounts only accessible to owner</li>
                      <li>Long training period required for handoff</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Why It Matters */}
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <h4 className="font-bold text-yellow-900 mb-2">💡 Why This Matters for Exit Value</h4>
                <p className="text-yellow-800 text-sm leading-relaxed">
                  Buyers pay <strong>2-4x more</strong> for businesses with clear, documented, and transferable
                  systems because they reduce risk and enable a smooth transition. A business that depends on
                  the owner's personal knowledge and relationships is worth significantly less than one that
                  operates like a well-oiled machine.
                </p>
              </div>

              {/* Scoring Guide */}
              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-900 mb-3">Assessment Scoring Scale (0-6):</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="px-3 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center bg-[#c49e73] text-white">6</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Exemplary & Optimized</p>
                      <p className="text-xs text-gray-600">Fully clear, comprehensively documented, and seamlessly transferable. Best-in-class execution with no meaningful improvements needed.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center">5</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Clear, Documented & Transferable</p>
                      <p className="text-xs text-gray-600">Meets all three core criteria with strong execution. Minor refinements possible but fundamentally sound and ready for transition.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center">4</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Clear & Documented, Not Yet Transferable</p>
                      <p className="text-xs text-gray-600">Well-defined and properly documented, but remains dependent on specific individuals. Requires knowledge transfer planning to reduce key person risk.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center">3</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Clear But Lacking Documentation</p>
                      <p className="text-xs text-gray-600">Processes are understood and consistently executed, but not formally written down. Institutional knowledge exists but isn't captured in accessible formats.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center">2</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Conceptually Understood, Poorly Defined</p>
                      <p className="text-xs text-gray-600">You recognize the importance and generally understand the concept, but execution is inconsistent, unclear, or varies by person. Needs structure and standardization.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center">1</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Unfamiliar or Absent</p>
                      <p className="text-xs text-gray-600">This area is not currently addressed in your business, or you're unclear on what the question is asking. Represents a significant gap requiring immediate attention.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-bold text-sm min-w-[40px] text-center">0</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Not Applicable (N/A)</p>
                      <p className="text-xs text-gray-600">This question does not apply to your business model or industry. These responses are excluded from your final score calculation.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowScoringHelp(false)}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentModal;
