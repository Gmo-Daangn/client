import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { API_BASE_URL, WS_STOMP_URL } from '@/src/constants/api';
import { AuthProvider } from '@/src/context/auth-context';
import { ChatProvider } from '@/src/context/chat-context';
import { NotificationProvider } from '@/src/context/notification-context';
import { navigationRef } from '@/src/navigation/navigation-ref';
import { RootNavigator } from '@/src/navigation/root-navigator';

if (__DEV__) {
  console.log('[api] REST', API_BASE_URL);
  console.log('[api] STOMP', WS_STOMP_URL);
}

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>
            <NavigationContainer
              ref={navigationRef}
              theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <RootNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </ChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
