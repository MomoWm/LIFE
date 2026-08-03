import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { CornerRadius, Spacing } from '@/constants/theme';
import { CALC_METHODS } from '@/lib/prayerTimes/adhanClient';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';

const METHOD_LABELS: Record<string, string> = {
  MoonsightingCommittee: 'Moonsighting Committee',
  MuslimWorldLeague: 'Muslim World League',
  NorthAmerica: 'ISNA (North America)',
  Egyptian: 'Egyptian',
  Karachi: 'Karachi',
  UmmAlQura: 'Umm al-Qura',
  Dubai: 'Dubai',
  Kuwait: 'Kuwait',
  Qatar: 'Qatar',
  Singapore: 'Singapore',
  Turkey: 'Turkey (Diyanet)',
};

export default function PrayerSettingsScreen() {
  const theme = useTheme();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [locating, setLocating] = useState(false);

  const refreshLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      let label: string | null = null;
      try {
        const [place] = await Location.reverseGeocodeAsync(position.coords);
        label = place ? [place.city, place.region].filter(Boolean).join(', ') : null;
      } catch {
        // best-effort label only
      }
      updateProfile.mutate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        location_label: label,
      });
    } finally {
      setLocating(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Prayer Settings', headerLargeTitle: false }} />
      <Screen>
        <Card style={styles.card}>
          <View style={styles.locationRow}>
            <Icon name="location.fill" size={18} tintColor={theme.tint} />
            <View style={styles.locationText}>
              <ThemedText type="smallBold">
                {profile?.location_label ?? 'Location not set'}
              </ThemedText>
              {profile?.latitude != null ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {profile.latitude.toFixed(3)}, {profile.longitude?.toFixed(3)}
                </ThemedText>
              ) : null}
            </View>
          </View>
          <Button
            title={locating ? 'Locating…' : 'Update location'}
            variant="tinted"
            onPress={refreshLocation}
            disabled={locating}
          />
        </Card>

        <Card style={styles.card}>
          <ThemedText type="smallBold">Calculation method</ThemedText>
          <View style={styles.chips}>
            {CALC_METHODS.map((method) => {
              const selected = profile?.prayer_calc_method === method;
              return (
                <Pressable
                  key={method}
                  onPress={() => updateProfile.mutate({ prayer_calc_method: method })}
                  style={[
                    styles.chip,
                    { backgroundColor: selected ? theme.tint : theme.backgroundElement },
                  ]}>
                  <ThemedText
                    type="small"
                    style={{ color: selected ? '#fff' : theme.textSecondary }}>
                    {METHOD_LABELS[method] ?? method}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.card}>
          <ThemedText type="smallBold">Asr madhab</ThemedText>
          <View style={styles.chips}>
            {(['shafi', 'hanafi'] as const).map((madhab) => {
              const selected = profile?.prayer_madhab === madhab;
              return (
                <Pressable
                  key={madhab}
                  onPress={() => updateProfile.mutate({ prayer_madhab: madhab })}
                  style={[
                    styles.chip,
                    { backgroundColor: selected ? theme.tint : theme.backgroundElement },
                  ]}>
                  <ThemedText
                    type="small"
                    style={{ color: selected ? '#fff' : theme.textSecondary }}>
                    {madhab === 'shafi' ? 'Shafi (earlier Asr)' : 'Hanafi (later Asr)'}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  locationText: {
    flex: 1,
    gap: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: CornerRadius.xlarge,
  },
});
