import React, { createContext, useEffect, useState } from 'react';
import api from '@/shared/config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed && (parsed.role === 'Donor' || parsed.persona === 'funder')) {
        parsed.role = 'Funder';
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const saveUserData = (userData) => {
    if (userData && userData._id) {
      if (userData.role === 'Donor' || userData.persona === 'funder') {
        userData.role = 'Funder';
      }
      setUser(userData);
      try {
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData.token) {
          localStorage.setItem('token', userData.token);
        }
      } catch (e) {
        console.warn('Could not persist user to localStorage:', e);
      }
    } else {
      clearUserData();
    }
  };

  const clearUserData = () => {
    setUser(null);
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch (e) {
      console.warn('Could not clear user in localStorage:', e);
    }
  };

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await api.get('/auth/me');
        const userData = data?.user || data;
        if (userData && userData._id) {
          saveUserData(userData);
        } else {
          clearUserData();
        }
      } catch (err) {
        // If fetchMe fails due to auth, clear local user
        if (err.response?.status === 401) {
          clearUserData();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const login = async (email, password, persona) => {
    try {
      const { data } = await api.post('/auth/login', { email, password, persona });
      const userData = data.user || data;
      if (userData) {
        saveUserData(userData);
      } else {
        clearUserData();
      }
      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (payload, maybeEmail, maybePassword) => {
    try {
      let body;
      if (typeof payload === 'object' && payload !== null) {
        body = payload;
      } else {
        body = {
          name: payload,
          email: maybeEmail,
          password: maybePassword,
        };
      }

      const { data } = await api.post('/auth/register', body);
      const userData = data?.user || data;
      saveUserData(userData);
      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const googleAuth = async (googlePayload) => {
    try {
      const { data } = await api.post('/auth/google', googlePayload);
      const userData = data?.user || data;
      if (userData) {
        saveUserData(userData);
      }
      return {
        success: true,
        user: userData,
        isNewUser: data.isNewUser,
        isProfileComplete: data.isProfileComplete,
        needsProfileCompletion: data.needsProfileCompletion,
      };
    } catch (err) {
      const message = err.response?.data?.message || 'Google authentication failed';
      return { success: false, message };
    }
  };

  const completeProfile = async (profilePayload) => {
    try {
      const { data } = await api.post('/auth/complete-profile', profilePayload);
      const userData = data?.user || data;
      if (userData) {
        saveUserData(userData);
      }
      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to complete profile';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout error:', err);
    }
    clearUserData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        register,
        googleAuth,
        completeProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

