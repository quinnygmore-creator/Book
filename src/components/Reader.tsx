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
  View,
} from 'react-native';
import { PageView } from './PageView';
import { Recording } from '../types/recording';
import { Book } from '../types/book';
import { getTheme, THEME_LIST, ThemeId } from '../theme/themes';
import { setBookTheme } from '../lib/bookStore';
import { formatLongDate } from '../lib/format';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  book: Book;
  entries: Recording[];
  initialIndex: number;
  onClose: () => void;
}

/**
 * Full-screen, book-like reader. Entries are horizontal pages you swipe
 * between (paging gives the page-turn feel). A theme switcher at the
 * bottom restyles every page live and persists the choice on the book.
 */
export function Reader({ visible, book, entries, initialIndex, onClose }: Props) {
  const [themeId, setThemeId] = useState<ThemeId>((book.theme as ThemeId) ?? 'journal');
  const [index, setIndex] = useState(initialIndex);
  const listRef = useRef<FlatList<Recording>>(null);
  const theme = getTheme(themeId);

  // Reset to the tapped page each time the reader opens.
  useEffect(() => {
    if (visible) setIndex(initialIndex);
  }, [visible, initialIndex]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const changeTheme = (id: ThemeId) => {
    setThemeId(id);
    setBookTheme(book.id, id); // fire-and-forget persistence
  };

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
          {entries.length > 1 && (
            <Text style={[styles.pageIndicator, { color: theme.mutedInk }]}>
              {index + 1} / {entries.length}
            </Text>
          )}
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
  pageIndicator: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
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
