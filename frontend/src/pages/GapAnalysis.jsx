import React, { useState, useEffect } from 'react';
import { FileText, PlayCircle, ChevronDown, ChevronRight, HelpCircle, X, History, RefreshCw, Calendar, Download } from 'lucide-react';
import { getAssessment, startAssessment, retakeAssessment, getAssessmentHistory, getSpecificAssessment, downloadAssessmentPDF } from '../services/api';
import AssessmentModal from '../components/AssessmentModal';
import QuestionModal from '../components/QuestionModal';
import './GapAnalysis.css';

const GapAnalysis = () => {
  const [assessment, setAssessment] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [hoveredGapZone, setHoveredGapZone] = useState(null);
  const [selectedGapFilter, setSelectedGapFilter] = useState(null);
  const [showScoringGuide, setShowScoringGuide] = useState(false);
  const [isScoringGuideCollapsed, setIsScoringGuideCollapsed] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [viewingHistoricalAssessment, setViewingHistoricalAssessment] = useState(false);
  const [showFullQuestionText, setShowFullQuestionText] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [activityTypeFilter, setActivityTypeFilter] = useState(null);
  const [intangibleAssetFilter, setIntangibleAssetFilter] = useState(null);
  const [showActivityTypeHelp, setShowActivityTypeHelp] = useState(false);
  const [showAssetTypeHelp, setShowAssetTypeHelp] = useState(false);

  useEffect(() => {
    loadAssessment();
    loadAllQuestions();
  }, []);

  const loadAssessment = async () => {
    setLoading(true);
    try {
      const result = await getAssessment();

      if (result.success) {
        console.log('Assessment loaded:', result.data);
        // Transform backend response to ensure assessment_id exists
        const transformedData = {
          ...result.data,
          assessment_id: result.data.assessment_id || result.data.id
        };
        setAssessment(transformedData);
        // Trigger animation when assessment loads
        setTimeout(() => setAnimationKey(prev => prev + 1), 50);
      } else {
        const startResult = await startAssessment();
        if (startResult.success) {
          const newResult = await getAssessment();
          const transformedData = {
            ...newResult.data,
            assessment_id: newResult.data.assessment_id || newResult.data.id
          };
          setAssessment(transformedData);
          // Trigger animation when assessment loads
          setTimeout(() => setAnimationKey(prev => prev + 1), 50);
        }
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
    }
    setLoading(false);
  };

  const loadAllQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/assessment/questions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const handleModalSave = async () => {
    await loadAssessment();
  };

  const getAnsweredQuestions = () => {
    if (!assessment || !assessment.responses) return [];
    return assessment.responses;
  };

  const getCategoryQuestions = (categoryKey) => {
    // Map category keys to actual question category names
    const categoryMap = {
      'financial_performance': 'financial_performance',
      'revenue_quality': 'revenue_quality',
      'customer_concentration': 'customer_concentration',
      'management_team': 'management_team',
      'competitive_position': 'competitive_position',
      'growth_potential': 'growth_potential',
      'intellectual_property': 'intellectual_property',
      'legal_compliance': 'legal_compliance',
      'owner_dependency': 'owner_dependency',
      'strategic_positioning': 'strategic_positioning'
    };
    
    const actualCategory = categoryMap[categoryKey] || categoryKey;
    return allQuestions.filter(q => q.category === actualCategory);
  };

  const getGapZone = (score) => {
    // N/A questions (score 0) should not be in any gap zone
    if (score === 0) return 'n-a';
    
    // Score is 0-100 percentage, map to new scale
    if (score > 86) return 'no-gaps';              // >86% - Areas with no gaps (Score 5-6)
    if (score > 72) return 'minor-gaps';           // 72-86% - Areas with minor gaps (Score 4-5)
    if (score > 57) return 'considerable-gaps';    // 57-72% - Areas with considerable gaps (Score 3-4)
    if (score > 43) return 'critical-gaps';        // 43-57% - Areas with critical gaps (Score 2-3)
    if (score > 28) return 'very-critical-gaps';   // 28-43% - Areas with very critical gaps (Score 1-2)
    return 'extremely-critical';                   // >0 and <=28% - Areas with extremely critical gaps (Score 1)
  };

  const getGapZoneInfo = (zone) => {
    const zones = {
      'no-gaps': { label: 'No Gaps', color: '#c49e73', range: '>86%', scoreRange: '86-100%' },
      'minor-gaps': { label: 'Minor Gaps', color: '#a7d5a8', range: '72-86%', scoreRange: '72-86%' },
      'considerable-gaps': { label: 'Considerable Gaps', color: '#b8d4e8', range: '57-72%', scoreRange: '57-72%' },
      'critical-gaps': { label: 'Critical Gaps', color: '#f4ebb0', range: '43-57%', scoreRange: '43-57%' },
      'very-critical-gaps': { label: 'Very Critical Gaps', color: '#f5d7b3', range: '28-43%', scoreRange: '28-43%' },
      'extremely-critical': { label: 'Extremely Critical', color: '#f5c9c9', range: '0-28%', scoreRange: '0-28%' }
    };
    return zones[zone];
  };

  // Helper function to get gap zone color based on score
  const getScoreColor = (score) => {
    const zone = getGapZone(score);
    const zoneInfo = getGapZoneInfo(zone);
    return zoneInfo ? zoneInfo.color : '#6b7280'; // default to gray if no zone
  };

  // Helper function to get darker text color for score cards
  const getScoreDarkColor = (score) => {
    if (score > 86) return '#8b6f47';      // Dark bronze/tan - No gaps
    if (score > 72) return '#2d5a2f';      // Dark green - Minor gaps
    if (score > 57) return '#2c5282';      // Dark blue - Considerable gaps
    if (score > 43) return '#8b7500';      // Dark yellow - Critical gaps
    if (score > 28) return '#a0622d';      // Dark orange - Very critical gaps
    return '#991b1b';                       // Dark red - Extremely critical
  };

  const getQuestionsByGapZone = () => {
    const answered = getAnsweredQuestions();
    const zones = {
      'no-gaps': [],
      'minor-gaps': [],
      'considerable-gaps': [],
      'critical-gaps': [],
      'very-critical-gaps': [],
      'extremely-critical': [],
      'n-a': []
    };

    answered.forEach(answer => {
      const zone = getGapZone(answer.score);
      if (zones[zone]) {
        zones[zone].push(answer);
      }
    });

    return zones;
  };

  const getAnswer = (questionId) => {
    const answered = getAnsweredQuestions();
    return answered.find(a => a.question_id === questionId);
  };


  const getScoreTextColor = (percent) => {
    if (percent > 86) return 'text-[#8b6f47]';
    if (percent > 72) return 'text-green-700';
    if (percent > 57) return 'text-blue-700';
    if (percent > 43) return 'text-yellow-700';
    if (percent > 28) return 'text-orange-700';
    return 'text-red-700';
  };

  const getScoreBadgeColor = (score) => {
    if (score > 86) return 'bg-[#f5e6d3] text-[#8b6f47] border-[#c49e73]';  // Gold/tan - No gaps
    if (score > 72) return 'bg-green-100 text-green-800 border-green-300';   // Green - Minor gaps
    if (score > 57) return 'bg-blue-100 text-blue-800 border-blue-300';      // Blue - Considerable gaps
    if (score > 43) return 'bg-yellow-100 text-yellow-800 border-yellow-300'; // Yellow - Critical gaps
    if (score > 28) return 'bg-orange-100 text-orange-800 border-orange-300'; // Orange - Very critical
    return 'bg-red-100 text-red-900 border-red-400';                          // Pink - Extremely critical
  };

  const handleQuestionEdit = (question, answer) => {
    setSelectedQuestion({
      ...question,
      answer_value: answer?.answer_value,
      answer_text: answer?.answer_text,
      comments: answer?.comments,
      id: answer?.id
    });
  };

  const handleQuestionSave = async () => {
    setSelectedQuestion(null);
    await loadAssessment();
  };

  const handleStartAssessment = async () => {
    setShowAssessmentModal(true);
  };

  const handleRetakeAssessment = async () => {
    if (window.confirm('Are you sure you want to start a new assessment? This will create a new assessment while keeping your previous one in history.')) {
      try {
        const result = await retakeAssessment();
        if (result.success) {
          setViewingHistoricalAssessment(false);
          await loadAssessment();
          setShowAssessmentModal(true);
        }
      } catch (error) {
        console.error('Error retaking assessment:', error);
      }
    }
  };

  const handleViewHistory = async () => {
    try {
      const result = await getAssessmentHistory();
      if (result.success) {
        // Backend returns 'history' not 'assessments'
        const history = result.data.history || [];
        // Add total_questions to each history item for completion calculation
        const historyWithTotals = history.map(h => ({
          ...h,
          assessment_id: h.id, // Backend uses 'id', frontend expects 'assessment_id'
          total_questions: allQuestions.length
        }));
        setAssessmentHistory(historyWithTotals);
        setShowHistoryModal(true);
      }
    } catch (error) {
      console.error('Error loading assessment history:', error);
    }
  };

  const handleLoadHistoricalAssessment = async (assessmentId) => {
    try {
      const result = await getSpecificAssessment(assessmentId);
      if (result.success) {
        // Transform backend response to match frontend expectations
        const transformedData = {
          ...result.data,
          assessment_id: result.data.id, // Backend uses 'id', frontend expects 'assessment_id'
          category_scores: {
            financial_performance: result.data.financial_performance_score,
            revenue_quality: result.data.revenue_quality_score,
            customer_concentration: result.data.customer_concentration_score,
            management_team: result.data.management_team_score,
            competitive_position: result.data.competitive_position_score,
            growth_potential: result.data.growth_potential_score,
            intellectual_property: result.data.intellectual_property_score,
            legal_compliance: result.data.legal_compliance_score,
            owner_dependency: result.data.owner_dependency_score,
            strategic_positioning: result.data.strategic_positioning_score
          }
        };
        setAssessment(transformedData);
        setViewingHistoricalAssessment(true);
        setShowHistoryModal(false);
        // Trigger animation when loading historical assessment
        setTimeout(() => setAnimationKey(prev => prev + 1), 50);
      }
    } catch (error) {
      console.error('Error loading historical assessment:', error);
    }
  };

  const handleBackToCurrent = async () => {
    setViewingHistoricalAssessment(false);
    await loadAssessment();
  };

  const handleDownloadPDF = async () => {
    if (!assessment || !assessment.assessment_id) {
      alert('No assessment available to download');
      return;
    }

    setDownloadingPDF(true);
    try {
      const result = await downloadAssessmentPDF(assessment.assessment_id);
      if (!result.success) {
        alert('Failed to download PDF report: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF report');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleGapZoneClick = (zone) => {
    const newFilter = selectedGapFilter === zone ? null : zone;
    setSelectedGapFilter(newFilter);

    // Auto-expand ALL categories that have questions in this zone
    if (newFilter) {
      const answered = getAnsweredQuestions();
      const categoriesToExpand = [];

      finalCategoryKeys.forEach(catKey => {
        const categoryQuestions = getCategoryQuestions(catKey);
        const hasMatchingQuestions = categoryQuestions.some(q => {
          const answer = answered.find(a => a.question_id === q.question_id);
          return answer && getGapZone(answer.score) === zone;
        });

        if (hasMatchingQuestions) {
          categoriesToExpand.push(catKey);
        }
      });

      // Expand all matching categories by setting expandedCategory to an array
      setExpandedCategory(categoriesToExpand.length > 0 ? categoriesToExpand : null);
    } else {
      // Collapse all when filter is cleared
      setExpandedCategory(null);
    }

    // Trigger animation after a brief delay to allow DOM to update
    setTimeout(() => {
      setAnimationKey(prev => prev + 1);
    }, 100);
  };

  // ID to question_id mapping from backend
  const idToQuestionId = {
    1: 'FIN-001', 2: 'FIN-002', 3: 'FIN-003', 4: 'FIN-004', 5: 'FIN-005',
    6: 'FIN-006', 7: 'FIN-007', 8: 'FIN-008', 9: 'FIN-009', 10: 'FIN-010',
    11: 'REV-001', 12: 'REV-002', 13: 'REV-003', 14: 'REV-004', 15: 'REV-005',
    16: 'REV-006', 17: 'REV-007', 18: 'REV-008', 19: 'REV-009', 20: 'CUST-001',
    21: 'CUST-002', 22: 'CUST-003', 23: 'CUST-004', 24: 'CUST-005', 25: 'CUST-006',
    26: 'CUST-007', 27: 'CUST-008', 28: 'MGT-001', 29: 'MGT-002', 30: 'MGT-003',
    31: 'MGT-004', 32: 'MGT-005', 33: 'MGT-006', 34: 'MGT-007', 35: 'MGT-008',
    36: 'MGT-009', 37: 'MGT-010', 38: 'COMP-001', 39: 'COMP-002', 40: 'COMP-003',
    41: 'COMP-004', 42: 'COMP-005', 43: 'COMP-006', 44: 'COMP-007', 45: 'COMP-008',
    46: 'GROW-001', 47: 'GROW-002', 48: 'GROW-003', 49: 'GROW-004', 50: 'GROW-005',
    51: 'GROW-006', 52: 'GROW-007', 53: 'GROW-008', 54: 'GROW-009', 55: 'IP-001',
    56: 'IP-002', 57: 'IP-003', 58: 'IP-004', 59: 'IP-005', 60: 'IP-006',
    61: 'IP-007', 62: 'IP-008', 63: 'LEGAL-001', 64: 'LEGAL-002', 65: 'LEGAL-003',
    66: 'LEGAL-004', 67: 'LEGAL-005', 68: 'LEGAL-006', 69: 'LEGAL-007', 70: 'LEGAL-008',
    71: 'LEGAL-009', 72: 'OWNER-001', 73: 'OWNER-002', 74: 'OWNER-003', 75: 'OWNER-004',
    76: 'OWNER-005', 77: 'OWNER-006', 78: 'OWNER-007', 79: 'OWNER-008', 80: 'OWNER-009',
    81: 'OWNER-010', 82: 'STRAT-001', 83: 'STRAT-002', 84: 'STRAT-003', 85: 'STRAT-004',
    86: 'STRAT-005', 87: 'STRAT-006', 88: 'STRAT-007', 89: 'STRAT-008'
  };

  // Helper function to convert numeric IDs to question_ids
  const convertIdsToQuestionIds = (numericIds) => {
    return numericIds.map(id => idToQuestionId[id]);
  };

  // Activity Type and Intangible Asset Type Mappings (using string question_ids)
  const activityTypeMapping = {
    'De-Risking Activity': convertIdsToQuestionIds([64, 73, 22, 67, 7, 59, 32, 76, 78, 70, 69, 62, 2, 56, 5, 57, 9, 27, 21, 65, 79, 11, 77, 72, 63, 68, 20, 15, 3, 33, 71, 66, 55, 13, 17]),
    'Strategy Activity': convertIdsToQuestionIds([88, 43, 40, 51, 84, 58, 82, 87, 49, 38, 41, 46, 60, 85, 44, 47, 89, 45, 50, 83, 42, 61, 53, 86, 39]),
    'Efficiency Activity': convertIdsToQuestionIds([74, 6, 18, 52, 81, 54, 48, 37, 80, 19, 14, 16, 12, 10, 34]),
    'Growth Activity': convertIdsToQuestionIds([4, 26, 24, 1, 8, 23, 25]),
    'Culture Activity': convertIdsToQuestionIds([28, 30, 75, 35, 31, 36, 29])
  };

  const intangibleAssetMapping = {
    'Human': convertIdsToQuestionIds([28, 30, 75, 33, 74, 35, 31, 80, 62, 76, 32, 29, 67]),
    'Structural': convertIdsToQuestionIds([55, 66, 58, 81, 54, 79, 48, 37, 60, 47, 19, 57, 14, 16, 5, 56, 50, 12, 83, 10, 69, 42, 36, 70, 61, 53, 59, 34, 7, 64]),
    'Customer': convertIdsToQuestionIds([26, 15, 24, 20, 23, 21, 27, 78, 86, 25, 22, 73]),
    'Social': convertIdsToQuestionIds([88, 43, 40, 84, 82, 87, 38, 41, 85, 44, 89, 45, 39]),
    'Revenue & Profitability': convertIdsToQuestionIds([17, 13, 51, 4, 71, 3, 6, 1, 8, 68, 49, 63, 72, 18, 77, 52, 46, 11, 65, 9, 2])
  };

  const toggleCategory = (categoryKey) => {
    // If expandedCategory is an array (from filter), convert to single
    if (Array.isArray(expandedCategory)) {
      setExpandedCategory(categoryKey);
    } else {
      setExpandedCategory(expandedCategory === categoryKey ? null : categoryKey);
    }

    // Trigger animation after a brief delay to allow DOM to update
    setTimeout(() => {
      setAnimationKey(prev => prev + 1);
    }, 100);
  };

  // Category display names mapping (in assessment order)
  const categoryDisplayNames = {
    'financial_performance': 'Financial Health',
    'revenue_quality': 'Revenue Quality',
    'customer_concentration': 'Customer Base',
    'management_team': 'Management Team',
    'competitive_position': 'Competitive Position',
    'growth_potential': 'Growth Trajectory',
    'intellectual_property': 'Intellectual Property',
    'legal_compliance': 'Legal & Compliance',
    'owner_dependency': 'Owner Dependency',
    'strategic_positioning': 'Strategic Position'
  };

  // Define category order (matches assessment question order)
  const categoryOrder = [
    'financial_performance',
    'revenue_quality', 
    'customer_concentration',
    'management_team',
    'competitive_position',
    'growth_potential',
    'intellectual_property',
    'legal_compliance',
    'owner_dependency',
    'strategic_positioning'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading assessment...</div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Assessment Found</h2>
          <button
            onClick={async () => {
              await startAssessment();
              loadAssessment();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  const answeredQuestions = getAnsweredQuestions();
  const progressPercent = allQuestions.length > 0
    ? (assessment.answered_questions / allQuestions.length) * 100
    : 0;

  const categoryScores = assessment.category_scores || {};

  // Calculate scores for each filter category (must be after answeredQuestions is defined)
  const calculateFilterScores = (mapping) => {
    const scores = {};

    Object.keys(mapping).forEach(filterKey => {
      const questionIds = mapping[filterKey];

      // Match questions by question_id (now using string IDs like 'FIN-001', 'REV-002', etc.)
      const matchingResponses = answeredQuestions.filter(q => {
        return questionIds.includes(q.question_id);
      });

      // Calculate average score, excluding N/A (0) responses
      const validResponses = matchingResponses.filter(r => r.answer_value !== 0);
      if (validResponses.length > 0) {
        const totalScore = validResponses.reduce((sum, r) => sum + (r.score || 0), 0);
        scores[filterKey] = totalScore / validResponses.length;
      } else {
        scores[filterKey] = 0;
      }
    });

    return scores;
  };

  const activityTypeScores = calculateFilterScores(activityTypeMapping);
  const intangibleAssetScores = calculateFilterScores(intangibleAssetMapping);
  
  // Frontend fallback: Calculate real category scores if backend returns same score for all
  const calculateCategoryScores = () => {
    const scores = {};
    const answered = getAnsweredQuestions();
    
    categoryOrder.forEach(catKey => {
      const categoryQuestions = allQuestions.filter(q => q.category === catKey);
      const categoryAnswers = answered.filter(a => {
        const question = categoryQuestions.find(q => q.question_id === a.question_id);
        return question && a.answer_value !== 0; // Exclude N/A answers
      });
      
      if (categoryAnswers.length > 0) {
        const totalScore = categoryAnswers.reduce((sum, a) => sum + a.score, 0);
        scores[catKey] = totalScore / categoryAnswers.length;
      } else {
        scores[catKey] = 0;
      }
    });
    
    return scores;
  };
  
  // Check if backend returned all same scores (indicating it's just using overall score)
  const backendScoreValues = Object.values(categoryScores);
  const allSameScore = backendScoreValues.length > 0 && 
    backendScoreValues.every(score => score === backendScoreValues[0]);
  
  // Use calculated scores if backend scores are all the same
  const finalCategoryScores = allSameScore ? calculateCategoryScores() : categoryScores;
  
  console.log('Backend category scores:', categoryScores);
  console.log('All same score?', allSameScore);
  console.log('Final category scores:', finalCategoryScores);

  // Use ordered category list - filter those that exist in scores
  const backendKeys = Object.keys(finalCategoryScores);

  const categoryKeys = categoryOrder.filter(key => {
    return finalCategoryScores.hasOwnProperty(key);
  });

  // If no matches with ordered list, use backend keys directly
  const finalCategoryKeys = categoryKeys.length > 0 ? categoryKeys : backendKeys;

  // Filter questions if gap zone, activity type, or intangible asset is selected
  const getFilteredQuestions = (categoryKey) => {
    let categoryQuestions = getCategoryQuestions(categoryKey);

    // Apply gap zone filter
    if (selectedGapFilter) {
      // Special handling for N/A filter
      if (selectedGapFilter === 'n-a') {
        categoryQuestions = categoryQuestions.filter(q => {
          const answer = getAnswer(q.question_id);
          return answer && answer.answer_value === 0;
        });
      } else {
        // Normal gap zone filtering
        categoryQuestions = categoryQuestions.filter(q => {
          const answer = getAnswer(q.question_id);
          if (!answer) return false;
          return getGapZone(answer.score) === selectedGapFilter;
        });
      }
    }

    // Apply activity type filter
    if (activityTypeFilter) {
      const activityQuestionIds = activityTypeMapping[activityTypeFilter] || [];
      categoryQuestions = categoryQuestions.filter(q => {
        return activityQuestionIds.includes(q.question_id);
      });
    }

    // Apply intangible asset filter
    if (intangibleAssetFilter) {
      const assetQuestionIds = intangibleAssetMapping[intangibleAssetFilter] || [];
      categoryQuestions = categoryQuestions.filter(q => {
        return assetQuestionIds.includes(q.question_id);
      });
    }

    return categoryQuestions;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Historical Assessment Banner */}
      {viewingHistoricalAssessment && (
        <div className="mb-4 bg-amber-50 border-2 border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="text-amber-600" size={24} />
            <div>
              <h3 className="font-semibold text-amber-900">Viewing Historical Assessment</h3>
              <p className="text-sm text-amber-700">
                Completed on {new Date(assessment.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={handleBackToCurrent}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
          >
            <RefreshCw size={18} />
            <span>Back to Current</span>
          </button>
        </div>
      )}

      {/* Header - Redesigned */}
      <div className="mb-6">
        {/* Title Section */}
        <div className="mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Business Attractiveness Analysis</h1>
          <p className="text-lg text-gray-600">
            Assess your business attractiveness to potential buyers and identify areas for improvement
          </p>
        </div>

        {/* Action Buttons - Organized in Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={handleViewHistory}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition shadow-sm"
          >
            <History size={20} />
            <span className="font-medium">History</span>
          </button>

          {assessment && assessment.answered_questions > 0 && (
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-50 hover:border-green-300 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              <span className="font-medium">{downloadingPDF ? 'Generating...' : 'Download'}</span>
            </button>
          )}

          {!viewingHistoricalAssessment && assessment && assessment.answered_questions > 0 && (
            <button
              onClick={handleRetakeAssessment}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-orange-200 text-orange-700 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition shadow-sm"
            >
              <RefreshCw size={20} />
              <span className="font-medium">Retake</span>
            </button>
          )}

          <button
            onClick={() => setShowScoringGuide(true)}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition shadow-sm"
          >
            <HelpCircle size={20} />
            <span className="font-medium">Scoring Guide</span>
          </button>
        </div>
      </div>

      {/* Show "Start Assessment" if no answers yet */}
      {assessment.answered_questions === 0 && (
        <div className="bg-white rounded-lg border-2 border-blue-200 p-8 text-center mb-6">
          <div className="mb-4">
            <FileText size={48} className="mx-auto text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to assess your business attractiveness?
          </h2>
          <p className="text-gray-600 mb-6">
            Complete our comprehensive {allQuestions.length}-question assessment to identify gaps and opportunities
          </p>
          <button
            onClick={handleStartAssessment}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            <PlayCircle size={20} className="mr-2" />
            Start Assessment
          </button>
        </div>
      )}

      {/* Show Dashboard if assessment has answers */}
      {assessment.answered_questions > 0 && (
        <div className="space-y-6">
          {/* Overall Score Card - Condensed */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
              <div className="flex items-center justify-between gap-6">
                {/* Left: Title and Info */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">Overall Business Attractiveness</h2>
                  <p className="text-blue-100 text-xs">
                    {assessment.answered_questions} of {allQuestions.length} questions • {Math.round(progressPercent)}% complete
                  </p>
                </div>

                {/* Center: Score Display */}
                <div className="text-center bg-white/10 rounded-xl px-6 py-3 backdrop-blur-sm">
                  <div className="text-5xl font-bold leading-none mb-1">{Math.round(assessment.overall_score)}%</div>
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    assessment.overall_score > 86 ? 'bg-[#c49e73]' :
                    assessment.overall_score > 72 ? 'bg-[#a7d5a8]' :
                    assessment.overall_score > 57 ? 'bg-[#b8d4e8]' :
                    assessment.overall_score > 43 ? 'bg-[#f4ebb0]' :
                    assessment.overall_score > 28 ? 'bg-[#f5d7b3]' : 'bg-[#f5c9c9]'
                  } ${
                    assessment.overall_score > 86 ? 'text-[#8b6f47]' :
                    assessment.overall_score > 72 ? 'text-green-800' :
                    assessment.overall_score > 57 ? 'text-blue-800' :
                    assessment.overall_score > 43 ? 'text-yellow-800' :
                    assessment.overall_score > 28 ? 'text-orange-800' : 'text-red-800'
                  }`}>
                    {assessment.overall_score > 86 ? 'No Gaps' :
                     assessment.overall_score > 72 ? 'Minor Gaps' :
                     assessment.overall_score > 57 ? 'Considerable Gaps' :
                     assessment.overall_score > 43 ? 'Critical Gaps' :
                     assessment.overall_score > 28 ? 'Very Critical Gaps' : 'Extremely Critical'}
                  </div>
                </div>

                {/* Right: Progress Bar and Continue Button */}
                <div className="flex-1">
                  {/* Progress bar */}
                  <div className="relative bg-white/20 rounded-full h-3 overflow-hidden shadow-inner mb-2">
                    <div
                      key={`progress-${animationKey}`}
                      className="h-full rounded-full bg-white shadow-sm"
                      style={{
                        width: 0,
                        animation: `growWidth 2000ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                        animationFillMode: 'forwards',
                        '--final-width': `${progressPercent}%`
                      }}
                    ></div>
                  </div>

                  {/* Continue button */}
                  {assessment.answered_questions < allQuestions.length && !viewingHistoricalAssessment ? (
                    <button
                      onClick={handleStartAssessment}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold transition text-sm"
                    >
                      <PlayCircle size={16} />
                      <span>Continue Assessment</span>
                    </button>
                  ) : (
                    <div className="text-xs text-blue-100 text-center">
                      {allQuestions.length - assessment.answered_questions} questions remaining
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid - Categories Left, Charts Right */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* LEFT SIDE - Category Scores with Expandable Questions */}
            <div className="lg:col-span-3 space-y-3">
              {/* Header with Filters */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900">Category Breakdown</h3>
                  <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showFullQuestionText}
                      onChange={(e) => setShowFullQuestionText(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Show full question text</span>
                  </label>
                </div>

                {/* Filter Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Activity Type Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Filter by Activity Type
                      </label>
                      <button
                        onClick={() => setShowActivityTypeHelp(true)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Learn more about Activity Types"
                      >
                        <HelpCircle size={16} />
                      </button>
                    </div>
                    <select
                      value={activityTypeFilter || ''}
                      onChange={(e) => {
                        const newFilter = e.target.value || null;
                        setActivityTypeFilter(newFilter);

                        // Auto-expand categories with matching questions
                        if (newFilter || intangibleAssetFilter) {
                          const categoriesToExpand = [];
                          finalCategoryKeys.forEach(catKey => {
                            const categoryQuestions = getCategoryQuestions(catKey);
                            const hasMatchingQuestions = categoryQuestions.some(q => {
                              // Check activity type - try both id and question_id
                              if (newFilter) {
                                const activityIds = activityTypeMapping[newFilter] || [];
                                if (!activityIds.includes(q.question_id) && !activityIds.includes(q.id)) return false;
                              }
                              // Check intangible asset type - try both id and question_id
                              if (intangibleAssetFilter) {
                                const assetIds = intangibleAssetMapping[intangibleAssetFilter] || [];
                                if (!assetIds.includes(q.question_id) && !assetIds.includes(q.id)) return false;
                              }
                              return true;
                            });
                            if (hasMatchingQuestions) {
                              categoriesToExpand.push(catKey);
                            }
                          });
                          setExpandedCategory(categoriesToExpand.length > 0 ? categoriesToExpand : null);
                        } else {
                          setExpandedCategory(null);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">All Activities</option>
                      <option value="De-Risking Activity">De-Risking Activity</option>
                      <option value="Strategy Activity">Strategy Activity</option>
                      <option value="Efficiency Activity">Efficiency Activity</option>
                      <option value="Growth Activity">Growth Activity</option>
                      <option value="Culture Activity">Culture Activity</option>
                    </select>
                  </div>

                  {/* Intangible Asset Type Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Filter by Intangible Asset Type
                      </label>
                      <button
                        onClick={() => setShowAssetTypeHelp(true)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Learn more about Intangible Asset Types"
                      >
                        <HelpCircle size={16} />
                      </button>
                    </div>
                    <select
                      value={intangibleAssetFilter || ''}
                      onChange={(e) => {
                        const newFilter = e.target.value || null;
                        setIntangibleAssetFilter(newFilter);

                        // Auto-expand categories with matching questions
                        if (newFilter || activityTypeFilter) {
                          const categoriesToExpand = [];
                          finalCategoryKeys.forEach(catKey => {
                            const categoryQuestions = getCategoryQuestions(catKey);
                            const hasMatchingQuestions = categoryQuestions.some(q => {
                              // Check activity type - try both id and question_id
                              if (activityTypeFilter) {
                                const activityIds = activityTypeMapping[activityTypeFilter] || [];
                                if (!activityIds.includes(q.question_id) && !activityIds.includes(q.id)) return false;
                              }
                              // Check intangible asset type - try both id and question_id
                              if (newFilter) {
                                const assetIds = intangibleAssetMapping[newFilter] || [];
                                if (!assetIds.includes(q.question_id) && !assetIds.includes(q.id)) return false;
                              }
                              return true;
                            });
                            if (hasMatchingQuestions) {
                              categoriesToExpand.push(catKey);
                            }
                          });
                          setExpandedCategory(categoriesToExpand.length > 0 ? categoriesToExpand : null);
                        } else {
                          setExpandedCategory(null);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">All Asset Types</option>
                      <option value="Human">Human</option>
                      <option value="Structural">Structural</option>
                      <option value="Customer">Customer</option>
                      <option value="Social">Social</option>
                      <option value="Revenue & Profitability">Revenue & Profitability</option>
                    </select>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(activityTypeFilter || intangibleAssetFilter || selectedGapFilter) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">Active Filters:</span>
                    {activityTypeFilter && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
                        {activityTypeFilter}
                        <button
                          onClick={() => {
                            setActivityTypeFilter(null);
                            if (!intangibleAssetFilter && !selectedGapFilter) {
                              setExpandedCategory(null);
                            }
                          }}
                          className="ml-1 hover:text-purple-900"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {intangibleAssetFilter && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                        {intangibleAssetFilter}
                        <button
                          onClick={() => {
                            setIntangibleAssetFilter(null);
                            if (!activityTypeFilter && !selectedGapFilter) {
                              setExpandedCategory(null);
                            }
                          }}
                          className="ml-1 hover:text-green-900"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {selectedGapFilter && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                        {selectedGapFilter === 'n-a' ? 'N/A' : getGapZoneInfo(selectedGapFilter).label}
                        <button
                          onClick={() => setSelectedGapFilter(null)}
                          className="ml-1 hover:text-blue-900"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setActivityTypeFilter(null);
                        setIntangibleAssetFilter(null);
                        setSelectedGapFilter(null);
                        setExpandedCategory(null);
                      }}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {finalCategoryKeys.map((catKey) => {
                const score = finalCategoryScores[catKey];
                const categoryName = categoryDisplayNames[catKey] || catKey;
                const categoryQuestions = getFilteredQuestions(catKey);
                const isExpanded = Array.isArray(expandedCategory)
                ? expandedCategory.includes(catKey)
                : expandedCategory === catKey;

                return (
                  <div key={catKey} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Category Header - Clickable */}
                    <button
                      onClick={() => toggleCategory(catKey)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center space-x-3">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        <span className="font-semibold text-gray-900">{categoryName}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-lg font-bold ${getScoreTextColor(score)}`}>
                          {Math.round(score)}%
                        </span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            key={`cat-${catKey}-${animationKey}`}
                            className="h-full rounded-full"
                            style={{
                              width: 0,
                              backgroundColor: getScoreColor(score),
                              animation: `growWidth 3500ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                              animationFillMode: 'forwards',
                              '--final-width': `${score}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Questions List */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        {categoryQuestions.length > 0 ? (
                          <div className="p-3 space-y-1">
                            {categoryQuestions.map((question) => {
                              const answer = getAnswer(question.question_id);
                              return (
                                <div key={question.question_id}>
                                  <div
                                    onClick={() => !viewingHistoricalAssessment && handleQuestionEdit(question, answer)}
                                    className={`px-3 py-2 rounded border transition ${
                                      answer && answer.answer_value === 0
                                        ? 'bg-gray-50 border-gray-200 opacity-60'
                                        : viewingHistoricalAssessment
                                        ? 'bg-white border-gray-200'
                                        : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <p className={`text-sm font-medium min-w-[200px] ${
                                        answer && answer.answer_value === 0 ? 'text-gray-400' : 'text-gray-900'
                                      }`}>
                                        {question.subject || 'Question'}
                                      </p>
                                      {answer && (
                                        <>
                                          {answer.answer_value === 0 ? (
                                            // N/A Display
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
                                              N/A
                                            </span>
                                          ) : (
                                            // Normal Score Display - Inline
                                            <>
                                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                  key={`q-${question.question_id}-${animationKey}`}
                                                  className="h-full rounded-full"
                                                  style={{
                                                    width: 0,
                                                    backgroundColor: getScoreColor(answer.score),
                                                    animation: `growWidth 3500ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                                                    animationFillMode: 'forwards',
                                                    '--final-width': `${answer.score}%`
                                                  }}
                                                ></div>
                                              </div>
                                              <span className={`text-xs font-semibold whitespace-nowrap min-w-[120px] text-right ${getScoreTextColor(answer.score)}`}>
                                                {answer.score > 86 ? 'No Gaps' :
                                                 answer.score > 72 ? 'Minor Gaps' :
                                                 answer.score > 57 ? 'Considerable Gaps' :
                                                 answer.score > 43 ? 'Critical Gaps' :
                                                 answer.score > 28 ? 'Very Critical' : 'Extremely Critical'}
                                              </span>
                                            </>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {showFullQuestionText && (
                                    <p className={`text-xs mt-1 px-3 ${
                                      answer && answer.answer_value === 0 ? 'text-gray-400 line-through' : 'text-gray-500'
                                    }`}>
                                      {question.question_text}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            {selectedGapFilter 
                              ? 'No questions match the selected filter in this category'
                              : 'No questions answered in this category yet'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* RIGHT SIDE - Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gap Distribution Pie Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Gap Distribution
                  </h3>
                  {selectedGapFilter && (
                    <button
                      onClick={() => {
                        setSelectedGapFilter(null);
                        setExpandedCategory(null);
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                    >
                      <X size={16} />
                      <span>Reset Filter</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  {answeredQuestions.length > 0 ? (
                    <div className="relative w-full h-64 flex items-center justify-center">
                      <svg viewBox="0 0 200 200" className="w-64 h-64">
                        {(() => {
                          const questionsByZone = getQuestionsByGapZone();
                          
                          // Filter out N/A questions (answer_value === 0) for chart calculation
                          const totalNonNA = answeredQuestions.filter(q => q.answer_value !== 0).length;
                          
                          let currentAngle = -90;
                          
                          return Object.keys(questionsByZone).map((zone) => {
                            // Filter N/A questions from this zone
                            const nonNAQuestions = questionsByZone[zone].filter(q => q.answer_value !== 0);
                            const count = nonNAQuestions.length;

                            if (count === 0) return null;

                            const zoneInfo = getGapZoneInfo(zone);
                            const sweepAngle = (count / totalNonNA) * 360;

                            const startAngle = currentAngle;
                            const endAngle = currentAngle + sweepAngle;
                            const isHovered = hoveredGapZone === zone;
                            const isSelected = selectedGapFilter === zone;

                            // Base segment (always visible, darker)
                            const baseOuterRadius = 80;
                            const baseInnerRadius = 50;

                            // Expanded segment (on hover, lighter and transparent)
                            const expandedOuterRadius = 90;
                            const expandedInnerRadius = 45;

                            const largeArc = sweepAngle > 180 ? 1 : 0;

                            currentAngle = endAngle;

                            return (
                              <g key={zone}>
                                {/* Base lighter segment */}
                                <path
                                  d={`
                                    M ${100 + baseInnerRadius * Math.cos((startAngle * Math.PI) / 180)} ${100 + baseInnerRadius * Math.sin((startAngle * Math.PI) / 180)}
                                    L ${100 + baseOuterRadius * Math.cos((startAngle * Math.PI) / 180)} ${100 + baseOuterRadius * Math.sin((startAngle * Math.PI) / 180)}
                                    A ${baseOuterRadius} ${baseOuterRadius} 0 ${largeArc} 1 ${100 + baseOuterRadius * Math.cos((endAngle * Math.PI) / 180)} ${100 + baseOuterRadius * Math.sin((endAngle * Math.PI) / 180)}
                                    L ${100 + baseInnerRadius * Math.cos((endAngle * Math.PI) / 180)} ${100 + baseInnerRadius * Math.sin((endAngle * Math.PI) / 180)}
                                    A ${baseInnerRadius} ${baseInnerRadius} 0 ${largeArc} 0 ${100 + baseInnerRadius * Math.cos((startAngle * Math.PI) / 180)} ${100 + baseInnerRadius * Math.sin((startAngle * Math.PI) / 180)}
                                    Z
                                  `}
                                  fill={zoneInfo.color}
                                  fillOpacity={1}
                                  className="transition-all duration-200"
                                  style={{
                                    filter: 'brightness(1.1)'
                                  }}
                                />

                                {/* Expanded darker segment on hover or selected (with transparency) */}
                                {(isHovered || isSelected) && (
                                  <path
                                    d={`
                                      M ${100 + expandedInnerRadius * Math.cos((startAngle * Math.PI) / 180)} ${100 + expandedInnerRadius * Math.sin((startAngle * Math.PI) / 180)}
                                      L ${100 + expandedOuterRadius * Math.cos((startAngle * Math.PI) / 180)} ${100 + expandedOuterRadius * Math.sin((startAngle * Math.PI) / 180)}
                                      A ${expandedOuterRadius} ${expandedOuterRadius} 0 ${largeArc} 1 ${100 + expandedOuterRadius * Math.cos((endAngle * Math.PI) / 180)} ${100 + expandedOuterRadius * Math.sin((endAngle * Math.PI) / 180)}
                                      L ${100 + expandedInnerRadius * Math.cos((endAngle * Math.PI) / 180)} ${100 + expandedInnerRadius * Math.sin((endAngle * Math.PI) / 180)}
                                      A ${expandedInnerRadius} ${expandedInnerRadius} 0 ${largeArc} 0 ${100 + expandedInnerRadius * Math.cos((startAngle * Math.PI) / 180)} ${100 + expandedInnerRadius * Math.sin((startAngle * Math.PI) / 180)}
                                      Z
                                    `}
                                    fill={zoneInfo.color}
                                    fillOpacity={0.4}
                                    className="transition-all duration-200"
                                    style={{
                                      filter: 'brightness(0.7)'
                                    }}
                                  />
                                )}

                                {/* Invisible clickable overlay */}
                                <path
                                  d={`
                                    M ${100 + expandedInnerRadius * Math.cos((startAngle * Math.PI) / 180)} ${100 + expandedInnerRadius * Math.sin((startAngle * Math.PI) / 180)}
                                    L ${100 + expandedOuterRadius * Math.cos((startAngle * Math.PI) / 180)} ${100 + expandedOuterRadius * Math.sin((startAngle * Math.PI) / 180)}
                                    A ${expandedOuterRadius} ${expandedOuterRadius} 0 ${largeArc} 1 ${100 + expandedOuterRadius * Math.cos((endAngle * Math.PI) / 180)} ${100 + expandedOuterRadius * Math.sin((endAngle * Math.PI) / 180)}
                                    L ${100 + expandedInnerRadius * Math.cos((endAngle * Math.PI) / 180)} ${100 + expandedInnerRadius * Math.sin((endAngle * Math.PI) / 180)}
                                    A ${expandedInnerRadius} ${expandedInnerRadius} 0 ${largeArc} 0 ${100 + expandedInnerRadius * Math.cos((startAngle * Math.PI) / 180)} ${100 + expandedInnerRadius * Math.sin((startAngle * Math.PI) / 180)}
                                    Z
                                  `}
                                  fill="transparent"
                                  onMouseEnter={() => setHoveredGapZone(zone)}
                                  onMouseLeave={() => setHoveredGapZone(null)}
                                  onClick={() => handleGapZoneClick(zone)}
                                  className="cursor-pointer"
                                />
                              </g>
                            );
                          });
                        })()}
                        
                        <circle cx="100" cy="100" r="50" fill="white" />
                      </svg>

                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                          {hoveredGapZone ? (
                            <>
                              <div className="text-3xl font-bold" style={{ color: getGapZoneInfo(hoveredGapZone).color, filter: 'brightness(0.6)' }}>
                                {getQuestionsByGapZone()[hoveredGapZone].filter(q => q.answer_value !== 0).length}
                              </div>
                              <div className="text-xs font-semibold text-gray-800 mt-1">
                                {getGapZoneInfo(hoveredGapZone).label}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-4xl font-bold text-gray-900">
                                {Math.round(assessment.overall_score)}
                              </div>
                              <div className="text-xs font-semibold text-gray-700">Score</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-600">No data yet</p>
                      <p className="text-sm text-gray-500">Answer questions to see distribution</p>
                    </div>
                  )}
                </div>

                {assessment.answered_questions > 0 && (
                  <div className="mt-6 space-y-2">
                    {(() => {
                      const questionsByZone = getQuestionsByGapZone();
                      const zones = ['no-gaps', 'minor-gaps', 'considerable-gaps', 'critical-gaps', 'very-critical-gaps', 'extremely-critical'];
                      
                      // Count N/A questions separately
                      const naCount = answeredQuestions.filter(q => q.answer_value === 0).length;
                      
                      return (
                        <>
                          {zones.map((zone) => {
                            // Filter out N/A questions from count
                            const nonNAQuestions = questionsByZone[zone].filter(q => q.answer_value !== 0);
                            const count = nonNAQuestions.length;
                            if (count === 0) return null;

                            const zoneInfo = getGapZoneInfo(zone);
                            const isHovered = hoveredGapZone === zone;
                            const isSelected = selectedGapFilter === zone;

                            return (
                              <div
                                key={zone}
                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                                  isHovered || isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                                }`}
                                onMouseEnter={() => setHoveredGapZone(zone)}
                                onMouseLeave={() => setHoveredGapZone(null)}
                                onClick={() => handleGapZoneClick(zone)}
                              >
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-3 h-3 rounded"
                                    style={{ backgroundColor: zoneInfo.color }}
                                  ></div>
                                  <span className="text-sm text-gray-700">
                                    {zoneInfo.label} ({zoneInfo.range})
                                  </span>
                                </div>
                                <span className={`text-sm font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                          
                          {/* N/A Questions Section - Clickable */}
                          {naCount > 0 && (
                            <div 
                              className={`flex items-center justify-between p-2 rounded cursor-pointer transition border-t border-gray-200 mt-2 ${
                                selectedGapFilter === 'n-a' ? 'bg-gray-100' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                const newFilter = selectedGapFilter === 'n-a' ? null : 'n-a';
                                setSelectedGapFilter(newFilter);
                                
                                // Auto-expand categories with N/A questions
                                if (newFilter === 'n-a') {
                                  const categoriesToExpand = [];
                                  
                                  finalCategoryKeys.forEach(catKey => {
                                    const categoryQuestions = getCategoryQuestions(catKey);
                                    const hasNAQuestions = categoryQuestions.some(q => {
                                      const answer = answeredQuestions.find(a => a.question_id === q.question_id);
                                      return answer && answer.answer_value === 0;
                                    });
                                    
                                    if (hasNAQuestions) {
                                      categoriesToExpand.push(catKey);
                                    }
                                  });
                                  
                                  setExpandedCategory(categoriesToExpand.length > 0 ? categoriesToExpand : null);
                                } else {
                                  setExpandedCategory(null);
                                }
                              }}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded bg-gray-400"></div>
                                <span className="text-sm text-gray-600">
                                  N/A - Not Applicable
                                </span>
                              </div>
                              <span className={`text-sm font-semibold ${selectedGapFilter === 'n-a' ? 'text-blue-600' : 'text-gray-600'}`}>
                                {naCount}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {selectedGapFilter && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center justify-between">
                    <span>Showing "{selectedGapFilter === 'n-a' ? 'N/A - Not Applicable' : getGapZoneInfo(selectedGapFilter).label}" questions</span>
                    <button
                      onClick={() => {
                        setSelectedGapFilter(null);
                        setExpandedCategory(null);
                      }}
                      className="text-blue-600 hover:text-blue-800 transition"
                      title="Clear filter"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Readiness vs Attractiveness Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Readiness & Attractiveness
                </h3>
                <div className="relative w-full h-64">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {[20, 40, 60, 80].map(val => (
                      <React.Fragment key={val}>
                        <line x1="0" y1={100-val} x2="100" y2={100-val} stroke="#e5e7eb" strokeWidth="0.5" />
                        <line x1={val} y1="0" x2={val} y2="100" stroke="#e5e7eb" strokeWidth="0.5" />
                      </React.Fragment>
                    ))}
                    
                    <line x1="0" y1="100" x2="100" y2="100" stroke="#374151" strokeWidth="1" />
                    <line x1="0" y1="0" x2="0" y2="100" stroke="#374151" strokeWidth="1" />

                    {assessment.overall_score > 0 && (
                      <circle
                        cx={assessment.readiness_score || 20}
                        cy={100 - (assessment.attractiveness_score || 20)}
                        r="3"
                        fill="#1e40af"
                        stroke="white"
                        strokeWidth="1"
                      />
                    )}
                  </svg>

                  <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-600">
                    Readiness
                  </div>
                  <div className="absolute left-0 top-0 bottom-0 flex items-center">
                    <div className="transform -rotate-90 text-xs text-gray-600 whitespace-nowrap">
                      Attractiveness
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scoring Guide Modal */}
      {showScoringGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Scoring Guide</h3>
              <button
                onClick={() => setShowScoringGuide(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Collapsible Scoring Image */}
              <div className="mb-4">
                <button
                  onClick={() => setIsScoringGuideCollapsed(!isScoringGuideCollapsed)}
                  className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <span className="font-semibold text-gray-900">Scoring Reference Chart</span>
                  {isScoringGuideCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                </button>
                
                {!isScoringGuideCollapsed && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                    <img
                      src="/scoring-guide.png"
                      alt="Scoring Guide"
                      className="w-full h-auto rounded"
                    />
                  </div>
                )}
              </div>

              {/* Scoring Descriptions */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">How Scores Are Calculated</h4>
                  <p className="text-sm text-gray-600">
                    Each question is scored on a scale that reflects the strength of that aspect of your business. 
                    The overall score is calculated by averaging all category scores, giving you a comprehensive 
                    view of your business attractiveness to buyers.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Score Ranges</h4>
                  <p className="text-sm text-gray-600 mb-3">Based on the assessment scoring scale where average performance is around 50%:</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#c49e73' }}></div>
                      <span className="text-sm"><strong>86-100% (No Gaps):</strong> Exceptional performance, best in class</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#a7d5a8' }}></div>
                      <span className="text-sm"><strong>72-86% (Minor Gaps):</strong> Strong performance, minor improvements possible</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#b8d4e8' }}></div>
                      <span className="text-sm"><strong>57-72% (Considerable Gaps):</strong> Average to good, clear room for improvement</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f4ebb0' }}></div>
                      <span className="text-sm"><strong>43-57% (Critical Gaps):</strong> Below average, significant work needed</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f5d7b3' }}></div>
                      <span className="text-sm"><strong>28-43% (Very Critical Gaps):</strong> Poor performance, urgent attention required</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f5c9c9' }}></div>
                      <span className="text-sm"><strong>0-28% (Extremely Critical):</strong> Critical deficiency or not applicable</span>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> A score of 67% is the "green zone" target where businesses become much more attractive to buyers. A score of 72% or above is considered "best in class," representing clear, documented, and transferable processes.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Using Your Results</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Focus on categories with lower scores first. Click on any category to expand and see 
                    individual questions. Use the gap distribution chart to filter questions by score range 
                    and prioritize your improvement efforts.
                  </p>
                  <p className="text-sm text-gray-600">
                    Remember: A lower score isn't bad—it's an opportunity. It shows you exactly where to focus 
                    your efforts to maximize your exit value.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <button
                onClick={() => setShowScoringGuide(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Modal */}
      {showAssessmentModal && (
        <AssessmentModal
          assessmentId={assessment.assessment_id}
          allQuestions={allQuestions}
          answeredQuestions={answeredQuestions}
          onClose={() => {
            setShowAssessmentModal(false);
            loadAssessment();
          }}
          onSave={handleModalSave}
        />
      )}

      {/* Question Editor Modal */}
      {selectedQuestion && (
        <QuestionModal
          question={selectedQuestion}
          assessmentId={assessment.assessment_id}
          onClose={() => setSelectedQuestion(null)}
          onSave={handleQuestionSave}
        />
      )}

      {/* Assessment History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="text-purple-600" size={24} />
                <h3 className="text-xl font-bold text-gray-900">Assessment History</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {assessmentHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Previous Assessments</h3>
                  <p className="text-gray-600">
                    You haven't completed any previous assessments yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assessmentHistory.map((hist) => {
                    const isCurrentlyViewing = assessment && assessment.assessment_id === hist.assessment_id;
                    const completionPercent = hist.total_questions > 0
                      ? (hist.answered_questions / hist.total_questions) * 100
                      : 0;

                    return (
                      <div
                        key={hist.assessment_id}
                        className={`border rounded-lg p-4 transition ${
                          isCurrentlyViewing
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                Assessment from {new Date(hist.created_at).toLocaleDateString()}
                              </h4>
                              {isCurrentlyViewing && (
                                <span className="px-2 py-1 text-xs font-medium bg-purple-600 text-white rounded">
                                  Currently Viewing
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-gray-600">Overall Score</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {Math.round(hist.overall_score)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Completion</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {Math.round(completionPercent)}%
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>{hist.answered_questions} of {hist.total_questions} questions answered</span>
                              {hist.updated_at && hist.updated_at !== hist.created_at && (
                                <span>Last updated: {new Date(hist.updated_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>

                          {!isCurrentlyViewing && (
                            <button
                              onClick={() => handleLoadHistoricalAssessment(hist.assessment_id)}
                              className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition whitespace-nowrap"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Type Help Modal */}
      {showActivityTypeHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Activity Type Filter</h2>
              <button
                onClick={() => setShowActivityTypeHelp(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-gray-700 leading-relaxed">
                  Activity types categorize questions based on <strong>task completion priority</strong> and the strategic function they serve in your business. Understanding these categories helps you prioritize improvements and allocate resources effectively.
                </p>
              </div>

              {/* Show scores for each activity type */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">Your Activity Type Scores</h3>
                {answeredQuestions.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">No answered questions yet. Complete the assessment to see your scores.</p>
                  </div>
                ) : (
                  Object.keys(activityTypeMapping).map(activityType => {
                    const score = activityTypeScores[activityType] || 0;
                    const scoreColor = getScoreColor(score);
                    const darkColor = getScoreDarkColor(score);
                    return (
                      <div key={activityType} className="flex items-center justify-between p-3 rounded-lg border-2" style={{ backgroundColor: `${scoreColor}60`, borderColor: darkColor }}>
                        <span className="font-medium" style={{ color: darkColor }}>{activityType}</span>
                        <span className="text-xl font-bold" style={{ color: darkColor }}>{Math.round(score)}%</span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">De-Risking Activity</h3>
                  <p className="text-sm text-gray-700">Questions that reduce business risk and protect value. These activities should typically be completed first as they prevent value destruction and make your business more stable and predictable.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Strategy Activity</h3>
                  <p className="text-sm text-gray-700">Questions related to long-term planning, market positioning, and competitive advantage. These define the direction of your business and should be addressed after de-risking activities.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Efficiency Activity</h3>
                  <p className="text-sm text-gray-700">Questions about operational optimization, process improvement, and resource utilization. These activities make your business run smoother and more profitably.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Growth Activity</h3>
                  <p className="text-sm text-gray-700">Questions focused on expansion, new markets, and scaling operations. These activities drive top-line revenue and should be prioritized once your foundation is solid.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Culture Activity</h3>
                  <p className="text-sm text-gray-700">Questions about organizational values, team dynamics, and workplace environment. These create the foundation for sustainable performance and employee retention.</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowActivityTypeHelp(false)}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intangible Asset Type Help Modal */}
      {showAssetTypeHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Intangible Asset Type Filter</h2>
              <button
                onClick={() => setShowAssetTypeHelp(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-gray-700 leading-relaxed">
                  Intangible asset types represent the <strong>non-physical resources</strong> that create value in your business. These assets are often the most valuable components of a company and directly impact your exit valuation.
                </p>
              </div>

              {/* Show scores for each asset type */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">Your Intangible Asset Scores</h3>
                {answeredQuestions.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">No answered questions yet. Complete the assessment to see your scores.</p>
                  </div>
                ) : (
                  Object.keys(intangibleAssetMapping).map(assetType => {
                    const score = intangibleAssetScores[assetType] || 0;
                    const scoreColor = getScoreColor(score);
                    const darkColor = getScoreDarkColor(score);
                    return (
                      <div key={assetType} className="flex items-center justify-between p-3 rounded-lg border-2" style={{ backgroundColor: `${scoreColor}60`, borderColor: darkColor }}>
                        <span className="font-medium" style={{ color: darkColor }}>{assetType}</span>
                        <span className="text-xl font-bold" style={{ color: darkColor }}>{Math.round(score)}%</span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Human Capital</h3>
                  <p className="text-sm text-gray-700">The collective skills, knowledge, and capabilities of your workforce. This includes employee expertise, training programs, leadership quality, and organizational culture that drives performance.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Structural Capital</h3>
                  <p className="text-sm text-gray-700">The systems, processes, databases, and intellectual property that remain with the company. This includes proprietary software, documented procedures, patents, and organizational infrastructure.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Customer Capital</h3>
                  <p className="text-sm text-gray-700">The value of your customer relationships, brand reputation, and market position. This includes customer loyalty, retention rates, brand equity, and the strength of customer relationships.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Social Capital</h3>
                  <p className="text-sm text-gray-700">The value derived from networks, partnerships, and external relationships. This includes strategic alliances, supplier relationships, industry connections, and community reputation.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Revenue & Profitability</h3>
                  <p className="text-sm text-gray-700">The financial performance and earnings capacity of your business. This includes revenue streams, profit margins, financial stability, and the predictability of future cash flows.</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowAssetTypeHelp(false)}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
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

export default GapAnalysis;