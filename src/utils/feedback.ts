import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Settings keys
const SETTINGS_KEYS = {
    SOUND_ENABLED: 'feedback_sound_enabled',
    HAPTICS_ENABLED: 'feedback_haptics_enabled',
    COUNTDOWN_BEEPS: 'feedback_countdown_beeps',
};

// Cached settings
let soundEnabled = true;
let hapticsEnabled = true;
let countdownBeepsEnabled = true;
let settingsLoaded = false;

// Sound instances
let beepSound: Audio.Sound | null = null;
let completionSound: Audio.Sound | null = null;

/**
 * Load feedback settings from storage
 */
export async function loadFeedbackSettings(): Promise<void> {
    try {
        const [sound, haptics, countdown] = await Promise.all([
            AsyncStorage.getItem(SETTINGS_KEYS.SOUND_ENABLED),
            AsyncStorage.getItem(SETTINGS_KEYS.HAPTICS_ENABLED),
            AsyncStorage.getItem(SETTINGS_KEYS.COUNTDOWN_BEEPS),
        ]);

        soundEnabled = sound !== 'false';
        hapticsEnabled = haptics !== 'false';
        countdownBeepsEnabled = countdown !== 'false';
        settingsLoaded = true;
    } catch (e) {
        console.error('Error loading feedback settings:', e);
    }
}

/**
 * Save a feedback setting
 */
export async function setFeedbackSetting(
    key: 'sound' | 'haptics' | 'countdown',
    value: boolean
): Promise<void> {
    const storageKey = {
        sound: SETTINGS_KEYS.SOUND_ENABLED,
        haptics: SETTINGS_KEYS.HAPTICS_ENABLED,
        countdown: SETTINGS_KEYS.COUNTDOWN_BEEPS,
    }[key];

    await AsyncStorage.setItem(storageKey, value.toString());

    if (key === 'sound') soundEnabled = value;
    if (key === 'haptics') hapticsEnabled = value;
    if (key === 'countdown') countdownBeepsEnabled = value;
}

/**
 * Get current feedback settings
 */
export function getFeedbackSettings() {
    return {
        soundEnabled,
        hapticsEnabled,
        countdownBeepsEnabled,
    };
}

/**
 * Initialize audio - call once when workout starts
 */
export async function initAudio(): Promise<void> {
    if (!settingsLoaded) {
        await loadFeedbackSettings();
    }

    try {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
        });
    } catch (e) {
        console.error('Error initializing audio:', e);
    }
}

/**
 * Cleanup audio - call when workout ends
 */
export async function cleanupAudio(): Promise<void> {
    try {
        if (beepSound) {
            await beepSound.unloadAsync();
            beepSound = null;
        }
        if (completionSound) {
            await completionSound.unloadAsync();
            completionSound = null;
        }
    } catch (e) {
        console.error('Error cleaning up audio:', e);
    }
}

// ============================================
// HAPTIC FEEDBACK
// ============================================

/**
 * Light tap - for button presses
 */
export async function lightTap(): Promise<void> {
    if (!hapticsEnabled) return;
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) { }
}

/**
 * Medium tap - for step transitions
 */
export async function mediumTap(): Promise<void> {
    if (!hapticsEnabled) return;
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) { }
}

/**
 * Heavy tap - for important transitions
 */
export async function heavyTap(): Promise<void> {
    if (!hapticsEnabled) return;
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) { }
}

/**
 * Success notification - for completing exercises
 */
export async function successHaptic(): Promise<void> {
    if (!hapticsEnabled) return;
    try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) { }
}

/**
 * Warning notification - for countdown alerts
 */
export async function warningHaptic(): Promise<void> {
    if (!hapticsEnabled) return;
    try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) { }
}

/**
 * Completion burst - multiple vibrations for workout complete
 */
export async function completionBurst(): Promise<void> {
    if (!hapticsEnabled) return;
    try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await new Promise(r => setTimeout(r, 150));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await new Promise(r => setTimeout(r, 150));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) { }
}

// ============================================
// AUDIO FEEDBACK (using simple tones)
// ============================================

/**
 * Play a beep sound for countdown
 * Uses different frequencies for different counts
 */
export async function playCountdownBeep(count: number): Promise<void> {
    if (!soundEnabled || !countdownBeepsEnabled) return;

    try {
        // Use haptics as audio feedback since we can't easily generate tones
        // This creates a distinct pattern for countdown
        if (count === 3) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (count === 2) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (count === 1) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (count === 0) {
            // Final beep - double tap
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
    } catch (e) { }
}

/**
 * Play transition sound when moving to next exercise
 */
export async function playTransitionSound(): Promise<void> {
    if (!soundEnabled) return;

    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) { }
}

/**
 * Play completion sound when workout finishes
 */
export async function playCompletionSound(): Promise<void> {
    if (!soundEnabled) return;

    try {
        await completionBurst();
    } catch (e) { }
}

// ============================================
// COMBINED FEEDBACK EVENTS
// ============================================

/**
 * Called when exercise/step changes
 */
export async function onStepTransition(): Promise<void> {
    await Promise.all([
        mediumTap(),
        playTransitionSound(),
    ]);
}

/**
 * Called for countdown (3, 2, 1...)
 */
export async function onCountdown(secondsLeft: number): Promise<void> {
    if (secondsLeft <= 3 && secondsLeft > 0) {
        await playCountdownBeep(secondsLeft);
    } else if (secondsLeft === 0) {
        await playCountdownBeep(0);
    }
}

/**
 * Called when a block/round completes
 */
export async function onBlockComplete(): Promise<void> {
    await Promise.all([
        heavyTap(),
    ]);
}

/**
 * Called when entire workout completes
 */
export async function onWorkoutComplete(): Promise<void> {
    await Promise.all([
        playCompletionSound(),
    ]);
}

/**
 * Called when user manually advances (button press)
 */
export async function onManualAdvance(): Promise<void> {
    await successHaptic();
}

/**
 * Called when user goes back
 */
export async function onGoBack(): Promise<void> {
    await lightTap();
}

/**
 * Called when pausing/resuming
 */
export async function onPauseToggle(): Promise<void> {
    await lightTap();
}

