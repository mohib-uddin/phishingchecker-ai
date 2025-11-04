import { useNotificationMonitor } from '@/hooks/useNotificationMonitor';
import * as Haptics from 'expo-haptics';
import { AlertCircle, CheckCircle, Settings as SettingsIcon, Shield, XCircle } from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function SettingsScreen() {
  const {
    status,
    isLoading,
    enableMonitoring,
    disableMonitoring,
    openNotificationSettings,
    refreshStatus,
  } = useNotificationMonitor();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleToggleMonitoring = async (enabled: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      if (enabled) {
        await enableMonitoring();
      } else {
        Alert.alert(
          'Disable Monitoring',
          'Are you sure you want to disable SMS monitoring? You will no longer receive automatic phishing alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                await disableMonitoring();
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update monitoring settings.');
    }
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    await refreshStatus();
    setIsRefreshing(false);
  };

  const getStatusIcon = () => {
    if (status.isActive) {
      return <CheckCircle size={24} color="#16a34a" />;
    } else if (status.isMonitoringEnabled && !status.isNotificationListenerEnabled) {
      return <AlertCircle size={24} color="#f59e0b" />;
    } else {
      return <XCircle size={24} color="#dc2626" />;
    }
  };

  const getStatusText = () => {
    if (status.isActive) {
      return 'Active - Monitoring SMS for phishing';
    } else if (status.isMonitoringEnabled && !status.isNotificationListenerEnabled) {
      return 'Setup Required - Enable notification access';
    } else if (status.isMonitoringEnabled && !status.hasPermissions) {
      return 'Permission Required - Grant notification permission';
    } else {
      return 'Disabled - Not monitoring SMS';
    }
  };

  const getStatusColor = () => {
    if (status.isActive) {
      return '#16a34a';
    } else if (status.isMonitoringEnabled) {
      return '#f59e0b';
    } else {
      return '#dc2626';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <SettingsIcon size={32} color="#2563eb" strokeWidth={2} />
        </View>
        <Text style={styles.title}>SMS Monitoring</Text>
        <Text style={styles.subtitle}>
          Automatically detect phishing attempts in your SMS messages
        </Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          {getStatusIcon()}
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>Monitoring Status</Text>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {isRefreshing && (
          <ActivityIndicator size="small" color="#2563eb" style={styles.refreshIndicator} />
        )}
      </View>

      {/* Monitoring Toggle */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Shield size={20} color="#2563eb" />
          <Text style={styles.sectionTitle}>Enable SMS Monitoring</Text>
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Monitor SMS Messages</Text>
            <Text style={styles.settingDescription}>
              Automatically scan incoming SMS messages for phishing attempts
            </Text>
          </View>
          <Switch
            value={status.isMonitoringEnabled}
            onValueChange={handleToggleMonitoring}
            disabled={isLoading}
            trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
            thumbColor={status.isMonitoringEnabled ? '#2563eb' : '#cbd5e1'}
          />
        </View>
      </View>

      {/* Setup Instructions */}
      {status.isMonitoringEnabled && !status.isActive && (
        <View style={[styles.section, styles.warningSection]}>
          <View style={styles.sectionHeader}>
            <AlertCircle size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Setup Required</Text>
          </View>
          
          {Platform.OS === 'android' && !status.isNotificationListenerEnabled && (
            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>Enable Notification Access (Android)</Text>
              <Text style={styles.instructionText}>
                To monitor SMS messages, you need to enable notification access:
              </Text>
              <View style={styles.stepsContainer}>
                <Text style={styles.step}>1. Tap "Open Settings" below</Text>
                <Text style={styles.step}>2. Go to Apps → Special app access</Text>
                <Text style={styles.step}>3. Select "Notification access"</Text>
                <Text style={styles.step}>4. Enable "Phishing Alert Mobile"</Text>
              </View>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={openNotificationSettings}
              >
                <Text style={styles.actionButtonText}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          )}

          {!status.hasPermissions && (
            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>Grant Notification Permission</Text>
              <Text style={styles.instructionText}>
                Notification permission is required to receive phishing alerts.
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={openNotificationSettings}
              >
                <Text style={styles.actionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.refreshButton]}
            onPress={handleRefreshStatus}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Refresh Status</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Privacy Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Shield size={20} color="#64748b" />
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
        </View>
        <View style={styles.privacyCard}>
          <Text style={styles.privacyText}>
            • SMS content is analyzed locally and sent to our secure server for phishing detection
          </Text>
          <Text style={styles.privacyText}>
            • Messages are only analyzed when monitoring is enabled
          </Text>
          <Text style={styles.privacyText}>
            • No SMS content is stored permanently on our servers
          </Text>
          <Text style={styles.privacyText}>
            • You can disable monitoring at any time
          </Text>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Shield size={20} color="#2563eb" />
          <Text style={styles.sectionTitle}>How It Works</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            When enabled, this app monitors incoming SMS notifications and automatically analyzes them for phishing attempts. If a suspicious message is detected, you'll receive an alert notification with details about the threat.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  refreshIndicator: {
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  warningSection: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  settingRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  instructionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 20,
  },
  stepsContainer: {
    marginBottom: 16,
  },
  step: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  refreshButton: {
    backgroundColor: '#64748b',
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  privacyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  privacyText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
});

