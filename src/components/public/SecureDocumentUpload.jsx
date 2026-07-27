import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Upload, CheckCircle2, FileText, AlertCircle, Loader2 } from 'lucide-react';

export default function SecureDocumentUpload() {
  const { inviteCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingDocId, setUploadingDocId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error: rpcError } = await supabase.rpc('get_checklist_by_invite', { p_invite_code: inviteCode });
      
      if (rpcError) throw rpcError;
      if (!result) {
        setError('Invalid or expired link.');
        return;
      }
      
      // Handle cases where documents might come back as a JSON string instead of an array
      if (typeof result.documents === 'string') {
        try {
          result.documents = JSON.parse(result.documents);
        } catch (e) {
          result.documents = [];
        }
      }
      if (!Array.isArray(result.documents)) {
        result.documents = [];
      }
      
      setData(result);
    } catch (err) {
      console.error(err);
      setError(`Error: ${err.message || 'An error occurred loading your checklist.'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [inviteCode]);

  const handleFileUpload = async (e, doc) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB');
      return;
    }

    // Validate type
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    try {
      setUploadingDocId(doc.id);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${data.student_id}/${Date.now()}_${doc.id}.${fileExt}`;

      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('student_documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Call RPC to update document status
      const { error: rpcError, data: success } = await supabase.rpc('update_document_status_by_invite', {
        p_invite_code: inviteCode,
        p_document_id: doc.id,
        p_file_url: fileName
      });

      if (rpcError || !success) throw new Error('Failed to update document status');

      // Refresh list
      await fetchData();

    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploadingDocId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <Loader2 className="animate-spin" size={48} color="#3b82f6" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '400px' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Access Denied</h1>
          <p style={{ color: '#64748b' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: '#3b82f6', color: 'white', borderRadius: '12px', marginBottom: '16px', fontWeight: '800', fontSize: '1.5rem' }}>
            V
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>
            Secure Document Upload
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
            Welcome back, <strong style={{ color: '#0f172a' }}>{data.student_name}</strong>. Please provide the required documents for your {data.level} application to {data.destination}.
          </p>
        </div>

        {/* Document List */}
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#3b82f6" /> Action Required
            </h2>
          </div>
          
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {data.documents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>All Caught Up!</h3>
                <p style={{ color: '#64748b', margin: 0 }}>You have no pending documents to upload. We are reviewing your file.</p>
              </div>
            ) : (
              data.documents.map((doc, index) => (
                <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 4px 0' }}>
                        {doc.document_name}
                      </h3>
                      {doc.status === 'Rejected' && (
                        <span style={{ background: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>Rejected</span>
                      )}
                    </div>
                    {doc.description && <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{doc.description}</p>}
                    {doc.status === 'Rejected' && <p style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '6px', fontWeight: '500' }}>Please re-upload a clear, valid PDF copy.</p>}
                  </div>
                  
                  <div style={{ marginTop: '8px' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                      Please upload your {doc.document_name} below (PDF only, max 5MB):
                    </p>
                    <label style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
                      width: '100%', padding: '12px', background: 'white', border: '2px dashed #cbd5e1', 
                      borderRadius: '8px', cursor: uploadingDocId === doc.id ? 'not-allowed' : 'pointer',
                      color: uploadingDocId === doc.id ? '#94a3b8' : '#3b82f6', fontWeight: '600', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { if (uploadingDocId !== doc.id) { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; } }}
                    onMouseLeave={e => { if (uploadingDocId !== doc.id) { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'white'; } }}
                    >
                      {uploadingDocId === doc.id ? (
                        <><Loader2 className="animate-spin" size={20} /> Uploading...</>
                      ) : (
                        <><Upload size={20} /> Select PDF File</>
                      )}
                      <input 
                        type="file" 
                        accept=".pdf" 
                        style={{ display: 'none' }} 
                        disabled={uploadingDocId === doc.id}
                        onChange={(e) => handleFileUpload(e, doc)} 
                      />
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.85rem', color: '#94a3b8' }}>
          Secure Portal powered by VisaCRM
        </div>
      </div>
    </div>
  );
}
