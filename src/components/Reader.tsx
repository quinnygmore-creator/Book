import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PageView } from './PageView';
import { Recording } from '../types/recording';
import { Book } from '../types/book';
import { getTheme, THEME_LIST, ThemeId } from '../theme/themes';
import { setBookTheme } from '../lib/bookStore';
import { updateRecording } from '../lib/recordingStore';
import { formatLongDate } from '../lib/format';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  book: Book;
  entries: Recording[];
  initialIndex: number;
  onClose: () => void;
  onUpdate?: () => void; // called after an inline edit is saved
}

/**
 * Full-screen, book-like reader. Entries are horizontal pages you swipe
 * between (paging gives the page-turn feel). A theme switcher at the
 * bottom restyles every page live and persists the choice on the book.
 */
export function Reader({ visible, book, entries, initialIndex, onClose, onUpdate }: Props) {
  const [themeId, setThemeId] = useState<ThemeId>((book.theme as ThemeId) ?? 'journal');
  const [index, setIndex] = useState(initialIndex);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const listRef = useRef<FlatList<Recording>>(null);
  const theme = getTheme(themeId);
  const current = entries[index];

  // Reset to the tapped page each time the reader opens.
  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      setEditing(false);
    }
  }, [visible, initialIndex]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const changeTheme = (id: ThemeId) => {
    setThemeId(id);
    setBookTheme(book.id, id); // fire-and-forget persistence
  };

  const startEditing = () => {
    if (!current) return;
    setDraftTitle(current.title ?? '');
    setDraftBody(current.bodyClean ?? current.transcript ?? '');
    setEditing(true);
  };

  const saveEdit = async () => {
    if (current) {
      await updateRecording(current.id, {
        title: draftTitle.trim() || undefined,
        bodyClean: draftBody.trim(),
        cleanupStatus: 'ready',
      });
      onUpdate?.();
    }
    setEditing(false);
  };

  // ----- Inline editor -----
  if (editing) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={() => setEditing(false)}>
        <View style={[styles.container, { backgroundColor: theme.pageColor }]}>
          <View style={styles.editBar}>
            <Pressable onPress={() => setEditing(false)} hitSlop={10}>
              <Text style={[styles.editAction, { color: theme.mutedInk }]}>Cancel</Text>
            </Pressable>
            <Pressable onPress={saveEdit} hitSlop={10}>
              <Text style={[styles.editAction, { color: theme.accent }]}>Save</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.editScroll} keyboardShouldPersistTaps="handled">
            <TextInput
              style={[styles.editTitle, { color: theme.inkColor, fontFamily: theme.titleFont }]}
              value={draftTitle}
              onChangeText={setDraftTitle}
              placeholder="Title"
              placeholderTextColor={theme.mutedInk}
            />
            <TextInput
              style={[
                styles.editBody,
                {
                  color: theme.inkColor,
                  fontFamily: theme.bodyFont,
                  fontSize: theme.bodySize,
                  lineHeight: theme.bodyLineHeight,
                },
              ]}
              value={draftBody}
              onChangeText={setDraftBody}
              placeholder="Write your page…"
              placeholderTextColor={theme.mutedInk}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.pageColor }]}>
        <FlatList
          ref={listRef}
          data={entries}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={onMomentumEnd}
          renderItem={({ item }) => {
            const body =
              item.bodyClean ?? item.transcript ?? 'This page is still being written…';
            return (
              <ScrollView
                style={{ width }}
                contentContainerStyle={styles.pageScroll}
                showsVerticalScrollIndicator={false}
              >
                <PageView
                  title={item.bodyClean ? item.title : undefined}
                  body={body}
                  dateLabel={formatLongDate(item.createdAt)}
                  theme={theme}
                />
              </ScrollView>
            );
          }}
        />

        {/* Top overlay: close + page indicator */}
        <View style={styles.topBar} pointerEvents="box-none">
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Text style={[styles.closeTxt, { color: theme.inkColor }]}>✕</Text>
          </Pressable>
          <View style={styles.topRight}>
            {entries.length > 1 && (
              <Text style={[styles.pageIndicator, { color: theme.mutedInk }]}>
                {index + 1} / {entries.length}
              </Text>
            )}
            <Pressable onPress={startEditing} hitSlop={12} style={styles.editBtn}>
              <Text style={[styles.editTxt, { color: theme.accent }]}>Edit</Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom: theme switcher */}
        <View style={styles.themeBar}>
          {THEME_LIST.map((t) => {
            const active = t.id === themeId;
            return (
              <Pressable
                key={t.id}
                onPress={() => changeTheme(t.id)}
                style={[
                  styles.themeChip,
                  active && { backgroundColor: theme.inkColor },
                ]}
              >
                <Text
                  style={[
                    styles.themeChipTxt,
                    { color: active ? theme.pageColor : theme.mutedInk },
                  ]}
                >
                  {t.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageScroll: {
    flexGrow: 1,
    paddingTop: 56,
    paddingBottom: 80,
    paddingHorizontal: 10,
  },
  topBar: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    fontSize: 22,
    fontWeight: '400',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pageIndicator: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  editBtn: {
    paddingVertical: 2,
  },
  editTxt: {
    fontSize: 15,
    fontWeight: '700',
  },
  editBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  editAction: {
    fontSize: 16,
    fontWeight: '700',
  },
  editScroll: {
    padding: 24,
    paddingBottom: 80,
  },
  editTitle: {
    fontSize: 26,
    paddingVertical: 8,
    marginBottom: 8,
  },
  editBody: {
    minHeight: 320,
    paddingVertical: 4,
  },
  themeBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  themeChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  themeChipTxt: {
    fontSize: 13,
    fontWeight: '600',
  },
});
