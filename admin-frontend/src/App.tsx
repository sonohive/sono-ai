import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './pages/Admin/AdminLayout';
import KnowledgeBase from './pages/Admin/KnowledgeBase';
import Settings from './pages/Admin/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<div className="p-8 text-center text-slate-500">Welcome to Sono Admin Dashboard</div>} />
          <Route path="kb" element={<KnowledgeBase />} />
          <Route path="settings" element={<Settings />} />
          {/* RLHF and Access Control can be added here later */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
