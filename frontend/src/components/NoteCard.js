import React, { useState } from 'react';
import TagInput from './TagInput';

function toDatetimeLocal(isoString) {
  if (!isoString) return '';
  // datetime-local needs "YYYY-MM-DDTHH:MM"
  return isoString.slice(0, 16);
}

function NoteCard({ note, onDelete, onUpdate, onConvertTag, highlighted }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Edit state
  const [editContent, setEditContent] = useState('');
  const [editUserTags, setEditUserTags] = useState([]);
  const [editAiTags, setEditAiTags] = useState([]);
  const [editRemindAt, setEditRemindAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [convertingTagId, setConvertingTagId] = useState(null);

  const userTags = note.tags ? note.tags.filter(t => t.source === 'user') : [];
  const aiTags = note.tags ? note.tags.filter(t => t.source === 'ai') : [];

  const startEdit = () => {
    setEditContent(note.content);
    setEditUserTags(userTags.map(t => t.name));
    setEditAiTags(aiTags);
    setEditRemindAt(toDatetimeLocal(note.remind_at));
    setEditing(true);
    setConfirmDelete(false);
  };

  const handleConvertAiTag = async (tag) => {
    // Optimistic update first so the UI responds immediately
    setEditAiTags(prev => prev.filter(t => t.id !== tag.id));
    setEditUserTags(prev => prev.includes(tag.name) ? prev : [...prev, tag.name]);
    setConvertingTagId(tag.id);
    await onConvertTag(tag.id);
    setConvertingTagId(null);
  };

  const cancelEdit = () => setEditing(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(note.id, {
      content: editContent.trim(),
      tag_names: editUserTags,
      remind_at: editRemindAt || null,
    });
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(note.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  if (editing) {
    return (
      <div className={`note-card note-card--editing ${highlighted ? 'highlighted' : ''}`}>
        <textarea
          className="edit-content"
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          rows={4}
        />
        <label className="edit-label">Your tags</label>
        <TagInput tags={editUserTags} onChange={setEditUserTags} />
        {editAiTags.length > 0 && (
          <div className="edit-ai-tags">
            <span className="edit-label">AI tags — click to claim</span>
            <div className="note-tags">
              {editAiTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  className="tag tag-ai tag-ai-claimable"
                  onClick={() => handleConvertAiTag(tag)}
                  disabled={convertingTagId === tag.id}
                  title="Click to convert to your tag"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="edit-label">Remind at</label>
        <input
          type="datetime-local"
          className="edit-datetime"
          value={editRemindAt}
          onChange={e => setEditRemindAt(e.target.value)}
        />
        <div className="edit-actions">
          <button onClick={handleSave} disabled={saving || !editContent.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="cancel-btn" onClick={cancelEdit} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`note-card ${highlighted ? 'highlighted' : ''}`}>
      <div className="note-header">
        <div className="note-actions">
          <button className="edit-btn" onClick={startEdit} title="Edit">✎</button>
          <button
            className={`delete-btn ${confirmDelete ? 'confirm' : ''}`}
            onClick={handleDelete}
            title={confirmDelete ? 'Click again to confirm delete' : 'Delete'}
          >
            {confirmDelete ? 'Confirm?' : '×'}
          </button>
        </div>
      </div>
      <p className="note-content">{note.content}</p>
      {note.tags && note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.map(tag => (
            <span key={tag.id} className={`tag tag-${tag.source}`}>{tag.name}</span>
          ))}
        </div>
      )}
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
