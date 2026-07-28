import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Loader2, Filter, MoreVertical, ChevronRight } from 'lucide-react';

const ClientsList = ({ currentRole, currentBranch, onStudentClick, onAddClient }) => {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');

  useEffect(() => {
    fetchStudents();
    if (currentRole === 'super_admin') {
      fetchBranches();
    }
  }, [currentBranch, currentRole]);

  const fetchBranches = async () => {
    try {
      const { data } = await supabase.from('branches').select('id, name').order('name');
      if (data) setBranches(data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('students')
        .select(`
          *,
          branches(id, name),
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

  const activeFilterCount = (statusFilter !== 'All' ? 1 : 0) + (levelFilter !== 'All' ? 1 : 0) + (branchFilter !== 'All' ? 1 : 0) + (searchQuery ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setLevelFilter('All');
    setBranchFilter('All');
  };

  const filteredStudents = students.filter(s => {
    const term = searchQuery.toLowerCase();
    const nameMatch = s.name?.toLowerCase().includes(term);
    const emailMatch = s.email?.toLowerCase().includes(term) || s.leads?.email?.toLowerCase().includes(term);
    const phoneMatch = s.phone?.toLowerCase().includes(term) || s.leads?.phone?.toLowerCase().includes(term);
    const branchMatch = s.branches?.name?.toLowerCase().includes(term);
    const levelMatch = s.education_level?.toLowerCase().includes(term);

    const matchesSearch = !term || nameMatch || emailMatch || phoneMatch || branchMatch || levelMatch;
    const matchesStatus = statusFilter === 'All' || (s.overall_status || 'Active') === statusFilter;
    const matchesLevel = levelFilter === 'All' || s.education_level === levelFilter;
    const matchesBranch = branchFilter === 'All' || s.branches?.id === branchFilter || s.branch_id === branchFilter;

    return matchesSearch && matchesStatus && matchesLevel && matchesBranch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search clients by name, email, phone, branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', 
                border: '1px solid #d1d5db', fontSize: '0.85rem', outline: 'none'
              }}
            />
          </div>
          <button 
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
              background: showFilterPanel || activeFilterCount > 0 ? '#eff6ff' : '#ffffff', 
              border: `1px solid ${showFilterPanel || activeFilterCount > 0 ? '#3b82f6' : '#d1d5db'}`, 
              borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500', 
              color: showFilterPanel || activeFilterCount > 0 ? '#1d4ed8' : '#374151', 
              cursor: 'pointer' 
            }}
          >
            <Filter size={16} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>
        <button onClick={onAddClient} className="admin-btn admin-btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
          + Add Client
        </button>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#111827' }}>Filter Directory</h4>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                Reset Filters
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>Client Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', background: '#f9fafb' }}>
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>Education Level</label>
              <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', background: '#f9fafb' }}>
                <option value="All">All Levels</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Diploma">Diploma</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
            {currentRole === 'super_admin' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>Assigned Branch</label>
                <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', background: '#f9fafb' }}>
                  <option value="All">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

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
