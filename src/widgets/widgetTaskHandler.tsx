import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StreakWidget } from './StreakWidget';
import type { WidgetData } from '../utils/widgetData';

const WIDGET_DATA_KEY = 'widget_data';

async function getWidgetData(): Promise<WidgetData | null> {
  try {
    const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export async function widgetTaskHandler(props: {
  widgetName: string;
  widgetAction: string;
  widgetInfo: { widgetId: number; width: number; height: number };
}) {
  const { widgetName, widgetAction, widgetInfo } = props;

  if (widgetName === 'StreakWidget') {
    const data = await getWidgetData();

    switch (widgetAction) {
      case 'WIDGET_ADDED':
      case 'WIDGET_UPDATE':
      case 'WIDGET_RESIZED':
        return (
          <StreakWidget
            currentStreak={data?.currentStreak ?? 0}
            nextWorkoutName={data?.nextWorkoutName ?? null}
            nextProgramName={data?.nextProgramName ?? null}
            workedOutToday={data?.workedOutToday ?? false}
          />
        );

      case 'WIDGET_DELETED':
        // Clean up if needed
        break;

      case 'WIDGET_CLICK':
        // Handle click actions - the app will handle deep linking
        break;
    }
  }

  return null;
}
