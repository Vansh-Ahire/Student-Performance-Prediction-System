import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Flame,
  Layout,
  BookOpen,
  Calculator,
  ChevronRight,
  TrendingUp,
  Target,
  Settings2,
  Timer
} from 'lucide-react';

export default function StudyTimer() {
  const [activeSession, setActiveSession] = useState('pomodoro');
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(45);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  const sessionOptions = [
    { id: 'pomodoro', label: 'Pomodoro', mins: 25, description: 'Focus on your task for 25 minutes' },
    { id: 'short', label: 'Short Session', mins: 60, description: 'One hour of focused deep work' },
    { id: 'long', label: 'Long Session', mins: 150, description: '2.5 hours deep dive session' },
    { id: 'custom', label: 'Custom', mins: customMinutes, description: 'Choose your own focus duration' },
  ];

  const currentSession = sessionOptions.find(s => s.id === activeSession);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          setRunning(false);
          clearInterval(timerRef.current);
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running, minutes, seconds]);

  const toggleTimer = () => setRunning(!running);

  const handleSessionChange = (sessionId) => {
    setRunning(false);
    setActiveSession(sessionId);
    const session = sessionOptions.find(s => s.id === sessionId);
    setMinutes(sessionId === 'custom' ? customMinutes : session.mins);
    setSeconds(0);
  };

  const handleCustomMinutesChange = (e) => {
    const val = parseInt(e.target.value) || 0;
    setCustomMinutes(val);
    if (activeSession === 'custom' && !running) {
      setMinutes(val);
      setSeconds(0);
    }
  };

  const resetTimer = () => {
    setRunning(false);
    setMinutes(activeSession === 'custom' ? customMinutes : currentSession.mins);
    setSeconds(0);
  };

  const fmt = (n) => n.toString().padStart(2, '0');

  const stats = [
    { label: 'Completed Today', value: '0 Sessions', change: '', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Focus Time', value: '0 Hours', change: '', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Current Streak', value: '0 Days', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ];

  const recentSessions = [];

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      {/* Header (Optional, since Navbar has it, but following mockup style) */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Study Timer</h1>
      </div>

      {/* Session Type Selectors - Centered and Styled */}
      <div className="flex flex-col items-center gap-6 mb-2">
        <div className="flex items-center gap-1.5 p-1.5 bg-dark-800/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl study-session-bar">
          {sessionOptions.map((session) => (
            <button
              key={session.id}
              onClick={() => handleSessionChange(session.id)}
              className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 relative overflow-hidden group/btn ${
                activeSession === session.id
                  ? 'bg-orange-500 text-white shadow-glow shadow-orange-500/40 scale-105'
                  : 'text-dim hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="relative z-10">{session.label}</span>
              {activeSession === session.id && (
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Timer Card */}
      <div className="card flex flex-col items-center py-10 px-6 relative overflow-hidden group shadow-2xl">
         <div className="flex items-center gap-2 bg-orange-500/10 px-4 py-1.5 rounded-full border border-orange-500/20 mb-8">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
              {activeSession === 'pomodoro' ? 'Deep Work Session' : activeSession === 'custom' ? 'Custom Focus' : 'Extended Focus'}
            </span>
         </div>

         <div className="text-center mb-10 w-full max-w-md">
            <h2 className="text-3xl font-black text-white tracking-tight">{currentSession.label}</h2>
            <p className="text-dim text-sm mt-1 font-medium italic">{currentSession.description}</p>
            
            {activeSession === 'custom' && (
              <div className="mt-6 flex items-center justify-center gap-4 bg-dark-900/50 p-4 rounded-2xl border border-white/5 animate-fade-in custom-config-panel">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div className="w-full flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-dim uppercase tracking-widest">Focus Duration (Mins)</label>
                    <span className="text-[11px] font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">{customMinutes}m</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="180" 
                    value={customMinutes}
                    onChange={handleCustomMinutesChange}
                    className="w-full h-1.5 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between">
                    <span className="text-[9px] font-bold text-dim/60">1m</span>
                    <span className="text-[9px] font-bold text-dim/60">180m</span>
                  </div>
                </div>
              </div>
            )}
         </div>

         {/* Timer Blocks */}
         <div className="flex items-center gap-4 mb-12">
            <div className="flex flex-col items-center gap-4">
               <div className="w-32 h-44 rounded-3xl glass border-white/5 flex items-center justify-center relative overflow-hidden shadow-2xl">
                  <span className={`${minutes >= 100 ? 'text-[64px]' : 'text-[90px]'} font-black text-white leading-none tracking-tighter transition-all duration-300`}>
                    {fmt(minutes)}
                  </span>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-orange-500 shadow-glow shadow-orange-500/50" />
               </div>
               <span className="text-[10px] font-black text-dim tracking-[0.3em] uppercase">Minutes</span>
            </div>

            <div className="text-4xl font-black text-orange-400/50 mb-10">:</div>

            <div className="flex flex-col items-center gap-4">
               <div className="w-32 h-44 rounded-3xl glass border-white/5 flex items-center justify-center relative overflow-hidden shadow-2xl">
                  <span className="text-[90px] font-black text-white leading-none tracking-tighter transition-all duration-300">
                    {fmt(seconds)}
                  </span>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-orange-500 shadow-glow shadow-orange-500/50" />
               </div>
               <span className="text-[10px] font-black text-dim tracking-[0.3em] uppercase">Seconds</span>
            </div>
         </div>

         {/* Controls */}
         <div className="flex items-center gap-6">
            <button 
              onClick={toggleTimer}
              className="btn-primary bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-10 py-5 flex items-center gap-3 border-none group transition-all transform active:scale-95"
            >
              {running ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              <span className="text-xs font-black uppercase tracking-widest">{running ? 'Pause Session' : 'Start Session'}</span>
            </button>
            
            <button 
              onClick={() => setRunning(false)}
              className="px-8 py-5 rounded-xl bg-dark-700/50 text-dim hover:text-white border border-dark-600 flex items-center gap-3 transition-all hover:bg-dark-600"
            >
              <Pause className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Pause</span>
            </button>

            <button 
              onClick={resetTimer}
              className="p-5 rounded-full bg-dark-800 border border-dark-700 text-dim hover:text-white hover:border-orange-500/30 transition-all shadow-inner"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
         </div>

         <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="card p-6 border-white/5 hover:border-orange-500/20 transition-all">
            <div className="flex items-center justify-between mb-8">
               <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center shadow-inner`}>
                  <s.icon className="w-6 h-6" />
               </div>
               {s.change && (
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${s.color.includes('emerald') ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-orange-500/10 border border-orange-500/20 text-orange-400'}`}>
                    {s.change}
                  </span>
               )}
            </div>
            <div>
               <p className="text-[10px] font-black text-dim uppercase tracking-widest mb-1">{s.label}</p>
               <h3 className="text-2xl font-black text-white tracking-tight">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sessions List */}
      <div className="card">
         <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-white tracking-tight">Recent Sessions</h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-orange-400 hover:text-orange-300 transition-colors">View All</button>
         </div>

         <div className="space-y-4">
            {recentSessions.length > 0 ? recentSessions.map((session, i) => (
               <div key={i} className={`flex items-center justify-between p-4 rounded-2xl transition-all border border-transparent hover:bg-white/[0.02] hover:border-white/5 group ${i !== recentSessions.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-dark-900 border border-dark-700 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                        <session.icon className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-white mb-0.5">{session.title}</h4>
                        <p className="text-[10px] font-medium text-dim">{session.time}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-black text-white mb-1.5 tracking-tight">{session.duration}</p>
                     <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${session.status === 'SUCCESS' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {session.status}
                     </span>
                  </div>
               </div>
            )) : (
              <div className="text-center py-10">
                <p className="text-dim text-sm">No recent sessions found. Start a timer to begin your deep work!</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
