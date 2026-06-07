import { useCallback, useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DayOption } from '../utils/dates';
import { colors } from '../theme/colors';

const CHIP_WIDTH = 56;
const CHIP_GAP = 8;

interface Props {
  days: DayOption[];
  selectedDate: string;
  onSelect: (isoDate: string) => void;
}

function DayArrow({
  direction,
  disabled,
  onPress,
}: {
  direction: 'left' | 'right';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={direction === 'left' ? 'Previous day' : 'Next day'}
      style={({ pressed }) => [
        styles.arrow,
        disabled && styles.arrowDisabled,
        pressed && !disabled && styles.arrowPressed,
      ]}
    >
      <Text style={[styles.arrowLabel, disabled && styles.arrowLabelDisabled]}>
        {direction === 'left' ? '‹' : '›'}
      </Text>
    </Pressable>
  );
}

export function DayPicker({ days, selectedDate, onSelect }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = days.findIndex((d) => d.isoDate === selectedDate);
  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex >= 0 && selectedIndex < days.length - 1;

  const goToOffset = useCallback(
    (offset: number) => {
      if (selectedIndex < 0) return;
      const next = days[selectedIndex + offset];
      if (next) onSelect(next.isoDate);
    },
    [days, onSelect, selectedIndex],
  );

  useEffect(() => {
    if (selectedIndex < 0) return;

    const scrollToSelected = () => {
      const x = selectedIndex * (CHIP_WIDTH + CHIP_GAP);
      scrollRef.current?.scrollTo({ x: Math.max(0, x - 72), animated: selectedIndex > 2 });
    };

    scrollToSelected();
    const frame = requestAnimationFrame(scrollToSelected);
    const timer = setTimeout(scrollToSelected, 80);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [selectedDate, selectedIndex, days]);

  return (
    <View style={styles.container}>
      <DayArrow
        direction="left"
        disabled={!canGoPrev}
        onPress={() => goToOffset(-1)}
      />
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
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
      <DayArrow
        direction="right"
        disabled={!canGoNext}
        onPress={() => goToOffset(1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
  },
  arrow: {
    width: 40,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowPressed: {
    opacity: 0.7,
  },
  arrowDisabled: {
    opacity: 0.35,
  },
  arrowLabel: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  arrowLabelDisabled: {
    color: colors.textMuted,
  },
  scroll: {
    flex: 1,
  },
  row: {
    paddingTop: 4,
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
