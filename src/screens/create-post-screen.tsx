import { useState } from 'react';
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

import { createPost } from '@/src/api/posts';
import { COLORS } from '@/src/constants/colors';
import { useAuth } from '@/src/context/auth-context';
import { useRootNavigation } from '@/src/navigation/use-root-navigation';

export function CreatePostScreen() {
  const rootNavigation = useRootNavigation();
  const { member } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priceText, setPriceText] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        '게시글 작성에 필요한 회원 ID를 확인할 수 없어요. 로그아웃 후 다시 로그인해 주세요.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await createPost({
        title: trimmedTitle,
        content: trimmedContent,
        price,
        memberId: member.memberId,
      });

      Alert.alert('등록 완료', result.message, [
        {
          text: '확인',
          onPress: () =>
            rootNavigation.replace('ProductDetail', { productId: String(result.postId) }),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '게시글 등록에 실패했어요.';
      Alert.alert('등록 실패', message);
    } finally {
      setSubmitting(false);
    }
  };

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
              <Text style={styles.submitText}>등록하기</Text>
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
