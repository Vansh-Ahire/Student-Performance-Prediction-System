import { useState, useEffect } from 'react';
import api from '../api';
import { 
  BarChart3, 
  Target, 
  Zap, 
  TrendingUp, 
  Gauge, 
  Lightbulb, 
  ChevronRight,
  Info,
  Trophy,
  History,
  Calculator,
  BookOpen,
  FileText,
  Brain,
  Mic,
  Sparkles,
  Code
} from 'lucide-react';

export default function CGPATarget() {
  const [loading, setLoading] = useState(true);
  const [totalSemesters, setTotalSemesters] = useState(8);
  const [semestersCompleted, setSemestersCompleted] = useState(0);
  const [semGPAs, setSemGPAs] = useState(Array(8).fill(''));
  const [targetCGPA, setTargetCGPA] = useState('8.50');
  const [syncing, setSyncing] = useState(false);
  
  useEffect(() => {
    // Fetch initial data from MongoDB via profile endpoint
    api.get('/profile').then(res => {
      const data = res.data;
      if (data.totalSemesters) setTotalSemesters(data.totalSemesters);
      if (data.semestersCompleted !== undefined) setSemestersCompleted(data.semestersCompleted);
      if (data.semGPAs && data.semGPAs.length > 0) {
          const gpas = Array(data.totalSemesters || 8).fill('');
          data.semGPAs.forEach((val, idx) => { if(idx < gpas.length) gpas[idx] = val; });
          setSemGPAs(gpas);
      }
      if (data.cgpaTarget) setTargetCGPA(data.cgpaTarget);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load CGPA profile", err);
      setLoading(false);
    });
  }, []);
  

  
  const [result, setResult] = useState({
    requiredSGPA: '0.00',
    currentCGPA: '0.00',
    gap: '0.00',
    successRate: 'N/A',
    efficiency: '0%',
    effort: 'N/A',
    endSem: 0,
    termTest: 0,
    aptitude: 0,
    ta1: 0,
    ta2: 0,
    ta3: 0,
    ta4: 0,
    totalRequired: 0
  });

  const handleSemCompletedChange = (val) => {
    const num = Math.min(Math.max(parseInt(val) || 0, 0), totalSemesters - 1);
    setSemestersCompleted(num);
  };

  const handleGPAChange = (index, val) => {
    const newGPAs = [...semGPAs];
    newGPAs[index] = val;
    setSemGPAs(newGPAs);
  };

  const calculatePath = () => {
    const target = parseFloat(targetCGPA);
    if (isNaN(target)) return;

    let pointsEarned = 0;
    let completedCount = 0;
    
    for (let i = 0; i < semestersCompleted; i++) {
      const gpa = parseFloat(semGPAs[i]) || 0;
      pointsEarned += gpa;
      if (gpa > 0) completedCount++;
    }

    const currentCGPA = semestersCompleted > 0 ? (pointsEarned / semestersCompleted).toFixed(2) : '0.00';
    const totalPointsNeeded = target * totalSemesters;
    const remainingPointsNeeded = totalPointsNeeded - pointsEarned;
    const remainingSemesters = totalSemesters - semestersCompleted;
    
    const requiredSGPA = remainingSemesters > 0 ? remainingPointsNeeded / remainingSemesters : 0;
    const gap = (target - parseFloat(currentCGPA)).toFixed(2);

    // CA Policy: End-Sem(60) + Term Test(15) + Aptitude(5) + TA1(5) + TA2(5) + TA3(5) + TA4(5) = 100
    const reqPercent = Math.min(requiredSGPA * 10, 100);
    const endSem = Math.min(Math.round(reqPercent * 0.60), 60);
    const termTest = Math.min(Math.round(reqPercent * 0.15), 15);
    const aptitude = Math.min(Math.round(reqPercent * 0.05), 5);
    const ta1 = Math.min(Math.round(reqPercent * 0.05), 5);
    const ta2 = Math.min(Math.round(reqPercent * 0.05), 5);
    const ta3 = Math.min(Math.round(reqPercent * 0.05), 5);
    const ta4 = Math.min(Math.round(reqPercent * 0.05), 5);

    setResult({
      requiredSGPA: requiredSGPA.toFixed(2),
      currentCGPA: currentCGPA,
      gap: gap >= 0 ? `+${gap}` : gap,
      successRate: requiredSGPA <= 8.0 ? 'Very High' : requiredSGPA <= 9.0 ? 'High' : requiredSGPA <= 9.8 ? 'Challenging' : 'Near Impossible',
      efficiency: semestersCompleted > 0 ? `+${((requiredSGPA / (parseFloat(currentCGPA) || 1) - 1) * 100).toFixed(0)}%` : '0%',
      effort: requiredSGPA <= 7.5 ? 'Moderate' : requiredSGPA <= 8.8 ? 'Consistent' : 'Advanced Intensity',
      endSem, termTest, aptitude, ta1, ta2, ta3, ta4,
      totalRequired: endSem + termTest + aptitude + ta1 + ta2 + ta3 + ta4
    });
  };

  useEffect(() => {
    if (loading) return;
    calculatePath();
    
    // Auto-save to MongoDB
    const saveTimer = setTimeout(() => {
      setSyncing(true);
      api.post('/profile', {
        totalSemesters,
        semestersCompleted,
        semGPAs,
        cgpaTarget: targetCGPA
      }).then(() => setSyncing(false))
        .catch(err => {
            console.error("Failed to sync", err);
            setSyncing(false);
        });
    }, 1000); // 1s debounce
    
    return () => clearTimeout(saveTimer);
  }, [totalSemesters, semestersCompleted, semGPAs, targetCGPA, loading]);

  if (loading) return <div className="flex justify-center items-center h-64 text-orange-500">Loading Academic Data...</div>;

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-orange-sm">
          <Trophy className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase flex items-center gap-3">
            Academic Strategizer
            {syncing && <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />}
          </h1>
          <p className="text-dim mt-1 font-medium italic">Map your path to the target CGPA with precision. (Cloud Synced)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Configuration Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Calculator className="w-5 h-5 text-orange-400" />
                <h3 className="font-extrabold text-white text-lg lowercase tracking-tight">Strategy Parameters</h3>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-dim uppercase tracking-widest">Total Sems:</span>
                 <select 
                   value={totalSemesters} 
                   onChange={(e) => setTotalSemesters(parseInt(e.target.value))}
                   className="bg-dark-900 border border-dark-600 rounded-lg text-white text-xs p-1 outline-none"
                 >
                    {[4, 6, 8, 10].map(v => <option key={v} value={v}>{v}</option>)}
                 </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">Semesters Completed</label>
                  <div className="relative flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" 
                      max={totalSemesters - 1} 
                      value={semestersCompleted}
                      onChange={(e) => handleSemCompletedChange(e.target.value)}
                      className="flex-1 accent-orange-500"
                    />
                    <span className="w-12 h-12 rounded-xl bg-dark-900 border border-dark-600 flex items-center justify-center text-xl font-black text-white">
                      {semestersCompleted}
                    </span>
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">Goal CGPA</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      value={targetCGPA}
                      onChange={(e) => setTargetCGPA(e.target.value)}
                      className="input-field text-2xl font-black h-16 border-orange-500/20 focus:border-orange-500/50"
                    />
                    <Target className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-orange-500 opacity-50" />
                  </div>
               </div>
            </div>

            {/* Dynamic GPA Inputs */}
            {semestersCompleted > 0 && (
              <div className="mt-12 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <History className="w-4 h-4 text-dim" />
                  <h4 className="text-xs font-black text-dim uppercase tracking-[0.2em]">Previous Performance</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: semestersCompleted }).map((_, i) => (
                    <div key={i} className="space-y-2">
                       <p className="text-[9px] font-black text-dim uppercase tracking-widest text-center">Sem {i + 1} gpa</p>
                       <input 
                         type="number"
                         step="0.01"
                         value={semGPAs[i]}
                         onChange={(e) => handleGPAChange(i, e.target.value)}
                         placeholder="0.00"
                         className="bg-dark-900 border border-white/5 rounded-xl w-full p-3 text-center text-white font-bold focus:border-orange-500/40 outline-none transition-all"
                       />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px bg-white/5 w-full my-10" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-white">Cumulative Standing</p>
                    <p className="text-[10px] text-dim font-medium">Currently at {result.currentCGPA} CGPA</p>
                 </div>
              </div>
              <button 
                onClick={calculatePath}
                className="btn-primary px-12 py-4 shadow-orange-md text-xs font-black uppercase tracking-[0.25em] flex items-center gap-3 group"
              >
                Trace Path
                <Zap className="w-4 h-4 group-hover:fill-current transition-all" />
              </button>
            </div>
          </div>

          {/* Effort & Efficiency Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="card p-6 flex items-center gap-6 border-white/5 group hover:border-orange-500/20 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-dark-900 border border-white/5 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                   <Gauge className="w-7 h-7" />
                </div>
                <div>
                   <p className="text-[10px] uppercase font-black tracking-widest text-dim mb-1">Effort Intensity</p>
                   <p className="text-xl font-black text-white">{result.effort}</p>
                </div>
             </div>

             <div className="card p-6 flex items-center gap-6 border-white/5 group hover:border-emerald-500/20 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-dark-900 border border-white/5 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <div>
                   <p className="text-[10px] uppercase font-black tracking-widest text-dim mb-1">Growth Required</p>
                   <p className="text-xl font-black text-white">{result.efficiency} <span className="text-xs opacity-50 font-normal tracking-normal lowercase">improvement</span></p>
                </div>
             </div>
          </div>

          {/* CA Score Breakdown Card */}
          {parseFloat(result.requiredSGPA) > 0 && parseFloat(result.requiredSGPA) <= 10 && (
            <div className="card p-6 space-y-6 animate-fade-in border-orange-500/10">
              <div className="flex items-center gap-3 flex-wrap">
                <FileText className="w-5 h-5 text-orange-400" />
                <h3 className="font-extrabold text-white text-lg lowercase tracking-tight">CA Score Breakdown</h3>
                <span className="ml-auto text-[9px] font-black text-dim uppercase tracking-widest bg-dark-900 border border-dark-600 px-2 py-1 rounded-full">RCPIT CA Policy</span>
              </div>
              <p className="text-[10px] text-dim font-medium italic -mt-3">Minimum marks per component per subject to achieve your target SGPA.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* End Sem - Hero Card */}
                <div className="bg-gradient-to-r from-orange-600/10 to-transparent border border-orange-500/20 rounded-2xl p-5 flex items-center gap-6 h-full">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/15 flex items-center justify-center shrink-0">
                    <BookOpen className="w-7 h-7 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-dim">End Semester Exam</p>
                    <p className="text-3xl font-black text-white mt-1">{result.endSem}<span className="text-sm text-dim font-bold">/60</span></p>
                    <div className="w-full bg-dark-700 rounded-full h-2 mt-2"><div className="bg-orange-500 h-2 rounded-full transition-all duration-700" style={{width: `${(result.endSem/60)*100}%`}} /></div>
                  </div>
                </div>

                {/* Internal Components */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-dim mb-3 flex items-center gap-2"><span className="w-8 h-px bg-white/10"/> Internal CA Components <span className="flex-1 h-px bg-white/10"/></p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-dark-900 border border-white/5 rounded-xl p-4 group hover:border-cyan-500/20 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-dim">Term Test</p>
                      </div>
                      <p className="text-2xl font-black text-white">{result.termTest}<span className="text-xs text-dim font-bold">/15</span></p>
                      <div className="w-full bg-dark-700 rounded-full h-1 mt-2"><div className="bg-cyan-500 h-1 rounded-full transition-all duration-700" style={{width: `${(result.termTest/15)*100}%`}} /></div>
                    </div>
                    <div className="bg-dark-900 border border-white/5 rounded-xl p-4 group hover:border-violet-500/20 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-violet-400" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-dim">Aptitude Test</p>
                      </div>
                      <p className="text-2xl font-black text-white">{result.aptitude}<span className="text-xs text-dim font-bold">/5</span></p>
                      <div className="w-full bg-dark-700 rounded-full h-1 mt-2"><div className="bg-violet-500 h-1 rounded-full transition-all duration-700" style={{width: `${(result.aptitude/5)*100}%`}} /></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TA Components */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-dim mb-3 flex items-center gap-2"><span className="w-8 h-px bg-white/10"/> Teacher Assessment (20M) <span className="flex-1 h-px bg-white/10"/></p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-dark-900 border border-white/5 rounded-xl p-3 text-center group hover:border-emerald-500/20 transition-all">
                    <Target className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-dim">TA1</p>
                    <p className="text-[8px] text-dim/60 mt-0.5">Pres/GD/V-Lab</p>
                    <p className="text-xl font-black text-white mt-1">{result.ta1}<span className="text-[10px] text-dim font-bold">/5</span></p>
                  </div>
                  <div className="bg-dark-900 border border-white/5 rounded-xl p-3 text-center group hover:border-pink-500/20 transition-all">
                    <Mic className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-dim">TA2</p>
                    <p className="text-[8px] text-dim/60 mt-0.5">Mock Interview</p>
                    <p className="text-xl font-black text-white mt-1">{result.ta2}<span className="text-[10px] text-dim font-bold">/5</span></p>
                  </div>
                  <div className="bg-dark-900 border border-white/5 rounded-xl p-3 text-center group hover:border-amber-500/20 transition-all">
                    <Sparkles className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-dim">TA3</p>
                    <p className="text-[8px] text-dim/60 mt-0.5">Innovative</p>
                    <p className="text-xl font-black text-white mt-1">{result.ta3}<span className="text-[10px] text-dim font-bold">/5</span></p>
                  </div>
                  <div className="bg-dark-900 border border-white/5 rounded-xl p-3 text-center group hover:border-sky-500/20 transition-all">
                    <Code className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-dim">TA4</p>
                    <p className="text-[8px] text-dim/60 mt-0.5">Coding/Skill</p>
                    <p className="text-xl font-black text-white mt-1">{result.ta4}<span className="text-[10px] text-dim font-bold">/5</span></p>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-orange-600/5 border border-orange-600/10 rounded-xl p-4 mt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-dim">Total Required Per Subject</span>
                <span className="text-lg font-black text-orange-400">{result.totalRequired}<span className="text-xs text-dim font-bold">/100</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
           {/* Results Card */}
           <div className="card flex flex-col items-center p-8 bg-gradient-to-b from-dark-800 to-dark-900">
              <div className="w-full mb-8 text-center">
                 <h3 className="text-lg font-black text-white tracking-widest uppercase">Target Vector</h3>
                 <p className="text-[10px] font-bold text-dim uppercase tracking-widest mt-1">Required Academic Average</p>
              </div>

              {/* Custom Gauge SVG */}
              <div className="relative w-48 h-48 mb-10">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="82" stroke="rgba(255,255,255,0.03)" strokeWidth="12" fill="transparent" />
                    <circle cx="96" cy="96" r="82" stroke="#f97316" strokeWidth="12" fill="transparent" 
                      strokeDasharray="515.2" strokeDashoffset={515.2 - (Math.min(parseFloat(result.requiredSGPA) / 10, 1) * 515.2)} 
                      strokeLinecap="round" className="transition-all duration-1000 ease-out drop-shadow-glow" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-black leading-none ${parseFloat(result.requiredSGPA) > 10 ? 'text-red-500' : 'text-white'}`}>
                      {result.requiredSGPA}
                    </span>
                    <span className="text-[9px] font-black text-dim uppercase tracking-widest mt-4">Required SGPA</span>
                 </div>
              </div>

              <div className="w-full space-y-4 pt-6 mt-2 border-t border-white/5">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-dim">Active Sems Left</span>
                    <span className="text-sm font-black text-white">{totalSemesters - semestersCompleted}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-dim">Gap to Bridge</span>
                    <span className={`text-sm font-black ${parseFloat(result.gap) >= 0 ? 'text-orange-400' : 'text-emerald-400'}`}>{result.gap}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-dim">Feasibility</span>
                    <span className={`text-xs font-black uppercase tracking-widest ${result.successRate === 'Near Impossible' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {result.successRate}
                    </span>
                 </div>
              </div>
              
              {parseFloat(result.requiredSGPA) > 10 && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                   <Info className="w-4 h-4 text-red-500 shrink-0" />
                   <p className="text-[10px] font-bold text-red-400 leading-relaxed uppercase">The target is mathematically impossible for the remaining sems.</p>
                </div>
              )}
           </div>

           {/* Smart Insight Card */}
           <div className="card bg-orange-600/5 border-orange-600/10 p-6 space-y-4">
              <div className="flex items-center gap-3">
                 <Lightbulb className="w-5 h-5 text-orange-400" />
                 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Strategizer Insight</h3>
              </div>
              <p className="text-xs text-dim leading-relaxed font-medium italic">
                {parseFloat(result.requiredSGPA) > 9.5 
                  ? "This goal requires peak performance. Prioritize internal assessments and heavy-credit projects to gain small but critical point boosts."
                  : "You're in a manageable zone. Consistent scores above 8.5 will maintain your trajectory toward the goal."}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
