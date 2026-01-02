import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface StreakWidgetProps {
  currentStreak: number;
  nextWorkoutName: string | null;
  nextProgramName: string | null;
  workedOutToday: boolean;
}

export function StreakWidget({
  currentStreak,
  nextWorkoutName,
  nextProgramName,
  workedOutToday,
}: StreakWidgetProps) {
  const streakEmoji = workedOutToday ? '🔥' : '💪';
  const statusText = workedOutToday
    ? 'Done for today!'
    : nextWorkoutName
      ? `Next: ${nextWorkoutName}`
      : 'Start a workout';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0D0D0D',
        borderRadius: 24,
        padding: 16,
      }}
      clickAction="OPEN_APP"
    >
      <TextWidget
        text={streakEmoji}
        style={{
          fontSize: 32,
        }}
      />

      <TextWidget
        text={`${currentStreak} day streak`}
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#FFFFFF',
          marginTop: 8,
        }}
      />

      <TextWidget
        text={statusText}
        style={{
          fontSize: 14,
          color: workedOutToday ? '#4ADE80' : '#A0A0A0',
          marginTop: 4,
        }}
      />

      {nextProgramName && !workedOutToday && (
        <TextWidget
          text={nextProgramName}
          style={{
            fontSize: 12,
            color: '#666666',
            marginTop: 2,
          }}
        />
      )}

      <TextWidget
        text="YAWT"
        style={{
          fontSize: 10,
          color: '#00F2FF',
          letterSpacing: 2,
          marginTop: 16,
        }}
      />
    </FlexWidget>
  );
}
