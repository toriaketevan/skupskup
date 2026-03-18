import HillSvg from '../../assets/map/hill.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function Hill({ width = 978.106, height = 530.447 }: Props) {
  return <HillSvg width={width} height={height} />;
}