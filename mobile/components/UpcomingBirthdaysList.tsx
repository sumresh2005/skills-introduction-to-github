import { StyleSheet, Text, View } from 'react-native';
import type { UpcomingBirthday } from '@/lib/birthdays';

export function UpcomingBirthdaysList({ entries }: { entries: UpcomingBirthday[] }) {
  if (entries.length === 0) {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>Upcoming birthdays</Text>
        <Text style={styles.empty}>No birthdays in the next 30 days.</Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Upcoming birthdays</Text>
      {entries.map(({ friend, daysUntil, turningAge }) => {
        const label = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
        return (
          <View key={friend.id} style={styles.row}>
            <Text style={styles.rowText}>
              {friend.name}
              {turningAge ? ` (turning ${turningAge})` : ''}
            </Text>
            <Text style={styles.days}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: '#e2e2ea',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  empty: { color: '#666' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f5',
  },
  rowText: { fontSize: 14 },
  days: { fontSize: 13, color: '#666' },
});
