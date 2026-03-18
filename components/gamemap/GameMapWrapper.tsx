import { StyleSheet, View } from 'react-native';

type Props = {
  height: number;
};

export default function GameMapWrapper({ height }: Props) {
  return <View style={[styles.map, { height }]} />;
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    backgroundColor: '#5ae182',
  },
});
