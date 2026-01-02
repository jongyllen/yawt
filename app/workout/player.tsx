import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { Program, Workout } from '../../src/schemas/schema';
import { getProgramById, initDatabase, saveWorkoutLog, getActiveProgramByProgramId, updateActiveProgram, startProgram } from '../../src/db/database';
import { X, Play, Pause, SkipForward, SkipBack, Check } from 'lucide-react-native';
import { useWorkoutPlayer } from '../../src/hooks/useWorkoutPlayer';
import * as Feedback from '../../src/utils/feedback';
import * as Health from '../../src/utils/health';

export default function WorkoutPlayer() {
    const { programId, workoutId, weekNumber, dayNumber } = useLocalSearchParams();
    const router = useRouter();

    const [program, setProgram] = useState<Program | null>(null);
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [resumed, setResumed] = useState(false);
    const [startTime] = useState(new Date().toISOString());
    const [initialIndexes, setInitialIndexes] = useState<{ blockIndex: number; stepIndex: number; round: number } | undefined>();

    const finishWorkout = useCallback(async () => {
        if (!workout) return;
        const endTime = new Date().toISOString();
        const durationSeconds = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);

        const db = await initDatabase();
        await saveWorkoutLog(db, {
            id: Math.random().toString(36).substring(7),
            workoutId: workoutId as string,
            programId: programId as string,
            workoutName: workout.name,
            programName: program?.name,
            date: endTime,
            durationSeconds: durationSeconds,
            completedSteps: [],
            weekNumber: weekNumber ? parseInt(weekNumber as string) : undefined,
            dayNumber: dayNumber ? parseInt(dayNumber as string) : undefined,
        });

        // Sync to Apple Health
        await Health.saveWorkoutToHealth({
            startDate: startTime,
            endDate: endTime,
            durationSeconds,
            workoutName: workout.name
        });

        router.replace('/(tabs)');
    }, [workout, program, workoutId, programId, weekNumber, dayNumber, router, startTime]);

    const player = useWorkoutPlayer({
        workout,
        initialIndexes,
    });

    const saveForLater = async () => {
        const db = await initDatabase();
        if (programId) {
            let active = await getActiveProgramByProgramId(db, programId as string);
            if (!active) {
                // If not already active, we make it active!
                active = await startProgram(db, programId as string);
            }

            if (active) {
                active.lastBlockIndex = player.currentBlockIndex;
                active.lastStepIndex = player.currentStepIndex;
                active.lastRound = player.currentRound;
                active.lastWorkoutId = workoutId as string;
                await updateActiveProgram(db, active);
            }
        }
        router.replace('/(tabs)');
    };

    const finishEarly = () => {
        player.setIsPaused(true);
        Alert.alert(
            'End Session?',
            'How would you like to exit?',
            [
                { text: 'Resume Later (Save)', onPress: saveForLater },
                { text: 'Finish Early (Log)', style: 'default', onPress: () => player.setIsFinished(true) },
                { text: 'Keep Going', style: 'cancel', onPress: () => player.setIsPaused(false) }
            ]
        );
    };

    useEffect(() => {
        loadWorkout();
    }, []);

    const loadWorkout = async () => {
        const db = await initDatabase();
        const p = await getProgramById(db, programId as string);
        if (p) {
            setProgram(p);
            const w = p.workouts.find(w => w.id === workoutId);
            if (w) {
                setWorkout(w);
                const active = await getActiveProgramByProgramId(db, programId as string);
                if (active && active.lastWorkoutId === workoutId && active.lastBlockIndex !== undefined && !resumed) {
                    Alert.alert(
                        'Resume Workout?',
                        'Would you like to continue where you left off?',
                        [
                            { text: 'Start Over', style: 'destructive', onPress: () => setResumed(true) },
                            {
                                text: 'Resume', onPress: () => {
                                    setInitialIndexes({
                                        blockIndex: active.lastBlockIndex!,
                                        stepIndex: active.lastStepIndex || 0,
                                        round: active.lastRound || 1
                                    });
                                    setResumed(true);
                                }
                            }
                        ]
                    );
                } else {
                    setResumed(true);
                }
            }
        }
    };

    const handleAbort = () => {
        player.setIsPaused(true);
        Alert.alert(
            'Discard Workout?',
            'Progress from this session will be lost.',
            [
                { text: 'Keep Going', style: 'cancel', onPress: () => player.setIsPaused(false) },
                { text: 'Discard & Exit', style: 'destructive', onPress: () => router.replace('/(tabs)') }
            ]
        );
    };

    const [showInstructions, setShowInstructions] = useState(false);

    if (!workout || !player.currentBlock || !player.currentStep) {
        return <View style={styles.container}><Text style={Typography.body}>Loading...</Text></View>;
    }

    if (player.isFinished) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={{ width: 28 }} />
                    <Text style={Typography.h3}>Summary</Text>
                    <View style={{ width: 28 }} />
                </View>
                <View style={styles.mainContent}>
                    <View style={styles.completionIconContainer}>
                        <Check color={Colors.primary} size={60} />
                    </View>
                    <Text style={[Typography.h1, { marginTop: Spacing.xl, textAlign: 'center' }]}>Workout Complete!</Text>
                    <Text style={[Typography.bodySecondary, { marginTop: Spacing.sm, textAlign: 'center' }]}>
                        You crushed {workout.name}
                    </Text>

                    <TouchableOpacity
                        style={styles.finishButton}
                        onPress={finishWorkout}
                    >
                        <Text style={styles.finishButtonText}>FINISH & SAVE</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleAbort}>
                    <X color={Colors.text} size={28} />
                </TouchableOpacity>
                <Text style={Typography.h3}>{workout.name}</Text>
                <TouchableOpacity
                    onPress={() => {
                        if (player.isLastStep) {
                            player.handleNext();
                        } else {
                            finishEarly();
                        }
                    }}
                    disabled={player.isFinished}
                >
                    <Check color={player.isLastStep ? Colors.primary : Colors.success} size={28} />
                </TouchableOpacity>
            </View>

            <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${player.getProgress() * 100}%` }]} />
            </View>

            <View style={styles.progressContainer}>
                <Text style={styles.blockText}>
                    {player.currentBlockIndex + 1}/{workout.blocks.length} • {player.currentBlock.name.toUpperCase()}
                </Text>
                {player.currentBlock.rounds > 1 && (
                    <View style={styles.roundIndicator}>
                        {Array.from({ length: player.currentBlock.rounds }).map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.roundDot,
                                    i + 1 === player.currentRound ? styles.roundDotActive : styles.roundDotInactive
                                ]}
                            />
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.mainContent}>
                <Text style={[Typography.h2, { textAlign: 'center', color: Colors.textSecondary }]}>
                    {player.currentStep.name ?? 'Rest'}
                </Text>

                {player.currentStep.description && (
                    <Text style={[Typography.caption, { textAlign: 'center', color: Colors.primary, marginTop: Spacing.xs }]}>
                        {player.currentStep.description.toUpperCase()}
                    </Text>
                )}

                {player.currentStep.cues && player.currentStep.cues.length > 0 && (
                    <View style={styles.cueContainer}>
                        {player.currentStep.cues.map((cue, idx) => (
                            <View key={idx} style={styles.cueBadge}>
                                <Text style={styles.cueText}>{cue.toUpperCase()}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {player.timeLeft !== null ? (
                    <Text style={styles.timerText}>{player.timeLeft}</Text>
                ) : (
                    <View style={styles.repContainer}>
                        <Text style={styles.repText}>{player.currentStep.reps ?? 'Hold'}</Text>
                        <Text style={Typography.bodySecondary}>REPS</Text>
                    </View>
                )}

                {player.currentStep.instructions && (
                    <View style={styles.instructionContainer}>
                        <TouchableOpacity
                            onPress={() => setShowInstructions(!showInstructions)}
                            style={styles.instructionHeader}
                        >
                            <Text style={[Typography.bodySecondary, { fontWeight: 'bold' }]}>
                                {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
                            </Text>
                        </TouchableOpacity>
                        {showInstructions && (
                            <Text style={[Typography.bodySecondary, { marginTop: Spacing.xs, textAlign: 'center' }]}>
                                {player.currentStep.instructions}
                            </Text>
                        )}
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity onPress={player.handleBack} style={styles.iconButton}>
                    <SkipBack color={Colors.text} size={32} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        Feedback.onPauseToggle();
                        player.setIsPaused(!player.isPaused);
                    }}
                    style={[styles.playButton, { backgroundColor: player.isPaused ? Colors.primary : Colors.surface }]}
                >
                    {player.isPaused ? <Play color={Colors.background} size={40} /> : <Pause color={Colors.primary} size={40} />}
                </TouchableOpacity>

                <TouchableOpacity onPress={player.handleNext} style={styles.iconButton}>
                    {player.timeLeft === null ? <Check color={Colors.success} size={40} /> : <SkipForward color={Colors.text} size={32} />}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    progressContainer: {
        paddingHorizontal: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    progressBarBackground: {
        height: 4,
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    blockText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        letterSpacing: 1,
    },
    roundIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    roundDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    roundDotActive: {
        backgroundColor: Colors.secondary,
    },
    roundDotInactive: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: Spacing.xxl,
        paddingBottom: 100,
        paddingHorizontal: Spacing.lg,
    },
    timerText: {
        fontSize: 120,
        fontWeight: '800',
        color: Colors.primary,
        marginVertical: Spacing.xl,
    },
    repContainer: {
        alignItems: 'center',
        marginVertical: Spacing.xl,
    },
    repText: {
        fontSize: 100,
        fontWeight: '800',
        color: Colors.secondary,
    },
    instructionContainer: {
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        alignItems: 'center',
        width: '100%',
    },
    instructionHeader: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cueContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
        paddingHorizontal: Spacing.lg,
    },
    cueBadge: {
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    cueText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.text,
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingBottom: Spacing.xxl,
    },
    iconButton: {
        padding: Spacing.md,
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    completionIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    finishButton: {
        backgroundColor: Colors.primary,
        width: '100%',
        paddingVertical: Spacing.lg,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: Spacing.xxl,
    },
    finishButtonText: {
        color: Colors.background,
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
});
