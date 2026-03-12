import Level1Svg from '../assets/map/level1.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function Level1({ width = 100, height = 72 }: Props) {
  return <Level1Svg width={width} height={height} />;
}
