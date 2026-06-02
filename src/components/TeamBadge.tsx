import { Image, StyleSheet, Text, View } from 'react-native';
import type { TeamSummary } from '../types';

interface Props {
  team: TeamSummary;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 28, md: 40, lg: 56 };
const fonts = { sm: 10, md: 12, lg: 16 };

export function TeamBadge({ team, size = 'md' }: Props) {
  const dim = sizes[size];
  const fontSize = fonts[size];

  if (team.logoUrl) {
    return (
      <View style={[styles.logoWrap, { width: dim, height: dim }]}>
        <Image
          source={{ uri: team.logoUrl }}
          style={[styles.logo, { width: dim, height: dim }]}
          resizeMode="contain"
          accessibilityLabel={team.name}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: team.color },
      ]}
    >
      <Text style={[styles.abbr, { fontSize }]}>{team.abbreviation}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    backgroundColor: 'transparent',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  abbr: {
    color: '#fff',
    fontWeight: '800',
  },
});
