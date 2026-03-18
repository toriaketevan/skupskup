import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthUser } from '../store/auth';
import { colors } from '../app/colors';

const ITEMS = [
  { path: '/',       label: 'გაკვეთილები', emoji: '📝', color: colors.secondary.playfulPurple },
  { path: '/books',  label: 'წიგნები',     emoji: '📖', color: colors.primary.water },
  { path: '/games',  label: 'თამაშები',    emoji: '🎮', color: colors.accent.actionOrange },
  { path: '/videos', label: 'ვიდეოები',    emoji: '📺', color: colors.secondary.roofPink },
] as const;

const ADMIN_ITEM = { path: '/admin', label: 'ადმინი', emoji: '⚙️', color: '#374151' } as const;

export default function Sidebar() {
  const pathname = usePathname();
  const insets   = useSafeAreaInsets();
  const user     = useAuthUser();
  const isAdmin  = user?.role === 'admin';

  return (
    <View
      style={[
        styles.sidebar,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
      ]}
    >
      {ITEMS.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Pressable
            key={item.path}
            onPress={() => router.push(item.path)}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
          >
            <View
              style={[
                styles.iconCircle,
                isActive ? { backgroundColor: item.color } : { backgroundColor: colors.secondary.cardBackground },
              ]}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={[styles.label, isActive && { color: item.color, fontWeight: '700' }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}

      {/* Spacer pushes Admin to the bottom */}
      <View style={{ flex: 1 }} />

      {isAdmin && (() => {
        const isActive = pathname === ADMIN_ITEM.path;
        return (
          <>
            <View style={styles.divider} />
            <Pressable
              onPress={() => router.push(ADMIN_ITEM.path)}
              style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
            >
              <View
                style={[
                  styles.iconCircle,
                  isActive ? { backgroundColor: ADMIN_ITEM.color } : { backgroundColor: colors.secondary.cardBackground },
                ]}
              >
                <Text style={styles.emoji}>{ADMIN_ITEM.emoji}</Text>
              </View>
              <Text style={[styles.label, isActive && { color: ADMIN_ITEM.color, fontWeight: '700' }]}>
                {ADMIN_ITEM.label}
              </Text>
            </Pressable>
          </>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 80,
    backgroundColor: colors.primary.grassLight,
    borderLeftWidth: 1,
    borderLeftColor: '#EAECEF',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  item: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 5,
    width: '100%',
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 26,
  },
  label: {
    fontSize: 11,
    color: '#9BA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    width: 48,
    height: 1,
    backgroundColor: '#EAECEF',
    marginBottom: 4,
  },
});
