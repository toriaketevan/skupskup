import HouseSvg from '../../assets/map/home_1_1.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function House({ width = 277.578, height = 365.22 }: Props) {
  return <HouseSvg width={width} height={height} />;
}