import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import Dashboard from './pages/Dashboard';
import KnowledgeBase from './pages/Admin/KnowledgeBase';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        {/* Simple Navigation Bar (Placeholder) */}
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center">
                   <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="text-xl font-bold text-slate-900">Sono AI</span>
              </div>
              <div className="flex gap-4">
                 <a href="/chat" className="text-sm font-medium text-slate-600 hover:text-brand-700">Chat</a>
                 <a href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-brand-700">Dashboard</a>
                 <a href="/admin/kb" className="text-sm font-medium text-slate-600 hover:text-brand-700">Admin</a>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin/kb" element={<KnowledgeBase />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
