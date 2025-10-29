import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Calculator,
  TrendingUp,
  FileText,
  Settings,
  BarChart3,
  User
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    valuation: 0,
    readinessScore: 0,
    tasksCompleted: 0,
    daysToExit: '-',
    valuationCount: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch valuation history to get latest stats
      const valuationResponse = await axios.get('http://localhost:5000/api/valuation/history', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const valuations = valuationResponse.data.valuations || [];

      if (valuations.length > 0) {
        setStats(prev => ({
          ...prev,
          valuation: valuations[0].valuation_amount,
          valuationCount: valuations.length
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Cameron'}!
        </h1>
        <p className="text-gray-600 mt-1">Here's your business exit planning overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Business Valuation</span>
            <Calculator className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${stats.valuation.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.valuationCount > 0
              ? `${stats.valuationCount} calculation${stats.valuationCount > 1 ? 's' : ''}`
              : 'Not calculated yet'
            }
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Readiness Score</span>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.readinessScore}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Not yet assessed</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Tasks Completed</span>
            <FileText className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.tasksCompleted}/0
          </p>
          <p className="text-xs text-gray-500 mt-1">No tasks yet</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Target Exit Date</span>
            <Settings className="text-orange-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.daysToExit}
          </p>
          <p className="text-xs text-gray-500 mt-1">Not set</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/valuation')}
            className="flex items-center gap-4 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
          >
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calculator className="text-blue-600" size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Calculate Valuation</h3>
              <p className="text-sm text-gray-600">Get your business value</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/valuation-dashboard')}
            className="flex items-center gap-4 p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
          >
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="text-green-600" size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">View Dashboard</h3>
              <p className="text-sm text-gray-600">Charts & forecasts</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/business-profile')}
            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
          >
            <div className="p-3 bg-gray-100 rounded-lg">
              <User className="text-gray-600" size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Update Profile</h3>
              <p className="text-sm text-gray-600">Edit business details</p>
            </div>
          </button>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Getting Started</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Create your account</h3>
              <p className="text-sm text-gray-600">You're all set up!</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">2</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Complete your business profile</h3>
              <p className="text-sm text-gray-600">Add your business details for accurate valuations</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">3</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Calculate your business valuation</h3>
              <p className="text-sm text-gray-600">Use our 5-method calculator to understand your worth</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;