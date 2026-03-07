import React from 'react';
import NoteCard from './NoteCard';

function QueryResults({ results, onDelete }) {
  if (!results) return null;

  const { relevant_notes, explanation } = results;

  return (
    <div className="query-results">
      <h3>AI Results</h3>
      <p className="explanation">{explanation}</p>
      {relevant_notes.length === 0 ? (
        <p className="empty-message">No matching notes found.</p>
      ) : (
        <div className="note-list">
          {relevant_notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={onDelete}
              highlighted={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default QueryResults;
