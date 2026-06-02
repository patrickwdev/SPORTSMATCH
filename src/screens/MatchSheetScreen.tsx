import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InfoBar } from '../components/matchSheet/InfoBar';
import { StatsTable } from '../components/matchSheet/StatsTable';
import { TeamHeader } from '../components/matchSheet/TeamHeader';
import { useMatch } from '../hooks/useMatch';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchSheet'>;

export function MatchSheetScreen({ route }: Props) {
  const { match, loading, error, refetch } = useMatch(route.params.matchId);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.infoBar} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>Could not load match</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!match) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Match not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView stickyHeaderIndices={[1]} bounces={false}>
        <TeamHeader match={match} />
        <View>
          <InfoBar match={match} />
        </View>
        <View style={styles.tableSection}>
          {match.stats.length > 0 ? (
            <>
              <Text style={styles.hint}>Swipe horizontally for full stats →</Text>
              <StatsTable match={match} />
            </>
          ) : (
            <Text style={styles.noStats}>Season stats could not be loaded for this matchup.</Text>
          )}
        </View>
      </ScrollView>
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
  tableSection: {
    paddingBottom: 24,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8,
  },
  noStats: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  error: {
    color: colors.text,
    textAlign: 'center',
    marginTop: 48,
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
  },
  retryText: {
    color: colors.text,
    fontWeight: '700',
  },
});
