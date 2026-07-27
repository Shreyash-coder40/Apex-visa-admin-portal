import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Building2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function StaffManager() {
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'branch_admin',
    branch_id: ''
  });

  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  useEffect(() => {
    fetchData();

    // Subscribe to presence
    const channel = supabase.channel('crm-presence');
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineIds = new Set();
      // state is an object with presence keys, each containing an array of presence objects
      for (const id of Object.keys(state)) {
        state[id].forEach(presence => {
          if (presence.user_id) onlineIds.add(presence.user_id);
        });
      }
      setOnlineUserIds(onlineIds);
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    // Fetch all staff and their assigned branch(es)
    const { data: staffData } = await supabase
      .from('staff_users')
      .select(`
        *,
        branch_assignments(
          branches(id, name, code)
        )
      `)
      .order('created_at', { ascending: false });

    const { data: branchData } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (staffData) setStaff(staffData);
    if (branchData) {
      setBranches(branchData);
      if (branchData.length > 0) {
        setFormData(prev => ({ ...prev, branch_id: branchData[0].id }));
      }
    }
    setLoading(false);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Call our secure backend SQL function to create the auth user
      const { data, error } = await supabase.rpc('fn_create_staff_user', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        branch_id: formData.role === 'super_admin' ? null : formData.branch_id
      });

      if (error) throw error;
      
      setShowModal(false);
      setFormData({
        name: '', email: '', password: '', role: 'branch_admin', branch_id: branches[0]?.id || ''
      });
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create user. Ensure the email is not already registered.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '20px', color: '#64748b' }}>Loading staff...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} color="var(--admin-primary)" />
            Staff Management
          </h2>
          <p style={{ margin: 0, color: 'var(--admin-text-secondary)' }}>Manage user accounts, roles, and branch assignments.</p>
        </div>
        <button 
          className="admin-btn admin-btn-primary" 
          onClick={() => setShowModal(true)}
          style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlus size={18} />
          Add Staff Member
        </button>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>ROLE</th>
              <th>ASSIGNED BRANCHES</th>
              <th>ACTIVITY</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((user) => {
              const isOnline = onlineUserIds.has(user.id);
              return (
                <tr key={user.id}>
                  <td style={{ fontWeight: '500', color: 'var(--admin-text-primary)' }}>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.role === 'super_admin' ? (
                      <span className="admin-badge admin-badge-warning">
                        <Shield size={12} style={{ marginRight: '4px' }} /> Super Admin
                      </span>
                    ) : (
                      <span className="admin-badge admin-badge-primary">
                        Branch Admin
                      </span>
                    )}
                  </td>
                  <td>
                    {user.role === 'super_admin' ? (
                      <span style={{ color: 'var(--admin-text-muted)' }}>All Branches (Global Access)</span>
                    ) : user.branch_assignments?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {user.branch_assignments.map((ba) => (
                          <div key={ba.branches.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={14} color="var(--admin-text-muted)" />
                            {ba.branches.code} - {ba.branches.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--admin-danger)' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    {isOnline ? (
                      <span className="admin-badge admin-badge-success" style={{ borderRadius: '999px', padding: '4px 10px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--admin-success)', boxShadow: '0 0 4px var(--admin-success)', marginRight: '6px' }}></span>
                        Online
                      </span>
                    ) : (
                      <span className="admin-badge admin-badge-neutral" style={{ borderRadius: '999px', padding: '4px 10px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--admin-text-muted)', marginRight: '6px' }}></span>
                        Offline
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {staff.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No staff members found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '450px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: 'var(--admin-text-primary)', fontSize: '1.25rem' }}>Add New Staff Member</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="admin-label">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="admin-input"
                />
              </div>

              <div>
                <label className="admin-label">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="admin-input"
                />
              </div>

              <div>
                <label className="admin-label">Temporary Password</label>
                <input 
                  type="password" 
                  required
                  minLength="6"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="admin-input"
                />
              </div>

              <div>
                <label className="admin-label">Account Role</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="admin-input"
                >
                  <option value="branch_admin">Branch Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {formData.role === 'branch_admin' && (
                <div>
                  <label className="admin-label">Assign to Branch</label>
                  <select 
                    value={formData.branch_id}
                    onChange={e => setFormData({...formData, branch_id: e.target.value})}
                    required
                    className="admin-input"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {errorMsg && (
                <div style={{ padding: '12px', background: 'var(--admin-danger-bg)', color: 'var(--admin-danger)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {errorMsg}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="admin-btn"
                style={{ 
                  marginTop: '12px', width: '100%', padding: '12px', background: 'var(--admin-success)', color: '#fff', 
                  fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <Save size={18} />
                {isSubmitting ? 'Creating Account...' : 'Create Staff Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
