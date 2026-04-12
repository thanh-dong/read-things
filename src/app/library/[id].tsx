import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useLibraryItem, useItemLabels, deleteLibraryItem } from '@/hooks/use-library';
import { Ionicons } from '@expo/vector-icons';
import { deletePhoto } from '@/services/image-storage';

export default function LibraryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Number(id);
  const { data: items } = useLibraryItem(itemId);
  const { data: labels } = useItemLabels(itemId);

  const item = items?.[0];
  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Item not found</Text>
      </View>
    );
  }

  const handleDelete = async () => {
    deletePhoto(item.imagePath);
    await deleteLibraryItem(itemId);
    router.back();
  };

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
        <Text style={styles.placeholder}>
          Translations will be loaded from cache here
        </Text>
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
  placeholder: { color: '#666', fontSize: 14 },
  notFound: { color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 100 },
});
