import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { newId } from '@/lib/id';
import { mergeImportedEntries, type MergeSummary } from '@/lib/merge';
import { syncBirthdayNotifications } from '@/lib/notifications';
import { getFriends, saveFriends } from '@/lib/storage';
import type { Friend, ImportedEntry, NewFriendInput } from '@/lib/types';

type FriendsContextValue = {
  friends: Friend[];
  loading: boolean;
  addFriend: (input: NewFriendInput) => Promise<Friend>;
  updateFriend: (id: string, patch: Partial<Friend>) => Promise<void>;
  deleteFriend: (id: string) => Promise<void>;
  importEntries: (entries: ImportedEntry[]) => Promise<MergeSummary>;
};

const FriendsContext = createContext<FriendsContextValue | null>(null);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFriends().then((loaded) => {
      setFriends(loaded);
      setLoading(false);
    });
  }, []);

  const persist = useCallback(async (next: Friend[]) => {
    setFriends(next);
    await saveFriends(next);
    // Fire and forget: notification scheduling shouldn't block the UI.
    syncBirthdayNotifications(next).catch(() => {});
  }, []);

  const addFriend = useCallback(
    async (input: NewFriendInput) => {
      const now = new Date().toISOString();
      const friend: Friend = {
        id: newId(),
        name: input.name.trim(),
        dob: input.dob || null,
        location: input.location || null,
        email: input.email || null,
        phone: input.phone || null,
        photoUrl: null,
        tier: input.tier === 'primary' ? 'primary' : 'secondary',
        tags: input.tags || [],
        notes: input.notes || '',
        sources: ['manual'],
        needsReview: false,
        createdAt: now,
        updatedAt: now,
      };
      await persist([...friends, friend]);
      return friend;
    },
    [friends, persist]
  );

  const updateFriend = useCallback(
    async (id: string, patch: Partial<Friend>) => {
      const next = friends.map((f) =>
        f.id === id ? { ...f, ...patch, needsReview: false, updatedAt: new Date().toISOString() } : f
      );
      await persist(next);
    },
    [friends, persist]
  );

  const deleteFriend = useCallback(
    async (id: string) => {
      await persist(friends.filter((f) => f.id !== id));
    },
    [friends, persist]
  );

  const importEntries = useCallback(
    async (entries: ImportedEntry[]) => {
      const next = [...friends];
      const summary = mergeImportedEntries(next, entries);
      await persist(next);
      return summary;
    },
    [friends, persist]
  );

  const value = useMemo(
    () => ({ friends, loading, addFriend, updateFriend, deleteFriend, importEntries }),
    [friends, loading, addFriend, updateFriend, deleteFriend, importEntries]
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends(): FriendsContextValue {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends must be used within a FriendsProvider');
  return ctx;
}
