import React from 'react';
import { Users, UserPlus, CheckCircle2, DollarSign, ArrowUpRight, TrendingUp, AlertCircle, Clock, ShieldCheck, Building2 } from 'lucide-react';

export default function DashboardOverview({ currentRole, currentBranch, onNavigateTab }) {
  const isSuperAdmin = currentRole === 'super_admin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Welcome Banner & Role Notice */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
        borderRadius: '16px', 
        padding: '28px 32px', 
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ 
              background: isSuperAdmin ? 'rgba(0, 102, 255, 0.2)' : 'rgba(16, 185, 129, 0.2)', 
              color: isSuperAdmin ? '#60a5fa' : '#34d399', 
              border: isSuperAdmin ? '1px solid rgba(0, 102, 255, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
              padding: '4px 12px', 
              borderRadius: '999px', 
              fontSize: '0.75rem', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <ShieldCheck size={14} />
              {isSuperAdmin ? 'Super Admin Oversight' : 'Branch Admin Scope'}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>• Row-Level Security Active</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 6px 0', fontFamily: 'Outfit, sans-serif' }}>
            {isSuperAdmin ? 'Global Operations Command Center' : `${currentBranch.name} Dashboard`}
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: 0, maxWidth: '600px' }}>
            {isSuperAdmin 
              ? 'Real-time monitoring across all 3 international branches, unassigned lead pools, dual-vertical checklists, and automated financial balances.'
              : `Managing active student applications, document verification, and local fee installments locked strictly to ${currentBranch.name}.`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => onNavigateTab('leads')}
            style={{ 
              background: '#0066ff', 
              color: '#ffffff', 
              border: 'none', 
              padding: '12px 20px', 
              borderRadius: '10px', 
              fontWeight: '600', 
              fontSize: '0.88rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0, 102, 255, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            <UserPlus size={16} />
            <span>Process New Leads</span>
          </button>
          <button 
            onClick={() => onNavigateTab('students')}
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              color: '#ffffff', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              padding: '12px 20px', 
              borderRadius: '10px', 
              fontWeight: '600', 
              fontSize: '0.88rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Users size={16} />
            <span>Active Students</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* Metric 1: Active Students */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0066ff' }}>
              <Users size={22} />
            </div>
            <span style={{ background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} /> +12% this mo
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
            {isSuperAdmin ? '64' : '28'}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: '500' }}>
            Active Enrolled Students
          </div>
        </div>

        {/* Metric 2: Unassigned / Pending Leads */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
              <UserPlus size={22} />
            </div>
            <span style={{ background: '#fef3c7', color: '#d97706', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
              Needs Triage
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
            {isSuperAdmin ? '18' : '7'}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: '500' }}>
            New Leads in Shared Pool
          </div>
        </div>

        {/* Metric 3: Pending Checklists / Documents */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={22} />
            </div>
            <span style={{ background: '#eff6ff', color: '#0066ff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
              Dual-Vertical
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
            {isSuperAdmin ? '34' : '15'}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: '500' }}>
            Documents Pending Verification
          </div>
        </div>

        {/* Metric 4: Total Fees Received */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
              <DollarSign size={22} />
            </div>
            <span style={{ background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
              Trigger Calculated
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
            {isSuperAdmin ? '$342,500' : '$145,000'}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: '500' }}>
            Total Fee Collections (CAD/USD)
          </div>
        </div>
      </div>

      {/* Quick Action Tables Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Left Table: Recent High-Priority Leads waiting for claim/conversion */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
                Recent Inquiries from Marketing Site
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Leads submitted via Free Eligibility Check waiting for staff triage
              </p>
            </div>
            <button 
              onClick={() => onNavigateTab('leads')}
              style={{ background: 'transparent', border: 'none', color: '#0066ff', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ padding: '12px 22px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '10px 0' }}>Lead Name</th>
                  <th style={{ padding: '10px 0' }}>Country & Course</th>
                  <th style={{ padding: '10px 0' }}>Status</th>
                  <th style={{ padding: '10px 0', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'L001', name: 'Alex Rivera', country: '🇨🇦 Canada', course: 'MSc Computer Science', status: 'New', time: '12 mins ago' },
                  { id: 'L002', name: 'Priya Sharma', country: '🇦🇺 Australia', course: 'Master of Data Science', status: 'Contacted', time: '2 hours ago' },
                  { id: 'L003', name: 'James Wilson', country: '🇩🇪 Germany', course: 'BEng Mechanical', status: 'New', time: '4 hours ago' },
                  { id: 'L004', name: 'Aarav Mehta', country: '🇬🇧 UK', course: 'MBA International', status: 'Contacted', time: '1 day ago' },
                ].map((lead, index) => (
                  <tr key={index} style={{ borderBottom: index < 3 ? '1px solid #f8fafc' : 'none', fontSize: '0.88rem' }}>
                    <td style={{ padding: '14px 0' }}>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{lead.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {lead.time}
                      </div>
                    </td>
                    <td style={{ padding: '14px 0' }}>
                      <div style={{ fontWeight: '600', color: '#334155' }}>{lead.country}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{lead.course}</div>
                    </td>
                    <td style={{ padding: '14px 0' }}>
                      <span style={{ 
                        background: lead.status === 'New' ? '#eff6ff' : '#fff7ed', 
                        color: lead.status === 'New' ? '#0066ff' : '#ea580c',
                        padding: '4px 10px', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem', 
                        fontWeight: '700' 
                      }}>
                        {lead.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 0', textAlign: 'right' }}>
                      <button 
                        onClick={() => onNavigateTab('leads')}
                        style={{ background: '#f1f5f9', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: Multi-Branch & Security Status */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '22px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Building2 size={20} color="#0066ff" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
              Branch Isolation Status
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, marginBottom: '18px' }}>
            PostgreSQL Row-Level Security (`auth.uid()`) is actively isolating student records, checklists, and fee ledgers across physical branches.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { code: 'TOR-01', name: 'Downtown Toronto HQ', students: '28 Students', active: true },
              { code: 'VAN-01', name: 'Vancouver Pacific Hub', students: '19 Students', active: true },
              { code: 'SYD-01', name: 'Sydney Global Branch', students: '17 Students', active: true },
            ].map((branch, i) => (
              <div key={i} style={{ 
                padding: '12px 14px', 
                borderRadius: '10px', 
                background: currentBranch.code === branch.code && !isSuperAdmin ? '#eff6ff' : '#f8fafc', 
                border: currentBranch.code === branch.code && !isSuperAdmin ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{branch.name}</span>
                    <span style={{ fontSize: '0.72rem', background: '#e2e8f0', padding: '1px 6px', borderRadius: '4px', color: '#475569' }}>{branch.code}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    {branch.students} enrolled
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#10b981' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  <span>Active RLS</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '18px', padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #0066ff', fontSize: '0.8rem', color: '#475569' }}>
            <strong>Head Team Review Compliant:</strong> Atomic transactions (`fn_convert_lead_to_student`) ensure zero lead-student sync failures.
          </div>
        </div>

      </div>

    </div>
  );
}
