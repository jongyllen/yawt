import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { initDatabase, clearAllLogs, clearAllPrograms } from '../../src/db/database';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from '../../src/utils/notifications';
import * as Feedback from '../../src/utils/feedback';
import { Switch, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { documentDirectory, writeAsStringAsync, readAsStringAsync } from 'expo-file-system/legacy';
import { getFullBackup, restoreFullBackup } from '../../src/db/database';
import * as Health from '../../src/utils/health';
import * as Auth from '../../src/utils/auth';
import * as CloudSync from '../../src/utils/cloudSync';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Cloud, CloudOff, RefreshCw, User, LogIn } from 'lucide-react-native';

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
            const appleId = await Auth.getStoredUserId(); // Simple check for provider
            setCloudUser({
                id: userId,
                fullName: name,
                email: null,
                provider: Platform.OS === 'ios' ? 'apple' : 'google'
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
                        { text: 'System Settings', onPress: () => Notifications.openNotificationSettings() }
                    ]
                );
                return;
            }
            await Notifications.scheduleDailyWorkoutReminder(reminderTime.getHours(), reminderTime.getMinutes());
            Alert.alert('Reminder Set', `We will notify you daily at ${reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
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
                await Notifications.scheduleDailyWorkoutReminder(selectedDate.getHours(), selectedDate.getMinutes());
                await AsyncStorage.setItem('reminder_time', selectedDate.toISOString());
            }
        }
    };

    const confirmTime = async () => {
        setShowTimePicker(false);
        await AsyncStorage.setItem('reminder_time', reminderTime.toISOString());
        if (notificationsEnabled) {
            await Notifications.scheduleDailyWorkoutReminder(reminderTime.getHours(), reminderTime.getMinutes());
            Alert.alert('Reminder Set', `We will notify you daily at ${reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
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
                    }
                }
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
                                    await AsyncStorage.setItem('notifications_enabled', s.notifications_enabled.toString());
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
                                { text: 'OK', onPress: () => router.replace('/(tabs)') }
                            ]);
                        }
                    }
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
            Alert.alert('Sign In Required', `Please sign in with ${Platform.OS === 'ios' ? 'Apple' : 'Google'} to enable Cloud Sync.`);
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

                        Alert.alert('Success', 'Everything has been reset. Visit the Discover tab to import programs.');
                        router.replace('/(tabs)');
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={Typography.h1}>Settings</Text>

            <View style={styles.section}>
                <Text style={Typography.h3}>Profile</Text>
                <View style={styles.item}>
                    <Text style={[Typography.caption, { marginBottom: 4 }]}>Your Name</Text>
                    <TextInput
                        style={styles.input}
                        value={userName}
                        onChangeText={updateName}
                        placeholder="Enter your name"
                        placeholderTextColor={Colors.textTertiary}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={Typography.h3}>General</Text>
                <View style={[styles.item, styles.rowItem]}>
                    <View>
                        <Text style={Typography.body}>Daily Reminders</Text>
                        <Text style={Typography.caption}>Get notified about today's workout</Text>
                    </View>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={toggleNotifications}
                        trackColor={{ false: Colors.surface, true: Colors.primary }}
                        thumbColor={Colors.text}
                    />
                </View>


                {notificationsEnabled && (
                    <TouchableOpacity
                        style={[styles.item, styles.rowItem]}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <View>
                            <Text style={Typography.body}>Reminder Time</Text>
                            <Text style={Typography.caption}>When you'll be notified</Text>
                        </View>
                        <Text style={[Typography.body, { color: Colors.primary, fontWeight: 'bold' }]}>
                            {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>
                )}

                {showTimePicker && (
                    <View style={styles.timePickerContainer}>
                        <DateTimePicker
                            value={reminderTime}
                            mode="time"
                            is24Hour={true}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onTimeChange}
                        />
                        {Platform.OS === 'ios' && (
                            <TouchableOpacity style={styles.doneButton} onPress={confirmTime}>
                                <Text style={styles.doneButtonText}>Done</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {Platform.OS === 'ios' && (
                    <View style={[styles.item, styles.rowItem]}>
                        <View>
                            <Text style={Typography.body}>Sync with Apple Health</Text>
                            <Text style={Typography.caption}>Contribute to your Activity Rings</Text>
                        </View>
                        <Switch
                            value={healthEnabled}
                            onValueChange={async (value) => {
                                setHealthEnabled(value);
                                const result = await Health.setHealthSyncEnabled(value);
                                if (value && !result.success) {
                                    setHealthEnabled(false);
                                    Alert.alert(
                                        'HealthKit Error',
                                        result.error || 'Failed to initialize Apple Health. Please check your system settings.',
                                        [
                                            { text: 'OK' },
                                            { text: 'System Settings', onPress: () => { /* Logic to open settings if needed */ } }
                                        ]
                                    );
                                }
                            }}
                            trackColor={{ false: Colors.surface, true: Colors.primary }}
                            thumbColor={Colors.text}
                        />
                    </View>
                )}

            </View>

            <View style={styles.section}>
                <Text style={Typography.h3}>Workout Feedback</Text>
                <View style={[styles.item, styles.rowItem]}>
                    <View>
                        <Text style={Typography.body}>Haptic Feedback</Text>
                        <Text style={Typography.caption}>Vibration on transitions</Text>
                    </View>
                    <Switch
                        value={hapticsEnabled}
                        onValueChange={async (value) => {
                            setHapticsEnabled(value);
                            await Feedback.setFeedbackSetting('haptics', value);
                            if (value) Feedback.lightTap();
                        }}
                        trackColor={{ false: Colors.surface, true: Colors.primary }}
                        thumbColor={Colors.text}
                    />
                </View>
                <View style={[styles.item, styles.rowItem]}>
                    <View>
                        <Text style={Typography.body}>Countdown Alerts</Text>
                        <Text style={Typography.caption}>Vibrate at 3, 2, 1 seconds</Text>
                    </View>
                    <Switch
                        value={countdownBeepsEnabled}
                        onValueChange={async (value) => {
                            setCountdownBeepsEnabled(value);
                            await Feedback.setFeedbackSetting('countdown', value);
                        }}
                        trackColor={{ false: Colors.surface, true: Colors.primary }}
                        thumbColor={Colors.text}
                    />
                </View>
                <View style={[styles.item, styles.rowItem]}>
                    <View>
                        <Text style={Typography.body}>Auto-advance Timers</Text>
                        <Text style={Typography.caption}>Move to next step when timer ends</Text>
                    </View>
                    <Switch
                        value={autoPlayEnabled}
                        onValueChange={async (value) => {
                            setAutoPlayEnabled(value);
                            await Feedback.setFeedbackSetting('autoplay', value);
                        }}
                        trackColor={{ false: Colors.surface, true: Colors.primary }}
                        thumbColor={Colors.text}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={Typography.h3}>Discovery Registry</Text>
                <View style={styles.item}>
                    <Text style={[Typography.caption, { marginBottom: 4 }]}>GitHub Repository (org/repo)</Text>
                    <TextInput
                        style={styles.input}
                        value={registryRepo}
                        onChangeText={updateRegistryRepo}
                        placeholder="jongyllen/yawt-workouts"
                        placeholderTextColor={Colors.textTertiary}
                        autoCapitalize="none"
                    />
                </View>
                <View style={styles.item}>
                    <Text style={[Typography.caption, { marginBottom: 4 }]}>Branch</Text>
                    <TextInput
                        style={styles.input}
                        value={registryBranch}
                        onChangeText={updateRegistryBranch}
                        placeholder="main"
                        placeholderTextColor={Colors.textTertiary}
                        autoCapitalize="none"
                    />
                </View>
            </View>

            <View style={styles.section}>
                <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    <Text style={Typography.h3}>Cloud Sync</Text>
                    {isSyncing && <RefreshCw size={16} color={Colors.primary} style={styles.spinning} />}
                </View>

                {cloudUser ? (
                    <View style={styles.userCard}>
                        <View style={styles.userIcon}>
                            <User color={Colors.primary} size={24} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={Typography.body}>{cloudUser.fullName || 'User'}</Text>
                            <Text style={Typography.caption}>Signed in with {cloudUser.provider === 'apple' ? 'Apple' : 'Google'}</Text>
                        </View>
                        <TouchableOpacity onPress={async () => {
                            await Auth.signOut();
                            setCloudUser(null);
                            setCloudSyncEnabled(false);
                            await CloudSync.setCloudSyncEnabled(false);
                        }}>
                            <Text style={[Typography.caption, { color: Colors.error }]}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.signInContainer}>
                        {Platform.OS === 'ios' ? (
                            <AppleAuthentication.AppleAuthenticationButton
                                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                                cornerRadius={8}
                                style={{ width: '100%', height: 44 }}
                                onPress={handleAppleSignIn}
                            />
                        ) : (
                            <View style={{ width: '100%' }}>
                                <TouchableOpacity
                                    style={[styles.googleButton, !Auth.isGoogleAuthAvailable() && { opacity: 0.5 }]}
                                    onPress={handleGoogleSignIn}
                                    disabled={!Auth.isGoogleAuthAvailable()}
                                >
                                    <LogIn size={20} color={Colors.background} />
                                    <Text style={styles.googleButtonText}>Sign in with Google</Text>
                                </TouchableOpacity>
                                {!Auth.isGoogleAuthAvailable() && (
                                    <Text style={[Typography.caption, { color: Colors.warning, marginTop: Spacing.xs, textAlign: 'center' }]}>
                                        Google Sign-In requires a Development Client (Not supported in Expo Go).
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                )}

                <View style={[styles.item, styles.rowItem]}>
                    <View style={{ flex: 1 }}>
                        <Text style={Typography.body}>Automatic Cloud Sync</Text>
                        <Text style={Typography.caption}>
                            {lastSyncTime
                                ? `Last synced: ${new Date(lastSyncTime).toLocaleString()}`
                                : `Keep your data safe in ${Platform.OS === 'ios' ? 'iCloud' : 'Google Drive'}`}
                        </Text>
                    </View>
                    <Switch
                        value={cloudSyncEnabled}
                        onValueChange={toggleCloudSync}
                        trackColor={{ false: Colors.surface, true: Colors.primary }}
                        thumbColor={Colors.text}
                        disabled={!cloudUser}
                    />
                </View>

                {!cloudSyncEnabled && (
                    <>
                        <TouchableOpacity style={styles.item} onPress={handleExport}>
                            <Text style={Typography.body}>Export Backup</Text>
                            <Text style={Typography.caption}>Save your progress to a file</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.item} onPress={handleRestore}>
                            <Text style={Typography.body}>Restore Backup</Text>
                            <Text style={Typography.caption}>Load progress from a file</Text>
                        </TouchableOpacity>
                    </>
                )}

                {cloudSyncEnabled && (
                    <TouchableOpacity style={styles.item} onPress={handleManualSync} disabled={isSyncing}>
                        <Text style={[Typography.body, { color: Colors.primary }]}>Sync Now</Text>
                        <Text style={Typography.caption}>Force an immediate cloud update</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.section}>
                <Text style={[Typography.h3, { color: Colors.error }]}>Danger Zone</Text>
                <TouchableOpacity style={styles.dangerItem} onPress={handleResetLogs}>
                    <Text style={[Typography.body, { color: Colors.error }]}>Reset All Progress</Text>
                    <Text style={Typography.caption}>Logs and active programs will be deleted</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dangerItem} onPress={handleResetAll}>
                    <Text style={[Typography.body, { color: Colors.error }]}>Reset to Factory Defaults</Text>
                    <Text style={Typography.caption}>All programs and progress will be wiped</Text>
                </TouchableOpacity>
            </View>
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
    section: {
        marginTop: Spacing.xl,
    },
    sectionHeader: {
        marginBottom: Spacing.sm,
    },
    item: {
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    rowItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dangerItem: {
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    timePickerContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginTop: Spacing.md,
        padding: Spacing.sm,
    },
    doneButton: {
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    doneButtonText: {
        color: Colors.background,
        fontWeight: 'bold',
        fontSize: 16,
    },
    input: {
        color: Colors.text,
        fontSize: 16,
        paddingVertical: Spacing.xs,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: 12,
        marginTop: Spacing.md,
        gap: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    userIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: `${Colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    googleButton: {
        backgroundColor: Colors.text,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 44,
        borderRadius: 8,
        gap: Spacing.sm,
    },
    googleButtonText: {
        color: Colors.background,
        fontSize: 16,
        fontWeight: '600',
    },
    signInContainer: {
        marginTop: Spacing.md,
    },
    spinning: {
        // In a real app we'd use animated API here, but for now just the icon
    }
});
