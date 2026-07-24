import React, { useState, useEffect } from 'react';
import { Archive, Trash2, Calendar, BookOpen } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { CardContainer } from '../../components/ui/CardContainer';

interface QueryLogItem {
  id: string;
  date: string;
  user_name: string;
  mode: string;
  query: string;
  response: string;
}

export default function QueryLogs() {
  const [items, setItems] = useState<QueryLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/query-logs?page=${page}&size=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotalPages(data.pages);
      }
    } catch (err) {
      console.error('Failed to fetch query logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleClear = async (logId?: string) => {
    if (!confirm(logId ? "Dismiss this query?" : "Clear all unanswered queries?")) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      let url = '/api/admin/query-logs/clear';
      if (logId) {
        url += `?log_id=${logId}`;
      }
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (logId) {
          setItems(items.filter(i => i.id !== logId));
        } else {
          setItems([]);
          setTotalPages(1);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to clear logs.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader 
        title="Query Logs" 
        description="Review queries where the AI lacked the knowledge to answer. Use these to identify gaps in your knowledge base."
      >
        <button 
          onClick={() => handleClear()}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-all border border-red-500/20"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </PageHeader>

      <CardContainer noPadding>
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-sm font-semibold text-white">Unanswered Queries</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Archive className="w-8 h-8 text-slate-600" />
            <p>No unanswered queries found. The AI is doing great!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-black/20 uppercase border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Mode</th>
                  <th className="px-6 py-4 font-medium">Query Details</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200 whitespace-nowrap">
                      {item.user_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-300 border border-white/10 capitalize">
                        <BookOpen className="w-3 h-3" /> {item.mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <div className="text-slate-200 font-medium mb-1 line-clamp-2" title={item.query}>{item.query}</div>
                      <div className="text-slate-500 text-xs italic line-clamp-2" title={item.response}>"{item.response}"</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleClear(item.id)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                      >
                        Dismiss
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
            <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] text-slate-300 rounded-md text-sm transition-colors disabled:opacity-50 border border-white/10"
              >
                Previous
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] text-slate-300 rounded-md text-sm transition-colors disabled:opacity-50 border border-white/10"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CardContainer>
    </div>
  );
}
