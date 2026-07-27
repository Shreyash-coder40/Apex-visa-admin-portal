import React, { useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Lock, Mail, KeyRound, Building2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
    } catch (err) {
      console.error('Auth Error:', err);
      let errorMsg = err?.message;
      if (!errorMsg) {
        try {
          errorMsg = JSON.stringify(err, Object.getOwnPropertyNames(err));
        } catch(e) {
          errorMsg = 'An unknown error occurred.';
        }
      }
      setError(errorMsg);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070a12', color: '#fff' }}>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '420px', backdropFilter: 'blur(10px)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Building2 size={32} color="#00f2fe" />
          </div>
          <h2 style={{ fontSize: '1.6rem', margin: '0 0 8px 0' }}>Apex Staff CRM</h2>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>Staff Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '12px 14px 12px 42px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem' }}
                placeholder="admin@apexconsultancy.com"
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px 14px 12px 42px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem' }}
                placeholder="••••••••"
              />
            </div>
          </div>



          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '6px' }}>{error}</div>}
          {message && <div style={{ color: '#10b981', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '6px' }}>{message}</div>}

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: '600', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}
          >
            <Lock size={18} />
            {loading ? 'Processing...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
