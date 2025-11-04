# Android Native Notification Listener Service Setup

## Important Note for Full Functionality

To fully implement SMS monitoring on Android, you'll need to create a native Android Notification Listener Service. The current implementation using `expo-notifications` will work for notifications the app receives, but for comprehensive SMS monitoring, you need a native module.

## Option 1: Use Expo Config Plugin (Recommended)

Create a custom Expo config plugin to add the Notification Listener Service:

### 1. Create `plugins/withNotificationListener.js`:

```javascript
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withNotificationListener(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    
    // Add service declaration
    if (!androidManifest.application) {
      androidManifest.application = [{ $: { 'android:name': '.MainApplication' } }];
    }
    
    const application = androidManifest.application[0];
    if (!application.service) {
      application.service = [];
    }
    
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

    return config;
  });
};
```

### 2. Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      "./plugins/withNotificationListener"
    ]
  }
}
```

### 3. Create Native Android Service

Create `android/app/src/main/java/app/rork/phishing_alert_mobile/NotificationListenerService.kt`:

```kotlin
package app.rork.phishing_alert_mobile

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class PhishingNotificationListenerService : NotificationListenerService() {
    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)
        
        val packageName = sbn.packageName
        val notification = sbn.notification
        
        // Check if it's from SMS app
        if (packageName.contains("sms") || 
            packageName.contains("message") ||
            packageName == "com.google.android.apps.messaging" ||
            packageName == "com.android.mms") {
            
            val extras = notification.extras
            val title = extras?.getCharSequence("android.title")?.toString() ?: ""
            val text = extras?.getCharSequence("android.text")?.toString() ?: ""
            
            // Send to React Native
            sendNotificationToReactNative(title, text)
        }
    }
    
    private fun sendNotificationToReactNative(title: String, text: String) {
        val reactContext = applicationContext as? ReactContext
        reactContext?.let {
            val params = Arguments.createMap().apply {
                putString("title", title)
                putString("body", text)
                putString("type", "sms")
            }
            it.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("SMSNotificationReceived", params)
        }
    }
}
```

## Option 2: Use Existing Library (Easier)

Consider using `react-native-android-sms-listener` or similar, but you'll need to:
1. Create an Expo config plugin for it
2. Ensure it's compatible with your Expo SDK version

## Current Implementation Status

The current implementation using `expo-notifications` will:
- ✅ Work for notifications your app receives
- ✅ Handle notification permissions correctly
- ✅ Show phishing alerts
- ⚠️ May not capture all SMS notifications in background (depends on device)

## Testing

1. Build with `eas build --platform android`
2. Install on device
3. Enable Notification Listener Service in Android settings
4. Test with SMS messages

## Next Steps

1. **For MVP**: Current implementation should work for basic testing
2. **For Production**: Implement native Notification Listener Service (Option 1)
3. **For Play Store**: Ensure you have:
   - Privacy policy
   - Permission justification
   - Clear app description

## Google Play Compliance

The Notification Listener Service approach is compliant because:
- User must explicitly enable it in system settings
- Clear purpose (phishing detection)
- No default SMS handler required
- Respects user privacy

