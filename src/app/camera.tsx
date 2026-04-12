import { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ScrollView } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { router } from 'expo-router';
import { savePhoto } from '@/services/image-storage';
import { useDetection } from '@/hooks/use-detection';
import { useDetectionStore } from '@/stores/detection-store';
import { DetectionOverlay } from '@/components/DetectionOverlay';
import { LanguageChip } from '@/components/LanguageChip';
import { useSettingsStore } from '@/stores/settings-store';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';

export default function CameraScreen() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { frameProcessor } = useDetection();
  const labels = useDetectionStore((s) => s.labels);
  const targetLanguages = useSettingsStore((s) => s.targetLanguages);
  const toggleLanguage = useSettingsStore((s) => s.toggleLanguage);

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>No camera device found</Text>
      </View>
    );
  }

  const [captureError, setCaptureError] = useState<string | null>(null);

  const handleCapture = async () => {
    if (isCapturing || !cameraRef.current) return;
    setIsCapturing(true);
    setCaptureError(null);
    try {
      const photo = await cameraRef.current.takePhoto();
      const savedPath = await savePhoto(photo.path);
      const detectedLabels = JSON.stringify(labels);
      router.push({
        pathname: '/capture-result',
        params: { imagePath: savedPath, detectedLabels },
      });
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        frameProcessor={frameProcessor}
      />
      <DetectionOverlay />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.languageBar}
        contentContainerStyle={styles.languageBarContent}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <LanguageChip
            key={lang.code}
            code={lang.code}
            isSelected={targetLanguages.includes(lang.code)}
            onPress={() => toggleLanguage(lang.code)}
          />
        ))}
      </ScrollView>
      <View style={styles.captureContainer}>
        <TouchableOpacity
          style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={isCapturing}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  languageBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 44,
  },
  languageBarContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  captureContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'white',
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
});
