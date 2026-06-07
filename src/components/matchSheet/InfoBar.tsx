import { StyleSheet, Text, View } from 'react-native';
import type { Match } from '../../types';
import { colors } from '../../theme/colors';
import {
  formatGameStatusLabel,
  formatScoreLine,
  isFinalGame,
  isLiveGame,
  shouldShowScore,
} from '../../utils/gameStatus';
import { isFootballSport } from '../../utils/sport';

interface Props {
  match: Match;
}

export function InfoBar({ match }: Props) {
  const statusLabel = formatGameStatusLabel(match.gameStatus);
  const scoreLine = shouldShowScore(match) ? formatScoreLine(match) : null;

  if (isFootballSport(match.sport)) {
    const kickoff =
      isLiveGame(match) || isFinalGame(match)
        ? (match.statusDetail ?? statusLabel)
        : `Kickoff: ${match.startTime}`;

    return (
      <View style={styles.footballBar}>
        <Text style={styles.footballLine} numberOfLines={2}>
          {scoreLine ?? kickoff}
        </Text>
        {match.weather ? (
          <Text style={styles.footballLine} numberOfLines={2}>
            Weather: {match.weather}
          </Text>
        ) : null}
        <Text style={styles.footballLine} numberOfLines={2}>
          Location: {match.location}
        </Text>
      </View>
    );
  }

  const startLabel =
    isLiveGame(match) || isFinalGame(match)
      ? (match.statusDetail ?? statusLabel)
      : `Match Starts: ${match.startTime}`;

  return (
    <View style={styles.bar}>
      <Text style={styles.side} numberOfLines={1}>
        {scoreLine ?? startLabel}
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
  footballBar: {
    backgroundColor: colors.infoBar,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  footballLine: {
    color: colors.text,
    fontSize: 11,
    textAlign: 'center',
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
