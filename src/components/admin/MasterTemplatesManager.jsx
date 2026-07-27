import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, Plus, Edit2, Trash2, Check, X, FileCheck, Layers, BookOpen, MapPin, AlertCircle } from 'lucide-react';

export default function MasterTemplatesManager({ showToast }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for New Template
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newCountry, setNewCountry] = useState('');
  const [newLevel, setNewLevel] = useState('');
  const [newVertical, setNewVertical] = useState('admission');

  // Selected template details
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateItems, setTemplateItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Form states for New Document Item
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemRequired, setNewItemRequired] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*')
        .order('country', { ascending: true })
        .order('education_level', { ascending: true })
        .order('vertical', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      if (showToast) showToast('Failed to load templates.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateItems = async (templateId) => {
    try {
      setLoadingItems(true);
      const { data, error } = await supabase
        .from('checklist_template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTemplateItems(data || []);
    } catch (err) {
      console.error('Error fetching template items:', err);
      if (showToast) showToast('Failed to load items.', 'error');
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    fetchTemplateItems(template.id);
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('checklist_templates')
        .insert([{
          country: newCountry,
          education_level: newLevel,
          vertical: newVertical
        }])
        .select();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A template for this Country + Level + Vertical already exists.');
        }
        throw error;
      }

      setShowTemplateModal(false);
      setNewCountry('');
      setNewLevel('');
      setNewVertical('admission');
      if (showToast) showToast('Template created successfully!');
      
      await fetchTemplates();
      if (data && data[0]) {
        handleSelectTemplate(data[0]);
      }
    } catch (err) {
      console.error('Error creating template:', err);
      if (showToast) showToast(err.message || 'Failed to create template.', 'error');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      const { error } = await supabase
        .from('checklist_template_items')
        .insert([{
          template_id: selectedTemplate.id,
          document_name: newItemName,
          is_required: newItemRequired,
          sort_order: templateItems.length + 1
        }]);

      if (error) throw error;

      setShowItemModal(false);
      setNewItemName('');
      setNewItemRequired(true);
      if (showToast) showToast('Document added to template!');
      
      fetchTemplateItems(selectedTemplate.id);
    } catch (err) {
      console.error('Error adding item:', err);
      if (showToast) showToast('Failed to add document.', 'error');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this document from the template?')) return;
    try {
      const { error } = await supabase
        .from('checklist_template_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      if (showToast) showToast('Document removed.');
      fetchTemplateItems(selectedTemplate.id);
    } catch (err) {
      console.error('Error deleting item:', err);
      if (showToast) showToast('Failed to delete document.', 'error');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('WARNING: Deleting this template will not affect existing students, but future students will not get automatic checklists for this profile. Continue?')) return;
    try {
      // Must delete items first due to FK constraints if cascade isn't set
      await supabase.from('checklist_template_items').delete().eq('template_id', templateId);
      
      const { error } = await supabase
        .from('checklist_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      if (showToast) showToast('Template deleted.');
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      if (showToast) showToast('Failed to delete template.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <Loader2 size={40} className="animate-spin" color="var(--admin-primary)" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      
      {/* Left Column: List of Templates */}
      <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#111827' }}>Master Templates</h2>
            <button 
              onClick={() => setShowTemplateModal(true)}
              style={{ background: 'var(--admin-primary)', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> New
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '70vh', overflowY: 'auto' }}>
            {templates.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                No templates configured.
              </div>
            ) : templates.map(t => (
              <div 
                key={t.id} 
                onClick={() => handleSelectTemplate(t)}
                style={{ 
                  padding: '16px 24px', 
                  borderBottom: '1px solid #f3f4f6', 
                  cursor: 'pointer',
                  background: selectedTemplate?.id === t.id ? '#eff6ff' : '#ffffff',
                  borderLeft: selectedTemplate?.id === t.id ? '4px solid #3b82f6' : '4px solid transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ fontWeight: '600', color: selectedTemplate?.id === t.id ? '#1d4ed8' : '#111827', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <MapPin size={16} /> {t.country}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: '#6b7280' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BookOpen size={14} /> {t.education_level}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: t.vertical === 'admission' ? '#059669' : '#d97706', fontWeight: '600' }}>
                    <Layers size={14} /> {t.vertical.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Template Details & Documents */}
      <div style={{ flex: 1 }}>
        {selectedTemplate ? (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', fontWeight: '700', color: '#111827' }}>
                  {selectedTemplate.country} — {selectedTemplate.education_level}
                </h2>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: selectedTemplate.vertical === 'admission' ? '#ecfdf5' : '#fffbeb', color: selectedTemplate.vertical === 'admission' ? '#059669' : '#d97706', padding: '4px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  {selectedTemplate.vertical} Checklist
                </div>
              </div>
              <button 
                onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trash2 size={14} /> Delete Template
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={20} color="#6b7280" /> Standard Required Documents
                </h3>
                <button 
                  onClick={() => setShowItemModal(true)}
                  style={{ background: 'var(--admin-bg-body)', border: '1px solid var(--admin-border-light)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--admin-text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} /> Add Document
                </button>
              </div>

              {loadingItems ? (
                <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 size={24} className="animate-spin" color="#9ca3af" style={{ margin: '0 auto' }} /></div>
              ) : templateItems.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                  <AlertCircle size={32} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>No documents in this template yet.</p>
                  <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '0.85rem' }}>When a student is added for this country/level, their checklist will be empty.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {templateItems.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700', width: '20px' }}>{idx + 1}.</div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.95rem' }}>{item.document_name}</div>
                          {item.is_required && <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600', marginTop: '4px' }}>* Required</div>}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px dashed #d1d5db', padding: '60px 24px', textAlign: 'center', color: '#6b7280' }}>
            <Layers size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#374151' }}>Select a Template</h3>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>Choose a template from the left or create a new one to manage automated document requirements.</p>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showTemplateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '400px', padding: 0, overflow: 'hidden' }}>
            <div className="admin-card-header" style={{ padding: '20px 24px', background: 'var(--admin-bg-body)', margin: 0 }}>
              <h3 className="admin-card-title" style={{ margin: 0 }}>Create Master Template</h3>
              <button onClick={() => setShowTemplateModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--admin-text-muted)" /></button>
            </div>
            <form onSubmit={handleCreateTemplate} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Country</label>
                <input required className="admin-input" value={newCountry} onChange={e => setNewCountry(e.target.value)} placeholder="e.g. Australia" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Education Level</label>
                <select required className="admin-input" value={newLevel} onChange={e => setNewLevel(e.target.value)}>
                  <option value="" disabled>Select Level...</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Diploma">Diploma</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Checklist Type (Vertical)</label>
                <select required className="admin-input" value={newVertical} onChange={e => setNewVertical(e.target.value)}>
                  <option value="admission">Admission (University Documents)</option>
                  <option value="visa">Visa (Immigration Documents)</option>
                </select>
              </div>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '12px', marginTop: '10px', width: '100%' }}>
                Create Blueprint
              </button>
            </form>
          </div>
        </div>
      )}

      {showItemModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '400px', padding: 0, overflow: 'hidden' }}>
            <div className="admin-card-header" style={{ padding: '20px 24px', background: 'var(--admin-bg-body)', margin: 0 }}>
              <h3 className="admin-card-title" style={{ margin: 0 }}>Add Required Document</h3>
              <button onClick={() => setShowItemModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--admin-text-muted)" /></button>
            </div>
            <form onSubmit={handleAddItem} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>Document Name</label>
                <input required className="admin-input" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="e.g. 10th Marksheet" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={newItemRequired} onChange={e => setNewItemRequired(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                This document is strictly required
              </label>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '12px', marginTop: '10px', width: '100%' }}>
                Add to Blueprint
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
