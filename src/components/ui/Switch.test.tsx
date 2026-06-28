import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/test/test-utils';
import { Switch } from './Switch';

describe('Switch', () => {
  it('reflects checked state via aria-checked', () => {
    render(<Switch checked onChange={() => {}} label="test" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with the toggled value', async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="test" />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
