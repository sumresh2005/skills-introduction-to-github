import * as MailComposer from 'expo-mail-composer';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { FriendForm } from '@/components/FriendForm';
import { useFriends } from '@/context/FriendsContext';
import { newId } from '@/lib/id';
import { getMessages, saveMessages } from '@/lib/storage';

export default function FriendDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { friends, updateFriend, deleteFriend } = useFriends();
  const friend = friends.find((f) => f.id === id);
  const [messageBody, setMessageBody] = useState('');

  if (!friend) {
    return (
      <View style={styles.center}>
        <Text>This friend no longer exists.</Text>
      </View>
    );
  }

  const logMessage = async (channel: 'share' | 'email' | 'sms', body: string) => {
    const messages = await getMessages();
    messages.push({ id: newId(), friendId: friend.id, channel, body, sentAt: new Date().toISOString() });
    await saveMessages(messages);
  };

  const handleShare = async () => {
    if (!messageBody.trim()) return Alert.alert('Write a message first');
    try {
      await Share.share({ message: messageBody });
      await logMessage('share', messageBody);
    } catch (err) {
      Alert.alert('Could not open share sheet', String(err));
    }
  };

  const handleEmail = async () => {
    if (!friend.email) return Alert.alert('No email on file for this friend');
    if (!messageBody.trim()) return Alert.alert('Write a message first');
    const available = await MailComposer.isAvailableAsync();
    if (!available) return Alert.alert('No mail app configured on this device');
    await MailComposer.composeAsync({ recipients: [friend.email], body: messageBody });
    await logMessage('email', messageBody);
  };

  const handleText = async () => {
    if (!friend.phone) return Alert.alert('No phone number on file for this friend');
    if (!messageBody.trim()) return Alert.alert('Write a message first');
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${friend.phone}${separator}body=${encodeURIComponent(messageBody)}`;
    await Linking.openURL(url);
    await logMessage('sms', messageBody);
  };

  const handleDelete = () => {
    Alert.alert('Remove this friend?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteFriend(friend.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FriendForm
        initial={friend}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await updateFriend(friend.id, values);
          router.back();
        }}
      />

      <View style={styles.messagePanel}>
        <Text style={styles.sectionTitle}>Message {friend.name}</Text>
        <Text style={styles.hint}>Always sent from your own account — never posted as {friend.name}.</Text>
        <TextInput
          style={styles.messageInput}
          value={messageBody}
          onChangeText={setMessageBody}
          placeholder="Write a message…"
          multiline
        />
        <View style={styles.messageActions}>
          <Pressable style={styles.messageButton} onPress={handleShare}>
            <Text style={styles.messageButtonText}>Share…</Text>
          </Pressable>
          {friend.email && (
            <Pressable style={styles.messageButton} onPress={handleEmail}>
              <Text style={styles.messageButtonText}>Email</Text>
            </Pressable>
          )}
          {friend.phone && (
            <Pressable style={styles.messageButton} onPress={handleText}>
              <Text style={styles.messageButtonText}>Text</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete friend</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messagePanel: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  hint: { fontSize: 12, color: '#888', marginBottom: 8 },
  messageInput: {
    borderWidth: 1,
    borderColor: '#d8d8de',
    borderRadius: 8,
    padding: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  messageActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  messageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d8de',
    backgroundColor: '#fff',
  },
  messageButtonText: { fontSize: 13, fontWeight: '600', color: '#333' },
  deleteButton: { margin: 16, alignItems: 'center', padding: 12 },
  deleteButtonText: { color: '#c62828', fontWeight: '600' },
});
