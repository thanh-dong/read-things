import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useLibraryItems } from '@/hooks/use-library';
import { LibraryItemCard } from '@/components/LibraryItemCard';
import { useTheme } from '@/hooks/use-theme';

export default function LibraryScreen() {
  const { data: items } = useLibraryItems();
  const colors = useTheme();

  if (!items || items.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No items yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Capture objects with the camera and save them to build your library
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Library</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        renderItem={({ item }) => (
          <LibraryItemCard item={item} />
        )}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    padding: 16,
    paddingTop: 60,
  },
  grid: {
    padding: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
