import React, { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, BarChart3, Percent, HelpCircle, Calculator } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';

const AdvancedValuationModal = ({ isOpen, onClose, onSubmit }) => {
  const [currentYear] = useState(new Date().getFullYear());
  const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
  
  const [industries, setIndustries] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState(
    localStorage.getItem('advancedValuationIndustry') || ''
  );
  const [privateDiscount, setPrivateDiscount] = useState(
    parseFloat(localStorage.getItem('advancedValuationDiscount')) || 25
  );
  
  const [financialData, setFinancialData] = useState(() => {
    // Try to load saved data
    const saved = localStorage.getItem('advancedValuationData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge saved data with complete structure to ensure all fields exist
        const complete = {
          revenue: years.reduce((acc, year) => ({ ...acc, [year]: parsed.revenue?.[year] || '' }), {}),
          ebitda: years.reduce((acc, year) => ({ ...acc, [year]: parsed.ebitda?.[year] || '' }), {}),
          sde: years.reduce((acc, year) => ({ ...acc, [year]: parsed.sde?.[year] || '' }), {}),
          gross_profit: years.reduce((acc, year) => ({ ...acc, [year]: parsed.gross_profit?.[year] || '' }), {}),
          total_assets: years.reduce((acc, year) => ({ ...acc, [year]: parsed.total_assets?.[year] || '' }), {}),
          total_liabilities_equity: years.reduce((acc, year) => ({ ...acc, [year]: parsed.total_liabilities_equity?.[year] || '' }), {}),
          owner_compensation: years.reduce((acc, year) => ({ ...acc, [year]: parsed.owner_compensation?.[year] || '' }), {}),
          non_recurring_expenses: years.reduce((acc, year) => ({ ...acc, [year]: parsed.non_recurring_expenses?.[year] || '' }), {}),
          capital_expenditures: years.reduce((acc, year) => ({ ...acc, [year]: parsed.capital_expenditures?.[year] || '' }), {}),
          depreciation: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
          ebit: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
          profit_after_tax: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
          // Balance sheet fields
          cash: years.reduce((acc, year) => ({ ...acc, [year]: parsed.cash?.[year] || '' }), {}),
          current_assets: years.reduce((acc, year) => ({ ...acc, [year]: parsed.current_assets?.[year] || '' }), {}),
          non_current_assets: years.reduce((acc, year) => ({ ...acc, [year]: parsed.non_current_assets?.[year] || '' }), {}),
          long_term_debt: years.reduce((acc, year) => ({ ...acc, [year]: parsed.long_term_debt?.[year] || '' }), {}),
          short_term_debt: years.reduce((acc, year) => ({ ...acc, [year]: parsed.short_term_debt?.[year] || '' }), {}),
          interest_bearing_debt: years.reduce((acc, year) => ({ ...acc, [year]: parsed.interest_bearing_debt?.[year] || '' }), {}),
          equity: years.reduce((acc, year) => ({ ...acc, [year]: parsed.equity?.[year] || '' }), {}),
          total_liabilities: years.reduce((acc, year) => ({ ...acc, [year]: parsed.total_liabilities?.[year] || '' }), {}),
          // Add-backs fields
          owner_salary: years.reduce((acc, year) => ({ ...acc, [year]: parsed.owner_salary?.[year] || '' }), {}),
          family_salaries: years.reduce((acc, year) => ({ ...acc, [year]: parsed.family_salaries?.[year] || '' }), {}),
          salary_adjustments: years.reduce((acc, year) => ({ ...acc, [year]: parsed.salary_adjustments?.[year] || '' }), {}),
          auto_expenses: years.reduce((acc, year) => ({ ...acc, [year]: parsed.auto_expenses?.[year] || '' }), {}),
          donations: years.reduce((acc, year) => ({ ...acc, [year]: parsed.donations?.[year] || '' }), {}),
          insurance_premiums: years.reduce((acc, year) => ({ ...acc, [year]: parsed.insurance_premiums?.[year] || '' }), {}),
          inventory_adjustments: years.reduce((acc, year) => ({ ...acc, [year]: parsed.inventory_adjustments?.[year] || '' }), {}),
          meals_entertainment: years.reduce((acc, year) => ({ ...acc, [year]: parsed.meals_entertainment?.[year] || '' }), {}),
          personal_expenses: years.reduce((acc, year) => ({ ...acc, [year]: parsed.personal_expenses?.[year] || '' }), {}),
          phone_internet: years.reduce((acc, year) => ({ ...acc, [year]: parsed.phone_internet?.[year] || '' }), {}),
          non_business_services: years.reduce((acc, year) => ({ ...acc, [year]: parsed.non_business_services?.[year] || '' }), {}),
          travel: years.reduce((acc, year) => ({ ...acc, [year]: parsed.travel?.[year] || '' }), {}),
          one_time_charges: years.reduce((acc, year) => ({ ...acc, [year]: parsed.one_time_charges?.[year] || '' }), {}),
          retirement: years.reduce((acc, year) => ({ ...acc, [year]: parsed.retirement?.[year] || '' }), {}),
          supplier_rebates: years.reduce((acc, year) => ({ ...acc, [year]: parsed.supplier_rebates?.[year] || '' }), {}),
          other_addbacks: years.reduce((acc, year) => ({ ...acc, [year]: parsed.other_addbacks?.[year] || '' }), {}),
          addbacks_total: years.reduce((acc, year) => ({ ...acc, [year]: parsed.addbacks_total?.[year] || '' }), {})
        };
        return complete;
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }

    // Default structure if nothing saved
    return {
      revenue: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      ebitda: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      sde: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      gross_profit: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      total_assets: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      total_liabilities_equity: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      owner_compensation: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      non_recurring_expenses: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      capital_expenditures: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      cash: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      current_assets: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      non_current_assets: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      long_term_debt: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      short_term_debt: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      interest_bearing_debt: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      equity: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      total_liabilities: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      owner_salary: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      family_salaries: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      salary_adjustments: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      auto_expenses: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      donations: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      insurance_premiums: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      inventory_adjustments: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      meals_entertainment: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      personal_expenses: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      phone_internet: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      non_business_services: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      travel: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      one_time_charges: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      retirement: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      supplier_rebates: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      other_addbacks: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      addbacks_total: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      depreciation: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      ebit: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
      profit_after_tax: years.reduce((acc, year) => ({ ...acc, [year]: '' }), {}),
    };
  });

  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    if (isOpen) {
      fetchIndustries();
    }
  }, [isOpen]);

  // Auto-calculate SDE, add-backs total, and balance sheet totals
  useEffect(() => {
    const newData = { ...financialData };
    let updated = false;

    years.forEach(year => {
      // Calculate total add-backs (only if these fields exist)
      const addBackFields = [
        'owner_salary', 'family_salaries', 'salary_adjustments', 'auto_expenses',
        'donations', 'insurance_premiums', 'inventory_adjustments', 'meals_entertainment',
        'personal_expenses', 'phone_internet', 'non_business_services', 'travel',
        'one_time_charges', 'retirement', 'supplier_rebates', 'other_addbacks'
      ];

      const totalAddBacks = addBackFields.reduce((sum, field) => {
        // Check if field exists before accessing
        if (financialData[field] && financialData[field][year] !== undefined) {
          return sum + (parseFloat(financialData[field][year]) || 0);
        }
        return sum;
      }, 0);

      // Only update if addbacks_total field exists
      if (financialData.addbacks_total) {
        if (totalAddBacks !== parseFloat(newData.addbacks_total[year] || 0)) {
          newData.addbacks_total[year] = totalAddBacks.toString();
          updated = true;
        }
      }

      // Calculate SDE = EBITDA + Add-backs Total (only if fields exist)
      if (financialData.ebitda && financialData.sde) {
        const ebitda = parseFloat(financialData.ebitda[year]) || 0;
        const calculatedSDE = ebitda + totalAddBacks;

        if (calculatedSDE !== parseFloat(newData.sde[year] || 0)) {
          newData.sde[year] = calculatedSDE.toString();
          updated = true;
        }
      }

      // Calculate Total Assets (only if fields exist)
      if (financialData.cash && financialData.current_assets && financialData.non_current_assets && financialData.total_assets) {
        const cash = parseFloat(financialData.cash[year]) || 0;
        const currentAssets = parseFloat(financialData.current_assets[year]) || 0;
        const nonCurrentAssets = parseFloat(financialData.non_current_assets[year]) || 0;
        const totalAssets = cash + currentAssets + nonCurrentAssets;

        if (totalAssets !== parseFloat(newData.total_assets[year] || 0)) {
          newData.total_assets[year] = totalAssets.toString();
          updated = true;
        }
      }

      // Calculate Total Liabilities (only if fields exist)
      if (financialData.long_term_debt && financialData.short_term_debt && financialData.interest_bearing_debt && financialData.total_liabilities) {
        const longTermDebt = parseFloat(financialData.long_term_debt[year]) || 0;
        const shortTermDebt = parseFloat(financialData.short_term_debt[year]) || 0;
        const interestBearingDebt = parseFloat(financialData.interest_bearing_debt[year]) || 0;
        const totalLiabilities = longTermDebt + shortTermDebt + interestBearingDebt;

        if (totalLiabilities !== parseFloat(newData.total_liabilities[year] || 0)) {
          newData.total_liabilities[year] = totalLiabilities.toString();
          updated = true;
        }
      }

      // Calculate Total Liabilities & Equity (only if fields exist)
      if (financialData.total_liabilities && financialData.equity && financialData.total_liabilities_equity) {
        const totalLiabilities = parseFloat(financialData.total_liabilities[year]) || 0;
        const equity = parseFloat(financialData.equity[year]) || 0;
        const totalLiabilitiesEquity = totalLiabilities + equity;

        if (totalLiabilitiesEquity !== parseFloat(newData.total_liabilities_equity[year] || 0)) {
          newData.total_liabilities_equity[year] = totalLiabilitiesEquity.toString();
          updated = true;
        }
      }
    });

    if (updated) {
      setFinancialData(newData);
    }
  }, [
    financialData.ebitda, financialData.owner_salary, financialData.family_salaries,
    financialData.cash, financialData.current_assets, financialData.non_current_assets,
    financialData.long_term_debt, financialData.short_term_debt, financialData.interest_bearing_debt,
    financialData.equity
  ]);

  const fetchIndustries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/valuation/industries', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIndustries(response.data.industries);
    } catch (err) {
      console.error('Error fetching industries:', err);
    }
  };

  const handleInputChange = (field, year, value) => {
    setFinancialData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [year]: value
      }
    }));

    // Save to localStorage after update
    setTimeout(() => {
      const updated = {
        ...financialData,
        [field]: {
          ...financialData[field],
          [year]: value
        }
      };
      localStorage.setItem('advancedValuationData', JSON.stringify(updated));
    }, 100);
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

  const prepareChartData = () => {
    return years.map(year => ({
      year: year.toString(),
      'Gross Profit': parseFloat(financialData.gross_profit[year]) || 0,
      'EBITDA': parseFloat(financialData.ebitda[year]) || 0,
      'SDE': parseFloat(financialData.sde[year]) || 0,
    }));
  };

  // Calculate financial ratios
  const calculateRatios = (year) => {
    const revenue = parseFloat(financialData.revenue[year]) || 0;
    const grossProfit = parseFloat(financialData.gross_profit[year]) || 0;
    const ebitda = parseFloat(financialData.ebitda[year]) || 0;
    const currentAssets = parseFloat(financialData.current_assets[year]) || 0;
    const cash = parseFloat(financialData.cash[year]) || 0;
    const totalAssets = parseFloat(financialData.total_assets[year]) || 0;
    const totalLiabilities = parseFloat(financialData.total_liabilities[year]) || 0;
    const equity = parseFloat(financialData.equity[year]) || 0;
    const shortTermDebt = parseFloat(financialData.short_term_debt[year]) || 0;

    return {
      // Profitability Ratios
      grossMargin: revenue > 0 ? (grossProfit / revenue * 100) : 0,
      ebitdaMargin: revenue > 0 ? (ebitda / revenue * 100) : 0,
      
      // Liquidity Ratios
      currentRatio: shortTermDebt > 0 ? (currentAssets / shortTermDebt) : 0,
      cashRatio: shortTermDebt > 0 ? (cash / shortTermDebt) : 0,
      
      // Leverage Ratios
      debtToEquity: equity > 0 ? (totalLiabilities / equity) : 0,
      debtToAssets: totalAssets > 0 ? (totalLiabilities / totalAssets * 100) : 0,
      
      // Efficiency Ratios
      assetTurnover: totalAssets > 0 ? (revenue / totalAssets) : 0,
      roa: totalAssets > 0 ? (ebitda / totalAssets * 100) : 0,
      roe: equity > 0 ? (ebitda / equity * 100) : 0,
    };
  };

  const handleSubmit = () => {
    const submissionData = {
      ...financialData,
      industry_id: selectedIndustry,
      private_company_discount: privateDiscount / 100
    };

    // Save settings to localStorage
    localStorage.setItem('advancedValuationIndustry', selectedIndustry);
    localStorage.setItem('advancedValuationDiscount', privateDiscount.toString());

    onSubmit(submissionData);
  };

  if (!isOpen) return null;

  const chartData = prepareChartData();
  const selectedIndustryData = industries.find(ind => ind.id === parseInt(selectedIndustry));

  // Tooltip component
  const HelpTooltip = ({ text }) => (
    <div className="group relative inline-block ml-1">
      <HelpCircle size={14} className="inline text-blue-600 cursor-help" />
      <div className="invisible group-hover:visible absolute z-50 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg -top-2 left-6">
        {text}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-white" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-white">Advanced Financial Analysis</h2>
              <p className="text-blue-100 text-sm">Multi-year detailed valuation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex overflow-x-auto">
            {['settings', 'income', 'balance', 'addbacks', 'ratios', 'charts'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {tab === 'settings' && '⚙️ Settings'}
                {tab === 'income' && '📊 Income'}
                {tab === 'balance' && '🏦 Balance'}
                {tab === 'addbacks' && '➕ Add-backs'}
                {tab === 'ratios' && '🔢 Ratios'}
                {tab === 'charts' && '📈 Charts'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Valuation Settings</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select your industry...</option>
                  {industries.map(industry => (
                    <option key={industry.id} value={industry.id}>
                      {industry.industry_name}
                    </option>
                  ))}
                </select>
                {selectedIndustryData && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                    <p className="font-medium text-blue-900">Industry Multiples (Public Companies):</p>
                    <p className="text-blue-700">
                      EV/EBITDA: {selectedIndustryData.ev_ebitda.median}x | 
                      EV/Revenue: {selectedIndustryData.ev_revenue.median}x | 
                      P/E: {selectedIndustryData.pe.median}x
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Percent className="text-purple-600" size={20} />
                    <label className="text-sm font-semibold text-gray-800">
                      Private Company Discount
                    </label>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {privateDiscount}%
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={privateDiscount}
                  onChange={(e) => setPrivateDiscount(parseInt(e.target.value))}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #9333ea 0%, #9333ea ${privateDiscount * 2}%, #e9d5ff ${privateDiscount * 2}%, #e9d5ff 100%)`
                  }}
                />
                
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>
                
                {selectedIndustryData && (
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <p className="text-xs font-medium text-gray-700 mb-1">Adjusted Multiples:</p>
                    <p className="text-sm text-purple-700 font-semibold">
                      EV/EBITDA: {(selectedIndustryData.ev_ebitda.median * (1 - privateDiscount / 100)).toFixed(1)}x | 
                      EV/Revenue: {(selectedIndustryData.ev_revenue.median * (1 - privateDiscount / 100)).toFixed(1)}x
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Next Steps</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Select your industry above</li>
                  <li>2. Adjust the private company discount if needed</li>
                  <li>3. Go to "Income" tab and enter financial data</li>
                  <li>4. Go to "Balance" tab (auto-calculates totals)</li>
                  <li>5. Go to "Add-backs" tab to adjust EBITDA</li>
                  <li>6. View "Ratios" tab for financial health metrics</li>
                  <li>7. View "Charts" tab to see trends</li>
                  <li>8. Click "Calculate" when ready</li>
                </ol>
              </div>
            </div>
          )}

          {/* Income Statement Tab */}
          {activeTab === 'income' && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 border">Line Item</th>
                    {years.map(y => <th key={y} className="p-3 border">{y}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Revenue/Income', field: 'revenue', help: 'Total sales or income generated by the business.' },
                    { 
                      label: 'Gross Profit', 
                      field: 'gross_profit',
                      help: 'Revenue minus Cost of Goods Sold (COGS). Shows profitability before operating expenses.'
                    },
                    { 
                      label: 'EBITDA', 
                      field: 'ebitda',
                      help: 'Earnings Before Interest, Tax, Depreciation, and Amortization. Key metric for business valuation.'
                    },
                    { label: 'Depreciation/Amortization', field: 'depreciation', help: 'Non-cash expenses for asset depreciation and intangible asset amortization.' },
                    { 
                      label: 'EBIT', 
                      field: 'ebit',
                      help: 'Earnings Before Interest and Tax (EBITDA minus Depreciation/Amortization). Operating profit.'
                    },
                    { label: 'Profit After Tax', field: 'profit_after_tax', help: 'Net income after all expenses and taxes.' },
                    { 
                      label: 'Add-backs Total', 
                      field: 'addbacks_total',
                      help: 'Auto-calculated sum of all add-backs from the Add-backs tab.',
                      readonly: true 
                    },
                    { 
                      label: "Seller's Discretionary Earnings (SDE)", 
                      field: 'sde',
                      help: 'Auto-calculated as EBITDA + Add-backs. Represents true owner earnings available to a new buyer.',
                      readonly: true
                    },
                  ].map((item, idx) => (
                    <tr key={item.field} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3 border font-medium">
                        {item.label}
                        {item.help && <HelpTooltip text={item.help} />}
                        {item.readonly && <span className="ml-2 text-xs text-green-600">(Auto)</span>}
                      </td>
                      {years.map(year => (
                        <td key={year} className="p-2 border">
                          <input
                            type="number"
                            value={financialData[item.field][year]}
                            onChange={(e) => handleInputChange(item.field, year, e.target.value)}
                            className={`w-full px-2 py-1 border rounded ${
                              item.readonly ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder="$0"
                            readOnly={item.readonly}
                            disabled={item.readonly}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Balance Sheet Tab */}
          {activeTab === 'balance' && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 border">Line Item</th>
                    {years.map(y => <th key={y} className="p-3 border">{y}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { 
                      label: 'Cash and Cash Equivalents', 
                      field: 'cash',
                      help: 'Money in bank accounts, money market funds, and other highly liquid assets.'
                    },
                    { 
                      label: 'Current Assets', 
                      field: 'current_assets',
                      help: 'Assets that can be converted to cash within one year (inventory, accounts receivable, etc.).'
                    },
                    { 
                      label: 'Non-Current Assets', 
                      field: 'non_current_assets',
                      help: 'Long-term assets like property, equipment, patents, and goodwill.'
                    },
                    { 
                      label: 'Total Assets', 
                      field: 'total_assets',
                      help: 'Auto-calculated: Cash + Current Assets + Non-Current Assets. All resources owned by the business.',
                      readonly: true
                    },
                    { 
                      label: 'Long-term Debt/Liabilities', 
                      field: 'long_term_debt',
                      help: 'Debts and obligations due beyond one year (mortgages, bonds, long-term loans).'
                    },
                    { 
                      label: 'Short-term Debt/Liabilities', 
                      field: 'short_term_debt',
                      help: 'Debts due within one year (accounts payable, short-term loans, accrued expenses).'
                    },
                    { 
                      label: 'Interest Bearing Debt', 
                      field: 'interest_bearing_debt',
                      help: 'Debt that requires interest payments (excludes non-interest liabilities like accounts payable).'
                    },
                    { 
                      label: 'Total Liabilities', 
                      field: 'total_liabilities',
                      help: 'Auto-calculated: Long-term + Short-term + Interest Bearing Debt. All obligations owed.',
                      readonly: true
                    },
                    { 
                      label: 'Equity', 
                      field: 'equity',
                      help: "Owner's equity or shareholders' equity. The residual interest in assets after deducting liabilities."
                    },
                    { 
                      label: 'Total Liabilities & Equity', 
                      field: 'total_liabilities_equity',
                      help: 'Auto-calculated: Total Liabilities + Equity. Should equal Total Assets.',
                      readonly: true
                    },
                  ].map((item, idx) => (
                    <tr key={item.field} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className={`p-3 border font-medium ${item.readonly ? 'bg-blue-50' : ''}`}>
                        {item.label}
                        {item.help && <HelpTooltip text={item.help} />}
                        {item.readonly && <span className="ml-2 text-xs text-green-600">(Auto)</span>}
                      </td>
                      {years.map(year => (
                        <td key={year} className={`p-2 border ${item.readonly ? 'bg-blue-50' : ''}`}>
                          <input
                            type="number"
                            value={financialData[item.field][year]}
                            onChange={(e) => handleInputChange(item.field, year, e.target.value)}
                            className={`w-full px-2 py-1 border rounded ${
                              item.readonly ? 'bg-gray-100 cursor-not-allowed font-semibold' : ''
                            }`}
                            placeholder="$0"
                            readOnly={item.readonly}
                            disabled={item.readonly}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add-backs Tab */}
          {activeTab === 'addbacks' && (
            <div>
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">💡 What are Add-backs?</h4>
                <p className="text-sm text-green-800">
                  Add-backs are expenses that can be added back to EBITDA because a new owner won't incur them.
                  These automatically calculate your SDE (Seller's Discretionary Earnings).
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-3 border">Add-back Item</th>
                      {years.map(y => <th key={y} className="p-3 border">{y}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Owner Salary', field: 'owner_salary' },
                      { label: 'Family Salaries', field: 'family_salaries' },
                      { label: 'Salary Adjustments', field: 'salary_adjustments' },
                      { label: 'Auto Expenses', field: 'auto_expenses' },
                      { label: 'Donations', field: 'donations' },
                      { label: 'Insurance Premiums', field: 'insurance_premiums' },
                      { label: 'Inventory Adjustments', field: 'inventory_adjustments' },
                      { label: 'Meals/Entertainment', field: 'meals_entertainment' },
                      { label: 'Personal Expenses', field: 'personal_expenses' },
                      { label: 'Phone/Internet', field: 'phone_internet' },
                      { label: 'Non-business Services', field: 'non_business_services' },
                      { label: 'Travel', field: 'travel' },
                      { label: 'One-time Charges', field: 'one_time_charges' },
                      { label: 'Retirement', field: 'retirement' },
                      { label: 'Supplier Rebates', field: 'supplier_rebates' },
                      { label: 'Other', field: 'other_addbacks' },
                    ].map((item, idx) => (
                      <tr key={item.field} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-3 border font-medium">{item.label}</td>
                        {years.map(year => (
                          <td key={year} className="p-2 border">
                            <input
                              type="number"
                              value={financialData[item.field][year]}
                              onChange={(e) => handleInputChange(item.field, year, e.target.value)}
                              className="w-full px-2 py-1 border rounded"
                              placeholder="$0"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Financial Ratios Tab - NEW! */}
          {activeTab === 'ratios' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator className="text-blue-600" size={24} />
                Financial Ratios Analysis
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {years.map(year => {
                  const ratios = calculateRatios(year);
                  
                  return (
                    <div key={year} className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                      <h4 className="text-lg font-bold text-blue-900 mb-4 border-b pb-2">
                        {year} Ratios
                      </h4>

                      {/* Profitability Ratios */}
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          💰 Profitability Ratios
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>
                              Gross Margin
                              <HelpTooltip text="Gross Profit / Revenue. Shows percentage of revenue retained after COGS. Higher is better (>40% is excellent)." />
                            </span>
                            <span className={`font-bold ${ratios.grossMargin > 40 ? 'text-green-600' : ratios.grossMargin > 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {ratios.grossMargin.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>
                              EBITDA Margin
                              <HelpTooltip text="EBITDA / Revenue. Shows operating profitability. >15% is good, >25% is excellent." />
                            </span>
                            <span className={`font-bold ${ratios.ebitdaMargin > 25 ? 'text-green-600' : ratios.ebitdaMargin > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {ratios.ebitdaMargin.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Liquidity Ratios */}
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          💧 Liquidity Ratios
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>
                              Current Ratio
                              <HelpTooltip text="Current Assets / Short-term Debt. Measures ability to pay short-term obligations. >1.5 is healthy, >2.0 is strong." />
                            </span>
                            <span className={`font-bold ${ratios.currentRatio > 2 ? 'text-green-600' : ratios.currentRatio > 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {ratios.currentRatio.toFixed(2)}x
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>
                              Cash Ratio
                              <HelpTooltip text="Cash / Short-term Debt. Most conservative liquidity measure. >0.5 is good." />
                            </span>
                            <span className={`font-bold ${ratios.cashRatio > 0.5 ? 'text-green-600' : ratios.cashRatio > 0.2 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {ratios.cashRatio.toFixed(2)}x
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Leverage Ratios */}
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          ⚖️ Leverage Ratios
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>
                              Debt-to-Equity
                              <HelpTooltip text="Total Liabilities / Equity. Shows financial leverage. <1.0 is conservative, <2.0 is moderate, >2.0 is aggressive." />
                            </span>
                            <span className={`font-bold ${ratios.debtToEquity < 1 ? 'text-green-600' : ratios.debtToEquity < 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {ratios.debtToEquity.toFixed(2)}x
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>
                              Debt-to-Assets
                              <HelpTooltip text="Total Liabilities / Total Assets. Shows what % of assets are financed by debt. <30% is low, 30-60% is moderate, >60% is high." />
                            </span>
                            <span className={`font-bold ${ratios.debtToAssets < 30 ? 'text-green-600' : ratios.debtToAssets < 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {ratios.debtToAssets.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Efficiency Ratios */}
                      <div>
                        <h5 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          ⚡ Efficiency Ratios
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>
                              Asset Turnover
                              <HelpTooltip text="Revenue / Total Assets. Measures how efficiently assets generate revenue. >1.0 is good, >2.0 is excellent." />
                            </span>
                            <span className={`font-bold ${ratios.assetTurnover > 2 ? 'text-green-600' : ratios.assetTurnover > 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {ratios.assetTurnover.toFixed(2)}x
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>
                              ROA (Return on Assets)
                              <HelpTooltip text="EBITDA / Total Assets. Shows how profitable assets are. >10% is good, >20% is excellent." />
                            </span>
                            <span className={`font-bold ${ratios.roa > 20 ? 'text-green-600' : ratios.roa > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {ratios.roa.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>
                              ROE (Return on Equity)
                              <HelpTooltip text="EBITDA / Equity. Shows return to owners. >15% is good, >25% is excellent." />
                            </span>
                            <span className={`font-bold ${ratios.roe > 25 ? 'text-green-600' : ratios.roe > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {ratios.roe.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ratios Chart */}
              <div className="mt-6 bg-white border rounded-lg p-6">
                <h4 className="text-md font-semibold mb-4">Profitability Trend</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={years.map(year => ({
                    year: year.toString(),
                    'Gross Margin': calculateRatios(year).grossMargin,
                    'EBITDA Margin': calculateRatios(year).ebitdaMargin,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                    <Legend />
                    <Bar dataKey="Gross Margin" fill="#10b981" />
                    <Bar dataKey="EBITDA Margin" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Charts Tab */}
          {activeTab === 'charts' && (
            <div>
              <div className="mb-8 bg-white border rounded-lg p-6">
                <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="text-green-600" size={20} />
                  Gross Profit Trend
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="Gross Profit" stroke="#10b981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mb-8 bg-white border rounded-lg p-6">
                <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="text-blue-600" size={20} />
                  EBITDA Trend
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="EBITDA" stroke="#3b82f6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mb-8 bg-white border rounded-lg p-6">
                <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="text-purple-600" size={20} />
                  SDE Trend (Auto-Calculated)
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="SDE" stroke="#9333ea" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <div className="flex items-center gap-4">
            {!selectedIndustry && (
              <span className="text-sm text-red-600">⚠️ Please select an industry</span>
            )}
            <button
              onClick={handleSubmit}
              disabled={!selectedIndustry}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                selectedIndustry
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <BarChart3 size={20} />
              Calculate Advanced Valuation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedValuationModal;
