import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Calendar, Search, Flag } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Select } from '../../components/ui/Select';
import { CardContainer } from '../../components/ui/CardContainer';

interface FeedbackStats {
  total: number;
  positive_percentage: number;
  negative_percentage: number;
}

interface FeedbackItem {
  id: string;
  session_id: string;
  query_id: string;
  date: string;
  user_first_name: string | null;
  query: string;
  response_snippet: string;
  is_liked: boolean;
  feedback_text: string | null;
}

export default function Feedback() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({ total: 0, positive_percentage: 0, negative_percentage: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState<number | ''>(''); // '' means all time

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      let url = `/api/admin/feedback?page=${page}&size=10`;
      if (filterDays !== '') {
        url += `&days=${filterDays}`;
      }
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setStats(data.stats);
        setTotalPages(data.pages);
      }
    } catch (err) {
      console.error('Failed to fetch feedback', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [page, filterDays]);

  const flagForRLHF = async (queryId: string) => {
    if (!confirm("Are you sure you want to flag this query for RLHF review?")) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/feedback/${queryId}/flag`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Successfully flagged for RLHF review!");
      } else {
        alert("Failed to flag. It might already be flagged.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader 
        title="Feedback Analytics" 
        description="Analyze user sentiment and feedback from AI chat interactions."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Feedback"
          value={stats.total.toLocaleString()}
          icon={<MessageSquare className="w-5 h-5 text-blue-400" />}
          footerText="All recorded feedback"
          footerDotClass="bg-blue-400"
        />
        <StatCard
          title="Positive Feedback"
          value={`${stats.positive_percentage}%`}
          icon={<ThumbsUp className="w-5 h-5 text-emerald-400" />}
          footerText="Liked responses"
          footerDotClass="bg-emerald-400"
        />
        <StatCard
          title="Negative Feedback"
          value={`${stats.negative_percentage}%`}
          icon={<ThumbsDown className="w-5 h-5 text-rose-400" />}
          footerText="Disliked responses"
          footerDotClass="bg-rose-400"
        />
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-[#121214] p-4 rounded-xl border border-white/5">
        <div className="relative flex-1 max-w-md hidden md:block">
          {/* Optional: Add search functionality here if needed in the future */}
        </div>
        
        <Select 
          value={filterDays}
          onChange={(val) => { setFilterDays(val as number | ''); setPage(1); }}
          options={[
            { value: '', label: 'All Time' },
            { value: 7, label: 'Last 7 Days' },
            { value: 30, label: 'Last 30 Days' }
          ]}
          icon={<Calendar className="w-4 h-4 text-slate-400" />}
          className="w-48"
        />
      </div>

      <CardContainer noPadding>
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-sm font-semibold text-white">Recent Feedback</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No feedback found for this period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-black/20 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">User & Date</th>
                  <th className="px-6 py-4 font-medium">Query & Response</th>
                  <th className="px-6 py-4 font-medium text-center">Feedback Type</th>
                  <th className="px-6 py-4 font-medium">User Comment</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-200 font-medium">{item.user_first_name}</div>
                      <div className="text-slate-500 text-xs mt-1">{new Date(item.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-slate-200 font-medium truncate" title={item.query}>{item.query}</div>
                      <div className="text-slate-500 text-xs mt-1 truncate" title={item.response_snippet}>{item.response_snippet}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.is_liked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          <ThumbsUp className="w-3 h-3" /> Positive
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <ThumbsDown className="w-3 h-3" /> Negative
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                      {item.feedback_text ? (
                         <span title={item.feedback_text}>{item.feedback_text}</span>
                      ) : (
                         <span className="text-slate-600 italic">No comment</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => flagForRLHF(item.query_id)}
                        className="p-2 bg-white/5 hover:bg-orange-500/20 hover:text-orange-400 text-slate-400 rounded-lg transition-colors border border-white/5"
                        title="Flag for RLHF Review"
                      >
                        <Flag className="w-4 h-4" />
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
            <span className="text-sm text-slate-400">
              Page <span className="font-medium text-white">{page}</span> of <span className="font-medium text-white">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-[#18181b] border border-white/10 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-[#18181b] border border-white/10 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </CardContainer>
    </div>
  );
}
