import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchPosts } from '@/src/api/posts';
import { HomeHeader } from '@/src/components/home-header';
import { ProductCard } from '@/src/components/product-card';
import { WriteFab } from '@/src/components/write-fab';
import { COLORS } from '@/src/constants/colors';
import { useAuth } from '@/src/context/auth-context';
import { useRootNavigation } from '@/src/navigation/use-root-navigation';
import type { Product } from '@/src/types/product';
import { formatTownLabel } from '@/src/utils/format-address';
import { postListItemToProduct } from '@/src/utils/post-to-product';

export function HomeScreen() {
  const rootNavigation = useRootNavigation();
  const { member, refreshMyInfo, isLoggedIn } = useAuth();
  const townLabel = formatTownLabel(member?.address);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const page = await fetchPosts({ page: 0, size: 20, sort: 'createdAt,DESC' });
      setProducts(page.contents.map(postListItemToProduct));
    } catch (err) {
      const message = err instanceof Error ? err.message : '게시글 목록을 불러오지 못했어요.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPosts();
    }, [loadPosts]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) return;
      if (member?.address?.town) return;
      void refreshMyInfo();
    }, [isLoggedIn, member?.address?.town, refreshMyInfo]),
  );

  const handleWritePress = () => {
    rootNavigation.navigate('CreatePost');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HomeHeader />

      {loading && products.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error && products.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void loadPosts()} style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard product={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          extraData={townLabel}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadPosts(true)}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>등록된 게시글이 없어요.</Text>
            </View>
          }
        />
      )}

      <WriteFab onPress={handleWritePress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: 96,
    flexGrow: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
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
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});
