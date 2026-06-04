import { useState, useEffect } from 'react';
import api from '../api';
import { Users, Loader2, Crown, Medal, Trophy, ToggleLeft, ToggleRight, Code2, BookOpen, Zap } from 'lucide-react';

export default function Leaderboard() {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optedIn, setOptedIn] = useState(false);

  useEffect(() => {
    api.get('/leaderboard').then(r => setBoard(r.data)).catch(console.error).finally(() => setLoading(false));
    api.get('/profile').then(r => setOptedIn(r.data.show_on_leaderboard || false)).catch(() => {});
  }, []);

  const toggleOpt = async () => {
    try {
      const r = await api.post('/leaderboard/toggle');
      setOptedIn(r.data.show_on_leaderboard);
      const refreshed = await api.get('/leaderboard');
      setBoard(refreshed.data);
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      <p className="text-dim font-black uppercase tracking-widest text-[10px]">Loading leaderboard...</p>
    </div>
  );

  const rankIcons = [
    <Crown className="w-6 h-6 text-amber-400" />,
    <Medal className="w-6 h-6 text-slate-300" />,
    <Medal className="w-6 h-6 text-amber-700" />,
  ];

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-orange-sm">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Leaderboard</h1>
            <p className="text-dim mt-1 font-medium italic">Compare your progress with peers.</p>
          </div>
        </div>
        <button onClick={toggleOpt}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${optedIn ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-dark-800 text-dim border border-white/5 hover:text-white'}`}>
          {optedIn ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          {optedIn ? 'Visible' : 'Hidden'}
        </button>
      </div>

      {!optedIn && (
        <div className="card p-4 bg-amber-500/5 border-amber-500/10 flex items-center gap-3">
          <Users className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400 font-medium">You're not visible on the leaderboard. Toggle visibility to appear and compare.</p>
        </div>
      )}

      {board.length > 0 ? (
        <div className="space-y-3">
          {board.map((user, i) => (
            <div key={user.id} className={`card p-5 flex items-center gap-5 transition-all ${user.is_self ? 'border-orange-500/30 bg-orange-500/5' : 'hover:border-white/10'}`}>
              <div className="w-10 h-10 rounded-xl bg-dark-900 border border-white/5 flex items-center justify-center shrink-0">
                {i < 3 ? rankIcons[i] : <span className="text-sm font-black text-dim">{i + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-white text-sm flex items-center gap-2">
                  {user.name} {user.is_self && <span className="text-[9px] bg-orange-600/20 text-orange-400 px-2 py-0.5 rounded font-black">YOU</span>}
                </h4>
                <p className="text-[10px] text-dim font-bold">Level {user.level}</p>
              </div>
              <div className="flex items-center gap-6 text-center">
                <div>
                  <Zap className="w-4 h-4 text-amber-400 mx-auto mb-0.5" />
                  <p className="text-sm font-black text-white">{user.xp}</p>
                  <p className="text-[8px] text-dim font-black uppercase">XP</p>
                </div>
                <div>
                  <Code2 className="w-4 h-4 text-emerald-400 mx-auto mb-0.5" />
                  <p className="text-sm font-black text-white">{user.problems_solved}</p>
                  <p className="text-[8px] text-dim font-black uppercase">Solved</p>
                </div>
                <div>
                  <BookOpen className="w-4 h-4 text-cyan-400 mx-auto mb-0.5" />
                  <p className="text-sm font-black text-white">{user.attendance}%</p>
                  <p className="text-[8px] text-dim font-black uppercase">Attend</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center flex flex-col items-center gap-4 border-dashed border-white/10">
          <Trophy className="w-12 h-12 text-dim opacity-30" />
          <h3 className="text-lg font-black text-white/50 lowercase">No one on the leaderboard yet</h3>
          <p className="text-xs text-dim italic">Toggle your visibility to be the first!</p>
        </div>
      )}
    </div>
  );
}
