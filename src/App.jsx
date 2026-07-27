import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './Login';
import AdminPortal from './components/admin/AdminPortal';
import './index.css';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SecureDocumentUpload from './components/public/SecureDocumentUpload';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', background: '#070a12' }}></div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/upload/:inviteCode" element={<SecureDocumentUpload />} />
        <Route path="*" element={!session ? <Login /> : <AdminPortal session={session} />} />
      </Routes>
    </Router>
  );
}

export default App;
