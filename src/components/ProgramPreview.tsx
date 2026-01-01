import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Program, Workout, Block } from '../schemas/schema';
import { ChevronDown, Dumbbell, Clock, Repeat } from 'lucide-react-native';

interface ProgramPreviewProps {
    program: Program;
}

export const ProgramPreview: React.FC<ProgramPreviewProps> = ({ program }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={Typography.h1}>{program.name}</Text>
                {program.description && (
                    <Text style={[Typography.bodySecondary, { marginTop: Spacing.sm }]}>
                        {program.description}
                    </Text>
                )}
            </View>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Dumbbell color={Colors.primary} size={16} />
                    <Text style={styles.statText}>{program.workouts.length} Workouts</Text>
                </View>
                {program.weeks && (
                    <View style={styles.stat}>
                        <Clock color={Colors.primary} size={16} />
                        <Text style={styles.statText}>{program.weeks.length} Weeks</Text>
                    </View>
                )}
            </View>

            <Text style={[Typography.h3, { marginTop: Spacing.lg, marginBottom: Spacing.md }]}>Workouts</Text>
            {program.workouts.map((workout, idx) => (
                <View key={workout.id || idx} style={styles.workoutCard}>
                    <Text style={Typography.h3}>{workout.name}</Text>
                    {workout.blocks.map((block, bIdx) => (
                        <View key={block.id || bIdx} style={styles.blockRow}>
                            <Text style={Typography.bodySecondary}>
                                {block.name} ({block.steps.length} steps)
                                {block.rounds > 1 && ` • ${block.rounds} rounds`}
                            </Text>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginBottom: Spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    statText: {
        ...Typography.caption,
        color: Colors.text,
    },
    workoutCard: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    blockRow: {
        marginTop: Spacing.xs,
        paddingLeft: Spacing.sm,
        borderLeftWidth: 2,
        borderLeftColor: Colors.primary,
    },
});
