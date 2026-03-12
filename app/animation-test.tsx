import Lottie from 'lottie-react';
import { StyleSheet, View } from 'react-native';

export default function AnimationTest() {
  return (
    <View style={styles.container}>
      <Lottie
        animationData={require('../assets/dancing_character.json')}
        autoplay
        loop
        style={{ width: 300, height: 300 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff0fb' },
});
