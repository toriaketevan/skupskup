import { useRive } from '@rive-app/react-canvas';
import { PixelRatio, Platform } from 'react-native';

type Props = {
  width?: number;
  height?: number;
};

export default function Tree1({ width = 120, height = 160 }: Props) {
  const pixelRatio = Platform.OS === 'web'
    ? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
    : PixelRatio.get();

  const { RiveComponent } = useRive({
    src: require('../../assets/map/tree1.riv'),
    autoplay: true,
    stateMachines: 'State Machine 1',
    pixelRatio,
  } as any);

  return <RiveComponent style={{ width, height }} />;
}
