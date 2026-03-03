import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useProgress } from '../store/progress';
import { fetchLessons, type Lesson } from '../api/lessons';

const BTN    = 56;
const ROAD_W = 11;
const STEP_Y = 78;
const PAD_TOP = 56;

// Infinite winding wave — cycles for any lesson count
const WAVE = [0.50, 0.72, 0.88, 0.68, 0.50, 0.28, 0.12, 0.32];
function xFrac(i: number) { return WAVE[i % WAVE.length]; }

function buildPositions(contentWidth: number, count: number) {
  const bandW  = contentWidth * 0.5;
  const bandX0 = (contentWidth - bandW) / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: bandX0 + xFrac(i) * bandW,
    y: PAD_TOP + i * STEP_Y,
  }));
}

type Pt = { x: number; y: number };

function RoadSegment({ from, to }: { from: Pt; to: Pt }) {
  const dx  = to.x - from.x;
  const dy  = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2;
  return (
    <View style={{
      position: 'absolute',
      width: len, height: ROAD_W * 2,
      left: cx - len / 2, top: cy - ROAD_W,
      backgroundColor: '#E8E0C8',
      borderRadius: ROAD_W,
      transform: [{ rotate: `${angle}deg` }],
    }} />
  );
}

const GRASS = [
  { l: '12%', t: 80  }, { l: '80%', t: 130 }, { l: '5%',  t: 260 },
  { l: '88%', t: 310 }, { l: '20%', t: 460 }, { l: '75%', t: 530 },
  { l: '10%', t: 680 }, { l: '85%', t: 720 }, { l: '30%', t: 900 },
  { l: '70%', t: 960 }, { l: '8%',  t: 1100}, { l: '90%', t: 1150},
  { l: '22%', t: 1300}, { l: '78%', t: 1380}, { l: '15%', t: 1550},
  { l: '82%', t: 1600}, { l: '40%', t: 1750}, { l: '60%', t: 1820},
];

export default function LessonsScreen() {
  const [contentWidth, setContentWidth] = useState(0);
  const [lessons, setLessons]           = useState<Lesson[]>([]);
  const [loading, setLoading]           = useState(true);
  const [popupLesson, setPopupLesson]   = useState<Lesson | null>(null);
  const { completedIds, unlockedSortOrder } = useProgress();

  // Reload lessons when screen gains focus (in case admin changed them)
  useFocusEffect(useCallback(() => {
    fetchLessons().then(setLessons).finally(() => setLoading(false));
  }, []));

  const positions    = contentWidth > 0 ? buildPositions(contentWidth, lessons.length) : [];
  const canvasHeight = PAD_TOP + Math.max(0, lessons.length - 1) * STEP_Y + PAD_TOP + BTN;

  function openLesson(lesson: Lesson) {
    router.push(`/lesson/${lesson.id}`);
    setPopupLesson(null);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'bottom']}>
      {/* Lesson info popup */}
      {popupLesson && (
        <Modal visible animationType="fade" transparent>
          <Pressable style={styles.popupOverlay} onPress={() => setPopupLesson(null)}>
            <Pressable style={styles.popupCard} onPress={() => {}}>
              <Text style={styles.popupTitle}>{popupLesson.title}</Text>
              {popupLesson.description ? (
                <Text style={styles.popupDesc}>{popupLesson.description}</Text>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.popupBtn, pressed && { opacity: 0.85 }]}
                onPress={() => openLesson(popupLesson)}
              >
                <Text style={styles.popupBtnText}>
                  {completedIds.has(popupLesson.id) ? '🔄 თავიდან თამაში' : '▶ დაწყება'}
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <ScrollView
          onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.canvas, { height: canvasHeight }]}>

            {/* Grass tufts */}
            {GRASS.map((g, i) => (
              <View key={`g${i}`} style={[styles.grassTuft, { left: g.l as any, top: g.t }]} />
            ))}

            {/* Road */}
            {positions.slice(0, -1).map((pos, i) => (
              <RoadSegment key={`road${i}`} from={pos} to={positions[i + 1]} />
            ))}

            {/* Buttons */}
            {lessons.map((lesson, i) => {
              const pos      = positions[i];
              const unlocked = lesson.sort_order <= unlockedSortOrder;
              const done     = completedIds.has(lesson.id);
              if (!pos) return null;
              return (
                <Pressable
                  key={lesson.id}
                  style={({ pressed }) => [
                    styles.btn,
                    unlocked ? styles.btnUnlocked : styles.btnLocked,
                    { left: pos.x - BTN / 2, top: pos.y - BTN / 2 },
                    pressed && unlocked && styles.btnPressed,
                  ]}
                  onPress={() => unlocked && setPopupLesson(lesson)}
                  disabled={!unlocked}
                >
                  <Text style={styles.btnText}>{lesson.sort_order}</Text>
                  {!unlocked && (
                    <View style={styles.lockBadge}>
                      <Text style={styles.badgeIcon}>🔒</Text>
                    </View>
                  )}
                  {done && (
                    <View style={styles.starBadge}>
                      <Text style={styles.badgeIcon}>⭐</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}

          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#4E9244' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  canvas:     { width: '100%', backgroundColor: '#4E9244' },
  grassTuft:  { position: 'absolute', width: 18, height: 10, borderRadius: 9, backgroundColor: '#3D7A35' },
  btn: {
    position: 'absolute', width: BTN, height: BTN, borderRadius: BTN / 2,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 4, elevation: 6, zIndex: 10,
  },
  btnUnlocked: { backgroundColor: '#FF6B6B' },
  btnLocked:   { backgroundColor: '#9BA3AF', borderColor: '#D1D5DB', shadowOpacity: 0.15, elevation: 2 },
  btnPressed:  { opacity: 0.8, transform: [{ scale: 0.92 }] },
  btnText:     { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  lockBadge: {
    position: 'absolute', right: -4, bottom: -4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#6B7280', justifyContent: 'center', alignItems: 'center',
  },
  starBadge: {
    position: 'absolute', right: -4, bottom: -4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center',
  },
  badgeIcon: { fontSize: 11 },

  popupOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  popupCard: {
    width: '82%', maxWidth: 360,
    backgroundColor: '#fff', borderRadius: 20,
    padding: 28, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
    alignItems: 'center',
  },
  popupLabel: {
    fontSize: 12, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  popupTitle: {
    fontSize: 22, fontWeight: '800', color: '#1F2937', textAlign: 'center',
  },
  popupDesc: {
    fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 21,
  },
  popupBtn: {
    marginTop: 6,
    backgroundColor: '#FF6B6B',
    paddingVertical: 14, paddingHorizontal: 36,
    borderRadius: 50,
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  popupBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
