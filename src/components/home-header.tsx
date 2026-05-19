import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/src/constants/colors';
import { useAuth } from '@/src/context/auth-context';
import { useNotifications } from '@/src/context/notification-context';
import { useRootNavigation } from '@/src/navigation/use-root-navigation';
import { formatTownLabel } from '@/src/utils/format-address';

export function HomeHeader() {
  const { logout, member, refreshMyInfo } = useAuth();
  const { unreadCount } = useNotifications();
  const rootNavigation = useRootNavigation();
  const location = formatTownLabel(member?.address);

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: logout },
    ]);
  };

  const handleRefreshLocation = async () => {
    const result = await refreshMyInfo();
    if (!result.ok) {
      Alert.alert('동네 정보', result.message);
    }
  };

  const openNotifications = () => {
    rootNavigation.navigate('Notifications');
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.locationButton} hitSlop={8} onPress={handleRefreshLocation}>
        <Text style={styles.locationText}>{location}</Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textPrimary} />
      </Pressable>

      <View style={styles.iconGroup}>
        <Pressable hitSlop={8}>
          <Ionicons name="search-outline" size={26} color={COLORS.textPrimary} />
        </Pressable>
        <Pressable hitSlop={8} onPress={handleLogout}>
          <Ionicons name="menu-outline" size={28} color={COLORS.textPrimary} />
        </Pressable>
        <Pressable hitSlop={8} onPress={openNotifications} style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={26} color={COLORS.textPrimary} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bellButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
