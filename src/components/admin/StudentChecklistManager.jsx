import React, { useState } from 'react';
import { Users, FileCheck, CheckCircle2, AlertCircle, Clock, Plus, ArrowRight, ShieldCheck, FileText, Check, X, Award, Globe, Building2 } from 'lucide-react';

export default function StudentChecklistManager({ currentRole, currentBranch, studentsList, onUpdateStudents }) {
  const isSuperAdmin = currentRole === 'super_admin';

  // State for active student and active destination tab
  const [selectedStudentId, setSelectedStudentId] = useState(studentsList[0]?.id || 'S101');
  const [activeVertical, setActiveVertical] = useState('admission'); // 'admission' or 'visa'

  const selectedStudent = studentsList.find(s => s.id === selectedStudentId) || studentsList[0];
  const activeDestination = selectedStudent?.destinations?.[0] || {
    country: '🇨🇦 Canada',
    course: 'MSc Computer Science (University of Toronto)',
    admissionChecklist: [
      { id: 'doc1', name: 'Undergraduate Degree Transcripts & Certificate', status: 'Received', deadline: '2026-08-01', notes: 'Verified official seal.' },
      { id: 'doc2', name: 'Statement of Purpose (SOP) - Vistara Verified', status: 'Received', deadline: '2026-08-05', notes: 'Approved by Senior Counselor.' },
      { id: 'doc3', name: '2 Academic Letters of Recommendation (LORs)', status: 'Pending', deadline: '2026-08-10', notes: 'Waiting for Professor response.' },
      { id: 'doc4', name: 'IELTS Official Score Card (Overall 7.5+)', status: 'Received', deadline: '2026-08-12', notes: 'Band 8.0 confirmed.' },
      { id: 'doc5', name: 'Updated Professional Resume / CV', status: 'Waived', deadline: '2026-08-15', notes: 'Fresh graduate, waived.' },
    ],
    visaChecklist: [
      { id: 'vdoc1', name: 'Valid Passport Copy (6+ months validity remaining)', status: 'Received', deadline: '2026-08-20', notes: 'Passport valid till 2032.' },
      { id: 'vdoc2', name: 'Guaranteed Investment Certificate (GIC) Proof ($20,635 CAD)', status: 'Pending', deadline: '2026-08-25', notes: 'Student opening Scotiabank GIC account.' },
      { id: 'vdoc3', name: 'First Year Tuition Fee Payment Receipt from University', status: 'Pending', deadline: '2026-08-28', notes: 'Waiting for admission offer letter first.' },
      { id: 'vdoc4', name: 'Upfront Medical Examination Report (eMedical)', status: 'Pending', deadline: '2026-09-01', notes: 'Booked appointment for Aug 18.' },
      { id: 'vdoc5', name: 'Police Clearance Certificate (PCC)', status: 'Received', deadline: '2026-09-05', notes: 'Clean background check.' },
    ]
  };

  const currentChecklist = activeVertical === 'admission' ? activeDestination.admissionChecklist : activeDestination.visaChecklist;

  // Calculate completion percentage
  const completedDocs = currentChecklist.filter(d => d.status === 'Received' || d.status === 'Waived').length;
  const progressPct = Math.round((completedDocs / currentChecklist.length) * 100) || 0;

  const handleStatusToggle = (docId, newStatus) => {
    const updatedStudents = studentsList.map(student => {
      if (student.id !== selectedStudentId) return student;
      const updatedDestinations = student.destinations.map(dest => {
        const targetList = activeVertical === 'admission' ? 'admissionChecklist' : 'visaChecklist';
        const updatedDocs = dest[targetList].map(doc => 
          doc.id === docId ? { ...doc, status: newStatus } : doc
        );
        return { ...dest, [targetList]: updatedDocs };
      });
      return { ...student, destinations: updatedDestinations };
    });
    if (onUpdateStudents) onUpdateStudents(updatedStudents);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'flex-start' }}>
      
      {/* Left Sidebar: Enrolled Students List */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>
              Enrolled Students ({studentsList.length})
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              RLS Filtered to {isSuperAdmin ? 'All Branches' : currentBranch.code}
            </p>
          </div>
          <span style={{ background: '#eff6ff', color: '#0066ff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
            Active
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '640px', overflowY: 'auto' }}>
          {studentsList.map(student => {
            const isSelected = student.id === selectedStudentId;
            return (
              <div 
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  borderLeft: isSelected ? '4px solid #0066ff' : '4px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => !isSelected && (e.currentTarget.style.background = '#f8fafc')}
                onMouseOut={e => !isSelected && (e.currentTarget.style.background = '#ffffff')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.92rem', color: isSelected ? '#0066ff' : '#0f172a' }}>
                    {student.name}
                  </div>
                  <span style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569', fontWeight: '600' }}>
                    {student.branch}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                  {student.destinations[0].country} • {student.destinations[0].course.split('(')[0]}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '999px', fontWeight: '700' }}>
                    Admission: {student.destinations[0].admissionChecklist.filter(d => d.status === 'Received' || d.status === 'Waived').length}/{student.destinations[0].admissionChecklist.length}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#0066ff', background: '#eff6ff', padding: '2px 8px', borderRadius: '999px', fontWeight: '700' }}>
                    Visa: {student.destinations[0].visaChecklist.filter(d => d.status === 'Received' || d.status === 'Waived').length}/{student.destinations[0].visaChecklist.length}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Main Area: Dual-Vertical Checklist Engine */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Student Header Profile & Progress Box */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                  {selectedStudent.name}
                </h2>
                <span style={{ background: '#eff6ff', color: '#0066ff', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={13} /> {selectedStudent.branch}
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                <strong>Target Destination:</strong> {activeDestination.country} — {activeDestination.course}
              </p>
            </div>

            {/* Vertical Switcher Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '6px' }}>
              <button
                onClick={() => setActiveVertical('admission')}
                style={{
                  background: activeVertical === 'admission' ? '#0066ff' : 'transparent',
                  color: activeVertical === 'admission' ? '#ffffff' : '#64748b',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: activeVertical === 'admission' ? '0 4px 12px rgba(0, 102, 255, 0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Award size={16} />
                <span>1. University Admission Vertical</span>
              </button>
              <button
                onClick={() => setActiveVertical('visa')}
                style={{
                  background: activeVertical === 'visa' ? '#0f172a' : 'transparent',
                  color: activeVertical === 'visa' ? '#ffffff' : '#64748b',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: activeVertical === 'visa' ? '0 4px 12px rgba(15, 23, 42, 0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Globe size={16} />
                <span>2. Immigration Visa Vertical</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCheck size={16} color={activeVertical === 'admission' ? '#0066ff' : '#059669'} />
                {activeVertical === 'admission' ? 'University Admission Checklist Progress' : 'Immigration & Consular Visa Checklist Progress'}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: activeVertical === 'admission' ? '#0066ff' : '#059669' }}>
                {completedDocs} of {currentChecklist.length} Verified ({progressPct}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${progressPct}%`, 
                height: '100%', 
                background: activeVertical === 'admission' ? 'linear-gradient(90deg, #0066ff, #60a5fa)' : 'linear-gradient(90deg, #059669, #34d399)',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Document Line Items Table */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '16px 22px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Required Document Line Items (`document_items`)
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Head Team Issue #4: Unique constraint enforced (`instance_id, document_name`)
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 22px' }}>Document Name & Notes</th>
                <th style={{ padding: '14px 22px' }}>Target Deadline</th>
                <th style={{ padding: '14px 22px' }}>Current Status</th>
                <th style={{ padding: '14px 22px', textAlign: 'right' }}>Verify Status</th>
              </tr>
            </thead>
            <tbody>
              {currentChecklist.map((doc, index) => (
                <tr key={doc.id} style={{ borderBottom: index < currentChecklist.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = '#ffffff'}>
                  
                  <td style={{ padding: '16px 22px', maxWidth: '340px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color={doc.status === 'Received' ? '#059669' : doc.status === 'Pending' ? '#f97316' : '#64748b'} />
                      <span>{doc.name}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                      Note: {doc.notes}
                    </div>
                  </td>

                  <td style={{ padding: '16px 22px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#475569', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>
                      <Clock size={13} /> {doc.deadline}
                    </span>
                  </td>

                  <td style={{ padding: '16px 22px' }}>
                    <span style={{ 
                      background: doc.status === 'Received' ? '#ecfdf5' : doc.status === 'Pending' ? '#fff7ed' : doc.status === 'Waived' ? '#f1f5f9' : '#fef2f2', 
                      color: doc.status === 'Received' ? '#059669' : doc.status === 'Pending' ? '#ea580c' : doc.status === 'Waived' ? '#475569' : '#dc2626',
                      border: doc.status === 'Received' ? '1px solid #a7f3d0' : doc.status === 'Pending' ? '1px solid #fed7aa' : '1px solid #cbd5e1',
                      padding: '4px 12px', 
                      borderRadius: '999px', 
                      fontSize: '0.78rem', 
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      {doc.status === 'Received' && <CheckCircle2 size={13} />}
                      {doc.status === 'Pending' && <AlertCircle size={13} />}
                      {doc.status}
                    </span>
                  </td>

                  <td style={{ padding: '16px 22px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleStatusToggle(doc.id, 'Received')}
                        title="Mark Received"
                        style={{ background: doc.status === 'Received' ? '#059669' : '#f0fdf4', color: doc.status === 'Received' ? '#ffffff' : '#059669', border: '1px solid #bbf7d0', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <Check size={13} /> Received
                      </button>
                      <button
                        onClick={() => handleStatusToggle(doc.id, 'Pending')}
                        title="Mark Pending"
                        style={{ background: doc.status === 'Pending' ? '#ea580c' : '#fff7ed', color: doc.status === 'Pending' ? '#ffffff' : '#ea580c', border: '1px solid #fed7aa', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => handleStatusToggle(doc.id, 'Waived')}
                        title="Mark Waived"
                        style={{ background: doc.status === 'Waived' ? '#475569' : '#f1f5f9', color: doc.status === 'Waived' ? '#ffffff' : '#475569', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Waive
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
