import React, { createContext, useState, useContext, useEffect } from 'react';
import { getItem, setItem, deleteItem } from '../services/storage';
import { login as loginApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await getItem('auth_token');
      const userData = await getItem('user_data');
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (err) {
      console.error('Load user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    const response = await loginApi(phone, password);
    const { token, user: userData } = response.data;
    await setItem('auth_token', token);
    await setItem('user_data', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await deleteItem('auth_token');
    await deleteItem('user_data');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
