import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AdvancedValuationModal from '../components/AdvancedValuationModal';
import { Calculator, TrendingUp, DollarSign, Building2, HelpCircle, Info, X, CheckCircle, Percent, Loader, AlertCircle, BarChart3 } from 'lucide-react';

const ValuationCalculator = () => {
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sliderCalculating, setSliderCalculating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showEVModal, setShowEVModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showDiscountInfo, setShowDiscountInfo] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);  // ← ADD THIS!
  const [helpContent, setHelpContent] = useState({ title: '', content: '' });  // ← AND THIS!
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedResult, setAdvancedResult] = useState(null);
  const [showAdvancedResultModal, setShowAdvancedResultModal] = useState(false);

  const [formData, setFormData] = useState({
    revenue: '',
    ebitda: '',
    net_income: '',
    cash_flow: '',
    total_assets: '',
    total_liabilities: '',
    industry_id: '',
    method: 'comprehensive',
    private_company_discount: 25
  });

  const debounceTimeout = useRef(null);
  const [updateCounter, setUpdateCounter] = useState(0);

  const [quizAnswers, setQuizAnswers] = useState({
    businessStage: '',
    dataAvailable: '',
    industryType: '',
    exitTimeline: ''
  });

  // Valuation method descriptions
  const methodDescriptions = {
    comprehensive: {
      name: "Comprehensive (Best Opinion of Value)",
      description: "Uses all applicable valuation methods and calculates a weighted average. This provides the most accurate and defensible valuation by considering multiple perspectives.",
      icon: "🎯",
      pros: "Most accurate, considers multiple factors, industry-standard",
      cons: "Requires complete financial data",
      bestFor: "Businesses with complete financials seeking the most accurate valuation"
    },
    cca: {
      name: "CCA (Comparable Company Analysis)",
      description: "Values your business by comparing it to similar companies using industry multiples (EV/EBITDA, EV/Revenue, P/E ratios). Based on real market data from public companies with adjustable private company discount.",
      icon: "📊",
      pros: "Market-based, industry-specific, widely accepted",
      cons: "Depends on quality of comparables",
      bestFor: "Established businesses in industries with good comparable data"
    },
    dcf: {
      name: "DCF (Discounted Cash Flow)",
      description: "Projects your future cash flows over 5 years and discounts them to present value. Includes a terminal value for perpetual growth. Uses a 15% discount rate for private companies.",
      icon: "💰",
      pros: "Forward-looking, intrinsic value, considers growth",
      cons: "Sensitive to assumptions, requires projections",
      bestFor: "High-growth businesses with predictable cash flows"
    },
    capitalization: {
      name: "Capitalization of Earnings",
      description: "Divides your annual earnings (EBITDA or net income) by a capitalization rate derived from industry multiples. Simple but effective for stable businesses.",
      icon: "💵",
      pros: "Simple, straightforward, based on current earnings",
      cons: "Assumes stable earnings, doesn't account for growth",
      bestFor: "Mature businesses with stable, predictable earnings"
    },
    nav: {
      name: "NAV (Net Asset Value)",
      description: "Calculates value as total assets minus total liabilities. Most appropriate for asset-heavy businesses or those in liquidation scenarios.",
      icon: "🏦",
      pros: "Objective, based on tangible assets, conservative",
      cons: "Ignores earnings potential and intangibles",
      bestFor: "Asset-heavy businesses, real estate, or liquidation scenarios"
    },
    rot: {
      name: "Rule of Thumb",
      description: "Uses industry-specific quick valuation formulas based on revenue or other key metrics. Provides a rough estimate for comparison purposes.",
      icon: "📏",
      pros: "Quick, easy to understand, industry-specific",
      cons: "Very approximate, varies widely by industry",
      bestFor: "Quick estimates or sanity checks"
    }
  };

  // Quiz questions
  const quizQuestions = [
    {
      id: 'businessStage',
      question: 'What stage is your business in?',
      options: [
        { value: 'startup', label: 'Startup/Early Stage (< 3 years)', method: 'dcf' },
        { value: 'growth', label: 'Growth Stage (3-7 years)', method: 'comprehensive' },
        { value: 'mature', label: 'Mature/Established (7+ years)', method: 'cca' },
        { value: 'declining', label: 'Declining/Exit Planning', method: 'nav' }
      ]
    },
    {
      id: 'dataAvailable',
      question: 'What financial data do you have available?',
      options: [
        { value: 'complete', label: 'Complete financials (revenue, EBITDA, assets, etc.)', method: 'comprehensive' },
        { value: 'revenue_ebitda', label: 'Revenue and EBITDA only', method: 'cca' },
        { value: 'projections', label: 'Future cash flow projections', method: 'dcf' },
        { value: 'assets', label: 'Just asset and liability details', method: 'nav' }
      ]
    },
    {
      id: 'industryType',
      question: 'What type of business do you have?',
      options: [
        { value: 'tech', label: 'Technology/Software (high growth)', method: 'dcf' },
        { value: 'service', label: 'Service-based business', method: 'cca' },
        { value: 'manufacturing', label: 'Manufacturing/Production', method: 'comprehensive' },
        { value: 'retail', label: 'Retail/E-commerce', method: 'cca' },
        { value: 'real_estate', label: 'Real estate/Asset-heavy', method: 'nav' }
      ]
    },
    {
      id: 'exitTimeline',
      question: 'When are you planning to exit?',
      options: [
        { value: 'exploring', label: 'Just exploring (5+ years)', method: 'comprehensive' },
        { value: 'planning', label: 'Actively planning (2-5 years)', method: 'cca' },
        { value: 'soon', label: 'Exiting soon (< 2 years)', method: 'cca' },
        { value: 'selling', label: 'Currently in sale process', method: 'comprehensive' }
      ]
    }
  ];

  // Help content for financial fields
const fieldHelpContent = {
  revenue: {
    title: "Annual Revenue",
    content: "Annual Revenue (also called 'Gross Sales' or 'Top Line') is the total amount of money your business generates from sales of goods or services before any expenses are deducted. Include all sales from products/services, recurring revenue, and one-time sales. Do NOT include loans, owner contributions, tax refunds, or sale of assets. Use your most recent full year's revenue. Example: $4M products + $1M services = $5,000,000 annual revenue."
  },
  ebitda: {
    title: "EBITDA",
    content: "EBITDA stands for Earnings Before Interest, Tax, Depreciation, and Amortization. It represents your company's operating profitability before accounting for financing decisions, tax environment, and non-cash expenses. Calculate as: Net Income + Interest + Taxes + Depreciation + Amortization. You can also add back owner's excessive compensation, one-time expenses, personal expenses run through the business, and non-recurring costs. EBITDA is the MOST IMPORTANT metric for business valuation - higher EBITDA means higher valuation. Example: Net Income $500K + Interest $50K + Taxes $150K + Depreciation $100K + Owner excess comp $200K = EBITDA $1,000,000."
  },
  net_income: {
    title: "Net Income",
    content: "Net Income (also called 'Net Profit' or 'Bottom Line') is what remains after ALL expenses, taxes, interest, depreciation, and amortization are deducted from revenue. It's the bottom line of your Income Statement (P&L). Find it on Line 28 of Schedule C (sole proprietors) or Line 22 of Form 1120 (C-Corps). This metric is useful for P/E ratio valuations. Example: $5M revenue - $4.25M total expenses = $750,000 net income."
  },
  cash_flow: {
    title: "Free Cash Flow",
    content: "Free Cash Flow (FCF) is the cash your business generates after accounting for cash outflows to support operations and maintain capital assets. It represents cash available to distribute to owners or reinvest in growth. Calculate as: Operating Cash Flow - Capital Expenditures. If you don't have the exact number, a reasonable estimate is 70-80% of EBITDA for most stable businesses. The calculator will automatically use 80% of EBITDA if you leave this field blank. Critical for DCF valuations."
  },
  total_assets: {
    title: "Total Assets",
    content: "Total Assets represents everything your business owns that has monetary value. This includes: Current Assets (cash, accounts receivable, inventory, prepaid expenses), Fixed Assets (buildings, equipment, vehicles, furniture), and Intangible Assets (patents, trademarks, goodwill, customer lists). Find this on the top section of your Balance Sheet, usually labeled 'Total Assets.' Important for Asset-Based (NAV) valuations, especially for asset-heavy businesses like manufacturing or real estate."
  },
  total_liabilities: {
    title: "Total Liabilities",
    content: "Total Liabilities represents everything your business owes to others. This includes: Current Liabilities (accounts payable, short-term loans, credit cards, accrued expenses) and Long-Term Liabilities (long-term loans, mortgages, equipment financing, bonds payable). Find this on the bottom section of your Balance Sheet. Formula: Total Assets - Total Liabilities = Owner's Equity. Lower liabilities relative to assets means stronger financial health. Buyers prefer businesses with less debt."
  }
};

// Function to show help modal
const showHelp = (field) => {
  setHelpContent(fieldHelpContent[field]);
  setShowHelpModal(true);
};

  useEffect(() => {
    fetchIndustries();
    
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Check if token is valid
  const checkToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expired. Please log in again.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return false;
    }
    return true;
  };

  const fetchIndustries = async () => {
    try {
      if (!checkToken()) return;
      
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/valuation/industries', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIndustries(response.data.industries);
    } catch (err) {
      console.error('Error fetching industries:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError('Failed to load industries');
      }
    }
  };

  const handleQuizAnswer = (questionId, value, method) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const calculateQuizResult = () => {
    const methodCounts = {};
    
    quizQuestions.forEach(question => {
      const answer = quizAnswers[question.id];
      const option = question.options.find(opt => opt.value === answer);
      if (option) {
        methodCounts[option.method] = (methodCounts[option.method] || 0) + 1;
      }
    });

    let recommendedMethod = 'comprehensive';
    let maxCount = 0;
    
    Object.entries(methodCounts).forEach(([method, count]) => {
      if (count > maxCount) {
        maxCount = count;
        recommendedMethod = method;
      }
    });

    setFormData(prev => ({ ...prev, method: recommendedMethod }));
    setShowQuiz(false);
    
    alert(`Based on your answers, we recommend using the ${methodDescriptions[recommendedMethod].name} method!`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const canCalculate = () => {
    return formData.revenue && formData.ebitda && formData.industry_id;
  };

  const handleDiscountChange = (e) => {
    const newDiscount = parseInt(e.target.value);
    
    setFormData(prev => ({
      ...prev,
      private_company_discount: newDiscount
    }));
    
    if (result && canCalculate()) {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      setSliderCalculating(true);
      
      debounceTimeout.current = setTimeout(() => {
        performCalculation(newDiscount);
      }, 800);
    }
  };

  const performCalculation = async (customDiscount = null) => {
    const discount = customDiscount !== null ? customDiscount : formData.private_company_discount;
    
    if (!checkToken()) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        revenue: parseFloat(formData.revenue) || 0,
        ebitda: parseFloat(formData.ebitda) || 0,
        net_income: parseFloat(formData.net_income) || 0,
        cash_flow: parseFloat(formData.cash_flow) || parseFloat(formData.ebitda) * 0.8 || 0,
        total_assets: parseFloat(formData.total_assets) || 0,
        total_liabilities: parseFloat(formData.total_liabilities) || 0,
        industry_id: parseInt(formData.industry_id),
        method: formData.method,
        private_company_discount: discount / 100
      };

      const response = await axios.post(
        'http://localhost:5000/api/valuation/calculate',
        payload,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const newResult = {
        ...response.data,
        timestamp: Date.now()
      };
      
      setResult(newResult);
      setUpdateCounter(prev => prev + 1);
      setError('');
    } catch (err) {
      console.error('Valuation error:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(err.response?.data?.error || 'Failed to calculate valuation');
      }
    } finally {
      setSliderCalculating(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    await performCalculation();
  };

  const handleAdvancedValuation = async (financialData) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:5000/api/valuation/advanced',
        financialData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Store the advanced result
      setAdvancedResult(response.data);
      setShowAdvancedModal(false);
      setShowAdvancedResultModal(true);

    } catch (err) {
      console.error('Advanced valuation error:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(err.response?.data?.error || 'Failed to calculate advanced valuation');
      }
    } finally {
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

  const selectedIndustry = industries.find(ind => ind.id === parseInt(formData.industry_id));
  const currentMethodDesc = methodDescriptions[formData.method];
  
  const discountFactor = 1 - (formData.private_company_discount / 100);
  const adjustedMultiples = selectedIndustry ? {
    ev_ebitda: (selectedIndustry.ev_ebitda.median * discountFactor).toFixed(1),
    ev_revenue: (selectedIndustry.ev_revenue.median * discountFactor).toFixed(1),
    pe: (selectedIndustry.pe.median * discountFactor).toFixed(1)
  } : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Calculator className="text-blue-600" size={32} />
          Business Opinion of Value Calculator
        </h1>
        <p className="text-gray-600 mt-2">
          Calculate your business opinion of value using multiple industry-standard methodologies
        </p>
      </div>

{/* IMPORTANT DISCLAIMER */}
<div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
  <div className="flex items-start gap-3">
    <AlertCircle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
    <div>
      <h3 className="font-semibold text-yellow-900 mb-1">Important Disclaimer</h3>
      <p className="text-sm text-yellow-800 leading-relaxed">
        This valuation calculator provides a <strong>simple opinion of value</strong> for exit planning purposes only. 
        It is <strong>NOT a formal business valuation</strong> and should not be used for tax, legal, or transactional purposes. 
        For official valuations required by the IRS, courts, or financial institutions, please consult a 
        Certified Valuation Analyst (CVA), Accredited Senior Appraiser (ASA), or Certified Business Appraiser (CBA). 
        This tool is designed to help business owners understand their company's approximate worth and 
        guide their exit planning strategy.
      </p>
    </div>
  </div>
</div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setShowEVModal(true)}
          className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
        >
          <Info className="text-blue-600 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-blue-900">What is Enterprise Value (EV)?</h3>
            <p className="text-sm text-blue-700">Learn how we calculate your business value</p>
          </div>
        </button>

        <button
          onClick={() => setShowQuiz(true)}
          className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
        >
          <CheckCircle className="text-green-600 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-green-900">Not sure which method to use?</h3>
            <p className="text-sm text-green-700">Take our quick quiz to find the best method for you</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Business Information</h2>
            
            {/* Industry Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry *
              </label>
              <select
                name="industry_id"
                value={formData.industry_id}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select your industry...</option>
                {industries.map(industry => (
                  <option key={industry.id} value={industry.id}>
                    {industry.industry_name}
                  </option>
                ))}
              </select>
              {selectedIndustry && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                  <p className="font-medium text-blue-900">Industry Multiples (Public Companies):</p>
                  <p className="text-blue-700">
                    EV/EBITDA: {selectedIndustry.ev_ebitda.median}x | 
                    EV/Revenue: {selectedIndustry.ev_revenue.median}x | 
                    P/E: {selectedIndustry.pe.median}x
                  </p>
                </div>
              )}
            </div>

            {/* Private Company Discount Slider */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Percent className="text-purple-600" size={20} />
                  <label className="text-sm font-semibold text-gray-800">
                    Private Company Discount
                  </label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowDiscountInfo(true);
                    }}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    <HelpCircle size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {sliderCalculating && (
                    <Loader className="animate-spin text-purple-600" size={16} />
                  )}
                  <span className="text-2xl font-bold text-purple-600">
                    {formData.private_company_discount}%
                  </span>
                </div>
              </div>
              
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={formData.private_company_discount}
                onChange={handleDiscountChange}
                className="w-full h-3 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                style={{
                  background: `linear-gradient(to right, #9333ea 0%, #9333ea ${formData.private_company_discount * 2}%, #e9d5ff ${formData.private_company_discount * 2}%, #e9d5ff 100%)`
                }}
              />
              
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>0% (No discount)</span>
                <span>25% (Standard)</span>
                <span>50% (Maximum)</span>
              </div>
              
              {selectedIndustry && adjustedMultiples && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <p className="text-xs font-medium text-gray-700 mb-1">Adjusted Multiples for Your Business:</p>
                  <p className="text-sm text-purple-700 font-semibold">
                    EV/EBITDA: {adjustedMultiples.ev_ebitda}x | 
                    EV/Revenue: {adjustedMultiples.ev_revenue}x | 
                    P/E: {adjustedMultiples.pe}x
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formData.private_company_discount === 0 && "Using public company multiples (no discount)"}
                    {formData.private_company_discount > 0 && formData.private_company_discount < 25 && "Lower discount = Higher valuation"}
                    {formData.private_company_discount === 25 && "Standard private company discount applied"}
                    {formData.private_company_discount > 25 && "Higher discount = More conservative valuation"}
                  </p>
                  {result && sliderCalculating && (
                    <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                      <Loader className="animate-spin" size={12} />
                      Updating valuation...
                    </p>
                  )}
                  {result && !sliderCalculating && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Valuation updated
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Financial Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Revenue *
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      showHelp('revenue');
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-700"
                  >
                    <HelpCircle size={14} className="inline" />
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    name="revenue"
                    value={formData.revenue}
                    onChange={handleInputChange}
                    required
                    placeholder="5,000,000"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EBITDA *
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      showHelp('ebitda');
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-700"
                  >
                    <HelpCircle size={14} className="inline" />
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    name="ebitda"
                    value={formData.ebitda}
                    onChange={handleInputChange}
                    required
                    placeholder="1,000,000"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Net Income
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      showHelp('net_income');
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-700"
                  >
                    <HelpCircle size={14} className="inline" />
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    name="net_income"
                    value={formData.net_income}
                    onChange={handleInputChange}
                    placeholder="750,000"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Cash Flow
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      showHelp('cash_flow');
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-700"
                  >
                    <HelpCircle size={14} className="inline" />
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    name="cash_flow"
                    value={formData.cash_flow}
                    onChange={handleInputChange}
                    placeholder="800,000"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Assets
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      showHelp('total_assets');
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-700"
                  >
                    <HelpCircle size={14} className="inline" />
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    name="total_assets"
                    value={formData.total_assets}
                    onChange={handleInputChange}
                    placeholder="2,000,000"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Liabilities
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      showHelp('total_liabilities');
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-700"
                  >
                    <HelpCircle size={14} className="inline" />
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    name="total_liabilities"
                    value={formData.total_liabilities}
                    onChange={handleInputChange}
                    placeholder="500,000"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Valuation Method */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Valuation Method
                </label>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowMethodModal(true);
                  }}
                  className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                >
                  <HelpCircle size={14} />
                  Learn about methods
                </button>
              </div>
              <select
                name="method"
                value={formData.method}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="comprehensive">Comprehensive (Best Opinion of Value)</option>
                <option value="cca">CCA (Comparable Company Analysis)</option>
                <option value="dcf">DCF (Discounted Cash Flow)</option>
                <option value="capitalization">Capitalization of Earnings</option>
                <option value="nav">NAV (Net Asset Value)</option>
                <option value="rot">Rule of Thumb</option>
              </select>
              
              {currentMethodDesc && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{currentMethodDesc.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{currentMethodDesc.name}</h4>
                      <p className="text-sm text-gray-700 mb-2">{currentMethodDesc.description}</p>
                      <p className="text-xs text-gray-600">
                        <strong>Best for:</strong> {currentMethodDesc.bestFor}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Calculating...
                </>
              ) : (
                <>
                  <TrendingUp size={20} />
                  {result ? 'Recalculate Valuation' : 'Calculate Valuation'}
                </>
              )}
            </button>

            {/* Advanced Valuation Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedModal(true)}
              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <BarChart3 size={20} />
              Advanced Multi-Year Analysis
            </button>
            
            {result && (
              <p className="text-xs text-gray-500 text-center mt-2">
                💡 Tip: Adjust the discount slider above to see real-time valuation changes
              </p>
            )}
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-1" key={updateCounter}>
          {result ? (
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <DollarSign className="text-green-600" size={24} />
                Valuation Results
                {sliderCalculating && (
                  <Loader className="animate-spin text-purple-600 ml-auto" size={20} />
                )}
              </h2>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Estimated Value</p>
                <p className={`text-4xl font-bold text-green-600 transition-opacity duration-300 ${sliderCalculating ? 'opacity-50' : 'opacity-100'}`}>
                  {formatCurrency(result.valuation_amount)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  At {formData.private_company_discount}% discount
                </p>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Valuation Range</p>
                <p className={`text-lg font-semibold text-gray-800 transition-opacity duration-300 ${sliderCalculating ? 'opacity-50' : 'opacity-100'}`}>
                  {formatCurrency(result.low_range)} - {formatCurrency(result.high_range)}
                </p>
              </div>

              <div className="border-t pt-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Method Used</p>
                <p className="text-base font-medium text-gray-800 capitalize">
                  {result.method}
                </p>
              </div>
              
              <div className="border-t pt-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Private Discount Applied</p>
                <p className="text-base font-medium text-purple-600">
                  {formData.private_company_discount}%
                </p>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(result.timestamp || Date.now()).toLocaleTimeString()}
                </p>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="w-full mt-6 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Start New Calculation
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 sticky top-4">
              <Building2 className="text-blue-600 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Ready to Value Your Business?
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Fill in your business details to get a comprehensive valuation using industry-standard methodologies.
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>5 valuation methods</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Real-time discount adjustments</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Industry-specific multiples</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Instant results with ranges</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enterprise Value Modal */}
      {showEVModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">What is Enterprise Value (EV)?</h2>
                <button 
                  onClick={() => setShowEVModal(false)} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-700 mb-4">
                  <strong>Enterprise Value (EV)</strong> is the total value of your business, representing what a buyer would pay to acquire 100% of your company.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">How We Calculate EV</h3>
                <p className="text-gray-700 mb-4">
                  We use multiple industry-standard valuation methods to determine your Enterprise Value:
                </p>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <div>
                      <strong>Market Multiples:</strong> We compare your business to similar companies using ratios like EV/EBITDA, EV/Revenue, and P/E ratios
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <div>
                      <strong>Cash Flow Analysis:</strong> We project your future cash flows and discount them to today's value
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <div>
                      <strong>Asset-Based:</strong> We consider your net assets (total assets minus liabilities)
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <div>
                      <strong>Industry Rules:</strong> We apply industry-specific valuation formulas
                    </div>
                  </li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Best Opinion of Value</h3>
                <p className="text-gray-700 mb-4">
                  When you select <strong>"Comprehensive"</strong> as your valuation method, we calculate a <strong>Best Opinion of Value</strong> by:
                </p>
                
                <ol className="list-decimal list-inside space-y-2 mb-6">
                  <li className="text-gray-700">Running all applicable valuation methods</li>
                  <li className="text-gray-700">Weighting each method based on reliability for your business type</li>
                  <li className="text-gray-700">Calculating a weighted average for the most accurate result</li>
                  <li className="text-gray-700">Providing a range (low to high) to show valuation uncertainty</li>
                </ol>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Pro Tip:</strong> The "Comprehensive" method provides the most defensible valuation because it considers multiple perspectives and is less vulnerable to errors in any single methodology.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowEVModal(false)}
                className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Private Company Discount Info Modal */}
      {showDiscountInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Private Company Discount</h2>
                <button onClick={() => setShowDiscountInfo(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-700 mb-4">
                  <strong>Private Company Discount</strong> (also called "Marketability Discount" or "Illiquidity Discount") reflects the fact that private company shares are harder to sell than public company shares.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Why Apply a Discount?</h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex gap-3">
                    <span className="text-purple-600 font-bold">•</span>
                    <div>
                      <strong>Limited Liquidity:</strong> Private shares can't be quickly sold on a public exchange
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-600 font-bold">•</span>
                    <div>
                      <strong>Smaller Buyer Pool:</strong> Fewer potential buyers compared to public stocks
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-600 font-bold">•</span>
                    <div>
                      <strong>Information Asymmetry:</strong> Less financial transparency than public companies
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-600 font-bold">•</span>
                    <div>
                      <strong>Control Factors:</strong> Minority stakes may have limited influence
                    </div>
                  </li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Typical Discount Ranges</h3>
                <div className="space-y-3 mb-6">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-semibold text-green-900">0-15% Discount</p>
                    <p className="text-sm text-green-700">Strong growth, clear exit path, strategic buyers interested</p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-semibold text-blue-900">20-30% Discount (Standard)</p>
                    <p className="text-sm text-blue-700">Typical private company, stable operations, normal liquidity constraints</p>
                  </div>
                  
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="font-semibold text-orange-900">35-50% Discount</p>
                    <p className="text-sm text-orange-700">Limited growth, owner-dependent, difficult to sell, minority stake</p>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">How to Choose Your Discount</h3>
                <p className="text-gray-700 mb-4">Consider these factors:</p>
                <ul className="space-y-2 mb-6 list-disc list-inside">
                  <li className="text-gray-700"><strong>Financial Performance:</strong> Stronger = lower discount</li>
                  <li className="text-gray-700"><strong>Management Team:</strong> Less owner-dependent = lower discount</li>
                  <li className="text-gray-700"><strong>Market Position:</strong> Strategic value = lower discount</li>
                  <li className="text-gray-700"><strong>Size:</strong> Larger companies often get lower discounts</li>
                  <li className="text-gray-700"><strong>Exit Readiness:</strong> More prepared = lower discount</li>
                </ul>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-purple-900">
                    <strong>💡 Recommendation:</strong> The standard 25% discount is a safe starting point. Adjust based on your business's specific strengths and weaknesses. A well-prepared business with strong growth can justify a 15-20% discount, while a struggling or owner-dependent business might warrant 30-40%.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowDiscountInfo(false)}
                className="mt-6 w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Method Descriptions Modal */}
      {showMethodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Valuation Methods Explained</h2>
                <button onClick={() => setShowMethodModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-6">
                {Object.entries(methodDescriptions).map(([key, method]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl">{method.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{method.name}</h3>
                        <p className="text-sm text-gray-700 mt-1">{method.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1">✓ PROS</p>
                        <p className="text-sm text-gray-600">{method.pros}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-orange-700 mb-1">✗ CONS</p>
                        <p className="text-sm text-gray-600">{method.cons}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-blue-700 mb-1">BEST FOR</p>
                      <p className="text-sm text-gray-700">{method.bestFor}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => setShowMethodModal(false)}
                className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Find Your Best Valuation Method</h2>
                <button onClick={() => setShowQuiz(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Answer these 4 quick questions and we'll recommend the best valuation method for your business.
              </p>
              
              <div className="space-y-6">
                {quizQuestions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {index + 1}. {question.question}
                    </h3>
                    <div className="space-y-2">
                      {question.options.map(option => (
                        <label
                          key={option.value}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option.value}
                            checked={quizAnswers[question.id] === option.value}
                            onChange={() => handleQuizAnswer(question.id, option.value, option.method)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={calculateQuizResult}
                disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                Get My Recommendation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{helpContent.title}</h2>
                <button 
                  onClick={() => setShowHelpModal(false)} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {helpContent.content}
                </p>
              </div>
              
              <button
                onClick={() => setShowHelpModal(false)}
                className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Valuation Modal */}
      <AdvancedValuationModal
        isOpen={showAdvancedModal}
        onClose={() => setShowAdvancedModal(false)}
        onSubmit={handleAdvancedValuation}
      />

      {/* Advanced Results Modal */}
      {showAdvancedResultModal && advancedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Advanced Valuation Results</h2>
                  <p className="text-green-100 text-sm">Multi-year comprehensive analysis</p>
                </div>
                <button
                  onClick={() => setShowAdvancedResultModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Weighted Valuation */}
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Weighted Average Valuation</h3>
                <p className="text-4xl font-bold text-blue-600 mb-2">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(advancedResult.weighted_valuation)}
                </p>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>
                    Low: {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                    }).format(advancedResult.valuation_range.low)}
                  </span>
                  <span>•</span>
                  <span>
                    High: {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                    }).format(advancedResult.valuation_range.high)}
                  </span>
                </div>
              </div>

              {/* Industry Info */}
              {advancedResult.industry_info && (
                <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-md font-semibold text-purple-900 mb-2">
                    Industry: {advancedResult.industry_info.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Original Multiples (Public):</p>
                      <p className="font-semibold text-gray-800">
                        EV/EBITDA: {advancedResult.industry_info.original_multiples.ev_ebitda.toFixed(1)}x |
                        EV/Revenue: {advancedResult.industry_info.original_multiples.ev_revenue.toFixed(1)}x
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        Adjusted (Private Discount: {advancedResult.industry_info.private_discount_applied.toFixed(0)}%):
                      </p>
                      <p className="font-semibold text-purple-700">
                        EV/EBITDA: {advancedResult.industry_info.adjusted_multiples.ev_ebitda.toFixed(1)}x |
                        EV/Revenue: {advancedResult.industry_info.adjusted_multiples.ev_revenue.toFixed(1)}x
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Growth Metrics */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Growth Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Revenue CAGR</p>
                    <p className="text-2xl font-bold text-green-600">
                      {advancedResult.growth_metrics.revenue_cagr.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">EBITDA CAGR</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {advancedResult.growth_metrics.ebitda_cagr.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">SDE CAGR</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {advancedResult.growth_metrics.sde_cagr.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Valuation Methods */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Valuation by Method</h3>
                <div className="space-y-3">
                  {Object.entries(advancedResult.valuation_methods).map(([method, data]) => (
                    <div key={method} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-gray-600">{data.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xl font-bold text-gray-800">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                            }).format(data.value)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Weight: {(advancedResult.method_weights[method] * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              {advancedResult.insights && advancedResult.insights.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Insights</h3>
                  <div className="space-y-2">
                    {advancedResult.insights.map((insight, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${insight.type === 'positive'
                            ? 'bg-green-50 border-green-200'
                            : insight.type === 'warning'
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-sm">
                            {insight.type === 'positive' ? '✓' : insight.type === 'warning' ? '⚠' : '✗'}
                          </span>
                          <div>
                            <p className="font-semibold text-sm">{insight.category}</p>
                            <p className="text-sm">{insight.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Financial Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Current Year</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span className="font-semibold">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                          }).format(advancedResult.financial_summary.current_year.revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>EBITDA:</span>
                        <span className="font-semibold">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                          }).format(advancedResult.financial_summary.current_year.ebitda)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>SDE:</span>
                        <span className="font-semibold">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                          }).format(advancedResult.financial_summary.current_year.sde)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>EBITDA Margin:</span>
                        <span className="font-semibold">
                          {advancedResult.financial_summary.current_year.ebitda_margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Multi-Year Average</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Avg Revenue:</span>
                        <span className="font-semibold">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                          }).format(advancedResult.financial_summary.averages.revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg EBITDA:</span>
                        <span className="font-semibold">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                          }).format(advancedResult.financial_summary.averages.ebitda)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg SDE:</span>
                        <span className="font-semibold">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                          }).format(advancedResult.financial_summary.averages.sde)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg EBITDA Margin:</span>
                        <span className="font-semibold">
                          {advancedResult.financial_summary.averages.ebitda_margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAdvancedResultModal(false);
                    setShowAdvancedModal(true);
                  }}
                  className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Data
                </button>
                <button
                  onClick={() => setShowAdvancedResultModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
              <button
                onClick={() => {
                  alert('PDF export coming soon!');
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ValuationCalculator;
