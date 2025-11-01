import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calculator,
  TrendingUp,
  FileText,
  Building2,
  DollarSign,
  Target,
  PiggyBank,
  TrendingDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
  Edit,
  Save,
  X,
  Compass,
  CheckSquare
} from 'lucide-react';
import { getAssessment, getBusinessProfile, getWealthGap, saveWealthGap } from '../services/api';
import axios from 'axios';

const EnhancedDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [latestValuation, setLatestValuation] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [wealthGap, setWealthGap] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Wealth Gap Calculator State
  const [showWealthGapCalculator, setShowWealthGapCalculator] = useState(false);
  const [wealthGapMethod, setWealthGapMethod] = useState('single_number');
  const [wealthGoalAmount, setWealthGoalAmount] = useState('');
  const [monthlyCashNeed, setMonthlyCashNeed] = useState('');
  const [yearsOfIncome, setYearsOfIncome] = useState('20');
  const [inflationRate, setInflationRate] = useState('3.0');
  const [returnRate, setReturnRate] = useState('7.0');
  const [currentNetWorth, setCurrentNetWorth] = useState('');
  const [liquidAssets, setLiquidAssets] = useState('');
  const [retirementAccounts, setRetirementAccounts] = useState('');
  const [realEstateEquity, setRealEstateEquity] = useState('');
  const [otherInvestments, setOtherInvestments] = useState('');
  const [totalLiabilities, setTotalLiabilities] = useState('');
  const [savingWealthGap, setSavingWealthGap] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Fetch client profile first
      const profileResult = await getBusinessProfile();
      console.log('Client Profile Result:', profileResult);
      if (profileResult.success && profileResult.data.profile) {
        setBusinessProfile(profileResult.data.profile);
      }

      // Fetch latest valuation
      const valuationResponse = await axios.get('http://localhost:5000/api/valuation/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Valuation History Response:', valuationResponse.data);
      const valuations = valuationResponse.data.valuations || [];
      if (valuations.length > 0) {
        const latestVal = valuations[0];

        // Try to get full details if it's a simple valuation to extract revenue/EBITDA
        if (latestVal.type === 'simple' && latestVal.id) {
          try {
            const detailResponse = await axios.get(`http://localhost:5000/api/valuation/${latestVal.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Valuation Details Response:', detailResponse.data);
            if (detailResponse.data.input_data) {
              latestVal.revenue = detailResponse.data.input_data.revenue;
              latestVal.ebitda = detailResponse.data.input_data.ebitda;
            }
          } catch (err) {
            console.error('Error fetching valuation details:', err);
          }
        }

        // Fallback to business profile for revenue/EBITDA if not in valuation
        if ((!latestVal.revenue || !latestVal.ebitda) && profileResult.success && profileResult.data.profile) {
          latestVal.revenue = latestVal.revenue || profileResult.data.profile.revenue;
          latestVal.ebitda = latestVal.ebitda || profileResult.data.profile.ebitda;
        }

        console.log('Final Latest Valuation:', latestVal);
        setLatestValuation(latestVal);
      }

      // Fetch assessment
      const assessmentResult = await getAssessment();
      console.log('Assessment Result:', assessmentResult);
      if (assessmentResult.success && assessmentResult.data) {
        setAssessment(assessmentResult.data);
      }

      // Fetch wealth gap
      const wealthGapResult = await getWealthGap();
      console.log('Wealth Gap Result:', wealthGapResult);
      if (wealthGapResult.success && wealthGapResult.data.wealth_gap) {
        setWealthGap(wealthGapResult.data.wealth_gap);
        populateWealthGapForm(wealthGapResult.data.wealth_gap);
      }

      // Fetch task stats
      try {
        const taskStatsResponse = await axios.get('http://localhost:5000/api/tasks/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (taskStatsResponse.data.success) {
          setTaskStats(taskStatsResponse.data.stats);
        }
      } catch (error) {
        console.log('No tasks yet or error fetching task stats');
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const populateWealthGapForm = (data) => {
    setWealthGapMethod(data.wealth_goal_method || 'single_number');
    setWealthGoalAmount(data.wealth_goal_amount || '');
    setMonthlyCashNeed(data.monthly_cash_need || '');
    setYearsOfIncome(data.years_of_income || '20');
    setInflationRate(data.annual_inflation_rate || '3.0');
    setReturnRate(data.annual_return_rate || '7.0');
    setCurrentNetWorth(data.current_net_worth || '');
    setLiquidAssets(data.liquid_assets || '');
    setRetirementAccounts(data.retirement_accounts || '');
    setRealEstateEquity(data.real_estate_equity || '');
    setOtherInvestments(data.other_investments || '');
    setTotalLiabilities(data.total_liabilities || '');
  };

  const handleSaveWealthGap = async () => {
    setSavingWealthGap(true);
    try {
      const wealthGapData = {
        wealth_goal_method: wealthGapMethod,
        wealth_goal_amount: parseFloat(wealthGoalAmount) || 0,
        monthly_cash_need: parseFloat(monthlyCashNeed) || 0,
        years_of_income: parseInt(yearsOfIncome) || 20,
        annual_inflation_rate: parseFloat(inflationRate) || 3.0,
        annual_return_rate: parseFloat(returnRate) || 7.0,
        current_net_worth: parseFloat(currentNetWorth) || 0,
        liquid_assets: parseFloat(liquidAssets) || 0,
        retirement_accounts: parseFloat(retirementAccounts) || 0,
        real_estate_equity: parseFloat(realEstateEquity) || 0,
        other_investments: parseFloat(otherInvestments) || 0,
        total_liabilities: parseFloat(totalLiabilities) || 0
      };

      const result = await saveWealthGap(wealthGapData);
      if (result.success) {
        setWealthGap(result.data.wealth_gap);
        setShowWealthGapCalculator(false);
        alert('Wealth gap saved successfully!');
      } else {
        alert('Failed to save wealth gap: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving wealth gap:', error);
      alert('Failed to save wealth gap');
    } finally {
      setSavingWealthGap(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (!value && value !== 0) return '0%';
    return `${Math.round(value)}%`;
  };

  const getScoreColor = (score) => {
    if (score > 86) return 'text-[#8b6f47]';
    if (score > 72) return 'text-green-600';
    if (score > 57) return 'text-blue-600';
    if (score > 43) return 'text-yellow-600';
    if (score > 28) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score > 86) return 'bg-[#f5e6d3]';
    if (score > 72) return 'bg-green-50';
    if (score > 57) return 'bg-blue-50';
    if (score > 43) return 'bg-yellow-50';
    if (score > 28) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const getScoreBorderColor = (score) => {
    if (score > 86) return 'border-[#c49e73]';
    if (score > 72) return 'border-green-200';
    if (score > 57) return 'border-blue-200';
    if (score > 43) return 'border-yellow-200';
    if (score > 28) return 'border-orange-200';
    return 'border-red-200';
  };

  const getScoreLabel = (score) => {
    if (score > 86) return 'No Gaps';
    if (score > 72) return 'Minor Gaps';
    if (score > 57) return 'Considerable Gaps';
    if (score > 43) return 'Critical Gaps';
    if (score > 28) return 'Very Critical Gaps';
    return 'Extremely Critical';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.full_name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-gray-600">Your comprehensive exit planning dashboard</p>
      </div>

      {/* Client Information Card */}
      {businessProfile && (businessProfile.client_first_name || businessProfile.client_last_name || businessProfile.business_name) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Building2 className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Client Name */}
                  {(businessProfile.client_first_name || businessProfile.client_last_name) && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Client Name</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {businessProfile.client_first_name} {businessProfile.client_last_name}
                      </p>
                    </div>
                  )}

                  {/* Business Name */}
                  {businessProfile.business_name && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Business Name</p>
                      <p className="text-lg font-semibold text-gray-900">{businessProfile.business_name}</p>
                    </div>
                  )}

                  {/* Industry */}
                  {businessProfile.industry && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Industry</p>
                      <p className="text-lg font-semibold text-gray-900">{businessProfile.industry}</p>
                    </div>
                  )}
                </div>

                {/* Second Row - Contact and Location */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                  {/* Email */}
                  {businessProfile.client_email && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                      <p className="text-sm text-gray-900">{businessProfile.client_email}</p>
                    </div>
                  )}

                  {/* Phone */}
                  {businessProfile.client_phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Phone</p>
                      <p className="text-sm text-gray-900">{businessProfile.client_phone}</p>
                    </div>
                  )}

                  {/* Location */}
                  {(businessProfile.client_city || businessProfile.client_state) && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Location</p>
                      <p className="text-sm text-gray-900">
                        {businessProfile.client_city && businessProfile.client_state
                          ? `${businessProfile.client_city}, ${businessProfile.client_state}`
                          : businessProfile.client_city || businessProfile.client_state}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/business-profile')}
              className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 text-blue-600 rounded-lg font-semibold transition border border-blue-200"
            >
              <Edit size={16} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column - Valuation & Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Valuation Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Calculator size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Most Recent Valuation</h2>
                    <p className="text-blue-100 text-sm">Your business value assessment</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/valuation')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition backdrop-blur-sm border border-white/30"
                >
                  New Valuation
                </button>
              </div>
            </div>

            <div className="p-6">
              {latestValuation ? (
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Estimated Business Value</p>
                      <p className="text-4xl font-bold text-gray-900">
                        {formatCurrency(latestValuation.valuation_amount)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/valuation-dashboard')}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center space-x-1"
                    >
                      <span>View Details</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Primary Method</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {latestValuation.primary_method || 'Multiple of EBITDA'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Calculated</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(latestValuation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Annual Revenue</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(latestValuation.revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">EBITDA</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(latestValuation.ebitda)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600 mb-4">No valuation calculated yet</p>
                  <button
                    onClick={() => navigate('/valuation')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                  >
                    Calculate Valuation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Client Profile Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Building2 size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Client Profile</h2>
                    <p className="text-purple-100 text-sm">Client and business information</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/business-profile')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition backdrop-blur-sm border border-white/30 flex items-center space-x-2"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {businessProfile ? (
                <div className="space-y-4">
                  {/* Client Name */}
                  {(businessProfile.client_first_name || businessProfile.client_last_name) && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Client Name</p>
                      <p className="text-xl font-bold text-gray-900">
                        {businessProfile.client_first_name} {businessProfile.client_last_name}
                      </p>
                    </div>
                  )}

                  {/* Business Name */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Business Name</p>
                    <p className="text-xl font-bold text-gray-900">{businessProfile.business_name || 'Not set'}</p>
                  </div>

                  {/* Grid of key business info */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Industry</p>
                      <p className="text-sm font-semibold text-gray-900">{businessProfile.industry || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Employees</p>
                      <p className="text-sm font-semibold text-gray-900">{businessProfile.employees || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Founded</p>
                      <p className="text-sm font-semibold text-gray-900">{businessProfile.year_founded || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Primary Market</p>
                      <p className="text-sm font-semibold text-gray-900">{businessProfile.primary_market || 'Not set'}</p>
                    </div>
                  </div>

                  {/* Exit Planning Info */}
                  {(businessProfile.exit_horizon || businessProfile.preferred_exit_type) && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-3">Exit Planning</p>
                      <div className="grid grid-cols-2 gap-4">
                        {businessProfile.exit_horizon && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Exit Horizon</p>
                            <p className="text-sm font-semibold text-gray-900">{businessProfile.exit_horizon}</p>
                          </div>
                        )}
                        {businessProfile.preferred_exit_type && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Preferred Exit Type</p>
                            <p className="text-sm font-semibold text-gray-900">{businessProfile.preferred_exit_type}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  {(businessProfile.client_email || businessProfile.client_phone) && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-3">Contact Information</p>
                      <div className="space-y-2">
                        {businessProfile.client_email && (
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500 w-16">Email:</span>
                            <span className="text-gray-900 font-medium">{businessProfile.client_email}</span>
                          </div>
                        )}
                        {businessProfile.client_phone && (
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500 w-16">Phone:</span>
                            <span className="text-gray-900 font-medium">{businessProfile.client_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600 mb-4">No business profile created yet</p>
                  <button
                    onClick={() => navigate('/business-profile')}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition"
                  >
                    Create Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Assessment & Wealth Gap */}
        <div className="space-y-6">
          {/* Business Attractiveness Score */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Attractiveness Score</h2>
                  <p className="text-green-100 text-xs">Gap analysis assessment</p>
                </div>
              </div>

              {assessment && assessment.answered_questions > 0 ? (
                <div className="space-y-3">
                  <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-5xl font-bold mb-2">
                      {formatPercentage(assessment.overall_score)}
                    </div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      assessment.overall_score > 86 ? 'bg-[#c49e73] text-[#8b6f47]' :
                      assessment.overall_score > 72 ? 'bg-green-200 text-green-800' :
                      assessment.overall_score > 57 ? 'bg-blue-200 text-blue-800' :
                      assessment.overall_score > 43 ? 'bg-yellow-200 text-yellow-800' :
                      assessment.overall_score > 28 ? 'bg-orange-200 text-orange-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {getScoreLabel(assessment.overall_score)}
                    </div>
                  </div>

                  <div className="text-sm text-green-100">
                    <div className="flex justify-between mb-1">
                      <span>Progress</span>
                      <span className="font-semibold">{assessment.answered_questions} / 89 questions</span>
                    </div>
                    <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full transition-all"
                        style={{ width: `${(assessment.answered_questions / 89) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-green-100 text-sm mb-3">Start your assessment to see your score</p>
                </div>
              )}
            </div>

            <div className="p-4">
              <button
                onClick={() => navigate('/gap-analysis')}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition flex items-center justify-center space-x-2"
              >
                {assessment && assessment.answered_questions > 0 ? (
                  <>
                    <span>View Gap Analysis</span>
                    <ChevronRight size={16} />
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    <span>Start Assessment</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Task Manager Summary */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CheckSquare size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Task Manager</h2>
                  <p className="text-indigo-100 text-xs">Improvement action items</p>
                </div>
              </div>

              {taskStats && taskStats.total > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 text-center">
                      <div className="text-2xl font-bold">{taskStats.not_started}</div>
                      <div className="text-xs text-indigo-100">Not Started</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 text-center">
                      <div className="text-2xl font-bold">{taskStats.in_progress}</div>
                      <div className="text-xs text-indigo-100">In Progress</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 text-center">
                      <div className="text-2xl font-bold">{taskStats.under_review}</div>
                      <div className="text-xs text-indigo-100">Under Review</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 text-center">
                      <div className="text-2xl font-bold">{taskStats.completed}</div>
                      <div className="text-xs text-indigo-100">Completed</div>
                    </div>
                  </div>

                  <div className="text-sm text-indigo-100">
                    <div className="flex justify-between mb-1">
                      <span>Completion Rate</span>
                      <span className="font-semibold">{taskStats.completion_rate}%</span>
                    </div>
                    <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full transition-all"
                        style={{ width: `${taskStats.completion_rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-indigo-100 text-sm mb-3">Complete assessments to generate improvement tasks</p>
                </div>
              )}
            </div>

            <div className="p-4">
              <button
                onClick={() => navigate('/task-manager')}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition flex items-center justify-center space-x-2"
              >
                <span>View Task Manager</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Wealth Gap Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Target size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Wealth Gap</h2>
                  <p className="text-orange-100 text-xs">Financial readiness analysis</p>
                </div>
              </div>

              {wealthGap && wealthGap.calculated_wealth_goal > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <p className="text-xs text-orange-100 mb-1">Wealth Goal</p>
                      <p className="text-lg font-bold">{formatCurrency(wealthGap.calculated_wealth_goal)}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <p className="text-xs text-orange-100 mb-1">Net Worth</p>
                      <p className="text-lg font-bold">{formatCurrency(wealthGap.current_net_worth)}</p>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-xs text-orange-100 mb-2">Your Wealth Gap</p>
                    <div className="flex items-baseline">
                      <p className={`text-3xl font-bold ${wealthGap.calculated_wealth_gap > 0 ? 'text-white' : 'text-green-200'}`}>
                        {formatCurrency(Math.abs(wealthGap.calculated_wealth_gap))}
                      </p>
                      {wealthGap.calculated_wealth_gap <= 0 && (
                        <span className="ml-2 text-green-200 text-sm font-semibold">Surplus!</span>
                      )}
                    </div>
                    {wealthGap.calculated_wealth_gap > 0 && (
                      <p className="text-xs text-orange-100 mt-1">Amount needed to reach your goal</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-orange-100 text-sm mb-3">Calculate your wealth gap to see if you're ready to exit</p>
                </div>
              )}
            </div>

            <div className="p-4">
              <button
                onClick={() => setShowWealthGapCalculator(true)}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition flex items-center justify-center space-x-2"
              >
                <Calculator size={16} />
                <span>{wealthGap ? 'Update' : 'Calculate'} Wealth Gap</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={() => navigate('/valuation')}
            className="flex items-center gap-4 p-4 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
              <Calculator className="text-blue-600" size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">New Valuation</h3>
              <p className="text-sm text-gray-600">Calculate business value</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/gap-analysis')}
            className="flex items-center gap-4 p-4 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
          >
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Gap Analysis</h3>
              <p className="text-sm text-gray-600">Assess attractiveness</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/task-manager')}
            className="flex items-center gap-4 p-4 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
          >
            <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition">
              <CheckSquare className="text-indigo-600" size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Task Manager</h3>
              <p className="text-sm text-gray-600">Manage action items</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/exit-strategy-quiz')}
            className="flex items-center gap-4 p-4 border-2 border-cyan-200 rounded-xl hover:border-cyan-400 hover:bg-cyan-50 transition-all group"
          >
            <div className="p-3 bg-cyan-100 rounded-lg group-hover:bg-cyan-200 transition">
              <Compass className="text-cyan-600" size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Exit Strategy Quiz</h3>
              <p className="text-sm text-gray-600">Find best exit options</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/business-profile')}
            className="flex items-center gap-4 p-4 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all group"
          >
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
              <Building2 className="text-purple-600" size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Update Profile</h3>
              <p className="text-sm text-gray-600">Edit business details</p>
            </div>
          </button>
        </div>
      </div>

      {/* Wealth Gap Calculator Modal */}
      {showWealthGapCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 border-b border-orange-700 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Target size={32} />
                  <div>
                    <h2 className="text-2xl font-bold">Wealth Gap Calculator</h2>
                    <p className="text-orange-100 text-sm">Calculate your financial readiness for exit</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWealthGapCalculator(false)}
                  className="text-white hover:text-orange-200 transition"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Wealth Goal Method Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">How would you like to calculate your wealth goal?</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setWealthGapMethod('single_number')}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      wealthGapMethod === 'single_number'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <DollarSign size={24} className={wealthGapMethod === 'single_number' ? 'text-orange-600' : 'text-gray-400'} />
                      <h3 className="font-semibold text-gray-900">Single Number</h3>
                    </div>
                    <p className="text-sm text-gray-600">I know my total wealth goal</p>
                  </button>

                  <button
                    onClick={() => setWealthGapMethod('monthly_needs')}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      wealthGapMethod === 'monthly_needs'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <PiggyBank size={24} className={wealthGapMethod === 'monthly_needs' ? 'text-orange-600' : 'text-gray-400'} />
                      <h3 className="font-semibold text-gray-900">Monthly Needs</h3>
                    </div>
                    <p className="text-sm text-gray-600">Based on monthly income needs</p>
                  </button>
                </div>
              </div>

              {/* Wealth Goal Inputs */}
              {wealthGapMethod === 'single_number' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Wealth Goal Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      value={wealthGoalAmount}
                      onChange={(e) => setWealthGoalAmount(e.target.value)}
                      placeholder="5000000"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Total amount you need to retire comfortably</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Monthly Cash Need</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500">$</span>
                      <input
                        type="number"
                        value={monthlyCashNeed}
                        onChange={(e) => setMonthlyCashNeed(e.target.value)}
                        placeholder="15000"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">How much do you need per month after exit?</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Years of Income</label>
                      <input
                        type="number"
                        value={yearsOfIncome}
                        onChange={(e) => setYearsOfIncome(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Inflation Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inflationRate}
                        onChange={(e) => setInflationRate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Return Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={returnRate}
                        onChange={(e) => setReturnRate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Current Net Worth */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Current Financial Position (Not Including Business Value)</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Liquid Assets</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500">$</span>
                      <input
                        type="number"
                        value={liquidAssets}
                        onChange={(e) => setLiquidAssets(e.target.value)}
                        placeholder="250000"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Cash, savings, checking accounts</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Retirement Accounts</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500">$</span>
                      <input
                        type="number"
                        value={retirementAccounts}
                        onChange={(e) => setRetirementAccounts(e.target.value)}
                        placeholder="500000"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">401(k), IRA, pension value</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Real Estate Equity</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500">$</span>
                      <input
                        type="number"
                        value={realEstateEquity}
                        onChange={(e) => setRealEstateEquity(e.target.value)}
                        placeholder="750000"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Home equity, investment properties</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Other Investments</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500">$</span>
                      <input
                        type="number"
                        value={otherInvestments}
                        onChange={(e) => setOtherInvestments(e.target.value)}
                        placeholder="300000"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Stocks, bonds, other assets</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Total Liabilities</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500">$</span>
                      <input
                        type="number"
                        value={totalLiabilities}
                        onChange={(e) => setTotalLiabilities(e.target.value)}
                        placeholder="200000"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Mortgages, loans, credit card debt</p>
                  </div>
                </div>

                {/* Calculated Net Worth Display */}
                {(liquidAssets || retirementAccounts || realEstateEquity || otherInvestments || totalLiabilities) && (
                  <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">Calculated Net Worth:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(
                          (parseFloat(liquidAssets) || 0) +
                          (parseFloat(retirementAccounts) || 0) +
                          (parseFloat(realEstateEquity) || 0) +
                          (parseFloat(otherInvestments) || 0) -
                          (parseFloat(totalLiabilities) || 0)
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start space-x-3">
                  <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-1">Important:</p>
                    <p>Do not include your business value in these calculations. Your wealth gap shows how much you need from the business sale to reach your financial goals.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
              <button
                onClick={() => setShowWealthGapCalculator(false)}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWealthGap}
                disabled={savingWealthGap}
                className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold"
              >
                {savingWealthGap ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Save Wealth Gap</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboard;
