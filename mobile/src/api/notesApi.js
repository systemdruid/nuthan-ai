import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

const BASE = `${API_URL}/api/notes`;
const TAGS_BASE = `${API_URL}/api/tags`;

const auth = async () => {
  const token = await AsyncStorage.getItem('access_token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const getNotes = async () => {
  const c = await auth();
  return axios.get(`${BASE}/`, c).then(r => r.data);
};

export const createNote = async (data) => {
  const c = await auth();
  return axios.post(`${BASE}/`, data, c).then(r => r.data);
};

export const deleteNote = async (id) => {
  const c = await auth();
  return axios.delete(`${BASE}/${id}/`, c);
};

export const updateNote = async (id, data) => {
  const c = await auth();
  return axios.patch(`${BASE}/${id}/`, data, c).then(r => r.data);
};

export const queryNotes = async (query) => {
  const c = await auth();
  return axios.post(`${BASE}/query/`, { query }, c).then(r => r.data);
};

export const retagAll = async () => {
  const c = await auth();
  return axios.post(`${BASE}/retag-all/`, {}, c).then(r => r.data);
};

export const searchTags = async (search) => {
  const c = await auth();
  return axios.get(`${TAGS_BASE}/`, { ...c, params: { search } }).then(r => r.data);
};

export const convertTagToUser = async (id) => {
  const c = await auth();
  return axios.post(`${TAGS_BASE}/${id}/convert-to-user/`, {}, c).then(r => r.data);
};
