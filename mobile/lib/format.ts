import type { Dob } from './types';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function dobLabel(dob: Dob | null | undefined): string {
  if (!dob || !dob.month || !dob.day) return 'No birthday on file';
  const monthDay = `${MONTHS[dob.month - 1]} ${dob.day}`;
  return dob.year ? `${monthDay}, ${dob.year}` : monthDay;
}
