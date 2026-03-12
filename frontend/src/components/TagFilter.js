import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

function TagFilter({ allTags, selectedTags, onChange }) {
  const [visibleCount, setVisibleCount] = useState(allTags.length);
  const [measuring, setMeasuring] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);

  // Trigger re-measurement whenever the tag list changes
  useLayoutEffect(() => {
    setMeasuring(true);
  }, [allTags]);

  // Measure which chips fit within 2 rows
  useLayoutEffect(() => {
    if (!measuring || !wrapperRef.current) return;

    const chips = Array.from(wrapperRef.current.querySelectorAll('[data-chip]'));
    if (chips.length === 0) {
      setMeasuring(false);
      return;
    }

    const rowTops = [];
    let count = 0;
    for (const chip of chips) {
      const top = chip.offsetTop;
      if (!rowTops.includes(top)) rowTops.push(top);
      if (rowTops.length <= 2) count++;
      else break;
    }

    const needsMore = count < allTags.length;
    // Reserve one slot on row 2 for the "+N more" button
    setVisibleCount(needsMore ? Math.max(1, count - 1) : allTags.length);
    setMeasuring(false);
  }, [measuring, allTags]);

  // Close dropdown on outside click
  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  if (allTags.length === 0) return null;

  const toggle = (name) =>
    onChange(
      selectedTags.includes(name)
        ? selectedTags.filter((t) => t !== name)
        : [...selectedTags, name]
    );

  const visibleTags = measuring ? allTags : allTags.slice(0, visibleCount);
  const hiddenTags = measuring ? [] : allTags.slice(visibleCount);
  const filteredHidden = hiddenTags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );
  const hiddenSelectedCount = hiddenTags.filter((t) =>
    selectedTags.includes(t.name)
  ).length;

  return (
    <div className="tag-filter">
      <span className="tag-filter-label">Filter</span>
      <div className="tag-filter-tags" ref={wrapperRef}>
        {visibleTags.map((tag) => (
          <button
            key={tag.name}
            data-chip="true"
            className={`tag-filter-chip ${selectedTags.includes(tag.name) ? 'active' : ''}`}
            onClick={() => toggle(tag.name)}
          >
            {tag.name}
          </button>
        ))}

        {hiddenTags.length > 0 && (
          <div className="tag-filter-more" ref={dropdownRef}>
            <button
              className={`tag-filter-chip tag-filter-more-btn ${hiddenSelectedCount > 0 ? 'active' : ''}`}
              onClick={() => { setDropdownOpen((o) => !o); setSearch(''); }}
            >
              +{hiddenTags.length}{hiddenSelectedCount > 0 ? ` (${hiddenSelectedCount})` : ''}
            </button>

            {dropdownOpen && (
              <div className="tag-filter-dropdown">
                <input
                  type="text"
                  className="tag-filter-search"
                  placeholder="Search tags…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                <div className="tag-filter-dropdown-list">
                  {filteredHidden.length === 0 ? (
                    <p className="tag-filter-empty">No tags found</p>
                  ) : (
                    filteredHidden.map((tag) => (
                      <button
                        key={tag.name}
                        className={`tag-filter-dropdown-item ${selectedTags.includes(tag.name) ? 'active' : ''}`}
                        onClick={() => toggle(tag.name)}
                      >
                        <span>{tag.name}</span>
                        {selectedTags.includes(tag.name) && (
                          <span className="tag-filter-check">✓</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTags.length > 0 && (
          <button className="tag-filter-clear" onClick={() => onChange([])}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default TagFilter;
