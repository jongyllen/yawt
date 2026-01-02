import React from 'react';
import { View, Text, Switch } from 'react-native';
import { Colors, Typography } from '../../constants/theme';
import { settingsStyles as styles } from './SettingsStyles';
import * as Feedback from '../../utils/feedback';

interface FeedbackSectionProps {
  hapticsEnabled: boolean;
  setHapticsEnabled: (value: boolean) => void;
  countdownBeepsEnabled: boolean;
  setCountdownBeepsEnabled: (value: boolean) => void;
  autoPlayEnabled: boolean;
  setAutoPlayEnabled: (value: boolean) => void;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  hapticsEnabled,
  setHapticsEnabled,
  countdownBeepsEnabled,
  setCountdownBeepsEnabled,
  autoPlayEnabled,
  setAutoPlayEnabled,
}) => {
  return (
    <View style={styles.section}>
      <Text style={Typography.h3}>Workout Feedback</Text>
      <View style={[styles.item, styles.rowItem]}>
        <View>
          <Text style={Typography.body}>Haptic Feedback</Text>
          <Text style={Typography.caption}>Vibration on transitions</Text>
        </View>
        <Switch
          value={hapticsEnabled}
          onValueChange={async (value) => {
            setHapticsEnabled(value);
            await Feedback.setFeedbackSetting('haptics', value);
            if (value) Feedback.lightTap();
          }}
          trackColor={{ false: Colors.surface, true: Colors.primary }}
          thumbColor={Colors.text}
        />
      </View>
      <View style={[styles.item, styles.rowItem]}>
        <View>
          <Text style={Typography.body}>Countdown Alerts</Text>
          <Text style={Typography.caption}>Vibrate at 3, 2, 1 seconds</Text>
        </View>
        <Switch
          value={countdownBeepsEnabled}
          onValueChange={async (value) => {
            setCountdownBeepsEnabled(value);
            await Feedback.setFeedbackSetting('countdown', value);
          }}
          trackColor={{ false: Colors.surface, true: Colors.primary }}
          thumbColor={Colors.text}
        />
      </View>
      <View style={[styles.item, styles.rowItem]}>
        <View>
          <Text style={Typography.body}>Auto-advance Timers</Text>
          <Text style={Typography.caption}>Move to next step when timer ends</Text>
        </View>
        <Switch
          value={autoPlayEnabled}
          onValueChange={async (value) => {
            setAutoPlayEnabled(value);
            await Feedback.setFeedbackSetting('autoplay', value);
          }}
          trackColor={{ false: Colors.surface, true: Colors.primary }}
          thumbColor={Colors.text}
        />
      </View>
    </View>
  );
};
