import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import axios from 'axios';


// Enable sending cookies in all cross-origin requests
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Configure base URL for Axios
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      setUser(response.data);
      navigate('/home');
      return { success: true };
    } catch (error) {
      console.error('Login error', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Server error during login' 
      };
    }
  };

  const register = async (name, email, password, secretKey) => {
    try {
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        secretKey 
      });
      
      setUser(response.data);
      navigate('/home');
      return { success: true };
    } catch (error) {
      console.error('Register error', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Server error during registration' 
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
