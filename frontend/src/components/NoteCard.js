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
        <div className="note-badges">
          {note.urgent && <span className="badge badge-urgent">Urgent</span>}
          {note.important && <span className="badge badge-important">Important</span>}
        </div>
        <button
          className={`delete-btn ${confirmDelete ? 'confirm' : ''}`}
          onClick={handleDelete}
          title={confirmDelete ? 'Click again to confirm delete' : 'Delete note'}
        >
          {confirmDelete ? 'Confirm?' : '×'}
        </button>
      </div>
      <p className="note-content">{note.content}</p>
      <div className="note-footer">
        <span className="note-date">
          {new Date(note.created_at).toLocaleDateString()}
        </span>
        {note.remind_at && (
          <span className="note-remind">
            Remind: {new Date(note.remind_at).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

export default NoteCard;
