import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_SEEN_KEY = 'has_seen_welcome_v1';

/**
 * Check if the user has already seen the welcome onboarding
 */
export async function hasSeenWelcome(): Promise<boolean> {
    const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
    return seen === 'true';
}

/**
 * Mark the welcome onboarding as seen
 */
export async function setHasSeenWelcome(): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
}
