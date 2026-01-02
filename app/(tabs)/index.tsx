import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { Play, Check, Flame } from 'lucide-react-native';
import { initDatabase, getWorkoutLogs, getActivePrograms, getProgramById, getNextWorkoutForProgram } from '../../src/db/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Program, Workout, WorkoutLog } from '../../src/schemas/schema';
import { calculateStreak, workedOutToday } from '../../src/utils/streak';
import { saveWidgetData } from '../../src/utils/widgetData';
import * as CloudSync from '../../src/utils/cloudSync';

export default function TodayScreen() {
    const router = useRouter();
    const [activeSessions, setActiveSessions] = useState<{
        program: Program;
        activeProgram: any;
        nextSession: {
            workout: Workout;
            weekNumber?: number;
            dayNumber?: number
        }
    }[]>([]);
    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [userName, setUserName] = useState('');
    const [streak, setStreak] = useState({ current: 0, longest: 0 });
    const [completedToday, setCompletedToday] = useState(false);

    const loadData = useCallback(async () => {
        const db = await initDatabase();
        const activePrograms = await getActivePrograms(db);
        const workoutLogs = await getWorkoutLogs(db);
        setLogs(workoutLogs);
        setStreak(calculateStreak(workoutLogs));
        setCompletedToday(workedOutToday(workoutLogs));

        const currentSessions = [];
        for (const ap of activePrograms) {
            const program = await getProgramById(db, ap.programId);
            if (program) {
                const next = await getNextWorkoutForProgram(db, program);
                if (next) {
                    currentSessions.push({ program, activeProgram: ap, nextSession: next });
                }
            }
        }
        setActiveSessions(currentSessions);

        const name = await AsyncStorage.getItem('user_name');
        setUserName(name || '');

        // Update widget data
        const streakData = calculateStreak(workoutLogs);
        const firstSession = currentSessions[0];
        saveWidgetData({
            currentStreak: streakData.current,
            longestStreak: streakData.longest,
            nextWorkoutName: firstSession?.nextSession.workout.name || null,
            nextProgramName: firstSession?.program.name || null,
            nextWorkoutId: firstSession?.nextSession.workout.id || null,
            nextProgramId: firstSession?.program.id || null,
            workedOutToday: workedOutToday(workoutLogs),
            lastUpdated: new Date().toISOString(),
        });

        // Sync with cloud if enabled
        await CloudSync.syncIfNewer();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerRow}>
                <View style={{ flex: 1, marginRight: Spacing.md }}>
                    <Text style={Typography.h1} numberOfLines={1} ellipsizeMode="tail">
                        {userName ? `Hello, ${userName}` : 'Today'}
                    </Text>
                </View>
                <View style={[styles.streakBadge, streak.current > 0 && styles.streakBadgeActive]}>
                    <Flame
                        color={streak.current > 0 ? Colors.warning : Colors.textTertiary}
                        size={20}
                        fill={streak.current > 0 ? Colors.warning : 'transparent'}
                    />
                    <Text style={[styles.streakNumber, streak.current > 0 && styles.streakNumberActive]}>
                        {streak.current}
                    </Text>
                </View>
            </View>

            {streak.current > 0 && (
                <View style={styles.streakCard}>
                    <View style={styles.streakMain}>
                        <Flame color={Colors.warning} size={32} fill={Colors.warning} />
                        <View style={styles.streakInfo}>
                            <Text style={styles.streakLabel}>
                                {streak.current === 1 ? 'Day streak' : 'Day streak'}
                            </Text>
                            <Text style={styles.streakValue}>{streak.current}</Text>
                        </View>
                    </View>
                    <View style={styles.streakMeta}>
                        {completedToday ? (
                            <View style={styles.completedBadge}>
                                <Check color={Colors.success} size={14} />
                                <Text style={styles.completedText}>Done today</Text>
                            </View>
                        ) : (
                            <Text style={styles.keepGoingText}>Keep it going!</Text>
                        )}
                        {streak.longest > streak.current && (
                            <Text style={styles.bestText}>Best: {streak.longest}</Text>
                        )}
                    </View>
                </View>
            )}

            {activeSessions.length > 0 ? (
                <View style={styles.section}>
                    <Text style={[Typography.h3, { marginBottom: Spacing.md }]}>Active Programs</Text>
                    {activeSessions.map((session, index) => (
                        <TouchableOpacity
                            key={`${session.program.id}-${index}`}
                            style={[styles.heroCard, { marginBottom: Spacing.md }]}
                            onPress={() => router.push({
                                pathname: '/workout/player',
                                params: {
                                    programId: session.program.id,
                                    workoutId: session.nextSession.workout.id,
                                    weekNumber: session.nextSession.weekNumber,
                                    dayNumber: session.nextSession.dayNumber
                                }
                            })}
                        >
                            <View style={styles.heroContent}>
                                <Text style={[Typography.h2, { color: Colors.background }]}>{session.nextSession.workout.name}</Text>
                                <Text style={[Typography.body, { color: 'rgba(0,0,0,0.6)', marginTop: Spacing.xs }]}>
                                    {session.program.name}
                                    {session.nextSession.weekNumber !== undefined ? ` • Week ${session.nextSession.weekNumber}` : ''}
                                    {session.nextSession.dayNumber !== undefined ? ` • Day ${session.nextSession.dayNumber}` : ''}
                                </Text>
                                <View style={styles.startButton}>
                                    <Play color={Colors.primary} size={24} fill={Colors.primary} />
                                    <Text style={styles.startText}>
                                        {session.activeProgram?.lastWorkoutId === session.nextSession.workout.id ? 'RESUME' : 'START NEXT'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <View style={styles.emptyHero}>
                    <Text style={Typography.bodySecondary}>No active programs yet.</Text>
                    <TouchableOpacity onPress={() => router.push('/programs')}>
                        <Text style={{ color: Colors.primary, marginTop: Spacing.sm }}>Browse programs</Text>
                    </TouchableOpacity>
                </View>
            )}

            {logs.length > 0 && (
                <View style={styles.section}>
                    <Text style={[Typography.h3, { marginBottom: Spacing.md }]}>Recent Activity</Text>
                    {logs.slice(0, 3).map((log, index) => (
                        <View key={log.id} style={styles.logCard}>
                            <View style={{ flex: 1 }}>
                                <Text style={Typography.h3}>{log.workoutName || 'Workout'}</Text>
                                <Text style={Typography.bodySecondary}>
                                    {log.programName || 'Program'}
                                    {log.weekNumber !== undefined ? ` • W${log.weekNumber}` : ''}
                                    {log.dayNumber !== undefined ? ` • D${log.dayNumber}` : ''}
                                    {` • ${new Date(log.date).toLocaleDateString()}`}
                                </Text>
                            </View>
                            <Check color={Colors.success} size={20} />
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 20,
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    streakBadgeActive: {
        borderColor: Colors.warning,
        backgroundColor: `${Colors.warning}15`,
    },
    streakNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textTertiary,
    },
    streakNumberActive: {
        color: Colors.warning,
    },
    streakCard: {
        marginTop: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: `${Colors.warning}40`,
        borderLeftWidth: 4,
        borderLeftColor: Colors.warning,
    },
    streakMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    streakInfo: {
        flex: 1,
    },
    streakLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    streakValue: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.warning,
    },
    streakMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.sm,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    completedText: {
        fontSize: 12,
        color: Colors.success,
        fontWeight: '600',
    },
    keepGoingText: {
        fontSize: 12,
        color: Colors.secondary,
        fontWeight: '600',
    },
    bestText: {
        fontSize: 12,
        color: Colors.textTertiary,
    },
    section: {
        marginTop: Spacing.xl,
    },
    heroCard: {
        backgroundColor: Colors.primary,
        borderRadius: 20,
        padding: Spacing.lg,
        minHeight: 180,
        justifyContent: 'center',
    },
    heroContent: {
        flex: 1,
        justifyContent: 'center',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: 99,
        marginTop: Spacing.lg,
    },
    startText: {
        fontWeight: '800',
        fontSize: 14,
        color: Colors.primary,
        marginLeft: Spacing.sm,
    },
    emptyHero: {
        marginTop: Spacing.xl,
        padding: Spacing.xxl,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    logCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: 12,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
});
