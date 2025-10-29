import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { saveAssessmentResponse } from '../services/api';

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
        answer_text: getAnswerText(value),
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
      // Don't call onSave here - it causes page refresh
    } catch (error) {
      console.error('Error saving answer:', error);
      alert('Error saving response. Please try again.');
    }
  };

  const getAnswerText = (value) => {
    const labels = [
      'No advantage at all',
      'Very little',
      'Some advantage',
      'Moderate advantage',
      'Strong advantage',
      'Great advantage'
    ];
    return labels[value] || '';
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
              Answer all questions to assess your business readiness for exit
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
          <div className="space-y-4">
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

                                  {/* Radio Scale */}
                                  <div className="flex items-center justify-between space-x-4">
                                    <span className="text-xs text-gray-600 whitespace-nowrap">
                                      No advantage
                                    </span>
                                    
                                    <div className="flex space-x-6 flex-1 justify-center">
                                      {[0, 1, 2, 3, 4, 5].map((value) => (
                                        <label
                                          key={value}
                                          className="cursor-pointer relative group flex items-center justify-center"
                                          title={getAnswerText(value)}
                                        >
                                          <input
                                            type="radio"
                                            name={question.question_id}
                                            value={value}
                                            checked={currentAnswer === value}
                                            onChange={() => handleAnswerChange(question, value)}
                                            className="appearance-none w-6 h-6 border-2 border-gray-300 rounded-full cursor-pointer transition
                                                     checked:border-blue-600 checked:bg-blue-600
                                                     hover:border-blue-400
                                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                          />
                                          {currentAnswer === value && (
                                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                              <span className="w-2 h-2 bg-white rounded-full"></span>
                                            </span>
                                          )}
                                          {/* Tooltip on hover */}
                                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                            {getAnswerText(value)}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                    
                                    <span className="text-xs text-gray-600 whitespace-nowrap">
                                      Great advantage
                                    </span>
                                  </div>

                                  {/* Answered Badge */}
                                  {isAnswered && (
                                    <div className="mt-3 flex items-center space-x-2">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <Check size={14} className="mr-1" />
                                        Answered: {getAnswerText(currentAnswer)}
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
