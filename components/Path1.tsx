import Path1Svg from '../assets/map/path1.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function Path1({ width = 120, height = 190 }: Props) {
  return <Path1Svg width={width} height={height} />;
}
