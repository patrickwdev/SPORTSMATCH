import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DayOption } from '../utils/dates';
import { colors } from '../theme/colors';

interface Props {
  days: DayOption[];
  selectedDate: string;
  onSelect: (isoDate: string) => void;
}

export function DayPicker({ days, selectedDate, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {days.map((day) => {
        const selected = day.isoDate === selectedDate;
        return (
          <Pressable
            key={day.isoDate}
            onPress={() => onSelect(day.isoDate)}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={[styles.shortLabel, selected && styles.labelSelected]}>
              {day.shortLabel}
            </Text>
            <Text style={[styles.subLabel, selected && styles.subLabelSelected]}>
              {day.subLabel}
            </Text>
          </Pressable>
        );
      })}
      <View style={styles.trailingSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.infoBar,
  },
  chipPressed: {
    opacity: 0.85,
  },
  shortLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  labelSelected: {
    color: colors.text,
  },
  subLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  subLabelSelected: {
    color: colors.text,
    opacity: 0.85,
  },
  trailingSpacer: {
    width: 8,
  },
});
