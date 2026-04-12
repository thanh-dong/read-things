import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  type DimensionValue,
} from 'react-native';
import { useModelStore } from '@/stores/model-store';
import { downloadModel, initModel } from '@/services/gemma';

export function ModelDownloadBanner() {
  const { status, downloadProgress, error } = useModelStore();

  if (status === 'ready') return null;

  const handleDownload = async () => {
    try {
      await downloadModel();
      await initModel();
    } catch (e) {
      console.error('[ModelDownload]', e);
    }
  };

  const handleRetry = () => {
    useModelStore.getState().setStatus('not-downloaded');
  };

  const progressWidth: DimensionValue = `${downloadProgress}%`;

  return (
    <View style={styles.container}>
      {status === 'not-downloaded' && (
        <>
          <Text style={styles.text}>Download translation model (1.3 GB)</Text>
          <TouchableOpacity style={styles.button} onPress={handleDownload}>
            <Text style={styles.buttonText}>Download</Text>
          </TouchableOpacity>
        </>
      )}
      {status === 'downloading' && (
        <>
          <Text style={styles.text}>
            Downloading model... {downloadProgress}%
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </>
      )}
      {status === 'downloaded' && (
        <>
          <Text style={styles.text}>Model downloaded. Loading...</Text>
          <ActivityIndicator color="#007AFF" />
        </>
      )}
      {status === 'loading' && (
        <>
          <Text style={styles.text}>Loading model...</Text>
          <ActivityIndicator color="#007AFF" />
        </>
      )}
      {status === 'error' && (
        <>
          <Text style={styles.errorText} selectable>{error ?? 'An error occurred'}</Text>
          <TouchableOpacity style={styles.button} onPress={handleRetry}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
});
