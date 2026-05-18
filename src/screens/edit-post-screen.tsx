import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchPostDetail, updatePost } from '@/src/api/posts';
import { COLORS } from '@/src/constants/colors';
import { useAuth } from '@/src/context/auth-context';
import type { RootStackParamList } from '@/src/navigation/root-navigator';
import type { PostStatus } from '@/src/types/post';

type Props = NativeStackScreenProps<RootStackParamList, 'EditPost'>;

const STATUS_OPTIONS: { value: PostStatus; label: string }[] = [
  { value: 'FOR_SALE', label: '판매중' },
  { value: 'RESERVED', label: '예약중' },
  { value: 'SOLD', label: '판매완료' },
];

export function EditPostScreen({ navigation, route }: Props) {
  const { postId: postIdParam } = route.params;
  const postId = Number(postIdParam);
  const { member } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priceText, setPriceText] = useState('');
  const [status, setStatus] = useState<PostStatus>('FOR_SALE');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPost = useCallback(async () => {
    if (!Number.isFinite(postId)) {
      setError('잘못된 게시글 ID예요.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const detail = await fetchPostDetail(postId);
      setTitle(detail.title);
      setContent(detail.content);
      setPriceText(String(detail.price));
      setStatus(detail.status);
    } catch (err) {
      const message = err instanceof Error ? err.message : '게시글을 불러오지 못했어요.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const price = Number(priceText.replace(/,/g, ''));

    if (!trimmedTitle) {
      Alert.alert('입력 확인', '제목을 입력해 주세요.');
      return;
    }
    if (!trimmedContent) {
      Alert.alert('입력 확인', '내용을 입력해 주세요.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      Alert.alert('입력 확인', '가격을 올바르게 입력해 주세요.');
      return;
    }
    if (!member?.memberId) {
      Alert.alert(
        '회원 정보 필요',
        '게시글 수정에 필요한 회원 ID를 확인할 수 없어요. 로그아웃 후 다시 로그인해 주세요.',
      );
      return;
    }

    setSubmitting(true);
    try {
      await updatePost(postId, {
        title: trimmedTitle,
        content: trimmedContent,
        price,
        status,
        memberId: member.memberId,
      });

      Alert.alert('수정 완료', '게시글이 수정되었어요.', [
        {
          text: '확인',
          onPress: () => navigation.replace('ProductDetail', { productId: String(postId) }),
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : '게시글 수정에 실패했어요.';
      Alert.alert('수정 실패', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void loadPost()} style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="글 제목"
            placeholderTextColor={COLORS.textTertiary}
            style={styles.input}
            maxLength={100}
          />

          <Text style={styles.label}>가격</Text>
          <TextInput
            value={priceText}
            onChangeText={setPriceText}
            placeholder="0"
            placeholderTextColor={COLORS.textTertiary}
            style={styles.input}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>판매 상태</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((option) => {
              const selected = status === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setStatus(option.value)}
                  style={[styles.statusChip, selected && styles.statusChipSelected]}>
                  <Text style={[styles.statusChipText, selected && styles.statusChipTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>설명</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="자세한 설명을 입력해 주세요."
            placeholderTextColor={COLORS.textTertiary}
            style={[styles.input, styles.textArea]}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitButton,
              (pressed || submitting) && styles.submitPressed,
            ]}>
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>수정하기</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  centered: {
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
  scrollContent: {
    padding: 16,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  textArea: {
    minHeight: 160,
    paddingTop: 12,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  statusChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF4EC',
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statusChipTextSelected: {
    color: COLORS.primary,
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitPressed: {
    opacity: 0.85,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
