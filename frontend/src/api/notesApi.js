import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const BASE = `${API_URL}/api/notes`;

export const getNotes = () => axios.get(`${BASE}/`).then(r => r.data);

export const createNote = (data) => axios.post(`${BASE}/`, data).then(r => r.data);

export const deleteNote = (id) => axios.delete(`${BASE}/${id}/`);

export const queryNotes = (query) =>
  axios.post(`${BASE}/query/`, { query }).then(r => r.data);

export const retagAll = () => axios.post(`${BASE}/retag-all/`).then(r => r.data);

export const searchTags = (search) =>
  axios.get(`${BASE}/tags/`, { params: { search } }).then(r => r.data);
