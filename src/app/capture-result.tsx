import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function CaptureResultScreen() {
  const { imagePath } = useLocalSearchParams<{ imagePath: string }>();

  return (
    <View style={styles.container}>
      {imagePath && (
        <Image source={{ uri: imagePath }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>Captured!</Text>
        <Text style={styles.subtitle}>Translations will appear here</Text>
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
