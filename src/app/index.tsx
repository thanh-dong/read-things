import { Redirect } from 'expo-router';
import { useSettingsStore } from '@/stores/settings-store';

export default function Index() {
  const hasCompletedOnboarding = useSettingsStore(
    (s) => s.hasCompletedOnboarding,
  );

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/camera" />;
}
