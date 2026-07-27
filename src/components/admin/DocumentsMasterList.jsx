import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Loader2, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const DocumentsMasterList = ({ currentRole, currentBranch, showToast, onStudentClick }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDocuments();

    const channel = supabase
      .channel('document_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'document_items' },
        (payload) => {
          console.log('Realtime change received!', payload);
          // Re-fetch to pull in all joined data accurately
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentBranch, currentRole]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // Query document_items, joining instance -> destination -> student
      let query = supabase
        .from('document_items')
        .select(`
          id, document_name, status, deadline_date, notes,
          checklist_instances (
            id, vertical,
            student_destinations (
              id, destination_country,
              students (
                id, name, branch_id, branches (name)
              )
            )
          )
        `);

      const { data, error } = await query;
      
      if (error) throw error;

      // Filter by branch if needed
      let docs = data || [];
      if (currentRole === 'branch_admin' && currentBranch) {
        const branchId = typeof currentBranch === 'object' ? currentBranch.id : currentBranch;
        if (branchId) {
          docs = docs.filter(d => 
            d.checklist_instances?.student_destinations?.students?.branch_id === branchId
          );
        }
      }
      setDocuments(docs);
    } catch (err) {
      console.error('Error fetching documents:', err);
      showToast('Error loading documents.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (docId, newStatus) => {
    try {
      const { error } = await supabase
        .from('document_items')
        .update({ status: newStatus })
        .eq('id', docId);
        
      if (error) throw error;
      setDocuments(docs => docs.map(d => d.id === docId ? { ...d, status: newStatus } : d));
      showToast('Document status updated.', 'success');
    } catch (err) {
      showToast('Failed to update document.', 'error');
    }
  };

  // Stats
  const totalDocs = documents.length;
  const approvedDocs = documents.filter(d => d.status === 'Received').length;
  const pendingDocs = documents.filter(d => d.status === 'Pending').length;
  const actionRequiredDocs = documents.filter(d => ['Rejected', 'Waived'].includes(d.status)).length;

  const filteredDocs = documents.filter(d => {
    const term = searchQuery.toLowerCase();
    const docName = d.document_name?.toLowerCase() || '';
    const studentName = d.checklist_instances?.student_destinations?.students?.name?.toLowerCase() || '';
    return docName.includes(term) || studentName.includes(term);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Level Dashboard Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} color="#4b5563" />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: '1' }}>{totalDocs}</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500', marginTop: '4px' }}>Total Documents</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={24} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: '1' }}>{approvedDocs}</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500', marginTop: '4px' }}>Approved (Received)</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: '1' }}>{pendingDocs}</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500', marginTop: '4px' }}>Pending Upload</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={24} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: '1' }}>{actionRequiredDocs}</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500', marginTop: '4px' }}>Action Required</div>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input 
            type="text"
            placeholder="Search documents or student names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', 
              border: '1px solid #d1d5db', fontSize: '0.85rem', outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={32} color="#f59e0b" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            No documents found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Document Name</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Student</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Vertical & Country</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => {
                const student = doc.checklist_instances?.student_destinations?.students;
                const dest = doc.checklist_instances?.student_destinations;
                
                return (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>{doc.document_name}</div>
                      {doc.notes && <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>{doc.notes}</div>}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button 
                        onClick={() => onStudentClick && student && onStudentClick(student.id)}
                        style={{ background: 'none', border: 'none', padding: 0, fontWeight: '600', color: '#2563eb', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}
                      >
                        {student?.name || 'Unknown'}
                      </button>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{student?.branches?.name}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#374151' }}>
                      <div style={{ textTransform: 'capitalize' }}>{doc.checklist_instances?.vertical}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{dest?.destination_country}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        background: doc.status === 'Received' ? '#dcfce7' : doc.status === 'Pending' ? '#fef3c7' : '#fee2e2',
                        color: doc.status === 'Received' ? '#166534' : doc.status === 'Pending' ? '#b45309' : '#991b1b'
                      }}>
                        {doc.status || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <select 
                        value={doc.status}
                        onChange={(e) => handleUpdateStatus(doc.id, e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', outline: 'none' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Received">Received</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Waived">Waived</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DocumentsMasterList;
