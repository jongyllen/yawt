import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { Plus, ChevronRight, Globe, Library, RefreshCw } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getPrograms, initDatabase } from '../../src/db/database';
import { Program } from '../../src/schemas/schema';
import { fetchRegistry, RegistryEntry } from '../../src/utils/registry';

type Tab = 'library' | 'discover';

export default function ProgramsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [registryEntries, setRegistryEntries] = useState<RegistryEntry[]>([]);
  const [isRegistryLoading, setIsRegistryLoading] = useState(false);

  const loadPrograms = useCallback(async () => {
    const db = await initDatabase();
    const data = await getPrograms(db);
    setPrograms(data);
  }, []);

  const loadRegistry = useCallback(async () => {
    setIsRegistryLoading(true);
    const manifest = await fetchRegistry();
    if (manifest) {
      setRegistryEntries(manifest.programs);
    } else {
      Alert.alert('Error', 'Failed to load registry. Check your settings.');
    }
    setIsRegistryLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'library') {
        loadPrograms();
      }
    }, [loadPrograms, activeTab])
  );

  useEffect(() => {
    if (activeTab === 'discover') {
      loadRegistry();
    }
  }, [activeTab, loadRegistry]);

  const renderLibraryItem = ({ item }: { item: Program }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/program/${item.id}`)}>
      <View style={{ flex: 1 }}>
        <Text style={Typography.h3}>{item.name}</Text>
        <Text style={[Typography.bodySecondary, { marginTop: Spacing.xs }]}>
          {item.workouts.length} workouts
        </Text>
      </View>
      <ChevronRight color={Colors.textTertiary} size={20} />
    </TouchableOpacity>
  );

  const renderRegistryItem = ({ item }: { item: RegistryEntry }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/discover-detail',
          params: {
            id: item.id,
            path: item.path,
            name: item.name,
            author: item.author,
            description: item.description,
          },
        })
      }
    >
      <View style={{ flex: 1 }}>
        <Text style={Typography.h3}>{item.name}</Text>
        <Text style={[Typography.bodySecondary, { marginTop: Spacing.xs }]}>by {item.author}</Text>
      </View>
      <ChevronRight color={Colors.textTertiary} size={20} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={Typography.h1}>Programs</Text>
        <TouchableOpacity onPress={() => router.push('/import')} style={styles.addButton}>
          <Plus color={Colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'library' && styles.activeTab]}
          onPress={() => setActiveTab('library')}
        >
          <Library
            color={activeTab === 'library' ? Colors.background : Colors.textSecondary}
            size={18}
          />
          <Text style={[styles.tabText, activeTab === 'library' && styles.activeTabText]}>
            Library
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <Globe
            color={activeTab === 'discover' ? Colors.background : Colors.textSecondary}
            size={18}
          />
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'library' ? (
        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          renderItem={renderLibraryItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={Typography.bodySecondary}>No programs yet.</Text>
              <TouchableOpacity onPress={() => router.push('/import')}>
                <Text style={[Typography.body, { color: Colors.primary, marginTop: Spacing.sm }]}>
                  Import your first program
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          {isRegistryLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={[Typography.bodySecondary, { marginTop: Spacing.md }]}>
                Updating Registry...
              </Text>
            </View>
          ) : (
            <FlatList
              data={registryEntries}
              keyExtractor={(item) => item.id}
              renderItem={renderRegistryItem}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <TouchableOpacity style={styles.refreshButton} onPress={loadRegistry}>
                  <RefreshCw color={Colors.textSecondary} size={16} />
                  <Text style={[Typography.caption, { marginLeft: 8 }]}>Refresh Registry</Text>
                </TouchableOpacity>
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={Typography.bodySecondary}>
                    Registry is empty or could not be loaded.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </View>
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
    paddingBottom: Spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
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
  addButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: 99,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyContainer: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
