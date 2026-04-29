import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nexus_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const { data } = await API.get('/auth/me');
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('nexus_token', data.token);
      localStorage.setItem('nexus_user', JSON.stringify(data));
      setToken(data.token);
      setUser(data);
      return data;
    } catch (err) {
      if (err.response) {
        throw err;
      }
      // Network error — backend is unreachable
      const networkError = new Error('Unable to connect to the server. Please try again later.');
      networkError.response = { data: { message: 'Unable to connect to the server. Please check your connection and try again.' } };
      throw networkError;
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await API.post('/auth/register', userData);
      localStorage.setItem('nexus_token', data.token);
      localStorage.setItem('nexus_user', JSON.stringify(data));
      setToken(data.token);
      setUser(data);
      return data;
    } catch (err) {
      if (err.response) {
        throw err;
      }
      const networkError = new Error('Unable to connect to the server. Please try again later.');
      networkError.response = { data: { message: 'Unable to connect to the server. Please check your connection and try again.' } };
      throw networkError;
    }
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser(updatedData);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
