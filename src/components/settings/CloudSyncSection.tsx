import React from 'react';
import { View, Text, Switch, TouchableOpacity, Platform, Alert } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { settingsStyles as styles } from './SettingsStyles';
import { Cloud, CloudOff, RefreshCw, User, LogIn } from 'lucide-react-native';
import * as Auth from '../../utils/auth';
import * as CloudSync from '../../utils/cloudSync';
import * as AppleAuthentication from 'expo-apple-authentication';

interface CloudSyncSectionProps {
  cloudUser: Auth.CloudUser | null;
  setCloudUser: (user: Auth.CloudUser | null) => void;
  isSyncing: boolean;
  cloudSyncEnabled: boolean;
  setCloudSyncEnabled: (value: boolean) => void;
  toggleCloudSync: (value: boolean) => void;
  lastSyncTime: string | null;
  handleManualSync: () => void;
  handleExport: () => void;
  handleRestore: () => void;
  handleAppleSignIn: () => void;
  handleGoogleSignIn: () => void;
}

export const CloudSyncSection: React.FC<CloudSyncSectionProps> = ({
  cloudUser,
  setCloudUser,
  isSyncing,
  cloudSyncEnabled,
  setCloudSyncEnabled,
  toggleCloudSync,
  lastSyncTime,
  handleManualSync,
  handleExport,
  handleRestore,
  handleAppleSignIn,
  handleGoogleSignIn,
}) => {
  return (
    <View style={styles.section}>
      <View
        style={[
          styles.sectionHeader,
          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        ]}
      >
        <Text style={Typography.h3}>Cloud Sync</Text>
        {isSyncing && <RefreshCw size={16} color={Colors.primary} style={styles.spinning} />}
      </View>

      {cloudUser ? (
        <View style={styles.userCard}>
          <View style={styles.userIcon}>
            <User color={Colors.primary} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={Typography.body}>{cloudUser.fullName || 'User'}</Text>
            <Text style={Typography.caption}>
              Signed in with {cloudUser.provider === 'apple' ? 'Apple' : 'Google'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={async () => {
              await Auth.signOut();
              setCloudUser(null);
              setCloudSyncEnabled(false);
              await CloudSync.setCloudSyncEnabled(false);
            }}
          >
            <Text style={[Typography.caption, { color: Colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.signInContainer}>
          {Platform.OS === 'ios' ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={8}
              style={{ width: '100%', height: 44 }}
              onPress={handleAppleSignIn}
            />
          ) : (
            <View style={{ width: '100%' }}>
              <TouchableOpacity
                style={[styles.googleButton, !Auth.isGoogleAuthAvailable() && { opacity: 0.5 }]}
                onPress={handleGoogleSignIn}
                disabled={!Auth.isGoogleAuthAvailable()}
              >
                <LogIn size={20} color={Colors.background} />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </TouchableOpacity>
              {!Auth.isGoogleAuthAvailable() && (
                <Text
                  style={[
                    Typography.caption,
                    { color: Colors.warning, marginTop: Spacing.xs, textAlign: 'center' },
                  ]}
                >
                  Google Sign-In requires a Development Client (Not supported in Expo Go).
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      <View style={[styles.item, styles.rowItem]}>
        <View style={{ flex: 1 }}>
          <Text style={Typography.body}>Automatic Cloud Sync</Text>
          <Text style={Typography.caption}>
            {lastSyncTime
              ? `Last synced: ${new Date(lastSyncTime).toLocaleString()}`
              : `Keep your data safe in ${Platform.OS === 'ios' ? 'iCloud' : 'Google Drive'}`}
          </Text>
        </View>
        <Switch
          value={cloudSyncEnabled}
          onValueChange={toggleCloudSync}
          trackColor={{ false: Colors.surface, true: Colors.primary }}
          thumbColor={Colors.text}
          disabled={!cloudUser}
        />
      </View>

      {!cloudSyncEnabled && (
        <>
          <TouchableOpacity style={styles.item} onPress={handleExport}>
            <Text style={Typography.body}>Export Backup</Text>
            <Text style={Typography.caption}>Save your progress to a file</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={handleRestore}>
            <Text style={Typography.body}>Restore Backup</Text>
            <Text style={Typography.caption}>Load progress from a file</Text>
          </TouchableOpacity>
        </>
      )}

      {cloudSyncEnabled && (
        <TouchableOpacity style={styles.item} onPress={handleManualSync} disabled={isSyncing}>
          <Text style={[Typography.body, { color: Colors.primary }]}>Sync Now</Text>
          <Text style={Typography.caption}>Force an immediate cloud update</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
