import { useState, useEffect } from 'react';
import api from '../api';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  X,
  Zap,
  Filter,
  Loader2
} from 'lucide-react';

export default function Notifications() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [smartReminders, setSmartReminders] = useState([]);

  const iconMap = {
    danger: AlertCircle,
    warning: Clock,
    success: TrendingUp,
    info: Bell,
    zap: Zap
  };

  useEffect(() => {
    fetchNotifications();
    api.get('/smart-reminders').then(r => setSmartReminders(r.data)).catch(() => {});
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/read/${id}`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    return true;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      <p className="text-dim font-black uppercase tracking-widest text-[10px]">Syncing Alerts...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-orange-sm">
            <Bell className="w-7 h-7 text-white" />
            </div>
            <div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Alerts Hub</h1>
            <p className="text-dim mt-2 font-medium italic">Stay updated with your academic and system notifications.</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'all' ? 'bg-orange-600 text-white shadow-glow' : 'bg-dark-800 text-dim hover:text-white border border-white/5'}`}
            >
                All
            </button>
            <button 
                onClick={() => setActiveFilter('unread')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'unread' ? 'bg-orange-600 text-white shadow-glow' : 'bg-dark-800 text-dim hover:text-white border border-white/5'}`}
            >
                Unread
            </button>
        </div>
      </div>

      {/* Smart Reminders Section */}
      {smartReminders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 ml-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Smart Alerts</h3>
            <span className="text-[9px] font-black bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Live</span>
          </div>
          {smartReminders.map((r, i) => (
            <div key={i} className={`card p-4 border-l-4 ${r.type === 'danger' ? 'border-l-red-500 bg-red-500/5' : r.type === 'warning' ? 'border-l-amber-500 bg-amber-500/5' : 'border-l-cyan-500 bg-cyan-500/5'}`}>
              <h4 className="text-sm font-black text-white">{r.title}</h4>
              <p className="text-xs text-dim font-medium mt-1">{r.message}</p>
            </div>
          ))}
          <div className="h-px bg-white/5 w-full my-2" />
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {filtered.length > 0 ? filtered.map((item) => {
          const Icon = iconMap[item.type] || Bell;
          return (
            <div 
                key={item.id} 
                className={`card group relative overflow-hidden transition-all duration-300 border-l-4 ${
                    !item.read ? 'bg-orange-500/5' : ''
                } ${
                    item.type === 'danger' ? 'border-l-red-500' : 
                    item.type === 'warning' ? 'border-l-amber-500' : 
                    item.type === 'success' ? 'border-l-emerald-500' : 
                    'border-l-orange-400'
                }`}
            >
                <div className="flex items-start gap-6">
                {/* Type-based Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                    item.type === 'danger' ? 'bg-red-500/10 text-red-400' : 
                    item.type === 'warning' ? 'bg-amber-500/10 text-amber-400' : 
                    item.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 
                    'bg-orange-400/10 text-orange-400'
                }`}>
                    <Icon className="w-6 h-6" />
                </div>

              {/* Content */}
              <div className="flex-1 pr-12">
                <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors uppercase tracking-tight">
                        {item.title}
                    </h3>
                    {!item.read && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-glow animate-pulse" />}
                </div>
                <p className="text-sm text-dim leading-relaxed font-medium mb-3">
                  {item.desc}
                </p>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-dim/60">
                        <Clock className="w-3.5 h-3.5" />
                        {item.time}
                    </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!item.read && (
                    <button 
                        onClick={() => markAsRead(item.id)}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:scale-110 transition-all shadow-sm"
                        title="Mark as Read"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                    </button>
                )}
                <button 
                    onClick={() => deleteNotification(item.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:scale-110 transition-all shadow-sm"
                    title="Clear notification"
                >
                    <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subtle background decoration */}
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-5 pointer-events-none transition-all group-hover:opacity-10 ${
                item.type === 'danger' ? 'bg-red-500' : 
                item.type === 'warning' ? 'bg-amber-500' : 
                item.type === 'success' ? 'bg-emerald-500' : 
                'bg-orange-400'
            }`} />
          </div>
          );
        }) : (
          <div className="card p-20 text-center flex flex-col items-center gap-4 bg-dark-800/30 border-dashed border-white/5">
             <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center text-dim border border-white/5 opacity-40">
                <Filter className="w-8 h-8" />
             </div>
             <div>
                <h3 className="text-xl font-black text-white/50 lowercase tracking-tight">No alerts found</h3>
                <p className="text-xs text-dim italic mt-1 font-medium opacity-60">You're all caught up for now!</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
