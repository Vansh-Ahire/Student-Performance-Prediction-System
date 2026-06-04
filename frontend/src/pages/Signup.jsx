import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { 
  UserCircle, 
  Lock, 
  ChevronRight, 
  AlertCircle,
  ShieldCheck,
  Target,
  Mail,
  Hash,
  BookOpen,
  Camera,
  X
} from 'lucide-react';

export default function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    roll_no: '',
    prn: '',
    branch_id: '',
    section: 'S1'
  });
  const [photo, setPhoto] = useState(null);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/branches');
        setBranches(response.data);
      } catch (err) {
        console.error('Error fetching branches:', err);
      }
    };
    fetchBranches();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (photo) data.append('photo', photo);

    try {
      await api.post('/signup', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Redirect to login or home after successful signup
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(circle at 10% 10%, rgba(249, 115, 22, 0.15) 0%, transparent 40%),
              radial-gradient(circle at 90% 90%, rgba(251, 146, 60, 0.1) 0%, transparent 40%)
            `
          }}
        />
        <div className="absolute inset-0 bg-tech-grid opacity-[0.03]" style={{ backgroundSize: '50px 50px' }} />
      </div>

      <div className="w-full max-w-2xl relative z-10 animate-slide-up py-10">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-600 flex items-center justify-center shadow-orange-md mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
             <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Student Diary</h1>
          <p className="text-dim font-bold italic text-sm tracking-wide lowercase">Create your account to start tracking</p>
        </div>

        {/* Signup Card */}
        <div className="card backdrop-blur-2xl border-white/5 shadow-2xl p-10 group hover:border-orange-500/20 transition-all duration-700">
          <div className="flex items-center gap-3 mb-10 border-bottom border-white/5 pb-4">
            <ShieldCheck className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-black text-white lowercase tracking-tight">Registration Portal</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="relative group/photo">
                <div className="w-32 h-32 rounded-3xl bg-dark-800 border-2 border-dashed border-dark-600 group-hover/photo:border-orange-500/50 flex items-center justify-center overflow-hidden transition-all duration-500">
                  {photo ? (
                    <img src={URL.createObjectURL(photo)} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-10 h-10 text-dim" />
                  )}
                </div>
                {photo && (
                  <button 
                    type="button" 
                    onClick={() => setPhoto(null)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  title="Upload profile photo"
                />
              </div>
              <p className="text-[10px] uppercase font-black tracking-widest text-dim italic">Upload Profile Photo</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-dim px-1">Full Name</label>
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-dim group-focus-within:text-orange-500" />
                  <input name="full_name" type="text" value={formData.full_name} onChange={handleChange} placeholder="John Doe" className="input-field pl-12" required />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-dim px-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-dim group-focus-within:text-orange-500" />
                  <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@university.edu" className="input-field pl-12" required />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-dim px-1">Username (PRN suggested)</label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-dim group-focus-within:text-orange-500" />
                  <input name="username" type="text" value={formData.username} onChange={handleChange} placeholder="22IT101" className="input-field pl-12" required />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-dim px-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-dim group-focus-within:text-orange-500" />
                  <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="input-field pl-12" required />
                </div>
              </div>

              {/* Roll No */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-dim px-1">Roll Number</label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-dim group-focus-within:text-orange-500" />
                  <input name="roll_no" type="text" value={formData.roll_no} onChange={handleChange} placeholder="101" className="input-field pl-12" />
                </div>
              </div>

              {/* PRN */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-dim px-1">PRN</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-dim group-focus-within:text-orange-500" />
                  <input name="prn" type="text" value={formData.prn} onChange={handleChange} placeholder="PRN20220101" className="input-field pl-12" />
                </div>
              </div>

              {/* Branch */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-dim px-1">Branch</label>
                <div className="relative group">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-dim group-focus-within:text-orange-500" />
                  <select 
                    name="branch_id" 
                    value={formData.branch_id} 
                    onChange={handleChange} 
                    className="input-field pl-12 appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-dim px-1">Batch / Section</label>
                <select name="section" value={formData.section} onChange={handleChange} className="input-field px-6 appearance-none cursor-pointer">
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="S3">S3</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-red-400 leading-relaxed uppercase tracking-tighter">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-5 text-xs uppercase font-black tracking-[0.3em] flex items-center justify-center gap-3 group disabled:opacity-50 mt-4 shadow-orange-md"
            >
              {loading ? 'Creating Profile...' : 'Complete Registration'}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </form>

          <p className="text-center mt-10 text-xs font-bold text-dim border-t border-white/5 pt-8">
            Already have an account? <Link to="/login" className="text-orange-400 hover:text-orange-300 ml-1 transition-colors uppercase tracking-widest">Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
