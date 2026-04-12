import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { getLanguageByCode } from '@/constants/languages';

interface LanguageChipProps {
  code: string;
  isSelected: boolean;
  onPress: () => void;
}

export function LanguageChip({ code, isSelected, onPress }: LanguageChipProps) {
  const lang = getLanguageByCode(code);
  return (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={styles.flag}>{lang?.flag}</Text>
      <Text style={[styles.code, isSelected && styles.codeSelected]}>
        {code.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#007AFF',
  },
  flag: { fontSize: 16, marginRight: 4 },
  code: { color: '#fff', fontSize: 12, fontWeight: '600' },
  codeSelected: { color: '#fff' },
});
