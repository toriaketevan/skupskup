import LottieView from 'lottie-react-native';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CardData } from '../api/cards';
import STROKES from '../constants/georgianLetterStrokes.json';
import LetterTracingOverlay from './LetterTracingOverlay';

const CANVAS_H = 290;

type Props = { card: CardData; onClose: () => void };

export default function LetterTracingViewer({ card, onClose }: Props) {
  const c            = card.content ?? {};
  const letter       = String(c.letter       ?? '');
  const instructions = String(c.instructions ?? '');
  const hasTracing   = letter in (STROKES as Record<string, unknown>);

  const [canvasWidth,  setCanvasWidth]  = useState(0);
  const [tracingKey] = useState(0);

  return (
    <Modal visible animationType="fade" transparent>
      <View style={lv.overlay}>
        <SafeAreaView style={lv.safe} edges={['top', 'left', 'right', 'bottom']}>
          {/* Close */}
          <Pressable
            style={({ pressed }) => [lv.closeBtn, pressed && { opacity: 0.5 }]}
            onPress={onClose}
          >
            <Text style={lv.closeBtnText}>✕</Text>
          </Pressable>

          {/* Heading */}
          {card.title ? <Text style={lv.heading}>{card.title}</Text> : null}

          {/* White card */}
          <View style={lv.card}>
            {/* Drawing canvas */}
            <View
              style={lv.canvasContainer}
              onLayout={e => setCanvasWidth(e.nativeEvent.layout.width)}
            >
              {/* Tracing overlay */}
              {hasTracing && canvasWidth > 0 && (
                <LetterTracingOverlay
                  key={tracingKey}
                  letter={letter}
                  canvasWidth={canvasWidth}
                  canvasHeight={CANVAS_H}
                />
              )}

              {/* No tracing data message */}
              {!hasTracing && (
                <View style={lv.noDataOverlay} pointerEvents="none">
                  <Text style={lv.noDataText}>Tracing not available for this letter yet</Text>
                </View>
              )}
            </View>

            {/* Instructions */}
            {instructions ? (
              <>
                <View style={lv.divider} />
                <Text style={lv.instructions}>{instructions}</Text>
              </>
            ) : null}
          </View>

          {/* Buttons */}
          <Pressable
            style={({ pressed }) => [lv.doneBtn, pressed && { opacity: 0.85 }]}
            onPress={onClose}
          >
            <Text style={lv.doneBtnText}>✓ დასრულება</Text>
          </Pressable>
        </SafeAreaView>

        {/* Reward overlay — re-add when tracing is complete */}
        {false && (
          <View style={lv.rewardOverlay} pointerEvents="none">
            <LottieView
              source={require('../app/Rewards.json')}
              autoPlay
              loop={false}
              style={lv.rewardLottie}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const lv = StyleSheet.create({
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
    backgroundColor: '#FFFEF7',
  },

noDataOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  divider: { width: '85%', height: 1, backgroundColor: '#E5E7EB' },

  instructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  restartBtn: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  restartBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  doneBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: 50,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  rewardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardLottie: { width: 300, height: 300 },
});
