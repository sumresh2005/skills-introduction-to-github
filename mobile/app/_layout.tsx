import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FriendsProvider } from '@/context/FriendsContext';

export default function RootLayout() {
  return (
    <FriendsProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Friend CRM' }} />
        <Stack.Screen name="friend/new" options={{ title: 'Add friend', presentation: 'modal' }} />
        <Stack.Screen name="friend/[id]" options={{ title: 'Friend' }} />
        <Stack.Screen name="import" options={{ title: 'Import', presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </FriendsProvider>
  );
}
