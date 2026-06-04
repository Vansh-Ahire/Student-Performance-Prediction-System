import { useState, useEffect } from 'react';
import api from '../api';
import { CalendarDays, Zap, Clock, Loader2, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';

export default function StudyPlanner() {
  const [plan, setPlan] = useState({ blocks: [], ai_generated: false });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get('/study-plan').then(r => setPlan(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const r = await api.post('/study-plan/generate');
      setPlan(r.data);
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      <p className="text-dim font-black uppercase tracking-widest text-[10px]">Loading plan...</p>
    </div>
  );

  const priorityColors = {
    high: { border: 'border-l-red-500', bg: 'bg-red-500/5', badge: 'bg-red-500/20 text-red-400' },
    normal: { border: 'border-l-cyan-500', bg: 'bg-cyan-500/5', badge: 'bg-cyan-500/20 text-cyan-400' },
  };

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-orange-sm">
            <CalendarDays className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Study Planner</h1>
            <p className="text-dim mt-1 font-medium italic">Auto-generated daily schedule based on your weak areas.</p>
          </div>
        </div>
        <button onClick={generatePlan} disabled={generating}
          className="btn-primary px-8 py-3 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 group disabled:opacity-50">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 group-hover:fill-current" />}
          {generating ? 'Generating...' : 'Generate Plan'}
        </button>
      </div>

      {plan.ai_generated && (
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-600/10 border border-orange-600/20 rounded-xl w-fit">
          <Zap className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">AI-Generated Plan</span>
        </div>
      )}

      {plan.blocks.length > 0 ? (
        <div className="space-y-4">
          {plan.blocks.map((block, i) => {
            const colors = priorityColors[block.priority] || priorityColors.normal;
            return (
              <div key={i} className={`card p-5 border-l-4 ${colors.border} ${colors.bg} flex flex-col md:flex-row md:items-center gap-4`}>
                <div className="flex items-center gap-4 shrink-0">
                  <Clock className="w-5 h-5 text-dim" />
                  <span className="text-sm font-black text-white whitespace-nowrap">{block.time_start} - {block.time_end}</span>
                </div>
                <div className="h-8 w-px bg-white/10 hidden md:block" />
                <div className="flex-1">
                  <h4 className="text-lg font-black text-white">{block.subject}</h4>
                  <p className="text-xs text-dim font-medium mt-1">{block.notes}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${colors.badge} self-start md:self-center`}>
                  {block.priority}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-16 text-center flex flex-col items-center gap-4 border-dashed border-white/10">
          <CalendarDays className="w-12 h-12 text-dim opacity-30" />
          <h3 className="text-lg font-black text-white/50 lowercase">No study plan for today</h3>
          <p className="text-xs text-dim italic">Click "Generate Plan" to create an AI-powered schedule.</p>
        </div>
      )}
    </div>
  );
}
