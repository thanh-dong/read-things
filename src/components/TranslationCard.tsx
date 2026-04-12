import { View, Text, StyleSheet } from 'react-native';
import { getLanguageByCode } from '@/constants/languages';

interface TranslationCardProps {
  lang: string;
  word: string;
  phonetic: string | null;
}

export function TranslationCard({ lang, word, phonetic }: TranslationCardProps) {
  const language = getLanguageByCode(lang);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.flag}>{language?.flag ?? ''}</Text>
        <Text style={styles.langName}>{language?.name ?? lang}</Text>
      </View>
      <Text style={styles.word}>{word}</Text>
      {phonetic && <Text style={styles.phonetic}>{phonetic}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  langName: {
    color: '#999',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  word: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  phonetic: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
