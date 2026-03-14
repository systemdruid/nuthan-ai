import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const googleLogin = (credential) =>
  axios.post(`${API_URL}/api/auth/google/`, { credential }).then(r => r.data);

export const getStoredUser = () => {
  const token = localStorage.getItem('access_token');
  const user = localStorage.getItem('auth_user');
  if (!token || !user) return null;
  try { return JSON.parse(user); } catch { return null; }
};

export const storeAuth = (access, user) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('auth_user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('auth_user');
};
