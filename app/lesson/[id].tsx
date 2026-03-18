import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { markComplete } from '../../store/progress';
import { markLessonComplete } from '../../api/progress';
import { fetchLesson, fetchLessonCards, type Lesson } from '../../api/lessons';
import { useAuthUser } from '../../store/auth';
import type { CardData } from '../../api/cards';
import TracingReader from '../../components/TracingReader';
import LetterWritingViewer from '../../components/LetterWritingViewer';
import LetterTracingViewer from '../../components/LetterTracingViewer';
import { NEW_LETTER_SECTIONS, getDefaultNLSections, type NLSection } from '../../constants/cards';

const CARD_W = 200;
const CARD_H = 280;

const CARD_LABELS: Record<string, string> = {
  new_letter:     'ახალი ასო',
  sound_story:    'ბგერის ისტორია',
  letter_writing: 'ასოს წერა',
  letter_tracing: 'ასოს ამოწერა',
  word_reading:   'სიტყვის კითხვა',
  book:           'წიგნი',
  letter_review:  'ასოების გამეორება',
  alphabet_song:  'ანბანის სიმღერა',
  quick_check:    'სწრაფი შემოწმება',
  comprehension:  'გაგება-გააზრება',
};

// ─── Book viewer ──────────────────────────────────────────────────────────────

type BookPage = { text?: string; image?: string };

function parseBookPages(card: CardData): BookPage[] {
  const raw: Record<string, any> =
    typeof card.content === 'string'
      ? (() => { try { return JSON.parse(card.content as unknown as string); } catch { return {}; } })()
      : (card.content ?? {});
  if (Array.isArray(raw.pages)) return raw.pages;
  // fallback: old single-content field
  return [{ text: raw.content ?? '' }];
}

function BookViewer({ card, onClose, onComplete }: { card: CardData; onClose: () => void; onComplete?: () => void }) {
  const { width: SW, height: SH } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const btnAnim   = useRef(new Animated.Value(0)).current;

  const pages = parseBookPages(card);
  const [pageIdx, setPageIdx] = useState(0);

  const BOOK_W  = Math.min(SW * 0.94, 700);
  const BOOK_H  = Math.min(SH * 0.64, 460);
  const PAGE_W  = (BOOK_W - 2) / 2; // 2 = spine width
  const isFirst = pageIdx === 0;
  const isLast  = pageIdx === pages.length - 1;
  const page    = pages[pageIdx] ?? {};

  function slideTo(next: number) {
    const exit = next > pageIdx ? -BOOK_W : BOOK_W;
    Animated.timing(slideAnim, {
      toValue: exit, duration: 220, useNativeDriver: true,
    }).start(() => {
      setPageIdx(next);
      slideAnim.setValue(-exit);
      Animated.spring(slideAnim, {
        toValue: 0, friction: 7, tension: 55, useNativeDriver: true,
      }).start();
    });
  }

  function handleNext() {
    // Slide the button right as tactile feedback
    Animated.sequence([
      Animated.timing(btnAnim, { toValue: 7, duration: 75, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
    if (!isLast) slideTo(pageIdx + 1);
    else { onClose(); onComplete?.(); }
  }

  function handlePrev() {
    if (!isFirst) slideTo(pageIdx - 1);
  }

  return (
    <Modal visible animationType="fade" transparent>
      <View style={bk.overlay}>
        <SafeAreaView style={bk.safe} edges={['top', 'left', 'right', 'bottom']}>
          {/* Close */}
          <Pressable
            style={({ pressed }) => [bk.closeBtn, pressed && { opacity: 0.5 }]}
            onPress={onClose}
          >
            <Text style={bk.closeBtnText}>✕</Text>
          </Pressable>

          {/* Book title */}
          {card.title ? <Text style={bk.bookTitle}>{card.title}</Text> : null}

          {/* Book */}
          <View style={[bk.book, { width: BOOK_W, height: BOOK_H }]}>
            {/* Sliding pages (clipped by book's overflow:hidden) */}
            <Animated.View
              style={[
                { flexDirection: 'row', width: BOOK_W, height: BOOK_H },
                { transform: [{ translateX: slideAnim }] },
              ]}
            >
              {/* Left page — text */}
              <View style={[bk.page, bk.pageLeft, { width: PAGE_W }]}>
                <ScrollView
                  contentContainerStyle={bk.pageContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={bk.pageText}>{page.text ?? ''}</Text>
                </ScrollView>
                <Text style={bk.pageNumLeft}>{pageIdx + 1}</Text>
              </View>

              {/* Right page — image */}
              <View style={[bk.page, bk.pageRight, { width: PAGE_W }]}>
                {page.image ? (
                  <Image
                    source={{ uri: page.image }}
                    style={bk.pageImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={bk.imagePlaceholder}>
                    <Text style={bk.imagePlaceholderIcon}>📖</Text>
                  </View>
                )}
                <Text style={bk.pageNumRight}>{pageIdx + 1}</Text>
              </View>
            </Animated.View>

            {/* Spine — fixed overlay */}
            <View style={[bk.spine, { position: 'absolute', left: PAGE_W, top: 0, bottom: 0 }]} />

            {/* Prev page button — bottom-left of left page */}
            {!isFirst && (
              <Pressable
                style={({ pressed }) => [bk.prevBtn, pressed && { opacity: 0.8 }]}
                onPress={handlePrev}
              >
                <Text style={bk.prevBtnText}>‹</Text>
              </Pressable>
            )}

            {/* Next / Done button — bottom-right of right page */}
            <Animated.View
              style={[
                bk.nextBtnWrap,
                { transform: [{ translateX: btnAnim }] },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  bk.nextBtn,
                  isLast && bk.nextBtnDone,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleNext}
              >
                <Text style={bk.nextBtnText}>{isLast ? '✓' : '›'}</Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* Page indicator dots */}
          {pages.length > 1 && (
            <View style={bk.dots}>
              {pages.map((_, i) => (
                <View key={i} style={[bk.dot, i === pageIdx && bk.dotActive]} />
              ))}
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const bk = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 12, 6, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safe: {
    flex: 1, width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  closeBtn: {
    position: 'absolute', top: 12, left: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 10,
  },
  closeBtnText: { fontSize: 20, color: '#fff', fontWeight: '700' },

  bookTitle: {
    fontSize: 18, fontWeight: '700', color: 'rgba(255,240,210,0.9)',
    textAlign: 'center', paddingHorizontal: 24,
    marginTop: 4,
  },

  book: {
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#FFF8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },

  page: {
    height: '100%',
    position: 'relative',
  },
  pageLeft: {
    backgroundColor: '#FFF8E8',
    // inner shadow near spine (right side)
    borderRightWidth: 1,
    borderRightColor: 'rgba(180,140,80,0.15)',
  },
  pageRight: {
    backgroundColor: '#FFFCF2',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(180,140,80,0.15)',
  },

  pageContent: {
    padding: 20,
    paddingBottom: 36,
  },
  pageText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#2C1A0E',
    fontFamily: undefined, // uses system default
  },
  pageImage: {
    flex: 1,
    margin: 16,
  },
  imagePlaceholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  imagePlaceholderIcon: { fontSize: 64 },

  pageNumLeft: {
    position: 'absolute', bottom: 8, left: 0, right: 0,
    textAlign: 'center',
    fontSize: 11, color: 'rgba(100,70,40,0.45)', fontStyle: 'italic',
  },
  pageNumRight: {
    position: 'absolute', bottom: 8, left: 0, right: 0,
    textAlign: 'center',
    fontSize: 11, color: 'rgba(100,70,40,0.45)', fontStyle: 'italic',
  },

  spine: {
    width: 2,
    backgroundColor: 'rgba(160,110,50,0.35)',
    // gradient-like shadow via elevation on spine
    shadowColor: '#7B4F20',
    shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },

  prevBtn: {
    position: 'absolute', bottom: 14, left: 14,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(200,170,120,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  prevBtnText: { fontSize: 24, color: 'rgba(80,50,20,0.7)', fontWeight: '700', lineHeight: 28 },

  nextBtnWrap: {
    position: 'absolute', bottom: 14, right: 14,
  },
  nextBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#D97706',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#92400E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  nextBtnDone: { backgroundColor: '#059669' },
  nextBtnText: { fontSize: 26, color: '#fff', fontWeight: '700', lineHeight: 30 },

  dots: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  dot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,220,150,0.3)' },
  dotActive: { backgroundColor: 'rgba(255,220,150,0.9)', width: 20, borderRadius: 4 },
});

// ─── New Letter viewer ────────────────────────────────────────────────────────

function VideoPlaceholder({ url }: { url?: string }) {
  return (
    <View style={nl.videoBox}>
      <Text style={nl.videoIcon}>▶</Text>
      <Text style={nl.videoHint}>{url || 'ვიდეო არ არის მითითებული'}</Text>
    </View>
  );
}

function NewLetterViewer({ card, onClose, onComplete }: { card: CardData; onClose: () => void; onComplete?: () => void }) {
  const c = card.content ?? {};
  const letter = String(c.letter ?? '');
  const rawSections: Record<string, NLSection> = c.sections ?? getDefaultNLSections();

  const visibleSteps = NEW_LETTER_SECTIONS
    .map(s => {
      const defaults = { hidden: false, title: s.defaultTitle, ...(s.hasVideo ? { video_url: '' } : {}) };
      return { ...s, data: { ...defaults, ...rawSections[s.key] } as NLSection };
    })
    .filter(s => !s.data.hidden);

  const [activeIdx, setActiveIdx] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function goTo(i: number) {
    if (i >= visibleSteps.length) {
      // Last slide passed — show confetti, then close and trigger card badge
      setShowReward(true);
      // TODO: play rewarding sound here
      setTimeout(() => {
        setShowReward(false);
        onClose();
        onComplete?.(); // fire after viewer closes so badge animation starts fresh
      }, 2500);
      return;
    }
    const clamped = Math.max(0, Math.min(i, visibleSteps.length - 1));
    setActiveIdx(clamped);
    if (pageHeight > 0) {
      scrollRef.current?.scrollTo({ y: clamped * pageHeight, animated: true });
    }
  }

  function handleScroll(e: any) {
    if (pageHeight === 0) return;
    const page = Math.round(e.nativeEvent.contentOffset.y / pageHeight);
    setActiveIdx(Math.max(0, Math.min(page, visibleSteps.length - 1)));
  }

  function renderContent(s: typeof visibleSteps[0]) {
    if (s.key === 'instruction_video' || s.key === 'intro_video') {
      return <VideoPlaceholder url={(s.data as any).video_url} />;
    }
    if (s.key === 'say_sound_parent' || s.key === 'say_sound_kid') {
      return (
        <View style={nl.tracingBox}>
          {letter
            ? <TracingReader text={letter} fontSize={100} accentColor="#A5B4FC" textColor="#fff" />
            : <Text style={nl.emptyLetter}>—</Text>
          }
        </View>
      );
    }
    if (s.key === 'what_letter') {
      return <Text style={nl.bigLetter}>{letter || '—'}</Text>;
    }
    return null;
  }

  return (
    <Modal visible animationType="fade" transparent>
      <View style={nl.overlay}>
        <SafeAreaView style={nl.safe} edges={['top', 'left', 'right', 'bottom']}>
          {/* Close */}
          <Pressable
            style={({ pressed }) => [nl.closeBtn, pressed && { opacity: 0.5 }]}
            onPress={onClose}
          >
            <Text style={nl.closeBtnText}>✕</Text>
          </Pressable>

          {/* Body row: bullets | paged content | arrows */}
          <View style={nl.bodyRow}>

            {/* Left: bullet nav, centered vertically */}
            <View style={nl.bulletNav}>
              {visibleSteps.map((_, i) => (
                <Pressable key={i} onPress={() => goTo(i)} style={nl.bulletBtn}>
                  <View style={[nl.bullet, i === activeIdx && nl.bulletActive]} />
                </Pressable>
              ))}
            </View>

            {/* Center: full-page snapping scroll */}
            <ScrollView
              ref={scrollRef}
              style={nl.scrollArea}
              pagingEnabled
              onScroll={handleScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              onLayout={e => setPageHeight(e.nativeEvent.layout.height)}
            >
              {visibleSteps.map((s) => (
                <View
                  key={s.key}
                  style={[nl.page, pageHeight > 0 && { height: pageHeight }]}
                >
                  {/* Title pinned to top */}
                  <Text style={nl.sectionTitle}>{s.data.title}</Text>
                  {/* Content centered in remaining space */}
                  <View style={nl.pageContent}>
                    {renderContent(s)}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Right: ↑↓ arrows stacked, centered vertically */}
            <View style={nl.arrowCol}>
              <Pressable
                style={({ pressed }) => [nl.arrowBtn, pressed && { opacity: 0.7 }]}
                onPress={() => goTo(activeIdx - 1)}
              >
                <Text style={nl.arrowText}>↑</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  nl.arrowBtn,
                  activeIdx === visibleSteps.length - 1 && nl.arrowBtnLast,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => goTo(activeIdx + 1)}
              >
                <Text style={nl.arrowText}>↓</Text>
              </Pressable>
            </View>

          </View>
        </SafeAreaView>

        {/* ─── Reward overlay ──────────────────────────────────────────── */}
        {showReward && (
          <View style={nl.rewardOverlay}>
            {/* TODO: play rewarding sound here (e.g. expo-av) */}
            <LottieView
              source={require('../Confetti.json')}
              autoPlay
              loop={false}
              style={nl.rewardLottie}
            />
            <Text style={nl.rewardText}>შესანიშნავია!</Text>
          </View>
        )}

      </View>
    </Modal>
  );
}

const nl = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#1E1B4B' },
  safe:    { flex: 1, paddingTop: 60 },

  closeBtn: {
    position: 'absolute', top: 12, left: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 10,
  },
  closeBtnText: { fontSize: 20, color: '#fff', fontWeight: '700' },

  bodyRow: { flex: 1, flexDirection: 'row' },

  // Left bullet nav — centered vertically
  bulletNav: {
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  bulletBtn: { padding: 6 },
  bullet: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(255,220,150,0.25)',
  },
  bulletActive: {
    backgroundColor: 'rgba(255,220,150,0.9)',
    width: 13, height: 13, borderRadius: 7,
  },

  // Full-page scroll
  scrollArea: { flex: 1 },
  page: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 17, fontWeight: '700',
    color: 'rgba(196,181,253,0.9)',
    textAlign: 'center',
    marginBottom: 12,
    alignSelf: 'stretch',
  },
  pageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },

  // Video placeholder — constrained, centered
  videoBox: {
    width: 300, height: 180,
    backgroundColor: '#1F2937', borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  videoIcon: { fontSize: 44, color: 'rgba(255,255,255,0.55)' },
  videoHint: { fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', paddingHorizontal: 12 },

  // TracingReader wrapper
  tracingBox: { alignItems: 'center', paddingVertical: 8 },
  emptyLetter: { fontSize: 80, color: '#D1D5DB' },

  // What letter section
  bigLetter: {
    fontSize: 140, fontWeight: '800',
    color: '#fff', textAlign: 'center',
  },

  // Reward overlay
  rewardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 27, 75, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    zIndex: 20,
  },
  rewardLottie: { width: '100%', height: '100%', position: 'absolute' },
  rewardText: { fontSize: 28, fontWeight: '800', color: '#FDE68A', textAlign: 'center' },

  // Right arrow col — stacked, centered vertically
  arrowCol: {
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  arrowBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  arrowBtnLast: {
    backgroundColor: '#F2D35E',
  },
  arrowText: { fontSize: 18, color: '#fff', fontWeight: '700' },
});

// ─── Generic card popup ───────────────────────────────────────────────────────

function CardPopup({ card, index, onClose }: { card: CardData; index: number; onClose: () => void }) {
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

function RewardBadge() {
  return (
    <View style={styles.rewardBadge} pointerEvents="none">
      <LottieView
        source={require('../Rewards.json')}
        autoPlay
        loop={false}
        style={styles.rewardBadgeLottie}
      />
    </View>
  );
}

function GameCard({ card, index, onPress, isCompleted }: { card: CardData; index: number; onPress: () => void; isCompleted?: boolean }) {
  return (
    <View style={styles.cardWrapper}>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
        onPress={onPress}
      >
        <Text style={styles.cardNumber}>{index + 1}</Text>
        {isCompleted && <RewardBadge />}
      </Pressable>
      <Text style={styles.cardLabel} numberOfLines={2}>
        {CARD_LABELS[card.type] ?? card.type.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = Number(id);

  const user = useAuthUser();

  const [lesson, setLesson]         = useState<Lesson | null>(null);
  const [cards, setCards]           = useState<CardData[]>([]);
  const [loading, setLoading]       = useState(true);
  const [openCard, setOpenCard]     = useState<{ card: CardData; index: number } | null>(null);
  const [completedCards, setCompletedCards] = useState<Set<number>>(new Set());

  function markCardComplete(cardId: number) {
    setCompletedCards(prev => new Set(prev).add(cardId));
  }

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

      {/* Card popup — book, new_letter, or generic */}
      {openCard && openCard.card.type === 'book' ? (
        <BookViewer
          card={openCard.card}
          onClose={() => setOpenCard(null)}
          onComplete={() => markCardComplete(openCard.card.id)}
        />
      ) : openCard && openCard.card.type === 'new_letter' ? (
        <NewLetterViewer
          card={openCard.card}
          onClose={() => setOpenCard(null)}
          onComplete={() => markCardComplete(openCard.card.id)}
        />
      ) : openCard && openCard.card.type === 'letter_writing' ? (
        <LetterWritingViewer card={openCard.card} onClose={() => setOpenCard(null)} />
      ) : openCard && openCard.card.type === 'letter_tracing' ? (
        <LetterTracingViewer card={openCard.card} onClose={() => setOpenCard(null)} />
      ) : openCard ? (
        <CardPopup
          card={openCard.card}
          index={openCard.index}
          onClose={() => setOpenCard(null)}
        />
      ) : null}

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
              isCompleted={completedCards.has(card.id)}
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

  rewardBadge: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 320,
    height: 320,
    zIndex: 10,
  },
  rewardBadgeLottie: { width: 320, height: 320 },

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

  // Generic popup
  popupOverlay: { flex: 1, backgroundColor: '#3B82F6' },
  popupSafe: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  closeBtn: {
    position: 'absolute', top: 16, left: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeBtnText: { fontSize: 20, color: '#fff', fontWeight: '700' },
  popupCard: { alignItems: 'center', gap: 16, paddingHorizontal: 32 },
  popupCardNumber: { fontSize: 120, fontWeight: 'bold', color: '#fff', lineHeight: 130 },
  popupCardType: {
    fontSize: 32, fontWeight: '700', color: '#fff',
    textAlign: 'center', textTransform: 'capitalize',
  },
  popupCardTitle: {
    fontSize: 20, color: 'rgba(255,255,255,0.8)',
    textAlign: 'center', fontWeight: '500',
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
