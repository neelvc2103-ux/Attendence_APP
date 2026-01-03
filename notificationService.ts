
import { CalendarEvent, UserPreferences } from './types';

/**
 * Logic for the Intelligent Notification System.
 * Enforces: No lecture reminders, only Exams/Deadlines/Events.
 */
export const notificationService = {
  
  /**
   * Request browser permission for notifications.
   */
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  /**
   * Checks a list of events and triggers notifications if they are due (Tomorrow).
   * Returns a list of Event IDs that were successfully notified, to update state.
   */
  checkAndNotify: (events: CalendarEvent[], prefs: UserPreferences): string[] => {
    if (!prefs.notificationsEnabled) return [];
    if (Notification.permission !== 'granted') return [];

    const notifiedIds: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    events.forEach(event => {
      // 1. Fatigue Check: Already notified?
      if (event.hasNotified) return;

      // 2. Timing Check: Is it tomorrow?
      if (event.date !== tomorrowStr) return;

      // 3. Preference Check: Is this category enabled?
      if (event.type === 'EXAM' && !prefs.notificationSettings.notifyExams) return;
      if (event.type === 'DEADLINE' && !prefs.notificationSettings.notifyDeadlines) return;
      if (event.type === 'EVENT' && !prefs.notificationSettings.notifyEvents) return;

      // 4. Trigger Notification
      const { title, body, icon } = getNotificationContent(event);
      new Notification(title, { body, icon });
      
      notifiedIds.push(event.id);
    });

    return notifiedIds;
  }
};

/**
 * Determines content based on priority.
 * EXAM > DEADLINE > EVENT
 */
const getNotificationContent = (event: CalendarEvent) => {
  switch (event.type) {
    case 'EXAM':
      return {
        title: `📚 Prep Alert: ${event.title}`,
        body: `You have an exam tomorrow. Good luck!`,
        icon: '/icons/exam.png' // Browser will fallback if missing
      };
    case 'DEADLINE':
      return {
        title: `⏳ Submission Due: ${event.title}`,
        body: `Deadline is tomorrow. Finalize your work.`,
        icon: '/icons/deadline.png'
      };
    case 'EVENT':
    default:
      return {
        title: `🗓️ Upcoming: ${event.title}`,
        body: `Happening tomorrow.`,
        icon: '/icons/calendar.png'
      };
  }
};
