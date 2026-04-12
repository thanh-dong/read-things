import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/stores/settings-store';
import { useModelStore } from '@/stores/model-store';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import {
  downloadModel,
  deleteModel,
  isModelDownloaded,
  initModel,
} from '@/services/gemma';

export default function SettingsScreen() {
  const {
    targetLanguages,
    ttsRate,
    isDarkMode,
    toggleLanguage,
    setTtsRate,
    setIsDarkMode,
  } = useSettingsStore();
  const { status, downloadProgress } = useModelStore();

  const handleModelAction = async () => {
    if (isModelDownloaded()) {
      deleteModel();
    } else {
      try {
        await downloadModel();
        await initModel();
      } catch {
        // error handled in model store
      }
    }
  };

  const decreaseTtsRate = () => {
    setTtsRate(Math.max(0.5, Math.round((ttsRate - 0.1) * 10) / 10));
  };

  const increaseTtsRate = () => {
    setTtsRate(Math.min(1.5, Math.round((ttsRate + 0.1) * 10) / 10));
  };

  const getModelStatusText = (): string => {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'downloading':
        return `${downloadProgress}%`;
      case 'loading':
        return 'Loading...';
      case 'downloaded':
        return 'Downloaded';
      case 'error':
        return 'Error';
      default:
        return 'Not downloaded';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {/* Target Languages */}
      <Text style={styles.sectionTitle}>Target Languages</Text>
      <View style={styles.section}>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = targetLanguages.includes(lang.code);
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langRow, isSelected && styles.langRowSelected]}
              onPress={() => toggleLanguage(lang.code)}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <View style={styles.langInfo}>
                <Text style={styles.langName}>{lang.name}</Text>
                <Text style={styles.langNative}>{lang.nativeName}</Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* TTS Speed */}
      <Text style={styles.sectionTitle}>
        Speech Rate: {ttsRate.toFixed(1)}
      </Text>
      <View style={styles.section}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Slow</Text>
          <View style={styles.sliderContainer}>
            <TouchableOpacity onPress={decreaseTtsRate}>
              <Ionicons
                name="remove-circle-outline"
                size={28}
                color="#007AFF"
              />
            </TouchableOpacity>
            <Text style={styles.rateValue}>{ttsRate.toFixed(1)}</Text>
            <TouchableOpacity onPress={increaseTtsRate}>
              <Ionicons
                name="add-circle-outline"
                size={28}
                color="#007AFF"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.sliderLabel}>Fast</Text>
        </View>
      </View>

      {/* Model Management */}
      <Text style={styles.sectionTitle}>Translation Model</Text>
      <View style={styles.section}>
        <View style={styles.modelRow}>
          <Text style={styles.modelLabel}>Gemma 4 E2B</Text>
          <Text style={styles.modelStatus}>{getModelStatusText()}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.modelButton,
            (status === 'downloading' || status === 'loading') &&
              styles.modelButtonDisabled,
          ]}
          onPress={handleModelAction}
          disabled={status === 'downloading' || status === 'loading'}
        >
          <Text style={styles.modelButtonText}>
            {isModelDownloaded() ? 'Delete Model' : 'Download (1.3 GB)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Appearance */}
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Dark Mode</Text>
          <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 60,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  section: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C2E',
  },
  langRowSelected: {
    backgroundColor: '#1A2A3A',
  },
  langFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  langInfo: {
    flex: 1,
  },
  langName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  langNative: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sliderLabel: {
    fontSize: 13,
    color: '#8E8E93',
    width: 36,
  },
  sliderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  rateValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    minWidth: 40,
    textAlign: 'center',
  },
  modelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C2E',
  },
  modelLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  modelStatus: {
    fontSize: 14,
    color: '#8E8E93',
  },
  modelButton: {
    margin: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  modelButtonDisabled: {
    backgroundColor: '#333',
  },
  modelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
});
