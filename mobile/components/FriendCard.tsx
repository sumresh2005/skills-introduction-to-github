import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dobLabel } from '@/lib/format';
import type { Friend } from '@/lib/types';

export function FriendCard({ friend }: { friend: Friend }) {
  return (
    <Link href={`/friend/${friend.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{friend.name}</Text>
          <View style={[styles.badge, friend.tier === 'primary' && styles.badgePrimary]}>
            <Text style={styles.badgeText}>{friend.tier}</Text>
          </View>
        </View>
        {friend.needsReview && (
          <View style={styles.reviewBadge}>
            <Text style={styles.reviewBadgeText}>needs review</Text>
          </View>
        )}
        <Text style={styles.meta}>{dobLabel(friend.dob)}</Text>
        <Text style={styles.meta}>{friend.location || 'No location on file'}</Text>
        {friend.tags.length > 0 && <Text style={styles.meta}>{friend.tags.join(', ')}</Text>}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e2e2ea',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
    gap: 4,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: '#eef' },
  badgePrimary: { backgroundColor: '#ffe9d6' },
  badgeText: { fontSize: 11, color: '#334', textTransform: 'capitalize' },
  reviewBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffe0e0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  reviewBadgeText: { fontSize: 10, color: '#8a1f1f' },
  meta: { fontSize: 13, color: '#666' },
});
