import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/src/constants/colors';
import { useAuth } from '@/src/context/auth-context';
import { formatTownLabel } from '@/src/utils/format-address';

export function HomeHeader() {
  const { logout, member, refreshMyInfo } = useAuth();
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
        <Pressable hitSlop={8}>
          <Ionicons name="menu-outline" size={28} color={COLORS.textPrimary} />
        </Pressable>
        <Pressable hitSlop={8} onPress={handleLogout}>
          <Ionicons name="notifications-outline" size={26} color={COLORS.textPrimary} />
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
});
