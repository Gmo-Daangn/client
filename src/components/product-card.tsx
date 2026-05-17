import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/src/constants/colors';
import type { RootStackParamList } from '@/src/navigation/root-navigator';
import type { Product } from '@/src/types/product';

type Props = {
  product: Product;
};

function formatPrice(price: number) {
  return `${price.toLocaleString('ko-KR')}원`;
}

export function ProductCard({ product }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = () => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <Image
        source={{ uri: product.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.meta}>
          {product.location} · {product.createdAt}
        </Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>

        <View style={styles.counts}>
          {product.chatCount > 0 && (
            <View style={styles.countItem}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.countText}>{product.chatCount}</Text>
            </View>
          )}
          {product.likeCount > 0 && (
            <View style={styles.countItem}>
              <Ionicons name="heart-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.countText}>{product.likeCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
    backgroundColor: COLORS.background,
  },
  pressed: {
    backgroundColor: COLORS.surface,
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  counts: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  countText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
