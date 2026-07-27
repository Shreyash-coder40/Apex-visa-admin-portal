import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, DollarSign, FileText, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function StudentTimelineView({ studentId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchLogs();
    }
  }, [studentId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const { data: studentData } = await supabase
        .from('students')
        .select(`
          id,
          source_lead_id,
          student_destinations (
            id,
            checklist_instances (
              id,
              document_items (id)
            )
          ),
          fee_records (
            id,
            payment_transactions (id),
            refund_records (id)
          )
        `)
        .eq('id', studentId)
        .single();

      if (!studentData) {
        setLogs([]);
        setLoading(false);
        return;
      }

      // Collect all related IDs
      const entityIds = [studentData.id];
      if (studentData.source_lead_id) entityIds.push(studentData.source_lead_id);
      
      studentData.student_destinations?.forEach(d => {
        entityIds.push(d.id);
        d.checklist_instances?.forEach(c => {
          entityIds.push(c.id);
          c.document_items?.forEach(doc => entityIds.push(doc.id));
        });
      });
      
      studentData.fee_records?.forEach(f => {
        entityIds.push(f.id);
        f.payment_transactions?.forEach(p => entityIds.push(p.id));
        f.refund_records?.forEach(r => entityIds.push(r.id));
      });

      const { data: logsData, error } = await supabase
        .from('activity_logs')
        .select('*')
        .in('entity_id', entityIds)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(logsData || []);
    } catch (err) {
      console.error('Error fetching timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 size={30} className="animate-spin" color="#0066ff" /></div>;
  }

  if (logs.length === 0) {
    return (
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center' }}>
        <Clock size={40} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>No Activity Yet</h3>
        <p style={{ color: '#64748b', margin: 0 }}>Events will appear here once actions are taken on this student's profile.</p>
      </div>
    );
  }

  const getIcon = (type) => {
    switch(type) {
      case 'Lead':
      case 'Student': return <UserPlus size={16} color="#0066ff" />;
      case 'DocumentItem': return <FileText size={16} color="#8b5cf6" />;
      case 'PaymentTransaction':
      case 'RefundRecord': return <DollarSign size={16} color="#10b981" />;
      default: return <CheckCircle2 size={16} color="#64748b" />;
    }
  };

  const getActionText = (log) => {
    if (log.field_changed === 'status' && log.new_value === 'Converted') return 'Lead converted to Student';
    if (log.entity_type === 'DocumentItem' && log.field_changed === 'status') return `Document status changed to ${log.new_value}`;
    if (log.entity_type === 'DocumentItem' && log.field_changed === 'notes') return `Document notes updated`;
    if (log.entity_type === 'PaymentTransaction') return `Payment of ${log.new_value} recorded`;
    if (log.entity_type === 'RefundRecord') return `Refund of ${log.new_value} recorded`;
    return `${log.field_changed} updated to ${log.new_value}`;
  };

  return (
    <div className="admin-card" style={{ padding: '24px' }}>
      <h3 className="admin-card-title" style={{ margin: '0 0 24px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={20} color="var(--admin-primary)" /> Full Activity Audit Timeline
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
        {/* Vertical line connecting timeline dots */}
        <div style={{ position: 'absolute', left: '15px', top: '20px', bottom: '20px', width: '2px', background: 'var(--admin-border-light)', zIndex: 0 }}></div>

        {logs.map((log) => (
          <div key={log.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--admin-bg-body)', border: '2px solid var(--admin-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {getIcon(log.entity_type)}
            </div>
            <div style={{ flex: 1, background: 'var(--admin-bg-body)', padding: '16px', borderRadius: '12px', border: '1px solid var(--admin-border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>
                  {log.entity_type}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: '500' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                {getActionText(log)}
              </div>
              {log.old_value && log.old_value !== '0' && log.old_value !== 'null' && (
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                  Previous value: <span style={{ textDecoration: 'line-through' }}>{log.old_value}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
