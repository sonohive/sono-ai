import React, { useState, useEffect } from 'react';
import { Users, Activity, FileText, Database, TrendingUp, AlertTriangle, CheckCircle, Clock, Server, ArrowRight, ChevronDown, Download, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../api';

export default function Overview() {
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, trendRes, challengesRes] = await Promise.all([
          api.get('/admin/overview/stats'),
          api.get('/admin/overview/trend'),
          api.get('/admin/overview/challenges')
        ]);
        
        setStats(statsRes.data);
        setTrend(trendRes.data.data);
        setChallenges(challengesRes.data);
      } catch (error: any) {
        console.error("Error fetching overview data", error);
        setError(error.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-[#09090b]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-200 mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-400">{error}</p>
          <p className="text-slate-500 text-sm mt-4">Please ensure the backend server is running and the database is initialized.</p>
        </div>
      </div>
    );
  }

  if (loading || !stats || !challenges) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-[#09090b]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      
      {/* Header Area */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">{"< >"}</span>
          <span className="text-slate-300 font-medium ml-2">Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#18181b] border border-white/10 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors">
            Last 24 Hours <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 rounded-lg text-sm text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Stat Cards Grid (8 Cards total) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* ROW 1 */}
        {/* Card 1: Guideline Mode Total queries 28 days */}
        <div className="bg-[#121214] border border-white/5 rounded-xl p-5 hover:bg-[#18181b] transition-colors flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="text-sm text-slate-500 mb-1">Guideline Mode (28d)</div>
            <div className="text-2xl font-bold text-white mb-6">{stats.guideline_queries_28d.toLocaleString()}</div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
             <div className="flex items-center gap-1.5 text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Total Queries</div>
          </div>
        </div>

        {/* Card 2: Research mode total queries 28 days */}
        <div className="bg-[#121214] border border-white/5 rounded-xl p-5 hover:bg-[#18181b] transition-colors flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="text-sm text-slate-500 mb-1">Research Mode (28d)</div>
            <div className="text-2xl font-bold text-white mb-6">{stats.research_queries_28d.toLocaleString()}</div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
             <div className="flex items-center gap-1.5 text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Total Queries</div>
          </div>
        </div>

        {/* Card 7: Total Guideline Mode Total queries */}
        <div className="bg-[#121214] border border-white/5 rounded-xl p-5 hover:bg-[#18181b] transition-colors flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="text-sm text-slate-500 mb-1">Guideline Mode (All Time)</div>
            <div className="text-2xl font-bold text-white mb-6">{stats.guideline_queries_total.toLocaleString()}</div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
             <div className="flex items-center gap-1.5 text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Total Queries</div>
          </div>
        </div>

        {/* Card 8: Total Research mode total queries */}
        <div className="bg-[#121214] border border-white/5 rounded-xl p-5 hover:bg-[#18181b] transition-colors flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="text-sm text-slate-500 mb-1">Research Mode (All Time)</div>
            <div className="text-2xl font-bold text-white mb-6">{stats.research_queries_total.toLocaleString()}</div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
             <div className="flex items-center gap-1.5 text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Total Queries</div>
          </div>
        </div>

        {/* ROW 2 */}
        {/* Card 3: Total Users */}
        <div className="bg-[#121214] border border-white/5 rounded-xl p-5 hover:bg-[#18181b] transition-colors flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div className="text-sm text-slate-500 mb-1">Total Users</div>
            <div className="text-2xl font-bold text-white mb-6">{stats.total_users.toLocaleString()}</div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
             <div className="flex items-center gap-1.5 text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> All Registered Accounts</div>
          </div>
        </div>

        {/* Card 4: Active users in last 28 days */}
        <div className="bg-[#121214] border border-white/5 rounded-xl p-5 hover:bg-[#18181b] transition-colors flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="text-sm text-slate-500 mb-1">Active Users (28d)</div>
            <div className="text-2xl font-bold text-white mb-6">{stats.active_users_28d.toLocaleString()}</div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
             <div className="flex items-center gap-1.5 text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Active in period</div>
          </div>
        </div>

        {/* Card 5: New users in the last 28 days */}
        <div className="bg-[#121214] border border-white/5 rounded-xl p-5 hover:bg-[#18181b] transition-colors flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="text-sm text-slate-500 mb-1">New Users (28d)</div>
            <div className="text-2xl font-bold text-white mb-6">+{stats.new_users_28d.toLocaleString()}</div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
             <div className="flex items-center gap-1.5 text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div> New Registrations</div>
          </div>
        </div>

        {/* Card 6: Knowledge Base Size */}
        <div className="bg-[#121214] border border-white/5 rounded-xl p-5 hover:bg-[#18181b] transition-colors flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Server className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div className="text-sm text-slate-500 mb-1">Knowledge Base Size</div>
            <div className="text-2xl font-bold text-white mb-6">{stats.kb_size.toLocaleString()}</div>
          </div>
          <div className="flex items-center justify-between text-xs pt-4 border-t border-white/5">
             <div className="flex items-center gap-1.5 text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> Embedded Documents</div>
          </div>
        </div>

      </div>

      {/* Middle Row (Split 1:3) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Left Column Vertical Stats */}
        <div className="col-span-1 space-y-4">
          <div className="bg-[#121214] border border-white/5 rounded-xl p-5 h-full flex flex-col">
             <h3 className="text-sm font-medium text-slate-300 mb-4">Sono AI challenges today</h3>
             <div className="space-y-4 flex-1">
                {/* Unanswered Queries */}
                <div className="flex items-center gap-4 bg-white/5 rounded-lg p-3 border border-white/5">
                   <div className="w-10 h-10 rounded bg-[#18181b] flex items-center justify-center text-slate-400"><AlertTriangle className="w-4 h-4"/></div>
                   <div>
                     <div className="text-xs text-slate-500">Unanswered Queries</div>
                     <div className="text-lg font-bold text-white">{challenges.unanswered_queries}</div>
                   </div>
                </div>
                
                {/* Feedback Pie Chart */}
                <div className="bg-white/5 rounded-lg p-3 border border-white/5 flex-1 flex flex-col justify-center">
                   <div className="text-xs text-slate-500 mb-2">Feedback (Like vs Dislike)</div>
                   <div className="h-[120px] w-full relative">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={[
                             { name: 'Likes', value: challenges.likes_percentage, color: '#10b981' },
                             { name: 'Dislikes', value: challenges.dislikes_percentage, color: '#f43f5e' }
                           ]}
                           cx="50%"
                           cy="50%"
                           innerRadius={35}
                           outerRadius={50}
                           paddingAngle={5}
                           dataKey="value"
                           stroke="none"
                         >
                           {[
                             { name: 'Likes', value: challenges.likes_percentage, color: '#10b981' },
                             { name: 'Dislikes', value: challenges.dislikes_percentage, color: '#f43f5e' }
                           ].map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                         </Pie>
                         <Tooltip 
                           contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                           itemStyle={{ color: '#fff' }}
                         />
                       </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <span className="text-lg font-bold text-white">{challenges.likes_percentage}%</span>
                     </div>
                   </div>
                   <div className="flex justify-center gap-4 mt-2 text-[10px] text-slate-400">
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Likes</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Dislikes</div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column Trend Chart */}
        <div className="col-span-1 lg:col-span-3 bg-[#121214] border border-white/5 rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-medium text-slate-300">Sono AI user usage Trend</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-md text-xs text-slate-400 hover:text-slate-200 transition-colors">
              Last 7 Days <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8104B5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8104B5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 11}} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#8104B5' }}
                />
                <Area type="monotone" dataKey="queries" stroke="#8104B5" strokeWidth={3} fillOpacity={1} fill="url(#colorQueries)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Row (Split 1:2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column (RLHF Pending) */}
        <div className="col-span-1 bg-[#121214] border border-white/5 rounded-xl p-5 h-full">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-slate-300">Pending RLHF Reviews</h3>
              <span className="text-xs font-semibold text-rose-500">{challenges.unanswered_queries} pending</span>
           </div>
           
           {/* For now, just a placeholder list. We'll populate this properly later */}
           <div className="space-y-3">
             {challenges.unanswered_queries > 0 ? (
                 ['Review flagged item #1', 'Review flagged item #2'].slice(0, challenges.unanswered_queries).map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-lg p-3">
                       <div className="w-10 h-10 rounded bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                         <AlertTriangle className="w-4 h-4"/>
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-slate-500 font-mono">session_acc_{Math.floor(Math.random() * 1000)}</span>
                            <span className="text-[10px] text-slate-500">{10 * (i+1)} min ago</span>
                         </div>
                         <div className="text-sm font-medium text-slate-200 truncate">{item}</div>
                       </div>
                       <button className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-slate-300 transition-colors shrink-0 border border-white/5">
                         Review <ChevronDown className="w-3 h-3" />
                       </button>
                    </div>
                 ))
             ) : (
                <div className="text-sm text-slate-500 text-center py-4">No pending reviews.</div>
             )}
           </div>
        </div>

        {/* Right Column (System Health) */}
        <div className="col-span-1 lg:col-span-2 bg-[#121214] border border-white/5 rounded-xl p-5">
           <h3 className="text-sm font-medium text-slate-300 mb-4">System Health</h3>
           
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-[240px]">
             
             {/* Card 1 */}
             <div className="bg-[#18181b] border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                   <Activity className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white mb-1">LLM Latency</div>
                <div className="text-xs text-emerald-400">0 ms avg response</div>
                <div className="absolute bottom-0 left-0 right-0 h-10 flex items-end justify-between px-4 pb-2 opacity-30">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="w-1 bg-emerald-400 rounded-t" style={{ height: `0%` }}></div>
                  ))}
                </div>
             </div>

             {/* Card 2 */}
             <div className="bg-[#18181b] border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                   <Clock className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white mb-1">RAG Retrieval</div>
                <div className="text-xs text-blue-400">120ms avg search</div>
                <div className="absolute bottom-0 left-0 right-0 h-10 flex items-end justify-between px-4 pb-2 opacity-30">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="w-1 bg-blue-400 rounded-t" style={{ height: `${Math.random() * 100}%` }}></div>
                  ))}
                </div>
             </div>

             {/* Card 3 */}
             <div className="bg-[#18181b] border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                   <Server className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white mb-1">Vector DB Load</div>
                <div className="text-xs text-primary">24% Capacity</div>
                <div className="absolute bottom-0 left-0 right-0 h-10 flex items-end justify-between px-4 pb-2 opacity-30">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="w-1 bg-primary rounded-t" style={{ height: `${Math.random() * 100}%` }}></div>
                  ))}
                </div>
             </div>

             {/* Card 4 */}
             <div className="bg-[#18181b] border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                   <Database className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white mb-1">API Token Usage</div>
                <div className="text-xs text-amber-400">0 (28 days)</div>
                <div className="absolute bottom-0 left-0 right-0 h-10 flex items-end justify-between px-4 pb-2 opacity-30">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="w-1 bg-amber-400 rounded-t" style={{ height: `0%` }}></div>
                  ))}
                </div>
             </div>

           </div>
        </div>

      </div>

    </div>
  );
}
