import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  FileText, 
  Clock, 
  CheckCircle2, 
  BrainCircuit,
  Zap,
  Star,
  Search,
  Eye,
  EyeOff,
  Download,
  ChevronDown,
  ChevronUp,
  GraduationCap
} from 'lucide-react';
import api from '../api';
import html2pdf from 'html2pdf.js';

export default function AssessmentDesk() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(1);
  const [questions, setQuestions] = useState(null);
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assessmentMode, setAssessmentMode] = useState('qb'); // 'qb' or 'test'
  const [status, setStatus] = useState('idle'); // idle, generating, list, result
  const [currentAssessmentId, setCurrentAssessmentId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [expandedSolutions, setExpandedSolutions] = useState({});
  const [showAllSolutions, setShowAllSolutions] = useState(false);
  const qbRef = useRef(null);

  // AIML Sem 4 Subjects
  const aimlSubjects = ['PSI', 'DAA', 'AI', 'DBMS', 'UHV', 'DTL'];

  useEffect(() => {
    setSubjects(aimlSubjects);
  }, []);

  const generateQuestions = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    setStatus('generating');
    setExpandedSolutions({});
    setShowAllSolutions(false);
    setAnswers({});
    setEvaluationResult(null);
    setCurrentAssessmentId(null);
    try {
      const response = await api.post('/assessment/generate', {
        subject: selectedSubject,
        unit: selectedUnit,
        branch: 'AIML',
        mode: assessmentMode
      });
      setQuestions(response.data.questions);
      setSubjectInfo(response.data.subject_info);
      setCurrentAssessmentId(response.data.assessment_id);
      setStatus('list');
    } catch (err) {
      console.error(err);
      alert('Failed to generate question bank. Please ensure the backend is running.');
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const submitAssessment = async () => {
    if (!currentAssessmentId) {
      alert('Assessment session error. Please regenerate the test.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.post(`/assessment/submit/${currentAssessmentId}`, {
        answers: Object.entries(answers).map(([id, text]) => ({ question_id: id, text }))
      });
      setEvaluationResult(response.data);
      setStatus('result');
    } catch (err) {
      console.error(err);
      alert('Failed to submit assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSolution = (id) => {
    setExpandedSolutions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllSolutions = () => {
    if (showAllSolutions) {
      setExpandedSolutions({});
    } else {
      const all = {};
      questions.forEach(q => { all[q.id] = true; });
      setExpandedSolutions(all);
    }
    setShowAllSolutions(!showAllSolutions);
  };

  const downloadPDF = () => {
    if (!questions || !subjectInfo) return;

    // Build a clean HTML string for PDF
    const rows = questions.map((q, i) => `
      <tr>
        <td style="border:1px solid #444;padding:8px;text-align:center;font-weight:bold;">${i+1}</td>
        <td style="border:1px solid #444;padding:8px;">${q.text}</td>
        <td style="border:1px solid #444;padding:8px;text-align:center;font-weight:bold;">${q.marks}</td>
        <td style="border:1px solid #444;padding:8px;text-align:center;">${q.co || ''}</td>
        <td style="border:1px solid #444;padding:8px;text-align:center;">${q.blooms || ''}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;padding:20px;color:#000;">
        <div style="text-align:center;margin-bottom:20px;">
          <p style="font-size:11px;margin:0;">Shirpur Education Society's</p>
          <h2 style="font-size:18px;margin:4px 0;">R. C. Patel Institute of Technology, Shirpur</h2>
          <p style="font-size:10px;margin:0;">(An Autonomous Institute)</p>
          <hr style="margin:10px 0;"/>
          <p style="font-size:12px;margin:4px 0;">A.Y. — 2025-26 &nbsp;|&nbsp; Department of AIML &nbsp;|&nbsp; SY B.Tech (SEM — IV)</p>
          <p style="font-size:14px;font-weight:bold;margin:4px 0;">Subject: ${subjectInfo.name} [${subjectInfo.code}]</p>
          <p style="font-size:13px;font-weight:bold;margin:8px 0;">Question Bank — Unit ${selectedUnit}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="border:1px solid #444;padding:8px;width:50px;">Q.No</th>
              <th style="border:1px solid #444;padding:8px;">Questions (Statement)</th>
              <th style="border:1px solid #444;padding:8px;width:50px;">Marks</th>
              <th style="border:1px solid #444;padding:8px;width:40px;">CO</th>
              <th style="border:1px solid #444;padding:8px;width:50px;">Blooms Level</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `QB_${subjectInfo.short}_Unit${selectedUnit}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(container).save().then(() => {
      document.body.removeChild(container);
    });
  };

  // Count 5-mark and 10-mark questions
  const fiveMarkCount = questions ? questions.filter(q => q.marks === 5).length : 0;
  const tenMarkCount = questions ? questions.filter(q => q.marks === 10).length : 0;
  const totalMarks = questions ? questions.reduce((sum, q) => sum + q.marks, 0) : 0;

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center shadow-orange-sm">
            <BrainCircuit className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Question Bank Generator</h1>
            <p className="text-dim mt-1 font-medium italic">Official format question banks powered by Gemini AI</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-dark-800 p-1.5 rounded-xl border border-white/5">
           <div className="px-4 py-2 bg-orange-600 rounded-lg text-xs font-black text-white uppercase tracking-widest shadow-sm">
              SY B.Tech AIML — SEM IV
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Control Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-5 h-5 text-orange-400" />
              <h3 className="font-extrabold text-white text-lg tracking-tight">Configuration</h3>
            </div>

            <div className="flex gap-2 mb-8 p-1 bg-dark-900 rounded-xl border border-white/5">
              <button 
                onClick={() => { setAssessmentMode('qb'); setStatus('idle'); setQuestions(null); }}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${assessmentMode === 'qb' ? 'bg-orange-600 text-white shadow-sm' : 'text-dim hover:text-white'}`}
              >
                Question Bank
              </button>
              <button 
                onClick={() => { setAssessmentMode('test'); setStatus('idle'); setQuestions(null); }}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${assessmentMode === 'test' ? 'bg-orange-600 text-white shadow-sm' : 'text-dim hover:text-white'}`}
              >
                Practice Test
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">Subject</label>
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="input-field appearance-none cursor-pointer"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">Unit Focus</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(u => (
                    <button 
                      key={u}
                      onClick={() => setSelectedUnit(u)}
                      className={`py-3 rounded-xl text-xs font-black transition-all border ${
                        selectedUnit === u 
                          ? 'bg-orange-600 border-orange-500 text-white shadow-orange-sm active:scale-95' 
                          : 'bg-dark-900 border-white/5 text-dim hover:text-white hover:border-white/10'
                      }`}
                    >
                      Unit {u}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={generateQuestions}
                disabled={loading || !selectedSubject}
                className="btn-primary w-full py-4 mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (assessmentMode === 'qb' ? 'Generating Question Bank...' : 'Preparing Practice Test...') : 
                 (assessmentMode === 'qb' ? 'Generate Question Bank' : 'Start Practice Test')}
                <Zap className="w-4 h-4 fill-current transition-all group-hover:scale-110" />
              </button>
            </div>
          </div>

          {/* Stats Card - shown when questions are loaded */}
          {questions && (
            <div className="card bg-orange-600/5 border-orange-600/10 p-6 space-y-4">
               <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-orange-400" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">QB Statistics</h3>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-900/50 rounded-xl p-3 border border-white/5">
                     <p className="text-[10px] font-black text-dim uppercase tracking-widest">Total Qs</p>
                     <p className="text-2xl font-black text-white">{questions.length}</p>
                  </div>
                  <div className="bg-dark-900/50 rounded-xl p-3 border border-white/5">
                     <p className="text-[10px] font-black text-dim uppercase tracking-widest">Total Marks</p>
                     <p className="text-2xl font-black text-white">{totalMarks}</p>
                  </div>
                  <div className="bg-dark-900/50 rounded-xl p-3 border border-white/5">
                     <p className="text-[10px] font-black text-dim uppercase tracking-widest">5-Mark</p>
                     <p className="text-2xl font-black text-emerald-400">{fiveMarkCount}</p>
                  </div>
                  <div className="bg-dark-900/50 rounded-xl p-3 border border-white/5">
                     <p className="text-[10px] font-black text-dim uppercase tracking-widest">10-Mark</p>
                     <p className="text-2xl font-black text-blue-400">{tenMarkCount}</p>
                  </div>
               </div>
               <button
                 onClick={downloadPDF}
                 className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white uppercase tracking-widest transition-all shadow-sm hover:shadow-emerald-500/20 active:scale-95 mt-3"
               >
                 <Download className="w-4 h-4" />
                 Download PDF
               </button>
            </div>
          )}

          {/* Quick Tips - shown when idle */}
          {!questions && (
            <div className="card bg-orange-600/5 border-orange-600/10 p-6 space-y-4">
               <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-orange-400" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">How It Works</h3>
               </div>
               <ul className="space-y-3">
                  {[
                    'Extracts from PYQ papers & question banks',
                    'Cross-verifies against official syllabus',
                    'Adds CO & Blooms Level mapping',
                    'Generates model solutions for each',
                    'Formatted like your college QB'
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-dim font-medium italic">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 mt-0.5" />
                      {tip}
                    </li>
                  ))}
               </ul>
            </div>
          )}
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-2 space-y-8">
           {status === 'idle' && (
             <div className="card h-[400px] flex flex-col items-center justify-center text-center p-10 border-dashed border-white/10 opacity-60">
                <div className="w-20 h-20 rounded-full bg-dark-900 border border-white/5 flex items-center justify-center mb-6">
                   <Search className="w-10 h-10 text-dim" />
                </div>
                <h3 className="text-xl font-black text-white mb-2 italic">No Question Bank Active</h3>
                <p className="text-xs text-dim max-w-xs leading-relaxed">Select a subject and unit to generate your official-format question bank.</p>
             </div>
           )}

           {status === 'generating' && (
             <div className="card h-[400px] flex flex-col items-center justify-center text-center p-10">
                <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin mb-6" />
                <h3 className="text-xl font-black text-white mb-2 animate-pulse">Creating Question Bank...</h3>
                <p className="text-xs text-dim uppercase tracking-widest font-black italic">Extracting & cross-verifying with syllabus</p>
             </div>
           )}

           {questions && subjectInfo && status === 'list' && assessmentMode === 'qb' && (
             <div className="space-y-4 animate-fade-in">
                {/* Official College Header */}
                <div className="card border-orange-500/20 overflow-hidden">
                   <div className="bg-gradient-to-r from-orange-600/10 to-transparent border-b border-white/5 -mx-6 -mt-6 px-6 py-5 mb-6">
                      <div className="text-center space-y-1">
                         <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.25em]">
                            Shirpur Education Society's
                         </p>
                         <h2 className="text-lg font-black text-white uppercase tracking-wide">
                            R. C. Patel Institute of Technology, Shirpur
                         </h2>
                         <p className="text-[10px] font-bold text-dim uppercase tracking-widest">(An Autonomous Institute)</p>
                      </div>
                      <div className="mt-4 text-center space-y-1">
                         <p className="text-xs font-bold text-white/80">
                            A.Y. — 2025-26 &nbsp;|&nbsp; Department of AIML &nbsp;|&nbsp; SY B.Tech (SEM — IV)
                         </p>
                         <p className="text-sm font-black text-white">
                            Subject: {subjectInfo.name} [{subjectInfo.code}]
                         </p>
                         <p className="text-xs font-black text-orange-400 uppercase tracking-widest mt-2">
                            Question Bank — Unit {selectedUnit}
                         </p>
                      </div>
                   </div>

                   {/* Action Buttons */}
                   <div className="flex items-center justify-end mb-4 gap-3">
                      <button
                        onClick={downloadPDF}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white uppercase tracking-widest transition-all shadow-sm hover:shadow-emerald-500/20 active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                      </button>
                      <button
                        onClick={toggleAllSolutions}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-900 border border-white/5 text-xs font-bold text-dim hover:text-white hover:border-white/10 transition-all"
                      >
                        {showAllSolutions ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showAllSolutions ? 'Hide All Solutions' : 'Show All Solutions'}
                      </button>
                   </div>

                   {/* Question Bank Table */}
                   <div className="overflow-x-auto -mx-2">
                      <table className="w-full text-left" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                         <thead>
                            <tr className="bg-dark-900/80">
                               <th className="px-3 py-3 text-[10px] font-black text-orange-400 uppercase tracking-widest border-b border-white/10 w-[50px] text-center">Q.No</th>
                               <th className="px-3 py-3 text-[10px] font-black text-orange-400 uppercase tracking-widest border-b border-white/10">Question (Statement)</th>
                               <th className="px-3 py-3 text-[10px] font-black text-orange-400 uppercase tracking-widest border-b border-white/10 w-[60px] text-center">Marks</th>
                               <th className="px-3 py-3 text-[10px] font-black text-orange-400 uppercase tracking-widest border-b border-white/10 w-[55px] text-center">CO</th>
                               <th className="px-3 py-3 text-[10px] font-black text-orange-400 uppercase tracking-widest border-b border-white/10 w-[60px] text-center">Level</th>
                            </tr>
                         </thead>
                         <tbody>
                            {questions.map((q, i) => (
                               <tr key={q.id} className="group">
                                  <td colSpan={5} className="p-0">
                                     {/* Question Row */}
                                     <div 
                                       className="flex items-stretch cursor-pointer hover:bg-white/[0.02] transition-colors border-b border-white/5"
                                       onClick={() => toggleSolution(q.id)}
                                     >
                                        <div className="px-3 py-4 w-[50px] text-center text-xs font-black text-white/70 shrink-0">{i + 1}</div>
                                        <div className="px-3 py-4 flex-1 min-w-0">
                                           <p className="text-xs font-semibold text-white/90 leading-relaxed whitespace-pre-wrap">{q.text}</p>
                                           {/* Inline solution toggle hint */}
                                           <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              {expandedSolutions[q.id] 
                                                ? <ChevronUp className="w-3 h-3 text-emerald-400" /> 
                                                : <ChevronDown className="w-3 h-3 text-emerald-400" />
                                              }
                                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                                                 {expandedSolutions[q.id] ? 'Hide' : 'View'} Model Solution
                                              </span>
                                           </div>
                                        </div>
                                        <div className="px-3 py-4 w-[60px] text-center shrink-0">
                                           <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${
                                             q.marks >= 10 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                           }`}>
                                              {q.marks}
                                           </span>
                                        </div>
                                        <div className="px-3 py-4 w-[55px] text-center text-[10px] font-black text-white/60 uppercase shrink-0">{q.co}</div>
                                        <div className="px-3 py-4 w-[60px] text-center shrink-0">
                                           <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                              {q.blooms}
                                           </span>
                                        </div>
                                     </div>
                                     {/* Model Solution Accordion */}
                                     {expandedSolutions[q.id] && q.model_solution && (
                                        <div className="mx-3 mb-4 mt-1 p-4 rounded-xl bg-emerald-600/5 border border-emerald-600/20 animate-fade-in">
                                           <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 block">
                                              Model Solution — Q{i + 1} ({q.marks} Marks)
                                           </label>
                                           <p className="text-xs text-emerald-300/90 leading-relaxed whitespace-pre-wrap">{q.model_solution}</p>
                                        </div>
                                     )}
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>

                   {/* Footer */}
                   <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                      <p className="text-[10px] text-dim italic">
                         Generated via AI Assessment Engine — Cross-verified against official syllabus
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-black text-dim uppercase tracking-widest">
                         <Clock className="w-3 h-3" />
                         {questions.length} Questions • {totalMarks} Marks
                      </div>
                   </div>
                </div>
             </div>
           )}

           {questions && status === 'list' && assessmentMode === 'test' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Practice Test Session</h3>
                  </div>
                  <button 
                    onClick={submitAssessment}
                    disabled={submitting}
                    className="btn-primary px-8 py-3 flex items-center gap-2"
                  >
                    {submitting ? 'Submitting...' : 'Submit Test'}
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-6">
                  {questions.map((q, i) => (
                    <div key={q.id} className="card p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Question {i+1} • {q.marks} Marks</span>
                      </div>
                      <p className="text-sm font-black text-white leading-relaxed">{q.text}</p>
                      <textarea 
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="input-field min-h-[150px] py-4 text-sm font-medium leading-relaxed"
                        placeholder="Write your answer here..."
                      />
                    </div>
                  ))}
                </div>
              </div>
           )}

           {status === 'result' && evaluationResult && (
              <div className="space-y-6 animate-slide-up">
                <div className="card p-8 bg-emerald-600/5 border-emerald-500/20 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase">Assessment Completed!</h2>
                  <div className="flex items-center justify-center gap-10 py-6">
                    <div>
                      <p className="text-xs font-black text-dim uppercase tracking-widest mb-1">Your Score</p>
                      <p className="text-5xl font-black text-emerald-400">{evaluationResult.total_score}</p>
                    </div>
                    <div className="w-px h-12 bg-white/10" />
                    <div>
                      <p className="text-xs font-black text-dim uppercase tracking-widest mb-1">Max Score</p>
                      <p className="text-5xl font-black text-white">{evaluationResult.max_score}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setStatus('idle'); setQuestions(null); }}
                    className="btn-primary px-10"
                  >
                    Take Another Test
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest ml-1">Detailed Feedback</h3>
                  {evaluationResult.results.map((r, i) => (
                    <div key={i} className="card p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Question {i+1}</span>
                        <span className="text-sm font-black text-emerald-400">Score: {r.score}</span>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs text-dim font-bold">Your Answer: <span className="text-white">{r.student_answer}</span></p>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">AI Feedback</p>
                          <p className="text-xs text-dim italic">{r.feedback}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Model Solution</p>
                          <p className="text-xs text-dim italic">{r.model_solution}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           )}

        </div>
      </div>
    </div>
  );
}
