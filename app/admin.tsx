import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuthUser } from '../store/auth';
import {
  fetchLessons, createLesson, deleteLesson, type Lesson,
} from '../api/lessons';
import {
  fetchCards, deleteCard, type CardData,
} from '../api/cards';
import { CARD_TYPES } from '../constants/cards';

type Section = 'lessons' | 'cards';

// ─── Shared confirm-delete modal ───────────────────────────────────────────────
function ConfirmDeleteModal({
  visible, itemName, onConfirm, onCancel,
}: { visible: boolean; itemName: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>წაშლის დადასტურება</Text>
          <Text style={styles.dialogBody}>
            ნამდვილად გსურთ წაშალოთ{' '}
            <Text style={styles.dialogBold}>{itemName}</Text>?
          </Text>
          <View style={styles.dialogActions}>
            <Pressable style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnCancel, pressed && { opacity: 0.7 }]} onPress={onCancel}>
              <Text style={styles.dialogBtnCancelText}>გაუქმება</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnDelete, pressed && { opacity: 0.7 }]} onPress={onConfirm}>
              <Text style={styles.dialogBtnDeleteText}>დიახ, წაშლა</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Lessons section ───────────────────────────────────────────────────────────
function LessonRow({ lesson, onEdit, onDelete }: { lesson: Lesson; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIndex}><Text style={styles.rowIndexText}>{lesson.sort_order}</Text></View>
      <Text style={styles.rowTitle} numberOfLines={1}>{lesson.title}</Text>
      <View style={styles.rowActions}>
        <Pressable style={({ pressed }) => [styles.btn, styles.btnEdit, pressed && styles.btnPressed]} onPress={onEdit}>
          <Text style={styles.btnEditText}>რედ.</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.btn, styles.btnDelete, pressed && styles.btnPressed]} onPress={onDelete}>
          <Text style={styles.btnDeleteText}>წაშლა</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LessonsSection() {
  const [lessons, setLessons]             = useState<Lesson[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Lesson | null>(null);

  async function load() {
    try {
      setError(null); setLoading(true);
      setLessons(await fetchLessons());
    } catch {
      setError('ვერ ვუკავშირდებით სერვერს. გაშვებულია backend?');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleCreate() {
    const lesson = await createLesson(`გაკვეთილი ${lessons.length + 1}`);
    setLessons(prev => [...prev, lesson]);
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    await deleteLesson(pendingDelete.id);
    setLessons(prev => prev.filter(l => l.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  return (
    <View style={styles.sectionContainer}>
      <ConfirmDeleteModal
        visible={!!pendingDelete}
        itemName={pendingDelete?.title ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <View style={styles.tableWrapper}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: 36 }]}>#</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>სახელი</Text>
          <Text style={[styles.tableHeaderCell, { width: 100 }]}>მოქმედება</Text>
        </View>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#374151" /></View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={load}><Text style={styles.retryBtnText}>განახლება</Text></Pressable>
          </View>
        ) : (
          <FlatList
            data={lessons}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <LessonRow
                lesson={item}
                onEdit={() => router.push(`/lesson-edit?id=${item.id}`)}
                onDelete={() => setPendingDelete(item)}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        )}
        <View style={styles.footer}>
          <Pressable style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }]} onPress={handleCreate}>
            <Text style={styles.createBtnText}>+ ახალი გაკვეთილი</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Cards section ─────────────────────────────────────────────────────────────
function CardRow({ card, onEdit, onDelete }: { card: CardData; onEdit: () => void; onDelete: () => void }) {
  const meta = CARD_TYPES.find(t => t.key === card.type);
  if (!meta) return null;
  return (
    <View style={styles.row}>
      <View style={[styles.cardBadge, { backgroundColor: meta.color + '18' }]}>
        <Text style={styles.cardBadgeEmoji}>{meta.emoji}</Text>
        <Text style={[styles.cardBadgeLabel, { color: meta.color }]}>{meta.label}</Text>
      </View>
      <Text style={styles.rowTitle} numberOfLines={1}>{card.title || '—'}</Text>
      <View style={styles.rowActions}>
        <Pressable style={({ pressed }) => [styles.btn, styles.btnEdit, pressed && styles.btnPressed]} onPress={onEdit}>
          <Text style={styles.btnEditText}>რედ.</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.btn, styles.btnDelete, pressed && styles.btnPressed]} onPress={onDelete}>
          <Text style={styles.btnDeleteText}>წაშლა</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CardsSection() {
  const [cards, setCards]               = useState<CardData[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CardData | null>(null);

  async function load() {
    try {
      setError(null); setLoading(true);
      setCards(await fetchCards());
    } catch {
      setError('ვერ ვუკავშირდებით სერვერს. გაშვებულია backend?');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleDelete() {
    if (!pendingDelete) return;
    await deleteCard(pendingDelete.id);
    setCards(prev => prev.filter(c => c.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  return (
    <View style={styles.sectionContainer}>
      <ConfirmDeleteModal
        visible={!!pendingDelete}
        itemName={pendingDelete?.title ?? `ბარათი #${pendingDelete?.id}`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <View style={styles.tableWrapper}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: 140 }]}>ტიპი</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>სათაური</Text>
          <Text style={[styles.tableHeaderCell, { width: 100 }]}>მოქმედება</Text>
        </View>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#374151" /></View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={load}><Text style={styles.retryBtnText}>განახლება</Text></Pressable>
          </View>
        ) : (
          <FlatList
            data={cards}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <CardRow
                card={item}
                onEdit={() => router.push(`/card-edit?cardId=${item.id}`)}
                onDelete={() => setPendingDelete(item)}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        )}
        <View style={styles.footer}>
          <Pressable style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }]} onPress={() => router.push('/card-add')}>
            <Text style={styles.createBtnText}>+ ახალი ბარათი</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────
const MENU: { key: Section; label: string; emoji: string }[] = [
  { key: 'lessons', label: 'გაკვეთილები', emoji: '📚' },
  { key: 'cards',   label: 'ბარათები',    emoji: '🃏' },
];

export default function AdminScreen() {
  const user = useAuthUser();
  const [section, setSection] = useState<Section>('lessons');

  if (!user || user.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>წვდომა შეზღუდულია.</Text>
          <Pressable style={styles.retryBtn} onPress={() => router.replace('/grownups')}>
            <Text style={styles.retryBtnText}>შესვლა</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ადმინი</Text>
      </View>

      {/* Body: sidebar + content */}
      <View style={styles.body}>
        {/* Left sidebar */}
        <View style={styles.sidebar}>
          {MENU.map(item => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [
                styles.menuItem,
                section === item.key && styles.menuItemActive,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => setSection(item.key)}
            >
              <Text style={styles.menuEmoji}>{item.emoji}</Text>
              <Text style={[styles.menuLabel, section === item.key && styles.menuLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {section === 'lessons' ? <LessonsSection /> : <CardsSection />}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EAECEF', backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#374151' },

  body:    { flex: 1, flexDirection: 'row' },
  content: { flex: 1 },

  // Sidebar
  sidebar: {
    width: 148,
    backgroundColor: '#1E293B',
    paddingTop: 8,
    borderRightWidth: 1,
    borderRightColor: '#0F172A',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 16,
    borderLeftWidth: 3, borderLeftColor: 'transparent',
  },
  menuItemActive: {
    backgroundColor: '#334155',
    borderLeftColor: '#6366F1',
  },
  menuEmoji: { fontSize: 16 },
  menuLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  menuLabelActive: { color: '#F1F5F9' },

  sectionContainer: { flex: 1 },
  tableWrapper: {
    flex: 1, alignSelf: 'center', width: '100%', maxWidth: 720,
  },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#F3F4F6', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  tableHeaderCell: {
    fontSize: 11, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff',
  },
  rowIndex:     { width: 36 },
  rowIndexText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  rowTitle:     { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500' },
  rowActions:   { width: 100, flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
  separator:    { height: 1, backgroundColor: '#F3F4F6' },

  btn:           { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
  btnEdit:       { backgroundColor: '#EFF6FF' },
  btnDelete:     { backgroundColor: '#FEF2F2' },
  btnPressed:    { opacity: 0.7 },
  btnEditText:   { fontSize: 12, fontWeight: '600', color: '#3B82F6' },
  btnDeleteText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },

  // Card badge
  cardBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, width: 140,
  },
  cardBadgeEmoji: { fontSize: 13 },
  cardBadgeLabel: { fontSize: 10, fontWeight: '700' },

  footer:        { padding: 16, borderTopWidth: 1, borderTopColor: '#EAECEF', backgroundColor: '#fff' },
  createBtn:     { backgroundColor: '#374151', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF' },

  errorText:    { fontSize: 15, color: '#EF4444', textAlign: 'center', paddingHorizontal: 32 },
  retryBtn:     { backgroundColor: '#374151', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  dialog:  { width: 300, backgroundColor: '#fff', borderRadius: 16, padding: 24, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  dialogTitle:         { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  dialogBody:          { fontSize: 15, color: '#6B7280', lineHeight: 22 },
  dialogBold:          { fontWeight: '700', color: '#374151' },
  dialogActions:       { flexDirection: 'row', gap: 10, marginTop: 4 },
  dialogBtn:           { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  dialogBtnCancel:     { backgroundColor: '#F3F4F6' },
  dialogBtnDelete:     { backgroundColor: '#EF4444' },
  dialogBtnCancelText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  dialogBtnDeleteText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
