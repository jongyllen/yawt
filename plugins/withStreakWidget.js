const { 
    withAndroidManifest, 
    withInfoPlist, 
    withDangerousMod 
} = require('@expo/config-plugins');
const { copyFileSync, mkdirSync, existsSync, readdirSync } = require('fs');
const path = require('path');

/**
 * Copy Android resources to the native project
 */
function copyAndroidResources(projectRoot, androidPath) {
    const resourcesPath = path.join(projectRoot, 'android-resources');
    
    if (!existsSync(resourcesPath)) {
        return;
    }

    const destResPath = path.join(androidPath, 'app', 'src', 'main', 'res');

    // Copy each resource folder
    const folders = ['xml', 'layout', 'drawable', 'values'];
    folders.forEach((folder) => {
        const srcFolder = path.join(resourcesPath, folder);
        const destFolder = path.join(destResPath, folder);

        if (existsSync(srcFolder)) {
            if (!existsSync(destFolder)) {
                mkdirSync(destFolder, { recursive: true });
            }

            const files = readdirSync(srcFolder);
            files.forEach((file) => {
                copyFileSync(
                    path.join(srcFolder, file),
                    path.join(destFolder, file)
                );
            });
        }
    });
}

/**
 * Expo config plugin to set up the Streak Widget for Android and iOS
 */
function withStreakWidget(config) {
    // Copy Android resources
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            copyAndroidResources(
                config.modRequest.projectRoot,
                config.modRequest.platformProjectRoot
            );
            return config;
        },
    ]);

    // Android widget configuration
    config = withAndroidManifest(config, async (config) => {
        const manifest = config.modResults;
        const application = manifest.manifest.application[0];

        // Add widget receiver
        if (!application.receiver) {
            application.receiver = [];
        }

        // Check if receiver already exists
        const hasReceiver = application.receiver.some(
            (r) => r.$?.['android:name'] === 'com.reactnativeandroidwidget.RNWidgetProvider'
        );

        if (!hasReceiver) {
            application.receiver.push({
                $: {
                    'android:name': 'com.reactnativeandroidwidget.RNWidgetProvider',
                    'android:exported': 'true',
                    'android:label': '@string/widget_name',
                },
                'intent-filter': [
                    {
                        action: [
                            {
                                $: {
                                    'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
                                },
                            },
                        ],
                    },
                ],
                'meta-data': [
                    {
                        $: {
                            'android:name': 'android.appwidget.provider',
                            'android:resource': '@xml/streak_widget_info',
                        },
                    },
                ],
            });
        }

        return config;
    });

    // iOS widget configuration (requires additional native setup)
    config = withInfoPlist(config, (config) => {
        // Widget-related iOS config would go here
        // Note: iOS widgets require a separate widget extension target
        return config;
    });

    return config;
}

module.exports = withStreakWidget;

