
import React from 'react';
import { ScheduleType, StatusDefinition, ThemeColor } from './types';

export const APP_VERSION = '1.2.0-stable';
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const SCHEDULE_TEMPLATES: Record<ScheduleType, { unitName: string, statuses: Record<string, StatusDefinition> }> = {
  ACADEMIC: {
    unitName: 'Lecture',
    statuses: {
      PRESENT: { label: 'Present', weight: 1, color: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' },
      ABSENT: { label: 'Absent', weight: 0, color: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200' },
      BUNK: { label: 'Bunk', weight: 0, color: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
      LEAVE: { label: 'Leave', weight: 1, color: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' }, 
      CANCELED: { label: 'Canceled', weight: 1, color: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 border-dashed' },
      HOLIDAY: { label: 'Holiday', weight: 1, color: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200' }
    }
  },
  SABHA: {
    unitName: 'Session',
    statuses: {
      PRESENT: { label: 'Attended', weight: 1, color: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' },
      ABSENT: { label: 'Missed', weight: 0, color: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200' }
    }
  },
  CUSTOM: {
    unitName: 'Task',
    statuses: {
      DONE: { label: 'Done', weight: 1, color: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' },
      SKIP: { label: 'Skip', weight: 0, color: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' }
    }
  }
};

interface ThemeStyle {
  gradient: string;
  text: string;
  accent: string;
  lightBg: string;
  border: string;
  shadow: string;
  ring: string;
}

export const THEME_CONFIG: Record<ThemeColor, ThemeStyle> = {
  indigo: { gradient: 'bg-gradient-to-br from-indigo-500 to-violet-600', text: 'text-indigo-600', accent: 'text-indigo-500', lightBg: 'bg-indigo-50/50', border: 'border-indigo-100', shadow: 'shadow-indigo-500/20', ring: 'focus:ring-indigo-400' },
  rose: { gradient: 'bg-gradient-to-br from-rose-500 to-pink-600', text: 'text-rose-600', accent: 'text-rose-500', lightBg: 'bg-rose-50/50', border: 'border-rose-100', shadow: 'shadow-rose-500/20', ring: 'focus:ring-rose-400' },
  emerald: { gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600', text: 'text-emerald-600', accent: 'text-emerald-500', lightBg: 'bg-emerald-50/50', border: 'border-emerald-100', shadow: 'shadow-emerald-500/20', ring: 'focus:ring-emerald-400' },
  violet: { gradient: 'bg-gradient-to-br from-violet-500 to-purple-600', text: 'text-violet-600', accent: 'text-violet-500', lightBg: 'bg-violet-50/50', border: 'border-violet-100', shadow: 'shadow-violet-500/20', ring: 'focus:ring-violet-400' },
  amber: { gradient: 'bg-gradient-to-br from-amber-400 to-orange-500', text: 'text-amber-600', accent: 'text-amber-500', lightBg: 'bg-amber-50/50', border: 'border-amber-100', shadow: 'shadow-amber-500/20', ring: 'focus:ring-amber-400' },
  cyan: { gradient: 'bg-gradient-to-br from-cyan-400 to-blue-500', text: 'text-cyan-600', accent: 'text-cyan-500', lightBg: 'bg-cyan-50/50', border: 'border-cyan-100', shadow: 'shadow-cyan-500/20', ring: 'focus:ring-cyan-400' },
  fuchsia: { gradient: 'bg-gradient-to-br from-fuchsia-500 to-pink-600', text: 'text-fuchsia-600', accent: 'text-fuchsia-500', lightBg: 'bg-fuchsia-50/50', border: 'border-fuchsia-100', shadow: 'shadow-fuchsia-500/20', ring: 'focus:ring-fuchsia-400' }
};

export const Icons = {
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>,
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>,
  Chart: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>,
  Brain: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  History: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Workspace: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  ChevronDown: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>,
  Layout: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Star: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  Eye: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  EyeOff: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>,
  Globe: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  Activity: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
};
