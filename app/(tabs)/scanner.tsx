import AdBanner from '@/components/AdBanner';
import { useApp } from '@/contexts/AppContext';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Keyboard,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ScannerScreen() {
  const { analyze, isAnalyzing, stats } = useApp();
  const [message, setMessage] = useState('');
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePaste = async () => {
    if (Platform.OS === 'web') {
      try {
        const text = await navigator.clipboard.readText();
        setMessage(text);
      } catch {
        Alert.alert('Error', 'Failed to read clipboard');
      }
    }
  };

  const handleAnalyze = () => {
    if (message.trim().length < 10) {
      Alert.alert(
        'Message Too Short',
        'Please enter at least 10 characters for analysis.'
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Keyboard.dismiss();

    analyze(
      { message: message.trim(), language: 'en' },
      {
        onSuccess: (result) => {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(
              result.is_phishing
                ? Haptics.NotificationFeedbackType.Warning
                : Haptics.NotificationFeedbackType.Success
            );
          }
          router.push('/result');
        },
        onError: (error) => {
          Alert.alert(
            'Analysis Failed',
            error instanceof Error
              ? error.message
              : 'Failed to analyze message. Please try again.'
          );
        },
      }
    );
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Shield size={48} color="#2563eb" strokeWidth={2} />
          </View>
          <Text style={styles.title}>Phishing Scanner</Text>
          <Text style={styles.subtitle}>
            Paste a suspicious message or email to check if it&apos;s safe
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalScans}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          <View style={[styles.statCard, styles.statCardDanger]}>
            <Text style={[styles.statValue, styles.statValueDanger]}>
              {stats.threatsFound}
            </Text>
            <Text style={styles.statLabel}>Threats</Text>
          </View>
          <View style={[styles.statCard, styles.statCardSafe]}>
            <Text style={[styles.statValue, styles.statValueSafe]}>
              {stats.safeMessages}
            </Text>
            <Text style={styles.statLabel}>Safe</Text>
          </View>
        </View>

        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Message Content</Text>
            <Text style={styles.charCount}>{message.length} characters</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Paste your suspicious email or message here...\n\nExample: Urgent! Your account will be suspended. Click here to verify: http://suspicious-link.com"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={12}
              textAlignVertical="top"
              editable={!isAnalyzing}
            />
          </View>

          <View style={styles.buttonRow}>
            {Platform.OS === 'web' && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handlePaste}
                disabled={isAnalyzing}
              >
                <Text style={styles.secondaryButtonText}>Paste</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                Platform.OS === 'web' && { flex: 1 },
              ]}
              onPress={() => setMessage('')}
              disabled={isAnalyzing || message.length === 0}
            >
              <Text style={styles.secondaryButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (isAnalyzing || message.trim().length < 10) &&
                styles.analyzeButtonDisabled,
            ]}
            onPress={handleAnalyze}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isAnalyzing || message.trim().length < 10}
            activeOpacity={0.8}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.analyzeButtonText}>Analyze Message</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.securityNote}>
          🔒 Your data is analyzed securely and not stored on our servers
        </Text>
      </ScrollView>
      <View style={styles.adFooter}>
        <AdBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  adFooter: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardDanger: {
    backgroundColor: '#fef2f2',
  },
  statCardSafe: {
    backgroundColor: '#f0fdf4',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 4,
  },
  statValueDanger: {
    color: '#dc2626',
  },
  statValueSafe: {
    color: '#16a34a',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  charCount: {
    fontSize: 13,
    color: '#94a3b8',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  textInput: {
    padding: 16,
    fontSize: 15,
    color: '#1e293b',
    minHeight: 200,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#475569',
  },
  analyzeButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 56,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  analyzeButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  securityNote: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },
});
