import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { Dumbbell, Sparkles, FileJson, ChevronRight } from 'lucide-react-native';

interface DashboardEmptyStateProps {
    onBrowsePress: () => void;
    onImportPress: () => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
    onBrowsePress,
    onImportPress,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.hero}>
                <View style={styles.iconContainer}>
                    <Dumbbell color={Colors.primary} size={40} />
                </View>
                <Text style={[Typography.h2, { marginTop: Spacing.lg, textAlign: 'center' }]}>
                    Welcome to YAWT
                </Text>
                <Text style={[Typography.bodySecondary, { textAlign: 'center', marginTop: Spacing.sm, paddingHorizontal: Spacing.xl }]}>
                    The extensible workout tracker. Get started by choosing or creating a program.
                </Text>
            </View>

            <View style={styles.options}>
                <TouchableOpacity style={styles.optionCard} onPress={onBrowsePress}>
                    <View style={[styles.optionIcon, { backgroundColor: `${Colors.secondary}20` }]}>
                        <Dumbbell color={Colors.secondary} size={24} />
                    </View>
                    <View style={styles.optionContent}>
                        <Text style={Typography.h3}>Browse Programs</Text>
                        <Text style={Typography.caption}>Pick from community-made plans</Text>
                    </View>
                    <ChevronRight color={Colors.textTertiary} size={20} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionCard} onPress={onImportPress}>
                    <View style={[styles.optionIcon, { backgroundColor: `${Colors.primary}20` }]}>
                        <Sparkles color={Colors.primary} size={24} />
                    </View>
                    <View style={styles.optionContent}>
                        <Text style={Typography.h3}>AI Generator</Text>
                        <Text style={Typography.caption}>Create a custom plan with AI</Text>
                    </View>
                    <ChevronRight color={Colors.textTertiary} size={20} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionCard} onPress={onImportPress}>
                    <View style={[styles.optionIcon, { backgroundColor: `${Colors.success}20` }]}>
                        <FileJson color={Colors.success} size={24} />
                    </View>
                    <View style={styles.optionContent}>
                        <Text style={Typography.h3}>Import JSON</Text>
                        <Text style={Typography.caption}>Load a program from a file</Text>
                    </View>
                    <ChevronRight color={Colors.textTertiary} size={20} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.xl,
    },
    hero: {
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: Spacing.xxl,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${Colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: `${Colors.primary}30`,
    },
    options: {
        gap: Spacing.md,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionContent: {
        flex: 1,
        marginLeft: Spacing.md,
    },
});
