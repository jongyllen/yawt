import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';
import { Trophy, Star } from 'lucide-react-native';
import { PersonalRecord } from '../../schemas/schema';

interface PersonalRecordsSectionProps {
    records: PersonalRecord[];
    onToggleFavorite?: (prId: string, isFavorite: boolean) => void;
}

const CORE_EXERCISES = ['pushup', 'squat', 'plank', 'pushups', 'squats', 'planks'];

export const PersonalRecordsSection: React.FC<PersonalRecordsSectionProps> = ({
    records,
    onToggleFavorite,
}) => {
    const isCore = (name: string) => CORE_EXERCISES.includes(name.toLowerCase());

    // Filter and sort:
    // 1. Favorites (starred)
    // 2. Core (not starred)
    // 3. Others (not starred)
    const favorites = records.filter((r) => r.isFavorite);
    const coreRecords = records.filter((r) => !r.isFavorite && isCore(r.exerciseName));
    const otherRecords = records.filter((r) => !r.isFavorite && !isCore(r.exerciseName));

    const renderRecord = (record: PersonalRecord, variant: 'favorite' | 'core' | 'other' = 'other') => {
        const isStarred = record.isFavorite;

        return (
            <View
                key={record.id}
                style={[
                    styles.prItem,
                    variant === 'favorite' && styles.favoriteItem,
                    variant === 'core' && styles.coreItem,
                ]}
            >
                <View style={styles.prInfo}>
                    <TouchableOpacity
                        onPress={() => onToggleFavorite?.(record.id, !isStarred)}
                        style={styles.starTouch}
                    >
                        <Star
                            size={18}
                            color={isStarred || variant === 'core' ? Colors.warning : Colors.border}
                            fill={isStarred ? Colors.warning : 'transparent'}
                        />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.prExercise}>{record.exerciseName}</Text>
                        <Text style={styles.prDate}>{new Date(record.date).toLocaleDateString()}</Text>
                    </View>
                </View>
                <View
                    style={[
                        styles.prBadge,
                        (variant === 'favorite' || variant === 'core') && styles.highlightedBadge,
                    ]}
                >
                    <Text
                        style={[
                            styles.prValueText,
                            (variant === 'favorite' || variant === 'core') && styles.highlightedValueText,
                        ]}
                    >
                        {record.value}
                        {record.type === 'weight' ? 'kg' : record.type === 'duration' ? 's' : ''}
                    </Text>
                    <Text
                        style={[
                            styles.prTypeText,
                            (variant === 'favorite' || variant === 'core') && styles.highlightedTypeText,
                        ]}
                    >
                        {record.type.toUpperCase()}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Trophy color={Colors.warning} size={20} />
                <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
            </View>

            {records.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No records yet. Finish a workout to set your first PR!</Text>
                </View>
            ) : (
                <View style={styles.list}>
                    {favorites.length > 0 && (
                        <View style={styles.subSection}>
                            <Text style={styles.subTitle}>Favorites</Text>
                            {favorites.map((r) => renderRecord(r, 'favorite'))}
                        </View>
                    )}

                    {coreRecords.length > 0 && (
                        <View style={styles.subSection}>
                            <Text style={styles.subTitle}>{favorites.length > 0 ? 'Core Milestones' : 'Recommended'}</Text>
                            {coreRecords.map((r) => renderRecord(r, 'core'))}
                        </View>
                    )}

                    {otherRecords.length > 0 && (
                        <View style={styles.subSection}>
                            {(favorites.length > 0 || coreRecords.length > 0) && (
                                <Text style={styles.subTitle}>Other Records</Text>
                            )}
                            {otherRecords.map((r) => renderRecord(r))}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginTop: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    list: {
        gap: Spacing.md,
    },
    subSection: {
        gap: Spacing.sm,
    },
    subTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    prItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    favoriteItem: {
        borderColor: `${Colors.warning}40`,
        backgroundColor: `${Colors.warning}05`,
    },
    coreItem: {
        borderColor: `${Colors.primary}20`,
        backgroundColor: `${Colors.primary}05`,
    },
    starTouch: {
        padding: 8,
        marginLeft: -8,
        marginRight: 4,
    },
    prInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    exerciseNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prExercise: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    highlightedText: {
        color: Colors.text,
    },
    prDate: {
        fontSize: 12,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    prBadge: {
        alignItems: 'flex-end',
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: 8,
        minWidth: 60,
    },
    highlightedBadge: {
        backgroundColor: `${Colors.warning}20`,
    },
    prValueText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    highlightedValueText: {
        color: Colors.warning,
    },
    prTypeText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: Colors.textTertiary,
    },
    highlightedTypeText: {
        color: `${Colors.warning}B0`,
    },
    emptyContainer: {
        padding: Spacing.xl,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderStyle: 'dashed',
    },
    emptyText: {
        color: Colors.textSecondary,
        textAlign: 'center',
        fontSize: 14,
    },
});
