import { useState, useEffect } from 'react';
import api from '../api';
import { FileText, Upload, Search, Loader2, Trash2, Sparkles, X, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function NotesHub() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [summarizing, setSummarizing] = useState(null);
  const [form, setForm] = useState({ title: '', subject: '', unit: '', file: null });

  const fetchNotes = () => {
    api.get(`/notes?search=${search}`).then(r => setNotes(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotes(); }, [search]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('subject', form.subject);
    fd.append('unit', form.unit);
    fd.append('file', form.file);
    try {
      await api.post('/notes/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ title: '', subject: '', unit: '', file: null });
      setShowUpload(false);
      fetchNotes();
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  };

  const deleteNote = async (id) => {
    try { await api.delete(`/notes/${id}`); setNotes(prev => prev.filter(n => n.id !== id)); } catch (e) { console.error(e); }
  };

  const summarizeNote = async (id) => {
    setSummarizing(id);
    try {
      const r = await api.post(`/notes/${id}/summarize`);
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ai_summary: r.data.summary } : n));
    } catch (e) { console.error(e); }
    finally { setSummarizing(null); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      <p className="text-dim font-black uppercase tracking-widest text-[10px]">Loading notes...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-orange-sm">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Notes Hub</h1>
            <p className="text-dim mt-1 font-medium italic">Upload, organize, and AI-summarize your study notes.</p>
          </div>
        </div>
        <button onClick={() => setShowUpload(!showUpload)}
          className="btn-primary px-6 py-3 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
          <Upload className="w-4 h-4" /> Upload Note
        </button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="card p-6 space-y-4 border-orange-500/20 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white text-sm uppercase tracking-widest">Upload New Note</h3>
            <button onClick={() => setShowUpload(false)} className="text-dim hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Note Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="input-field" required />
            <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
              className="input-field">
              <option value="">Select Subject</option>
              {['PSI','DAA','AI','DBMS','UHV','DTL','CSR'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="number" placeholder="Unit (optional)" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
              className="input-field" min="1" max="6" />
            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg" onChange={e => setForm({...form, file: e.target.files[0]})}
              className="input-field file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-600 file:text-white" required />
            <button type="submit" disabled={uploading}
              className="btn-primary py-3 text-xs font-black uppercase tracking-widest md:col-span-2 disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
        <input type="text" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-11" />
      </div>

      {/* Notes Grid */}
      {notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => (
            <div key={note.id} className="card p-5 space-y-3 group hover:border-orange-500/20 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-black text-white text-sm">{note.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {note.subject && <span className="text-[9px] font-black bg-orange-600/10 text-orange-400 px-2 py-0.5 rounded">{note.subject}</span>}
                    {note.unit && <span className="text-[9px] font-black bg-dark-900 text-dim px-2 py-0.5 rounded border border-dark-600">Unit {note.unit}</span>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={`http://localhost:5000/static/notes/${note.filename}`} target="_blank" rel="noopener noreferrer" download title="Download"
                    className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:scale-110 transition-all flex items-center justify-center">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => summarizeNote(note.id)} title="AI Summary"
                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:scale-110 transition-all flex items-center justify-center">
                    {summarizing === note.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteNote(note.id)} title="Delete"
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:scale-110 transition-all flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-dim font-bold">{note.uploaded_at}</p>
              {note.ai_summary && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">AI Summary</p>
                  </div>
                  <div className="text-xs text-dim leading-relaxed">
                    <ReactMarkdown
                      components={{
                        p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1.5" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1.5" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="text-white font-black" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-base font-black text-white mt-4 mb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-sm font-black text-white mt-3 mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xs font-black text-white mt-2 mb-1" {...props} />,
                        code: ({node, inline, className, children, ...props}) => {
                          return inline ? (
                            <code className="bg-dark-900 border border-white/5 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]" {...props}>{children}</code>
                          ) : (
                            <pre className="bg-dark-900 border border-white/5 p-3 rounded-lg overflow-x-auto mb-3">
                              <code className="font-mono text-[10px] text-emerald-300" {...props}>{children}</code>
                            </pre>
                          )
                        }
                      }}
                    >
                      {note.ai_summary}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center flex flex-col items-center gap-4 border-dashed border-white/10">
          <FileText className="w-12 h-12 text-dim opacity-30" />
          <h3 className="text-lg font-black text-white/50 lowercase">No notes yet</h3>
          <p className="text-xs text-dim italic">Upload your first note to get started.</p>
        </div>
      )}
    </div>
  );
}
