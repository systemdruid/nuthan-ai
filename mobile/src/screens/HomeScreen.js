import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, TextInput, ActivityIndicator, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NoteCard from '../components/NoteCard';
import NoteFormModal from '../components/NoteFormModal';
import TagFilterBar from '../components/TagFilterBar';
import PreferencesModal from '../components/PreferencesModal';
import { Feather } from '@expo/vector-icons';
import {
  getNotes, createNote, deleteNote, updateNote, queryNotes,
} from '../api/notesApi';
import { getPendingCount } from '../cache/syncQueue';
import { scheduleReminder, cancelReminder, schedulePendingTasksReminder } from '../notifications';
import { getPreferences } from '../api/authApi';

function SectionHeader({ title, open, onToggle }) {
  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
      <Text style={styles.sectionArrow}>{open ? '▼' : '▶'}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ user, onLogout }) {
  const [notes, setNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tasksOpen, setTasksOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [preferences, setPreferences] = useState({ follow_up_interval_hours: 1 });
  const [prefsVisible, setPrefsVisible] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const { notes: data, offline } = await getNotes();
      setNotes(data);
      setIsOffline(offline);
      setPendingCount(await getPendingCount());
      schedulePendingTasksReminder(
        data.filter(n => n.type === 'task').length,
        preferences.follow_up_interval_hours,
      );
    } catch (e) {
      if (e.response?.status === 401) onLogout();
    }
  }, [onLogout]);

  useEffect(() => {
    getPreferences().then(setPreferences).catch(() => {});
    fetchNotes();
  }, [fetchNotes]);

  // Re-sync whenever the app comes back to the foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') fetchNotes();
    });
    return () => sub.remove();
  }, [fetchNotes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  };

  const handleSave = async (data) => {
    try {
      if (editingNote) {
        const updated = await updateNote(editingNote.id, data);
        setNotes(prev => prev.map(n => n.id === editingNote.id ? updated : n));
        setPendingCount(await getPendingCount());
        if (!updated._pending) {
          await scheduleReminder(updated.id, updated.remind_at, updated.content);
        }
      } else {
        const created = await createNote(data);
        await fetchNotes();
        if (!created._pending) {
          await scheduleReminder(created.id, created.remind_at, created.content);
        }
      }
      setFormVisible(false);
      setEditingNote(null);
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  };

  const handleDelete = (id) => {
    const isTask = notes.find(n => n.id === id)?.type === 'task';
    Alert.alert(
      isTask ? 'Complete Task' : 'Delete',
      isTask ? 'Mark this task as complete?' : 'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isTask ? 'Complete' : 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteNote(id);
            await cancelReminder(id);
            setNotes(prev => prev.filter(n => n.id !== id));
            setPendingCount(await getPendingCount());
            const remainingTasks = notes.filter(n => n.id !== id && n.type === 'task').length;
            schedulePendingTasksReminder(remainingTasks, preferences.follow_up_interval_hours);
            if (queryResults) {
              setQueryResults(prev => ({
                ...prev,
                relevant_notes: prev.relevant_notes.filter(n => n.id !== id),
              }));
            }
          } catch {
            Alert.alert('Error', 'Failed to delete.');
          }
          },
        },
      ]
    );
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormVisible(true);
  };

  const handleQuery = async () => {
    if (!query.trim()) { setQueryResults(null); return; }
    setQueryLoading(true);
    try {
      const results = await queryNotes(query.trim());
      setQueryResults(results);
    } catch {
      Alert.alert('Error', 'Query failed.');
    } finally {
      setQueryLoading(false);
    }
  };

  const allTags = Array.from(
    new Map(notes.flatMap(n => n.tags || []).map(t => [t.name, t])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filterNotes = (list) =>
    selectedTags.length === 0
      ? list
      : list.filter(n => selectedTags.some(name => (n.tags || []).some(t => t.name === name)));

  const tasks = filterNotes(notes.filter(n => n.type === 'task')).slice().sort((a, b) => {
    if (!a.remind_at && !b.remind_at) return 0;
    if (!a.remind_at) return 1;
    if (!b.remind_at) return -1;
    return new Date(a.remind_at) - new Date(b.remind_at);
  });

  const notesList = filterNotes(notes.filter(n => n.type === 'note'));

  const relevantIds = queryResults ? queryResults.relevant_notes.map(n => n.id) : null;

  const visibleTasks = relevantIds ? tasks.filter(n => relevantIds.includes(n.id)) : tasks;
  const visibleNotes = relevantIds ? notesList.filter(n => relevantIds.includes(n.id)) : notesList;

  const sections = [
    ...(tasksOpen ? [{ title: `Tasks (${visibleTasks.length})`, data: visibleTasks, key: 'tasks' }] : [{ title: `Tasks (${visibleTasks.length})`, data: [], key: 'tasks' }]),
    ...(notesOpen ? [{ title: `Notes (${visibleNotes.length})`, data: visibleNotes, key: 'notes' }] : [{ title: `Notes (${visibleNotes.length})`, data: [], key: 'notes' }]),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>Recallio AI</Text>
          <Text style={styles.userName}>{user?.name || user?.email}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setPrefsVisible(true)}>
            <Feather name="settings" size={20} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            {pendingCount > 0
              ? `Offline · ${pendingCount} change${pendingCount !== 1 ? 's' : ''} pending sync`
              : 'Offline · showing cached data'}
          </Text>
        </View>
      )}

      {/* Query bar */}
      <View style={styles.queryRow}>
        <TextInput
          style={styles.queryInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Ask anything about your notes…"
          placeholderTextColor="#9ca3af"
          returnKeyType="search"
          onSubmitEditing={handleQuery}
        />
        <TouchableOpacity style={styles.queryBtn} onPress={handleQuery} disabled={queryLoading}>
          {queryLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.queryBtnText}>Ask</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Query results banner */}
      {queryResults && (
        <View style={styles.resultsBanner}>
          <Text style={styles.resultsText} numberOfLines={2}>{queryResults.explanation}</Text>
          <TouchableOpacity onPress={() => { setQueryResults(null); setQuery(''); }}>
            <Text style={styles.clearResults}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tag filter */}
      <TagFilterBar allTags={allTags} selectedTags={selectedTags} onChange={setSelectedTags} />

      {/* Notes list */}
      <SectionList
        sections={sections}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderSectionHeader={({ section }) => (
          <SectionHeader
            title={section.title}
            open={section.key === 'tasks' ? tasksOpen : notesOpen}
            onToggle={() => section.key === 'tasks' ? setTasksOpen(o => !o) : setNotesOpen(o => !o)}
          />
        )}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            highlighted={!!relevantIds}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notes yet. Tap + to add one.</Text>}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => { setEditingNote(null); setFormVisible(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Preferences modal */}
      <PreferencesModal
        visible={prefsVisible}
        preferences={preferences}
        onClose={() => setPrefsVisible(false)}
        onSave={(updated) => {
          setPreferences(updated);
          schedulePendingTasksReminder(
            notes.filter(n => n.type === 'task').length,
            updated.follow_up_interval_hours,
          );
        }}
      />

      {/* Create / Edit modal */}
      <NoteFormModal
        visible={formVisible}
        note={editingNote}
        onSave={handleSave}
        onClose={() => { setFormVisible(false); setEditingNote(null); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#e5e7eb',
  },
  appName: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  userName: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  headerActions: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  iconBtn: {
    padding: 6,
  },
  logoutBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db',
  },
  logoutText: { fontSize: 13, color: '#6b7280' },
  queryRow: {
    flexDirection: 'row', padding: 12, gap: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb',
  },
  queryInput: {
    flex: 1, borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 14, color: '#1a1a2e',
  },
  queryBtn: {
    backgroundColor: '#4a90e2', borderRadius: 8,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  queryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  resultsBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#eff6ff', padding: 12, borderBottomWidth: 1, borderColor: '#bfdbfe',
  },
  resultsText: { flex: 1, fontSize: 13, color: '#1d4ed8', marginRight: 8 },
  clearResults: { fontSize: 16, color: '#6b7280' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f0f2f5',
  },
  sectionArrow: { fontSize: 11, color: '#6b7280', marginRight: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151' },
  list: { paddingBottom: 100 },
  empty: { textAlign: 'center', color: '#9ca3af', padding: 32, fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#4a90e2', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  offlineBanner: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  offlineText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
