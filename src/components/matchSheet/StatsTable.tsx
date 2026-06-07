import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Match } from '../../types';
import { colors } from '../../theme/colors';
import { formatStatValue, rankColor, sportMaxTeams } from '../../utils/format';
import { footballSeasonYear, isFootballSport } from '../../utils/sport';
import { TeamBadge } from '../TeamBadge';

interface Props {
  match: Match;
}

const COL = {
  stat: 72,
  season: 44,
  split: 44,
  last5: 44,
  rank: 36,
  adv: 36,
};

const TABLE_WIDTH =
  COL.stat + COL.season + COL.split + COL.last5 + COL.rank + COL.adv + COL.rank + COL.last5 + COL.split + COL.season + COL.stat;

export function StatsTable({ match }: Props) {
  const maxTeams = sportMaxTeams(match.sport);
  const football = isFootballSport(match.sport);
  const seasonYear = String(footballSeasonYear());
  const recentLabel = football ? 'L3 Avg' : 'Last 5';
  const rankLabel = football ? 'L3 Rank' : 'L5 Rank';

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator bounces={false}>
      <View style={{ width: TABLE_WIDTH }}>
        <View style={[styles.row, styles.headerRow]}>
          <HeaderCell w={COL.stat} text="Statistic" />
          <HeaderCell w={COL.season} text={seasonYear} />
          <HeaderCell w={COL.split} text="Away" />
          <HeaderCell w={COL.last5} text={recentLabel} />
          <HeaderCell w={COL.rank} text={rankLabel} />
          <HeaderCell w={COL.adv} text="Adv" />
          <HeaderCell w={COL.rank} text={rankLabel} />
          <HeaderCell w={COL.last5} text={recentLabel} />
          <HeaderCell w={COL.split} text="Home" />
          <HeaderCell w={COL.season} text={seasonYear} />
          <HeaderCell w={COL.stat} text="Statistic" />
        </View>

        {match.stats.map((stat, index) => (
          <View
            key={stat.id}
            style={[styles.row, index % 2 === 1 && styles.rowAlt]}
          >
            <DataCell w={COL.stat} text={stat.label} bold />
            <DataCell w={COL.season} text={formatStatValue(stat.awaySeason, stat.format)} />
            <DataCell w={COL.split} text={formatStatValue(stat.awaySplit, stat.format)} />
            <DataCell w={COL.last5} text={formatStatValue(stat.awayLast5, stat.format)} />
            <RankCell w={COL.rank} rank={stat.awayL5Rank} maxTeams={maxTeams} />
            <View style={[styles.cell, { width: COL.adv }]}>
              {stat.awayAdvantage === null ? (
                <Text style={styles.tie}>—</Text>
              ) : (
                <TeamBadge
                  team={stat.awayAdvantage ? match.awayTeam : match.homeTeam}
                  size="sm"
                />
              )}
            </View>
            <RankCell w={COL.rank} rank={stat.homeL5Rank} maxTeams={maxTeams} />
            <DataCell w={COL.last5} text={formatStatValue(stat.homeLast5, stat.format)} />
            <DataCell w={COL.split} text={formatStatValue(stat.homeSplit, stat.format)} />
            <DataCell w={COL.season} text={formatStatValue(stat.homeSeason, stat.format)} />
            <DataCell w={COL.stat} text={stat.label} bold alignRight />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function HeaderCell({ w, text }: { w: number; text: string }) {
  return (
    <View style={[styles.cell, styles.headerCell, { width: w }]}>
      <Text style={styles.headerText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

function DataCell({
  w,
  text,
  bold,
  alignRight,
}: {
  w: number;
  text: string;
  bold?: boolean;
  alignRight?: boolean;
}) {
  return (
    <View style={[styles.cell, { width: w }]}>
      <Text
        style={[styles.dataText, bold && styles.bold, alignRight && styles.alignRight]}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

function RankCell({ w, rank, maxTeams }: { w: number; rank: number; maxTeams: number }) {
  return (
    <View style={[styles.cell, { width: w }]}>
      <Text style={[styles.rankText, { color: rankColor(rank, maxTeams) }]}>{rank}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 32,
    alignItems: 'center',
  },
  rowAlt: {
    backgroundColor: colors.rowAlt,
  },
  headerRow: {
    backgroundColor: colors.headerBg,
    minHeight: 36,
  },
  cell: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 4,
    height: '100%',
  },
  headerCell: {
    backgroundColor: colors.headerBg,
  },
  headerText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  dataText: {
    color: colors.text,
    fontSize: 10,
    textAlign: 'center',
  },
  bold: {
    fontWeight: '700',
    fontSize: 9,
  },
  alignRight: {
    textAlign: 'right',
    width: '100%',
    paddingRight: 4,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tie: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
