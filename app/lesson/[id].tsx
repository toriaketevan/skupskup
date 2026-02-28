import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { markComplete } from '../../store/progress';
import { markLessonComplete } from '../../api/progress';
import { fetchLesson, fetchLessonCards, type Lesson } from '../../api/lessons';
import { useAuthUser } from '../../store/auth';
import type { Card } from '../../api/cards';

const CARD_W = 200;
const CARD_H = 280;

function CardPopup({ card, index, onClose }: { card: Card; index: number; onClose: () => void }) {
  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.popupOverlay}>
        <SafeAreaView style={styles.popupSafe} edges={['top', 'left', 'right', 'bottom']}>
          {/* X button */}
          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            onPress={onClose}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>

          {/* Full-size card */}
          <View style={styles.popupCard}>
            <Text style={styles.popupCardNumber}>{index + 1}</Text>
            <Text style={styles.popupCardType}>
              {card.type.replace(/_/g, ' ')}
            </Text>
            {card.title ? (
              <Text style={styles.popupCardTitle}>{card.title}</Text>
            ) : null}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function GameCard({ card, index, onPress }: { card: Card; index: number; onPress: () => void }) {
  return (
    <View style={styles.cardWrapper}>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
        onPress={onPress}
      >
        <Text style={styles.cardNumber}>{index + 1}</Text>
      </Pressable>
      <Text style={styles.cardLabel} numberOfLines={2}>
        {card.type.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = Number(id);

  const user = useAuthUser();

  const [lesson, setLesson]         = useState<Lesson | null>(null);
  const [cards, setCards]           = useState<Card[]>([]);
  const [loading, setLoading]       = useState(true);
  const [openCard, setOpenCard]     = useState<{ card: Card; index: number } | null>(null);

  useEffect(() => {
    Promise.all([
      fetchLesson(lessonId),
      fetchLessonCards(lessonId),
    ]).then(([les, c]) => {
      setLesson(les);
      setCards(c);
    }).finally(() => setLoading(false));
  }, [lessonId]);

  async function handleComplete() {
    if (lesson) {
      markComplete(lesson.id, lesson.sort_order);
      if (user) {
        markLessonComplete(user.id, lesson.id).catch(() => {});
      }
    }
    if (router.canGoBack()) router.back(); else router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
        >
          <Text style={styles.backBtnText}>← უკან</Text>
        </Pressable>
        <Text style={styles.title}>{lesson?.title ?? `გაკვეთილი ${id}`}</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Card popup */}
      {openCard && (
        <CardPopup
          card={openCard.card}
          index={openCard.index}
          onClose={() => setOpenCard(null)}
        />
      )}

      {/* Cards */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : cards.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>ბარათები ჯერ არ არის.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardScroll}
        >
          {cards.map((card, i) => (
            <GameCard
              key={card.id}
              card={card}
              index={i}
              onPress={() => setOpenCard({ card, index: i })}
            />
          ))}
        </ScrollView>
      )}

      {/* Complete button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.completeBtn, pressed && styles.completeBtnPressed]}
          onPress={handleComplete}
        >
          <Text style={styles.completeBtnText}>დასრულება ✓</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#EAECEF',
  },
  backBtn:        { minWidth: 70 },
  backBtnPressed: { opacity: 0.6 },
  backBtnText:    { fontSize: 16, color: '#FF6B6B', fontWeight: '600' },
  title:          { fontSize: 20, fontWeight: 'bold', color: '#2D3436' },

  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#9CA3AF' },

  cardScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },

  cardWrapper: { alignItems: 'center', gap: 8 },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  cardNumber: { fontSize: 72, fontWeight: 'bold', color: '#fff' },
  cardLabel: {
    width: CARD_W + 8,
    fontSize: 15, fontWeight: '600', color: '#374151',
    textAlign: 'center', textTransform: 'capitalize',
  },

  // Popup
  popupOverlay: {
    flex: 1,
    backgroundColor: '#3B82F6',
  },
  popupSafe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 20, color: '#fff', fontWeight: '700' },
  popupCard: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  popupCardNumber: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 130,
  },
  popupCardType: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  popupCardTitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },

  footer: { alignItems: 'center', paddingBottom: 32, paddingTop: 16 },
  completeBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16, paddingHorizontal: 56,
    borderRadius: 50,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  completeBtnPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  completeBtnText:    { fontSize: 20, fontWeight: 'bold', color: '#fff' },
});
