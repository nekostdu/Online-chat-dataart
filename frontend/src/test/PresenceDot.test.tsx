import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PresenceDot } from '@/features/presence/PresenceDot';

describe('PresenceDot', () => {
  it('uses the online colour for "online"', () => {
    const { container } = render(<PresenceDot presence="online" />);
    const dot = container.querySelector('span');
    expect(dot).not.toBeNull();
    expect(dot!.className).toContain('bg-emerald-500');
  });

  it('uses the AFK colour for "afk"', () => {
    const { container } = render(<PresenceDot presence="afk" />);
    expect(container.querySelector('span')!.className).toContain('bg-amber-400');
  });

  it('falls back to the offline colour when presence is missing', () => {
    const { container } = render(<PresenceDot presence={undefined} />);
    expect(container.querySelector('span')!.className).toContain('bg-gray-300');
  });
});
