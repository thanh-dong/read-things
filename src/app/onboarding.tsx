import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSettingsStore } from '@/stores/settings-store';

const SCREENS = [
  {
    icon: 'camera' as const,
    title: 'Point & Detect',
    description: 'Point your camera at any object to instantly see its name',
  },
  {
    icon: 'language' as const,
    title: 'Learn Languages',
    description:
      'See translations in your chosen languages with pronunciation guides',
  },
  {
    icon: 'library' as const,
    title: 'Build Your Library',
    description:
      'Save vocabulary items and review them anytime, all offline',
  },
];

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const setHasCompletedOnboarding = useSettingsStore(
    (s) => s.setHasCompletedOnboarding,
  );

  const isLastPage = currentPage === SCREENS.length - 1;
  const screen = SCREENS[currentPage];

  const handleNext = () => {
    if (isLastPage) {
      setHasCompletedOnboarding(true);
      router.replace('/camera');
    } else {
      setCurrentPage((p) => p + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name={screen.icon} size={80} color="#007AFF" />
        <Text style={styles.title}>{screen.title}</Text>
        <Text style={styles.description}>{screen.description}</Text>
      </View>
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SCREENS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentPage && styles.dotActive]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {isLastPage ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
    paddingTop: 120,
    paddingBottom: 60,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
    textAlign: 'center',
  },
  description: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
