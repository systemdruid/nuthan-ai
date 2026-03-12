import React from 'react';
import NoteCard from './NoteCard';

function NoteList({ notes, onDelete, onUpdate, highlightedIds, emptyMessage = 'Nothing here yet.' }) {
  if (notes.length === 0) {
    return <p className="empty-message">{emptyMessage}</p>;
  }

  return (
    <div className="note-list">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={onDelete}
          onUpdate={onUpdate}
          highlighted={highlightedIds.includes(note.id)}
        />
      ))}
    </div>
  );
}

export default NoteList;
