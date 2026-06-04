import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar({ selectedDate, onDateChange }) {
  const current = new Date(selectedDate);
  const [viewDate, setViewDate] = useState(new Date(current.getFullYear(), current.getMonth(), 1));

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
  }

  for (let d = 1; d <= daysInMonth(viewDate.getFullYear(), viewDate.getMonth()); d++) {
    const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = dateStr === selectedDate;
    const isToday = new Date().toISOString().split('T')[0] === dateStr;

    days.push(
      <button
        key={d}
        onClick={() => onDateChange(dateStr)}
        className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
          isSelected 
            ? 'bg-orange-600 text-white shadow-orange-sm scale-110 z-10' 
            : isToday
            ? 'border border-orange-500/50 text-orange-400'
            : 'text-dim hover:bg-white/5 hover:text-white'
        }`}
      >
        {d}
      </button>
    );
  }

  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="card p-4 w-full max-w-[320px] backdrop-blur-xl border-white/5 select-none">
      <div className="flex items-center justify-between mb-4 px-2">
        <h4 className="text-sm font-black text-white uppercase tracking-widest">{monthName} {viewDate.getFullYear()}</h4>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-white/5 rounded-lg text-dim hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-white/5 rounded-lg text-dim hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="h-8 w-10 flex items-center justify-center text-[10px] font-black text-dim uppercase tracking-tighter opacity-40">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
}
