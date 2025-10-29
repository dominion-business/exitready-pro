import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { saveAssessmentResponse } from '../services/api';

const QuestionModal = ({ question, assessmentId, onClose, onSave }) => {
  const [selectedValue, setSelectedValue] = useState(null);
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (question) {
      setSelectedValue(question.answer_value);
      setComments(question.comments || '');
    }
  }, [question]);

  const handleSave = async () => {
    if (selectedValue === null) return;
    
    setSaving(true);
    try {
      const responseData = {
        assessment_id: assessmentId,
        question_id: question.question_id,
        category: question.category,
        subject: question.subject,
        question_text: question.question_text,
        answer_value: selectedValue,
        answer_text: getAnswerText(selectedValue, question.question_type),
        comments: comments,
        rule_of_thumb: question.rule_of_thumb,
        considerations: question.considerations,
        related_task: question.related_task
      };

      const result = await saveAssessmentResponse(responseData);

      if (result.success) {
        if (onSave) {
          await onSave(responseData);
        }
        onClose();
      } else {
        alert('Failed to save response');
      }
    } catch (error) {
      console.error('Error saving response:', error);
      alert('Error saving response');
    }
    setSaving(false);
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

  if (!question) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Update Score</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Question Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Subject</h3>
                <p className="text-gray-900">{question.subject}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Question</h3>
                <p className="text-gray-900">{question.question_text}</p>
              </div>

              {/* Button Scale 0-6 - Matching Assessment */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select your response (0 = Not Applicable):
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((value) => {
                    const isSelected = selectedValue === value;
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
                        onClick={() => setSelectedValue(value)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          getButtonColor(value, isSelected)
                        } ${isSelected ? 'scale-105' : ''}`}
                        title={getAnswerText(value, question.question_type)}
                      >
                        <div className="text-2xl font-bold">{shortLabels[value]}</div>
                      </button>
                    );
                  })}
                </div>
                {selectedValue !== null && (
                  <p className="mt-2 text-sm text-gray-600 text-center">
                    {getAnswerText(selectedValue, question.question_type)}
                  </p>
                )}
              </div>
            </div>

            {/* Rule of Thumb */}
            {question.rule_of_thumb && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="mr-2">💡</span>
                  Rule of thumb
                </h3>
                <p className="text-sm text-gray-700">{question.rule_of_thumb}</p>
              </div>
            )}

            {/* Considerations */}
            {question.considerations && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="mr-2">📋</span>
                  Consider
                </h3>
                {Array.isArray(question.considerations) ? (
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                    {question.considerations.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-700">{question.considerations}</p>
                )}
              </div>
            )}

            {/* Related Task */}
            {question.related_task && (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="mr-2">✓</span>
                  Related task
                </h3>
                <p className="text-sm text-gray-700">{question.related_task}</p>
                <p className="text-xs text-gray-500 mt-2">
                  This task will be created if your score is low
                </p>
              </div>
            )}

            {/* Comments - Now saved to backend */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Comments (Optional)</h3>
              <p className="text-xs text-gray-500 mb-2">
                Add any notes or context about your answer. Comments are saved and retained for future reference.
              </p>
              <div className="relative">
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any notes or comments about this question..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Save Button */}
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 hover:text-gray-900 font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={selectedValue === null || saving}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold"
            >
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              {!saving && <span>💾</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionModal;
