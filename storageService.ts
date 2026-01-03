
import { AppState, UserProfile, Workspace } from './types';

const DB_USERS_KEY = 'attendly_db_users';
const DB_WORKSPACES_KEY = 'attendly_db_workspaces';
const SESSION_KEY = 'attendly_session_v1';

const createDefaultPreferences = () => ({
  theme: 'light' as const,
  accentColor: 'indigo' as const,
  privacyMode: false,
  notificationsEnabled: true,
  notificationSettings: {
    notifyExams: true,
    notifyDeadlines: true,
    notifyEvents: true
  },
  aiSettings: {
    enabled: true,
    showRisks: true,
    showStrategies: true,
    showMotivation: true
  },
  startOfWeek: 'MONDAY' as const,
  defaultTarget: 75,
  dangerThreshold: 60,
  favoriteSubjects: []
});

export const storageService = {
  
  loadSession: (): AppState => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) {
        return { isLoggedIn: false, user: null, workspaces: [], activeWorkspaceId: null };
      }
      const parsed = JSON.parse(sessionData);
      // Re-validate user existence in "DB"
      const users = storageService.db.getUsers();
      const validUser = users.find(u => u.id === parsed.user?.id);
      if (!validUser) return { isLoggedIn: false, user: null, workspaces: [], activeWorkspaceId: null };
      
      return parsed;
    } catch (e) {
      return { isLoggedIn: false, user: null, workspaces: [], activeWorkspaceId: null };
    }
  },

  saveSession: (state: AppState) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state));
    
    if (state.isLoggedIn && state.user) {
      storageService.db.updateUser(state.user);
      // Strictly only save workspaces belonging to this user
      storageService.db.updateWorkspaces(state.user.id, state.workspaces);
    }
  },

  clearSession: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  db: {
    getUsers: (): UserProfile[] => JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]'),
    getWorkspaces: (): Workspace[] => JSON.parse(localStorage.getItem(DB_WORKSPACES_KEY) || '[]'),

    createUser: (username: string, password: string): UserProfile => {
      const users = storageService.db.getUsers();
      if (users.find(u => u.credentials.username.toLowerCase() === username.toLowerCase())) {
        throw new Error("Username already taken.");
      }
      const newUser: UserProfile = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        name: username,
        credentials: { username, password },
        preferences: createDefaultPreferences(),
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
      return newUser;
    },

    authenticate: (username: string, password: string): UserProfile | null => {
      const users = storageService.db.getUsers();
      const user = users.find(u => 
        u.credentials.username.toLowerCase() === username.toLowerCase() && 
        u.credentials.password === password
      );
      return user || null;
    },

    updateUser: (updatedUser: UserProfile) => {
      const users = storageService.db.getUsers();
      const idx = users.findIndex(u => u.id === updatedUser.id);
      if (idx !== -1) {
        users[idx] = updatedUser;
        localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
      }
    },

    updateWorkspaces: (userId: string, userWorkspaces: Workspace[]) => {
      const allWorkspaces = storageService.db.getWorkspaces();
      // SECURITY: Filter out any existing workspaces for THIS user, then add the new state
      // Ensure we don't accidentally save someone else's data into this user's bucket
      const otherUsersWorkspaces = allWorkspaces.filter(w => w.ownerId !== userId);
      const validatedWorkspaces = userWorkspaces.filter(w => w.ownerId === userId);
      
      localStorage.setItem(DB_WORKSPACES_KEY, JSON.stringify([...otherUsersWorkspaces, ...validatedWorkspaces]));
    },

    loadUserWorkspaces: (userId: string): Workspace[] => {
      const all = storageService.db.getWorkspaces();
      // SECURITY: Explicitly filter by userId to prevent horizontal privilege escalation
      return all.filter(w => w.ownerId === userId);
    },

    sync: async () => {
      return new Promise(resolve => setTimeout(resolve, 800));
    }
  }
};
