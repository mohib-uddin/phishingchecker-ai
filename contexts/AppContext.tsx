import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AnalysisResult, AppStats, ScanRecord } from '@/types/phishing';

const STORAGE_KEY = '@phishing_checker_history';
const STATS_KEY = '@phishing_checker_stats';

export const [AppProvider, useApp] = createContextHook(() => {
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [stats, setStats] = useState<AppStats>({
    totalScans: 0,
    threatsFound: 0,
    safeMessages: 0,
  });

  const historyQuery = useQuery({
    queryKey: ['scanHistory'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as ScanRecord[]) : [];
    },
  });

  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STATS_KEY);
      return stored
        ? (JSON.parse(stored) as AppStats)
        : { totalScans: 0, threatsFound: 0, safeMessages: 0 };
    },
  });

  useEffect(() => {
    if (historyQuery.data) {
      setScanHistory(historyQuery.data);
    }
  }, [historyQuery.data]);

  useEffect(() => {
    if (statsQuery.data) {
      setStats(statsQuery.data);
    }
  }, [statsQuery.data]);

  const saveHistoryMutation = useMutation({
    mutationFn: async (history: ScanRecord[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      return history;
    },
  });

  const saveStatsMutation = useMutation({
    mutationFn: async (newStats: AppStats) => {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(newStats));
      return newStats;
    },
  });

  const addScanRecord = (
    message: string,
    result: AnalysisResult,
    language: string
  ) => {
    const newRecord: ScanRecord = {
      id: Date.now().toString(),
      message,
      result,
      timestamp: Date.now(),
      language,
    };

    const updatedHistory = [newRecord, ...scanHistory].slice(0, 50);
    setScanHistory(updatedHistory);
    saveHistoryMutation.mutate(updatedHistory);

    const updatedStats: AppStats = {
      totalScans: stats.totalScans + 1,
      threatsFound: result.is_phishing
        ? stats.threatsFound + 1
        : stats.threatsFound,
      safeMessages: !result.is_phishing
        ? stats.safeMessages + 1
        : stats.safeMessages,
    };
    setStats(updatedStats);
    saveStatsMutation.mutate(updatedStats);
  };

  const clearHistory = useCallback(async () => {
    setScanHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const analyzeMutation = useMutation({
    mutationFn: async ({
      message,
      language,
    }: {
      message: string;
      language: string;
    }) => {
      const response = await fetch(
        'https://phishing-backend-476481782289.us-west1.run.app/api/analyze',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, language }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze message');
      }

      const result = (await response.json()) as AnalysisResult;
      addScanRecord(message, result, language);
      return result;
    },
  });

  const { mutate, isPending, error, data } = analyzeMutation;

  return useMemo(
    () => ({
      scanHistory,
      stats,
      analyze: mutate,
      isAnalyzing: isPending,
      analysisError: error,
      lastResult: data,
      clearHistory,
      isLoading: historyQuery.isLoading || statsQuery.isLoading,
    }),
    [
      scanHistory,
      stats,
      mutate,
      isPending,
      error,
      data,
      clearHistory,
      historyQuery.isLoading,
      statsQuery.isLoading,
    ]
  );
});
