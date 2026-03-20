import LottieView from 'lottie-react-native';
import { StyleSheet, Text, View } from 'react-native';

type Props = { visible: boolean };

export default function ConfettiReward({ visible }: Props) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <LottieView
        source={require('../app/Confetti.json')}
        autoPlay
        loop={false}
        style={styles.lottie}
      />
      <Text style={styles.text}>შესანიშნავია!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 27, 75, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    zIndex: 20,
  },
  lottie: { width: '100%', height: '100%', position: 'absolute' },
  text: { fontSize: 28, fontWeight: '800', color: '#FDE68A', textAlign: 'center' },
});
