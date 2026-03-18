import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useProgress } from '../../store/progress';
import GameMapWrapper from './GameMapWrapper';
import Level1 from './Level1';
import Path1 from './Path1';
import Tree1 from './Tree1';
import House from './House';
import Hill from './Hill';
import PathGrass from './PathGrass';
import Qvevri from './Qvevri';
import Stones from './Stones';
import Grape from './Grape';
import CherrieTree from './CherrieTree';
import N1Tree from './N1Tree';
import N2Tree from './N2Tree';
import N3Tree from './N3Tree';
import N4Tree from './N4Tree';
import N5Tree from './N5Tree';
import N7Tree from './N7Tree';

const DESIGN_W = 1000;
const DESIGN_H = 2000;
const X_OFFSET = 100;
const Y_OFFSET = 130;

const LEVELS = [
  { lessonId: 1, sortOrder: 1, designX: 533.926, designY: 1274.846 },
  { lessonId: 2, sortOrder: 2, designX: 444.85,  designY: 1028.998 },
  { lessonId: 3, sortOrder: 3, designX: 268.829, designY: 851.834  },
  { lessonId: 4, sortOrder: 4, designX: 187.414, designY: 640.427  },
  { lessonId: 5, sortOrder: 5, designX: 282.101, designY: 428.597  },
  { lessonId: 6, sortOrder: 6, designX: 536.417, designY: 394.892  },
  { lessonId: 7, sortOrder: 7, designX: 737.477, designY: 288.603  },
];

export default function GameMap() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scale = screenWidth / DESIGN_W;
  const scaled = (value: number) => value * scale;
  const mapHeight = Math.max(screenHeight, DESIGN_H * scale);
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
    const targetY = (firstUnlocked.designY + Y_OFFSET) * scale - screenHeight / 2;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, targetY), animated: true });
    }, 300);
  }, [scale, screenHeight]);

  return (
    <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
      <View style={{ width: screenWidth, height: mapHeight, overflow: 'hidden' }}>
        <View style={{ width: screenWidth, height: mapHeight }}>
          <GameMapWrapper height={mapHeight} />

          <Pressable
            onPress={() => {}}
            style={[styles.item, {
              left: scaled(174.919 + X_OFFSET),
              top: scaled(268.449 + Y_OFFSET),
              width: scaled(703.534),
              height: scaled(1100.741),
            }]}
          >
            <Path1 width={scaled(703.534)} height={scaled(1100.741)} />
          </Pressable>

          <Pressable onPress={() => {}} style={[styles.item, { left: scaled(131.961), top: scaled(1145.056), width: scaled(277.578), height: scaled(365.22) }]}>
            <House width={scaled(277.578)} height={scaled(365.22)} />
          </Pressable>

          <Pressable onPress={() => {}} style={[styles.item, { left: scaled(0), top: scaled(1469.553), width: scaled(978.106), height: scaled(530.447) }]}>
            <Hill width={scaled(978.106)} height={scaled(530.447)} />
          </Pressable>

          <Pressable onPress={() => {}} style={[styles.item, { left: scaled(224.409 + X_OFFSET), top: scaled(266.058 + Y_OFFSET), width: scaled(571.907), height: scaled(934.522) }]}>
            <PathGrass width={scaled(571.907)} height={scaled(934.522)} />
          </Pressable>

          <Pressable onPress={() => {}} style={[styles.item, { left: scaled(428.142), top: scaled(1537.005), width: scaled(206.56), height: scaled(226.431) }]}>
            <Qvevri width={scaled(206.56)} height={scaled(226.431)} />
          </Pressable>

          <Pressable onPress={() => {}} style={[styles.item, { left: scaled(280.751), top: scaled(1517.936), width: scaled(422.938), height: scaled(481.257) }]}>
            <Stones width={scaled(422.938)} height={scaled(481.257)} />
          </Pressable>

          <Pressable onPress={() => {}} style={[styles.item, { left: scaled(33.14), top: scaled(1461.927), width: scaled(227.185), height: scaled(214.403) }]}>
            <Grape width={scaled(227.185)} height={scaled(214.403)} />
          </Pressable>

          <Pressable onPress={() => {}} style={[styles.item, { left: scaled(15.971), top: scaled(702.518), width: scaled(242.865), height: scaled(301.718) }]}>
            <CherrieTree width={scaled(242.865)} height={scaled(301.718)} />
          </Pressable>

          <Pressable onPress={() => {}} style={[styles.item, { left: scaled(771.074), top: scaled(1424.714), width: scaled(305.167), height: scaled(457.336) }]}>
            <N1Tree width={scaled(305.167)} height={scaled(457.336)} />
          </Pressable>

          <Pressable onPress={() => {}} style={[styles.item, { left: scaled(801.268), top: scaled(1642.869), width: scaled(349.564), height: scaled(428.834) }]}>
            <N2Tree width={scaled(349.564)} height={scaled(428.834)} />
          </Pressable>

          <Pressable onPress={() => {}} style={[styles.item, { left: scaled(611.726), top: scaled(1634.873), width: scaled(317.289), height: scaled(417.256) }]}>
            <N3Tree width={scaled(317.289)} height={scaled(417.256)} />
          </Pressable>

          <Pressable onPress={() => {}} style={[styles.item, { left: scaled(734.678), top: scaled(1767.252), width: scaled(305.167), height: scaled(457.336) }]}>
            <N4Tree width={scaled(305.167)} height={scaled(457.336)} />
          </Pressable>

          <Pressable onPress={() => {}} style={[styles.item, { left: scaled(-42.27), top: scaled(1712.593), width: scaled(349.564), height: scaled(428.834) }]}>
            <N5Tree width={scaled(349.564)} height={scaled(428.834)} />
          </Pressable>

          {/* <Pressable onPress={() => {}} style={[styles.item, { left: scaled(715.808), top: scaled(907.72), width: scaled(317.289), height: scaled(446.661) }]}>
            <N6Tree width={scaled(317.289)} height={scaled(446.661)} />
          </Pressable> */}

          <Pressable onPress={() => {}} style={[styles.item, { left: scaled(672.623), top: scaled(895.572), width: scaled(349.564), height: scaled(428.834) }]}>
            <Tree1 width={scaled(349.564)} height={scaled(428.834)} />
          </Pressable>

          <Pressable onPress={() => {}} style={[styles.item, { left: scaled(836.037), top: scaled(161.415), width: scaled(228.285), height: scaled(280.053) }]}>
            <N7Tree width={scaled(228.285)} height={scaled(280.053)} />
          </Pressable>

          {LEVELS.map((level) => {
            const status = getStatus(level.sortOrder, level.lessonId);
            return (
              <Pressable
                key={level.lessonId}
                onPress={() => status !== 'locked' && router.push(`/lesson/${level.lessonId}`)}
                disabled={status === 'locked'}
                style={[styles.item, {
                  left: scaled(level.designX + X_OFFSET),
                  top: scaled(level.designY + Y_OFFSET),
                  width: scaled(134.784),
                  height: scaled(94.345),
                }, status === 'locked' && styles.locked]}
              >
                <Level1 width={scaled(134.784)} height={scaled(94.345)} />
              </Pressable>
            );
          })}

        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  item: {
    position: 'absolute',
  },
  locked: {
    opacity: 0.4,
  },
});
