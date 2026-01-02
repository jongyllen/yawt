import { cacheDirectory, writeAsStringAsync, readAsStringAsync } from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { initDatabase, getFullBackup, restoreFullBackup } from '../db/database';
import { getStoredUserId, getGoogleAccessToken } from './auth';

const CLOUD_SYNC_ENABLED_KEY = 'cloud_sync_enabled';
const LAST_SYNC_TIME_KEY = 'last_sync_time';
const BACKUP_FILENAME = 'yawt_backup.json';

// Dynamic import helper to avoid crashes in Expo Go
function getCloudStorage() {
    try {
        return require('react-native-cloud-storage').CloudStorage;
    } catch (e) {
        return null;
    }
}

async function getStorageInstance() {
    const CloudStorage = getCloudStorage();
    if (!CloudStorage) return null;

    if (Platform.OS === 'android') {
        try {
            const { GoogleDriveAccessory } = require('react-native-cloud-storage');
            const accessToken = await getGoogleAccessToken();
            if (accessToken) {
                CloudStorage.setAccessory(new GoogleDriveAccessory({
                    accessToken,
                    scope: 'appDataFolder'
                }));
            }
        } catch (e) {
            console.warn('Google Drive accessory failed to initialize', e);
        }
    }
    return CloudStorage;
}

export async function isCloudSyncEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(CLOUD_SYNC_ENABLED_KEY);
    const userId = await getStoredUserId();
    return enabled === 'true' && !!userId;
}

export async function setCloudSyncEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(CLOUD_SYNC_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function uploadToCloud(): Promise<void> {
    try {
        if (!(await isCloudSyncEnabled())) return;

        const storage = await getStorageInstance();
        if (!storage) return;

        const db = await initDatabase();
        const backup = await getFullBackup(db);

        // Add timestamp to backup
        backup.updatedAt = new Date().toISOString();

        // Add settings to backup
        backup.settings = {
            user_name: await AsyncStorage.getItem('user_name'),
            registry_repo: await AsyncStorage.getItem('registry_repo'),
            registry_branch: await AsyncStorage.getItem('registry_branch'),
            notifications_enabled: await AsyncStorage.getItem('notifications_enabled') === 'true',
            reminder_time: await AsyncStorage.getItem('reminder_time'),
            haptics_enabled: await AsyncStorage.getItem('haptics_enabled') !== 'false',
            countdown_beeps_enabled: await AsyncStorage.getItem('countdown_beeps_enabled') !== 'false',
        };

        const backupString = JSON.stringify(backup);
        await storage.writeFile(`/${BACKUP_FILENAME}`, backupString);

        await AsyncStorage.setItem(LAST_SYNC_TIME_KEY, backup.updatedAt);
        console.log(`Successfully uploaded backup to ${Platform.OS === 'ios' ? 'iCloud' : 'Google Drive'} at`, backup.updatedAt);
    } catch (e) {
        console.error('Error uploading to cloud:', e);
    }
}

export async function downloadFromCloud(): Promise<boolean> {
    try {
        if (!(await isCloudSyncEnabled())) return false;

        const storage = await getStorageInstance();
        if (!storage) return false;

        const exists = await storage.exists(`/${BACKUP_FILENAME}`);
        if (!exists) {
            console.log('No backup found in cloud');
            return false;
        }

        const content = await storage.readFile(`/${BACKUP_FILENAME}`);
        const backup = JSON.parse(content);

        const db = await initDatabase();
        await restoreFullBackup(db, backup);

        if (backup.updatedAt) {
            await AsyncStorage.setItem(LAST_SYNC_TIME_KEY, backup.updatedAt);
        }

        if (backup.settings) {
            await applyRestoreSettings(backup.settings);
        }

        console.log(`Successfully downloaded and restored backup from ${Platform.OS === 'ios' ? 'iCloud' : 'Google Drive'}`);
        return true;
    } catch (e) {
        console.error('Error downloading from cloud:', e);
        return false;
    }
}

export async function syncIfNewer(): Promise<void> {
    try {
        if (!(await isCloudSyncEnabled())) return;

        const storage = await getStorageInstance();
        if (!storage) return;

        const exists = await storage.exists(`/${BACKUP_FILENAME}`);
        if (!exists) return;

        const content = await storage.readFile(`/${BACKUP_FILENAME}`);
        const cloudBackup = JSON.parse(content);

        const lastLocalSync = await AsyncStorage.getItem(LAST_SYNC_TIME_KEY);

        if (!lastLocalSync || (cloudBackup.updatedAt && new Date(cloudBackup.updatedAt) > new Date(lastLocalSync))) {
            console.log('Cloud backup is newer, restoring...');
            const db = await initDatabase();
            await restoreFullBackup(db, cloudBackup);
            await AsyncStorage.setItem(LAST_SYNC_TIME_KEY, cloudBackup.updatedAt);

            if (cloudBackup.settings) {
                await applyRestoreSettings(cloudBackup.settings);
            }
        } else {
            console.log('Local data is up to date with cloud');
        }
    } catch (e) {
        console.error('Error during syncIfNewer:', e);
    }
}

async function applyRestoreSettings(s: any) {
    if (s.user_name) await AsyncStorage.setItem('user_name', s.user_name);
    if (s.registry_repo) await AsyncStorage.setItem('registry_repo', s.registry_repo);
    if (s.registry_branch) await AsyncStorage.setItem('registry_branch', s.registry_branch);
    if (s.notifications_enabled !== undefined) await AsyncStorage.setItem('notifications_enabled', s.notifications_enabled.toString());
    if (s.reminder_time) await AsyncStorage.setItem('reminder_time', s.reminder_time);
    if (s.haptics_enabled !== undefined) await AsyncStorage.setItem('haptics_enabled', s.haptics_enabled.toString());
    if (s.countdown_beeps_enabled !== undefined) await AsyncStorage.setItem('countdown_beeps_enabled', s.countdown_beeps_enabled.toString());
}
