import { useState, useEffect } from 'react';
import api from '../api';
import { 
  BookOpen, 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Clock, 
  User, 
  Zap,
  ChevronDown
} from 'lucide-react';
import Calendar from '../components/Calendar';

export default function AttendanceTracker() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState({ slots: [], day_name: '' });
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/attendance?date=${selectedDate}`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (slotId, status) => {
    try {
      await api.post(`/attendance?date=${selectedDate}`, { slot_id: slotId, status });
      // Update local state for immediate feedback
      setData(prev => ({
        ...prev,
        slots: prev.slots.map(s => s.id === slotId ? { ...s, status } : s)
      }));
    } catch (err) {
      console.error('Error updating attendance:', err);
    }
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-orange-sm">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none">Attendance Tracker</h1>
          <p className="text-dim mt-1 font-medium italic">Mark your lecture-wise attendance and stay above the 75% threshold.</p>
        </div>
      </div>

      {/* Date Control Card */}
      <div className="card py-4 px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 relative">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowCalendar(!showCalendar)}>
            <CalendarIcon className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-white text-lg hover:text-orange-400 transition-colors">{formattedDate}</h3>
            <ChevronDown className={`w-4 h-4 text-dim transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
          </div>
          
          {showCalendar && (
            <div className="absolute top-full left-0 mt-4 z-50">
               <Calendar 
                 selectedDate={selectedDate} 
                 onDateChange={(date) => {
                    setSelectedDate(date);
                    setShowCalendar(false);
                 }} 
               />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
           <div className="bg-orange-600/10 border border-orange-600/30 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-glow">
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase">Live Status Tracking</span>
           </div>
        </div>
      </div>

      {/* Lectures List */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-white flex items-center gap-3 lowercase ml-2">
           <Clock className="w-5 h-5 text-orange-400" />
           {data.day_name || "Daily"}'s Lectures
        </h3>

        {loading ? null : (
        <div className="space-y-3">
          {data.slots.length > 0 ? data.slots.map((lec) => (
            <div 
              key={lec.id} 
              className={`card group hover:shadow-orange-sm transition-all border-l-4 p-4 md:p-6 ${
                lec.status === 'present' ? 'border-l-green-500' : 
                lec.status === 'absent' ? 'border-l-red-500' : 
                'border-l-transparent'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-white whitespace-nowrap">{lec.time}</span>
                    <span className="text-[9px] uppercase font-black tracking-widest text-dim mt-1 p-1 bg-dark-900 rounded border border-dark-600">
                      {lec.slot}
                    </span>
                  </div>

                  <div className="h-10 w-px bg-dark-700 hidden md:block" />

                  <div className="flex items-center gap-4 text-left">
                    <div className="min-w-[80px]">
                      <h4 className="text-xl font-black text-white tracking-tight flex items-center gap-2 leading-none">
                        {lec.subject}
                        <span className="text-[10px] bg-dark-900 border border-dark-600 px-1.5 py-0.5 rounded text-dim">
                          {lec.type}
                        </span>
                        {lec.section && (
                          <span className="text-[10px] bg-orange-600/10 border border-orange-600/30 px-1.5 py-0.5 rounded text-orange-400 font-black">
                            {lec.section}
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <User className="w-3.5 h-3.5 text-dim" />
                        <span className="text-xs font-semibold text-dim">{lec.prof}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button 
                    onClick={() => handleStatusUpdate(lec.id, 'present')}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${lec.status === 'present' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-dark-900 border border-dark-600 text-dim grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:border-green-500'}`}
                    title="Mark Present"
                  >
                    <Check className={`w-5 h-5 ${lec.status === 'present' ? 'scale-125' : ''} transition-transform`} />
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(lec.id, 'absent')}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${lec.status === 'absent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-dark-900 border border-dark-600 text-dim grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:border-red-500'}`}
                    title="Mark Absent"
                  >
                    <X className={`w-5 h-5 ${lec.status === 'absent' ? 'scale-125' : ''} transition-transform`} />
                  </button>
                  {lec.status && (
                    <button 
                      onClick={() => handleStatusUpdate(lec.id, '')}
                      className="p-3 text-[10px] font-black uppercase text-dim hover:text-white transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="card p-10 text-center text-dim font-black uppercase tracking-widest italic opacity-50">
                No lectures scheduled for this day
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
