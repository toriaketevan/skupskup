import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import GameMap from '../components/GameMap';
import Level1 from '../components/Level1';
import Path1 from '../components/Path1';
import Tree1 from '../components/Tree1';
import { useProgress } from '../store/progress';

const DESIGN_W = 1000;
const DESIGN_H = 2000;

const LEVELS = [
  { lessonId: 1, sortOrder: 1, designY: 1274.846 },
];

export default function LessonMap() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scale = screenWidth / DESIGN_W;
  const scrollRef = useRef<ScrollView>(null);
  const { completedIds, unlockedSortOrder } = useProgress();

  function getStatus(sortOrder: number, lessonId: number): 'completed' | 'unlocked' | 'locked' {
    if (completedIds.has(lessonId))     return 'completed';
    if (sortOrder <= unlockedSortOrder) return 'unlocked';
    return 'locked';
  }

  useEffect(() => {
    const firstUnlocked = LEVELS.find(l => getStatus(l.sortOrder, l.lessonId) !== 'locked')
      ?? LEVELS[LEVELS.length - 1];
    const targetY = firstUnlocked.designY * scale - screenHeight / 2;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, targetY), animated: true });
    }, 300);
  }, [scale, screenHeight]);

  return (
    <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
      <View style={{ width: screenWidth, height: DESIGN_H * scale, overflow: 'hidden' }}>
        <View style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transformOrigin: 'top left',
          transform: [{ scale }],
        }}>
          <GameMap />

          <Pressable onPress={() => {}} style={styles.tree1}>
            <Tree1 width={349.564} height={428.834} />
          </Pressable>

          <Pressable onPress={() => {}} style={styles.path1}>
            <Path1 width={703.534} height={1100.741} />
          </Pressable>

          {(() => {
            const status = getStatus(1, 1);
            return (
              <Pressable
                onPress={() => status !== 'locked' && router.push('/lesson/1')}
                disabled={status === 'locked'}
                style={[styles.level1, status === 'locked' && styles.locked]}
              >
                <Level1 width={134.784} height={94.345} />
              </Pressable>
            );
          })()}

        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tree1: {
    position: 'absolute',
    left: 672.623,
    top: 895.572,
    width: 349.564,
    height: 428.834,
  },
  level1: {
    position: 'absolute',
    left: 533.926,
    top: 1274.846,
    width: 134.784,
    height: 94.345,
  },
  path1: {
    position: 'absolute',
    left: 174.919,
    top: 268.449,
    width: 703.534,
    height: 1100.741,
  },
  locked: {
    opacity: 0.4,
  },
});
