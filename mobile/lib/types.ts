export type Dob = {
  year: number | null;
  month: number; // 1-12
  day: number;
};

export type Tier = 'primary' | 'secondary';

export type Friend = {
  id: string;
  name: string;
  dob: Dob | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  tier: Tier;
  tags: string[];
  notes: string;
  sources: string[];
  needsReview: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NewFriendInput = {
  name: string;
  dob?: Dob | null;
  location?: string | null;
  email?: string | null;
  phone?: string | null;
  tier?: Tier;
  tags?: string[];
  notes?: string;
};

export type ImportedEntry = {
  name: string;
  dob?: Dob | null;
  location?: string | null;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  source: string;
};

export type MessageLogEntry = {
  id: string;
  friendId: string;
  channel: 'share' | 'email' | 'sms';
  body: string;
  sentAt: string;
};
