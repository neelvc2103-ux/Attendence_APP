
export type ScheduleType = 'ACADEMIC' | 'SABHA' | 'CUSTOM';

export interface StatusDefinition {
  label: string;
  weight: number; // 1 for 100% credit, 0 for 0%, 0.5 for half credit
  color: string;  // CSS class reference
  isDefault?: boolean;
}

export interface ScheduleConfig {
  type: ScheduleType;
  unitName: string; // e.g., "Lecture", "Session", "Workout"
  statuses: Record<string, StatusDefinition>;
}

export type AttendanceStatus = string; 

export type LeaveType = 'FULL' | 'HALF_MORNING' | 'HALF_EVENING';

export type EventType = 'EXAM' | 'DEADLINE' | 'EVENT' | 'SUBMISSION';

export type InsightType = 'CRITICAL' | 'WARNING' | 'STRATEGY' | 'HEALTH';

export interface Insight {
  type: InsightType;
  title: string;
  message: string;
  relatedSubject?: string;
}

// Add this to your types
export interface LeaveRecord {
  id: string;
  startDate: string; // ISO format
  endDate: string;   // ISO format
  reason: string;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: EventType;
  description?: string;
  hasNotified?: boolean; 
}

export interface ScheduleUnit {
  id: string;
  title: string; 
  dayOfWeek: number; 
  startTime?: string; 
  endTime?: string;   
  orderIndex?: number; 
}

export interface AttendanceRecord {
  date: string; 
  unitId: string; 
  status: AttendanceStatus;
}

export type ThemeColor = 'indigo' | 'rose' | 'emerald' | 'violet' | 'amber' | 'cyan' | 'fuchsia';

export interface NotificationPreferences {
  notifyExams: boolean;
  notifyDeadlines: boolean;
  notifyEvents: boolean;
}

export interface AISettings {
  enabled: boolean;        
  showRisks: boolean;      
  showStrategies: boolean; 
  showMotivation: boolean; 
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  accentColor: ThemeColor;
  privacyMode: boolean; 
  notificationsEnabled: boolean;
  notificationSettings: NotificationPreferences;
  aiSettings: AISettings;
  startOfWeek: 'SUNDAY' | 'MONDAY';
  defaultTarget: number;
  dangerThreshold: number;
  favoriteSubjects: string[];
}

export interface Workspace {
  id: string;
  ownerId: string; 
  createdAt: string;
  name: string;
  config: ScheduleConfig; 
  targetPercentage: number;
  units: ScheduleUnit[]; 
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  events: CalendarEvent[];
}

export interface UserCredentials {
  username: string;
  password: string; 
}

export interface UserProfile {
  id: string;
  name: string;
  credentials: UserCredentials; 
  preferences: UserPreferences;
  createdAt: string;
}

export interface AIAnalysisResult {
  conflicts: Array<{ date: string; message: string }>;
  workload: Array<{ day: string; message: string }>;
  studySlots: Array<{ date: string; time: string; subject: string }>;
  trendPrediction: Array<{ week: string; percentage: number }>;
}

export interface AppState {
  isLoggedIn: boolean;
  user: UserProfile | null;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
}
