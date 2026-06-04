import { useState, useEffect } from 'react';
import api from '../api';
import { 
  CheckCircle2, 
  Target, 
  Trophy, 
  Code2, 
  ChevronRight, 
  Zap, 
  Globe, 
  Terminal,
  BarChart3,
  Award,
  Star,
  Activity,
  RefreshCw,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export default function CodingActivity() {
  const [activeTab, setActiveTab] = useState('monthly');
  const [hoveredData, setHoveredData] = useState(null);
  const [stats, setStats] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, recsRes, tracksRes] = await Promise.all([
        api.get('/coding/stats'),
        api.get('/coding/recommendations'),
        api.get('/coding/tracks')
      ]);
      setStats(statsRes.data);
      setRecommendations(recsRes.data);
      setTracks(tracksRes.data);
    } catch (err) {
      console.error("Error fetching coding data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateTrackProgress = async (id, newProgress) => {
    try {
      await api.post('/coding/tracks', { id, progress: newProgress });
      setTracks(tracks.map(t => t.id === id ? { ...t, progress: newProgress } : t));
    } catch (err) {
      console.error("Error updating track:", err);
    }
  };

  const syncStats = async () => {
    setSyncing(true);
    try {
      await api.post('/coding/sync');
      await fetchData();
    } catch (err) {
      console.error("Error syncing stats:", err);
    } finally {
      setSyncing(false);
    }
  };

  const totalSolved = stats.reduce((sum, s) => sum + s.problems_solved, 0);

  const topStats = [
    { label: 'Total Solved', value: totalSolved.toString(), change: 'Current', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Monthly Target', value: totalSolved > 0 ? 'On Track' : '0%', change: 'Current', icon: Target, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Global Rank', value: totalSolved > 0 ? 'Active' : 'N/A', change: 'Current', icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const platforms = [
    { name: 'LeetCode', rank: 'Knight', solved: 542, total: 1000, color: 'bg-amber-500', text: 'text-amber-500', icon: Code2 },
    { name: 'HackerRank', rank: '5 Star', solved: 420, total: 500, color: 'bg-emerald-500', text: 'text-emerald-500', icon: CheckCircle2 },
    { name: 'CodeChef', rank: '3 Star', solved: 286, total: 600, color: 'bg-rose-500', text: 'text-rose-500', icon: Award },
  ];

  const difficultyStats = [
    { label: 'EASY', value: '0', trend: '-', color: 'text-emerald-400' },
    { label: 'MEDIUM', value: '0', trend: '-', color: 'text-orange-400' },
    { label: 'HARD', value: '0', trend: '-', color: 'text-rose-400' },
    { label: 'POINTS', value: '0', unit: 'XP', color: 'text-amber-400' },
  ];

  // Placeholder empty data for chart if no backend history exists yet
  const chartData = [
    { month: 'JAN', leet: 0, hacker: 0, chef: 0 },
    { month: 'FEB', leet: 0, hacker: 0, chef: 0 },
    { month: 'MAR', leet: 0, hacker: 0, chef: 0 },
    { month: 'APR', leet: 0, hacker: 0, chef: 0 },
    { month: 'MAY', leet: 0, hacker: 0, chef: 0 },
    { month: 'JUN', leet: 0, hacker: 0, chef: 0 },
    { month: 'JUL', leet: 0, hacker: 0, chef: 0 },
    { month: 'AUG', leet: 0, hacker: 0, chef: 0 },
    { month: 'SEP', leet: 0, hacker: 0, chef: 0 },
    { month: 'OCT', leet: 0, hacker: 0, chef: 0 },
    { month: 'NOV', leet: 0, hacker: 0, chef: 0 },
    { month: 'DEC', leet: 0, hacker: 0, chef: 0 },
  ];

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">Coding Stats</h1>
          <p className="text-dim font-medium italic">Real-time performance metrics across competitive platforms</p>
        </div>
        <button 
          onClick={syncStats}
          disabled={syncing}
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-orange-600/20"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Accounts'}
        </button>
      </div>

      {/* Top 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topStats.map((stat, i) => (
          <div key={i} className="card p-6 border-orange-500/5 group hover:border-orange-500/20 relative overflow-hidden transition-all duration-300">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center border border-white/5`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/10`}>
                {stat.change}
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-dim uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-white tracking-tighter">{stat.value}</h3>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/[0.01] blur-xl" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 items-start">
        {/* Main Chart Column */}
        <div className="lg:col-span-5 card min-h-[500px] flex flex-col group overflow-hidden border-orange-500/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-orange-600 rounded-full shadow-glow" />
              <h3 className="text-xl font-black text-white tracking-tight">Performance Analytics</h3>
            </div>
            
            <div className="flex p-1.5 bg-dark-900 border border-dark-700/50 rounded-2xl shadow-inner">
              <button 
                onClick={() => setActiveTab('weekly')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'weekly' ? 'bg-orange-600 text-white shadow-lg' : 'text-dim hover:text-white'}`}
              >
                Weekly
              </button>
              <button 
                onClick={() => setActiveTab('monthly')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'monthly' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg' : 'text-dim hover:text-white'}`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] relative mt-4 group/svg">
            {/* Tooltip */}
            {hoveredData && (
              <div 
                className="absolute z-50 pointer-events-none animate-fade-in"
                style={{ 
                  left: `${(hoveredData.index / 11) * 100}%`, 
                  top: `${300 - (hoveredData.value * 2.5) - 60}px`,
                  transform: 'translateX(-50%)' 
                }}
              >
                <div className="bg-[#0d1422]/90 border border-white/10 backdrop-blur-md rounded-lg p-2.5 shadow-2xl min-w-[100px]">
                   <p className="text-[10px] font-black text-dim uppercase tracking-widest mb-1">{hoveredData.month}</p>
                   <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: hoveredData.color }} />
                      <p className="text-xs font-black text-white">{hoveredData.platform}: <span className="text-orange-400">{hoveredData.value}</span></p>
                   </div>
                </div>
              </div>
            )}

            {/* SVG Line Chart */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient-leet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gradient-hacker" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gradient-chef" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                <line key={p} x1="0" y1={300 * p} x2="1000" y2={300 * p} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              ))}

              {/* Data Lines & Areas */}
              {['leet', 'hacker', 'chef'].map((key) => {
                const color = key === 'leet' ? '#f59e0b' : key === 'hacker' ? '#10b981' : '#f43f5e';
                const platformName = key === 'leet' ? 'LeetCode' : key === 'hacker' ? 'HackerRank' : 'CodeChef';
                const points = chartData.map((d, i) => `${(i / 11) * 1000},${300 - (d[key] * 2.5)}`).join(' L ');
                const areaPath = `M 0,300 L ${points} L 1000,300 Z`;
                
                return (
                  <g key={key} className="transition-all duration-500 hover:brightness-125">
                    <path d={areaPath} fill={`url(#gradient-${key})`} />
                    <path d={`M ${points}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-glow" />
                    {chartData.map((d, i) => (
                      <circle 
                        key={i} 
                        cx={(i / 11) * 1000} 
                        cy={300 - (d[key] * 2.5)} 
                        r="4" 
                        fill="#0d1422" 
                        stroke={color} 
                        strokeWidth="2" 
                        onMouseEnter={() => setHoveredData({ index: i, value: d[key], platform: platformName, month: d.month, color })}
                        onMouseLeave={() => setHoveredData(null)}
                        className="cursor-pointer hover:r-7 transition-all duration-200 focus:outline-none" 
                      />
                    ))}
                  </g>
                );
              })}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-6 px-1">
              {chartData.map((data) => (
                <span key={data.month} className="text-[10px] font-black text-dim tracking-tighter opacity-70">
                  {data.month}
                </span>
              ))}
            </div>

            {totalSolved === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-dark-800/80 backdrop-blur-sm z-10 rounded-2xl">
                <p className="text-dim font-medium text-sm">No historical data available yet. Start solving problems!</p>
              </div>
            )}
          </div>
          
          <div className="mt-10 pt-6 border-t border-white/5 flex flex-wrap gap-6 justify-center">
             {[
               { label: 'LeetCode', color: 'bg-amber-500' },
               { label: 'HackerRank', color: 'bg-emerald-500' },
               { label: 'CodeChef', color: 'bg-rose-500' }
             ].map(p => (
               <div key={p.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                  <span className="text-[10px] font-black text-dim uppercase tracking-widest">{p.label}</span>
               </div>
             ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
           {platforms.map((p) => {
             const realStat = stats.find(s => s.platform.toLowerCase() === p.name.toLowerCase());
             const solvedCount = realStat ? realStat.problems_solved : 0;
             const percentage = Math.min(Math.round((solvedCount / p.total) * 100), 100);
             
             return (
               <div key={p.name} className="card p-5 border-orange-500/5 hover:border-orange-500/20 group transition-all duration-300">
                  <div className="flex items-center justify-between mb-5">
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-dark-900 border border-dark-700 flex items-center justify-center ${p.text} group-hover:scale-110 transition-transform`}>
                           <p.icon className="w-5 h-5" />
                        </div>
                        <div>
                           <h4 className="font-black text-white text-sm">{p.name}</h4>
                           <p className="text-[10px] font-bold text-dim uppercase tracking-tight">{realStat ? `${realStat.rating} Rating` : p.rank}</p>
                        </div>
                     </div>
                     <span className="text-[10px] font-bold text-dim uppercase opacity-50">{realStat ? 'Connected' : 'Not Connected'}</span>
                  </div>
                  
                  <div className="space-y-2">
                     <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                        <span className="text-dim opacity-70">{solvedCount} / {p.total} SOLVED</span>
                        <span className={p.text}>{percentage}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-dark-900 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full ${p.color} rounded-full transition-all duration-1000 ease-out shadow-glow`}
                          style={{ width: `${percentage}%` }}
                        />
                     </div>
                  </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* Assigned Tracks Section */}
      <div className="space-y-6 pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
          <h3 className="text-xl font-black text-white tracking-tight uppercase">Assigned Learning Tracks</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {tracks.map((track) => (
            <div key={track.id} className="card p-5 border-purple-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-white text-base">{track.name}</h4>
                  <a href={track.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-1 text-dim hover:text-white transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-tight">{track.platform}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              
              <div className="w-full md:w-1/3 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-dim opacity-70">Completion Progress</span>
                  <span className="text-purple-400">{track.progress}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={track.progress} 
                  onChange={(e) => updateTrackProgress(track.id, e.target.value)}
                  className="w-full h-2 bg-dark-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Syllabus Recommendations Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Syllabus-Targeted Practice</h3>
          </div>

          <div className="flex p-1 bg-dark-900 border border-dark-700/50 rounded-2xl overflow-x-auto no-scrollbar">
            {['ALL', 'AI', 'DBMS', 'DAA', 'PL'].map((sub) => (
              <button 
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedSubject === sub ? 'bg-emerald-600 text-white shadow-lg' : 'text-dim hover:text-white'}`}
              >
                {sub === 'PL' ? 'Prog. Lang' : sub}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations
            .filter(rec => rec.subject !== 'Placement' && (selectedSubject === 'ALL' || rec.subject === selectedSubject))
            .map((rec) => (
            <a 
              key={rec.id} 
              href={rec.problem_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="card p-5 border-emerald-500/5 hover:border-emerald-500/20 group transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-white text-sm group-hover:text-emerald-400 transition-colors">{rec.problem_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-dim uppercase tracking-tight">{rec.subject}</span>
                    <span className="text-white/10 text-[10px]">•</span>
                    <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-tight">{rec.topic}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                  rec.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' : 
                  rec.difficulty === 'Medium' ? 'bg-orange-500/10 text-orange-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {rec.difficulty}
                </span>
                <ExternalLink className="w-4 h-4 text-dim group-hover:text-white transition-colors" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Placement Ready Section */}
      <div className="space-y-6 pt-6 mt-6 border-t border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <h3 className="text-xl font-black text-white tracking-tight uppercase">Placement Ready Questions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations
            .filter(rec => rec.subject === 'Placement')
            .map((rec) => (
            <a 
              key={rec.id} 
              href={rec.problem_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="card p-5 border-blue-500/5 hover:border-blue-500/20 group transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-white text-sm group-hover:text-blue-400 transition-colors">{rec.problem_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-dim uppercase tracking-tight">{rec.platform}</span>
                    <span className="text-white/10 text-[10px]">•</span>
                    <span className="text-[10px] font-bold text-blue-500/80 uppercase tracking-tight">{rec.topic}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                  rec.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' : 
                  rec.difficulty === 'Medium' ? 'bg-orange-500/10 text-orange-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {rec.difficulty}
                </span>
                <ExternalLink className="w-4 h-4 text-dim group-hover:text-white transition-colors" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
