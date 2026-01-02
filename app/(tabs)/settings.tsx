import React from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { initDatabase, clearAllLogs, clearAllPrograms } from '../../src/db/database';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from '../../src/utils/notifications';
import * as Feedback from '../../src/utils/feedback';
import { Platform } from 'react-native';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { documentDirectory, writeAsStringAsync, readAsStringAsync } from 'expo-file-system/legacy';
import { getFullBackup, restoreFullBackup } from '../../src/db/database';
import * as Health from '../../src/utils/health';
import * as Auth from '../../src/utils/auth';
import * as CloudSync from '../../src/utils/cloudSync';

// Sub-components
import { ProfileSection } from '../../src/components/settings/ProfileSection';
import { GeneralSection } from '../../src/components/settings/GeneralSection';
import { FeedbackSection } from '../../src/components/settings/FeedbackSection';
import { RegistrySection } from '../../src/components/settings/RegistrySection';
import { CloudSyncSection } from '../../src/components/settings/CloudSyncSection';
import { DangerZoneSection } from '../../src/components/settings/DangerZoneSection';

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [healthEnabled, setHealthEnabled] = React.useState(false);
  const [reminderTime, setReminderTime] = React.useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [userName, setUserName] = React.useState('');
  const [registryRepo, setRegistryRepo] = React.useState('jongyllen/yawt-workouts');
  const [registryBranch, setRegistryBranch] = React.useState('main');

  // Feedback settings
  const [hapticsEnabled, setHapticsEnabled] = React.useState(true);
  const [countdownBeepsEnabled, setCountdownBeepsEnabled] = React.useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = React.useState(false);

  // Cloud Sync state
  const [cloudSyncEnabled, setCloudSyncEnabled] = React.useState(false);
  const [cloudUser, setCloudUser] = React.useState<Auth.CloudUser | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSyncTime, setLastSyncTime] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const enabled = await AsyncStorage.getItem('notifications_enabled');
    setNotificationsEnabled(enabled === 'true');

    const savedTime = await AsyncStorage.getItem('reminder_time');
    if (savedTime) {
      setReminderTime(new Date(savedTime));
    }

    const name = await AsyncStorage.getItem('user_name');
    if (name) setUserName(name);

    const repo = await AsyncStorage.getItem('registry_repo');
    if (repo) setRegistryRepo(repo);

    const branch = await AsyncStorage.getItem('registry_branch');
    if (branch) setRegistryBranch(branch);

    const healthSync = await Health.isHealthSyncEnabled();
    setHealthEnabled(healthSync);

    // Load feedback settings
    await Feedback.loadFeedbackSettings();
    const feedbackSettings = Feedback.getFeedbackSettings();
    setHapticsEnabled(feedbackSettings.hapticsEnabled);
    setCountdownBeepsEnabled(feedbackSettings.countdownBeepsEnabled);
    setAutoPlayEnabled(feedbackSettings.autoPlayEnabled);

    // Load Cloud Sync settings
    const syncEnabled = await CloudSync.isCloudSyncEnabled();
    setCloudSyncEnabled(syncEnabled);

    const userId = await Auth.getStoredUserId();
    if (userId) {
      const name = await Auth.getStoredUserName();
      setCloudUser({
        id: userId,
        fullName: name,
        email: null,
        provider: Platform.OS === 'ios' ? 'apple' : 'google',
      });
    }

    const lastSync = await AsyncStorage.getItem('last_sync_time');
    setLastSyncTime(lastSync);
  };

  const updateName = async (name: string) => {
    setUserName(name);
    await AsyncStorage.setItem('user_name', name);
  };

  const updateRegistryRepo = async (repo: string) => {
    setRegistryRepo(repo);
    await AsyncStorage.setItem('registry_repo', repo);
  };

  const updateRegistryBranch = async (branch: string) => {
    setRegistryBranch(branch);
    await AsyncStorage.setItem('registry_branch', branch);
  };

  const toggleNotifications = async (value: boolean) => {
    if (!Notifications.isNotificationAvailable()) {
      Alert.alert(
        'Not Supported',
        'Notifications are not supported in Expo Go on Android SDK 53+. Please use a Development Client to enable this feature.'
      );
      return;
    }

    if (value) {
      const granted = await Notifications.requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Denied',
          'Notifications are disabled for this app. Please enable them in your system settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'System Settings', onPress: () => Notifications.openNotificationSettings() },
          ]
        );
        return;
      }
      await Notifications.scheduleDailyWorkoutReminder(
        reminderTime.getHours(),
        reminderTime.getMinutes()
      );
      Alert.alert(
        'Reminder Set',
        `We will notify you daily at ${reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      );
    } else {
      await Notifications.cancelAllReminders();
    }
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', value.toString());
  };

  const onTimeChange = async (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (selectedDate) {
      setReminderTime(selectedDate);
      if (Platform.OS === 'android' && notificationsEnabled) {
        await Notifications.scheduleDailyWorkoutReminder(
          selectedDate.getHours(),
          selectedDate.getMinutes()
        );
        await AsyncStorage.setItem('reminder_time', selectedDate.toISOString());
      }
    }
  };

  const confirmTime = async () => {
    setShowTimePicker(false);
    await AsyncStorage.setItem('reminder_time', reminderTime.toISOString());
    if (notificationsEnabled) {
      await Notifications.scheduleDailyWorkoutReminder(
        reminderTime.getHours(),
        reminderTime.getMinutes()
      );
      Alert.alert(
        'Reminder Set',
        `We will notify you daily at ${reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      );
    }
  };

  const handleResetLogs = async () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to delete all workout logs and active programs? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const db = await initDatabase();
            await clearAllLogs(db);
            Alert.alert('Success', 'All progress has been reset.');
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    try {
      const db = await initDatabase();
      const backup = await getFullBackup(db);

      // Add AsyncStorage settings to backup
      backup.settings = {
        user_name: userName,
        registry_repo: registryRepo,
        registry_branch: registryBranch,
        notifications_enabled: notificationsEnabled,
        reminder_time: reminderTime.toISOString(),
        haptics_enabled: hapticsEnabled,
        countdown_beeps_enabled: countdownBeepsEnabled,
      };

      const fileName = `yawt_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = documentDirectory + fileName;

      await writeAsStringAsync(fileUri, JSON.stringify(backup, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Sharing Unavailable', 'Your device does not support sharing files.');
      }
    } catch (e) {
      console.error('Export error:', e);
      Alert.alert('Error', 'Failed to create backup.');
    }
  };

  const handleRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileContent = await readAsStringAsync(result.assets[0].uri);
      const backup = JSON.parse(fileContent);

      if (backup.version !== 'yawt.backup.v1') {
        Alert.alert('Invalid Backup', 'The selected file is not a valid YAWT backup.');
        return;
      }

      Alert.alert(
        'Restore Backup',
        'This will replace ALL current data with the contents of the backup. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            onPress: async () => {
              const db = await initDatabase();
              await restoreFullBackup(db, backup);

              // Restore settings
              if (backup.settings) {
                const s = backup.settings;
                if (s.user_name) await updateName(s.user_name);
                if (s.registry_repo) await updateRegistryRepo(s.registry_repo);
                if (s.registry_branch) await updateRegistryBranch(s.registry_branch);
                if (s.notifications_enabled !== undefined) {
                  setNotificationsEnabled(s.notifications_enabled);
                  await AsyncStorage.setItem(
                    'notifications_enabled',
                    s.notifications_enabled.toString()
                  );
                }
                if (s.reminder_time) {
                  setReminderTime(new Date(s.reminder_time));
                  await AsyncStorage.setItem('reminder_time', s.reminder_time);
                }
                if (s.haptics_enabled !== undefined) {
                  setHapticsEnabled(s.haptics_enabled);
                  await Feedback.setFeedbackSetting('haptics', s.haptics_enabled);
                }
                if (s.countdown_beeps_enabled !== undefined) {
                  setCountdownBeepsEnabled(s.countdown_beeps_enabled);
                  await Feedback.setFeedbackSetting('countdown', s.countdown_beeps_enabled);
                }
              }

              Alert.alert('Success', 'Progress restored successfully.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') },
              ]);
            },
          },
        ]
      );
    } catch (e) {
      console.error('Restore error:', e);
      Alert.alert('Error', 'Failed to restore backup. Make sure it is a valid YAWT JSON file.');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const user = await Auth.signInWithApple();
      if (user) {
        setCloudUser(user);
        const enabled = await CloudSync.isCloudSyncEnabled();
        setCloudSyncEnabled(enabled);
      }
    } catch (e) {
      console.error('SiWA error:', e);
      Alert.alert('Error', 'Failed to sign in with Apple.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const user = await Auth.signInWithGoogle();
      if (user) {
        setCloudUser(user);
        const enabled = await CloudSync.isCloudSyncEnabled();
        setCloudSyncEnabled(enabled);
      }
    } catch (e) {
      console.error('Google Sign-In error:', e);
      Alert.alert('Error', 'Failed to sign in with Google.');
    }
  };

  const toggleCloudSync = async (value: boolean) => {
    if (value && !cloudUser) {
      Alert.alert(
        'Sign In Required',
        `Please sign in with ${Platform.OS === 'ios' ? 'Apple' : 'Google'} to enable Cloud Sync.`
      );
      return;
    }
    setCloudSyncEnabled(value);
    await CloudSync.setCloudSyncEnabled(value);

    if (value) {
      handleManualSync();
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await CloudSync.syncIfNewer();
      await CloudSync.uploadToCloud();
      const lastSync = await AsyncStorage.getItem('last_sync_time');
      setLastSyncTime(lastSync);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetAll = async () => {
    Alert.alert(
      'Full Reset',
      'This will delete ALL programs and progress. You can import new programs from the Discover tab. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            const db = await initDatabase();
            await clearAllLogs(db);
            await clearAllPrograms(db);

            Alert.alert(
              'Success',
              'Everything has been reset. Visit the Discover tab to import programs.'
            );
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={Typography.h1}>Settings</Text>

      <ProfileSection userName={userName} updateName={updateName} />

      <GeneralSection
        notificationsEnabled={notificationsEnabled}
        toggleNotifications={toggleNotifications}
        reminderTime={reminderTime}
        showTimePicker={showTimePicker}
        setShowTimePicker={setShowTimePicker}
        onTimeChange={onTimeChange}
        confirmTime={confirmTime}
        healthEnabled={healthEnabled}
        setHealthEnabled={setHealthEnabled}
      />

      <FeedbackSection
        hapticsEnabled={hapticsEnabled}
        setHapticsEnabled={setHapticsEnabled}
        countdownBeepsEnabled={countdownBeepsEnabled}
        setCountdownBeepsEnabled={setCountdownBeepsEnabled}
        autoPlayEnabled={autoPlayEnabled}
        setAutoPlayEnabled={setAutoPlayEnabled}
      />

      <RegistrySection
        registryRepo={registryRepo}
        updateRegistryRepo={updateRegistryRepo}
        registryBranch={registryBranch}
        updateRegistryBranch={updateRegistryBranch}
      />

      <CloudSyncSection
        cloudUser={cloudUser}
        setCloudUser={setCloudUser}
        isSyncing={isSyncing}
        cloudSyncEnabled={cloudSyncEnabled}
        setCloudSyncEnabled={setCloudSyncEnabled}
        toggleCloudSync={toggleCloudSync}
        lastSyncTime={lastSyncTime}
        handleManualSync={handleManualSync}
        handleExport={handleExport}
        handleRestore={handleRestore}
        handleAppleSignIn={handleAppleSignIn}
        handleGoogleSignIn={handleGoogleSignIn}
      />

      <DangerZoneSection handleResetLogs={handleResetLogs} handleResetAll={handleResetAll} />

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
});
