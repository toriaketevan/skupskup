import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const MENU: { key: 'lessons' | 'cards'; label: string; emoji: string }[] = [
  { key: 'lessons', label: 'გაკვეთილები', emoji: '📚' },
  { key: 'cards',   label: 'ბარათები',    emoji: '🃏' },
];

type Props = {
  children: ReactNode;
  title: string;
  activeMenu: 'lessons' | 'cards';
  onBack?: () => void;
};

export default function AdminShell({ children, title, activeMenu, onBack }: Props) {
  const handleBack = onBack ?? (() => router.canGoBack() ? router.back() : router.replace('/admin'));

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'bottom']}>
      <View style={s.header}>
        <Pressable onPress={handleBack} style={s.backBtn}>
          <Text style={s.backText}>← უკან</Text>
        </Pressable>
        <Text style={s.title}>{title}</Text>
        <View style={s.backBtn} />
      </View>
      <View style={s.body}>
        <View style={s.sidebar}>
          {MENU.map(item => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [s.menuItem, activeMenu === item.key && s.menuItemActive, pressed && { opacity: 0.8 }]}
              onPress={() => router.replace(`/admin?section=${item.key}`)}
            >
              <Text style={s.menuEmoji}>{item.emoji}</Text>
              <Text style={[s.menuLabel, activeMenu === item.key && s.menuLabelActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={s.content}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EAECEF', backgroundColor: '#fff',
  },
  backBtn:  { width: 70 },
  backText: { fontSize: 15, fontWeight: '600', color: '#6366F1' },
  title:    { fontSize: 20, fontWeight: 'bold', color: '#374151', flex: 1, textAlign: 'center' },
  body:     { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 148,
    backgroundColor: '#1E293B',
    paddingTop: 8,
    borderRightWidth: 1,
    borderRightColor: '#0F172A',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 16,
    borderLeftWidth: 3, borderLeftColor: 'transparent',
  },
  menuItemActive: { backgroundColor: '#334155', borderLeftColor: '#6366F1' },
  menuEmoji:      { fontSize: 16 },
  menuLabel:      { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  menuLabelActive:{ color: '#F1F5F9' },
  content:        { flex: 1 },
});
