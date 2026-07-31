import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Loader2, Filter, ChevronRight, X } from 'lucide-react';

const ClientsList = ({ currentRole, currentBranch, onStudentClick, onAddClient, externalSearchQuery }) => {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);
  
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
          leads(name, email, phone, education_level)
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

  const activeFilterCount = (statusFilter !== 'All' ? 1 : 0) + (levelFilter !== 'All' ? 1 : 0) + (branchFilter !== 'All' ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setLevelFilter('All');
    setBranchFilter('All');
  };

  const filteredStudents = students.filter(s => {
    const term = searchQuery.trim().toLowerCase();
    
    if (!term && statusFilter === 'All' && levelFilter === 'All' && branchFilter === 'All') {
      return true;
    }

    const nameStr = (s.name || s.leads?.name || '').toLowerCase();
    const emailStr = (s.email || s.leads?.email || '').toLowerCase();
    const phoneStr = (s.phone || s.leads?.phone || '').toLowerCase();
    const branchStr = (s.branches?.name || '').toLowerCase();
    const levelStr = (s.education_level || s.leads?.education_level || '').toLowerCase();

    const matchesSearch = !term || 
      nameStr.includes(term) || 
      emailStr.includes(term) || 
      phoneStr.includes(term) || 
      branchStr.includes(term) || 
      levelStr.includes(term);

    const matchesStatus = statusFilter === 'All' || (s.overall_status || 'Active') === statusFilter;
    const matchesLevel = levelFilter === 'All' || (s.education_level || s.leads?.education_level) === levelFilter;
    const matchesBranch = branchFilter === 'All' || s.branches?.id === branchFilter || s.branch_id === branchFilter;

    return matchesSearch && matchesStatus && matchesLevel && matchesBranch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} color="var(--admin-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search clients by name, email, phone, branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-input"
              style={{
                width: '100%', paddingLeft: '36px', background: '#ffffff', fontSize: '0.85rem'
              }}
            />
          </div>
          <button 
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="admin-btn"
            style={{ 
              background: showFilterPanel || activeFilterCount > 0 ? 'var(--admin-primary-light)' : '#ffffff',
              color: showFilterPanel || activeFilterCount > 0 ? 'var(--admin-primary)' : '#374151',
              border: `1px solid ${showFilterPanel || activeFilterCount > 0 ? 'var(--admin-primary)' : '#d1d5db'}`,
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600' 
            }}
          >
            <Filter size={16} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>

          {activeFilterCount > 0 && (
            <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>
              Reset Filters
            </button>
          )}
        </div>

        <button onClick={onAddClient} className="admin-btn admin-btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
          + Add Client
        </button>
      </div>

      {/* Toggleable Filter Panel */}
      {showFilterPanel && (
        <div className="admin-card" style={{ padding: '16px 24px', background: '#ffffff', borderRadius: '10px', border: '1px solid var(--admin-border-light)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Client Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-input" style={{ width: '100%', background: '#f9fafb' }}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Education Level</label>
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="admin-input" style={{ width: '100%', background: '#f9fafb' }}>
              <option value="All">All Education Levels</option>
              <option value="Bachelor">Bachelor</option>
              <option value="Master">Master</option>
              <option value="PhD">PhD</option>
              <option value="Diploma">Diploma</option>
            </select>
          </div>

          {currentRole === 'super_admin' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Branch</label>
              <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="admin-input" style={{ width: '100%', background: '#f9fafb' }}>
                <option value="All">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Data Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={32} color="var(--admin-primary)" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            No clients match the specified search or filter criteria.
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
                    <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>{student.name || student.leads?.name || 'Unnamed Client'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{student.education_level || student.leads?.education_level || 'N/A'}</div>
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
                      background: (student.overall_status || 'Active') === 'Active' ? '#dcfce7' : '#f3f4f6',
                      color: (student.overall_status || 'Active') === 'Active' ? '#166534' : '#374151'
                    }}>
                      {student.overall_status || 'Active'}
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
