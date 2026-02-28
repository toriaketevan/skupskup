import { useEffect, useState } from 'react';
import type { ProgressEntry } from '../api/progress';

// completedIds: set of lesson DB IDs the user has completed
// unlockedSortOrder: lessons with sort_order <= this value are unlocked
let completedIds     = new Set<number>();
let unlockedSortOrder = 1;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function loadProgress(entries: ProgressEntry[]) {
  completedIds = new Set(entries.map((e) => e.id));
  const maxSort = entries.reduce((m, e) => Math.max(m, e.sort_order), 0);
  unlockedSortOrder = maxSort + 1 || 1;
  notify();
}

export function clearProgress() {
  completedIds     = new Set();
  unlockedSortOrder = 1;
  notify();
}

export function markComplete(lessonId: number, sortOrder: number) {
  completedIds.add(lessonId);
  if (sortOrder >= unlockedSortOrder) {
    unlockedSortOrder = sortOrder + 1;
  }
  notify();
}

export function useProgress(): { completedIds: Set<number>; unlockedSortOrder: number } {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((n) => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return { completedIds, unlockedSortOrder };
}
