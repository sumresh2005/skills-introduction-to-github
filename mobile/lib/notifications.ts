import * as Notifications from 'expo-notifications';
import { reminderMonthDay } from './birthdays';
import type { Friend } from './types';

const REMINDER_DAYS_BEFORE = 3;
const NOTIFICATION_HOUR = 9;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function birthdayTriggerId(friendId: string): string {
  return `birthday-${friendId}`;
}

function reminderTriggerId(friendId: string): string {
  return `birthday-reminder-${friendId}`;
}

/**
 * Re-schedules every birthday notification from scratch based on the
 * current friend list. Cheap and simple at personal-directory scale, and
 * avoids having to diff what's already scheduled after every edit.
 */
export async function syncBirthdayNotifications(friends: Friend[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  for (const friend of friends) {
    if (!friend.dob || !friend.dob.month || !friend.dob.day) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: birthdayTriggerId(friend.id),
      content: {
        title: `🎂 ${friend.name}'s birthday is today!`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.YEARLY,
        // expo-notifications' yearly trigger uses JS Date month numbering (0-11).
        month: friend.dob.month - 1,
        day: friend.dob.day,
        hour: NOTIFICATION_HOUR,
        minute: 0,
      },
    });

    const reminder = reminderMonthDay(friend.dob, REMINDER_DAYS_BEFORE);
    await Notifications.scheduleNotificationAsync({
      identifier: reminderTriggerId(friend.id),
      content: {
        title: `${friend.name}'s birthday is in ${REMINDER_DAYS_BEFORE} days`,
        body: 'Tap to plan a message.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.YEARLY,
        month: reminder.month - 1,
        day: reminder.day,
        hour: NOTIFICATION_HOUR,
        minute: 0,
      },
    });
  }
}
