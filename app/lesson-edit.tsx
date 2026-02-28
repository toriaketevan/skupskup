import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthUser } from '../store/auth';
import {
  fetchLesson,
  updateLesson,
  fetchLessonCards,
  addCardToLesson,
  removeCardFromLesson,
  type Lesson,
} from '../api/lessons';
import { fetchCards, type Card, type CardType } from '../api/cards';

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

function typeMeta(type: CardType) {
  return CARD_TYPES.find(t => t.key === type)!;
}

function CardRow({
  card,
  action,
  actionLabel,
  actionStyle,
  actionTextStyle,
  onPress,
}: {
  card: Card;
  action: string;
  actionLabel: string;
  actionStyle: object;
  actionTextStyle: object;
  onPress: () => void;
}) {
  const m = typeMeta(card.type);
  return (
    <View style={styles.cardRow}>
      <View style={[styles.badge, { backgroundColor: m.color + '20' }]}>
        <Text style={styles.badgeEmoji}>{m.emoji}</Text>
        <Text style={[styles.badgeLabel, { color: m.color }]}>{m.label}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{card.title || '—'}</Text>
      <Pressable style={({ pressed }) => [actionStyle, pressed && { opacity: 0.7 }]} onPress={onPress}>
        <Text style={actionTextStyle}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

export default function LessonEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = Number(id);
  const user = useAuthUser();

  const [lesson, setLesson]               = useState<Lesson | null>(null);
  const [titleValue, setTitleValue]       = useState('');
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [assignedCards, setAssignedCards] = useState<Card[]>([]);
  const [allCards, setAllCards]           = useState<Card[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    Promise.all([
      fetchLesson(lessonId),
      fetchLessonCards(lessonId),
      fetchCards(),
    ]).then(([les, assigned, all]) => {
      setLesson(les);
      setTitleValue(les.title);
      setAssignedCards(assigned);
      setAllCards(all);
    }).catch(() => {
      setError('ვერ ვუკავშირდებით სერვერს. გაშვებულია backend?');
    }).finally(() => setLoading(false));
  }, [lessonId]);

  if (!user || user.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'bottom']}>
        <View style={styles.center}><Text style={styles.errorText}>წვდომა შეზღუდულია.</Text></View>
      </SafeAreaView>
    );
  }

  async function handleSaveTitle() {
    if (!lesson || !titleValue.trim()) return;
    setSaving(true);
    try {
      const updated = await updateLesson(lesson.id, titleValue.trim());
      setLesson(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(card: Card) {
    await addCardToLesson(lessonId, card.id);
    setAssignedCards(prev => [...prev, card]);
  }

  async function handleRemove(card: Card) {
    await removeCardFromLesson(lessonId, card.id);
    setAssignedCards(prev => prev.filter(c => c.id !== card.id));
  }

  const assignedIds = new Set(assignedCards.map(c => c.id));
  const unassignedCards = allCards.filter(c => !assignedIds.has(c.id));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/admin')} style={styles.backBtn}>
          <Text style={styles.backText}>← უკან</Text>
        </Pressable>
        <Text style={styles.title}>
          {lesson ? lesson.title : 'გაკვეთილის რედაქტირება'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#374151" /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {/* Name */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>გაკვეთილის სახელი</Text>
            <View style={styles.nameRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={titleValue}
                onChangeText={setTitleValue}
                selectTextOnFocus
              />
              <Pressable
                style={({ pressed }) => [styles.saveBtn, saved && styles.saveBtnDone, pressed && { opacity: 0.8 }]}
                onPress={handleSaveTitle}
                disabled={saving || saved}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>{saved ? 'შენახულია ✓' : 'შენახვა'}</Text>
                }
              </Pressable>
            </View>
          </View>

          {/* Assigned cards */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>მინიჭებული ბარათები ({assignedCards.length})</Text>
            {assignedCards.length === 0 ? (
              <Text style={styles.emptyText}>ბარათები ჯერ არ არის მინიჭებული.</Text>
            ) : (
              assignedCards.map(card => (
                <CardRow
                  key={card.id}
                  card={card}
                  action="remove"
                  actionLabel="წაშლა"
                  actionStyle={styles.removeBtn}
                  actionTextStyle={styles.removeBtnText}
                  onPress={() => handleRemove(card)}
                />
              ))
            )}
          </View>

          {/* Available cards */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>ხელმისაწვდომი ბარათები ({unassignedCards.length})</Text>
            {unassignedCards.length === 0 ? (
              <Text style={styles.emptyText}>ყველა ბარათი უკვე მინიჭებულია.</Text>
            ) : (
              unassignedCards.map(card => (
                <CardRow
                  key={card.id}
                  card={card}
                  action="add"
                  actionLabel="+ დამატება"
                  actionStyle={styles.addBtn}
                  actionTextStyle={styles.addBtnText}
                  onPress={() => handleAdd(card)}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EAECEF', backgroundColor: '#fff',
  },
  backBtn:  { width: 70 },
  backText: { fontSize: 15, fontWeight: '600', color: '#6366F1' },
  title:    { fontSize: 18, fontWeight: 'bold', color: '#374151', flex: 1, textAlign: 'center' },

  body: { padding: 20, gap: 16, maxWidth: 700, alignSelf: 'center', width: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    gap: 4, borderWidth: 1, borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },

  nameRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111827',
  },
  saveBtn: {
    backgroundColor: '#374151', paddingHorizontal: 18,
    paddingVertical: 10, borderRadius: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  saveBtnDone: { backgroundColor: '#10B981' },

  cardRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, minWidth: 130,
  },
  badgeEmoji: { fontSize: 14 },
  badgeLabel: { fontSize: 11, fontWeight: '600' },
  cardTitle:  { flex: 1, fontSize: 14, color: '#374151' },

  removeBtn:     { backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  removeBtnText: { fontSize: 13, fontWeight: '600', color: '#EF4444' },
  addBtn:        { backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText:    { fontSize: 13, fontWeight: '600', color: '#10B981' },

  emptyText:  { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic', paddingVertical: 4 },
  errorText:  { fontSize: 15, color: '#EF4444', textAlign: 'center', paddingHorizontal: 32 },
});
