import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Colors, Typography } from '../../constants/theme';
import { settingsStyles as styles } from './SettingsStyles';

interface RegistrySectionProps {
  registryRepo: string;
  updateRegistryRepo: (repo: string) => void;
  registryBranch: string;
  updateRegistryBranch: (branch: string) => void;
}

export const RegistrySection: React.FC<RegistrySectionProps> = ({
  registryRepo,
  updateRegistryRepo,
  registryBranch,
  updateRegistryBranch,
}) => {
  return (
    <View style={styles.section}>
      <Text style={Typography.h3}>Discovery Registry</Text>
      <View style={styles.item}>
        <Text style={[Typography.caption, { marginBottom: 4 }]}>GitHub Repository (org/repo)</Text>
        <TextInput
          style={styles.input}
          value={registryRepo}
          onChangeText={updateRegistryRepo}
          placeholder="jongyllen/yawt-workouts"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
        />
      </View>
      <View style={styles.item}>
        <Text style={[Typography.caption, { marginBottom: 4 }]}>Branch</Text>
        <TextInput
          style={styles.input}
          value={registryBranch}
          onChangeText={updateRegistryBranch}
          placeholder="main"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
};
