import N2TreeSvg from '../../assets/map/tree1.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function N2Tree({ width = 349.564, height = 428.834 }: Props) {
  return <N2TreeSvg width={width} height={height} />;
}