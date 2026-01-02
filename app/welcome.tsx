import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../src/constants/theme';
import { Dumbbell, Sparkles, FileJson, ArrowRight } from 'lucide-react-native';
import { setHasSeenWelcome } from '../src/utils/onboarding';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();

    const handleGetStarted = async (path: string) => {
        await setHasSeenWelcome();
        if (path === 'browse') {
            router.replace('/(tabs)/programs?tab=discover');
        } else if (path === 'import-ai') {
            router.replace('/import?tab=ai');
        } else if (path === 'import-manual') {
            router.replace('/import?tab=manual');
        } else {
            router.replace('/(tabs)');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Dumbbell color={Colors.background} size={40} />
                    </View>
                    <Text style={styles.title}>YAWT</Text>
                    <Text style={styles.subtitle}>Yet Another Workout Tracker</Text>
                </View>

                <View style={styles.heroSection}>
                    <Text style={styles.heroText}>
                        Generate a program with your favorite LLM, share it with the community. Plan, track, and crush your fitness goals with extensible workout programs.
                    </Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: Colors.primary }]}
                        onPress={() => handleGetStarted('browse')}
                    >
                        <Dumbbell color={Colors.background} size={24} />
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>Explore Programs</Text>
                            <Text style={styles.actionDescription}>Browse community-made workout plans</Text>
                        </View>
                        <ArrowRight color={Colors.background} size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleGetStarted('import-ai')}
                    >
                        <Sparkles color={Colors.primary} size={24} />
                        <View style={styles.actionTextContainer}>
                            <Text style={[styles.actionTitle, { color: Colors.text }]}>AI Generator</Text>
                            <Text style={styles.actionDescription}>Create a custom path with AI</Text>
                        </View>
                        <ArrowRight color={Colors.textTertiary} size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleGetStarted('import-manual')}
                    >
                        <FileJson color={Colors.success} size={24} />
                        <View style={styles.actionTextContainer}>
                            <Text style={[styles.actionTitle, { color: Colors.text }]}>Import JSON</Text>
                            <Text style={styles.actionDescription}>Load your own JSON program file</Text>
                        </View>
                        <ArrowRight color={Colors.textTertiary} size={20} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => handleGetStarted('today')}
                >
                    <Text style={styles.skipText}>Skip to Dashboard</Text>
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
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.h1,
        fontSize: 42,
        letterSpacing: 4,
        color: Colors.text,
    },
    subtitle: {
        ...Typography.caption,
        color: Colors.primary,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginTop: -Spacing.xs,
    },
    heroSection: {
        marginVertical: Spacing.xxl,
    },
    heroText: {
        ...Typography.body,
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 26,
        color: Colors.textSecondary,
    },
    actions: {
        gap: Spacing.md,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    actionTextContainer: {
        flex: 1,
        marginLeft: Spacing.lg,
    },
    actionTitle: {
        ...Typography.h3,
        color: Colors.background, // Used for the primary button, will override for others
    },
    actionDescription: {
        ...Typography.caption,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    skipButton: {
        marginTop: Spacing.xxl,
        alignSelf: 'center',
        padding: Spacing.md,
    },
    skipText: {
        ...Typography.bodySecondary,
        color: Colors.textTertiary,
        textDecorationLine: 'underline',
    },
});
