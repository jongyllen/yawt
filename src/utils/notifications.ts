import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert, Linking } from 'react-native';

const getNotifications = () => {
  // Silently skip in Expo Go on Android to avoid noisy native error
  if (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient') {
    return null;
  }

  try {
    return require('expo-notifications');
  } catch (e) {
    return null;
  }
};

export function isNotificationAvailable(): boolean {
  return getNotifications() !== null;
}

export function openNotificationSettings() {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
}

const setupHandler = () => {
  const Notifications = getNotifications();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
};

// Initialize handler if possible
setupHandler();

export async function requestNotificationPermissions() {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    } catch (e) {
      console.warn('[Notifications] Could not set channel:', e);
    }
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      try {
        await Notifications.setBadgeCountAsync(0);
      } catch (e) {}
    }

    return finalStatus === 'granted';
  } catch (e) {
    console.warn('[Notifications] Could not request permissions:', e);
    return false;
  }
}

export async function scheduleDailyWorkoutReminder(hour: number, minute: number) {
  const Notifications = getNotifications();
  if (!Notifications) return null;

  try {
    await cancelAllReminders();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Today's Workout 🏃‍♂️",
        body: "Time for your scheduled workout! Let's keep the momentum going.",
        subtitle: 'Workout Reminder',
        sound: true,
        data: { url: '/(tabs)/index' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });

    return id;
  } catch (e) {
    console.warn('[Notifications] Could not schedule reminder:', e);
    return null;
  }
}

export async function cancelAllReminders() {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('[Notifications] Could not cancel reminders:', e);
  }
}

/**
 * Clear the app badge count (removes the red number on the app icon)
 * Also dismisses all delivered notifications
 */
export async function clearBadge() {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    // Clear the badge count
    await Notifications.setBadgeCountAsync(0);
    // Also dismiss all delivered notifications from notification center
    await Notifications.dismissAllNotificationsAsync();
  } catch (e) {
    console.warn('[Notifications] Could not clear badge:', e);
  }
}

// ============================================
// WORKOUT TIMER NOTIFICATIONS
// ============================================

/**
 * Schedule a notification for when a workout timer completes
 * This ensures the user is alerted even if the app is suspended
 *
 * @param seconds - Seconds until the timer completes
 * @param exerciseName - Name of the next exercise
 * @returns The notification ID (for cancellation) or null
 */
export async function scheduleTimerCompleteNotification(
  seconds: number,
  exerciseName: string
): Promise<string | null> {
  const Notifications = getNotifications();
  if (!Notifications || seconds <= 0) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏱️ Timer Complete!',
        body: `Time for: ${exerciseName}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority?.HIGH ?? 'high',
        categoryIdentifier: 'workout_timer',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: seconds,
        repeats: false,
      },
    });

    return id;
  } catch (e) {
    console.warn('[Notifications] Could not schedule timer notification:', e);
    return null;
  }
}

/**
 * Cancel a scheduled timer notification
 *
 * @param notificationId - The ID returned from scheduleTimerCompleteNotification
 */
export async function cancelTimerNotification(notificationId: string): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications || !notificationId) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.warn('[Notifications] Could not cancel timer notification:', e);
  }
}

/**
 * Cancel all workout-related scheduled notifications
 */
export async function cancelAllWorkoutNotifications(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    // Just dismiss everything in the specific categories
    await Notifications.dismissAllNotificationsAsync(); // Optional: clears notification center too
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      const cat = n.content.categoryIdentifier;
      if (cat === 'workout_timer' || cat === 'workout_countdown') {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (e) {
    console.warn('[Notifications] Could not cancel workout notifications:', e);
  }
}

/**
 * Send an immediate notification (for background alerts)
 */
export async function sendImmediateNotification(title: string, body: string): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority?.HIGH ?? 'high',
      },
      trigger: null, // null = immediate
    });
  } catch (e) {
    console.warn('[Notifications] Could not send immediate notification:', e);
  }
}
