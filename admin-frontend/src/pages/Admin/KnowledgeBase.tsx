import React, { useState, useEffect } from 'react';
import { FileText, Server, FileImage, Link as LinkIcon, FileCode, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_kb_data: 0,
    total_chunking_data: 0,
    redis_total_keys: 0,
    total_images_data: 0
  });

  useEffect(() => {
    fetch('/api/admin/knowledge/stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setStats(data);
      })
      .catch(err => console.error(err));
  }, []);

  const statCards = [
    { title: 'Total KB Data', value: stats.total_kb_data, icon: <FileText className="w-5 h-5 text-blue-400" />, subtitle: 'All ingested training data' },
    { title: 'Total Chunking Data', value: stats.total_chunking_data, icon: <Server className="w-5 h-5 text-indigo-400" />, subtitle: 'Generated text chunks' },
    { title: 'Redis Total Keys', value: stats.redis_total_keys, icon: <Server className="w-5 h-5 text-rose-400" />, subtitle: 'Cached vector embeddings' },
    { title: 'Total Images Data', value: stats.total_images_data, icon: <FileImage className="w-5 h-5 text-emerald-400" />, subtitle: 'Clinical images stored' }
  ];

  const trainingMediums = [
    {
      id: 'pdf',
      title: 'PDF Upload',
      description: 'Upload PDF documents to extract and add their content to the knowledge base.',
      icon: <FileText className="w-8 h-8 text-blue-400" />,
      path: '/kb/pdf'
    },
    {
      id: 'url',
      title: 'Website URL',
      description: 'Crawl any public website URL to extract and add text content to the knowledge base.',
      icon: <LinkIcon className="w-8 h-8 text-indigo-400" />,
      path: '/kb/url'
    },
    {
      id: 'text',
      title: 'Custom Text',
      description: 'Write or paste any custom text or raw guidelines.',
      icon: <FileCode className="w-8 h-8 text-purple-400" />,
      path: '/kb/text'
    },
    {
      id: 'media',
      title: 'Media',
      description: 'Upload images with labels and descriptive information about them.',
      icon: <FileImage className="w-8 h-8 text-emerald-400" />,
      path: '/kb/media'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Knowledge Base</h1>
        <p className="text-slate-400">Select a medium to train the AI with new medical context.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-[#121214] border border-white/5 rounded-xl p-5 hover:bg-[#18181b] transition-colors flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  {card.icon}
                </div>
              </div>
              <div className="text-sm text-slate-500 mb-1">{card.title}</div>
              <div className="text-2xl font-bold text-white mb-6">{card.value.toLocaleString()}</div>
            </div>
            <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div> {card.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Training Mediums */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trainingMediums.map((medium) => (
          <div 
            key={medium.id}
            onClick={() => navigate(medium.path)}
            className="bg-[#121214] border border-white/5 rounded-xl p-6 cursor-pointer group hover:bg-[#18181b] hover:border-white/10 transition-all flex items-start gap-5 relative overflow-hidden"
          >
            <div className="p-3 bg-white/5 rounded-lg border border-white/5 group-hover:scale-110 transition-transform">
              {medium.icon}
            </div>
            <div className="flex-1 pr-8">
              <h3 className="text-lg font-bold text-white mb-2">{medium.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {medium.description}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 absolute top-6 right-6 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        ))}
      </div>
    </div>
  );
}
