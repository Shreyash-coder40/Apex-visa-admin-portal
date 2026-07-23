import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import AdminPortal from './components/admin/AdminPortal';
import Login from './Login';
import './index.css';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // If no session, show the secure Login Gateway
  if (!session) {
    return <Login />;
  }

  // If logged in, show the full Admin CRM Portal
  return (
    <AdminPortal />
  );
}

export default App;
