import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { NotificationListenerModule } = NativeModules;

/**
 * Native module for Android Notification Listener Service
 * This allows monitoring system notifications (SMS)
 */
class NotificationListenerNative {
  private eventEmitter: NativeEventEmitter | null = null;

  constructor() {
    if (Platform.OS === 'android' && NotificationListenerModule) {
      this.eventEmitter = new NativeEventEmitter(NotificationListenerModule);
    }
  }

  /**
   * Check if Notification Listener Service is enabled
   * Android only - requires user to enable in system settings
   */
  async isNotificationListenerEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android' || !NotificationListenerModule) {
      return false;
    }
    try {
      return await NotificationListenerModule.isNotificationListenerEnabled();
    } catch (error) {
      console.error('Error checking notification listener status:', error);
      return false;
    }
  }

  /**
   * Open Android notification listener settings
   */
  async openNotificationSettings(): Promise<void> {
    if (Platform.OS !== 'android' || !NotificationListenerModule) {
      return;
    }
    try {
      await NotificationListenerModule.openNotificationSettings();
    } catch (error) {
      console.error('Error opening notification settings:', error);
    }
  }

  /**
   * Listen for notifications from native module
   */
  addNotificationListener(callback: (notification: {
    title: string;
    body: string;
    packageName: string;
    timestamp: number;
  }) => void) {
    if (!this.eventEmitter) {
      return () => {};
    }

    const subscription = this.eventEmitter.addListener(
      'NotificationReceived',
      callback
    );

    return () => {
      subscription.remove();
    };
  }
}

export const notificationListenerNative = new NotificationListenerNative();

