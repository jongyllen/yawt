/**
 * Expo Config Plugin for Live Activities
 * 
 * This plugin configures iOS Live Activities and Dynamic Island support.
 * It adds necessary entitlements and Info.plist entries.
 * 
 * Note: The Widget Extension must be added manually in Xcode:
 * 1. Open the .xcworkspace in Xcode
 * 2. File > New > Target > Widget Extension
 * 3. Name it "WorkoutLiveActivity"
 * 4. Copy the Swift files from ios/WorkoutLiveActivity/ to the new target
 * 5. Configure the extension's bundle ID as "com.yawt.app.WorkoutLiveActivity"
 * 6. Add "com.apple.security.application-groups" entitlement with "group.com.yawt.app"
 */

const { withInfoPlist, withEntitlementsPlist, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const APP_GROUP_ID = 'group.com.yawt.app';

const withLiveActivitiesInfoPlist = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults.NSSupportsLiveActivities = true;
    return config;
  });
};

const withLiveActivitiesEntitlements = (config) => {
  return withEntitlementsPlist(config, (config) => {
    const appGroups = config.modResults['com.apple.security.application-groups'] || [];
    if (!appGroups.includes(APP_GROUP_ID)) {
      appGroups.push(APP_GROUP_ID);
    }
    config.modResults['com.apple.security.application-groups'] = appGroups;
    return config;
  });
};

const withLiveActivitiesNativeFiles = (config) => {
  return withXcodeProject(config, (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const iosRoot = path.join(projectRoot, 'ios');
    const projectName = config.modRequest.projectName;
    const nativeSourceDir = path.join(projectRoot, 'native-modules', 'LiveActivity', 'ios');

    if (!fs.existsSync(nativeSourceDir)) {
      console.warn(`[withLiveActivities] Native source directory not found: ${nativeSourceDir}`);
      return config;
    }

    // 1. Copy files to ios directory
    const filesToCopy = [
      { src: 'WorkoutAttributes.swift', dest: projectName },
      { src: 'LiveActivityModule.swift', dest: projectName },
      { src: 'LiveActivityModule.m', dest: projectName },
      { src: 'WorkoutLiveActivity/WorkoutLiveActivityWidget.swift', dest: 'WorkoutLiveActivity' },
      { src: 'WorkoutLiveActivity/Info.plist', dest: 'WorkoutLiveActivity' }
    ];

    filesToCopy.forEach(file => {
      const destDir = path.join(iosRoot, file.dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      const srcPath = path.join(nativeSourceDir, file.src);
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(destDir, path.basename(file.src));
        fs.copyFileSync(srcPath, destPath);
      } else {
        console.warn(`[withLiveActivities] Source file not found: ${srcPath}`);
      }
    });

    return config;
  });
};

const withLiveActivities = (config) => {
  config = withLiveActivitiesInfoPlist(config);
  config = withLiveActivitiesEntitlements(config);
  config = withLiveActivitiesNativeFiles(config);
  return config;
};

module.exports = withLiveActivities;

