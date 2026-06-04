import { useState, useEffect } from 'react';
import api from '../api';
import { Award, Upload, Loader2, Trash2, X, Download, Calendar, Building2 } from 'lucide-react';

export default function Certifications() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', organization: '', date_issued: '', file: null });

  const fetchCerts = () => {
    api.get('/certifications').then(r => setCerts(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCerts(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('organization', form.organization);
    fd.append('date_issued', form.date_issued);
    fd.append('file', form.file);
    try {
      await api.post('/certifications/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ title: '', organization: '', date_issued: '', file: null });
      setShowUpload(false);
      fetchCerts();
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  };

  const deleteCert = async (id) => {
    try { await api.delete(`/certifications/${id}`); setCerts(prev => prev.filter(c => c.id !== id)); } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      <p className="text-dim font-black uppercase tracking-widest text-[10px]">Loading certifications...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-orange-sm">
            <Award className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Certifications</h1>
            <p className="text-dim mt-1 font-medium italic">Upload and manage your professional credentials.</p>
          </div>
        </div>
        <button onClick={() => setShowUpload(!showUpload)}
          className="btn-primary px-6 py-3 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
          <Upload className="w-4 h-4" /> Upload Certificate
        </button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="card p-6 space-y-4 border-orange-500/20 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white text-sm uppercase tracking-widest">Upload New Certification</h3>
            <button onClick={() => setShowUpload(false)} className="text-dim hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Certification Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="input-field" required />
            <input type="text" placeholder="Issuing Organization (e.g. Coursera)" value={form.organization} onChange={e => setForm({...form, organization: e.target.value})}
              className="input-field" required />
            <input type="date" value={form.date_issued} onChange={e => setForm({...form, date_issued: e.target.value})}
              className="input-field" required />
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={e => setForm({...form, file: e.target.files[0]})}
              className="input-field file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-600 file:text-white" required />
            <button type="submit" disabled={uploading}
              className="btn-primary py-3 text-xs font-black uppercase tracking-widest md:col-span-2 disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload Certification'}
            </button>
          </form>
        </div>
      )}

      {/* Certifications Grid */}
      {certs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certs.map(cert => (
            <div key={cert.id} className="card p-5 space-y-3 group hover:border-orange-500/20 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-black text-white text-sm">{cert.title}</h4>
                  <div className="flex flex-col gap-1 mt-2">
                    {cert.organization && (
                      <div className="flex items-center gap-1.5 text-dim">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">{cert.organization}</span>
                      </div>
                    )}
                    {cert.date_issued && (
                      <div className="flex items-center gap-1.5 text-dim">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">{cert.date_issued}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/static/certifications/${cert.filename}`} target="_blank" rel="noopener noreferrer" download title="Download"
                    className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:scale-110 transition-all flex items-center justify-center">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => deleteCert(cert.id)} title="Delete"
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:scale-110 transition-all flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest pt-2 border-t border-white/5">
                Uploaded {cert.uploaded_at}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center flex flex-col items-center gap-4 border-dashed border-white/10">
          <Award className="w-12 h-12 text-dim opacity-30" />
          <h3 className="text-lg font-black text-white/50 lowercase">No certifications yet</h3>
          <p className="text-xs text-dim italic">Upload your first certification to build your profile.</p>
        </div>
      )}
    </div>
  );
}
