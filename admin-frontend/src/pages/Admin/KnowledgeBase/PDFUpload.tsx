import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, UploadCloud, FileText, Edit, Trash2, RefreshCw, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Select } from '../../../components/ui/Select';
import { KBEditModal } from '../../../components/KBEditModal';
import { KBFilterBar } from '../../../components/KBFilterBar';
import api from '../../../api';

export default function PDFUpload() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [mode, setMode] = useState('Guideline');
  const [topic, setTopic] = useState('');
  const [country, setCountry] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [filterTopic, setFilterTopic] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [topicOptions, setTopicOptions] = useState([{ value: '', label: '— No Topic —' }]);

  const fetchTopics = async () => {
    try {
      const res = await api.get('/admin/topics');
      const formatted = res.data.map((t: any) => ({ value: t.id, label: t.name }));
      setTopicOptions([
        { value: '', label: '— All Topics —' }, 
        { value: 'unmapped', label: '— Unmapped Topics —' },
        ...formatted
      ]);
    } catch (err) {
      console.error("Failed to fetch topics", err);
    }
  };

  const fetchTrainingData = () => {
    setIsLoading(true);
    
    const params = new URLSearchParams({
      training_type: 'pdf',
      page: page.toString(),
      size: '10'
    });
    
    if (filterTopic) params.append('topic_id', filterTopic);
    if (filterCountry) params.append('country', filterCountry);
    if (filterMode) params.append('mode', filterMode);
    if (searchQuery) params.append('search', searchQuery);

    api.get(`/admin/knowledge?${params.toString()}`)
      .then(res => {
        setData(res.data.items || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  const handleClearFilters = () => {
    setFilterTopic('');
    setFilterCountry('');
    setFilterMode('');
    setSearchQuery('');
    setPage(1);
  };

  useEffect(() => {
    fetchTrainingData();
  }, [page, filterTopic, filterCountry, filterMode, searchQuery]);

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !sourceName.trim()) return alert("File and Source Name are required");
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('training_mode', mode.toLowerCase());
    if (topic) formData.append('topic_id', topic);
    if (mode === 'Guideline') formData.append('country', country);
    formData.append('source_name', sourceName);
    if (sourceUrl) formData.append('source_url', sourceUrl);

    try {
      await api.post('/admin/knowledge/ingest/pdf', formData);
      alert('PDF uploaded successfully!');
      setFile(null);
      setSourceName('');
      setSourceUrl('');
      setCountry('');
      if (document.getElementById('pdf-upload')) (document.getElementById('pdf-upload') as HTMLInputElement).value = '';
      fetchTrainingData();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.response?.data?.detail || 'Failed to upload'}`);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this PDF?")) return;
    try {
      await api.delete(`/admin/knowledge/${id}`);
      alert('Deleted successfully');
      fetchTrainingData();
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.detail || 'Failed to delete'}`);
    }
  };

  const handleResync = async (id: string) => {
    if (!window.confirm("Are you sure you want to re-sync this PDF?")) return;
    try {
      await api.post(`/admin/knowledge/${id}/resync`);
      alert('Re-sync started successfully');
      fetchTrainingData();
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.detail || 'Failed to re-sync'}`);
    }
  };

  const inputClass = "w-full bg-[#09090b] border border-white/10 hover:border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-500 font-sans px-4 py-2.5";

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/kb')} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <UploadCloud className="w-8 h-8 text-rose-400" /> Upload PDF
            </h1>
            <p className="text-slate-400 mt-1">Upload clinical PDFs, research papers, or hospital protocols.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white transition-colors"
        >
          {isFormOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {isFormOpen ? 'Hide Ingestion Form' : 'Show Ingestion Form'}
        </button>
      </div>

      <div className={`grid transition-all duration-300 ease-in-out ${isFormOpen ? 'grid-rows-[1fr] opacity-100 mb-8' : 'grid-rows-[0fr] opacity-0 mb-0'}`}>
        <div className="overflow-hidden">
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
                    options={topicOptions}
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
                  <label className="block text-sm font-medium text-slate-400 mb-2">Document Name</label>
                  <input 
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="e.g. ISUOG Guidelines 2024"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Source URL (Optional Reference)</label>
                  <input 
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Upload PDF File</label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-[#09090b] hover:bg-white/5 transition-colors">
                  <input 
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 shadow-sm rounded-full flex items-center justify-center text-rose-400 mb-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {file ? file.name : "Click to select a PDF"}
                    </h3>
                    <p className="text-sm text-slate-400 mt-2 max-w-md">
                      Only .pdf files are supported. Text will be extracted, chunked, and stored in the vector database.
                    </p>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-white/5">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !file}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-slate-200 rounded-lg text-sm font-medium transition-all disabled:opacity-50 mt-4"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSubmitting ? 'Uploading...' : 'Upload PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-white mb-4">Ingested PDF Data ({total})</h2>
        <KBFilterBar 
          filterTopic={filterTopic} setFilterTopic={setFilterTopic}
          filterCountry={filterCountry} setFilterCountry={setFilterCountry}
          filterMode={filterMode} setFilterMode={setFilterMode}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          topicOptions={topicOptions} onClear={handleClearFilters}
        />
        <div className="bg-[#18181b] rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 uppercase bg-black/20 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium">KB Item ID</th>
                  <th className="px-6 py-4 font-medium">Data Content</th>
                  <th className="px-6 py-4 font-medium">Mode</th>
                  <th className="px-6 py-4 font-medium">Date Added</th>
                  <th className="px-6 py-4 font-medium">Date Edited</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex justify-center items-center gap-3">
                         <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                         Loading data...
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No training data found.</td></tr>
                ) : (
                  data.map((item: any) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">{item.id.substring(0, 8)}...</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{item.source_name || 'Legacy Source'}</div>
                        <div className="text-xs text-blue-400 hover:underline mb-1">
                          <a href={item.content_url} target="_blank" rel="noreferrer">View PDF File</a>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.topic_id ? (topicOptions.find(t => t.value === item.topic_id)?.label || 'Unknown Topic') : 'No Topic'} | {item.country || 'No Country'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${item.mode === 'guideline' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                          {item.mode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => window.open(item.content_url, '_blank')} title="View Data" className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-green-400/10 rounded-md transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleResync(item.id)} title="Re-sync" className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingItem(item)} title="Edit" className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-md transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} title="Delete" className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
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
      {viewingItem && (
        <KBViewModal 
          item={viewingItem} 
          topicOptions={topicOptions}
          onClose={() => setViewingItem(null)} 
        />
      )}
      {editingItem && (
        <KBEditModal 
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null);
            fetchTrainingData();
          }}
        />
      )}
    </div>
  );
}
