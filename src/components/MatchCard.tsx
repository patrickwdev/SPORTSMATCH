import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Match } from '../types';
import { colors } from '../theme/colors';
import { formatMatchMeta, formatScoreLine, hasLiveScore } from '../utils/gameStatus';
import { TeamBadge } from './TeamBadge';

interface Props {
  match: Match;
  onPress: () => void;
}

export function MatchCard({ match, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.row}>
        <TeamBadge team={match.awayTeam} />
        <Text style={styles.at}>@</Text>
        <TeamBadge team={match.homeTeam} />
      </View>
      <Text style={styles.matchup}>
        {match.awayTeam.name} vs {match.homeTeam.name}
      </Text>
      {hasLiveScore(match) && (
        <Text style={styles.score}>{formatScoreLine(match)}</Text>
      )}
      <Text style={styles.meta}>{formatMatchMeta(match)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.85,
    borderColor: colors.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  at: {
    color: colors.textMuted,
    fontSize: 14,
  },
  matchup: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  score: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
