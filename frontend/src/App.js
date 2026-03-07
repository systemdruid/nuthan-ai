import React, { useState, useEffect, useCallback } from 'react';
import { getNotes, createNote, deleteNote, queryNotes } from './api/notesApi';
import NoteForm from './components/NoteForm';
import NoteList from './components/NoteList';
import QueryBar from './components/QueryBar';
import QueryResults from './components/QueryResults';

function App() {
  const [notes, setNotes] = useState([]);
  const [queryResults, setQueryResults] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (err) {
      setError('Failed to load notes.');
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAdd = async (noteData) => {
    try {
      await createNote(noteData);
      await fetchNotes();
      setError(null);
    } catch (err) {
      setError('Failed to create note.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (queryResults) {
        setQueryResults(prev => ({
          ...prev,
          relevant_notes: prev.relevant_notes.filter(n => n.id !== id),
        }));
      }
      setError(null);
    } catch (err) {
      setError('Failed to delete note.');
    }
  };

  const handleQuery = async (query) => {
    if (query === null) {
      setQueryResults(null);
      return;
    }
    setQueryLoading(true);
    try {
      const results = await queryNotes(query);
      setQueryResults(results);
      setError(null);
    } catch (err) {
      setError('AI query failed. Check your API key.');
    } finally {
      setQueryLoading(false);
    }
  };

  const highlightedIds = queryResults
    ? queryResults.relevant_notes.map(n => n.id)
    : [];

  return (
    <div className="app">
      <header>
        <h1>AI Notes</h1>
        <p>Save notes and find them using natural language</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main>
        <section className="left-panel">
          <NoteForm onAdd={handleAdd} />
          <QueryBar onQuery={handleQuery} loading={queryLoading} />
          {queryResults && (
            <QueryResults results={queryResults} onDelete={handleDelete} />
          )}
        </section>

        <section className="right-panel">
          <h2>All Notes ({notes.length})</h2>
          <NoteList
            notes={notes}
            onDelete={handleDelete}
            highlightedIds={highlightedIds}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
