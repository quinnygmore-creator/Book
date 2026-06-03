import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Book } from '../types/book';
import { createBook, deleteBook, listBooks, renameBook } from '../lib/bookStore';
import { countByBook, unassignBook } from '../lib/recordingStore';
import { TextInputModal } from '../components/TextInputModal';
import { colors, radius } from '../theme/colors';

interface Props {
  onOpenBook: (book: Book) => void;
  onOpenGoals: () => void;
}

type ModalState = { mode: 'create' } | { mode: 'rename'; book: Book } | null;
type GridItem = { type: 'book'; book: Book } | { type: 'new' };

const GAP = 12;
const PAD = 20;
const CARD_W = (Dimensions.get('window').width - PAD * 2 - GAP) / 2;

export function BookshelfScreen({ onOpenBook, onOpenGoals }: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [modal, setModal] = useState<ModalState>(null);

  const refresh = useCallback(async () => {
    const [b, c] = await Promise.all([listBooks(), countByBook()]);
    setBooks(b);
    setCounts(c);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleConfirm = useCallback(
    async (value: string) => {
      if (modal?.mode === 'create') {
        const book = await createBook(value);
        setModal(null);
        await refresh();
        onOpenBook(book); // jump straight into the new book to record
        return;
      }
      if (modal?.mode === 'rename') {
        await renameBook(modal.book.id, value);
      }
      setModal(null);
      await refresh();
    },
    [modal, refresh, onOpenBook]
  );

  const confirmDelete = useCallback(
    (book: Book) => {
      Alert.alert(
        `Delete “${book.title}”?`,
        'Entries in this book will be unassigned, not deleted.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await unassignBook(book.id);
              await deleteBook(book.id);
              await refresh();
            },
          },
        ]
      );
    },
    [refresh]
  );

  const handleLongPress = useCallback(
    (book: Book) => {
      Alert.alert(book.title, undefined, [
        { text: 'Rename', onPress: () => setModal({ mode: 'rename', book }) },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(book) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [confirmDelete]
  );

  const data: GridItem[] = [
    ...books.map((book) => ({ type: 'book' as const, book })),
    { type: 'new' as const },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>Your Shelf</Text>
          <Pressable onPress={onOpenGoals} hitSlop={8}>
            <Text style={styles.goalsBtn}>🎯 Goals</Text>
          </Pressable>
        </View>
        <Text style={styles.tagline}>
          {books.length === 0
            ? 'Create your first book to begin.'
            : 'Speak your thoughts. Keep them in books.'}
        </Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => (item.type === 'book' ? item.book.id : '__new')}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) =>
          item.type === 'book' ? (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() => onOpenBook(item.book)}
              onLongPress={() => handleLongPress(item.book)}
            >
              <Text style={styles.emoji}>{item.book.coverEmoji ?? '📓'}</Text>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.book.title}
              </Text>
              <Text style={styles.count}>
                {(counts[item.book.id] ?? 0) === 1
                  ? '1 page'
                  : `${counts[item.book.id] ?? 0} pages`}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.newCard, pressed && styles.pressed]}
              onPress={() => setModal({ mode: 'create' })}
            >
              <Text style={styles.plus}>+</Text>
              <Text style={styles.newTxt}>New book</Text>
            </Pressable>
          )
        }
      />

      <TextInputModal
        visible={modal !== null}
        title={modal?.mode === 'rename' ? 'Rename book' : 'New book'}
        placeholder="e.g. Business Ideas, Daily Journal"
        initialValue={modal?.mode === 'rename' ? modal.book.title : ''}
        confirmLabel={modal?.mode === 'rename' ? 'Rename' : 'Create'}
        onCancel={() => setModal(null)}
        onConfirm={handleConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 0.3,
  },
  goalsBtn: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
  },
  tagline: {
    fontSize: 15,
    color: colors.inkSoft,
    marginTop: 2,
  },
  listContent: {
    padding: PAD,
  },
  column: {
    gap: GAP,
  },
  card: {
    width: CARD_W,
    aspectRatio: 0.82,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: GAP,
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.7 },
  emoji: {
    fontSize: 34,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  count: {
    fontSize: 13,
    color: colors.inkSoft,
  },
  newCard: {
    width: CARD_W,
    aspectRatio: 0.82,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: 16,
    marginBottom: GAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontSize: 40,
    color: colors.accent,
    fontWeight: '300',
    marginBottom: 4,
  },
  newTxt: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: '600',
  },
});
