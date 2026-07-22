import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, Link as LinkIcon, Server } from 'lucide-react';

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState<'upload' | 'urls' | 'manage'>('upload');
  const [url, setUrl] = useState('');
  const [chunksCount, setChunksCount] = useState(0);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.ok ? res.json() : { embedded_chunks: 0 })
      .then(data => setChunksCount(data.embedded_chunks))
      .catch(err => console.error(err));
  }, [activeTab]);

  const handleIngestUrl = async () => {
    if (!url) return;
    try {
      await fetch('/api/admin/ingest-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      setUrl('');
      alert('URL queued for ingestion!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Knowledge Base Management</h1>
        <p className="text-slate-500 mt-1">Ingest new PDFs and URLs to train the AI.</p>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-4 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'upload' ? 'border-b-2 border-brand-700 text-brand-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UploadCloud className="w-4 h-4" /> Upload PDFs
          </button>
          <button
            onClick={() => setActiveTab('urls')}
            className={`px-6 py-4 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'urls' ? 'border-b-2 border-brand-700 text-brand-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LinkIcon className="w-4 h-4" /> Scrape URLs
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-4 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'manage' ? 'border-b-2 border-brand-700 text-brand-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Server className="w-4 h-4" /> Redis Index
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'upload' && (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
              <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center text-brand-600 mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">Click to upload medical PDFs</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md">
                Files will be uploaded to Cloudflare R2, and their text will be embedded into the Redis Vector Store.
              </p>
            </div>
          )}

          {activeTab === 'urls' && (
            <div className="space-y-4 max-w-lg">
              <label className="block text-sm font-medium text-slate-700">Enter URL to scrape</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/medical-guideline"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
                <button onClick={handleIngestUrl} className="btn-primary">Ingest</button>
              </div>
            </div>
          )}
          
          {activeTab === 'manage' && (
            <div className="text-slate-600">
               <p>Vector database currently contains <strong className="text-brand-700 text-lg">{chunksCount}</strong> embedded chunks.</p>
               <button className="mt-4 px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">Clear Index</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
