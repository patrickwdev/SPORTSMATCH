import { StyleSheet, Text, View } from 'react-native';
import type { Match } from '../../types';
import { colors } from '../../theme/colors';
import { TeamBadge } from '../TeamBadge';

interface Props {
  match: Match;
}

function RecordTable({ record }: { record: Match['awayTeam']['record'] }) {
  const headers = ['Overall', 'Win %', 'Points', 'Streak'];
  const values = [record.overall, record.winPct, record.points, record.streak];
  return (
    <View style={styles.table}>
      <View style={styles.tableRow}>
        {headers.map((h) => (
          <View key={h} style={styles.cell}>
            <Text style={styles.headerText}>{h}</Text>
          </View>
        ))}
      </View>
      <View style={styles.tableRow}>
        {values.map((v, i) => (
          <View key={headers[i]} style={styles.cell}>
            <Text style={styles.valueText}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function TeamHeader({ match }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.half}>
        <View style={styles.teamRow}>
          <TeamBadge team={match.awayTeam} size="lg" />
          <Text style={styles.teamName}>{match.awayTeam.name}</Text>
        </View>
        <RecordTable record={match.awayTeam.record} />
      </View>
      <View style={styles.divider} />
      <View style={styles.half}>
        <View style={[styles.teamRow, styles.teamRowRight]}>
          <Text style={styles.teamName}>{match.homeTeam.name}</Text>
          <TeamBadge team={match.homeTeam} size="lg" />
        </View>
        <RecordTable record={match.homeTeam.record} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  half: {
    flex: 1,
    paddingHorizontal: 4,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  teamRowRight: {
    justifyContent: 'flex-end',
  },
  teamName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    flexShrink: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: 4,
    alignItems: 'center',
  },
  headerText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '600',
    backgroundColor: colors.headerBg,
    width: '100%',
    textAlign: 'center',
    paddingVertical: 3,
  },
  valueText: {
    color: colors.text,
    fontSize: 10,
    paddingVertical: 4,
    textAlign: 'center',
  },
});
