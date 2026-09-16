import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FriendCard } from '@/components/FriendCard';
import { UpcomingBirthdaysList } from '@/components/UpcomingBirthdaysList';
import { useFriends } from '@/context/FriendsContext';
import { upcomingBirthdays } from '@/lib/birthdays';
import type { Tier } from '@/lib/types';

const TABS: { label: string; value: Tier | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
];

export default function HomeScreen() {
  const { friends, loading } = useFriends();
  const [tier, setTier] = useState<Tier | ''>('');

  const upcoming = useMemo(() => upcomingBirthdays(friends, { withinDays: 30 }), [friends]);
  const visible = tier ? friends.filter((f) => f.tier === tier) : friends;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={visible}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.topActions}>
              <Link href="/import" asChild>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Import</Text>
                </Pressable>
              </Link>
            </View>
            <UpcomingBirthdaysList entries={upcoming} />
            <View style={styles.tabsRow}>
              {TABS.map((t) => (
                <Pressable
                  key={t.label}
                  style={[styles.tab, tier === t.value && styles.tabActive]}
                  onPress={() => setTier(t.value)}
                >
                  <Text style={[styles.tabText, tier === t.value && styles.tabTextActive]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => <FriendCard friend={item} />}
        ListEmptyComponent={<Text style={styles.empty}>No friends yet. Add one or import your contacts.</Text>}
      />
      <Link href="/friend/new" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f4f8' },
  loading: { padding: 24, textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 96 },
  topActions: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d8de',
    backgroundColor: '#fff',
  },
  secondaryButtonText: { fontSize: 13, fontWeight: '600', color: '#333' },
  tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d8de',
    backgroundColor: '#fff',
  },
  tabActive: { borderColor: '#4f5bff', backgroundColor: '#eef' },
  tabText: { color: '#444', fontSize: 13 },
  tabTextActive: { color: '#4f5bff', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#666', marginTop: 40 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f5bff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
