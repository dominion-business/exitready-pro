import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, DollarSign, Target, Calendar, Edit2, RefreshCw, Building2, Users, Briefcase, ArrowUpRight, ArrowDownRight, Activity, PieChart, Eye, X, ChevronRight, History } from 'lucide-react';
import { getBusinessProfile, getWealthGap } from '../services/api';

const ValuationDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [latestValuation, setLatestValuation] = useState(null);
  const [valuationHistory, setValuationHistory] = useState([]);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [wealthGap, setWealthGap] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedValuation, setSelectedValuation] = useState(null);
  const [viewingHistoricalValuation, setViewingHistoricalValuation] = useState(false);

  // Interactive controls
  const [growthRate, setGrowthRate] = useState(15);
  const [profitMargin, setprofitMargin] = useState(20);
  const [ebitdaMargin, setEbitdaMargin] = useState(0);
  const [industryMultiple, setIndustryMultiple] = useState(12); // Default EV/EBITDA multiple

  // Financial metrics (editable)
  const [financials, setFinancials] = useState({
    revenue: 0,
    ebitda: 0,
    grossProfit: 0,
    assetValue: 0,
    grossMargin: 0,
    profitMargin: 0,
    netIncome: 0
  });

  // Goals
  const [goals, setGoals] = useState({
    targetValuation: 0,
    lifestyleNeeds: 0,
    minimumExit: 0
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Fetch valuation history
      const valuationResponse = await axios.get('http://localhost:5000/api/valuation/history', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const valuations = valuationResponse.data.valuations || [];
      setValuationHistory(valuations);

      // Fetch business profile
      const profileResult = await getBusinessProfile();
      if (profileResult.success && profileResult.data.profile) {
        setBusinessProfile(profileResult.data.profile);
      }

      // Fetch wealth gap
      const wealthGapResult = await getWealthGap();
      console.log('Wealth gap result:', wealthGapResult);
      if (wealthGapResult.success && wealthGapResult.data && wealthGapResult.data.wealth_gap) {
        const wealthGapData = wealthGapResult.data.wealth_gap;
        setWealthGap(wealthGapData);

        // Extract wealth goal from the response
        const wealthGoal = wealthGapData.calculated_wealth_goal || wealthGapData.wealth_goal_amount || 0;
        console.log('Wealth goal extracted:', wealthGoal);

        if (wealthGoal > 0) {
          setGoals({
            targetValuation: wealthGoal,
            lifestyleNeeds: wealthGoal * 0.8,
            minimumExit: wealthGoal * 0.6
          });
        }
      }

      if (valuations.length > 0) {
        const latest = valuations[0];
        console.log('=== VALUATION DASHBOARD DEBUG ===');
        console.log('Latest valuation object:', latest);
        console.log('input_data type:', typeof latest.input_data);
        console.log('input_data value:', latest.input_data);

        setLatestValuation(latest);

        // Parse and extract financial data from input_data
        try {
          let inputs = null;

          // input_data is stored as a JSON string in the database
          if (latest.input_data) {
            console.log('Attempting to parse input_data...');
            inputs = typeof latest.input_data === 'string'
              ? JSON.parse(latest.input_data)
              : latest.input_data;
            console.log('Successfully parsed inputs:', inputs);
          } else {
            console.warn('No input_data found in valuation');
          }

          if (inputs) {
            const revenue = parseFloat(inputs.revenue) || 0;
            const ebitda = parseFloat(inputs.ebitda) || 0;
            const netIncome = parseFloat(inputs.net_income) || 0;
            const totalAssets = parseFloat(inputs.total_assets) || 0;

            console.log('Extracted financial values:');
            console.log('  Revenue:', revenue);
            console.log('  EBITDA:', ebitda);
            console.log('  Net Income:', netIncome);
            console.log('  Total Assets:', totalAssets);

            const calculatedMargin = revenue && ebitda ? Math.round((ebitda / revenue) * 100) : 0;

            const financialData = {
              revenue: revenue,
              ebitda: ebitda,
              grossProfit: ebitda,
              assetValue: totalAssets,
              grossMargin: calculatedMargin,
              profitMargin: revenue && netIncome ? Math.round((netIncome / revenue) * 100) : 0,
              netIncome: netIncome
            };

            console.log('Setting financials state:', financialData);
            setFinancials(financialData);
            setEbitdaMargin(calculatedMargin);

            // Fetch industry multiple if industry_id is present
            if (inputs.industry_id) {
              try {
                const industryResponse = await axios.get(
                  `http://localhost:5000/api/valuation/industry/${inputs.industry_id}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                if (industryResponse.data.success && industryResponse.data.industry) {
                  const evEbitdaMedian = industryResponse.data.industry.ev_ebitda_median || 12;
                  console.log('Industry EV/EBITDA Multiple:', evEbitdaMedian);
                  setIndustryMultiple(evEbitdaMedian);
                }
              } catch (error) {
                console.error('Error fetching industry multiple:', error);
                // Use default multiple if fetch fails
                setIndustryMultiple(12);
              }
            }
          } else {
            console.warn('inputs is null or undefined after parsing');
          }
        } catch (error) {
          console.error('Error parsing valuation input_data:', error);
          console.error('Error stack:', error.stack);
        }

        // Set growth rate from profile if available
        if (profileResult.data?.profile?.growth_rate) {
          setGrowthRate(parseFloat(profileResult.data.profile.growth_rate));
        }
      } else {
        console.warn('No valuations found in history');
      }

      console.log('=== END VALUATION DASHBOARD DEBUG ===');

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatShortCurrency = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // Get valuation method description
  const getMethodDescription = (method) => {
    const descriptions = {
      'cca': 'Comparable Company Analysis - Values your business by comparing it to similar publicly traded companies in your industry.',
      'dcf': 'Discounted Cash Flow - Calculates present value of projected future cash flows, ideal for businesses with predictable earnings.',
      'asset': 'Asset-Based Valuation - Values your business based on the fair market value of its net assets (assets minus liabilities).',
      'sde': 'Seller\'s Discretionary Earnings - Common for small businesses, adds back owner\'s salary and discretionary expenses to EBITDA.',
      'manual': 'Manual Multiple - Custom valuation using your specified multiple of revenue or EBITDA.',
      'multiple': 'Multiple of EBITDA - Industry standard approach using earnings before interest, taxes, depreciation, and amortization.'
    };
    return descriptions[method?.toLowerCase()] || 'Industry-standard valuation methodology based on your business financials.';
  };

  // Calculate financial ratios from current data
  const calculateFinancialRatios = () => {
    const revenue = financials.revenue || 0;
    const ebitda = financials.ebitda || 0;
    const netIncome = financials.netIncome || 0;
    const totalAssets = financials.assetValue || 0;

    // Calculate equity from assets - liabilities (simplified)
    // If we don't have liabilities data, estimate equity as 60% of assets
    const equity = totalAssets * 0.6;

    return {
      // Profitability Ratios
      grossMargin: revenue > 0 ? ((ebitda / revenue) * 100) : 0,
      ebitdaMargin: revenue > 0 ? ((ebitda / revenue) * 100) : 0,
      netMargin: revenue > 0 ? ((netIncome / revenue) * 100) : 0,

      // Efficiency Ratios
      assetTurnover: totalAssets > 0 ? (revenue / totalAssets) : 0,
      roa: totalAssets > 0 ? ((ebitda / totalAssets) * 100) : 0,
      roe: equity > 0 ? ((ebitda / equity) * 100) : 0,
    };
  };

  const ratios = calculateFinancialRatios();

  // Handle viewing a specific historical valuation
  const handleViewValuation = (valuation) => {
    setSelectedValuation(valuation);
  };

  // Handle going back to current valuation
  const handleBackToCurrent = () => {
    setViewingHistoricalValuation(false);
    fetchAllData();
  };

  // Handle loading a historical valuation
  const handleLoadHistoricalValuation = (valuation) => {
    setLatestValuation(valuation);
    setViewingHistoricalValuation(true);
    setShowHistoryModal(false);

    // Parse and set financials from historical valuation
    try {
      let inputs = null;
      if (valuation.input_data) {
        inputs = typeof valuation.input_data === 'string'
          ? JSON.parse(valuation.input_data)
          : valuation.input_data;
      }

      if (inputs) {
        const revenue = parseFloat(inputs.revenue) || 0;
        const ebitda = parseFloat(inputs.ebitda) || 0;
        const netIncome = parseFloat(inputs.net_income) || 0;
        const totalAssets = parseFloat(inputs.total_assets) || 0;

        setFinancials({
          revenue: revenue,
          ebitda: ebitda,
          grossProfit: ebitda,
          assetValue: totalAssets,
          grossMargin: revenue && ebitda ? Math.round((ebitda / revenue) * 100) : 0,
          profitMargin: revenue && netIncome ? Math.round((netIncome / revenue) * 100) : 0,
          netIncome: netIncome
        });
      }
    } catch (error) {
      console.error('Error parsing historical valuation data:', error);
    }
  };

  // Generate forecast data based on revenue growth, EBITDA margin, and industry multiple
  const generateForecastData = () => {
    const currentRevenue = financials.revenue || 0;
    if (currentRevenue === 0) return [];

    const years = 5;
    const data = [];
    const startDate = new Date();

    for (let i = 0; i <= years * 4; i++) { // Quarterly data
      const quarter = i;
      const year = Math.floor(i / 4);
      const month = (i % 4) * 3;
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + month);
      date.setFullYear(date.getFullYear() + year);

      // Project revenue based on growth rate
      const quarterlyGrowth = (growthRate / 100) / 4; // Convert annual to quarterly
      const projectedRevenue = currentRevenue * Math.pow(1 + quarterlyGrowth, i);

      // Calculate projected EBITDA based on the adjustable margin slider
      const projectedEbitda = projectedRevenue * (ebitdaMargin / 100);

      // Calculate valuation: EBITDA × Industry Multiple
      const projectedValue = projectedEbitda * industryMultiple;

      // Add some variance for the range
      const highValue = projectedValue * 1.25;
      const lowValue = projectedValue * 0.75;

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        value: Math.round(projectedValue),
        high: Math.round(highValue),
        low: Math.round(lowValue),
        targetValuation: goals.targetValuation,
        lifestyleNeeds: goals.lifestyleNeeds,
        minimumExit: goals.minimumExit
      });
    }
    
    return data;
  };

  const forecastData = generateForecastData();

  // Generate EBITDA/Gross Profit forecast data based on revenue and EBITDA margin slider
  const generateEbitdaForecastData = () => {
    const currentRevenue = financials.revenue || 0;
    if (currentRevenue === 0) return [];

    const years = 5;
    const data = [];
    const startDate = new Date();

    for (let i = 0; i <= years * 4; i++) { // Quarterly data
      const year = Math.floor(i / 4);
      const month = (i % 4) * 3;
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + month);
      date.setFullYear(date.getFullYear() + year);

      const quarterlyGrowth = (growthRate / 100) / 4; // Convert annual to quarterly
      const projectedRevenue = currentRevenue * Math.pow(1 + quarterlyGrowth, i);

      // Calculate EBITDA based on the adjustable margin
      const projectedEbitda = projectedRevenue * (ebitdaMargin / 100);

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: Math.round(projectedRevenue),
        ebitda: Math.round(projectedEbitda),
        margin: ebitdaMargin
      });
    }

    return data;
  };

  const ebitdaForecastData = generateEbitdaForecastData();

  // Calculate value gap using actual wealth gap from API
  const valueGap = wealthGap && wealthGap.calculated_wealth_gap !== undefined
    ? wealthGap.calculated_wealth_gap
    : (latestValuation && goals.targetValuation
        ? goals.targetValuation - latestValuation.valuation_amount
        : 0);

  const valueGapPercentage = goals.targetValuation && goals.targetValuation > 0
    ? Math.round((Math.abs(valueGap) / goals.targetValuation) * 100)
    : 0;

  // Prepare history chart data
  const historyChartData = valuationHistory.slice().reverse().map((val, index) => ({
    date: new Date(val.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    valuation: val.valuation_amount,
    lowRange: val.low_range,
    highRange: val.high_range
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!latestValuation) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Valuations Yet</h2>
          <p className="text-gray-600 mb-4">Calculate your first valuation to see your dashboard</p>
          <a
            href="/valuation"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Calculate Valuation
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Historical Valuation Banner */}
      {viewingHistoricalValuation && (
        <div className="mb-4 bg-amber-50 border-2 border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="text-amber-600" size={24} />
            <div>
              <h3 className="font-semibold text-amber-900">Viewing Historical Valuation</h3>
              <p className="text-sm text-amber-700">
                Calculated on {new Date(latestValuation.created_at).toLocaleDateString()}
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

      {/* Header with Business Info */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Valuation Dashboard</h1>
            <p className="text-sm text-gray-500">Track your business value and forecast growth</p>
          </div>
          {valuationHistory.length > 1 && (
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
            >
              <History size={18} />
              <span>History</span>
            </button>
          )}
        </div>

        {businessProfile && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Business</p>
                <p className="text-sm font-semibold text-gray-900">{businessProfile.business_name}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-blue-200"></div>
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-indigo-600" />
              <div>
                <p className="text-xs text-gray-500">Industry</p>
                <p className="text-sm font-semibold text-gray-900">{businessProfile.industry}</p>
              </div>
            </div>
            {businessProfile.employees && (
              <>
                <div className="h-8 w-px bg-blue-200"></div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Employees</p>
                    <p className="text-sm font-semibold text-gray-900">{businessProfile.employees}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Key Metrics Cards - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Current Valuation */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl shadow-lg p-5 text-white group hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <DollarSign size={20} />
              </div>
              <ArrowUpRight size={18} className="text-blue-200 opacity-70" />
            </div>
            <p className="text-blue-100 text-xs font-medium mb-1">Current Valuation</p>
            <p className="text-2xl font-bold mb-1">{formatShortCurrency(latestValuation?.valuation_amount || 0)}</p>
            {latestValuation?.low_range && latestValuation?.high_range && (
              <p className="text-blue-200 text-xs opacity-90">
                {formatShortCurrency(latestValuation.low_range)} - {formatShortCurrency(latestValuation.high_range)}
              </p>
            )}
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              Revenue
            </span>
          </div>
          <p className="text-gray-500 text-xs font-medium mb-1">Annual Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatShortCurrency(financials.revenue)}</p>
          {businessProfile?.growth_rate && (
            <p className="text-green-600 text-xs font-medium flex items-center">
              <ArrowUpRight size={14} className="mr-1" />
              {businessProfile.growth_rate}% Growth
            </p>
          )}
        </div>

        {/* EBITDA */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg">
              <Activity size={20} className="text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
              EBITDA
            </span>
          </div>
          <p className="text-gray-500 text-xs font-medium mb-1">Annual EBITDA</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatShortCurrency(financials.ebitda)}</p>
          {financials.grossMargin > 0 && (
            <p className="text-purple-600 text-xs font-medium">
              {financials.grossMargin}% Margin
            </p>
          )}
        </div>

        {/* Net Income */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg">
              <DollarSign size={20} className="text-indigo-600" />
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              Net Income
            </span>
          </div>
          <p className="text-gray-500 text-xs font-medium mb-1">Net Income</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatShortCurrency(financials.netIncome)}</p>
          {financials.profitMargin > 0 && (
            <p className="text-indigo-600 text-xs font-medium">
              {financials.profitMargin}% Margin
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Valuation Method Card */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Valuation Method</h2>
            <div className="p-2 bg-blue-50 rounded-lg">
              <PieChart size={20} className="text-blue-600" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Primary Method</p>
              <p className="text-xl font-bold text-gray-900 capitalize">
                {latestValuation?.method || 'Multiple of EBITDA'}
              </p>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {getMethodDescription(latestValuation?.method)}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Valuation Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {latestValuation ? new Date(latestValuation.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'N/A'}
              </p>
            </div>

            {businessProfile?.exit_horizon && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Exit Horizon</p>
                <p className="text-sm font-semibold text-gray-900">{businessProfile.exit_horizon}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/valuation')}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            New Valuation
          </button>
        </div>

        {/* Adjust Valuation Forecast */}
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                <TrendingUp size={18} className="text-green-600" />
              </div>
              Forecast Controls
            </h2>
          </div>

          {/* Growth Rate Slider */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Growth Rate</label>
              <span className="text-lg font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg shadow-sm">{growthRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={growthRate}
              onChange={(e) => setGrowthRate(parseInt(e.target.value))}
              className="w-full h-2.5 rounded-full appearance-none cursor-pointer transition-all"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${growthRate * 2}%, #e5e7eb ${growthRate * 2}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>0%</span>
              <span>50%</span>
            </div>
          </div>

          {/* EBITDA / Gross Profit Slider */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">EBITDA Margin</label>
              <span className="text-lg font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg shadow-sm">{ebitdaMargin}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={ebitdaMargin}
              onChange={(e) => setEbitdaMargin(parseInt(e.target.value))}
              className="w-full h-2.5 rounded-full appearance-none cursor-pointer transition-all"
              style={{
                background: `linear-gradient(to right, #9333ea 0%, #9333ea ${ebitdaMargin}%, #e5e7eb ${ebitdaMargin}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          <button
            onClick={fetchAllData}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-md hover:shadow-lg text-sm"
          >
            <RefreshCw size={16} />
            Refresh Data
          </button>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Financial Snapshot</h2>
            <button
              onClick={() => navigate('/business-profile')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Edit2 size={18} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Profitability Ratios */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <span className="inline-block w-1 h-4 bg-green-500 mr-2 rounded"></span>
                Profitability Ratios
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">EBITDA Margin</p>
                  <p className={`text-xl font-bold ${ratios.ebitdaMargin > 25 ? 'text-green-600' : ratios.ebitdaMargin > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {ratios.ebitdaMargin.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Net Margin</p>
                  <p className={`text-xl font-bold ${ratios.netMargin > 20 ? 'text-green-600' : ratios.netMargin > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {ratios.netMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Efficiency Ratios */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <span className="inline-block w-1 h-4 bg-blue-500 mr-2 rounded"></span>
                Efficiency Ratios
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Asset Turnover</p>
                  <p className={`text-xl font-bold ${ratios.assetTurnover > 2 ? 'text-green-600' : ratios.assetTurnover > 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {ratios.assetTurnover.toFixed(2)}x
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">ROA</p>
                  <p className={`text-xl font-bold ${ratios.roa > 20 ? 'text-green-600' : ratios.roa > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {ratios.roa.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Return Ratios */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <span className="inline-block w-1 h-4 bg-purple-500 mr-2 rounded"></span>
                Return Metrics
              </h3>
              <div>
                <p className="text-xs text-gray-600 mb-1">ROE (Return on Equity)</p>
                <p className={`text-xl font-bold ${ratios.roe > 25 ? 'text-green-600' : ratios.roe > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {ratios.roe.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Valuation Forecast Chart */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                <TrendingUp className="text-blue-600" size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Valuation Forecast</h2>
            </div>
            <p className="text-xs text-gray-500 pl-11">
              {growthRate}% growth × {ebitdaMargin}% margin × {industryMultiple}x multiple
            </p>
          </div>

          <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={forecastData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              tickFormatter={(value) => formatShortCurrency(value)}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            
            {/* Range area */}
            <Area
              type="monotone"
              dataKey="high"
              stroke="none"
              fill="url(#colorValue)"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="low"
              stroke="none"
              fill="white"
              fillOpacity={1}
            />
            
            {/* Main projection line */}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              name="Projected Value"
            />
            
            {/* Goal lines */}
            <Line 
              type="monotone" 
              dataKey="targetValuation" 
              stroke="#22c55e" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Target Valuation"
            />
            <Line 
              type="monotone" 
              dataKey="lifestyleNeeds" 
              stroke="#84cc16" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Lifestyle Needs"
            />
            <Line 
              type="monotone" 
              dataKey="minimumExit" 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Minimum Exit"
            />
          </AreaChart>
        </ResponsiveContainer>

          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-900 font-medium">
              <span className="font-bold">Formula:</span> Revenue × EBITDA Margin × Industry Multiple
            </p>
          </div>
        </div>

        {/* EBITDA / Gross Profit Forecast Chart */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg">
                <Activity className="text-purple-600" size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">EBITDA / Gross Profit</h2>
            </div>
            <p className="text-xs text-gray-500 pl-11">
              {ebitdaMargin}% margin with {growthRate}% revenue growth
            </p>
          </div>

          <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={ebitdaForecastData}>
            <defs>
              <linearGradient id="colorEbitda" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              tickFormatter={(value) => formatShortCurrency(value)}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />

            {/* Revenue area */}
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#colorRevenue)"
              fillOpacity={0.4}
              name="Revenue"
            />

            {/* EBITDA area */}
            <Area
              type="monotone"
              dataKey="ebitda"
              stroke="#9333ea"
              strokeWidth={3}
              fill="url(#colorEbitda)"
              fillOpacity={0.6}
              name="EBITDA / Gross Profit"
            />
          </AreaChart>
        </ResponsiveContainer>

          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-100">
            <p className="text-xs text-purple-900 font-medium">
              <span className="font-bold">Revenue:</span> Green • <span className="font-bold">EBITDA:</span> Purple (adjustable)
            </p>
          </div>
        </div>
      </div>

      {/* Valuation History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2">
                <History className="text-purple-600" size={24} />
                <h3 className="text-xl font-bold text-gray-900">Valuation History</h3>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedValuation(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {valuationHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Valuation History</h3>
                  <p className="text-gray-600">
                    You haven't created any valuations yet.
                  </p>
                </div>
              ) : selectedValuation ? (
                /* Detailed view of selected valuation */
                <div>
                  <button
                    onClick={() => setSelectedValuation(null)}
                    className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 mb-4"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                    <span>Back to List</span>
                  </button>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-1">
                          {formatCurrency(selectedValuation.valuation_amount)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Calculated on {new Date(selectedValuation.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">Method</p>
                        <p className="text-lg font-bold text-gray-900 capitalize">{selectedValuation.method}</p>
                      </div>
                    </div>

                    {selectedValuation.low_range && selectedValuation.high_range && (
                      <div className="flex items-center justify-between text-sm bg-white/50 rounded-lg p-3">
                        <span className="text-gray-700 font-medium">Valuation Range:</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(selectedValuation.low_range)} - {formatCurrency(selectedValuation.high_range)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Financial Data from Input */}
                  {(() => {
                    try {
                      const inputs = typeof selectedValuation.input_data === 'string'
                        ? JSON.parse(selectedValuation.input_data)
                        : selectedValuation.input_data;

                      return (
                        <div className="space-y-4">
                          <h5 className="text-lg font-bold text-gray-900 mb-3">Input Data</h5>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {inputs.revenue && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">Annual Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(inputs.revenue)}</p>
                              </div>
                            )}

                            {inputs.ebitda && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">EBITDA</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(inputs.ebitda)}</p>
                              </div>
                            )}

                            {inputs.net_income && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">Net Income</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(inputs.net_income)}</p>
                              </div>
                            )}

                            {inputs.cash_flow && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">Cash Flow</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(inputs.cash_flow)}</p>
                              </div>
                            )}

                            {inputs.total_assets && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">Total Assets</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(inputs.total_assets)}</p>
                              </div>
                            )}

                            {inputs.total_liabilities && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">Total Liabilities</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(inputs.total_liabilities)}</p>
                              </div>
                            )}

                            {inputs.growth_rate && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">Growth Rate</p>
                                <p className="text-2xl font-bold text-gray-900">{inputs.growth_rate}%</p>
                              </div>
                            )}

                            {inputs.discount_rate && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">Discount Rate</p>
                                <p className="text-2xl font-bold text-gray-900">{inputs.discount_rate}%</p>
                              </div>
                            )}

                            {inputs.private_company_discount && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">Private Company Discount</p>
                                <p className="text-2xl font-bold text-gray-900">{(inputs.private_company_discount * 100).toFixed(0)}%</p>
                              </div>
                            )}

                            {inputs.terminal_growth_rate && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">Terminal Growth Rate</p>
                                <p className="text-2xl font-bold text-gray-900">{inputs.terminal_growth_rate}%</p>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleLoadHistoricalValuation(selectedValuation)}
                            className="mt-6 w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                          >
                            Load This Valuation
                          </button>
                        </div>
                      );
                    } catch (error) {
                      return (
                        <div className="text-center py-6 text-gray-500">
                          Error loading valuation details
                        </div>
                      );
                    }
                  })()}
                </div>
              ) : (
                /* List view of all valuations */
                <div className="space-y-3">
                  {valuationHistory.map((val) => {
                    const isCurrentlyViewing = !viewingHistoricalValuation && latestValuation && latestValuation.id === val.id;

                    return (
                      <div
                        key={val.id}
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
                                Valuation from {new Date(val.created_at).toLocaleDateString()}
                              </h4>
                              {isCurrentlyViewing && (
                                <span className="px-2 py-1 text-xs font-medium bg-purple-600 text-white rounded">
                                  Current
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-gray-600">Valuation</p>
                                <p className="text-xl font-bold text-gray-900">
                                  {formatCurrency(val.valuation_amount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Method</p>
                                <p className="text-lg font-semibold text-gray-900 capitalize">
                                  {val.method}
                                </p>
                              </div>
                              {val.low_range && val.high_range && (
                                <div>
                                  <p className="text-sm text-gray-600">Range</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatShortCurrency(val.low_range)} - {formatShortCurrency(val.high_range)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="ml-4 flex gap-2">
                            <button
                              onClick={() => handleViewValuation(val)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap flex items-center space-x-1"
                            >
                              <Eye size={16} />
                              <span>View</span>
                            </button>
                            {!isCurrentlyViewing && (
                              <button
                                onClick={() => handleLoadHistoricalValuation(val)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition whitespace-nowrap"
                              >
                                Load
                              </button>
                            )}
                          </div>
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
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedValuation(null);
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValuationDashboard;
