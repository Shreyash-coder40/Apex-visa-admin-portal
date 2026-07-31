import React, { useState, useEffect } from 'react';
import { Globe, Plus, Search, Filter, ShieldCheck, Clock, DollarSign, FileText, CheckCircle2, AlertCircle, Edit2, Trash2, Check, X, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const INITIAL_VISA_TYPES = [
  // United States
  { id: 'us-f1', country: 'United States', country_code: 'USA', code: 'F-1', title: 'F-1 Academic Student Visa', category: 'Higher Education', processing_time: '3 - 5 Weeks', fee: 510, currency: 'USD', max_duration: '5 Years', status: 'Active', requirements: ['Form I-20', 'SEVIS I-901 Fee Receipt', 'Proof of Financial Support', 'DS-160 Confirmation'], description: 'Full-time academic degree program at an accredited US university or college.' },
  { id: 'us-j1', country: 'United States', country_code: 'USA', code: 'J-1', title: 'J-1 Exchange Visitor Visa', category: 'Exchange & Research', processing_time: '2 - 4 Weeks', fee: 380, currency: 'USD', max_duration: '1 - 3 Years', status: 'Active', requirements: ['Form DS-2019', 'Designated Sponsor Approval', 'SEVIS Receipt'], description: 'Exchange visitors participating in approved study, research, or cultural exchange programs.' },
  { id: 'us-m1', country: 'United States', country_code: 'USA', code: 'M-1', title: 'M-1 Vocational Student Visa', category: 'Vocational', processing_time: '3 - 4 Weeks', fee: 510, currency: 'USD', max_duration: '1 Year', status: 'Active', requirements: ['Form I-20 M-N', 'SEVIS Receipt', 'Financial Proof'], description: 'Non-academic or vocational studies at technical or trade institutions.' },
  { id: 'us-h1b', country: 'United States', country_code: 'USA', code: 'H-1B', title: 'H-1B Specialty Occupation', category: 'Post-Study Work', processing_time: '2 - 3 Months', fee: 460, currency: 'USD', max_duration: '3 Years (Extendable)', status: 'Active', requirements: ['Employer Petition', 'LCA Approval', 'Bachelor Degree Minimum'], description: 'Work authorization for specialty occupations following OPT completion.' },
  { id: 'us-b1b2', country: 'United States', country_code: 'USA', code: 'B-1/B-2', title: 'B-1/B-2 Visitor Visa', category: 'Short Term', processing_time: '2 - 6 Weeks', fee: 185, currency: 'USD', max_duration: '6 Months', status: 'Active', requirements: ['DS-160 Form', 'Travel Itinerary', 'Return Ticket'], description: 'Short-term visits for university interviews, exams, or prospective student tours.' },

  // United Kingdom
  { id: 'uk-tier4', country: 'United Kingdom', country_code: 'UK', code: 'Student Visa', title: 'UK Student Visa (Tier 4)', category: 'Higher Education', processing_time: '3 Weeks', fee: 490, currency: 'GBP', max_duration: 'Course Duration + 4 Months', status: 'Active', requirements: ['CAS (Confirmation of Acceptance)', 'Financial Evidence', 'TB Test Certificate', 'IELTS Academic/PTE'], description: 'Points-based student visa for full-time higher education degrees in the UK.' },
  { id: 'uk-psw', country: 'United Kingdom', country_code: 'UK', code: 'Graduate Route', title: 'Post-Study Graduate Work Route', category: 'Post-Study Work', processing_time: '8 Weeks', fee: 822, currency: 'GBP', max_duration: '2 Years (3 Yrs for PhD)', status: 'Active', requirements: ['Degree Completion Certificate', 'Valid Student Visa', 'IHS Surcharge'], description: 'Work permission for international students upon completing a UK degree.' },
  { id: 'uk-child', country: 'United Kingdom', country_code: 'UK', code: 'Child Student', title: 'Child Student Visa', category: 'Schooling', processing_time: '3 Weeks', fee: 490, currency: 'GBP', max_duration: 'Up to 6 Years', status: 'Active', requirements: ['Parental Consent', 'CAS Document', 'Care Arrangements'], description: 'For children aged 4-17 studying at independent UK boarding schools.' },
  { id: 'uk-short', country: 'United Kingdom', country_code: 'UK', code: 'Short Study', title: 'Short-term Study Visa', category: 'Short Term', processing_time: '3 Weeks', fee: 200, currency: 'GBP', max_duration: '11 Months', status: 'Active', requirements: ['Course Acceptance Letter', 'Proof of Accommodation', 'Sufficient Funds'], description: 'For English language courses lasting between 6 and 11 months.' },

  // Canada
  { id: 'ca-study', country: 'Canada', country_code: 'CAN', code: 'Study Permit', title: 'Canadian Study Permit', category: 'Higher Education', processing_time: '4 - 8 Weeks', fee: 150, currency: 'CAD', max_duration: 'Course Duration + 90 Days', status: 'Active', requirements: ['Letter of Acceptance (LOA)', 'PAL (Provincial Attestation)', 'GIC ($20,635 CAD)', 'Medical Exam'], description: 'Official permit required to study at Designated Learning Institutions (DLIs) in Canada.' },
  { id: 'ca-pgwp', country: 'Canada', country_code: 'CAN', code: 'PGWP', title: 'Post-Graduation Work Permit', category: 'Post-Study Work', processing_time: '8 - 12 Weeks', fee: 255, currency: 'CAD', max_duration: 'Up to 3 Years', status: 'Active', requirements: ['Final Transcript', 'Official Completion Letter', 'Eligible DLI Program'], description: 'Open work permit allowing Canadian graduates to work for any employer.' },
  { id: 'ca-coop', country: 'Canada', country_code: 'CAN', code: 'Co-op Work', title: 'Co-op Work Permit', category: 'Vocational', processing_time: '4 - 8 Weeks', fee: 0, currency: 'CAD', max_duration: 'Duration of Co-op', status: 'Active', requirements: ['DLI Co-op Support Letter', 'Valid Study Permit'], description: 'Permit required when work placement or internship is an integral part of the curriculum.' },

  // Australia
  { id: 'au-500', country: 'Australia', country_code: 'AUS', code: 'Subclass 500', title: 'Student Visa (Subclass 500)', category: 'Higher Education', processing_time: '4 - 6 Weeks', fee: 710, currency: 'AUD', max_duration: 'Up to 5 Years', status: 'Active', requirements: ['CoE (Confirmation of Enrolment)', 'OSHC Health Insurance', 'GTE/GS Statement', 'English Test Score'], description: 'Primary visa for international students enrolled in registered CRICOS courses in Australia.' },
  { id: 'au-485', country: 'Australia', country_code: 'AUS', code: 'Subclass 485', title: 'Temporary Graduate Visa (Subclass 485)', category: 'Post-Study Work', processing_time: '6 - 12 Weeks', fee: 1895, currency: 'AUD', max_duration: '2 - 4 Years', status: 'Active', requirements: ['CRICOS Degree Award', 'AFCC Police Check', 'IELTS 6.5 / PTE 58'], description: 'Post-study work visa for recent graduates from Australian institutions.' },
  { id: 'au-590', country: 'Australia', country_code: 'AUS', code: 'Subclass 590', title: 'Student Guardian Visa (Subclass 590)', category: 'Guardian', processing_time: '4 - 6 Weeks', fee: 710, currency: 'AUD', max_duration: 'Duration of Student Visa', status: 'Active', requirements: ['Proof of Relationship', 'Sufficient Funds', 'OSHC Cover'], description: 'Allows a parent or legal guardian to live in Australia to support a student under 18.' },

  // Germany
  { id: 'de-typed', country: 'Germany', country_code: 'DEU', code: 'Type D National', title: 'National Visa for Study (Type D)', category: 'Higher Education', processing_time: '6 - 12 Weeks', fee: 75, currency: 'EUR', max_duration: '1 - 2 Years (Renewable)', status: 'Active', requirements: ['University Admission Letter', 'Blocked Account (€11,208/yr)', 'Health Insurance', 'APS Certificate (if applicable)'], description: 'Long-stay visa for international students pursuing a full degree at German universities.' },
  { id: 'de-applicant', country: 'Germany', country_code: 'DEU', code: 'Student Applicant', title: 'Student Applicant Visa', category: 'Higher Education', processing_time: '6 - 10 Weeks', fee: 75, currency: 'EUR', max_duration: '9 Months', status: 'Active', requirements: ['High School Diploma', 'German B2 / English Score', 'Blocked Account'], description: 'For prospective students seeking university admission or taking entrance examinations.' },
  { id: 'de-bluecard', country: 'Germany', country_code: 'DEU', code: 'EU Blue Card', title: 'EU Blue Card Germany', category: 'Post-Study Work', processing_time: '4 - 8 Weeks', fee: 100, currency: 'EUR', max_duration: '4 Years', status: 'Active', requirements: ['German University Degree', 'Binding Employment Offer (€45k+ salary)'], description: 'Work and residence permit for university graduates with qualifying job offers in Germany.' },

  // New Zealand
  { id: 'nz-fee', country: 'New Zealand', country_code: 'NZL', code: 'Fee Paying Student', title: 'Fee Paying Student Visa', category: 'Higher Education', processing_time: '4 - 6 Weeks', fee: 375, currency: 'NZD', max_duration: 'Up to 4 Years', status: 'Active', requirements: ['Offer of Place', 'Funds (NZD $20,000/yr)', 'Tuition Receipt', 'Medical Check'], description: 'Full-time study visa for international students at New Zealand educational institutions.' },
  { id: 'nz-psw', country: 'New Zealand', country_code: 'NZL', code: 'Post-Study Work', title: 'Post-Study Work Visa NZ', category: 'Post-Study Work', processing_time: '4 - 8 Weeks', fee: 700, currency: 'NZD', max_duration: '1 - 3 Years', status: 'Active', requirements: ['Eligible NZ Degree', 'Visa Application Fee'], description: 'Open work visa allowing graduates to work for any employer in New Zealand.' },

  // Ireland
  { id: 'ie-stamp2', country: 'Ireland', country_code: 'IRL', code: 'Stamp 2', title: 'Stamp 2 Student Visa', category: 'Higher Education', processing_time: '4 - 8 Weeks', fee: 300, currency: 'EUR', max_duration: 'Course Duration (Max 7 Yrs)', status: 'Active', requirements: ['College Acceptance Letter', 'Proof of Funds (€10,000)', 'Private Medical Insurance'], description: 'Full-time higher education visa allowing 20 hrs/week part-time work during terms.' },
  { id: 'ie-stamp1g', country: 'Ireland', country_code: 'IRL', code: 'Stamp 1G', title: 'Third Level Graduate Scheme (Stamp 1G)', category: 'Post-Study Work', processing_time: '2 - 4 Weeks', fee: 300, currency: 'EUR', max_duration: '1 - 2 Years', status: 'Active', requirements: ['Irish Degree Award Certificate', 'IRP Card'], description: 'Post-study work authorization for graduates of recognized Irish higher education institutions.' }
];

const DESTINATION_COUNTRIES = [
  { name: 'United States', code: 'USA', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'UK', flag: '🇬🇧' },
  { name: 'Canada', code: 'CAN', flag: '🇨🇦' },
  { name: 'Australia', code: 'AUS', flag: '🇦🇺' },
  { name: 'Germany', code: 'DEU', flag: '🇩🇪' },
  { name: 'New Zealand', code: 'NZL', flag: '🇳🇿' },
  { name: 'Ireland', code: 'IRL', flag: '🇮🇪' }
];

export default function VisaTypesManager({ currentRole, currentBranch, showToast }) {
  const isSuperAdmin = currentRole === 'super_admin';
  const [selectedCountry, setSelectedCountry] = useState('United States');
  const [visaTypes, setVisaTypes] = useState(INITIAL_VISA_TYPES);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingVisa, setEditingVisa] = useState(null);
  const [formData, setFormData] = useState({
    country: 'United States',
    code: '',
    title: '',
    category: 'Higher Education',
    processing_time: '',
    fee: '',
    currency: 'USD',
    max_duration: '',
    status: 'Active',
    requirements: '',
    description: ''
  });

  useEffect(() => {
    fetchVisaTypes();
  }, []);

  const fetchVisaTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('visa_types').select('*').order('title');
      if (!error && data && data.length > 0) {
        setVisaTypes(data);
      }
    } catch (err) {
      console.log('Using localized database state for visa types:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingVisa(null);
    setFormData({
      country: selectedCountry,
      code: '',
      title: '',
      category: 'Higher Education',
      processing_time: '3 - 4 Weeks',
      fee: 300,
      currency: selectedCountry === 'United Kingdom' ? 'GBP' : selectedCountry === 'Canada' ? 'CAD' : selectedCountry === 'Australia' ? 'AUD' : selectedCountry === 'Germany' || selectedCountry === 'Ireland' ? 'EUR' : selectedCountry === 'New Zealand' ? 'NZD' : 'USD',
      max_duration: '1 - 4 Years',
      status: 'Active',
      requirements: 'Valid Passport, Letter of Acceptance, Financial Proof',
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (visa) => {
    setEditingVisa(visa);
    setFormData({
      country: visa.country,
      code: visa.code,
      title: visa.title,
      category: visa.category,
      processing_time: visa.processing_time,
      fee: visa.fee,
      currency: visa.currency,
      max_duration: visa.max_duration,
      status: visa.status,
      requirements: Array.isArray(visa.requirements) ? visa.requirements.join(', ') : visa.requirements || '',
      description: visa.description || ''
    });
    setShowModal(true);
  };

  const handleSaveVisaType = async (e) => {
    e.preventDefault();
    const reqArray = typeof formData.requirements === 'string' 
      ? formData.requirements.split(',').map(r => r.trim()).filter(Boolean)
      : formData.requirements;

    const payload = {
      country: formData.country,
      country_code: DESTINATION_COUNTRIES.find(c => c.name === formData.country)?.code || 'USA',
      code: formData.code,
      title: formData.title,
      category: formData.category,
      processing_time: formData.processing_time,
      fee: Number(formData.fee),
      currency: formData.currency,
      max_duration: formData.max_duration,
      status: formData.status,
      requirements: reqArray,
      description: formData.description
    };

    try {
      if (editingVisa) {
        await supabase.from('visa_types').update(payload).eq('id', editingVisa.id);
        setVisaTypes(prev => prev.map(v => v.id === editingVisa.id ? { ...v, ...payload } : v));
        if (showToast) showToast(`Visa type "${payload.title}" updated successfully.`);
      } else {
        const newId = `visa-${Date.now()}`;
        const newObj = { id: newId, ...payload };
        await supabase.from('visa_types').insert([newObj]);
        setVisaTypes(prev => [newObj, ...prev]);
        if (showToast) showToast(`New visa classification "${payload.title}" added.`);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Error saving visa type:', err);
      if (showToast) showToast('Saved to local state.', 'info');
      setShowModal(false);
    }
  };

  const handleToggleStatus = (visaId) => {
    setVisaTypes(prev => prev.map(v => {
      if (v.id === visaId) {
        const newStatus = v.status === 'Active' ? 'Inactive' : 'Active';
        if (showToast) showToast(`Visa ${v.code} marked as ${newStatus}.`);
        return { ...v, status: newStatus };
      }
      return v;
    }));
  };

  const handleDeleteVisa = (visaId) => {
    if (window.confirm('Are you sure you want to remove this visa classification?')) {
      setVisaTypes(prev => prev.filter(v => v.id !== visaId));
      if (showToast) showToast('Visa classification removed.');
    }
  };

  // Country-specific Filtering
  const countryVisas = visaTypes.filter(v => v.country === selectedCountry);

  const filteredVisas = countryVisas.filter(v => {
    const term = searchQuery.trim().toLowerCase();
    const reqStr = Array.isArray(v.requirements) ? v.requirements.join(' ') : v.requirements || '';
    
    const matchesSearch = !term || 
      v.title.toLowerCase().includes(term) || 
      v.code.toLowerCase().includes(term) || 
      reqStr.toLowerCase().includes(term) || 
      (v.description || '').toLowerCase().includes(term);

    const matchesCategory = categoryFilter === 'All' || v.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categoriesList = ['All', ...new Set(countryVisas.map(v => v.category))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Header & Country Selection Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--admin-text-primary)' }}>
            Visa Classifications
          </h1>
          <p style={{ color: 'var(--admin-text-secondary)', margin: 0, fontSize: '0.85rem' }}>
            Country-specific visa options, fees, timelines, and compliance rules.
          </p>
        </div>
        
        {isSuperAdmin && (
          <button 
            onClick={handleOpenAddModal}
            className="admin-btn admin-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px', fontWeight: '600' }}
          >
            <Plus size={16} /> Add Visa Type
          </button>
        )}
      </div>

      {/* Sleek Country Selector Bar (Crisp Professional Buttons) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {DESTINATION_COUNTRIES.map(c => {
          const count = visaTypes.filter(v => v.country === c.name && v.status === 'Active').length;
          const isSelected = selectedCountry === c.name;
          return (
            <button
              key={c.code}
              onClick={() => {
                setSelectedCountry(c.name);
                setSearchQuery('');
                setCategoryFilter('All');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: '6px',
                border: isSelected ? '1px solid var(--admin-primary)' : '1px solid var(--admin-border-light)',
                background: isSelected ? 'var(--admin-primary)' : '#ffffff',
                color: isSelected ? '#ffffff' : 'var(--admin-text-primary)',
                fontWeight: isSelected ? '700' : '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 1px 3px rgba(245, 158, 11, 0.2)' : 'none',
                transition: 'all 0.15s ease-in-out'
              }}
            >
              <span style={{ fontSize: '1rem' }}>{c.flag}</span>
              <span>{c.code}</span>
              <span style={{ 
                background: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9', 
                color: isSelected ? '#ffffff' : '#475569', 
                fontSize: '0.7rem', 
                padding: '1px 6px', 
                borderRadius: '4px',
                fontWeight: '700' 
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Category Filters Toolbar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--admin-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={`Search ${selectedCountry} visas by code, title...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: '38px', width: '100%', background: '#ffffff', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--admin-text-muted)" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="admin-input"
            style={{ background: '#ffffff', fontSize: '0.85rem' }}
          >
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-input"
            style={{ background: '#ffffff', fontSize: '0.85rem' }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Uncluttered Visa Cards Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={40} className="animate-spin" color="var(--admin-primary)" />
        </div>
      ) : filteredVisas.length === 0 ? (
        <div className="admin-card" style={{ padding: '48px', textAlign: 'center', background: '#ffffff', borderRadius: '8px' }}>
          <AlertCircle size={36} color="var(--admin-text-muted)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--admin-text-primary)', margin: '0 0 4px 0' }}>
            No visa options found
          </h2>
          <p style={{ color: 'var(--admin-text-secondary)', margin: 0, fontSize: '0.85rem' }}>
            No visa options match your search criteria for {selectedCountry}.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredVisas.map(visa => (
            <div 
              key={visa.id}
              className="admin-card"
              style={{ 
                background: '#ffffff', 
                borderRadius: '8px', 
                border: '1px solid var(--admin-border-light)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                opacity: visa.status === 'Active' ? 1 : 0.65,
                transition: 'box-shadow 0.2s'
              }}
            >
              <div>
                {/* Header Badge & Code */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ 
                    background: 'var(--admin-primary-light)', 
                    color: 'var(--admin-primary-hover)', 
                    fontWeight: '800', 
                    fontSize: '0.8rem', 
                    padding: '3px 8px', 
                    borderRadius: '4px'
                  }}>
                    {visa.code}
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: '700', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      background: visa.status === 'Active' ? 'var(--admin-success-bg)' : '#f1f5f9',
                      color: visa.status === 'Active' ? 'var(--admin-success-text)' : 'var(--admin-text-muted)'
                    }}>
                      {visa.status}
                    </span>
                    
                    {isSuperAdmin && (
                      <button 
                        onClick={() => handleOpenEditModal(visa)}
                        title="Edit Visa Specification"
                        style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', padding: '2px' }}
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Category */}
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--admin-text-primary)', margin: '0 0 4px 0', lineHeight: 1.3 }}>
                  {visa.title}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '14px', fontWeight: '500' }}>
                  {visa.category}
                </div>

                {/* Specifications Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px 12px', background: 'var(--admin-bg-body)', borderRadius: '8px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Processing</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--admin-text-primary)', marginTop: '2px' }}>
                      {visa.processing_time}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Govt Fee</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--admin-success-text)', marginTop: '2px' }}>
                      {visa.currency} {visa.fee}
                    </div>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Validity Limit</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--admin-text-primary)', marginTop: '2px' }}>
                      {visa.max_duration}
                    </div>
                  </div>
                </div>

                {/* Document Requirements Tags */}
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Key Requirements
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(Array.isArray(visa.requirements) ? visa.requirements : (visa.requirements || '').split(',')).slice(0, 4).map((req, idx) => (
                      <span 
                        key={idx} 
                        style={{ 
                          fontSize: '0.7rem', 
                          background: '#f1f5f9', 
                          color: '#334155', 
                          padding: '2px 7px', 
                          borderRadius: '4px', 
                          fontWeight: '500'
                        }}
                      >
                        {req.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              {isSuperAdmin && (
                <div style={{ borderTop: '1px solid var(--admin-border-light)', marginTop: '14px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => handleToggleStatus(visa.id)}
                    style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: visa.status === 'Active' ? 'var(--admin-danger-text)' : 'var(--admin-success-text)', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                  >
                    {visa.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => handleDeleteVisa(visa.id)}
                    title="Remove Visa Type"
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Visa Type Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '600px', background: '#ffffff', borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--admin-border-light)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--admin-text-primary)', margin: 0 }}>
                {editingVisa ? `Edit Visa (${editingVisa.code})` : `Add New Visa (${selectedCountry})`}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveVisaType} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="visa-country" style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--admin-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Country</label>
                  <select 
                    id="visa-country"
                    value={formData.country} 
                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', background: '#ffffff', fontSize: '0.85rem' }}
                  >
                    {DESTINATION_COUNTRIES.map(c => (
                      <option key={c.code} value={c.name}>{c.flag} {c.code} ({c.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="visa-category" style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--admin-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Category</label>
                  <select 
                    id="visa-category"
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', background: '#ffffff', fontSize: '0.85rem' }}
                  >
                    <option value="Higher Education">Higher Education</option>
                    <option value="Post-Study Work">Post-Study Work</option>
                    <option value="Vocational">Vocational / Skill</option>
                    <option value="Exchange & Research">Exchange & Research</option>
                    <option value="Short Term">Short Term / Visitor</option>
                    <option value="Guardian">Guardian / Family</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
                <div>
                  <label htmlFor="visa-code" style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--admin-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Visa Code</label>
                  <input 
                    id="visa-code"
                    required
                    type="text" 
                    placeholder="e.g. F-1" 
                    value={formData.code} 
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label htmlFor="visa-title" style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--admin-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Official Visa Title</label>
                  <input 
                    id="visa-title"
                    required
                    type="text" 
                    placeholder="e.g. Academic Student Visa" 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="visa-fee" style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--admin-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Govt Fee</label>
                  <input 
                    id="visa-fee"
                    required
                    type="number" 
                    placeholder="300" 
                    value={formData.fee} 
                    onChange={e => setFormData({ ...formData, fee: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label htmlFor="visa-currency" style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--admin-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Currency</label>
                  <select 
                    id="visa-currency"
                    value={formData.currency} 
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="NZD">NZD ($)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="visa-time" style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--admin-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Processing</label>
                  <input 
                    id="visa-time"
                    required
                    type="text" 
                    placeholder="e.g. 3 - 4 Weeks" 
                    value={formData.processing_time} 
                    onChange={e => setFormData({ ...formData, processing_time: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="visa-duration" style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--admin-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Maximum Duration</label>
                <input 
                  id="visa-duration"
                  type="text" 
                  placeholder="e.g. Up to 5 Years" 
                  value={formData.max_duration} 
                  onChange={e => setFormData({ ...formData, max_duration: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label htmlFor="visa-requirements" style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--admin-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Key Requirements (Comma-Separated)</label>
                <input 
                  id="visa-requirements"
                  type="text" 
                  placeholder="Form I-20, Financial Proof, Passport" 
                  value={formData.requirements} 
                  onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="admin-btn"
                  style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>

                <button 
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  {editingVisa ? 'Save Changes' : 'Create Visa Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
