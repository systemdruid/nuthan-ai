import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import {
  getCachedNotes, setCachedNotes, addCachedNote,
  updateCachedNote, removeCachedNote, replaceTempNote,
} from '../cache/notesCache';
import {
  getQueue, saveQueue, enqueueCreate, enqueueUpdate, enqueueDelete,
} from '../cache/syncQueue';

const BASE = `${API_URL}/api/notes`;
const TAGS_BASE = `${API_URL}/api/tags`;

const auth = async () => {
  const token = await AsyncStorage.getItem('access_token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const isOfflineError = (e) => !e.response;

const isTempId = (id) => typeof id === 'string' && id.startsWith('temp_');

// Process queued offline operations — called automatically on next successful fetch
export const syncPending = async () => {
  const queue = await getQueue();
  if (!queue.length) return;

  const c = await auth();
  const remaining = [];

  for (const op of queue) {
    try {
      if (op.type === 'create') {
        const real = await axios.post(`${BASE}/`, op.data, c).then(r => r.data);
        await replaceTempNote(op.tempId, real);
      } else if (op.type === 'update') {
        const updated = await axios.patch(`${BASE}/${op.id}/`, op.data, c).then(r => r.data);
        await updateCachedNote(updated);
      } else if (op.type === 'delete') {
        await axios.delete(`${BASE}/${op.id}/`, c);
      }
    } catch (e) {
      if (isOfflineError(e)) {
        remaining.push(op); // Still offline — keep for later
      }
      // Server errors (404, 422, etc.) — discard the op
    }
  }

  await saveQueue(remaining);
};

// Returns { notes: Note[], offline: boolean }
export const getNotes = async () => {
  const c = await auth();
  try {
    await syncPending();
    const data = await axios.get(`${BASE}/`, c).then(r => r.data);
    await setCachedNotes(data);
    return { notes: data, offline: false };
  } catch (e) {
    if (e.response?.status === 401) throw e;
    return { notes: (await getCachedNotes()) ?? [], offline: true };
  }
};

export const createNote = async (data) => {
  const c = await auth();
  try {
    const note = await axios.post(`${BASE}/`, data, c).then(r => r.data);
    await addCachedNote(note);
    return note;
  } catch (e) {
    if (!isOfflineError(e)) throw e;
    // Offline: create a local temp note and queue for sync
    const tempNote = {
      id: `temp_${Date.now()}`,
      content: data.content,
      type: data.type ?? 'note',
      tags: (data.tag_names ?? []).map((name, i) => ({ id: `temp_tag_${i}`, name, source: 'user' })),
      remind_at: data.remind_at ?? null,
      created_at: new Date().toISOString(),
      _pending: true,
    };
    await addCachedNote(tempNote);
    await enqueueCreate(tempNote.id, data);
    return tempNote;
  }
};

export const updateNote = async (id, data) => {
  // Temp note: never sent to server yet — just update cache and merge into create entry
  if (isTempId(id)) {
    const notes = (await getCachedNotes()) ?? [];
    const existing = notes.find(n => n.id === id);
    const optimistic = {
      ...existing,
      content: data.content ?? existing?.content,
      tags: data.tag_names
        ? data.tag_names.map((name, i) => ({ id: `temp_tag_${i}`, name, source: 'user' }))
        : existing?.tags ?? [],
      remind_at: data.remind_at !== undefined ? data.remind_at : existing?.remind_at,
    };
    await updateCachedNote(optimistic);
    await enqueueUpdate(id, data);
    return optimistic;
  }

  const c = await auth();
  try {
    const note = await axios.patch(`${BASE}/${id}/`, data, c).then(r => r.data);
    await updateCachedNote(note);
    return note;
  } catch (e) {
    if (!isOfflineError(e)) throw e;
    // Offline: apply optimistically
    const notes = (await getCachedNotes()) ?? [];
    const existing = notes.find(n => n.id === id);
    const optimistic = {
      ...existing,
      content: data.content ?? existing?.content,
      tags: data.tag_names
        ? data.tag_names.map((name, i) => ({ id: `temp_tag_${i}`, name, source: 'user' }))
        : existing?.tags ?? [],
      remind_at: data.remind_at !== undefined ? data.remind_at : existing?.remind_at,
      _pending: true,
    };
    await updateCachedNote(optimistic);
    await enqueueUpdate(id, data);
    return optimistic;
  }
};

export const deleteNote = async (id) => {
  // Remove from local cache immediately (optimistic)
  await removeCachedNote(id);

  if (isTempId(id)) {
    await enqueueDelete(id); // Removes the create entry from queue
    return;
  }

  const c = await auth();
  try {
    await axios.delete(`${BASE}/${id}/`, c);
  } catch (e) {
    if (isOfflineError(e)) await enqueueDelete(id);
    // Server errors (404 = already gone) — silently ignore
  }
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
  try {
    return await axios.get(`${TAGS_BASE}/`, { ...c, params: { search } }).then(r => r.data);
  } catch {
    return [];
  }
};

export const convertTagToUser = async (id) => {
  const c = await auth();
  return axios.post(`${TAGS_BASE}/${id}/convert-to-user/`, {}, c).then(r => r.data);
};
