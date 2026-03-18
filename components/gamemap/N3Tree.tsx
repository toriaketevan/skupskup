import N3TreeSvg from '../../assets/map/N3_tree.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function N3Tree({ width = 317.289, height = 417.256 }: Props) {
  return <N3TreeSvg width={width} height={height} />;
}