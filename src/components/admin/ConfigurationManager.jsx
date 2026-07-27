import React, { useState, useEffect } from 'react';
import { Settings, Building2, FileText, DollarSign, Plus, Check, X, Loader2, Edit2, Trash2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import StaffManager from './StaffManager';

export default function ConfigurationManager() {
  const [activeTab, setActiveTab] = useState('branches');
  const [loading, setLoading] = useState(true);

  // Data states
  const [branches, setBranches] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templateItems, setTemplateItems] = useState({}); // template_id -> items array

  // Modal / Editing states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'branch', 'fee', 'template', 'item'
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'branches') {
        const { data, error } = await supabase.from('branches').select('*').order('name');
        if (error) throw error;
        setBranches(data || []);
      } else if (activeTab === 'fees') {
        const { data, error } = await supabase.from('fee_types').select('*').order('name');
        if (error) throw error;
        setFeeTypes(data || []);
      } else if (activeTab === 'templates') {
        const { data, error } = await supabase.from('checklist_templates').select('*').order('country');
        if (error) throw error;
        setTemplates(data || []);
        
        // Fetch items for all templates
        const { data: items, error: itemsError } = await supabase.from('checklist_template_items').select('*');
        if (itemsError) throw itemsError;
        
        const itemMap = {};
        items?.forEach(item => {
          if (!itemMap[item.template_id]) itemMap[item.template_id] = [];
          itemMap[item.template_id].push(item);
        });
        setTemplateItems(itemMap);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, item = null, extra = {}) => {
    setModalType(type);
    setEditingItem(item);
    
    if (type === 'branch') {
      setFormData(item || { name: '', code: '', address: '', is_active: true });
    } else if (type === 'fee') {
      setFormData(item || { name: '', vertical: 'general', default_amount: 0 });
    } else if (type === 'template') {
      setFormData(item || { country: '', education_level: '', vertical: 'admission' });
    } else if (type === 'item') {
      setFormData(item || { template_id: extra.template_id, document_name: '', is_required: true });
    }
    
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let table = '';
      if (modalType === 'branch') table = 'branches';
      if (modalType === 'fee') table = 'fee_types';
      if (modalType === 'template') table = 'checklist_templates';
      if (modalType === 'item') table = 'checklist_template_items';

      if (editingItem && editingItem.id) {
        // Update
        const { error } = await supabase.from(table).update(formData).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from(table).insert([formData]);
        if (error) throw error;
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving config:', err);
      alert('Failed to save configuration.');
    }
  };

  const handleDelete = async (table, id) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Failed to delete. It might be referenced by other records.');
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <Settings size={28} color="var(--admin-primary)" />
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: 'var(--admin-text-primary)' }}>Global Configuration</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--admin-text-secondary)' }}>Super Admin access only. Manage branches, fees, and checklist templates.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--admin-bg-body)', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
        {[
          { id: 'branches', label: 'Branches', icon: Building2 },
          { id: 'staff', label: 'Staff Management', icon: Users },
          { id: 'templates', label: 'Checklist Templates', icon: FileText },
          { id: 'fees', label: 'Fee Types', icon: DollarSign }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              background: activeTab === tab.id ? '#ffffff' : 'transparent',
              color: activeTab === tab.id ? 'var(--admin-text-primary)' : 'var(--admin-text-secondary)',
              border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="admin-card" style={{ minHeight: '400px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 size={32} className="animate-spin" color="var(--admin-primary)" />
          </div>
        ) : (
          <>
            {/* STAFF TAB */}
            {activeTab === 'staff' && <StaffManager />}

            {/* BRANCHES TAB */}
            {activeTab === 'branches' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                  <button onClick={() => handleOpenModal('branch')} className="admin-btn admin-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Add Branch
                  </button>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: '700', color: 'var(--admin-text-primary)' }}>{b.code}</td>
                        <td>{b.name}</td>
                        <td style={{ color: 'var(--admin-text-secondary)' }}>{b.address || 'N/A'}</td>
                        <td>
                          <span className={`admin-badge ${b.is_active ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                            {b.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button onClick={() => handleOpenModal('branch', b)} style={{ background: 'transparent', border: 'none', color: 'var(--admin-primary)', cursor: 'pointer', padding: '4px' }}><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete('branches', b.id)} style={{ background: 'transparent', border: 'none', color: 'var(--admin-danger)', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* FEE TYPES TAB */}
            {activeTab === 'fees' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                  <button onClick={() => handleOpenModal('fee')} className="admin-btn admin-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Add Fee Type
                  </button>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Vertical</th>
                      <th>Default Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeTypes.map(f => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: '600', color: 'var(--admin-text-primary)' }}>{f.name}</td>
                        <td><span className="admin-badge admin-badge-primary" style={{ textTransform: 'capitalize' }}>{f.vertical}</span></td>
                        <td style={{ fontWeight: '700', color: 'var(--admin-text-primary)' }}>$ {f.default_amount}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button onClick={() => handleOpenModal('fee', f)} style={{ background: 'transparent', border: 'none', color: 'var(--admin-primary)', cursor: 'pointer', padding: '4px' }}><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete('fee_types', f.id)} style={{ background: 'transparent', border: 'none', color: 'var(--admin-danger)', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TEMPLATES TAB */}
            {activeTab === 'templates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleOpenModal('template')} className="admin-btn admin-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Create Template
                  </button>
                </div>
                
                {templates.map(t => (
                  <div key={t.id} style={{ border: '1px solid var(--admin-border-light)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--admin-bg-body)', padding: '16px 20px', borderBottom: '1px solid var(--admin-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {t.country} — {t.education_level} 
                          <span className={`admin-badge ${t.vertical === 'admission' ? 'admin-badge-success' : 'admin-badge-primary'}`} style={{ textTransform: 'capitalize' }}>
                            {t.vertical}
                          </span>
                        </h3>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => handleOpenModal('item', null, { template_id: t.id })} className="admin-btn" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}>
                          <Plus size={14} /> Add Item
                        </button>
                        <button onClick={() => handleDelete('checklist_templates', t.id)} style={{ background: 'transparent', border: 'none', color: 'var(--admin-danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div style={{ padding: '16px 20px', background: 'white' }}>
                      {(!templateItems[t.id] || templateItems[t.id].length === 0) ? (
                        <div style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>No documents configured for this template yet.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {templateItems[t.id].map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'var(--admin-bg-body)', borderRadius: '8px', fontSize: '0.9rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <FileText size={16} color="var(--admin-text-secondary)" />
                                <span style={{ fontWeight: '600', color: 'var(--admin-text-primary)' }}>{item.document_name}</span>
                                {item.is_required && <span className="admin-badge admin-badge-danger" style={{ fontSize: '0.7rem' }}>REQUIRED</span>}
                              </div>
                              <button onClick={() => handleDelete('checklist_template_items', item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--admin-danger)', cursor: 'pointer' }}><X size={16} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* DYNAMIC MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '400px', padding: 0, overflow: 'hidden' }}>
            <div className="admin-card-header" style={{ padding: '20px 24px', background: 'var(--admin-bg-body)', margin: 0 }}>
              <h3 className="admin-card-title" style={{ margin: 0 }}>
                {editingItem ? 'Edit' : 'Add'} {modalType === 'branch' ? 'Branch' : modalType === 'fee' ? 'Fee Type' : modalType === 'template' ? 'Template' : 'Document'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--admin-text-muted)" /></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {modalType === 'branch' && (
                <>
                  <input className="admin-input" placeholder="Branch Name (e.g. Toronto HQ)" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input className="admin-input" placeholder="Code (e.g. TOR-01)" required value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})} />
                  <input className="admin-input" placeholder="Address" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--admin-text-primary)' }}>
                    <input type="checkbox" checked={formData.is_active ?? true} onChange={e => setFormData({...formData, is_active: e.target.checked})} /> Active Branch
                  </label>
                </>
              )}

              {modalType === 'fee' && (
                <>
                  <input className="admin-input" placeholder="Fee Name (e.g. Visa Processing)" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <select className="admin-input" required value={formData.vertical || 'general'} onChange={e => setFormData({...formData, vertical: e.target.value})}>
                    <option value="general">General</option>
                    <option value="admission">Admission</option>
                    <option value="visa">Visa</option>
                  </select>
                  <input className="admin-input" type="number" placeholder="Default Amount" required value={formData.default_amount || ''} onChange={e => setFormData({...formData, default_amount: e.target.value})} />
                </>
              )}

              {modalType === 'template' && (
                <>
                  <input className="admin-input" placeholder="Country (e.g. Canada)" required value={formData.country || ''} onChange={e => setFormData({...formData, country: e.target.value})} />
                  <select className="admin-input" required value={formData.education_level || ''} onChange={e => setFormData({...formData, education_level: e.target.value})}>
                    <option value="" disabled>Select Level...</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                  <select className="admin-input" required value={formData.vertical || 'admission'} onChange={e => setFormData({...formData, vertical: e.target.value})}>
                    <option value="admission">Admission Checklist</option>
                    <option value="visa">Visa Checklist</option>
                  </select>
                </>
              )}

              {modalType === 'item' && (
                <>
                  <input className="admin-input" placeholder="Document Name (e.g. Passport Copy)" required value={formData.document_name || ''} onChange={e => setFormData({...formData, document_name: e.target.value})} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--admin-text-primary)' }}>
                    <input type="checkbox" checked={formData.is_required ?? true} onChange={e => setFormData({...formData, is_required: e.target.checked})} /> Is Required
                  </label>
                </>
              )}

              <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '12px', marginTop: '10px' }}>
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
