import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Colors, Typography, Spacing } from '../src/constants/theme';
import { ProgramSchema } from '../src/schemas/schema';
import { initDatabase, saveProgram } from '../src/db/database';
import { useRouter, Stack } from 'expo-router';
import { X, FileJson, Sparkles, ArrowRight, Save, Trash2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { AIPromptGenerator } from '../src/components/AIPromptGenerator';
import { ProgramPreview } from '../src/components/ProgramPreview';
import { ProgramEditor } from '../src/components/ProgramEditor';
import { Program } from '../src/schemas/schema';

type ImportStep = 'input' | 'preview';
type ImportTab = 'ai' | 'manual';

export default function ImportScreen() {
    const [step, setStep] = useState<ImportStep>('input');
    const [activeTab, setActiveTab] = useState<ImportTab>('ai');
    const [jsonText, setJsonText] = useState('');
    const [pendingProgram, setPendingProgram] = useState<Program | null>(null);
    const router = useRouter();

    const cleanJsonString = (str: string) => {
        // Strip markdown code blocks (```json ... ```)
        let cleaned = str.replace(/```(?:json)?\n?([\s\S]*?)\n?```/g, '$1');
        // Strip any remaining surrounding backticks
        cleaned = cleaned.trim().replace(/^`+|`+$/g, '');
        return cleaned;
    };

    const handleParse = async () => {
        try {
            const cleaned = cleanJsonString(jsonText);
            const parsed = JSON.parse(cleaned);
            const validated = ProgramSchema.parse(parsed);
            setPendingProgram(validated);
            setStep('preview');
        } catch (error: any) {
            console.error(error);
            if (error instanceof SyntaxError) {
                Alert.alert('JSON Syntax Error', 'The text you pasted is not valid JSON. Please check for missing quotes or brackets.');
            } else if (error.name === 'ZodError') {
                Alert.alert('Validation Error', 'The JSON is valid but does not match the required program structure.');
            } else {
                Alert.alert('Error', 'An unexpected error occurred during import.');
            }
        }
    };

    const handleFileImport = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets.length) return;

            const file = new File(result.assets[0].uri);
            const content = await file.text();
            const cleaned = cleanJsonString(content);
            const parsed = JSON.parse(cleaned);
            const validated = ProgramSchema.parse(parsed);
            setPendingProgram(validated);
            setStep('preview');
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', 'Failed to read file or invalid program format.');
        }
    };

    const handleConfirmImport = async () => {
        if (!pendingProgram) return;
        const db = await initDatabase();
        await saveProgram(db, pendingProgram);
        Alert.alert('Success', 'Program imported successfully!');
        router.back();
    };

    const handleCancelPreview = () => {
        setStep('input');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Stack.Screen
                options={{
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -Spacing.sm, padding: Spacing.sm }}>
                            <Text style={[Typography.body, { color: Colors.primary }]}>Cancel</Text>
                        </TouchableOpacity>
                    ),
                    title: step === 'input' ? 'Import Program' : 'Review Program',
                }}
            />

            {step === 'input' ? (
                <>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'ai' && styles.activeTab]}
                            onPress={() => setActiveTab('ai')}
                        >
                            <Sparkles color={activeTab === 'ai' ? Colors.background : Colors.textSecondary} size={18} />
                            <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>AI Assistant</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
                            onPress={() => setActiveTab('manual')}
                        >
                            <FileJson color={activeTab === 'manual' ? Colors.background : Colors.textSecondary} size={18} />
                            <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>Direct JSON</Text>
                        </TouchableOpacity>
                    </View>

                    {activeTab === 'ai' ? (
                        <AIPromptGenerator />
                    ) : (
                        <View style={styles.manualContainer}>
                            <TouchableOpacity style={styles.fileButton} onPress={handleFileImport}>
                                <FileJson color={Colors.primary} size={20} />
                                <Text style={[Typography.h3, { color: Colors.primary, marginLeft: Spacing.sm }]}>Import from File</Text>
                            </TouchableOpacity>

                            <View style={styles.separator}>
                                <View style={styles.line} />
                                <Text style={styles.separatorText}>OR PASTE JSON</Text>
                                <View style={styles.line} />
                            </View>

                            <TextInput
                                style={styles.input}
                                multiline
                                placeholder='{ "id": "my-program", ... }'
                                placeholderTextColor={Colors.textTertiary}
                                value={jsonText}
                                onChangeText={setJsonText}
                                textAlignVertical="top"
                            />

                            <TouchableOpacity
                                style={[styles.mainButton, !jsonText && { opacity: 0.5 }]}
                                onPress={handleParse}
                                disabled={!jsonText}
                            >
                                <ArrowRight color={Colors.background} size={20} />
                                <Text style={styles.mainButtonText}>Preview Program</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            ) : (
                pendingProgram && (
                    <>
                        <ProgramEditor
                            program={pendingProgram}
                            onUpdate={setPendingProgram}
                        />

                        <View style={styles.previewSection}>
                            <Text style={[Typography.h3, { marginBottom: Spacing.md }]}>Preview</Text>
                            <ProgramPreview program={pendingProgram} />
                        </View>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleCancelPreview}
                            >
                                <Trash2 color={Colors.error} size={20} />
                                <Text style={[styles.secondaryButtonText, { color: Colors.error }]}>Discard</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleConfirmImport}
                            >
                                <Save color={Colors.background} size={20} />
                                <Text style={styles.confirmButtonText}>Import to Library</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 4,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
    },
    activeTab: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        ...Typography.caption,
        fontWeight: 'bold',
        color: Colors.textSecondary,
    },
    activeTabText: {
        color: Colors.background,
    },
    manualContainer: {
        flex: 1,
    },
    input: {
        marginTop: Spacing.md,
        height: 200,
        backgroundColor: Colors.surface,
        color: Colors.text,
        borderRadius: 12,
        padding: Spacing.md,
        fontFamily: 'Courier',
        fontSize: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    mainButton: {
        marginTop: Spacing.md,
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    mainButtonText: {
        ...Typography.h3,
        color: Colors.background,
    },
    fileButton: {
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
    },
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.xl,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    separatorText: {
        ...Typography.caption,
        marginHorizontal: Spacing.md,
        color: Colors.textTertiary,
    },
    previewSection: {
        marginTop: Spacing.lg,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: Spacing.xl,
        gap: Spacing.md,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.error,
        gap: Spacing.sm,
    },
    secondaryButtonText: {
        ...Typography.h3,
        fontSize: 16,
    },
    confirmButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        borderRadius: 12,
        gap: Spacing.sm,
    },
    confirmButtonText: {
        ...Typography.h3,
        color: Colors.background,
        fontSize: 16,
    },
});
