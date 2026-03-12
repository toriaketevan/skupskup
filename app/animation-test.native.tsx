import LottieView from 'lottie-react-native';
import { StyleSheet, View } from 'react-native';

export default function AnimationTest() {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/dancing_character.json')}
        autoPlay
        loop
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff0fb' },
  animation: { width: 300, height: 300 },
});
