import { useApp } from '@/contexts/AppContext';
import { notificationListenerNative } from '@/modules/NotificationListenerModule';
import { notificationMonitor, SMSNotification } from '@/services/NotificationMonitor';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

export interface MonitoringStatus {
  isMonitoringEnabled: boolean;
  isNotificationListenerEnabled: boolean;
  isActive: boolean;
  hasPermissions: boolean;
}

/**
 * Hook for managing SMS notification monitoring
 * Google Play compliant implementation using Notification Listener Service
 */
export function useNotificationMonitor() {
  const [status, setStatus] = useState<MonitoringStatus>({
    isMonitoringEnabled: false,
    isNotificationListenerEnabled: false,
    isActive: false,
    hasPermissions: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { analyze } = useApp();

  // Initialize and check status
  useEffect(() => {
    initializeMonitoring();
  }, []);

  const initializeMonitoring = async () => {
    try {
      setIsLoading(true);
      
      if (Platform.OS === 'web') {
        setStatus({
          isMonitoringEnabled: false,
          isNotificationListenerEnabled: false,
          isActive: false,
          hasPermissions: false,
        });
        setIsLoading(false);
        return;
      }

      await notificationMonitor.initialize();

      const [isMonitoringEnabled, isNotificationListenerEnabled] = await Promise.all([
        notificationMonitor.isMonitoringEnabled(),
        notificationMonitor.isNotificationListenerEnabled(),
      ]);

      // Check permissions
      const Notif = await import('expo-notifications');
      const { status: permissionStatus } = await Notif.getPermissionsAsync();
      const hasPermissions = permissionStatus === 'granted';

      setStatus({
        isMonitoringEnabled,
        isNotificationListenerEnabled,
        isActive: isMonitoringEnabled && isNotificationListenerEnabled && hasPermissions,
        hasPermissions,
      });

      // Set callback for phishing detection
      notificationMonitor.setPhishingDetectedCallback((sms: SMSNotification, isPhishing: boolean) => {
        // Automatically analyze and add to history
        analyze(
          { message: sms.body, language: 'en' },
          {
            onSuccess: () => {
              console.log('Phishing analysis completed for SMS');
            },
            onError: (error) => {
              console.error('Error analyzing SMS:', error);
            },
          }
        );
      });

      // Start monitoring if enabled
      if (isMonitoringEnabled && isNotificationListenerEnabled && hasPermissions) {
        await notificationMonitor.startMonitoring();
      }
    } catch (error) {
      console.error('Error initializing monitoring:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enableMonitoring = useCallback(async () => {
    try {
      // Request permissions first
      if (Platform.OS === 'android') {
        // On Android, user must enable Notification Listener Service in system settings
        const hasListener = await notificationMonitor.isNotificationListenerEnabled();
        
        if (!hasListener) {
          Alert.alert(
            'Enable Notification Access',
            'To monitor SMS messages, please enable notification access for this app in Android settings. This allows the app to detect phishing attempts in your messages.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => {
                  Linking.openSettings();
                },
              },
            ]
          );
          return;
        }
      } else {
        // iOS: Request notification permissions
        const Notif = await import('expo-notifications');
        const { status } = await Notif.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Notification permission is required to monitor SMS messages for phishing attempts.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => {
                  Linking.openSettings();
                },
              },
            ]
          );
          return;
        }
      }

      await notificationMonitor.enableMonitoring();
      await initializeMonitoring();
    } catch (error) {
      console.error('Error enabling monitoring:', error);
      Alert.alert('Error', 'Failed to enable monitoring. Please try again.');
    }
  }, []);

  const disableMonitoring = useCallback(async () => {
    try {
      await notificationMonitor.disableMonitoring();
      await initializeMonitoring();
    } catch (error) {
      console.error('Error disabling monitoring:', error);
      Alert.alert('Error', 'Failed to disable monitoring. Please try again.');
    }
  }, []);

  const openNotificationSettings = useCallback(async () => {
    if (Platform.OS === 'android') {
      // Use native module to open notification listener settings
      try {
        await notificationListenerNative.openNotificationSettings();
      } catch (error) {
        // Fallback to regular settings
        Alert.alert(
          'Enable Notification Access',
          'To enable SMS monitoring:\n\n1. Open Android Settings\n2. Go to Apps > Special app access > Notification access\n3. Find "Phishing Alert Mobile"\n4. Enable it\n\nThis permission is required to detect phishing attempts in your messages.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ]
        );
      }
    } else {
      Linking.openSettings();
    }
  }, []);

  return {
    status,
    isLoading,
    enableMonitoring,
    disableMonitoring,
    openNotificationSettings,
    refreshStatus: initializeMonitoring,
  };
}

