import { useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import type { CardData } from '../api/cards';
import ZONES from '../constants/georgianLetterZones.json';

// 4 equal-gap Zaner-Bloser lines, all solid #86b9db
// Creates 3 writing zones: top (ascender), middle (body), bottom (descender)
const CANVAS_H = 290;
const LINE_GAP = 79;
const LINE_1   = 26;              // ascender line
const LINE_2   = LINE_1 + LINE_GAP; // 105 — top of middle zone
const LINE_3   = LINE_2 + LINE_GAP; // 184 — baseline
const LINE_4   = LINE_3 + LINE_GAP; // 263 — descender line
const LINE_COLOR      = '#86b9db';
// Guide letter: font sized so it fills exactly one section (middle zone)
const GUIDE_FONT_SIZE = LINE_GAP;

type ZoneEntry = { letters: string[]; shadedZones: string[]; bottomLine: number };
const ZONE_ENTRIES = Object.values(ZONES) as ZoneEntry[];

function getZoneEntry(letter: string): ZoneEntry {
  return ZONE_ENTRIES.find(z => z.letters.includes(letter)) ?? ZONES.middle as ZoneEntry;
}

const LINE_BY_NUMBER: Record<number, number> = { 1: LINE_1, 2: LINE_2, 3: LINE_3, 4: LINE_4 };

type Props = { card: CardData; onClose: () => void };

export default function LetterWritingViewer({ card, onClose }: Props) {
  const c            = card.content ?? {};
  const letter       = String(c.letter       ?? '');
  const instructions = String(c.instructions ?? '');
  const zoneEntry    = getZoneEntry(letter);
  const showTop      = zoneEntry.shadedZones.includes('top');
  const showBottom   = zoneEntry.shadedZones.includes('bottom');
  const guideBottom  = CANVAS_H - LINE_BY_NUMBER[zoneEntry.bottomLine];

  const [strokes, setStrokes]         = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');

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

  // Keep a ref in sync so the release handler can read the latest value
  const currentPathRef = useRef('');
  currentPathRef.current = currentPath;

  function handleClear() {
    setStrokes([]);
    setCurrentPath('');
  }

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

          {/* Heading */}
          {card.title ? <Text style={lw.heading}>{card.title}</Text> : null}

          {/* White card */}
          <View style={lw.card}>
            {/* Drawing canvas */}
            <View style={lw.canvasContainer}>
              {/* Grey letter guide — top-left corner, pointer-events none */}
              {letter ? (
                <Text style={[lw.letterGuide, { bottom: guideBottom }]} pointerEvents="none">
                  {letter}
                </Text>
              ) : null}

              {/* SVG layer: Zaner-Bloser lines + user strokes */}
              <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
                <Svg width="100%" height="100%">
                  {/* Zone shading — active writing area */}
                  {showTop && (
                    <Rect x="0" y={LINE_1} width="10000" height={LINE_GAP}
                      fill="#86b9db" fillOpacity={0.10} />
                  )}
                  <Rect x="0" y={LINE_2} width="10000" height={LINE_GAP}
                    fill="#86b9db" fillOpacity={0.10} />
                  {showBottom && (
                    <Rect x="0" y={LINE_3} width="10000" height={LINE_GAP}
                      fill="#86b9db" fillOpacity={0.10} />
                  )}

                  {/* 4 equal Zaner-Bloser lines — all solid #86b9db */}
                  <Line x1="0" y1={LINE_1} x2="10000" y2={LINE_1} stroke={LINE_COLOR} strokeWidth={1.5} />
                  <Line x1="0" y1={LINE_2} x2="10000" y2={LINE_2} stroke={LINE_COLOR} strokeWidth={1.5} />
                  <Line x1="0" y1={LINE_3} x2="10000" y2={LINE_3} stroke={LINE_COLOR} strokeWidth={1.5} />
                  <Line x1="0" y1={LINE_4} x2="10000" y2={LINE_4} stroke={LINE_COLOR} strokeWidth={1.5} />

                  {/* Completed strokes */}
                  {strokes.map((d, i) => (
                    <Path
                      key={i}
                      d={d}
                      stroke="#111827"
                      strokeWidth={5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  ))}
                  {/* Live stroke */}
                  {currentPath ? (
                    <Path
                      d={currentPath}
                      stroke="#111827"
                      strokeWidth={5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  ) : null}
                </Svg>
              </View>
            </View>

            {/* Instructions */}
            {instructions ? (
              <>
                <View style={lw.divider} />
                <Text style={lw.instructions}>{instructions}</Text>
              </>
            ) : null}
          </View>

          {/* Buttons */}
          <Pressable
            style={({ pressed }) => [lw.clearBtn, pressed && { opacity: 0.8 }]}
            onPress={handleClear}
          >
            <Text style={lw.clearBtnText}>🗑 გასუფთავება</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [lw.doneBtn, pressed && { opacity: 0.85 }]}
            onPress={onClose}
          >
            <Text style={lw.doneBtnText}>✓ დასრულება</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const lw = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#1E1B4B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safe: {
    flex: 1, width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 24,
  },

  closeBtn: {
    position: 'absolute', top: 12, left: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 10,
  },
  closeBtnText: { fontSize: 20, color: '#fff', fontWeight: '700' },

  heading: {
    fontSize: 18, fontWeight: '700',
    color: 'rgba(196,181,253,0.9)',
    textAlign: 'center',
  },

  card: {
    width: '100%',
    maxWidth: 680,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },

  canvasContainer: {
    width: '100%',
    height: CANVAS_H,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    backgroundColor: '#FFFEF7',  // warm paper tone
  },

  letterGuide: {
    fontSize: GUIDE_FONT_SIZE,
    color: '#D1D5DB',
    fontWeight: '700',
    position: 'absolute',
    left: 8,
    // `bottom` is applied dynamically per zone
  },

  divider: { width: '85%', height: 1, backgroundColor: '#E5E7EB' },

  instructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  clearBtn: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  clearBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  doneBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: 50,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
