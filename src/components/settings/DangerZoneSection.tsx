import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../../constants/theme';
import { settingsStyles as styles } from './SettingsStyles';

interface DangerZoneSectionProps {
  handleResetLogs: () => void;
  handleResetAll: () => void;
}

export const DangerZoneSection: React.FC<DangerZoneSectionProps> = ({
  handleResetLogs,
  handleResetAll,
}) => {
  return (
    <View style={styles.section}>
      <Text style={[Typography.h3, { color: Colors.error }]}>Danger Zone</Text>
      <TouchableOpacity style={styles.dangerItem} onPress={handleResetLogs}>
        <Text style={[Typography.body, { color: Colors.error }]}>Reset All Progress</Text>
        <Text style={Typography.caption}>Logs and active programs will be deleted</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dangerItem} onPress={handleResetAll}>
        <Text style={[Typography.body, { color: Colors.error }]}>Reset to Factory Defaults</Text>
        <Text style={Typography.caption}>All programs and progress will be wiped</Text>
      </TouchableOpacity>
    </View>
  );
};
