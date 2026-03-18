import CherrieTreeSvg from '../../assets/map/cherrie_tree.svg';

type Props = {
  width?: number;
  height?: number;
};

export default function CherrieTree({ width = 242.865, height = 301.718 }: Props) {
  return <CherrieTreeSvg width={width} height={height} />;
}