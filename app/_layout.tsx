import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sidebar from '../components/Sidebar';

export default function RootLayout() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.root}>
        <StatusBar style="dark" />
        <View style={styles.grownupsContainer}>
          <Pressable style={({ pressed }) => [styles.grownupsBtn, pressed && styles.grownupsBtnPressed]}
            onPress={() => router.push('/grownups')}>
            <Text style={styles.grownupsText}>👨‍👩‍👧 მშობლებისთვის</Text>
          </Pressable>
        </View>
        <Stack style={styles.content}>
          <Stack.Screen name="index"       options={{ headerShown: false }} />
          <Stack.Screen name="books"       options={{ headerShown: false }} />
          <Stack.Screen name="games"       options={{ headerShown: false }} />
          <Stack.Screen name="videos"      options={{ headerShown: false }} />
          <Stack.Screen name="lesson/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="admin"       options={{ headerShown: false }} />
          <Stack.Screen name="grownups"    options={{ headerShown: false }} />
          <Stack.Screen name="profile"      options={{ headerShown: false }} />
          <Stack.Screen name="lesson-edit"  options={{ headerShown: false }} />
          <Stack.Screen name="card-add"     options={{ headerShown: false }} />
          <Stack.Screen name="card-edit"    options={{ headerShown: false }} />
        </Stack>
        <Sidebar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  grownupsContainer: {
    position: 'absolute',
    top: 10,
    left: 12,
    zIndex: 100,
  },
  grownupsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  grownupsBtnPressed: {
    opacity: 0.7,
  },
  grownupsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  content: {
    flex: 1,
    paddingTop: 44,
  },
});
