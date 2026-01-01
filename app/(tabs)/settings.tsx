import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { initDatabase, clearAllLogs, clearAllPrograms, saveProgram } from '../../src/db/database';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from '../../src/utils/notifications';
import { Switch, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import pushups50 from '../../assets/programs/pushups_50.json';
import calisthenics28 from '../../assets/programs/calisthenics_28.json';
import hamstringStretch from '../../assets/programs/hamstring_stretch.json';
import yogaMobility from '../../assets/programs/yoga_mobility.json';

export default function SettingsScreen() {
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
    const [reminderTime, setReminderTime] = React.useState(new Date(new Date().setHours(9, 0, 0, 0)));
    const [showTimePicker, setShowTimePicker] = React.useState(false);
    const [userName, setUserName] = React.useState('');
    const [registryRepo, setRegistryRepo] = React.useState('jongyllen/yawt-workouts');
    const [registryBranch, setRegistryBranch] = React.useState('main');

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
        if (value) {
            const granted = await Notifications.requestNotificationPermissions();
            if (!granted) {
                Alert.alert('Permission Denied', 'Please enable notifications in your system settings.');
                return;
            }
            await Notifications.scheduleDailyWorkoutReminder(reminderTime.getHours(), reminderTime.getMinutes());
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

    const handleResetAll = async () => {
        Alert.alert(
            'Full Reset',
            'This will delete ALL programs and progress, then reload default programs. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset Everything',
                    style: 'destructive',
                    onPress: async () => {
                        const db = await initDatabase();
                        await clearAllLogs(db);
                        await clearAllPrograms(db);

                        // Reload defaults
                        const defaults = [
                            pushups50,
                            calisthenics28,
                            hamstringStretch,
                            yogaMobility
                        ];
                        for (const p of defaults) {
                            await saveProgram(db, p as any);
                        }

                        Alert.alert('Success', 'Everything has been reset and default programs reloaded.');
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
});
