import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Loader2, Filter, MoreVertical, ChevronRight } from 'lucide-react';

const ClientsList = ({ currentRole, currentBranch, onStudentClick, onAddClient }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [currentBranch, currentRole]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('students')
        .select(`
          *,
          branches(name),
          leads(email, phone)
        `)
        .order('created_at', { ascending: false });

      if (currentRole === 'branch_admin' && currentBranch) {
        const branchId = typeof currentBranch === 'object' ? currentBranch.id : currentBranch;
        if (branchId) {
          query = query.eq('branch_id', branchId);
        }
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const term = searchQuery.toLowerCase();
    const nameMatch = s.name?.toLowerCase().includes(term);
    const emailMatch = s.email?.toLowerCase().includes(term) || s.leads?.email?.toLowerCase().includes(term);
    return nameMatch || emailMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input 
              type="text"
              placeholder="Search clients by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', 
                border: '1px solid #d1d5db', fontSize: '0.85rem', outline: 'none'
              }}
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500', color: '#374151', cursor: 'pointer' }}>
            <Filter size={16} /> Filters
          </button>
        </div>
        <button onClick={onAddClient} className="admin-btn admin-btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
          + Add Client
        </button>
      </div>

      {/* Data Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={32} color="#f59e0b" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            No clients found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Client Name</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Contact</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Branch</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr 
                  key={student.id} 
                  style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => onStudentClick && onStudentClick(student.id)}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>{student.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{student.education_level || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#374151' }}>{student.email || student.leads?.email || 'No email'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{student.phone || student.leads?.phone || 'No phone'}</div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#374151' }}>
                    {student.branches?.name || 'Unassigned'}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      background: student.overall_status === 'Active' ? '#dcfce7' : '#f3f4f6',
                      color: student.overall_status === 'Active' ? '#166534' : '#374151'
                    }}>
                      {student.overall_status || 'Unknown'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <button style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onStudentClick && onStudentClick(student.id); }}>
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ClientsList;
