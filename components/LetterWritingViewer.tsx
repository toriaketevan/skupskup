import { useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import type { CardData } from '../api/cards';
import STROKES from '../constants/georgianLetterStrokes.json';
import ZONES from '../constants/georgianLetterZones.json';
import ConfettiReward from './ConfettiReward';
import LetterTracingOverlay from './LetterTracingOverlay';

// Fixed Zaner-Bloser coordinate space — letter/lines always occupy these pixel values.
// The canvas container can be taller; the letter just sits in the top portion.
const CANVAS_H   = 290;
const LINE_GAP   = 79;
const LINE_1     = 26;
const LINE_2     = LINE_1 + LINE_GAP;  // 105
const LINE_3     = LINE_2 + LINE_GAP;  // 184
const LINE_4     = LINE_3 + LINE_GAP;  // 263
const LINE_COLOR = '#86b9db';
const LINE_BY_NUMBER: Record<number, number> = { 1: LINE_1, 2: LINE_2, 3: LINE_3, 4: LINE_4 };

type ZoneEntry = { letters: string[]; shadedZones: string[]; bottomLine: number };
const ZONE_ENTRIES = Object.values(ZONES) as ZoneEntry[];

function getZoneEntry(letter: string): ZoneEntry {
  return ZONE_ENTRIES.find(z => z.letters.includes(letter)) ?? ZONES.middle as ZoneEntry;
}

type Props = { card: CardData; onClose: () => void; onComplete?: () => void };

export default function LetterWritingViewer({ card, onClose, onComplete }: Props) {
  const c      = card.content ?? {};
  const letter = String(c.letter ?? '');

  const letterData = (STROKES as Record<string, { viewBox: string; strokes: { id: number; d: string }[] }>)[letter];
  const hasTracing = !!letterData;

  const slides = hasTracing
    ? [
        { key: 'tracing',   title: `გავაყოლოთ თითი და დავწეროთ ასო "${letter}" ერთად.` },
        { key: 'freewrite', title: 'ახლა სცადე რომ დაწერო შენ თვითონ:' },
      ]
    : [{ key: 'freewrite', title: 'ახლა სცადე რომ დაწერო შენ თვითონ:' }];

  const [activeIdx, setActiveIdx]       = useState(0);
  const [pageHeight, setPageHeight]     = useState(0);
  const [tracingDone, setTracingDone]   = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [showReward, setShowReward]   = useState(false);
  const [strokes, setStrokes]         = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');

  const zoneEntry  = getZoneEntry(letter);
  const showTop    = zoneEntry.shadedZones.includes('top');
  const showBottom = zoneEntry.shadedZones.includes('bottom');

  // Zone area for the ghost guide (fixed coordinate space)
  const zoneTopY    = showTop ? LINE_1 : LINE_2;
  const zoneBottomY = LINE_BY_NUMBER[zoneEntry.bottomLine];

  const scrollRef      = useRef<ScrollView>(null);
  const currentPathRef = useRef('');
  currentPathRef.current = currentPath;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder:         () => true,
      onMoveShouldSetPanResponderCapture:  () => true,
      onPanResponderGrant: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        setCurrentPath(`M ${x.toFixed(1)},${y.toFixed(1)}`);
      },
      onPanResponderMove: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        setCurrentPath(prev => `${prev} L ${x.toFixed(1)},${y.toFixed(1)}`);
      },
      onPanResponderRelease: () => {
        setStrokes(prev => currentPathRef.current ? [...prev, currentPathRef.current] : prev);
        setCurrentPath('');
      },
    })
  ).current;

  function goTo(i: number) {
    if (i >= slides.length) {
      setShowReward(true);
      setTimeout(() => {
        setShowReward(false);
        onClose();
        onComplete?.();
      }, 2500);
      return;
    }
    const clamped = Math.max(0, Math.min(i, slides.length - 1));
    setActiveIdx(clamped);
    if (pageHeight > 0) {
      scrollRef.current?.scrollTo({ y: clamped * pageHeight, animated: true });
    }
  }

  function handleScroll(e: any) {
    if (pageHeight === 0) return;
    const page = Math.round(e.nativeEvent.contentOffset.y / pageHeight);
    setActiveIdx(Math.max(0, Math.min(page, slides.length - 1)));
  }

  function renderContent(slideKey: string) {
    if (slideKey === 'tracing') {
      return (
        <View style={lw.canvasContainer} onLayout={e => setCanvasWidth(e.nativeEvent.layout.width)}>
          <View style={{ position: 'absolute', top: 20, left: 20, right: 20, bottom: 20 }}>
            {canvasWidth > 0 && (
              <LetterTracingOverlay
                key="tracing"
                letter={letter}
                canvasWidth={canvasWidth - 40}
                canvasHeight={CANVAS_H - 40}
                onComplete={() => setTracingDone(true)}
              />
            )}
          </View>
        </View>
      );
    }

    return (
      <>
        <View style={lw.canvasContainer} onLayout={e => setCanvasWidth(e.nativeEvent.layout.width)}>
          {/* Ghost guide positioned in the letter's zone — fixed coordinate space */}
          {letterData && canvasWidth > 0 && (
            <View
              style={{ position: 'absolute', left: 16, right: 0, top: zoneTopY, height: zoneBottomY - zoneTopY }}
              pointerEvents="none"
            >
              <Svg
                width="100%"
                height="100%"
                viewBox={letterData.viewBox}
                preserveAspectRatio="xMinYMid meet"
              >
                {letterData.strokes.map(s => (
                  <Path key={s.id} d={s.d}
                    stroke="#D1D5DB" strokeWidth={18}
                    strokeLinecap="round" strokeLinejoin="round" fill="none"
                  />
                ))}
              </Svg>
            </View>
          )}

          {/* Drawing layer */}
          <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
            <Svg width="100%" height="100%">
              {showTop && <Rect x="0" y={LINE_1} width="10000" height={LINE_GAP} fill="#86b9db" fillOpacity={0.10} />}
              <Rect x="0" y={LINE_2} width="10000" height={LINE_GAP} fill="#86b9db" fillOpacity={0.10} />
              {showBottom && <Rect x="0" y={LINE_3} width="10000" height={LINE_GAP} fill="#86b9db" fillOpacity={0.10} />}
              <Line x1="0" y1={LINE_1} x2="10000" y2={LINE_1} stroke={LINE_COLOR} strokeWidth={1.5} />
              <Line x1="0" y1={LINE_2} x2="10000" y2={LINE_2} stroke={LINE_COLOR} strokeWidth={1.5} />
              <Line x1="0" y1={LINE_3} x2="10000" y2={LINE_3} stroke={LINE_COLOR} strokeWidth={1.5} />
              <Line x1="0" y1={LINE_4} x2="10000" y2={LINE_4} stroke={LINE_COLOR} strokeWidth={1.5} />
              {strokes.map((d, i) => (
                <Path key={i} d={d} stroke="#111827" strokeWidth={5}
                  strokeLinecap="round" strokeLinejoin="round" fill="none" />
              ))}
              {currentPath ? (
                <Path d={currentPath} stroke="#111827" strokeWidth={5}
                  strokeLinecap="round" strokeLinejoin="round" fill="none" />
              ) : null}
            </Svg>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [lw.clearBtn, pressed && { opacity: 0.8 }]}
          onPress={() => { setStrokes([]); setCurrentPath(''); }}
        >
          <Text style={lw.clearBtnText}>🗑 გასუფთავება</Text>
        </Pressable>
      </>
    );
  }

  const isTracingSlide  = slides[activeIdx]?.key === 'tracing';
  const isFreewriteSlide = slides[activeIdx]?.key === 'freewrite';
  const isLastSlide     = activeIdx === slides.length - 1;
  const canvasEmpty     = strokes.length === 0;
  const downDisabled    = (isTracingSlide && !tracingDone) || (isFreewriteSlide && isLastSlide && canvasEmpty);

  return (
    <Modal visible animationType="fade" transparent>
      <View style={lw.overlay}>
        <SafeAreaView style={lw.safe} edges={['top', 'left', 'right', 'bottom']}>

          {/* Close */}
          <Pressable
            style={({ pressed }) => [lw.closeBtn, pressed && { opacity: 0.5 }]}
            onPress={onClose}
          >
            <Text style={lw.closeBtnText}>✕</Text>
          </Pressable>

          {/* Body row: bullets | scroll | arrows */}
          <View style={lw.bodyRow}>

            {/* Left: bullet nav */}
            <View style={lw.bulletNav}>
              {slides.map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => (i > activeIdx && downDisabled ? null : goTo(i))}
                  style={lw.bulletBtn}
                >
                  <View style={[lw.bullet, i === activeIdx && lw.bulletActive]} />
                </Pressable>
              ))}
            </View>

            {/* Center: paged scroll */}
            <ScrollView
              ref={scrollRef}
              style={lw.scrollArea}
              pagingEnabled
              scrollEnabled={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              onLayout={e => setPageHeight(e.nativeEvent.layout.height)}
            >
              {slides.map(s => (
                <View
                  key={s.key}
                  style={[lw.page, pageHeight > 0 && { height: pageHeight }]}
                >
                  <Text style={lw.sectionTitle}>{s.title}</Text>
                  <View style={lw.pageContent}>
                    {renderContent(s.key)}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Right: ↑↓ arrows */}
            <View style={lw.arrowCol}>
              <Pressable
                style={({ pressed }) => [lw.arrowBtn, pressed && { opacity: 0.7 }]}
                onPress={() => goTo(activeIdx - 1)}
              >
                <Text style={lw.arrowText}>↑</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  lw.arrowBtn,
                  isLastSlide && !downDisabled && lw.arrowBtnLast,
                  downDisabled && lw.arrowBtnDisabled,
                  pressed && !downDisabled && { opacity: 0.7 },
                ]}
                onPress={() => !downDisabled && goTo(activeIdx + 1)}
              >
                <Text style={lw.arrowText}>↓</Text>
              </Pressable>
            </View>

          </View>
        </SafeAreaView>

        <ConfettiReward visible={showReward} />
      </View>
    </Modal>
  );
}

const lw = StyleSheet.create({
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

  bodyRow: { flex: 1, flexDirection: 'row', width: '100%', maxWidth: 600, alignSelf: 'center' },

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
    gap: 16,
  },

  canvasContainer: {
    width: '100%',
    height: CANVAS_H,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    backgroundColor: '#FFFEF7',
  },

  clearBtn: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
  },
  clearBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

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
  arrowBtnLast:     { backgroundColor: '#F2D35E' },
  arrowBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)', opacity: 0.4 },
  arrowText: { fontSize: 16, color: '#fff', fontWeight: '700' },
});
