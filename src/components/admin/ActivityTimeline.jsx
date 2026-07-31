import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, CheckCircle2, UserCheck, DollarSign, FileText, UserPlus, Clock, Lock, Building2, Loader2, Search, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function ActivityTimeline({ currentRole, currentBranch }) {
  const isSuperAdmin = currentRole === 'super_admin';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');

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

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
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

      {/* Audit Search and Filter Bar */}
      <div className="admin-card" style={{ padding: '16px 24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--admin-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search audit trail by user, field, entity ID, or values..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

        {loading ? (
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
  );
}
