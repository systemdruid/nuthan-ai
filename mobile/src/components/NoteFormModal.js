import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { searchTags } from '../api/notesApi';

export default function NoteFormModal({ visible, note, onSave, onClose }) {
  const isEdit = !!note;
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [userTags, setUserTags] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [remindAt, setRemindAt] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const pendingDate = useRef(null);

  useEffect(() => {
    if (visible) {
      setContent(note?.content || '');
      setUserTags(note ? (note.tags || []).filter(t => t.source === 'user').map(t => t.name) : []);
      setTagInput('');
      setSuggestions([]);
      setRemindAt(note?.remind_at ? new Date(note.remind_at * 1000) : null);
    }
  }, [visible, note]);

  useEffect(() => {
    if (!tagInput.trim()) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const results = await searchTags(tagInput.trim());
        setSuggestions(results.filter(t => !userTags.includes(t.name)));
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [tagInput, userTags]);

  const addTag = (name) => {
    const n = name.toLowerCase().trim();
    if (n && !userTags.includes(n)) setUserTags(prev => [...prev, n]);
    setTagInput('');
    setSuggestions([]);
  };

  const removeTag = (name) => setUserTags(prev => prev.filter(t => t !== name));

  const handleDateChange = (event, selected) => {
    setShowDatePicker(false);
    if (event.type === 'dismissed') return;
    const base = remindAt || new Date();
    const next = new Date(base);
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    pendingDate.current = next;
    setRemindAt(next);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event, selected) => {
    setShowTimePicker(false);
    if (event.type === 'dismissed') return;
    const base = pendingDate.current || remindAt || new Date();
    const next = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      selected.getHours(),
      selected.getMinutes(),
      0, 0,
    );
    pendingDate.current = null;
    setRemindAt(next);
  };

  const formatRemindAt = (date) => {
    if (!date) return '';
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const pad = n => String(n).padStart(2, '0');
    const h = date.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${h12}:${pad(date.getMinutes())} ${ampm}`;
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await onSave({
      content: content.trim(),
      tag_names: userTags,
      remind_at: remindAt ? Math.floor(remindAt.getTime() / 1000) : null,
    });
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Edit' : 'New Note'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving || !content.trim()}>
            {saving
              ? <ActivityIndicator size="small" color="#4a90e2" />
              : <Text style={[styles.save, !content.trim() && styles.saveDisabled]}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind?"
            placeholderTextColor="#9ca3af"
            multiline
            autoFocus
          />

          <Text style={styles.label}>Tags</Text>
          {userTags.length > 0 && (
            <View style={styles.pills}>
              {userTags.map(t => (
                <TouchableOpacity key={t} style={styles.pill} onPress={() => removeTag(t)}>
                  <Text style={styles.pillText}>{t} ×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TextInput
            style={styles.tagInput}
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="Add a tag…"
            placeholderTextColor="#9ca3af"
            onSubmitEditing={() => tagInput.trim() && addTag(tagInput)}
            blurOnSubmit={false}
          />
          {suggestions.map(t => (
            <TouchableOpacity key={t.id} style={styles.suggestion} onPress={() => addTag(t.name)}>
              <Text style={styles.suggestionText}>{t.name}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.label, { marginTop: 20 }]}>Remind me</Text>
          <View style={styles.remindRow}>
            <TouchableOpacity style={styles.remindBtn} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.remindBtnText}>
                {remindAt ? formatRemindAt(remindAt) : 'Set a reminder…'}
              </Text>
            </TouchableOpacity>
            {remindAt && (
              <TouchableOpacity style={styles.clearRemind} onPress={() => setRemindAt(null)}>
                <Text style={styles.clearRemindText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={remindAt || new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={remindAt || new Date()}
              mode="time"
              onChange={handleTimeChange}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: { fontSize: 17, fontWeight: '600', color: '#1a1a2e' },
  cancel: { fontSize: 16, color: '#6b7280' },
  save: { fontSize: 16, color: '#4a90e2', fontWeight: '600' },
  saveDisabled: { opacity: 0.4 },
  body: { flex: 1, padding: 16 },
  contentInput: {
    fontSize: 16,
    color: '#1a1a2e',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
    lineHeight: 24,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  pill: { backgroundColor: '#dbeafe', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 13, color: '#1d4ed8' },
  tagInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#1a1a2e',
  },
  suggestion: { padding: 12, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  suggestionText: { fontSize: 15, color: '#374151' },
  remindRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  remindBtn: {
    flex: 1, borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 8, padding: 10,
  },
  remindBtnText: { fontSize: 15, color: '#374151' },
  clearRemind: { padding: 8 },
  clearRemindText: { fontSize: 16, color: '#6b7280' },
});
