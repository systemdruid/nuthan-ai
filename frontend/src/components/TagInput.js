import React, { useState, useEffect, useRef } from 'react';
import { searchTags } from '../api/notesApi';

function TagInput({ tags, onChange }) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = (value) => {
    clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchTags(value.trim());
        setSuggestions(results.filter(t => !tags.includes(t.name)));
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      }
    }, 200);
  };

  const addTag = (name) => {
    const normalized = name.toLowerCase().trim();
    if (normalized && !tags.includes(normalized)) {
      onChange([...tags, normalized]);
    }
    setInputValue('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const removeTag = (name) => {
    onChange(tags.filter(t => t !== name));
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="tag-input-wrapper" ref={containerRef}>
      <div className="tag-input-box">
        {tags.map(name => (
          <span key={name} className="tag-pill">
            {name}
            <button
              type="button"
              className="tag-pill-remove"
              onClick={() => removeTag(name)}
            >×</button>
          </span>
        ))}
        <input
          type="text"
          className="tag-input-field"
          placeholder={tags.length === 0 ? 'Add tags…' : ''}
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value);
            fetchSuggestions(e.target.value);
          }}
          onFocus={() => inputValue.trim() && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {showDropdown && suggestions.length > 0 && (
        <ul className="tag-suggestions">
          {suggestions.map(tag => (
            <li key={tag.id} onMouseDown={() => addTag(tag.name)}>
              {tag.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TagInput;
