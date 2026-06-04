import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius } from '../theme/colors';

interface Props {
  visible: boolean;
  title: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

/** A small centered modal with a single text field — used to create/rename books. */
export function TextInputModal({
  visible,
  title,
  placeholder,
  initialValue = '',
  confirmLabel = 'Save',
  onCancel,
  onConfirm,
}: Props) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const trimmed = value.trim();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Stop taps inside the card from dismissing. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.inkSoft}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => trimmed && onConfirm(trimmed)}
          />
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.btn}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!trimmed}
              onPress={() => onConfirm(trimmed)}
              style={[styles.btn, styles.confirmBtn, !trimmed && styles.disabled]}
            >
              <Text style={styles.confirmTxt}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(43, 38, 34, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.background,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    marginLeft: 10,
  },
  confirmBtn: {
    backgroundColor: colors.accent,
  },
  disabled: {
    opacity: 0.4,
  },
  cancelTxt: {
    fontSize: 15,
    color: colors.inkSoft,
    fontWeight: '600',
  },
  confirmTxt: {
    fontSize: 15,
    color: colors.surface,
    fontWeight: '700',
  },
});
