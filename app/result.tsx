import { useApp } from '@/contexts/AppContext';
import { router, Stack } from 'expo-router';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Shield,
} from 'lucide-react-native';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResultScreen() {
  const { lastResult } = useApp();
  const insets = useSafeAreaInsets();

  if (!lastResult) {
    router.back();
    return null;
  }

  const isPhishing = lastResult.is_phishing;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analysis Result</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.statusCard,
              isPhishing ? styles.statusCardDanger : styles.statusCardSafe,
            ]}
          >
            <View
              style={[
                styles.statusIconContainer,
                isPhishing
                  ? styles.statusIconDanger
                  : styles.statusIconSafe,
              ]}
            >
              {isPhishing ? (
                <AlertCircle size={40} color="#dc2626" strokeWidth={2.5} />
              ) : (
                <CheckCircle size={40} color="#16a34a" strokeWidth={2.5} />
              )}
            </View>
            <Text
              style={[
                styles.statusTitle,
                isPhishing ? styles.statusTitleDanger : styles.statusTitleSafe,
              ]}
            >
              {isPhishing ? 'Phishing Detected' : 'Message is Safe'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {isPhishing
                ? 'This message contains suspicious elements'
                : 'No immediate threats detected in this message'}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={20} color="#2563eb" />
              <Text style={styles.sectionTitle}>Key Indicators</Text>
            </View>
            <View style={styles.card}>
              {lastResult.key_indicators.map((indicator, index) => (
                <View key={index} style={styles.indicatorItem}>
                  <View style={styles.indicatorDot} />
                  <Text style={styles.indicatorText}>{indicator}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analysis Details</Text>
            <View style={styles.card}>
              <Text style={styles.detailsText}>
                {lastResult.analysis_details}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Recommendation</Text>
            <View
              style={[
                styles.card,
                isPhishing ? styles.cardDanger : styles.cardSafe,
              ]}
            >
              <Text style={styles.recommendationText}>
                {lastResult.security_recommendation}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statusCardDanger: {
    backgroundColor: '#fef2f2',
  },
  statusCardSafe: {
    backgroundColor: '#f0fdf4',
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusIconDanger: {
    backgroundColor: '#fee2e2',
  },
  statusIconSafe: {
    backgroundColor: '#dcfce7',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  statusTitleDanger: {
    color: '#dc2626',
  },
  statusTitleSafe: {
    color: '#16a34a',
  },
  statusSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
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
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDanger: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cardSafe: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563eb',
    marginTop: 7,
    marginRight: 12,
  },
  indicatorText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  detailsText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },
  recommendationText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  doneButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
