import React from 'react';
import { History, ShieldAlert, CheckCircle2, UserCheck, DollarSign, FileText, UserPlus, Clock, Lock, Building2 } from 'lucide-react';

export default function ActivityTimeline({ currentRole, currentBranch }) {
  const isSuperAdmin = currentRole === 'super_admin';

  // Seeded immutable activity logs demonstrating entity_type checking and strict audit tracking
  const logs = [
    {
      id: 'log_101',
      entityType: 'FeeRecord',
      entityId: 'F001',
      action: 'Payment Installment Recorded ($5,000 CAD)',
      fieldChanged: 'amount_received / balance',
      oldValue: '$10,000 received (Balance $15,000)',
      newValue: '$15,000 received (Balance $10,000)',
      changedBy: 'Sarah Jenkins (Senior Counselor)',
      branch: 'TOR-01',
      timestamp: '10 mins ago',
      icon: <DollarSign size={16} color="#059669" />
    },
    {
      id: 'log_102',
      entityType: 'DocumentItem',
      entityId: 'doc4',
      action: 'Document Status Verified',
      fieldChanged: 'status',
      oldValue: 'Pending',
      newValue: 'Received (IELTS Score 8.0 Verified)',
      changedBy: 'Sarah Jenkins (Senior Counselor)',
      branch: 'TOR-01',
      timestamp: '25 mins ago',
      icon: <FileText size={16} color="#0066ff" />
    },
    {
      id: 'log_103',
      entityType: 'Student',
      entityId: 'S101',
      action: 'Atomic Conversion from Lead L005 (`fn_convert_lead_to_student`)',
      fieldChanged: 'overall_status',
      oldValue: 'Lead: Contacted',
      newValue: 'Student: Active Enrolled',
      changedBy: 'David Miller (Branch Admin)',
      branch: 'TOR-01',
      timestamp: '2 hours ago',
      icon: <UserCheck size={16} color="#9333ea" />
    },
    {
      id: 'log_104',
      entityType: 'Lead',
      entityId: 'L002',
      action: 'Lead Claimed from Shared Pool',
      fieldChanged: 'assigned_branch_id',
      oldValue: 'NULL (Shared Pool)',
      newValue: 'TOR-01 (Downtown Toronto HQ)',
      changedBy: 'David Miller (Branch Admin)',
      branch: 'TOR-01',
      timestamp: '3 hours ago',
      icon: <UserPlus size={16} color="#f97316" />
    },
    {
      id: 'log_105',
      entityType: 'ChecklistInstance',
      entityId: 'inst_visa_02',
      action: 'Spawned Visa Checklist Instance from Template (`fn_spawn_checklists`)',
      fieldChanged: 'status',
      oldValue: 'None',
      newValue: 'In Progress (5 Document Line Items Created)',
      changedBy: 'System Automation Trigger',
      branch: 'VAN-01',
      timestamp: '1 day ago',
      icon: <CheckCircle2 size={16} color="#10b981" />
    }
  ];

  const filteredLogs = logs.filter(l => isSuperAdmin || l.branch === currentBranch.code);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Notice */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={22} color="#0f172a" />
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
              Immutable Audit Trail (`activity_logs`)
            </h2>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
            Chronological log of all system changes across leads, students, fee transactions, and document verifications.
          </p>
        </div>

        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={15} color="#dc2626" />
          <span style={{ fontSize: '0.78rem', color: '#991b1b', fontWeight: '700' }}>
            Issue #2 Fix: Append-Only (`trg_activity_log_immutable`)
          </span>
        </div>
      </div>

      {/* Timeline List */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
          
          {/* Vertical line connecting events */}
          <div style={{ position: 'absolute', left: '22px', top: '24px', bottom: '24px', width: '2px', background: '#e2e8f0' }} />

          {filteredLogs.map((log, index) => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', zIndex: 2 }}>
              
              {/* Icon badge */}
              <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '12px', 
                background: '#f8fafc', 
                border: '2px solid #e2e8f0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}>
                {log.icon}
              </div>

              {/* Content Card */}
              <div style={{ flex: 1, background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      background: '#eff6ff', 
                      color: '#0066ff', 
                      border: '1px solid #bfdbfe',
                      padding: '2px 8px', 
                      borderRadius: '6px', 
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      marginRight: '8px'
                    }}>
                      {log.entityType}
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                      {log.action}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {log.timestamp}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#475569', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
                    Field Changed: `{log.fieldChanged}`
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#dc2626', textDecoration: 'line-through' }}>{log.oldValue}</span>
                    <span style={{ color: '#64748b' }}>→</span>
                    <span style={{ color: '#059669', fontWeight: '700' }}>{log.newValue}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
                  <span><strong>Authorized Staff:</strong> {log.changedBy}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
                    <Building2 size={11} /> {log.branch}
                  </span>
                </div>
              </div>

            </div>
          ))}

        </div>
      </div>

    </div>
  );
}
