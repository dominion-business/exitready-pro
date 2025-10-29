import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, DollarSign, Target, Calendar, Edit2, RefreshCw } from 'lucide-react';

const ValuationDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [latestValuation, setLatestValuation] = useState(null);
  const [valuationHistory, setValuationHistory] = useState([]);
  const [editMode, setEditMode] = useState(false);
  
  // Interactive controls
  const [growthRate, setGrowthRate] = useState(23);
  const [profitMargin, setprofitMargin] = useState(53);
  
  // Financial metrics (editable)
  const [financials, setFinancials] = useState({
    grossProfit: 200000,
    assetValue: 0,
    grossMargin: 40,
    profitMargin: 14
  });
  
  // Goals
  const [goals, setGoals] = useState({
    targetValuation: 900000,
    lifestyleNeeds: 700000,
    minimumExit: 600000
  });

  useEffect(() => {
    fetchValuationData();
  }, []);

  const fetchValuationData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/valuation/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const valuations = response.data.valuations || [];
      setValuationHistory(valuations);
      
      if (valuations.length > 0) {
        setLatestValuation(valuations[0]);
        
        // Extract financials from latest valuation
        if (valuations[0].input_data) {
          const inputs = JSON.parse(valuations[0].input_data);
          setFinancials({
            grossProfit: inputs.ebitda || 200000,
            assetValue: inputs.total_assets || 0,
            grossMargin: inputs.ebitda && inputs.revenue ? 
              Math.round((inputs.ebitda / inputs.revenue) * 100) : 40,
            profitMargin: inputs.net_income && inputs.revenue ? 
              Math.round((inputs.net_income / inputs.revenue) * 100) : 14
          });
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching valuations:', error);
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

  // Generate forecast data based on current valuation and growth rate
  const generateForecastData = () => {
    if (!latestValuation) return [];
    
    const currentValue = latestValuation.valuation_amount;
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
      
      const quarterlyGrowth = (growthRate / 100) / 4; // Convert annual to quarterly
      const projectedValue = currentValue * Math.pow(1 + quarterlyGrowth, i);
      
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
  
  // Calculate value gap
  const valueGap = latestValuation && goals.targetValuation 
    ? goals.targetValuation - latestValuation.valuation_amount
    : 0;
  
  const valueGapPercentage = latestValuation && goals.targetValuation
    ? Math.round((valueGap / goals.targetValuation) * 100)
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Valuation Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your business value and forecast growth</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Estimated Valuation Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Estimated valuation and gap</h2>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-1">Current Estimated EV</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatShortCurrency(latestValuation.valuation_amount)}
            </p>
            {latestValuation.low_range && latestValuation.high_range && (
              <p className="text-sm text-gray-500 mt-1">
                Range: {formatShortCurrency(latestValuation.low_range)} - {formatShortCurrency(latestValuation.high_range)}
              </p>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-1">Value gap to target</p>
            <p className={`text-3xl font-bold ${valueGap > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {valueGap > 0 ? '+' : ''}{formatShortCurrency(valueGap)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {Math.abs(valueGapPercentage)}% {valueGap > 0 ? 'to reach goal' : 'above goal'}
            </p>
          </div>
          
          <a href="#" className="text-blue-600 text-sm mt-4 inline-block hover:underline">
            What is EV?
          </a>
        </div>

        {/* Adjust Valuation Channel */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Adjust valuation channel</h2>
          
          {/* Growth Rate Slider */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">GROWTH RATE YOY</label>
              <span className="text-lg font-bold text-blue-600">{growthRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={growthRate}
              onChange={(e) => setGrowthRate(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Profit Margin Slider */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">EBITDA/GROSS PROFIT</label>
              <span className="text-lg font-bold text-blue-600">{profitMargin}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={profitMargin}
              onChange={(e) => setprofitMargin(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
          
          <button
            onClick={fetchValuationData}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            Re-assess valuation
          </button>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Financial summary</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-gray-600">Latest gross profit</p>
                <button onClick={() => setEditMode(!editMode)}>
                  <Edit2 size={14} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatShortCurrency(financials.grossProfit)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Asset market value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatShortCurrency(financials.assetValue)}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-sm text-gray-600 mb-1">Gross margin</p>
                <p className="text-2xl font-bold text-gray-900">{financials.grossMargin}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Profit margin</p>
                <p className="text-2xl font-bold text-gray-900">{financials.profitMargin}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Valuation Forecast Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Valuation forecast</h2>
            <p className="text-sm text-gray-500">5-year projection based on {growthRate}% annual growth</p>
          </div>
          <a href="/valuation" className="text-blue-600 text-sm hover:underline">
            New calculation
          </a>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
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
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2 mb-3">
            <div className="p-1 bg-blue-100 rounded">
              <TrendingUp size={16} className="text-blue-600" />
            </div>
            <p className="text-sm text-blue-900">
              The start date of the graph is the balance date for the yearly report closest to your signup date.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-1 bg-blue-100 rounded">
              <Target size={16} className="text-blue-600" />
            </div>
            <p className="text-sm text-blue-900">
              The horizontal target lines are from goal setting.
            </p>
          </div>
        </div>
        
        <button
          className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <RefreshCw size={16} />
          Re-assess goal setting
        </button>
      </div>

      {/* Valuation History */}
      {valuationHistory.length > 1 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Valuation History</h2>
          
          {/* History Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={historyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
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
              <Bar dataKey="valuation" fill="#3b82f6" name="Valuation" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          
          {/* History Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Method</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Valuation</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Range</th>
                </tr>
              </thead>
              <tbody>
                {valuationHistory.map((val) => (
                  <tr key={val.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(val.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">{val.method}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-right text-gray-900">
                      {formatCurrency(val.valuation_amount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      {val.low_range && val.high_range 
                        ? `${formatShortCurrency(val.low_range)} - ${formatShortCurrency(val.high_range)}`
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValuationDashboard;
