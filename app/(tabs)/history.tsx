import AdBanner from '@/components/AdBanner';
import { useApp } from '@/contexts/AppContext';
import type { ScanRecord } from '@/types/phishing';
import { AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HistoryScreen() {
  const { scanHistory, clearHistory } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all scan records?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearHistory(),
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: ScanRecord }) => {
    const isExpanded = expandedId === item.id;
    const isPhishing = item.result.is_phishing;

    return (
      <TouchableOpacity
        style={styles.scanCard}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.scanHeader}>
          <View
            style={[
              styles.statusBadge,
              isPhishing ? styles.statusBadgeDanger : styles.statusBadgeSafe,
            ]}
          >
            {isPhishing ? (
              <AlertCircle size={16} color="#dc2626" strokeWidth={2.5} />
            ) : (
              <CheckCircle size={16} color="#16a34a" strokeWidth={2.5} />
            )}
            <Text
              style={[
                styles.statusBadgeText,
                isPhishing
                  ? styles.statusBadgeTextDanger
                  : styles.statusBadgeTextSafe,
              ]}
            >
              {isPhishing ? 'Threat' : 'Safe'}
            </Text>
          </View>
          <View style={styles.timeContainer}>
            <Clock size={14} color="#94a3b8" />
            <Text style={styles.timeText}>{formatDate(item.timestamp)}</Text>
          </View>
        </View>

        <Text style={styles.messagePreview} numberOfLines={isExpanded ? 0 : 2}>
          {item.message}
        </Text>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Key Indicators:</Text>
              {item.result.key_indicators.map((indicator, index) => (
                <View key={index} style={styles.indicatorItem}>
                  <View style={styles.indicatorDot} />
                  <Text style={styles.indicatorText}>{indicator}</Text>
                </View>
              ))}
            </View>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Analysis:</Text>
              <Text style={styles.detailText}>
                {item.result.analysis_details}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (scanHistory.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Clock size={64} color="#cbd5e1" strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>No Scan History</Text>
          <Text style={styles.emptySubtitle}>
            Your analyzed messages will appear here
          </Text>
        </View>
        <View style={styles.adFooter}>
          <AdBanner />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>Scan History</Text>
          <Text style={styles.headerSubtitle}>
            {scanHistory.length} {scanHistory.length === 1 ? 'scan' : 'scans'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearHistory}
        >
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={scanHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
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
  scanCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeDanger: {
    backgroundColor: '#fef2f2',
  },
  statusBadgeSafe: {
    backgroundColor: '#f0fdf4',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  statusBadgeTextDanger: {
    color: '#dc2626',
  },
  statusBadgeTextSafe: {
    color: '#16a34a',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  messagePreview: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e293b',
    marginBottom: 8,
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    marginLeft: 4,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563eb',
    marginTop: 7,
    marginRight: 8,
  },
  indicatorText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
});
