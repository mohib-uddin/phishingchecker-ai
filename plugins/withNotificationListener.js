const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

/**
 * Expo config plugin to add Notification Listener Service for Android
 * This allows the app to monitor system notifications (SMS)
 */
module.exports = function withNotificationListener(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    
    // Ensure application tag exists
    if (!androidManifest.application) {
      androidManifest.application = [{ $: { 'android:name': '.MainApplication' } }];
    }
    
    const application = androidManifest.application[0];
    
    // Add service declaration for Notification Listener Service
    if (!application.service) {
      application.service = [];
    }
    
    // Check if service already exists
    const serviceExists = application.service.some(
      (service) => service.$['android:name'] === '.NotificationListenerService'
    );
    
    if (!serviceExists) {
      application.service.push({
        $: {
          'android:name': '.NotificationListenerService',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [{
          action: [
            { $: { 'android:name': 'android.service.notification.NotificationListenerService' } }
          ]
        }]
      });
    }
    
    // Add required permission
    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }
    
    const permissions = androidManifest['uses-permission'].map(p => p.$['android:name']);
    
    if (!permissions.includes('android.permission.BIND_NOTIFICATION_LISTENER_SERVICE')) {
      androidManifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE' }
      });
    }
    
    return config;
  });
};

