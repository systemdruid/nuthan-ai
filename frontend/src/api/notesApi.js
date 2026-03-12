import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const BASE = `${API_URL}/api/notes`;
const TAGS_BASE = `${API_URL}/api/tags`;

export const getNotes = () => axios.get(`${BASE}/`).then(r => r.data);

export const createNote = (data) => axios.post(`${BASE}/`, data).then(r => r.data);

export const deleteNote = (id) => axios.delete(`${BASE}/${id}/`);

export const updateNote = (id, data) => axios.patch(`${BASE}/${id}/`, data).then(r => r.data);

export const queryNotes = (query) =>
  axios.post(`${BASE}/query/`, { query }).then(r => r.data);

export const retagAll = () => axios.post(`${BASE}/retag-all/`).then(r => r.data);

export const searchTags = (search) =>
  axios.get(`${TAGS_BASE}/`, { params: { search } }).then(r => r.data);

export const convertTagToUser = (id) =>
  axios.post(`${TAGS_BASE}/${id}/convert-to-user/`).then(r => r.data);
