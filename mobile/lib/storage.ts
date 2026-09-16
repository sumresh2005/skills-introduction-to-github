import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Friend, MessageLogEntry } from './types';

const FRIENDS_KEY = 'friend-crm/friends';
const MESSAGES_KEY = 'friend-crm/messages';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function getFriends(): Promise<Friend[]> {
  return readJson<Friend[]>(FRIENDS_KEY, []);
}

export function saveFriends(friends: Friend[]): Promise<void> {
  return writeJson(FRIENDS_KEY, friends);
}

export function getMessages(): Promise<MessageLogEntry[]> {
  return readJson<MessageLogEntry[]>(MESSAGES_KEY, []);
}

export function saveMessages(messages: MessageLogEntry[]): Promise<void> {
  return writeJson(MESSAGES_KEY, messages);
}
