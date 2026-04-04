import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

export const googleLogin = (idToken) =>
  axios.post(`${API_URL}/api/auth/google/`, { credential: idToken }).then(r => r.data);

export const storeAuth = async (access, user) => {
  await AsyncStorage.setItem('access_token', access);
  await AsyncStorage.setItem('auth_user', JSON.stringify(user));
};

export const getStoredAuth = async () => {
  const token = await AsyncStorage.getItem('access_token');
  const user = await AsyncStorage.getItem('auth_user');
  if (!token || !user) return null;
  try { return { token, user: JSON.parse(user) }; } catch { return null; }
};

export const clearAuth = async () => {
  await AsyncStorage.multiRemove(['access_token', 'auth_user']);
};

const authHeader = async () => {
  const token = await AsyncStorage.getItem('access_token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const getPreferences = async () => {
  const c = await authHeader();
  return axios.get(`${API_URL}/api/preferences/`, c).then(r => r.data);
};

export const updatePreferences = async (prefs) => {
  const c = await authHeader();
  return axios.patch(`${API_URL}/api/preferences/`, prefs, c).then(r => r.data);
};
