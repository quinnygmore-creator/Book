import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius } from '../theme/colors';

interface Props {
  onSendCode: (email: string) => Promise<void>;
  onVerifyCode: (email: string, token: string) => Promise<void>;
}

/** Two-step email one-time-code sign-in. */
export function SignInScreen({ onSendCode, onVerifyCode }: Props) {
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (stage === 'email') {
        await onSendCode(email);
        setStage('code');
      } else {
        await onVerifyCode(email, code);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    stage === 'email' ? /\S+@\S+\.\S+/.test(email) : code.trim().length >= 4;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.brand}>Books</Text>
        <Text style={styles.tagline}>Speak your thoughts.{'\n'}Keep them in books.</Text>

        {stage === 'email' ? (
          <>
            <Text style={styles.label}>Sign in with your email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.inkSoft}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
              returnKeyType="go"
              onSubmitEditing={() => canSubmit && submit()}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter the code sent to {email}</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor={colors.inkSoft}
              keyboardType="number-pad"
              autoFocus
              returnKeyType="go"
              onSubmitEditing={() => canSubmit && submit()}
            />
            <Pressable onPress={() => setStage('email')} hitSlop={8}>
              <Text style={styles.linkTxt}>Use a different email</Text>
            </Pressable>
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          onPress={submit}
          disabled={!canSubmit || busy}
          style={[styles.btn, (!canSubmit || busy) && styles.btnDisabled]}
        >
          {busy ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.btnTxt}>
              {stage === 'email' ? 'Send code' : 'Sign in'}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brand: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.ink,
  },
  tagline: {
    fontSize: 17,
    color: colors.inkSoft,
    marginTop: 6,
    marginBottom: 40,
    lineHeight: 24,
  },
  label: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  linkTxt: {
    marginTop: 14,
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  error: {
    marginTop: 14,
    color: colors.danger,
    fontSize: 14,
  },
  btn: {
    marginTop: 24,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnTxt: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
