import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle2, ArrowRight, Filter, Search, Building2, Phone, Mail, Clock, AlertCircle, Sparkles, Loader2, MoreHorizontal } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function LeadsManager({ currentRole, currentBranch, currentUser, showToast, externalSearchQuery }) {
  const isSuperAdmin = currentRole === 'super_admin';
  const [searchTerm, setSearchTerm] = useState(externalSearchQuery || '');

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchTerm(externalSearchQuery);
    }
  }, [externalSearchQuery]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('list');
  
  // New Lead Modal States
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    interested_country: '',
    intended_course: '',
    education_level: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    nationality: '',
    passport_number: '',
    passport_expiry: '',
    address: '',
    highest_qualification: '',
    english_test_type: '',
    english_overall_score: ''
  });

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterLevel, setFilterLevel] = useState('All');

  useEffect(() => {
    fetchLeads();
  }, [currentRole, currentBranch]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('leads')
        .select(`
          *,
          branches(name, code)
        `)
        .order('created_at', { ascending: false });

      if (currentRole === 'branch_admin' && currentBranch) {
        const branchId = typeof currentBranch === 'object' ? currentBranch.id : currentBranch;
        if (branchId) {
          query = query.eq('assigned_branch_id', branchId);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimLead = async (leadId) => {
    try {
      if (!currentBranch || (!currentBranch.id && typeof currentBranch !== 'string')) {
        showToast("No branch assigned to your profile. Cannot claim.", "error");
        return;
      }
      
      const branchId = typeof currentBranch === 'object' ? currentBranch.id : currentBranch;
      
      const { error } = await supabase
        .from('leads')
        .update({ 
          assigned_branch_id: branchId,
          status: 'Contacted',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);
        
      if (error) throw error;
      showToast("Lead claimed successfully.");
      await fetchLeads(); 
    } catch (err) {
      console.error('Error claiming lead:', err);
      showToast('Failed to claim lead.', 'error');
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);
        
      if (error) throw error;
      showToast(`Status updated to ${newStatus}`);
      await fetchLeads();
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update status.', 'error');
    }
  };

  const handleConvertToStudent = async (lead) => {
    if (window.confirm(`Convert ${lead.name} to an enrolled student? This will generate initial checklists.`)) {
      try {
        if (!currentUser || !currentUser.id) throw new Error("No valid user session found.");
        const branchId = typeof currentBranch === 'object' ? currentBranch.id : currentBranch;
        
        const { error } = await supabase.rpc('fn_convert_lead_to_student', {
          p_lead_id: lead.id,
          p_branch_id: lead.assigned_branch_id || branchId,
          p_education_level: lead.education_level || 'Post-Graduate',
          p_staff_user_id: currentUser.id
        });

        if (error) throw error;
        
        showToast("Lead successfully converted to Student!");
        await fetchLeads();
      } catch (err) {
        console.error('Error converting lead:', err);
        showToast('Conversion failed: ' + err.message, 'error');
      }
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      // Automatically assign the lead to the current user's branch if they have one
      const assignedBranchId = typeof currentBranch === 'object' ? currentBranch.id : currentBranch || null;
      
      const { error } = await supabase.from('leads').insert({
        name: newLeadForm.name,
        email: newLeadForm.email,
        phone: newLeadForm.phone,
        interested_country: newLeadForm.interested_country,
        intended_course: newLeadForm.intended_course,
        education_level: newLeadForm.education_level,
        date_of_birth: newLeadForm.date_of_birth || null,
        gender: newLeadForm.gender || null,
        marital_status: newLeadForm.marital_status || null,
        nationality: newLeadForm.nationality || null,
        passport_number: newLeadForm.passport_number || null,
        passport_expiry: newLeadForm.passport_expiry || null,
        address: newLeadForm.address || null,
        highest_qualification: newLeadForm.highest_qualification || null,
        english_test_type: newLeadForm.english_test_type || null,
        english_overall_score: newLeadForm.english_overall_score || null,
        status: 'New',
        assigned_branch_id: assignedBranchId
      });

      if (error) throw error;
      
      showToast("New application manually created!");
      setShowNewLeadModal(false);
      setNewLeadForm({ name: '', email: '', phone: '', interested_country: '', intended_course: '', education_level: '', date_of_birth: '', gender: '', marital_status: '', nationality: '', passport_number: '', passport_expiry: '', address: '', highest_qualification: '', english_test_type: '', english_overall_score: '' });
      await fetchLeads();
    } catch (err) {
      console.error('Error creating lead:', err);
      showToast('Failed to create application.', 'error');
    }
  };

  const activeFilterCount = (filterStatus !== 'All' ? 1 : 0) + (filterCountry !== 'All' ? 1 : 0) + (filterLevel !== 'All' ? 1 : 0) + (searchTerm ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('All');
    setFilterCountry('All');
    setFilterLevel('All');
  };

  const filteredLeads = leads.filter(lead => {
    const sTerm = searchTerm.toLowerCase();
    const name = lead.name || '';
    const email = lead.email || '';
    const phone = lead.phone || '';
    const course = lead.intended_course || '';
    const country = lead.interested_country || '';
    const level = lead.education_level || '';

    const matchesSearch = !sTerm || 
      name.toLowerCase().includes(sTerm) || 
      email.toLowerCase().includes(sTerm) ||
      phone.toLowerCase().includes(sTerm) ||
      course.toLowerCase().includes(sTerm) ||
      country.toLowerCase().includes(sTerm) ||
      level.toLowerCase().includes(sTerm);

    const matchesStatus = filterStatus === 'All' || lead.status === filterStatus;
    const matchesCountry = filterCountry === 'All' || lead.interested_country === filterCountry;
    const matchesLevel = filterLevel === 'All' || lead.education_level === filterLevel;

    return matchesSearch && matchesStatus && matchesCountry && matchesLevel;
  });

  const columns = [
    { id: 'New', title: 'PENDING (NEW)' },
    { id: 'Contacted', title: 'PROCESSING (CONTACTED)' },
    { id: 'Converted', title: 'APPROVED (CONVERTED)' },
    { id: 'Lost', title: 'REFUSED (LOST)' }
  ];

  return (
    <div style={{ padding: '0', maxWidth: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--admin-text-primary)' }}>
            Student Leads
          </h1>
          <p style={{ color: 'var(--admin-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            {filteredLeads.length} active applications shown (out of {leads.length} total)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
           {/* Search Input Bar */}
           <div style={{ position: 'relative', width: '280px' }}>
             <Search size={16} color="var(--admin-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
             <input
               type="text"
               placeholder="Search applicant, course, phone..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="admin-input"
               style={{ paddingLeft: '36px', width: '100%', background: '#ffffff', fontSize: '0.85rem' }}
             />
           </div>

           <button 
             onClick={() => setShowFilterPanel(!showFilterPanel)} 
             className="admin-btn"
             style={{
               background: showFilterPanel || activeFilterCount > 0 ? 'var(--admin-primary-light)' : '#ffffff',
               color: showFilterPanel || activeFilterCount > 0 ? 'var(--admin-primary)' : '#374151',
               border: '1px solid var(--admin-border-light)',
               display: 'flex', alignItems: 'center', gap: '8px'
             }}
           >
             <Filter size={16} /> Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
           </button>

           <button onClick={() => setShowNewLeadModal(true)} className="admin-btn admin-btn-primary">
             + New application
           </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div style={{ background: '#ffffff', border: '1px solid var(--admin-border-light)', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--admin-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--admin-text-primary)' }}>Filter Applications</h4>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--admin-danger)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                Reset All Filters
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="admin-input" style={{ width: '100%', background: '#f9fafb' }}>
                <option value="All">All Statuses</option>
                <option value="New">Pending (New)</option>
                <option value="Contacted">Processing (Contacted)</option>
                <option value="Converted">Approved (Converted)</option>
                <option value="Lost">Refused (Lost)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Destination Country</label>
              <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className="admin-input" style={{ width: '100%', background: '#f9fafb' }}>
                <option value="All">All Countries</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="New Zealand">New Zealand</option>
                <option value="Ireland">Ireland</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Education Level</label>
              <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="admin-input" style={{ width: '100%', background: '#f9fafb' }}>
                <option value="All">All Levels</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Diploma">Diploma</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .kanban-board::-webkit-scrollbar {
          height: 6px;
        }
        .kanban-board::-webkit-scrollbar-track {
          background: transparent;
        }
        .kanban-board::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .kanban-board::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--admin-border-light)', marginBottom: '24px', fontSize: '0.9rem', fontWeight: '500', color: 'var(--admin-text-secondary)' }}>
         <div onClick={() => setActiveView('kanban')} style={{ paddingBottom: '12px', borderBottom: activeView === 'kanban' ? '2px solid var(--admin-text-primary)' : '2px solid transparent', color: activeView === 'kanban' ? 'var(--admin-text-primary)' : 'var(--admin-text-secondary)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>Student Leads (Kanban)</div>
         <div onClick={() => setActiveView('list')} style={{ paddingBottom: '12px', borderBottom: activeView === 'list' ? '2px solid var(--admin-text-primary)' : '2px solid transparent', color: activeView === 'list' ? 'var(--admin-text-primary)' : 'var(--admin-text-secondary)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>List view</div>
      </div>

      {loading ? (
         <div style={{ padding: '60px', textAlign: 'center' }}>
           <Loader2 size={40} className="animate-spin" color="var(--admin-primary)" style={{ margin: '0 auto 16px' }} />
         </div>
      ) : activeView === 'kanban' ? (
        <div className="kanban-board">
          {columns.map(col => {
            const columnLeads = filteredLeads.filter(l => l.status === col.id);
            return (
              <div key={col.id} className="kanban-column">
                <div className="kanban-column-header">
                  <span>{col.title}</span>
                  <span className="kanban-column-count">{columnLeads.length}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                  {columnLeads.map(lead => (
                    <div key={lead.id} className="kanban-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                           <div className="user-avatar" style={{ background: lead.status === 'Converted' ? 'var(--admin-text-primary)' : lead.status === 'Lost' ? 'var(--admin-danger)' : 'var(--admin-success)' }}>
                             {(lead.name || 'U').split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                           </div>
                           <div>
                             <div style={{ fontWeight: '700', color: 'var(--admin-text-primary)', fontSize: '0.95rem' }}>{lead.name || 'Unknown User'}</div>
                             <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>{lead.intended_course || lead.interested_country || 'General Inquiry'}</div>
                           </div>
                        </div>
                        <button style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--admin-text-primary)', fontSize: '0.95rem' }}>
                          {lead.budget ? `$${lead.budget}` : '--'}
                        </div>
                        
                        {/* Action Area / Status Badge */}
                        {lead.status === 'Converted' && (
                          <div className="admin-badge admin-badge-success">
                            <div className="admin-badge-dot"></div> Approved
                          </div>
                        )}
                        {lead.status === 'Lost' && (
                          <div className="admin-badge admin-badge-danger">
                            <div className="admin-badge-dot"></div> Refused
                          </div>
                        )}
                        {lead.status === 'New' && !lead.assigned_branch_id && (
                          <button onClick={() => handleClaimLead(lead.id)} className="admin-btn admin-btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                            Claim
                          </button>
                        )}
                        {lead.status === 'New' && lead.assigned_branch_id && (
                          <button onClick={() => handleStatusChange(lead.id, 'Contacted')} className="admin-btn admin-btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                            Mark Contacted
                          </button>
                        )}
                        {lead.status === 'Contacted' && (
                          <button onClick={() => handleConvertToStudent(lead)} className="admin-btn" style={{ background: 'var(--admin-success-bg)', color: 'var(--admin-success-text)', padding: '4px 8px', fontSize: '0.75rem' }}>
                            Convert
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--admin-bg-body)', borderBottom: '1px solid var(--admin-border-light)' }}>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applicant</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interest</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid var(--admin-border-light)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--admin-text-primary)' }}>{lead.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>{lead.email}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-primary)' }}>{lead.intended_course || 'General'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>{lead.interested_country || 'Any'}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div className={`admin-badge ${lead.status === 'Converted' ? 'admin-badge-success' : lead.status === 'Lost' ? 'admin-badge-danger' : lead.status === 'New' ? 'admin-badge-neutral' : 'admin-badge-warning'}`}>
                      <div className="admin-badge-dot"></div>
                      {lead.status}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    {lead.status === 'New' && !lead.assigned_branch_id && (
                      <button onClick={() => handleClaimLead(lead.id)} className="admin-btn admin-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Claim</button>
                    )}
                    {lead.status === 'New' && lead.assigned_branch_id && (
                      <button onClick={() => handleStatusChange(lead.id, 'Contacted')} className="admin-btn admin-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Mark Contacted</button>
                    )}
                    {lead.status === 'Contacted' && (
                      <button onClick={() => handleConvertToStudent(lead)} className="admin-btn" style={{ background: 'var(--admin-success-bg)', color: 'var(--admin-success-text)', padding: '6px 12px', fontSize: '0.8rem' }}>Convert</button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No leads found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* NEW LEAD MODAL */}
      {showNewLeadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden' }}>
            <div className="admin-card-header" style={{ padding: '24px', background: 'var(--admin-bg-body)', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="admin-card-title" style={{ margin: 0 }}>Create New Application</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: '4px 0 0 0' }}>Manually enter a walk-in or phone inquiry</p>
              </div>
              <button onClick={() => setShowNewLeadModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><AlertCircle size={20} color="transparent" /> {/* Hidden icon for spacing, real close below */} <span style={{fontSize: '1.5rem', color: 'var(--admin-text-muted)', lineHeight: 1}}>&times;</span></button>
            </div>
            
            <form onSubmit={handleCreateLead} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
              
              {/* Basic Contact Info */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--admin-primary)' }}>Contact Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Full Name *</label>
                    <input required className="admin-input" value={newLeadForm.name} onChange={e => setNewLeadForm({...newLeadForm, name: e.target.value})} placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Email Address *</label>
                    <input required type="email" className="admin-input" value={newLeadForm.email} onChange={e => setNewLeadForm({...newLeadForm, email: e.target.value})} placeholder="john@example.com" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Phone Number</label>
                  <input className="admin-input" value={newLeadForm.phone} onChange={e => setNewLeadForm({...newLeadForm, phone: e.target.value})} placeholder="+1 234 567 8900" />
                </div>
              </div>

              {/* Personal Details */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--admin-border-light)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--admin-primary)' }}>Personal Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Date of Birth</label>
                    <input type="date" className="admin-input" value={newLeadForm.date_of_birth} onChange={e => setNewLeadForm({...newLeadForm, date_of_birth: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Gender</label>
                    <select className="admin-input" value={newLeadForm.gender} onChange={e => setNewLeadForm({...newLeadForm, gender: e.target.value})}>
                      <option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Marital Status</label>
                    <select className="admin-input" value={newLeadForm.marital_status} onChange={e => setNewLeadForm({...newLeadForm, marital_status: e.target.value})}>
                      <option value="">Select...</option><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Full Address</label>
                    <input className="admin-input" value={newLeadForm.address} onChange={e => setNewLeadForm({...newLeadForm, address: e.target.value})} placeholder="Street, City, Country" />
                  </div>
                </div>
              </div>

              {/* Travel & Passport */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--admin-border-light)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--admin-primary)' }}>Travel & Passport</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Nationality</label>
                    <input className="admin-input" value={newLeadForm.nationality} onChange={e => setNewLeadForm({...newLeadForm, nationality: e.target.value})} placeholder="e.g. Indian, Nigerian" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Passport Number</label>
                    <input className="admin-input" value={newLeadForm.passport_number} onChange={e => setNewLeadForm({...newLeadForm, passport_number: e.target.value})} placeholder="Passport No." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Passport Expiry</label>
                    <input type="date" className="admin-input" value={newLeadForm.passport_expiry} onChange={e => setNewLeadForm({...newLeadForm, passport_expiry: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Study Preferences */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--admin-border-light)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--admin-primary)' }}>Study & Academic Preferences</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Destination Country</label>
                    <select className="admin-input" value={newLeadForm.interested_country} onChange={e => setNewLeadForm({...newLeadForm, interested_country: e.target.value})}>
                      <option value="">Select country...</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="New Zealand">New Zealand</option>
                      <option value="Ireland">Ireland</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Target Education Level</label>
                    <select className="admin-input" value={newLeadForm.education_level} onChange={e => setNewLeadForm({...newLeadForm, education_level: e.target.value})}>
                      <option value="">Select level...</option>
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Diploma">Diploma</option>
                      <option value="PhD">PhD</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Intended Course/Major</label>
                    <input className="admin-input" value={newLeadForm.intended_course} onChange={e => setNewLeadForm({...newLeadForm, intended_course: e.target.value})} placeholder="e.g. Master of Data Science" />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Highest Existing Qualification</label>
                    <input className="admin-input" value={newLeadForm.highest_qualification} onChange={e => setNewLeadForm({...newLeadForm, highest_qualification: e.target.value})} placeholder="e.g. BSc Computer Science (2023)" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>English Test Type</label>
                    <select className="admin-input" value={newLeadForm.english_test_type} onChange={e => setNewLeadForm({...newLeadForm, english_test_type: e.target.value})}>
                      <option value="">None / Not taken</option><option value="IELTS">IELTS</option><option value="TOEFL">TOEFL</option><option value="PTE">PTE</option><option value="Duolingo">Duolingo</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Overall Score</label>
                    <input className="admin-input" value={newLeadForm.english_overall_score} onChange={e => setNewLeadForm({...newLeadForm, english_overall_score: e.target.value})} placeholder="e.g. 7.5, 105" />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--admin-border-light)' }}>
                <button type="button" onClick={() => setShowNewLeadModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary">Create Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
