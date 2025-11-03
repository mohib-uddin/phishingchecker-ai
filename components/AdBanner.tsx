import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import mobileAds, {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

// Use test ad unit ID for development, replace with your actual ad unit ID for production
const ANDROID_BANNER_UNIT_ID = __DEV__ 
  ? TestIds.BANNER // Test ad unit ID for development
  : 'ca-app-pub-1460870800928996/5709456431'; // Your production ad unit ID

export default function AdBanner() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    // Ensure ads are initialized before rendering
    // Note: initialize() is idempotent, safe to call multiple times
    const initAds = async () => {
      try {
        await mobileAds().initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize ads:', error);
        setAdError('Failed to initialize ads');
        // Still try to render after a delay in case initialization happens elsewhere
        setTimeout(() => setIsInitialized(true), 2000);
      }
    };

    initAds();
  }, []);

  if (Platform.OS !== 'android') {
    return null;
  }

  // Don't render ad until SDK is initialized
  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={ANDROID_BANNER_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          console.log('Ad loaded successfully');
          setAdError(null);
        }}
        onAdFailedToLoad={(error: Error) => {
          console.error('Ad failed to load:', error);
          setAdError(error.message || 'Ad failed to load');
        }}
        onAdOpened={() => {
          console.log('Ad opened');
        }}
        onAdClosed={() => {
          console.log('Ad closed');
        }}
      />
      {adError && __DEV__ && (
        <View style={styles.errorContainer}>
          {/* Error only shown in development */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  placeholder: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
  },
  errorContainer: {
    // Error container for development debugging
  },
});


