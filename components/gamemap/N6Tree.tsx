import N6TreeSvg from '../../assets/map/N6_tree.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function N6Tree({ width = 317.289, height = 446.661 }: Props) {
  return <N6TreeSvg width={width} height={height} />;
}