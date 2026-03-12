import React, { useState } from 'react';
import TagInput from './TagInput';

function NoteForm({ onAdd }) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await onAdd({ content: content.trim(), tag_names: tags });
    setContent('');
    setTags([]);
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
      <TagInput tags={tags} onChange={setTags} />
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Note'}
      </button>
    </form>
  );
}

export default NoteForm;
