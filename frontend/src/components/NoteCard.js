import React, { useState } from 'react';

function NoteCard({ note, onDelete, highlighted }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(note.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className={`note-card ${highlighted ? 'highlighted' : ''}`}>
      <div className="note-header">
        <button
          className={`delete-btn ${confirmDelete ? 'confirm' : ''}`}
          onClick={handleDelete}
          title={confirmDelete ? 'Click again to confirm delete' : 'Delete note'}
        >
          {confirmDelete ? 'Confirm?' : '×'}
        </button>
      </div>
      <p className="note-content">{note.content}</p>
      <span className="note-date">
        {new Date(note.created_at).toLocaleDateString()}
      </span>
    </div>
  );
}

export default NoteCard;
