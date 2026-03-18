import N1TreeSvg from '../../assets/map/N1_tree.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function N1Tree({ width = 305.167, height = 457.336 }: Props) {
  return <N1TreeSvg width={width} height={height} />;
}