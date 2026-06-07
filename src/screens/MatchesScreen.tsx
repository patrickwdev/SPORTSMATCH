import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { dayPickerBackwardDays, dayPickerForwardDays } from '../constants/sports';
import { isSupabaseConfigured } from '../data/matchesApi';
import { useMatchesForSport } from '../hooks/useMatchesForSport';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import {
  buildMatchDayPickerOptions,
  dateFromIso,
  defaultMatchDayIso,
  formatSelectedDayLabel,
  todayIsoForSport,
} from '../utils/dates';

type Props = NativeStackScreenProps<RootStackParamList, 'Matches'>;

export function MatchesScreen({ navigation, route }: Props) {
  const { sport } = route.params;
  const { matches, loading, refreshing, error, refetch } = useMatchesForSport(sport);
  const forwardDays = dayPickerForwardDays(sport);
  const backwardDays = dayPickerBackwardDays(sport);
  const todayIso = todayIsoForSport(sport);
  const dayOptions = useMemo(
    () =>
      buildMatchDayPickerOptions(matches, {
        forwardDays,
        backwardDays,
        anchor: dateFromIso(todayIso),
        sport,
      }),
    [matches, forwardDays, backwardDays, todayIso],
  );
  const [selectedDate, setSelectedDate] = useState(() => todayIsoForSport(sport));
  const [userPickedDate, setUserPickedDate] = useState(false);

  useEffect(() => {
    setSelectedDate(todayIsoForSport(sport));
    setUserPickedDate(false);
  }, [sport]);

  useEffect(() => {
    if (userPickedDate || loading) return;
    const preferred = matches.length > 0 ? defaultMatchDayIso(matches, sport) : todayIso;
    setSelectedDate(preferred);
  }, [todayIso, matches, sport, userPickedDate, loading]);

  const activeDate = useMemo(() => {
    if (userPickedDate) return selectedDate;
    if (matches.length === 0) return selectedDate;
    return defaultMatchDayIso(matches, sport);
  }, [userPickedDate, selectedDate, matches, sport]);

  useEffect(() => {
    if (loading || userPickedDate) return;
    if (activeDate !== selectedDate) {
      setSelectedDate(activeDate);
    }
  }, [loading, userPickedDate, activeDate, selectedDate]);

  useEffect(() => {
    if (
      userPickedDate &&
      dayOptions.length > 0 &&
      !dayOptions.some((d) => d.isoDate === selectedDate)
    ) {
      const preferred =
        matches.length > 0 ? defaultMatchDayIso(matches, sport) : todayIso;
      setSelectedDate(preferred);
      setUserPickedDate(false);
    }
  }, [userPickedDate, dayOptions, selectedDate, matches, sport, todayIso]);

  const handleSelectDate = useCallback((isoDate: string) => {
    setUserPickedDate(true);
    setSelectedDate(isoDate);
  }, []);

  const displayedMatches = useMemo(
    () => matches.filter((m) => m.gameDate === activeDate),
    [matches, activeDate],
  );

  const headerSubtitle = formatSelectedDayLabel(activeDate, todayIso);

  const shouldRefreshLiveScores = useMemo(() => {
    const matchNeedsScoreUpdate = (m: (typeof matches)[number]) => {
      if (m.gameStatus === 'canceled' || m.gameStatus === 'postponed') return false;
      if (
        m.gameStatus === 'in_progress' ||
        m.gameStatus === 'delayed' ||
        m.gameStatus === 'suspended'
      ) {
        return true;
      }
      if (m.awayScore == null || m.homeScore == null) return true;
      return m.gameStatus !== 'final';
    };

    const dayMatches = matches.filter((m) => m.gameDate === activeDate);
    if (dayMatches.some(matchNeedsScoreUpdate)) return true;
    return matches.some((m) => m.gameStatus === 'in_progress');
  }, [matches, activeDate]);

  useFocusEffect(
    useCallback(() => {
      if (!shouldRefreshLiveScores) return;
      refetch();
      const interval = setInterval(() => refetch(), 60_000);
      return () => clearInterval(interval);
    }, [shouldRefreshLiveScores, refetch]),
  );

  if (loading && matches.length === 0) {
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
      <View style={styles.topSection}>
        <View style={styles.header}>
          <Text style={styles.sport}>{sport}</Text>
          <View style={styles.weekRow}>
            <Text style={styles.week}>{headerSubtitle}</Text>
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.infoBar} style={styles.weekSpinner} />
            ) : null}
          </View>
        </View>
        <DayPicker
          days={dayOptions}
          selectedDate={activeDate}
          onSelect={handleSelectDate}
        />
      </View>
      <FlatList
        style={styles.list}
        data={displayedMatches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  topSection: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 1,
    elevation: 2,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sport: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  week: {
    color: colors.textMuted,
    fontSize: 14,
  },
  weekSpinner: {
    transform: [{ scale: 0.85 }],
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    flexGrow: 1,
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
