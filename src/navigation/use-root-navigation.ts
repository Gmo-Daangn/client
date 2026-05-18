import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/src/navigation/root-navigator';

const ROOT_STACK_ROUTE_NAMES = new Set([
  'Tabs',
  'CreatePost',
  'EditPost',
  'ProductDetail',
  'ChatRoom',
]);

function isRootStackNavigation(routeNames: string[] | undefined): boolean {
  if (!routeNames?.length) return false;
  return routeNames.some((name) => ROOT_STACK_ROUTE_NAMES.has(name));
}

function asRootNavigation(
  navigation: ReturnType<typeof useNavigation>,
): NativeStackNavigationProp<RootStackParamList> {
  return navigation as unknown as NativeStackNavigationProp<RootStackParamList>;
}

export function useRootNavigation(): NativeStackNavigationProp<RootStackParamList> {
  const navigation = useNavigation();
  const routeNames = navigation.getState()?.routeNames;

  if (isRootStackNavigation(routeNames)) {
    return asRootNavigation(navigation);
  }

  const parent = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  return parent ?? asRootNavigation(navigation);
}
