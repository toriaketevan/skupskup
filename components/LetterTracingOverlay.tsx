import { useRef, useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, PanResponder } from 'react-native';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';
import Svg, { Circle, Line, Path, Polygon, G } from 'react-native-svg';
import STROKES from '../constants/georgianLetterStrokes.json';

type Pt = [number, number];
type StrokeData = { id: number; d: string };
type LetterData = { viewBox: string; strokes: StrokeData[] };

const HIT_RADIUS = 20;
const SAMPLES_PER_SEGMENT = 40;

// ── Bezier sampling ──────────────────────────────────────────────────────────

function cubicAt(t: number, p0: Pt, p1: Pt, p2: Pt, p3: Pt): Pt {
  const u = 1 - t;
  return [
    u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0],
    u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1],
  ];
}

function samplePath(d: string): { points: Pt[]; total: number } {
  const tokens = d.match(/[MmCcLlZz]|[-\d.]+/g) ?? [];
  const points: Pt[] = [];
  let i = 0, cx = 0, cy = 0;

  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'M') {
      cx = parseFloat(tokens[i++]); cy = parseFloat(tokens[i++]);
      points.push([cx, cy]);
    } else if (cmd === 'C') {
      while (i < tokens.length && !/[A-Za-z]/.test(tokens[i])) {
        const x1 = parseFloat(tokens[i++]), y1 = parseFloat(tokens[i++]);
        const x2 = parseFloat(tokens[i++]), y2 = parseFloat(tokens[i++]);
        const ex = parseFloat(tokens[i++]), ey = parseFloat(tokens[i++]);
        const p0: Pt = [cx, cy], p1: Pt = [x1, y1], p2: Pt = [x2, y2], p3: Pt = [ex, ey];
        for (let s = 1; s <= SAMPLES_PER_SEGMENT; s++) {
          points.push(cubicAt(s / SAMPLES_PER_SEGMENT, p0, p1, p2, p3));
        }
        cx = ex; cy = ey;
      }
    } else if (cmd === 'L') {
      while (i < tokens.length && !/[A-Za-z]/.test(tokens[i])) {
        cx = parseFloat(tokens[i++]); cy = parseFloat(tokens[i++]);
        points.push([cx, cy]);
      }
    }
    // Z: ignore closing segment
  }

  let total = 0;
  for (let j = 1; j < points.length; j++) {
    const dx = points[j][0] - points[j-1][0], dy = points[j][1] - points[j-1][1];
    total += Math.sqrt(dx*dx + dy*dy);
  }
  return { points, total };
}

// ── Coordinate helpers ───────────────────────────────────────────────────────

function parseViewBox(vb: string) {
  const p = vb.trim().split(/\s+/);
  return { vbW: parseFloat(p[2]), vbH: parseFloat(p[3]) };
}

function screenToVB(sx: number, sy: number, cw: number, ch: number, vbW: number, vbH: number) {
  const scale = Math.min(cw / vbW, ch / vbH);
  return { vx: (sx - (cw - vbW * scale) / 2) / scale, vy: (sy - (ch - vbH * scale) / 2) / scale };
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((bx-ax)**2 + (by-ay)**2);
}

function parseStartArrow(d: string): { x: number; y: number; angle: number } {
  const mMatch = d.match(/M\s*([-\d.]+)\s+([-\d.]+)/);
  if (!mMatch) return { x: 0, y: 0, angle: 0 };
  const x0 = parseFloat(mMatch[1]), y0 = parseFloat(mMatch[2]);
  const rest = d.slice(mMatch.index! + mMatch[0].length).trim().replace(/^[A-Za-z]\s*/, '');
  const nm = rest.match(/([-\d.]+)\s+([-\d.]+)/);
  if (!nm) return { x: x0, y: y0, angle: 0 };
  return { x: x0, y: y0, angle: Math.atan2(parseFloat(nm[2]) - y0, parseFloat(nm[1]) - x0) * (180 / Math.PI) };
}

// ── Component ────────────────────────────────────────────────────────────────

type Props = { letter: string; canvasWidth: number; canvasHeight: number; onComplete?: () => void };

export default function LetterTracingOverlay({ letter, canvasWidth, canvasHeight, onComplete }: Props) {
  const data = (STROKES as unknown as Record<string, LetterData>)[letter];

  const sampledStrokes = useMemo(() => data?.strokes.map(s => samplePath(s.d)) ?? [], [data]);
  const startPoints    = useMemo(() => data?.strokes.map(s => parseStartArrow(s.d)) ?? [], [data]);

  const [strokeProgress, setStrokeProgress] = useState<number[]>(() => data?.strokes.map(() => 0) ?? []);
  const [showSparks, setShowSparks] = useState(false);
  const [arrowPos, setArrowPos] = useState<{ x: number; y: number; angle: number } | null>(
    () => (data ? startPoints[0] ?? null : null)
  );

  const activeIdxRef    = useRef(0);
  const strokeStarted   = useRef(false);
  const nextSampleIdx   = useRef(0);
  const chimeRef        = useRef<Audio.Sound | null>(null);
  const fanfareRef      = useRef<Audio.Sound | null>(null);
  const canvasWidthRef  = useRef(canvasWidth);
  const canvasHeightRef = useRef(canvasHeight);
  canvasWidthRef.current  = canvasWidth;
  canvasHeightRef.current = canvasHeight;

  useEffect(() => {
    let chime: Audio.Sound, fanfare: Audio.Sound;
    (async () => {
      ({ sound: chime }   = await Audio.Sound.createAsync(require('../assets/sounds/stroke-complete.wav')));
      ({ sound: fanfare } = await Audio.Sound.createAsync(require('../assets/sounds/celebration.wav')));
      chimeRef.current   = chime;
      fanfareRef.current = fanfare;
    })();
    return () => { chime?.unloadAsync(); fanfare?.unloadAsync(); };
  }, []);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,

    onPanResponderGrant: (evt) => {
      if (!data) return;
      const { vbW, vbH } = parseViewBox(data.viewBox);
      const { vx, vy } = screenToVB(evt.nativeEvent.locationX, evt.nativeEvent.locationY, canvasWidth, canvasHeight, vbW, vbH);
      const sp = startPoints[activeIdxRef.current];
      if (dist(vx, vy, sp.x, sp.y) <= HIT_RADIUS) {
        strokeStarted.current = true;
        nextSampleIdx.current = 1;
      }
    },

    onPanResponderMove: (evt) => {
      if (!strokeStarted.current || !data) return;
      const { vbW, vbH } = parseViewBox(data.viewBox);
      const { vx, vy } = screenToVB(evt.nativeEvent.locationX, evt.nativeEvent.locationY, canvasWidth, canvasHeight, vbW, vbH);
      const idx     = activeIdxRef.current;
      const sampled = sampledStrokes[idx];
      let ni = nextSampleIdx.current;

      while (ni < sampled.points.length && dist(vx, vy, sampled.points[ni][0], sampled.points[ni][1]) <= HIT_RADIUS) {
        ni++;
      }
      nextSampleIdx.current = ni;

      // Update arrow position to current point on path, pointing forward
      const arrowPtIdx = Math.min(ni, sampled.points.length - 1);
      const prevPtIdx  = Math.max(arrowPtIdx - 1, 0);
      const [ax, ay]   = sampled.points[arrowPtIdx];
      const [px, py]   = sampled.points[prevPtIdx];
      setArrowPos({ x: ax, y: ay, angle: Math.atan2(ay - py, ax - px) * (180 / Math.PI) });

      // Compute progress as fraction of path length reached
      let lengthSoFar = 0;
      for (let j = 1; j < ni && j < sampled.points.length; j++) {
        const dx = sampled.points[j][0] - sampled.points[j-1][0];
        const dy = sampled.points[j][1] - sampled.points[j-1][1];
        lengthSoFar += Math.sqrt(dx*dx + dy*dy);
      }
      const progress = Math.min(lengthSoFar / sampled.total, 1);

      setStrokeProgress(prev => { const n = [...prev]; n[idx] = progress; return n; });

      if (ni >= sampled.points.length) {
        strokeStarted.current = false;
        const nextIdx = idx + 1;
        if (nextIdx < data.strokes.length) {
          chimeRef.current?.replayAsync();
          activeIdxRef.current = nextIdx;
          nextSampleIdx.current = 0;
          setArrowPos(startPoints[nextIdx] ?? null);
        } else {
          fanfareRef.current?.replayAsync();
          setArrowPos(null);
          setShowSparks(true);
        }
      }
    },

    onPanResponderRelease: () => {
      if (!strokeStarted.current) return;
      strokeStarted.current = false;
      nextSampleIdx.current = 0;
      const idx = activeIdxRef.current;
      setStrokeProgress(prev => { const n = [...prev]; n[idx] = 0; return n; });
      setArrowPos(startPoints[idx] ?? null);
    },
  })).current;

  if (!data) return <View style={StyleSheet.absoluteFill} />;

  return (
    <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
      <Svg width={canvasWidth} height={canvasHeight} viewBox={data.viewBox} preserveAspectRatio="xMidYMid meet">

        {/* Ghost strokes */}
        {data.strokes.map(stroke => (
          <Path key={stroke.id} d={stroke.d}
            stroke="#D1D5DB" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ))}

        {/* Progressive reveal */}
        {data.strokes.map((stroke, i) => (
          strokeProgress[i] > 0 && (
            <Path key={`reveal-${stroke.id}`} d={stroke.d}
              stroke="#6366F1" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" fill="none"
              strokeDasharray={sampledStrokes[i].total}
              strokeDashoffset={sampledStrokes[i].total * (1 - strokeProgress[i])}
            />
          )
        ))}

        {/* Arrow — follows path, always visible for active stroke */}
        {arrowPos && (
          <G transform={`translate(${arrowPos.x}, ${arrowPos.y}) rotate(${arrowPos.angle})`}>
            <Circle r={16} fill="#6366F1" />
            <Line x1="-7" y1="0" x2="2" y2="0" stroke="white" strokeWidth={2.5} strokeLinecap="round" />
            <Polygon points="1,-4 7,0 1,4" fill="white" />
          </G>
        )}

      </Svg>

      {showSparks && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LottieView
            source={require('../assets/sparks.json')}
            autoPlay
            loop={false}
            style={StyleSheet.absoluteFill}
            onAnimationFinish={() => {
              setShowSparks(false);
              onComplete?.();
            }}
          />
        </View>
      )}
    </View>
  );
}
