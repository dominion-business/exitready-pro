import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { saveAssessmentResponse } from '../services/api';
import ScoringGuide from './ScoringGuide';

const AssessmentModal = ({ assessmentId, allQuestions, answeredQuestions, onClose, onSave }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize answers from already answered questions
  useEffect(() => {
    const initialAnswers = {};
    answeredQuestions.forEach(q => {
      initialAnswers[q.question_id] = q.answer_value;
    });
    setAnswers(initialAnswers);
  }, [answeredQuestions]);

  // Organize questions by category and subject
  const organizeQuestions = () => {
    const organized = {};
    
    allQuestions.forEach(q => {
      if (!organized[q.category]) {
        organized[q.category] = {
          name: q.category_display,
          key: q.category,
          subjects: {}
        };
      }
      
      if (!organized[q.category].subjects[q.subject]) {
        organized[q.category].subjects[q.subject] = {
          name: q.subject,
          questions: []
        };
      }
      
      organized[q.category].subjects[q.subject].questions.push(q);
    });
    
    return organized;
  };

  const questionsByCategory = organizeQuestions();
  const categoryKeys = Object.keys(questionsByCategory);

  // Auto-expand first category
  useEffect(() => {
    if (categoryKeys.length > 0 && !expandedCategory) {
      setExpandedCategory(categoryKeys[0]);
    }
  }, [categoryKeys, expandedCategory]);

  const handleAnswerChange = async (question, value) => {
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
        answer_text: getAnswerText(value, question.question_type),
        comments: '',
        rule_of_thumb: question.rule_of_thumb,
        considerations: question.considerations,
        related_task: question.related_task
      };

      const result = await saveAssessmentResponse(responseData);

      if (!result.success) {
        console.error('Failed to save:', result.error);
        alert('Failed to save response: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      alert('Error saving response. Please try again.');
    }
  };

  const getAnswerText = (value, questionType = 'strength') => {
    if (value === 0) return 'N/A - Not Applicable';
    
    if (questionType === 'documentation') {
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
    
    // Strength questions (default)
    const strengthLabels = {
      1: 'Weaker Than All Others',
      2: 'Weaker Than Most',
      3: 'Weak, But Gaining Strength',
      4: 'Strong, And Getting Stronger',
      5: 'Stronger Than Most',
      6: 'Stronger Than All Others'
    };
    return strengthLabels[value] || '';
  };

  const getButtonColor = (value, isSelected) => {
    if (isSelected) {
      const selectedColors = {
        0: 'bg-gray-400 border-gray-600 text-white shadow-lg',
        1: 'bg-red-500 border-red-700 text-white shadow-lg',
        2: 'bg-orange-400 border-orange-600 text-white shadow-lg',
        3: 'bg-yellow-400 border-yellow-600 text-gray-900 shadow-lg',
        4: 'bg-lime-400 border-lime-600 text-gray-900 shadow-lg',
        5: 'bg-green-500 border-green-700 text-white shadow-lg',
        6: 'bg-amber-600 border-amber-800 text-white shadow-lg'
      };
      return selectedColors[value] || selectedColors[0];
    }
    
    const unselectedColors = {
      0: 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50',
      1: 'bg-white border-red-200 text-red-700 hover:border-red-400 hover:bg-red-50',
      2: 'bg-white border-orange-200 text-orange-700 hover:border-orange-400 hover:bg-orange-50',
      3: 'bg-white border-yellow-200 text-yellow-700 hover:border-yellow-400 hover:bg-yellow-50',
      4: 'bg-white border-lime-200 text-lime-700 hover:border-lime-400 hover:bg-lime-50',
      5: 'bg-white border-green-200 text-green-700 hover:border-green-400 hover:bg-green-50',
      6: 'bg-white border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-50'
    };
    return unselectedColors[value] || unselectedColors[0];
  };

  const getAnswerBadgeColor = (value) => {
    const colors = {
      0: 'bg-gray-100 text-gray-800 border-gray-300',
      1: 'bg-red-100 text-red-800 border-red-300',
      2: 'bg-orange-100 text-orange-800 border-orange-300',
      3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      4: 'bg-lime-100 text-lime-800 border-lime-300',
      5: 'bg-green-100 text-green-800 border-green-300',
      6: 'bg-amber-100 text-amber-800 border-amber-300'
    };
    return colors[value] || colors[0];
  };

  const getAnsweredCount = (category) => {
    let count = 0;
    const subjects = questionsByCategory[category].subjects;
    
    Object.values(subjects).forEach(subject => {
      subject.questions.forEach(q => {
        if (answers[q.question_id] !== undefined) {
          count++;
        }
      });
    });
    
    return count;
  };

  const getTotalQuestionsInCategory = (category) => {
    let count = 0;
    const subjects = questionsByCategory[category].subjects;
    
    Object.values(subjects).forEach(subject => {
      count += subject.questions.length;
    });
    
    return count;
  };

  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = allQuestions.length;
  const progressPercent = (totalAnswered / totalQuestions) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Exit Readiness Assessment</h2>
            <p className="text-sm text-gray-600 mt-1">
              Answer all questions to assess your business attractiveness for exit
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition ml-4"
          >
            <X size={28} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-900">
              Progress: {totalAnswered} / {totalQuestions} questions answered
            </span>
            <span className="text-sm font-semibold text-blue-900">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Scoring Guide */}
          <ScoringGuide />

          {/* Questions */}
          <div className="space-y-4 mt-6">
            {categoryKeys.map((catKey) => {
              const category = questionsByCategory[catKey];
              const isExpanded = expandedCategory === catKey;
              const subjects = Object.keys(category.subjects);
              const answeredCount = getAnsweredCount(catKey);
              const totalCount = getTotalQuestionsInCategory(catKey);
              const categoryComplete = answeredCount === totalCount;

              return (
                <div key={catKey} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                    onClick={() => setExpandedCategory(isExpanded ? null : catKey)}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {isExpanded ? (
                        <ChevronDown size={20} className="text-gray-600" />
                      ) : (
                        <ChevronRight size={20} className="text-gray-600" />
                      )}
                      <h3 className="font-bold text-lg text-gray-900">{category.name}</h3>
                      {categoryComplete && (
                        <Check size={20} className="text-green-600" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-600">
                      {answeredCount} / {totalCount}
                    </span>
                  </div>

                  {/* Category Content */}
                  {isExpanded && (
                    <div className="p-4 bg-white space-y-6">
                      {subjects.map((subjectKey) => {
                        const subject = category.subjects[subjectKey];
                        
                        return (
                          <div key={subjectKey} className="space-y-4">
                            <h4 className="font-semibold text-md text-gray-800 border-b pb-2">
                              {subject.name}
                            </h4>
                            
                            {subject.questions.map((question) => {
                              const currentAnswer = answers[question.question_id];
                              const isAnswered = currentAnswer !== undefined;

                              return (
                                <div
                                  key={question.question_id}
                                  className={`p-4 rounded-lg border-2 transition ${
                                    isAnswered
                                      ? 'border-green-200 bg-green-50'
                                      : 'border-gray-200 bg-white'
                                  }`}
                                >
                                  {/* Question Text */}
                                  <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-900">
                                      {question.question_text}
                                    </p>
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
                                            onClick={() => handleAnswerChange(question, value)}
                                            className={`p-3 rounded-lg border-2 transition-all text-center ${
                                              getButtonColor(value, isSelected)
                                            } ${isSelected ? 'scale-105' : ''}`}
                                            title={getAnswerText(value, question.question_type)}
                                          >
                                            <div className="text-2xl font-bold">{shortLabels[value]}</div>
                                            <div className={`text-xs mt-1 ${isSelected ? '' : 'text-gray-500'}`}>
                                              {value === 0 ? 'N/A' : `${value === 1 ? 17 : value === 2 ? 33 : value === 3 ? 50 : value === 4 ? 67 : value === 5 ? 83 : 100}%`}
                                            </div>
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
                                        {getAnswerText(currentAnswer, question.question_type)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {totalAnswered === totalQuestions ? (
              <span className="text-green-600 font-semibold">
                ✓ Assessment Complete! Click "Finish" to view your results.
              </span>
            ) : (
              <span>
                {totalQuestions - totalAnswered} questions remaining
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              totalAnswered === totalQuestions
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {totalAnswered === totalQuestions ? 'Finish & View Results' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentModal;
