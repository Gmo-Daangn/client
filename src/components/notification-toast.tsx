import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/src/constants/colors';
import type { NotificationItem } from '@/src/types/notification';

const AUTO_DISMISS_MS = 4500;

type NotificationToastProps = {
  item: NotificationItem | null;
  onPress: (item: NotificationItem) => void;
  onDismiss: () => void;
};

function getIconName(templateType: string) {
  return templateType === 'CHAT' ? 'chatbubble-ellipses' : 'notifications';
}

export function NotificationToast({ item, onPress, onDismiss }: NotificationToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearDismissTimer();
    translateY.value = withTiming(-120, { duration: 220 });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(onDismiss)();
    });
  }, [clearDismissTimer, onDismiss, opacity, translateY]);

  const show = useCallback(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    opacity.value = withTiming(1, { duration: 180 });
  }, [opacity, translateY]);

  useEffect(() => {
    if (!item) return;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    show();

    clearDismissTimer();
    dismissTimer.current = setTimeout(() => {
      hide();
    }, AUTO_DISMISS_MS);

    return () => {
      clearDismissTimer();
    };
  }, [item, show, hide, clearDismissTimer]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!item) return null;

  const title = item.templateTitle || '알림';

  return (
    <View style={styles.host} pointerEvents="box-none">
      <Animated.View
        style={[styles.toast, { marginTop: insets.top + 8 }, animatedStyle]}
        pointerEvents="box-none">
        <Pressable
          onPress={() => onPress(item)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          accessibilityRole="button"
          accessibilityLabel={`${title}. ${item.message}`}>
          <View style={styles.iconWrap}>
            <Ionicons name={getIconName(item.templateType)} size={22} color={COLORS.primary} />
          </View>

          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {item.message}
            </Text>
          </View>

          <Pressable
            onPress={hide}
            hitSlop={10}
            style={({ pressed }) => [styles.closeButton, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel="알림 닫기">
            <Ionicons name="close" size={20} color={COLORS.textTertiary} />
          </Pressable>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  toast: {
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  cardPressed: {
    opacity: 0.88,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#FFF4EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  closeButton: {
    padding: 2,
  },
});
