import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLanguageByCode } from '@/constants/languages';
import { speakWord } from '@/services/tts';

interface TranslationCardProps {
  lang: string;
  word: string;
  phonetic: string | null;
}

export function TranslationCard({ lang, word, phonetic }: TranslationCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const language = getLanguageByCode(lang);

  const handleSpeak = async () => {
    setIsSpeaking(true);
    try {
      await speakWord(word, lang);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.langInfo}>
          <Text style={styles.flag}>{language?.flag ?? ''}</Text>
          <Text style={styles.langName}>{language?.name ?? lang}</Text>
        </View>
        <TouchableOpacity onPress={handleSpeak} disabled={isSpeaking} style={styles.speakerButton}>
          {isSpeaking ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="volume-high" size={22} color="#007AFF" />
          )}
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  langInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  speakerButton: {
    padding: 4,
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
