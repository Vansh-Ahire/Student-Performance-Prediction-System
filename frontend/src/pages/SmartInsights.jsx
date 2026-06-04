import { useState, useEffect } from 'react';
import api from '../api';
import { Brain, TrendingUp, AlertTriangle, Activity, Loader2, ShieldCheck, Code2, BookOpen, Zap } from 'lucide-react';

export default function SmartInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/insights').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      <p className="text-dim font-black uppercase tracking-widest text-[10px]">Analyzing your data...</p>
    </div>
  );

  if (!data) return <div className="text-dim text-center py-20">Failed to load insights.</div>;

  const healthColor = data.health_score >= 70 ? 'text-emerald-400' : data.health_score >= 40 ? 'text-amber-400' : 'text-red-400';
  const healthBg = data.health_score >= 70 ? 'bg-emerald-500' : data.health_score >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-orange-sm">
          <Brain className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Smart Insights</h1>
          <p className="text-dim mt-1 font-medium italic">AI-powered analysis of your academic performance.</p>
        </div>
      </div>

      {/* Health Score Hero */}
      <div className="card p-8 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-r from-dark-800 to-dark-900">
        <div className="relative w-40 h-40 shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="80" cy="80" r="68" stroke="rgba(255,255,255,0.03)" strokeWidth="12" fill="transparent" />
            <circle cx="80" cy="80" r="68" stroke={data.health_score >= 70 ? '#10b981' : data.health_score >= 40 ? '#f59e0b' : '#ef4444'}
              strokeWidth="12" fill="transparent" strokeDasharray="427" strokeDashoffset={427 - (data.health_score / 100 * 427)}
              strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-black ${healthColor}`}>{data.health_score}</span>
            <span className="text-[9px] font-black text-dim uppercase tracking-widest mt-2">Health Score</span>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <h2 className="text-xl font-black text-white">Academic Health Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Attendance', value: `${data.overall_attendance}%`, icon: BookOpen, color: 'text-cyan-400' },
              { label: 'Critical Subjects', value: data.critical_subjects, icon: AlertTriangle, color: 'text-red-400' },
              { label: 'Pending Tasks', value: data.pending_tasks, icon: Activity, color: 'text-amber-400' },
              { label: 'Coding Level', value: data.coding_insight.level, icon: Code2, color: 'text-emerald-400' },
            ].map((s, i) => (
              <div key={i} className="bg-dark-900 border border-white/5 rounded-xl p-3 text-center">
                <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                <p className="text-[9px] font-black uppercase tracking-widest text-dim">{s.label}</p>
                <p className="text-lg font-black text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Alerts */}
      {data.attendance_alerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 ml-1">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black text-white tracking-tight">Attendance Predictions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.attendance_alerts.map((alert, i) => (
              <div key={i} className={`card p-5 border-l-4 ${alert.status === 'critical' ? 'border-l-red-500 bg-red-500/5' : 'border-l-amber-500 bg-amber-500/5'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className={`w-5 h-5 ${alert.status === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
                  <h4 className="font-black text-white text-sm">{alert.subject}</h4>
                  <span className={`ml-auto text-xs font-black px-2 py-0.5 rounded-full ${alert.status === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {alert.current}%
                  </span>
                </div>
                <p className="text-xs text-dim font-medium">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coding Insight */}
      <div className="card p-6 bg-emerald-500/5 border-emerald-500/10 space-y-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Coding Velocity</h3>
        </div>
        <div className="flex items-center gap-8">
          <div>
            <p className="text-3xl font-black text-white">{data.coding_insight.total_solved}</p>
            <p className="text-[10px] text-dim font-black uppercase tracking-widest">Problems Solved</p>
          </div>
          <div>
            <p className="text-3xl font-black text-white">{data.coding_insight.platforms}</p>
            <p className="text-[10px] text-dim font-black uppercase tracking-widest">Platforms</p>
          </div>
          <div className="ml-auto">
            <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
              data.coding_insight.level === 'Advanced' ? 'bg-emerald-500/20 text-emerald-400' :
              data.coding_insight.level === 'Intermediate' ? 'bg-amber-500/20 text-amber-400' : 'bg-orange-500/20 text-orange-400'
            }`}>{data.coding_insight.level}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
