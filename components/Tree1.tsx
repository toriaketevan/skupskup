import { useRive } from '@rive-app/react-canvas';

type Props = {
  width?: number;
  height?: number;
};

export default function Tree1({ width = 120, height = 160 }: Props) {
  const { RiveComponent } = useRive({
    src: require('../assets/map/tree1.riv'),
    autoplay: true,
    stateMachines: 'State Machine 1',
  });

  return <RiveComponent />;
}
