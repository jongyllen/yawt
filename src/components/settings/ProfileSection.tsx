import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Colors, Typography } from '../../constants/theme';
import { settingsStyles as styles } from './SettingsStyles';

interface ProfileSectionProps {
  userName: string;
  updateName: (name: string) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ userName, updateName }) => {
  return (
    <View style={styles.section}>
      <Text style={Typography.h3}>Profile</Text>
      <View style={styles.item}>
        <Text style={[Typography.caption, { marginBottom: 4 }]}>Your Name</Text>
        <TextInput
          style={styles.input}
          value={userName}
          onChangeText={updateName}
          placeholder="Enter your name"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>
    </View>
  );
};
