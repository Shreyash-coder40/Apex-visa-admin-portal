import React, { useState } from 'react';
import { LayoutDashboard, Users, UserPlus, DollarSign, History, Building2, Shield, LogOut, Sparkles, Globe, ChevronDown, Check, Bell } from 'lucide-react';
import DashboardOverview from './DashboardOverview';
import LeadsManager from './LeadsManager';
import StudentChecklistManager from './StudentChecklistManager';
import FinancialLedger from './FinancialLedger';
import ActivityTimeline from './ActivityTimeline';

export default function AdminPortal({ onExitToPublic }) {
  // Navigation tabs: 'overview', 'leads', 'students', 'ledger', 'activity'
  const [activeTab, setActiveTab] = useState('overview');

  // Role Simulator: 'super_admin' or 'branch_admin'
  const [currentRole, setCurrentRole] = useState('super_admin');

  // Branch Simulator: active branch for branch_admin scope
  const [branches] = useState([
    { code: 'TOR-01', name: 'Downtown Toronto HQ', address: '100 Bay St, Toronto, ON' },
    { code: 'VAN-01', name: 'Vancouver Pacific Hub', address: '800 Burrard St, Vancouver, BC' },
    { code: 'SYD-01', name: 'Sydney Global Branch', address: '200 George St, Sydney, NSW' },
  ]);
  const [currentBranch, setCurrentBranch] = useState(branches[0]);

  // Enrolled students shared state so conversion in LeadsManager appears in StudentChecklistManager
  const [studentsList, setStudentsList] = useState([
    {
      id: 'S101',
      name: 'Alex Rivera',
      phone: '+1 (416) 890–1234',
      email: 'alex.rivera@gmail.com',
      branch: 'TOR-01',
      destinations: [
        {
          country: '🇨🇦 Canada',
          course: 'MSc Computer Science (University of Toronto)',
          targetLevel: 'Post-Graduate',
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
        }
      ]
    },
    {
      id: 'S102',
      name: 'Priya Sharma',
      phone: '+1 (604) 555–0192',
      email: 'priya.sharma99@outlook.com',
      branch: 'TOR-01',
      destinations: [
        {
          country: '🇦🇺 Australia',
          course: 'Master of Data Science (University of Melbourne)',
          targetLevel: 'Post-Graduate',
          admissionChecklist: [
            { id: 'doc6', name: 'Undergraduate Degree Transcripts & Certificate', status: 'Received', deadline: '2026-08-01', notes: 'Verified official seal.' },
            { id: 'doc7', name: 'Statement of Purpose (SOP)', status: 'Received', deadline: '2026-08-05', notes: 'Complete.' },
            { id: 'doc8', name: 'IELTS Score Card', status: 'Received', deadline: '2026-08-10', notes: 'Overall 8.0.' }
          ],
          visaChecklist: [
            { id: 'vdoc6', name: 'Valid Passport Copy', status: 'Received', deadline: '2026-08-20', notes: 'Complete.' },
            { id: 'vdoc7', name: 'Overseas Student Health Cover (OSHC) Proof', status: 'Received', deadline: '2026-08-25', notes: 'Allianz Policy Attached.' }
          ]
        }
      ]
    },
    {
      id: 'S103',
      name: 'Aarav Mehta',
      phone: '+91 98200 12345',
      email: 'aarav.m@tech.in',
      branch: 'VAN-01',
      destinations: [
        {
          country: '🇬🇧 UK',
          course: 'MBA International Business (Imperial College)',
          targetLevel: 'Post-Graduate',
          admissionChecklist: [
            { id: 'doc9', name: 'Undergraduate Transcripts & Degree', status: 'Received', deadline: '2026-08-01', notes: 'Complete.' },
            { id: 'doc10', name: 'GMAT Official Score Card', status: 'Pending', deadline: '2026-08-15', notes: 'Booked exam for next week.' }
          ],
          visaChecklist: [
            { id: 'vdoc8', name: 'Valid Passport Copy', status: 'Received', deadline: '2026-08-20', notes: 'Complete.' },
            { id: 'vdoc9', name: 'CAS (Confirmation of Acceptance for Studies) Number', status: 'Pending', deadline: '2026-09-01', notes: 'Awaiting university letter.' }
          ]
        }
      ]
    }
  ]);

  const handleConvertToStudent = (convertedLead) => {
    const newStudent = {
      id: `S_${Date.now().toString().slice(-4)}`,
      name: convertedLead.name,
      phone: convertedLead.phone,
      email: convertedLead.email,
      branch: convertedLead.assignedBranch || currentBranch.code,
      destinations: [
        {
          country: convertedLead.interestedCountry,
          course: convertedLead.intendedCourse,
          targetLevel: convertedLead.educationLevel,
          admissionChecklist: [
            { id: `doc_${Date.now()}_1`, name: 'Academic Transcripts & Degree Certificate', status: 'Pending', deadline: '2026-08-20', notes: 'Automatically spawned via database trigger.' },
            { id: `doc_${Date.now()}_2`, name: 'Statement of Purpose (SOP)', status: 'Pending', deadline: '2026-08-25', notes: 'Awaiting student draft.' },
            { id: `doc_${Date.now()}_3`, name: 'IELTS / English Proficiency Score', status: 'Pending', deadline: '2026-08-28', notes: 'Required before university submission.' }
          ],
          visaChecklist: [
            { id: `vdoc_${Date.now()}_1`, name: 'Valid Passport Copy (All pages)', status: 'Pending', deadline: '2026-09-01', notes: 'Must have 6+ months validity.' },
            { id: `vdoc_${Date.now()}_2`, name: 'Financial Proof / Tuition Fee Receipt', status: 'Pending', deadline: '2026-09-05', notes: 'Awaiting bank confirmation.' },
            { id: `vdoc_${Date.now()}_3`, name: 'Medical & Police Clearance (PCC)', status: 'Pending', deadline: '2026-09-10', notes: 'Schedule appointment.' }
          ]
        }
      ]
    };
    setStudentsList([newStudent, ...studentsList]);
  };

  const navItems = [
    { id: 'overview', label: 'Operations Command', icon: <LayoutDashboard size={18} /> },
    { id: 'leads', label: 'Lead Triage Pool', icon: <UserPlus size={18} /> },
    { id: 'students', label: 'Students & Checklists', icon: <Users size={18} /> },
    { id: 'ledger', label: 'Financial Ledger', icon: <DollarSign size={18} /> },
    { id: 'activity', label: 'Immutable Audit Trail', icon: <History size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Sidebar Navigation */}
      <aside style={{ 
        width: '270px', 
        background: '#0f172a', 
        color: '#ffffff', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        padding: '24px 16px',
        borderRight: '1px solid #1e293b',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxSizing: 'border-box'
      }}>
        <div>
          {/* Brand Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px', marginBottom: '32px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #0066ff 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem', color: '#ffffff', boxShadow: '0 4px 12px rgba(0, 102, 255, 0.4)' }}>
              V
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.15rem', letterSpacing: '-0.3px', fontFamily: 'Outfit, sans-serif' }}>Vistara CRM</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Apex Visa Admin</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: isActive ? '#0066ff' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    fontWeight: isActive ? '700' : '600',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? '0 4px 14px rgba(0, 102, 255, 0.35)' : 'none'
                  }}
                  onMouseOver={e => !isActive && (e.currentTarget.style.color = '#ffffff')}
                  onMouseOut={e => !isActive && (e.currentTarget.style.color = '#94a3b8')}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Scope Card & Exit to Public Website */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={13} color="#60a5fa" /> Active Security Role
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#ffffff', textTransform: 'capitalize' }}>
              {currentRole.replace('_', ' ')}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
              {currentRole === 'super_admin' ? 'All 3 Branches (Global)' : currentBranch.code}
            </div>
          </div>

          <button
            onClick={onExitToPublic}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            <Globe size={16} />
            <span>Exit to Public Website</span>
          </button>

        </div>
      </aside>

      {/* Main Container Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        
        {/* Top Header Bar with Role Switcher & Branch Selector */}
        <header style={{ 
          background: '#ffffff', 
          borderBottom: '1px solid #e2e8f0', 
          padding: '16px 32px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
            <span style={{ fontSize: '0.8rem', color: '#64748b', background: '#f1f5f9', padding: '3px 10px', borderRadius: '6px', fontWeight: '600' }}>
              PRD v1.0 & Head Team Review Compliant
            </span>
          </div>

          {/* Interactive Role Switcher & Branch Selector (Demonstrates RLS Simulation) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Branch Selector (Active if Branch Admin or Super Admin inspection) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} color="#64748b" />
              <select
                value={currentBranch.code}
                onChange={(e) => {
                  const b = branches.find(br => br.code === e.target.value);
                  if (b) setCurrentBranch(b);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {branches.map(b => (
                  <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>

            {/* Role Switcher Button */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '3px' }}>
              <button
                onClick={() => setCurrentRole('super_admin')}
                style={{
                  background: currentRole === 'super_admin' ? '#0066ff' : 'transparent',
                  color: currentRole === 'super_admin' ? '#ffffff' : '#64748b',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Super Admin
              </button>
              <button
                onClick={() => setCurrentRole('branch_admin')}
                style={{
                  background: currentRole === 'branch_admin' ? '#10b981' : 'transparent',
                  color: currentRole === 'branch_admin' ? '#ffffff' : '#64748b',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Branch Admin
              </button>
            </div>

          </div>
        </header>

        {/* Dynamic Tab Views */}
        <div style={{ padding: '32px', flex: 1 }}>
          {activeTab === 'overview' && (
            <DashboardOverview 
              currentRole={currentRole} 
              currentBranch={currentBranch} 
              onNavigateTab={(tab) => setActiveTab(tab)} 
            />
          )}

          {activeTab === 'leads' && (
            <LeadsManager 
              currentRole={currentRole} 
              currentBranch={currentBranch}
              onConvertToStudent={handleConvertToStudent}
            />
          )}

          {activeTab === 'students' && (
            <StudentChecklistManager 
              currentRole={currentRole} 
              currentBranch={currentBranch}
              studentsList={studentsList}
              onUpdateStudents={(list) => setStudentsList(list)}
            />
          )}

          {activeTab === 'ledger' && (
            <FinancialLedger 
              currentRole={currentRole} 
              currentBranch={currentBranch} 
            />
          )}

          {activeTab === 'activity' && (
            <ActivityTimeline 
              currentRole={currentRole} 
              currentBranch={currentBranch} 
            />
          )}
        </div>

      </main>

    </div>
  );
}
