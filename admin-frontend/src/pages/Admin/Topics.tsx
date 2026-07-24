import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import api from '../../api';
import { PageHeader } from '../../components/ui/PageHeader';
import { CardContainer } from '../../components/ui/CardContainer';

export default function Topics() {
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchTopics = () => {
    setIsLoading(true);
    api.get('/admin/topics')
      .then(res => setTopics(res.data))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Name is required");

    try {
      if (editingTopic) {
        await api.put(`/admin/topics/${editingTopic.id}`, { name, description });
      } else {
        await api.post('/admin/topics', { name, description });
      }
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setEditingTopic(null);
      fetchTopics();
    } catch (err: any) {
      alert(err.response?.data?.detail || "An error occurred");
    }
  };

  const openEdit = (topic: any) => {
    setEditingTopic(topic);
    setName(topic.name);
    setDescription(topic.description || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this topic?")) return;
    try {
      await api.delete(`/admin/topics/${id}`);
      fetchTopics();
    } catch (err: any) {
      alert(err.response?.data?.detail || "An error occurred");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader 
        title="Topics" 
        description="Manage categories for your Knowledge Base training data."
      >
        <button 
          onClick={() => {
            setEditingTopic(null);
            setName('');
            setDescription('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Topic</span>
        </button>
      </PageHeader>

      <CardContainer noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Topic Name</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Training Data</th>
                <th className="px-6 py-4 font-medium">Created At</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading topics...</td>
                </tr>
              ) : topics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No topics found. Create one to get started.</td>
                </tr>
              ) : (
                topics.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-slate-400">
                          <Tag className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-white">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{t.description || '-'}</td>
                    <td className="px-6 py-4 text-slate-400">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-white/5 text-xs font-medium text-slate-300">
                        {t.data_count || 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-400 bg-white/5 hover:bg-blue-400/10 rounded transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-400/10 rounded transition-colors" title="Delete">
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
      </CardContainer>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#121214]">
              <h3 className="text-lg font-bold text-white">{editingTopic ? 'Edit Topic' : 'New Topic'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Topic Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#09090b] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    placeholder="e.g. Cardiology"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-[#09090b] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none h-24"
                    placeholder="Brief description of the topic..."
                  ></textarea>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors">
                    {editingTopic ? 'Save Changes' : 'Create Topic'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
