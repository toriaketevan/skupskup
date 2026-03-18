import GrapeSvg from '../../assets/map/grapes.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function Grape({ width = 227.185, height = 214.403 }: Props) {
  return <GrapeSvg width={width} height={height} />;
}