import type { Presence } from '@/api/types';

export function PresenceDot({ presence, size = 10 }: { presence: Presence | undefined; size?: number }) {
  const color = {
    online:  'bg-emerald-500',
    afk:     'bg-amber-400',
    offline: 'bg-gray-300',
  }[presence ?? 'offline'];
  return (
    <span
      className={`inline-block rounded-full ${color}`}
      style={{ width: size, height: size }}
      title={presence}
    />
  );
}
