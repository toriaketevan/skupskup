import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { login, logout, useAuthUser } from '../store/auth';

const BASE = 'http://localhost:3001';

export default function ProfileScreen() {
  const user = useAuthUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [saved, setSaved]         = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
    }
  }, [user?.id]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <Text style={styles.empty}>არ ხართ შესული.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = [user.first_name[0], user.last_name[0]].filter(Boolean).join('').toUpperCase() || '?';

  async function handleSave() {
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/users/${user!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName.trim(), last_name: lastName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const updated = await res.json();
      login({ ...user!, first_name: updated.first_name, last_name: updated.last_name });
      setSaved(true);
    } catch (e: any) {
      setError(e.message ?? 'Error saving');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Back */}
      <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/grownups')}>
        <Text style={styles.backText}>← უკან</Text>
      </Pressable>

      <View style={styles.center}>
        <View style={styles.card}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>

          <Text style={styles.email}>{user.email}</Text>

          {/* Name fields */}
          <View style={styles.fields}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>სახელი</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="სახელი"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>გვარი</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="გვარი"
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {saved ? <Text style={styles.savedText}>შენახულია!</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>შენახვა</Text>}
          </Pressable>

          {/* Admin link */}
          {user.role === 'admin' && (
            <Pressable
              style={({ pressed }) => [styles.adminBtn, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/admin')}
            >
              <Text style={styles.adminBtnText}>⚙️ ადმინ პანელი</Text>
            </Pressable>
          )}

          {/* Logout */}
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { logout(); router.replace('/grownups'); }}
          >
            <Text style={styles.logoutText}>გამოსვლა</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  empty:     { color: '#6B7280', fontSize: 16 },

  backBtn:   { paddingHorizontal: 16, paddingVertical: 12 },
  backText:  { fontSize: 15, fontWeight: '600', color: '#6366F1' },

  card: {
    width: '100%', maxWidth: 360,
    alignItems: 'center', gap: 12,
    backgroundColor: '#fff',
    borderRadius: 20, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },

  avatarWrap:    { marginBottom: 4 },
  avatarImg:     { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#E5E7EB' },
  avatarFallback: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#E5E7EB',
  },
  avatarInitials: { fontSize: 32, fontWeight: '700', color: '#fff' },

  email: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },

  fields:     { width: '100%', gap: 10 },
  fieldGroup: { width: '100%', gap: 4 },
  label:      { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, backgroundColor: '#F9FAFB', color: '#111827',
  },

  errorText: { color: '#EF4444', fontSize: 13 },
  savedText: { color: '#10B981', fontSize: 13, fontWeight: '600' },

  saveBtn: {
    width: '100%', backgroundColor: '#6366F1',
    borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  adminBtn: {
    width: '100%', backgroundColor: '#1F2937',
    borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  adminBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  logoutBtn: {
    paddingHorizontal: 24, paddingVertical: 9,
    borderRadius: 20, backgroundColor: '#F3F4F6',
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#374151' },
});
