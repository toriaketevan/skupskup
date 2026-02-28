import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthUser } from '../store/auth';
import {
  fetchLessons,
  createLesson,
  deleteLesson,
  type Lesson,
} from '../api/lessons';
import {
  fetchCards,
  createCard,
  updateCard,
  deleteCard,
  type Card,
  type CardType,
} from '../api/cards';

// ─── Card type metadata ───────────────────────────────────────────────────────
const CARD_TYPES: { key: CardType; label: string; emoji: string; color: string }[] = [
  { key: 'new_letter',     label: 'ახალი ასო',           emoji: '🔤', color: '#6366F1' },
  { key: 'sound_story',    label: 'ბგერის ისტორია',      emoji: '🔊', color: '#EC4899' },
  { key: 'letter_writing', label: 'ასოს წერა',           emoji: '✍️',  color: '#F59E0B' },
  { key: 'word_reading',   label: 'სიტყვის კითხვა',      emoji: '📖', color: '#10B981' },
  { key: 'book',           label: 'წიგნი',               emoji: '📚', color: '#3B82F6' },
  { key: 'letter_review',  label: 'ასოების გამეორება',   emoji: '🔁', color: '#8B5CF6' },
  { key: 'alphabet_song',  label: 'ანბანის სიმღერა',     emoji: '🎵', color: '#EF4444' },
  { key: 'quick_check',    label: 'სწრაფი შემოწმება',    emoji: '✅', color: '#14B8A6' },
  { key: 'comprehension',  label: 'გაგება-გააზრება',     emoji: '🧠', color: '#F97316' },
];

type ContentField = { key: string; label: string; multiline?: boolean; maxLength?: number; placeholder?: string };
const CONTENT_FIELDS: Record<CardType, ContentField[]> = {
  new_letter:     [{ key: 'letter', label: 'ასო', maxLength: 2, placeholder: 'მაგ. ა' }],
  sound_story:    [{ key: 'text', label: 'ისტორიის ტექსტი', multiline: true, placeholder: 'შეიყვანეთ ისტორია...' }, { key: 'audio_url', label: 'აუდიოს ბმული', placeholder: 'https://...' }],
  letter_writing: [{ key: 'letter', label: 'ასო', maxLength: 2, placeholder: 'მაგ. ბ' }],
  word_reading:   [{ key: 'words', label: 'სიტყვები (მძიმეებით)', placeholder: 'კატა, ბათა, ჩიტი' }],
  book:           [{ key: 'book_url', label: 'წიგნის ბმული', placeholder: 'https://...' }],
  letter_review:  [{ key: 'letters', label: 'ასოები (მძიმეებით)', placeholder: 'ა, ბ, გ' }],
  alphabet_song:  [{ key: 'audio_url', label: 'აუდიოს ბმული', placeholder: 'https://...' }, { key: 'video_url', label: 'ვიდეოს ბმული', placeholder: 'https://...' }],
  quick_check:    [{ key: 'note', label: 'შენიშვნები', multiline: true, placeholder: 'სურვილისამებრ შენიშვნები...' }],
  comprehension:  [{ key: 'passage', label: 'ტექსტი', multiline: true, placeholder: 'შეიყვანეთ საკითხავი ტექსტი...' }],
};

type Section = 'lessons' | 'cards';

const MENU: { key: Section; label: string; emoji: string }[] = [
  { key: 'lessons', label: 'გაკვეთილები', emoji: '📝' },
  { key: 'cards',   label: 'ბარათები',    emoji: '🃏' },
];

// ─── Delete confirmation modal ────────────────────────────────────────────────
function DeleteModal({
  lesson, onConfirm, onCancel,
}: { lesson: Lesson | null; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal visible={!!lesson} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>გაკვეთილის წაშლა</Text>
          <Text style={styles.dialogBody}>
            ნამდვილად გსურთ წაშალოთ{' '}
            <Text style={styles.dialogBold}>{lesson?.title}</Text>?
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

// ─── Row ──────────────────────────────────────────────────────────────────────
function Row({ lesson, onEdit, onDelete }: { lesson: Lesson; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIndex}><Text style={styles.rowIndexText}>{lesson.sort_order}</Text></View>
      <Text style={styles.rowTitle} numberOfLines={1}>{lesson.title}</Text>
      <View style={styles.rowActions}>
        <Pressable style={({ pressed }) => [styles.btn, styles.btnEdit, pressed && styles.btnPressed]} onPress={onEdit}>
          <Text style={styles.btnEditText}>რედაქტირება</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.btn, styles.btnDelete, pressed && styles.btnPressed]} onPress={onDelete}>
          <Text style={styles.btnDeleteText}>წაშლა</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Lessons section ──────────────────────────────────────────────────────────
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

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    const lesson = await createLesson(`გაკვეთილი ${lessons.length + 1}`);
    setLessons((prev) => [...prev, lesson]);
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    await deleteLesson(pendingDelete.id);
    setLessons((prev) => prev.filter((l) => l.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  return (
    <View style={styles.sectionContainer}>
      <DeleteModal lesson={pendingDelete} onConfirm={handleDelete} onCancel={() => setPendingDelete(null)} />

      <View style={styles.tableWrapper}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: 40 }]}>#</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>სახელი</Text>
          <Text style={[styles.tableHeaderCell, { width: 120 }]}>მოქმედება</Text>
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
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <Row lesson={item} onEdit={() => router.push(`/lesson-edit?id=${item.id}`)} onDelete={() => setPendingDelete(item)} />
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

// ─── Card modal ───────────────────────────────────────────────────────────────
function CardModal({
  visible, editCard, onSave, onCancel,
}: {
  visible: boolean;
  editCard: Card | null;
  onSave: (card: Card) => void;
  onCancel: () => void;
}) {
  const [step, setStep]         = useState<'type' | 'form'>('type');
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [title, setTitle]       = useState('');
  const [content, setContent]   = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (visible) {
      if (editCard) {
        setStep('form');
        setCardType(editCard.type);
        setTitle(editCard.title ?? '');
        const raw = editCard.content ?? {};
        setContent(Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v)])));
      } else {
        setStep('type');
        setCardType(null);
        setTitle('');
        setContent({});
      }
    }
  }, [visible, editCard]);

  async function handleSave() {
    if (!cardType) return;
    setSaving(true);
    try {
      const parsedContent: Record<string, any> = {};
      for (const field of CONTENT_FIELDS[cardType]) {
        const val = content[field.key] ?? '';
        if (val) parsedContent[field.key] = val;
      }
      let card: Card;
      if (editCard) {
        card = await updateCard(editCard.id, { title: title || null as any, content: parsedContent });
      } else {
        card = await createCard({ type: cardType, title: title || undefined, content: parsedContent });
      }
      onSave(card);
    } finally {
      setSaving(false);
    }
  }

  const meta = cardType ? CARD_TYPES.find(t => t.key === cardType) : null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.cardModalBox}>
          {step === 'type' ? (
            <>
              <Text style={styles.dialogTitle}>ბარათის ტიპი</Text>
              <View style={styles.typeGrid}>
                {CARD_TYPES.map((t) => (
                  <Pressable
                    key={t.key}
                    style={({ pressed }) => [styles.typeBtn, { borderColor: t.color }, pressed && { opacity: 0.7 }]}
                    onPress={() => { setCardType(t.key); setStep('form'); }}
                  >
                    <Text style={styles.typeBtnEmoji}>{t.emoji}</Text>
                    <Text style={[styles.typeBtnLabel, { color: t.color }]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnCancel, pressed && { opacity: 0.7 }, { marginTop: 8 }]} onPress={onCancel}>
                <Text style={styles.dialogBtnCancelText}>გაუქმება</Text>
              </Pressable>
            </>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {!editCard && (
                <Pressable onPress={() => setStep('type')} style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6366F1', fontWeight: '600' }}>← ტიპის შეცვლა</Text>
                </Pressable>
              )}
              {meta && (
                <View style={[styles.typePill, { backgroundColor: meta.color + '20', borderColor: meta.color }]}>
                  <Text style={{ fontSize: 16 }}>{meta.emoji}</Text>
                  <Text style={[styles.typePillLabel, { color: meta.color }]}>{meta.label}</Text>
                </View>
              )}
              <Text style={styles.fieldLabel}>სათაური</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="სურვილისამებრ სათაური"
              />
              {cardType && CONTENT_FIELDS[cardType].map(field => (
                <View key={field.key}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={[styles.input, field.multiline && styles.inputMultiline]}
                    value={content[field.key] ?? ''}
                    onChangeText={(v) => setContent(prev => ({ ...prev, [field.key]: v }))}
                    placeholder={field.placeholder}
                    multiline={field.multiline}
                    maxLength={field.maxLength}
                  />
                </View>
              ))}
              <View style={[styles.dialogActions, { marginTop: 16 }]}>
                <Pressable style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnCancel, pressed && { opacity: 0.7 }]} onPress={onCancel}>
                  <Text style={styles.dialogBtnCancelText}>გაუქმება</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnSave, pressed && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.dialogBtnSaveText}>შენახვა</Text>}
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Cards section ────────────────────────────────────────────────────────────
function CardsSection() {
  const [cards, setCards]                 = useState<Card[]>([]);
  const [loading, setLoading]             = useState(true);
  const [modalVisible, setModalVisible]   = useState(false);
  const [editCard, setEditCard]           = useState<Card | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Card | null>(null);

  useEffect(() => {
    fetchCards().then(setCards).finally(() => setLoading(false));
  }, []);

  function openCreate() { setEditCard(null); setModalVisible(true); }
  function openEdit(card: Card) { setEditCard(card); setModalVisible(true); }

  function handleSaved(card: Card) {
    setCards(prev => {
      const idx = prev.findIndex(c => c.id === card.id);
      return idx >= 0 ? prev.map(c => c.id === card.id ? card : c) : [...prev, card];
    });
    setModalVisible(false);
  }

  async function handleDelete(card: Card) {
    await deleteCard(card.id);
    setCards(prev => prev.filter(c => c.id !== card.id));
    setPendingDelete(null);
  }

  const typeMeta = (type: CardType) => CARD_TYPES.find(t => t.key === type)!;

  return (
    <View style={styles.sectionContainer}>
      {/* Delete confirm */}
      <Modal visible={!!pendingDelete} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>ბარათის წაშლა</Text>
            <Text style={styles.dialogBody}>წაიშალოს <Text style={styles.dialogBold}>{pendingDelete?.title || pendingDelete?.type}</Text>?</Text>
            <View style={styles.dialogActions}>
              <Pressable style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnCancel, pressed && { opacity: 0.7 }]} onPress={() => setPendingDelete(null)}>
                <Text style={styles.dialogBtnCancelText}>გაუქმება</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnDelete, pressed && { opacity: 0.7 }]} onPress={() => pendingDelete && handleDelete(pendingDelete)}>
                <Text style={styles.dialogBtnDeleteText}>წაშლა</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <CardModal
        visible={modalVisible}
        editCard={editCard}
        onSave={handleSaved}
        onCancel={() => setModalVisible(false)}
      />

      {/* Cards list */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#374151" /></View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={c => String(c.id)}
          renderItem={({ item }) => {
            const m = typeMeta(item.type);
            return (
              <View style={styles.cardRow}>
                <View style={[styles.cardTypeBadge, { backgroundColor: m.color + '20' }]}>
                  <Text style={styles.cardTypeEmoji}>{m.emoji}</Text>
                  <Text style={[styles.cardTypeLabel, { color: m.color }]}>{m.label}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title || '—'}</Text>
                <View style={styles.rowActions}>
                  <Pressable style={({ pressed }) => [styles.btn, styles.btnEdit, pressed && styles.btnPressed]} onPress={() => openEdit(item)}>
                    <Text style={styles.btnEditText}>რედაქტირება</Text>
                  </Pressable>
                  <Pressable style={({ pressed }) => [styles.btn, styles.btnDelete, pressed && styles.btnPressed]} onPress={() => setPendingDelete(item)}>
                    <Text style={styles.btnDeleteText}>წაშლა</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>ბარათები ჯერ არ არის</Text></View>}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }]} onPress={openCreate}>
          <Text style={styles.createBtnText}>+ ახალი ბარათი</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
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

      <View style={styles.body}>
        {/* Left menu */}
        <View style={styles.rightMenu}>
          {MENU.map((item) => {
            const active = section === item.key;
            return (
              <Pressable
                key={item.key}
                style={({ pressed }) => [styles.menuItem, active && styles.menuItemActive, pressed && { opacity: 0.7 }]}
                onPress={() => setSection(item.key)}
              >
                <Text style={styles.menuEmoji}>{item.emoji}</Text>
                <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {section === 'lessons' && <LessonsSection />}
          {section === 'cards'   && <CardsSection />}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EAECEF', backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#374151' },

  body: { flex: 1, flexDirection: 'row' },

  content: { flex: 1 },

  sectionContainer: { flex: 1 },

  // Right menu
  rightMenu: {
    width: 100,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#EAECEF',
    paddingTop: 16,
    gap: 4,
    alignItems: 'center',
  },
  menuItem: {
    width: 80, paddingVertical: 12,
    borderRadius: 12, alignItems: 'center', gap: 4,
    borderWidth: 2, borderColor: 'transparent',
  },
  menuItemActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  menuEmoji:      { fontSize: 22 },
  menuLabel:      { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  menuLabelActive:{ color: '#4F46E5', fontWeight: '700' },

  tableWrapper: {
    flex: 1, alignSelf: 'center', width: '100%',
    maxWidth: 700, marginHorizontal: 48,
  },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#F3F4F6', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  tableHeaderCell: {
    fontSize: 12, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  rowIndex:     { width: 40 },
  rowIndexText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  rowTitle:     { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  rowActions:   { width: 120, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  separator:    { height: 1, backgroundColor: '#F3F4F6' },

  btn:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnEdit:       { backgroundColor: '#EFF6FF' },
  btnDelete:     { backgroundColor: '#FEF2F2' },
  btnPressed:    { opacity: 0.7 },
  btnEditText:   { fontSize: 13, fontWeight: '600', color: '#3B82F6' },
  btnDeleteText: { fontSize: 13, fontWeight: '600', color: '#EF4444' },

  footer:        { padding: 16, borderTopWidth: 1, borderTopColor: '#EAECEF', backgroundColor: '#fff' },
  createBtn:     { backgroundColor: '#374151', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  createBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF' },

  // Card modal
  cardModalBox: {
    width: 360, maxHeight: '85%', backgroundColor: '#fff',
    borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 12 },
  typeBtn: {
    width: 100, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center', gap: 4,
  },
  typeBtnEmoji: { fontSize: 22 },
  typeBtnLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, marginBottom: 14,
  },
  typePillLabel: { fontSize: 13, fontWeight: '600' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, marginTop: 10 },
  inputMultiline: { height: 90, textAlignVertical: 'top' },

  // Lesson picker
  lessonPickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    margin: 12, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
  },
  lessonPickerLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  lessonPickerCaret: { fontSize: 14, color: '#9CA3AF' },
  pickerBox: { width: 300, maxHeight: 420, backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 10 },
  pickerRow: { paddingVertical: 11, paddingHorizontal: 12, borderRadius: 8 },
  pickerRowActive: { backgroundColor: '#EEF2FF' },
  pickerRowText: { fontSize: 15, color: '#374151' },
  pickerRowTextActive: { color: '#4F46E5', fontWeight: '700' },

  // Card row
  cardRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', gap: 10 },
  cardTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, minWidth: 130 },
  cardTypeEmoji: { fontSize: 14 },
  cardTypeLabel: { fontSize: 11, fontWeight: '600' },
  cardTitle:     { flex: 1, fontSize: 14, color: '#374151' },
  errorText: { fontSize: 15, color: '#EF4444', textAlign: 'center', paddingHorizontal: 32 },
  retryBtn:  { backgroundColor: '#374151', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600' },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  dialog:  { width: 300, backgroundColor: '#fff', borderRadius: 16, padding: 24, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  dialogTitle:   { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  dialogBody:    { fontSize: 15, color: '#6B7280', lineHeight: 22 },
  dialogBold:    { fontWeight: '700', color: '#374151' },
  dialogActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  dialogBtn:            { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  dialogBtnCancel:      { backgroundColor: '#F3F4F6' },
  dialogBtnDelete:      { backgroundColor: '#EF4444' },
  dialogBtnSave:        { backgroundColor: '#374151' },
  dialogBtnCancelText:  { fontSize: 15, fontWeight: '600', color: '#374151' },
  dialogBtnDeleteText:  { fontSize: 15, fontWeight: '600', color: '#fff' },
  dialogBtnSaveText:    { fontSize: 15, fontWeight: '600', color: '#fff' },

  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111827' },
});
