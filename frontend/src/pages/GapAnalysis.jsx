import React, { useState, useEffect } from 'react';
import { RefreshCw, History, Download, ChevronDown, ChevronUp, Calendar, TrendingUp } from 'lucide-react';
import AssessmentModal from '../components/AssessmentModal';

const GapAnalysis = () => {
  const [assessment, setAssessment] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Calculate progress
  const progressPercent = allQuestions.length > 0 
    ? Math.round((assessment?.answered_questions || 0) / allQuestions.length * 100)
    : 0;

  // Fetch current assessment
  useEffect(() => {
    fetchAssessment();
    fetchQuestions();
  }, []);

  const fetchAssessment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/assessment/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAssessment(data);
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/assessment/questions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Questions loaded:', data.questions?.length || 0);
        setAllQuestions(data.questions || []);
      } else {
        console.error('Failed to fetch questions:', response.status);
        alert('Failed to load questions. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert('Error loading questions. Please check your connection and try again.');
    }
  };

  const fetchAssessmentHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/assessment/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAssessmentHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching assessment history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRetakeAssessment = async () => {
    if (window.confirm('Are you sure you want to retake the assessment? This will create a new assessment and archive your current one.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/assessment/retake', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAssessment(data.assessment);
          
          // Make sure questions are loaded before opening modal
          if (allQuestions.length > 0) {
            setShowAssessmentModal(true);
          } else {
            // Fetch questions first if not loaded
            await fetchQuestions();
            setShowAssessmentModal(true);
          }
          
          fetchAssessmentHistory(); // Refresh history
        } else {
          alert('Failed to create new assessment. Please try again.');
        }
      } catch (error) {
        console.error('Error retaking assessment:', error);
        alert('An error occurred. Please try again.');
      }
    }
  };

  const handleViewHistoricalAssessment = async (assessmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/assessment/${assessmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // You can display this in a modal or navigate to a detail view
        alert(`Historical Assessment Details:\n\nCompleted: ${new Date(data.completed_at).toLocaleDateString()}\nOverall Score: ${data.overall_score}\nFinancial Score: ${data.financial_score}\nOperational Score: ${data.operational_score}\nDependency Score: ${data.dependency_score}`);
      }
    } catch (error) {
      console.error('Error viewing historical assessment:', error);
    }
  };

  const toggleHistory = () => {
    if (!showHistory && assessmentHistory.length === 0) {
      fetchAssessmentHistory();
    }
    setShowHistory(!showHistory);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100 border-green-300';
    if (score >= 60) return 'bg-blue-100 border-blue-300';
    if (score >= 40) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  const exportToPDF = () => {
    // Placeholder for PDF export functionality
    alert('PDF export functionality will be implemented with a PDF library like jsPDF or html2pdf');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gap Analysis</h1>
        <p className="text-gray-600">
          Complete the assessment to identify areas for improvement before exit
        </p>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Overall Progress</h2>
          <span className="text-sm font-semibold text-gray-900">
            {assessment?.answered_questions || 0} / {allQuestions.length} questions completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${
              progressPercent === 100
                ? 'bg-green-600'
                : progressPercent >= 50
                ? 'bg-blue-600'
                : 'bg-yellow-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-600">{progressPercent}% complete</span>
          {progressPercent === 100 && (
            <span className="text-sm font-semibold text-green-600">
              Assessment Complete! 🎉
            </span>
          )}
        </div>
        {progressPercent === 100 && (
          <p className="text-xs text-gray-500 mt-1">All questions answered ✓</p>
        )}
      </div>

      {/* Continue Assessment Card (Only show if not complete) */}
      {progressPercent < 100 && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-900 mb-2">
            {assessment?.answered_questions === 0 ? 'Ready to Begin?' : 'Continue Your Assessment'}
          </h2>
          <p className="text-blue-700 mb-4">
            {assessment?.answered_questions === 0
              ? `Complete all ${allQuestions.length} questions to get your exit readiness score`
              : `You've answered ${assessment?.answered_questions} of ${allQuestions.length} questions`}
          </p>
          <button
            onClick={() => {
              if (allQuestions.length === 0) {
                alert('Loading questions... Please try again in a moment.');
                fetchQuestions();
              } else {
                setShowAssessmentModal(true);
              }
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            {assessment?.answered_questions === 0 ? 'Start Assessment' : 'Continue Assessment'}
          </button>
        </div>
      )}

      {/* Assessment Results (Only show if complete) */}
      {progressPercent === 100 && assessment && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Exit Readiness Score</h2>
          
          {/* Overall Score */}
          <div className={`rounded-lg p-6 mb-6 border-2 ${getScoreBgColor(assessment.overall_score)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Overall Score</h3>
                <p className="text-sm text-gray-600">Combined readiness across all categories</p>
              </div>
              <div className={`text-5xl font-bold ${getScoreColor(assessment.overall_score)}`}>
                {assessment.overall_score}
              </div>
            </div>
          </div>

          {/* Category Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2">Financial</h4>
              <div className={`text-3xl font-bold ${getScoreColor(assessment.financial_score)}`}>
                {assessment.financial_score}
              </div>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2">Operational</h4>
              <div className={`text-3xl font-bold ${getScoreColor(assessment.operational_score)}`}>
                {assessment.operational_score}
              </div>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2">Dependency</h4>
              <div className={`text-3xl font-bold ${getScoreColor(assessment.dependency_score)}`}>
                {assessment.dependency_score}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={exportToPDF}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              <Download size={18} />
              <span>Generate PDF Report</span>
            </button>
          </div>
        </div>
      )}

      {/* Retake Assessment Button (Only show if complete) */}
      {progressPercent === 100 && (
        <div className="mb-8">
          <button
            onClick={handleRetakeAssessment}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold w-full md:w-auto justify-center"
          >
            <RefreshCw size={20} />
            <span>Retake Assessment</span>
          </button>
        </div>
      )}

      {/* Assessment History Section */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        {/* History Header (Collapsible) */}
        <button
          onClick={toggleHistory}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
        >
          <div className="flex items-center space-x-3">
            <History size={24} className="text-gray-600" />
            <div className="text-left">
              <h2 className="text-xl font-bold text-gray-900">Assessment History</h2>
              <p className="text-sm text-gray-600">View your previous assessments and track progress over time</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {assessmentHistory.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                {assessmentHistory.length}
              </span>
            )}
            {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {/* History Content */}
        {showHistory && (
          <div className="border-t border-gray-200 p-6">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : assessmentHistory.length === 0 ? (
              <div className="text-center py-8">
                <History size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No previous assessments found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Complete your first assessment to start tracking your progress
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assessmentHistory.map((historicalAssessment, index) => (
                  <div
                    key={historicalAssessment.id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 text-blue-800 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                          #{assessmentHistory.length - index}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-sm font-semibold text-gray-700">
                              {new Date(historicalAssessment.completed_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Completed {Math.floor((new Date() - new Date(historicalAssessment.completed_at)) / (1000 * 60 * 60 * 24))} days ago
                          </p>
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(historicalAssessment.overall_score)}`}>
                        {historicalAssessment.overall_score}
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Financial</p>
                        <p className={`text-lg font-bold ${getScoreColor(historicalAssessment.financial_score)}`}>
                          {historicalAssessment.financial_score}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Operational</p>
                        <p className={`text-lg font-bold ${getScoreColor(historicalAssessment.operational_score)}`}>
                          {historicalAssessment.operational_score}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Dependency</p>
                        <p className={`text-lg font-bold ${getScoreColor(historicalAssessment.dependency_score)}`}>
                          {historicalAssessment.dependency_score}
                        </p>
                      </div>
                    </div>

                    {/* Comparison with Current (if not the current assessment) */}
                    {index > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <TrendingUp size={16} className="text-blue-600" />
                          <span className="text-gray-700">
                            Change from previous:{' '}
                            <span className={historicalAssessment.overall_score > assessmentHistory[index - 1].overall_score ? 'text-green-600 font-semibold' : historicalAssessment.overall_score < assessmentHistory[index - 1].overall_score ? 'text-red-600 font-semibold' : 'text-gray-600 font-semibold'}>
                              {historicalAssessment.overall_score > assessmentHistory[index - 1].overall_score ? '+' : ''}
                              {historicalAssessment.overall_score - assessmentHistory[index - 1].overall_score} points
                            </span>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => handleViewHistoricalAssessment(historicalAssessment.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-semibold hover:underline"
                    >
                      View Full Details →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assessment Modal */}
      {showAssessmentModal && (
        <AssessmentModal
          questions={allQuestions}
          assessmentId={assessment?.id}
          onClose={() => setShowAssessmentModal(false)}
          onComplete={() => {
            fetchAssessment();
            setShowAssessmentModal(false);
          }}
        />
      )}
    </div>
  );
};

export default GapAnalysis;
