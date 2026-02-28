import { useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { login, logout, useAuthUser, type AuthUser } from '../store/auth';

const BASE = 'http://localhost:3001';

async function apiLogin(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('არასწორი ელ-ფოსტა ან პაროლი');
  return res.json();
}

function Avatar({ user }: { user: AuthUser }) {
  const initials = [user.first_name[0], user.last_name[0]].filter(Boolean).join('').toUpperCase() || '?';
  return (
    <View style={styles.avatarWrapper}>
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

function ProfileView({ user }: { user: AuthUser }) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;
  return (
    <View style={styles.profileCard}>
      <Pressable onPress={() => router.push('/profile')} style={({ pressed }) => [{ alignItems: 'center', gap: 6 }, pressed && { opacity: 0.7 }]}>
        <Avatar user={user} />
        <Text style={styles.profileName}>{fullName}</Text>
      </Pressable>
      <Text style={styles.profileEmail}>{user.email}</Text>
      <Text style={styles.profileRole}>{user.role}</Text>
      <Pressable style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]} onPress={logout}>
        <Text style={styles.logoutText}>გამოსვლა</Text>
      </Pressable>
    </View>
  );
}

function LoginForm() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      const user = await apiLogin(email.trim(), password);
      login(user);
    } catch (e: any) {
      setError(e.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.loginCard}>
      <Text style={styles.loginTitle}>შესვლა</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="ელ-ფოსტა"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="პაროლი"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable
        style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.8 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.loginBtnText}>შესვლა</Text>}
      </Pressable>
    </View>
  );
}

export default function GrownupsScreen() {
  const user = useAuthUser();
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.center}>
        {user ? <ProfileView user={user} /> : <LoginForm />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  // Profile
  profileCard:    { alignItems: 'center', gap: 8 },
  avatarWrapper:  { marginBottom: 4 },
  avatarImg: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: '#E5E7EB',
  },
  avatarFallback: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#6366F1',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#E5E7EB',
  },
  avatarInitials: { fontSize: 36, fontWeight: '700', color: '#fff' },
  profileName:    { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 4 },
  profileEmail:   { fontSize: 14, color: '#6B7280' },
  profileRole: {
    fontSize: 12, fontWeight: '600', color: '#6366F1',
    textTransform: 'uppercase', letterSpacing: 1, marginTop: 2,
  },
  logoutBtn: {
    marginTop: 20, paddingHorizontal: 28, paddingVertical: 10,
    borderRadius: 20, backgroundColor: '#E5E7EB',
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#374151' },

  // Login
  loginCard:    { width: '100%', maxWidth: 340, gap: 12 },
  loginTitle:   { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4, textAlign: 'center' },
  errorText:    { color: '#EF4444', fontSize: 13, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, backgroundColor: '#fff', color: '#111827',
  },
  loginBtn: {
    backgroundColor: '#6366F1', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', marginTop: 4,
  },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
