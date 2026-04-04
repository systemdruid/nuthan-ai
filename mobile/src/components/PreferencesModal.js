import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { updatePreferences } from '../api/authApi';

const INTERVAL_OPTIONS = [
  { label: 'Off', value: null },
  { label: '30 min', value: 0.5 },
  { label: '1 hour', value: 1 },
  { label: '2 hours', value: 2 },
  { label: '4 hours', value: 4 },
  { label: '8 hours', value: 8 },
  { label: '24 hours', value: 24 },
];

export default function PreferencesModal({ visible, preferences, onClose, onSave }) {
  const [interval, setInterval] = useState(preferences?.follow_up_interval_hours ?? 1);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updatePreferences({ follow_up_interval_hours: interval });
      onSave(updated);
      onClose();
    } catch (e) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message;
      Alert.alert('Error', msg || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Preferences</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Task follow-up reminder</Text>
          <Text style={styles.hint}>Repeating notification to remind you of pending tasks</Text>

          <View style={styles.options}>
            {INTERVAL_OPTIONS.map(opt => (
              <TouchableOpacity
                key={String(opt.value)}
                style={[styles.option, interval === opt.value && styles.optionSelected]}
                onPress={() => setInterval(opt.value)}
              >
                <Text style={[styles.optionText, interval === opt.value && styles.optionTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  close: {
    fontSize: 18,
    color: '#6b7280',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 16,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  optionSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
