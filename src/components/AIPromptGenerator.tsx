import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Sparkles, Copy, Check } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { generateAIPrompt } from '../utils/prompt_template';

export const AIPromptGenerator: React.FC = () => {
    const [description, setDescription] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCopyPrompt = async () => {
        if (!description.trim()) {
            Alert.alert('Empty Description', 'Please describe the program you want to generate first.');
            return;
        }

        const prompt = generateAIPrompt(description);
        await Clipboard.setStringAsync(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Sparkles color={Colors.primary} size={20} />
                <Text style={[Typography.h3, { marginLeft: Spacing.sm }]}>AI Program Generator</Text>
            </View>

            <Text style={[Typography.bodySecondary, { marginBottom: Spacing.md }]}>
                Describe your program (e.g., "A 4-week bodyweight strength program for beginners with 3 workouts per week") and we'll generate a prompt for you to use with an LLM.
            </Text>

            <TextInput
                style={styles.input}
                multiline
                placeholder="Describe your program here..."
                placeholderTextColor={Colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
            />

            <TouchableOpacity
                style={[styles.button, !description.trim() && styles.buttonDisabled]}
                onPress={handleCopyPrompt}
                disabled={!description.trim()}
            >
                {copied ? (
                    <>
                        <Check color={Colors.background} size={20} />
                        <Text style={styles.buttonText}>Copied to Clipboard!</Text>
                    </>
                ) : (
                    <>
                        <Copy color={Colors.background} size={20} />
                        <Text style={styles.buttonText}>Copy AI Prompt</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.primary,
        marginBottom: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    input: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: Spacing.md,
        color: Colors.text,
        fontSize: 16,
        minHeight: 100,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    button: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderRadius: 12,
        gap: Spacing.sm,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        ...Typography.h3,
        color: Colors.background,
        fontSize: 16,
    },
});
