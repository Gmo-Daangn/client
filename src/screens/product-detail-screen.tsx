import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deletePost, fetchPostDetail } from '@/src/api/posts';
import { MannerTemperature } from '@/src/components/manner-temperature';
import { COLORS } from '@/src/constants/colors';
import { useAuth } from '@/src/context/auth-context';
import { useChat } from '@/src/context/chat-context';
import type { RootStackParamList } from '@/src/navigation/root-navigator';
import type { Product } from '@/src/types/product';
import { postDetailToProduct } from '@/src/utils/post-to-product';

function isOwnPost(sellerNickname: string, myNickname: string | null | undefined) {
  const seller = sellerNickname.trim();
  const mine = myNickname?.trim();
  if (!seller || !mine) return false;
  return seller === mine;
}

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const SCREEN_WIDTH = Dimensions.get('window').width;

function formatPrice(price: number) {
  return `${price.toLocaleString('ko-KR')}원`;
}

export function ProductDetailScreen({ route }: Props) {
  const navigation = useNavigation<Navigation>();
  const { productId } = route.params;
  const postId = Number(productId);

  const { member, userName } = useAuth();
  const { ensureChatForProduct } = useChat();
  const [product, setProduct] = useState<Product | null>(null);
  const [sellerNickname, setSellerNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const myNickname = member?.nickname ?? userName;
  const isMyPost = isOwnPost(sellerNickname, myNickname);

  const loadDetail = useCallback(async () => {
    if (!Number.isFinite(postId)) {
      setError('잘못된 게시글 ID예요.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const detail = await fetchPostDetail(postId);
      setSellerNickname(detail.sellerNickname);
      setProduct(postDetailToProduct(detail));
    } catch (err) {
      const message = err instanceof Error ? err.message : '게시글을 불러오지 못했어요.';
      setError(message);
      setProduct(null);
      setSellerNickname('');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleStartChat = () => {
    if (!product) return;
    const chatId = ensureChatForProduct(product);
    navigation.navigate('ChatRoom', { chatId });
  };

  const handleEdit = useCallback(() => {
    navigation.navigate('EditPost', { postId: String(postId) });
  }, [navigation, postId]);

  const handleDelete = useCallback(() => {
    if (!member?.memberId) {
      Alert.alert(
        '회원 정보 필요',
        '게시글 삭제에 필요한 회원 ID를 확인할 수 없어요. 로그아웃 후 다시 로그인해 주세요.',
      );
      return;
    }

    Alert.alert('게시글 삭제', '이 게시글을 삭제할까요? 삭제 후에는 복구할 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeleting(true);
            try {
              await deletePost(postId, member.memberId!);
              navigation.navigate('Tabs');
            } catch (err) {
              const message = err instanceof Error ? err.message : '게시글 삭제에 실패했어요.';
              Alert.alert('삭제 실패', message);
            } finally {
              setDeleting(false);
            }
          })();
        },
      },
    ]);
  }, [member?.memberId, navigation, postId]);

  const handleMorePress = useCallback(() => {
    Alert.alert('내 게시글', undefined, [
      { text: '수정', onPress: handleEdit },
      { text: '삭제', style: 'destructive', onPress: handleDelete },
      { text: '취소', style: 'cancel' },
    ]);
  }, [handleDelete, handleEdit]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: isMyPost
        ? () => (
            <Pressable onPress={handleMorePress} hitSlop={8} style={styles.headerMoreButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.textPrimary} />
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, isMyPost, handleMorePress]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error ?? '상품을 찾을 수 없어요.'}</Text>
          <Pressable onPress={() => void loadDetail()} style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
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
            {product.category ? `${product.category} · ` : ''}
            {product.createdAt}
          </Text>
          <Text style={styles.description}>{product.description}</Text>

          <Text style={styles.stats}>조회 {product.viewCount}</Text>
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
            {!isMyPost && <Text style={styles.priceSub}>가격 제안하기</Text>}
          </View>

          {isMyPost ? (
            <View style={styles.ownerActions}>
              <Pressable
                onPress={handleEdit}
                disabled={deleting}
                style={({ pressed }) => [styles.editButton, pressed && styles.ownerButtonPressed]}>
                <Text style={styles.editButtonText}>수정</Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                disabled={deleting}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.ownerButtonPressed,
                  deleting && styles.ownerButtonDisabled,
                ]}>
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteButtonText}>삭제</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handleStartChat}
              style={({ pressed }) => [styles.chatButton, pressed && styles.chatPressed]}>
              <Text style={styles.chatButtonText}>채팅하기</Text>
            </Pressable>
          )}
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
  headerMoreButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  deleteButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#E03131',
    minWidth: 64,
    alignItems: 'center',
  },
  ownerButtonPressed: {
    opacity: 0.85,
  },
  ownerButtonDisabled: {
    opacity: 0.7,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
