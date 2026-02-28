import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserProgress } from '../api/progress';
import { loadProgress, clearProgress } from './progress';

export type AuthUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url: string | null;
};

const STORAGE_KEY = 'auth_user';

let currentUser: AuthUser | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function fetchAndLoadProgress(user: AuthUser) {
  fetchUserProgress(user.id).then(loadProgress).catch(() => {});
}

// Load persisted user on startup
AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
  if (raw) {
    try {
      currentUser = JSON.parse(raw);
      notify();
      fetchAndLoadProgress(currentUser!);
    } catch {}
  }
});

export function login(user: AuthUser) {
  currentUser = user;
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  fetchAndLoadProgress(user);
  notify();
}

export function logout() {
  currentUser = null;
  AsyncStorage.removeItem(STORAGE_KEY);
  clearProgress();
  notify();
}

export function useAuthUser(): AuthUser | null {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => currentUser,
  );
}
