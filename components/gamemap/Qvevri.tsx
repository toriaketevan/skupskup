import QvevriSvg from '../../assets/map/qvevri.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function Qvevri({ width = 206.56, height = 226.431 }: Props) {
  return <QvevriSvg width={width} height={height} />;
}