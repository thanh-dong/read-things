import { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import type { DetectionLabel } from '@/stores/detection-store';

export default function CaptureResultScreen() {
  const { imagePath, detectedLabels } = useLocalSearchParams<{
    imagePath: string;
    detectedLabels: string;
  }>();

  const labels: DetectionLabel[] = useMemo(() => {
    if (!detectedLabels) return [];
    try {
      return JSON.parse(detectedLabels);
    } catch {
      return [];
    }
  }, [detectedLabels]);

  return (
    <View style={styles.container}>
      {imagePath && (
        <Image source={{ uri: imagePath }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>Captured!</Text>
        {labels.length > 0 ? (
          <View style={styles.labelsContainer}>
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
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '50%',
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
    marginTop: 8,
  },
  actions: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  labelsContainer: {
    marginTop: 8,
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
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
