import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Timer,
  CheckSquare,
  BookOpen,
  TrendingUp,
  Code2,
  UserCircle,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  LogOut,
  Edit3,
  Brain,
  CalendarDays,
  Target,
  FileText,
  Trophy,
  Users,
  BarChart3
} from 'lucide-react';

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/insights',   icon: Brain,           label: 'Smart Insights' },
  {
    label: 'Academics',
    icon: BookOpen,
    subItems: [
      { to: '/attendance', label: 'Attendance' },
      { to: '/cgpa',       label: 'CGPA Target' },
    ]
  },
  {
    label: 'Coding',
    icon: Code2,
    subItems: [
      { to: '/coding',     label: 'Coding Stats' },
      { to: '/coding-deep',label: 'Coding Deep Dive' },
    ]
  },
  {
    label: 'Productivity',
    icon: Timer,
    subItems: [
      { to: '/todo',           label: 'To-Do List' },
      { to: '/timer',          label: 'Study Timer' },
      { to: '/planner',        label: 'Study Planner' },
      { to: '/notes',          label: 'Notes Hub' },
      { to: '/certifications', label: 'Certifications' },
    ]
  },
  {
    label: 'Assessments',
    icon: GraduationCap,
    subItems: [
      { to: '/assess',     label: 'Assessment Lab' },
      { to: '/weak-areas', label: 'Weak Areas' },
    ]
  },
  {
    label: 'Community',
    icon: Users,
    subItems: [
      { to: '/achievements', label: 'Achievements' },
      { to: '/leaderboard',label: 'Leaderboard' },
    ]
  }
];

function NavGroup({ item, location }) {
  const [isOpen, setIsOpen] = useState(false);

  const isAnySubActive = item.subItems.some(sub => 
    sub.to === '/' ? location.pathname === '/' : location.pathname.startsWith(sub.to)
  );

  useEffect(() => {
    if (isAnySubActive) setIsOpen(true);
  }, [isAnySubActive, location.pathname]);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center nav-link group ${isAnySubActive ? 'active shadow-inner-orange' : ''}`}
      >
        <div className={`p-2 rounded-lg transition-colors ${isAnySubActive ? 'bg-orange-600/20 text-orange-400' : 'text-dim group-hover:text-orange-400'}`}>
          <item.icon className="w-5 h-5 flex-shrink-0" />
        </div>
        <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
        {isOpen ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
      </button>
      
      {isOpen && (
        <div className="pl-4 space-y-1 mt-1">
          {item.subItems.map(sub => {
            const isActive = sub.to === '/' ? location.pathname === '/' : location.pathname.startsWith(sub.to);
            return (
              <NavLink
                key={sub.to}
                to={sub.to}
                className={`flex items-center pl-8 p-2 rounded-lg text-sm transition-colors relative ${
                  isActive ? 'text-orange-400 font-medium' : 'text-dim hover:text-orange-400 hover:bg-dark-700/30'
                }`}
              >
                {/* Connector line for nested items */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-dark-700"></div>
                <div className={`absolute left-6 top-1/2 w-2 h-px ${isActive ? 'bg-orange-500' : 'bg-dark-700'}`}></div>
                
                <span className="flex-1 z-10 bg-dark-800 pr-2">{sub.label}</span>
                {isActive && <div className="w-1 h-4 bg-orange-500 rounded-full mr-1 animate-pulse z-10" />}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-dark-800 border-r border-dark-700 flex flex-col shadow-2xl relative z-20">
      {/* Brand */}
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center shadow-orange-sm group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight tracking-tight">Student Diary</h1>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-dark pb-6">
        {navItems.map((item) => {
          if (item.subItems) {
            return <NavGroup key={item.label} item={item} location={location} />;
          }

          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);
            
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`nav-link group ${isActive ? 'active shadow-inner-orange' : ''}`}
            >
              <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-orange-600/20 text-orange-400' : 'text-dim group-hover:text-orange-400'}`}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
              </div>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              {isActive && <div className="w-1 h-5 bg-orange-500 rounded-full mr-1 animate-pulse" />}
            </NavLink>
          );
        })}
      </nav>

    </aside>
  );
}
