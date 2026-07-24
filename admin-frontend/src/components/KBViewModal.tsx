import React, { useState, useEffect } from 'react';
import { X, Loader2, Database, Link as LinkIcon, FileText, Tag, MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import api from '../api';

interface KBViewModalProps {
  item: any;
  topicOptions?: {value: string, label: string}[];
  onClose: () => void;
}

export function KBViewModal({ item, topicOptions = [], onClose }: KBViewModalProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/knowledge/${item.id}/content`)
      .then(res => {
        setContent(res.data.content);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch content", err);
        setContent("Error loading content. It may have been deleted.");
        setIsLoading(false);
      });
  }, [item.id]);

  const topicName = item.topic_id ? (topicOptions.find(t => String(t.value) === String(item.topic_id))?.label || item.topic_id) : 'None';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#09090b] shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" /> View Training Data
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Source: <span className="text-white font-medium">{item.source_name || 'Legacy Source'}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 flex flex-col">
          <div className="p-6 border-b border-white/5 bg-[#121214] shrink-0">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              
              <div className="space-y-3">
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> ID</span>
                  <span className="text-slate-300 font-mono text-xs break-all">{item.id}</span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Training Type</span>
                  <span className="text-white capitalize">{item.training_type}</span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Mode</span>
                  <span className="text-white capitalize">{item.mode || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Topic</span>
                  <span className="text-white">{topicName}</span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Country</span>
                  <span className="text-white">{item.country || 'N/A'}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0 flex items-center gap-1.5"><LinkIcon className="w-3.5 h-3.5" /> Source URL</span>
                  <span className="text-white truncate">
                    {item.source_url ? <a href={item.source_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{item.source_url}</a> : 'N/A'}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Content URL</span>
                  <span className="text-white truncate">
                    {item.content_url ? <a href={item.content_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">View Asset</a> : 'N/A'}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Label</span>
                  <span className="text-white">{item.label || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Added</span>
                  <span className="text-white">{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-32 shrink-0 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Edited</span>
                  <span className="text-white">{item.updated_at ? new Date(item.updated_at).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {item.description && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <span className="text-slate-500 text-sm block mb-1">Description / Findings</span>
                <span className="text-white text-sm leading-relaxed">{item.description}</span>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-[#09090b] flex-1">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Training Content</h3>
            {isLoading ? (
              <div className="flex justify-center items-center py-20 text-slate-400 gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading content...
              </div>
            ) : (
              <div className="bg-[#121214] rounded-xl p-5 border border-white/5 whitespace-pre-wrap text-sm text-slate-300 font-mono leading-relaxed min-h-[100px]">
                {item.training_type === 'media' && item.content_url && (
                  <div className="mb-6">
                    <img src={item.content_url} alt="Content" className="max-w-full h-auto max-h-[400px] rounded-lg border border-white/10" />
                  </div>
                )}
                {content}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-white/5 bg-[#121214] flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white/10 text-white hover:bg-white/20 rounded-lg text-sm font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
