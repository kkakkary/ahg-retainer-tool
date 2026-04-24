import React, { useEffect, useRef, useState } from 'react';

export default function FindBar({ onClose }) {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    window.electronAPI.onFindResult((result) => {
      setMatches({ active: result.activeMatchOrdinal, total: result.matches });
    });
    return () => {
      window.electronAPI.offFindResult();
      window.electronAPI.stopFindInPage();
    };
  }, []);

  function search(text, forward = true) {
    if (!text) { window.electronAPI.stopFindInPage(); setMatches(null); return; }
    window.electronAPI.findInPage(text, { forward, findNext: true });
  }

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    window.electronAPI.findInPage(val, { forward: true, findNext: false });
    if (!val) { window.electronAPI.stopFindInPage(); setMatches(null); }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Enter') search(query, !e.shiftKey);
  }

  return (
    <div className="fixed top-14 right-4 z-50 flex items-center gap-2 bg-white border border-gray-300 rounded-lg shadow-lg px-3 py-2">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Find in page…"
        className="text-sm outline-none w-48"
      />
      {matches !== null && (
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {matches.total === 0 ? 'No results' : `${matches.active} / ${matches.total}`}
        </span>
      )}
      <button onClick={() => search(query, false)} className="text-gray-500 hover:text-gray-800 text-sm px-1">↑</button>
      <button onClick={() => search(query, true)}  className="text-gray-500 hover:text-gray-800 text-sm px-1">↓</button>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-sm font-bold px-1">✕</button>
    </div>
  );
}
