import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './pages/Admin/AdminLayout';
import Overview from './pages/Admin/Overview';
import Users from './pages/Admin/Users';
import KnowledgeBase from './pages/Admin/KnowledgeBase';
import PDFUpload from './pages/Admin/KnowledgeBase/PDFUpload';
import WebsiteURL from './pages/Admin/KnowledgeBase/WebsiteURL';
import CustomText from './pages/Admin/KnowledgeBase/CustomText';
import Media from './pages/Admin/KnowledgeBase/Media';
import Topics from './pages/Admin/Topics';
import Settings from './pages/Admin/Settings';
import Feedback from './pages/Admin/Feedback';
import Login from './pages/Auth/Login';
import AcceptInvite from './pages/Auth/AcceptInvite';

import QueryLogs from './pages/Admin/QueryLogs';

import SFTLayout from './pages/SFT/SFTLayout';
import SFTLogin from './pages/SFT/SFTLogin';
import SFTDashboard from './pages/SFT/SFTDashboard';
import TheArena from './pages/SFT/TheArena';
import Playground from './pages/SFT/Playground';
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/sft/login" element={<SFTLogin />} />
          <Route path="/invite/:token" element={<AcceptInvite />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AdminLayout />}>
              <Route index element={<Overview />} />
              <Route path="kb" element={<KnowledgeBase />} />
              <Route path="kb/pdf" element={<PDFUpload />} />
              <Route path="kb/url" element={<WebsiteURL />} />
              <Route path="kb/text" element={<CustomText />} />
              <Route path="kb/media" element={<Media />} />
              <Route path="topics" element={<Topics />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
              <Route path="feedback" element={<Feedback />} />
              <Route path="query-logs" element={<QueryLogs />} />
            </Route>

            <Route path="/sft" element={<SFTLayout />}>
              <Route path="dashboard" element={<SFTDashboard />} />
              <Route path="arena" element={<TheArena />} />
              <Route path="playground" element={<Playground />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
