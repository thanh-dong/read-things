import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { DetectionLabel } from '@/stores/detection-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useModelStore } from '@/stores/model-store';
import { useTranslation } from '@/hooks/use-translation';
import { saveLibraryItem } from '@/hooks/use-library';
import { TranslationCard } from '@/components/TranslationCard';
import { ModelDownloadBanner } from '@/components/ModelDownloadBanner';
import { ErrorBanner } from '@/components/ErrorBanner';

export default function CaptureResultScreen() {
  const { imagePath, detectedLabels } = useLocalSearchParams<{
    imagePath: string;
    detectedLabels: string;
  }>();

  const targetLanguages = useSettingsStore((s) => s.targetLanguages);
  const modelStatus = useModelStore((s) => s.status);
  const { translations, isTranslating, error: translationError, translate } = useTranslation();

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const labels: DetectionLabel[] = useMemo(() => {
    if (!detectedLabels) return [];
    try {
      return JSON.parse(detectedLabels);
    } catch {
      return [];
    }
  }, [detectedLabels]);

  const topLabel = labels.length > 0 ? labels[0].label : null;

  // Trigger translation for the top label when labels arrive
  useEffect(() => {
    if (topLabel && targetLanguages.length > 0) {
      translate(topLabel, targetLanguages);
    }
  }, [topLabel, targetLanguages, translate]);

  const handleSave = async () => {
    if (!imagePath || labels.length === 0) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveLibraryItem(imagePath, labels);
      setIsSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save to library');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetryTranslation = () => {
    if (topLabel && targetLanguages.length > 0) {
      translate(topLabel, targetLanguages);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {imagePath ? (
        <Image source={{ uri: imagePath }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={48} color="#666" />
          <Text style={styles.placeholderText}>No image captured</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>Captured!</Text>

        {/* Detection labels */}
        {labels.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.subtitle}>Detected objects</Text>
            {labels.map((item, index) => (
              <View key={`${item.label}-${index}`} style={styles.labelRow}>
                <Text style={styles.labelText}>{item.label}</Text>
                <Text style={styles.confidenceText}>
                  {Math.round(item.confidence * 100)}%
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.subtitle}>No objects detected</Text>
        )}

        {/* Model download banner when not ready */}
        {modelStatus !== 'ready' && <ModelDownloadBanner />}

        {/* Translation error */}
        {translationError && (
          <ErrorBanner
            message={translationError}
            onRetry={handleRetryTranslation}
          />
        )}

        {/* Translation loading state */}
        {isTranslating && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Translating...</Text>
          </View>
        )}

        {/* Translation cards */}
        {translations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subtitle}>
              Translations for &quot;{topLabel}&quot;
            </Text>
            {translations.map((t) => (
              <TranslationCard
                key={t.lang}
                lang={t.lang}
                word={t.word}
                phonetic={t.phonetic}
              />
            ))}
          </View>
        )}

        {/* Save error */}
        {saveError && (
          <ErrorBanner
            message={saveError}
            onRetry={handleSave}
            onDismiss={() => setSaveError(null)}
          />
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>

        {labels.length > 0 && !isSaved && (
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="bookmark" size={20} color="#fff" />
            )}
            <Text style={styles.buttonText}>Save to Library</Text>
          </TouchableOpacity>
        )}

        {isSaved && (
          <View style={styles.savedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.savedText}>Saved!</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 300,
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#999',
    fontSize: 16,
    marginBottom: 8,
  },
  section: {
    marginTop: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  labelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confidenceText: {
    color: '#999',
    fontSize: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
  },
  actions: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  savedText: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '600',
  },
});
