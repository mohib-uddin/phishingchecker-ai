# SMS Monitoring Implementation

## Overview
This implementation provides Google Play Store compliant SMS monitoring for phishing detection. It uses the **Notification Listener Service** approach which is approved by Google Play policies.

## Key Features

### ✅ Google Play Compliant
- Uses Notification Listener Service (not direct SMS reading)
- Requires explicit user consent
- Proper permission handling
- Privacy-focused implementation

### 🔒 Privacy & Security
- SMS content analyzed locally when possible
- Only processes messages when monitoring is enabled
- No permanent storage of SMS content on servers
- User can disable monitoring at any time

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Android Setup
The app requires Notification Listener Service permission on Android:

1. Build and install the app
2. Go to **Settings** → **Apps** → **Special app access** → **Notification access**
3. Enable **"Phishing Alert Mobile"**

### 3. iOS Setup
iOS automatically handles notification permissions through the system permission dialog.

## How It Works

### Android
- Uses `NotificationListenerService` to listen for SMS notifications
- Filters notifications to identify SMS messages
- Analyzes content for phishing attempts
- Shows alerts when threats are detected

### iOS
- Uses `expo-notifications` to receive notification content
- Filters for SMS notifications
- Analyzes content for phishing attempts
- Shows alerts when threats are detected

## User Flow

1. **Enable Monitoring**: User goes to Settings tab and enables SMS monitoring
2. **Grant Permissions**: User grants notification permissions (Android also needs Notification Listener Service)
3. **Automatic Detection**: App monitors incoming SMS notifications
4. **Phishing Alerts**: If phishing detected, user receives alert notification

## Google Play Store Compliance

### ✅ Why This Approach is Compliant:

1. **Notification Listener Service** is an approved method for accessing notification content
2. **User Consent Required**: Users must explicitly enable monitoring
3. **Clear Purpose**: App clearly states purpose (phishing detection)
4. **Privacy Policy**: Ensure you have a privacy policy explaining data usage
5. **No Default SMS Handler Required**: Unlike direct SMS reading, this doesn't require being the default SMS app

### 📋 Required for Play Store Submission:

1. **Privacy Policy**: Add a privacy policy URL in Play Console
2. **Permission Justification**: In the Play Console, explain why you need notification access:
   - "This app uses notification access to monitor SMS messages for phishing attempts to protect user security."
3. **App Description**: Clearly state the app's purpose and what permissions are used for

## Files Created

- `services/NotificationMonitor.ts` - Core monitoring service
- `hooks/useNotificationMonitor.ts` - React hook for monitoring functionality
- `app/(tabs)/settings.tsx` - Settings screen for enabling/disabling monitoring

## Configuration

### app.json
Already configured with:
- `POST_NOTIFICATIONS` permission
- `RECEIVE_BOOT_COMPLETED` permission (for background monitoring)
- Notification listener intent filter

## Testing

1. Enable monitoring in Settings tab
2. Grant required permissions
3. Send a test SMS to your device
4. Check if notification is detected and analyzed
5. Verify phishing alert appears if message is suspicious

## Limitations

- **Android**: Requires manual enablement of Notification Listener Service in system settings
- **iOS**: Limited to notification content (may not capture all SMS content)
- **Background**: May have limitations on background processing depending on device settings

## Troubleshooting

### Monitoring Not Working
1. Check if monitoring is enabled in Settings
2. Verify notification permissions are granted
3. On Android, ensure Notification Listener Service is enabled in system settings
4. Check app logs for errors

### Not Detecting SMS
- SMS notifications may vary by device/manufacturer
- Some SMS apps may not send notifications
- Check notification filtering logic in `NotificationMonitor.ts`

## Next Steps

1. **Install dependencies**: Run `npm install`
2. **Test on device**: Build and test on physical Android/iOS device
3. **Update Privacy Policy**: Add SMS monitoring details to your privacy policy
4. **Play Store Submission**: Prepare permission justification for Play Console

