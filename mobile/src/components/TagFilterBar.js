import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';

export default function TagFilterBar({ allTags, selectedTags, onChange }) {
  if (!allTags.length) return null;

  const toggle = (name) => {
    if (selectedTags.includes(name)) {
      onChange(selectedTags.filter(t => t !== name));
    } else {
      onChange([...selectedTags, name]);
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {selectedTags.length > 0 && (
          <TouchableOpacity style={styles.clearChip} onPress={() => onChange([])}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
        {allTags.map(tag => {
          const selected = selectedTags.includes(tag.name);
          return (
            <TouchableOpacity
              key={tag.name}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggle(tag.name)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {tag.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
  },
  chipSelected: {
    backgroundColor: '#4a90e2',
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  clearChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
  },
  clearText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
  },
});
