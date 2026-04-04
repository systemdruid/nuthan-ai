import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDateTime(unixTs) {
  const d = new Date(unixTs * 1000);
  const pad = n => String(n).padStart(2, '0');
  const h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${h12}:${pad(d.getMinutes())} ${ampm}`;
}

function remindStyle(remindAt) {
  if (!remindAt) return null;
  const date = new Date(remindAt * 1000);
  const now = new Date();
  if (date < now) return styles.remindOverdue;
  if (date.toDateString() === now.toDateString()) return styles.remindToday;
  return null;
}

export default function NoteCard({ note, onEdit, onDelete }) {
  const userTags = (note.tags || []).filter(t => t.source === 'user');
  const aiTags = (note.tags || []).filter(t => t.source === 'ai');

  return (
    <View style={styles.card}>
      {note._pending && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>⟳ Pending sync</Text>
        </View>
      )}
      <Text style={styles.content}>{note.content}</Text>

      {(userTags.length > 0 || aiTags.length > 0) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
          {userTags.map(t => (
            <View key={t.id} style={styles.tagUser}>
              <Text style={styles.tagUserText}>{t.name}</Text>
            </View>
          ))}
          {aiTags.map(t => (
            <View key={t.id} style={styles.tagAi}>
              <Text style={styles.tagAiText}>{t.name} ✦</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <View>
          <Text style={styles.date}>
            {new Date(note.created_at).toLocaleDateString()}
          </Text>
          {note.remind_at && (
            <Text style={[styles.remind, remindStyle(note.remind_at)]}>
              ⏰ {formatDateTime(note.remind_at)}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(note)}>
            <Text style={styles.editBtnText}>✏️</Text>
          </TouchableOpacity>
          {note.type === 'task' ? (
            <TouchableOpacity style={styles.completeBtn} onPress={() => onDelete(note.id)}>
              <Text style={styles.completeBtnText}>Complete</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(note.id)}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    fontSize: 15,
    color: '#1a1a2e',
    lineHeight: 22,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tagUser: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  tagUserText: {
    fontSize: 12,
    color: '#1d4ed8',
  },
  tagAi: {
    backgroundColor: '#fce7f3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  tagAiText: {
    fontSize: 12,
    color: '#9d174d',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
  },
  remind: {
    fontSize: 12,
    color: '#4a90e2',
    marginTop: 2,
  },
  remindToday: {
    color: '#16a34a',
    fontWeight: '600',
  },
  remindOverdue: {
    color: '#dc2626',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  editBtnText: {
    fontSize: 13,
    color: '#374151',
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  deleteBtnText: {
    fontSize: 13,
    color: '#dc2626',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  pendingText: {
    fontSize: 11,
    color: '#92400e',
  },
  completeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#dcfce7',
  },
  completeBtnText: {
    fontSize: 13,
    color: '#16a34a',
  },
});
