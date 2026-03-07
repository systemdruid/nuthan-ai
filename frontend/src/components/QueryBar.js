import React, { useState } from 'react';

function QueryBar({ onQuery, loading }) {
  const [query, setQuery] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    await onQuery(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    onQuery(null);
  };

  return (
    <div className="query-bar">
      <h2>Ask AI</h2>
      <form onSubmit={handleSubmit} className="query-form">
        <input
          type="text"
          placeholder="e.g. What did I write about machine learning?"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" disabled={loading || !query.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </button>
        {query && (
          <button type="button" className="clear-btn" onClick={handleClear}>
            Clear
          </button>
        )}
      </form>
    </div>
  );
}

export default QueryBar;
