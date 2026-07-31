import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, CheckCircle2, UserCheck, DollarSign, FileText, UserPlus, Clock, Lock, Building2, Loader2, Search, Filter, Printer, Check, Globe, User, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function ActivityTimeline({ currentRole, currentBranch }) {
  const isSuperAdmin = currentRole === 'super_admin';

  // Mode: 'student' (Detailed Student Reports) | 'audit' (System Audit Trail)
  const [activeReportMode, setActiveReportMode] = useState('student');

  // Student Report State
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');

  useEffect(() => {
    fetchStudents();
    fetchLogs();
  }, [currentRole, currentBranch]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      let query = supabase
        .from('students')
        .select(`
          *,
          branches(name, code),
          leads(interested_country, intended_course, education_level, name, phone, email),
          student_destinations(
            id, destination_country, target_education_level, status,
            checklist_instances(
              id, vertical, status,
              document_items(*)
            )
          ),
          fee_records(
            *,
            fee_types(name),
            payment_transactions(*),
            refund_records(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (currentRole === 'branch_admin' && currentBranch) {
        const branchId = typeof currentBranch === 'object' ? currentBranch.id : currentBranch;
        if (branchId) {
          query = query.eq('branch_id', branchId);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const loadedStudents = data || [];
      setStudents(loadedStudents);
      if (loadedStudents.length > 0 && !selectedStudentId) {
        setSelectedStudentId(loadedStudents[0].id);
      }
    } catch (err) {
      console.error('Error fetching students for report:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          staff_users(
            name, 
            role,
            branch_assignments(branch_id)
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(300);

      if (error) throw error;

      let finalLogs = data || [];
      if (currentRole === 'branch_admin' && currentBranch) {
        const bId = typeof currentBranch === 'object' ? currentBranch.id : currentBranch;
        finalLogs = finalLogs.filter(log => {
          const assignments = log.staff_users?.branch_assignments || [];
          return assignments.some(a => a.branch_id === bId);
        });
      }

      setLogs(finalLogs);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Currently Selected Student
  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0];

  // Filtered list of students for search selector
  const filteredStudents = students.filter(s => {
    const term = studentSearchQuery.toLowerCase().trim();
    if (!term) return true;
    const name = (s.name || s.leads?.name || '').toLowerCase();
    const email = (s.email || s.leads?.email || '').toLowerCase();
    const phone = (s.phone || s.leads?.phone || '').toLowerCase();
    const passport = (s.passport_number || s.leads?.passport_number || '').toLowerCase();
    const branch = (s.branches?.name || '').toLowerCase();
    const country = (s.student_destinations?.[0]?.destination_country || '').toLowerCase();

    return name.includes(term) || email.includes(term) || phone.includes(term) || passport.includes(term) || branch.includes(term) || country.includes(term);
  });

  // Extract all document items across all destinations for selected student
  const allDocuments = [];
  if (selectedStudent?.student_destinations) {
    selectedStudent.student_destinations.forEach(dest => {
      if (dest.checklist_instances) {
        dest.checklist_instances.forEach(inst => {
          if (inst.document_items) {
            inst.document_items.forEach(doc => {
              allDocuments.push({
                ...doc,
                destination_country: dest.destination_country,
                target_education_level: dest.target_education_level,
                vertical: inst.vertical
              });
            });
          }
        });
      }
    });
  }

  const submittedDocs = allDocuments.filter(d => d.status === 'Received' || d.status === 'Waived');
  const pendingDocs = allDocuments.filter(d => d.status === 'Pending' || d.status === 'Rejected');
  const completionPercentage = allDocuments.length > 0 ? Math.round((submittedDocs.length / allDocuments.length) * 100) : 0;

  // View PDF Handler
  const handleViewPdf = async (fileUrl) => {
    try {
      const { data, error } = await supabase.storage.from('student_documents').createSignedUrl(fileUrl, 60);
      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error('Error opening file:', err);
      alert('Failed to open document. It may have been removed.');
    }
  };

  // Financial summary calculations
  const feeRecords = selectedStudent?.fee_records || [];
  const totalAssignedFee = feeRecords.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
  const totalBalanceDue = feeRecords.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
  const totalPaidFee = totalAssignedFee - totalBalanceDue;
  const currencySymbol = feeRecords[0]?.currency || 'USD';

  // Audit Logs Filter
  const filteredLogs = logs.filter(log => {
    const term = auditSearchTerm.toLowerCase();
    const entityMatch = !term || log.entity_type?.toLowerCase().includes(term) || log.entity_id?.toLowerCase().includes(term);
    const fieldMatch = !term || log.field_changed?.toLowerCase().includes(term) || String(log.old_value || '').toLowerCase().includes(term) || String(log.new_value || '').toLowerCase().includes(term);
    const userMatch = !term || log.staff_users?.name?.toLowerCase().includes(term);

    const matchesSearch = entityMatch || fieldMatch || userMatch;

    let matchesEntity = true;
    const typeLower = (log.entity_type || '').toLowerCase();

    if (entityFilter === 'lead_student') {
      matchesEntity = typeLower.includes('lead') || typeLower.includes('student');
    } else if (entityFilter === 'document_item') {
      matchesEntity = typeLower.includes('doc') || typeLower.includes('checklist');
    } else if (entityFilter === 'fee_payment') {
      matchesEntity = typeLower.includes('fee') || typeLower.includes('payment') || typeLower.includes('refund') || typeLower.includes('transaction');
    }

    return matchesSearch && matchesEntity;
  });

  const getEntityIcon = (entityType) => {
    const typeLower = (entityType || '').toLowerCase();
    if (typeLower.includes('fee') || typeLower.includes('payment') || typeLower.includes('refund') || typeLower.includes('transaction')) {
      return <DollarSign size={16} color="#059669" />;
    }
    if (typeLower.includes('doc') || typeLower.includes('checklist')) {
      return <FileText size={16} color="#0066ff" />;
    }
    if (typeLower.includes('student')) {
      return <UserCheck size={16} color="#9333ea" />;
    }
    if (typeLower.includes('lead')) {
      return <UserPlus size={16} color="#f97316" />;
    }
    return <CheckCircle2 size={16} color="#64748b" />;
  };

  const formatEntityType = (type) => {
    if (!type) return 'Activity';
    switch (type) {
      case 'DocumentItem': return 'Document Item';
      case 'PaymentTransaction': return 'Payment Transaction';
      case 'RefundRecord': return 'Refund Record';
      case 'FeeRecord': return 'Fee Record';
      default: return type;
    }
  };

  const primaryDest = selectedStudent?.student_destinations?.[0];

  return (
    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Report Mode Selector Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--admin-border-light)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => setActiveReportMode('student')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeReportMode === 'student' ? 'var(--admin-primary)' : 'var(--admin-bg-body)',
              color: activeReportMode === 'student' ? '#ffffff' : 'var(--admin-text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={18} /> Student Detailed Reports
          </button>
          <button
            onClick={() => setActiveReportMode('audit')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeReportMode === 'audit' ? 'var(--admin-primary)' : 'var(--admin-bg-body)',
              color: activeReportMode === 'audit' ? '#ffffff' : 'var(--admin-text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            <History size={18} /> System Audit Trail (`activity_logs`)
          </button>
        </div>

        {activeReportMode === 'student' && selectedStudent && (
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              border: '1px solid var(--admin-border-light)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: '600',
              color: 'var(--admin-text-primary)',
              cursor: 'pointer',
              boxShadow: 'var(--admin-shadow-sm)'
            }}
          >
            <Printer size={16} /> Print / Export Student Report
          </button>
        )}
      </div>

      {/* MODE 1: STUDENT DETAILED REPORT VIEW */}
      {activeReportMode === 'student' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Student Selector Toolbar */}
          <div className="admin-card" style={{ padding: '20px 24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
              <Search size={18} color="var(--admin-text-muted)" />
              <input
                type="text"
                placeholder="Filter students by name, email, passport, country..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="admin-input"
                style={{ width: '100%', background: '#ffffff', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--admin-text-secondary)', flexShrink: 0 }}>Select Student:</label>
              <select
                value={selectedStudentId || ''}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="admin-input"
                style={{ width: '100%', background: '#ffffff', fontSize: '0.9rem', fontWeight: '600' }}
              >
                {filteredStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.leads?.name || 'Unnamed Client'} — APP-{s.id.substring(0, 4).toUpperCase()} ({s.branches?.name || 'Main Branch'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingStudents ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <Loader2 size={40} className="animate-spin" color="var(--admin-primary)" />
            </div>
          ) : !selectedStudent ? (
            <div className="admin-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
              <AlertCircle size={48} color="var(--admin-text-muted)" style={{ margin: '0 auto 16px' }} />
              <h3>No Students Found</h3>
              <p>No student records match your filter criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Student Header Summary Card */}
              <div className="admin-card" style={{ padding: '24px 32px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                      STUDENT REPORT CARD • APP-{selectedStudent.id.substring(0, 4).toUpperCase()}
                    </div>
                    <h1 style={{ margin: '0 0 12px 0', fontSize: '1.8rem', fontWeight: '800', color: '#111827', letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>
                      {selectedStudent.name || selectedStudent.leads?.name || 'Unnamed Student'}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#059669', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: '700' }}>
                        <Building2 size={14} /> {selectedStudent.branches?.name || 'Main Branch'}
                      </span>
                      {primaryDest && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: '700' }}>
                          <Globe size={14} /> {primaryDest.destination_country} ({primaryDest.target_education_level})
                        </span>
                      )}
                      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        Enrolled on {new Date(selectedStudent.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Invite Code & Quick Status */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', display: 'inline-block' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>INVITE CODE</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0.05em' }}>
                        {selectedStudent.invite_code || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Overview Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="admin-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Total Documents</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827' }}>{allDocuments.length}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>Configured across checklist</div>
                </div>

                <div className="admin-card" style={{ padding: '20px', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803d', textTransform: 'uppercase', marginBottom: '8px' }}>Submitted / Approved</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#166534' }}>{submittedDocs.length}</div>
                  <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '4px' }}>Verified or waived</div>
                </div>

                <div className="admin-card" style={{ padding: '20px', background: '#fffbeb', borderColor: '#fde68a' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', marginBottom: '8px' }}>Pending / Required</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#92400e' }}>{pendingDocs.length}</div>
                  <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '4px' }}>Action required by student</div>
                </div>

                <div className="admin-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Compliance Progress</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827' }}>{completionPercentage}%</div>
                  <div style={{ width: '100%', background: '#e5e7eb', height: '6px', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${completionPercentage}%`, background: completionPercentage === 100 ? '#059669' : '#3b82f6', height: '100%', borderRadius: '3px' }}></div>
                  </div>
                </div>
              </div>

              {/* Student Personal & Academic Profile Card */}
              <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={18} color="#374151" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#111827' }}>Personal & Academic Profile</h3>
                </div>
                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>FULL NAME</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>{selectedStudent.name || selectedStudent.leads?.name || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>EMAIL ADDRESS</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>{selectedStudent.email || selectedStudent.leads?.email || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>PHONE NUMBER</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>{selectedStudent.phone || selectedStudent.leads?.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>DATE OF BIRTH</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>{selectedStudent.date_of_birth || selectedStudent.leads?.date_of_birth || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>NATIONALITY</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>{selectedStudent.nationality || selectedStudent.leads?.nationality || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>PASSPORT NO. (EXPIRY)</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>{selectedStudent.passport_number ? `${selectedStudent.passport_number} (${selectedStudent.passport_expiry || 'No expiry'})` : selectedStudent.leads?.passport_number || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>GENDER / MARITAL STATUS</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>{selectedStudent.gender ? `${selectedStudent.gender} / ${selectedStudent.marital_status || 'Single'}` : 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>HIGHEST QUALIFICATION</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>{selectedStudent.highest_qualification || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>ENGLISH TEST SCORE</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>{selectedStudent.english_test_type ? `${selectedStudent.english_test_type} (${selectedStudent.english_overall_score || '-'})` : 'Not provided'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>PERMANENT ADDRESS</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>{selectedStudent.address || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Submitted Documents Section */}
              <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#ecfdf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={20} color="#059669" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#065f46' }}>
                      Submitted & Verified Documents ({submittedDocs.length})
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#047857' }}>All Approved Documents</span>
                </div>

                <div style={{ padding: '0' }}>
                  {submittedDocs.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                      No documents have been submitted or approved yet.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Document Name</th>
                          <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Target Destination</th>
                          <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                          <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submittedDocs.map((doc, idx) => (
                          <tr key={doc.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>{doc.document_name}</div>
                              {doc.notes && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Note: {doc.notes}</div>}
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: '#475569' }}>
                              {doc.destination_country} ({doc.target_education_level})
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: doc.status === 'Waived' ? '#f3f4f6' : '#ecfdf5', color: doc.status === 'Waived' ? '#4b5563' : '#059669', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
                                <Check size={12} /> {doc.status}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              {doc.file_url ? (
                                <button
                                  onClick={() => handleViewPdf(doc.file_url)}
                                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#0f172a', cursor: 'pointer' }}
                                >
                                  View PDF
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No file attached</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Pending / Action Required Documents Section */}
              <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#fffbeb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={20} color="#d97706" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#92400e' }}>
                      Pending & Missing Documents ({pendingDocs.length})
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#b45309' }}>Action Required</span>
                </div>

                <div style={{ padding: '0' }}>
                  {pendingDocs.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#059669', fontWeight: '600', fontSize: '0.9rem' }}>
                      🎉 Excellent! All required documents have been submitted and approved.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Required Document</th>
                          <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Target Destination</th>
                          <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                          <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Instructions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingDocs.map((doc, idx) => (
                          <tr key={doc.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>{doc.document_name}</div>
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: '#475569' }}>
                              {doc.destination_country} ({doc.target_education_level})
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: doc.status === 'Rejected' ? '#fef2f2' : '#fffbeb', color: doc.status === 'Rejected' ? '#dc2626' : '#d97706', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
                                {doc.status}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: '0.8rem', color: '#64748b' }}>
                              {doc.notes || 'Awaiting student upload via secure portal.'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Financial Ledger Summary Card */}
              <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <DollarSign size={20} color="#059669" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#111827' }}>Financial Ledger & Fee Summary</h3>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: totalBalanceDue > 0 ? '#dc2626' : '#059669' }}>
                    Balance Outstanding: {currencySymbol} {totalBalanceDue.toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: '24px' }}>
                  {feeRecords.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>No fee structures assigned to this student file yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '8px' }}>
                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700' }}>TOTAL ASSIGNED</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>{currencySymbol} {totalAssignedFee.toLocaleString()}</div>
                        </div>
                        <div style={{ background: '#ecfdf5', padding: '12px 16px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                          <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: '700' }}>TOTAL COLLECTED</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#065f46' }}>{currencySymbol} {totalPaidFee.toLocaleString()}</div>
                        </div>
                        <div style={{ background: totalBalanceDue > 0 ? '#fef2f2' : '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${totalBalanceDue > 0 ? '#fecaca' : '#e2e8f0'}` }}>
                          <div style={{ fontSize: '0.7rem', color: totalBalanceDue > 0 ? '#b91c1c' : '#64748b', fontWeight: '700' }}>OUTSTANDING BALANCE</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: totalBalanceDue > 0 ? '#991b1b' : '#0f172a' }}>{currencySymbol} {totalBalanceDue.toLocaleString()}</div>
                        </div>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '10px 16px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Fee Name</th>
                            <th style={{ padding: '10px 16px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Total Fee</th>
                            <th style={{ padding: '10px 16px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Balance Due</th>
                            <th style={{ padding: '10px 16px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {feeRecords.map(record => (
                            <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1e293b', fontSize: '0.85rem' }}>{record.fee_types?.name || 'Standard Fee'}</td>
                              <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{record.currency} {record.total_amount}</td>
                              <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: record.balance > 0 ? '#dc2626' : '#059669', fontWeight: '600' }}>{record.currency} {record.balance}</td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', background: record.status === 'Paid' ? '#ecfdf5' : '#fffbeb', color: record.status === 'Paid' ? '#059669' : '#d97706' }}>
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* MODE 2: SYSTEM AUDIT TRAIL VIEW (`activity_logs`) */}
      {activeReportMode === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Header Notice */}
          <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={22} color="var(--admin-text-primary)" />
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: 'var(--admin-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                  Immutable Audit Trail (`activity_logs`)
                </h2>
              </div>
              <p style={{ margin: '4px 0 0 0', color: 'var(--admin-text-secondary)', fontSize: '0.9rem' }}>
                Every action taken across the CRM (lead claiming, conversions, checklist updates, financial changes) is recorded here atomically.
                <strong style={{ color: 'var(--admin-text-primary)' }}> These records cannot be deleted or modified.</strong>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--admin-bg-body)', padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--admin-border-light)' }}>
              <Lock size={16} color="var(--admin-primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-primary)' }}>PostgreSQL Audit Triggers Active</span>
            </div>
          </div>

          {/* Audit Search and Filter Bar */}
          <div className="admin-card" style={{ padding: '16px 24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} color="var(--admin-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search audit trail by user, field, entity ID, or values..."
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                className="admin-input"
                style={{ paddingLeft: '38px', width: '100%', background: '#ffffff' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="var(--admin-text-muted)" />
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="admin-input"
                style={{ background: '#ffffff' }}
              >
                <option value="All">All Activities</option>
                <option value="lead_student">Lead & Applications</option>
                <option value="document_item">Checklists & Docs</option>
                <option value="fee_payment">Fee Records & Payments</option>
              </select>
            </div>
          </div>

          {/* Timeline List */}
          <div className="admin-card" style={{ padding: '24px 32px' }}>
            {loadingLogs ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader2 size={40} className="animate-spin" color="var(--admin-primary)" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
                No activity logs match your search or filter criteria.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredLogs.map((log, idx) => (
                  <div key={log.id} style={{ display: 'flex', gap: '20px', position: 'relative', paddingBottom: idx === logs.length - 1 ? '0' : '28px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--admin-bg-body)', border: '2px solid var(--admin-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                        {getEntityIcon(log.entity_type)}
                      </div>
                      {idx !== logs.length - 1 && (
                        <div style={{ width: '2px', background: 'var(--admin-border-light)', flex: 1, marginTop: '4px' }}></div>
                      )}
                    </div>

                    <div style={{ flex: 1, paddingTop: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '700', color: 'var(--admin-text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {formatEntityType(log.entity_type)} {log.field_changed ? 'Modified' : 'Updated'}
                          <span className="admin-badge admin-badge-primary">
                            {log.entity_id.substring(0, 8)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                          <Clock size={12} />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>

                      {log.field_changed && (
                        <div style={{ background: 'var(--admin-bg-body)', borderRadius: '8px', padding: '12px 16px', border: '1px solid var(--admin-border-light)', marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldAlert size={14} color="var(--admin-warning)" /> Field Modification Detected: <code style={{ background: 'white', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--admin-border-light)' }}>{log.field_changed}</code>
                          </div>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.85rem' }}>
                            <div style={{ flex: 1, padding: '8px 12px', background: 'var(--admin-danger-bg)', color: 'var(--admin-danger-text)', borderRadius: '6px', border: '1px dashed var(--admin-danger)' }}>
                              <strong>Previous Value:</strong><br />{log.old_value || 'NULL'}
                            </div>
                            <div style={{ color: 'var(--admin-text-muted)' }}>➔</div>
                            <div style={{ flex: 1, padding: '8px 12px', background: 'var(--admin-success-bg)', color: 'var(--admin-success)', borderRadius: '6px', border: '1px dashed var(--admin-success)' }}>
                              <strong>New Value:</strong><br />{log.new_value || 'NULL'}
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <UserCheck size={14} /> Action by: <strong style={{ color: 'var(--admin-text-primary)' }}>{log.staff_users?.name || 'System Auto-Trigger'}</strong> ({log.staff_users?.role || 'System'})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
