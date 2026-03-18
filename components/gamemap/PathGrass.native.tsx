import PathGrassSvg from '../../assets/map/path_grass.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function PathGrass({ width = 571.907, height = 934.522 }: Props) {
  return <PathGrassSvg width={width} height={height} />;
}