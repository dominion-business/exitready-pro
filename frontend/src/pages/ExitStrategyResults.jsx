import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Target,
  Users,
  DollarSign,
  Clock,
  Shield,
  Info,
  ChevronRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import { getExitQuizResults } from '../services/api';

const ExitStrategyResults = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const result = await getExitQuizResults();
      if (result.success && result.data.recommendations) {
        setResults(result.data);
        // Auto-select first recommendation
        if (result.data.recommendations.length > 0) {
          setSelectedStrategy(result.data.recommendations[0]);
        }
      } else {
        // No results found, redirect to quiz
        navigate('/exit-strategy-quiz');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      navigate('/exit-strategy-quiz');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!results || !results.recommendations || results.recommendations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <FileText size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Results Found</h2>
          <p className="text-gray-600 mb-6">Please take the quiz to see your recommendations</p>
          <button
            onClick={() => navigate('/exit-strategy-quiz')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Take Quiz
          </button>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy size={28} className="text-yellow-500" />;
      case 2:
        return <Medal size={28} className="text-gray-400" />;
      case 3:
        return <Award size={28} className="text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-amber-500';
      case 2:
        return 'from-gray-300 to-gray-400';
      case 3:
        return 'from-amber-500 to-orange-500';
      default:
        return 'from-blue-600 to-indigo-600';
    }
  };

  const getCategoryIcon = (category) => {
    if (category.includes('External')) return <TrendingUp size={20} />;
    if (category.includes('Internal')) return <Users size={20} />;
    if (category.includes('Partial')) return <Target size={20} />;
    if (category.includes('Restructuring')) return <RefreshCw size={20} />;
    return <DollarSign size={20} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft size={20} />
              <span>Back to Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/exit-strategy-quiz')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              <RefreshCw size={18} />
              <span>Retake Quiz</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl text-white">
              <Trophy size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Your Exit Strategy Recommendations</h1>
              <p className="text-gray-600 mt-1">Based on your quiz responses, here are your top 3 matches</p>
            </div>
          </div>

          {results.completed_at && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>Completed {new Date(results.completed_at).toLocaleDateString()} at {new Date(results.completed_at).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Top 3 Recommendations */}
          {results.recommendations.map((strategy, index) => (
            <div
              key={strategy.rank}
              onClick={() => setSelectedStrategy(strategy)}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                selectedStrategy?.rank === strategy.rank
                  ? 'ring-4 ring-indigo-600 shadow-2xl scale-105'
                  : 'hover:shadow-xl hover:scale-102'
              }`}
            >
              {/* Rank Badge */}
              <div className={`bg-gradient-to-r ${getRankBadgeColor(strategy.rank)} p-4 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  {getRankIcon(strategy.rank)}
                  <span className="text-lg font-bold">#{strategy.rank} Match</span>
                </div>
                <div className="flex items-center space-x-2 text-white/90 text-sm">
                  {getCategoryIcon(strategy.category)}
                  <span>{strategy.category}</span>
                </div>
              </div>

              {/* Strategy Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                  {strategy.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {strategy.description}
                </p>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-start space-x-2">
                    <Target size={16} className="text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Best For</p>
                      <p className="text-sm text-gray-700 font-medium">{strategy.best_for}</p>
                    </div>
                  </div>
                </div>
                {strategy.score && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Match Score</span>
                      <span className="font-bold text-indigo-600">{strategy.score} points</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed View of Selected Strategy */}
        {selectedStrategy && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className={`p-3 bg-gradient-to-r ${getRankBadgeColor(selectedStrategy.rank)} rounded-xl text-white`}>
                {getRankIcon(selectedStrategy.rank)}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{selectedStrategy.name}</h2>
                <p className="text-gray-600">{selectedStrategy.category}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-5 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-start space-x-3">
                  <Info size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-blue-900 mb-2">Overview</h4>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      {selectedStrategy.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-green-50 rounded-xl border-2 border-green-200">
                <div className="flex items-start space-x-3">
                  <Target size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-green-900 mb-2">Best For</h4>
                    <p className="text-green-800 text-sm leading-relaxed">
                      {selectedStrategy.best_for}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
              <h4 className="font-bold text-indigo-900 mb-4 text-lg">Next Steps</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <p className="text-indigo-800 text-sm mt-1">
                    <strong>Research & Learn:</strong> Dive deeper into this exit strategy and understand its specific requirements and implications for your business.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <p className="text-indigo-800 text-sm mt-1">
                    <strong>Consult Advisors:</strong> Work with CEPA-certified advisors, M&A attorneys, tax professionals, and financial planners to build your exit plan.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <p className="text-indigo-800 text-sm mt-1">
                    <strong>Prepare Your Business:</strong> Based on your chosen strategy, take action to maximize your business value and exit readiness.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <p className="text-indigo-800 text-sm mt-1">
                    <strong>Review Gap Analysis:</strong> Complete your business attractiveness assessment to identify specific areas for improvement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/gap-analysis')}
            className="flex items-center justify-center space-x-3 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition border-2 border-gray-200 hover:border-green-300"
          >
            <TrendingUp size={24} className="text-green-600" />
            <div className="text-left">
              <h4 className="font-bold text-gray-900">Gap Analysis</h4>
              <p className="text-sm text-gray-600">Assess business readiness</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/valuation')}
            className="flex items-center justify-center space-x-3 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition border-2 border-gray-200 hover:border-blue-300"
          >
            <DollarSign size={24} className="text-blue-600" />
            <div className="text-left">
              <h4 className="font-bold text-gray-900">Business Valuation</h4>
              <p className="text-sm text-gray-600">Calculate your value</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/business-profile')}
            className="flex items-center justify-center space-x-3 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition border-2 border-gray-200 hover:border-purple-300"
          >
            <Shield size={24} className="text-purple-600" />
            <div className="text-left">
              <h4 className="font-bold text-gray-900">Client Profile</h4>
              <p className="text-sm text-gray-600">Update your information</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
          <div className="flex items-start space-x-3">
            <Info size={20} className="text-yellow-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-yellow-900 mb-2">Important Disclaimer</h4>
              <p className="text-yellow-800 text-sm leading-relaxed">
                These recommendations are based on your quiz responses and are meant to guide your exit planning research.
                They do not constitute professional advice. Always consult with qualified CEPA advisors, legal counsel, tax
                professionals, and financial planners before making any exit strategy decisions. Each exit path has unique
                legal, tax, and financial implications that require professional guidance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitStrategyResults;
