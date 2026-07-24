import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Select } from './ui/Select';
import api from '../api';

interface KBEditModalProps {
  item: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function KBEditModal({ item, onClose, onSuccess }: KBEditModalProps) {
  const [mode, setMode] = useState(item.mode || 'Guideline');
  const [topic, setTopic] = useState(item.topic_id || '');
  const [country, setCountry] = useState(item.country || '');
  const [sourceName, setSourceName] = useState(item.source_name || '');
  const [sourceUrl, setSourceUrl] = useState(item.source_url || '');
  const [label, setLabel] = useState(item.label || '');
  const [description, setDescription] = useState(item.description || '');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topicOptions, setTopicOptions] = useState([{ value: '', label: '— No Topic —' }]);

  useEffect(() => {
    api.get('/admin/topics')
      .then(res => {
        const formatted = res.data.map((t: any) => ({ value: t.id, label: t.name }));
        setTopicOptions([{ value: '', label: '— No Topic —' }, ...formatted]);
      })
      .catch(err => console.error("Failed to fetch topics", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload: any = {
      mode: mode.toLowerCase(),
      topic_id: topic || null,
      country: mode === 'Guideline' ? country : null,
      source_name: sourceName,
      source_url: sourceUrl
    };

    if (item.training_type === 'media') {
      payload.label = label;
      if (description.trim() !== '') {
        payload.description = description;
      }
    }

    if (item.training_type === 'text' && content.trim() !== '') {
      payload.content = content;
    }

    try {
      await api.put(`/admin/knowledge/${item.id}`, payload);
      alert('Item updated successfully!');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.response?.data?.detail || 'Failed to update'}`);
    }
    setIsSubmitting(false);
  };

  const inputClass = "w-full bg-[#09090b] border border-white/10 hover:border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-500 font-sans px-4 py-2.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121214] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-[#121214]/90 backdrop-blur-md z-10">
          <h2 className="text-xl font-bold text-white">Edit Knowledge Base Item</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <label className="block text-sm font-medium text-slate-400 mb-2">Source Name</label>
              <input 
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Source URL</label>
              <input 
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {item.training_type === 'media' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">Label</label>
                <input 
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">Update Description (Optional)</label>
                <p className="text-xs text-slate-500 mb-2">Leaving this blank will keep existing chunks. Entering new text will overwrite current chunks.</p>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Paste new description here to overwrite..."
                  className={`${inputClass} min-h-[150px] resize-y py-3`}
                />
              </div>
            </div>
          )}

          {item.training_type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Update Content (Optional)</label>
              <p className="text-xs text-slate-500 mb-2">Leaving this blank will keep existing chunks. Entering new text will overwrite current chunks.</p>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste new content here to overwrite..."
                className={`${inputClass} min-h-[150px] resize-y py-3`}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-transparent hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-slate-200 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
