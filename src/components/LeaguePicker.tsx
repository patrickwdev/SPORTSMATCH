import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SPORT_OPTIONS } from '../constants/sports';
import { colors } from '../theme/colors';
import type { Sport } from '../types';

interface Props {
  value: Sport | null;
  onChange: (sport: Sport) => void;
}

export function LeaguePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => (value ? SPORT_OPTIONS.find((o) => o.value === value) : undefined),
    [value],
  );

  const close = () => setOpen(false);

  const select = (sport: Sport) => {
    onChange(sport);
    close();
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          selected
            ? `Selected league: ${selected.title}. Tap to change.`
            : 'Select a league. Tap to open options.'
        }
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
      >
        {selected ? (
          <>
            <View style={styles.triggerBadge}>
              <Text style={styles.triggerBadgeText}>{selected.title}</Text>
            </View>
            <View style={styles.triggerBody}>
              <Text style={styles.triggerTitle}>{selected.subtitle}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.placeholder}>Select a league</Text>
        )}
        <Text style={styles.chevron} accessibilityElementsHidden>
          ▾
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropTap} onPress={close} accessibilityLabel="Close league picker" />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Choose a league</Text>
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            >
              {SPORT_OPTIONS.map((option) => {
                const isSelected = value !== null && option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => select(option.value)}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <View style={[styles.optionBadge, isSelected && styles.optionBadgeSelected]}>
                      <Text
                        style={[styles.optionBadgeText, isSelected && styles.optionBadgeTextSelected]}
                      >
                        {option.title}
                      </Text>
                    </View>
                    <View style={styles.optionBody}>
                      <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                        {option.subtitle}
                      </Text>
                    </View>
                    {isSelected ? <Text style={styles.check}>✓</Text> : <View style={styles.checkSpacer} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  triggerPressed: {
    borderColor: colors.accent,
    opacity: 0.92,
  },
  placeholder: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
  triggerBadge: {
    minWidth: 52,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.headerBg,
    alignItems: 'center',
  },
  triggerBadgeText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  triggerBody: {
    flex: 1,
    minWidth: 0,
  },
  triggerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 14,
    marginLeft: 4,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  backdropTap: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: 10,
    marginBottom: 14,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.rowAlt,
  },
  optionPressed: {
    opacity: 0.88,
  },
  optionBadge: {
    minWidth: 52,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.headerBg,
    alignItems: 'center',
  },
  optionBadgeSelected: {
    backgroundColor: colors.infoBar,
  },
  optionBadgeText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  optionBadgeTextSelected: {
    color: colors.text,
  },
  optionBody: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  optionTitleSelected: {
    color: colors.text,
    fontWeight: '600',
  },
  check: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '700',
    width: 22,
    textAlign: 'center',
  },
  checkSpacer: {
    width: 22,
  },
});
