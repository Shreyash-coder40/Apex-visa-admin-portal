import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, CheckCircle2, UserCheck, DollarSign, FileText, UserPlus, Clock, Lock, Building2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function ActivityTimeline({ currentRole, currentBranch }) {
  const isSuperAdmin = currentRole === 'super_admin';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [currentRole, currentBranch]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const getEntityIcon = (entityType) => {
    switch(entityType) {
      case 'fee_record':
      case 'fee_payment':
        return <DollarSign size={16} color="#059669" />;
      case 'checklist':
        return <FileText size={16} color="#0066ff" />;
      case 'student':
        return <UserCheck size={16} color="#9333ea" />;
      case 'lead':
        return <UserPlus size={16} color="#f97316" />;
      default:
        return <CheckCircle2 size={16} color="#64748b" />;
    }
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Notice */}
      <div className="admin-card" style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
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

      {/* Timeline List */}
      <div className="admin-card" style={{ padding: '24px 32px' }}>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 size={40} className="animate-spin" color="var(--admin-primary)" />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
            No activity logs found. Try performing an action in the CRM to generate logs!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {logs.map((log, idx) => (
              <div key={log.id} style={{ display: 'flex', gap: '20px', position: 'relative', paddingBottom: idx === logs.length - 1 ? '0' : '28px' }}>
                
                {/* Timeline Line & Dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--admin-bg-body)', border: '2px solid var(--admin-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                    {getEntityIcon(log.entity_type)}
                  </div>
                  {idx !== logs.length - 1 && (
                    <div style={{ width: '2px', background: 'var(--admin-border-light)', flex: 1, marginTop: '4px' }}></div>
                  )}
                </div>

                {/* Log Content */}
                <div style={{ flex: 1, paddingTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '700', color: 'var(--admin-text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {log.entity_type} {log.field_changed ? 'Modified' : 'Updated'}
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
                          <strong>Previous Value:</strong><br/>{log.old_value || 'NULL'}
                        </div>
                        <div style={{ color: 'var(--admin-text-muted)' }}>➔</div>
                        <div style={{ flex: 1, padding: '8px 12px', background: 'var(--admin-success-bg)', color: 'var(--admin-success)', borderRadius: '6px', border: '1px dashed var(--admin-success)' }}>
                          <strong>New Value:</strong><br/>{log.new_value || 'NULL'}
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
  );
}
