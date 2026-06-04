import { useState, useEffect } from 'react';
import api from '../api';
import { 
  UserCircle, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  Target, 
  Save, 
  Camera,
  Edit2,
  Lock,
  ChevronRight,
  Github,
  Award,
  Code2,
  Globe
} from 'lucide-react';

export default function EditProfile() {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    roll_no: '',
    branch: '',
    section: '',
    leetcode: '',
    hackerrank: '',
    codechef: '',
    github: '',
    university: '',
    semester: '',
    cgpaTarget: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      setProfile(response.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await api.post('/profile', profile);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to update profile.');
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-orange-sm">
          <UserCircle className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Profile Settings</h1>
          <p className="text-dim mt-2 font-medium italic">Manage your account and academic information.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Profile Card Summary */}
        <div className="card text-center flex flex-col items-center">
           <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-full border-4 border-orange-600/20 p-1">
                 <div className="w-full h-full rounded-full bg-dark-700 flex items-center justify-center text-5xl font-black text-orange-500 overflow-hidden shadow-inner">
                    {profile.name.split(' ').map(n => n[0]).join('') || 'U'}
                 </div>
              </div>
              <button className="absolute bottom-1 right-1 w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all border-2 border-dark-800">
                 <Camera className="w-5 h-5" />
              </button>
           </div>
           
           <h3 className="text-2xl font-black text-white">{profile.name}</h3>
           <p className="text-orange-400 font-bold uppercase text-[10px] tracking-widest mt-1">{profile.roll_no || 'No Roll No'}</p>
           
           <div className="w-full h-px bg-dark-700 my-6" />
           
           <div className="w-full space-y-4">
              <div className="flex justify-between items-center px-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-dim">Current Session</span>
                 <span className="flex items-center gap-2 text-xs font-bold text-green-500">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Active
                 </span>
              </div>
              <div className="flex justify-between items-center px-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-dim">Branch</span>
                 <span className="text-xs font-bold text-white uppercase">{profile.branch}</span>
              </div>
           </div>
        </div>

        {/* Detailed Info Form */}
        <div className="card lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit2 className="w-5 h-5 text-orange-400" />
                <h3 className="font-extrabold text-white text-lg lowercase tracking-tight">Personal & Social Profiles</h3>
              </div>
              <button 
                onClick={() => setEditing(!editing)}
                className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${editing ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-orange-600/10 text-orange-400 border border-orange-600/20'}`}
              >
                {editing ? 'Cancel' : 'Edit Info'}
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">Full Name</label>
                 <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                    <input 
                      name="name"
                      value={profile.name}
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field pl-12" 
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">Email Address</label>
                 <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                    <input 
                      name="email"
                      value={profile.email}
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field pl-12" 
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">University</label>
                 <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                    <input 
                      name="university"
                      value={profile.university}
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field pl-12" 
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">Branch</label>
                 <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                    <input 
                      name="branch"
                      value={profile.branch}
                      onChange={handleChange}
                      disabled={true}
                      className="input-field pl-12 opacity-70" 
                    />
                 </div>
              </div>
           </div>

           <div className="h-px bg-dark-700 w-full" />

           <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-white text-lg lowercase tracking-tight">Academic & Social Profiles</h3>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">Academic Semester</label>
                 <select 
                    name="semester"
                    value={profile.semester}
                    onChange={handleChange}
                    disabled={!editing}
                    className="input-field appearance-none cursor-pointer"
                 >
                    <option>1st Semester</option>
                    <option>2nd Semester</option>
                    <option>3rd Semester</option>
                    <option>4th Semester</option>
                    <option>5th Semester</option>
                    <option>6th Semester</option>
                    <option>7th Semester</option>
                    <option>8th Semester</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">Batch / Section</label>
                 <select 
                    name="section"
                    value={profile.section}
                    onChange={handleChange}
                    disabled={!editing}
                    className="input-field appearance-none cursor-pointer"
                 >
                    <option value="">None</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">CGPA Target</label>
                 <div className="relative">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                    <input 
                      name="cgpaTarget"
                      value={profile.cgpaTarget}
                      placeholder="e.g. 9.5"
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field pl-12" 
                    />
                 </div>
              </div>

              {/* Social Links Section */}
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">GitHub Profile</label>
                 <div className="relative">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                    <input 
                      name="github"
                      value={profile.github}
                      placeholder="https://github.com/username"
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field pl-12" 
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">LeetCode Profile</label>
                 <div className="relative">
                    <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                    <input 
                      name="leetcode"
                      value={profile.leetcode}
                      placeholder="https://leetcode.com/username"
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field pl-12" 
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">HackerRank Profile</label>
                 <div className="relative">
                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                    <input 
                      name="hackerrank"
                      value={profile.hackerrank}
                      placeholder="https://hackerrank.com/username"
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field pl-12" 
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-dim px-1">CodeChef Profile</label>
                 <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                    <input 
                      name="codechef"
                      value={profile.codechef}
                      placeholder="https://codechef.com/users/username"
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field pl-12" 
                    />
                 </div>
              </div>
           </div>

           {editing && (
              <div className="flex justify-end gap-4 animate-slide-in">
                 <button 
                   onClick={() => setEditing(false)}
                   className="btn-secondary px-8"
                 >
                    Discard Changes
                 </button>
                 <button 
                   onClick={handleSave}
                   className="btn-primary px-10 flex items-center gap-2"
                 >
                    <Save className="w-4 h-4" />
                    Save & Sync
                 </button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
