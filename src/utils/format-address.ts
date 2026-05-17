import type { SignUpAddress } from '@/src/types/auth';

/** 헤더 등에 표시할 동네 라벨 (예: 사당동) */
export function formatTownLabel(address?: SignUpAddress | null): string {
  if (!address?.town) return '동네';
  return address.town;
}
