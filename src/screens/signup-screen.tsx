import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState, type ReactNode } from 'react';
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

import { COLORS } from '@/src/constants/colors';
import { useAuth } from '@/src/context/auth-context';
import type { RootStackParamList } from '@/src/navigation/root-navigator';
import type { SignUpRequest } from '@/src/types/auth';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const PASSWORD_MIN = 6;
const NICKNAME_MIN = 2;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignUpScreen() {
  const navigation = useNavigation<Navigation>();
  const { signup } = useAuth();

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [town, setTown] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    const trimmedEmail = email.trim();

    if (trimmedEmail.length > 0 && !EMAIL_PATTERN.test(trimmedEmail)) {
      next.email = '올바른 이메일 형식이 아니에요.';
    }
    if (password.length > 0 && password.length < PASSWORD_MIN) {
      next.password = `비밀번호는 ${PASSWORD_MIN}자 이상이어야 해요.`;
    }
    if (passwordConfirm.length > 0 && password !== passwordConfirm) {
      next.passwordConfirm = '비밀번호가 일치하지 않아요.';
    }
    if (nickname.trim().length > 0 && nickname.trim().length < NICKNAME_MIN) {
      next.nickname = `닉네임은 ${NICKNAME_MIN}자 이상이어야 해요.`;
    }
    return next;
  }, [email, password, passwordConfirm, nickname]);

  const isValid =
    EMAIL_PATTERN.test(email.trim()) &&
    nickname.trim().length >= NICKNAME_MIN &&
    password.length >= PASSWORD_MIN &&
    password === passwordConfirm &&
    city.trim().length > 0 &&
    district.trim().length > 0 &&
    town.trim().length > 0 &&
    agreed &&
    Object.keys(errors).length === 0;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    const body: SignUpRequest = {
      email: email.trim(),
      nickname: nickname.trim(),
      password,
      address: {
        city: city.trim(),
        district: district.trim(),
        town: town.trim(),
      },
    };

    setSubmitting(true);
    const result = await signup(body);
    setSubmitting(false);

    if (!result.ok) {
      Alert.alert('회원가입 실패', result.message);
      return;
    }

    Alert.alert('환영해요!', result.message || `${body.nickname}님, 회원가입이 완료됐어요.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.logo}>🥕</Text>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>
            동네 중고거래를 시작하려면{'\n'}아래 정보를 입력해주세요.
          </Text>

          <Field label="이메일" error={errors.email}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="user@test.com"
              placeholderTextColor={COLORS.textTertiary}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </Field>

          <Field label="닉네임" error={errors.nickname}>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="당근이"
              placeholderTextColor={COLORS.textTertiary}
              style={styles.input}
              autoComplete="username"
            />
          </Field>

          <Field label="비밀번호" error={errors.password}>
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder="password123"
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </Field>

          <Field label="비밀번호 확인" error={errors.passwordConfirm}>
            <PasswordInput
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="비밀번호를 다시 입력"
              visible={showPasswordConfirm}
              onToggle={() => setShowPasswordConfirm((v) => !v)}
            />
          </Field>

          <Text style={styles.sectionTitle}>주소</Text>

          <Field label="시/도" hint="예: 서울시">
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="서울시"
              placeholderTextColor={COLORS.textTertiary}
              style={styles.input}
            />
          </Field>

          <Field label="구/군" hint="예: 동작구">
            <TextInput
              value={district}
              onChangeText={setDistrict}
              placeholder="동작구"
              placeholderTextColor={COLORS.textTertiary}
              style={styles.input}
            />
          </Field>

          <Field label="동/읍/면" hint="예: 사당동">
            <TextInput
              value={town}
              onChangeText={setTown}
              placeholder="사당동"
              placeholderTextColor={COLORS.textTertiary}
              style={styles.input}
            />
          </Field>

          <Pressable
            onPress={() => setAgreed((v) => !v)}
            style={styles.agreeRow}
            hitSlop={8}>
            <Ionicons
              name={agreed ? 'checkbox' : 'square-outline'}
              size={22}
              color={agreed ? COLORS.primary : COLORS.textTertiary}
            />
            <Text style={styles.agreeText}>
              <Text style={styles.agreeLink}>이용약관</Text> 및{' '}
              <Text style={styles.agreeLink}>개인정보처리방침</Text>에 동의합니다.
            </Text>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            disabled={!isValid || submitting}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.button,
              (!isValid || submitting) && styles.buttonDisabled,
              pressed && isValid && !submitting && styles.buttonPressed,
            ]}>
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>가입하기</Text>
            )}
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
            <Text style={styles.loginLink}>
              이미 계정이 있으신가요? <Text style={styles.loginLinkBold}>로그인</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function PasswordInput({
  value,
  onChangeText,
  placeholder,
  visible,
  onToggle,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.passwordRow}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        style={[styles.input, styles.passwordInput]}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable onPress={onToggle} hitSlop={8}>
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color={COLORS.textSecondary}
        />
      </Pressable>
    </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  logo: {
    fontSize: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 28,
    marginBottom: 4,
  },
  field: {
    marginTop: 16,
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 6,
  },
  input: {
    fontSize: 17,
    color: COLORS.textPrimary,
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.border,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordInput: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#E03E3E',
    marginTop: 6,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 28,
    paddingRight: 8,
  },
  agreeText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  agreeLink: {
    color: COLORS.textPrimary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginLink: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginLinkBold: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
