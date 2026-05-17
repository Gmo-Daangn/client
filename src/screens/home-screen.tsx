import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeHeader } from '@/src/components/home-header';
import { ProductCard } from '@/src/components/product-card';
import { WriteFab } from '@/src/components/write-fab';
import { COLORS } from '@/src/constants/colors';
import { useAuth } from '@/src/context/auth-context';
import { MOCK_PRODUCTS } from '@/src/data/mock-products';
import { formatTownLabel } from '@/src/utils/format-address';

export function HomeScreen() {
  const { member, refreshMyInfo, isLoggedIn } = useAuth();
  const townLabel = formatTownLabel(member?.address);

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) return;
      if (member?.address?.town) return;
      void refreshMyInfo();
    }, [isLoggedIn, member?.address?.town, refreshMyInfo]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HomeHeader />

      <FlatList
        data={MOCK_PRODUCTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        extraData={townLabel}
      />

      <WriteFab />
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
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
});
