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
                subtitle: "Workout Reminder",
                sound: true,
                badge: 1,
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
