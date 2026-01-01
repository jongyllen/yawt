import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Program } from '../schemas/schema';

interface ProgramEditorProps {
    program: Program;
    onUpdate: (updated: Program) => void;
}

export const ProgramEditor: React.FC<ProgramEditorProps> = ({ program, onUpdate }) => {
    const handleNameChange = (name: string) => {
        onUpdate({ ...program, name });
    };

    const handleDescriptionChange = (description: string) => {
        onUpdate({ ...program, description });
    };

    return (
        <View style={styles.container}>
            <Text style={[Typography.h3, { marginBottom: Spacing.sm }]}>Program Details</Text>

            <View style={styles.field}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                    style={styles.input}
                    value={program.name}
                    onChangeText={handleNameChange}
                    placeholder="Program Name"
                    placeholderTextColor={Colors.textTertiary}
                />
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.multiline]}
                    value={program.description || ''}
                    onChangeText={handleDescriptionChange}
                    placeholder="Program Description"
                    placeholderTextColor={Colors.textTertiary}
                    multiline
                />
            </View>

            <Text style={[Typography.bodySecondary, { fontStyle: 'italic', marginTop: Spacing.md }]}>
                More editing options (workouts, exercises) coming soon!
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.xl,
    },
    field: {
        marginBottom: Spacing.md,
    },
    label: {
        ...Typography.caption,
        marginBottom: Spacing.xs,
        color: Colors.primary,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: 8,
        padding: Spacing.md,
        color: Colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    multiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
});
