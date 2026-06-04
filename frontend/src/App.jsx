import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './api/AuthContext';
import MainLayout      from './layout/MainLayout';
import Dashboard       from './pages/Dashboard';
import StudyTimer      from './pages/StudyTimer';
import TodoList        from './pages/TodoList';
import AttendanceTracker from './pages/AttendanceTracker';
import CGPATarget      from './pages/CGPATarget';
import CodingActivity  from './pages/CodingActivity';
import EditProfile     from './pages/EditProfile';
import Login           from './pages/Login';
import Signup          from './pages/Signup';
import Notifications   from './pages/Notifications';
import AssessmentDesk  from './pages/AssessmentDesk';
import SmartInsights   from './pages/SmartInsights';
import StudyPlanner    from './pages/StudyPlanner';
import WeakAreas       from './pages/WeakAreas';
import NotesHub        from './pages/NotesHub';
import Achievements    from './pages/Achievements';
import Leaderboard     from './pages/Leaderboard';
import CodingDeepDive  from './pages/CodingDeepDive';
import Certifications  from './pages/Certifications';

const AppSkeleton = () => (
  <div className="flex h-screen w-screen bg-dark-900 overflow-hidden">
    {/* Sidebar Skeleton */}
    <div className="w-64 border-r border-white/5 bg-dark-800 p-6 flex flex-col gap-8">
       <div className="w-40 h-10 rounded-xl skeleton" />
       <div className="space-y-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="w-full h-10 rounded-xl skeleton opacity-50" />)}
       </div>
    </div>
    {/* Main Content Skeleton */}
    <div className="flex-1 flex flex-col">
       <div className="h-16 border-bottom border-white/5 bg-dark-800 flex items-center px-8 justify-between shrink-0">
          <div className="w-64 h-8 rounded-lg skeleton" />
          <div className="flex gap-4">
             <div className="w-10 h-10 rounded-full skeleton" />
             <div className="w-40 h-10 rounded-xl skeleton" />
          </div>
       </div>
       <div className="flex-1 p-8 space-y-8 overflow-hidden">
          <div className="w-64 h-10 rounded-xl skeleton" />
          <div className="grid grid-cols-4 gap-6">
             {[1,2,3,4].map(i => <div key={i} className="h-40 rounded-2xl skeleton" />)}
          </div>
          <div className="flex-1 rounded-2xl skeleton" />
       </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AppSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/timer"      element={<StudyTimer />} />
            <Route path="/todo"       element={<TodoList />} />
            <Route path="/attendance" element={<AttendanceTracker />} />
            <Route path="/performance" element={<CGPATarget />} />
            <Route path="/cgpa"       element={<CGPATarget />} />
            <Route path="/coding"     element={<CodingActivity />} />
            <Route path="/profile"    element={<EditProfile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/assess"       element={<AssessmentDesk />} />
            <Route path="/insights"     element={<SmartInsights />} />
            <Route path="/planner"      element={<StudyPlanner />} />
            <Route path="/weak-areas"   element={<WeakAreas />} />
            <Route path="/notes"        element={<NotesHub />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/leaderboard"  element={<Leaderboard />} />
            <Route path="/coding-deep"  element={<CodingDeepDive />} />
            <Route path="/certifications" element={<Certifications />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
