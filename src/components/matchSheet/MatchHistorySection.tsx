import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  GameResultLetter,
  HeadToHeadGame,
  Match,
  Sport,
  TeamRecentGame,
  TeamRecentSummary,
  TeamSummary,
} from '../../types';
import { colors } from '../../theme/colors';
import { useMatchHistory } from '../../hooks/useMatchHistory';
import { TeamBadge } from '../TeamBadge';

type HistoryTab = 'h2h' | 'away' | 'home';

interface Props {
  match: Match;
}

export function MatchHistorySection({ match }: Props) {
  const { history, loading } = useMatchHistory(match);
  const [tab, setTab] = useState<HistoryTab>('h2h');

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={colors.infoBar} />
      </View>
    );
  }

  if (!history) {
    return null;
  }

  const activeTeam = tab === 'away' ? match.awayTeam : match.homeTeam;
  const activeGames = tab === 'away' ? history.awayRecent : history.homeRecent;
  const activeSummary =
    tab === 'away' ? history.awayRecentSummary : history.homeRecentSummary;

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TabButton
          label="HEAD-TO-HEAD"
          active={tab === 'h2h'}
          onPress={() => setTab('h2h')}
        />
        <TabButton
          label={match.awayTeam.abbreviation.toUpperCase()}
          team={match.awayTeam}
          active={tab === 'away'}
          onPress={() => setTab('away')}
        />
        <TabButton
          label={match.homeTeam.abbreviation.toUpperCase()}
          team={match.homeTeam}
          active={tab === 'home'}
          onPress={() => setTab('home')}
        />
      </View>

      {tab === 'h2h' ? (
        <HeadToHeadView
          match={match}
          games={history.headToHead}
          summary={history.headToHeadSummary}
        />
      ) : (
        <TeamLastTenView
          team={activeTeam}
          games={activeGames}
          summary={activeSummary}
          sport={match.sport}
        />
      )}
    </View>
  );
}

function HeadToHeadView({
  match,
  games,
  summary,
}: {
  match: Match;
  games: HeadToHeadGame[];
  summary: TeamRecentSummary;
}) {
  const showBetting = match.sport === 'MLB';

  return (
    <>
      <View style={styles.teamHeader}>
        <TeamBadge team={match.awayTeam} size="md" />
        <Text style={styles.h2hVs}>vs</Text>
        <TeamBadge team={match.homeTeam} size="md" />
        <Text style={styles.teamTitle}>
          {match.awayTeam.abbreviation} vs {match.homeTeam.abbreviation} • Head To Head
        </Text>
      </View>

      <View style={styles.summaryRowThree}>
        <SummaryCard label="Win / Loss" value={summary.winLoss} team={match.awayTeam} />
        <SummaryCard
          label="Over / Under"
          value={showBetting ? summary.overUnder : '—'}
        />
        <SummaryCard label="ML" value={showBetting ? summary.mlProfit : '—'} />
      </View>

      <HeadToHeadTable
        games={games}
        match={match}
        showBetting={showBetting}
      />
    </>
  );
}

function TeamLastTenView({
  team,
  games,
  summary,
  sport,
}: {
  team: TeamSummary;
  games: TeamRecentGame[];
  summary: TeamRecentSummary;
  sport: Sport;
}) {
  const showBetting = sport === 'MLB';

  return (
    <>
      <View style={styles.teamHeader}>
        <TeamBadge team={team} size="md" />
        <Text style={styles.teamTitle}>{team.name} Record • Last 10</Text>
      </View>

      <View style={styles.summaryRowThree}>
        <SummaryCard label="Win / Loss" value={summary.winLoss} team={team} />
        <SummaryCard
          label="Over / Under"
          value={showBetting ? summary.overUnder : '—'}
        />
        <SummaryCard label="ML" value={showBetting ? summary.mlProfit : '—'} />
      </View>

      <RecentGamesTable games={games} team={team} showBetting={showBetting} />
    </>
  );
}

function TabButton({
  label,
  team,
  active,
  onPress,
}: {
  label: string;
  team?: TeamSummary;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
    >
      {team ? <TeamBadge team={team} size="sm" /> : null}
      <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function HeadToHeadTable({
  games,
  match,
  showBetting,
}: {
  games: HeadToHeadGame[];
  match: Match;
  showBetting: boolean;
}) {
  if (games.length === 0) {
    return <Text style={styles.empty}>No previous meetings found</Text>;
  }

  const tableWidth = showBetting ? H2H_COL.total : H2H_COL.basicTotal;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator bounces={false}>
      <View style={[styles.table, { width: tableWidth }]}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <HeaderCell w={H2H_COL.date} text="Date" />
          <HeaderCell w={H2H_COL.home} text="Home" />
          <HeaderCell w={H2H_COL.result} text="Result" />
          {showBetting ? (
            <>
              <HeaderCell w={H2H_COL.ml} text="ML" />
              <HeaderCell w={H2H_COL.ou} text="O/U" />
              <HeaderCell
                w={H2H_COL.starter}
                text={`${match.awayTeam.abbreviation} Starter (IP)`}
              />
              <HeaderCell
                w={H2H_COL.starter}
                text={`${match.homeTeam.abbreviation} Starter (IP)`}
              />
            </>
          ) : null}
        </View>
        {games.map((game, index) => {
          const { result, usScore, themScore } = matchAwayGameView(
            game,
            match.awayTeam.abbreviation,
          );
          return (
            <View
              key={`${game.date}-${game.awayAbbreviation}-${game.homeAbbreviation}-${index}`}
              style={[styles.tableRow, index % 2 === 1 && styles.rowAlt]}
            >
              <DataCell w={H2H_COL.date} text={game.date} />
              <DataCell w={H2H_COL.home} text={game.homeAbbreviation} accent />
              <View style={[styles.cell, { width: H2H_COL.result }]}>
                <Text style={styles.resultLine}>
                  <Text style={styles.resultLetter}>{result}</Text>
                  <Text style={[styles.resultScore, styles.scoreUnderline]}>
                    {' '}
                    {usScore} - {themScore}
                  </Text>
                </Text>
              </View>
              {showBetting ? (
                <>
                  <View style={[styles.cell, { width: H2H_COL.ml }]}>
                    <BettingResultCell
                      result={game.awayMlResult}
                      detail={game.awayMoneyLine ?? '—'}
                    />
                  </View>
                  <DataCell
                    w={H2H_COL.ou}
                    text={formatOuCell(game.ouResult, game.overUnderLine)}
                  />
                  <StarterCell
                    w={H2H_COL.starter}
                    name={game.matchAwayStarterName}
                    ip={game.matchAwayStarterIp}
                  />
                  <StarterCell
                    w={H2H_COL.starter}
                    name={game.matchHomeStarterName}
                    ip={game.matchHomeStarterIp}
                  />
                </>
              ) : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function matchAwayGameView(
  game: HeadToHeadGame,
  matchAwayAbbreviation: string,
): { result: GameResultLetter; usScore: number; themScore: number } {
  const matchAwayWasEventAway = game.awayAbbreviation === matchAwayAbbreviation;
  const usScore = matchAwayWasEventAway ? game.awayScore : game.homeScore;
  const themScore = matchAwayWasEventAway ? game.homeScore : game.awayScore;

  if (game.winnerSide === 'tie') {
    return { result: 'T', usScore, themScore };
  }

  const matchAwayWon =
    (game.winnerSide === 'away' && matchAwayWasEventAway) ||
    (game.winnerSide === 'home' && !matchAwayWasEventAway);

  return { result: matchAwayWon ? 'W' : 'L', usScore, themScore };
}

function SummaryCard({
  label,
  value,
  team,
}: {
  label: string;
  value: string;
  team?: TeamSummary;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <View style={styles.summaryValueRow}>
        <Text style={styles.summaryValue}>{value}</Text>
        {team ? <TeamBadge team={team} size="sm" /> : null}
      </View>
    </View>
  );
}

function RecentGamesTable({
  games,
  team,
  showBetting,
}: {
  games: TeamRecentGame[];
  team: TeamSummary;
  showBetting: boolean;
}) {
  if (games.length === 0) {
    return <Text style={styles.empty}>No recent games</Text>;
  }

  const tableWidth = showBetting ? TEAM_COL.total : TEAM_COL.basicTotal;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator bounces={false}>
      <View style={[styles.table, { width: tableWidth }]}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <HeaderCell w={TEAM_COL.date} text="Date" />
          <HeaderCell w={TEAM_COL.vs} text="vs" />
          <HeaderCell w={TEAM_COL.result} text="Result" />
          {showBetting ? (
            <>
              <HeaderCell w={TEAM_COL.ml} text="ML" />
              <HeaderCell w={TEAM_COL.ou} text="O/U" />
              <HeaderCell w={TEAM_COL.starter} text={`${team.abbreviation} Starter (IP)`} />
              <HeaderCell w={TEAM_COL.starter} text="Opp Starter (IP)" />
            </>
          ) : null}
        </View>
        {games.map((game, index) => (
          <View
            key={`${game.date}-${game.opponentAbbreviation}-${index}`}
            style={[styles.tableRow, index % 2 === 1 && styles.rowAlt]}
          >
            <DataCell w={TEAM_COL.date} text={game.date} />
            <View style={[styles.cell, styles.vsCell, { width: TEAM_COL.vs }]}>
              <Text style={styles.vsPrefix}>{game.venue === 'A' ? '@' : ''}</Text>
              <OpponentBadge game={game} />
              <Text style={styles.vsAbbr}>{game.opponentAbbreviation}</Text>
            </View>
            <View style={[styles.cell, { width: TEAM_COL.result }]}>
              <Text style={styles.resultLine}>
                <Text style={styles.resultLetter}>{game.result}</Text>
                <Text style={[styles.resultScore, styles.scoreUnderline]}>
                  {' '}
                  {game.usScore} - {game.themScore}
                </Text>
              </Text>
            </View>
            {showBetting ? (
              <>
                <View style={[styles.cell, { width: TEAM_COL.ml }]}>
                  <BettingResultCell
                    result={game.mlResult}
                    detail={game.moneyLine ?? '—'}
                  />
                </View>
                <DataCell
                  w={TEAM_COL.ou}
                  text={formatOuCell(game.ouResult, game.overUnderLine)}
                />
                <StarterCell
                  w={TEAM_COL.starter}
                  name={game.starterName}
                  ip={game.starterIp}
                />
                <StarterCell
                  w={TEAM_COL.starter}
                  name={game.oppStarterName}
                  ip={game.oppStarterIp}
                />
              </>
            ) : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function OpponentBadge({ game }: { game: TeamRecentGame }) {
  return (
    <TeamBadge
      team={{
        id: game.opponentAbbreviation,
        name: game.opponentAbbreviation,
        abbreviation: game.opponentAbbreviation,
        color: '#333333',
        logoUrl: game.opponentLogoUrl,
        record: { overall: '—', winPct: '—', points: '—', streak: '—' },
      }}
      size="sm"
    />
  );
}

function BettingResultCell({
  result,
  detail,
}: {
  result?: GameResultLetter | null;
  detail: string;
}) {
  if (!result) {
    return <Text style={styles.dataCell}>—</Text>;
  }
  return (
    <Text style={styles.dataCell}>
      <Text style={styles.resultLetter}>{result}</Text>
      {detail !== '—' ? ` ${detail}` : ''}
    </Text>
  );
}

function StarterCell({
  w,
  name,
  ip,
}: {
  w: number;
  name?: string | null;
  ip?: string | null;
}) {
  if (!name) {
    return (
      <View style={[styles.cell, { width: w }]}>
        <Text style={styles.dataCell}>—</Text>
      </View>
    );
  }
  return (
    <View style={[styles.cell, { width: w }]}>
      <Text style={styles.dataCell} numberOfLines={1}>
        <Text style={styles.starterName}>{name}</Text>
        {ip ? ` (${ip})` : ''}
      </Text>
    </View>
  );
}

function formatOuCell(
  ouResult?: 'o' | 'u' | 'p' | null,
  line?: string | null,
): string {
  if (!ouResult || !line) return '—';
  const prefix = ouResult === 'p' ? 'P' : ouResult;
  return `${prefix}${line}`;
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
  accent,
}: {
  w: number;
  text: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.cell, { width: w }]}>
      <Text style={[styles.dataCell, accent && styles.linkText]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const H2H_COL = {
  date: 88,
  home: 52,
  result: 88,
  ml: 72,
  ou: 56,
  starter: 108,
  get basicTotal() {
    return this.date + this.home + this.result;
  },
  get total() {
    return this.date + this.home + this.result + this.ml + this.ou + this.starter * 2;
  },
};

const TEAM_COL = {
  date: 88,
  vs: 78,
  result: 88,
  ml: 72,
  ou: 56,
  starter: 108,
  get basicTotal() {
    return this.date + this.vs + this.result;
  },
  get total() {
    return this.date + this.vs + this.result + this.ml + this.ou + this.starter * 2;
  },
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  loadingWrap: {
    paddingVertical: 32,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.tabActive,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: colors.text,
  },
  teamHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 14,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  h2hVs: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  teamTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    flexBasis: '100%',
    textAlign: 'center',
  },
  summaryRowThree: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: colors.background,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  summaryValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  summaryCaption: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeader: {
    backgroundColor: colors.headerBg,
    minHeight: 34,
  },
  rowAlt: {
    backgroundColor: colors.rowAlt,
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    height: '100%',
  },
  headerCell: {
    backgroundColor: colors.headerBg,
  },
  headerText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '700',
  },
  dataCell: {
    color: colors.text,
    fontSize: 11,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  vsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vsPrefix: {
    color: colors.textMuted,
    fontSize: 10,
    width: 10,
  },
  vsAbbr: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  resultCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultLetter: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  resultScore: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  scoreUnderline: {
    textDecorationLine: 'underline',
    textDecorationColor: colors.tabActive,
  },
  starterName: {
    textDecorationLine: 'underline',
    textDecorationColor: colors.tabActive,
    fontWeight: '600',
  },
  empty: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
});
