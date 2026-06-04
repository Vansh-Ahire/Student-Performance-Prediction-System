import { useState, useEffect } from 'react';
import { 
  History, 
  ChevronRight, 
  Award, 
  MessageSquareText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  FileText,
  Download,
  Search,
  BookMarked
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../api';

export default function AssessmentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await api.get('/assessment/results');
      setResults(response.data);
      if (response.data.length > 0) {
        setSelectedResult(response.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch results', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center shadow-orange-sm">
          <History className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Performance Board</h1>
          <p className="text-dim mt-1 font-medium italic">Strict evaluation & detailed mentor feedback history.</p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="card h-[400px] flex flex-col items-center justify-center text-center p-10 border-dashed border-white/10">
          <div className="w-20 h-20 rounded-full bg-dark-900 border border-white/5 flex items-center justify-center mb-6">
            <BookMarked className="w-10 h-10 text-dim" />
          </div>
          <h3 className="text-xl font-black text-white mb-2 italic">No Assessments Found</h3>
          <p className="text-xs text-dim max-w-xs leading-relaxed">You haven't submitted any handwritten scripts yet. Head over to the Assessment Lab to start!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-250px)]">
          {/* Submissions List */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2 scrollbar-dark">
            <h3 className="text-[10px] font-black text-dim uppercase tracking-[0.3em] px-2 mb-4">Past Submissions</h3>
            {results.map((res) => (
              <button
                key={res.id}
                onClick={() => setSelectedResult(res)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-3 group ${
                  selectedResult?.id === res.id 
                    ? 'bg-orange-600/10 border-orange-500/50 shadow-orange-sm shadow-inner' 
                    : 'bg-dark-800 border-white/5 hover:border-white/10 hover:bg-dark-700'
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-orange-400 uppercase tracking-widest">{res.subject}</span>
                    <span className="text-sm font-bold text-white mt-1">Unit {res.unit} Assessment</span>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                    res.status === 'evaluated' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                  }`}>
                    {res.status}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-dim group-hover:text-white transition-colors uppercase">
                      <Clock className="w-3 h-3" />
                      {res.date}
                   </div>
                   <div className="text-sm font-black text-white">
                      {res.status === 'evaluated' ? `${res.score}/${res.max_score}` : '--'}
                   </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detailed Report View */}
          <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
             {selectedResult ? (
               <div className="card flex-1 flex flex-col overflow-hidden border-orange-500/20">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-dark-900 border border-white/5 flex items-center justify-center">
                           <Award className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                           <h2 className="text-xl font-black text-white uppercase tracking-tight">{selectedResult.subject} Evaluation Report</h2>
                           <p className="text-[10px] font-black text-dim uppercase tracking-[0.2em] mt-1 italic">Submission ID: {selectedResult.id.slice(-8)}</p>
                        </div>
                     </div>
                     <div className="text-center">
                        <div className="text-3xl font-black text-white leading-none tracking-tighter">
                           {selectedResult.score}<span className="text-lg text-dim">/{selectedResult.max_score}</span>
                        </div>
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mt-2">Final Score</p>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-4 scrollbar-dark space-y-8">
                     {/* Feedback Section */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <MessageSquareText className="w-5 h-5 text-orange-400" />
                           <h3 className="text-xs font-black text-white uppercase tracking-widest">AI Evaluator Analysis</h3>
                        </div>
                        
                        <div className="bg-dark-900/50 rounded-2xl p-6 border border-white/5 prose prose-invert prose-orange max-w-none prose-sm leading-relaxed font-medium italic">
                           <ReactMarkdown>
                              {selectedResult.feedback || "Processing assessment metadata. Please wait..."}
                           </ReactMarkdown>
                        </div>
                     </div>

                     {/* Action Cards */}
                     <div className="grid grid-cols-2 gap-4 pb-4">
                        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col gap-3">
                           <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Strong Points</span>
                           </div>
                           <p className="text-xs text-white font-medium italic">Technical definitions are precise and follow the Synoptic Answer Key requirements.</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex flex-col gap-3">
                           <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-orange-400" />
                              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Critical Gaps</span>
                           </div>
                           <p className="text-xs text-white font-medium italic">Cardinality constraints (1:M, M:M) must be explicitly mentioned in ER diagrams for full credit.</p>
                        </div>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="card h-full flex flex-col items-center justify-center text-center p-10 border-dashed border-white/10 opacity-30">
                  <Search className="w-10 h-10 text-dim mb-4" />
                  <p className="text-xs text-dim font-black uppercase tracking-widest">Select a submission to view report</p>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
