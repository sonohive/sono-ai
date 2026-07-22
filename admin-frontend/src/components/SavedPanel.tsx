import React from 'react';

interface SavedPanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedResponses?: any[];
  setSavedResponses?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function SavedPanel({ isOpen, onClose, savedResponses = [], setSavedResponses }: SavedPanelProps) {

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-responses/${id}`, { method: 'DELETE' });
      if (res.ok && setSavedResponses) {
        setSavedResponses(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete saved response', err);
    }
  };

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
        {savedResponses.length === 0 ? (
          <div className="sonoai-saved-empty">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#444', marginBottom: '10px' }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <p>No saved responses yet.</p>
            <span>Bookmark any AI response to see it here.</span>
          </div>
        ) : (
          savedResponses.map(item => (
            <div key={item.id} className="sonoai-saved-item">
              <div className="sonoai-saved-item-header">
                <span className={`sonoai-saved-mode-label mode-${item.mode}`}>
                  {item.mode === 'research' ? 'Research' : 'Guideline'}
                </span>
                <button 
                  className="sonoai-saved-delete-btn" 
                  title="Delete" 
                  onClick={() => handleDelete(item.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
              <div className="sonoai-saved-item-question">{item.question}</div>
              <div className="sonoai-saved-item-answer">{item.answer}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
