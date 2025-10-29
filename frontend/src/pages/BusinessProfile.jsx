import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Building2, Save, Plus, Trash2 } from 'lucide-react';
import AdvancedValuationModal from '../components/AdvancedValuationModal';

const BusinessProfile = () => {
  const { user, updateUser } = useAuth();
  const [showAdvancedValuation, setShowAdvancedValuation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const [formData, setFormData] = useState({
    business_name: '',
    industry: '',
    employees: '',
    year_founded: '',
    primary_location: '',
    primary_market: '',
    registration_type: '',
    owners: [{ name: '', ownership_percentage: '' }]
  });

  useEffect(() => {
    loadBusinessProfile();
  }, []);

  const loadBusinessProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/business/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.profile) {
        const profile = response.data.profile;
        setFormData({
          business_name: profile.business_name || '',
          industry: profile.industry || '',
          employees: profile.employees || '',
          year_founded: profile.year_founded || '',
          primary_location: profile.primary_location || '',
          primary_market: profile.primary_market || '',
          registration_type: profile.registration_type || '',
          owners: profile.owners && profile.owners.length > 0
            ? profile.owners
            : [{ name: '', ownership_percentage: '' }]
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOwnerChange = (index, field, value) => {
    const newOwners = [...formData.owners];
    newOwners[index][field] = value;
    setFormData({ ...formData, owners: newOwners });
  };

  const calculateYearsInBusiness = () => {
    if (formData.year_founded) {
      const currentYear = new Date().getFullYear();
      const years = currentYear - parseInt(formData.year_founded);
      return years >= 0 ? years : 0;
    }
    return 0;
  };

  const addOwner = () => {
    setFormData({
      ...formData,
      owners: [...formData.owners, { name: '', ownership_percentage: '' }]
    });
  };

  const removeOwner = (index) => {
    const newOwners = formData.owners.filter((_, i) => i !== index);
    setFormData({ ...formData, owners: newOwners });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/business/profile',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSaveStatus('success');
        // Update auth context with business name and industry
        updateUser({
          business_name: formData.business_name,
          industry: formData.industry
        });
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const industries = [
    'Software & Technology',
    'Healthcare & Medical',
    'Manufacturing',
    'Retail & E-commerce',
    'Professional Services',
    'Construction',
    'Real Estate',
    'Finance & Insurance',
    'Education',
    'Hospitality & Food Service',
    'Other'
  ];

  const registrationTypes = [
    'Sole Proprietorship',
    'Partnership',
    'LLC',
    'S Corporation',
    'C Corporation',
    'Non-Profit',
    'Other'
  ];

  const markets = [
    'Local',
    'Regional',
    'National',
    'International',
    'Global'
  ];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="text-blue-600" size={32} />
            Business Profile
          </h1>
          <p className="text-gray-600 mt-1">Manage your business information</p>
        </div>

        {saveStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            Profile saved successfully!
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            Error saving profile. Please try again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          {/* Business Name & Industry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry *
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select industry</option>
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Number of Employees & Year Founded */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Employees *
              </label>
              <input
                type="number"
                name="employees"
                value={formData.employees}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year Founded *
              </label>
              <input
                type="number"
                name="year_founded"
                value={formData.year_founded}
                onChange={handleChange}
                required
                min="1800"
                max={new Date().getFullYear()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2015"
              />
              {formData.year_founded && (
                <p className="text-xs text-gray-500 mt-1">
                  Years in business: {calculateYearsInBusiness()}
                </p>
              )}
            </div>
          </div>

          {/* Primary Location & Market */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary State/Location *
              </label>
              <input
                type="text"
                name="primary_location"
                value={formData.primary_location}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., California, New York, Texas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Geographical Market *
              </label>
              <select
                name="primary_market"
                value={formData.primary_market}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select market</option>
                {markets.map(market => (
                  <option key={market} value={market}>{market}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Registration Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Registration Type *
              </label>
              <select
                name="registration_type"
                value={formData.registration_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select type</option>
                {registrationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div></div>
          </div>

          {/* Owners Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Business Owners *
              </label>
              <button
                type="button"
                onClick={addOwner}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
              >
                <Plus size={16} />
                Add Owner
              </button>
            </div>

            <div className="space-y-3">
              {formData.owners.map((owner, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={owner.name}
                      onChange={(e) => handleOwnerChange(index, 'name', e.target.value)}
                      placeholder="Owner name"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      value={owner.ownership_percentage}
                      onChange={(e) => handleOwnerChange(index, 'ownership_percentage', e.target.value)}
                      placeholder="% owned"
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {formData.owners.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOwner(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Total ownership: {formData.owners.reduce((sum, owner) => sum + (parseFloat(owner.ownership_percentage) || 0), 0).toFixed(2)}%
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400"
            >
              <Save size={20} />
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {showAdvancedValuation && (
        <AdvancedValuationModal
          isOpen={showAdvancedValuation}
          onClose={() => setShowAdvancedValuation(false)}
          businessProfile={formData}
        />
      )}
    </div>
  );
};

export default BusinessProfile;