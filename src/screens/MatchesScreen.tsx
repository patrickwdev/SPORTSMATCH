import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DayPicker } from '../components/DayPicker';
import { MatchCard } from '../components/MatchCard';
import { isSupabaseConfigured } from '../data/matchesApi';
import { useMatchesForSport } from '../hooks/useMatchesForSport';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import {
  formatSelectedDayLabel,
  getNext7DayOptions,
  toISODateLocal,
} from '../utils/dates';

type Props = NativeStackScreenProps<RootStackParamList, 'Matches'>;

export function MatchesScreen({ navigation, route }: Props) {
  const { sport } = route.params;
  const { matches, loading, error, refetch } = useMatchesForSport(sport);
  const dayOptions = useMemo(() => getNext7DayOptions(), []);
  const [selectedDate, setSelectedDate] = useState(() => toISODateLocal(new Date()));

  const displayedMatches = useMemo(
    () => matches.filter((m) => m.gameDate === selectedDate),
    [matches, selectedDate],
  );

  const headerSubtitle = formatSelectedDayLabel(selectedDate);

  const hasLiveGamesToday = useMemo(
    () =>
      matches.some(
        (m) =>
          m.gameDate === selectedDate &&
          (m.gameStatus === 'in_progress' || m.gameStatus === 'scheduled'),
      ),
    [matches, selectedDate],
  );

  useFocusEffect(
    useCallback(() => {
      if (!hasLiveGamesToday) return;
      const interval = setInterval(() => refetch(), 60_000);
      return () => clearInterval(interval);
    }, [hasLiveGamesToday, refetch]),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['bottom']}>
        <ActivityIndicator size="large" color={colors.infoBar} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered} edges={['bottom']}>
        <Text style={styles.errorTitle}>Could not load matches</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
        {!isSupabaseConfigured && (
          <Text style={styles.hint}>
            Using local mock data. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
            to connect Supabase.
          </Text>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.sport}>{sport}</Text>
        <Text style={styles.week}>{headerSubtitle}</Text>
      </View>
      <DayPicker
        days={dayOptions}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />
      <FlatList
        data={displayedMatches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            onPress={() => navigation.navigate('MatchSheet', { matchId: item.id })}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No games scheduled for this day.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sport: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  week: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 32,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.infoBar,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryText: {
    color: colors.text,
    fontWeight: '700',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
