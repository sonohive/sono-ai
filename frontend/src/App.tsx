import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import Dashboard from './pages/Dashboard';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isFullScreenApp = location.pathname === '/' || location.pathname === '/chat';
  
  React.useEffect(() => {
    if (location.pathname === '/chat') {
      document.body.classList.add('sonoai-fullscreen');
    } else {
      document.body.classList.remove('sonoai-fullscreen');
    }
  }, [location.pathname]);

  if (isFullScreenApp) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simple Navigation Bar (Placeholder for Admin/Dashboard) */}
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
               <a href="/" className="text-sm font-medium text-slate-600 hover:text-brand-700">Home</a>
               <a href="/chat" className="text-sm font-medium text-slate-600 hover:text-brand-700">Chat</a>
               <a href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-brand-700">Dashboard</a>
               <a href="http://localhost:5174" className="text-sm font-medium text-slate-600 hover:text-brand-700">Admin</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
