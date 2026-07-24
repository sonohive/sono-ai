import React, { useState, useEffect } from 'react';
import { FileText, Server, FileImage, Link as LinkIcon, FileCode, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import api from '../../api';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_kb_data: 0,
    total_chunking_data: 0,
    redis_total_keys: 0,
    total_images_data: 0,
    total_text: 0,
    text_guideline: 0,
    text_research: 0,
    total_url: 0,
    url_guideline: 0,
    url_research: 0,
    total_pdf: 0,
    pdf_guideline: 0,
    pdf_research: 0,
    total_media: 0,
    media_guideline: 0,
    media_research: 0
  });

  useEffect(() => {
    api.get('/admin/knowledge/stats')
      .then(res => {
        if (res.data) setStats(res.data);
      })
      .catch(err => console.error(err));
  }, []);

  const statCards = [
    { title: 'Total KB Data', value: stats.total_kb_data, icon: <FileText className="w-5 h-5 text-blue-400" />, subtitle: 'All ingested training data' },
    { title: 'Total Chunking Data', value: stats.total_chunking_data, icon: <Server className="w-5 h-5 text-indigo-400" />, subtitle: 'Generated text chunks' },
    { title: 'Redis Total Keys', value: stats.redis_total_keys, icon: <Server className="w-5 h-5 text-rose-400" />, subtitle: 'Cached vector embeddings' },
    { title: 'Total Images Data', value: stats.total_images_data, icon: <FileImage className="w-5 h-5 text-emerald-400" />, subtitle: 'Clinical images stored' },
    { title: 'Custom Text - Guideline', value: stats.text_guideline, icon: <FileCode className="w-5 h-5 text-purple-400" />, subtitle: 'Ingested guidelines' },
    { title: 'Custom Text - Research', value: stats.text_research, icon: <FileCode className="w-5 h-5 text-purple-300" />, subtitle: 'Ingested research text' },
    { title: 'URL - Guideline', value: stats.url_guideline, icon: <LinkIcon className="w-5 h-5 text-cyan-400" />, subtitle: 'Scraped guideline URLs' },
    { title: 'URL - Research', value: stats.url_research, icon: <LinkIcon className="w-5 h-5 text-cyan-300" />, subtitle: 'Scraped research URLs' },
    { title: 'PDF - Guideline', value: stats.pdf_guideline, icon: <FileText className="w-5 h-5 text-orange-400" />, subtitle: 'Parsed guideline PDFs' },
    { title: 'PDF - Research', value: stats.pdf_research, icon: <FileText className="w-5 h-5 text-orange-300" />, subtitle: 'Parsed research PDFs' },
    { title: 'Media - Guideline', value: stats.media_guideline, icon: <FileImage className="w-5 h-5 text-emerald-400" />, subtitle: 'Clinical images (Guideline)' },
    { title: 'Media - Research', value: stats.media_research, icon: <FileImage className="w-5 h-5 text-emerald-300" />, subtitle: 'Clinical images (Research)' }
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
      <PageHeader 
        title="Knowledge Base" 
        description="Select a medium to train the AI with new medical context."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          // Extract the color class from the icon to use for the dot
          const iconElement = card.icon as React.ReactElement;
          const colorMatch = iconElement.props.className?.match(/text-(\w+-\d+)/);
          const dotClass = colorMatch ? `bg-${colorMatch[1]}` : 'bg-slate-500';
          
          return (
            <StatCard
              key={idx}
              title={card.title}
              value={card.value.toLocaleString()}
              icon={card.icon}
              footerText={card.subtitle}
              footerDotClass={dotClass}
            />
          );
        })}
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
