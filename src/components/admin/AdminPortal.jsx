import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, UserPlus, DollarSign, History, LogOut, Loader2, Settings, Search, Menu, Bell, Sun, FileText, Globe, MessageSquare } from 'lucide-react';
import DashboardOverview from './DashboardOverview';
import LeadsManager from './LeadsManager';
import StudentChecklistManager from './StudentChecklistManager';
import FinancialLedger from './FinancialLedger';
import ClientsList from './ClientsList';
import DocumentsMasterList from './DocumentsMasterList';
import ActivityTimeline from './ActivityTimeline';
import ConfigurationManager from './ConfigurationManager';
import MasterTemplatesManager from './MasterTemplatesManager';
import NewApplicationModal from './NewApplicationModal';
import { supabase } from '../../lib/supabaseClient';
import '../../admin-theme.css';

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNewAppModal, setShowNewAppModal] = useState(false);

  const [pipelineCount, setPipelineCount] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) return;

        // Fetch staff profile
        const { data: staff, error: staffError } = await supabase
          .from('staff_users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (staffError && staffError.code !== 'PGRST116') throw staffError;

        // Fetch assigned branch if exists
        let branch = null;
        if (staff) {
          const { data: assignment, error: assignmentError } = await supabase
            .from('branch_assignments')
            .select(`
              branch_id,
              branches ( id, name, code )
            `)
            .eq('staff_user_id', staff.id)
            .limit(1)
            .maybeSingle();

          if (assignment && assignment.branches) {
            branch = assignment.branches;
          }
        }
        
        // If super admin and no branch, fetch the first branch in the system to act as HQ
        if (!branch && staff?.role === 'super_admin') {
          const { data: fallbackBranch } = await supabase.from('branches').select('id, name, code').limit(1).single();
          if (fallbackBranch) {
             branch = fallbackBranch;
          }
        }

        setCurrentUser(user);
        setCurrentRole(staff?.role || 'super_admin');
        setCurrentBranch(branch);

        // Fetch counts for sidebar
        let leadsQuery = supabase.from('leads').select('*', { count: 'exact', head: true });
        if (staff?.role === 'branch_admin' && branch) {
          leadsQuery = leadsQuery.eq('assigned_branch_id', branch.id);
        }
        const { count: lCount } = await leadsQuery;
        setPipelineCount(lCount || 0);

        const { data: docsData } = await supabase.from('document_items').select(`
          id,
          checklist_instances(
            student_destinations(
              students(
                branch_id
              )
            )
          )
        `);
        let dCount = 0;
        if (staff?.role === 'branch_admin' && branch) {
          dCount = (docsData || []).filter(d => 
            d.checklist_instances?.student_destinations?.students?.branch_id === branch.id
          ).length;
        } else {
          dCount = (docsData || []).length;
        }
        setDocumentsCount(dCount);

      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUserProfile();
  }, []);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const navigateToStudent = (studentId) => {
    setSelectedStudentId(studentId);
    setActiveTab('application_detail');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <Loader2 className="animate-spin" size={48} color="var(--admin-primary)" />
      </div>
    );
  }

  // Define nav items here so we can remove web_cms
  let navItems = [
    { id: 'dashboard', category: 'OVERVIEW', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'pipeline', category: 'OPERATIONS', label: 'Pipeline', icon: <LayoutDashboard size={18} />, badge: pipelineCount > 0 ? pipelineCount : null },
    { id: 'documents', category: 'OPERATIONS', label: 'Documents', icon: <FileText size={18} />, badge: documentsCount > 0 ? documentsCount : null },
    { id: 'clients', category: 'OPERATIONS', label: 'Clients', icon: <Users size={18} /> },
    { id: 'payments', category: 'COMMERCE', label: 'Payments', icon: <DollarSign size={18} /> },
    { id: 'visa_types', category: 'COMMERCE', label: 'Visa Types', icon: <Globe size={18} /> },
    { id: 'communication', category: 'GROWTH', label: 'Communication', icon: <MessageSquare size={18} /> },
    { id: 'partners', category: 'GROWTH', label: 'Partners', icon: <Users size={18} /> },
    { id: 'reports', category: 'INTELLIGENCE', label: 'Reports', icon: <History size={18} /> },
  ];

  if (currentRole === 'super_admin') {
    navItems.push({ id: 'config', category: 'ADMIN', label: 'Global Setup', icon: <Settings size={18} /> });
    navItems.push({ id: 'templates', category: 'ADMIN', label: 'Checklist Templates', icon: <FileText size={18} /> });
  }

  const groupedNav = navItems.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="admin-portal" style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f9fafb', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Sidebar Navigation */}
      {isSidebarOpen && (
        <aside style={{ 
          width: '260px', 
          backgroundColor: '#111827', 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100vh',
          zIndex: 20,
          borderRight: '1px solid #1f2937'
        }}>
          {/* Logo Area */}
          <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#f59e0b', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem' }}>
              V
            </div>
            <div style={{ fontWeight: '700', fontSize: '1.2rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
              VisaCRM
            </div>
          </div>

          <nav style={{ flex: 1, padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            {Object.entries(groupedNav).map(([category, items]) => (
              <div key={category}>
                <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#6b7280', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '12px' }}>
                  {category}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {items.map((item) => {
                    const isActiveGroup = item.subItems && item.subItems.some(sub => sub.id === activeTab);
                    const isDirectlyActive = activeTab === item.id;
                    const isActive = isActiveGroup || isDirectlyActive;

                    return (
                      <React.Fragment key={item.id}>
                        <button
                          onClick={() => item.subItems ? null : setActiveTab(item.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '8px 12px',
                            background: 'transparent',
                            border: 'none',
                            color: isActive ? '#f3f4f6' : '#9ca3af',
                            cursor: item.subItems ? 'default' : 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            borderRadius: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive && !item.subItems) {
                              e.currentTarget.style.color = '#f3f4f6';
                              e.currentTarget.style.background = '#1f2937';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive && !item.subItems) {
                              e.currentTarget.style.color = '#9ca3af';
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span style={{ background: '#1f2937', color: '#9ca3af', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '12px', fontWeight: '600' }}>
                              {item.badge}
                            </span>
                          )}
                        </button>

                        {item.subItems && item.isExpanded && (
                          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '30px', marginTop: '2px', borderLeft: '1px solid #374151', paddingLeft: '12px', gap: '4px' }}>
                            {item.subItems.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => setActiveTab(sub.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  width: '100%',
                                  padding: '6px 12px',
                                  background: activeTab === sub.id ? '#1f2937' : 'transparent',
                                  border: 'none',
                                  color: activeTab === sub.id ? '#f3f4f6' : '#9ca3af',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: activeTab === sub.id ? '600' : '500',
                                  borderRadius: '6px',
                                  position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                  if (activeTab !== sub.id) {
                                    e.currentTarget.style.color = '#f3f4f6';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (activeTab !== sub.id) {
                                    e.currentTarget.style.color = '#9ca3af';
                                  }
                                }}
                              >
                                {activeTab === sub.id && (
                                  <div style={{ position: 'absolute', left: '-13px', width: '2px', height: '16px', background: '#f59e0b', borderRadius: '0 2px 2px 0' }} />
                                )}
                                {sub.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>
      )}

      {/* Main Content Layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Header */}
        <header style={{ height: '72px', backgroundColor: 'var(--admin-bg-header)', borderBottom: '1px solid var(--admin-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', width: '100%' }}>
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>
                <Menu size={20} />
              </button>
            )}
            
            {/* Minimalist Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--admin-bg-body)', borderRadius: '8px', padding: '10px 16px', width: '400px', border: '1px solid var(--admin-border-light)' }}>
              <Search size={16} color="var(--admin-text-muted)" style={{ marginRight: '10px' }} />
              <input type="text" placeholder="Search applications, clients, payments..." style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.85rem', width: '100%', color: 'var(--admin-text-primary)' }} />
              <div style={{ background: 'white', border: '1px solid var(--admin-border-light)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.65rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>⌘K</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setShowNewAppModal(true)} className="admin-btn admin-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              + New
            </button>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}><Bell size={18} /></button>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}><Sun size={18} /></button>
            <button onClick={handleLogout} title="Logout" style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Dynamic Page Header */}
        <div style={{ padding: '24px 32px 0 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500', marginBottom: '8px' }}>
            <span style={{ textTransform: 'capitalize' }}>Operations</span> / {activeTab.replace('_', ' ')}
          </div>
        </div>

        {/* Main Scrolling Area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {activeTab === 'dashboard' && <DashboardOverview currentRole={currentRole} currentBranch={currentBranch} showToast={showToast} />}
          {activeTab === 'pipeline' && <LeadsManager currentRole={currentRole} currentBranch={currentBranch} currentUser={currentUser} showToast={showToast} />}
          {activeTab === 'application_detail' && <StudentChecklistManager currentRole={currentRole} currentBranch={currentBranch} currentUser={currentUser} showToast={showToast} externalSelectedStudentId={selectedStudentId} setExternalSelectedStudentId={setSelectedStudentId} />}
          {activeTab === 'clients' && <ClientsList currentRole={currentRole} currentBranch={currentBranch} onStudentClick={navigateToStudent} onAddClient={() => setShowNewAppModal(true)} />}
          {activeTab === 'documents' && <DocumentsMasterList currentRole={currentRole} currentBranch={currentBranch} showToast={showToast} onStudentClick={navigateToStudent} />}
          {activeTab === 'payments' && <FinancialLedger currentRole={currentRole} currentBranch={currentBranch} showToast={showToast} />}
          {activeTab === 'reports' && <ActivityTimeline currentRole={currentRole} currentBranch={currentBranch} />}
          {activeTab === 'config' && currentRole === 'super_admin' && <ConfigurationManager showToast={showToast} />}
          {activeTab === 'templates' && currentRole === 'super_admin' && <MasterTemplatesManager showToast={showToast} />}
          
          {['visa_types', 'communication', 'partners'].includes(activeTab) && (
            <div style={{ padding: '60px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <Settings size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>Coming Soon</h2>
              <p style={{ color: '#6b7280', margin: 0 }}>This module is currently under development.</p>
            </div>
          )}
        </main>
      </div>

      {/* Global Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '32px', right: '32px', 
          backgroundColor: toast.type === 'error' ? 'var(--admin-danger)' : 'var(--admin-text-primary)', 
          color: 'white', padding: '12px 24px', borderRadius: '8px', 
          boxShadow: 'var(--admin-shadow-lg)', fontWeight: '500', 
          fontSize: '0.9rem', zIndex: 9999, animation: 'slideIn 0.3s ease-out', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {toast.message}
        </div>
      )}

      {showNewAppModal && (
        <NewApplicationModal 
          onClose={() => setShowNewAppModal(false)}
          onSuccess={(newId) => {
            setShowNewAppModal(false);
            navigateToStudent(newId);
          }}
          currentBranch={currentBranch}
          showToast={showToast}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
