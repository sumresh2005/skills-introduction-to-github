import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Dob, Friend, NewFriendInput, Tier } from '@/lib/types';

export type FriendFormValues = NewFriendInput;

function toFormState(friend: Friend | undefined) {
  return {
    name: friend?.name ?? '',
    location: friend?.location ?? '',
    email: friend?.email ?? '',
    phone: friend?.phone ?? '',
    dobMonth: friend?.dob?.month ? String(friend.dob.month) : '',
    dobDay: friend?.dob?.day ? String(friend.dob.day) : '',
    dobYear: friend?.dob?.year ? String(friend.dob.year) : '',
    tier: (friend?.tier ?? 'secondary') as Tier,
    tags: friend?.tags?.join(', ') ?? '',
    notes: friend?.notes ?? '',
  };
}

export function FriendForm({
  initial,
  onSubmit,
  submitLabel = 'Save',
}: {
  initial?: Friend;
  onSubmit: (values: FriendFormValues) => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState(() => toFormState(initial));

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const month = Number(form.dobMonth) || 0;
    const day = Number(form.dobDay) || 0;
    const year = Number(form.dobYear) || null;
    const dob: Dob | null = month && day ? { month, day, year } : null;

    onSubmit({
      name: form.name.trim(),
      location: form.location.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      dob,
      tier: form.tier,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      notes: form.notes,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={form.name} onChangeText={(v) => set('name', v)} placeholder="Full name" />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={form.location} onChangeText={(v) => set('location', v)} placeholder="City, State" />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={form.email}
        onChangeText={(v) => set('email', v)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />

      <Text style={styles.label}>Birthday</Text>
      <View style={styles.dobRow}>
        <TextInput
          style={[styles.input, styles.dobInput]}
          value={form.dobMonth}
          onChangeText={(v) => set('dobMonth', v)}
          placeholder="MM"
          keyboardType="number-pad"
          maxLength={2}
        />
        <TextInput
          style={[styles.input, styles.dobInput]}
          value={form.dobDay}
          onChangeText={(v) => set('dobDay', v)}
          placeholder="DD"
          keyboardType="number-pad"
          maxLength={2}
        />
        <TextInput
          style={[styles.input, styles.dobInput, { flex: 1.4 }]}
          value={form.dobYear}
          onChangeText={(v) => set('dobYear', v)}
          placeholder="YYYY (optional)"
          keyboardType="number-pad"
          maxLength={4}
        />
      </View>

      <Text style={styles.label}>Tier</Text>
      <View style={styles.tierRow}>
        {(['primary', 'secondary'] as Tier[]).map((tier) => (
          <TouchableOpacity
            key={tier}
            style={[styles.tierOption, form.tier === tier && styles.tierOptionActive]}
            onPress={() => set('tier', tier)}
          >
            <Text style={[styles.tierOptionText, form.tier === tier && styles.tierOptionTextActive]}>{tier}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Tags (comma separated)</Text>
      <TextInput style={styles.input} value={form.tags} onChangeText={(v) => set('tags', v)} placeholder="college, roommate" />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={form.notes}
        onChangeText={(v) => set('notes', v)}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>{submitLabel}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d8d8de',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
  },
  dobRow: { flexDirection: 'row', gap: 8 },
  dobInput: { flex: 1, textAlign: 'center' },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  tierRow: { flexDirection: 'row', gap: 8 },
  tierOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d8de',
  },
  tierOptionActive: { borderColor: '#4f5bff', backgroundColor: '#eef' },
  tierOptionText: { textTransform: 'capitalize', color: '#444' },
  tierOptionTextActive: { color: '#4f5bff', fontWeight: '600' },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#4f5bff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
