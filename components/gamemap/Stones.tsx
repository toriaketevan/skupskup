import StonesSvg from '../../assets/map/stones.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function Stones({ width = 422.938, height = 481.257 }: Props) {
  return <StonesSvg width={width} height={height} />;
}