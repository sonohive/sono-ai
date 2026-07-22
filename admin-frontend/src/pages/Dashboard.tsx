import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Clock } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    recent_chats_count: 0,
    flashcards_count: 0,
    offline_materials_count: 0
  });

  useEffect(() => {
    // In a real app, include Authorization: Bearer token header
    fetch('/api/dashboard/stats')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch stats');
      })
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Your Study Dashboard</h1>
        <p className="text-slate-500 mt-1">Review your recent chats and study flashcards.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6">
          <div className="w-12 h-12 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Recent Chats</h3>
          <p className="text-slate-500 text-sm mt-1">You have {stats.recent_chats_count} saved sessions.</p>
          <button className="mt-4 text-brand-700 font-medium text-sm hover:underline">View History →</button>
        </div>

        <div className="glass-panel p-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Flashcards</h3>
          <p className="text-slate-500 text-sm mt-1">Review {stats.flashcards_count} cards due today.</p>
          <button className="mt-4 text-blue-700 font-medium text-sm hover:underline">Start Review →</button>
        </div>

        <div className="glass-panel p-6 border-brand-200 bg-brand-50/50">
          <div className="w-12 h-12 bg-white text-brand-700 shadow-sm rounded-xl flex items-center justify-center mb-4">
            <Download className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Offline Materials</h3>
          <p className="text-slate-500 text-sm mt-1">Cache study materials to your device.</p>
          <button className="btn-primary mt-4 w-full">Manage Downloads</button>
        </div>
      </div>
    </div>
  );
}
