import React from 'react';

export default function Sidebar() {
  return (
    <aside id="sonoai-sidebar" className="sonoai-sidebar" aria-label="Chat History">
      {/* Sidebar header: brand + new chat */}
      <div className="sonoai-sidebar-header">
        <div className="sonoai-brand">
          <div className="sonoai-brand-mark" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 26 Q14 10 20 26 Q26 42 32 26" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>
          <div>
            <span className="sonoai-brand-name">Sono AI</span>
            <span className="sonoai-brand-sub">ULTRASOUND CO-PILOT</span>
          </div>
        </div>

        <button id="sonoai-new-chat" className="sonoai-new-chat-btn" title="New Chat" aria-label="Start new chat">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      {/* Sidebar body: nav items + dynamic history */}
      <div className="sonoai-sidebar-body">
        {/* Saved Responses nav item */}
        <button id="sonoai-saved-btn" className="sonoai-sidebar-nav-item" aria-label="View saved responses">
          <span className="sonoai-sidebar-nav-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span className="sonoai-sidebar-nav-label">Saved Responses</span>
          <span className="sonoai-sidebar-nav-arrow" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </button>

        {/* Dynamic history */}
        <div id="sonoai-history-container">
          <p className="sonoai-history-label">Recent</p>
          <ul className="sonoai-history-list" role="list">
            {/* Mock History Items */}
            <li className="sonoai-history-item active guideline-item">
              <span className="sonoai-history-icon-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </span>
              <span className="sonoai-history-text">SRU nodule parameters</span>
            </li>
            <li className="sonoai-history-item research-item">
              <span className="sonoai-history-icon-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </span>
              <span className="sonoai-history-text">FGR Doppler evaluation</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Sidebar footer: user info */}
      <div className="sonoai-sidebar-footer">
        <img src="https://ui-avatars.com/api/?name=Dr+Smith&background=4a90e2&color=fff" alt="" className="sonoai-avatar" width="36" height="36" aria-hidden="true" />
        <div className="sonoai-user-details">
          <span className="sonoai-user-name">Dr. Smith</span>
        </div>
        <div className="sonoai-user-menu-wrapper">
          <button className="sonoai-user-menu-btn" aria-label="User menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
