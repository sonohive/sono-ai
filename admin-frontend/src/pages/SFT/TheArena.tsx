import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Save, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../api';

const gradingOptions = [
  "Inaccurate Medical Info",
  "Hallucination",
  "Tone/Style Issue",
  "Missing Context",
  "Too Technical",
  "Not Helpful"
];

const TheArena = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryData = location.state?.queryData;

  const [retrainedData, setRetrainedData] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!queryData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <AlertCircle className="w-12 h-12 mb-4 text-slate-500" />
        <h2 className="text-xl font-medium text-white mb-2">No Query Selected</h2>
        <p>Please select a query from the SFT Queue to review.</p>
        <button
          onClick={() => navigate('/sft/dashboard')}
          className="mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!status) return;
    if (status !== 'pass' && (!retrainedData.trim() || selectedTags.length === 0)) return;
    
    setIsSubmitting(true);
    try {
      await api.post(`/sft/review/query/${queryData.id}`, {
        status: status,
        grading_tags: selectedTags.length > 0 ? selectedTags : [],
        retrained_data: retrainedData.trim() || null
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/sft/dashboard');
      }, 1500);
    } catch (err) {
      console.error("Failed to submit review", err);
      alert("Failed to submit review");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">The Arena</h1>
        <p className="text-slate-400 mt-1">Grade and correct AI responses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Query Context */}
        <div className="bg-[#121214] border border-white/5 rounded-xl p-6 space-y-6 h-fit">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {queryData.type === 'training data' ? 'Source Context' : 'User Query'}
            </h3>
            <div className="bg-black/30 rounded-lg p-4 text-slate-300 text-sm border border-white/5">
              {queryData.type === 'training data' ? (
                <span className="text-blue-300 italic">{queryData.query}</span>
              ) : (
                queryData.query
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Original AI Response</h3>
            <div className="bg-black/30 rounded-lg p-4 text-slate-300 text-sm border border-red-500/20 max-h-64 overflow-y-auto">
              {queryData.response}
            </div>
          </div>

          {queryData.feedback_text && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">User Feedback</h3>
              <div className="bg-red-500/10 rounded-lg p-4 text-red-400 text-sm italic border border-red-500/20">
                "{queryData.feedback_text}"
              </div>
            </div>
          )}
        </div>

        {/* Grading and Correction */}
        <div className="space-y-6">
          <div className="bg-[#121214] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">1. Select Status</h3>
            <div className="flex gap-3">
              {[
                { id: 'pass', label: 'Pass', color: 'green' },
                { id: 'fail', label: 'Fail', color: 'red' },
                { id: 'needs retraining', label: 'Needs Retraining', color: 'amber' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setStatus(opt.id)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    status === opt.id
                      ? `bg-${opt.color}-500/20 text-${opt.color}-400 border-${opt.color}-500/50`
                      : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`bg-[#121214] border border-white/5 rounded-xl p-6 transition-opacity ${status === 'pass' ? 'opacity-50' : ''}`}>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">2. Grade the Error {status === 'pass' && '(Optional)'}</h3>
            <div className="flex flex-wrap gap-2">
              {gradingOptions.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#121214] border border-white/5 rounded-xl p-6 flex flex-col h-[400px]">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">3. Provide Retrained Data {status === 'pass' && '(Optional)'}</h3>
            <textarea
              className="flex-1 w-full bg-black/30 border border-white/10 rounded-lg p-4 text-slate-300 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
              placeholder="Provide the idealized, correct response here. This data will be used to fine-tune the model."
              value={retrainedData}
              onChange={e => setRetrainedData(e.target.value)}
            />

            <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !status || (status !== 'pass' && (!retrainedData.trim() || selectedTags.length === 0)) || success}
                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-medium rounded-lg transition-colors"
              >
                {success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Saved!
                  </>
                ) : isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheArena;
