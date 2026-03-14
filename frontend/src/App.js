import React, { useState, useEffect, useCallback } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
  getNotes,
  createNote,
  deleteNote,
  updateNote,
  queryNotes,
  retagAll,
  convertTagToUser,
} from "./api/notesApi";
import { getStoredUser, clearAuth } from "./api/authApi";
import Login from "./components/Login";
import NoteForm from "./components/NoteForm";
import NoteList from "./components/NoteList";
import QueryBar from "./components/QueryBar";
import QueryResults from "./components/QueryResults";
import TagFilter from "./components/TagFilter";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

function CollapsibleSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="section-block">
      <button className="section-toggle" onClick={() => setOpen((o) => !o)}>
        <span className={`section-toggle-arrow ${open ? "open" : ""}`}>▶</span>
        {title}
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

function AppContent() {
  const [user, setUser] = useState(getStoredUser);
  const [notes, setNotes] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [queryResults, setQueryResults] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [retagLoading, setRetagLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setNotes([]);
  };

  const fetchNotes = useCallback(async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        setError("Failed to load notes.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) fetchNotes();
  }, [user, fetchNotes]);

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

  const handleConvertTag = async (tagId) => {
    try {
      await convertTagToUser(tagId);
      setNotes((prev) =>
        prev.map((note) => ({
          ...note,
          tags: (note.tags || []).map((t) =>
            t.id === tagId ? { ...t, source: "user" } : t,
          ),
        })),
      );
      setError(null);
    } catch (err) {
      setError("Failed to convert tag.");
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

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const highlightedIds = queryResults
    ? queryResults.relevant_notes.map((n) => n.id)
    : [];

  const allTags = Array.from(
    new Map(
      notes.flatMap((n) => n.tags || []).map((t) => [t.name, t]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filterNotes = (list) =>
    selectedTags.length === 0
      ? list
      : list.filter((n) =>
          selectedTags.some((name) =>
            (n.tags || []).some((t) => t.name === name),
          ),
        );

  return (
    <div className="app">
      <header>
        <div className="header-left">
          <h1>Recallio AI</h1>
          <p>Save notes and find them using natural language</p>
        </div>
        <div className="header-right">
          <span className="header-user">{user.name || user.email}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main>
        <section className="left-panel">
          <NoteForm onAdd={handleAdd} />
          <QueryBar onQuery={handleQuery} loading={queryLoading} />
          <button
            className="retag-btn"
            onClick={handleRetagAll}
            disabled={retagLoading}
          >
            {retagLoading ? "Retagging…" : "Retag All"}
          </button>
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
          <CollapsibleSection
            title={`Tasks (${filterNotes(notes.filter((n) => n.type === "task")).length})`}
          >
            <NoteList
              notes={filterNotes(notes.filter((n) => n.type === "task"))
                .slice()
                .sort((a, b) => {
                  if (!a.remind_at && !b.remind_at) return 0;
                  if (!a.remind_at) return 1;
                  if (!b.remind_at) return -1;
                  return new Date(a.remind_at) - new Date(b.remind_at);
                })}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onConvertTag={handleConvertTag}
              highlightedIds={highlightedIds}
              emptyMessage="No tasks yet."
            />
          </CollapsibleSection>
          <CollapsibleSection
            title={`Notes (${filterNotes(notes.filter((n) => n.type === "note")).length})`}
          >
            <NoteList
              notes={filterNotes(notes.filter((n) => n.type === "note"))}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onConvertTag={handleConvertTag}
              highlightedIds={highlightedIds}
              emptyMessage="No notes yet. Add one!"
            />
          </CollapsibleSection>
        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppContent />
    </GoogleOAuthProvider>
  );
}

export default App;
