import React, { useState } from 'react';
import { UserPlus, CheckCircle2, ArrowRight, Filter, Search, Building2, Phone, Mail, Clock, AlertCircle, Sparkles } from 'lucide-react';

export default function LeadsManager({ currentRole, currentBranch, onConvertToStudent }) {
  const isSuperAdmin = currentRole === 'super_admin';
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Initial mock leads demonstrating the shared pool and branch claiming workflow
  const [leads, setLeads] = useState([
    {
      id: 'L001',
      name: 'Alex Rivera',
      phone: '+1 (416) 890–1234',
      email: 'alex.rivera@gmail.com',
      interestedCountry: '🇨🇦 Canada',
      educationLevel: 'Bachelor of Engineering',
      intendedCourse: 'MSc Computer Science (University of Toronto)',
      status: 'New',
      assignedBranch: null, // In Shared Pool
      source: 'Free Eligibility Check (Marketing Site)',
      submittedAt: '15 minutes ago'
    },
    {
      id: 'L002',
      name: 'Priya Sharma',
      phone: '+1 (604) 555–0192',
      email: 'priya.sharma99@outlook.com',
      interestedCountry: '🇦🇺 Australia',
      educationLevel: 'Bachelor of Commerce',
      intendedCourse: 'Master of Data Science (Melbourne)',
      status: 'Contacted',
      assignedBranch: 'TOR-01',
      source: 'Book Consultation CTA',
      submittedAt: '2 hours ago'
    },
    {
      id: 'L003',
      name: 'James Wilson',
      phone: '+44 7700 900077',
      email: 'jwilson@yahoo.co.uk',
      interestedCountry: '🇩🇪 Germany',
      educationLevel: 'High School Diploma',
      intendedCourse: 'BEng Mechanical Engineering (TU Munich)',
      status: 'New',
      assignedBranch: null,
      source: 'Student Journey Assessment',
      submittedAt: '4 hours ago'
    },
    {
      id: 'L004',
      name: 'Aarav Mehta',
      phone: '+91 98200 12345',
      email: 'aarav.m@tech.in',
      interestedCountry: '🇬🇧 UK',
      educationLevel: 'Master of IT',
      intendedCourse: 'MBA International Business (Imperial College)',
      status: 'Contacted',
      assignedBranch: 'VAN-01',
      source: 'Free Eligibility Check (Marketing Site)',
      submittedAt: '1 day ago'
    },
    {
      id: 'L005',
      name: 'Elena Rostova',
      phone: '+1 (416) 333–9988',
      email: 'elena.rostova@mail.com',
      interestedCountry: '🇨🇦 Canada',
      educationLevel: 'Master of Arts',
      intendedCourse: 'Post-Graduate Diploma in Supply Chain',
      status: 'Converted',
      assignedBranch: 'TOR-01',
      source: 'Direct Walk-in',
      submittedAt: '2 days ago'
    }
  ]);

  const branchesList = [
    { code: 'TOR-01', name: 'Downtown Toronto HQ' },
    { code: 'VAN-01', name: 'Vancouver Pacific Hub' },
    { code: 'SYD-01', name: 'Sydney Global Branch' }
  ];

  const handleClaimLead = (leadId) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, assignedBranch: currentBranch.code, status: 'Contacted' } : lead
    ));
  };

  const handleStatusChange = (leadId, newStatus) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));
  };

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = filterStatus === 'All' || lead.status === filterStatus;
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.intendedCourse.toLowerCase().includes(searchTerm.toLowerCase());
    // If branch admin, show leads assigned to their branch OR sitting unassigned in the shared pool
    const matchesScope = isSuperAdmin || lead.assignedBranch === null || lead.assignedBranch === currentBranch.code;
    return matchesStatus && matchesSearch && matchesScope;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header & Search Filter Bar */}
      <div style={{ 
        background: '#ffffff', 
        borderRadius: '14px', 
        padding: '20px 24px', 
        border: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
            Lead Acquisition & Triage Pool
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
            Inquiries captured from the public Vistara/Apex website (`/`) awaiting staff assignment or student conversion.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search leads by name, email or course..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                padding: '10px 14px 10px 36px', 
                borderRadius: '8px', 
                border: '1px solid #cbd5e1', 
                fontSize: '0.85rem', 
                width: '260px',
                outline: 'none'
              }}
            />
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
            {['All', 'New', 'Contacted', 'Converted', 'Lost'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  background: filterStatus === status ? '#ffffff' : 'transparent',
                  color: filterStatus === status ? '#0066ff' : '#64748b',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: filterStatus === status ? '700' : '600',
                  cursor: 'pointer',
                  boxShadow: filterStatus === status ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <th style={{ padding: '16px 20px' }}>Lead & Contact</th>
              <th style={{ padding: '16px 20px' }}>Target Destination & Course</th>
              <th style={{ padding: '16px 20px' }}>Assigned Branch</th>
              <th style={{ padding: '16px 20px' }}>Status</th>
              <th style={{ padding: '16px 20px', textAlign: 'right' }}>Atomic Action (`fn_convert`)</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>
                  No leads matching the current status or search filter.
                </td>
              </tr>
            ) : filteredLeads.map((lead, index) => {
              const branchName = branchesList.find(b => b.code === lead.assignedBranch)?.name || 'Unassigned Pool';
              const isClaimedByMe = lead.assignedBranch === currentBranch.code;

              return (
                <tr key={lead.id} style={{ borderBottom: index < filteredLeads.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = '#ffffff'}>
                  
                  {/* Lead Info */}
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', color: '#0066ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem' }}>
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>{lead.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Phone size={11} /> {lead.phone}</span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Mail size={11} /> {lead.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Destination & Course */}
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.92rem' }}>{lead.interestedCountry}</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>{lead.intendedCourse}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>Edu: {lead.educationLevel}</div>
                  </td>

                  {/* Assigned Branch */}
                  <td style={{ padding: '18px 20px' }}>
                    {lead.assignedBranch === null ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={13} color="#f97316" /> Shared Pool
                        </span>
                        <button 
                          onClick={() => handleClaimLead(lead.id)}
                          style={{ background: '#eff6ff', color: '#0066ff', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Claim to {currentBranch.code}
                        </button>
                      </div>
                    ) : (
                      <span style={{ 
                        background: isClaimedByMe ? '#ecfdf5' : '#eff6ff', 
                        color: isClaimedByMe ? '#059669' : '#0066ff', 
                        border: isClaimedByMe ? '1px solid #a7f3d0' : '1px solid #bfdbfe',
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '0.78rem', 
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Building2 size={13} /> {branchName}
                      </span>
                    )}
                  </td>

                  {/* Status Dropdown */}
                  <td style={{ padding: '18px 20px' }}>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        border: '1px solid #cbd5e1',
                        background: lead.status === 'New' ? '#eff6ff' : lead.status === 'Contacted' ? '#fff7ed' : lead.status === 'Converted' ? '#ecfdf5' : '#f1f5f9',
                        color: lead.status === 'New' ? '#0066ff' : lead.status === 'Contacted' ? '#ea580c' : lead.status === 'Converted' ? '#059669' : '#64748b',
                        fontWeight: '700',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </td>

                  {/* Atomic Action: Convert Lead to Student (Head Team Issue #7 Fix) */}
                  <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                    {lead.status === 'Converted' ? (
                      <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Enrolled Student
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          handleStatusChange(lead.id, 'Converted');
                          if (onConvertToStudent) onConvertToStudent(lead);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #0066ff 0%, #1d4ed8 100%)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(0, 102, 255, 0.25)',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <Sparkles size={14} />
                        <span>Convert to Student</span>
                      </button>
                    )}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
