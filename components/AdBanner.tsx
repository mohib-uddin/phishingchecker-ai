import React from 'react';
import { Platform, View } from 'react-native';
import {
    BannerAd,
    BannerAdSize,
} from 'react-native-google-mobile-ads';

const ANDROID_BANNER_UNIT_ID = 'ca-app-pub-1460870800928996/5709456431';

export default function AdBanner() {
  if (Platform.OS !== 'android') {
    return null;
  }

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <BannerAd
        unitId={ANDROID_BANNER_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}


