import Tree1Svg from '../../assets/map/tree1.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function Tree1({ width = 120, height = 160 }: Props) {
  return <Tree1Svg width={width} height={height} />;
}
