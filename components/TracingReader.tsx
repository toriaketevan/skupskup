import { useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';

const THUMB_W  = 42;
const THUMB_H  = 26;
const TRACK_H  = 15;
const TRI_W    = 12;
const TRI_H    = 8;

type Props = {
  text: string;
  fontSize?: number;
  textColor?: string;
  accentColor?: string;
  fastSound?: boolean;
  onComplete?: () => void;
};

export default function TracingReader({
  text,
  fontSize = 72,
  textColor = '#1F2937',
  accentColor = '#6366F1',
  fastSound = false,
  onComplete,
}: Props) {
  const [trackW, setTrackW] = useState(0);

  const posX    = useRef(new Animated.Value(0)).current;
  const fillW   = useRef(new Animated.Value(TRI_W / 2)).current;
  const curX    = useRef(0);
  const startX  = useRef(0);
  const maxRef  = useRef(0);
  const doneRef = useRef(false);
  const cbRef   = useRef(onComplete);
  cbRef.current = onComplete;

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    // Only claim horizontal gestures — lets vertical scrolling pass through
    onMoveShouldSetPanResponder: (_, { dx, dy }) =>
      Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 4,

    onPanResponderGrant: () => {
      startX.current = curX.current;
      doneRef.current = false;
    },

    onPanResponderMove: (_, g) => {
      const max = maxRef.current;
      if (max <= 0) return;
      const x = Math.max(0, Math.min(startX.current + g.dx, max));
      curX.current = x;
      posX.setValue(x);
      fillW.setValue(x + TRI_W / 2);
      if (!doneRef.current && x >= max - 1) {
        doneRef.current = true;
        cbRef.current?.();
      }
    },

    onPanResponderRelease: () => {
      if (doneRef.current) return;
      curX.current = 0;
      Animated.parallel([
        Animated.spring(posX,  { toValue: 0,         useNativeDriver: false, tension: 50, friction: 8 }),
        Animated.spring(fillW, { toValue: TRI_W / 2, useNativeDriver: false, tension: 50, friction: 8 }),
      ]).start();
    },
  })).current;

  function handleLayout(w: number) {
    setTrackW(w);
    maxRef.current = Math.max(0, w - TRI_W / 2);
    posX.setValue(0);
    fillW.setValue(TRI_W / 2);
    curX.current = 0;
  }

  return (
    <View style={styles.root}>
      {/* Text — its width drives the slider width */}
      <View style={styles.textBox} onLayout={(e) => handleLayout(e.nativeEvent.layout.width)}>
        <Text
          style={[styles.text, { fontSize, color: textColor }]}
          selectable={false}
          allowFontScaling={false}
        >
          {text}
        </Text>
      </View>

      {/* Slider — same width as the text above */}
      {trackW > 0 && (
        <View style={[styles.slider, { width: trackW }]}>
          {/* Track background */}
          <View style={[styles.trackBg, { backgroundColor: accentColor + '22' }]} />

          {/* Traced fill — grows as the thumb moves right */}
          <Animated.View
            style={[styles.trackFill, { width: fillW, backgroundColor: accentColor + '55' }]}
          />

          {/* Fast-sound indicator — red dot at the midpoint of the track */}
          {fastSound && (
            <View style={[styles.fastDot, { left: trackW / 2 - 6 }]} />
          )}

          {/* Draggable thumb */}
          <Animated.View
            style={[styles.thumb, { transform: [{ translateX: posX }] }]}
            {...pan.panHandlers}
          >
            <View style={[styles.thumbTip, { borderBottomColor: accentColor }]} />
            <View style={[styles.thumbPill, { backgroundColor: accentColor }]}>
              <Text style={styles.thumbText} selectable={false}>›</Text>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { alignSelf: 'center', alignItems: 'center' },
  textBox: { alignSelf: 'center' },
  text:    { fontWeight: '700', includeFontPadding: false, textAlign: 'center' },

  slider: { height: TRACK_H + 2 + TRI_H + THUMB_H, marginTop: 10 },

  trackBg: {
    position: 'absolute', left: 0, right: 0,
    height: TRACK_H, borderRadius: TRACK_H / 2, top: 0,
  },
  trackFill: {
    position: 'absolute', left: 0,
    height: TRACK_H, borderRadius: TRACK_H / 2, top: 0,
  },
  thumb: {
    position: 'absolute', left: 0, top: TRACK_H + 2,
    width: THUMB_W, height: TRI_H + THUMB_H,
    alignItems: 'flex-start',
  },
  thumbTip: {
    width: 0, height: 0,
    borderLeftWidth: TRI_W / 2, borderRightWidth: TRI_W / 2, borderBottomWidth: TRI_H,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  thumbPill: {
    width: THUMB_W, height: THUMB_H, borderRadius: THUMB_H / 2,
    marginLeft: -(THUMB_W / 2 - TRI_W / 2),
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
  },
  thumbText: { color: '#fff', fontSize: 14, fontWeight: '800', lineHeight: 16 },

  fastDot: {
    position: 'absolute',
    top: (TRACK_H - 12) / 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#EF4444',
  },
});
