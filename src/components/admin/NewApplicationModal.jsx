import React, { useState, useEffect } from 'react';
import { X, CheckCircle, UploadCloud, Plane, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function NewApplicationModal({ onClose, onSuccess, currentBranch, showToast }) {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    nationality: '',
    passport_number: '',
    passport_expiry: '',
    address: '',
    highest_qualification: '',
    english_test_type: '',
    english_overall_score: '',
    branch_id: currentBranch?.id || '',
    destination_country: 'Canada', // Default
    target_education_level: 'Undergraduate' // Default
  });

  useEffect(() => {
    // If super admin, they can pick a branch. Fetch branches.
    async function fetchBranches() {
      const { data } = await supabase.from('branches').select('id, name, code');
      if (data) setBranches(data);
    }
    if (!currentBranch) {
      fetchBranches();
    }
  }, [currentBranch]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Insert Student
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          name: form.name,
          email: form.email,
          phone: form.phone,
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          marital_status: form.marital_status || null,
          nationality: form.nationality || null,
          passport_number: form.passport_number || null,
          passport_expiry: form.passport_expiry || null,
          address: form.address || null,
          highest_qualification: form.highest_qualification || null,
          english_test_type: form.english_test_type || null,
          english_overall_score: form.english_overall_score || null,
          branch_id: form.branch_id || null,
          overall_status: 'Active',
          invite_code: Math.floor(100000 + Math.random() * 900000).toString()
        })
        .select('id')
        .single();

      if (studentError) throw studentError;

      // 2. Insert Student Destination
      const { error: destError } = await supabase
        .from('student_destinations')
        .insert({
          student_id: studentData.id,
          destination_country: form.destination_country,
          target_education_level: form.target_education_level,
          status: 'Active'
        });

      if (destError) throw destError;

      showToast('New application successfully created!');
      onSuccess(studentData.id);
    } catch (err) {
      console.error('Error creating application:', err);
      showToast('Failed to create application.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '800px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>New Application Entry</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Complete all details below to instantly set up a new client dashboard.</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', color: '#94a3b8', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X size={24} />
          </button>
        </div>

        {/* Form Content (Scrollable) */}
        <form id="newAppForm" onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            {/* Section 1: Application Target */}
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plane size={18} color="#3b82f6" /> Application Target
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {!currentBranch && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Assign to Branch *</label>
                    <select required name="branch_id" value={form.branch_id} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#f8fafc' }}>
                      <option value="" disabled>Select Branch...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.code} - {b.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Target Country *</label>
                  <select required name="destination_country" value={form.destination_country} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}>
                    <option value="Canada">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="USA">United States</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Target Education Level *</label>
                  <select required name="target_education_level" value={form.target_education_level} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Personal Information */}
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#10b981" /> Personal Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Full Legal Name *</label>
                  <input required name="name" value={form.name} onChange={handleChange} placeholder="John Doe" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Date of Birth *</label>
                  <input required type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Email Address *</label>
                  <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@example.com" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Phone Number *</label>
                  <input required type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 8900" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}>
                    <option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Marital Status</label>
                  <select name="marital_status" value={form.marital_status} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}>
                    <option value="">Select...</option><option value="Single">Single</option><option value="Married">Married</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Travel & Identity */}
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="#f59e0b" /> Travel & Identity
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Nationality</label>
                  <input name="nationality" value={form.nationality} onChange={handleChange} placeholder="e.g. Indian" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Passport No.</label>
                    <input name="passport_number" value={form.passport_number} onChange={handleChange} placeholder="A1234567" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Expiry</label>
                    <input type="date" name="passport_expiry" value={form.passport_expiry} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Permanent Address</label>
                  <textarea name="address" value={form.address} onChange={handleChange} rows={2} placeholder="Full address" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* Section 4: Academic */}
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={18} color="#8b5cf6" /> Academic & Language
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Highest Qualification Completed</label>
                  <input name="highest_qualification" value={form.highest_qualification} onChange={handleChange} placeholder="e.g. Bachelor of Technology (2024)" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>English Test Type</label>
                  <select name="english_test_type" value={form.english_test_type} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}>
                    <option value="">Select...</option><option value="IELTS">IELTS</option><option value="PTE">PTE</option><option value="TOEFL">TOEFL</option><option value="Duolingo">Duolingo</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Overall Score</label>
                  <input name="english_overall_score" value={form.english_overall_score} onChange={handleChange} placeholder="e.g. 7.5" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                </div>
              </div>
            </div>
            
          </div>
        </form>

        {/* Footer actions */}
        <div style={{ padding: '24px 32px', borderTop: '1px solid #e5e7eb', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button onClick={onClose} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>Cancel</button>
          <button type="submit" form="newAppForm" disabled={loading} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(79, 172, 254, 0.2)' }}>
            {loading ? 'Creating...' : 'Submit New Application'}
          </button>
        </div>

      </div>
    </div>
  );
}
