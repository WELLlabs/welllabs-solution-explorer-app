import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate('/dashboard');
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
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Register error', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Server error during registration' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
