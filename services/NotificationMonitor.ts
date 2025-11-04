import { notificationListenerNative } from '@/modules/NotificationListenerModule';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Dynamic import for expo-notifications to avoid type issues (for iOS)
let Notifications: typeof import('expo-notifications') | null = null;

const loadNotifications = async () => {
  if (!Notifications) {
    Notifications = await import('expo-notifications');
  }
  return Notifications;
};

const MONITORING_ENABLED_KEY = '@phishing_monitoring_enabled';
const NOTIFICATION_LISTENER_ENABLED_KEY = '@notification_listener_enabled';

export interface SMSNotification {
  id: string;
  body: string;
  sender?: string;
  timestamp: number;
}

class NotificationMonitor {
  private listener: { remove: () => void } | null = null;
  private nativeListener: (() => void) | null = null;
  private isMonitoring = false;
  private onPhishingDetected?: (sms: SMSNotification, isPhishing: boolean) => void;

  /**
   * Initialize notification monitoring
   * This uses Notification Listener Service which is Google Play compliant
   */
  async initialize() {
    if (Platform.OS === 'web') {
      return false;
    }

    const Notif = await loadNotifications();

    // Configure how notifications are handled when app is in foreground
    await Notif.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    return true;
  }

  private async getNotifications() {
    return await loadNotifications();
  }

  /**
   * Check if notification listener service is enabled
   * On Android, user must enable this in system settings
   */
  async isNotificationListenerEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      // iOS doesn't require explicit permission for notification content
      return true;
    }

    // Use native module to check actual status
    try {
      const isEnabled = await notificationListenerNative.isNotificationListenerEnabled();
      // Cache the result
      await AsyncStorage.setItem(
        NOTIFICATION_LISTENER_ENABLED_KEY,
        isEnabled ? 'true' : 'false'
      );
      return isEnabled;
    } catch (error) {
      console.error('Error checking notification listener status:', error);
      // Fallback to cached value
      const enabled = await AsyncStorage.getItem(NOTIFICATION_LISTENER_ENABLED_KEY);
      return enabled === 'true';
    }
  }

  /**
   * Check if monitoring is enabled by user
   */
  async isMonitoringEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(MONITORING_ENABLED_KEY);
    return enabled === 'true';
  }

  /**
   * Enable monitoring (user preference)
   */
  async enableMonitoring(): Promise<void> {
    await AsyncStorage.setItem(MONITORING_ENABLED_KEY, 'true');
    await this.startMonitoring();
  }

  /**
   * Disable monitoring
   */
  async disableMonitoring(): Promise<void> {
    await AsyncStorage.setItem(MONITORING_ENABLED_KEY, 'false');
    await this.stopMonitoring();
  }

  /**
   * Set notification listener enabled status
   */
  async setNotificationListenerEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(NOTIFICATION_LISTENER_ENABLED_KEY, enabled ? 'true' : 'false');
    if (enabled && await this.isMonitoringEnabled()) {
      await this.startMonitoring();
    }
  }

  /**
   * Start monitoring notifications
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    const monitoringEnabled = await this.isMonitoringEnabled();
    if (!monitoringEnabled) {
      return;
    }

    if (Platform.OS === 'android') {
      const listenerEnabled = await this.isNotificationListenerEnabled();
      if (!listenerEnabled) {
        console.log('Notification Listener Service not enabled by user');
        return;
      }
    }

    const Notif = await this.getNotifications();

    // Request permissions
    const { status: existingStatus } = await Notif.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notif.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }

    // Listen for notifications - use native module on Android, expo-notifications on iOS
    if (Platform.OS === 'android') {
      // Use native Notification Listener Service for Android
      this.nativeListener = notificationListenerNative.addNotificationListener(
        (notification) => {
          const smsNotification: SMSNotification = {
            id: `${notification.timestamp}-${Math.random()}`,
            body: notification.body,
            sender: notification.title,
            timestamp: notification.timestamp,
          };
          
          // Only analyze if body has substantial content
          if (smsNotification.body.trim().length >= 10) {
            this.analyzeForPhishing(smsNotification).catch(console.error);
          }
        }
      );
    } else {
      // Use expo-notifications for iOS (limited functionality)
      this.listener = Notif.addNotificationReceivedListener((notification: any) => {
        this.handleNotification(notification);
      });
    }

    this.isMonitoring = true;
    console.log('Notification monitoring started');
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring() {
    if (this.listener) {
      this.listener.remove();
      this.listener = null;
    }
    if (this.nativeListener) {
      this.nativeListener();
      this.nativeListener = null;
    }
    this.isMonitoring = false;
    console.log('Notification monitoring stopped');
  }

  /**
   * Handle incoming notification
   */
  private async handleNotification(notification: import('expo-notifications').Notification) {
    // Filter for SMS notifications only
    const isSMS = this.isSMSNotification(notification);
    if (!isSMS) {
      return;
    }

    const smsNotification: SMSNotification = {
      id: notification.request.identifier,
      body: notification.request.content.body || '',
      sender: this.extractSender(notification),
      timestamp: notification.date,
    };

    // Only analyze if body has substantial content
    if (smsNotification.body.trim().length < 10) {
      return;
    }

    // Call phishing detection callback if set
    if (this.onPhishingDetected) {
      // This will be handled by the hook/service that sets this callback
      // We'll analyze asynchronously to avoid blocking
      this.analyzeForPhishing(smsNotification).catch(console.error);
    }
  }

  /**
   * Check if notification is from SMS
   */
  private isSMSNotification(notification: import('expo-notifications').Notification): boolean {
    // On Android, SMS notifications typically come from system SMS app
    // We can identify them by checking the notification channel or category
    const category = notification.request.content.categoryIdentifier;
    const data = notification.request.content.data;
    
    // Check if it's from SMS app
    if (Platform.OS === 'android') {
      // Android SMS notifications often have specific characteristics
      // We'll check the notification data or source
      const title = notification.request.content.title;
      const subtitle = notification.request.content.subtitle;
      return (
        category === 'sms' ||
        (data && typeof data === 'object' && 'type' in data && data.type === 'sms') ||
        (typeof title === 'string' && title.includes('SMS')) ||
        (typeof subtitle === 'string' && subtitle.includes('SMS'))
      );
    }

    // iOS: Check notification category
    if (Platform.OS === 'ios') {
      return category === 'SMS' || category === 'sms';
    }

    return false;
  }

  /**
   * Extract sender from notification
   */
  private extractSender(notification: import('expo-notifications').Notification): string | undefined {
    // Try to extract from title or data
    const title = notification.request.content.title;
    const data = notification.request.content.data;
    
    if (data?.sender) {
      return data.sender as string;
    }
    
    if (title && !title.includes('SMS') && title.length < 50) {
      return title;
    }

    return undefined;
  }

  /**
   * Analyze SMS for phishing
   */
  private async analyzeForPhishing(sms: SMSNotification): Promise<void> {
    try {
      const response = await fetch(
        'https://phishing-backend-476481782289.us-west1.run.app/api/analyze',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: sms.body, 
            language: 'en' 
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      
      if (this.onPhishingDetected) {
        this.onPhishingDetected(sms, result.is_phishing);
      }

      // If phishing detected, show local notification
      if (result.is_phishing) {
        await this.showPhishingAlert(sms, result);
      }
    } catch (error) {
      console.error('Error analyzing SMS for phishing:', error);
    }
  }

  /**
   * Show phishing alert notification
   */
  private async showPhishingAlert(
    sms: SMSNotification,
    result: { key_indicators: string[]; analysis_details: string }
  ): Promise<void> {
    const Notif = await this.getNotifications();
    await Notif.scheduleNotificationAsync({
      content: {
        title: '⚠️ Phishing Alert',
        body: `Suspicious message detected from ${sms.sender || 'Unknown'}. Tap to view details.`,
        data: {
          type: 'phishing_alert',
          smsId: sms.id,
          smsBody: sms.body,
          indicators: result.key_indicators,
          details: result.analysis_details,
        },
        sound: true,
        priority: Notif.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Set callback for phishing detection
   */
  setPhishingDetectedCallback(
    callback: (sms: SMSNotification, isPhishing: boolean) => void
  ) {
    this.onPhishingDetected = callback;
  }
}

export const notificationMonitor = new NotificationMonitor();

