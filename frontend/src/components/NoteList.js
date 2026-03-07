import React from 'react';
import NoteCard from './NoteCard';

function NoteList({ notes, onDelete, highlightedIds }) {
  if (notes.length === 0) {
    return <p className="empty-message">No notes yet. Add one above!</p>;
  }

  return (
    <div className="note-list">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={onDelete}
          highlighted={highlightedIds.includes(note.id)}
        />
      ))}
    </div>
  );
}

export default NoteList;
