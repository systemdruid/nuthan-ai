import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'offline_sync_queue';

const load = async () => {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

const save = async (queue) => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(queue));
  } catch {}
};

export const enqueueCreate = async (tempId, data) => {
  const q = await load();
  q.push({ type: 'create', tempId, data });
  await save(q);
};

export const enqueueUpdate = async (id, data) => {
  const q = await load();
  // If updating a still-pending temp note, merge into its create entry
  const idx = q.findIndex(op => op.type === 'create' && op.tempId === id);
  if (idx !== -1) {
    q[idx].data = { ...q[idx].data, ...data };
  } else {
    q.push({ type: 'update', id, data });
  }
  await save(q);
};

export const enqueueDelete = async (id) => {
  const q = await load();
  // If deleting a temp note, just remove its create entry — nothing to delete on server
  const withoutCreate = q.filter(op => !(op.type === 'create' && op.tempId === id));
  if (withoutCreate.length < q.length) {
    await save(withoutCreate);
  } else {
    q.push({ type: 'delete', id });
    await save(q);
  }
};

export const getQueue = load;

export const saveQueue = save;

export const getPendingCount = async () => (await load()).length;
