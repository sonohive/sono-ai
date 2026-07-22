import React from 'react';

interface SavedPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SavedPanel({ isOpen, onClose }: SavedPanelProps) {
  return (
    <div id="sonoai-saved-panel" className={`sonoai-saved-panel ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen} role="dialog" aria-label="Saved Responses">
      <div className="sonoai-saved-panel-header">
        <span className="sonoai-saved-panel-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          Saved Responses
        </span>
        <button id="sonoai-saved-close" className="sonoai-saved-panel-close" aria-label="Close saved responses" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div id="sonoai-saved-list" className="sonoai-saved-list">
        <div className="sonoai-saved-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#444', marginBottom: '10px' }}>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <p>No saved responses yet.</p>
          <span>Bookmark any AI response to see it here.</span>
        </div>
      </div>
    </div>
  );
}
