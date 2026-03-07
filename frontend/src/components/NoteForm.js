import React, { useState } from 'react';

function NoteForm({ onAdd }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await onAdd({ content: content.trim() });
    setContent('');
    setLoading(false);
  };

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <h2>Add Note</h2>
      <textarea
        placeholder="Write your note..."
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={4}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Note'}
      </button>
    </form>
  );
}

export default NoteForm;
