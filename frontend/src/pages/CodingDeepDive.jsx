import { useState, useEffect } from 'react';
import api from '../api';
import { BarChart3, Loader2, Code2, AlertTriangle, TrendingUp } from 'lucide-react';

export default function CodingDeepDive() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/coding/deep-analysis').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      <p className="text-dim font-black uppercase tracking-widest text-[10px]">Analyzing coding stats...</p>
    </div>
  );

  if (!data) return <div className="text-dim text-center py-20">Failed to load.</div>;

  const diffColors = { easy: 'bg-emerald-500', medium: 'bg-amber-500', hard: 'bg-red-500' };
  const total = data.difficulty.easy + data.difficulty.medium + data.difficulty.hard || 1;

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-orange-sm">
          <BarChart3 className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Coding Deep Dive</h1>
          <p className="text-dim mt-1 font-medium italic">Difficulty & topic-wise breakdown of your coding journey.</p>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="card p-6 space-y-6">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Code2 className="w-4 h-4 text-orange-400" /> Difficulty Distribution
        </h3>
        <div className="flex gap-1 h-6 rounded-full overflow-hidden bg-dark-900">
          <div className="bg-emerald-500 transition-all duration-700 rounded-l-full" style={{width: `${(data.difficulty.easy/total)*100}%`}} />
          <div className="bg-amber-500 transition-all duration-700" style={{width: `${(data.difficulty.medium/total)*100}%`}} />
          <div className="bg-red-500 transition-all duration-700 rounded-r-full" style={{width: `${(data.difficulty.hard/total)*100}%`}} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Easy', count: data.difficulty.easy, color: 'text-emerald-400', bg: 'bg-emerald-500' },
            { label: 'Medium', count: data.difficulty.medium, color: 'text-amber-400', bg: 'bg-amber-500' },
            { label: 'Hard', count: data.difficulty.hard, color: 'text-red-400', bg: 'bg-red-500' },
          ].map((d, i) => (
            <div key={i} className="bg-dark-900 border border-white/5 rounded-xl p-4 text-center">
              <div className={`w-3 h-3 rounded-full ${d.bg} mx-auto mb-2`} />
              <p className="text-[9px] font-black uppercase tracking-widest text-dim">{d.label}</p>
              <p className={`text-2xl font-black ${d.color} mt-1`}>{d.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Topic Breakdown */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-400" /> Topic-wise Progress
        </h3>
        <div className="space-y-3">
          {data.topics.map((topic, i) => {
            const pct = topic.total > 0 ? (topic.solved / topic.total * 100) : 0;
            const isWeak = data.weak_topics.includes(topic.name);
            return (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isWeak ? 'bg-red-500/5 border border-red-500/10' : 'hover:bg-white/[0.02]'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-white">{topic.name}</p>
                    {isWeak && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-1.5 mt-2">
                    <div className={`h-1.5 rounded-full transition-all duration-700 ${isWeak ? 'bg-red-500' : 'bg-orange-500'}`} style={{width: `${pct}%`}} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-black ${isWeak ? 'text-red-400' : 'text-white'}`}>{topic.solved}/{topic.total}</p>
                  <p className="text-[9px] text-dim font-bold">{pct.toFixed(0)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weak Topics Alert */}
      {data.weak_topics.length > 0 && (
        <div className="card p-5 bg-red-500/5 border-red-500/10 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-black text-red-400 uppercase tracking-widest">Weak Topics</h3>
          </div>
          <p className="text-xs text-dim font-medium">
            Focus more on: <span className="text-white font-black">{data.weak_topics.join(', ')}</span>
          </p>
        </div>
      )}

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.platforms.map((p, i) => (
          <div key={i} className="card p-5 text-center hover:border-orange-500/20 transition-all">
            <Code2 className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-[9px] font-black uppercase tracking-widest text-dim">{p.platform}</p>
            <p className="text-2xl font-black text-white mt-1">{p.solved}</p>
            {p.rating > 0 && <p className="text-[10px] text-amber-400 font-bold mt-1">Rating: {p.rating}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
