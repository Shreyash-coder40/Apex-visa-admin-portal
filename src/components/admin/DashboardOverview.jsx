import React, { useState, useEffect } from 'react';
import { Users, UserPlus, CheckCircle2, DollarSign, ArrowUpRight, TrendingUp, AlertCircle, ShieldCheck, Loader2, Clock, FileText, ArrowRight, Search } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function DashboardOverview({ currentRole, currentBranch, onNavigateTab }) {
  const isSuperAdmin = currentRole === 'super_admin';
  
  const [stats, setStats] = useState({
    activeStudents: 0,
    unassignedLeads: 0,
    totalLeads: 0,
    pendingChecklists: 0,
    completedChecklists: 0,
    totalRevenue: 0
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [deadlineSearch, setDeadlineSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const filteredDeadlines = upcomingDeadlines.filter(doc => {
    if (!deadlineSearch) return true;
    const term = deadlineSearch.toLowerCase();
    const docName = doc.document_name || '';
    const studentName = doc.checklist_instances?.student_destinations?.students?.name || '';
    return docName.toLowerCase().includes(term) || studentName.toLowerCase().includes(term);
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });

        const { count: unassignedLeadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .is('assigned_branch_id', null);

        const { count: totalLeadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true });

        const { count: pendingChecklistCount } = await supabase
          .from('checklists')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending');

        const { count: completedChecklistCount } = await supabase
          .from('checklists')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Completed');

        const { data: fees } = await supabase
          .from('fee_records')
          .select('amount_paid');
          
        const revenue = (fees || []).reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0);

        setStats({
          activeStudents: studentsCount || 0,
          unassignedLeads: unassignedLeadsCount || 0,
          totalLeads: totalLeadsCount || 0,
          pendingChecklists: pendingChecklistCount || 0,
          completedChecklists: completedChecklistCount || 0,
          totalRevenue: revenue
        });

        // Fetch upcoming deadlines
        const { data: docs } = await supabase
          .from('document_items')
          .select(`
            id, document_name, deadline_date, status, 
            checklist_instances (
              vertical,
              student_destinations (
                students (name)
              )
            )
          `)
          .eq('status', 'Pending')
          .not('deadline_date', 'is', null)
          .order('deadline_date', { ascending: true })
          .limit(5);

        setUpcomingDeadlines(docs || []);

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [currentRole, currentBranch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '0', maxWidth: '100%', margin: '0 auto' }}>
      
      {/* Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--admin-text-primary)' }}>
            {isSuperAdmin ? 'Global Operations Command Center' : `${currentBranch?.name || 'Branch'} Dashboard`}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-text-secondary)', fontSize: '0.9rem' }}>
            <span className={`admin-badge ${isSuperAdmin ? 'admin-badge-primary' : 'admin-badge-success'}`}>
              <ShieldCheck size={12} style={{ marginRight: '4px' }} />
              {isSuperAdmin ? 'Super Admin Oversight' : 'Branch Admin Scope'}
            </span>
            <span>• Row-Level Security Active</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={40} className="animate-spin" color="var(--admin-primary)" />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            
            {/* Metric 1 */}
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--admin-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-primary)' }}>
                  <Users size={20} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--admin-text-primary)', letterSpacing: '-0.03em' }}>
                {stats.activeStudents}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', fontWeight: '500' }}>
                Active Enrolled Clients
              </div>
            </div>

            {/* Metric 2 */}
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--admin-warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-warning-text)' }}>
                  <UserPlus size={20} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--admin-text-primary)', letterSpacing: '-0.03em' }}>
                {stats.unassignedLeads}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', fontWeight: '500' }}>
                Student Leads
              </div>
            </div>

            {/* Metric 3 */}
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--admin-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-success-text)' }}>
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--admin-text-primary)', letterSpacing: '-0.03em' }}>
                {stats.pendingChecklists}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', fontWeight: '500' }}>
                Pending Document Tasks
              </div>
            </div>

            {/* Metric 4 */}
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-secondary)' }}>
                  <DollarSign size={20} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--admin-text-primary)', letterSpacing: '-0.03em' }}>
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', fontWeight: '500' }}>
                Total Revenue Collected
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Student Leads Funnel */}
            <div className="admin-card" style={{ padding: 0 }}>
              <div className="admin-card-header" style={{ padding: '24px', borderBottom: '1px solid var(--admin-border-light)' }}>
                <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="var(--admin-primary)" /> Student Leads Conversion
                </h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
                <div style={{ padding: '16px 0', borderBottom: '1px solid var(--admin-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '4px', height: '40px', background: 'var(--admin-text-muted)', borderRadius: '4px' }}></div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Total Leads</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--admin-text-primary)' }}>{stats.totalLeads}</div>
                    </div>
                  </div>
                  <Users size={20} color="var(--admin-text-muted)" />
                </div>
                
                <div style={{ padding: '16px 0', borderBottom: '1px solid var(--admin-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '4px', height: '40px', background: 'var(--admin-primary)', borderRadius: '4px' }}></div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-primary)', textTransform: 'uppercase' }}>Converted to Clients</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--admin-text-primary)' }}>{stats.activeStudents}</div>
                    </div>
                  </div>
                  <UserPlus size={20} color="var(--admin-primary)" />
                </div>
                
                <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '4px', height: '40px', background: 'var(--admin-success)', borderRadius: '4px' }}></div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-success)', textTransform: 'uppercase' }}>Completed Checklists</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--admin-text-primary)' }}>{stats.completedChecklists}</div>
                    </div>
                  </div>
                  <CheckCircle2 size={20} color="var(--admin-success)" />
                </div>
              </div>
            </div>

            {/* Critical Deadlines */}
            <div className="admin-card" style={{ padding: 0 }}>
              <div className="admin-card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--admin-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <AlertCircle size={18} color="var(--admin-danger)" /> Document Deadlines
                </h3>
              </div>
              
              <div style={{ padding: '12px 20px', background: 'var(--admin-bg-body)', borderBottom: '1px solid var(--admin-border-light)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Search size={14} color="var(--admin-text-muted)" />
                <input 
                  type="text" 
                  placeholder="Filter deadlines by student or doc..."
                  value={deadlineSearch}
                  onChange={(e) => setDeadlineSearch(e.target.value)}
                  style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', color: 'var(--admin-text-primary)' }}
                />
              </div>

              {filteredDeadlines.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  <CheckCircle2 size={32} color="var(--admin-success)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, fontWeight: '500' }}>No pending deadlines match your criteria.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredDeadlines.map((doc, idx) => {
                    const studentName = doc.checklist_instances?.student_destinations?.students?.name || 'Unknown Student';
                    const isOverdue = new Date(doc.deadline_date) < new Date();
                    
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', borderBottom: '1px solid var(--admin-border-light)' }}>
                        <div style={{ width: '40px', height: '40px', background: isOverdue ? '#fee2e2' : '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOverdue ? 'var(--admin-danger)' : 'var(--admin-text-muted)' }}>
                          <FileText size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', color: 'var(--admin-text-primary)', fontSize: '0.95rem' }}>{doc.document_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', marginTop: '2px' }}>
                            {studentName} • {doc.checklist_instances?.vertical === 'admission' ? 'Admission' : 'Visa'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className={`admin-badge ${isOverdue ? 'admin-badge-danger' : 'admin-badge-neutral'}`} style={{ marginBottom: '4px' }}>
                            {isOverdue ? 'OVERDUE' : 'UPCOMING'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: isOverdue ? 'var(--admin-danger)' : 'var(--admin-warning-text)', fontWeight: '600' }}>
                            <Clock size={12} /> Due: {new Date(doc.deadline_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
          </div>
        </>
      )}
    </div>
  );
}
