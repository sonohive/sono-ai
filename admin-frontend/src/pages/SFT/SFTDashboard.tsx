import React, { useEffect, useState } from 'react';
import { ThumbsDown, MessageSquareOff, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

interface PendingQuery {
  id: string;
  query: string;
  response: string;
  type: string;
  is_unanswered: boolean;
  is_liked: boolean | null;
  feedback_text: string | null;
  created_at: string;
}

import { BookOpen } from 'lucide-react';

const SFTDashboard = () => {
  const [queries, setQueries] = useState<PendingQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const res = await api.get('/sft/queue/queries');
        setQueries(res.data);
      } catch (err) {
        console.error("Failed to load queue", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQueries();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SFT Queue</h1>
          <p className="text-slate-400 mt-1">Queries requiring supervised fine-tuning or review.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-slate-400">Loading queue...</div>
      ) : queries.length === 0 ? (
        <div className="bg-[#121214] border border-white/5 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Queue is empty!</h3>
          <p className="text-slate-400">All user feedback and unanswered queries have been reviewed.</p>
        </div>
      ) : (
        <div className="bg-[#121214] border border-white/5 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-black/20">
            <div className="col-span-2">Type</div>
            <div className="col-span-3">User Query / Source</div>
            <div className="col-span-4">AI Response Snippet</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1 text-right">Action</div>
          </div>
          
          <div className="divide-y divide-white/5">
            {queries.map((q) => (
              <div key={q.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors">
                <div className="col-span-2 flex items-center gap-2">
                  {q.type === 'training data' ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-md text-xs font-medium border border-blue-500/20">
                      <BookOpen className="w-3.5 h-3.5" />
                      Training Data
                    </span>
                  ) : q.type === 'feedback' ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-400 rounded-md text-xs font-medium border border-red-500/20">
                      <ThumbsDown className="w-3.5 h-3.5" />
                      Feedback
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-md text-xs font-medium border border-amber-500/20">
                      <MessageSquareOff className="w-3.5 h-3.5" />
                      Unanswered
                    </span>
                  )}
                </div>
                
                <div className="col-span-3">
                  <p className="text-sm text-slate-300 font-medium line-clamp-2">
                    {q.type === 'training data' ? (
                      <span className="text-blue-300 italic">{q.query}</span>
                    ) : (
                      q.query
                    )}
                  </p>
                </div>
                
                <div className="col-span-4">
                  <p className="text-sm text-slate-500 line-clamp-2">{q.response}</p>
                  {q.feedback_text && (
                    <p className="text-xs text-red-400 mt-1 italic">"{q.feedback_text}"</p>
                  )}
                </div>
                
                <div className="col-span-2 text-sm text-slate-500">
                  {new Date(q.created_at).toLocaleDateString()}
                </div>
                
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => navigate(`/sft/arena?queryId=${q.id}`, { state: { queryData: q }})}
                    className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors"
                    title="Send to Arena"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SFTDashboard;
