import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Select } from '../../../components/ui/Select';

export default function WebsiteURL() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('Guideline');
  const [topic, setTopic] = useState('');
  const [country, setCountry] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrainingData = () => {
    setIsLoading(true);
    fetch(`/api/admin/knowledge?training_type=url&page=${page}&size=10`)
      .then(res => res.json())
      .then(json => {
        setData(json.items || []);
        setTotal(json.total || 0);
        setPages(json.pages || 1);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTrainingData();
  }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim() || !sourceName.trim()) return alert("Source URL and Source Name are required");
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/knowledge/ingest/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          training_mode: mode.toLowerCase(),
          topic_id: topic || null,
          country: mode === 'Guideline' ? country : null,
          source_name: sourceName,
          source_url: sourceUrl
        })
      });
      if (res.ok) {
        alert('Website URL queued for ingestion successfully!');
        setSourceName('');
        setSourceUrl('');
        setCountry('');
        fetchTrainingData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail || 'Failed to ingest'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
    setIsSubmitting(false);
  };

  const inputClass = "w-full bg-[#09090b] border border-white/10 hover:border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-500 font-sans px-4 py-2.5";

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/kb')} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <LinkIcon className="w-8 h-8 text-indigo-400" /> Crawl Website URL
          </h1>
          <p className="text-slate-400 mt-1">Provide a public URL to automatically extract and ingest text.</p>
        </div>
      </div>

      <div className="bg-[#121214] border border-white/5 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Training Mode</label>
              <Select
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'Guideline', label: 'Guideline' },
                  { value: 'Research', label: 'Research' }
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Topics</label>
              <Select
                value={topic}
                onChange={setTopic}
                options={[
                  { value: '', label: '— No Topic —' }
                ]}
              />
            </div>

            {mode === 'Guideline' && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Country</label>
                <input 
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. UK, USA"
                  className={inputClass}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Source Name</label>
              <input 
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g. Fetal Care Protocol"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Source URL to Crawl</label>
              <input 
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-white/5">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-slate-200 rounded-lg text-sm font-medium transition-all disabled:opacity-50 mt-4"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSubmitting ? 'Crawling...' : 'Start Crawl'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-white mb-4">Ingested Website Data ({total})</h2>
        <div className="bg-[#18181b] rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 uppercase bg-black/20 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium">Source Name</th>
                  <th className="px-6 py-4 font-medium">URL</th>
                  <th className="px-6 py-4 font-medium">Mode</th>
                  <th className="px-6 py-4 font-medium">Country</th>
                  <th className="px-6 py-4 font-medium">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex justify-center items-center gap-3">
                         <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                         Loading data...
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No training data found.</td></tr>
                ) : (
                  data.map((item: any) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{item.source_name}</td>
                      <td className="px-6 py-4 text-blue-400 hover:underline">
                        <a href={item.source_url} target="_blank" rel="noreferrer">{item.source_url}</a>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${item.mode === 'guideline' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                          {item.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{item.country || '—'}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-black/20">
            <div className="text-sm text-slate-400">
              Showing <span className="text-white font-medium">{total === 0 ? 0 : (page - 1) * 10 + 1}</span> to <span className="text-white font-medium">{Math.min(page * 10, total)}</span> of <span className="text-white font-medium">{total}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm bg-[#18181b] border border-white/10 rounded-md text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages || pages === 0}
                className="px-3 py-1.5 text-sm bg-[#18181b] border border-white/10 rounded-md text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
