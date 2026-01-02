import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Defensive requires for native modules to avoid crashes in Expo Go
const getGoogleSignIn = () => {
  // Silently skip in Expo Go on Android to avoid fatal native module error
  if (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient') {
    return null;
  }

  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    return GoogleSignin;
  } catch (e) {
    return null;
  }
};

export function isGoogleAuthAvailable(): boolean {
  return getGoogleSignIn() !== null;
}

async function configureGoogleSignIn() {
  const GoogleSignin = getGoogleSignIn();
  if (!GoogleSignin) return;

  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.appdata'],
    offlineAccess: true,
  });
}

const APPLE_USER_ID_KEY = 'apple_user_id';
const APPLE_USER_NAME_KEY = 'apple_user_name';
const GOOGLE_USER_ID_KEY = 'google_user_id';
const GOOGLE_USER_NAME_KEY = 'google_user_name';
const GOOGLE_ACCESS_TOKEN_KEY = 'google_access_token';

export interface CloudUser {
  id: string;
  fullName: string | null;
  email: string | null;
  provider: 'apple' | 'google';
}

export async function signInWithApple(): Promise<CloudUser | null> {
  if (Platform.OS !== 'ios') return null;

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Store user ID for future credential state checks
    await SecureStore.setItemAsync(APPLE_USER_ID_KEY, credential.user);

    // Name is only provided on the first sign in
    if (credential.fullName) {
      const name =
        `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim();
      if (name) {
        await SecureStore.setItemAsync(APPLE_USER_NAME_KEY, name);
      }
    }

    return {
      id: credential.user,
      fullName: credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : null,
      email: credential.email,
      provider: 'apple',
    };
  } catch (e: any) {
    if (e.code === 'ERR_CANCELED' || e.code === '1001') {
      // 1001 is Apple's cancel code
      return null;
    }
    throw e;
  }
}

export async function signInWithGoogle(): Promise<CloudUser | null> {
  const GoogleSignin = getGoogleSignIn();
  if (!GoogleSignin) return null;

  try {
    await configureGoogleSignIn();
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    // On Android, we need the access token for Drive access
    const tokens = await GoogleSignin.getTokens();
    if (tokens.accessToken) {
      await SecureStore.setItemAsync(GOOGLE_ACCESS_TOKEN_KEY, tokens.accessToken);
    }

    const userId = userInfo.user.id;
    const name = userInfo.user.name;

    await SecureStore.setItemAsync(GOOGLE_USER_ID_KEY, userId);
    if (name) await SecureStore.setItemAsync(GOOGLE_USER_NAME_KEY, name);

    return {
      id: userId,
      fullName: name,
      email: userInfo.user.email,
      provider: 'google',
    };
  } catch (e: any) {
    // Handle cancel
    return null;
  }
}

export async function getAppleAuthStatus(): Promise<AppleAuthentication.AppleAuthenticationCredentialState> {
  if (Platform.OS !== 'ios')
    return AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND;

  const userIdentifier = await SecureStore.getItemAsync(APPLE_USER_ID_KEY);
  if (!userIdentifier) return AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND;

  try {
    return await AppleAuthentication.getCredentialStateAsync(userIdentifier);
  } catch (e) {
    return AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND;
  }
}

export async function getStoredUserId(): Promise<string | null> {
  return (
    (await SecureStore.getItemAsync(APPLE_USER_ID_KEY)) ||
    (await SecureStore.getItemAsync(GOOGLE_USER_ID_KEY))
  );
}

export async function getStoredUserName(): Promise<string | null> {
  return (
    (await SecureStore.getItemAsync(APPLE_USER_NAME_KEY)) ||
    (await SecureStore.getItemAsync(GOOGLE_USER_NAME_KEY))
  );
}

export async function getGoogleAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(GOOGLE_ACCESS_TOKEN_KEY);
}

export async function signOut(): Promise<void> {
  await SecureStore.deleteItemAsync(APPLE_USER_ID_KEY);
  await SecureStore.deleteItemAsync(APPLE_USER_NAME_KEY);
  await SecureStore.deleteItemAsync(GOOGLE_USER_ID_KEY);
  await SecureStore.deleteItemAsync(GOOGLE_USER_NAME_KEY);
  await SecureStore.deleteItemAsync(GOOGLE_ACCESS_TOKEN_KEY);

  const GoogleSignin = getGoogleSignIn();
  if (GoogleSignin) {
    try {
      await GoogleSignin.signOut();
    } catch (e) {}
  }
}

export function isAppleAuthAvailable(): Promise<boolean> {
  return AppleAuthentication.isAvailableAsync();
}
