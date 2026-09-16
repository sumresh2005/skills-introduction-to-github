import { router } from 'expo-router';
import { FriendForm } from '@/components/FriendForm';
import { useFriends } from '@/context/FriendsContext';

export default function NewFriendScreen() {
  const { addFriend } = useFriends();

  return (
    <FriendForm
      submitLabel="Add friend"
      onSubmit={async (values) => {
        await addFriend(values);
        router.back();
      }}
    />
  );
}
