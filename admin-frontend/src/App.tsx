import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './pages/Admin/AdminLayout';
import Overview from './pages/Admin/Overview';
import Users from './pages/Admin/Users';
import KnowledgeBase from './pages/Admin/KnowledgeBase';
import Settings from './pages/Admin/Settings';
import Login from './pages/Auth/Login';
import AcceptInvite from './pages/Auth/AcceptInvite';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/invite/:token" element={<AcceptInvite />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AdminLayout />}>
              <Route index element={<Overview />} />
              <Route path="kb" element={<KnowledgeBase />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
              {/* RLHF and Access Control can be added here later */}
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
