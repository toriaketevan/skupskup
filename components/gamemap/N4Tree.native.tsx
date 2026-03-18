import N4TreeSvg from '../../assets/map/N4_tree.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function N4Tree({ width = 305.167, height = 457.336 }: Props) {
  return <N4TreeSvg width={width} height={height} />;
}