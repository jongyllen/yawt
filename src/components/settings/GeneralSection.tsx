import React from 'react';
import { View, Text, Switch, TouchableOpacity, Platform, Alert } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { settingsStyles as styles } from './SettingsStyles';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Health from '../../utils/health';

interface GeneralSectionProps {
  notificationsEnabled: boolean;
  toggleNotifications: (value: boolean) => void;
  reminderTime: Date;
  showTimePicker: boolean;
  setShowTimePicker: (value: boolean) => void;
  onTimeChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  confirmTime: () => void;
  healthEnabled: boolean;
  setHealthEnabled: (value: boolean) => void;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({
  notificationsEnabled,
  toggleNotifications,
  reminderTime,
  showTimePicker,
  setShowTimePicker,
  onTimeChange,
  confirmTime,
  healthEnabled,
  setHealthEnabled,
}) => {
  return (
    <View style={styles.section}>
      <Text style={Typography.h3}>General</Text>
      <View style={[styles.item, styles.rowItem]}>
        <View>
          <Text style={Typography.body}>Daily Reminders</Text>
          <Text style={Typography.caption}>Get notified about today's workout</Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          trackColor={{ false: Colors.surface, true: Colors.primary }}
          thumbColor={Colors.text}
        />
      </View>

      {notificationsEnabled && (
        <TouchableOpacity
          style={[styles.item, styles.rowItem]}
          onPress={() => setShowTimePicker(true)}
        >
          <View>
            <Text style={Typography.body}>Reminder Time</Text>
            <Text style={Typography.caption}>When you'll be notified</Text>
          </View>
          <Text style={[Typography.body, { color: Colors.primary, fontWeight: 'bold' }]}>
            {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
      )}

      {showTimePicker && (
        <View style={styles.timePickerContainer}>
          <DateTimePicker
            value={reminderTime}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.doneButton} onPress={confirmTime}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {Platform.OS === 'ios' && (
        <View style={[styles.item, styles.rowItem]}>
          <View>
            <Text style={Typography.body}>Sync with Apple Health</Text>
            <Text style={Typography.caption}>Contribute to your Activity Rings</Text>
          </View>
          <Switch
            value={healthEnabled}
            onValueChange={async (value) => {
              setHealthEnabled(value);
              const result = await Health.setHealthSyncEnabled(value);
              if (value && !result.success) {
                setHealthEnabled(false);
                Alert.alert(
                  'HealthKit Error',
                  result.error ||
                    'Failed to initialize Apple Health. Please check your system settings.',
                  [{ text: 'OK' }]
                );
              }
            }}
            trackColor={{ false: Colors.surface, true: Colors.primary }}
            thumbColor={Colors.text}
          />
        </View>
      )}
    </View>
  );
};
