import AppleHealthKit, {
    HealthKitPermissions,
} from 'react-native-health';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HEALTH_ENABLED_KEY = 'health_sync_enabled';

const permissions: HealthKitPermissions = {
    permissions: {
        read: [AppleHealthKit.Constants.Permissions.Workout],
        write: [AppleHealthKit.Constants.Permissions.Workout],
    },
};

let healthInitialized = false;

/**
 * Check if Health Sync is enabled in settings
 */
export async function isHealthSyncEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(HEALTH_ENABLED_KEY);
    return enabled === 'true';
}

/**
 * Toggle Health Sync setting
 */
export async function setHealthSyncEnabled(enabled: boolean): Promise<{ success: boolean; error?: string }> {
    if (Platform.OS !== 'ios') return { success: false, error: 'Apple Health is only available on iOS.' };

    await AsyncStorage.setItem(HEALTH_ENABLED_KEY, enabled.toString());

    if (enabled) {
        return await initHealthKit();
    }
    return { success: true };
}

/**
 * Initialize HealthKit and request permissions
 */
export async function initHealthKit(): Promise<{ success: boolean; error?: string }> {
    if (Platform.OS !== 'ios') return { success: false, error: 'Apple Health is only available on iOS.' };

    return new Promise((resolve) => {
        const { AppleHealthKit: NativeAppleHealthKit } = require('react-native').NativeModules;

        if (!NativeAppleHealthKit) {
            console.error('[HealthKit] Native module is missing!');
            resolve({ success: false, error: 'Native HealthKit module is missing.' });
            return;
        }

        AppleHealthKit.isAvailable((err, available) => {
            if (err) {
                console.error('[HealthKit] Availability check error:', err);
                resolve({ success: false, error: `HealthKit availability error: ${err}` });
                return;
            }

            if (!available) {
                console.error('[HealthKit] Not available on this device');
                resolve({ success: false, error: 'HealthKit is not available on this device.' });
                return;
            }

            console.log('[HealthKit] Initializing with permissions:', JSON.stringify(permissions));
            AppleHealthKit.initHealthKit(permissions, (error) => {
                if (error) {
                    console.error('[HealthKit] Error initializing:', error);
                    resolve({ success: false, error: `HealthKit init error: ${error}` });
                    return;
                }
                console.log('[HealthKit] Successfully initialized');
                healthInitialized = true;
                resolve({ success: true });
            });
        });
    });
}

/**
 * Save a completed workout to HealthKit
 */
export async function saveWorkoutToHealth(options: {
    startDate: string;
    endDate: string;
    durationSeconds: number;
    calories?: number;
    workoutName?: string;
}): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;

    const enabled = await isHealthSyncEnabled();
    if (!enabled) return false;

    if (!healthInitialized) {
        const success = await initHealthKit();
        if (!success) return false;
    }

    return new Promise((resolve) => {
        // We'll use Traditional Strength Training as a reasonable default for weightlifting/bodyweight
        const workoutOptions = {
            type: AppleHealthKit.Constants.Activities.TraditionalStrengthTraining,
            startDate: options.startDate,
            endDate: options.endDate,
            energyBurned: options.calories || (options.durationSeconds / 60) * 5, // Rough estimate: 5 cal/min
            energyBurnedUnit: 'calorie' as any,
        };

        AppleHealthKit.saveWorkout(workoutOptions, (error, result) => {
            if (error) {
                console.error('[HealthKit] Error saving workout:', error);
                resolve(false);
                return;
            }
            console.log('[HealthKit] Workout saved successfully:', result);
            resolve(true);
        });
    });
}
