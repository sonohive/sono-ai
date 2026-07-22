import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import SavedPanel from '../components/SavedPanel';
import '../styles/chat.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'guideline' | 'research'>('guideline');
  const [isSavedPanelOpen, setIsSavedPanelOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      try {
        const sessionRes = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: mode, title: input.trim().substring(0, 50) })
        });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          activeSessionId = sessionData.id;
          setCurrentSessionId(activeSessionId);
        } else {
          activeSessionId = 'default_session';
        }
      } catch (err) {
        console.error("Failed to create session", err);
        activeSessionId = 'default_session';
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: activeSessionId,
          mode: mode,
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      if (!response.body) throw new Error('No readable stream available');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + data }
                  : msg
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error streaming chat:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="sonoai-app" className="sonoai-app logged-in">
      <Sidebar />

      <main id="sonoai-main" className={`sonoai-main ${messages.length === 0 ? 'is-empty' : ''}`} role="main">
        {/* ─── Top Navigation ─── */}
        <div className="sonoai-topnav">
          <div className="sonoai-topnav-left">
            <button className="sonoai-hamburger" aria-label="Toggle sidebar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span className="sonoai-topnav-title">Sonohive Intelligence <span className="sonoai-beta-badge">Beta</span></span>
          </div>

          <div className="sonoai-topnav-center">
            <div className="sonoai-nav-pill-group">
              <a href="#">Homepage</a>
              <a href="#">Events</a>
              <a href="#">Cases</a>
              <a href="#">Forum</a>
            </div>
          </div>

          <div className="sonoai-topnav-right">
            <button id="sonoai-theme-toggle" className="sonoai-theme-toggle" aria-label="Toggle theme">
               <svg className="sonoai-icon-moon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </button>
          </div>
        </div>

        <div className="sonoai-chat-container">
        {/* ─── Chat Feed ─── */}
        <div id="sonoai-messages" className="sonoai-messages" role="log" aria-live="polite" aria-label="Conversation">
          {messages.length === 0 ? (
            <div id="sonoai-welcome" className="sonoai-welcome">
              <h2 className="sonoai-welcome-title">Good morning, Dr. Smith.</h2>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`sonoai-message ${message.role}`}>
                {message.role === 'user' ? (
                  <div className="sonoai-message-avatar">
                    <img src="https://ui-avatars.com/api/?name=Dr+Smith&background=4a90e2&color=fff" alt="" />
                  </div>
                ) : null}
                <div className="sonoai-message-body">
                  <div className="sonoai-bubble">
                    {message.content}
                    {message.role === 'assistant' && (
                      <div className="sonoai-action-row">
                        <button className="sonoai-action-btn" title="Copy">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          <span>Copy</span>
                        </button>
                        <button className="sonoai-save-msg-btn" title="Save">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                          <span>Save</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ─── Input Area ─── */}
        <div className="sonoai-input-area">
          <form 
            className="sonoai-input-box" 
            onSubmit={handleSubmit}
            style={{ position: 'relative' }}
          >
            <textarea 
              id="sonoai-input" 
              className="sonoai-textarea" 
              placeholder="Ask a follow-up clinical query..." 
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isLoading}
            ></textarea>
            <button 
              type="submit" 
              id="sonoai-send-btn" 
              className="sonoai-send-btn" 
              disabled={!input.trim() || isLoading} 
              aria-label="Send message"
            >
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAABYUlEQVR4nO3YvytGYRjG8a/flFCS+Y1ktbOTLEoZlNFgMCiTyT+AwaAYZDEQyWp4y4KSgSKUqLcYRInFr05d6mRBFu+5r0+dOs/9dIbrPud0nvOAmZmZmZmZmZmZWXGpAqoJ7BQ4BxoIKg+8AytACQG1Ag9qwgRBdQMvwCvQS1CTegoegS4CKgGW1IR7oJOAylJNeAYGCfokTAFvasQiUEdAPcCNmlAAxoHa7y4qBfZ1UbEea6k8jcCcvhDJ3NFPGnD4D0L85dj+kmkAeNLcJhm1oIBnQHOqPqa1QTI3D1SQQf0KmKwGW1I/SMuqJ3d/iIyqBK4UdFi1JmBHtUuggwwbUdA9jXPAhWq7X16HTDpW2D6gDbjWeBWoIeNyCnun8AWNZ/U1y7xRBc5rQyQ5n460JzCv0J9L3plI4RNbqcXPRrTwiQOFPwHqCWgduAXaCao8+na4mZmZmZmZmZmZ8WsfcgWu+h8Ra8YAAAAASUVORK5CYII=" alt="arrow" width="24" height="24" />
            </button>
          </form>
          
          <div className={`sonoai-mode-toggle ${mode}`}>
            <button 
              type="button"
              className={`sonoai-mode-btn ${mode === 'guideline' ? 'active' : ''}`} 
              onClick={() => setMode('guideline')}
            >
              Guideline Mode
            </button>
            <button 
              type="button"
              className={`sonoai-mode-btn ${mode === 'research' ? 'active' : ''}`} 
              onClick={() => setMode('research')}
            >
              Research Mode
            </button>
          </div>
        </div>
        </div>
        
        <p className="sonoai-disclaimer">
          By messaging Sono AI - an AI Chatbot, you agree to our <a href="#">Terms of Use</a> and have read our <a href="#">Privacy Policy</a>.
        </p>
      </main>
      
      <SavedPanel isOpen={isSavedPanelOpen} onClose={() => setIsSavedPanelOpen(false)} />
    </div>
  );
}
