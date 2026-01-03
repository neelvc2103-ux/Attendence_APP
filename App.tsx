import { PropsWithChildren } from 'react';
import React, { useState, useEffect, useMemo } from 'react';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import { 
  AppState, ScheduleUnit, AttendanceRecord, AttendanceStatus, 
  Workspace, LeaveRecord, CalendarEvent, EventType, 
  ThemeColor, Insight, ScheduleType, StatusDefinition
} from './types';
import { DAYS, Icons, THEME_CONFIG, SCHEDULE_TEMPLATES, APP_VERSION } from './constants';
import { generateHolisticInsights } from './geminiService';
import { storageService } from './storageService';

const toLocalISOString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

type GlassCardProps = {
  className?: string;
  noPadding?: boolean;
};

const GlassCard: React.FC<PropsWithChildren<GlassCardProps>> = ({
  children,
  className = "",
  noPadding = false
}) => (
  <div
    className={`relative overflow-hidden bg-white/70 backdrop-blur-xl
    border border-white/60 shadow-xl shadow-slate-200/50 rounded-[2.5rem]
    transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/60
    ${noPadding ? '' : 'p-8 md:p-10'} ${className}`}
  >
    {children}
  </div>
);

const ModernInput = (props: React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & { label?: string, themeColor?: string, as?: 'input' | 'textarea' }) => {
  const Component = props.as === 'textarea' ? 'textarea' : 'input';
  return (
    <div className="group relative">
      {props.label && <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-2 ml-4 group-focus-within:text-slate-600 transition-colors">{props.label}</label>}
      <Component 
        {...props} 
        className={`w-full px-6 py-4 rounded-3xl bg-white/50 border-0 ring-1 ring-slate-200/80 shadow-sm text-slate-700 font-bold placeholder:text-slate-300 outline-none transition-all focus:ring-2 focus:bg-white ${props.themeColor || 'focus:ring-indigo-400'} ${props.className}`} 
      />
    </div>
  );
};

const ModernButton = ({ children, onClick, variant = 'primary', theme, className = "", disabled }: { children: React.ReactNode, onClick?: () => void, variant?: 'primary' | 'secondary' | 'ghost' | 'danger', theme: any, className?: string, disabled?: boolean }) => {
  const baseClass = "px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variants = {
    primary: `${theme.gradient} text-white shadow-lg ${theme.shadow} hover:shadow-xl hover:-translate-y-0.5`,
    secondary: `${theme.lightBg} ${theme.text} border ${theme.border} hover:bg-white`,
    ghost: `bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50`,
    danger: `bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100`
  };
  return <button onClick={onClick} disabled={disabled} className={`${baseClass} ${variants[variant]} ${className}`}>{children}</button>;
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(storageService.loadSession);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'calendar' | 'insights'>('dashboard');
  const [scheduleSubTab, setScheduleSubTab] = useState<'mark' | 'edit'>('mark');
  const [selectedDate, setSelectedDate] = useState<string>(toLocalISOString(new Date()));
  const [ttSelectedDay, setTtSelectedDay] = useState<number>(new Date().getDay());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  
  // Form States
  const [leaveForm, setLeaveForm] = useState({ start: '', end: '', reason: '' });
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [newUnitData, setNewUnitData] = useState({ title: '', start: '09:00', end: '10:00' });
  const [newEventData, setNewEventData] = useState({ title: '', type: 'EVENT' as EventType });
  const [newWorkspaceData, setNewWorkspaceData] = useState({ 
    name: '', 
    type: 'ACADEMIC' as ScheduleType,
    customStatuses: [] as { label: string, color: string, weight: number }[]
  });

  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  // Auth States
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [authError, setAuthError] = useState('');

  const activeWorkspace = useMemo(() => {
    return state.workspaces.find(w => w.id === state.activeWorkspaceId) || null;
  }, [state.workspaces, state.activeWorkspaceId]);

  const currentTheme = useMemo(() => {
    return THEME_CONFIG[state.user?.preferences.accentColor || 'indigo'];
  }, [state.user?.preferences.accentColor]);

  const privacyMode = state.user?.preferences.privacyMode || false;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    storageService.saveSession(state);
  }, [state]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authForm.username || !authForm.password) return setAuthError("Fill all fields.");

    try {
      if (isRegisterMode) {
        if (authForm.password !== authForm.confirmPassword) return setAuthError("Passwords do not match.");
        const newUser = storageService.db.createUser(authForm.username, authForm.password);
        const defaultWs: Workspace = {
           id: Math.random().toString(36).substr(2, 9),
           ownerId: newUser.id,
           createdAt: new Date().toISOString(),
           name: 'Main Schedule',
           config: { type: 'ACADEMIC', ...SCHEDULE_TEMPLATES.ACADEMIC },
           targetPercentage: 75,
           units: [], attendance: [], leaves: [], events: []
        };
        setState({ isLoggedIn: true, user: newUser, workspaces: [defaultWs], activeWorkspaceId: defaultWs.id });
      } else {
        const user = storageService.db.authenticate(authForm.username, authForm.password);
        if (user) {
           const workspaces = storageService.db.loadUserWorkspaces(user.id);
           setState({ isLoggedIn: true, user, workspaces, activeWorkspaceId: workspaces[0]?.id || null });
        } else setAuthError("Invalid username or password.");
      }
    } catch (err: any) { setAuthError(err.message); }
  };

  const handleLogout = () => {
    storageService.clearSession();
    setState({ isLoggedIn: false, user: null, workspaces: [], activeWorkspaceId: null });
  };

  const updateActiveWorkspace = (updater: (ws: Workspace) => Workspace) => {
    setState(prev => ({
      ...prev,
      workspaces: prev.workspaces.map(w => w.id === prev.activeWorkspaceId ? updater(w) : w)
    }));
  };

  const createWorkspace = () => {
    if (!newWorkspaceData.name.trim() || !state.user) return;
    
    let config = SCHEDULE_TEMPLATES[newWorkspaceData.type];
    if (newWorkspaceData.type === 'CUSTOM') {
      const statuses: Record<string, StatusDefinition> = {};
      newWorkspaceData.customStatuses.forEach((s, i) => {
        statuses[`CUSTOM_${i}`] = { label: s.label, color: s.color, weight: s.weight };
      });
      config = { unitName: 'Activity', statuses };
    }

    const newWs: Workspace = {
      id: Math.random().toString(36).substr(2, 9),
      ownerId: state.user.id,
      createdAt: new Date().toISOString(),
      name: newWorkspaceData.name,
      config: { type: newWorkspaceData.type, ...config },
      targetPercentage: 75,
      units: [], attendance: [], leaves: [], events: []
    };

    setState(prev => ({
      ...prev,
      workspaces: [...prev.workspaces, newWs],
      activeWorkspaceId: newWs.id
    }));
    setIsWorkspaceModalOpen(false);
    setNewWorkspaceData({ name: '', type: 'ACADEMIC', customStatuses: [] });
  };

  const markAttendance = (date: string, unitId: string, status: AttendanceStatus) => {
    updateActiveWorkspace(ws => {
      const newAttendance = [...ws.attendance];
      const existingIdx = newAttendance.findIndex(a => a.date === date && a.unitId === unitId);
      if (existingIdx >= 0) {
        if (newAttendance[existingIdx].status === status) {
          newAttendance.splice(existingIdx, 1);
        } else {
          newAttendance[existingIdx] = { ...newAttendance[existingIdx], status };
        }
      } else {
        newAttendance.push({ date, unitId, status });
      }
      return { ...ws, attendance: newAttendance };
    });
  };

  const addLongLeave = (startDate: string, endDate: string, reason: string) => {
    if (!startDate || !endDate) return;

    const newLeave: LeaveRecord = {
      id: Math.random().toString(36).substr(2, 9),
      startDate,
      endDate,
      reason
    };

    updateActiveWorkspace(ws => {
      const updatedLeaves = [...(ws.leaves || []), newLeave];
      const newAttendance = [...ws.attendance];
      const start = parseLocalDate(startDate);
      const end = parseLocalDate(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = toLocalISOString(d);
        const dayOfWeek = d.getDay();
        const unitsOnDay = ws.units.filter(u => u.dayOfWeek === dayOfWeek);
        
        unitsOnDay.forEach(unit => {
          const existingIdx = newAttendance.findIndex(a => a.date === dateStr && a.unitId === unit.id);
          if (existingIdx >= 0) {
            newAttendance[existingIdx] = { ...newAttendance[existingIdx], status: 'LEAVE' };
          } else {
            newAttendance.push({ date: dateStr, unitId: unit.id, status: 'LEAVE' });
          }
        });
      }
      return { ...ws, leaves: updatedLeaves, attendance: newAttendance };
    });
  };

  const handleSaveUnit = () => {
    if (!newUnitData.title.trim()) return;
    if (editingUnitId) {
      updateActiveWorkspace(ws => ({
        ...ws,
        units: ws.units.map(u => u.id === editingUnitId ? { 
          ...u, title: newUnitData.title, startTime: newUnitData.start, endTime: newUnitData.end, dayOfWeek: ttSelectedDay 
        } : u)
      }));
    } else {
      const newUnit: ScheduleUnit = {
        id: Math.random().toString(36).substr(2, 9),
        title: newUnitData.title, startTime: newUnitData.start, endTime: newUnitData.end, dayOfWeek: ttSelectedDay,
      };
      updateActiveWorkspace(ws => ({ ...ws, units: [...ws.units, newUnit] }));
    }
    setIsEditModalOpen(false);
    setEditingUnitId(null);
    setNewUnitData({ title: '', start: '09:00', end: '10:00' });
  };

  const handleAddEvent = () => {
    if (!newEventData.title.trim()) return;
    const event: CalendarEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEventData.title, type: newEventData.type, date: selectedDate
    };
    updateActiveWorkspace(ws => ({ ...ws, events: [...ws.events, event] }));
    setNewEventData({ title: '', type: 'EVENT' });
  };

  const overallPercentage = useMemo(() => {
    if (!activeWorkspace) return 0;
    const attendance = activeWorkspace.attendance;
    if (attendance.length === 0) return 0;
    let total = 0, earned = 0;
    attendance.forEach(r => {
      const statusDef = activeWorkspace.config.statuses[r.status];
      if (statusDef) {
        total += 1;
        earned += statusDef.weight;
      }
    });
    return total === 0 ? 0 : Math.round((earned / total) * 100);
  }, [activeWorkspace]);

  const subjectStats = useMemo(() => {
    if (!activeWorkspace) return [];
    const { units, attendance, config } = activeWorkspace;
    const subjectMap: Record<string, { total: number; earned: number }> = {};

    attendance.forEach(record => {
      const unit = units.find(u => u.id === record.unitId);
      if (!unit) return;
      const title = unit.title;
      if (!subjectMap[title]) subjectMap[title] = { total: 0, earned: 0 };
      const def = config.statuses[record.status];
      if (def && record.status !== 'CANCELED' && record.status !== 'HOLIDAY') {
        subjectMap[title].total += 1;
        subjectMap[title].earned += def.weight;
      }
    });

    return Object.entries(subjectMap).map(([title, data]) => ({
      title, percentage: data.total > 0 ? Math.round((data.earned / data.total) * 100) : 0, totalClasses: data.total
    })).filter(stat => stat.totalClasses > 0);
  }, [activeWorkspace]);

  const currentDayUnits = useMemo(() => {
    if (!activeWorkspace) return [];
    const day = parseLocalDate(selectedDate).getDay();
    return activeWorkspace.units
      .filter(u => u.dayOfWeek === day)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [activeWorkspace, selectedDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(new Date(year, month, i));
    return days;
  };

  const dayEvents = useMemo(() => {
    return activeWorkspace?.events.filter(e => e.date === selectedDate) || [];
  }, [activeWorkspace, selectedDate]);

  if (!state.isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <GlassCard className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className={`w-16 h-16 ${THEME_CONFIG.indigo.gradient} rounded-3xl flex items-center justify-center text-white shadow-xl mx-auto mb-6`}><Icons.Check /></div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{isRegisterMode ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{isRegisterMode ? 'Join Attendly Today' : 'Sign in to your schedule'}</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-6">
            <ModernInput label="Username" placeholder="Enter username" value={authForm.username} onChange={e => setAuthForm(p => ({ ...p, username: e.target.value }))} />
            <ModernInput label="Password" type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} />
            {isRegisterMode && <ModernInput label="Confirm Password" type="password" placeholder="••••••••" value={authForm.confirmPassword} onChange={e => setAuthForm(p => ({ ...p, confirmPassword: e.target.value }))} />}
            {authError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">{authError}</p>}
            <ModernButton theme={THEME_CONFIG.indigo} className="w-full mt-4" onClick={() => {}}>
              {isRegisterMode ? 'Register' : 'Sign In'}
            </ModernButton>
          </form>
          <button onClick={() => { setIsRegisterMode(!isRegisterMode); setAuthError(''); }} className="w-full mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
            {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </GlassCard>
      </div>
    );
  }

  const SubjectBarGraph = () => {
    if (subjectStats.length === 0) return null;
    return (
      <GlassCard className="max-w-5xl mx-auto !p-10">
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Subject-wise Attendance</h3>
          <p className="text-sm text-slate-500 mt-1">Based on conducted classes only</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectStats} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <XAxis dataKey="title" angle={-30} textAnchor="end" height={60} tick={{ fontSize: 12, fontWeight: 700 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Bar dataKey="percentage" fill="#6366f1" radius={[10, 10, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 flex gap-6 text-xs text-slate-500">
          <span>● Attendance %</span>
          <span className="italic">Subjects with no classes show empty bars</span>
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-40">
       <header className="sticky top-0 z-[110] bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 ${currentTheme.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg`}><Icons.Check /></div>
             <div>
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsWorkspaceModalOpen(true)}>
                  <h1 className="text-xl font-black tracking-tight">{activeWorkspace?.name}</h1>
                  <Icons.ChevronDown />
                </div>
                <div className="flex items-center gap-2">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{state.user?.name}</p>
                   <span className="w-1 h-1 rounded-full bg-slate-200" />
                   <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      {isOnline ? 'Live' : 'Offline'}
                   </div>
                </div>
             </div>
          </div>
          <button onClick={() => setIsSettingsModalOpen(true)} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white text-slate-300 border border-slate-100 shadow-sm"><Icons.Settings /></button>
       </header>

       <main className="max-w-7xl mx-auto px-6 py-10">
          {activeTab === 'dashboard' && (
             <div className="space-y-12 animate-in fade-in">
                <GlassCard className="flex flex-col items-center py-16 max-w-2xl mx-auto">
                   <h3 className="text-[10px] font-black uppercase text-slate-400 mb-10 tracking-widest">Efficiency Status</h3>
                   <div className={`relative w-64 h-64 transition-all duration-700 ${privacyMode ? 'blur-2xl grayscale opacity-30' : ''}`}>
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie data={[{v: overallPercentage}, {v: 100 - overallPercentage}]} innerRadius={100} outerRadius={120} paddingAngle={5} dataKey="v" stroke="none">
                           <Cell fill="url(#gradientMain)" />
                           <Cell fill="#f1f5f9" />
                         </Pie>
                         <defs>
                            <linearGradient id="gradientMain" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                         </defs>
                       </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-6xl font-black tracking-tighter bg-clip-text text-transparent ${currentTheme.gradient}`}>{overallPercentage}%</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Target: {activeWorkspace?.targetPercentage}%</span>
                     </div>
                   </div>
                </GlassCard>
                <SubjectBarGraph />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                   <ModernButton theme={currentTheme} onClick={() => setActiveTab('schedule')}>Check Timeline</ModernButton>
                   <ModernButton variant="secondary" theme={currentTheme} onClick={() => setActiveTab('calendar')}>Academic Calendar</ModernButton>
                </div>
             </div>
          )}

          {activeTab === 'schedule' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-end">
                   <div>
                      <h2 className="text-4xl font-black text-slate-800 tracking-tight">Schedule</h2>
                      <div className="flex gap-4 mt-4">
                         <button onClick={() => setScheduleSubTab('mark')} className={`text-xs font-black uppercase tracking-widest transition-all ${scheduleSubTab === 'mark' ? currentTheme.text : 'text-slate-300'}`}>Timeline</button>
                         <button onClick={() => setScheduleSubTab('edit')} className={`text-xs font-black uppercase tracking-widest transition-all ${scheduleSubTab === 'edit' ? currentTheme.text : 'text-slate-300'}`}>Edit Timetable</button>
                      </div>
                   </div>
                </div>

                {scheduleSubTab === 'mark' ? (
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center bg-white/50 p-6 rounded-[2rem] border border-white">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marking For</span>
                              <span className="font-bold text-slate-700">{new Date(selectedDate).toDateString()}</span>
                           </div>
                           <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-transparent font-bold outline-none cursor-pointer" />
                        </div>
                        {currentDayUnits.length === 0 ? (
                           <div className="py-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest border-2 border-dashed border-slate-200 rounded-[3rem]">No entries for this day.</div>
                        ) : (
                           currentDayUnits.map(unit => {
                              const record = activeWorkspace?.attendance.find(a => a.date === selectedDate && a.unitId === unit.id);
                              return (
                                 <GlassCard key={unit.id} className="group !p-6">
                                    <div className="space-y-6">
                                       <div className="flex justify-between items-start">
                                          <div>
                                             <h4 className="text-xl font-black text-slate-800">{unit.title}</h4>
                                             <span className={`inline-block mt-1 px-3 py-1 rounded-lg text-[9px] font-black uppercase ${currentTheme.lightBg} ${currentTheme.text}`}>
                                                {unit.startTime} - {unit.endTime}
                                             </span>
                                          </div>
                                       </div>
                                       <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                          {Object.entries(activeWorkspace?.config.statuses || {}).map(([key, def]: [string, StatusDefinition]) => (
                                             <button 
                                                key={key} 
                                                onClick={() => markAttendance(selectedDate, unit.id, key)}
                                                className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl text-[8px] font-black uppercase border transition-all ${record?.status === key ? `${def.color} shadow-lg scale-105` : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'}`}
                                             >
                                                {def.label}
                                             </button>
                                          ))}
                                       </div>
                                    </div>
                                 </GlassCard>
                              )
                           })
                        )}
                      </div>
                      <div className="space-y-6">
                         <GlassCard className="!p-8">
                            <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tight">Today's Goals</h3>
                            <div className="space-y-4">
                               {dayEvents.length === 0 ? (
                                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center py-4">No milestones today</p>
                               ) : (
                                  dayEvents.map(e => (
                                     <div key={e.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className={`w-2 h-2 rounded-full ${e.type === 'EXAM' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                                        <span className="text-xs font-bold text-slate-700">{e.title}</span>
                                     </div>
                                  ))
                               )}
                            </div>
                         </GlassCard>
                      </div>
                   </div>
                ) : (
                   <div className="space-y-8">
                      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                         {DAYS.map((day, idx) => (
                            <button 
                               key={day} 
                               onClick={() => setTtSelectedDay(idx)}
                               className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${ttSelectedDay === idx ? `${currentTheme.gradient} text-white shadow-lg` : 'bg-white text-slate-400 border border-slate-100'}`}
                            >
                               {day.substring(0,3)}
                            </button>
                         ))}
                      </div>
                      <GlassCard>
                         <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black text-slate-800">{DAYS[ttSelectedDay]} Entries</h3>
                            <button onClick={() => { setEditingUnitId(null); setNewUnitData({title:'', start:'09:00', end:'10:00'}); setIsEditModalOpen(true); }} className={`p-3 rounded-2xl ${currentTheme.gradient} text-white`}><Icons.Plus /></button>
                         </div>
                         <div className="space-y-4">
                            {activeWorkspace?.units.filter(u => u.dayOfWeek === ttSelectedDay).map(unit => (
                               <div key={unit.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-200 transition-all">
                                  <div>
                                     <p className="font-bold text-slate-800">{unit.title}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unit.startTime} - {unit.endTime}</p>
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button onClick={() => { setEditingUnitId(unit.id); setNewUnitData({title:unit.title, start:unit.startTime||'09:00', end:unit.endTime||'10:00'}); setIsEditModalOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-600"><Icons.Edit /></button>
                                     <button onClick={() => updateActiveWorkspace(ws => ({...ws, units: ws.units.filter(u=>u.id!==unit.id)}))} className="p-2 text-slate-300 hover:text-rose-500"><Icons.X /></button>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </GlassCard>
                   </div>
                )}
             </div>
          )}

          {activeTab === 'calendar' && (
             <div className="animate-in fade-in space-y-8">
                <div className="flex justify-between items-center">
                   <h2 className="text-4xl font-black text-slate-800 tracking-tight">Calendar</h2>
                   <div className="flex items-center gap-4">
                      <ModernButton variant="secondary" theme={currentTheme} onClick={() => setIsLeaveModalOpen(true)} className="!py-3 !px-5">Plan Long Leave</ModernButton>
                      <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                         <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl"><Icons.ChevronLeft /></button>
                         <span className="px-4 py-2 font-black text-xs uppercase tracking-widest">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                         <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl"><Icons.ChevronRight /></button>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                   <div className="lg:col-span-8">
                      <GlassCard className="!p-6">
                         <div className="grid grid-cols-7 gap-1 mb-4">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                               <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase py-2">{d}</div>
                            ))}
                         </div>
                         <div className="grid grid-cols-7 gap-3">
                            {getDaysInMonth(currentMonth).map((date, idx) => {
                               if (!date) return <div key={idx} />;
                               const dStr = toLocalISOString(date);
                               const isSelected = selectedDate === dStr;
                               const isToday = dStr === toLocalISOString(new Date());
                               const hasEvents = activeWorkspace?.events.some(e => e.date === dStr);
                               const isLeaveDate = activeWorkspace?.attendance.some(a => a.date === dStr && a.status === 'LEAVE');

                               return (
                                  <button 
                                     key={idx} 
                                     onClick={() => setSelectedDate(dStr)}
                                     className={`aspect-square relative flex flex-col items-center justify-center rounded-2xl transition-all 
                                       ${isSelected ? `${currentTheme.gradient} text-white shadow-xl scale-110 z-10` : 
                                         isToday ? `${currentTheme.lightBg} ${currentTheme.text} border-2 ${currentTheme.border}` : 
                                         isLeaveDate ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 
                                         'bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100'}`}
                                  >
                                     <span className="text-sm font-bold">{date.getDate()}</span>
                                     {hasEvents && <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`} />}
                                     {isLeaveDate && !isSelected && <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-indigo-400" />}
                                  </button>
                               )
                            })}
                         </div>
                      </GlassCard>
                   </div>
                   
                   <div className="lg:col-span-4 space-y-6">
                      <GlassCard className="!p-8">
                         <div className="flex justify-between items-center mb-6">
                            <div className="flex flex-col">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Date</span>
                               <span className="text-lg font-black text-slate-800">{new Date(selectedDate).toDateString()}</span>
                            </div>
                         </div>
                         <div className="space-y-4 mb-8">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Milestones</p>
                            {dayEvents.length === 0 ? (
                               <p className="text-xs font-bold text-slate-300 uppercase tracking-widest text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">No events found</p>
                            ) : (
                               dayEvents.map(e => (
                                  <div key={e.id} className="group flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                                     <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${e.type === 'EXAM' ? 'bg-rose-500' : e.type === 'SUBMISSION' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                                        <span className="text-xs font-bold text-slate-700">{e.title} <span className="text-[10px] opacity-40">({e.type})</span></span>
                                     </div>
                                     <button onClick={() => updateActiveWorkspace(ws => ({...ws, events: ws.events.filter(ev=>ev.id!==e.id)}))} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Icons.X /></button>
                                  </div>
                               ))
                            )}
                         </div>

                         <div className="pt-6 border-t border-slate-100 space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add New</p>
                            <ModernInput placeholder="Milestone Name..." value={newEventData.title} onChange={e => setNewEventData(p => ({...p, title: e.target.value}))} />
                            <div className="grid grid-cols-2 gap-2">
                               {['EVENT', 'EXAM', 'SUBMISSION', 'DEADLINE'].map(t => (
                                  <button key={t} onClick={() => setNewEventData(p => ({...p, type: t as EventType}))} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${newEventData.type === t ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{t}</button>
                               ))}
                            </div>
                            <ModernButton theme={currentTheme} onClick={handleAddEvent} className="w-full !py-3">Save Goal</ModernButton>
                         </div>
                      </GlassCard>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'insights' && (
             <div className="space-y-12 animate-in fade-in max-w-4xl mx-auto">
                <div className="flex justify-between items-center">
                   <h2 className="text-4xl font-black text-slate-800 tracking-tight">Coach</h2>
                   <ModernButton theme={currentTheme} onClick={async () => {
                      if(!activeWorkspace || !state.user) return;
                      setIsLoadingInsight(true);
                      const res = await generateHolisticInsights(activeWorkspace.units, activeWorkspace.attendance, activeWorkspace.events, state.user.preferences, activeWorkspace.targetPercentage, activeWorkspace.config.statuses);
                      setInsights(res);
                      setIsLoadingInsight(false);
                   }} disabled={isLoadingInsight}>{isLoadingInsight ? 'Analyzing...' : 'Refresh AI'}</ModernButton>
                </div>
                {insights ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {insights.map((insight, idx) => (
                         <GlassCard key={idx} className={`border-0 !p-8 shadow-xl ${THEME_CONFIG[state.user?.preferences.accentColor || 'indigo'].gradient} text-white`}>
                            <h4 className="text-xl font-black mb-2">{insight.title}</h4>
                            <p className="text-sm font-medium opacity-90">{insight.message}</p>
                         </GlassCard>
                      ))}
                   </div>
                ) : (
                  <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest">Run analysis to see insights</div>
                )}
             </div>
          )}
       </main>

       {isWorkspaceModalOpen && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-white/60 backdrop-blur-xl animate-in fade-in">
           <GlassCard className="w-full max-w-xl space-y-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center"><h3 className="text-2xl font-black text-slate-800">Switch Workspace</h3><button onClick={() => setIsWorkspaceModalOpen(false)}><Icons.X /></button></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {state.workspaces.map(ws => (
                    <button key={ws.id} onClick={() => { setState(p => ({...p, activeWorkspaceId: ws.id})); setIsWorkspaceModalOpen(false); }} className={`p-6 rounded-[2rem] border transition-all flex flex-col items-start ${ws.id === state.activeWorkspaceId ? `${currentTheme.lightBg} ${currentTheme.border} ring-2 ${currentTheme.ring}` : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}>
                       <span className="font-black text-slate-800">{ws.name}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{ws.config.type}</span>
                    </button>
                 ))}
              </div>
              <div className="pt-8 border-t border-slate-100 space-y-6">
                 <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Add New Workspace</h4>
                 <ModernInput label="Workspace Name" value={newWorkspaceData.name} onChange={e => setNewWorkspaceData(p => ({...p, name: e.target.value}))} />
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</p>
                    <div className="flex flex-wrap gap-2">
                       {['ACADEMIC', 'SABHA', 'CUSTOM'].map(t => (
                          <button key={t} onClick={() => setNewWorkspaceData(p => ({...p, type: t as ScheduleType}))} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${newWorkspaceData.type === t ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{t}</button>
                       ))}
                    </div>
                 </div>
                 {newWorkspaceData.type === 'CUSTOM' && (
                    <div className="space-y-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custom Attendance Buttons</p>
                       <div className="space-y-3">
                          {newWorkspaceData.customStatuses.map((s, idx) => (
                             <div key={idx} className="flex gap-2">
                                <ModernInput placeholder="Label" value={s.label} onChange={e => {
                                  const list = [...newWorkspaceData.customStatuses];
                                  list[idx].label = e.target.value;
                                  setNewWorkspaceData(p => ({...p, customStatuses: list}));
                                }} className="flex-1 !py-2" />
                                <select value={s.weight} onChange={e => {
                                    const list = [...newWorkspaceData.customStatuses];
                                    list[idx].weight = Number(e.target.value);
                                    setNewWorkspaceData(p => ({...p, customStatuses: list}));
                                  }} className="bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl px-3 text-[10px] font-black">
                                  <option value={1}>100%</option>
                                  <option value={0.5}>50%</option>
                                  <option value={0}>0%</option>
                                </select>
                                <button onClick={() => setNewWorkspaceData(p => ({...p, customStatuses: p.customStatuses.filter((_, i) => i !== idx)}))} className="text-rose-500"><Icons.X /></button>
                             </div>
                          ))}
                          <button onClick={() => setNewWorkspaceData(p => ({...p, customStatuses: [...p.customStatuses, { label: 'New Action', color: 'bg-indigo-50 text-indigo-500 border-indigo-100', weight: 1 }]}))} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-300 uppercase hover:border-slate-300 hover:text-slate-400">+ Add Custom Button</button>
                       </div>
                    </div>
                 )}
                 <ModernButton theme={currentTheme} onClick={createWorkspace} className="w-full">Initialize Workspace</ModernButton>
              </div>
           </GlassCard>
         </div>
       )}

       {isEditModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-white/60 backdrop-blur-xl animate-in fade-in">
             <GlassCard className="w-full max-w-lg space-y-8">
                <h3 className="text-2xl font-black text-slate-800">{editingUnitId ? 'Update Entry' : 'New Entry'}</h3>
                <ModernInput label="Title" value={newUnitData.title} onChange={e => setNewUnitData(p => ({...p, title: e.target.value}))} />
                <div className="grid grid-cols-2 gap-4">
                   <ModernInput label="Start Time" type="time" value={newUnitData.start} onChange={e => setNewUnitData(p => ({...p, start: e.target.value}))} />
                   <ModernInput label="End Time" type="time" value={newUnitData.end} onChange={e => setNewUnitData(p => ({...p, end: e.target.value}))} />
                </div>
                <div className="flex gap-4">
                   <ModernButton theme={currentTheme} onClick={handleSaveUnit} className="flex-1">Save</ModernButton>
                   <ModernButton variant="secondary" theme={currentTheme} onClick={() => setIsEditModalOpen(false)} className="flex-1">Cancel</ModernButton>
                </div>
             </GlassCard>
          </div>
       )}

       {isSettingsModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-white/60 backdrop-blur-xl animate-in fade-in">
             <GlassCard className="w-full max-w-lg space-y-8">
                <div className="flex justify-between items-center"><h3 className="text-2xl font-black text-slate-800">Global Settings</h3><button onClick={() => setIsSettingsModalOpen(false)}><Icons.X /></button></div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Environment</p>
                   <div className="p-6 bg-slate-50 rounded-[2rem] space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Version</span>
                         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{APP_VERSION}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Public Blur</span>
                         <button onClick={() => setState(p => ({...p, user: {...p.user!, preferences: {...p.user!.preferences, privacyMode: !p.user!.preferences.privacyMode}}}))} className={`w-10 h-6 rounded-full transition-all ${privacyMode ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                      </div>
                   </div>
                </div>
                <ModernButton variant="danger" theme={currentTheme} onClick={handleLogout} className="w-full">Sign Out</ModernButton>
             </GlassCard>
          </div>
       )}

       {isLeaveModalOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-white/60 backdrop-blur-xl animate-in fade-in">
             <GlassCard className="w-full max-w-lg space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black text-slate-800">Plan Long Leave</h3>
                   <button onClick={() => setIsLeaveModalOpen(false)}><Icons.X /></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <ModernInput label="Start Date" type="date" value={leaveForm.start} onChange={e => setLeaveForm(p => ({...p, start: e.target.value}))} />
                   <ModernInput label="End Date" type="date" value={leaveForm.end} onChange={e => setLeaveForm(p => ({...p, end: e.target.value}))} />
                </div>
                <ModernInput label="Reason" placeholder="Medical, Vacation, etc." value={leaveForm.reason} onChange={e => setLeaveForm(p => ({...p, reason: e.target.value}))} />
                <div className="flex gap-4">
                   <ModernButton theme={currentTheme} onClick={() => { addLongLeave(leaveForm.start, leaveForm.end, leaveForm.reason); setIsLeaveModalOpen(false); setLeaveForm({ start: '', end: '', reason: '' }); }} className="flex-1">Apply to Schedule</ModernButton>
                   <ModernButton variant="secondary" theme={currentTheme} onClick={() => setIsLeaveModalOpen(false)} className="flex-1">Cancel</ModernButton>
                </div>
             </GlassCard>
          </div>
       )}

       <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-auto bg-white/80 backdrop-blur-2xl rounded-full px-6 py-3 flex items-center gap-8 shadow-2xl border border-white/50 z-[120]">
          <button onClick={() => setActiveTab('dashboard')} className={`p-3 transition-all ${activeTab === 'dashboard' ? currentTheme.text : 'text-slate-300'}`}><Icons.Chart /></button>
          <button onClick={() => setActiveTab('schedule')} className={`p-3 transition-all ${activeTab === 'schedule' ? currentTheme.text : 'text-slate-300'}`}><Icons.Layout /></button>
          <button onClick={() => { setActiveTab('schedule'); setScheduleSubTab('edit'); setIsEditModalOpen(true); }} className={`p-4 ${currentTheme.gradient} rounded-full text-white shadow-lg`}><Icons.Plus /></button>
          <button onClick={() => setActiveTab('calendar')} className={`p-3 transition-all ${activeTab === 'calendar' ? currentTheme.text : 'text-slate-300'}`}><Icons.Calendar /></button>
          <button onClick={() => setActiveTab('insights')} className={`p-3 transition-all ${activeTab === 'insights' ? currentTheme.text : 'text-slate-300'}`}><Icons.Brain /></button>
       </nav>
    </div>
  );
};

export default App;