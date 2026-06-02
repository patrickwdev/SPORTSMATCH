/** @param {string} hex */
export function teamColor(hex) {
  if (!hex) return '#333333';
  return hex.startsWith('#') ? hex : `#${hex}`;
}

/** @param {Array<{ href?: string; rel?: string[] }> | undefined} logos */
export function pickTeamLogoUrl(logos) {
  if (!logos?.length) return null;
  const scoreboard = logos.find(
    (l) =>
      l.rel?.includes('full') &&
      l.rel?.includes('scoreboard') &&
      !l.rel?.includes('dark'),
  );
  if (scoreboard?.href) return scoreboard.href;

  const def = logos.find(
    (l) => l.rel?.includes('full') && l.rel?.includes('default') && !l.rel?.includes('dark'),
  );
  if (def?.href) return def.href;

  return logos[0]?.href ?? null;
}

/** @param {Array<{ href?: string; rel?: string[] }> | undefined} logos */
export function pickTeamLogoUrlDark(logos) {
  if (!logos?.length) return null;
  const dark = logos.find(
    (l) =>
      l.rel?.includes('full') &&
      l.rel?.includes('scoreboard') &&
      l.rel?.includes('dark'),
  );
  return dark?.href ?? null;
}

/** @param {object} team */
export function mapEspnTeamRow(team) {
  const logoUrl = pickTeamLogoUrl(team.logos);
  if (!logoUrl) return null;

  return {
    espn_id: String(team.id),
    abbreviation: team.abbreviation ?? '—',
    display_name: team.displayName ?? team.name ?? 'Unknown',
    short_name: team.shortDisplayName ?? team.nickname ?? null,
    slug: team.slug ?? null,
    color: teamColor(team.color),
    alternate_color: team.alternateColor ? teamColor(team.alternateColor) : null,
    logo_url: logoUrl,
    logo_url_dark: pickTeamLogoUrlDark(team.logos),
    location: team.location ?? null,
    updated_at: new Date().toISOString(),
  };
}

/** @param {string} teamsUrl @param {string} label */
export async function fetchEspnTeams(teamsUrl, label) {
  const needsHighLimit = teamsUrl.includes('college-basketball');
  const fetchUrl = needsHighLimit
    ? `${teamsUrl}${teamsUrl.includes('?') ? '&' : '?'}limit=500`
    : teamsUrl;
  const res = await fetch(fetchUrl, {
    headers: { Accept: 'application/json', 'User-Agent': 'sports-match-sync/1.0' },
  });
  if (!res.ok) {
    throw new Error(`ESPN ${label} teams failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const entries = data.sports?.[0]?.leagues?.[0]?.teams ?? [];
  const rows = [];
  for (const entry of entries) {
    const row = mapEspnTeamRow(entry.team ?? entry);
    if (row) rows.push(row);
  }
  return rows;
}

/** @param {object[]} rows @returns {Map<string, object>} */
export function buildTeamLookup(rows) {
  return new Map(rows.map((row) => [row.espn_id, row]));
}

/** @param {object} teamJson @param {Map<string, object> | undefined} lookup */
export function applyTeamLookup(teamJson, lookup) {
  if (!lookup) return teamJson;
  const cached = lookup.get(teamJson.id);
  if (!cached) return teamJson;
  return {
    ...teamJson,
    name: teamJson.name || cached.display_name,
    abbreviation: teamJson.abbreviation || cached.abbreviation,
    color: teamJson.color && teamJson.color !== '#333333' ? teamJson.color : cached.color,
    logoUrl: cached.logo_url,
  };
}
