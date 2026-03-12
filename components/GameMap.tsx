import { StyleSheet, View } from 'react-native';

export const MAP_H = 2000;

export default function GameMap() {
  return <View style={styles.map} />;
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: MAP_H,
    backgroundColor: '#5ae182',
  },
});
