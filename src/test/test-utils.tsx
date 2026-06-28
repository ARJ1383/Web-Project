import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/** Render a component wrapped in a router so navigation hooks work in tests. */
export function renderWithRouter(
  ui: ReactElement,
  { route = '/', ...options }: { route?: string } & RenderOptions = {},
) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>, options);
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
