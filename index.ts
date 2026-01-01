import "expo-router/entry";
import { Platform } from 'react-native';

// Register Android widget task handler
if (Platform.OS === 'android') {
    import('react-native-android-widget').then(({ registerWidgetTaskHandler }) => {
        import('./src/widgets/widgetTaskHandler').then(({ widgetTaskHandler }) => {
            registerWidgetTaskHandler(widgetTaskHandler);
        });
    }).catch(() => {
        // Widget package not available (e.g., in Expo Go)
    });
}
