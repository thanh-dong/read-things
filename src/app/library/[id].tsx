import { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useLibraryItem, useItemLabels, deleteLibraryItem, getItemTranslations } from '@/hooks/use-library';
import { Ionicons } from '@expo/vector-icons';
import { deletePhoto } from '@/services/image-storage';
import { TranslationCard } from '@/components/TranslationCard';
import { ErrorBanner } from '@/components/ErrorBanner';
import type { SelectTranslation } from '@/db/schema';

export default function LibraryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Number(id);
  const { data: items } = useLibraryItem(itemId);
  const { data: labels } = useItemLabels(itemId);

  const [translationsByLabel, setTranslationsByLabel] = useState<
    Record<string, SelectTranslation[]>
  >({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadTranslations = useCallback(async () => {
    if (!labels || labels.length === 0) return;
    setLoadError(null);
    try {
      const result: Record<string, SelectTranslation[]> = {};
      for (const label of labels) {
        const translations = await getItemTranslations(label.englishLabel);
        if (translations.length > 0) {
          result[label.englishLabel] = translations;
        }
      }
      setTranslationsByLabel(result);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load translations');
    }
  }, [labels]);

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  const item = items?.[0];
  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Item not found</Text>
      </View>
    );
  }

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteLibraryItem(itemId);
      try { deletePhoto(item.imagePath); } catch { /* photo cleanup is best-effort */ }
      router.back();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const hasTranslations = Object.keys(translationsByLabel).length > 0;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: item.imagePath }} style={styles.image} resizeMode="cover" />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {deleteError && (
          <ErrorBanner
            message={deleteError}
            onRetry={handleDelete}
            onDismiss={() => setDeleteError(null)}
          />
        )}

        <Text style={styles.sectionTitle}>Detection Labels</Text>
        {labels?.map((label, i) => (
          <View key={i} style={styles.labelRow}>
            <Text style={styles.labelText}>{label.englishLabel}</Text>
            <Text style={styles.confidenceText}>
              {Math.round(label.confidence * 100)}%
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Translations</Text>

        {loadError && (
          <ErrorBanner
            message={loadError}
            onRetry={loadTranslations}
            onDismiss={() => setLoadError(null)}
          />
        )}

        {!loadError && !hasTranslations && (
          <Text style={styles.emptyText}>
            No translations cached yet. Capture this object again to translate it.
          </Text>
        )}

        {hasTranslations &&
          Object.entries(translationsByLabel).map(([englishLabel, translations]) => (
            <View key={englishLabel} style={styles.translationGroup}>
              <Text style={styles.groupLabel}>{englishLabel}</Text>
              {translations.map((t) => (
                <TranslationCard
                  key={`${t.englishLabel}-${t.targetLanguage}`}
                  lang={t.targetLanguage}
                  word={t.translatedWord}
                  phonetic={t.phonetic}
                />
              ))}
            </View>
          ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { width: '100%', height: 300 },
  content: { padding: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  labelText: { color: '#fff', fontSize: 16 },
  confidenceText: { color: '#aaa', fontSize: 14 },
  notFound: { color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 100 },
  emptyText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  translationGroup: {
    marginBottom: 12,
  },
  groupLabel: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
});
