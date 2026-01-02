import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import WidgetCenter from 'react-native-widget-center';
import * as Device from 'expo-device';

// Keys for widget data storage
const WIDGET_DATA_KEY = 'widget_data';

export interface WidgetData {
    currentStreak: number;
    longestStreak: number;
    nextWorkoutName: string | null;
    nextProgramName: string | null;
    nextWorkoutId: string | null;
    nextProgramId: string | null;
    workedOutToday: boolean;
    lastUpdated: string;
}

/**
 * Save widget data to shared storage that can be accessed by the native widget
 */
export async function saveWidgetData(data: WidgetData): Promise<void> {
    try {
        await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));

        // Trigger widget update on Android
        if (Platform.OS === 'android') {
            try {
                const { requestWidgetUpdate } = require('react-native-android-widget');
                await requestWidgetUpdate({
                    widgetName: 'StreakWidget',
                    renderWidget: () => null, // Will be handled by native code
                    widgetNotFound: () => { },
                });
            } catch (e) {
                // Widget package might not be available
            }
        }

        // Save to Shared App Group on iOS
        // Only attempt on real device as App Groups are not available/reliable in Simulator
        if (Platform.OS === 'ios' && Device.isDevice && SharedGroupPreferences) {
            try {
                const APP_GROUP = 'group.com.yawt.app';
                // Save the entire object as a string for reliability
                await SharedGroupPreferences.setItem('widgetData', JSON.stringify(data), APP_GROUP);

                // Force an immediate reload of the iOS widget
                if (WidgetCenter && WidgetCenter.reloadAllTimelines) {
                    WidgetCenter.reloadAllTimelines();
                }
                console.log('Successfully saved and reloaded iOS widget data');
            } catch (e) {
                console.error('Error saving to iOS App Group:', e);
            }
        }
    } catch (e) {
        console.error('Error saving widget data:', e);
    }
}

/**
 * Get widget data from storage
 */
export async function getWidgetData(): Promise<WidgetData | null> {
    try {
        const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Error getting widget data:', e);
        return null;
    }
}

/**
 * Get default widget data
 */
export function getDefaultWidgetData(): WidgetData {
    return {
        currentStreak: 0,
        longestStreak: 0,
        nextWorkoutName: null,
        nextProgramName: null,
        nextWorkoutId: null,
        nextProgramId: null,
        workedOutToday: false,
        lastUpdated: new Date().toISOString(),
    };
}

