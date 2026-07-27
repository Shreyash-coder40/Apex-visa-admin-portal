import React, { useState, useEffect } from 'react';
import { Users, FileCheck, CheckCircle2, AlertCircle, Clock, Plus, ArrowRight, ShieldCheck, FileText, Check, X, Award, Globe, Building2, Loader2, DollarSign, Download, MessageSquare, MoreHorizontal, Calendar, MapPin, Key } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import StudentTimelineView from './StudentTimelineView';

export default function StudentChecklistManager({ currentRole, currentBranch, showToast, externalSelectedStudentId, setExternalSelectedStudentId }) {
  const isSuperAdmin = currentRole === 'super_admin';
  const [studentsList, setStudentsList] = useState([]);
  const [localSelectedStudentId, setLocalSelectedStudentId] = useState(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState(null);
  const [activeVertical, setActiveVertical] = useState('admission');
  const [loading, setLoading] = useState(true);

  const selectedStudentId = externalSelectedStudentId || localSelectedStudentId;

  // Destination Modal States
  const [showDestModal, setShowDestModal] = useState(false);
  const [newDestCountry, setNewDestCountry] = useState('');
  const [newDestLevel, setNewDestLevel] = useState('');

  // Reassignment Modal States
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [branchesList, setBranchesList] = useState([]);
  const [newBranchId, setNewBranchId] = useState('');

  // Edit Profile Modal States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({});

  // Request Document Modal States
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocNotes, setNewDocNotes] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [currentRole, currentBranch]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
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
      setStudentsList(data || []);

      if (isSuperAdmin) {
        const { data: bData } = await supabase.from('branches').select('*').eq('is_active', true).order('name');
        if (bData) setBranchesList(bData);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = studentsList.find(s => s.id === selectedStudentId);
  const primaryDestination = selectedStudent?.student_destinations?.find(d => d.id === selectedDestinationId) || selectedStudent?.student_destinations?.[0];
  const currentChecklistInstance = primaryDestination?.checklist_instances?.find(c => c.vertical === activeVertical);
  const currentChecklist = currentChecklistInstance?.document_items || [];

  const completedDocs = currentChecklist.filter(d => d.status === 'Received' || d.status === 'Waived').length;
  const progressPct = currentChecklist.length > 0 ? Math.round((completedDocs / currentChecklist.length) * 100) : 0;

  const handleStatusToggle = async (docId, newStatus) => {
    try {
      const { error } = await supabase
        .from('document_items')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', docId);

      if (error) throw error;
      if (showToast) showToast(`Document marked as ${newStatus}`);
      await fetchStudents(); 
    } catch (err) {
      console.error('Error updating checklist:', err);
      if (showToast) showToast('Failed to update checklist status.', 'error');
    }
  };

  const allDocs = primaryDestination?.checklist_instances?.flatMap(c => c.document_items) || [];
  const docsReceived = allDocs.filter(d => d.status === 'Received' || d.status === 'Waived').length;
  const docsStatus = allDocs.length === 0 ? 'Pending' : (docsReceived === allDocs.length ? 'Completed' : 'In Progress');
  
  const admissionChecklist = primaryDestination?.checklist_instances?.find(c => c.vertical === 'admission');
  const visaChecklist = primaryDestination?.checklist_instances?.find(c => c.vertical === 'visa');

  const stages = [
    { title: 'Application Created', status: 'Completed', subtitle: new Date(selectedStudent?.created_at).toLocaleDateString() },
    { title: 'Document Collection', status: docsStatus, subtitle: `${docsReceived} of ${allDocs.length} approved` },
    { title: 'Admission Process', status: admissionChecklist?.status || 'Pending', id: admissionChecklist?.id, isEditable: !!admissionChecklist?.id },
    { title: 'Visa Approval', status: visaChecklist?.status || 'Pending', id: visaChecklist?.id, isEditable: !!visaChecklist?.id }
  ];

  const handleUpdateChecklistStatus = async (checklistId, newStatus) => {
    try {
      const { error } = await supabase
        .from('checklist_instances')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', checklistId);
      if (error) throw error;
      if (showToast) showToast(`Stage marked as ${newStatus}`);
      await fetchStudents();
    } catch (err) {
      console.error('Error updating stage:', err);
      if (showToast) showToast('Failed to update stage.', 'error');
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const { error } = await supabase
        .from('students')
        .update({ invite_code: code })
        .eq('id', selectedStudentId);

      if (error) throw error;
      
      if (showToast) {
        showToast(`Invite Code Generated: ${code}. Share this with the student.`, 'success');
      }
      await fetchStudents();
    } catch (err) {
      console.error('Error generating invite:', err);
      if (showToast) showToast('Failed to generate invite.', 'error');
    }
  };

  const handleCreateDestination = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('student_destinations').insert({
        student_id: selectedStudentId,
        destination_country: newDestCountry,
        target_education_level: newDestLevel,
        status: 'Active'
      });
      if (error) throw error;
      setShowDestModal(false);
      setNewDestCountry('');
      setNewDestLevel('');
      if (showToast) showToast("Destination added successfully.");
      await fetchStudents();
    } catch (err) {
      console.error('Error adding destination:', err);
      if (showToast) showToast('Failed to add destination.', 'error');
    }
  };

  const handleReassignBranch = async (e) => {
    e.preventDefault();
    if (!newBranchId) return;
    try {
      const { error } = await supabase.from('students')
        .update({ branch_id: newBranchId })
        .eq('id', selectedStudentId);
      
      if (error) throw error;
      setShowReassignModal(false);
      if (showToast) showToast("Student reassigned successfully.");
      await fetchStudents();
    } catch (err) {
      console.error('Error reassigning branch:', err);
      if (showToast) showToast('Failed to reassign branch.', 'error');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('students')
        .update({
          date_of_birth: editProfileForm.date_of_birth || null,
          gender: editProfileForm.gender || null,
          marital_status: editProfileForm.marital_status || null,
          nationality: editProfileForm.nationality || null,
          passport_number: editProfileForm.passport_number || null,
          passport_expiry: editProfileForm.passport_expiry || null,
          address: editProfileForm.address || null,
          highest_qualification: editProfileForm.highest_qualification || null,
          english_test_type: editProfileForm.english_test_type || null,
          english_overall_score: editProfileForm.english_overall_score || null,
        })
        .eq('id', selectedStudentId);

      if (error) throw error;
      if (showToast) showToast('Profile updated successfully!');
      setShowEditProfileModal(false);
      await fetchStudents();
    } catch (err) {
      console.error('Error updating profile:', err);
      if (showToast) showToast('Failed to update profile.', 'error');
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!currentChecklistInstance?.id) {
      if (showToast) showToast('No active checklist stage available to add documents to. Create a destination first.', 'error');
      return;
    }
    
    try {
      const { error } = await supabase.from('document_items').insert({
        instance_id: currentChecklistInstance.id,
        document_name: newDocName,
        notes: newDocNotes,
        status: 'Pending',
        is_required: true
      });
      if (error) throw error;
      
      setShowAddDocModal(false);
      setNewDocName('');
      setNewDocNotes('');
      if (showToast) showToast('Document requested successfully.');
      await fetchStudents();
    } catch (err) {
      console.error('Error requesting document:', err);
      if (showToast) showToast('Failed to request document.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <Loader2 size={40} className="animate-spin" color="var(--admin-primary)" />
      </div>
    );
  }

  if (studentsList.length === 0) {
    return (
      <div style={{ padding: '32px' }}>
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '40px', textAlign: 'center', border: '1px solid var(--admin-border-light)' }}>
          <AlertCircle size={40} color="var(--admin-text-muted)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.2rem', color: 'var(--admin-text-primary)', margin: '0 0 8px 0' }}>No Clients Found</h2>
          <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>Convert a lead to a student in the Pipeline to view details.</p>
        </div>
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div style={{ padding: '32px' }}>
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '40px', textAlign: 'center', border: '1px solid var(--admin-border-light)' }}>
          <Users size={40} color="var(--admin-text-muted)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.2rem', color: 'var(--admin-text-primary)', margin: '0 0 8px 0' }}>No Application Selected</h2>
          <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>Please select an application from the Clients directory or Pipeline to view full details.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '8px' }}>
          Applications / APP-{selectedStudent?.id?.substring(0, 4).toUpperCase() || 'ID'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827', margin: '0 0 16px 0', letterSpacing: '-0.02em', fontFamily: '"Inter", sans-serif' }}>
              {selectedStudent?.name || selectedStudent?.leads?.name || 'Unnamed Client'} — {primaryDestination?.target_education_level || 'No Level'} ({primaryDestination?.destination_country || 'No Destination'})
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: '600' }}>
                 <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }}></div>
                 {primaryDestination?.status || 'Active'}
               </div>
               <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                 Created on {new Date(selectedStudent?.created_at).toLocaleDateString()}
               </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => { setEditProfileForm(selectedStudent || {}); setShowEditProfileModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--admin-bg-body)', border: '1px solid var(--admin-border-light)', borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-primary)', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              Edit Profile
            </button>
            <button onClick={handleGenerateInvite} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', color: '#000', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <Key size={16} /> {selectedStudent?.invite_code ? `Code: ${selectedStudent.invite_code}` : 'Generate Invite'}
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', color: '#374151', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <MessageSquare size={16} /> Message client
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', color: '#374151', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <Download size={16} /> Download file
            </button>
            <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', color: '#374151', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          
          {/* Left Column (Applicant Info & Docs) */}
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Applicant Information Card */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#111827' }}>Applicant information</h3>
                <button onClick={() => setShowDestModal(true)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                   <MoreHorizontal size={18} />
                </button>
              </div>
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'y-32px x-24px', rowGap: '32px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>FULL NAME</div>
                    <div style={{ fontSize: '0.95rem', color: '#111827', fontWeight: '500' }}>{selectedStudent?.name || selectedStudent?.leads?.name || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>DATE OF BIRTH</div>
                    <div style={{ fontSize: '0.95rem', color: '#111827', fontWeight: '500' }}>{selectedStudent?.date_of_birth || selectedStudent?.leads?.date_of_birth || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>NATIONALITY</div>
                    <div style={{ fontSize: '0.95rem', color: '#111827', fontWeight: '500' }}>{selectedStudent?.nationality || selectedStudent?.leads?.nationality || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>PASSPORT NO. (EXPIRY)</div>
                    <div style={{ fontSize: '0.95rem', color: '#111827', fontWeight: '500' }}>{selectedStudent?.passport_number ? `${selectedStudent.passport_number} (${selectedStudent.passport_expiry || 'No Expiry'})` : selectedStudent?.leads?.passport_number || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>GENDER / MARITAL</div>
                    <div style={{ fontSize: '0.95rem', color: '#111827', fontWeight: '500' }}>{selectedStudent?.gender ? `${selectedStudent.gender} / ${selectedStudent.marital_status || 'Unknown'}` : 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>PHONE</div>
                    <div style={{ fontSize: '0.95rem', color: '#111827', fontWeight: '500' }}>{selectedStudent?.phone || selectedStudent?.leads?.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>EMAIL</div>
                    <div style={{ fontSize: '0.95rem', color: '#111827', fontWeight: '500' }}>{selectedStudent?.email || selectedStudent?.leads?.email || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>ACADEMIC PROFILE</div>
                    <div style={{ fontSize: '0.95rem', color: '#111827', fontWeight: '500' }}>{selectedStudent?.highest_qualification || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>ENGLISH TEST</div>
                    <div style={{ fontSize: '0.95rem', color: '#111827', fontWeight: '500' }}>{selectedStudent?.english_test_type ? `${selectedStudent.english_test_type} (${selectedStudent.english_overall_score || '-'})` : 'Not provided'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>PERMANENT ADDRESS</div>
                    <div style={{ fontSize: '0.95rem', color: '#111827', fontWeight: '500' }}>{selectedStudent?.address || 'Not provided'}</div>
                  </div>
              </div>
            </div>

            {/* Documents Card */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#111827' }}>Documents</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>{completedDocs} of {currentChecklist.length || 0} approved</div>
                  <button 
                    onClick={() => setShowAddDocModal(true)}
                    style={{ background: 'var(--admin-bg-body)', border: '1px solid var(--admin-border-light)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--admin-text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} /> Request Document
                  </button>
                  <button 
                    onClick={() => {
                      if (!selectedStudent?.invite_code) {
                        showToast('Please generate an invite code first', 'error');
                        return;
                      }
                      const link = `${window.location.origin}/upload/${selectedStudent.invite_code}`;
                      navigator.clipboard.writeText(link);
                      if (showToast) showToast('Secure Upload Link copied to clipboard!');
                    }}
                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={14} /> Copy Upload Link
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {currentChecklist.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>No documents configured for this checklist.</div>
                ) : currentChecklist.map((doc, idx) => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: idx !== currentChecklist.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontWeight: '700', fontSize: '0.7rem' }}>
                        DOC
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.95rem', marginBottom: '4px' }}>{doc.document_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Status: {doc.status}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: doc.status === 'Received' ? '#ecfdf5' : doc.status === 'Pending' ? '#fffbeb' : '#fef2f2', color: doc.status === 'Received' ? '#059669' : doc.status === 'Pending' ? '#d97706' : '#dc2626', padding: '4px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: '600' }}>
                         {doc.status}
                      </div>
                      
                      {doc.file_url && (
                        <button onClick={async () => {
                          try {
                            const { data, error } = await supabase.storage.from('student_documents').createSignedUrl(doc.file_url, 60);
                            if (error) throw error;
                            if (data?.signedUrl) {
                              window.open(data.signedUrl, '_blank');
                            }
                          } catch (err) {
                            console.error('Error opening file:', err);
                            if (showToast) showToast('Failed to open document. It may have been removed.', 'error');
                          }
                        }} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', color: '#0f172a', cursor: 'pointer' }}>
                          View PDF
                        </button>
                      )}

                      <select 
                        value={doc.status}
                        onChange={(e) => handleStatusToggle(doc.id, e.target.value)}
                        style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '2px 4px', fontSize: '0.75rem', color: '#4b5563', cursor: 'pointer' }}
                      >
                         <option value="Pending">Pending</option>
                         <option value="Received">Received</option>
                         <option value="Rejected">Rejected</option>
                         <option value="Waived">Waived</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column (Timeline & Finances) */}
          <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Application Milestones Card */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '24px' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '1.05rem', fontWeight: '700', color: '#111827' }}>Application milestones</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: '#e5e7eb', zIndex: 0 }}></div>
                
                {stages.map((stage, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1, paddingBottom: idx !== stages.length - 1 ? '24px' : '0' }}>
                     <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: stage.status === 'Completed' ? '#059669' : '#ffffff', border: `2px solid ${stage.status === 'Completed' ? '#059669' : stage.status === 'In Progress' ? '#f59e0b' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                        {stage.status === 'Completed' && <Check size={10} color="#ffffff" strokeWidth={3} />}
                     </div>
                     <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem', marginBottom: '4px' }}>{stage.title}</div>
                       <div style={{ color: '#6b7280', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                         <span>{stage.subtitle || stage.status}</span>
                         {stage.isEditable && (
                            <select 
                              value={stage.status}
                              onChange={(e) => handleUpdateChecklistStatus(stage.id, e.target.value)}
                              style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '2px 4px', fontSize: '0.75rem', color: '#4b5563', cursor: 'pointer', marginLeft: '8px' }}
                            >
                               <option value="Pending">Pending</option>
                               <option value="In Progress">In Progress</option>
                               <option value="Completed">Completed</option>
                            </select>
                         )}
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary Card */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#111827' }}>Financial Ledger</h3>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(!selectedStudent?.fee_records || selectedStudent.fee_records.length === 0) ? (
                   <div style={{ color: '#6b7280', fontSize: '0.9rem', textAlign: 'center' }}>No fee records found.</div>
                ) : selectedStudent.fee_records.map(record => (
                  <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: '#4b5563', fontWeight: '600' }}>{record.fee_types?.name || 'Standard Fee'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Status: {record.status}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>
                        {record.currency} {record.total_amount}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: record.balance > 0 ? '#dc2626' : '#059669', fontWeight: '600' }}>
                        Bal: {record.currency} {record.balance}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
      </div>

      {/* Floating Chat Button */}
      <div style={{ position: 'fixed', bottom: '32px', right: '32px', width: '56px', height: '56px', borderRadius: '50%', background: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)', cursor: 'pointer', zIndex: 100 }}>
         <MessageSquare size={24} />
      </div>

      {/* Modals remain mostly the same structurally, just styling updates */}
      {showDestModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '400px', padding: 0, overflow: 'hidden' }}>
            <div className="admin-card-header" style={{ padding: '20px 24px', background: 'var(--admin-bg-body)', margin: 0 }}>
              <h3 className="admin-card-title" style={{ margin: 0 }}>Add New Destination</h3>
              <button onClick={() => setShowDestModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--admin-text-muted)" /></button>
            </div>
            <form onSubmit={handleCreateDestination} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Country</label>
                <input required className="admin-input" value={newDestCountry} onChange={e => setNewDestCountry(e.target.value)} placeholder="e.g. Canada" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Education Level</label>
                <select required className="admin-input" value={newDestLevel} onChange={e => setNewDestLevel(e.target.value)}>
                  <option value="" disabled>Select Level...</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Diploma">Diploma</option>
                </select>
              </div>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '12px', marginTop: '10px', width: '100%' }}>
                Add Destination
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN BRANCH MODAL */}
      {showReassignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '400px', padding: 0, overflow: 'hidden' }}>
            <div className="admin-card-header" style={{ padding: '20px 24px', background: 'var(--admin-bg-body)', margin: 0 }}>
              <h3 className="admin-card-title" style={{ margin: 0 }}>Reassign Branch</h3>
              <button onClick={() => setShowReassignModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><X size={20} color="var(--admin-text-muted)" /></button>
            </div>
            <form onSubmit={handleReassignBranch} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--admin-text-secondary)' }}>Select a new branch for <strong>{selectedStudent?.name}</strong>. Their data and checklists will transfer immediately.</p>
              
              <select
                required
                className="admin-input"
                value={newBranchId}
                onChange={e => setNewBranchId(e.target.value)}
              >
                <option value="" disabled>Select a Branch...</option>
                {branchesList.map(b => (
                  <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                ))}
              </select>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowReassignModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
                <button type="submit" disabled={!newBranchId} className="admin-btn admin-btn-primary" style={{ opacity: newBranchId ? 1 : 0.6, cursor: newBranchId ? 'pointer' : 'not-allowed' }}>Confirm Reassign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto' }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '600px', padding: 0, overflow: 'hidden', margin: '40px auto' }}>
            <div className="admin-card-header" style={{ padding: '20px 24px', background: 'var(--admin-bg-body)', margin: 0, display: 'flex', justifyContent: 'space-between' }}>
              <h3 className="admin-card-title" style={{ margin: 0 }}>Edit Full Profile</h3>
              <button onClick={() => setShowEditProfileModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><X size={20} color="var(--admin-text-muted)" /></button>
            </div>
            <form onSubmit={handleUpdateProfile} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              <h4 style={{ margin: '0 0 -8px 0', fontSize: '0.95rem', color: 'var(--admin-primary)' }}>Personal Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Date of Birth</label>
                  <input type="date" className="admin-input" value={editProfileForm.date_of_birth || ''} onChange={e => setEditProfileForm({...editProfileForm, date_of_birth: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Nationality</label>
                  <input className="admin-input" value={editProfileForm.nationality || ''} onChange={e => setEditProfileForm({...editProfileForm, nationality: e.target.value})} placeholder="e.g. Indian" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Gender</label>
                  <select className="admin-input" value={editProfileForm.gender || ''} onChange={e => setEditProfileForm({...editProfileForm, gender: e.target.value})}>
                    <option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Marital Status</label>
                  <select className="admin-input" value={editProfileForm.marital_status || ''} onChange={e => setEditProfileForm({...editProfileForm, marital_status: e.target.value})}>
                    <option value="">Select...</option><option value="Single">Single</option><option value="Married">Married</option>
                  </select>
                </div>
              </div>

              <h4 style={{ margin: '16px 0 -8px 0', fontSize: '0.95rem', color: 'var(--admin-primary)' }}>Travel & Identity</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Passport Number</label>
                  <input className="admin-input" value={editProfileForm.passport_number || ''} onChange={e => setEditProfileForm({...editProfileForm, passport_number: e.target.value})} placeholder="A1234567" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Passport Expiry</label>
                  <input type="date" className="admin-input" value={editProfileForm.passport_expiry || ''} onChange={e => setEditProfileForm({...editProfileForm, passport_expiry: e.target.value})} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Permanent Address</label>
                  <textarea className="admin-input" value={editProfileForm.address || ''} onChange={e => setEditProfileForm({...editProfileForm, address: e.target.value})} rows={2} placeholder="Full address" />
                </div>
              </div>

              <h4 style={{ margin: '16px 0 -8px 0', fontSize: '0.95rem', color: 'var(--admin-primary)' }}>Academic & Language</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Highest Qualification</label>
                  <input className="admin-input" value={editProfileForm.highest_qualification || ''} onChange={e => setEditProfileForm({...editProfileForm, highest_qualification: e.target.value})} placeholder="e.g. Bachelor of Technology (2024)" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>English Test</label>
                  <select className="admin-input" value={editProfileForm.english_test_type || ''} onChange={e => setEditProfileForm({...editProfileForm, english_test_type: e.target.value})}>
                    <option value="">Select...</option><option value="IELTS">IELTS</option><option value="PTE">PTE</option><option value="TOEFL">TOEFL</option><option value="Duolingo">Duolingo</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Overall Score</label>
                  <input className="admin-input" value={editProfileForm.english_overall_score || ''} onChange={e => setEditProfileForm({...editProfileForm, english_overall_score: e.target.value})} placeholder="e.g. 7.5" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowEditProfileModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST DOCUMENT MODAL */}
      {showAddDocModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '400px', padding: 0, overflow: 'hidden' }}>
            <div className="admin-card-header" style={{ padding: '20px 24px', background: 'var(--admin-bg-body)', margin: 0 }}>
              <h3 className="admin-card-title" style={{ margin: 0 }}>Request Document</h3>
              <button onClick={() => setShowAddDocModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--admin-text-muted)" /></button>
            </div>
            <form onSubmit={handleAddDocument} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Document Name</label>
                <input required className="admin-input" value={newDocName} onChange={e => setNewDocName(e.target.value)} placeholder="e.g. 10th Marksheet" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Instructions for Student (Optional)</label>
                <textarea className="admin-input" value={newDocNotes} onChange={e => setNewDocNotes(e.target.value)} placeholder="e.g. Please upload a clear PDF" rows={3} />
              </div>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '12px', marginTop: '10px', width: '100%' }}>
                Add Request
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
