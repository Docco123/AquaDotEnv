import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { C } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'UpstreamWatch' }} />
        <Stack.Screen name="map" options={{ title: 'Map · UpstreamWatch' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
