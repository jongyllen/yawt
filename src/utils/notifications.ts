import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function requestNotificationPermissions() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        return false;
    }


    return true;
}

export async function scheduleDailyWorkoutReminder(hour: number, minute: number) {
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
}

export async function cancelAllReminders() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}
