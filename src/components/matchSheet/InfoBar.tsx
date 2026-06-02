import { StyleSheet, Text, View } from 'react-native';
import type { Match } from '../../types';
import { colors } from '../../theme/colors';
import { formatGameStatusLabel, hasLiveScore } from '../../utils/gameStatus';

interface Props {
  match: Match;
}

export function InfoBar({ match }: Props) {
  const statusLabel = formatGameStatusLabel(match.gameStatus);
  const startLabel =
    match.gameStatus === 'in_progress' || match.gameStatus === 'final'
      ? match.statusDetail ?? statusLabel
      : `Match Starts: ${match.startTime}`;

  return (
    <View style={styles.bar}>
      <Text style={styles.side} numberOfLines={1}>
        {hasLiveScore(match)
          ? `${match.awayTeam.abbreviation} ${match.awayScore} – ${match.homeScore} ${match.homeTeam.abbreviation}`
          : startLabel}
      </Text>
      <Text style={styles.center}>Statistical Matchup Information</Text>
      <Text style={[styles.side, styles.right]} numberOfLines={1}>
        Location: {match.location}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.infoBar,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  side: {
    flex: 1,
    color: colors.text,
    fontSize: 9,
  },
  right: {
    textAlign: 'right',
  },
  center: {
    flex: 1.2,
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
