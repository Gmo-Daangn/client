import { formatRelativeTime } from '@/src/utils/format-time';

export function formatPostCreatedAt(iso: string): string {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return iso;
  return formatRelativeTime(timestamp);
}
