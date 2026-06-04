import { useState, useEffect } from 'react';
import api from '../api';
import { Target, Loader2, TrendingDown, TrendingUp, AlertTriangle, ChevronDown, Sparkles } from 'lucide-react';

export default function WeakAreas() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [plans, setPlans] = useState({}); // { subject: plan_text }
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    api.get('/weak-areas').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fetchRecoveryPlan = async (subject, units) => {
    setLoadingPlan(subject);
    try {
      const r = await api.post('/weak-areas/recovery-plan', { subject, units });
      setPlans(prev => ({ ...prev, [subject]: r.data.plan }));
    } catch (e) { console.error(e); }
    finally { setLoadingPlan(null); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      <p className="text-dim font-black uppercase tracking-widest text-[10px]">Analyzing performance...</p>
    </div>
  );

  const statusConfig = {
    weak: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', bar: 'bg-red-500', label: 'Weak' },
    moderate: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', bar: 'bg-amber-500', label: 'Moderate' },
    strong: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'bg-emerald-500', label: 'Strong' },
  };

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-orange-sm">
          <Target className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Weak Area Detection</h1>
          <p className="text-dim mt-1 font-medium italic">Topic-wise performance analysis from your assessments.</p>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="space-y-4">
          {data.map((subject, i) => {
            const cfg = statusConfig[subject.overall_status] || statusConfig.moderate;
            const isOpen = expanded === i;
            return (
              <div key={i} className="card overflow-hidden">
                <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpanded(isOpen ? null : i)}>
                  <div className={`w-12 h-12 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                    {subject.overall_status === 'weak' ? <TrendingDown className={`w-6 h-6 ${cfg.color}`} /> :
                     subject.overall_status === 'strong' ? <TrendingUp className={`w-6 h-6 ${cfg.color}`} /> :
                     <AlertTriangle className={`w-6 h-6 ${cfg.color}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-white">{subject.subject_name}</h3>
                    <p className="text-[10px] font-black text-dim uppercase tracking-widest">{subject.subject}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-2xl font-black ${cfg.color}`}>{subject.overall_percentage}%</p>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-dim transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-4 animate-fade-in space-y-6">
                    {/* Units Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {subject.units.map((unit, j) => {
                        const ucfg = statusConfig[unit.status] || statusConfig.moderate;
                        return (
                          <div key={j} className={`${ucfg.bg} border ${ucfg.border} rounded-xl p-4`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black text-white">{unit.unit}</span>
                              <span className={`text-xs font-black ${ucfg.color}`}>{unit.percentage}%</span>
                            </div>
                            <div className="w-full bg-dark-700 rounded-full h-1.5">
                              <div className={`${ucfg.bar} h-1.5 rounded-full transition-all duration-700`} style={{width: `${unit.percentage}%`}} />
                            </div>
                            <div className="flex justify-between mt-2">
                              <span className="text-[9px] text-dim font-bold">{unit.score}/{unit.max_score} marks</span>
                              <span className="text-[9px] text-dim font-bold">{unit.attempts} attempt(s)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* AI Recovery Plan */}
                    <div className="bg-orange-600/5 border border-orange-600/10 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-orange-400" />
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">AI Recovery Plan</h4>
                        </div>
                        {!plans[subject.subject] && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); fetchRecoveryPlan(subject.subject, subject.units); }}
                            disabled={loadingPlan === subject.subject}
                            className="text-[10px] font-black text-orange-400 uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50"
                          >
                            {loadingPlan === subject.subject ? 'Analyzing...' : 'Generate Plan'}
                          </button>
                        )}
                      </div>
                      
                      {plans[subject.subject] ? (
                        <div className="text-xs text-dim leading-relaxed whitespace-pre-wrap font-medium">
                          {plans[subject.subject]}
                        </div>
                      ) : (
                        <p className="text-xs text-dim/60 italic font-medium">
                          {loadingPlan === subject.subject ? 'AI is analyzing your performance patterns...' : 'Click "Generate Plan" for a personalized study strategy to improve your weak areas.'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-16 text-center flex flex-col items-center gap-4 border-dashed border-white/10">
          <Target className="w-12 h-12 text-dim opacity-30" />
          <h3 className="text-lg font-black text-white/50 lowercase">No assessment data yet</h3>
          <p className="text-xs text-dim italic">Complete assessments in the Assessment Lab to see your weak areas.</p>
        </div>
      )}
    </div>
  );
}
