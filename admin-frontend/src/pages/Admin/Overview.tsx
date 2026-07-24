import React, { useState, useEffect } from 'react';
import { Users, Activity, FileText, Database, TrendingUp, AlertTriangle, CheckCircle, Clock, Server, ArrowRight, ChevronDown, Download, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../api';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { CardContainer } from '../../components/ui/CardContainer';

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
    <div className="space-y-6 animate-fade-in text-slate-200 pb-12">
      
      {/* Header Area */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
        <span>{"< >"}</span>
        <span className="text-slate-300 font-medium ml-2">Dashboard</span>
      </div>
      <PageHeader title="Overview">
        <button className="flex items-center gap-2 px-4 py-2 bg-[#18181b] border border-white/10 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors">
          Last 24 Hours <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 rounded-lg text-sm text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </PageHeader>

      {/* Stat Cards Grid (8 Cards total) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        
        {/* ROW 1 */}
        <StatCard
          title="Guideline Mode (28d)"
          value={stats.guideline_queries_28d.toLocaleString()}
          icon={<Activity className="w-5 h-5 text-emerald-400" />}
          footerText="Total Queries"
          footerDotClass="bg-emerald-400"
        />
        <StatCard
          title="Research Mode (28d)"
          value={stats.research_queries_28d.toLocaleString()}
          icon={<Activity className="w-5 h-5 text-primary" />}
          footerText="Total Queries"
          footerDotClass="bg-primary"
        />
        <StatCard
          title="Guideline Mode (All Time)"
          value={stats.guideline_queries_total.toLocaleString()}
          icon={<Database className="w-5 h-5 text-emerald-400" />}
          footerText="Total Queries"
          footerDotClass="bg-emerald-400"
        />
        <StatCard
          title="Research Mode (All Time)"
          value={stats.research_queries_total.toLocaleString()}
          icon={<Database className="w-5 h-5 text-primary" />}
          footerText="Total Queries"
          footerDotClass="bg-primary"
        />

        {/* ROW 2 */}
        <StatCard
          title="Total Users"
          value={stats.total_users.toLocaleString()}
          icon={<Users className="w-5 h-5 text-slate-400" />}
          footerText="All Registered Accounts"
          footerDotClass="bg-blue-400"
        />
        <StatCard
          title="Active Users (28d)"
          value={stats.active_users_28d.toLocaleString()}
          icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
          footerText="Active in period"
          footerDotClass="bg-emerald-400"
        />
        <StatCard
          title="New Users (28d)"
          value={`+${stats.new_users_28d.toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
          footerText="New Registrations"
          footerDotClass="bg-amber-400"
        />
        <StatCard
          title="Knowledge Base Size"
          value={stats.kb_size.toLocaleString()}
          icon={<Server className="w-5 h-5 text-slate-400" />}
          footerText="Embedded Documents"
          footerDotClass="bg-slate-400"
        />

      </div>

      {/* Middle Row (Split 1:3) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Left Column Vertical Stats */}
        <CardContainer className="col-span-1 h-full flex flex-col">
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
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-xl font-bold text-white">{challenges.likes_percentage}%</span>
                     <span className="text-[10px] text-emerald-400">Positive</span>
                   </div>
                 </div>
              </div>
           </div>
        </CardContainer>

        {/* Middle Main Chart */}
        <CardContainer className="col-span-1 lg:col-span-3 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-1">Query Volume Trend</h3>
              <div className="text-xs text-slate-500">Number of queries per day over the last 28 days</div>
            </div>
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
        </CardContainer>

      </div>

      {/* Bottom Row (Split 1:2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column (RLHF Pending) */}
        <CardContainer className="col-span-1 h-full">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-slate-300">Pending SFT Reviews</h3>
              <span className="text-xs font-semibold text-rose-500">{stats.sft_pending_reviews} pending</span>
           </div>
           
           {/* Pending Reviews List */}
           <div className="space-y-3">
             {stats.sft_pending_reviews > 0 ? (
                 <div className="text-sm text-slate-400 text-center py-4">{stats.sft_pending_reviews} pending review(s) require attention in the SFT Portal.</div>
             ) : (
                 <div className="text-sm text-slate-500 text-center py-4">No pending reviews.</div>
             )}
             <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-xs text-slate-500">Completed SFT Data</span>
                <span className="text-sm font-medium text-emerald-400">{stats.sft_completed_reviews}</span>
             </div>
           </div>
        </CardContainer>

        {/* Right Column (System Health) */}
        <CardContainer className="col-span-1 lg:col-span-2">
           <h3 className="text-sm font-medium text-slate-300 mb-4">System Health</h3>
           
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-[240px]">
             
             {/* Card 1 */}
             <div className="bg-[#18181b] border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                   <Activity className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white mb-1">LLM Latency</div>
                <div className="text-xs text-emerald-400">Stable</div>
             </div>

             {/* Card 2 */}
             <div className="bg-[#18181b] border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                   <Clock className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white mb-1">RAG Retrieval</div>
                <div className="text-xs text-blue-400">Stable</div>
             </div>

             {/* Card 3 */}
             <div className="bg-[#18181b] border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                   <Server className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white mb-1">Vector DB Load</div>
                <div className="text-xs text-primary">Healthy</div>
             </div>

             {/* Card 4 */}
             <div className="bg-[#18181b] border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                   <Database className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white mb-1">API Status</div>
                <div className="text-xs text-amber-400">Online</div>
             </div>

           </div>
        </CardContainer>

      </div>

    </div>
  );
}
