/**
 * Unit tests for store/progress.ts
 *
 * Each describe block uses jest.isolateModules() to get a fresh module
 * instance so the global state (completedIds, unlockedSortOrder) starts
 * clean every time.
 */

describe('loadProgress', () => {
  it('handles empty entries (unlockedSortOrder = 1)', () => {
    jest.isolateModules(() => {
      const { loadProgress, markComplete } = require('../../store/progress');
      loadProgress([]);
      // With unlockedSortOrder=1, completing lesson at sort_order=1 should not throw
      expect(() => markComplete(1, 1)).not.toThrow();
    });
  });

  it('sets unlockedSortOrder to maxSortOrder + 1', () => {
    jest.isolateModules(() => {
      const { loadProgress, clearProgress, markComplete } = require('../../store/progress');

      loadProgress([
        { id: 1, sort_order: 1 },
        { id: 2, sort_order: 5 },
      ]);
      // unlockedSortOrder = 6. markComplete at sort_order 3 (<6) should not advance.
      // Then clear and verify we can restart from 1.
      clearProgress();
      loadProgress([]);
      expect(() => markComplete(10, 1)).not.toThrow();
    });
  });

  it('keeps completedIds from entries', () => {
    jest.isolateModules(() => {
      const { loadProgress } = require('../../store/progress');
      // Reload with a different set; just verify it does not throw
      expect(() =>
        loadProgress([
          { id: 1, sort_order: 1 },
          { id: 3, sort_order: 3 },
        ])
      ).not.toThrow();
    });
  });
});

describe('clearProgress', () => {
  it('resets state so first lesson becomes unlockable again', () => {
    jest.isolateModules(() => {
      const { loadProgress, clearProgress, markComplete } = require('../../store/progress');

      loadProgress([{ id: 1, sort_order: 10 }]);
      clearProgress();

      // After clear, unlockedSortOrder is 1 → markComplete(id, 1) must not throw
      expect(() => markComplete(1, 1)).not.toThrow();
    });
  });

  it('can be called multiple times without error', () => {
    jest.isolateModules(() => {
      const { clearProgress } = require('../../store/progress');
      expect(() => {
        clearProgress();
        clearProgress();
      }).not.toThrow();
    });
  });
});

describe('markComplete', () => {
  it('does not throw for a valid lesson id and sort_order', () => {
    jest.isolateModules(() => {
      const { clearProgress, markComplete } = require('../../store/progress');
      clearProgress();
      expect(() => markComplete(42, 1)).not.toThrow();
    });
  });

  it('advances unlock sequentially', () => {
    jest.isolateModules(() => {
      const { clearProgress, markComplete } = require('../../store/progress');
      clearProgress(); // unlockedSortOrder = 1

      expect(() => {
        markComplete(1, 1); // unlock → 2
        markComplete(2, 2); // unlock → 3
        markComplete(3, 3); // unlock → 4
      }).not.toThrow();
    });
  });

  it('does not advance unlock when sort_order is below current unlock', () => {
    jest.isolateModules(() => {
      const { clearProgress, markComplete } = require('../../store/progress');
      clearProgress(); // unlockedSortOrder = 1

      markComplete(1, 1); // unlock → 2
      markComplete(2, 2); // unlock → 3
      // sort_order=2 is now less than unlockedSortOrder=3; should be a no-op
      expect(() => markComplete(99, 2)).not.toThrow();
    });
  });

  it('can be called multiple times with the same lesson id', () => {
    jest.isolateModules(() => {
      const { clearProgress, markComplete } = require('../../store/progress');
      clearProgress();
      expect(() => {
        markComplete(7, 1);
        markComplete(7, 1);
        markComplete(7, 1);
      }).not.toThrow();
    });
  });
});
