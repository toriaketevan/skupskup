import N7TreeSvg from '../../assets/map/N7_tree.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function N7Tree({ width = 228.285, height = 280.053 }: Props) {
  return <N7TreeSvg width={width} height={height} />;
}