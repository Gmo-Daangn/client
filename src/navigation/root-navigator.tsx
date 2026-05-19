import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '@/src/context/auth-context';
import { TabNavigator } from '@/src/navigation/tab-navigator';
import { ChatRoomScreen } from '@/src/screens/chat-room-screen';
import { CreatePostScreen } from '@/src/screens/create-post-screen';
import { EditPostScreen } from '@/src/screens/edit-post-screen';
import { LoginScreen } from '@/src/screens/login-screen';
import { NotificationsScreen } from '@/src/screens/notifications-screen';
import { ProductDetailScreen } from '@/src/screens/product-detail-screen';
import { SignUpScreen } from '@/src/screens/signup-screen';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Tabs: undefined;
  Notifications: undefined;
  CreatePost: undefined;
  EditPost: { postId: string };
  ProductDetail: { productId: string };
  ChatRoom: { chatId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoggedIn } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{
              headerShown: true,
              title: '알림',
              headerBackTitle: '뒤로',
              headerTintColor: '#212124',
            }}
          />
          <Stack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{
              headerShown: true,
              title: '글쓰기',
              headerBackTitle: '뒤로',
              headerTintColor: '#212124',
            }}
          />
          <Stack.Screen
            name="EditPost"
            component={EditPostScreen}
            options={{
              headerShown: true,
              title: '글 수정',
              headerBackTitle: '뒤로',
              headerTintColor: '#212124',
            }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ headerShown: true, headerTitle: '', headerBackTitle: '뒤로' }}
          />
          <Stack.Screen
            name="ChatRoom"
            component={ChatRoomScreen}
            options={{ headerShown: true, headerBackTitle: '뒤로' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{
              headerShown: true,
              title: '회원가입',
              headerBackTitle: '뒤로',
              headerTintColor: '#212124',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
