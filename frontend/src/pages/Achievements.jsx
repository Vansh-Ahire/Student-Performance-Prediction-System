import { useState, useEffect } from 'react';
import api from '../api';
import { Trophy, Loader2, Flame, Star, Zap, Lock } from 'lucide-react';

export default function Achievements() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    api.get('/gamification').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const checkBadges = async () => {
    setChecking(true);
    try {
      const r = await api.post('/gamification/check');
      if (r.data.xp_gained > 0) {
        const refreshed = await api.get('/gamification');
        setData(refreshed.data);
      }
    } catch (e) { console.error(e); }
    finally { setChecking(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      <p className="text-dim font-black uppercase tracking-widest text-[10px]">Loading achievements...</p>
    </div>
  );

  if (!data) return <div className="text-dim text-center py-20">Failed to load.</div>;

  const unlockedIds = new Set(data.badges.map(b => b.id));
  const xpProgress = (data.xp % 100) / data.xp_to_next * 100;

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-orange-sm">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Achievements</h1>
            <p className="text-dim mt-1 font-medium italic">Earn XP and unlock badges by staying consistent.</p>
          </div>
        </div>
        <button onClick={checkBadges} disabled={checking}
          className="btn-primary px-6 py-3 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 disabled:opacity-50">
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Check Badges
        </button>
      </div>

      {/* XP & Level Card */}
      <div className="card p-6 bg-gradient-to-r from-orange-600/10 to-transparent border-orange-500/20">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-orange-600 flex items-center justify-center text-3xl font-black text-white shadow-orange-md">
            {data.level}
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-dim">Level {data.level}</p>
            <p className="text-2xl font-black text-white mt-1">{data.xp} XP</p>
            <div className="w-full bg-dark-700 rounded-full h-2 mt-3">
              <div className="bg-gradient-to-r from-orange-500 to-amber-400 h-2 rounded-full transition-all duration-700" style={{width: `${xpProgress}%`}} />
            </div>
            <p className="text-[9px] text-dim font-bold mt-1">{data.xp_to_next - (data.xp % 100)} XP to next level</p>
          </div>
        </div>
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Study Streak', value: data.study_streak, icon: '📖' },
          { label: 'Attendance Streak', value: data.attendance_streak, icon: '📅' },
          { label: 'Coding Streak', value: data.coding_streak, icon: '💻' },
        ].map((s, i) => (
          <div key={i} className="card p-5 flex items-center gap-4 hover:border-orange-500/20 transition-all">
            <div className="text-3xl">{s.icon}</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-dim">{s.label}</p>
              <p className="text-2xl font-black text-white flex items-center gap-2">
                {s.value} <span className="text-sm text-dim font-bold">days</span>
                {s.value >= 7 && <Flame className="w-5 h-5 text-orange-400 animate-pulse" />}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Badges Grid */}
      <div>
        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
          <Star className="w-5 h-5 text-amber-400" /> Badges
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {data.all_badges.map((badge) => {
            const unlocked = unlockedIds.has(badge.id);
            return (
              <div key={badge.id} className={`card p-5 text-center transition-all ${unlocked ? 'hover:border-amber-500/30 hover:shadow-amber-500/10 hover:shadow-lg' : 'opacity-40 grayscale'}`}>
                <div className="text-4xl mb-3">{badge.icon}</div>
                <h4 className="text-xs font-black text-white">{badge.name}</h4>
                <p className="text-[9px] text-dim mt-1 font-medium">{badge.desc}</p>
                {!unlocked && <Lock className="w-4 h-4 text-dim mx-auto mt-2" />}
                {unlocked && <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest mt-2 block">Unlocked</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
