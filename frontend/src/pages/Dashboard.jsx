import { useState, useEffect } from 'react';
import api from '../api';
import { 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  Bug, 
  Code2, 
  ChevronDown, 
  TrendingUp, 
  Users, 
  GitPullRequest, 
  Rocket, 
  UserPlus,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard');
        setData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* 4 Block Stats Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="card p-5 border-white/5 flex flex-col gap-6">
            <div className="flex justify-between">
              <div className="w-12 h-12 rounded-xl skeleton" />
              <div className="w-16 h-6 rounded-lg skeleton" />
            </div>
            <div className="space-y-3">
              <div className="w-20 h-3 rounded skeleton" />
              <div className="w-24 h-8 rounded-lg skeleton" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="card lg:col-span-3 h-[400px] flex flex-col gap-6">
            <div className="flex justify-between items-center">
               <div className="w-40 h-6 rounded skeleton" />
               <div className="w-24 h-10 rounded-xl skeleton" />
            </div>
            <div className="flex-1 rounded-2xl skeleton" />
        </div>
        <div className="card lg:col-span-2 h-[400px] flex flex-col gap-6 items-center justify-center">
            <div className="w-48 h-48 rounded-full skeleton" />
            <div className="w-32 h-20 rounded-xl skeleton" />
        </div>
      </div>
    </div>
  );

  const stats = [
    { label: 'Attendance', value: data ? `${data.overall_attendance.toFixed(1)}%` : '0%', change: 'Current', icon: Calendar, color: 'text-orange-400', bg: 'bg-orange-600/10', trend: 'up' },
    { label: 'Tasks Pending', value: data?.pending_tasks_count || '0', change: 'Current', icon: CheckCircle2, color: 'text-orange-400', bg: 'bg-orange-600/10', trend: 'down' },
    { label: 'Problems Solved', value: data?.total_solved || '0', change: 'Current', icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-600/10', trend: 'up' },
    { label: 'Risk Level', value: data?.risk_profile?.level || 'Unknown', change: 'Live', icon: ShieldCheck, color: data?.risk_profile?.color === 'danger' ? 'text-red-400' : 'text-orange-400', bg: 'bg-orange-600/10', trend: 'up' },
  ];

  const activity = [];

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      {/* 4 Block Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="card p-5 border-white/5 hover:border-orange-500/20 group relative overflow-hidden transition-all duration-500">
            <div className="flex items-start justify-between relative z-10">
              <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color} shadow-inner`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest ${s.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'} border border-white/5`}>
                {s.trend === 'up' ? '▲' : '▼'} {s.change}
              </div>
            </div>
            <div className="mt-6 relative z-10">
              <p className="text-xs font-bold text-dim uppercase tracking-widest leading-none">{s.label}</p>
              <h3 className="text-3xl font-black text-white mt-3 tracking-tighter">{s.value}</h3>
            </div>
            {/* Background decoration like the cards in the mockup */}
            <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-white/[0.02] blur-xl" />
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Attendance Overview - Large Line Chart */}
        <div className="card lg:col-span-3 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-lg font-black text-white tracking-tight">Attendance Overview</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-xs font-bold text-dim hover:text-white transition-all">
              Last 7 Days
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="flex-1 relative flex items-end">
            <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff5722" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ff5722" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path 
                d="M 0 250 Q 100 200 200 220 T 400 150 T 600 100 T 800 120" 
                fill="none" stroke="#ff5722" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                className="drop-shadow-[0_0_8px_rgba(255,87,34,0.3)]"
              />
              <path 
                d="M 0 250 Q 100 200 200 220 T 400 150 T 600 100 T 800 120 V 300 H 0 Z" 
                fill="url(#chartGradient)"
              />
            </svg>
          </div>
          <div className="flex justify-between mt-6 px-2">
             {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
               <span key={day} className="text-[10px] font-black text-dim tracking-widest">{day}</span>
             ))}
          </div>
          {data?.attendance_summary && data.attendance_summary.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-800/80 backdrop-blur-sm z-10 rounded-2xl">
              <p className="text-dim font-medium text-sm">No attendance data available yet.</p>
            </div>
          )}
        </div>

        {/* Platform Distribution - Donut Chart */}
        <div className="card lg:col-span-2 min-h-[400px] flex flex-col">
           <div className="flex items-center gap-3 mb-10">
             <div className="w-1.5 h-5 bg-orange-600 rounded-full shadow-glow" />
             <h3 className="text-lg font-black text-white tracking-tight">Platform Distribution</h3>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center gap-12">
              <div className="relative w-48 h-48">
                 <svg className="w-full h-full transform -rotate-90">
                     <circle cx="96" cy="96" r="80" strokeWidth="16" fill="transparent" className="chart-track" />
                    <circle cx="96" cy="96" r="80" stroke="#ea580c" strokeWidth="16" fill="transparent" 
                      strokeDasharray="502.4" strokeDashoffset="200" strokeLinecap="round" />
                    <circle cx="96" cy="96" r="80" stroke="#fb923c" strokeWidth="16" fill="transparent" 
                      strokeDasharray="502.4" strokeDashoffset="400" strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-black text-white leading-none">{data?.total_solved || 0}</p>
                    <p className="text-[10px] uppercase font-bold text-dim tracking-tight mt-1">Problems</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-3 w-full max-w-[140px]">
                 {[
                   { label: 'LeetCode', color: 'bg-orange-600' },
                   { label: 'HackerRank', color: 'bg-orange-500' },
                   { label: 'CodeChef', color: 'bg-orange-300' },
                 ].map(p => (
                   <div key={p.label} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                         <div className={`w-3 h-3 rounded-full ${p.color}`} />
                         <span className="text-xs font-bold text-dim group-hover:text-white transition-colors">{p.label}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Bottom Section: Activity & Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Recent Activity */}
        <div className="card lg:col-span-3 flex flex-col min-h-[350px]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-white tracking-tight">Recent Activity</h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-orange-400 hover:text-orange-300 transition-colors">View All</button>
           </div>
           
           <div className="space-y-6">
              {activity.length > 0 ? activity.map((item) => (
                <div key={item.id} className="flex items-start gap-4 group cursor-pointer">
                   <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-5 h-5" />
                   </div>
                   <div className="flex-1 pt-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                        {item.title}
                        {item.repo && <span className="text-orange-400 ml-1">#main</span>}
                      </h4>
                      <p className="text-xs text-dim mt-1">
                        {item.time} {item.repo && `• Repository: ${item.repo}`} {item.env && `• Environment: ${item.env}`}
                      </p>
                   </div>
                </div>
              )) : (
                <div className="text-center py-10">
                  <p className="text-dim text-sm">No recent activity found.</p>
                </div>
              )}
           </div>
        </div>

        {/* Quick Tips */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center gap-3 mb-2 ml-1">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-black text-white tracking-tight">Quick Tips</h3>
           </div>
           
           <div className="card bg-orange-500/5 border-orange-500/10 p-5 space-y-4 hover:border-orange-500/20 transition-all">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-orange-500" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dim">Performance</span>
              </div>
              <p className="text-sm text-dim leading-relaxed font-medium">
                Consider using lazy loading for your dashboard components to decrease initial load time by <span className="text-white font-black">30%</span>.
              </p>
           </div>

           <div className="card bg-amber-500/5 border-amber-500/10 p-5 space-y-4 hover:border-amber-500/20 transition-all">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-orange-500" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-dim">Security</span>
              </div>
              <p className="text-sm text-dim leading-relaxed font-medium">
                Enable 2FA for all team leads to ensure repository access remains secure.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
