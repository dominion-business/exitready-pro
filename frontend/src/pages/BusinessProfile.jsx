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
    // Client Personal Information
    client_first_name: '',
    client_last_name: '',
    client_email: '',
    client_phone: '',
    client_date_of_birth: '',
    client_address: '',
    client_city: '',
    client_state: '',
    client_zip: '',
    // Spouse/Partner Information
    spouse_name: '',
    spouse_email: '',
    spouse_phone: '',
    spouse_involved_in_business: false,
    // Family & Dependents
    num_dependents: '',
    dependents_info: [],
    // Business Information
    business_name: '',
    industry: '',
    employees: '',
    year_founded: '',
    primary_location: '',
    primary_market: '',
    registration_type: '',
    owners: [{ name: '', ownership_percentage: '' }],
    // Exit planning fields
    exit_horizon: '',
    preferred_exit_type: '',
    key_motivations: [],
    deal_breakers: [],
    // Strategic assets
    has_proprietary_tech: false,
    has_patents_ip: false,
    has_recurring_revenue: false,
    recurring_revenue_percentage: '',
    // Financials
    gross_margin: '',
    growth_rate: '',
    customer_concentration: '',
    // Succession & team
    has_management_team: false,
    successor_identified: false,
    successor_type: '',
    // Advisory team
    has_attorney: false,
    has_accountant: false,
    has_financial_advisor: false,
    has_exit_advisor: false
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

        // Parse JSON fields
        const parseJSON = (field) => {
          try {
            return typeof field === 'string' ? JSON.parse(field) : field;
          } catch {
            return field || [];
          }
        };

        setFormData({
          // Client Personal Information
          client_first_name: profile.client_first_name || '',
          client_last_name: profile.client_last_name || '',
          client_email: profile.client_email || '',
          client_phone: profile.client_phone || '',
          client_date_of_birth: profile.client_date_of_birth || '',
          client_address: profile.client_address || '',
          client_city: profile.client_city || '',
          client_state: profile.client_state || '',
          client_zip: profile.client_zip || '',
          // Spouse/Partner Information
          spouse_name: profile.spouse_name || '',
          spouse_email: profile.spouse_email || '',
          spouse_phone: profile.spouse_phone || '',
          spouse_involved_in_business: profile.spouse_involved_in_business || false,
          // Family & Dependents
          num_dependents: profile.num_dependents || '',
          dependents_info: parseJSON(profile.dependents_info) || [],
          // Business Information
          business_name: profile.business_name || '',
          industry: profile.industry || '',
          employees: profile.employees || '',
          year_founded: profile.year_founded || '',
          primary_location: profile.primary_location || '',
          primary_market: profile.primary_market || '',
          registration_type: profile.registration_type || '',
          owners: profile.owners && profile.owners.length > 0
            ? parseJSON(profile.owners)
            : [{ name: '', ownership_percentage: '' }],
          // Exit planning fields
          exit_horizon: profile.exit_horizon || '',
          preferred_exit_type: profile.preferred_exit_type || '',
          key_motivations: parseJSON(profile.key_motivations) || [],
          deal_breakers: parseJSON(profile.deal_breakers) || [],
          // Strategic assets
          has_proprietary_tech: profile.has_proprietary_tech || false,
          has_patents_ip: profile.has_patents_ip || false,
          has_recurring_revenue: profile.has_recurring_revenue || false,
          recurring_revenue_percentage: profile.recurring_revenue_percentage || '',
          // Financials
          gross_margin: profile.gross_margin || '',
          growth_rate: profile.growth_rate || '',
          customer_concentration: profile.customer_concentration || '',
          // Succession & team
          has_management_team: profile.has_management_team || false,
          successor_identified: profile.successor_identified || false,
          successor_type: profile.successor_type || '',
          // Advisory team
          has_attorney: profile.has_attorney || false,
          has_accountant: profile.has_accountant || false,
          has_financial_advisor: profile.has_financial_advisor || false,
          has_exit_advisor: profile.has_exit_advisor || false
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleMultiSelectChange = (field, value) => {
    const currentValues = formData[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setFormData({ ...formData, [field]: newValues });
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
            Client Profile
          </h1>
          <p className="text-gray-600 mt-1">Manage your client and business information</p>
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
          {/* Client Personal Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Personal Information</h2>

            {/* Client Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="client_first_name"
                  value={formData.client_first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Client's first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="client_last_name"
                  value={formData.client_last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Client's last name"
                />
              </div>
            </div>

            {/* Client Contact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="client_email"
                  value={formData.client_email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="client@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="client_phone"
                  value={formData.client_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="client_date_of_birth"
                  value={formData.client_date_of_birth}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Client Address */}
            <div className="grid grid-cols-1 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="client_address"
                  value={formData.client_address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Street address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="client_city"
                  value={formData.client_city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="client_state"
                  value={formData.client_state}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="client_zip"
                  value={formData.client_zip}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ZIP"
                />
              </div>
            </div>
          </div>

          {/* Spouse/Partner Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Spouse/Partner Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spouse/Partner Name
                </label>
                <input
                  type="text"
                  name="spouse_name"
                  value={formData.spouse_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="spouse_email"
                  value={formData.spouse_email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="spouse@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="spouse_phone"
                  value={formData.spouse_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="spouse_involved_in_business"
                  checked={formData.spouse_involved_in_business}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Spouse/Partner is involved in the business</span>
              </label>
            </div>
          </div>

          {/* Family & Dependents Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Family & Dependents</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Dependents
                </label>
                <input
                  type="number"
                  name="num_dependents"
                  value={formData.num_dependents}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Business Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>

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
          </div>

          {/* Exit Planning Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Exit Planning</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exit Horizon
                </label>
                <select
                  name="exit_horizon"
                  value={formData.exit_horizon}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select timeline</option>
                  <option value="0-2 years">0-2 years</option>
                  <option value="2-5 years">2-5 years</option>
                  <option value="5-10 years">5-10 years</option>
                  <option value="10+ years">10+ years</option>
                  <option value="Exploring options">Exploring options</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Exit Type
                </label>
                <select
                  name="preferred_exit_type"
                  value={formData.preferred_exit_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select exit type</option>
                  <option value="Strategic Sale">Strategic Sale</option>
                  <option value="Private Equity Sale">Private Equity Sale</option>
                  <option value="Family Succession">Family Succession</option>
                  <option value="Management Buyout">Management Buyout</option>
                  <option value="ESOP">ESOP</option>
                  <option value="IPO">IPO</option>
                  <option value="Gradual Wind Down">Gradual Wind Down</option>
                  <option value="Undecided">Undecided</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Motivations (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Maximize valuation', 'Retire/lifestyle change', 'Preserve legacy', 'Reward employees', 'Reduce risk', 'Capitalize on market timing'].map(motivation => (
                  <label key={motivation} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(formData.key_motivations || []).includes(motivation)}
                      onChange={() => handleMultiSelectChange('key_motivations', motivation)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{motivation}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deal Breakers (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Layoffs', 'Location closure', 'Culture change', 'Equity rollover required', 'Long earn-out', 'Non-compete'].map(breaker => (
                  <label key={breaker} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(formData.deal_breakers || []).includes(breaker)}
                      onChange={() => handleMultiSelectChange('deal_breakers', breaker)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{breaker}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Financials & Operations Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Financials & Operations</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gross Margin (%)
                </label>
                <input
                  type="number"
                  name="gross_margin"
                  value={formData.gross_margin}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 65"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Growth Rate (%)
                </label>
                <input
                  type="number"
                  name="growth_rate"
                  value={formData.growth_rate}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Concentration
                </label>
                <select
                  name="customer_concentration"
                  value={formData.customer_concentration}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select level</option>
                  <option value="Low">Low (no customer >10%)</option>
                  <option value="Medium">Medium (largest 10-25%)</option>
                  <option value="High">High (largest >25%)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    name="has_recurring_revenue"
                    checked={formData.has_recurring_revenue}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Has Recurring Revenue</span>
                </label>
                {formData.has_recurring_revenue && (
                  <input
                    type="number"
                    name="recurring_revenue_percentage"
                    value={formData.recurring_revenue_percentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="1"
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="% of revenue that's recurring"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Strategic Assets Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Strategic Assets</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="has_proprietary_tech"
                  checked={formData.has_proprietary_tech}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Proprietary Technology</span>
              </label>

              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="has_patents_ip"
                  checked={formData.has_patents_ip}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Patents or IP Portfolio</span>
              </label>
            </div>
          </div>

          {/* Succession & Team Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Succession & Team</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="has_management_team"
                  checked={formData.has_management_team}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Capable Management Team in Place</span>
              </label>

              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="successor_identified"
                  checked={formData.successor_identified}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Successor Identified</span>
              </label>
            </div>

            {formData.successor_identified && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Successor Type
                </label>
                <select
                  name="successor_type"
                  value={formData.successor_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="Family">Family Member</option>
                  <option value="Management">Current Management</option>
                  <option value="External">External Candidate</option>
                  <option value="Key Employee">Key Employee</option>
                </select>
              </div>
            )}
          </div>

          {/* Advisory Team Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Advisory Team</h2>
            <p className="text-sm text-gray-600 mb-4">
              Check which advisors you currently have on your team
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="has_attorney"
                  checked={formData.has_attorney}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Business Attorney</span>
              </label>

              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="has_accountant"
                  checked={formData.has_accountant}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>CPA / Accountant</span>
              </label>

              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="has_financial_advisor"
                  checked={formData.has_financial_advisor}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Financial Advisor</span>
              </label>

              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="has_exit_advisor"
                  checked={formData.has_exit_advisor}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Exit / M&A Advisor</span>
              </label>
            </div>
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