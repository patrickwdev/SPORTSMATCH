import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LeaguePicker } from '../components/LeaguePicker';
import type { RootStackParamList } from '../navigation/types';
import type { Sport } from '../types';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const [sport, setSport] = useState<Sport | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sports Matchup</Text>
        <Text style={styles.subtitle}>Statistical dashboards for the week ahead</Text>

        <Text style={styles.label}>Select a league</Text>
        <LeaguePicker value={sport} onChange={setSport} />

        <Pressable
          disabled={sport === null}
          style={({ pressed }) => [
            styles.button,
            sport === null && styles.buttonDisabled,
            pressed && sport !== null && styles.buttonPressed,
          ]}
          onPress={() => {
            if (sport) navigation.navigate('Matches', { sport });
          }}
        >
          <Text style={[styles.buttonText, sport === null && styles.buttonTextDisabled]}>
            View This Week&apos;s Matches
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 48,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  button: {
    backgroundColor: colors.infoBar,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: colors.headerBg,
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextDisabled: {
    color: colors.textMuted,
  },
});
