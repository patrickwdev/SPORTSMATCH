import { Picker } from '@react-native-picker/picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPORTS } from '../constants/sports';
import type { RootStackParamList } from '../navigation/types';
import type { Sport } from '../types';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const [sport, setSport] = useState<Sport>('NFL');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sports Matchup</Text>
        <Text style={styles.subtitle}>Statistical dashboards for the week ahead</Text>

        <Text style={styles.label}>Select a league</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={sport}
            onValueChange={(v) => setSport(v as Sport)}
            style={styles.picker}
            dropdownIconColor={colors.text}
            itemStyle={Platform.OS === 'ios' ? styles.pickerItem : undefined}
          >
            {SPORTS.map((s) => (
              <Picker.Item key={s} label={s} value={s} color={Platform.OS === 'ios' ? colors.text : colors.text} />
            ))}
          </Picker>
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate('Matches', { sport })}
        >
          <Text style={styles.buttonText}>View This Week&apos;s Matches</Text>
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
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: 24,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text,
    ...(Platform.OS === 'android' ? { backgroundColor: colors.surface } : {}),
  },
  pickerItem: {
    color: colors.text,
    fontSize: 18,
  },
  button: {
    backgroundColor: colors.infoBar,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
