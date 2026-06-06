import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { registerLogoutCallback } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState({
    userid: null,
    roleid: null,
    username: null,
    status: 'idle', // 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  });
  const navigate = useNavigate();

  // Validate the session on initial mount (handles page refresh persistence)
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    setSession(s => ({ ...s, status: 'loading' }));
    try {
      const data = await authService.checkSession();
      if (data?.userid) {
        setSession({
          userid: data.userid,
          roleid: data.roleid,
          username: data.username || `User_${data.userid}`,
          status: 'authenticated',
        });
      } else {
        setSession({ userid: null, roleid: null, username: null, status: 'unauthenticated' });
      }
    } catch (err) {
      setSession({ userid: null, roleid: null, username: null, status: 'unauthenticated' });
    }
  }

  function login(sessionData) {
    setSession({
      userid: sessionData.userid,
      roleid: sessionData.roleid,
      username: sessionData.username || `User_${sessionData.userid}`,
      status: 'authenticated',
    });
  }

  function logout() {
    authService.logout().finally(() => {
      setSession({ userid: null, roleid: null, username: null, status: 'unauthenticated' });
      navigate('/');
    });
  }

  // Bind the centralized apiFetch 401 response interceptor to our logout function
  useEffect(() => {
    registerLogoutCallback(logout);
  }, []);

  return (
    <AuthContext.Provider value={{ ...session, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}
