import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import type { SelectLibraryItem } from '@/db/schema';

interface LibraryItemCardProps {
  item: SelectLibraryItem;
  topLabel?: string;
}

export function LibraryItemCard({ item, topLabel }: LibraryItemCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push({ pathname: '/library/[id]', params: { id: item.id } })}
    >
      <Image source={{ uri: item.imagePath }} style={styles.image} resizeMode="cover" />
      <View style={styles.labelContainer}>
        <Text style={styles.label} numberOfLines={1}>
          {topLabel ?? 'Unknown'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    maxWidth: '48%',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  labelContainer: {
    padding: 8,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
