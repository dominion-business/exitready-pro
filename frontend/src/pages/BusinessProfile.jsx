import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Save, Plus, Trash2, ClipboardList, Users, Briefcase, Target, User, Heart, ChevronDown } from 'lucide-react';

// Constants defined outside component to prevent re-creation
const INDUSTRIES = ['Software & Technology', 'Healthcare & Medical', 'Manufacturing', 'Retail & E-commerce',
  'Professional Services', 'Construction', 'Real Estate', 'Finance & Insurance', 'Education',
  'Hospitality & Food Service', 'Other'];

const REGISTRATION_TYPES = ['Sole Proprietorship', 'Partnership', 'LLC', 'S Corporation',
  'C Corporation', 'Non-Profit', 'Other'];

const MARKETS = ['Local', 'Regional', 'National', 'International', 'Global'];

const US_STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming', 'American Samoa', 'District of Columbia', 'Guam',
  'Northern Mariana Islands', 'Puerto Rico', 'U.S. Virgin Islands'];

const TODAY = new Date().toISOString().split('T')[0];

// Component helper components defined outside to prevent re-creation
const SectionCard = ({ title, icon, gradient, children, onSave, isSaving, saveSuccess, isExpanded, onToggle }) => (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
    <div className={`bg-gradient-to-r ${gradient} px-6 py-4 cursor-pointer`} onClick={onToggle}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChevronDown
            size={20}
            className={`text-white transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
          {icon}
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {saveSuccess && (
            <span className="text-sm font-semibold text-green-100 animate-fade-in">
              ✓ Saved!
            </span>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="group flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Save size={16} className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-semibold">{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
    {isExpanded && <div className="p-6">{children}</div>}
  </div>
);

const InputField = ({ label, name, type = "text", value, onChange, placeholder, className = "", min, max }) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
      placeholder={placeholder}
    />
  </div>
);

const NotesField = ({ sectionName, value, onChange, isExpanded, onToggle }) => (
  <div className="mt-6 border-t pt-4">
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors mb-2"
    >
      <ChevronDown
        size={16}
        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
      />
      Notes
      {value && value.trim() && (
        <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
          ✓
        </span>
      )}
    </button>
    {isExpanded && (
      <textarea
        name={sectionName}
        value={value}
        onChange={onChange}
        rows={4}
        placeholder="Add any additional notes or details..."
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 resize-none"
      />
    )}
  </div>
);

const BusinessProfile = () => {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [savingSection, setSavingSection] = useState(null);
  const [savedSection, setSavedSection] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [savedAll, setSavedAll] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    client: false,
    spouse: false,
    dependents: false,
    business: false,
    exit: false,
    advisory: false
  });

  const [formData, setFormData] = useState({
    client_first_name: '', client_last_name: '', client_email: '', client_phone: '',
    client_date_of_birth: '', client_address: '', client_city: '', client_state: '', client_zip: '', client_sex: '',
    client_notes: '',
    spouse_name: '', spouse_email: '', spouse_phone: '', spouse_involved_in_business: false, spouse_sex: '',
    spouse_notes: '',
    num_dependents: 0, dependents_info: [],
    dependents_notes: '',
    business_name: '', industry: '', employees: '', year_founded: '',
    primary_location: '', primary_market: '', registration_type: '',
    owners: [{ name: '', ownership_percentage: '', email: '', phone: '' }],
    business_notes: '',
    exit_horizon: '', preferred_exit_type: '',
    key_motivations: [], key_motivations_other: [],
    deal_breakers: [], deal_breakers_other: [],
    exit_notes: '',
    custom_advisors: [],
    advisory_notes: '',
    has_attorney: false, attorney_name: '', attorney_email: '', attorney_phone: '',
    has_accountant: false, accountant_name: '', accountant_email: '', accountant_phone: '',
    has_financial_advisor: false, financial_advisor_name: '', financial_advisor_email: '', financial_advisor_phone: '',
    has_exit_advisor: false, exit_advisor_name: '', exit_advisor_email: '', exit_advisor_phone: '',
    has_insurance_agent: false, insurance_agent_name: '', insurance_agent_email: '', insurance_agent_phone: '',
    has_banker: false, banker_name: '', banker_email: '', banker_phone: '',
    has_estate_planner: false, estate_planner_name: '', estate_planner_email: '', estate_planner_phone: '',
    has_business_coach: false, business_coach_name: '', business_coach_email: '', business_coach_phone: ''
  });

  const loadBusinessProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/business/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.profile) {
        const profile = response.data.profile;
        const parseJSON = (field) => {
          try { return typeof field === 'string' ? JSON.parse(field) : field; }
          catch { return field || []; }
        };

        setFormData({
          client_first_name: profile.client_first_name || '', client_last_name: profile.client_last_name || '',
          client_email: profile.client_email || '', client_phone: profile.client_phone || '',
          client_date_of_birth: profile.client_date_of_birth || '', client_address: profile.client_address || '',
          client_city: profile.client_city || '', client_state: profile.client_state || '', client_zip: profile.client_zip || '',
          client_sex: profile.client_sex || '',
          client_notes: profile.client_notes || '',
          spouse_name: profile.spouse_name || '', spouse_email: profile.spouse_email || '',
          spouse_phone: profile.spouse_phone || '', spouse_involved_in_business: profile.spouse_involved_in_business || false,
          spouse_sex: profile.spouse_sex || '',
          spouse_notes: profile.spouse_notes || '',
          num_dependents: profile.num_dependents || 0, dependents_info: parseJSON(profile.dependents_info) || [],
          dependents_notes: profile.dependents_notes || '',
          business_name: profile.business_name || '', industry: profile.industry || '',
          employees: profile.employees || '', year_founded: profile.year_founded || '',
          primary_location: profile.primary_location || '', primary_market: profile.primary_market || '',
          registration_type: profile.registration_type || '',
          owners: profile.owners && profile.owners.length > 0 ? parseJSON(profile.owners) : [{ name: '', ownership_percentage: '', email: '', phone: '' }],
          business_notes: profile.business_notes || '',
          exit_horizon: profile.exit_horizon || '', preferred_exit_type: profile.preferred_exit_type || '',
          key_motivations: parseJSON(profile.key_motivations) || [],
          key_motivations_other: parseJSON(profile.key_motivations_other) || [],
          deal_breakers: parseJSON(profile.deal_breakers) || [],
          deal_breakers_other: parseJSON(profile.deal_breakers_other) || [],
          exit_notes: profile.exit_notes || '',
          custom_advisors: parseJSON(profile.custom_advisors) || [],
          advisory_notes: profile.advisory_notes || '',
          has_attorney: profile.has_attorney || false, attorney_name: profile.attorney_name || '',
          attorney_email: profile.attorney_email || '', attorney_phone: profile.attorney_phone || '',
          has_accountant: profile.has_accountant || false, accountant_name: profile.accountant_name || '',
          accountant_email: profile.accountant_email || '', accountant_phone: profile.accountant_phone || '',
          has_financial_advisor: profile.has_financial_advisor || false,
          financial_advisor_name: profile.financial_advisor_name || '',
          financial_advisor_email: profile.financial_advisor_email || '',
          financial_advisor_phone: profile.financial_advisor_phone || '',
          has_exit_advisor: profile.has_exit_advisor || false, exit_advisor_name: profile.exit_advisor_name || '',
          exit_advisor_email: profile.exit_advisor_email || '', exit_advisor_phone: profile.exit_advisor_phone || '',
          has_insurance_agent: profile.has_insurance_agent || false,
          insurance_agent_name: profile.insurance_agent_name || '',
          insurance_agent_email: profile.insurance_agent_email || '',
          insurance_agent_phone: profile.insurance_agent_phone || '',
          has_banker: profile.has_banker || false, banker_name: profile.banker_name || '',
          banker_email: profile.banker_email || '', banker_phone: profile.banker_phone || '',
          has_estate_planner: profile.has_estate_planner || false,
          estate_planner_name: profile.estate_planner_name || '',
          estate_planner_email: profile.estate_planner_email || '',
          estate_planner_phone: profile.estate_planner_phone || '',
          has_business_coach: profile.has_business_coach || false,
          business_coach_name: profile.business_coach_name || '',
          business_coach_email: profile.business_coach_email || '',
          business_coach_phone: profile.business_coach_phone || ''
        });
      }
    } catch (error) { console.error('Error loading profile:', error); }
  }, []);

  useEffect(() => {
    loadBusinessProfile();
  }, [loadBusinessProfile]);

  const toggleNotes = useCallback((sectionName) => {
    setExpandedNotes(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  }, []);

  const toggleSection = useCallback((sectionName) => {
    setExpandedSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  }, []);

  const expandAllSections = useCallback(() => {
    setExpandedSections({
      client: true,
      spouse: true,
      dependents: true,
      business: true,
      exit: true,
      advisory: true
    });
  }, []);

  const collapseAllSections = useCallback(() => {
    setExpandedSections({
      client: false,
      spouse: false,
      dependents: false,
      business: false,
      exit: false,
      advisory: false
    });
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const handleMultiSelectChange = useCallback((field, value) => {
    setFormData(prev => {
      const currentValues = prev[field] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  }, []);

  const handleOwnerChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newOwners = [...prev.owners];
      newOwners[index][field] = value;
      return { ...prev, owners: newOwners };
    });
  }, []);

  const calculateYearsInBusiness = useCallback(() => {
    if (formData.year_founded) {
      const currentYear = new Date().getFullYear();
      const years = currentYear - parseInt(formData.year_founded);
      return years >= 0 ? years : 0;
    }
    return 0;
  }, [formData.year_founded]);

  const addOwner = useCallback(() => {
    setFormData(prev => ({ ...prev, owners: [...prev.owners, { name: '', ownership_percentage: '', email: '', phone: '' }] }));
  }, []);

  const removeOwner = useCallback((index) => {
    setFormData(prev => {
      const newOwners = prev.owners.filter((_, i) => i !== index);
      return { ...prev, owners: newOwners };
    });
  }, []);

  const addCustomMotivation = useCallback(() => {
    setFormData(prev => ({ ...prev, key_motivations_other: [...prev.key_motivations_other, ''] }));
  }, []);

  const updateCustomMotivation = useCallback((index, value) => {
    setFormData(prev => {
      const newCustomMotivations = [...prev.key_motivations_other];
      newCustomMotivations[index] = value;
      return { ...prev, key_motivations_other: newCustomMotivations };
    });
  }, []);

  const removeCustomMotivation = useCallback((index) => {
    setFormData(prev => {
      const newCustomMotivations = prev.key_motivations_other.filter((_, i) => i !== index);
      return { ...prev, key_motivations_other: newCustomMotivations };
    });
  }, []);

  const addCustomDealBreaker = useCallback(() => {
    setFormData(prev => ({ ...prev, deal_breakers_other: [...prev.deal_breakers_other, ''] }));
  }, []);

  const updateCustomDealBreaker = useCallback((index, value) => {
    setFormData(prev => {
      const newCustomDealBreakers = [...prev.deal_breakers_other];
      newCustomDealBreakers[index] = value;
      return { ...prev, deal_breakers_other: newCustomDealBreakers };
    });
  }, []);

  const removeCustomDealBreaker = useCallback((index) => {
    setFormData(prev => {
      const newCustomDealBreakers = prev.deal_breakers_other.filter((_, i) => i !== index);
      return { ...prev, deal_breakers_other: newCustomDealBreakers };
    });
  }, []);

  const handleNumDependentsChange = useCallback((e) => {
    const num = parseInt(e.target.value) || 0;
    setFormData(prev => {
      const currentDependents = prev.dependents_info || [];
      let newDependents = [...currentDependents];
      while (newDependents.length < num) {
        newDependents.push({ name: '', relationship: '', date_of_birth: '', sex: '' });
      }
      if (newDependents.length > num) {
        newDependents = newDependents.slice(0, num);
      }
      return { ...prev, num_dependents: num, dependents_info: newDependents };
    });
  }, []);

  const handleDependentChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newDependents = [...prev.dependents_info];
      newDependents[index][field] = value;
      return { ...prev, dependents_info: newDependents };
    });
  }, []);

  const calculateAge = useCallback((dateOfBirth) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : '';
  }, []);

  const addCustomAdvisor = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      custom_advisors: [...prev.custom_advisors, { title: '', name: '', email: '', phone: '' }]
    }));
  }, []);

  const updateCustomAdvisor = useCallback((index, field, value) => {
    setFormData(prev => {
      const newAdvisors = [...prev.custom_advisors];
      newAdvisors[index][field] = value;
      return { ...prev, custom_advisors: newAdvisors };
    });
  }, []);

  const removeCustomAdvisor = useCallback((index) => {
    setFormData(prev => {
      const newAdvisors = prev.custom_advisors.filter((_, i) => i !== index);
      return { ...prev, custom_advisors: newAdvisors };
    });
  }, []);

  const handleSectionSave = useCallback(async (sectionName) => {
    setSavingSection(sectionName);
    setSavedSection(null);

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
        setSavedSection(sectionName);
        updateUser({ business_name: formData.business_name, industry: formData.industry });
        setTimeout(() => setSavedSection(null), 3000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      console.error('Error response:', error.response?.data);
      console.error('Form data being sent:', formData);
    } finally {
      setSavingSection(null);
    }
  }, [formData, updateUser]);

  const handleSaveAll = useCallback(async () => {
    setSavingAll(true);
    setSavedAll(false);

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
        setSavedAll(true);
        updateUser({ business_name: formData.business_name, industry: formData.industry });
        setTimeout(() => setSavedAll(false), 3000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      console.error('Error response:', error.response?.data);
      console.error('Form data being sent:', formData);
    } finally {
      setSavingAll(false);
    }
  }, [formData, updateUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <User className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Client Profile
                </h1>
                <p className="text-gray-600 text-lg">Comprehensive client and business information</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={expandAllSections}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium"
              >
                <ChevronDown size={18} className="rotate-180" />
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAllSections}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                <ChevronDown size={18} />
                Collapse All
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Client Personal Information"
            icon={<User className="text-white" size={24} />}
            gradient="from-blue-600 to-indigo-600"
            onSave={() => handleSectionSave('client')}
            isSaving={savingSection === 'client'}
            saveSuccess={savedSection === 'client'}
            isExpanded={expandedSections.client}
            onToggle={() => toggleSection('client')}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="First Name" name="client_first_name" value={formData.client_first_name} onChange={handleChange} placeholder="Client's first name" />
                <InputField label="Last Name" name="client_last_name" value={formData.client_last_name} onChange={handleChange} placeholder="Client's last name" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <InputField label="Email" name="client_email" type="email" value={formData.client_email} onChange={handleChange} placeholder="client@email.com" />
                <InputField label="Phone" name="client_phone" type="tel" value={formData.client_phone} onChange={handleChange} placeholder="(555) 123-4567" />
                <InputField label="Date of Birth" name="client_date_of_birth" type="date" value={formData.client_date_of_birth} onChange={handleChange} min="1900-01-01" max={TODAY} />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sex</label>
                  <select name="client_sex" value={formData.client_sex} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <InputField label="Address" name="client_address" value={formData.client_address} onChange={handleChange} placeholder="Street address" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField label="City" name="client_city" value={formData.client_city} onChange={handleChange} placeholder="City" />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                  <select name="client_state" value={formData.client_state} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400">
                    <option value="">Select state</option>
                    {US_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                </div>
                <InputField label="ZIP Code" name="client_zip" value={formData.client_zip} onChange={handleChange} placeholder="ZIP" />
              </div>
              <NotesField
                sectionName="client_notes"
                value={formData.client_notes}
                onChange={handleChange}
                isExpanded={expandedNotes.client}
                onToggle={() => toggleNotes('client')}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Spouse/Partner Information"
            icon={<Heart className="text-white" size={24} />}
            gradient="from-pink-600 to-rose-600"
            onSave={() => handleSectionSave('spouse')}
            isSaving={savingSection === 'spouse'}
            saveSuccess={savedSection === 'spouse'}
            isExpanded={expandedSections.spouse}
            onToggle={() => toggleSection('spouse')}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <InputField label="Spouse/Partner Name" name="spouse_name" value={formData.spouse_name} onChange={handleChange} placeholder="Full name" />
                <InputField label="Email" name="spouse_email" type="email" value={formData.spouse_email} onChange={handleChange} placeholder="spouse@email.com" />
                <InputField label="Phone" name="spouse_phone" type="tel" value={formData.spouse_phone} onChange={handleChange} placeholder="(555) 123-4567" />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sex</label>
                  <select name="spouse_sex" value={formData.spouse_sex} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 hover:border-gray-400">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center cursor-pointer group">
                <input type="checkbox" name="spouse_involved_in_business" checked={formData.spouse_involved_in_business} onChange={handleChange} className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer" />
                <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-pink-600 transition-colors">
                  Spouse/Partner is involved in the business
                </span>
              </label>
              <NotesField
                sectionName="spouse_notes"
                value={formData.spouse_notes}
                onChange={handleChange}
                isExpanded={expandedNotes.spouse}
                onToggle={() => toggleNotes('spouse')}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Family & Dependents"
            icon={<Users className="text-white" size={24} />}
            gradient="from-purple-600 to-violet-600"
            onSave={() => handleSectionSave('dependents')}
            isSaving={savingSection === 'dependents'}
            saveSuccess={savedSection === 'dependents'}
            isExpanded={expandedSections.dependents}
            onToggle={() => toggleSection('dependents')}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <InputField label="Number of Dependents" name="num_dependents" type="number" value={formData.num_dependents} onChange={handleNumDependentsChange} placeholder="0" />
              </div>
              {formData.dependents_info.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-md font-semibold text-gray-800 mb-4">Dependent Information</h3>
                  {formData.dependents_info.map((dependent, index) => (
                    <div key={index} className="p-5 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-purple-900">Dependent {index + 1}</h4>
                        {dependent.date_of_birth && (
                          <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-semibold">
                            Age: {calculateAge(dependent.date_of_birth)}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={dependent.name}
                            onChange={(e) => handleDependentChange(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Relationship</label>
                          <select
                            value={dependent.relationship}
                            onChange={(e) => handleDependentChange(index, 'relationship', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select...</option>
                            <option value="Child">Child</option>
                            <option value="Stepchild">Stepchild</option>
                            <option value="Parent">Parent</option>
                            <option value="Grandparent">Grandparent</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
                          <input
                            type="date"
                            value={dependent.date_of_birth}
                            onChange={(e) => handleDependentChange(index, 'date_of_birth', e.target.value)}
                            min="1900-01-01"
                            max={TODAY}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Sex</label>
                          <select
                            value={dependent.sex}
                            onChange={(e) => handleDependentChange(index, 'sex', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <NotesField
                sectionName="dependents_notes"
                value={formData.dependents_notes}
                onChange={handleChange}
                isExpanded={expandedNotes.dependents}
                onToggle={() => toggleNotes('dependents')}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Business Information"
            icon={<Building2 className="text-white" size={24} />}
            gradient="from-green-600 to-emerald-600"
            onSave={() => handleSectionSave('business')}
            isSaving={savingSection === 'business'}
            saveSuccess={savedSection === 'business'}
            isExpanded={expandedSections.business}
            onToggle={() => toggleSection('business')}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Business Name" name="business_name" value={formData.business_name} onChange={handleChange} placeholder="Enter business name" />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
                  <select name="industry" value={formData.industry} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500">
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Number of Employees" name="employees" type="number" value={formData.employees} onChange={handleChange} placeholder="e.g., 25" />
                <div>
                  <InputField label="Year Founded" name="year_founded" type="number" value={formData.year_founded} onChange={handleChange} placeholder="e.g., 2015" />
                  {formData.year_founded && (
                    <p className="text-xs text-gray-500 mt-1">Years in business: {calculateYearsInBusiness()}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Primary State/Location</label>
                  <select name="primary_location" value={formData.primary_location} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500">
                    <option value="">Select state/territory</option>
                    {US_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Geographical Market</label>
                  <select name="primary_market" value={formData.primary_market} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500">
                    <option value="">Select market</option>
                    {MARKETS.map(market => <option key={market} value={market}>{market}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Registration Type</label>
                  <select name="registration_type" value={formData.registration_type} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500">
                    <option value="">Select type</option>
                    {REGISTRATION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              </div>
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-semibold text-gray-700">Business Owners</label>
                  <button type="button" onClick={addOwner} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm font-medium">
                    <Plus size={16} />Add Owner
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.owners.map((owner, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-green-900">Owner {index + 1}</h4>
                        {formData.owners.length > 1 && (
                          <button type="button" onClick={() => removeOwner(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Owner Name</label>
                          <input
                            type="text"
                            value={owner.name}
                            onChange={(e) => handleOwnerChange(index, 'name', e.target.value)}
                            placeholder="Full name"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Ownership %</label>
                          <input
                            type="number"
                            value={owner.ownership_percentage}
                            onChange={(e) => handleOwnerChange(index, 'ownership_percentage', e.target.value)}
                            placeholder="% owned"
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={owner.email}
                            onChange={(e) => handleOwnerChange(index, 'email', e.target.value)}
                            placeholder="owner@email.com"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={owner.phone}
                            onChange={(e) => handleOwnerChange(index, 'phone', e.target.value)}
                            placeholder="(555) 123-4567"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {(() => {
                  const totalOwnership = formData.owners.reduce((sum, owner) => sum + (parseFloat(owner.ownership_percentage) || 0), 0);
                  const isExactly100 = Math.abs(totalOwnership - 100) < 0.01;
                  return (
                    <p className={`text-sm font-semibold mt-2 ${isExactly100 ? 'text-green-600' : 'text-red-600'}`}>
                      Total ownership: {totalOwnership.toFixed(2)}%
                    </p>
                  );
                })()}
              </div>
              <NotesField
                sectionName="business_notes"
                value={formData.business_notes}
                onChange={handleChange}
                isExpanded={expandedNotes.business}
                onToggle={() => toggleNotes('business')}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Exit Planning"
            icon={<Target className="text-white" size={24} />}
            gradient="from-orange-600 to-red-600"
            onSave={() => handleSectionSave('exit')}
            isSaving={savingSection === 'exit'}
            saveSuccess={savedSection === 'exit'}
            isExpanded={expandedSections.exit}
            onToggle={() => toggleSection('exit')}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Exit Horizon</label>
                  <select name="exit_horizon" value={formData.exit_horizon} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500">
                    <option value="">Select timeline</option>
                    <option value="0-2 years">0-2 years</option>
                    <option value="2-5 years">2-5 years</option>
                    <option value="5-10 years">5-10 years</option>
                    <option value="10+ years">10+ years</option>
                    <option value="Exploring options">Exploring options</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Exit Type</label>
                  <div className="flex gap-2">
                    <select name="preferred_exit_type" value={formData.preferred_exit_type} onChange={handleChange} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500">
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
                    <button type="button" onClick={() => navigate('/exit-strategy-quiz')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium whitespace-nowrap">
                      <ClipboardList size={18} />Take Quiz
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Key Motivations (Select all that apply)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  {['Maximize valuation', 'Retire/lifestyle change', 'Preserve legacy', 'Reward employees', 'Reduce risk', 'Capitalize on market timing'].map(motivation => (
                    <label key={motivation} className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={(formData.key_motivations || []).includes(motivation)} onChange={() => handleMultiSelectChange('key_motivations', motivation)} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                      <span>{motivation}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-600">Other Motivations</label>
                    <button type="button" onClick={addCustomMotivation} className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-50 text-orange-600 rounded hover:bg-orange-100 transition">
                      <Plus size={14} />Add Custom
                    </button>
                  </div>
                  {formData.key_motivations_other.map((customMotivation, index) => (
                    <div key={index} className="flex gap-2">
                      <input type="text" value={customMotivation} onChange={(e) => updateCustomMotivation(index, e.target.value)} placeholder="Enter custom motivation" className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                      <button type="button" onClick={() => removeCustomMotivation(index)} className="p-2 text-red-600 hover:bg-red-50 rounded transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Deal Breakers (Select all that apply)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  {['Layoffs', 'Location closure', 'Culture change', 'Equity rollover required', 'Long earn-out', 'Non-compete'].map(breaker => (
                    <label key={breaker} className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={(formData.deal_breakers || []).includes(breaker)} onChange={() => handleMultiSelectChange('deal_breakers', breaker)} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                      <span>{breaker}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-600">Other Deal Breakers</label>
                    <button type="button" onClick={addCustomDealBreaker} className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-50 text-orange-600 rounded hover:bg-orange-100 transition">
                      <Plus size={14} />Add Custom
                    </button>
                  </div>
                  {formData.deal_breakers_other.map((customBreaker, index) => (
                    <div key={index} className="flex gap-2">
                      <input type="text" value={customBreaker} onChange={(e) => updateCustomDealBreaker(index, e.target.value)} placeholder="Enter custom deal breaker" className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                      <button type="button" onClick={() => removeCustomDealBreaker(index)} className="p-2 text-red-600 hover:bg-red-50 rounded transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <NotesField
                sectionName="exit_notes"
                value={formData.exit_notes}
                onChange={handleChange}
                isExpanded={expandedNotes.exit}
                onToggle={() => toggleNotes('exit')}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Advisory Team"
            icon={<Briefcase className="text-white" size={24} />}
            gradient="from-teal-600 to-cyan-600"
            onSave={() => handleSectionSave('advisory')}
            isSaving={savingSection === 'advisory'}
            saveSuccess={savedSection === 'advisory'}
            isExpanded={expandedSections.advisory}
            onToggle={() => toggleSection('advisory')}
          >
            <p className="text-sm text-gray-600 mb-4">Select advisors on your team and provide their contact information</p>
            <div className="space-y-6">
              {[
                { key: 'attorney', label: 'Business Attorney' },
                { key: 'accountant', label: 'CPA / Accountant' },
                { key: 'financial_advisor', label: 'Financial Advisor / Wealth Manager' },
                { key: 'exit_advisor', label: 'Exit / M&A Advisor' },
                { key: 'insurance_agent', label: 'Insurance Agent / Risk Advisor' },
                { key: 'banker', label: 'Banker / Lender' },
                { key: 'estate_planner', label: 'Estate Planner / Tax Attorney' },
                { key: 'business_coach', label: 'Business Coach / Consultant' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="flex items-center cursor-pointer group mb-2">
                    <input type="checkbox" name={`has_${key}`} checked={formData[`has_${key}`]} onChange={handleChange} className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer" />
                    <span className="ml-3 text-sm font-semibold text-gray-700 group-hover:text-teal-600 transition-colors">{label}</span>
                  </label>
                  {formData[`has_${key}`] && (
                    <div className="ml-6 grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 p-4 bg-teal-50 rounded-lg border border-teal-200">
                      <input type="text" name={`${key}_name`} value={formData[`${key}_name`]} onChange={handleChange} placeholder="Name" className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                      <input type="email" name={`${key}_email`} value={formData[`${key}_email`]} onChange={handleChange} placeholder="Email" className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                      <input type="tel" name={`${key}_phone`} value={formData[`${key}_phone`]} onChange={handleChange} placeholder="Phone" className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                    </div>
                  )}
                </div>
              ))}

              {/* Custom Advisors */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold text-gray-800">Custom Advisors</h3>
                  <button type="button" onClick={addCustomAdvisor} className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition text-sm font-medium">
                    <Plus size={16} />Add Custom Advisor
                  </button>
                </div>
                {formData.custom_advisors.length > 0 && (
                  <div className="space-y-4">
                    {formData.custom_advisors.map((advisor, index) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-teal-900">Custom Advisor {index + 1}</h4>
                          <button type="button" onClick={() => removeCustomAdvisor(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <input type="text" value={advisor.title} onChange={(e) => updateCustomAdvisor(index, 'title', e.target.value)} placeholder="Title/Role" className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                          <input type="text" value={advisor.name} onChange={(e) => updateCustomAdvisor(index, 'name', e.target.value)} placeholder="Name" className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                          <input type="email" value={advisor.email} onChange={(e) => updateCustomAdvisor(index, 'email', e.target.value)} placeholder="Email" className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                          <input type="tel" value={advisor.phone} onChange={(e) => updateCustomAdvisor(index, 'phone', e.target.value)} placeholder="Phone" className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <NotesField
                sectionName="advisory_notes"
                value={formData.advisory_notes}
                onChange={handleChange}
                isExpanded={expandedNotes.advisory}
                onToggle={() => toggleNotes('advisory')}
              />
            </div>
          </SectionCard>

          <div className="flex justify-center pt-8 pb-4">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={savingAll}
              className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              <Save size={24} className="group-hover:rotate-12 transition-transform duration-300" />
              {savingAll ? 'Saving All Sections...' : 'Save All'}
            </button>
          </div>

          {savedAll && (
            <div className="flex justify-center pb-4">
              <div className="px-6 py-3 bg-green-50 border-2 border-green-500 rounded-xl shadow-md animate-fade-in">
                <p className="text-sm font-semibold text-green-800">✓ All sections saved successfully!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessProfile;
