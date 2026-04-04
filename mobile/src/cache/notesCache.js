import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'cached_notes';

export const getCachedNotes = async () => {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
};

export const setCachedNotes = async (notes) => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(notes));
  } catch {}
};

export const addCachedNote = async (note) => {
  const notes = (await getCachedNotes()) ?? [];
  await setCachedNotes([note, ...notes]);
};

export const updateCachedNote = async (updated) => {
  const notes = (await getCachedNotes()) ?? [];
  await setCachedNotes(notes.map(n => n.id === updated.id ? updated : n));
};

export const removeCachedNote = async (id) => {
  const notes = (await getCachedNotes()) ?? [];
  await setCachedNotes(notes.filter(n => n.id !== id));
};

export const replaceTempNote = async (tempId, realNote) => {
  const notes = (await getCachedNotes()) ?? [];
  await setCachedNotes(notes.map(n => n.id === tempId ? realNote : n));
};
