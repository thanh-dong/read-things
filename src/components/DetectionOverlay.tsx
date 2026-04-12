import { View, Text, StyleSheet } from 'react-native';
import { useDetectionStore } from '@/stores/detection-store';

export function DetectionOverlay() {
  const labels = useDetectionStore((s) => s.labels);

  if (labels.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {labels.map((item, index) => (
        <View key={`${item.label}-${index}`} style={styles.labelRow}>
          <Text style={styles.labelText}>{item.label}</Text>
          <Text style={styles.confidenceText}>
            {Math.round(item.confidence * 100)}%
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  labelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confidenceText: {
    color: '#aaa',
    fontSize: 14,
  },
});
