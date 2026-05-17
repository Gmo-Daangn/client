import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MannerTemperature } from '@/src/components/manner-temperature';
import { COLORS } from '@/src/constants/colors';
import { useChat } from '@/src/context/chat-context';
import { findProductById } from '@/src/data/mock-products';
import type { RootStackParamList } from '@/src/navigation/root-navigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const SCREEN_WIDTH = Dimensions.get('window').width;

function formatPrice(price: number) {
  return `${price.toLocaleString('ko-KR')}원`;
}

export function ProductDetailScreen({ route }: Props) {
  const navigation = useNavigation<Navigation>();
  const { productId } = route.params;
  const product = findProductById(productId);
  const { ensureChatForProduct } = useChat();
  const [liked, setLiked] = useState(false);

  const handleStartChat = () => {
    if (!product) return;
    const chatId = ensureChatForProduct(product);
    navigation.navigate('ChatRoom', { chatId });
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>상품을 찾을 수 없어요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.heroImage}
          contentFit="cover"
          transition={200}
        />

        <View style={styles.sellerRow}>
          <Image source={{ uri: product.seller.profileImageUrl }} style={styles.sellerAvatar} />
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>{product.seller.name}</Text>
            <Text style={styles.sellerLocation}>{product.location}</Text>
          </View>
          <MannerTemperature temperature={product.seller.mannerTemperature} />
        </View>

        <View style={styles.divider} />

        <View style={styles.content}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.meta}>
            {product.category} · {product.createdAt}
          </Text>
          <Text style={styles.description}>{product.description}</Text>

          <Text style={styles.stats}>
            관심 {product.likeCount} · 채팅 {product.chatCount} · 조회 {product.viewCount}
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footerWrapper}>
        <View style={styles.footer}>
          <Pressable onPress={() => setLiked((v) => !v)} hitSlop={8} style={styles.likeButton}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={28}
              color={liked ? COLORS.primary : COLORS.textPrimary}
            />
          </Pressable>

          <View style={styles.footerDivider} />

          <View style={styles.priceWrapper}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <Text style={styles.priceSub}>가격 제안하기</Text>
          </View>

          <Pressable
            onPress={handleStartChat}
            style={({ pressed }) => [styles.chatButton, pressed && styles.chatPressed]}>
            <Text style={styles.chatButtonText}>채팅하기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: COLORS.surface,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sellerLocation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 28,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  description: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginTop: 12,
  },
  stats: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 24,
  },
  footerWrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  likeButton: {
    padding: 4,
  },
  footerDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: COLORS.border,
  },
  priceWrapper: {
    flex: 1,
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  priceSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    textDecorationLine: 'underline',
  },
  chatButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 8,
  },
  chatPressed: {
    opacity: 0.85,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
