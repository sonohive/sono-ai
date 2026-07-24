import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Database } from 'lucide-react';
import api from '../../api';

interface KBItem {
  id: string;
  source_name: string;
  training_type: string;
}

const Playground = () => {
  const [kbList, setKbList] = useState<KBItem[]>([]);
  const [selectedKb, setSelectedKb] = useState<string>('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchKb = async () => {
      try {
        const res = await api.get('/sft/knowledge');
        setKbList(res.data);
      } catch (err) {
        console.error("Failed to fetch KB list", err);
      }
    };
    fetchKb();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedKb) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsStreaming(true);

    // Create a placeholder for AI response
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sft/playground/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          message: userMessage,
          kb_id: selectedKb,
          session_id: 'playground'
        })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let aiResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }
            // Stream token by token
            aiResponse += data;
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1].content = aiResponse;
              return newMessages;
            });
          }
        }
      }
    } catch (err) {
      console.error("Chat error", err);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = "Error: Failed to fetch response from playground API.";
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Data Testing Playground</h1>
        <p className="text-slate-400 mt-1">Test isolated knowledge base chunks to verify accuracy.</p>
      </div>

      <div className="flex items-center gap-4 bg-[#121214] p-4 rounded-xl border border-white/5">
        <Database className="w-5 h-5 text-purple-400" />
        <select
          value={selectedKb}
          onChange={(e) => setSelectedKb(e.target.value)}
          className="flex-1 bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-slate-300 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        >
          <option value="">-- Select Knowledge Base Item --</option>
          {kbList.map(kb => (
            <option key={kb.id} value={kb.id}>
              [{kb.training_type.toUpperCase()}] {kb.source_name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 bg-[#121214] border border-white/5 rounded-xl flex flex-col overflow-hidden relative">
        {!selectedKb && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <p className="text-slate-400 font-medium">Select a Knowledge Base item to start testing.</p>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Bot className="w-12 h-12 mb-4 opacity-50" />
              <p>Playground is ready. Ask anything to test the selected knowledge.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-sm'
                    : 'bg-white/5 text-slate-300 border border-white/5 rounded-tl-sm'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming || !selectedKb}
              placeholder="Test the model's knowledge..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim() || !selectedKb}
              className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Playground;
