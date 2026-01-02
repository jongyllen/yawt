import AsyncStorage from '@react-native-async-storage/async-storage';

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
 * Save widget data to storage
 */
export async function saveWidgetData(data: WidgetData): Promise<void> {
    try {
        await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
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

