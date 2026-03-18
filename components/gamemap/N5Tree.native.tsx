import N5TreeSvg from '../../assets/map/N5_tree.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function N5Tree({ width = 349.564, height = 428.834 }: Props) {
  return <N5TreeSvg width={width} height={height} />;
}