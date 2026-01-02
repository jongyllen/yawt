import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors, Typography, Spacing } from '../src/constants/theme';
import { Download, ArrowLeft } from 'lucide-react-native';
import { fetchRemoteProgram } from '../src/utils/registry';
import { ProgramPreview } from '../src/components/ProgramPreview';
import { ProgramSchema, Program } from '../src/schemas/schema';
import { initDatabase, saveProgram } from '../src/db/database';

export default function DiscoverDetailScreen() {
  const { path, name, author, description } = useLocalSearchParams();
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgram();
  }, []);

  const loadProgram = async () => {
    setIsLoading(true);
    const data = await fetchRemoteProgram(path as string);
    if (data) {
      try {
        const validated = ProgramSchema.parse(data);
        setProgram(validated);
      } catch (error) {
        console.error('Validation error:', error);
        Alert.alert('Error', 'This program has an invalid format and cannot be imported.');
      }
    } else {
      Alert.alert('Error', 'Failed to fetch program details.');
    }
    setIsLoading(false);
  };

  const handleImport = async () => {
    if (!program) return;
    try {
      const db = await initDatabase();
      await saveProgram(db, program);
      Alert.alert('Success', `${program.name} has been added to My Programs!`, [
        { text: 'View Programs', onPress: () => router.replace('/(tabs)/programs') },
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import program.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: (name as string) || 'Program Detail',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: -Spacing.sm, padding: Spacing.sm }}
            >
              <ArrowLeft color={Colors.primary} size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={Typography.h1}>{name}</Text>
          <Text style={[Typography.bodySecondary, { marginTop: Spacing.xs }]}>by {author}</Text>
          {description && (
            <Text style={[Typography.body, { marginTop: Spacing.md, color: Colors.textSecondary }]}>
              {description}
            </Text>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={[Typography.bodySecondary, { marginTop: Spacing.md }]}>
              Fetching program details...
            </Text>
          </View>
        ) : program ? (
          <View style={styles.previewContainer}>
            <Text style={[Typography.h3, { marginBottom: Spacing.md }]}>Program Preview</Text>
            <ProgramPreview program={program} />

            <TouchableOpacity style={styles.importButton} onPress={handleImport}>
              <Download color={Colors.background} size={20} />
              <Text style={styles.importButtonText}>Import Program</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={Typography.bodySecondary}>Could not load program preview.</Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  header: {
    marginBottom: Spacing.xl,
  },
  loadingContainer: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
  },
  previewContainer: {
    marginTop: Spacing.md,
  },
  importButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  importButtonText: {
    ...Typography.h3,
    color: Colors.background,
  },
  errorContainer: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
  },
});
