import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

import { useColorScheme } from '@/hooks/use-color-scheme';
import '../utils/notifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ActionSheetProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add" options={{ presentation: 'modal', title: 'Novo Remédio' }} />
          <Stack.Screen name="edit" options={{ presentation: 'modal', title: 'Editar Remédio' }} />
          <Stack.Screen name="details" options={{ presentation: 'modal', title: 'Detalhes' }} />
        </Stack>
      </ActionSheetProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
