import React, { useState, useEffect, useCallback } from "react";
import {
  getNotes,
  createNote,
  deleteNote,
  updateNote,
  queryNotes,
  retagAll,
} from "./api/notesApi";
import NoteForm from "./components/NoteForm";
import NoteList from "./components/NoteList";
import QueryBar from "./components/QueryBar";
import QueryResults from "./components/QueryResults";
import TagFilter from "./components/TagFilter";

function CollapsibleSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="section-block">
      <button className="section-toggle" onClick={() => setOpen(o => !o)}>
        <span className={`section-toggle-arrow ${open ? 'open' : ''}`}>▶</span>
        {title}
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [queryResults, setQueryResults] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [retagLoading, setRetagLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (err) {
      setError("Failed to load notes.");
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
      setError("Failed to create note.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (queryResults) {
        setQueryResults((prev) => ({
          ...prev,
          relevant_notes: prev.relevant_notes.filter((n) => n.id !== id),
        }));
      }
      setError(null);
    } catch (err) {
      setError("Failed to delete note.");
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const updated = await updateNote(id, data);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      if (queryResults) {
        setQueryResults((prev) => ({
          ...prev,
          relevant_notes: prev.relevant_notes.map((n) =>
            n.id === id ? updated : n,
          ),
        }));
      }
      setError(null);
    } catch (err) {
      setError("Failed to update note.");
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
      setError("AI query failed. Check your API key.");
    } finally {
      setQueryLoading(false);
    }
  };

  const handleRetagAll = async () => {
    setRetagLoading(true);
    try {
      await retagAll();
      await fetchNotes();
      setError(null);
    } catch (err) {
      setError("Retag failed.");
    } finally {
      setRetagLoading(false);
    }
  };

  const highlightedIds = queryResults
    ? queryResults.relevant_notes.map((n) => n.id)
    : [];

  const allTags = Array.from(
    new Map(
      notes.flatMap((n) => n.tags || []).map((t) => [t.name, t])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filterNotes = (list) =>
    selectedTags.length === 0
      ? list
      : list.filter((n) =>
          selectedTags.some((name) => (n.tags || []).some((t) => t.name === name))
        );

  return (
    <div className="app">
      <header>
        <h1>AI Notes</h1>
        <p>Save notes and find them using natural language</p>
        <button
          className="retag-btn"
          onClick={handleRetagAll}
          disabled={retagLoading}
        >
          {retagLoading ? "Retagging…" : "Retag All"}
        </button>
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
          <TagFilter
            allTags={allTags}
            selectedTags={selectedTags}
            onChange={setSelectedTags}
          />
          <CollapsibleSection title={`Tasks (${filterNotes(notes.filter((n) => n.type === "task")).length})`}>
            <NoteList
              notes={filterNotes(notes.filter((n) => n.type === "task"))}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              highlightedIds={highlightedIds}
              emptyMessage="No tasks yet."
            />
          </CollapsibleSection>
          <CollapsibleSection title={`Notes (${filterNotes(notes.filter((n) => n.type === "note")).length})`}>
            <NoteList
              notes={filterNotes(notes.filter((n) => n.type === "note"))}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              highlightedIds={highlightedIds}
              emptyMessage="No notes yet. Add one!"
            />
          </CollapsibleSection>
        </section>
      </main>
    </div>
  );
}

export default App;
